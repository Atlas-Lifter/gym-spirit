import React from 'react';
import { BODY_PATHS } from '../data/bodyPaths.js';

// 근육 지도 (MuscleMap 도형, src/data/bodyPaths.js). 남녀 · 앞뒤
// 도형 이름(slug)을 앱의 근육 id(anatomy.js)로 이어 준다

// 기본 도형 → 근육 id (앞·뒤에서 뜻이 다른 도형은 side 별로)
const BASE = {
  front: {
    chest: ['pec_upper', 'pec_lower'], deltoids: ['delt_side'], biceps: ['biceps'], triceps: ['triceps'], forearm: ['forearm'],
    abs: ['abs'], obliques: ['obliques'], serratus: ['serratus'], trapezius: ['traps'],
    quadriceps: ['quads'], adductors: ['adductors'], calves: ['calves'], tibialis: ['tibialis'],
  },
  back: {
    trapezius: ['traps'], deltoids: ['delt_side'], upperBack: ['lats'], rhomboids: ['midback'], lowerBack: ['erectors'],
    rotatorCuff: ['delt_rear'], triceps: ['triceps'], forearm: ['forearm'], gluteal: ['glutes'], hamstring: ['hamstrings'],
    adductors: ['adductors'], calves: ['calves'],
  },
};
// 세부 도형: 기본 도형 위에 덮어 그 부분만 따로 칠한다 (윗가슴/아랫가슴, 전면/후면 삼각근)
// 가슴은 기본 도형이 두 근육을 함께 뜻하므로, 쓰지 않는 쪽도 '쉬는 근육' 색으로 덮어야 정확하다
const COVER = new Set(['upperChest', 'lowerChest']);
const OVERLAY = {
  front: { upperChest: 'pec_upper', lowerChest: 'pec_lower', frontDeltoid: 'delt_front' },
  back: { rearDeltoid: 'delt_rear' },
};
// 근육이 아닌 곳 (피부·머리카락)
const SKIN = new Set(['head', 'neck', 'hands', 'feet', 'knees', 'ankles', 'hipFlexors']);
const SKIP = new Set(['upperTrapezius', 'lowerTrapezius', 'upperAbs', 'lowerAbs', 'innerQuad', 'outerQuad']);

export const bodyOf = (gender, side) => BODY_PATHS[gender === 'female' || gender === 'f' ? 'f' : 'm'][side === 'back' ? 'back' : 'front'];

// fillOf(muscleIds, slug) → 색, 쓰지 않으면 null (그때는 idle 색). 세부 도형은 해당 근육 하나로 부른다
export const BodyFigure = ({ gender = 'male', side = 'front', fillOf, onPart, viewBox, className = 'w-full h-full', skin = '#e9ebef', idle = '#d5d9e0', hair = '#9aa3b2', title }) => {
  const body = bodyOf(gender, side);
  const vb = viewBox || body.viewBox.join(' ');
  const base = BASE[side === 'back' ? 'back' : 'front'];
  const over = OVERLAY[side === 'back' ? 'back' : 'front'];
  const parts = body.parts.filter(p => !SKIP.has(p.slug));
  const ordered = [...parts.filter(p => !over[p.slug]), ...parts.filter(p => over[p.slug])];
  return (
    <svg viewBox={vb} className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {ordered.map((p, i) => {
        let fill = skin, ids = null;
        if (p.slug === 'hair') fill = hair;
        else if (over[p.slug]) { ids = [over[p.slug]]; fill = fillOf(ids, p.slug) || (COVER.has(p.slug) ? idle : null); }
        else if (base[p.slug]) { ids = base[p.slug]; fill = fillOf(ids, p.slug) || idle; }
        else if (!SKIN.has(p.slug)) fill = skin;
        if (!fill) return null;
        const click = onPart && ids ? () => onPart(ids, p.slug) : undefined;
        return (
          <g key={`${p.slug}-${i}`} onClick={click} className={click ? 'cursor-pointer transition-[filter] hover:brightness-95' : undefined}>
            {p.d.map((d, j) => <path key={j} d={d} fill={fill} />)}
          </g>
        );
      })}
    </svg>
  );
};

// 썸네일 확대 영역 (정사각형): 상체 / 허벅지 / 하체 / 어깨~무릎. 도형 실제 위치로 잰 값
const CROPS = {
  'm-front': { upper: '139 265 450 450', thigh: '144 620 440 440', lower: '4 620 720 720', full: '-33 265 795 795' },
  'm-back': { upper: '859 270 450 450', thigh: '862 600 445 445', lower: '713 600 742 742', full: '687 270 795 795' },
  'f-front': { upper: '105 255 430 430', thigh: '77 585 486 486', lower: '-101 585 843 843', full: '-88 255 816 816' },
  'f-back': { upper: '928 265 430 430', thigh: '918 590 450 450', lower: '724 590 838 838', full: '735 265 816 816' },
};
export const cropBox = (gender, side, crop) => CROPS[`${gender === 'female' || gender === 'f' ? 'f' : 'm'}-${side === 'back' ? 'back' : 'front'}`][crop] || null;
