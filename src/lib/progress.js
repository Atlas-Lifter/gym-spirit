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

// 다음 무게 추천 (이중 진행: 여유 있으면 무게 ↑, 빠듯하면 같은 무게로 횟수 ↑, 3번 연속 정체면 디로드)
// rule: 기구 규칙 (step: 한 번에 올리는 무게), recovery: 이 부위 회복도(0~100, 모르면 null)
// 결과: { kind: 'up' | 'reps' | 'same' | 'deload' | 'rest', weight, reps, text, why } 또는 null(지난 기록 없음)
export const suggestNext = (history, rule, recovery = null) => {
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
  const easy = top.rpe > 0 ? top.rpe <= 8 : top.reps >= 8;
  const hard = top.rpe >= 9.5;
  if (bodyweight) {
    const r = top.reps + (easy ? 2 : 1);
    return { kind: 'reps', weight: top.weight, reps: r, text: `${r}회`, why: `지난번 ${lastText} → 한두 개 더 해 보세요.` };
  }
  if (assist) {
    const w = Math.max(0, top.weight - step);
    return easy
      ? { kind: 'up', weight: w, reps: top.reps, text: `보조 ${w}kg × ${top.reps}회`, why: `지난번 ${lastText} → 도움을 ${step}kg 줄여 보세요.` }
      : { kind: 'reps', weight: top.weight, reps: top.reps + 1, text: `보조 ${top.weight}kg × ${top.reps + 1}회`, why: `지난번 ${lastText} → 같은 도움으로 1회 더.` };
  }
  if (hard) {
    return { kind: 'same', weight: top.weight, reps: top.reps, text: `${top.weight}kg × ${top.reps}회`,
      why: `지난번 ${lastText}로 한계에 가까웠어요. 같은 무게로 자세를 더 깔끔하게 해 보세요.` };
  }
  if (easy) {
    const w = Math.round((top.weight + step) * 100) / 100;
    return { kind: 'up', weight: w, reps: top.reps, text: `${w}kg × ${top.reps}회`, why: `지난번 ${lastText}로 여유가 있었어요 → +${step}kg 도전!` };
  }
  return { kind: 'reps', weight: top.weight, reps: top.reps + 1, text: `${top.weight}kg × ${top.reps + 1}회`,
    why: `지난번 ${lastText} → 같은 무게로 1회 더 하면 다음엔 무게를 올려요.` };
};
