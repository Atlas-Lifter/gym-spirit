// 신기록(PR) 찾기와 다음 무게 추천
// · 계산은 모두 여기서 한다 (화면은 결과만 보여 준다). 추천은 자동으로 바뀌지 않고, 사용자가 '적용'을 눌러야 들어간다
// · 무게는 실제 부하로 비교한다 (맨몸 종목은 체중 포함, 어시스트는 체중 - 도움 무게)

export const e1rm = (w, r) => (r <= 1 ? w : w * (1 + r / 30));
const round1 = (v) => Math.round(v * 10) / 10;
const num = (v) => parseFloat(v) || 0;
const int = (v) => parseInt(v, 10) || 0;
const isWork = (s) => s && s.completed && (s.type || '-') !== 'W' && int(s.reps) > 0;

// 이 종목의 지난 기록 (오늘 이전 날짜, 최근 순). loadOf(set) 은 실제 부하
export const exerciseHistory = (workouts, exId, beforeDate, idOf, loadOf) => Object.keys(workouts || {})
  .filter(d => d < beforeDate && Array.isArray(workouts[d]))
  .sort((a, b) => (a < b ? 1 : -1))
  .map(date => {
    const sets = workouts[date].filter(ex => String(idOf(ex)) === String(exId)).flatMap(ex => ex.sets || []).filter(isWork)
      .map(s => ({ load: loadOf(s), reps: int(s.reps), rpe: num(s.rpe), weight: num(s.weight), type: s.type || '-' }));
    return { date, sets };
  })
  .filter(h => h.sets.length);

// 지금까지의 최고 기록 (지난 기록 + 오늘 앞서 완료한 세트)
export const bestsOf = (sets) => {
  let e = 0, w = 0;
  sets.forEach(s => {
    if (s.load > 0 && s.reps > 0 && s.reps <= 12) e = Math.max(e, e1rm(s.load, s.reps));
    if (s.load > 0) w = Math.max(w, s.load);
  });
  // 이 무게 이상에서 해낸 최다 반복
  const repsAt = (load) => sets.filter(s => s.load >= load - 0.01).reduce((m, s) => Math.max(m, s.reps), 0);
  return { e1rm: e, weight: w, repsAt };
};

// 방금 완료한 세트가 신기록인지. 처음 하는 종목(지난 기록 없음)은 신기록으로 치지 않는다 (퀘스트의 PR 기준과 같다)
// 결과: [{ kind: 'e1rm' | 'weight' | 'reps', label, value, prev }]
export const detectPR = (set, priorSets) => {
  if (!priorSets.length || !(set.load > 0) || !(set.reps > 0) || set.type === 'W') return [];
  const b = bestsOf(priorSets);
  const out = [];
  if (set.load > b.weight + 0.01) out.push({ kind: 'weight', label: '최고 중량', value: `${round1(set.load)}kg`, prev: `${round1(b.weight)}kg` });
  if (set.reps <= 12) {
    const now = e1rm(set.load, set.reps);
    if (now > b.e1rm + 0.5) out.push({ kind: 'e1rm', label: '추정 1RM', value: `${round1(now)}kg`, prev: `${round1(b.e1rm)}kg` });
  }
  const prevReps = b.repsAt(set.load);
  if (!out.length && prevReps > 0 && set.reps > prevReps) out.push({ kind: 'reps', label: `${round1(set.load)}kg 최다 반복`, value: `${set.reps}회`, prev: `${prevReps}회` });
  return out;
};

// 수준 위치(0=초급 … 4=엘리트) 구하기: 기준표 구간 사이를 이어서 본다 (strengthRatios.js 와 같은 방식)
const levelIn = (w, t) => {
  if (!(w > 0) || !t) return null;
  for (let i = 0; i < t.length - 1; i++) if (w <= t[i + 1]) return Math.max(-1, i + (w - t[i]) / (t[i + 1] - t[i]));
  const n = t.length - 1;
  return n + (w - t[n]) / (t[n] - t[n - 1]);
};
const LEVEL = ['초급', '입문', '중급', '상급', '엘리트'];

// 다음 무게 추천 (이중 진행: 정해 둔 반복 수를 채우면 무게 ↑, 아니면 같은 무게로 횟수 ↑, 3번 연속 정체면 디로드)
// rule: 기구 규칙 (step: 한 번에 올리는 무게), recovery: 이 부위 회복도(0~100, 모르면 null)
// body: 내 체중·성별에 맞춘 이 종목 기준표 { table, bodyWeight, assumed } (strengthRatios.bodyStandard, 없으면 null)
// · 지난 기록보다 무조건 올리지 않는다. 최근 기록으로 잰 지금 근력(추정 1RM)이 같은 체격 평균의 어느 수준인지 보고,
//   수준이 높을수록 반복 수를 더 채워야 무게를 올린다 (초보는 빨리 늘고, 상급자는 천천히 는다)
// · 가벼운 무게에서 한 칸 올리는 게 10% 넘게 무거워지면(예: 덤벨 6→8kg) 반복을 더 채운 뒤 올린다
// 결과: { kind: 'up' | 'reps' | 'same' | 'deload' | 'rest', weight, reps, text, why } 또는 null(지난 기록 없음)
export const suggestNext = (history, rule, recovery = null, body = null) => {
  const last = history[0];
  if (!last) return null;
  const main = last.sets.filter(s => s.type !== 'D');
  const pool = main.length ? main : last.sets;
  // 지난번 가장 무거운 세트 (같으면 반복이 많은 세트, 그것도 같으면 더 힘들었던 세트로 보수적으로)
  const top = pool.reduce((a, s) => (!a || s.weight > a.weight || (s.weight === a.weight && (s.reps > a.reps || (s.reps === a.reps && s.rpe > a.rpe))) ? s : a), null);
  if (!top) return null;
  const step = Math.abs(rule?.step || 2.5);
  const bodyweight = rule?.key === 'bodyweight' && !(top.weight > 0);
  const assist = rule?.key === 'assist';
  const lastText = bodyweight ? `${top.reps}회` : `${top.weight}kg × ${top.reps}회${top.rpe ? ` (RPE ${top.rpe})` : ''}`;
  const roundW = (w) => Math.max(0, Math.round(w / step) * step);

  // 정체: 최근 3번의 최고 추정 1RM 이 그 전 최고보다 나아지지 않았다
  const tops = history.slice(0, 4).map(h => h.sets.reduce((m, s) => Math.max(m, s.reps <= 12 ? e1rm(s.load, s.reps) : 0), 0));
  const stalled = tops.length >= 4 && Math.max(tops[0], tops[1], tops[2]) <= tops[3] + 0.5;

  if (recovery !== null && recovery < 60) {
    return { kind: 'rest', weight: top.weight, reps: top.reps, text: bodyweight ? `${top.reps}회 유지` : `${top.weight}kg × ${top.reps}회 유지`,
      why: `이 부위 회복도 ${recovery}% — 오늘은 무게를 올리지 말고 지난번만큼만 해 보세요.` };
  }
  if (stalled && !bodyweight && !assist && top.weight > 0) {
    const w = roundW(top.weight * 0.9);
    return { kind: 'deload', weight: w, reps: top.reps, text: `${w}kg × ${top.reps}회`,
      why: `최근 3번 기록이 그대로예요. 이번엔 10% 가볍게(디로드) 자세를 다듬고 다음에 다시 올려요.` };
  }
  if (bodyweight) {
    const r = top.reps + (top.rpe > 0 && top.rpe <= 8 ? 2 : 1);
    return { kind: 'reps', weight: top.weight, reps: r, text: `${r}회`, why: `지난번 ${lastText} → 한두 개 더 해 보세요.` };
  }
  if (assist) {
    const easyA = top.rpe > 0 ? top.rpe <= 8 : top.reps >= 10;
    const w = Math.max(0, top.weight - step);
    return easyA
      ? { kind: 'up', weight: w, reps: top.reps, text: `보조 ${w}kg × ${top.reps}회`, why: `지난번 ${lastText} → 도움을 ${step}kg 줄여 보세요.` }
      : { kind: 'reps', weight: top.weight, reps: top.reps + 1, text: `보조 ${top.weight}kg × ${top.reps + 1}회`, why: `지난번 ${lastText} → 같은 도움으로 1회 더.` };
  }

  // 지금 근력: 최근 6번 기록 중 최고 추정 1RM → 같은 체격 평균과 비교한 수준
  const nowRM = history.slice(0, 6).reduce((m, h) => Math.max(m, ...h.sets.map(s => (s.load > 0 && s.reps <= 15 ? e1rm(s.load, s.reps) : 0))), 0);
  const lv = body?.table ? levelIn(nowRM, body.table) : null;
  const p = lv ?? 1.5; // 기준표가 없는 종목은 입문~중급 사이로 본다
  const bwText = body?.table ? `${body.assumed ? '체중 미입력 · 평균 체격' : `체중 ${body.bodyWeight}kg`} 기준 ${LEVEL[Math.max(0, Math.min(4, Math.floor(p)))]} 수준` : '';
  // 무게를 올리기 전에 채울 반복 수: 고중량(6회 이하)과 근비대(7회 이상) 구간을 나눠서, 수준이 높을수록 많이
  const heavy = top.reps <= 6;
  let goal = heavy ? (p < 1 ? 5 : 6) : (p < 1 ? 8 : p < 2 ? 10 : 12);
  const jump = top.weight > 0 ? step / top.weight : 0;
  const bigJump = !heavy && jump > 0.1 && p >= 1;
  if (bigJump) goal = Math.max(goal, 15);
  // 같은 무게로 한 세트들이 고르게 반복을 채웠는지 (첫 세트만 잘 되고 뒤에서 무너지면 아직)
  const sameW = pool.filter(s => Math.abs(s.weight - top.weight) < 0.01);
  const minReps = sameW.reduce((m, s) => Math.min(m, s.reps), top.reps);
  const steady = sameW.length < 2 || minReps >= goal - 2;
  const rpeOk = p >= 3 ? 7.5 : 8;
  // RPE 를 적었으면 여유(RPE)로, 안 적었으면 목표 반복을 고르게 채웠는지로 본다
  const easy = top.rpe > 0 ? (top.rpe <= rpeOk && (!bigJump || top.reps >= goal - 3)) : (top.reps >= goal && steady);
  const hard = top.rpe >= 9.5;
  const levelNote = bwText ? ` (${bwText})` : '';

  if (hard) {
    return { kind: 'same', weight: top.weight, reps: top.reps, text: `${top.weight}kg × ${top.reps}회`,
      why: `지난번 ${lastText}로 한계에 가까웠어요. 같은 무게로 자세를 더 깔끔하게 해 보세요.` };
  }
  if (easy) {
    const w = Math.round((top.weight + step) * 100) / 100;
    // 무게를 올리면 반복은 지금 근력보다 살짝(2%) 높은 정도로 맞춘다. 초급은 반복을 그대로 유지
    const floor = heavy ? 3 : 8;
    const r = p < 1 ? top.reps : Math.max(floor, Math.min(top.reps, Math.round(30 * ((e1rm(top.load || top.weight, top.reps) * 1.02) / (w + (top.load - top.weight || 0)) - 1))));
    return { kind: 'up', weight: w, reps: r, text: `${w}kg × ${r}회`,
      why: `지난번 ${lastText}${top.rpe > 0 ? ' 여유 있게 했어요' : ` — 목표 ${goal}회를 채웠어요`} → +${step}kg${r < top.reps ? `, ${r}회부터` : ''} 도전!${levelNote}` };
  }
  // 아직 무게를 올릴 때가 아님: 같은 무게로 반복을 늘린다 (목표를 넘기진 않게)
  const r = top.reps + 1;
  const reason = bigJump ? `한 칸(+${step}kg) 올리면 ${Math.round(jump * 100)}% 무거워져요. ${goal}회를 채운 뒤 올려요.`
    : top.rpe > 0 ? `RPE ${rpeOk} 이하로 할 수 있을 때 올려요.`
    : top.reps < goal ? `${goal}회를 채우면 무게를 올려요.`
    : `세트마다 반복이 고르지 않았어요(최저 ${minReps}회). 모든 세트에서 ${goal - 2}회 이상 하면 올려요.`;
  return { kind: 'reps', weight: top.weight, reps: r, text: `${top.weight}kg × ${r}회`, why: `지난번 ${lastText} → ${reason}${levelNote}` };
};
