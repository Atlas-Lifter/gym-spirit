-- GYM SPIRIT 랭킹 공개 범위 잠금 (2단계)
-- ⚠️ 길드·랭킹 개편이 정식 사이트에 반영된 '뒤에' 실행하세요. 먼저 실행하면 예전 화면의 랭킹·친구 찾기가 멈춥니다.
-- 실행하면 다른 사람의 운동 기록(주간 볼륨·3대·최근 루틴·최애 종목)을 직접 읽을 수 없고,
-- 친구 랭킹(friend_ranking)·전체 랭킹(global_ranking)·길드 함수로만 볼 수 있습니다. 닉네임과 아바타는 친구 찾기용으로 계속 공개됩니다.
-- 참고: schema.sql 을 다시 실행하면 전체 읽기 권한이 되살아나니, 그 뒤에는 이 파일도 다시 실행하세요.

revoke select on public.profiles from anon, authenticated;
grant select (id, nickname, avatar, updated_at) on public.profiles to anon, authenticated;
