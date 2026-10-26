-- GYM SPIRIT: 운영자 모드(흰 정장)일 때는 랭킹에서 빠지기
-- admin.sql, guilds_v3.sql 을 실행한 뒤 SQL Editor 에 전체를 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)
-- · 전체 랭킹: 개인 참가 목록에서 빠지고, 길드 평균(인원·볼륨·3대)에서도 빠진다
-- · 길드 MVP(이번 주·지난주)에서 빠진다
-- · 일반 유저 모드로 돌아오면 다시 평소처럼 반영된다 (운동 기록 자체는 그대로)

-- 운영자이면서 운영자 모드(아바타의 gm 표시)를 켠 상태인지
create or replace function public.gs_gm_on(p_id uuid, p_avatar jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(p_avatar->>'gm', '') = 'true' and exists (select 1 from app_admins a where a.user_id = p_id)
$$;

create or replace function public.global_ranking()
returns table (kind text, id uuid, name text, emblem text, color text, avatar jsonb, level int, members int, volume numeric, lift numeric)
language sql stable security definer set search_path = public as $$
  with wk as (select gs_week_start() as ws)
  select 'guild', g.id, g.name, g.emblem, g.color, null::jsonb, gs_level(g.xp), count(*)::int,
    round(avg(case when p.week_start = wk.ws then p.weekly_volume else 0 end)), round(avg(p.lift3))
  from guilds g join guild_members m on m.guild_id = g.id join profiles p on p.id = m.user_id, wk
  where g.ranked and not gs_gm_on(p.id, p.avatar)
  group by g.id, wk.ws
  having count(*) >= 2
  union all
  select 'solo', p.id, p.nickname, null, null, p.avatar, null, 1,
    case when p.week_start = wk.ws then round(p.weekly_volume) else 0 end, round(p.lift3)
  from profiles p, wk
  where p.solo_ranked and not gs_gm_on(p.id, p.avatar) and not exists (select 1 from guild_members m where m.user_id = p.id)
$$;
grant execute on function public.global_ranking() to anon, authenticated;

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
        'cheered_today', exists (select 1 from guild_cheers c where c.from_id = uid and c.to_id = p.id and c.day = today),
        -- 이 길드에서 이번 주에 준 피해(= 길드에 기록된 볼륨)와 요일별 기록
        'guild_volume', (select coalesce(round(sum(a.volume)), 0) from guild_activity a where a.guild_id = g.id and a.user_id = p.id and a.day between ws and ws + 6),
        'week_log', (select coalesce(jsonb_agg(jsonb_build_object('dow', extract(isodow from a.day)::int, 'volume', round(a.volume))), '[]'::jsonb)
                     from guild_activity a where a.guild_id = g.id and a.user_id = p.id and a.day between ws and ws + 6 and a.volume > 0))
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
            where a.guild_id = g.id and a.day between ws and ws + 6 and a.volume > 0 and not gs_gm_on(p.id, p.avatar)
            group by p.id, p.nickname, p.avatar order by sum(a.volume) desc limit 1),
    'last_week', jsonb_build_object(
      'mvp', (select jsonb_build_object('nickname', p.nickname, 'avatar', p.avatar, 'volume', round(sum(a.volume)))
              from guild_activity a join profiles p on p.id = a.user_id
              where a.guild_id = g.id and a.day between ws - 7 and ws - 1 and a.volume > 0 and not gs_gm_on(p.id, p.avatar)
              group by p.id, p.nickname, p.avatar order by sum(a.volume) desc limit 1),
      'week_start', ws - 7,
      'volume', (select coalesce(round(sum(volume)), 0) from guild_activity where guild_id = g.id and day between ws - 7 and ws - 1),
      'my_volume', (select coalesce(round(sum(volume)), 0) from guild_activity where guild_id = g.id and user_id = uid and day between ws - 7 and ws - 1),
      'mvp_id', (select a.user_id from guild_activity a join profiles p on p.id = a.user_id where a.guild_id = g.id and a.day between ws - 7 and ws - 1 and a.volume > 0 and not gs_gm_on(p.id, p.avatar)
                 group by a.user_id order by sum(a.volume) desc limit 1),
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

grant execute on function public.my_guild() to authenticated;
