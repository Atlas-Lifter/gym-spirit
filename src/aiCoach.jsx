import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, MessageSquare, RotateCw, Star, Search, BookOpen, Calculator, Activity, Dumbbell } from 'lucide-react';
import { COACH_TREE } from './coachTree.js';
import { FOOD_DB, foodTags } from './data/foods.js';
import { FoodImage } from './components/FoodImage.jsx';

// ── 기본 트리에 붙이는 확장: 계산기·도구 노드, 답변별 바로가기 버튼 ─────────────
const TOOL_NODES = {
  tools_sub: { q: "[맞춤 계산기] 내 숫자를 넣으면 바로 계산해 드려요.\n어떤 도구를 써 볼까요?", opt: [
    { l: "🍽 하루 칼로리 & 단백질·탄수·지방 계산", n: "calorie_tool" },
    { l: "🏋️ 1RM(최대 중량) & 세트별 추천 무게", n: "onerm_tool" },
    { l: "🗓 운동 요일 골라서 주간 분할표 만들기", n: "split_tool" },
    { l: "🩹 아픈 부위 눌러서 대처법 찾기", n: "pain_tool" },
    { l: "🎯 1분 맞춤 진단 (루틴·식단 방향)", n: "quiz_tool" },
    { l: "🍱 하루 식단 예시 만들기", n: "meal_tool" },
    { l: "📉 목표 체중까지 걸리는 기간", n: "goal_tool" },
  ] },
  calorie_tool: { tool: 'calorie', title: '🍽 칼로리·영양소 계산기', q: "몸 정보와 목표를 고르면 하루 섭취량을 계산해 드려요.", kw: '칼로리 단백질 탄수화물 지방 식단 계산 다이어트 감량 벌크 증량 유지 tdee 기초대사' },
  onerm_tool: { tool: 'onerm', title: '🏋️ 1RM 계산기', q: "최근에 든 무게와 반복 횟수를 넣으면 1RM과 목표별 무게를 알려 드려요.", kw: '1rm 중량 무게 최대 벤치 스쿼트 데드 데드리프트 정체기 5x5 세트 몇키로' },
  split_tool: { tool: 'split', title: '🗓 주간 분할 플래너', q: "운동 가능한 요일을 눌러 보세요. 요일 수에 맞는 분할표를 바로 짜 드려요.", kw: '분할 루틴 요일 주간 일정 몇번 주3회 주4회 주5회 무분할 2분할 3분할' },
  pain_tool: { tool: 'pain', title: '🩹 통증 부위 찾기', q: "아픈 부위를 누르고 통증 느낌과 세기를 골라 주세요.", kw: '통증 아파 아픔 부상 어깨 무릎 허리 손목 팔꿈치 목 고관절 디스크 시큰 찌릿' },
  quiz_tool: { tool: 'quiz', title: '🎯 1분 맞춤 진단', q: "네 가지만 골라 주세요. 지금 나에게 맞는 프로그램과 운동·식단 방향을 정리해 드려요.", kw: '추천 맞춤 진단 뭐부터 루틴 추천 프로그램 추천 나에게 맞는' },
  meal_tool: { tool: 'meal', title: '🍱 하루 식단 예시', q: "목표 칼로리와 식사 스타일을 고르면 하루 식단 예시를 짜 드려요. 마음에 들면 오늘 식단에 바로 담을 수 있어요.", kw: '식단 예시 메뉴 추천 뭐먹지 식단표 하루 식단 짜기' },
  goal_tool: { tool: 'goal', title: '📉 목표 체중 플래너', q: "지금 체중과 목표 체중, 속도를 고르면 예상 기간과 하루 칼로리 조절량을 알려 드려요.", kw: '목표 체중 감량 기간 언제 몇주 빠질까 증량 계획' },
};

const START_FIRST = [{ l: "🎯 1분 맞춤 진단 (나에게 맞는 루틴·식단)", n: "quiz_tool" }];
const START_EXTRA = [{ l: "🧮 내 몸 맞춤 계산기 (칼로리·1RM·식단·목표 체중)", n: "tools_sub" }];
const OPTION_EXTRAS = {
  work_freq: [{ l: "🗓 요일을 직접 골라 분할표 만들기", n: "split_tool" }],
  work_plateau: [{ l: "🏋️ 내 1RM 계산해서 무게 다시 잡기", n: "onerm_tool" }],
  diet_sub: [{ l: "🧮 내 칼로리·단백질 직접 계산하기", n: "calorie_tool" }, { l: "🍱 하루 식단 예시 만들기", n: "meal_tool" }],
  contest_sub: [{ l: "📉 목표 체중까지 기간 계산하기", n: "goal_tool" }],
  cardio_sub: [{ l: "📉 목표 체중까지 기간 계산하기", n: "goal_tool" }],
  pain_sub: [{ l: "🩹 아픈 부위를 직접 눌러서 찾기", n: "pain_tool" }],
};
// 답변 아래에 붙는 바로가기: program(프로그램 열기) / guide(운동 설명서) / node(다른 상담으로 이동)
const ACTIONS = {
  beg_g_fat: [{ t: 'program', id: 'p11' }, { t: 'node', n: 'calorie_tool' }],
  beg_g_muscle: [{ t: 'program', id: 'p4' }, { t: 'guide', ex: 'cpm' }, { t: 'node', n: 'calorie_tool' }],
  beg_g_stamina: [{ t: 'program', id: 'p3' }],
  beg_pt: [{ t: 'program', id: 'p4' }],
  beg_breath: [{ t: 'guide', ex: 'sq' }, { t: 'guide', ex: 'pd' }],
  wf_23: [{ t: 'program', id: 'p3' }, { t: 'node', n: 'split_tool' }],
  wf_4: [{ t: 'program', id: 'p13' }, { t: 'node', n: 'split_tool' }],
  wf_56: [{ t: 'program', id: 'p1' }, { t: 'node', n: 'split_tool' }],
  wp_strength: [{ t: 'program', id: 'p2' }, { t: 'node', n: 'onerm_tool' }],
  wp_volume: [{ t: 'program', id: 'p14' }],
  work_feeling: [{ t: 'guide', ex: 'pd' }, { t: 'guide', ex: 'cpm' }],
  diet_overweight: [{ t: 'node', n: 'calorie_tool' }, { t: 'program', id: 'p9' }],
  diet_skinnyfat: [{ t: 'node', n: 'calorie_tool' }, { t: 'program', id: 'p3' }],
  diet_skinny: [{ t: 'node', n: 'calorie_tool' }, { t: 'program', id: 'p14' }],
  diet_busy: [{ t: 'node', n: 'calorie_tool' }],
  pain_upper: [{ t: 'node', n: 'pain_tool' }, { t: 'guide', ex: 'face_pull' }],
  pain_lower: [{ t: 'node', n: 'pain_tool' }, { t: 'guide', ex: 'goblet' }],
  pain_posture: [{ t: 'guide', ex: 'face_pull' }, { t: 'guide', ex: 'sr' }],
  m_lazy: [{ t: 'program', id: 'p11' }],
  beg_first: [{ t: 'program', id: 'p4' }, { t: 'guide', ex: 'lpd' }, { t: 'guide', ex: 'pd' }],
  beg_sets: [{ t: 'node', n: 'onerm_tool' }],
  work_order: [{ t: 'node', n: 'split_tool' }],
  work_warmup: [{ t: 'guide', ex: 'sq' }],
  work_overload: [{ t: 'program', id: 'p2' }, { t: 'node', n: 'onerm_tool' }],
  diet_timing: [{ t: 'node', n: 'meal_tool' }],
  diet_cheat: [{ t: 'node', n: 'calorie_tool' }],
  diet_night: [{ t: 'node', n: 'meal_tool' }],
  pain_ankle: [{ t: 'guide', ex: 'calf' }, { t: 'node', n: 'pain_tool' }],
  m_motivation: [{ t: 'node', n: 'quiz_tool' }],
  m_binge: [{ t: 'node', n: 'meal_tool' }],
  home_noequip: [{ t: 'program', id: 'p8' }, { t: 'guide', ex: 'pushup' }, { t: 'guide', ex: 'bss' }],
  home_dumbbell: [{ t: 'program', id: 'p11' }, { t: 'guide', ex: 'goblet' }, { t: 'guide', ex: 'dr_back' }],
  home_short: [{ t: 'program', id: 'p11' }, { t: 'guide', ex: 'rdl' }],
  c_fasted: [{ t: 'node', n: 'calorie_tool' }],
  c_hiit: [{ t: 'node', n: 'goal_tool' }],
  c_order: [{ t: 'node', n: 'split_tool' }],
  c_running: [{ t: 'guide', ex: 'calf' }, { t: 'guide', ex: 'bss' }],
  r_doms: [{ t: 'node', n: 'pain_tool' }],
  w_hip: [{ t: 'program', id: 'p5' }, { t: 'guide', ex: 'ht' }, { t: 'guide', ex: 'bss' }],
  w_arm: [{ t: 'guide', ex: 'pd' }, { t: 'guide', ex: 'sr' }],
  w_bulky: [{ t: 'program', id: 'p4' }],
  bp_plan: [{ t: 'program', id: 'p9' }, { t: 'node', n: 'goal_tool' }, { t: 'node', n: 'meal_tool' }],
  bp_after: [{ t: 'node', n: 'calorie_tool' }],
  life_student: [{ t: 'program', id: 'p3' }],
  life_shift: [{ t: 'program', id: 'p3' }],
  life_40: [{ t: 'program', id: 'p4' }, { t: 'guide', ex: 'lpd' }],
  life_travel: [{ t: 'program', id: 'p8' }],
};

const TREE = (() => {
  const t = { ...COACH_TREE, ...TOOL_NODES };
  t.start = { ...t.start, opt: [...START_FIRST, ...t.start.opt, ...START_EXTRA] };
  Object.entries(OPTION_EXTRAS).forEach(([id, extra]) => { if (t[id]) t[id] = { ...t[id], opt: [...t[id].opt, ...extra] }; });
  Object.entries(ACTIONS).forEach(([id, actions]) => { if (t[id]) t[id] = { ...t[id], actions }; });
  return t;
})();

// 처음 등장한 부모를 기억해 두면 답변 뒤에 "같은 주제의 다른 질문"을 보여줄 수 있다
const PARENT = (() => {
  const p = {};
  Object.entries(TREE).forEach(([id, node]) => (node.opt || []).forEach(o => { if (!p[o.n]) p[o.n] = id; }));
  return p;
})();

const nodeTitle = (id) => {
  const node = TREE[id];
  if (!node) return '';
  if (node.title) return node.title;
  const line = (node.a || node.q || '').split('\n')[0];
  const topic = line.match(/\[([^\]]+)\]/);
  if (node.q && topic) return `${topic[1]} 상담`;
  return line.replace(/[[\]]/g, '').slice(0, 40);
};

// 입력한 낱말이 질문·답변·선택지 글에 몇 번 나오는지로 관련 상담을 찾는다 (키워드 검색)
const SEARCH_INDEX = Object.entries(TREE).filter(([id]) => id !== 'start').map(([id, node]) => ({
  id,
  text: [node.title, node.q, node.a, node.kw, ...(node.opt || []).map(o => o.l)].filter(Boolean).join(' ').toLowerCase(),
  leaf: !node.opt,
}));
const searchTopics = (query) => {
  const words = query.toLowerCase().split(/[\s,.?!]+/).filter(w => w.length > 0);
  if (!words.length) return [];
  return SEARCH_INDEX
    .map(e => ({ ...e, score: words.reduce((sum, w) => sum + (e.text.split(w).length - 1), 0) + (e.leaf ? 0.5 : 0) }))
    .filter(e => e.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
};

const SAVED_KEY = 'gymwork_coach_saved_v1';
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch (e) { return []; } };

const LEVEL_LABEL = {
  empty: ['기록 없음', 'bg-neutral-100 text-neutral-500'],
  collecting: ['데이터 모으는 중', 'bg-blue-50 text-[#4768ff]'],
  low: ['훈련량 적음', 'bg-sky-50 text-sky-600'],
  good: ['적정 부하', 'bg-emerald-50 text-emerald-600'],
  caution: ['주의', 'bg-amber-50 text-amber-600'],
  danger: ['과부하', 'bg-red-50 text-red-600'],
};

const roundTo = (v, step) => Math.round(v / step) * step;

// ── 공용 입력 조각 ─────────────────────────────────────────────
const Slider = ({ label, value, min, max, step = 1, unit, onChange }) => (
  <label className="block">
    <div className="flex justify-between items-baseline mb-1">
      <span className="text-xs font-black text-neutral-500">{label}</span>
      <span className="text-sm font-black text-neutral-900">{value}<span className="text-[11px] text-neutral-400 ml-0.5">{unit}</span></span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-[#4768ff]" />
  </label>
);

const Chips = ({ options, value, onChange, cols = 3 }) => (
  <div className={`grid gap-1.5 ${cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
    {options.map(o => (
      <button key={o.l} onClick={() => onChange(o.v)} className={`py-2 px-1 rounded-xl text-xs font-black transition-all active:scale-95 ${value === o.v ? 'bg-[#4768ff] text-white shadow-md' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>{o.l}</button>
    ))}
  </div>
);

const ToolCard = ({ children }) => <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-neutral-100 p-4 space-y-4 w-full">{children}</div>;

// ── 도구 1: 칼로리·영양소 계산기 (Mifflin-St Jeor) ───────────────
const ACTIVITY = [{ l: '거의 안 움직임', v: 1.2 }, { l: '주 1~3회 운동', v: 1.375 }, { l: '주 3~5회 운동', v: 1.55 }, { l: '주 6~7회 운동', v: 1.725 }];
const GOALS = [{ l: '🔥 감량', v: 'cut' }, { l: '⚖️ 유지', v: 'keep' }, { l: '💪 증량', v: 'bulk' }];
const GOAL_RULE = { cut: { delta: -400, protein: 2.0 }, keep: { delta: 0, protein: 1.6 }, bulk: { delta: 300, protein: 1.8 } };

const CalorieTool = ({ profile, bodyStats }) => {
  const [gender, setGender] = useState(profile?.gender === 'female' ? 'female' : 'male');
  const [weight, setWeight] = useState(() => Math.round(parseFloat(bodyStats?.weight)) || 70);
  const [height, setHeight] = useState(profile?.gender === 'female' ? 162 : 175);
  const [age, setAge] = useState(28);
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState('keep');

  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = bmr * activity;
  const rule = GOAL_RULE[goal];
  const target = Math.round((tdee + rule.delta) / 10) * 10;
  const protein = Math.round(weight * rule.protein);
  const fat = Math.round((target * 0.25) / 9);
  const carb = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const kcalOf = { p: protein * 4, c: carb * 4, f: fat * 9 };
  const total = kcalOf.p + kcalOf.c + kcalOf.f || 1;

  return (
    <ToolCard>
      <Chips cols={2} options={[{ l: '👨 남성', v: 'male' }, { l: '👩 여성', v: 'female' }]} value={gender} onChange={setGender} />
      <Slider label="체중" value={weight} min={40} max={150} unit="kg" onChange={setWeight} />
      <Slider label="키" value={height} min={140} max={210} unit="cm" onChange={setHeight} />
      <Slider label="나이" value={age} min={15} max={70} unit="세" onChange={setAge} />
      <div><div className="text-xs font-black text-neutral-500 mb-1.5">활동량</div><Chips cols={2} options={ACTIVITY} value={activity} onChange={setActivity} /></div>
      <div><div className="text-xs font-black text-neutral-500 mb-1.5">목표</div><Chips options={GOALS} value={goal} onChange={setGoal} /></div>
      <div className="bg-neutral-900 text-white rounded-2xl p-4">
        <div className="flex justify-between items-end">
          <div><div className="text-[11px] font-bold text-neutral-400">하루 목표 섭취</div><div className="text-3xl font-black tracking-tight">{target.toLocaleString()}<span className="text-sm text-neutral-400 ml-1">kcal</span></div></div>
          <div className="text-right text-[11px] font-bold text-neutral-400 leading-relaxed">기초대사 {Math.round(bmr).toLocaleString()}<br />유지 칼로리 {Math.round(tdee).toLocaleString()}</div>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden mt-3">
          <div className="bg-[#4768ff]" style={{ width: `${(kcalOf.p / total) * 100}%` }} />
          <div className="bg-amber-400" style={{ width: `${(kcalOf.c / total) * 100}%` }} />
          <div className="bg-rose-400" style={{ width: `${(kcalOf.f / total) * 100}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          {[['단백질', protein, 'text-[#8aa0ff]'], ['탄수화물', carb, 'text-amber-300'], ['지방', fat, 'text-rose-300']].map(([n, g, c]) => (
            <div key={n} className="bg-white/5 rounded-xl py-2"><div className={`text-lg font-black ${c}`}>{g}g</div><div className="text-[10px] font-bold text-neutral-400">{n}</div></div>
          ))}
        </div>
      </div>
      <p className="text-xs font-bold text-neutral-500 leading-relaxed">
        💡 하루 4끼로 나누면 끼니당 단백질 약 {Math.round(protein / 4)}g (닭가슴살 {Math.round(protein / 4 / 0.23)}g 정도)입니다.
        {goal === 'cut' && ' 감량 중에는 주당 체중의 0.5~1%씩 빠지는 속도가 근손실이 가장 적습니다.'}
        {goal === 'bulk' && ' 증량 중에는 한 달에 체중이 1~2kg 이상 늘면 지방이 붙는 속도가 빨라집니다.'}
      </p>
    </ToolCard>
  );
};

// ── 도구 2: 1RM 계산기 (Epley 공식) ─────────────────────────────
const LIFTS = [{ l: '벤치프레스', v: 'bp' }, { l: '스쿼트', v: 'sq' }, { l: '데드리프트', v: 'dl' }];
const PERCENT_ROWS = [
  { p: 0.9, reps: '2~3회', use: '최대 근력' },
  { p: 0.85, reps: '5회', use: '5x5 근력' },
  { p: 0.8, reps: '8회', use: '근력 + 근비대' },
  { p: 0.75, reps: '10회', use: '근비대' },
  { p: 0.67, reps: '12~15회', use: '근지구력·펌핑' },
];

const OneRmTool = ({ bestLifts, onOpenGuide }) => {
  const [lift, setLift] = useState('bp');
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(8);
  const best = bestLifts?.[lift];
  const e1rm = reps === 1 ? weight : weight * (1 + reps / 30);

  return (
    <ToolCard>
      <Chips options={LIFTS} value={lift} onChange={setLift} />
      {best ? (
        <button onClick={() => { setWeight(best.weight); setReps(best.reps); }} className="w-full text-left bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs font-bold text-[#4768ff] active:scale-[0.98] transition-transform">
          📒 내 기록에서 찾은 최고 세트: {best.weight}kg × {best.reps}회 <span className="underline ml-1">불러오기</span>
        </button>
      ) : (
        <div className="text-[11px] font-bold text-neutral-400">이 종목의 완료 기록이 아직 없어요. 최근에 든 무게를 직접 넣어 주세요.</div>
      )}
      <Slider label="든 무게" value={weight} min={10} max={300} step={2.5} unit="kg" onChange={setWeight} />
      <div>
        <div className="text-xs font-black text-neutral-500 mb-1.5">반복 횟수 <span className="text-neutral-900 ml-1">{reps}회</span></div>
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(r => (
            <button key={r} onClick={() => setReps(r)} className={`py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 ${reps === r ? 'bg-[#4768ff] text-white' : 'bg-neutral-100 text-neutral-600'}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="bg-neutral-900 text-white rounded-2xl p-4">
        <div className="text-[11px] font-bold text-neutral-400">추정 1RM</div>
        <div className="text-3xl font-black tracking-tight">{roundTo(e1rm, 2.5)}<span className="text-sm text-neutral-400 ml-1">kg</span></div>
        <div className="mt-3 space-y-1.5">
          {PERCENT_ROWS.map(r => (
            <div key={r.p} className="flex items-center gap-2 text-xs font-bold">
              <span className="w-10 text-neutral-500">{Math.round(r.p * 100)}%</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#4768ff]" style={{ width: `${r.p * 100}%` }} /></div>
              <span className="w-14 text-right font-black">{roundTo(e1rm * r.p, 2.5)}kg</span>
              <span className="w-24 text-right text-neutral-400">{r.reps} · {r.use}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => onOpenGuide(lift)} className="w-full text-xs font-black text-[#4768ff] bg-blue-50 hover:bg-blue-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95"><BookOpen className="w-3.5 h-3.5" /> {LIFTS.find(l => l.v === lift).l} 자세 설명서 보기</button>
      <p className="text-[11px] font-bold text-neutral-400">반복이 10회를 넘으면 추정치의 오차가 커집니다. 3~8회 기록으로 계산할 때 가장 정확해요.</p>
    </ToolCard>
  );
};

// ── 도구 3: 주간 분할 플래너 ───────────────────────────────────
const WEEK = ['월', '화', '수', '목', '금', '토', '일'];
const SPLITS = {
  1: ['전신'], 2: ['전신 A', '전신 B'], 3: ['전신 A', '전신 B', '전신 C'], 4: ['상체', '하체', '상체', '하체'],
  5: ['가슴·삼두', '등·이두', '하체', '어깨', '팔·복근'], 6: ['밀기', '당기기', '하체', '밀기', '당기기', '하체'],
  7: ['밀기', '당기기', '하체', '밀기', '당기기', '하체', '가벼운 유산소'],
};
const DAY_EXERCISES = {
  전신: ['sq', 'bp', 'pd'], '전신 A': ['sq', 'bp', 'br'], '전신 B': ['rdl', 'ohp', 'pd'], '전신 C': ['lpd', 'ip', 'sr'],
  상체: ['bp', 'br', 'ohp'], 하체: ['sq', 'rdl', 'lpd'], 밀기: ['bp', 'ohp', 'dips'], 당기기: ['pu', 'br', 'face_pull'],
  '가슴·삼두': ['bp', 'ip', 'tc'], '등·이두': ['pd', 'br', 'pcurl'], 어깨: ['ohp', 'lr', 'rpdf'], '팔·복근': ['pcurl', 'tc', 'plank'], '가벼운 유산소': [],
};
const SPLIT_PROGRAM = { 1: 'p3', 2: 'p3', 3: 'p2', 4: 'p13', 5: 'p15', 6: 'p1', 7: 'p16' };
const SPLIT_NAME = { 1: '무분할', 2: '전신 2회', 3: '전신 3회', 4: '상체/하체 2분할', 5: '부위별 5분할', 6: 'PPL 3분할 ×2', 7: 'PPL ×2 + 회복일' };

const SplitTool = ({ exName, programs, onOpenProgram, onOpenGuide }) => {
  const [days, setDays] = useState([0, 2, 4]);
  const [openDay, setOpenDay] = useState(null);
  const n = days.length;
  const labels = SPLITS[n] || [];
  const plan = Object.fromEntries(days.map((d, i) => [d, labels[i]]));
  const toggle = (d) => { setOpenDay(null); setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b))); };
  let run = 0, maxRun = 0;
  WEEK.forEach((_, d) => { run = days.includes(d) ? run + 1 : 0; maxRun = Math.max(maxRun, run); });
  const program = programs.find(p => p.id === SPLIT_PROGRAM[n]);

  return (
    <ToolCard>
      <div className="grid grid-cols-7 gap-1">
        {WEEK.map((w, d) => (
          <button key={w} onClick={() => toggle(d)} className={`rounded-xl py-2 flex flex-col items-center gap-1 transition-all active:scale-95 ${days.includes(d) ? 'bg-[#4768ff] text-white shadow-md' : 'bg-neutral-100 text-neutral-400'}`}>
            <span className="text-xs font-black">{w}</span>
            <span className="text-[9px] font-black leading-tight h-5 flex items-center text-center">{plan[d] ? plan[d].replace('·', '\n') : '휴식'}</span>
          </button>
        ))}
      </div>
      {n === 0 ? (
        <p className="text-xs font-bold text-neutral-400 text-center">운동 가능한 요일을 하나 이상 눌러 주세요.</p>
      ) : (
        <>
          <div className="bg-neutral-900 text-white rounded-2xl p-4">
            <div className="text-[11px] font-bold text-neutral-400">주 {n}회 추천 분할</div>
            <div className="text-xl font-black">{SPLIT_NAME[n]}</div>
            <div className="mt-3 space-y-1.5">
              {days.map(d => (
                <button key={d} onClick={() => setOpenDay(openDay === d ? null : d)} className="w-full text-left">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-black">{WEEK[d]}</span>
                    <span className="font-black flex-1">{plan[d]}</span>
                    <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${openDay === d ? 'rotate-90' : ''}`} />
                  </div>
                  {openDay === d && (
                    <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
                      {(DAY_EXERCISES[plan[d]] || []).length === 0 && <span className="text-[11px] text-neutral-400">걷기·자전거 20~30분, 스트레칭</span>}
                      {(DAY_EXERCISES[plan[d]] || []).map(id => (
                        <span key={id} onClick={(e) => { e.stopPropagation(); onOpenGuide(id); }} className="text-[11px] font-black bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg flex items-center gap-1"><BookOpen className="w-3 h-3" />{exName(id)}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          {maxRun >= 4 && n < 6 && <p className="text-xs font-bold text-amber-600 bg-amber-50 rounded-xl p-3">⚠️ {maxRun}일 연속 운동이 있어요. 같은 횟수라도 중간에 쉬는 날을 끼우면 회복이 훨씬 좋아집니다.</p>}
          {n === 7 && <p className="text-xs font-bold text-amber-600 bg-amber-50 rounded-xl p-3">⚠️ 매일 운동은 피로가 쌓이기 쉬워요. 일주일에 하루는 가벼운 유산소나 완전 휴식으로 두세요.</p>}
          <p className="text-[11px] font-bold text-neutral-400">요일을 눌러 그날의 대표 운동을 보고, 운동 이름을 누르면 자세 설명서가 열립니다.</p>
          {program && (
            <button onClick={() => onOpenProgram(program.id)} className="w-full bg-[#4768ff] text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-[0_8px_20px_rgba(71,104,255,0.3)] active:scale-95 transition-transform">
              <Dumbbell className="w-4 h-4" /> 이 일정에 맞는 프로그램: {program.title}
            </button>
          )}
        </>
      )}
    </ToolCard>
  );
};

// ── 도구 4: 통증 부위 찾기 ─────────────────────────────────────
const PAIN = {
  어깨: { cause: '프레스할 때 팔꿈치가 너무 벌어지거나 날개뼈가 들리면 어깨 앞쪽이 끼입니다.', fix: ['팔꿈치를 몸통 기준 45~60°로 모으기', '날개뼈를 뒤로 모으고 아래로 내린 채 고정'], avoid: ['비하인드 넥 프레스', '무거운 업라이트 로우'], alt: ['face_pull', 'cpm', 'lr'] },
  팔꿈치: { cause: '삼두·이두 고중량이나 손목이 꺾인 그립이 팔꿈치 힘줄에 부담을 줍니다.', fix: ['1~2주 고중량 삼두 익스텐션·바벨 컬 중단', '그립을 덜 꽉 쥐고 케이블로 대체'], avoid: ['스컬 크러셔', '고중량 바벨 컬'], alt: ['tc', 'pcurl', 'csr'] },
  손목: { cause: '프레스할 때 바가 손가락 쪽에 걸려 손목이 뒤로 꺾입니다.', fix: ['바를 손바닥 아래쪽(손목 바로 위)에 두기', '무거운 세트에는 손목 보호대'], avoid: ['손바닥 짚는 푸시업', '프론트 스쿼트 랙 그립'], alt: ['cpm', 'pd', 'lpd'] },
  허리: { cause: '복압이 풀린 채 허리가 말리거나 과하게 젖혀지면 허리에 하중이 몰립니다.', fix: ['숨을 들이마셔 배에 힘을 채운 뒤 동작', '무게를 30% 낮추고 허리 중립 확인'], avoid: ['고중량 데드리프트', '굿모닝'], alt: ['lpd', 'ht', 'plank'] },
  무릎: { cause: '앉을 때 무릎이 안쪽으로 모이거나 발뒤꿈치가 뜨면 무릎에 부담이 갑니다.', fix: ['무릎을 발끝 방향으로 밀어내며 앉기', '통증 없는 깊이까지만 내려가기'], avoid: ['씨씨 스쿼트', '점프 런지'], alt: ['ht', 'rdl', 'goblet'] },
  고관절: { cause: '고관절 가동성이 부족한데 깊게 앉으면 앞쪽이 끼는 느낌이 납니다.', fix: ['스탠스를 조금 넓히고 발끝을 15~30° 바깥으로', '운동 전 고관절 스트레칭 5분'], avoid: ['깊은 와이드 스쿼트', '피스톨 스쿼트'], alt: ['lpd', 'ht', 'le'] },
  목: { cause: '무거운 당기기·슈러그 때 턱을 들거나 거북목 자세가 되면 목이 긴장합니다.', fix: ['시선을 2~3m 앞 바닥에 두기', '턱을 살짝 당겨 목을 중립으로'], avoid: ['고중량 슈러그', '비하인드 넥 랫풀다운'], alt: ['face_pull', 'sr', 'pd'] },
};
const PAIN_TYPES = [{ l: '뻐근함', v: 'ache' }, { l: '찌릿함', v: 'sharp' }, { l: '붓기·열감', v: 'swell' }, { l: '저림', v: 'numb' }];

const PainTool = ({ exName, onOpenGuide }) => {
  const [part, setPart] = useState(null);
  const [type, setType] = useState('ache');
  const [level, setLevel] = useState(3);
  const info = part && PAIN[part];
  const verdict = type !== 'ache' || level >= 7
    ? { tone: 'bg-red-50 text-red-600 border-red-100', text: '🚑 운동을 멈추고 정형외과나 재활의학과 진료를 먼저 받아 보세요. 찌릿함·붓기·저림이나 강한 통증은 근육통이 아닐 수 있습니다.' }
    : level >= 4
      ? { tone: 'bg-amber-50 text-amber-700 border-amber-100', text: '⚠️ 통증이 없는 범위와 무게로만 운동하고 1주일 지켜보세요. 나아지지 않으면 진료를 받으세요.' }
      : { tone: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: '✅ 가벼운 근육통일 가능성이 큽니다. 가볍게 움직이고 스트레칭하면 2~3일 안에 풀립니다.' };

  return (
    <ToolCard>
      <div className="grid grid-cols-4 gap-1.5">
        {Object.keys(PAIN).map(p => (
          <button key={p} onClick={() => setPart(p)} className={`py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${part === p ? 'bg-rose-500 text-white shadow-md' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>{p}</button>
        ))}
      </div>
      {info && (
        <>
          <div><div className="text-xs font-black text-neutral-500 mb-1.5">어떤 느낌인가요?</div><Chips cols={4} options={PAIN_TYPES} value={type} onChange={setType} /></div>
          <Slider label="통증 세기" value={level} min={1} max={10} unit="/10" onChange={setLevel} />
          <div className={`text-xs font-bold leading-relaxed rounded-xl p-3 border ${verdict.tone}`}>{verdict.text}</div>
          <div className="space-y-3 text-xs font-bold text-neutral-700 leading-relaxed">
            <p><span className="font-black text-neutral-900">흔한 원인 · </span>{info.cause}</p>
            <div><div className="font-black text-neutral-900 mb-1">바로 고칠 점</div>{info.fix.map(f => <div key={f}>• {f}</div>)}</div>
            <div><div className="font-black text-neutral-900 mb-1">당분간 피할 동작</div><div className="flex flex-wrap gap-1.5">{info.avoid.map(a => <span key={a} className="bg-red-50 text-red-500 px-2 py-1 rounded-lg">✕ {a}</span>)}</div></div>
            <div><div className="font-black text-neutral-900 mb-1">대신 해볼 운동 (눌러서 자세 보기)</div><div className="flex flex-wrap gap-1.5">{info.alt.map(id => (
              <button key={id} onClick={() => onOpenGuide(id)} className="bg-blue-50 text-[#4768ff] px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-100 active:scale-95 transition-all"><BookOpen className="w-3 h-3" />{exName(id)}</button>
            ))}</div></div>
          </div>
          <p className="text-[10px] font-bold text-neutral-400">의료 진단이 아니라 운동 중 흔한 원인을 정리한 참고용 안내입니다.</p>
        </>
      )}
    </ToolCard>
  );
};

// ── 도구 5: 1분 맞춤 진단 ─────────────────────────────────────
const Q_GOALS = [{ l: '🔥 체지방 감량', v: 'cut' }, { l: '💪 근육 키우기', v: 'muscle' }, { l: '🏋️ 힘 세지기', v: 'strength' }, { l: '🏃 체력·건강', v: 'health' }];
const Q_LEVELS = [{ l: '입문 (6개월 미만)', v: 0 }, { l: '중급 (~2년)', v: 1 }, { l: '숙련 (2년+)', v: 2 }];
const Q_DAYS = [2, 3, 4, 5, 6].map(d => ({ l: `주 ${d}회`, v: d }));
const Q_PLACES = [{ l: '🏢 헬스장', v: 'gym' }, { l: '🏠 집 (맨몸·덤벨)', v: 'home' }];
const pickProgram = ({ goal, level, days, place }) => {
  if (place === 'home') return days <= 3 ? 'p11' : 'p8';
  if (level === 0) return days <= 3 ? 'p4' : 'p3';
  if (goal === 'strength') return days <= 3 ? 'p2' : days === 4 ? 'p13' : 'p15';
  if (goal === 'cut') return days <= 3 ? 'p11' : level === 2 ? 'p9' : 'p1';
  if (goal === 'health') return days <= 3 ? 'p3' : 'p11';
  if (days <= 3) return level === 2 ? 'p14' : 'p3';
  if (days === 4) return 'p13';
  if (days === 5) return 'p15';
  return level === 2 ? 'p16' : 'p1';
};
const GOAL_PLAN = {
  cut: { reps: '10~15회 · 휴식 60~90초', cardio: '주 3~4회 30분 + 하루 8,000보 걷기', kcal: '유지 칼로리 −300~500kcal', protein: 2.0 },
  muscle: { reps: '8~12회 · 휴식 90초~2분', cardio: '주 2회 20분 (회복 방해 안 될 만큼)', kcal: '유지 칼로리 +200~300kcal', protein: 1.8 },
  strength: { reps: '메인 3~6회 · 보조 8~12회 · 휴식 2~3분', cardio: '주 2회 가볍게 (걷기·사이클)', kcal: '유지 칼로리 ~ +200kcal', protein: 1.8 },
  health: { reps: '12~15회 · 휴식 60초', cardio: '주 3회 30분 (숨이 조금 찰 정도)', kcal: '유지 칼로리', protein: 1.4 },
};
const LEVEL_SETS = ['부위당 주 6~10세트', '부위당 주 10~15세트', '부위당 주 12~20세트'];

const QuizTool = ({ bodyStats, programs, onOpenProgram, onGo }) => {
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);
  const [days, setDays] = useState(null);
  const [place, setPlace] = useState(null);
  const done = goal !== null && level !== null && days !== null && place !== null;
  const plan = done ? GOAL_PLAN[goal] : null;
  const program = done ? programs.find(p => p.id === pickProgram({ goal, level, days, place })) : null;
  const weight = Math.round(parseFloat(bodyStats?.weight)) || 70;
  const Step = ({ n, title, children }) => (
    <div><div className="text-xs font-black text-neutral-500 mb-1.5"><span className="text-[#4768ff] mr-1">{n}</span>{title}</div>{children}</div>
  );
  return (
    <ToolCard>
      <Step n="1" title="가장 큰 목표"><Chips cols={2} options={Q_GOALS} value={goal} onChange={setGoal} /></Step>
      <Step n="2" title="운동 경력"><Chips options={Q_LEVELS} value={level} onChange={setLevel} /></Step>
      <Step n="3" title="일주일에 운동할 수 있는 날"><Chips cols={4} options={Q_DAYS} value={days} onChange={setDays} /></Step>
      <Step n="4" title="운동 장소"><Chips cols={2} options={Q_PLACES} value={place} onChange={setPlace} /></Step>
      {!done ? (
        <p className="text-[11px] font-bold text-neutral-400 text-center">네 가지를 모두 고르면 결과가 나와요.</p>
      ) : (
        <div className="bg-neutral-900 text-white rounded-2xl p-4 space-y-3 animate-fade-in">
          <div>
            <div className="text-[11px] font-bold text-neutral-400">나에게 맞는 프로그램</div>
            <div className="text-lg font-black leading-snug">{program?.title}</div>
            <div className="text-[11px] font-bold text-neutral-400 mt-0.5">{program?.level} · {program?.duration} · {SPLIT_NAME[days]}</div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs font-bold">
            {[['🔢 세트·횟수', `${plan.reps} · ${LEVEL_SETS[level]}`], ['🏃 유산소', plan.cardio], ['🍽 칼로리', plan.kcal], ['🥩 단백질', `하루 약 ${Math.round(weight * plan.protein)}g (체중 ${weight}kg × ${plan.protein})`]].map(([k, v]) => (
              <div key={k} className="bg-white/5 rounded-xl px-3 py-2 flex gap-2"><span className="flex-shrink-0 text-neutral-400 w-20">{k}</span><span className="text-white">{v}</span></div>
            ))}
          </div>
          {level === 0 && <p className="text-[11px] font-bold text-amber-300">💡 처음 4주는 무게보다 자세가 먼저예요. 운동 이름을 눌러 자세 설명서를 꼭 확인하세요.</p>}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {program && <button onClick={() => onOpenProgram(program.id)} className="text-xs font-black bg-[#4768ff] text-white px-3 py-2 rounded-xl flex items-center gap-1.5 active:scale-95"><Dumbbell className="w-3.5 h-3.5" />프로그램 보기</button>}
            <button onClick={() => onGo('split_tool', '🗓 요일별 분할표 만들기')} className="text-xs font-black bg-white/10 text-white px-3 py-2 rounded-xl active:scale-95">🗓 요일별 분할표</button>
            <button onClick={() => onGo('meal_tool', '🍱 하루 식단 예시 만들기')} className="text-xs font-black bg-white/10 text-white px-3 py-2 rounded-xl active:scale-95">🍱 식단 예시</button>
          </div>
        </div>
      )}
    </ToolCard>
  );
};

// ── 도구 6: 하루 식단 예시 ─────────────────────────────────────
const FOOD_BY_ID = Object.fromEntries(FOOD_DB.map(f => [f.id, f]));
const MEAL_STYLES = [{ l: '🍳 집밥', v: 'home' }, { l: '🏪 편의점·외식', v: 'out' }, { l: '🥗 가볍게', v: 'light' }];
const MEAL_TEMPLATES = {
  home: [
    ['아침', [['f8', 50], ['milk', 200], ['f4', 100], ['f10', 120]]],
    ['점심', [['rice_white', 210], ['chk_grill', 120], ['salad_mix', 100], ['kimchi', 40]]],
    ['간식', [['f17', 150], ['f6', 20]]],
    ['저녁', [['f3', 180], ['f9', 150], ['f5', 100]]],
  ],
  out: [
    ['아침', [['egg_baked', 100], ['protein_drink', 250], ['f10', 120]]],
    ['점심', [['gimbap', 230], ['cvs_chicken', 100]]],
    ['간식', [['protein_bar', 60], ['americano', 355]]],
    ['저녁', [['bibimbap', 450], ['egg_fried', 46]]],
  ],
  light: [
    ['아침', [['f17', 150], ['f23', 100], ['granola', 30]]],
    ['점심', [['chicken_salad', 250], ['f2', 150]]],
    ['간식', [['cottage', 100], ['f22', 200]]],
    ['저녁', [['f14', 150], ['f3', 150], ['spinach', 80], ['paprika', 75]]],
  ],
};
const nutri = (f, g) => ({ kcal: (f.calories * g) / f.per, p: (f.protein * g) / f.per, c: (f.carbs * g) / f.per, f: (f.fat * g) / f.per });
const sumOf = (items) => items.reduce((a, it) => { const n = nutri(it.food, it.g); return { kcal: a.kcal + n.kcal, p: a.p + n.p, c: a.c + n.c, f: a.f + n.f }; }, { kcal: 0, p: 0, c: 0, f: 0 });
// 단백질 식품은 단백질 목표에, 탄수화물 식품은 남은 칼로리에 맞춰 양을 조절한다
const buildMealPlan = (style, kcalTarget, proteinTarget) => {
  const meals = MEAL_TEMPLATES[style].map(([name, rows]) => [name, rows.map(([id, g]) => ({ food: FOOD_BY_ID[id], g })).filter(it => it.food)]);
  const all = meals.flatMap(([, items]) => items);
  const isProtein = (it) => foodTags(it.food).includes('고단백');
  const isCarb = (it) => it.food.category === '탄수화물' || (['한식·외식', '편의점'].includes(it.food.category) && !isProtein(it)); // 밥·면·도시락처럼 양을 늘리고 줄이기 쉬운 것
  const proteinNow = sumOf(all).p;
  const pf = Math.min(1.8, Math.max(0.6, proteinTarget / (proteinNow || 1)));
  all.forEach(it => { if (isProtein(it)) it.g *= pf; });
  const flexKcal = sumOf(all.filter(isCarb)).kcal;
  const fixedKcal = sumOf(all.filter(it => !isCarb(it))).kcal;
  const cf = Math.min(3, Math.max(0.3, (kcalTarget - fixedKcal) / (flexKcal || 1)));
  all.forEach(it => { if (isCarb(it)) it.g *= cf; });
  // 탄수화물만으로 모자라면 과일·견과 같은 나머지 음식도 늘린다
  const rest = all.filter(it => !isCarb(it) && !isProtein(it));
  const gap = kcalTarget - sumOf(all).kcal;
  const restKcal = sumOf(rest).kcal;
  if (gap > kcalTarget * 0.03 && restKcal > 0) { const rf = Math.min(2.5, 1 + gap / restKcal); rest.forEach(it => { it.g *= rf; }); }
  all.forEach(it => { it.g = Math.max(10, Math.round(it.g / 10) * 10); });
  return meals;
};

const MealTool = ({ bodyStats, onApplyMealPlan }) => {
  const weight = Math.round(parseFloat(bodyStats?.weight)) || 70;
  const [kcal, setKcal] = useState(() => Math.round((weight * 30) / 50) * 50);
  const [style, setStyle] = useState('home');
  const [proteinX, setProteinX] = useState(1.8);
  const [applied, setApplied] = useState(false);
  const proteinTarget = Math.round(weight * proteinX);
  const plan = useMemo(() => buildMealPlan(style, kcal, proteinTarget), [style, kcal, proteinTarget]);
  const total = sumOf(plan.flatMap(([, items]) => items));
  const apply = () => {
    if (!onApplyMealPlan) return;
    onApplyMealPlan(plan.map(([name, items]) => ({ name, items: items.map(it => ({ food: it.food, g: it.g })) })));
    setApplied(true);
  };
  return (
    <ToolCard>
      <Chips options={MEAL_STYLES} value={style} onChange={(v) => { setStyle(v); setApplied(false); }} />
      <Slider label="하루 목표 칼로리" value={kcal} min={1200} max={3600} step={50} unit="kcal" onChange={(v) => { setKcal(v); setApplied(false); }} />
      <div><div className="text-xs font-black text-neutral-500 mb-1.5">단백질 목표 (체중 {weight}kg 기준)</div>
        <Chips options={[{ l: '보통 ×1.4', v: 1.4 }, { l: '운동 ×1.8', v: 1.8 }, { l: '감량 ×2.2', v: 2.2 }]} value={proteinX} onChange={(v) => { setProteinX(v); setApplied(false); }} />
      </div>
      <div className="space-y-2">
        {plan.map(([name, items]) => {
          const m = sumOf(items);
          return (
            <div key={name} className="bg-neutral-50 rounded-xl p-3">
              <div className="flex justify-between items-baseline mb-1.5"><span className="text-sm font-black text-neutral-900">{name}</span><span className="text-[11px] font-black text-neutral-500">{Math.round(m.kcal)}kcal · 단백질 {Math.round(m.p)}g</span></div>
              {items.map(it => (
                <div key={it.food.id} className="flex items-center gap-2 text-xs font-bold text-neutral-700 py-0.5">
                  <FoodImage id={it.food.id} icon={it.food.icon} className="w-7 h-7" rounded="rounded-md" /><span className="flex-1 truncate">{it.food.name}</span><span className="text-neutral-400">{it.g}{it.food.unit}</span><span className="w-14 text-right">{Math.round(nutri(it.food, it.g).kcal)}kcal</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="bg-neutral-900 text-white rounded-2xl p-4">
        <div className="flex justify-between items-end">
          <div><div className="text-[11px] font-bold text-neutral-400">하루 합계</div><div className="text-2xl font-black">{Math.round(total.kcal).toLocaleString()}<span className="text-sm text-neutral-400 ml-1">/ {kcal.toLocaleString()} kcal</span></div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          {[['단백질', total.p, 'text-[#8aa0ff]', `목표 ${proteinTarget}g`], ['탄수화물', total.c, 'text-amber-300', ''], ['지방', total.f, 'text-rose-300', '']].map(([n, g, c, sub]) => (
            <div key={n} className="bg-white/5 rounded-xl py-2"><div className={`text-lg font-black ${c}`}>{Math.round(g)}g</div><div className="text-[10px] font-bold text-neutral-400">{n}{sub ? ` · ${sub}` : ''}</div></div>
          ))}
        </div>
      </div>
      {onApplyMealPlan && (
        <button onClick={apply} disabled={applied} className={`w-full font-black py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all ${applied ? 'bg-emerald-50 text-emerald-600' : 'bg-[#4768ff] text-white shadow-[0_8px_20px_rgba(71,104,255,0.3)]'}`}>
          {applied ? '✅ 식단 플래너에 담았어요' : '🍱 이 식단을 식단 플래너에 담기'}
        </button>
      )}
      {total.kcal < kcal * 0.9 && <p className="text-xs font-bold text-amber-600 bg-amber-50 rounded-xl p-3">💡 이 스타일로는 {Math.round(total.kcal / 50) * 50}kcal 정도가 자연스러워요. 더 많이 드셔야 한다면 '집밥'이나 '편의점·외식'을 골라 보세요.</p>}
      {total.kcal > kcal * 1.1 && <p className="text-xs font-bold text-amber-600 bg-amber-50 rounded-xl p-3">💡 단백질 목표를 채우느라 목표보다 조금 많아요. 단백질 목표를 '보통'으로 낮추면 맞출 수 있어요.</p>}
      <p className="text-[11px] font-bold text-neutral-400">양은 10g 단위로 맞춘 예시예요. 비슷한 음식으로 바꿔 드셔도 괜찮아요.</p>
    </ToolCard>
  );
};

// ── 도구 7: 목표 체중 플래너 ───────────────────────────────────
const PACES = { loss: [{ l: '천천히 0.5%/주', v: 0.005 }, { l: '보통 0.75%/주', v: 0.0075 }, { l: '빠르게 1%/주', v: 0.01 }], gain: [{ l: '천천히 0.25%/주', v: 0.0025 }, { l: '보통 0.5%/주', v: 0.005 }] };
const fmtDate = (d) => `${d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일`;

const GoalTool = ({ bodyStats }) => {
  const start = Math.round(parseFloat(bodyStats?.weight)) || 70;
  const [now, setNow] = useState(start);
  const [target, setTarget] = useState(Math.max(40, start - 5));
  const dir = target < now ? 'loss' : target > now ? 'gain' : 'keep';
  const [pace, setPace] = useState(0.0075);
  const paces = dir === 'gain' ? PACES.gain : PACES.loss;
  const rate = paces.some(p => p.v === pace) ? pace : paces[paces.length > 2 ? 1 : 1].v;
  const weeklyKg = now * rate;
  const weeks = dir === 'keep' ? 0 : Math.ceil(Math.abs(now - target) / weeklyKg);
  const end = new Date(); end.setDate(end.getDate() + weeks * 7);
  const dailyKcal = Math.round((weeklyKg * 7700) / 7 / 10) * 10;
  const marks = weeks > 4 ? [4, 8, 12, 16, 20, 24].filter(w => w < weeks).slice(0, 3) : [];
  return (
    <ToolCard>
      <Slider label="지금 체중" value={now} min={40} max={150} unit="kg" onChange={setNow} />
      <Slider label="목표 체중" value={target} min={40} max={150} unit="kg" onChange={setTarget} />
      {dir !== 'keep' && <div><div className="text-xs font-black text-neutral-500 mb-1.5">속도</div><Chips cols={dir === 'gain' ? 2 : 3} options={paces} value={rate} onChange={setPace} /></div>}
      {dir === 'keep' ? (
        <p className="text-xs font-bold text-neutral-500 text-center">목표 체중이 지금과 같아요. 체성분(근육↑ 지방↓)을 바꾸는 '리컴프'를 노려 보세요.</p>
      ) : (
        <div className="bg-neutral-900 text-white rounded-2xl p-4">
          <div className="text-[11px] font-bold text-neutral-400">예상 도달</div>
          <div className="text-2xl font-black">{weeks}주 후 · {fmtDate(end)}</div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-center">
            <div className="bg-white/5 rounded-xl py-2"><div className="text-lg font-black text-[#8aa0ff]">{dir === 'loss' ? '−' : '+'}{weeklyKg.toFixed(2)}kg</div><div className="text-[10px] font-bold text-neutral-400">한 주 변화</div></div>
            <div className="bg-white/5 rounded-xl py-2"><div className="text-lg font-black text-amber-300">{dir === 'loss' ? '−' : '+'}{dailyKcal}kcal</div><div className="text-[10px] font-bold text-neutral-400">하루 칼로리 조절</div></div>
          </div>
          {marks.length > 0 && (
            <div className="mt-3 space-y-1">
              {marks.map(w => { const d = new Date(); d.setDate(d.getDate() + w * 7); return (
                <div key={w} className="flex justify-between text-[11px] font-bold text-neutral-400"><span>{w}주 차 ({fmtDate(d)})</span><span className="text-white font-black">{(now + (dir === 'loss' ? -1 : 1) * weeklyKg * w).toFixed(1)}kg</span></div>
              ); })}
            </div>
          )}
        </div>
      )}
      {dir === 'loss' && rate >= 0.01 && <p className="text-xs font-bold text-amber-600 bg-amber-50 rounded-xl p-3">⚠️ 주 1% 이상 빠르게 빼면 근손실과 요요 위험이 커져요. 단백질을 체중×2g 이상 드세요.</p>}
      {dir === 'loss' && weeks > 16 && <p className="text-xs font-bold text-[#4768ff] bg-blue-50 rounded-xl p-3">💡 16주가 넘는 감량은 8~12주마다 1~2주 유지 칼로리로 쉬어 가면(다이어트 브레이크) 정체기가 줄어요.</p>}
      <p className="text-[11px] font-bold text-neutral-400">지방 1kg ≈ 7,700kcal로 계산한 예상치예요. 처음 1~2주는 수분 때문에 더 빨리 빠지는 게 정상이에요.</p>
    </ToolCard>
  );
};

// ── 이번 주 내 상태 요약 (분석 탭과 같은 계산 결과를 사용) ──────────
const Briefing = ({ report, onPick }) => {
  if (!report) return null;
  const [label, tone] = LEVEL_LABEL[report.level] || LEVEL_LABEL.collecting;
  const suggestions = [];
  if (report.level === 'danger' || report.level === 'caution') suggestions.push({ l: '😮‍💨 회복이 필요해요', n: 'brief' });
  if (report.level === 'empty') suggestions.push({ l: '🎯 1분 맞춤 진단', n: 'quiz_tool' });
  if (report.level === 'empty' || report.level === 'low') suggestions.push({ l: '🗓 이번 주 계획 세우기', n: 'split_tool' });
  if (report.level === 'good' || report.level === 'collecting') suggestions.push({ l: '📈 이번 주 분석 자세히', n: 'brief' });
  suggestions.push({ l: '🏋️ 1RM 계산', n: 'onerm_tool' });
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-black text-neutral-500 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> 이번 주 내 상태</div>
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${tone}`}>{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        {[['완료 세트', `${report.current.sets}`], ['운동한 날', `${report.current.days}일`], ['연속 운동', `${report.streak}일`]].map(([k, v]) => (
          <div key={k} className="bg-neutral-50 rounded-xl py-2"><div className="text-lg font-black text-neutral-900">{v}</div><div className="text-[10px] font-bold text-neutral-400">{k}</div></div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => <button key={s.l} onClick={() => onPick(s.n, s.l)} className="text-[11px] font-black bg-neutral-900 text-white px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">{s.l}</button>)}
      </div>
    </div>
  );
};

const TONE_DOT = { danger: 'bg-red-500', caution: 'bg-amber-500', good: 'bg-emerald-500', info: 'bg-[#4768ff]' };

// ── 상담소 본체 ───────────────────────────────────────────────
export const AiCoach = ({ onClose, profile, bodyStats, report, bestLifts, programs, exercises, onOpenProgram, onOpenGuide, onApplyMealPlan }) => {
  const [path, setPath] = useState([{ id: 'start' }]); // { id, label? } — label은 내가 고른 답(말풍선)
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(loadSaved);
  const scrollRef = useRef(null);
  const lastStepRef = useRef(null);

  const exName = (id) => exercises.find(e => e.id === id)?.name || id;
  const programTitle = (id) => programs.find(p => p.id === id)?.title || '프로그램';

  const go = (id, label) => {
    if (!TREE[id] && id !== 'brief' && id !== 'saved') return;
    setQuery('');
    setPath(prev => [...prev, { id, label }]);
    setTyping(true);
  };
  const back = () => setPath(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const restart = () => { setPath([{ id: 'start' }]); setQuery(''); };

  useEffect(() => {
    if (!typing) return undefined;
    const t = setTimeout(() => setTyping(false), 550);
    return () => clearTimeout(t);
  }, [typing, path.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && path.length === 1) { el.scrollTo({ top: 0 }); return; }
    // 새 답변의 첫머리가 보이도록 스크롤 (긴 계산기도 위에서부터 읽힌다)
    if (el) requestAnimationFrame(() => el.scrollTo({ top: Math.max(0, (lastStepRef.current?.offsetTop || el.scrollHeight) - 16), behavior: 'smooth' }));
  }, [path.length, typing]);

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev];
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch (e) { /* 저장 못 해도 화면에서는 유지 */ }
      return next;
    });
  };

  const results = useMemo(() => searchTopics(query), [query]);
  const lastIndex = path.length - 1;

  // 특수 노드: 이번 주 분석 요약, 저장한 솔루션 목록
  const virtualNode = (id) => {
    if (id === 'brief') {
      const advice = report?.advice?.length ? report.advice : [{ tone: 'info', text: '이번 주 기록이 쌓이면 부하와 회복 상태를 분석해 드릴게요.' }];
      return { brief: advice, opt: [{ l: '🗓 다음 주 분할 다시 짜기', n: 'split_tool' }, { l: '🩹 아픈 곳이 있어요', n: 'pain_tool' }] };
    }
    if (id === 'saved') {
      return saved.length
        ? { q: `⭐ 저장한 솔루션 ${saved.length}개입니다. 다시 볼 항목을 골라 주세요.`, opt: saved.filter(s => TREE[s]).map(s => ({ l: nodeTitle(s), n: s })) }
        : { q: '아직 저장한 솔루션이 없어요. 답변 오른쪽 위 ☆을 누르면 여기에 모입니다.' };
    }
    return TREE[id] || TREE.start;
  };

  const renderTool = (node) => {
    if (node.tool === 'calorie') return <CalorieTool profile={profile} bodyStats={bodyStats} />;
    if (node.tool === 'onerm') return <OneRmTool bestLifts={bestLifts} onOpenGuide={onOpenGuide} />;
    if (node.tool === 'split') return <SplitTool exName={exName} programs={programs} onOpenProgram={onOpenProgram} onOpenGuide={onOpenGuide} />;
    if (node.tool === 'pain') return <PainTool exName={exName} onOpenGuide={onOpenGuide} />;
    if (node.tool === 'quiz') return <QuizTool bodyStats={bodyStats} programs={programs} onOpenProgram={onOpenProgram} onGo={go} />;
    if (node.tool === 'meal') return <MealTool bodyStats={bodyStats} onApplyMealPlan={onApplyMealPlan} />;
    if (node.tool === 'goal') return <GoalTool bodyStats={bodyStats} />;
    return null;
  };

  const botAvatar = <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4768ff] to-[#8b5cf6] text-white flex flex-shrink-0 items-center justify-center text-base shadow-md border-2 border-white">🤖</div>;

  return (
    <div className="fixed inset-0 bg-black/60 z-[95] flex flex-col justify-end backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white text-neutral-900 w-full h-[88vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 flex justify-between items-center bg-white z-10 border-b border-neutral-100">
          {path.length > 1 ? (<button onClick={back} aria-label="이전" className="text-neutral-500 hover:bg-neutral-100 p-2.5 rounded-full transition-colors active:scale-90"><ChevronLeft className="w-6 h-6" /></button>) : (<div className="w-11" />)}
          <h2 className="text-xl font-black flex items-center gap-2 tracking-tight"><MessageSquare className="w-5 h-5 text-[#4768ff]" /> AI 코치 상담소</h2>
          <button onClick={onClose} aria-label="닫기" className="text-neutral-900 p-2.5 rounded-full hover:bg-neutral-100 transition-colors active:scale-90"><X className="w-6 h-6" /></button>
        </div>

        <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-5 bg-neutral-50 flex flex-col gap-4">
          {path.map((step, i) => {
            const node = virtualNode(step.id);
            const isLast = i === lastIndex;
            const isAnswer = !!node.a;
            return (
              <div key={`${step.id}-${i}`} ref={isLast ? lastStepRef : null} className="flex flex-col gap-4">
                {step.label && (
                  <div className="flex justify-end animate-fade-in"><div className="bg-[#4768ff] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-black max-w-[80%] shadow-sm">{step.label}</div></div>
                )}
                {isLast && typing ? (
                  <div className="flex gap-2.5 items-end">{botAvatar}<div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-neutral-100 flex gap-1">{[0, 1, 2].map(d => <span key={d} className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}</div></div>
                ) : (
                  <div className="flex gap-2.5 items-start animate-fade-in">
                    {botAvatar}
                    <div className="flex-1 min-w-0 space-y-2">
                      {(node.q || node.a) && (
                        <div className="relative bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-neutral-100 text-sm font-bold text-neutral-800 whitespace-pre-wrap leading-relaxed">
                          {isAnswer && (
                            <button onClick={() => toggleSave(step.id)} aria-label="솔루션 저장" className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-neutral-100 active:scale-90 transition-all">
                              <Star className={`w-4 h-4 ${saved.includes(step.id) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                            </button>
                          )}
                          <div className={isAnswer ? 'pr-6' : ''}>{node.q || node.a}</div>
                        </div>
                      )}
                      {node.brief && (
                        <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-neutral-100 space-y-2.5">
                          <div className="text-sm font-black">📊 이번 주 분석 결과</div>
                          {node.brief.map((a, k) => (
                            <div key={k} className="flex gap-2 text-xs font-bold text-neutral-700 leading-relaxed"><span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TONE_DOT[a.tone] || TONE_DOT.info}`} />{a.text}</div>
                          ))}
                        </div>
                      )}
                      {node.tool && (isLast ? renderTool(node) : <div className="text-xs font-bold text-neutral-400 bg-white rounded-xl px-3 py-2 border border-neutral-100 flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5" />{node.title} 사용함</div>)}
                      {isLast && node.actions && (
                        <div className="flex flex-wrap gap-1.5">
                          {node.actions.map((act, k) => (
                            <button key={k} onClick={() => (act.t === 'program' ? onOpenProgram(act.id) : act.t === 'guide' ? onOpenGuide(act.ex) : go(act.n, nodeTitle(act.n)))} className={`text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all ${act.t === 'program' ? 'bg-neutral-900 text-white' : act.t === 'guide' ? 'bg-blue-50 text-[#4768ff] hover:bg-blue-100' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>
                              {act.t === 'program' && <><Dumbbell className="w-3.5 h-3.5" />{programTitle(act.id)}</>}
                              {act.t === 'guide' && <><BookOpen className="w-3.5 h-3.5" />{exName(act.ex)} 자세</>}
                              {act.t === 'node' && <><Calculator className="w-3.5 h-3.5" />{nodeTitle(act.n)}</>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {i === 0 && isLast && !typing && (
                  <>
                    <Briefing report={report} onPick={go} />
                    {saved.length > 0 && <button onClick={() => go('saved', '⭐ 저장한 솔루션 보기')} className="self-start text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl active:scale-95 transition-transform">⭐ 저장한 솔루션 {saved.length}개</button>}
                  </>
                )}
              </div>
            );
          })}

          {!typing && (() => {
            const node = virtualNode(path[lastIndex].id);
            const prevId = path[lastIndex - 1]?.id;
            const cameFrom = prevId && (TREE[prevId]?.opt || []).some(o => o.n === path[lastIndex].id) ? prevId : null;
            const parent = cameFrom || PARENT[path[lastIndex].id];
            const siblings = !node.opt && parent && parent !== 'start' ? (TREE[parent].opt || []).filter(o => o.n !== path[lastIndex].id) : []; // 첫 화면 주제 전체는 다시 늘어놓지 않는다
            return (
              <div className="flex flex-col gap-2.5 mt-auto pt-2 animate-fade-in">
                {node.opt && (
                  <>
                    <div className="text-xs font-black text-neutral-400 ml-1">나의 답변 선택하기</div>
                    {node.opt.map((opt, k) => (
                      <button key={k} onClick={() => go(opt.n, opt.l)} className="w-full bg-white border-2 border-neutral-100 text-neutral-700 font-black py-3.5 px-4 rounded-2xl text-left text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-[#4768ff] transition-all shadow-sm active:scale-[0.98] flex items-center justify-between group">
                        {opt.l}<ChevronRight className="w-5 h-5 flex-shrink-0 text-neutral-300 group-hover:text-[#4768ff] transition-colors" />
                      </button>
                    ))}
                  </>
                )}
                {siblings.length > 0 && (
                  <>
                    <div className="text-xs font-black text-neutral-400 ml-1 mt-1">같은 주제의 다른 질문</div>
                    <div className="flex flex-wrap gap-1.5">
                      {siblings.map(o => <button key={o.n} onClick={() => go(o.n, o.l)} className="text-xs font-black bg-white border border-neutral-200 text-neutral-600 px-3 py-2 rounded-xl hover:border-blue-300 hover:text-[#4768ff] active:scale-95 transition-all">{o.l}</button>)}
                    </div>
                  </>
                )}
                {path.length > 1 && (
                  <button onClick={restart} className="w-full bg-neutral-900 text-white font-black py-3.5 rounded-2xl shadow-lg hover:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm mt-1"><RotateCw className="w-4 h-4" /> 다른 고민 상담하기</button>
                )}
              </div>
            );
          })()}
        </div>

        <div className="border-t border-neutral-100 bg-white px-4 pt-3 pb-5">
          {query && (
            <div className="mb-2.5 flex flex-col gap-1.5">
              {results.length ? results.map(r => (
                <button key={r.id} onClick={() => go(r.id, query)} className="text-left text-xs font-black text-neutral-700 bg-neutral-50 hover:bg-blue-50 hover:text-[#4768ff] border border-neutral-100 rounded-xl px-3 py-2.5 flex items-center justify-between active:scale-[0.98] transition-all">
                  <span className="truncate">{nodeTitle(r.id)}</span><ChevronRight className="w-4 h-4 flex-shrink-0 text-neutral-300" />
                </button>
              )) : <div className="text-xs font-bold text-neutral-400 px-1">"{query}"와 맞는 상담을 찾지 못했어요. 다른 낱말(예: 무릎, 단백질, 정체기)로 찾아보세요.</div>}
            </div>
          )}
          <div className="flex items-center gap-2 bg-neutral-100 rounded-2xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && results[0]) go(results[0].id, query); }} placeholder="고민을 낱말로 찾기 (예: 무릎, 힙업, 야식, 홈트)" className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-neutral-400 min-w-0" />
            {query && <button onClick={() => setQuery('')} aria-label="지우기"><X className="w-4 h-4 text-neutral-400" /></button>}
          </div>
        </div>
      </div>
    </div>
  );
};

