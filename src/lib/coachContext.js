// AI 코치에게 보낼 '내 기록' 요약 (짧은 글). 이름·이메일 같은 개인 정보는 넣지 않는다
// 부위 추천에 쓸 판단(오늘 해도 되는 부위, 요일별 습관)은 여기서 미리 계산해 준다 — 모델이 숫자를 잘못 읽어도 틀리지 않게
const DAYS = 14;
const PATTERN_WEEKS = 8;
export const READY_PERCENT = 80; // 이 회복도 이상인 부위만 운동 추천
const WEEKDAY = '일월화수목금토';
const r1 = (v) => Math.round(v * 10) / 10;
const num = (v) => parseFloat(v) || 0;
const int = (v) => parseInt(v, 10) || 0;
const done = (s) => s && s.completed && (s.type || '-') !== 'W' && int(s.reps) > 0;

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayBefore = (now, n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
const top = (counts, n) => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);

// 종목 하나: "벤치프레스 4세트 (최고 60kg×8, RPE 8)"
const exLine = (ex, nameOf) => {
  const sets = (ex.sets || []).filter(done);
  if (!sets.length) return null;
  const best = sets.reduce((b, s) => (num(s.weight) * (1 + int(s.reps) / 30) > num(b.weight) * (1 + int(b.reps) / 30) ? s : b), sets[0]);
  const rpe = sets.filter(s => !s.rpeAuto).map(s => num(s.rpe)).filter(Boolean); // 직접 적은 RPE 만
  const w = num(best.weight);
  return `${nameOf(ex)} ${sets.length}세트 (최고 ${w ? `${w}kg×` : '맨몸 '}${int(best.reps)}${rpe.length ? `, RPE ${Math.max(...rpe)}` : ''})`;
};

// 하루 운동에서 실제로 한(완료 세트가 있는) 종목과 부위
const dayInfo = (session, groupsOf, nameOf) => {
  const exs = (Array.isArray(session) ? session : []).filter(ex => (ex.sets || []).some(done));
  const groups = new Set(exs.flatMap(ex => groupsOf(ex)));
  return { exs, groups: [...groups], names: exs.map(ex => nameOf(ex)) };
};

// 요일별 습관: 최근 8주 동안 요일마다 몇 번 운동했고 주로 어떤 부위·종목을 했는지
const weekdayPattern = (workouts, now, groupsOf, nameOf) => {
  const by = Array.from({ length: 7 }, () => ({ times: 0, groups: {}, names: {} }));
  for (let i = 1; i <= PATTERN_WEEKS * 7; i++) {
    const d = dayBefore(now, i);
    const info = dayInfo(workouts[dateKey(d)], groupsOf, nameOf);
    if (!info.exs.length) continue;
    const w = by[d.getDay()];
    w.times++;
    info.groups.forEach(g => { w.groups[g] = (w.groups[g] || 0) + 1; });
    new Set(info.names).forEach(n => { w.names[n] = (w.names[n] || 0) + 1; });
  }
  const total = by.reduce((s, w) => s + w.times, 0);
  if (total < 4) return null; // 기록이 너무 적으면 습관이라고 하기 어렵다
  const order = [1, 2, 3, 4, 5, 6, 0]; // 월요일부터
  const lines = order.map(day => {
    const w = by[day];
    if (w.times < 2) return `${WEEKDAY[day]}: 거의 쉼${w.times ? ` (${PATTERN_WEEKS}주 중 ${w.times}번)` : ''}`;
    const gs = top(w.groups, 3).filter(([, c]) => c >= Math.max(2, w.times / 2)).map(([g, c]) => `${g}(${c})`);
    const ns = top(w.names, 3).filter(([, c]) => c >= 2).map(([n]) => n);
    return `${WEEKDAY[day]}: ${PATTERN_WEEKS}주 중 ${w.times}번 운동${gs.length ? ` · 주로 ${gs.join(', ')}` : ' · 부위가 매번 다름'}${ns.length ? ` · 자주 한 종목 ${ns.join(', ')}` : ''}`;
  });
  return { lines, perWeek: r1(total / PATTERN_WEEKS), today: by[now.getDay()], by };
};

// 루틴 설정 화면의 '내 기록으로 채우기': 요일마다 절반 이상 한 부위 (기록이 적으면 null)
export const usualGroupsByWeekday = ({ workouts = {}, groupsOf = () => [], nameOf = () => '', now = new Date() }) => {
  const pat = weekdayPattern(workouts, now, groupsOf, nameOf);
  if (!pat) return null;
  return Object.fromEntries(pat.by.map((w, day) => [day, w.times < 2 ? [] : top(w.groups, 3).filter(([, c]) => c >= Math.max(2, w.times / 2)).map(([g]) => g)]));
};

// 내가 정한 루틴 → 오늘 할 차례
const joinGroups = (gs) => (gs && gs.length ? gs.join('·') : '휴식');
const routineLines = (routine, { workouts, now, groupsOf, nameOf, today, ready }) => {
  if (!routine || !routine.type) return ['▶ 내 루틴: 아직 안 알려줌 (요일별·분할 루틴이 있는지 모름)'];
  if (routine.type === 'none') return ['▶ 내 루틴: 정해진 루틴 없음 — 회복도와 이번 주 균형을 보고 그날그날 추천'];
  const out = [];
  let planned = [];
  if (routine.type === 'weekly') {
    const w = routine.weekly || {};
    out.push(`▶ 내 루틴 (요일별 고정): ${[1, 2, 3, 4, 5, 6, 0].map(d => `${WEEKDAY[d]} ${joinGroups(w[d])}`).join(' / ')}`);
    planned = w[now.getDay()] || [];
    out.push(`▶ 오늘(${WEEKDAY[now.getDay()]}) 루틴: ${joinGroups(planned)}`);
  } else if (routine.type === 'cycle') {
    const steps = (routine.cycle || []).filter(st => Array.isArray(st));
    if (!steps.length) return ['▶ 내 루틴: 분할 순환이지만 순서가 비어 있음'];
    out.push(`▶ 내 루틴 (분할 순환, 요일 상관없이 순서대로): ${steps.map((st, i) => `${i + 1}) ${joinGroups(st)}`).join(' → ')}`);
    // 가장 최근 운동이 몇 번째 차례였는지 부위가 가장 많이 겹치는 것으로 찾는다
    let last = null;
    for (let i = 0; i < 14 && !last; i++) {
      const info = i === 0 ? today : dayInfo(workouts[dateKey(dayBefore(now, i))], groupsOf, nameOf);
      if (info.exs.length) last = { info, i };
    }
    const fit = (gs) => steps.map((st, k) => [k, st.filter(g => gs.includes(g)).length]).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    if (!last || fit(last.info.groups)[1] === 0) {
      planned = steps[0];
      out.push(`▶ 오늘 차례: 1) ${joinGroups(steps[0])} (최근 운동이 루틴과 맞지 않아 처음부터)`);
    } else {
      const k = fit(last.info.groups)[0];
      const next = (k + 1) % steps.length;
      if (last.i === 0) {
        planned = [];
        out.push(`▶ 오늘 한 운동은 ${k + 1}) 차례 → 다음 운동 날 차례: ${next + 1}) ${joinGroups(steps[next])}`);
      } else {
        planned = steps[next];
        out.push(`▶ 지난 운동(${dateKey(dayBefore(now, last.i)).slice(5)})은 ${k + 1}) 차례 → 오늘 차례: ${next + 1}) ${joinGroups(steps[next])}`);
      }
    }
  }
  const notReady = planned.filter(g => g !== '유산소' && ready && !ready.includes(g));
  if (notReady.length) out.push(`▶ 오늘 루틴 부위 중 아직 쉬어야 할 부위: ${notReady.join(', ')} (회복 ${READY_PERCENT}% 미만이거나 오늘 이미 함)`);
  if (routine.note) out.push(`▶ 루틴 메모: ${String(routine.note).slice(0, 200)}`);
  return out;
};

export function buildCoachContext({ profile = {}, bodyStats = {}, bodyGoal, workouts = {}, liveSession, nameOf, groupsOf = () => [], recovery = {}, nextWeights = [], exerciseChoices = {}, coachRoutine, bestLifts = {}, todayMacros, todayDiet, cardioMinOn, now = new Date() }) {
  const out = [];
  const todayKey = dateKey(now);
  out.push(`오늘: ${todayKey} (${WEEKDAY[now.getDay()]}요일)`);

  const body = [
    profile.gender && `성별 ${profile.gender === 'female' ? '여' : '남'}`,
    profile.years != null && `운동 경력 ${profile.years}년`,
    num(bodyStats.weight) && `체중 ${num(bodyStats.weight)}kg`,
    num(bodyStats.muscle) && `골격근 ${num(bodyStats.muscle)}kg`,
    num(bodyStats.fat) && `체지방 ${num(bodyStats.fat)}%`,
  ].filter(Boolean);
  if (body.length) out.push(`몸: ${body.join(', ')}`);
  if (bodyGoal && Object.keys(bodyGoal).length) out.push(`목표: ${Object.entries(bodyGoal).map(([k, v]) => `${k} ${v}`).join(', ')}`);

  const lifts = Object.entries(bestLifts).map(([id, b]) => `${{ bp: '벤치', sq: '스쿼트', dl: '데드' }[id] || id} ${b.weight}kg×${b.reps} (추정 1RM ${Math.round(b.e1rm)}kg)`);
  if (lifts.length) out.push(`3대 최고 기록: ${lifts.join(', ')}`);

  // 오늘 이미 한 부위 (진행 중인 운동 포함), 어제 한 부위
  const live = Array.isArray(liveSession) && liveSession.some(ex => (ex.sets || []).some(done)) ? liveSession : null;
  const today = dayInfo(live || workouts[todayKey], groupsOf, nameOf);
  const yesterday = dayInfo(workouts[dateKey(dayBefore(now, 1))], groupsOf, nameOf);

  // 오늘 운동해도 되는 부위: 회복도 80% 이상이고 오늘 아직 안 한 부위
  const rec = Object.entries(recovery);
  let ready = null;
  if (rec.length) {
    out.push(`부위별 회복도: ${rec.map(([g, o]) => `${g} ${o.percent}%${o.percent < 90 && o.hoursLeft ? `(${o.hoursLeft}시간 남음)` : ''}`).join(', ')}`);
    ready = rec.filter(([g, o]) => o.percent >= READY_PERCENT && !today.groups.includes(g)).map(([g]) => g);
    const rest = rec.filter(([g, o]) => o.percent < READY_PERCENT || today.groups.includes(g))
      .map(([g, o]) => `${g}(${today.groups.includes(g) ? '오늘 이미 함' : `회복 ${o.percent}%`})`);
    out.push(`▶ 오늘 운동 추천 가능 부위 (회복 ${READY_PERCENT}% 이상, 오늘 안 한 부위): ${ready.length ? ready.join(', ') : '없음 — 오늘은 휴식·가벼운 유산소·스트레칭 권장'}`);
    if (rest.length) out.push(`▶ 오늘 쉬어야 할 부위: ${rest.join(', ')}`);
    // 루틴을 짤 때 쓸 종목 이름 (앱에 있는 이름 그대로)
    const choices = ready.filter(g => exerciseChoices[g]?.length).map(g => `${g}: ${exerciseChoices[g].join(', ')}`);
    if (choices.length) out.push(`▶ 부위별 종목 후보 (앱에 있는 이름):\n${choices.map(c => `- ${c}`).join('\n')}`);
  }
  out.push(...routineLines(coachRoutine, { workouts, now, groupsOf, nameOf, today, ready }));
  out.push(`오늘 한 운동: ${today.exs.length ? `${today.groups.join(', ')} (${today.names.join(', ')})${live ? ' — 지금 진행 중' : ''}` : '아직 없음'}`);
  if (yesterday.exs.length) out.push(`어제 한 운동: ${yesterday.groups.join(', ')} (${yesterday.names.join(', ')})`);

  // 이번 주(월요일부터) 한 부위
  const mondayGap = (now.getDay() + 6) % 7;
  const week = {};
  for (let i = 0; i <= mondayGap; i++) {
    const info = i === 0 ? today : dayInfo(workouts[dateKey(dayBefore(now, i))], groupsOf, nameOf);
    info.groups.forEach(g => { week[g] = (week[g] || 0) + 1; });
  }
  const weekLine = Object.entries(week).map(([g, c]) => `${g} ${c}회`);
  out.push(`이번 주 운동한 부위: ${weekLine.length ? weekLine.join(', ') : '아직 없음'}`);

  // 다음 무게: 앱이 지난 기록·RPE·정체 여부로 계산한 값
  if (nextWeights.length) {
    out.push(`▶ 앱이 계산한 다음 무게 (이 숫자를 그대로 쓸 것):\n${nextWeights.map(w => `- ${w.name} [${w.group}]: 다음 ${w.text} — ${w.why}`).join('\n')}`);
  }

  // 요일별 습관
  const pat = weekdayPattern(workouts, now, groupsOf, nameOf);
  if (pat) {
    const t = pat.today;
    const usual = top(t.groups, 3).filter(([, c]) => c >= Math.max(2, t.times / 2)).map(([g]) => g);
    out.push(`요일별 운동 습관 (최근 ${PATTERN_WEEKS}주, 주 평균 ${pat.perWeek}회):\n${pat.lines.map(l => `- ${l}`).join('\n')}`);
    out.push(`▶ 오늘(${WEEKDAY[now.getDay()]}) 평소 습관: ${t.times < 2 ? '보통 쉬는 날' : usual.length ? `주로 ${usual.join(', ')}` : '정해진 부위 없음'}`);
  } else {
    out.push('요일별 운동 습관: 기록이 적어 아직 파악 안 됨');
  }

  // 최근 2주 운동 (최신 순)
  const lines = [];
  let sessions = 0;
  for (let i = 0; i < DAYS; i++) {
    const key = dateKey(dayBefore(now, i));
    const ses = i === 0 && live ? live : workouts[key];
    const cardio = cardioMinOn ? cardioMinOn(key) : 0;
    const exs = Array.isArray(ses) ? ses.map(ex => exLine(ex, nameOf)).filter(Boolean) : [];
    if (!exs.length && !cardio) continue;
    if (exs.length) sessions++;
    lines.push(`- ${key.slice(5)}(${WEEKDAY[dayBefore(now, i).getDay()]}): ${[...exs, cardio ? `유산소 ${cardio}분` : null].filter(Boolean).join(' / ')}`);
  }
  out.push(lines.length ? `최근 ${DAYS}일 운동 (${sessions}회):\n${lines.join('\n')}` : `최근 ${DAYS}일 운동 기록 없음`);

  if (todayMacros) {
    const foods = (todayDiet?.meals || []).flatMap(m => (m.items || []).map(it => `${it.name} ${it.weight}${it.unit || 'g'}`));
    out.push(`오늘 먹은 것: ${Math.round(todayMacros.cal)}kcal, 탄 ${r1(todayMacros.c)}g, 단 ${r1(todayMacros.p)}g, 지 ${r1(todayMacros.f)}g${foods.length ? ` (${foods.slice(0, 20).join(', ')})` : ' (기록 없음)'}`);
  }
  return out.join('\n');
}
