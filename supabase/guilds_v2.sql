-- GYM SPIRIT 길드 2차: 게시판(공지·한마디), 길드원 응원, 주간 MVP·지난주 기록, 업적용 통계 + 랭킹 공개 범위 잠금
-- guilds.sql 을 먼저 실행한 뒤, SQL Editor 에 전체를 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)

-- ── 표 ─────────────────────────────
-- 길드 게시판: 관장·코치는 공지, 길드원은 한마디 (200자)
create table if not exists public.guild_posts (
  id bigint generated always as identity primary key,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 200),
  kind text not null default 'talk' check (kind in ('talk', 'notice')),
  created_at timestamptz not null default now()
);
create index if not exists guild_posts_guild_idx on public.guild_posts (guild_id, created_at desc);

-- 길드원 응원: 같은 사람에게 하루 한 번, 하루 최대 5번
create table if not exists public.guild_cheers (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id, day)
);
create index if not exists guild_cheers_guild_idx on public.guild_cheers (guild_id, day);

alter table public.guild_posts enable row level security;
alter table public.guild_cheers enable row level security;
revoke all on public.guild_posts, public.guild_cheers from anon, authenticated;

-- ── 게시판 ─────────────────────────────
create or replace function public.post_guild_message(p_body text, p_notice boolean) returns bigint
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; b text := btrim(coalesce(p_body, '')); pid bigint;
begin
  select * into me from gs_my_role(uid);
  if me.gid is null then raise exception 'GS:NO_GUILD'; end if;
  if char_length(b) < 1 or char_length(b) > 200 then raise exception 'GS:POST_LEN'; end if;
  if p_notice and me.role = 'member' then raise exception 'GS:NO_PERMISSION'; end if;
  if (select count(*) from guild_posts where user_id = uid and created_at > now() - interval '1 day') >= 30 then raise exception 'GS:POST_LIMIT'; end if;
  insert into guild_posts (guild_id, user_id, body, kind) values (me.gid, uid, b, case when p_notice then 'notice' else 'talk' end)
  returning id into pid;
  return pid;
end $$;

-- 내 글, 또는 관장·코치는 아무 글이나 지울 수 있다
create or replace function public.delete_guild_post(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; post guild_posts;
begin
  select * into me from gs_my_role(uid);
  select * into post from guild_posts where id = p_id;
  if post.id is null or post.guild_id is distinct from me.gid then raise exception 'GS:NO_POST'; end if;
  if post.user_id is distinct from uid and me.role = 'member' then raise exception 'GS:NO_PERMISSION'; end if;
  delete from guild_posts where id = p_id;
end $$;

-- ── 응원 ─────────────────────────────
-- 응원 1번 = 길드 경험치 +10, 받은 사람 기여도 +10
create or replace function public.cheer_guild_member(p_to uuid) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; today date := gs_today();
begin
  select * into me from gs_my_role(uid);
  if me.gid is null then raise exception 'GS:NO_GUILD'; end if;
  if p_to = uid or not exists (select 1 from guild_members where user_id = p_to and guild_id = me.gid) then raise exception 'GS:NO_MEMBER'; end if;
  if (select count(*) from guild_cheers where from_id = uid and day = today) >= 5 then raise exception 'GS:CHEER_LIMIT'; end if;
  begin
    insert into guild_cheers (guild_id, from_id, to_id, day) values (me.gid, uid, p_to, today);
  exception when unique_violation then raise exception 'GS:CHEERED';
  end;
  update guilds set xp = xp + 10 where id = me.gid;
  update guild_members set contrib = contrib + 10 where user_id = p_to;
  return 10;
end $$;

-- ── 내 길드 화면 (1차 내용 + 게시판·응원·MVP·지난주·업적 통계) ─────────────────────────────
create or replace function public.my_guild() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := gs_me(); me record; g guilds; ws date := gs_week_start(); today date := gs_today(); res jsonb;
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
                      where a.guild_id = g.id and a.user_id = p.id and a.day between ws and ws + 6 and a.volume > 0),
        'cheers', (select count(*) from guild_cheers c where c.guild_id = g.id and c.to_id = p.id and c.day between ws and ws + 6),
        'cheered_today', exists (select 1 from guild_cheers c where c.from_id = uid and c.to_id = p.id and c.day = today))
      order by (m.role = 'leader') desc, (m.role = 'coach') desc, m.contrib desc)
      from guild_members m join profiles p on p.id = m.user_id where m.guild_id = g.id),
    'requests', case when me.role in ('leader', 'coach') then
        (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nickname', p.nickname, 'avatar', p.avatar, 'at', r.created_at) order by r.created_at), '[]'::jsonb)
         from guild_requests r join profiles p on p.id = r.user_id where r.guild_id = g.id)
      else '[]'::jsonb end,
    'week', gs_week_stats(g.id),
    'claims', (select coalesce(jsonb_agg(key), '[]'::jsonb) from guild_claims where guild_id = g.id and week_start = ws),
    'my_cheers_today', (select count(*) from guild_cheers where from_id = uid and day = today),
    'feed', (select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
        select jsonb_build_object('nickname', p.nickname, 'day', a.day, 'volume', round(a.volume), 'xp', a.xp, 'at', a.updated_at) as x, a.updated_at as at
        from guild_activity a join profiles p on p.id = a.user_id
        where a.guild_id = g.id and a.volume > 0 order by a.updated_at desc limit 15) x),
    'posts', (select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
        select jsonb_build_object('id', gp.id, 'body', gp.body, 'kind', gp.kind, 'at', gp.created_at, 'mine', gp.user_id = uid,
          'nickname', coalesce(p.nickname, '떠난 길드원'), 'avatar', p.avatar, 'role', m.role) as x, gp.created_at as at
        from guild_posts gp left join profiles p on p.id = gp.user_id left join guild_members m on m.user_id = gp.user_id and m.guild_id = gp.guild_id
        where gp.guild_id = g.id order by gp.created_at desc limit 40) x),
    -- 이번 주 MVP(길드 활동 볼륨 1위)와 지난주 기록
    'mvp', (select jsonb_build_object('nickname', p.nickname, 'avatar', p.avatar, 'volume', round(sum(a.volume)), 'days', count(*))
            from guild_activity a join profiles p on p.id = a.user_id
            where a.guild_id = g.id and a.day between ws and ws + 6 and a.volume > 0
            group by p.id, p.nickname, p.avatar order by sum(a.volume) desc limit 1),
    'last_week', jsonb_build_object(
      'mvp', (select jsonb_build_object('nickname', p.nickname, 'avatar', p.avatar, 'volume', round(sum(a.volume)))
              from guild_activity a join profiles p on p.id = a.user_id
              where a.guild_id = g.id and a.day between ws - 7 and ws - 1 and a.volume > 0
              group by p.id, p.nickname, p.avatar order by sum(a.volume) desc limit 1),
      'volume', (select coalesce(round(sum(volume)), 0) from guild_activity where guild_id = g.id and day between ws - 7 and ws - 1),
      'claims', (select coalesce(jsonb_agg(key), '[]'::jsonb) from guild_claims where guild_id = g.id and week_start = ws - 7)),
    'stats', jsonb_build_object(
      'raids', (select count(*) from guild_claims where guild_id = g.id and key = 'raid'),
      'missions', (select count(*) from guild_claims where guild_id = g.id and key <> 'raid'),
      'cheers', (select count(*) from guild_cheers where guild_id = g.id),
      'posts', (select count(*) from guild_posts where guild_id = g.id),
      'claim_weeks', (select coalesce(jsonb_agg(w order by w desc), '[]'::jsonb) from (select distinct week_start as w from guild_claims where guild_id = g.id order by w desc limit 30) cw))
  );
  return res;
end $$;

grant execute on function public.post_guild_message(text, boolean), public.delete_guild_post(bigint), public.cheer_guild_member(uuid), public.my_guild() to authenticated;

-- ── 랭킹 공개 범위 잠금 ─────────────────────────────
-- 다른 사람의 운동 기록(주간 볼륨·3대·최근 루틴·최애 종목)은 직접 읽을 수 없고,
-- 친구 랭킹·전체 랭킹·길드 함수로만 볼 수 있다. 닉네임과 아바타는 친구 찾기용으로 계속 공개.
-- (schema.sql 을 다시 실행하면 전체 읽기 권한이 되살아나니, 그 뒤에는 이 파일도 다시 실행)
revoke select on public.profiles from anon, authenticated;
grant select (id, nickname, avatar, updated_at) on public.profiles to anon, authenticated;
