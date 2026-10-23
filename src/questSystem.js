// 퀘스트·업적·레벨 계산. 운동/식단 기록에서 진행도를 계산하고, 보상(XP)을 받은 기록은 questState.claimed에 남긴다.
import { setLoad } from './weightRules.js';

export const dateKey = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};
export const mondayOf = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

const exTarget = (ex) => String(ex?.exercise?.target || ex?.target || '');
const exKey = (ex) => String(ex?.exercise?.id || ex?.id || ex?.exercise?.name || ex?.name || '');
const goodSets = (ex) => (ex?.sets || []).filter(s => s.completed && s.type !== 'W');
const e1rm = (w, r) => (r === 1 ? w : w * (1 + r / 30));

// ── 레벨 ────────────────────────────────────────────────────
// 레벨 n이 되려면 누적 100·(n-1) + 13.3·(n-1)² XP. 초반은 빠르게 오르고,
// 운동과 식단 퀘스트를 매일 꾸준히 하면 약 1년에 100레벨(약 14만 XP)에 닿는다.
// 100레벨이 끝이 아니라 '각성'하면 1레벨부터 다시 시작하고 각성 횟수가 쌓인다 (넘친 XP는 이어진다).
export const MAX_LEVEL = 100;
export const AWAKEN_NAME = '각성';
export const xpForLevel = (n) => Math.round(100 * (n - 1) + 13.3 * (n - 1) ** 2);
// 칭호 단계 (로드맵 팝업에도 쓴다). goal은 그 단계에서 해 볼 만한 목표
export const TITLE_STAGES = [
  { level: 1, title: '헬린이', icon: '🐣', goal: '운동 기록 첫 세트 완료하기 · 일일 퀘스트에 익숙해지기' },
  { level: 5, title: '운동 습관러', icon: '🌱', goal: '주 3회 운동을 2주 연속 지키기' },
  { level: 10, title: '짐 레귤러', icon: '🏃', goal: '가슴·등·하체·어깨·팔 5부위를 한 주에 모두 훈련' },
  { level: 20, title: '근성장 장인', icon: '💪', goal: '주간 60세트 달성 · 식단 기록 습관 만들기' },
  { level: 35, title: '아이언 워리어', icon: '⚔️', goal: '3대 300kg 도전 · 개인 신기록 꾸준히 갱신' },
  { level: 50, title: '철인', icon: '🦾', goal: '30일 연속 출석 · 누적 볼륨 10만kg' },
  { level: 70, title: '짐 마스터', icon: '🏆', goal: '3대 400kg · 모든 업적 골드 이상' },
  { level: 85, title: '전설의 철인', icon: '🔥', goal: '누적 3,000세트 · 꺼지지 않는 연속 출석' },
  { level: 100, title: 'GYM SPIRIT 레전드', icon: '👑', goal: '1년간 매일 쌓은 꾸준함의 증명 · 각성 도전' },
];
// 매일 운동·식단 퀘스트를 꾸준히 했을 때 하루 평균 XP (1년 ≈ 15만 XP)
export const DILIGENT_XP_PER_DAY = 420;
const TITLES = TITLE_STAGES.slice().reverse().map(st => [st.level, st.title]);
// 각성 횟수별 색 (LV 배지)
export const AWAKEN_STYLE = [
  'from-amber-300 to-orange-500 shadow-[0_8px_24px_rgba(251,146,60,0.45)]',
  'from-cyan-300 to-blue-500 shadow-[0_8px_24px_rgba(56,189,248,0.5)]',
  'from-fuchsia-300 to-violet-600 shadow-[0_8px_24px_rgba(168,85,247,0.5)]',
  'from-rose-300 to-red-600 shadow-[0_8px_24px_rgba(244,63,94,0.5)]',
  'from-emerald-300 to-teal-600 shadow-[0_8px_24px_rgba(16,185,129,0.5)]',
  'from-yellow-200 via-amber-400 to-rose-500 shadow-[0_8px_28px_rgba(250,204,21,0.6)]',
];
export const levelInfo = (xp = 0, awakenBase = 0) => {
  const x = Math.max(0, xp - awakenBase);
  let lv = 1;
  while (lv < MAX_LEVEL && xpForLevel(lv + 1) <= x) lv++;
  const max = lv >= MAX_LEVEL;
  const cur = xpForLevel(lv), next = max ? cur : xpForLevel(lv + 1);
  const title = TITLES.find(([min]) => lv >= min)[1];
  return { level: lv, title, cur, next, into: x - cur, need: max ? 0 : next - cur, pct: max ? 100 : Math.min(100, ((x - cur) / (next - cur)) * 100), max, xp: x };
};

// ── 기록 요약 ───────────────────────────────────────────────
export const summarize = (workouts = {}, diet = {}, bodyWeight = 0) => {
  const dates = Object.keys(workouts).filter(d => Array.isArray(workouts[d]) && workouts[d].some(ex => goodSets(ex).length)).sort();
  const day = {};
  let volume = 0, sets = 0, legSets = 0;
  const unique = new Set();
  const best = {};
  let prCount = 0;
  const prDates = [];
  dates.forEach(d => {
    const s = { sets: 0, volume: 0, groups: new Set(), legSets: 0, pr: 0 };
    workouts[d].forEach(ex => {
      const gs = goodSets(ex);
      if (!gs.length) return;
      unique.add(exKey(ex));
      const group = exTarget(ex).split('(')[0];
      let dayBest = 0;
      gs.forEach(st => {
        // 맨몸 종목은 체중 포함, 어시스트는 체중에서 도움 무게를 뺀 실제 부하로 계산
        const w = setLoad(exKey(ex), ex?.exercise?.tool || ex?.tool, st.weight, bodyWeight), r = parseInt(st.reps, 10) || 0;
        s.sets++;
        s.volume += w * r;
        if (group === '하체') s.legSets++;
        if (w > 0 && r > 0 && r <= 12) dayBest = Math.max(dayBest, e1rm(w, r));
      });
      if (group) s.groups.add(group);
      const k = exKey(ex);
      // 이전 최고 기록이 있는 종목에서 더 높은 추정 1RM을 내면 PR
      if (dayBest > 0) {
        if (best[k] && dayBest > best[k] + 0.01) { s.pr++; prCount++; prDates.push(d); }
        if (!best[k] || dayBest > best[k]) best[k] = dayBest;
      }
    });
    day[d] = s;
    volume += s.volume;
    sets += s.sets;
    legSets += s.legSets;
  });
  // 가장 긴 연속 운동일
  let maxStreak = 0, run = 0, prev = null;
  dates.forEach(d => {
    const t = new Date(d).getTime();
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
    prev = t;
  });
  const dietDay = (d) => {
    const meals = diet?.[d]?.meals || [];
    const items = meals.flatMap(m => m.items || []);
    return { mealsLogged: meals.filter(m => (m.items || []).length).length, protein: items.reduce((a, it) => a + (parseFloat(it.protein) || 0), 0), calories: items.reduce((a, it) => a + (parseFloat(it.calories) || 0), 0) };
  };
  const dietDays = Object.keys(diet || {}).filter(d => dietDay(d).mealsLogged > 0);
  return { dates, day, volume, sets, legSets, unique: unique.size, prCount, prDates, maxStreak, dietDay, dietDays };
};

// ── 일일 퀘스트 ──────────────────────────────────────────────
export const dailyQuests = (S, bodyStats, today = new Date()) => {
  const k = dateKey(today);
  const d = S.day[k] || { sets: 0, volume: 0, groups: new Set(), legSets: 0 };
  const diet = S.dietDay(k);
  const weight = parseFloat(bodyStats?.weight);
  const proteinGoal = weight > 0 ? Math.round(weight * 1.6) : 100;
  const big = ['하체', '등', '가슴'].filter(g => d.groups.has(g)).length;
  return [
    { id: 'checkin', icon: '🏋️', title: '오늘 운동 기록하기', desc: '세트를 1개 이상 완료(체크)하세요', cur: Math.min(d.sets, 1), goal: 1, xp: 50 },
    { id: 'sets15', icon: '🔥', title: '완료 세트 15개', desc: '워밍업 세트는 제외하고 셉니다', cur: d.sets, goal: 15, xp: 80, unit: '세트' },
    { id: 'bigmuscle', icon: '💪', title: '큰 근육 공략', desc: '하체·등·가슴 중 1부위 이상 훈련', cur: Math.min(big, 1), goal: 1, xp: 40 },
    { id: 'protein', icon: '🥩', title: `단백질 ${proteinGoal}g 먹기`, desc: weight > 0 ? `체중 ${weight}kg × 1.6g` : '몸무게를 입력하면 목표가 맞춰집니다', cur: Math.round(diet.protein), goal: proteinGoal, xp: 60, unit: 'g' },
    { id: 'meals3', icon: '🍱', title: '식단 3끼 기록', desc: '끼니마다 음식을 1개 이상 추가', cur: diet.mealsLogged, goal: 3, xp: 40, unit: '끼' },
  ].map(q => ({ ...q, key: `d:${k}:${q.id}`, done: q.cur >= q.goal }));
};

// ── 주간 퀘스트 ──────────────────────────────────────────────
export const weeklyQuests = (S, today = new Date()) => {
  const mon = mondayOf(today);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(d.getDate() + i); return dateKey(d); });
  const wk = days.map(d => S.day[d]).filter(Boolean);
  const groups = new Set();
  wk.forEach(s => s.groups.forEach(g => groups.add(g)));
  const five = ['가슴', '등', '하체', '어깨', '팔'];
  const prThisWeek = S.prDates.filter(d => days.includes(d)).length;
  const dietDays = days.filter(d => S.dietDay(d).mealsLogged > 0).length;
  const quests = [
    { id: 'days3', icon: '📅', title: '주 3회 운동', desc: '이번 주 운동한 날', cur: wk.length, goal: 3, xp: 200, unit: '일' },
    { id: 'sets60', icon: '⚡', title: '주간 60세트', desc: '이번 주 완료 세트 합계', cur: wk.reduce((a, s) => a + s.sets, 0), goal: 60, xp: 200, unit: '세트' },
    { id: 'split5', icon: '🧩', title: '5부위 정복', desc: `가슴·등·하체·어깨·팔 (${five.filter(g => groups.has(g)).join('·') || '아직 없음'})`, cur: five.filter(g => groups.has(g)).length, goal: 5, xp: 250, unit: '부위' },
    { id: 'legs10', icon: '🦵', title: '하체 10세트', desc: '하체 데이 건너뛰지 않기', cur: wk.reduce((a, s) => a + s.legSets, 0), goal: 10, xp: 150, unit: '세트' },
    { id: 'pr1', icon: '🏅', title: '개인 신기록 1회', desc: '어떤 종목이든 추정 1RM 갱신', cur: prThisWeek, goal: 1, xp: 250, unit: '회' },
    { id: 'diet5', icon: '🥗', title: '식단 5일 기록', desc: '이번 주 식단을 기록한 날', cur: dietDays, goal: 5, xp: 150, unit: '일' },
  ];
  return { quests: quests.map(q => ({ ...q, key: `w:${dateKey(mon)}:${q.id}`, done: q.cur >= q.goal })), days, mon };
};

// ── 업적 (5단계 메달) ────────────────────────────────────────
export const TIER_STYLE = [
  { name: '브론즈', ring: '#b0703d', fill: ['#f0b47c', '#a55f2a'] },
  { name: '실버', ring: '#8c96a3', fill: ['#f1f4f8', '#9aa4b2'] },
  { name: '골드', ring: '#c79100', fill: ['#ffe27a', '#d19b00'] },
  { name: '플래티넘', ring: '#3aa6a6', fill: ['#d6fffa', '#3fb0b0'] },
  { name: '다이아몬드', ring: '#6d5dfc', fill: ['#e5e0ff', '#7c6cff'] },
];
export const TIER_XP = [50, 100, 200, 400, 800];

export const achievements = (S, total3) => [
  { id: 'lift', icon: '🏋️', title: '3대 중량', unit: 'kg', cur: total3, targets: [200, 300, 400, 500, 600], names: ['헬린이 탈출', '근력의 각성', '강호의 고수', '3대 500 클럽', '괴력의 전설'] },
  { id: 'days', icon: '📆', title: '출석왕', unit: '일', cur: S.dates.length, targets: [3, 10, 30, 100, 250], names: ['작심삼일 극복', '운동 습관화', '헬창의 길', '체육관 지박령', '철의 출석부'] },
  { id: 'streak', icon: '🔥', title: '연속 출석', unit: '일', cur: S.maxStreak, targets: [3, 7, 14, 30, 60], names: ['불씨', '일주일 완주', '2주 불꽃', '한 달 무휴', '꺼지지 않는 불'] },
  { id: 'volume', icon: '🏗️', title: '누적 볼륨', unit: 'kg', cur: Math.round(S.volume), targets: [10000, 50000, 100000, 500000, 1000000], names: ['워밍업', '인간 기중기', '헐크', '신화적 존재', '백만 톤의 사나이'] },
  { id: 'sets', icon: '⚡', title: '세트 분쇄기', unit: '세트', cur: S.sets, targets: [50, 300, 1000, 3000, 6000], names: ['근육통 시작', '펌핑의 맛', '세트 노동자', '무한의 체력', '세트의 신'] },
  { id: 'variety', icon: '🧭', title: '헬스장 탐험가', unit: '종목', cur: S.unique, targets: [5, 15, 30, 50, 80], names: ['머신 입문', '호기심 천국', '루틴 마스터', '헬스장 고인물', '만능 엔터테이너'] },
  { id: 'legs', icon: '🦵', title: '하체 데이', unit: '세트', cur: S.legSets, targets: [30, 100, 300, 800, 1500], names: ['하체 입문', '스쿼트 러버', '허벅지 장인', '닭다리 탈출', '하체 지배자'] },
  { id: 'pr', icon: '🏅', title: 'PR 사냥꾼', unit: '회', cur: S.prCount, targets: [1, 5, 15, 40, 100], names: ['첫 신기록', '성장 중독', '기록 파괴자', '한계 돌파', '살아있는 레코드'] },
  { id: 'diet', icon: '🥗', title: '식단 관리', unit: '일', cur: S.dietDays.length, targets: [3, 10, 30, 100, 200], names: ['식단 첫걸음', '클린 이터', '매크로 계산기', '영양 전문가', '식단의 정석'] },
].map(a => {
  const reached = a.targets.filter(t => a.cur >= t).length;
  return { ...a, reached, next: a.targets[reached] ?? null, pct: reached >= a.targets.length ? 100 : Math.min(100, (a.cur / a.targets[reached]) * 100), tierKeys: a.targets.map((_, i) => `a:${a.id}:${i}`) };
});

// 남은 시간 (일일: 자정, 주간: 다음 월요일 0시)
export const timeLeft = (now = new Date()) => {
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const nextMon = mondayOf(now); nextMon.setDate(nextMon.getDate() + 7);
  const h = Math.floor((midnight - now) / 3600000), m = Math.floor(((midnight - now) % 3600000) / 60000);
  const dLeft = Math.ceil((nextMon - now) / 86400000);
  return { daily: `${h}시간 ${m}분`, weekly: dLeft <= 1 ? '오늘 자정' : `${dLeft}일` };
};
