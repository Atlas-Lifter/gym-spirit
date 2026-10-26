-- GYM SPIRIT 운영자 기능
-- guilds.sql ~ guilds_v3.sql 을 실행한 뒤, SQL Editor 에 전체를 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)
-- · 운영자 명단(app_admins)은 앱에서 바꿀 수 없고, 이 SQL 로만 넣고 뺀다
-- · 운영자 기능은 모두 DB 함수 안에서 운영자인지 다시 확인한다 (앱 화면을 속여도 실행되지 않음)
-- · 전체 공지(app_notices)는 누구나 읽을 수 있고, 운영자만 올리고 내린다

create table if not exists public.app_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.app_notices (
  id bigint generated always as identity primary key,
  body text not null check (char_length(body) between 1 and 200),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
alter table public.app_notices enable row level security;
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and tablename in ('app_admins', 'app_notices')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;
create policy app_notices_read_active on public.app_notices for select using (active);
revoke all on public.app_admins, public.app_notices from anon, authenticated;
grant select on public.app_notices to anon, authenticated;

-- 운영자 등록: '한복' 계정
insert into public.app_admins (user_id) values ('eede4909-89dc-4496-9b78-7c1fe9b27838') on conflict do nothing;

-- ── 확인용 ─────────────────────────────
-- 운영자 아이디 목록 (운영자 칭호·전용 의상을 다른 사람 화면에 보여줄 때 진짜 운영자인지 확인하는 데 쓴다)
create or replace function public.admin_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select user_id from app_admins
$$;

create or replace function public.gs_admin() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := gs_me();
begin
  if not exists (select 1 from app_admins where user_id = uid) then raise exception 'GS:NOT_ADMIN'; end if;
  return uid;
end $$;

-- ── 운영자 기능 ─────────────────────────────
-- 대시보드 숫자
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
    'notice', (select jsonb_build_object('id', id, 'body', body, 'at', created_at) from app_notices where active order by created_at desc limit 1)
  );
end $$;

-- 회원 찾기 (닉네임 검색, 비우면 최근 가입 순)
create or replace function public.admin_users(p_q text)
returns table (id uuid, nickname text, joined_at timestamptz, volume numeric, lift numeric, guild_name text, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  perform gs_admin();
  return query
    select p.id, p.nickname, u.created_at,
      case when p.week_start = gs_week_start() then round(p.weekly_volume) else 0 end, round(p.lift3),
      g.name, exists (select 1 from app_admins a where a.user_id = p.id)
    from profiles p
    left join auth.users u on u.id = p.id
    left join guild_members m on m.user_id = p.id left join guilds g on g.id = m.guild_id
    where coalesce(btrim(p_q), '') = '' or p.nickname ilike '%' || btrim(p_q) || '%'
    order by u.created_at desc nulls last limit 50;
end $$;

-- 부적절한 닉네임 초기화
create or replace function public.admin_reset_nickname(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform gs_admin();
  update profiles set nickname = '짐스피릿 유저' where id = p_user;
end $$;

-- 길드 관리
create or replace function public.admin_guilds(p_q text)
returns table (id uuid, name text, emblem text, color text, level int, members int, ranked boolean, created_at timestamptz, leader text)
language plpgsql stable security definer set search_path = public as $$
begin
  perform gs_admin();
  return query
    select g.id, g.name, g.emblem, g.color, gs_level(g.xp), gs_count(g.id), g.ranked, g.created_at, p.nickname
    from guilds g left join profiles p on p.id = g.leader_id
    where coalesce(btrim(p_q), '') = '' or g.name ilike '%' || btrim(p_q) || '%'
    order by g.created_at desc limit 100;
end $$;

create or replace function public.admin_set_guild_ranked(p_guild uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform gs_admin();
  update guilds set ranked = p_on where id = p_guild;
end $$;

create or replace function public.admin_disband_guild(p_guild uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform gs_admin();
  delete from guilds where id = p_guild;
end $$;

-- 길드 게시판 전체 보기·삭제
create or replace function public.admin_posts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform gs_admin();
  return (select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
    select jsonb_build_object('id', gp.id, 'body', gp.body, 'kind', gp.kind, 'at', gp.created_at,
      'nickname', coalesce(p.nickname, '떠난 길드원'), 'guild', g.name, 'emblem', g.emblem) as x, gp.created_at as at
    from guild_posts gp join guilds g on g.id = gp.guild_id left join profiles p on p.id = gp.user_id
    order by gp.created_at desc limit 60) x);
end $$;

create or replace function public.admin_delete_post(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform gs_admin();
  delete from guild_posts where id = p_id;
end $$;

-- 전체 공지: 새로 올리면 이전 공지는 내려간다
create or replace function public.admin_post_notice(p_body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare uid uuid := gs_admin(); b text := btrim(coalesce(p_body, '')); nid bigint;
begin
  if char_length(b) < 1 or char_length(b) > 200 then raise exception 'GS:POST_LEN'; end if;
  update app_notices set active = false where active;
  insert into app_notices (body, created_by) values (b, uid) returning id into nid;
  return nid;
end $$;

create or replace function public.admin_end_notice() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform gs_admin();
  update app_notices set active = false where active;
end $$;

revoke execute on function public.gs_admin() from public, anon, authenticated;
grant execute on function public.admin_ids() to anon, authenticated;
grant execute on function
  public.admin_overview(), public.admin_users(text), public.admin_reset_nickname(uuid),
  public.admin_guilds(text), public.admin_set_guild_ranked(uuid, boolean), public.admin_disband_guild(uuid),
  public.admin_posts(), public.admin_delete_post(bigint), public.admin_post_notice(text), public.admin_end_notice()
to authenticated;
