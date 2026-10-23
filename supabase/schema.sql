-- GYM SPIRIT 데이터베이스 설계
-- Supabase 대시보드 > SQL Editor > New query 에 전체를 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)

-- 1) 공개 프로필: 랭킹·친구 검색에 보이는 정보 (닉네임, 아바타, 이번 주 볼륨, 3대 합계, 최근 루틴)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '짐스피릿 유저',
  avatar jsonb not null default '{}'::jsonb,
  week_start date,
  weekly_volume numeric not null default 0,
  lift3 numeric not null default 0,
  fav text,
  last_routine jsonb,
  updated_at timestamptz not null default now()
);

-- 2) 개인 기록: 운동·식단·체성분 등 본인만 볼 수 있는 데이터
create table if not exists public.user_data (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3) 친구 요청: pending(대기) → accepted(수락). 거절·취소는 행 삭제
create table if not exists public.friend_requests (
  id bigint generated always as identity primary key,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (from_id, to_id),
  check (from_id <> to_id)
);

-- 4) 응원: 누가 누구를 응원했는지 (주 단위 집계)
create table if not exists public.cheers (
  id bigint generated always as identity primary key,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now()
);

alter table public.profiles alter column nickname set default '짐스피릿 유저';

create index if not exists profiles_week_idx on public.profiles (week_start, weekly_volume desc);
create index if not exists friend_requests_to_idx on public.friend_requests (to_id, status);
create index if not exists cheers_to_idx on public.cheers (to_id, week_start);

-- 회원가입하면 프로필·개인기록 행을 자동으로 만든다 (닉네임은 가입 때 입력한 값)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'nickname'), ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.user_data (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 보안 규칙(RLS): 남의 데이터는 수정할 수 없고, 개인 기록은 본인만 본다
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.friend_requests enable row level security;
alter table public.cheers enable row level security;

-- 기존 규칙을 모두 지우고 다시 만든다 (여러 번 실행해도 중복되지 않게)
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('profiles', 'user_data', 'friend_requests', 'cheers')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;

create policy profiles_read_all on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy user_data_read_own on public.user_data for select to authenticated using (auth.uid() = id);
create policy user_data_update_own on public.user_data for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy friend_requests_read_party on public.friend_requests for select to authenticated
  using (auth.uid() in (from_id, to_id));
create policy friend_requests_insert_own on public.friend_requests for insert to authenticated
  with check (auth.uid() = from_id and status = 'pending');
create policy friend_requests_accept_received on public.friend_requests for update to authenticated
  using (auth.uid() = to_id) with check (auth.uid() = to_id and status = 'accepted');
create policy friend_requests_delete_party on public.friend_requests for delete to authenticated
  using (auth.uid() in (from_id, to_id));

create policy cheers_read_all on public.cheers for select using (true);
create policy cheers_insert_own on public.cheers for insert to authenticated
  with check (auth.uid() = from_id and from_id <> to_id);

-- 앱(Data API)에서 테이블에 접근할 수 있게 권한 부여 (실제 허용 범위는 위 RLS 규칙이 결정)
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.cheers to anon;
grant select, update on public.profiles, public.user_data to authenticated;
grant select, insert, update, delete on public.friend_requests to authenticated;
grant select, insert on public.cheers to authenticated;

-- 친구 요청이 오면 상대 화면에 바로 뜨도록 실시간 알림 켜기
do $$ begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null; end $$;
