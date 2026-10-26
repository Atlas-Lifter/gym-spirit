import React, { useLayoutEffect, useRef } from 'react';
import { ANATOMY_BACK_MUSCLES, ANATOMY_MUSCLES, ANATOMY_OUTLINE_HALF, ANATOMY_SKIN_HALF, MUSCLE_THUMB_VIEWBOX, getExerciseMuscleView, getExerciseMuscles } from '../data/anatomy.js';
import { EXERCISE_OPTIONS } from '../data/catalog.js';
import { EXERCISE_GUIDES } from '../exerciseGuides.js';
import { PATTERNS } from '../movementPatterns.jsx';
import { PoseFigure } from '../poseFigure.jsx';

// 종목 썸네일(동작 그림·근육 그림), 근육 회복 인체도, 비상구 아이콘
// 비상구 표지판 모양 아이콘 (운동 화면 최소화 버튼)
export const EmergencyExitIcon = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect x="1" y="4" width="30" height="24" rx="5" fill="#10b981" />
    <rect x="20" y="8" width="8" height="16" rx="1" fill="#ecfdf5" />
    <rect x="22.2" y="10.2" width="3.6" height="13.8" fill="#047857" />
    <circle cx="11.5" cy="9.6" r="2.3" fill="#ecfdf5" />
    <path d="M11 12.6 L12.8 18.4 M8.2 14.6 L11.3 12.9 L14.8 15 M12.8 18.4 L16 21.4 L15.6 25 M12.8 18.4 L9.8 21.4 L6.6 22.2" fill="none" stroke="#ecfdf5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
// 동작 그림 썸네일에서 사람과 기구가 꽉 차게 보이도록 바닥선을 뺀 그림 영역으로 잘라낸다 (종목별로 한 번만 계산)
export const MOTION_CROP_CACHE = new Map();
export const motionFrameOf = (guide) => {
  const first = guide.steps[0][0];
  return (guide.steps.find(st => st[0] !== first) || guide.steps[0])[0];
};
export const ExerciseMotionThumb = ({ exerciseId, size = 'w-14 h-14', showShadow = false }) => {
  const ref = useRef(null);
  const guide = EXERCISE_GUIDES[exerciseId];
  useLayoutEffect(() => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    let vb = MOTION_CROP_CACHE.get(exerciseId);
    if (!vb) {
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      Array.from(svg.children).slice(1).forEach(el => {
        try {
          const b = el.getBBox();
          if (!b.width && !b.height) return;
          x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height);
        } catch (e) {}
      });
      if (!isFinite(x1)) return;
      // getBBox는 굵은 선(팔다리) 두께를 빼고 재므로 여백을 넉넉히
      const side = Math.max(x2 - x1, y2 - y1) * 1.12 + 28;
      vb = `${(x1 + x2) / 2 - side / 2} ${(y1 + y2) / 2 - side / 2} ${side} ${side}`;
      MOTION_CROP_CACHE.set(exerciseId, vb);
    }
    svg.setAttribute('viewBox', vb);
  }, [exerciseId]);
  if (!guide || !PATTERNS[guide.pt]) return null;
  const pattern = { ...PATTERNS[guide.pt], ...(guide.eq ? { equip: guide.eq } : {}) };
  const ex = EXERCISE_OPTIONS.find(e => e.id === exerciseId);
  const muscles = ex ? getExerciseMuscles(ex) : { p: [], s: [] };
  return (
    <div ref={ref} className={`${size} bg-[#f3f4f7] rounded-xl flex items-center justify-center overflow-hidden border border-neutral-200 flex-shrink-0 ${showShadow ? 'shadow-md' : ''}`}>
      <PoseFigure pattern={pattern} frame={motionFrameOf(guide)} p={muscles.p} s={muscles.s} className="w-full h-full" />
    </div>
  );
};
// 종목 썸네일: 실제 동작(사람·기구) 그림을 먼저, 그 옆에 해부도로 주동근(진한 빨강)·협응근(연한 빨강)을 보여준다
export const SmartExerciseThumbnail = ({ exerciseId, target, size = "w-14 h-14", showShadow = true, motion = true }) => {
  const exercise = EXERCISE_OPTIONS.find(e => e.id === exerciseId) || { id: exerciseId, name: '', target: target || '전신' };
  const muscleBox = (
    <div className={`${size} bg-[#f3f4f7] rounded-xl flex items-center justify-center overflow-hidden border border-neutral-200 flex-shrink-0 ${showShadow ? 'shadow-md' : ''}`}>
      <ExerciseMuscleMap exercise={exercise} />
    </div>
  );
  if (!motion || !EXERCISE_GUIDES[exerciseId]) return muscleBox;
  return (
    <div className="flex gap-1 flex-shrink-0">
      <ExerciseMotionThumb exerciseId={exerciseId} size={size} showShadow={showShadow} />
      {muscleBox}
    </div>
  );
};
export const ExerciseMuscleMap = ({ exercise, className = 'w-full h-full' }) => {
  const muscles = getExerciseMuscles(exercise);
  const { side, crop } = getExerciseMuscleView(muscles);
  const list = side === 'back' ? ANATOMY_BACK_MUSCLES : ANATOMY_MUSCLES;
  const fillFor = (id) => muscles.p.includes(id) ? '#e5484d' : muscles.s.includes(id) ? '#f3a29b' : '#d5d9e0';
  const half = (
    <>
      <path d={ANATOMY_SKIN_HALF} fill="#eceef2" />
      {list.map((m, i) => (
        <g key={i}>
          <path d={m.d} fill={fillFor(m.id)} stroke="#9aa3b2" strokeOpacity="0.7" strokeWidth="0.9" strokeLinejoin="round" />
          <path d={m.d} fill="url(#thumbShade)" />
          {(m.fibers || []).map((f, j) => <path key={j} d={f} fill="none" stroke="#475569" strokeOpacity="0.18" strokeWidth="0.8" strokeLinecap="round" />)}
        </g>
      ))}
      <path d={ANATOMY_OUTLINE_HALF} fill="none" stroke="#9aa3b2" strokeWidth="1.2" strokeLinejoin="round" />
    </>
  );
  return (
    <svg viewBox={MUSCLE_THUMB_VIEWBOX[crop]} className={className} aria-hidden="true">
      <defs>
        <radialGradient id="thumbShade" cx="42%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="40" rx="20" ry="25" fill="#eceef2" stroke="#9aa3b2" strokeWidth="1.2" />
      <g>{half}</g>
      <g transform="matrix(-1 0 0 1 400 0)">{half}</g>
    </svg>
  );
};
export const AnimeMuscleBodySVG = ({ recoveryData, onMuscleClick }) => {
  const getRecoveryPercent = (group) => recoveryData[group]?.percent ?? 100;


  const getFillColor = (perc) => {
    if (perc <= 30) return '#ef4f4f'; // 피로 (붉게 충혈된 근육)
    if (perc <= 60) return '#f8c544'; // 회복 중
    if (perc <= 90) return '#7ee0a2'; // 거의 회복
    return '#edd3ca'; // 완전 회복 (차분한 근육 톤)
  };

  const partsInfo = [
    { id: '어깨', title: '어깨', side: 'left', y: 80, target: [138, 112] },
    { id: '가슴', title: '가슴', side: 'right', y: 110, target: [228, 124] },
    { id: '등', title: '등', side: 'left', y: 145, target: [158, 172] },
    { id: '복근', title: '복근', side: 'right', y: 175, target: [209, 200] },
    { id: '팔', title: '팔', side: 'left', y: 215, target: [125, 212] },
    { id: '하체', title: '하체', side: 'right', y: 300, target: [226, 296] }
  ];

  const fillFor = (group) => getFillColor(getRecoveryPercent(group));

  const renderHalf = () => (
    <>
      <path d={ANATOMY_SKIN_HALF} fill="url(#anatSkin)" />
      {ANATOMY_MUSCLES.map((m, i) => (
        <g key={`m-${i}`} onClick={() => onMuscleClick(m.group)} className="cursor-pointer transition-all duration-300 hover:brightness-110 hover:saturate-150">
          <path d={m.d} fill={fillFor(m.group)} stroke="#8a4b42" strokeOpacity="0.55" strokeWidth="0.9" strokeLinejoin="round" />
          <path d={m.d} fill="url(#anatShade)" pointerEvents="none" />
          {(m.fibers || []).map((f, j) => (
            <path key={`f-${j}`} d={f} fill="none" stroke="#7a2e26" strokeOpacity="0.22" strokeWidth="0.8" strokeLinecap="round" pointerEvents="none" />
          ))}
        </g>
      ))}
      {/* 슬개골, 쇄골, 흉쇄유돌근 */}
      <ellipse cx="176" cy="344" rx="6.5" ry="7.5" fill="#f3e3da" stroke="#a1887f" strokeOpacity="0.6" strokeWidth="0.8" />
      <path d="M197,92 C185,92 170,91 156,94" fill="none" stroke="#a1887f" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
      <path d="M191,66 C192,74 194,84 197,92" fill="none" stroke="#a1887f" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
    </>
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center py-4">
      <div className="relative w-full max-w-[360px] aspect-[400/450]">
      <svg viewBox="0 0 400 450" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="anatSkin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ead6cc" />
            <stop offset="100%" stopColor="#f6ebe4" />
          </linearGradient>
          <radialGradient id="anatShade" cx="42%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#3b0d08" stopOpacity="0.28" />
          </radialGradient>
        </defs>

        {partsInfo.map(part => {
          const startX = part.side === 'left' ? 110 : 290;
          return (
            <g key={`line-${part.id}`}>
              <path d={`M ${startX} ${part.y} L ${part.target[0]} ${part.target[1]}`} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" fill="none" />
            </g>
          );
        })}

        {/* 머리 */}
        <ellipse cx="200" cy="40" rx="20" ry="25" fill="url(#anatSkin)" stroke="#a1887f" strokeWidth="1.2" />
        <path d="M181,42 C178,40 177,46 180,50 M219,42 C222,40 223,46 220,50" fill="none" stroke="#a1887f" strokeWidth="1" strokeLinecap="round" />

        <g>{renderHalf()}</g>
        <g transform="matrix(-1 0 0 1 400 0)">{renderHalf()}</g>

        {/* 실루엣 외곽선 (좌우) */}
        <path d={ANATOMY_OUTLINE_HALF} fill="none" stroke="#a1887f" strokeWidth="1.2" strokeLinejoin="round" />
        <path d={ANATOMY_OUTLINE_HALF} transform="matrix(-1 0 0 1 400 0)" fill="none" stroke="#a1887f" strokeWidth="1.2" strokeLinejoin="round" />
        <ellipse cx="200" cy="226" rx="1.6" ry="2.4" fill="#a1887f" opacity="0.6" />

        {partsInfo.map(part => (
          <circle key={`dot-${part.id}`} cx={part.target[0]} cy={part.target[1]} r="2.5" fill="#475569" stroke="#ffffff" strokeWidth="1" pointerEvents="none" />
        ))}

      </svg>
      {/* 라벨은 SVG 밖에 겹쳐 그린다: 지시선 끝(x=110 / x=290)에 맞춰 좌우 대칭 */}
      {partsInfo.map(part => {
        const perc = getRecoveryPercent(part.id);
        const pos = part.side === 'left' ? { right: `${(290 / 400) * 100}%` } : { left: `${(290 / 400) * 100}%` };
        return (
          <button key={`label-${part.id}`} onClick={() => onMuscleClick(part.id)} style={{ ...pos, top: `${(part.y / 450) * 100}%` }}
            className="absolute -translate-y-1/2 flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-xl border border-neutral-200 shadow-sm cursor-pointer hover:border-[#4768ff] hover:shadow-md transition-[border-color,box-shadow] whitespace-nowrap">
            <span className="text-[11px] font-black text-neutral-700">{part.title}</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${perc === 100 ? 'bg-slate-50 text-slate-500 border-slate-200' : perc >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : perc >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{perc}%</span>
          </button>
        );
      })}
      </div>
    </div>
  );
};
