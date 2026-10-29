-- GYM SPIRIT: 휴식 종료 푸시 알림 (앱을 내려도 휴식이 끝나면 알림)
-- SQL Editor 에 전체를 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)
-- · push_subscriptions: 회원의 기기별 알림 주소 (알림을 켠 기기마다 한 줄)
-- · rest_alarms: 회원마다 지금 돌고 있는 휴식 타이머가 끝나는 시각 (한 사람당 하나)
-- · 2초마다 끝난 알람을 골라 Vercel 의 /api/push 로 보내고, 그쪽에서 실제 알림을 보낸다
-- 주의: 아래 __PUSH_SECRET__ 은 Vercel 의 PUSH_SECRET 값으로 바꿔서 실행해야 한다 (이 파일에는 진짜 값을 넣지 않는다)

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.rest_alarms (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fire_at timestamptz not null,
  title text not null default '⏱️ 휴식 끝!',
  body text not null default '다음 세트를 시작하세요 💪',
  created_at timestamptz not null default now()
);
alter table public.rest_alarms enable row level security;
drop policy if exists "own rest alarm" on public.rest_alarms;
create policy "own rest alarm" on public.rest_alarms
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 끝난 알람을 꺼내서 보낸다. 너무 늦어진 알람(2분 넘게 지난 것)은 보내지 않고 지운다
create or replace function public.dispatch_rest_alarms()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  items jsonb;
begin
  with due as (
    delete from public.rest_alarms where fire_at <= now() returning user_id, fire_at, title, body
  )
  select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth, 'title', d.title, 'body', d.body))
    into items
  from due d join public.push_subscriptions s on s.user_id = d.user_id
  where d.fire_at > now() - interval '2 minutes';
  if items is null then return; end if;
  perform net.http_post(
    url := 'https://gym-spirit.vercel.app/api/push',
    body := jsonb_build_object('items', items),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', '__PUSH_SECRET__'),
    timeout_milliseconds := 8000
  );
end $$;
-- 앱(회원·비회원)에서는 이 함수를 부를 수 없게 막는다
revoke all on function public.dispatch_rest_alarms() from public, anon, authenticated;

-- 2초마다 실행 (이미 있으면 바꿔 끼운다)
select cron.unschedule(jobid) from cron.job where jobname = 'gymspirit-rest-alarms';
select cron.schedule('gymspirit-rest-alarms', '2 seconds', $$select public.dispatch_rest_alarms()$$);
