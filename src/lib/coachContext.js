// AI 코치에게 보낼 '내 기록' 요약 (짧은 글). 이름·이메일 같은 개인 정보는 넣지 않는다
const DAYS = 14;
const r1 = (v) => Math.round(v * 10) / 10;
const num = (v) => parseFloat(v) || 0;
const int = (v) => parseInt(v, 10) || 0;
const done = (s) => s && s.completed && (s.type || '-') !== 'W' && int(s.reps) > 0;

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 종목 하나: "벤치프레스 4세트 (최고 60kg×8, RPE 8)"
const exLine = (ex, nameOf) => {
  const sets = (ex.sets || []).filter(done);
  if (!sets.length) return null;
  const top = sets.reduce((b, s) => (num(s.weight) * (1 + int(s.reps) / 30) > num(b.weight) * (1 + int(b.reps) / 30) ? s : b), sets[0]);
  const rpe = sets.map(s => num(s.rpe)).filter(Boolean);
  const w = num(top.weight);
  return `${nameOf(ex)} ${sets.length}세트 (최고 ${w ? `${w}kg×` : '맨몸 '}${int(top.reps)}${rpe.length ? `, RPE ${Math.max(...rpe)}` : ''})`;
};

export function buildCoachContext({ profile = {}, bodyStats = {}, bodyGoal, workouts = {}, nameOf, recovery = {}, bestLifts = {}, todayMacros, todayDiet, cardioMinOn, now = new Date() }) {
  const out = [];
  out.push(`오늘: ${dateKey(now)} (${'일월화수목금토'[now.getDay()]}요일)`);

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

  const rec = Object.entries(recovery).map(([g, o]) => `${g} ${o.percent}%${o.percent < 90 && o.hoursLeft ? `(${o.hoursLeft}시간 남음)` : ''}`);
  if (rec.length) out.push(`부위별 회복도: ${rec.join(', ')}`);

  // 최근 2주 운동 (최신 순)
  const lines = [];
  let sessions = 0;
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const ses = workouts[key];
    const cardio = cardioMinOn ? cardioMinOn(key) : 0;
    const exs = Array.isArray(ses) ? ses.map(ex => exLine(ex, nameOf)).filter(Boolean) : [];
    if (!exs.length && !cardio) continue;
    if (exs.length) sessions++;
    lines.push(`- ${key.slice(5)}: ${[...exs, cardio ? `유산소 ${cardio}분` : null].filter(Boolean).join(' / ')}`);
  }
  out.push(lines.length ? `최근 ${DAYS}일 운동 (${sessions}회):\n${lines.join('\n')}` : `최근 ${DAYS}일 운동 기록 없음`);

  if (todayMacros) {
    const foods = (todayDiet?.meals || []).flatMap(m => (m.items || []).map(it => `${it.name} ${it.weight}${it.unit || 'g'}`));
    out.push(`오늘 먹은 것: ${Math.round(todayMacros.cal)}kcal, 탄 ${r1(todayMacros.c)}g, 단 ${r1(todayMacros.p)}g, 지 ${r1(todayMacros.f)}g${foods.length ? ` (${foods.slice(0, 20).join(', ')})` : ' (기록 없음)'}`);
  }
  return out.join('\n');
}
