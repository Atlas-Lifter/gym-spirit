import React from 'react';

// 전설 루틴 카드 표지. 실제 사진이나 얼굴을 쓰지 않고, 각 선수를 떠올리게 하는
// 대표 포즈·헤어 실루엣·상징 소품·무대 분위기만으로 그린 일러스트 (이목구비 없음).
// 좌표: 골반 중앙이 (0,0). 화면 왼쪽 몸 절반을 정의하고 좌우 반전해 그린다.

const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const mirror = (p) => [-p[0], p[1]];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// 두 점 사이를 잇는 근육 덩어리 (가운데가 불룩한 사다리꼴)
const limb = (a, b, w1, w2, bulge = 0) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const wm = (w1 + w2) / 2 + bulge;
  const p1 = [a[0] + nx * w1 / 2, a[1] + ny * w1 / 2], p2 = [b[0] + nx * w2 / 2, b[1] + ny * w2 / 2];
  const p3 = [b[0] - nx * w2 / 2, b[1] - ny * w2 / 2], p4 = [a[0] - nx * w1 / 2, a[1] - ny * w1 / 2];
  const c1 = [m[0] + nx * wm * 0.62, m[1] + ny * wm * 0.62], c2 = [m[0] - nx * wm * 0.62, m[1] - ny * wm * 0.62];
  return `M${P(p1)} Q${P(c1)} ${P(p2)} L${P(p3)} Q${P(c2)} ${P(p4)} Z`;
};

// 포즈별 팔(어깨→팔꿈치→주먹), 다리(엉덩이→무릎→발목). 화면 왼쪽 기준 좌표
const ARMS = {
  doubleBiceps: { e: [-98, -102], f: [-94, -150], peak: 14 },
  hips: { e: [-82, -58], f: [-30, -24], peak: 6 },
  relaxed: { e: [-72, -60], f: [-68, -14], peak: 6 },
  mostMuscular: { e: [-68, -62], f: [-16, -44], peak: 9 },
};
const LEGS = {
  stand: { k: [-26, 80], a: [-30, 148] },
  wide: { k: [-36, 78], a: [-46, 146] },
  squat: { k: [-86, 44], a: [-98, 128] },
};
const BODY = { latW: 66, waistW: 26, hipW: 30 };
const S0 = [-57, -106], H0 = [-17, 4];

const torsoPath = ({ latW, waistW, hipW }) => `M-10,-128 C-24,-125 -38,-123 -47,-118 C-55,-108 ${-latW},-100 ${-latW},-90 C${-latW + 2},-70 ${-waistW - 7},-52 ${-waistW},-28 C${-waistW},-15 ${-hipW},-10 ${-hipW},2 L-6,13 L6,13 L${hipW},2 C${hipW},-10 ${waistW},-15 ${waistW},-28 C${waistW + 7},-52 ${latW - 2},-70 ${latW},-90 C${latW},-100 55,-108 47,-118 C38,-123 24,-125 10,-128 Z`;

// 몸 실루엣을 이루는 도형 목록 (같은 채움색으로 그리면 하나의 몸처럼 보인다)
const bodyShapes = (arms, legs) => {
  const leg = LEGS[legs];
  const out = [];
  [-1, 1].forEach(side => {
    const m = side < 0 ? (p) => p : mirror;
    const h = m(H0), k = m(leg.k), a = m(leg.a);
    out.push({ d: limb(h, k, 44, 19, 15) }, { d: limb(k, a, 18, 10, 11) });
    const foot = m([leg.a[0] - 9, leg.a[1] + 7]);
    out.push({ e: [foot[0], foot[1], 13, 5] });
  });
  out.push({ d: torsoPath(BODY) });
  out.push({ d: 'M-11,-142 L11,-142 L12,-126 C24,-124 38,-121 47,-117 L-47,-117 C-38,-121 -24,-124 -12,-126 Z' });
  [-1, 1].forEach((side, i) => {
    const A = ARMS[arms[i]];
    const m = side < 0 ? (p) => p : mirror;
    const s = m(S0), e = m(A.e), f = m(A.f);
    out.push({ d: limb(s, e, 27, 17, A.peak) }, { d: limb(e, f, 18, 12, 6) }, { c: [f[0], f[1], 9.5] });
    out.push({ c: [side * 56, -109, 19] });
  });
  out.push({ e: [0, -152, 13, 16] });
  return out;
};

const Shapes = ({ list, fill }) => list.map((s, i) => (
  s.d ? <path key={i} d={s.d} fill={fill} />
    : s.c ? <circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} fill={fill} />
      : <ellipse key={i} cx={s.e[0]} cy={s.e[1]} rx={s.e[2]} ry={s.e[3]} fill={fill} />
));

// 높이 지도: 밝을수록 앞으로 튀어나온 부분. 조명 필터가 이 지도로 입체 음영과 피부 광택을 만든다.
// (근육 덩어리 = 밝은 타원, 근육 사이 골 = 어두운 선)
const HM = { base: '#7c7c7c', belly: '#b9b9b9', peak: '#d6d6d6', groove: '#3e3e3e' };
const ell = (cx, cy, rx, ry, rot, fill, key) => <ellipse key={key} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} transform={`rotate(${rot} ${cx} ${cy})`} />;
const angle = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;

const HeightMap = ({ arms, legs, shapes }) => {
  const leg = LEGS[legs];
  const g = { fill: 'none', stroke: HM.groove, strokeLinecap: 'round' };
  return (
    <g>
      <Shapes list={shapes} fill={HM.base} />
      {/* 승모·가슴 */}
      {[-1, 1].map(sd => ell(sd * 24, -122, 16, 5, sd * -18, '#a2a2a2', `tr${sd}`))}
      {[-1, 1].map(sd => ell(sd * 23, -102, 21, 13, sd * -8, HM.belly, `pc${sd}`))}
      {[-1, 1].map(sd => ell(sd * 26, -104, 12, 7, sd * -8, HM.peak, `pcp${sd}`))}
      {/* 광배·전거근 */}
      {[-1, 1].map(sd => ell(sd * 52, -78, 9, 20, sd * 12, '#9c9c9c', `lt${sd}`))}
      {[-1, 1].map(sd => [0, 1, 2].map(i => ell(sd * (37 - i * 1.5), -80 + i * 8, 5, 2.6, sd * 25, '#a8a8a8', `sr${sd}${i}`)))}
      {/* 복근 6개 + 아랫배 */}
      {[-78, -62, -46].map(y => [-1, 1].map(sd => ell(sd * 7.5, y + 6, 6.2, 6, 0, HM.belly, `ab${y}${sd}`)))}
      {[-1, 1].map(sd => ell(sd * 6, -22, 5.5, 8, 0, '#a6a6a6', `lab${sd}`))}
      {[-1, 1].map(sd => ell(sd * 25, -44, 6, 15, sd * -10, '#9e9e9e', `ob${sd}`))}
      {/* 팔 */}
      {[-1, 1].map((sd, i) => {
        const A = ARMS[arms[i]];
        const m = sd < 0 ? (p) => p : mirror;
        const s = m(S0), e = m(A.e), f = m(A.f);
        const bi = lerp(s, e, 0.55), fo = lerp(e, f, 0.32);
        return (
          <g key={`arm${sd}`}>
            {ell(sd * 56, -110, 17, 15, 0, HM.belly, 'dl')}
            {ell(sd * 54, -114, 9, 8, 0, HM.peak, 'dlp')}
            {ell(bi[0], bi[1], 14, 9 + A.peak * 0.25, angle(s, e), HM.belly, 'bi')}
            {ell(bi[0], bi[1] - 1, 7, 4 + A.peak * 0.15, angle(s, e), HM.peak, 'bip')}
            {ell(fo[0], fo[1], 10, 6.5, angle(e, f), '#b0b0b0', 'fo')}
          </g>
        );
      })}
      {/* 다리: 외측광근·대퇴직근·내측광근(눈물방울)·종아리 */}
      {[-1, 1].map(sd => {
        const m = sd < 0 ? (p) => p : mirror;
        const h = m(H0), k = m(leg.k), a = m(leg.a);
        const t = angle(h, k);
        const vl = lerp(h, k, 0.45), rf = lerp(h, k, 0.4), vm = lerp(h, k, 0.82), cf = lerp(k, a, 0.32);
        return (
          <g key={`leg${sd}`}>
            {ell(vl[0] + sd * 8, vl[1], 22, 9, t, HM.belly, 'vl')}
            {ell(rf[0] - sd * 3, rf[1], 18, 7, t, HM.peak, 'rf')}
            {ell(vm[0] - sd * 6, vm[1], 9, 7, t, HM.belly, 'vm')}
            {ell(cf[0], cf[1], 15, 7, angle(k, a), HM.belly, 'cf')}
            {ell(cf[0] + sd * 2, cf[1] - 2, 8, 4, angle(k, a), HM.peak, 'cfp')}
            <path d={`M${P(lerp(h, k, 0.15))} Q${P([lerp(h, k, 0.5)[0] - sd * 6, lerp(h, k, 0.5)[1]])} ${P(lerp(h, k, 0.9))}`} {...g} strokeWidth="2.2" />
            <path d={`M${P([k[0] + sd * 6, k[1] - 26])} q${-sd * 9},6 ${-sd * 4},20`} {...g} strokeWidth="1.8" />
          </g>
        );
      })}
      {/* 근육 사이 골 */}
      {[-1, 1].map(sd => <path key={`pl${sd}`} d={`M${sd * 2},-89 C${sd * 22},-82 ${sd * 42},-88 ${sd * 47},-101`} {...g} strokeWidth="2.6" />)}
      <path d="M0,-118 L0,-12" {...g} strokeWidth="2.2" />
      {[-70, -54, -38].map(y => <path key={`ar${y}`} d={`M-14,${y} Q0,${y + 3} 14,${y}`} {...g} strokeWidth="1.8" />)}
      {[-1, 1].map(sd => <path key={`dg${sd}`} d={`M${sd * 42},-97 Q${sd * 56},-88 ${sd * 66},-96`} {...g} strokeWidth="2" />)}
      {/* 얼굴 골격 (특정 인물이 아닌 일반적인 형태와 그늘만) */}
      <ellipse cx="0" cy="-152" rx="13" ry="16" fill={HM.base} />
      {ell(0, -158, 10, 3, 0, '#a8a8a8', 'brow')}
      {[-1, 1].map(sd => ell(sd * 5, -153.5, 3.4, 2, 0, '#4a4a4a', `eye${sd}`))}
      {ell(0, -149, 1.8, 4.5, 0, '#bdbdbd', 'nose')}
      {[-1, 1].map(sd => ell(sd * 7.5, -148, 3, 2.2, 0, '#a2a2a2', `ck${sd}`))}
      {ell(0, -140, 4.5, 2.5, 0, '#a8a8a8', 'chin')}
      <path d="M-3,-143.5 L3,-143.5" {...g} strokeWidth="1.1" />
      {[-1, 1].map(sd => ell(sd * 13, -151, 2.4, 4, 0, '#8e8e8e', `ear${sd}`))}
      {[-1, 1].map(sd => <path key={`scm${sd}`} d={`M${sd * 6},-138 L${sd * 3},-127`} {...g} strokeWidth="1.4" />)}
    </g>
  );
};

const HAIR = {
  bald: (<ellipse cx="-4" cy="-162" rx="5" ry="3" fill="#fff" opacity="0.28" />),
  spikyBlond: (<path d="M-14,-158 L-16,-176 L-9,-166 L-6,-183 L0,-168 L5,-184 L8,-167 L15,-178 L14,-158 C8,-164 -8,-164 -14,-158 Z" fill="#f4dc8c" stroke="#b8902e" strokeWidth="1" />),
  classic70s: (<path d="M-15,-148 C-18,-166 -8,-175 2,-174 C13,-173 18,-164 15,-149 C13,-157 9,-161 3,-162 C-4,-163 -11,-158 -13,-146 Z" fill="#3a2f28" />),
  slick: (<path d="M-14,-152 C-15,-168 -4,-173 3,-172 C13,-171 16,-162 14,-152 C10,-160 2,-163 -4,-162 C-10,-160 -12,-157 -14,-152 Z" fill="#2b2220" />),
  shortBlack: (<path d="M-13,-153 C-14,-167 -4,-171 2,-170 C11,-169 14,-162 13,-153 C9,-159 1,-161 -5,-160 C-10,-159 -12,-156 -13,-153 Z" fill="#141414" />),
};

const Extras = ({ arms, hair, trunks, extras = {} }) => {
  const right = ARMS[arms[1]];
  const s = mirror(S0), e = mirror(right.e), f = mirror(right.f);
  return (
    <g>
      {extras.tattoo && (
        <g stroke="#1b1513" strokeWidth="1.5" fill="none" opacity="0.7" strokeLinecap="round">
          {[0.15, 0.4, 0.65].map(t => { const p = lerp(e, f, t); return <path key={t} d={`M${P([p[0] - 5, p[1]])} q4,-4 8,0 q-3,5 -6,2`} />; })}
          {[0.35, 0.6].map(t => { const p = lerp(s, e, t); return <path key={t} d={`M${P([p[0] - 6, p[1] - 2])} q5,6 10,0`} />; })}
        </g>
      )}
      {extras.beard && <path d="M-11,-148 C-10,-138 -5,-135 0,-135 C5,-135 10,-138 11,-148 C7,-143 -7,-143 -11,-148 Z" fill="#1d1715" opacity="0.9" />}
      {HAIR[hair]}
      {extras.glasses && (
        <g>
          <rect x="-12.5" y="-157" width="11" height="7" rx="3" fill="#e0782c" opacity="0.92" stroke="#2b1a0e" strokeWidth="1.2" />
          <rect x="1.5" y="-157" width="11" height="7" rx="3" fill="#e0782c" opacity="0.92" stroke="#2b1a0e" strokeWidth="1.2" />
          <line x1="-1.5" y1="-155" x2="1.5" y2="-155" stroke="#2b1a0e" strokeWidth="1.2" />
          <rect x="-10" y="-156" width="3" height="2" fill="#fff" opacity="0.6" />
        </g>
      )}
      {extras.medal && (
        <g>
          <path d="M-12,-130 L-3,-104 M12,-130 L3,-104" stroke="#c0262d" strokeWidth="4" />
          <circle cx="0" cy="-98" r="8" fill="url(#lc-gold)" stroke="#8a6512" strokeWidth="1" />
          <path d="M0,-102 l1.6,3.2 3.4,0.4 -2.5,2.3 0.7,3.4 -3.2,-1.7 -3.2,1.7 0.7,-3.4 -2.5,-2.3 3.4,-0.4 Z" fill="#fff6d0" />
        </g>
      )}
      {extras.chain && (<g><path d="M-14,-127 Q0,-104 14,-127" fill="none" stroke="#e5e7eb" strokeWidth="1.8" strokeDasharray="2 1" /><path d="M-2.5,-115 L2.5,-115 L0,-109 Z" fill="#f3f4f6" /></g>)}
      {extras.crown && (
        <g transform="translate(0,-166)">
          <path d="M-17,0 L-19,-20 L-9,-10 L0,-26 L9,-10 L19,-20 L17,0 Z" fill="url(#lc-gold)" stroke="#8a6512" strokeWidth="1.2" />
          <rect x="-18" y="-3" width="36" height="6" rx="2" fill="#c99a2e" />
          {[-10, 0, 10].map(x => <circle key={x} cx={x} cy="0" r="2" fill={x === 0 ? '#c0262d' : '#2456b8'} />)}
          <circle cx="0" cy="-27" r="2.4" fill="#f8e7a1" />
        </g>
      )}
      <path d={`M${-BODY.hipW - 1},-7 L${BODY.hipW + 1},-7 L${BODY.hipW - 4},3 L9,17 Q0,22 -9,17 L${-BODY.hipW + 4},3 Z`} fill={trunks} />
      <path d={`M${-BODY.hipW + 2},-5 L${BODY.hipW - 2},-5`} stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" />
      {extras.number && <g><circle cx="17" cy="2" r="6" fill="#f5f5f4" /><text x="17" y="4.5" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#111">{extras.number}</text></g>}
    </g>
  );
};

// 표지별 설정 (skin: 밝은 쪽, 기본, 그늘)
const COVERS = {
  leg_ronnie: {
    bg: ['#160925', '#3b1460'], spot: '#c79bff', rim: '#f5c84c', skin: ['#6a4431', '#3a2116', '#120806'],
    word: 'YEAH BUDDY!', cape: true, trophies: 8,
    figure: { arms: ['doubleBiceps', 'hips'], legs: 'stand', hair: 'bald', trunks: '#cfd3da', extras: { crown: true } },
  },
  leg_jay: {
    bg: ['#1f1004', '#5a3410'], spot: '#ffcf7a', rim: '#ffb347', skin: ['#c4884f', '#874c22', '#371806'],
    word: 'COMEBACK', bokeh: '#ffd27a', trophies: 4,
    figure: { arms: ['relaxed', 'relaxed'], legs: 'wide', hair: 'spikyBlond', trunks: '#151515' },
  },
  leg_arnold: {
    bg: ['#141414', '#444'], spot: '#ffffff', rim: '#f2f2f2', skin: ['#9c9c9c', '#5a5a5a', '#161616'], mono: true,
    word: 'OAK', crowd: true, oak: true, trophies: 7,
    figure: { arms: ['relaxed', 'relaxed'], legs: 'stand', hair: 'classic70s', trunks: '#1a1a1a' },
  },
  leg_cbum: {
    bg: ['#0a2229', '#1d4e5c'], spot: '#7fe3f0', rim: '#ff8a5b', skin: ['#d99a69', '#8d512d', '#36190b'],
    word: 'CLASSIC', trophies: 5,
    figure: { arms: ['relaxed', 'relaxed'], legs: 'stand', hair: 'slick', trunks: '#111', extras: { beard: true, tattoo: true, number: '27' } },
  },
  k_park: {
    bg: ['#0b1d3d', '#3a0f1c'], spot: '#9ec3ff', rim: '#ff5d6c', skin: ['#d9955e', '#8e4f28', '#3a1b0a'],
    word: '한 개만 더!', taeguk: true,
    figure: { arms: ['doubleBiceps', 'hips'], legs: 'stand', hair: 'shortBlack', trunks: '#111', extras: { number: '36' } },
  },
  k_kim_gw: {
    bg: ['#041c15', '#14513c'], spot: '#a6f0c6', rim: '#ffb35c', skin: ['#d99a68', '#8f542d', '#3a1d0c'],
    word: 'BACK MONSTER', bokeh: '#9be7b0', trees: true,
    figure: { arms: ['mostMuscular', 'mostMuscular'], legs: 'stand', hair: 'shortBlack', trunks: '#1b1b1b', extras: { glasses: true, chain: true } },
  },
  k_jang: {
    bg: ['#220404', '#6b0f12'], spot: '#ff9a7a', rim: '#ffcc66', skin: ['#d98c57', '#8e4821', '#371707'],
    word: '212', sparks: true,
    figure: { arms: ['doubleBiceps', 'doubleBiceps'], legs: 'wide', hair: 'shortBlack', trunks: '#2546c4', extras: { number: '10' } },
  },
  k_kim_km: {
    bg: ['#140828', '#4b1b6e'], spot: '#d9b3ff', rim: '#ffd166', skin: ['#d98f5a', '#8c4b22', '#361807'],
    word: 'CHAMPION', beams: true,
    figure: { arms: ['doubleBiceps', 'doubleBiceps'], legs: 'squat', hair: 'shortBlack', trunks: '#151515', extras: { medal: true } },
  },
};

const Trophy = ({ x, y, s = 1, color }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={color}>
    <path d="M-6,-16 L6,-16 L5,-6 C4,-2 -4,-2 -5,-6 Z" />
    <path d="M-6,-14 C-11,-14 -11,-8 -5,-7 M6,-14 C11,-14 11,-8 5,-7" fill="none" stroke={color} strokeWidth="1.4" />
    <rect x="-1.2" y="-3" width="2.4" height="5" /><rect x="-5" y="2" width="10" height="3" rx="1" />
  </g>
);

const Laurel = ({ x, y, color, s = 1, opacity = 0.6 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={color} opacity={opacity}>
    {[-1, 1].map(sd => (
      <g key={sd} transform={`scale(${sd},1)`}>
        <path d="M-4,26 C-26,18 -34,-4 -24,-26" fill="none" stroke={color} strokeWidth="1.6" />
        {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={-12 - i * 3.4} cy={20 - i * 10} rx="6.5" ry="2.6" transform={`rotate(${-50 + i * 14} ${-12 - i * 3.4} ${20 - i * 10})`} />)}
      </g>
    ))}
  </g>
);

const OAK_LEAF = 'M0,-12 C4,-10 2,-7 6,-6 C3,-3 7,0 4,2 C6,5 3,7 1,6 C1,9 -1,9 -1,6 C-3,7 -6,5 -4,2 C-7,0 -3,-3 -6,-6 C-2,-7 -4,-10 0,-12 Z';
const OakBranch = ({ x, y, flip = 1, color }) => (
  <g transform={`translate(${x},${y}) scale(${flip},1)`} fill={color} opacity="0.55">
    <path d="M0,0 C30,10 60,8 90,30" fill="none" stroke={color} strokeWidth="2" />
    {[[18, 4, 20], [36, 8, -30], [52, 9, 30], [68, 16, -20], [84, 26, 40]].map(([lx, ly, r], i) => (
      <path key={i} d={OAK_LEAF} transform={`translate(${lx},${ly}) rotate(${r}) scale(1.3)`} />
    ))}
    <circle cx="44" cy="18" r="3.2" /><circle cx="76" cy="30" r="3.2" />
  </g>
);

const seeded = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

export const LegendCover = ({ id, className = 'w-full h-full', figureX = 292 }) => {
  const c = COVERS[id];
  if (!c) return null;
  const rnd = seeded(id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0));
  const gid = `lc-${id}`;
  const shapes = bodyShapes(c.figure.arms, c.figure.legs);
  const fig = `translate(${figureX},168) scale(0.82)`;
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c.bg[0]} /><stop offset="100%" stopColor={c.bg[1]} /></linearGradient>
        <radialGradient id={`${gid}-spot`} cx={figureX / 400} cy="0.42" r="0.55">
          <stop offset="0%" stopColor={c.spot} stopOpacity="0.5" /><stop offset="60%" stopColor={c.spot} stopOpacity="0.08" /><stop offset="100%" stopColor={c.spot} stopOpacity="0" />
        </radialGradient>
        {/* 몸 전체에 이어지는 조명: 왼쪽 위 밝게, 오른쪽 아래 어둡게 */}
        <linearGradient id={`${gid}-skin`} gradientUnits="userSpaceOnUse" x1="-110" y1="-160" x2="110" y2="80">
          <stop offset="0%" stopColor={c.skin[0]} /><stop offset="45%" stopColor={c.skin[1]} /><stop offset="100%" stopColor={c.skin[2]} />
        </linearGradient>
        <linearGradient id={`${gid}-vshade`} gradientUnits="userSpaceOnUse" x1="0" y1="-180" x2="0" y2="160">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.1" /><stop offset="45%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="lc-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffe9a3" /><stop offset="60%" stopColor="#e0a92c" /><stop offset="100%" stopColor="#9a6a12" /></linearGradient>
        <linearGradient id={`${gid}-beam`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.spot} stopOpacity="0.32" /><stop offset="100%" stopColor={c.spot} stopOpacity="0" /></linearGradient>
        <radialGradient id={`${gid}-vig`} cx="0.5" cy="0.5" r="0.75"><stop offset="60%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.6" /></radialGradient>
        <linearGradient id={`${gid}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.5" /></linearGradient>
        <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={`${gid}-blur`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        {/* 높이 지도를 비추는 조명: 주광(왼쪽 위) + 피부 광택 + 뒤쪽 테두리 빛 */}
        <filter id={`${gid}-lit`} x="-25%" y="-15%" width="150%" height="130%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b" />
          <feColorMatrix in="b" type="luminanceToAlpha" result="h0" />
          {/* 피부 결: 아주 약한 노이즈를 높이에 섞는다 */}
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="7" result="n" />
          <feColorMatrix in="n" type="luminanceToAlpha" result="na" />
          <feComposite in="h0" in2="na" operator="arithmetic" k1="0" k2="1" k3="0.011" k4="-0.005" result="h" />
          <feDiffuseLighting in="h" surfaceScale="7" diffuseConstant="1.05" lightingColor={c.skin[0]} result="d"><feDistantLight azimuth="235" elevation="46" /></feDiffuseLighting>
          <feSpecularLighting in="h" surfaceScale="7" specularConstant="0.8" specularExponent="24" lightingColor="#fff4e2" result="s"><feDistantLight azimuth="235" elevation="46" /></feSpecularLighting>
          <feDiffuseLighting in="h" surfaceScale="7" diffuseConstant="1" lightingColor={c.rim} result="r"><feDistantLight azimuth="-20" elevation="2" /></feDiffuseLighting>
          <feFlood floodColor={c.skin[2]} result="amb" />
          <feComposite in="d" in2="amb" operator="arithmetic" k1="0" k2="0.68" k3="0.3" k4="0" result="da" />
          <feComposite in="r" in2="da" operator="arithmetic" k1="0" k2="0.3" k3="1" k4="0" result="dr" />
          <feComposite in="s" in2="dr" operator="arithmetic" k1="0" k2="0.5" k3="1" k4="0" result="all" />
          <feComposite in="all" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id={`${gid}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={`${gid}-grain`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>

      <rect width="400" height="300" fill={`url(#${gid}-bg)`} />
      <text x="16" y="290" fontSize={c.word.length > 9 ? 44 : c.word.length > 5 ? 58 : 96} fontWeight="900" fill="#fff" opacity="0.07" letterSpacing="-1">{c.word}</text>

      {/* 배경 상징 */}
      {c.taeguk && (
        <g transform={`translate(${figureX},120)`} opacity="0.2">
          <circle r="96" fill="#cd2e3a" />
          <path d="M-96,0 A48,48 0 0,0 0,0 A48,48 0 0,1 96,0 A96,96 0 0,1 -96,0 Z" fill="#0047a0" />
        </g>
      )}
      {c.trees && Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={10 + i * 52 + rnd() * 18} y="0" width={5 + rnd() * 7} height="300" fill="#021009" opacity={0.3 + rnd() * 0.3} />
      ))}
      <g filter={`url(#${gid}-blur)`}>
        {[0, 1, 2].map(i => (
          <polygon key={i} points={`${figureX - 74 + i * 74},-10 ${figureX - 44 + i * 74},-10 ${figureX + (i - 1) * 46 + 40},300 ${figureX + (i - 1) * 46 - 40},300`} fill={`url(#${gid}-beam)`} opacity={c.beams ? 1 : 0.55} />
        ))}
      </g>
      <rect width="400" height="300" fill={`url(#${gid}-spot)`} />
      {c.bokeh && Array.from({ length: 24 }).map((_, i) => (
        <circle key={i} cx={rnd() * 400} cy={rnd() * 230} r={2 + rnd() * 7} fill={c.bokeh} opacity={0.12 + rnd() * 0.35} filter={rnd() > 0.5 ? `url(#${gid}-soft)` : undefined} />
      ))}
      {c.sparks && Array.from({ length: 30 }).map((_, i) => {
        const x = rnd() * 400, y = rnd() * 260, l = 4 + rnd() * 10;
        return <line key={i} x1={x} y1={y} x2={x + l * 0.4} y2={y - l} stroke="#ffb347" strokeWidth="1.4" opacity={0.25 + rnd() * 0.5} strokeLinecap="round" />;
      })}
      {c.oak && (<g><OakBranch x={-6} y={18} color="#cfcfcf" /><OakBranch x={406} y={18} flip={-1} color="#cfcfcf" /></g>)}
      {c.laurel && <Laurel x={figureX} y={54} color={c.rim} s={1.5} />}
      {c.crowd && (
        <g fill="#080808" opacity="0.7">
          {Array.from({ length: 14 }).map((_, i) => {
            const x = i * 30 + rnd() * 10, y = 262 + rnd() * 8;
            return <g key={i}><circle cx={x} cy={y} r="9" /><ellipse cx={x} cy={y + 22} rx="18" ry="14" /></g>;
          })}
        </g>
      )}

      <ellipse cx={figureX} cy="282" rx="120" ry="15" fill={c.spot} opacity="0.2" />
      <rect y="230" width="400" height="70" fill={`url(#${gid}-floor)`} />

      {c.cape && (
        <g transform={fig}>
          <path d="M-50,-118 C-110,-90 -128,20 -150,140 L-60,120 C-70,40 -60,-40 -40,-110 Z" fill="#f2efe9" />
          <path d="M50,-118 C110,-90 128,20 150,140 L60,120 C70,40 60,-40 40,-110 Z" fill="#e3ded6" />
          <path d="M-46,-114 C-100,-84 -116,20 -136,132" fill="none" stroke="#b5121b" strokeWidth="5" />
          <path d="M46,-114 C100,-84 116,20 136,132" fill="none" stroke="#b5121b" strokeWidth="5" />
        </g>
      )}

      <g transform={fig}>
        {/* 테두리 빛 */}
        <g filter={`url(#${gid}-glow)`} opacity="0.75"><Shapes list={shapes} fill={c.rim} /></g>
        {/* 몸 */}
        <g filter={`url(#${gid}-lit)`}><HeightMap arms={c.figure.arms} legs={c.figure.legs} shapes={shapes} /></g>
        <Shapes list={shapes} fill={`url(#${gid}-vshade)`} />
        <Extras {...c.figure} />
      </g>

      {c.trophies && Array.from({ length: c.trophies }).map((_, i) => <Trophy key={i} x={figureX - (c.trophies - 1) * 7 + i * 14} y={293} s={0.7} color={c.rim} />)}
      {/* 필름 입자: 사진 같은 질감 */}
      <rect width="400" height="300" filter={`url(#${gid}-grain)`} opacity={c.mono ? 0.16 : 0.07} />
      <rect width="400" height="300" fill={`url(#${gid}-vig)`} />
    </svg>
  );
};
