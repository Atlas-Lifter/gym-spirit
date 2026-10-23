import React, { useId } from 'react';

// 대회 포즈 설명용 마네킹. 관절 좌표로 정면·후면·측면 자세를 그리고,
// 지금 설명 중인 부위는 파랗게, 아직 다루지 않은 부위는 흐리게 보여 준다.
// 좌표계: 200 x 300, 바닥 y=286. 측면 그림은 오른쪽을 보는 기준으로 정의하고 face:'l'이면 좌우를 뒤집는다.

export const GROUPS = ['feet', 'legs', 'pelvis', 'torso', 'arms', 'hands', 'head'];
export const GROUP_OF = {
  lAnk: 'feet', rAnk: 'feet', lFoot: 'feet', rFoot: 'feet', nAnk: 'feet', fAnk: 'feet', nFoot: 'feet', fFoot: 'feet',
  lKnee: 'legs', rKnee: 'legs', nKnee: 'legs', fKnee: 'legs',
  pelvis: 'pelvis', tilt: 'pelvis', glute: 'pelvis', arch: 'pelvis', hip: 'pelvis',
  lSh: 'torso', rSh: 'torso', sh: 'torso', fSh: 'torso', lat: 'torso', waist: 'torso', lean: 'torso', chest: 'torso', twist: 'torso',
  lEl: 'arms', rEl: 'arms', lWr: 'arms', rWr: 'arms', nEl: 'arms', nWr: 'arms', fEl: 'arms', fWr: 'arms',
  lHand: 'hands', rHand: 'hands', nHand: 'hands', fHand: 'hands',
  head: 'head',
};

export const NEUTRAL = {
  front: {
    male: { head: { x: 100, y: 30, dir: 'front', tilt: 0 }, lSh: [76, 60], rSh: [124, 60], lat: 0, waist: 17, hip: 15, lean: 0, lEl: [71, 100], rEl: [129, 100], lWr: [69, 136], rWr: [131, 136], lHand: 'open', rHand: 'open', pelvis: [100, 146], tilt: 0, glute: 0, lKnee: [90, 212], rKnee: [110, 212], lAnk: [91, 272], rAnk: [109, 272], lFoot: { ang: -10 }, rFoot: { ang: 10 } },
    female: { head: { x: 100, y: 31, dir: 'front', tilt: 0 }, lSh: [80, 62], rSh: [120, 62], lat: 0, waist: 13, hip: 19, lean: 0, lEl: [75, 100], rEl: [125, 100], lWr: [73, 134], rWr: [127, 134], lHand: 'open', rHand: 'open', pelvis: [100, 146], tilt: 0, glute: 0, lKnee: [91, 212], rKnee: [109, 212], lAnk: [93, 272], rAnk: [107, 272], lFoot: { ang: -10 }, rFoot: { ang: 10 } },
  },
  side: {
    male: { head: { x: 102, y: 30, dir: 'side', tilt: 0 }, sh: [100, 60], fSh: [98, 61], chest: 17, twist: 0, lat: 0, lean: 0, nEl: [101, 99], nWr: [102, 135], fEl: [99, 99], fWr: [99, 135], nHand: 'open', fHand: 'open', pelvis: [100, 146], glute: 13, arch: 0, nKnee: [101, 212], nAnk: [100, 272], fKnee: [99, 212], fAnk: [98, 272], nFoot: {}, fFoot: {} },
    female: { head: { x: 102, y: 31, dir: 'side', tilt: 0 }, sh: [100, 62], fSh: [98, 63], chest: 15, twist: 0, lat: 0, lean: 0, nEl: [101, 99], nWr: [102, 133], fEl: [99, 99], fWr: [99, 133], nHand: 'open', fHand: 'open', pelvis: [100, 146], glute: 16, arch: 0, nKnee: [101, 212], nAnk: [100, 272], fKnee: [99, 212], fAnk: [98, 272], nFoot: {}, fFoot: {} },
  },
};

const f = (n) => Math.round(n * 10) / 10;
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// 두 점 사이 둥근 마디 (가운데 rb만큼 부풂)
const limb = (p1, p2, r1, r2, rb) => {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const mid = lerp(p1, p2, 0.5);
  const k = (rb ?? (r1 + r2) / 2) * 2 - (r1 + r2) / 2;
  return `M ${P([p1[0] + nx * r1, p1[1] + ny * r1])} Q ${P([mid[0] + nx * k, mid[1] + ny * k])} ${P([p2[0] + nx * r2, p2[1] + ny * r2])} A ${f(r2)} ${f(r2)} 0 0 0 ${P([p2[0] - nx * r2, p2[1] - ny * r2])} Q ${P([mid[0] - nx * k, mid[1] - ny * k])} ${P([p1[0] - nx * r1, p1[1] - ny * r1])} A ${f(r1)} ${f(r1)} 0 0 0 ${P([p1[0] + nx * r1, p1[1] + ny * r1])} Z`;
};
const angleOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;

// 손 모양: 손목에서 손가락 방향으로 그린 뒤 회전
const Hand = ({ at, dir, type, thumb, style }) => {
  if (!type || type === 'hidden') return null;
  const rot = dir - 90;
  if (type === 'fist') {
    return (
      <g transform={`translate(${f(at[0])} ${f(at[1])}) rotate(${f(rot)})`} {...style}>
        <path d="M -4.6 0 C -5.2 4 -4.2 8.4 0 8.6 C 4.2 8.4 5.2 4 4.6 0 Z" />
        <path d={`M ${thumb * 3.6} 1.6 C ${thumb * 5.4} 3 ${thumb * 4.2} 6 ${thumb * 1.6} 5.6`} fill="none" />
        <path d="M -3.4 6.6 L 3.4 6.6" fill="none" strokeOpacity="0.5" />
      </g>
    );
  }
  if (type === 'grip') {
    return (
      <g transform={`translate(${f(at[0])} ${f(at[1])}) rotate(${f(rot)})`} {...style}>
        <path d="M -4.2 0 C -5 3.4 -3.6 7 0 7.4 C 3.6 7 5 3.4 4.2 0 Z" />
        <path d="M -3.6 3.2 L 3.6 3.2 M -3.4 5.2 L 3.4 5.2" fill="none" strokeOpacity="0.5" />
      </g>
    );
  }
  if (type === 'hip') {
    // 손바닥을 허리에 대고 손가락은 앞쪽(아래 비스듬히)
    return (
      <g transform={`translate(${f(at[0])} ${f(at[1])}) rotate(${f(rot)})`} {...style}>
        <path d="M -4 0 C -4.8 4 -3.6 10.6 0 11.4 C 3.6 10.6 4.8 4 4 0 Z" />
        <path d={`M ${thumb * 3.8} 0.6 C ${thumb * 7} 1.4 ${thumb * 7.4} 4 ${thumb * 6.2} 5.2`} fill="none" />
      </g>
    );
  }
  // open: 손가락을 모아 편 손 (openUp은 손바닥이 앞을 보며 위로 편 손)
  return (
    <g transform={`translate(${f(at[0])} ${f(at[1])}) rotate(${f(rot)})`} {...style}>
      <path d="M -4 0 C -4.4 5 -3.4 12.4 0 13 C 3.4 12.4 4.4 5 4 0 Z" />
      <path d={`M ${thumb * 3.4} 1.4 C ${thumb * 6.4} 3.4 ${thumb * 6.2} 7.4 ${thumb * 4.6} 8.6`} fill="none" />
      <path d="M -1.4 7 L -1.4 12.4 M 1.4 7 L 1.4 12.4" fill="none" strokeOpacity="0.45" />
    </g>
  );
};

// 정면/후면 발: ang은 발끝이 바깥으로 벌어진 각도(왼쪽 음수, 오른쪽 양수). toe면 뒤꿈치를 들어 발끝으로 선다
const FootFront = ({ at, ang = 0, toe, heel, back, style }) => {
  const rad = ang * Math.PI / 180;
  const len = 4 + Math.abs(Math.sin(rad)) * 7;
  const tip = [at[0] + Math.sin(rad) * (6 + len * 0.4), at[1] + (toe ? 10 : 8)];
  return (
    <g {...style}>
      <ellipse cx={f(tip[0])} cy={f(tip[1])} rx={f(4.4 + Math.abs(Math.sin(rad)) * 3.4)} ry={toe ? 6 : 4.2} transform={`rotate(${f(ang * 0.55)} ${f(tip[0])} ${f(tip[1])})`} />
      {heel && <path d={`M ${f(at[0] - 2)} ${f(at[1] + 4)} L ${f(at[0] - 1)} ${f(at[1] + 15)} L ${f(at[0] + 1)} ${f(at[1] + 15)} L ${f(at[0] + 2)} ${f(at[1] + 4)}`} fill="none" />}
      {back && <ellipse cx={f(at[0])} cy={f(at[1] + 5)} rx="3.6" ry="3" />}
    </g>
  );
};

// 측면 발 (오른쪽을 본다)
const FootSide = ({ at, toe, heel, style }) => {
  const d = toe
    ? `M ${f(at[0] - 3)} ${f(at[1] - 1)} C ${f(at[0] - 1)} ${f(at[1] + 6)} ${f(at[0] + 7)} ${f(at[1] + 13)} ${f(at[0] + 13)} ${f(at[1] + 14)} L ${f(at[0] + 14)} ${f(at[1] + 11)} C ${f(at[0] + 9)} ${f(at[1] + 8)} ${f(at[0] + 4)} ${f(at[1] + 1)} ${f(at[0] + 3)} ${f(at[1] - 2)} Z`
    : `M ${f(at[0] - 4)} ${f(at[1] + 1)} C ${f(at[0] - 6)} ${f(at[1] + 12)} ${f(at[0] - 4)} ${f(at[1] + 14)} ${f(at[0] + 2)} ${f(at[1] + 14)} L ${f(at[0] + 16)} ${f(at[1] + 14)} C ${f(at[0] + 18)} ${f(at[1] + 12)} ${f(at[0] + 12)} ${f(at[1] + 8)} ${f(at[0] + 4)} ${f(at[1] + 3)} Z`;
  return (
    <g {...style}>
      <path d={d} />
      {heel && <path d={`M ${f(at[0] - 3)} ${f(at[1] + (toe ? 4 : 12))} L ${f(at[0] - 2)} ${f(at[1] + 16)}`} fill="none" strokeWidth="1.6" />}
    </g>
  );
};

const Head = ({ h, female, view, style, faceStyle }) => {
  const { x, y, dir = 'front', tilt = 0 } = h;
  const rx = female ? 11.4 : 12.2, ry = female ? 14 : 14.6;
  const hair = female ? '#3f2a1d' : '#2a2a2a';
  if (view === 'back' || dir === 'back') {
    return (
      <g transform={`rotate(${tilt} ${x} ${y})`}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} {...style} />
        <path d={female ? `M ${x - rx - 1} ${y - 2} C ${x - rx} ${y - ry - 6} ${x + rx} ${y - ry - 6} ${x + rx + 1} ${y - 2} C ${x + rx + 3} ${y + 16} ${x + 8} ${y + 26} ${x} ${y + 30} C ${x - 8} ${y + 26} ${x - rx - 3} ${y + 16} ${x - rx - 1} ${y - 2} Z` : `M ${x - rx} ${y + 2} C ${x - rx - 1} ${y - ry - 2} ${x + rx + 1} ${y - ry - 2} ${x + rx} ${y + 2} C ${x + 6} ${y + 6} ${x - 6} ${y + 6} ${x - rx} ${y + 2} Z`} fill={hair} />
      </g>
    );
  }
  if (dir === 'side') {
    return (
      <g transform={`rotate(${tilt} ${x} ${y})`}>
        <path d={`M ${x - 10} ${y - 6} C ${x - 10} ${y - 16} ${x - 2} ${y - 16} ${x + 4} ${y - 14} C ${x + 10} ${y - 12} ${x + 12} ${y - 6} ${x + 12} ${y} L ${x + 15} ${y + 4} L ${x + 12} ${y + 5} C ${x + 12} ${y + 9} ${x + 11} ${y + 11} ${x + 9} ${y + 12} C ${x + 6} ${y + 15} ${x} ${y + 15} ${x - 4} ${y + 13} C ${x - 8} ${y + 10} ${x - 11} ${y + 4} ${x - 10} ${y - 6} Z`} {...style} />
        <path d={female ? `M ${x - 11} ${y - 2} C ${x - 12} ${y - 18} ${x + 6} ${y - 19} ${x + 11} ${y - 8} C ${x + 4} ${y - 12} ${x - 2} ${y - 10} ${x - 3} ${y - 2} C ${x - 4} ${y + 8} ${x - 10} ${y + 18} ${x - 14} ${y + 26} C ${x - 14} ${y + 14} ${x - 12} ${y + 6} ${x - 11} ${y - 2} Z` : `M ${x - 10.6} ${y - 1} C ${x - 12} ${y - 17} ${x + 6} ${y - 18} ${x + 11} ${y - 7} C ${x + 4} ${y - 11} ${x - 2} ${y - 9} ${x - 4} ${y - 2} C ${x - 6} ${y - 2} ${x - 8} ${y} ${x - 10.6} ${y - 1} Z`} fill={hair} />
        <circle cx={x + 6} cy={y - 2} r="1.1" {...faceStyle} />
        <path d={`M ${x + 9} ${y + 8} L ${x + 6} ${y + 8}`} fill="none" {...faceStyle} />
        <ellipse cx={x - 3} cy={y + 1} rx="2" ry="3.2" fill="none" {...faceStyle} />
      </g>
    );
  }
  // 정면 (three: 약간 돌린 얼굴)
  const sx = dir === 'three' ? 3 : 0;
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} {...style} />
      <path d={female ? `M ${x - rx - 1} ${y + 2} C ${x - rx - 2} ${y - ry - 6} ${x + rx + 2} ${y - ry - 6} ${x + rx + 1} ${y + 2} C ${x + rx - 2} ${y - 8} ${x + 2} ${y - 11} ${x - 4} ${y - 9} C ${x - 9} ${y - 7} ${x - rx + 1} ${y - 4} ${x - rx - 1} ${y + 2} Z M ${x + rx} ${y} C ${x + rx + 4} ${y + 12} ${x + rx + 2} ${y + 22} ${x + rx - 1} ${y + 28} L ${x + rx - 4} ${y + 10} Z` : `M ${x - rx} ${y - 1} C ${x - rx - 1} ${y - ry - 2} ${x + rx + 1} ${y - ry - 2} ${x + rx} ${y - 1} C ${x + rx - 3} ${y - 8} ${x + 4} ${y - 10} ${x} ${y - 9} C ${x - 5} ${y - 10} ${x - rx + 3} ${y - 8} ${x - rx} ${y - 1} Z`} fill={hair} />
      <g {...faceStyle} fill="none">
        <path d={`M ${x - 6 + sx} ${y + 1} Q ${x - 4 + sx} ${y - 0.6} ${x - 2 + sx} ${y + 1} M ${x + 2 + sx} ${y + 1} Q ${x + 4 + sx} ${y - 0.6} ${x + 6 + sx} ${y + 1}`} />
        <path d={`M ${x + sx} ${y + 2} L ${x - 0.8 + sx} ${y + 6.4} L ${x + 1 + sx} ${y + 6.6}`} />
        <path d={female ? `M ${x - 3 + sx} ${y + 9.4} Q ${x + sx} ${y + 11.6} ${x + 3 + sx} ${y + 9.4}` : `M ${x - 3 + sx} ${y + 9.6} L ${x + 3 + sx} ${y + 9.6}`} />
      </g>
    </g>
  );
};

// 표시 1개: 화살표 / 각도 / 글자 / 점선
const Mark = ({ m, flip, color }) => {
  const X = (x) => (flip ? 200 - x : x);
  if (m.arrow) {
    const [x1, y1, x2, y2, c = 0] = m.arrow;
    const a = [X(x1), y1], b = [X(x2), y2];
    const mid = lerp(a, b, 0.5);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const n = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const cc = flip ? -c : c;
    const ctrl = [mid[0] + n[0] * cc, mid[1] + n[1] * cc];
    const ang = Math.atan2(b[1] - ctrl[1], b[0] - ctrl[0]);
    const head = (s) => [b[0] - 5.2 * Math.cos(ang + s), b[1] - 5.2 * Math.sin(ang + s)];
    return (
      <g stroke={color} fill="none" strokeWidth="1.6" strokeLinecap="round">
        <path d={`M ${P(a)} Q ${P(ctrl)} ${P(b)}`} />
        <path d={`M ${P(head(0.45))} L ${P(b)} L ${P(head(-0.45))}`} />
      </g>
    );
  }
  if (m.angle) {
    const [cx0, cy, r, a0, a1, text] = m.angle;
    const cx = X(cx0);
    const s0 = flip ? 180 - a0 : a0, s1 = flip ? 180 - a1 : a1;
    const pa = [cx + r * Math.cos(s0 * Math.PI / 180), cy + r * Math.sin(s0 * Math.PI / 180)];
    const pb = [cx + r * Math.cos(s1 * Math.PI / 180), cy + r * Math.sin(s1 * Math.PI / 180)];
    const large = Math.abs(s1 - s0) > 180 ? 1 : 0;
    const sweep = (s1 - s0 + 360) % 360 < 180 ? 1 : 0;
    const midA = ((s0 + s1) / 2) * Math.PI / 180;
    return (
      <g>
        <path d={`M ${cx} ${cy} L ${P(pa)} M ${cx} ${cy} L ${P(pb)}`} stroke={color} strokeWidth="0.8" strokeDasharray="2 1.5" fill="none" />
        <path d={`M ${P(pa)} A ${r} ${r} 0 ${large} ${sweep} ${P(pb)}`} stroke={color} strokeWidth="1.4" fill="none" />
        {text && <Label x={cx + (r + 9) * Math.cos(midA)} y={cy + (r + 9) * Math.sin(midA)} text={text} color={color} />}
      </g>
    );
  }
  if (m.line) {
    const [x1, y1, x2, y2] = m.line;
    return <path d={`M ${X(x1)} ${y1} L ${X(x2)} ${y2}`} stroke={color} strokeWidth="1" strokeDasharray="3 2" fill="none" />;
  }
  if (m.label) {
    const [x, y, text] = m.label;
    return <Label x={X(x)} y={y} text={text} color={color} />;
  }
  return null;
};

const Label = ({ x, y, text, color }) => {
  const w = text.length * 5.4 + 6;
  return (
    <g>
      <rect x={f(x - w / 2)} y={f(y - 6.5)} width={f(w)} height="13" rx="4" fill="#ffffff" stroke={color} strokeWidth="0.8" />
      <text x={f(x)} y={f(y + 3.2)} textAnchor="middle" fontSize="8.6" fontWeight="800" fill={color}>{text}</text>
    </g>
  );
};

// pose: { view, face, gender, outfit, joints }, setGroups/focusGroups: 이번 단계까지 맞춘 부위 / 지금 설명하는 부위
export const PosingFigure = ({ pose, setGroups = GROUPS, focusGroups = [], marks = [], className = 'w-full h-full' }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const female = pose.gender === 'female';
  const view = pose.view;
  const isSide = view === 'side';
  const base = NEUTRAL[isSide ? 'side' : 'front'][female ? 'female' : 'male'];
  const j = {};
  Object.keys({ ...base, ...pose.joints }).forEach(k => {
    const g = GROUP_OF[k];
    j[k] = pose.joints[k] !== undefined && (!g || setGroups.includes(g)) ? pose.joints[k] : base[k];
  });
  const flip = isSide && pose.face === 'l';

  const COL = {
    skin: '#eef0f3', line: '#7c7f86', focusFill: '#cfe0ff', focusLine: '#2563eb', dim: 0.38,
    trunks: '#1f2937', board: '#334155', bikini: '#db2777', mark: '#e11d48',
  };
  const styleFor = (g) => {
    const focused = focusGroups.includes(g);
    const isSet = setGroups.includes(g);
    return {
      fill: focused ? `url(#${uid}-focus)` : `url(#${uid}-skin)`,
      stroke: focused ? COL.focusLine : COL.line,
      strokeWidth: focused ? 1.5 : 1.1,
      strokeLinejoin: 'round',
      opacity: isSet || focused ? 1 : COL.dim,
    };
  };
  const faceStyle = { stroke: '#4b5563', strokeWidth: 0.9, fill: '#4b5563', strokeLinecap: 'round' };
  const R = female
    ? { ua: 5.6, uab: 6.2, fa: 4.4, fab: 4.8, wr: 3.2, th: 9.6, thb: 10.6, kn: 6, ca: 5.6, cab: 6.6, an: 3.2 }
    : { ua: 7, uab: 8.4, fa: 5.4, fab: 6.2, wr: 3.6, th: 10.4, thb: 11.6, kn: 6.6, ca: 6.2, cab: 7.6, an: 3.6 };

  const outfit = pose.outfit || (female ? 'bikini' : 'trunks');
  const outfitColor = outfit === 'board' ? COL.board : outfit === 'trunks' ? COL.trunks : COL.bikini;
  const heels = female;

  // ── 정면·후면 ───────────────────────────────────────────
  const renderFrontBack = () => {
    const back = view === 'back';
    const pv = j.pelvis, tilt = j.tilt || 0;
    const hipW = j.hip + (j.glute || 0) * 0.3;
    const lHip = [pv[0] - hipW * 0.62, pv[1] + 4], rHip = [pv[0] + hipW * 0.62, pv[1] + 4];
    const lean = j.lean || 0;
    const sL = j.lSh, sR = j.rSh;
    const neckY = (sL[1] + sR[1]) / 2 - 10 + lean * 0.3;
    const latL = [sL[0] + 8 - j.lat * 0.5, sL[1] + 28], latR = [sR[0] - 8 + j.lat * 0.5, sR[1] + 28];
    const waistY = pv[1] - 24;
    const wL = [pv[0] - j.waist - tilt * 0.3, waistY], wR = [pv[0] + j.waist - tilt * 0.3, waistY];
    const hL = [pv[0] - hipW, pv[1] + 2 + tilt * 0.4], hR = [pv[0] + hipW, pv[1] + 2 - tilt * 0.4];
    const torso = `M ${P([100 - 7, neckY])} C ${P([100 - 12, neckY + 6])} ${P([sL[0] + 6, sL[1] - 4])} ${P(sL)} C ${P([sL[0] - 5, sL[1] + 8])} ${P([latL[0] - 2, latL[1] - 10])} ${P(latL)} C ${P([latL[0] + 2, latL[1] + 12])} ${P([wL[0] - 1, wL[1] - 10])} ${P(wL)} C ${P([wL[0] - 1, wL[1] + 10])} ${P([hL[0], hL[1] - 10])} ${P(hL)} L ${P([pv[0], pv[1] + 16])} L ${P(hR)} C ${P([hR[0], hR[1] - 10])} ${P([wR[0] + 1, wR[1] + 10])} ${P(wR)} C ${P([wR[0] + 1, wR[1] - 10])} ${P([latR[0] - 2, latR[1] + 12])} ${P(latR)} C ${P([latR[0] + 2, latR[1] - 10])} ${P([sR[0] + 5, sR[1] + 8])} ${P(sR)} C ${P([sR[0] - 6, sR[1] - 4])} ${P([100 + 12, neckY + 6])} ${P([100 + 7, neckY])} Z`;
    const st = (g) => styleFor(g);
    const legs = (
      <g>
        {[['l', lHip, j.lKnee, j.lAnk, j.lFoot], ['r', rHip, j.rKnee, j.rAnk, j.rFoot]].map(([s, H, K, A, F]) => (
          <g key={s}>
            <path d={limb(H, K, R.th, R.kn, R.thb)} {...st('legs')} />
            <path d={limb(K, A, R.kn, R.an, R.cab)} {...st('legs')} />
            <FootFront at={A} ang={F?.ang || 0} toe={F?.toe} heel={heels} back={back} style={st('feet')} />
          </g>
        ))}
      </g>
    );
    const arm = (s, S, E, W, handType) => {
      const dir = angleOf(E, W);
      const thumb = (s === 'l') !== back ? 1 : -1;
      return (
        <g key={s}>
          <path d={limb(S, E, R.ua, R.fa + 0.6, R.uab)} {...st('arms')} />
          <path d={limb(E, W, R.fa + 0.4, R.wr, R.fab)} {...st('arms')} />
          <Hand at={W} dir={dir} type={handType} thumb={thumb} style={st('hands')} />
        </g>
      );
    };
    const handsBehind = (t) => t === 'hidden';
    return (
      <g>
        {/* 머리 뒤로 넘긴 손은 몸 뒤에 먼저 그린다 */}
        {handsBehind(j.lHand) && arm('l', sL, j.lEl, j.lWr, 'hidden')}
        {handsBehind(j.rHand) && arm('r', sR, j.rEl, j.rWr, 'hidden')}
        {legs}
        <path d={`M ${P([100 - 6.4, neckY + 4])} L ${P([100 - 6, neckY - 14])} L ${P([100 + 6, neckY - 14])} L ${P([100 + 6.4, neckY + 4])} Z`} {...st('head')} />
        <path d={torso} {...st('torso')} />
        {/* 근육 윤곽 */}
        <g stroke={COL.line} strokeOpacity="0.45" fill="none" strokeWidth="0.8" opacity={setGroups.includes('torso') ? 1 : COL.dim}>
          {!back && <path d={`M ${P([sL[0] + 6, sL[1] + 6])} C ${P([sL[0] + 8, sL[1] + 22])} ${P([96, sL[1] + 26])} ${P([100, sL[1] + 20])} C ${P([104, sR[1] + 26])} ${P([sR[0] - 8, sR[1] + 22])} ${P([sR[0] - 6, sR[1] + 6])}`} />}
          {!back && [0, 1, 2].map(k => <path key={k} d={`M ${P([pv[0] - j.waist * 0.5, waistY - 18 + k * 9])} Q ${P([pv[0], waistY - 16 + k * 9])} ${P([pv[0] + j.waist * 0.5, waistY - 18 + k * 9])}`} />)}
          {!back && <path d={`M ${P([pv[0], sL[1] + 22])} L ${P([pv[0], pv[1] + 2])}`} />}
          {back && <path d={`M 100 ${neckY + 2} L ${pv[0]} ${pv[1] + 2}`} />}
          {back && <path d={`M ${P([sL[0] + 10, sL[1] + 6])} Q ${P([sL[0] + 14, sL[1] + 20])} ${P([96, sL[1] + 22])} M ${P([sR[0] - 10, sR[1] + 6])} Q ${P([sR[0] - 14, sR[1] + 20])} ${P([104, sR[1] + 22])}`} />}
        </g>
        {/* 의상 */}
        {outfit === 'board'
          ? <path d={`M ${P([wL[0] - 1, waistY + 8])} L ${P([wR[0] + 1, waistY + 8])} L ${P([rHip[0] + R.th + 3, lerp(rHip, j.rKnee, 0.82)[1]])} L ${P([rHip[0] - R.th + 1, lerp(rHip, j.rKnee, 0.82)[1]])} L ${P([pv[0], pv[1] + 20])} L ${P([lHip[0] + R.th - 1, lerp(lHip, j.lKnee, 0.82)[1]])} L ${P([lHip[0] - R.th - 3, lerp(lHip, j.lKnee, 0.82)[1]])} Z`} fill={outfitColor} stroke="#0f172a" strokeWidth="0.8" opacity={setGroups.includes('pelvis') ? 1 : 0.6} />
          : <path d={`M ${P([hL[0] + 1, hL[1] - (female ? 2 : 5)])} Q ${P([pv[0], pv[1] - (female ? 0 : 3)])} ${P([hR[0] - 1, hR[1] - (female ? 2 : 5)])} L ${P([pv[0] + 4, pv[1] + 17])} L ${P([pv[0] - 4, pv[1] + 17])} Z`} fill={outfitColor} stroke="#0f172a" strokeWidth="0.8" opacity={setGroups.includes('pelvis') ? 1 : 0.6} />}
        {female && !back && (
          <g opacity={setGroups.includes('torso') ? 1 : 0.6} fill={outfitColor} stroke="#0f172a" strokeWidth="0.7">
            <path d={`M ${P([100 - 1.5, sL[1] + 19])} C ${P([100 - 6, sL[1] + 10])} ${P([sL[0] + 10, sL[1] + 12])} ${P([sL[0] + 8, sL[1] + 22])} C ${P([sL[0] + 10, sL[1] + 27])} ${P([100 - 5, sL[1] + 27])} ${P([100 - 1.5, sL[1] + 19])} Z`} />
            <path d={`M ${P([100 + 1.5, sR[1] + 19])} C ${P([100 + 6, sR[1] + 10])} ${P([sR[0] - 10, sR[1] + 12])} ${P([sR[0] - 8, sR[1] + 22])} C ${P([sR[0] - 10, sR[1] + 27])} ${P([100 + 5, sR[1] + 27])} ${P([100 + 1.5, sR[1] + 19])} Z`} />
            <path d={`M ${P([sL[0] + 9, sL[1] + 13])} L ${P([100 - 5, sL[1] - 6])} M ${P([sR[0] - 9, sR[1] + 13])} L ${P([100 + 5, sR[1] - 6])}`} fill="none" stroke={outfitColor} strokeWidth="1.2" />
          </g>
        )}
        {female && back && <path d={`M ${P([sL[0] + 6, sL[1] + 18])} L ${P([sR[0] - 6, sR[1] + 18])}`} stroke={outfitColor} strokeWidth="3" opacity={setGroups.includes('torso') ? 1 : 0.6} />}
        {!handsBehind(j.lHand) && arm('l', sL, j.lEl, j.lWr, j.lHand)}
        {!handsBehind(j.rHand) && arm('r', sR, j.rEl, j.rWr, j.rHand)}
        <Head h={j.head} female={female} view={view} style={st('head')} faceStyle={faceStyle} />
      </g>
    );
  };

  // ── 측면 (오른쪽을 보는 기준) ─────────────────────────────
  const renderSide = () => {
    const pv = j.pelvis, sh = j.sh;
    const ch = j.chest + (j.twist || 0) * 4;
    const gl = j.glute, arch = j.arch || 0;
    const lean = j.lean || 0;
    const torso = `M ${P([sh[0] - 5, sh[1] - 10])} C ${P([sh[0] - 14, sh[1] - 6])} ${P([sh[0] - 17 - (j.lat || 0), sh[1] + 14])} ${P([sh[0] - 14 - (j.lat || 0) * 0.6, sh[1] + 36])} C ${P([pv[0] - 9 + arch * 0.6, pv[1] - 30])} ${P([pv[0] - 8 + arch, pv[1] - 14])} ${P([pv[0] - gl * 0.5, pv[1] - 4])} C ${P([pv[0] - gl - 2, pv[1] + 2])} ${P([pv[0] - gl, pv[1] + 18])} ${P([pv[0] - 4, pv[1] + 20])} L ${P([pv[0] + 8, pv[1] + 14])} C ${P([pv[0] + 11, pv[1] + 2])} ${P([pv[0] + 11, pv[1] - 18])} ${P([pv[0] + 10 + lean * 0.2, pv[1] - 34])} C ${P([sh[0] + ch, sh[1] + 34])} ${P([sh[0] + ch + 2, sh[1] + 14])} ${P([sh[0] + ch - 4, sh[1] + 4])} C ${P([sh[0] + 6, sh[1] - 4])} ${P([sh[0] + 4, sh[1] - 8])} ${P([sh[0] + 3, sh[1] - 10])} Z`;
    const st = (g) => styleFor(g);
    const hipN = [pv[0] + 2, pv[1] + 4], hipF = [pv[0] - 1, pv[1] + 3];
    const leg = (key, H, K, A, F) => (
      <g key={key}>
        <path d={limb(H, K, R.th, R.kn, R.thb)} {...st('legs')} />
        <path d={limb(K, A, R.kn, R.an, R.cab)} {...st('legs')} />
        <FootSide at={A} toe={F?.toe} heel={heels} style={st('feet')} />
      </g>
    );
    const arm = (key, S, E, W, type) => (
      <g key={key}>
        <path d={limb(S, E, R.ua, R.fa + 0.6, R.uab)} {...st('arms')} />
        <path d={limb(E, W, R.fa + 0.4, R.wr, R.fab)} {...st('arms')} />
        <Hand at={W} dir={angleOf(E, W)} type={type} thumb={1} style={st('hands')} />
      </g>
    );
    const farBehind = !pose.farFront;
    return (
      <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
        {farBehind && arm('fa', j.fSh, j.fEl, j.fWr, j.fHand)}
        {leg('fl', hipF, j.fKnee, j.fAnk, j.fFoot)}
        <path d={`M ${sh[0] - 5} ${sh[1] - 4} L ${sh[0] - 4} ${sh[1] - 22} L ${sh[0] + 5} ${sh[1] - 22} L ${sh[0] + 6} ${sh[1] - 6} Z`} {...st('head')} />
        <path d={torso} {...st('torso')} />
        {j.twist > 0 && <path d={`M ${P([sh[0] + 2, sh[1] + 6])} C ${P([sh[0] + ch + 6, sh[1] + 10])} ${P([sh[0] + ch + 4, sh[1] + 28])} ${P([sh[0] + ch - 6, sh[1] + 30])}`} fill="none" stroke={COL.line} strokeOpacity="0.5" strokeWidth="0.8" />}
        {outfit === 'board'
          ? <path d={`M ${P([pv[0] - gl * 0.6, pv[1] - 12])} L ${P([pv[0] + 11, pv[1] - 12])} L ${P([lerp(hipN, j.nKnee, 0.85)[0] + R.th, lerp(hipN, j.nKnee, 0.85)[1]])} L ${P([lerp(hipN, j.nKnee, 0.85)[0] - R.th - 2, lerp(hipN, j.nKnee, 0.85)[1]])} Z`} fill={outfitColor} stroke="#0f172a" strokeWidth="0.8" />
          : <path d={`M ${P([pv[0] - gl * 0.5, pv[1] - (female ? 3 : 6)])} C ${P([pv[0] - gl - 2, pv[1] + 2])} ${P([pv[0] - gl, pv[1] + 14])} ${P([pv[0] - gl + 3, pv[1] + 17])} L ${P([pv[0] + 7, pv[1] + 13])} L ${P([pv[0] + 10.5, pv[1] - (female ? 1 : 4)])} Z`} fill={outfitColor} stroke="#0f172a" strokeWidth="0.8" />}
        {female && <path d={`M ${P([sh[0] + 4, sh[1] + 11])} C ${P([sh[0] + ch + 1, sh[1] + 10])} ${P([sh[0] + ch + 3, sh[1] + 20])} ${P([sh[0] + ch - 1, sh[1] + 25])} L ${P([sh[0] - 2, sh[1] + 24])} Z M ${P([sh[0] + 6, sh[1] + 11])} L ${P([sh[0] + 3, sh[1] - 6])}`} fill={outfitColor} stroke="#0f172a" strokeWidth="0.8" />}
        {leg('nl', hipN, j.nKnee, j.nAnk, j.nFoot)}
        {!farBehind && arm('fa', j.fSh, j.fEl, j.fWr, j.fHand)}
        {arm('na', sh, j.nEl, j.nWr, j.nHand)}
        <Head h={j.head} female={female} view="side" style={st('head')} faceStyle={faceStyle} />
      </g>
    );
  };

  return (
    <svg viewBox="0 -2 200 314" className={className} role="img" aria-label={`${pose.name || '포즈'} 설명 그림`}>
      <defs>
        {/* 왼쪽 위에서 빛이 드는 부드러운 음영 */}
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#fbfaf8" />
          <stop offset="0.55" stopColor="#e9e4de" />
          <stop offset="1" stopColor="#cfc8c0" />
        </linearGradient>
        <linearGradient id={`${uid}-focus`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#e3ecff" />
          <stop offset="0.55" stopColor="#b9cdff" />
          <stop offset="1" stopColor="#8fb0ff" />
        </linearGradient>
        <radialGradient id={`${uid}-floor`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#94a3b8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#94a3b8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="289" rx="62" ry="7" fill={`url(#${uid}-floor)`} />
      {isSide ? renderSide() : renderFrontBack()}
      {marks.map((m, i) => <Mark key={i} m={m} flip={flip} color={COL.mark} />)}
    </svg>
  );
};
