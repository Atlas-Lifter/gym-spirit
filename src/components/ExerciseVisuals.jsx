import React, { useLayoutEffect, useRef, useState } from 'react';
import { getExerciseMuscleView, getExerciseMuscles } from '../data/anatomy.js';
import { MUSCLE_GROUP } from '../recovery.js';
import { useApp } from '../appContext.js';
import { BodyFigure, cropBox } from './BodyMap.jsx';
import { EXERCISE_OPTIONS } from '../data/catalog.js';
import { EXERCISE_GUIDES } from '../exerciseGuides.js';
import { exercisePhotos } from '../data/exercisePhotos.js';
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
// 실제 운동 사진 썸네일: 시작 자세와 끝 자세 사진이 번갈아 보여 어떤 기구·동작인지 바로 알 수 있다
const PHOTO_ANIM = '@keyframes exPhotoSwap { 0%, 42% { opacity: 0; } 50%, 92% { opacity: 1; } 100% { opacity: 0; } } .ex-photo-b { animation: exPhotoSwap 2.6s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .ex-photo-b { animation: none; } }';
export const ExercisePhotoThumb = ({ exerciseId, size = 'w-14 h-14', showShadow = false, onError }) => {
  const photos = exercisePhotos(exerciseId);
  if (!photos) return null;
  return (
    // 사진은 가로로 긴(3:2) 원본 비율 그대로: 높이는 size의 h-*를 따르고 너비는 비율로 정한다 (사람과 기구가 잘리지 않게)
    <div className={`${size.replace(/\bw-\S+/, '')} aspect-[3/2] relative bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200 flex-shrink-0 ${showShadow ? 'shadow-md' : ''}`}>
      <style>{PHOTO_ANIM}</style>
      <img src={photos[0]} alt="" loading="lazy" decoding="async" onError={onError} className="absolute inset-0 w-full h-full object-cover" />
      <img src={photos[1]} alt="" loading="lazy" decoding="async" className="ex-photo-b absolute inset-0 w-full h-full object-cover" />
    </div>
  );
};
// 운동 설명서 위쪽의 큰 사진 (시작 → 끝)
export const ExercisePhotoPair = ({ exerciseId }) => {
  const photos = exercisePhotos(exerciseId);
  if (!photos) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((src, i) => (
        <div key={src} className="relative rounded-2xl overflow-hidden bg-neutral-200 aspect-[3/2]">
          <img src={src} alt={i ? '끝 자세' : '시작 자세'} loading="lazy" className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 text-[10px] font-black text-white bg-black/60 px-1.5 py-0.5 rounded-md">{i ? '② 끝 자세' : '① 시작 자세'}</span>
        </div>
      ))}
    </div>
  );
};
// 종목 썸네일: 실제 운동 사진(없으면 동작 그림)을 먼저, 그 옆에 해부도로 주동근(진한 빨강)·협응근(연한 빨강)을 보여준다
export const SmartExerciseThumbnail = ({ exerciseId, target, size = "w-14 h-14", showShadow = true, motion = true }) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  const exercise = EXERCISE_OPTIONS.find(e => e.id === exerciseId) || { id: exerciseId, name: '', target: target || '전신' };
  const muscleBox = (
    <div className={`${size} bg-[#f3f4f7] rounded-xl flex items-center justify-center overflow-hidden border border-neutral-200 flex-shrink-0 ${showShadow ? 'shadow-md' : ''}`}>
      <ExerciseMuscleMap exercise={exercise} />
    </div>
  );
  const photo = !photoFailed && exercisePhotos(exerciseId);
  if (photo) {
    return (
      <div className="flex gap-1 flex-shrink-0">
        <ExercisePhotoThumb exerciseId={exerciseId} size={size} showShadow={showShadow} onError={() => setPhotoFailed(true)} />
        {muscleBox}
      </div>
    );
  }
  if (!motion || !EXERCISE_GUIDES[exerciseId]) return muscleBox;
  return (
    <div className="flex gap-1 flex-shrink-0">
      <ExerciseMotionThumb exerciseId={exerciseId} size={size} showShadow={showShadow} />
      {muscleBox}
    </div>
  );
};
// 종목 썸네일·설명서의 근육 그림: 주동근은 진하게, 협응근은 옅게 (앞/뒤·확대 영역은 근육 위치로 고른다)
export const ExerciseMuscleMap = ({ exercise, className = 'w-full h-full', gender }) => {
  const app = useApp();
  const g = gender || app?.currentUser?.profile?.gender || 'male';
  const muscles = getExerciseMuscles(exercise);
  const { side, crop } = getExerciseMuscleView(muscles);
  const fillOf = (ids) => (ids.some(id => muscles.p.includes(id)) ? '#e5484d' : ids.some(id => muscles.s.includes(id)) ? '#f3a29b' : null);
  return <BodyFigure gender={g} side={side} fillOf={fillOf} viewBox={cropBox(g, side, crop)} className={className} skin="#eceef2" idle="#d5d9e0" />;
};

// 분석 탭의 부위별 회복도 지도: 앞·뒤 몸을 나란히, 근육을 누르면 그 부위를 연다
const RECOVERY_LABELS = ['가슴', '등', '어깨', '팔', '복근', '하체'];
const recoveryColor = (perc) => (perc <= 30 ? '#ef4f4f' : perc <= 60 ? '#f8c544' : perc <= 90 ? '#7ee0a2' : '#e7d2c9');
export const AnimeMuscleBodySVG = ({ recoveryData, onMuscleClick, gender }) => {
  const app = useApp();
  const g = gender || app?.currentUser?.profile?.gender || 'male';
  const percentOf = (group) => recoveryData?.[group]?.percent ?? 100;
  const groupOf = (ids) => MUSCLE_GROUP[ids[0]];
  const fillOf = (ids) => { const grp = groupOf(ids); return grp ? recoveryColor(percentOf(grp)) : null; };
  const onPart = (ids) => { const grp = groupOf(ids); if (grp) onMuscleClick(grp); };
  return (
    <div className="w-full flex flex-col items-center py-3">
      <div className="w-full max-w-[380px] grid grid-cols-2 gap-1">
        {['front', 'back'].map(side => (
          <div key={side} className="flex flex-col items-center">
            <BodyFigure gender={g} side={side} fillOf={fillOf} onPart={onPart} className="w-full h-auto aspect-[1/2]" skin="#efe6e1" idle="#e7d2c9"
              title={side === 'front' ? '앞모습 근육 회복도' : '뒷모습 근육 회복도'} />
            <span className="text-[10px] font-black text-neutral-400 mt-1">{side === 'front' ? '앞' : '뒤'}</span>
          </div>
        ))}
      </div>
      <div className="w-full max-w-[380px] grid grid-cols-3 gap-2 mt-3">
        {RECOVERY_LABELS.map(id => {
          const perc = percentOf(id);
          return (
            <button key={id} onClick={() => onMuscleClick(id)} className="flex items-center justify-between gap-1.5 bg-white px-2.5 py-2 rounded-xl border border-neutral-200 shadow-sm hover:border-[#4768ff] hover:shadow-md transition-[border-color,box-shadow]">
              <span className="flex items-center gap-1.5 text-[11px] font-black text-neutral-700"><span className="w-2.5 h-2.5 rounded-full" style={{ background: recoveryColor(perc) }} />{id}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${perc === 100 ? 'bg-slate-50 text-slate-500 border-slate-200' : perc >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : perc >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{perc}%</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] font-bold text-neutral-400 mt-3">근육 그림: MuscleMap (Melih Colpan, MIT)</p>
    </div>
  );
};
