-- GYM SPIRIT 운영자 회원 관리
-- admin.sql, cardio_ranking.sql 을 실행한 뒤 SQL Editor 에 전체를 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)
-- · 회원 상세: 가입일·최근 접속·운동한 날·누적 볼륨·친구·글 수 (기록 내용 자체는 보여주지 않는다)
-- · 이용 정지: 랭킹·길드 평균에서 빠지고, 글·응원·친구 요청·길드 가입/만들기를 못 한다
-- · 랭킹 제외: 정지 없이 랭킹에서만 뺀다
-- · 아바타·닉네임 초기화: 회원 앱이 다음에 열릴 때 기본값으로 바뀐다 (앱이 저장하면서 되돌리지 않게)
-- · 표시(app_member_flags)는 회원이 직접 바꿀 수 없다 (profiles 는 본인이 고칠 수 있어서 따로 둔다)
-- ※ 나중에 cardio_ranking.sql 을 다시 실행했다면 이 파일도 다시 실행해 주세요 (랭킹 함수를 덮어쓰기 때문)

create table if not exists public.app_member_flags (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  suspended boolean not null default false,
  rank_hidden boolean not null default false,
  reason text,
  avatar_reset_at timestamptz,
  nickname_reset_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.app_member_flags enable row level security;
revoke all on public.app_member_flags from anon, authenticated;

create or replace function public.gs_suspended(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select suspended from app_member_flags where user_id = p_id), false)
$$;

-- 랭킹에 안 보이는 회원 (정지 또는 랭킹 제외)
create or replace function public.gs_hidden(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select suspended or rank_hidden from app_member_flags where user_id = p_id), false)
$$;

-- ── 정지된 회원은 글·응원·친구 요청·길드 가입/만들기를 못 한다 ─────────────
-- DB 함수 안에서 넣는 경우에도 걸리도록 표에 직접 건다. 인자는 확인할 회원 칸 이름
create or replace function public.gs_block_suspended() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if gs_suspended((to_jsonb(new) ->> tg_argv[0])::uuid) then raise exception 'GS:SUSPENDED'; end if;
  return new;
end $$;

drop trigger if exists gs_suspended_guard on public.guild_posts;
create trigger gs_suspended_guard before insert on public.guild_posts for each row execute function public.gs_block_suspended('user_id');
drop trigger if exists gs_suspended_guard on public.guild_cheers;
create trigger gs_suspended_guard before insert on public.guild_cheers for each row execute function public.gs_block_suspended('from_id');
drop trigger if exists gs_suspended_guard on public.cheers;
create trigger gs_suspended_guard before insert on public.cheers for each row execute function public.gs_block_suspended('from_id');
drop trigger if exists gs_suspended_guard on public.friend_requests;
create trigger gs_suspended_guard before insert on public.friend_requests for each row execute function public.gs_block_suspended('from_id');
drop trigger if exists gs_suspended_guard on public.guild_requests;
create trigger gs_suspended_guard before insert on public.guild_requests for each row execute function public.gs_block_suspended('user_id');
drop trigger if exists gs_suspended_guard on public.guild_members;
create trigger gs_suspended_guard before insert on public.guild_members for each row execute function public.gs_block_suspended('user_id');
drop trigger if exists gs_suspended_guard on public.guilds;
create trigger gs_suspended_guard before insert on public.guilds for each row execute function public.gs_block_suspended('leader_id');

-- ── 랭킹: cardio_ranking.sql 과 같고, 숨긴 회원만 뺀다 ─────────────
-- 친구 랭킹: 내 자신은 늘 보인다
drop function if exists public.friend_ranking();
create function public.friend_ranking()
returns table (id uuid, nickname text, avatar jsonb, volume numeric, lift numeric, fav text, last_routine jsonb, guild_name text, guild_emblem text, cardio numeric)
language sql stable security definer set search_path = public as $$
  with me as (select gs_me() as uid),
  ids as (
    select uid as id from me
    union
    select case when f.from_id = me.uid then f.to_id else f.from_id end
    from friend_requests f, me where f.status = 'accepted' and me.uid in (f.from_id, f.to_id)
  )
  select p.id, p.nickname, p.avatar,
    case when p.week_start = gs_week_start() then round(p.weekly_volume) else 0 end, round(p.lift3), p.fav, p.last_routine,
    g.name, g.emblem,
    case when p.week_start = gs_week_start() then round(p.weekly_cardio) else 0 end
  from ids join profiles p on p.id = ids.id
  left join guild_members m on m.user_id = p.id left join guilds g on g.id = m.guild_id
  where p.id = (select uid from me) or not gs_hidden(p.id)
$$;
grant execute on function public.friend_ranking() to authenticated;

drop function if exists public.global_ranking();
create function public.global_ranking()
returns table (kind text, id uuid, name text, emblem text, color text, avatar jsonb, level int, members int, volume numeric, lift numeric, cardio numeric)
language sql stable security definer set search_path = public as $$
  with wk as (select gs_week_start() as ws)
  select 'guild', g.id, g.name, g.emblem, g.color, null::jsonb, gs_level(g.xp), count(*)::int,
    round(avg(case when p.week_start = wk.ws then p.weekly_volume else 0 end)), round(avg(p.lift3)),
    round(avg(case when p.week_start = wk.ws then p.weekly_cardio else 0 end))
  from guilds g join guild_members m on m.guild_id = g.id join profiles p on p.id = m.user_id, wk
  where g.ranked and not gs_gm_on(p.id, p.avatar) and not gs_hidden(p.id)
  group by g.id, wk.ws
  having count(*) >= 2
  union all
  select 'solo', p.id, p.nickname, null, null, p.avatar, null, 1,
    case when p.week_start = wk.ws then round(p.weekly_volume) else 0 end, round(p.lift3),
    case when p.week_start = wk.ws then round(p.weekly_cardio) else 0 end
  from profiles p, wk
  where p.solo_ranked and not gs_gm_on(p.id, p.avatar) and not gs_hidden(p.id)
    and not exists (select 1 from guild_members m where m.user_id = p.id)
$$;
grant execute on function public.global_ranking() to anon, authenticated;

-- ── 회원 본인: 내 상태 (정지 안내·초기화 반영용) ─────────────
create or replace function public.my_member_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('suspended', f.suspended, 'rank_hidden', f.rank_hidden,
      'reason', case when f.suspended then f.reason end,
      'avatar_reset_at', f.avatar_reset_at, 'nickname_reset_at', f.nickname_reset_at)
    from app_member_flags f where f.user_id = gs_me()), '{}'::jsonb)
$$;

-- ── 운영자 기능 ─────────────────────────────
-- 운동 기록의 숫자 칸 ("60", "60kg" 등) → 숫자
create or replace function public.gs_num(p text) returns numeric
language sql immutable set search_path = public as $$
  select coalesce(substring(coalesce(p, '') from '([0-9]+(?:\.[0-9]+)?)')::numeric, 0)
$$;

create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform gs_admin();
  return jsonb_build_object(
    'users', (select count(*) from profiles),
    'new_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'active_week', (select count(*) from profiles where week_start = gs_week_start() and weekly_volume > 0),
    'guilds', (select count(*) from guilds),
    'ranked_guilds', (select count(*) from guilds where ranked),
    'solo_ranked', (select count(*) from profiles where solo_ranked),
    'posts_24h', (select count(*) from guild_posts where created_at > now() - interval '1 day'),
    'friendships', (select count(*) from friend_requests where status = 'accepted'),
    'week_volume', (select coalesce(round(sum(weekly_volume)), 0) from profiles where week_start = gs_week_start()),
    'suspended', (select count(*) from app_member_flags where suspended),
    'rank_hidden', (select count(*) from app_member_flags where rank_hidden and not suspended),
    'notice', (select jsonb_build_object('id', id, 'body', body, 'at', created_at) from app_notices where active order by created_at desc limit 1)
  );
end $$;

-- 회원 찾기: 정지·랭킹 제외 표시를 더했다 (돌려주는 칸이 늘어서 지우고 다시 만든다)
-- p_q 가 '!정지' 면 정지·랭킹 제외 회원만
drop function if exists public.admin_users(text);
create function public.admin_users(p_q text)
returns table (id uuid, nickname text, joined_at timestamptz, volume numeric, lift numeric, guild_name text, is_admin boolean, suspended boolean, rank_hidden boolean, active_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare q text := coalesce(btrim(p_q), '');
begin
  perform gs_admin();
  return query
    select p.id, p.nickname, u.created_at,
      case when p.week_start = gs_week_start() then round(p.weekly_volume) else 0 end, round(p.lift3),
      g.name, exists (select 1 from app_admins a where a.user_id = p.id),
      coalesce(f.suspended, false), coalesce(f.rank_hidden, false), p.updated_at
    from profiles p
    left join auth.users u on u.id = p.id
    left join guild_members m on m.user_id = p.id left join guilds g on g.id = m.guild_id
    left join app_member_flags f on f.user_id = p.id
    where case when q = '!정지' then coalesce(f.suspended or f.rank_hidden, false)
               else q = '' or p.nickname ilike '%' || q || '%' end
    order by u.created_at desc nulls last limit 50;
end $$;

-- 회원 상세 + 다른 사람에게 보이는 공개 카드(public)
create or replace function public.admin_user_detail(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p profiles; w jsonb; res jsonb;
begin
  perform gs_admin();
  select * into p from profiles where id = p_user;
  if p.id is null then raise exception 'GS:NO_USER'; end if;
  select case when jsonb_typeof(d.data->'workouts') = 'object' then d.data->'workouts' else '{}'::jsonb end into w from user_data d where d.id = p_user;
  w := coalesce(w, '{}'::jsonb);
  select jsonb_build_object(
    'id', p.id, 'nickname', p.nickname,
    'joined_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at, 'active_at', p.updated_at,
    'is_admin', exists (select 1 from app_admins a where a.user_id = p.id),
    'solo_ranked', p.solo_ranked,
    'guild', (select jsonb_build_object('name', g.name, 'emblem', g.emblem, 'role', m.role, 'ranked', g.ranked)
              from guild_members m join guilds g on g.id = m.guild_id where m.user_id = p.id),
    'friends', (select count(*) from friend_requests f where f.status = 'accepted' and p.id in (f.from_id, f.to_id)),
    'posts', (select count(*) from guild_posts gp where gp.user_id = p.id),
    'cheers_got', (select count(*) from cheers c where c.to_id = p.id) + (select count(*) from guild_cheers c where c.to_id = p.id),
    -- 운동 기록은 숫자만: 운동한 날 수, 마지막 운동한 날, 완료한 세트 누적 볼륨
    'workout_days', (select count(*) from jsonb_each(w) e where jsonb_typeof(e.value) = 'array' and jsonb_array_length(e.value) > 0),
    'last_workout', (select max(e.key) from jsonb_each(w) e where jsonb_typeof(e.value) = 'array' and jsonb_array_length(e.value) > 0),
    'total_volume', (select coalesce(round(sum(gs_num(s->>'weight') * gs_num(s->>'reps'))), 0)
                     from jsonb_each(w) e
                     cross join lateral jsonb_array_elements(case when jsonb_typeof(e.value) = 'array' then e.value else '[]'::jsonb end) ex
                     cross join lateral jsonb_array_elements(case when jsonb_typeof(ex->'sets') = 'array' then ex->'sets' else '[]'::jsonb end) s
                     where s->>'completed' = 'true'),
    'flags', (select jsonb_build_object('suspended', f.suspended, 'rank_hidden', f.rank_hidden, 'reason', f.reason,
                'avatar_reset_at', f.avatar_reset_at, 'updated_at', f.updated_at, 'by', (select nickname from profiles b where b.id = f.updated_by))
              from app_member_flags f where f.user_id = p.id),
    -- 친구 랭킹 한 줄과 같은 모양 (회원 화면 미리보기용)
    'public', jsonb_build_object('id', p.id, 'nickname', p.nickname, 'avatar', p.avatar,
      'volume', case when p.week_start = gs_week_start() then round(p.weekly_volume) else 0 end, 'lift', round(p.lift3),
      'cardio', case when p.week_start = gs_week_start() then round(p.weekly_cardio) else 0 end,
      'fav', p.fav, 'last_routine', p.last_routine,
      'guild_name', (select g.name from guild_members m join guilds g on g.id = m.guild_id where m.user_id = p.id),
      'guild_emblem', (select g.emblem from guild_members m join guilds g on g.id = m.guild_id where m.user_id = p.id))
  ) into res
  from (select 1) one left join auth.users u on u.id = p.id;
  return res;
end $$;

-- 정지·랭킹 제외 (운영자에게는 못 한다)
create or replace function public.admin_set_member_flag(p_user uuid, p_suspended boolean, p_rank_hidden boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_admin();
begin
  if exists (select 1 from app_admins a where a.user_id = p_user) then raise exception 'GS:ADMIN_TARGET'; end if;
  insert into app_member_flags (user_id, suspended, rank_hidden, reason, updated_by, updated_at)
  values (p_user, coalesce(p_suspended, false), coalesce(p_rank_hidden, false), left(nullif(btrim(coalesce(p_reason, '')), ''), 100), uid, now())
  on conflict (user_id) do update set suspended = excluded.suspended, rank_hidden = excluded.rank_hidden,
    reason = excluded.reason, updated_by = excluded.updated_by, updated_at = now();
  -- 정지되면 보낸 친구 요청·길드 가입 신청은 거둔다
  if coalesce(p_suspended, false) then
    delete from friend_requests where from_id = p_user and status = 'pending';
    delete from guild_requests where user_id = p_user;
  end if;
end $$;

-- 아바타 초기화: 공개 카드는 바로 비우고, 회원 앱은 다음에 열릴 때 기본 아바타로 바꾼다
create or replace function public.admin_reset_avatar(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_admin();
begin
  if p_user <> uid and exists (select 1 from app_admins a where a.user_id = p_user) then raise exception 'GS:ADMIN_TARGET'; end if;
  update profiles set avatar = '{}'::jsonb where id = p_user;
  insert into app_member_flags (user_id, avatar_reset_at, updated_by) values (p_user, now(), uid)
  on conflict (user_id) do update set avatar_reset_at = now(), updated_by = excluded.updated_by, updated_at = now();
end $$;

-- 닉네임 초기화: 회원 앱이 예전 닉네임으로 다시 저장하지 않게 표시도 남긴다
create or replace function public.admin_reset_nickname(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_admin();
begin
  update profiles set nickname = '짐스피릿 유저' where id = p_user;
  insert into app_member_flags (user_id, nickname_reset_at, updated_by) values (p_user, now(), uid)
  on conflict (user_id) do update set nickname_reset_at = now(), updated_by = excluded.updated_by, updated_at = now();
end $$;

revoke execute on function public.gs_suspended(uuid), public.gs_hidden(uuid), public.gs_block_suspended() from public, anon, authenticated;
grant execute on function
  public.my_member_status(), public.admin_overview(), public.admin_users(text), public.admin_user_detail(uuid),
  public.admin_set_member_flag(uuid, boolean, boolean, text), public.admin_reset_avatar(uuid), public.admin_reset_nickname(uuid)
to authenticated;
