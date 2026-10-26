-- GYM SPIRIT 길드 · 랭킹 개편
-- Supabase 대시보드 > SQL Editor > New query 에 전체를 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)
-- 기존 회원·운동 기록은 건드리지 않고, 길드용 표와 기능만 새로 추가합니다.
--
-- 규칙
-- · 친구 랭킹: 나와 서로 친구인 사람의 기록만 보인다
-- · 전체 랭킹: '랭킹에 등록'한 길드(소속 인원 평균)와 '개인 참가'한 회원만 올라간다
-- · 길드: 누구나 창설, 길드 레벨·스킬·주간 미션·주간 레이드 보스·길드원 계급
-- 모든 쓰기는 아래 함수(RPC)로만 가능하고, 함수 안에서 권한을 확인한다.

-- ── 표 ─────────────────────────────
alter table public.profiles add column if not exists solo_ranked boolean not null default false;

create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emblem text not null default '🏋️',
  color text not null default 'emerald',
  intro text not null default '',
  join_mode text not null default 'open' check (join_mode in ('open', 'approval')),
  invite_code text not null unique,
  leader_id uuid not null references public.profiles(id) on delete cascade,
  xp bigint not null default 0,
  skills jsonb not null default '{}'::jsonb,
  ranked boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists guilds_name_key on public.guilds (lower(name));

-- 한 사람은 길드 하나에만 속한다
create table if not exists public.guild_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'coach', 'member')),
  contrib bigint not null default 0,
  joined_at timestamptz not null default now()
);
create index if not exists guild_members_guild_idx on public.guild_members (guild_id);

create table if not exists public.guild_requests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, guild_id)
);

-- 길드원이 운동한 날의 기록 (하루 한 줄, 길드 경험치·미션·레이드 계산에 쓴다)
create table if not exists public.guild_activity (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  volume numeric not null default 0,
  xp int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (guild_id, user_id, day)
);
create index if not exists guild_activity_day_idx on public.guild_activity (guild_id, day);

-- 주간 미션·레이드 보상 수령 기록 (주마다 한 번)
create table if not exists public.guild_claims (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  week_start date not null,
  key text not null,
  xp int not null,
  claimed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (guild_id, week_start, key)
);

alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_requests enable row level security;
alter table public.guild_activity enable row level security;
alter table public.guild_claims enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('guilds', 'guild_members', 'guild_requests', 'guild_activity', 'guild_claims')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;
-- 길드 이름·엠블럼 같은 공개 정보만 직접 읽을 수 있다. 나머지는 함수로만.
create policy guilds_read_all on public.guilds for select using (true);
grant select on public.guilds to anon, authenticated;

-- ── 공통 계산 ─────────────────────────────
-- 이번 주 월요일 (한국 시간)
create or replace function public.gs_week_start() returns date language sql stable as $$
  select (date_trunc('week', now() at time zone 'Asia/Seoul'))::date
$$;
create or replace function public.gs_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Seoul')::date
$$;

-- 길드 레벨: 1→2에 600, 이후 레벨마다 300씩 더 필요 (최대 30)
create or replace function public.gs_level(p_xp bigint) returns int language plpgsql immutable as $$
declare l int := 1; need bigint := 600; rem bigint := greatest(0, p_xp);
begin
  while rem >= need and l < 30 loop rem := rem - need; l := l + 1; need := 600 + 300 * (l - 1); end loop;
  return l;
end $$;

create or replace function public.gs_skill(p_skills jsonb, p_key text) returns int language sql immutable as $$
  select coalesce((p_skills ->> p_key)::int, 0)
$$;

-- 정원: 기본 10명, 레벨마다 +1 (최대 25) + 회원권 확장 스킬 1단계마다 +2
create or replace function public.gs_cap(p_xp bigint, p_skills jsonb) returns int language sql immutable as $$
  select least(25, 9 + public.gs_level(p_xp)) + 2 * public.gs_skill(p_skills, 'membership')
$$;

create or replace function public.gs_count(p_guild uuid) returns int language sql stable as $$
  select count(*)::int from public.guild_members where guild_id = p_guild
$$;

-- 이번 주 길드 현황: 합계 볼륨, 출석(운동한 날 합), 3명 이상(소규모는 2명) 함께 운동한 날
create or replace function public.gs_week_stats(p_guild uuid) returns jsonb language sql stable as $$
  with w as (select public.gs_week_start() as ws),
  act as (
    select a.* from public.guild_activity a, w
    where a.guild_id = p_guild and a.day between w.ws and w.ws + 6 and a.volume > 0
  ),
  per_day as (select day, count(distinct user_id) as n from act group by day)
  select jsonb_build_object(
    'week_start', (select ws from w),
    'volume', coalesce((select sum(volume) from act), 0),
    'days', (select count(*) from act),
    'together', (select count(*) from per_day where n >= greatest(2, least(3, public.gs_count(p_guild)))),
    'members', public.gs_count(p_guild)
  )
$$;

create or replace function public.gs_me() returns uuid language plpgsql stable as $$
begin
  if auth.uid() is null then raise exception 'GS:LOGIN'; end if;
  return auth.uid();
end $$;

-- ── 길드 만들기·가입·탈퇴 ─────────────────────────────
create or replace function public.create_guild(p_name text, p_emblem text, p_color text, p_intro text, p_join_mode text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); nm text := btrim(coalesce(p_name, '')); gid uuid; code text;
begin
  if exists (select 1 from guild_members where user_id = uid) then raise exception 'GS:IN_GUILD'; end if;
  if char_length(nm) < 2 or char_length(nm) > 12 then raise exception 'GS:NAME_LEN'; end if;
  if exists (select 1 from guilds where lower(name) = lower(nm)) then raise exception 'GS:NAME_TAKEN'; end if;
  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from guilds where invite_code = code);
  end loop;
  insert into guilds (name, emblem, color, intro, join_mode, invite_code, leader_id)
  values (nm, left(coalesce(nullif(p_emblem, ''), '🏋️'), 8), coalesce(nullif(p_color, ''), 'emerald'),
          left(coalesce(p_intro, ''), 80), case when p_join_mode = 'approval' then 'approval' else 'open' end, code, uid)
  returning id into gid;
  insert into guild_members (user_id, guild_id, role) values (uid, gid, 'leader');
  delete from guild_requests where user_id = uid;
  update profiles set solo_ranked = false where id = uid;
  return gid;
end $$;

create or replace function public.update_guild(p_name text, p_emblem text, p_color text, p_intro text, p_join_mode text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); gid uuid; nm text := btrim(coalesce(p_name, ''));
begin
  select guild_id into gid from guild_members where user_id = uid and role = 'leader';
  if gid is null then raise exception 'GS:NOT_LEADER'; end if;
  if char_length(nm) < 2 or char_length(nm) > 12 then raise exception 'GS:NAME_LEN'; end if;
  if exists (select 1 from guilds where lower(name) = lower(nm) and id <> gid) then raise exception 'GS:NAME_TAKEN'; end if;
  update guilds set name = nm, emblem = left(coalesce(nullif(p_emblem, ''), emblem), 8), color = coalesce(nullif(p_color, ''), color),
    intro = left(coalesce(p_intro, ''), 80), join_mode = case when p_join_mode = 'approval' then 'approval' else 'open' end
  where id = gid;
end $$;

create or replace function public.gs_add_member(p_user uuid, p_guild uuid) returns void language plpgsql security definer set search_path = public as $$
declare g guilds;
begin
  select * into g from guilds where id = p_guild for update;
  if not found then raise exception 'GS:NO_GUILD'; end if;
  if exists (select 1 from guild_members where user_id = p_user) then raise exception 'GS:IN_GUILD'; end if;
  if gs_count(p_guild) >= gs_cap(g.xp, g.skills) then raise exception 'GS:FULL'; end if;
  insert into guild_members (user_id, guild_id, role) values (p_user, p_guild, 'member');
  delete from guild_requests where user_id = p_user;
  update profiles set solo_ranked = false where id = p_user;
end $$;

-- 자유 가입이면 바로 가입, 승인제면 가입 신청 (신청은 한 번에 한 길드만)
create or replace function public.join_guild(p_guild uuid) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); mode text;
begin
  select join_mode into mode from guilds where id = p_guild;
  if mode is null then raise exception 'GS:NO_GUILD'; end if;
  if exists (select 1 from guild_members where user_id = uid) then raise exception 'GS:IN_GUILD'; end if;
  if mode = 'open' then perform gs_add_member(uid, p_guild); return 'joined'; end if;
  delete from guild_requests where user_id = uid;
  insert into guild_requests (user_id, guild_id) values (uid, p_guild);
  return 'requested';
end $$;

-- 초대 코드는 승인 없이 바로 가입
create or replace function public.join_guild_by_code(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); gid uuid;
begin
  select id into gid from guilds where invite_code = upper(btrim(coalesce(p_code, '')));
  if gid is null then raise exception 'GS:BAD_CODE'; end if;
  perform gs_add_member(uid, gid);
  return gid;
end $$;

create or replace function public.cancel_guild_request() returns void
language plpgsql security definer set search_path = public as $$
begin delete from guild_requests where user_id = gs_me(); end $$;

create or replace function public.gs_my_role(p_uid uuid, out gid uuid, out role text)
language sql stable security definer set search_path = public as $$
  select guild_id, role from guild_members where user_id = p_uid
$$;

create or replace function public.respond_guild_request(p_user uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record;
begin
  select * into me from gs_my_role(uid);
  if me.role is null or me.role = 'member' then raise exception 'GS:NO_PERMISSION'; end if;
  if not exists (select 1 from guild_requests where user_id = p_user and guild_id = me.gid) then raise exception 'GS:NO_REQUEST'; end if;
  if p_accept then perform gs_add_member(p_user, me.gid);
  else delete from guild_requests where user_id = p_user and guild_id = me.gid; end if;
end $$;

-- 관장이 나가면 코치 → 기여도 높은 순으로 관장을 넘기고, 혼자였으면 길드를 해산한다
create or replace function public.leave_guild() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; heir uuid;
begin
  select * into me from gs_my_role(uid);
  if me.gid is null then return; end if;
  if me.role = 'leader' then
    select user_id into heir from guild_members where guild_id = me.gid and user_id <> uid
      order by (role = 'coach') desc, contrib desc, joined_at limit 1;
    if heir is null then delete from guilds where id = me.gid; return; end if;
    update guild_members set role = 'leader' where user_id = heir;
    update guilds set leader_id = heir where id = me.gid;
  end if;
  delete from guild_members where user_id = uid;
  if gs_count(me.gid) < 2 then update guilds set ranked = false where id = me.gid; end if;
end $$;

create or replace function public.kick_guild_member(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; target text;
begin
  select * into me from gs_my_role(uid);
  select role into target from guild_members where user_id = p_user and guild_id = me.gid;
  if target is null or p_user = uid then raise exception 'GS:NO_MEMBER'; end if;
  if not (me.role = 'leader' or (me.role = 'coach' and target = 'member')) then raise exception 'GS:NO_PERMISSION'; end if;
  delete from guild_members where user_id = p_user;
  if gs_count(me.gid) < 2 then update guilds set ranked = false where id = me.gid; end if;
end $$;

-- 관장만: 코치 임명(최대 3명)·해제
create or replace function public.set_guild_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record;
begin
  select * into me from gs_my_role(uid);
  if me.role is distinct from 'leader' then raise exception 'GS:NOT_LEADER'; end if;
  if p_role not in ('coach', 'member') or p_user = uid then raise exception 'GS:BAD_ROLE'; end if;
  if not exists (select 1 from guild_members where user_id = p_user and guild_id = me.gid) then raise exception 'GS:NO_MEMBER'; end if;
  if p_role = 'coach' and (select count(*) from guild_members where guild_id = me.gid and role = 'coach' and user_id <> p_user) >= 3 then
    raise exception 'GS:COACH_MAX';
  end if;
  update guild_members set role = p_role where user_id = p_user;
end $$;

create or replace function public.transfer_guild_leader(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record;
begin
  select * into me from gs_my_role(uid);
  if me.role is distinct from 'leader' then raise exception 'GS:NOT_LEADER'; end if;
  if p_user = uid or not exists (select 1 from guild_members where user_id = p_user and guild_id = me.gid) then raise exception 'GS:NO_MEMBER'; end if;
  update guild_members set role = 'coach' where user_id = uid;
  update guild_members set role = 'leader' where user_id = p_user;
  update guilds set leader_id = p_user where id = me.gid;
end $$;

create or replace function public.disband_guild() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record;
begin
  select * into me from gs_my_role(uid);
  if me.role is distinct from 'leader' then raise exception 'GS:NOT_LEADER'; end if;
  delete from guilds where id = me.gid;
end $$;

-- ── 랭킹 등록 ─────────────────────────────
-- 길드 랭킹 등록은 관장만, 2명 이상일 때
create or replace function public.set_guild_ranked(p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record;
begin
  select * into me from gs_my_role(uid);
  if me.role is distinct from 'leader' then raise exception 'GS:NOT_LEADER'; end if;
  if p_on and gs_count(me.gid) < 2 then raise exception 'GS:MIN2'; end if;
  update guilds set ranked = p_on where id = me.gid;
end $$;

-- 개인 참가: 길드에 없을 때만
create or replace function public.set_solo_ranked(p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me();
begin
  if p_on and exists (select 1 from guild_members where user_id = uid) then raise exception 'GS:IN_GUILD'; end if;
  update profiles set solo_ranked = p_on where id = uid;
end $$;

-- ── 길드 성장 ─────────────────────────────
-- 운동을 저장하면 그날 기록으로 길드 경험치가 쌓인다 (하루 40 + 볼륨 250kg당 1, 최대 100 · 단체 PT 스킬로 증가)
-- 같은 날 다시 저장하면 늘어난 만큼만 더해진다
create or replace function public.guild_contribute(p_day date, p_volume numeric) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; g guilds; v numeric; x int; old int; delta int;
begin
  select * into me from gs_my_role(uid);
  if me.gid is null then return 0; end if;
  if p_day is null or p_day < gs_today() - 2 or p_day > gs_today() + 1 then return 0; end if;
  v := greatest(0, least(coalesce(p_volume, 0), 100000));
  select * into g from guilds where id = me.gid for update;
  x := case when v <= 0 then 0 else round((40 + least(60, floor(v / 250))) * (1 + 0.1 * gs_skill(g.skills, 'pt')))::int end;
  select xp into old from guild_activity where guild_id = me.gid and user_id = uid and day = p_day;
  insert into guild_activity (guild_id, user_id, day, volume, xp) values (me.gid, uid, p_day, v, x)
  on conflict (guild_id, user_id, day) do update set volume = excluded.volume, xp = greatest(guild_activity.xp, excluded.xp), updated_at = now();
  delta := greatest(0, x - coalesce(old, 0));
  if delta > 0 then
    update guilds set xp = xp + delta where id = me.gid;
    update guild_members set contrib = contrib + delta where user_id = uid;
  end if;
  return delta;
end $$;

-- 관장만: 스킬 포인트(레벨-1) 투자
create or replace function public.upgrade_guild_skill(p_key text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; g guilds; mx int; used int;
begin
  select * into me from gs_my_role(uid);
  if me.role is distinct from 'leader' then raise exception 'GS:NOT_LEADER'; end if;
  mx := case p_key when 'pt' then 5 when 'membership' then 5 when 'protein' then 3 when 'rack' then 5 else 0 end;
  if mx = 0 then raise exception 'GS:BAD_SKILL'; end if;
  select * into g from guilds where id = me.gid for update;
  if gs_skill(g.skills, p_key) >= mx then raise exception 'GS:SKILL_MAX'; end if;
  select coalesce(sum(value::int), 0) into used from jsonb_each_text(g.skills);
  if used >= gs_level(g.xp) - 1 then raise exception 'GS:NO_POINTS'; end if;
  update guilds set skills = jsonb_set(skills, array[p_key], to_jsonb(gs_skill(skills, p_key) + 1)) where id = me.gid;
end $$;

-- 주간 미션·레이드 보상 받기 (길드원 누구나, 주마다 한 번)
create or replace function public.claim_guild_reward(p_key text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; g guilds; s jsonb; n int; ok boolean; reward int;
begin
  select * into me from gs_my_role(uid);
  if me.gid is null then raise exception 'GS:NO_GUILD'; end if;
  select * into g from guilds where id = me.gid for update;
  s := gs_week_stats(me.gid); n := (s ->> 'members')::int;
  ok := case p_key
    when 'volume' then (s ->> 'volume')::numeric >= 15000 * n
    when 'attend' then (s ->> 'days')::int >= 3 * n
    when 'together' then n >= 2 and (s ->> 'together')::int >= 2
    when 'raid' then (s ->> 'volume')::numeric * (1 + 0.1 * gs_skill(g.skills, 'rack')) >= 25000 * n
    else null end;
  if ok is null then raise exception 'GS:BAD_KEY'; end if;
  if not ok then raise exception 'GS:NOT_DONE'; end if;
  reward := case p_key when 'raid' then 500 when 'together' then 200 else 300 end;
  if p_key <> 'raid' then reward := round(reward * (1 + 0.2 * gs_skill(g.skills, 'protein'))); end if;
  begin
    insert into guild_claims (guild_id, week_start, key, xp, claimed_by) values (me.gid, (s ->> 'week_start')::date, p_key, reward, uid);
  exception when unique_violation then raise exception 'GS:CLAIMED';
  end;
  update guilds set xp = xp + reward where id = me.gid;
  return reward;
end $$;

-- ── 읽기 ─────────────────────────────
-- 전체 랭킹: 등록한 길드(2명 이상, 소속 인원 평균) + 개인 참가자
create or replace function public.global_ranking()
returns table (kind text, id uuid, name text, emblem text, color text, avatar jsonb, level int, members int, volume numeric, lift numeric)
language sql stable security definer set search_path = public as $$
  with wk as (select gs_week_start() as ws)
  select 'guild', g.id, g.name, g.emblem, g.color, null::jsonb, gs_level(g.xp), count(*)::int,
    round(avg(case when p.week_start = wk.ws then p.weekly_volume else 0 end)), round(avg(p.lift3))
  from guilds g join guild_members m on m.guild_id = g.id join profiles p on p.id = m.user_id, wk
  where g.ranked
  group by g.id, wk.ws
  having count(*) >= 2
  union all
  select 'solo', p.id, p.nickname, null, null, p.avatar, null, 1,
    case when p.week_start = wk.ws then round(p.weekly_volume) else 0 end, round(p.lift3)
  from profiles p, wk
  where p.solo_ranked and not exists (select 1 from guild_members m where m.user_id = p.id)
$$;

-- 친구 랭킹: 나와 서로 친구인 사람만
create or replace function public.friend_ranking()
returns table (id uuid, nickname text, avatar jsonb, volume numeric, lift numeric, fav text, last_routine jsonb, guild_name text, guild_emblem text)
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
    g.name, g.emblem
  from ids join profiles p on p.id = ids.id
  left join guild_members m on m.user_id = p.id left join guilds g on g.id = m.guild_id
$$;

-- 길드 찾기 (공개 정보)
create or replace function public.search_guilds(p_q text)
returns table (id uuid, name text, emblem text, color text, intro text, join_mode text, level int, members int, cap int, ranked boolean)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.emblem, g.color, g.intro, g.join_mode, gs_level(g.xp), gs_count(g.id), gs_cap(g.xp, g.skills), g.ranked
  from guilds g
  where coalesce(btrim(p_q), '') = '' or g.name ilike '%' || btrim(p_q) || '%'
  order by g.xp desc, g.created_at limit 30
$$;

-- 다른 길드 구경: 이름·레벨·길드원 닉네임과 계급만 (개인 기록은 보이지 않음)
create or replace function public.guild_public(p_guild uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', g.id, 'name', g.name, 'emblem', g.emblem, 'color', g.color, 'intro', g.intro, 'join_mode', g.join_mode,
    'xp', g.xp, 'level', gs_level(g.xp), 'members', gs_count(g.id), 'cap', gs_cap(g.xp, g.skills), 'ranked', g.ranked,
    'member_list', coalesce((select jsonb_agg(jsonb_build_object('nickname', p.nickname, 'avatar', p.avatar, 'role', m.role, 'contrib', m.contrib)
                              order by (m.role = 'leader') desc, (m.role = 'coach') desc, m.contrib desc)
                             from guild_members m join profiles p on p.id = m.user_id where m.guild_id = g.id), '[]'::jsonb)
  ) from guilds g where g.id = p_guild
$$;

-- 내 길드 화면에 필요한 모든 것
create or replace function public.my_guild() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; g guilds; ws date := gs_week_start(); res jsonb;
begin
  select * into me from gs_my_role(uid);
  if me.gid is null then
    return jsonb_build_object('guild', null, 'solo_ranked', (select solo_ranked from profiles where id = uid),
      'request', (select jsonb_build_object('guild_id', g2.id, 'name', g2.name, 'emblem', g2.emblem)
                  from guild_requests r join guilds g2 on g2.id = r.guild_id where r.user_id = uid limit 1));
  end if;
  select * into g from guilds where id = me.gid;
  res := jsonb_build_object(
    'guild', jsonb_build_object('id', g.id, 'name', g.name, 'emblem', g.emblem, 'color', g.color, 'intro', g.intro,
      'join_mode', g.join_mode, 'invite_code', g.invite_code, 'xp', g.xp, 'level', gs_level(g.xp), 'skills', g.skills,
      'ranked', g.ranked, 'cap', gs_cap(g.xp, g.skills), 'created_at', g.created_at),
    'my_role', me.role,
    'members', (select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nickname', p.nickname, 'avatar', p.avatar, 'role', m.role, 'contrib', m.contrib,
        'volume', case when p.week_start = ws then round(p.weekly_volume) else 0 end, 'lift', round(p.lift3),
        'days', (select count(*) from guild_activity a where a.guild_id = g.id and a.user_id = p.id and a.day between ws and ws + 6 and a.volume > 0),
        'week_days', (select coalesce(jsonb_agg(extract(isodow from a.day)::int), '[]'::jsonb) from guild_activity a
                      where a.guild_id = g.id and a.user_id = p.id and a.day between ws and ws + 6 and a.volume > 0))
      order by (m.role = 'leader') desc, (m.role = 'coach') desc, m.contrib desc)
      from guild_members m join profiles p on p.id = m.user_id where m.guild_id = g.id),
    'requests', case when me.role in ('leader', 'coach') then
        (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nickname', p.nickname, 'avatar', p.avatar, 'at', r.created_at) order by r.created_at), '[]'::jsonb)
         from guild_requests r join profiles p on p.id = r.user_id where r.guild_id = g.id)
      else '[]'::jsonb end,
    'week', gs_week_stats(g.id),
    'claims', (select coalesce(jsonb_agg(key), '[]'::jsonb) from guild_claims where guild_id = g.id and week_start = ws),
    'feed', (select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
        select jsonb_build_object('nickname', p.nickname, 'day', a.day, 'volume', round(a.volume), 'xp', a.xp, 'at', a.updated_at) as x, a.updated_at as at
        from guild_activity a join profiles p on p.id = a.user_id
        where a.guild_id = g.id and a.volume > 0 order by a.updated_at desc limit 15) x)
  );
  return res;
end $$;

-- ── 권한 ─────────────────────────────
revoke all on public.guild_members, public.guild_requests, public.guild_activity, public.guild_claims from anon, authenticated;
-- 내부용 함수는 앱에서 직접 부를 수 없게 막는다 (다른 함수 안에서만 쓰임)
revoke execute on function public.gs_add_member(uuid, uuid), public.gs_my_role(uuid) from public, anon, authenticated;
grant execute on function public.global_ranking(), public.search_guilds(text), public.guild_public(uuid) to anon, authenticated;
grant execute on function
  public.create_guild(text, text, text, text, text), public.update_guild(text, text, text, text, text),
  public.join_guild(uuid), public.join_guild_by_code(text), public.cancel_guild_request(),
  public.respond_guild_request(uuid, boolean), public.leave_guild(), public.kick_guild_member(uuid),
  public.set_guild_role(uuid, text), public.transfer_guild_leader(uuid), public.disband_guild(),
  public.set_guild_ranked(boolean), public.set_solo_ranked(boolean), public.guild_contribute(date, numeric),
  public.upgrade_guild_skill(text), public.claim_guild_reward(text), public.friend_ranking(), public.my_guild()
to authenticated;
