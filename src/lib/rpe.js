// RPE(체감 강도) 계산을 한곳에서
// · RPE = 10 - 남은 반복(RIR). RPE 8 = 2개 더 할 수 있었음
// · 무게 ↔ 반복 관계는 RTS(Tuchscherer) RPE 표의 RPE 10 열을 쓴다. 표에 없는 13회 이상은 회당 약 2.2%씩 줄여 이어 간다
//   (예전 Epley 식은 가벼운 무게에서 가능한 반복을 너무 많게 잡아 자동 RPE 가 낮게 나왔다)
// · 자동 RPE 는 '추정'이라 다음 무게 추천에는 쓰지 않고, 직접 적은 RPE 만 쓴다 (progress.js)

// 실패까지 n회 가능한 무게의 1RM 대비 비율 (n = 1~12)
const PCT = [1, 0.955, 0.922, 0.892, 0.863, 0.837, 0.811, 0.786, 0.762, 0.739, 0.707, 0.68];
export const pctForReps = (n) => {
  if (!(n > 0)) return 1;
  if (n <= 1) return 1;
  if (n <= 12) { const i = Math.floor(n) - 1; return PCT[i] + (n - Math.floor(n)) * ((PCT[i + 1] ?? PCT[i] - 0.022) - PCT[i]); }
  return Math.max(0.4, 0.68 - (n - 12) * 0.022);
};
// 1RM 대비 이 무게로 실패까지 몇 회 가능한지 (pctForReps 의 역)
export const maxRepsAt = (load, oneRM) => {
  if (!(load > 0) || !(oneRM > 0)) return null;
  const pct = load / oneRM;
  if (pct >= 1) return 1;
  let lo = 1, hi = 40;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (pctForReps(mid) > pct) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};
// 세트 하나로 추정한 1RM. RPE 를 알면 남은 반복까지 넣어서 더 정확하게
export const e1rmRpe = (load, reps, rpe = 10) => {
  if (!(load > 0) || !(reps > 0)) return 0;
  const rir = rpe > 0 ? Math.max(0, Math.min(4, 10 - rpe)) : 0;
  return load / pctForReps(reps + rir);
};
// 이 무게·반복의 추정 RPE (6~10, 0.5 단위). 1RM 보다 많이 해냈으면 over: 기준 1RM 이 낮게 잡힌 것이라 숫자를 내지 않는다
export const estimateRpe = (load, reps, oneRM) => {
  const max = maxRepsAt(load, oneRM);
  if (max === null || !(reps > 0)) return null;
  if (reps > max + 0.75) return { rpe: null, over: true, max };
  const rpe = Math.max(6, Math.min(10, 10 - (max - reps)));
  return { rpe: Math.round(rpe * 2) / 2, over: false, max };
};
// 이 무게로 목표 RPE 에 맞는 반복 수
export const repsForRpe = (load, oneRM, rpe = 8) => {
  const max = maxRepsAt(load, oneRM);
  return max === null ? null : Math.max(1, Math.floor(max - (10 - rpe)));
};

// RPE 고르기 칸에 보여줄 뜻
export const RPE_SCALE = [
  { v: 6, short: '가벼움', text: '4개 이상 더 가능 · 워밍업 느낌' },
  { v: 7, short: '3개 남음', text: '3개 더 가능 · 속도가 아직 빠름' },
  { v: 7.5, short: '2~3개', text: '2~3개 더 가능' },
  { v: 8, short: '2개 남음', text: '2개 더 가능 · 근성장에 가장 많이 쓰는 강도' },
  { v: 8.5, short: '1~2개', text: '1~2개 더 가능' },
  { v: 9, short: '1개 남음', text: '1개 더 가능 · 마지막 반복이 느려짐' },
  { v: 9.5, short: '어쩌면 1개', text: '1개 더 할 수 있을지 모름' },
  { v: 10, short: '한계', text: '더는 못 함 (실패 직전)' },
];
export const rpeMeaning = (v) => {
  const n = parseFloat(v);
  if (!(n > 0)) return null;
  return RPE_SCALE.reduce((a, s) => (Math.abs(s.v - n) < Math.abs(a.v - n) ? s : a), RPE_SCALE[0]);
};
// 색: 7 이하 여유(초록), 7.5~8.5 적정(노랑), 9 이상 한계 근처(빨강)
export const rpeTone = (v) => {
  const n = parseFloat(v);
  if (!(n > 0)) return 'none';
  if (n >= 9) return 'hard';
  if (n >= 7.5) return 'mid';
  return 'easy';
};
