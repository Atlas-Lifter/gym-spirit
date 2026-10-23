// 부위별 근육 회복도
// 운동이 끝난 시각부터 지난 시간을 기준으로, 그 운동이 얼마나 힘들었는지(세트 수·무게 강도·RPE)에 따라 회복을 계산한다.
// - 세트 자극: 완료한 본 세트 1개 = 1. 그 종목 최고 기록 대비 무게가 무거울수록(추정 1RM 비율) 더 크게, RPE가 높을수록 더 크게.
//   워밍업은 빼고, 드랍세트는 0.8. 주동근 부위는 100%, 협응근 부위는 40%만 반영.
// - 회복 시간: 부위별 기본 시간(큰 근육일수록 길다)에 자극량을 곱한다. 6세트 정도의 보통 세션이 기본 시간과 같다.
// - 피로는 운동 직후 가장 크고 시간이 지나며 지수적으로 줄어든다. 여러 번 운동했으면 남은 피로를 더한다.

export const RECOVERY_GROUPS = ['가슴', '등', '하체', '어깨', '팔', '복근'];
const BASE_HOURS = { 가슴: 48, 등: 48, 하체: 60, 어깨: 42, 팔: 36, 복근: 24 };
const MUSCLE_GROUP = {
  pec_upper: '가슴', pec_lower: '가슴',
  delt_front: '어깨', delt_side: '어깨', delt_rear: '어깨',
  biceps: '팔', triceps: '팔', forearm: '팔',
  abs: '복근', obliques: '복근', serratus: '복근',
  lats: '등', traps: '등', midback: '등', erectors: '등',
  quads: '하체', adductors: '하체', glutes: '하체', hamstrings: '하체', calves: '하체', tibialis: '하체',
};
const LOOKBACK_DAYS = 6;
const RECOVERED = 0.1; // 남은 피로 10% 이하면 회복으로 본다

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const e1rm = (w, r) => (r <= 1 ? w : w * (1 + r / 30));
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 운동이 끝난 시각. 저장 시각이 없는 예전 기록은 그날 저녁 6시로 보고, 아직 오지 않은 시각이면 1시간 전으로 본다
export const sessionEndTime = (key, workoutTimes = {}, now = new Date()) => {
  const saved = workoutTimes[key] ? new Date(workoutTimes[key]) : null;
  if (saved && !isNaN(saved)) return saved;
  const [y, m, d] = key.split('-').map(Number);
  const guess = new Date(y, m - 1, d, 18, 0, 0);
  return guess > now ? new Date(now.getTime() - 3600 * 1000) : guess;
};

// 세트 하나의 자극량
const setStimulus = (set, best) => {
  if (!set?.completed || set.type === 'W') return 0;
  const w = parseFloat(set.weight) || 0, r = parseInt(set.reps, 10) || 0;
  if (r <= 0) return 0;
  let f = 0.9; // 맨몸이거나 비교할 기록이 없을 때
  if (w > 0 && best > 0) {
    const rel = clamp(e1rm(w, r) / best, 0.4, 1);
    f = 0.55 + 0.75 * (rel - 0.4) / 0.6; // 최고 기록의 40% → 0.55, 100% → 1.3
  }
  const rpe = parseFloat(set.rpe);
  if (rpe >= 9) f *= 1.15; else if (rpe > 0 && rpe <= 6) f *= 0.8;
  if (set.type === 'D') f *= 0.8;
  return f;
};

// 하루치 운동에서 부위별 자극량
const sessionStimulus = (session, musclesOf, idOf, bestOf) => {
  const stim = Object.fromEntries(RECOVERY_GROUPS.map(g => [g, 0]));
  (session || []).forEach(ex => {
    const best = bestOf(idOf(ex));
    const sum = (ex.sets || []).reduce((a, s) => a + setStimulus(s, best), 0);
    if (!sum) return;
    const { p = [], s = [] } = musclesOf(ex) || {};
    const prim = new Set(p.map(m => MUSCLE_GROUP[m]).filter(Boolean));
    const sec = new Set(s.map(m => MUSCLE_GROUP[m]).filter(g => g && !prim.has(g)));
    prim.forEach(g => { stim[g] += sum; });
    sec.forEach(g => { stim[g] += sum * 0.4; });
  });
  return stim;
};

const relDay = (t, now) => {
  const a = new Date(t); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  const days = Math.round((b - a) / 86400000);
  const hm = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
  return days === 0 ? `오늘 ${hm}` : days === 1 ? `어제 ${hm}` : `${days}일 전`;
};

// 부위별 회복 상태: { percent(0~100), hoursLeft, lastAt, stimulus, text, color }
export const computeRecovery = ({ workouts = {}, workoutTimes = {}, now = new Date(), musclesOf, idOf, bestOf }) => {
  const out = Object.fromEntries(RECOVERY_GROUPS.map(g => [g, { percent: 100, hoursLeft: 0, lastAt: null, stimulus: 0, fatigue: 0 }]));
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= LOOKBACK_DAYS; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const session = workouts[key];
    if (!Array.isArray(session) || !session.length) continue;
    const end = sessionEndTime(key, workoutTimes, now);
    const t = Math.max(0, (now - end) / 3600000);
    const stim = sessionStimulus(session, musclesOf, idOf, bestOf);
    RECOVERY_GROUPS.forEach(g => {
      const S = stim[g];
      if (S <= 0.05) return;
      const H = BASE_HOURS[g] * clamp(0.55 + S / 12, 0.55, 1.6); // 회복에 걸리는 시간
      const drop = clamp(S / 8, 0.15, 1); // 운동 직후 피로 (8세트 이상이면 최대)
      const o = out[g];
      o.fatigue += drop * Math.exp(-3 * t / H);
      const need = drop > RECOVERED ? (H / 3) * Math.log(drop / RECOVERED) : 0;
      o.hoursLeft = Math.max(o.hoursLeft, need - t);
      o.stimulus += S;
      if (!o.lastAt || end > o.lastAt) o.lastAt = end;
    });
  }
  RECOVERY_GROUPS.forEach(g => {
    const o = out[g];
    const pct = Math.round(100 * (1 - clamp(o.fatigue, 0, 1)));
    o.percent = pct >= 97 ? 100 : pct;
    o.hoursLeft = o.percent >= 90 ? 0 : Math.max(1, Math.ceil(o.hoursLeft));
    const when = o.lastAt ? relDay(o.lastAt, now) : '';
    if (o.percent >= 90) {
      o.text = o.lastAt ? `${when} 운동 · 회복 완료 (${o.percent}%)` : '완전 회복 (100%)';
      o.color = 'text-emerald-500';
    } else {
      o.text = `${when} 운동 · ${o.percent < 50 ? '피로함' : '회복 중'} ${o.percent}% · 약 ${o.hoursLeft}시간 남음`;
      o.color = o.percent < 50 ? 'text-rose-500' : 'text-amber-500';
    }
  });
  return out;
};
