// 유산소 기록 (근력 운동 기록과 따로 저장: currentUser.cardio[날짜] = [{ id, type, min, km, speed, incline, level, hr, kcal, at }])
// 칼로리 = MET × 체중(kg) × 시간(h). MET는 ACSM·Compendium of Physical Activities 기준의 대략값
// · mode 'treadmill': 속도(km/h)·경사(%)로 계산 (걷기·달리기 ACSM 공식)
// · mode 'distance': 거리(km)를 넣으면 평균 속도·페이스를 보여주고, 걷기·달리기는 속도로 계산
// · 그 밖에는 강도(가볍게·보통·힘들게)별 MET
export const CARDIO_TYPES = [
  { id: 'treadmill_walk', name: '러닝머신 걷기', icon: '🚶', photo: 'cd_treadmill_walk', mode: 'treadmill', gait: 'walk', speed: 5.5, met: [3.0, 4.3, 6.0] },
  { id: 'treadmill_run', name: '러닝머신 달리기', icon: '🏃', photo: 'cd_treadmill_run', mode: 'treadmill', gait: 'run', speed: 9, met: [8.0, 9.8, 11.5] },
  { id: 'walk', name: '야외 걷기', icon: '🚶', photo: 'cd_outdoor', mode: 'distance', gait: 'walk', met: [3.0, 3.8, 5.0] },
  { id: 'run', name: '야외 러닝', icon: '🏃', photo: 'cd_outdoor', mode: 'distance', gait: 'run', met: [8.0, 9.8, 11.5] },
  { id: 'stairs', name: '천국의 계단 (스텝밀)', icon: '🪜', photo: 'cd_stepmill', met: [6.0, 8.8, 11.0] },
  { id: 'stepper', name: '스테퍼 (스테어마스터)', icon: '🦵', photo: 'cd_stairmaster', met: [5.0, 7.0, 9.0] },
  { id: 'cycle', name: '실내 사이클', icon: '🚴', photo: 'cd_cycle', mode: 'distance', met: [4.8, 6.8, 8.8] },
  { id: 'recumbent', name: '리컴번트 바이크 (등받이 사이클)', icon: '🚴', photo: 'cd_recumbent', mode: 'distance', met: [3.5, 5.5, 7.0] },
  { id: 'elliptical', name: '일립티컬 (크로스 트레이너)', icon: '⛷️', photo: 'cd_elliptical', met: [4.0, 5.0, 7.0] },
  { id: 'rowing', name: '로잉머신', icon: '🚣', photo: 'cd_rowing', mode: 'distance', met: [4.8, 7.0, 8.5] },
  { id: 'jumprope', name: '줄넘기', icon: '🪢', photo: 'cd_jumprope', met: [8.8, 10.0, 12.0] },
  { id: 'bike', name: '야외 자전거', icon: '🚲', photo: 'cd_bike', mode: 'distance', met: [4.0, 6.8, 10.0] },
  { id: 'swim', name: '수영', icon: '🏊', mode: 'distance', met: [5.8, 8.3, 9.8] },
  { id: 'hike', name: '등산', icon: '⛰️', mode: 'distance', met: [5.3, 6.5, 8.0] },
  { id: 'hiit', name: 'HIIT · 서킷', icon: '🔥', met: [6.0, 8.0, 10.0] },
  { id: 'boxing', name: '복싱 · 킥복싱', icon: '🥊', met: [5.5, 7.8, 10.0] },
  { id: 'sports', name: '구기 운동 (축구·농구·배드민턴)', icon: '⚽', met: [4.5, 6.5, 8.0] },
  { id: 'etc', name: '기타 유산소', icon: '💨', met: [3.5, 5.5, 8.0] },
];
export const CARDIO_BY_ID = Object.fromEntries(CARDIO_TYPES.map(t => [t.id, t]));
export const LEVELS = ['가볍게', '보통', '힘들게'];
// 세계보건기구(WHO) 권장: 중강도 유산소 주 150분 이상
export const WEEKLY_GOAL_MIN = 150;

// 걷기·달리기 산소 소비량(ACSM): 속도는 m/분, 경사는 비율
const gaitMet = (gait, kmh, inclinePct = 0) => {
  const v = (kmh * 1000) / 60;
  const g = (inclinePct || 0) / 100;
  const vo2 = gait === 'run' ? 3.5 + 0.2 * v + 0.9 * v * g : 3.5 + 0.1 * v + 1.8 * v * g;
  return vo2 / 3.5;
};

// 한 번의 유산소 기록에서 평균 속도·페이스·MET·칼로리를 계산
export const cardioStats = (entry, weightKg) => {
  const t = CARDIO_BY_ID[entry.type] || CARDIO_BY_ID.etc;
  const min = Number(entry.min) || 0;
  const h = min / 60;
  let speed = null;
  if (t.mode === 'treadmill') speed = Number(entry.speed) || t.speed;
  else if (Number(entry.km) > 0 && h > 0) speed = Number(entry.km) / h;
  const km = t.mode === 'treadmill' ? (speed || 0) * h : Number(entry.km) || 0;
  let met = t.met[entry.level ?? 1] ?? t.met[1];
  if (t.gait && speed) met = gaitMet(t.gait, speed, t.mode === 'treadmill' ? entry.incline : 0);
  const auto = Math.round(met * (Number(weightKg) || 70) * h);
  const kcal = Number(entry.kcal) > 0 ? Math.round(Number(entry.kcal)) : auto;
  const pace = km > 0 && min > 0 ? min / km : null; // 1km에 걸리는 분
  return { km: Math.round(km * 100) / 100, speed: speed ? Math.round(speed * 10) / 10 : null, met: Math.round(met * 10) / 10, kcal, auto, pace };
};

export const fmtPace = (pace) => {
  if (!pace) return '';
  const sec = Math.round(pace * 60);
  return `${Math.floor(sec / 60)}'${String(sec % 60).padStart(2, '0')}"`;
};
