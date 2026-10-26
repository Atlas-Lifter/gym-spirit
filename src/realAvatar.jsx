import React, { useId } from 'react';

// 사실풍 전신 아바타 (SVG). 체중·골격근·체지방으로 체형이 바뀌고,
// 모든 신체 부위에 입체 음영 필터를 따로 걸어 겹친 팔·다리 경계가 살아 있게 한다.

export const AVATAR_SKIN_TONES = ['#f6dccb', '#eec4a6', '#e0ab86', '#c98d64', '#a46a45', '#74472c'];
export const AVATAR_EYE_COLORS = ['#3a2618', '#6b4423', '#3f6e9e', '#4f7d4c', '#7d858e', '#8a5a2b'];
export const AVATAR_SHOE_COLORS = ['#f5f5f4', '#171717', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

// 예전 파스텔 피부색으로 저장된 프로필은 비슷한 실제 피부 톤으로 보여 준다
export const LEGACY_SKIN = { '#fcd5ce': AVATAR_SKIN_TONES[1], '#ffb5a7': AVATAR_SKIN_TONES[2], '#f8edeb': AVATAR_SKIN_TONES[0], '#e8e8e4': AVATAR_SKIN_TONES[0], '#d4a373': AVATAR_SKIN_TONES[3], '#a38361': AVATAR_SKIN_TONES[4] };

// ── 색 계산 ──────────────────────────────────────────────
const toRgb = (hex) => {
  const h = (hex || '#cccccc').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const x = toRgb(a), y = toRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const shade = (hex, amt) => (amt < 0 ? mix(hex, '#000000', -amt) : mix(hex, '#ffffff', amt));

// ── 도형 계산 ────────────────────────────────────────────
const f = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f(p[0])} ${f(p[1])}`;
const mirrorX = (p) => [200 - p[0], p[1]];

// 왼쪽 절반 윤곽(cubic 구간들)을 좌우 대칭으로 닫힌 도형으로 만든다
const symPath = (start, segs) => {
  let d = `M ${pt(start)}`;
  segs.forEach(([a, b, c]) => { d += ` C ${pt(a)} ${pt(b)} ${pt(c)}`; });
  const pts = [start, ...segs.map(s => s[2])];
  d += ` L ${pt(mirrorX(pts[pts.length - 1]))}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const [a, b] = segs[i];
    d += ` C ${pt(mirrorX(b))} ${pt(mirrorX(a))} ${pt(mirrorX(pts[i]))}`;
  }
  return d + ' Z';
};

// 두 점 사이의 팔·다리 마디. 가운데가 rb만큼 부풀고 양 끝은 둥글다
const limb = (p1, p2, r1, r2, rb) => {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const bulge = rb ?? (r1 + r2) / 2;
  const k = bulge * 2 - (r1 + r2) / 2;
  const a1 = [p1[0] + nx * r1, p1[1] + ny * r1], a2 = [p2[0] + nx * r2, p2[1] + ny * r2];
  const b1 = [p1[0] - nx * r1, p1[1] - ny * r1], b2 = [p2[0] - nx * r2, p2[1] - ny * r2];
  const ca = [mid[0] + nx * k, mid[1] + ny * k], cb = [mid[0] - nx * k, mid[1] - ny * k];
  return `M ${pt(a1)} Q ${pt(ca)} ${pt(a2)} A ${f(r2)} ${f(r2)} 0 0 0 ${pt(b2)} Q ${pt(cb)} ${pt(b1)} A ${f(r1)} ${f(r1)} 0 0 0 ${pt(a1)} Z`;
};
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 포즈별 왼팔 관절 위치 (오른팔은 좌우 대칭)
const armJoints = (pose, sw, ww) => {
  const S = [100 - sw + 4, 97];
  if (pose === 'flex') return { S, E: [100 - sw - 27, 90], W: [100 - sw - 25, 55], fist: true };
  if (pose === 'hip') return { S, E: [100 - sw - 19, 146], W: [100 - ww - 4, 186], onHip: true };
  return { S, E: [100 - sw - 6, 151], W: [100 - sw - 5, 202] };
};


// 오라 입자 위치 (몸 주변에 고르게, 시작 시간을 엇갈려 끊김 없이 보이게)
const SPARKLES = [[52, 120, 0.9, 0], [148, 150, 0.7, 0.6], [44, 220, 0.6, 1.2], [156, 250, 1, 0.3], [62, 300, 0.8, 1.7], [140, 330, 0.6, 0.9], [72, 70, 0.6, 2], [130, 60, 0.8, 1.4], [100, 12, 0.7, 0.8], [56, 360, 0.7, 2.2]];
const EMBERS = [[66, 330, 1.2, 0], [134, 320, 1, 0.4], [58, 260, 0.9, 0.9], [142, 240, 1.3, 1.3], [74, 190, 0.8, 0.2], [126, 180, 1, 0.7], [84, 120, 0.9, 1.1], [118, 110, 1.1, 1.5], [96, 60, 0.8, 0.5], [106, 40, 0.9, 1.2], [70, 380, 1, 0.8], [130, 380, 0.9, 1.6]];
const BOLTS = [
  ['M 60 96 L 46 112 L 54 116 L 38 140 L 46 143 L 32 166', '1.7s', '0s'],
  ['M 140 100 L 156 118 L 148 122 L 166 146 L 157 150 L 172 172', '2.1s', '0.5s'],
  ['M 72 250 L 58 268 L 66 272 L 50 300', '1.9s', '1.1s'],
  ['M 128 236 L 144 252 L 136 258 L 152 284 L 145 288 L 158 306', '2.3s', '0.8s'],
  ['M 92 14 L 86 4 L 92 2 L 88 -8', '1.5s', '0.3s'],
  ['M 108 16 L 116 6 L 110 3 L 118 -6', '1.8s', '1.4s'],
];
const STEAM = [
  ['M 94 18 C 86 10 100 4 92 -6 C 88 -12 96 -16 94 -22', '0s'], ['M 106 18 C 114 10 100 4 108 -6 C 112 -12 104 -16 106 -22', '1.5s'],
  ['M 70 86 C 62 78 74 70 66 60 C 62 54 70 50 68 44', '0.7s'], ['M 130 86 C 138 78 126 70 134 60 C 138 54 130 50 132 44', '2.1s'],
];
// [x, y, 가슴 위인지, 크기, 시작]
const DROPS = [[88.6, 32, false, 1, '0s'], [111, 33, false, 0.85, '1.1s'], [82.6, 50, false, 0.9, '0.6s'], [117.6, 52, false, 1, '1.7s'], [90, 112, true, 1.1, '0.9s'], [112, 124, true, 1, '2s'], [104, 150, true, 0.9, '0.3s']];

export const FullBodyAvatar = ({ profile, bodyStats, size = 'w-32 h-64', crop = false, pose = 'standard' }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name) => `${uid}-${name}`;
  const url = (name) => `url(#${id(name)})`;

  const gender = profile?.gender || 'male';
  const female = gender === 'female';
  const skin = LEGACY_SKIN[profile?.skinColor] || profile?.skinColor || AVATAR_SKIN_TONES[1];
  const eyeColor = profile?.eyeColor || AVATAR_EYE_COLORS[0];
  // 운영자 전용 의상: 흰 정장(금색 장식)·흰 중절모(GM 배지)·검은 구두. 다른 옷 설정보다 우선한다
  const gm = !!profile?.gm;
  const topColor = gm ? '#0f172a' : (profile?.shirtColor || '#10b981');
  const bottomColor = gm ? '#f1f5f9' : (profile?.bottomColor || '#171717');
  const shoeColor = gm ? '#111827' : (profile?.shoeColor || AVATAR_SHOE_COLORS[0]);
  const topStyle = gm ? 'tank' : (profile?.topStyle || 'tshirt');
  const bottomStyle = gm ? 'joggers' : (profile?.bottomStyle || 'shorts');
  const face = profile?.faceExpression || 'normal';

  const legacyAcc = profile?.accessory || 'none';
  const hat = gm ? 'gm' : profile?.hat !== undefined ? profile.hat : (legacyAcc === 'headband' || legacyAcc === 'cap' ? legacyAcc : 'none');
  const faceAcc = profile?.faceAcc !== undefined ? profile.faceAcc : (legacyAcc === 'glasses' ? legacyAcc : 'none');
  const neckAcc = gm ? 'none' : (profile?.neckAcc || 'none');
  const bodyAcc = gm ? 'none' : profile?.bodyAcc !== undefined ? profile.bodyAcc : (legacyAcc === 'belt' ? legacyAcc : 'none');
  const hatColor = profile?.hatColor || '#ef4444';
  const faceAccColor = profile?.faceAccColor || '#171717';
  const neckAccColor = profile?.neckAccColor || '#fbbf24';
  const bodyAccColor = profile?.bodyAccColor || '#171717';
  const hairStyle = profile?.hairStyle || 'classic';
  const hairColor = profile?.hairColor || '#171717';
  const facialHair = profile?.facialHair || 'none';
  const tattoo = profile?.tattoo || 'none';
  const tattooColor = profile?.tattooColor || '#171717';
  const aura = profile?.aura || 'none';
  const auraColor = profile?.auraColor || '#eab308';
  const auraLight = mix(auraColor, '#ffffff', 0.55);
  const showAura = aura !== 'none' && !crop;
  const wet = showAura && aura === 'sweat';
  const figureFilter = !showAura ? undefined : aura === 'glow' ? url('auraGlow') : aura === 'fire' ? url('auraFire') : aura === 'lightning' ? url('auraBolt') : undefined;

  // ── 체형: 기준 체성분에서 5kg/5%p마다 한 단계씩 ───────────
  const num = (v, d) => { const n = parseFloat(v); return isNaN(n) ? d : n; };
  const baseW = female ? 55 : 75, baseM = female ? 22 : 35, baseF = female ? 25 : 15;
  const wD = (num(bodyStats?.weight, baseW) - baseW) / 5;
  const mD = (num(bodyStats?.muscle, baseM) - baseM) / 5;
  const fD = (num(bodyStats?.fat, baseF) - baseF) / 5;

  const sw = clamp(female ? 30 + mD * 1.4 + wD * 0.6 : 36 + mD * 2.2 + wD * 0.7, 26, 52);   // 어깨 반폭
  const ww = clamp(female ? 19 + fD * 2.2 + wD * 0.8 : 23 + fD * 2.6 + wD * 0.8, 15, 40);  // 허리 반폭
  const hw = clamp(female ? 29 + fD * 1.8 + mD * 0.5 + wD * 0.7 : 26 + fD * 1.5 + wD * 0.6, 20, 44); // 골반 반폭
  const at = clamp(female ? 9.5 + mD * 0.9 + fD * 0.6 : 12 + mD * 1.5 + fD * 0.5, 7, 22);     // 팔 굵기
  const lt = clamp(female ? 15 + mD * 1 + fD * 1.1 : 16 + mD * 1.3 + fD * 0.7, 11, 26);     // 다리 굵기
  const nw = clamp(female ? 6.4 : 8 + mD * 0.5, 5.5, 12);                                    // 목 반폭
  const lat = Math.max(ww + 3, sw - (female ? 7 : 5) + mD * 0.6);                            // 겨드랑이 아래 등 폭
  const definition = clamp(0.18 + mD * 0.09 - fD * 0.07, 0.06, 0.62);                         // 근육 선명도

  // 피부 톤
  const skinLight = shade(skin, 0.22), skinDark = shade(skin, -0.32), skinDeep = shade(skin, -0.5);
  const lip = mix(skin, female ? '#b23b4a' : '#9a4a40', female ? 0.48 : 0.34);
  const hairDark = shade(hairColor, -0.45), hairLight = shade(hairColor, 0.28);
  const browColor = mix(hairColor, '#1b120c', 0.35);

  // ── 관절 ────────────────────────────────────────────────
  const arm = armJoints(pose, sw, ww);
  const hipX = 100 - Math.max(hw * 0.5, lt * 0.6 + 1);
  const L = { H: [hipX, 214], K: [100 - hw * 0.44, 296], A: [100 - hw * 0.4, 368] };
  const thigh = { r1: lt * 0.7, rb: lt * 0.76, r2: lt * 0.42 };
  const calf = { r1: lt * 0.47, rb: lt * 0.57, r2: lt * 0.29 };
  const upper = { r1: at * 0.74, rb: at * (pose === 'flex' ? 0.98 : 0.84), r2: at * 0.52 };
  const fore = { r1: at * 0.56, rb: at * 0.64, r2: at * 0.38 };

  const torsoPath = symPath([100 - nw, 72], [
    [[100 - nw - 4, 82], [100 - sw + 9, 84], [100 - sw + 3, 92]],
    [[100 - sw - 1, 102], [100 - sw + 2, 116], [100 - lat, 130]],
    [[100 - lat + 1, 150], [100 - ww - 1, 166], [100 - ww, 180]],
    [[100 - ww, 193], [100 - hw, 203], [100 - hw, 216]],
    [[100 - hw + 2, 226], [100 - hw * 0.6, 232], [100 - 4, 234]],
  ]);
  const neckPath = `M ${100 - nw} 58 L ${100 - nw - 0.5} 80 Q 100 86 ${100 + nw + 0.5} 80 L ${100 + nw} 58 Z`;

  const headPath = female
    ? 'M 100 21.5 C 111.5 21.5 118.4 29.5 118.4 42 C 118.4 51 115.6 57.8 111.2 63 C 107.4 67.6 104 69.6 100 69.6 C 96 69.6 92.6 67.6 88.8 63 C 84.4 57.8 81.6 51 81.6 42 C 81.6 29.5 88.5 21.5 100 21.5 Z'
    : 'M 100 21 C 112 21 119.2 29 119.2 42 C 119.2 50 118.6 55.6 115.6 60.6 C 111.6 66.6 106.4 70.4 100 70.4 C 93.6 70.4 88.4 66.6 84.4 60.6 C 81.4 55.6 80.8 50 80.8 42 C 80.8 29 88 21 100 21 Z';

  // ── 표정 ────────────────────────────────────────────────
  const eyeTop = face === 'smile' ? 42.5 : face === 'angry' ? 42.4 : 41.6;
  const eyeBottom = face === 'smile' ? 46.4 : face === 'angry' ? 46.9 : 47.3;
  const browInner = face === 'angry' ? 41.6 : face === 'smile' ? 38.6 : 39.6;
  const browOuter = face === 'angry' ? 39.4 : face === 'smile' ? 39.6 : 40;

  const showChest = topStyle === 'none';
  const showUpperArm = topStyle !== 'tshirt';

  // 손: 손목에서 손가락 끝 방향(아래)으로 그린 뒤 팔뚝 방향으로 돌린다. 엄지는 몸 쪽
  const handPath = (thumbSide) => {
    const w = at * 0.78, h = at * 1.15;
    const t = thumbSide;
    return `M ${f(-w / 2)} 0 C ${f(-w / 2 - 0.6)} ${f(h * 0.45)} ${f(-w * 0.42)} ${f(h)} 0 ${f(h)} C ${f(w * 0.42)} ${f(h)} ${f(w / 2 + 0.6)} ${f(h * 0.45)} ${f(w / 2)} 0 Z `
      + `M ${f(t * w * 0.28)} ${f(h * 0.05)} C ${f(t * w * 0.85)} ${f(h * 0.12)} ${f(t * w * 0.82)} ${f(h * 0.6)} ${f(t * w * 0.52)} ${f(h * 0.68)} C ${f(t * w * 0.36)} ${f(h * 0.5)} ${f(t * w * 0.3)} ${f(h * 0.3)} ${f(t * w * 0.28)} ${f(h * 0.05)} Z`;
  };
  const fistPath = () => {
    const r = at * 0.52;
    return `M ${f(-r)} ${f(-r * 0.2)} C ${f(-r)} ${f(-r * 1.1)} ${f(r)} ${f(-r * 1.1)} ${f(r)} ${f(-r * 0.2)} C ${f(r * 1.05)} ${f(r * 0.7)} ${f(r * 0.6)} ${f(r * 1.05)} 0 ${f(r * 1.05)} C ${f(-r * 0.6)} ${f(r * 1.05)} ${f(-r * 1.05)} ${f(r * 0.7)} ${f(-r)} ${f(-r * 0.2)} Z`;
  };

  // 팔 한 쪽. 위팔·아래팔·손·어깨를 한 그룹에 넣고 음영을 한 번에 걸어 관절이 이어져 보이게 한다
  const Arm = ({ left, lowerOnly = false }) => {
    const m = left ? (p) => p : mirrorX;
    const S = m(arm.S), E = m(arm.E), W = m(arm.W);
    const dir = [W[0] - E[0], W[1] - E[1]];
    const ang = Math.atan2(dir[1], dir[0]) * 180 / Math.PI - 90;
    const thumb = left ? 1 : -1;
    const D = m([100 - sw + 3, 100]);
    return (
      <g>
        <g filter={url('vol')} fill={skin}>
          {!lowerOnly && <path d={limb(S, E, upper.r1, upper.r2, upper.rb)} />}
          {!lowerOnly && <ellipse cx={D[0]} cy={D[1]} rx={at * 0.62 + 1.2} ry={at * 0.7 + 1.6} />}
          <path d={limb(lerp(E, S, 0.06), W, fore.r1 + 0.4, fore.r2, fore.rb)} />
          {arm.fist
            ? <path d={fistPath()} transform={`translate(${f(W[0])} ${f(W[1] - at * 0.42)})`} />
            : <path d={handPath(thumb)} fillRule="nonzero" transform={`translate(${f(W[0])} ${f(W[1] - 1)}) rotate(${f(ang)})`} />}
        </g>
        {arm.fist && <path d={`M ${f(W[0] - at * 0.36)} ${f(W[1] - at * 0.72)} L ${f(W[0] + at * 0.36)} ${f(W[1] - at * 0.72)}`} stroke={skinDeep} strokeOpacity="0.35" strokeWidth="0.6" />}
        {/* 근육 결: 이두 아래선, 삼각근 경계, 팔꿈치 주름 */}
        {showUpperArm && !lowerOnly && (
          <g filter={url('soft')} opacity={definition} stroke={skinDeep} fill="none" strokeLinecap="round">
            <path d={`M ${pt(lerp(S, E, 0.35))} Q ${pt(lerp(lerp(S, E, 0.6), [100, lerp(S, E, 0.6)[1]], 0.08))} ${pt(lerp(S, E, 0.88))}`} strokeWidth="1.1" />
            <path d={`M ${pt(m([100 - sw - 2, 106]))} Q ${pt(m([100 - sw + 3, 112]))} ${pt(m([100 - sw + 7, 112]))}`} strokeWidth="1" />
          </g>
        )}
        <path d={`M ${pt(lerp(E, W, 0.06))} l ${f(thumb * 2)} 1.2`} stroke={skinDeep} strokeOpacity="0.25" strokeWidth="0.7" filter={url('soft')} />
        {showUpperArm && !lowerOnly && <ellipse cx={lerp(S, E, 0.45)[0] + (left ? 1.5 : -1.5)} cy={lerp(S, E, 0.45)[1]} rx={at * 0.22} ry={at * 0.5} fill="#ffffff" opacity="0.14" filter={url('soft')} />}
        <ellipse cx={lerp(E, W, 0.4)[0] - thumb} cy={lerp(E, W, 0.4)[1]} rx={at * 0.16} ry={at * 0.5} fill="#ffffff" opacity="0.1" filter={url('soft')} />
      </g>
    );
  };

  const Leg = ({ left }) => {
    const m = left ? (p) => p : mirrorX;
    const H = m(L.H), K = m(L.K), A = m(L.A);
    const legsCovered = bottomStyle === 'joggers' || bottomStyle === 'leggings';
    const legFill = legsCovered ? bottomColor : skin;
    const legFilter = legsCovered ? url('cloth') : url('vol');
    const shoeW = calf.r2 * 2 + 10;
    return (
      <g>
        <g filter={legFilter} fill={legFill}>
          <path d={limb(H, K, thigh.r1, thigh.r2, thigh.rb)} />
          <path d={limb(lerp(K, H, 0.05), A, calf.r1 + 0.6, calf.r2, calf.rb)} />
        </g>
        {!legsCovered && (
          <g filter={url('soft')} opacity={definition * 0.9} fill="none" stroke={skinDeep} strokeLinecap="round">
            <path d={`M ${pt([K[0] + (left ? 1 : -1) * thigh.r2 * 0.9, K[1] - 4])} Q ${pt([K[0] + (left ? 1 : -1) * thigh.r1 * 0.75, K[1] - 26])} ${pt([K[0] + (left ? 1 : -1) * thigh.r1 * 0.2, K[1] - 46])}`} strokeWidth="1.2" />
            <path d={`M ${pt([K[0] - (left ? 1 : -1) * calf.r1 * 0.6, K[1] + 12])} Q ${pt([K[0] - (left ? 1 : -1) * calf.rb * 0.9, K[1] + 32])} ${pt([K[0] - (left ? 1 : -1) * calf.r2 * 0.6, K[1] + 52])}`} strokeWidth="1" />
          </g>
        )}
        {!legsCovered && <ellipse cx={K[0]} cy={K[1] + 1} rx={calf.r1 * 0.55} ry={calf.r1 * 0.45} fill="#ffffff" opacity="0.16" filter={url('soft')} />}
        {!legsCovered && <ellipse cx={lerp(H, K, 0.45)[0] - (left ? 1 : -1) * 2} cy={lerp(H, K, 0.45)[1]} rx={thigh.r1 * 0.32} ry={thigh.r1 * 1.3} fill="#ffffff" opacity="0.13" filter={url('soft')} />}
        {bottomStyle === 'joggers' && !gm && <rect x={A[0] - calf.r2 - 1.5} y={A[1] - 6} width={calf.r2 * 2 + 3} height="6" rx="2" fill={shade(bottomColor, -0.2)} />}
        {gm && <path d={`M ${f(H[0])} ${f(H[1] + 6)} L ${f(A[0])} ${f(A[1] - 2)}`} stroke="#cbd5e1" strokeWidth="0.8" />}
        {/* 운동화 */}
        <g>
          <path d={`M ${f(A[0] - shoeW / 2)} ${f(A[1] + 2)} Q ${f(A[0] - shoeW / 2 - 1)} ${f(A[1] + 13)} ${f(A[0] - shoeW / 2 + 2)} ${f(A[1] + 16)} L ${f(A[0] + shoeW / 2 - 2)} ${f(A[1] + 16)} Q ${f(A[0] + shoeW / 2 + 1)} ${f(A[1] + 13)} ${f(A[0] + shoeW / 2)} ${f(A[1] + 2)} Q ${f(A[0])} ${f(A[1] - 3)} ${f(A[0] - shoeW / 2)} ${f(A[1] + 2)} Z`} fill={shoeColor} filter={url('cloth')} />
          <rect x={A[0] - shoeW / 2 + 0.5} y={A[1] + 13.5} width={shoeW - 1} height="3" rx="1.5" fill={shoeColor === '#f5f5f4' ? '#d6d3d1' : '#f5f5f4'} />
          <path d={`M ${f(A[0] - 2.5)} ${f(A[1] + 3)} L ${f(A[0] + 2.5)} ${f(A[1] + 4.5)} M ${f(A[0] - 2.5)} ${f(A[1] + 6)} L ${f(A[0] + 2.5)} ${f(A[1] + 7.5)}`} stroke={shade(shoeColor, -0.35)} strokeWidth="0.8" />
        </g>
      </g>
    );
  };

  const Eye = ({ cx, side }) => {
    const almond = `M ${cx - 4.6} 45 Q ${cx - 0.6 * side} ${eyeTop} ${cx + 4.6} 45 Q ${cx + 0.4 * side} ${eyeBottom} ${cx - 4.6} 45 Z`;
    return (
      <g>
        <ellipse cx={cx} cy="43.6" rx="6.2" ry="3.6" fill={skinDark} opacity="0.32" filter={url('soft')} />
        <clipPath id={id(`eye${side}`)}><path d={almond} /></clipPath>
        <path d={almond} fill="#f1ebe6" />
        <g clipPath={url(`eye${side}`)}>
          <circle cx={cx} cy="44.8" r="2.35" fill={url('iris')} />
          <circle cx={cx} cy="44.8" r="1.05" fill="#0d0907" />
          <circle cx={cx - 0.8} cy="43.9" r="0.6" fill="#ffffff" />
          <path d={`M ${cx - 4.6} 45 Q ${cx} ${eyeTop + 0.3} ${cx + 4.6} 45`} stroke="#000" strokeOpacity="0.28" strokeWidth="1.6" fill="none" />
        </g>
        <path d={`M ${cx - 4.9} 45.2 Q ${cx - 0.6 * side} ${eyeTop - 0.4} ${cx + 4.9} 45`} stroke="#22160f" strokeWidth={female ? 1.3 : 1} fill="none" strokeLinecap="round" />
        {female && <path d={`M ${cx - 4.7 * side} 45 l ${-1.4 * side} -0.7 M ${cx - 3.6 * side} ${eyeTop + 1.2} l ${-1 * side} -1.1 M ${cx - 2.2 * side} ${eyeTop + 0.6} l ${-0.6 * side} -1.1`} stroke="#22160f" strokeWidth="0.5" strokeLinecap="round" />}
        <path d={`M ${cx - 4} ${eyeTop - 1.6} Q ${cx} ${eyeTop - 3.2} ${cx + 4.3} ${eyeTop - 1.4}`} stroke={skinDeep} strokeOpacity="0.45" strokeWidth="0.6" fill="none" />
        <path d={`M ${cx - 3.6} ${eyeBottom - 0.2} Q ${cx} ${eyeBottom + 0.9} ${cx + 3.8} ${eyeBottom - 0.4}`} stroke={skinDeep} strokeOpacity="0.3" strokeWidth="0.5" fill="none" />
      </g>
    );
  };

  const Brow = ({ side }) => {
    const x0 = 100 - 2.6 * side, x1 = 100 - 12.4 * side; // 안쪽 → 바깥쪽
    const thick = female ? 0.9 : 1.5;
    return (
      <path d={`M ${x0} ${browInner} Q ${(x0 + x1) / 2} ${Math.min(browInner, browOuter) - 2.2} ${x1} ${browOuter} L ${x1} ${browOuter + 0.5} Q ${(x0 + x1) / 2} ${Math.min(browInner, browOuter) - 2.2 + thick + 0.4} ${x0} ${browInner + thick + 0.4} Z`} fill={browColor} opacity="0.92" />
    );
  };

  const mouthY = 61.3;
  const Mouth = () => {
    if (face === 'smile') {
      return (
        <g>
          <path d={`M 94.2 ${mouthY - 0.8} Q 100 ${mouthY + 0.2} 105.8 ${mouthY - 0.8} Q 100 ${mouthY + 4.8} 94.2 ${mouthY - 0.8} Z`} fill="#5a2620" />
          <path d={`M 95.6 ${mouthY - 0.3} Q 100 ${mouthY + 0.6} 104.4 ${mouthY - 0.3} L 104 ${mouthY + 0.9} Q 100 ${mouthY + 1.6} 96 ${mouthY + 0.9} Z`} fill="#f4f1ec" />
          <path d={`M 94 ${mouthY - 0.9} Q 100 ${mouthY + 6.4} 106 ${mouthY - 0.9} Q 100 ${mouthY + 4.6} 94 ${mouthY - 0.9} Z`} fill={lip} />
          <path d={`M 93.2 ${mouthY - 1.4} Q 92 ${mouthY - 4} 91 ${mouthY - 7} M 106.8 ${mouthY - 1.4} Q 108 ${mouthY - 4} 109 ${mouthY - 7}`} stroke={skinDeep} strokeOpacity="0.35" strokeWidth="0.7" fill="none" filter={url('soft')} />
        </g>
      );
    }
    const corner = face === 'angry' ? 0.6 : 0;
    const w = female ? 5.2 : 5.6;
    return (
      <g>
        <path d={`M ${100 - w} ${mouthY + corner} Q ${100 - w / 2} ${mouthY - 1.8} 100 ${mouthY - 0.9} Q ${100 + w / 2} ${mouthY - 1.8} ${100 + w} ${mouthY + corner} Q 100 ${mouthY + 0.5} ${100 - w} ${mouthY + corner} Z`} fill={shade(lip, -0.12)} />
        <path d={`M ${100 - w + 0.3} ${mouthY + 0.2 + corner} Q 100 ${mouthY + (female ? 3.8 : 3)} ${100 + w - 0.3} ${mouthY + 0.2 + corner} Q 100 ${mouthY + 0.8} ${100 - w + 0.3} ${mouthY + 0.2 + corner} Z`} fill={lip} />
        <path d={`M ${100 - w} ${mouthY + corner} Q 100 ${mouthY + 0.9} ${100 + w} ${mouthY + corner}`} stroke="#3c1914" strokeWidth="0.6" fill="none" strokeLinecap="round" />
        <ellipse cx="100" cy={mouthY + 2} rx="2.2" ry="0.6" fill="#ffffff" opacity={female ? 0.35 : 0.18} />
      </g>
    );
  };

  // ── 머리카락 ────────────────────────────────────────────
  const HairBack = () => {
    if (hairStyle === 'long') return <path d="M 80.5 40 C 76 64 77 90 83 106 Q 100 112 117 106 C 123 90 124 64 119.5 40 Z" fill={url('hair')} />;
    if (hairStyle === 'bob') return <path d="M 80 38 C 77 54 78 66 82 72 Q 100 76 118 72 C 122 66 123 54 120 38 Z" fill={url('hair')} />;
    if (hairStyle === 'ponytail') return <path d="M 113 30 C 128 30 131 52 126 72 C 124 82 119 90 116 92 C 119 78 120 62 117 48 Z" fill={url('hair')} />;
    return null;
  };
  const HairFront = () => {
    const strands = (paths) => paths.map((d, i) => <path key={i} d={d} stroke={i % 2 ? hairLight : hairDark} strokeOpacity={i % 2 ? 0.45 : 0.55} strokeWidth="0.6" fill="none" strokeLinecap="round" />);
    switch (hairStyle) {
      case 'none':
        return <path d="M 81.2 40 C 80.6 26 89 20 100 20 C 111 20 119.4 26 118.8 40 C 116 31 109 26.5 100 26.5 C 91 26.5 84 31 81.2 40 Z" fill={hairColor} opacity="0.32" />;
      case 'short':
        return (
          <g>
            <path d="M 80.8 41 C 79.6 23 89 17 100 17 C 111.5 17 120.6 23 119.2 41 C 117.6 33 113 28.4 104 28.4 C 97 28.4 91 29.6 86 32.5 C 83.6 34.4 82 37.6 80.8 41 Z" fill={url('hair')} />
            {strands(['M 88 22 Q 95 24 102 22.5', 'M 92 25 Q 100 26 108 24', 'M 104 20 Q 111 22 115 27'])}
          </g>
        );
      case 'spiky':
        return (
          <g>
            <path d="M 80.8 42 L 80.4 30 L 84 32 L 85.4 20 L 90.4 25 L 94 14 L 98.6 22 L 103.4 12.6 L 106.4 22.4 L 112.6 15.6 L 113.4 25.6 L 118.4 22 L 117.8 32 L 119.4 42 C 117 33 110 28.6 100 28.6 C 90 28.6 83.4 33 80.8 42 Z" fill={url('hair')} />
            {strands(['M 94 15 L 96 26', 'M 103.4 13.6 L 102.6 26', 'M 112.4 16.6 L 109 27'])}
          </g>
        );
      case 'long':
        return (
          <g>
            <path d="M 80.4 46 C 78.6 24 89 16.4 100.6 16.4 C 112.4 16.4 121.6 24.6 119.6 46 C 117.4 36 113 29.6 106 26.6 C 104 32 98 34.6 91 35.2 C 86.4 37 83 41 80.4 46 Z" fill={url('hair')} />
            {strands(['M 101 18 Q 97 26 91 33', 'M 106 19 Q 112 25 117 38', 'M 98 18.4 Q 92 23 86 32'])}
          </g>
        );
      case 'ponytail':
        return (
          <g>
            <path d="M 81 42 C 80 24 89.4 17.6 100.2 17.6 C 111.4 17.6 120.4 24 119 42 C 117.4 33.6 112 29 102 28.6 C 93 28.6 85 33 81 42 Z" fill={url('hair')} />
            {strands(['M 86 30 Q 96 22 112 26', 'M 89 25 Q 100 20 115 30'])}
            <rect x="114.6" y="27.6" width="5" height="4" rx="1.6" fill="#ef4444" transform="rotate(20 117 29.6)" />
          </g>
        );
      case 'bob':
        return (
          <g>
            <path d="M 80.4 48 C 78.6 25 89 17 100.4 17 C 112 17 121.6 25 119.6 48 C 117 39 114 33 108.6 30.4 C 103 34.6 94 35.6 87.6 33.6 C 84.4 37 82 42 80.4 48 Z" fill={url('hair')} />
            {strands(['M 100 18.4 Q 94 25 88 32', 'M 104 18.6 Q 112 23 117 36'])}
          </g>
        );
      case 'bun':
        return (
          <g>
            <circle cx="100" cy="14" r="7.4" fill={url('hair')} />
            <path d="M 81 42 C 80 24 89.4 18 100.2 18 C 111.4 18 120.4 24 119 42 C 117 33.6 111 29.4 100 29.4 C 89 29.4 83 33.6 81 42 Z" fill={url('hair')} />
            {strands(['M 87 30 Q 95 22 100 19', 'M 113 30 Q 105 22 100 19', 'M 95 12 Q 100 9 105 12'])}
          </g>
        );
      case 'classic':
      default:
        return (
          <g>
            <path d="M 80.6 42 C 78.8 22.6 91 14.4 102.4 15 C 114 15.4 122 23.4 119.4 42 L 118.4 36.4 C 116.4 29.4 109 25.4 99 26.6 C 93 27.4 88.6 29.6 85.4 32.8 C 83.2 35.4 81.8 38.6 80.6 42 Z" fill={url('hair')} />
            <path d="M 81 41 C 80.6 36 81.6 33 83.4 31.4 L 84.6 38 Z M 119 41 C 119.4 36 118.4 33 116.6 31.4 L 115.4 38 Z" fill={hairColor} opacity="0.35" />
            {strands(['M 90 20 Q 100 17 112 21', 'M 87 25 Q 98 20 115 26', 'M 95 18 Q 104 18.6 110 22', 'M 86 29 Q 96 24.4 108 25.6'])}
          </g>
        );
    }
  };

  const viewBox = crop ? '66 14 68 68' : '0 0 200 400';
  const torsoFilter = showChest ? url('vol') : undefined;
  const clothTop = topStyle === 'tshirt' || topStyle === 'tank' || (topStyle === 'none' && female);

  // 상의(티셔츠·민소매·스포츠 브라) 윤곽
  const shirtBody = symPath([100 - nw - 1.5, 74], [
    [[100 - nw - 5, 82], [100 - sw + 8, 83], [100 - sw + 2, 91.5]],
    [[100 - sw - 2, 102], [100 - sw + 1, 116], [100 - lat - 1, 130]],
    [[100 - lat, 150], [100 - ww - 2, 168], [100 - ww - 1.5, 182]],
    [[100 - ww - 1.5, 192], [100 - ww - 2.5, 198], [100 - ww - 3, 203]],
  ]);
  const tankBody = symPath([100 - nw - 3, 76], [
    [[100 - nw - 5, 80], [100 - nw - 8, 84], [100 - nw - 9, 88]],
    [[100 - nw - 9, 102], [100 - lat + 6, 108], [100 - lat - 0.5, 124]],
    [[100 - lat, 150], [100 - ww - 2, 168], [100 - ww - 1.5, 182]],
    [[100 - ww - 1.5, 192], [100 - ww - 2.5, 198], [100 - ww - 3, 203]],
  ]);
  const braBody = symPath([100 - nw - 4, 84], [
    [[100 - nw - 6, 92], [100 - lat + 3, 104], [100 - lat - 0.5, 122]],
    [[100 - lat, 130], [100 - lat + 0.5, 136], [100 - lat + 1, 141]],
  ]);

  return (
    <div className={`${size} flex justify-center items-center relative group transition-all`}>
      <svg viewBox={viewBox} className={`w-full h-full ${crop ? 'overflow-hidden' : 'overflow-visible'}`} role="img" aria-label="내 아바타">
        <defs>
          {/* 입체 음영: 윤곽 안쪽 오른쪽 아래는 어둡게, 왼쪽 위는 밝게 (빛은 왼쪽 위) */}
          <filter id={id('vol')} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.3" result="b" />
            <feOffset in="b" dx="-2.8" dy="-1.8" result="bs" />
            <feComposite in="SourceAlpha" in2="bs" operator="arithmetic" k2="1" k3="-1" result="edgeS" />
            <feFlood floodColor={mix(skinDeep, '#6e2a1c', 0.18)} floodOpacity="0.78" />
            <feComposite in2="edgeS" operator="in" result="sh" />
            <feOffset in="b" dx="1.8" dy="1.4" result="bh" />
            <feComposite in="SourceAlpha" in2="bh" operator="arithmetic" k2="1" k3="-1" result="edgeH" />
            <feFlood floodColor={skinLight} floodOpacity="0.42" />
            <feComposite in2="edgeH" operator="in" result="hl" />
            {wet && <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="2" result="n" />}
            {wet && <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  9 0 0 0 -6.2" result="specks" />}
            {wet && <feComposite in="specks" in2="SourceAlpha" operator="in" result="wet" />}
            {wet && <feComponentTransfer in="wet" result="wetA"><feFuncA type="linear" slope="0.6" /></feComponentTransfer>}
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="sh" /><feMergeNode in="hl" />{wet && <feMergeNode in="wetA" />}</feMerge>
          </filter>
          <filter id={id('cloth')} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="b" />
            <feOffset in="b" dx="-2.2" dy="-1.4" result="bs" />
            <feComposite in="SourceAlpha" in2="bs" operator="arithmetic" k2="1" k3="-1" result="edgeS" />
            <feFlood floodColor="#000000" floodOpacity="0.42" />
            <feComposite in2="edgeS" operator="in" result="sh" />
            <feOffset in="b" dx="1.6" dy="1.2" result="bh" />
            <feComposite in="SourceAlpha" in2="bh" operator="arithmetic" k2="1" k3="-1" result="edgeH" />
            <feFlood floodColor="#ffffff" floodOpacity="0.22" />
            <feComposite in2="edgeH" operator="in" result="hl" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="sh" /><feMergeNode in="hl" /></feMerge>
          </filter>
          <filter id={id('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1" /></filter>
          <filter id={id('fuzz')} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.35" /></filter>
          <clipPath id={id('underHat')}><rect x="60" y={hat === 'cap' ? 36 : hat === 'beanie' ? 37 : 34} width="80" height="120" /></clipPath>
          <filter id={id('blur3')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
          <linearGradient id={id('hair')} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={hairLight} />
            <stop offset="0.45" stopColor={hairColor} />
            <stop offset="1" stopColor={hairDark} />
          </linearGradient>
          <radialGradient id={id('iris')} cx="0.45" cy="0.4" r="0.6">
            <stop offset="0" stopColor={shade(eyeColor, 0.35)} />
            <stop offset="0.7" stopColor={eyeColor} />
            <stop offset="1" stopColor={shade(eyeColor, -0.5)} />
          </radialGradient>
          <linearGradient id={id('light')} x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.16" />
          </linearGradient>
          <radialGradient id={id('aura')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={auraColor} stopOpacity="0.45" />
            <stop offset="60%" stopColor={auraColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={auraColor} stopOpacity="0" />
          </radialGradient>
          {/* 몸 윤곽을 따라 번지는 빛 */}
          <filter id={id('auraGlow')} x="-45%" y="-20%" width="190%" height="140%" colorInterpolationFilters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d" />
            <feGaussianBlur in="d" stdDeviation="8" result="g1" />
            <feGaussianBlur in="d" stdDeviation="2.2" result="g2" />
            <feFlood floodColor={auraColor}><animate attributeName="flood-opacity" values="0.5;0.95;0.5" dur="2.8s" repeatCount="indefinite" /></feFlood>
            <feComposite in2="g1" operator="in" result="c1" />
            <feFlood floodColor={auraLight} floodOpacity="0.85" />
            <feComposite in2="g2" operator="in" result="c2" />
            <feMerge><feMergeNode in="c1" /><feMergeNode in="c2" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* 윤곽을 위로 밀어 올리고 노이즈로 흔들어 불꽃처럼: 바깥(진한 색) → 중간(주황) → 안쪽(노란 심지) 세 겹 */}
          <filter id={id('auraFire')} x="-60%" y="-40%" width="220%" height="170%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.075" numOctaves="2" seed="4" result="n">
              <animate attributeName="baseFrequency" values="0.03 0.075;0.036 0.1;0.028 0.065;0.03 0.075" dur="1.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d1" />
            <feOffset in="d1" dy="-11" result="u1" />
            <feDisplacementMap in="u1" in2="n" scale="36" xChannelSelector="R" yChannelSelector="G" result="f1" />
            <feGaussianBlur in="f1" stdDeviation="3.4" result="b1" />
            <feFlood floodColor={auraColor} floodOpacity="0.8" />
            <feComposite in2="b1" operator="in" result="outer" />
            <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d2" />
            <feOffset in="d2" dy="-6" result="u2" />
            <feDisplacementMap in="u2" in2="n" scale="20" xChannelSelector="R" yChannelSelector="G" result="f2" />
            <feGaussianBlur in="f2" stdDeviation="1.8" result="b2" />
            <feFlood floodColor={mix(auraColor, '#ffa21f', 0.55)} floodOpacity="0.9" />
            <feComposite in2="b2" operator="in" result="mid" />
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="d3" />
            <feOffset in="d3" dy="-2" result="u3" />
            <feDisplacementMap in="u3" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="f3" />
            <feGaussianBlur in="f3" stdDeviation="0.9" result="b3" />
            <feFlood floodColor="#fff1a8" floodOpacity="0.95" />
            <feComposite in2="b3" operator="in" result="core" />
            <feMerge><feMergeNode in="outer" /><feMergeNode in="mid" /><feMergeNode in="core" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* 윤곽선을 고주파 노이즈로 떨게 해 전기가 튀는 테두리 */}
          <filter id={id('auraBolt')} x="-45%" y="-20%" width="190%" height="140%" colorInterpolationFilters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="d" />
            <feGaussianBlur in="d" stdDeviation="5" result="g" />
            <feFlood floodColor={auraColor} floodOpacity="0.75" />
            <feComposite in2="g" operator="in" result="glow" />
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="o" />
            <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="i" />
            <feComposite in="o" in2="i" operator="out" result="ring" />
            <feTurbulence type="turbulence" baseFrequency="0.22" numOctaves="1" seed="9" result="n">
              <animate attributeName="baseFrequency" values="0.2;0.3;0.24;0.34;0.2" dur="0.6s" repeatCount="indefinite" calcMode="discrete" />
            </feTurbulence>
            <feDisplacementMap in="ring" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="arc" />
            <feFlood floodColor={mix(auraColor, '#ffffff', 0.75)} />
            <feComposite in2="arc" operator="in" result="arcC" />
            <feGaussianBlur in="arcC" stdDeviation="1.4" result="arcG" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="arcG" /><feMergeNode in="arcC" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={id('boltGlow')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id={id('pillar')} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={auraColor} stopOpacity="0.45" />
            <stop offset="0.6" stopColor={auraColor} stopOpacity="0.12" />
            <stop offset="1" stopColor={auraColor} stopOpacity="0" />
          </linearGradient>
          <radialGradient id={id('drop')} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#bfe3ff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#5aa9e6" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* 오라 (뒤쪽): 바닥 빛 웅덩이와 빛 기둥 */}
        {showAura && aura !== 'sweat' && (
          <g>
            <ellipse cx="100" cy="200" rx="92" ry="196" fill={url('aura')} opacity={aura === 'glow' ? 0.9 : 0.6}>
              <animate attributeName="opacity" values={aura === 'lightning' ? '0.4;0.75;0.35;0.6;0.4' : '0.55;0.9;0.55'} dur={aura === 'lightning' ? '0.9s' : '2.8s'} repeatCount="indefinite" />
            </ellipse>
            {aura === 'glow' && <rect x="52" y="40" width="96" height="350" rx="48" fill={url('pillar')} filter={url('blur3')} />}
            <ellipse cx="100" cy="386" rx="58" ry="9" fill={aura === 'fire' ? mix(auraColor, '#ff7a1a', 0.4) : auraColor} opacity="0.55" filter={url('blur3')}>
              <animate attributeName="rx" values="54;62;54" dur={aura === 'fire' ? '0.8s' : '2.8s'} repeatCount="indefinite" />
            </ellipse>
          </g>
        )}

        {!crop && <ellipse cx="100" cy="388" rx="44" ry="5" fill="#000" opacity="0.28" filter={url('blur3')} />}

        <g filter={figureFilter}>
        <HairBack />

        {/* 다리 → 하의 → 몸통 → 상의 → 팔 → 목·머리 순으로 겹친다 */}
        <Leg left />
        <Leg left={false} />

        {/* 몸통 (피부) */}
        <path d={torsoPath} fill={skin} filter={torsoFilter || url('vol')} />
        <path d={torsoPath} fill={url('light')} />
        {showChest && (
          <g>
            <g filter={url('soft')} opacity={definition} fill="none" stroke={skinDeep} strokeLinecap="round">
              {!female && <path d={`M ${100 - sw + 7} 100 C ${100 - sw + 5} 118 ${100 - 15} 127 ${100 - 1} 121`} strokeWidth="1.6" />}
              {!female && <path d={`M ${100 + sw - 7} 100 C ${100 + sw - 5} 118 ${100 + 15} 127 ${100 + 1} 121`} strokeWidth="1.6" />}
              <path d="M 100 96 L 100 184" strokeWidth="1" />
              {[138, 151, 164].map(y => <path key={y} d={`M ${100 - ww * 0.48} ${y} Q 100 ${y + 2} ${100 + ww * 0.48} ${y}`} strokeWidth="0.9" />)}
              <path d={`M ${100 - ww + 2} 140 Q ${100 - ww + 3} 160 ${100 - ww * 0.45} 186 M ${100 + ww - 2} 140 Q ${100 + ww - 3} 160 ${100 + ww * 0.45} 186`} strokeWidth="1" />
              <path d={`M ${100 - lat + 2} 128 l 4 3 m -3 5 l 4 3 M ${100 + lat - 2} 128 l -4 3 m 3 5 l -4 3`} strokeWidth="0.8" />
            </g>
            {!female && <ellipse cx={100 - sw * 0.42} cy="107" rx={sw * 0.28} ry="6" fill="#ffffff" opacity={0.08 + definition * 0.2} filter={url('soft')} />}
            {!female && <ellipse cx={100 + sw * 0.42} cy="107" rx={sw * 0.28} ry="6" fill="#ffffff" opacity={0.05 + definition * 0.12} filter={url('soft')} />}
            {[143, 156, 169].map(y => <g key={y} opacity={definition * 0.5}><ellipse cx={100 - ww * 0.24} cy={y + 1} rx={ww * 0.18} ry="4" fill="#fff" filter={url('soft')} opacity="0.35" /><ellipse cx={100 + ww * 0.24} cy={y + 1} rx={ww * 0.18} ry="4" fill="#fff" filter={url('soft')} opacity="0.2" /></g>)}
            <circle cx={100} cy="178" r="1.2" fill={skinDeep} opacity="0.55" />
            {tattoo === 'chest_tribal' && (
              <g opacity="0.6" fill={tattooColor} transform={`translate(${100 - sw * 0.45} 104)`}>
                <path d="M -8 -4 Q 0 8 8 -4 L 4 2 Q 0 6 -4 2 Z" /><path d="M -11 2 Q 0 14 11 2 L 6 7 Q 0 11 -6 7 Z" /><circle cx="0" cy="11" r="1.6" />
              </g>
            )}
          </g>
        )}
        {/* 하의 */}
        {bottomStyle === 'shorts' && (
          <path d={symPath([100, 236], [
            [[100 - 6, 236], [100 - hw * 0.45, 262], [100 - hw * 0.42 - thigh.r1 * 0.2, 266]],
            [[100 - hw - 4, 264], [100 - hw - 3, 230], [100 - hw - 1, 214]],
            [[100 - hw + 1, 206], [100 - ww - 2, 200], [100 - ww - 1, 196]],
            [[100 - 6, 196], [100 - 2, 196], [100, 196]],
          ])} fill={bottomColor} filter={url('cloth')} />
        )}
        {(bottomStyle === 'joggers' || bottomStyle === 'leggings') && (
          <path d={symPath([100, 238], [
            [[100 - 4, 238], [100 - hw * 0.6, 240], [100 - hw * 0.62, 246]],
            [[100 - hw - 2, 244], [100 - hw - 2, 228], [100 - hw - 0.5, 214]],
            [[100 - hw + 1, 206], [100 - ww - 2, 200], [100 - ww - 1, 196]],
            [[100 - 6, 196], [100 - 2, 196], [100, 196]],
          ])} fill={bottomColor} filter={url('cloth')} />
        )}
        <rect x={100 - ww - 1.5} y="195" width={ww * 2 + 3} height="6" rx="2" fill={shade(bottomColor, -0.18)} />
        {bottomStyle === 'shorts' && <path d={`M ${100 - hw - 2} 252 L ${100 - hw * 0.6} 258 M ${100 + hw + 2} 252 L ${100 + hw * 0.6} 258`} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" />}
        <path d="M 100 202 L 100 232" stroke="#000" strokeOpacity="0.18" strokeWidth="0.8" />

        {/* 쇄골 */}
        <path d={`M ${100 - nw - 1} 81 Q ${100 - sw * 0.5} 83 ${100 - sw + 7} 87 M ${100 + nw + 1} 81 Q ${100 + sw * 0.5} 83 ${100 + sw - 7} 87`} stroke={skinDeep} strokeOpacity="0.4" strokeWidth="0.9" fill="none" filter={url('soft')} />

        {/* 팔 */}
        {[true, false].map(left => <Arm key={left ? 'l' : 'r'} left={left} />)}

        {/* 상의: 몸판과 소매를 한 그룹으로 묶어 음영을 함께 건다 (이음새 없이 한 벌처럼) */}
        {clothTop && (
          <g filter={url('cloth')} fill={topColor}>
            {topStyle === 'tshirt' && <path d={shirtBody} />}
            {topStyle === 'tshirt' && [true, false].map(left => {
              const m = left ? (p) => p : mirrorX;
              const S = m(arm.S), E = m(arm.E), D = m([100 - sw + 3, 99]);
              return (
                <g key={left ? 'sl' : 'sr'}>
                  <ellipse cx={D[0]} cy={D[1]} rx={at * 0.62 + 3} ry={at * 0.7 + 3.4} />
                  <path d={limb(m([100 - sw + 5, 94]), lerp(S, E, 0.5), upper.r1 + 2.4, upper.r2 + (upper.rb - upper.r2) * 0.5 + 1.8, upper.rb + 1.4)} />
                </g>
              );
            })}
            {topStyle === 'tank' && <path d={tankBody} />}
            {topStyle === 'none' && female && <path d={braBody} />}
          </g>
        )}
        {topStyle === 'tshirt' && [true, false].map(left => {
          // 소매 끝단: 팔 방향에 수직인 짧은 선
          const m = left ? (p) => p : mirrorX;
          const S = m(arm.S), E = m(arm.E), M = lerp(S, E, 0.5);
          const len = Math.hypot(E[0] - S[0], E[1] - S[1]) || 1;
          const n = [-(E[1] - S[1]) / len, (E[0] - S[0]) / len];
          const r = upper.r2 + (upper.rb - upper.r2) * 0.5 + 1.4;
          return <path key={left ? 'hl' : 'hr'} d={`M ${pt([M[0] + n[0] * r, M[1] + n[1] * r])} L ${pt([M[0] - n[0] * r, M[1] - n[1] * r])}`} stroke={shade(topColor, -0.3)} strokeWidth="1.2" strokeLinecap="round" />;
        })}
        {clothTop && (
          <g filter={url('soft')} stroke="#000" strokeOpacity="0.18" fill="none" strokeLinecap="round">
            {topStyle !== 'none' && <path d={`M ${100 - ww * 0.5} 150 Q ${100 - ww * 0.2} 170 ${100 - ww * 0.4} 196 M ${100 + ww * 0.6} 140 Q ${100 + ww * 0.3} 164 ${100 + ww * 0.5} 196 M ${100 - sw + 8} 104 Q ${100 - sw + 12} 112 ${100 - lat + 4} 124`} strokeWidth="1.1" />}
            <path d={`M ${100 - sw * 0.5} ${female ? 112 : 118} Q 100 124 ${100 + sw * 0.5} ${female ? 112 : 118}`} strokeWidth="1" />
          </g>
        )}
        {topStyle !== 'none' && <rect x={100 - ww - 3} y="200.6" width={ww * 2 + 6} height="2.2" rx="1" fill={shade(topColor, -0.22)} />}
        {(topStyle === 'tshirt' || topStyle === 'tank') && <path d={`M ${100 - nw - 1.6} 76 Q 100 ${topStyle === 'tank' ? 92 : 86} ${100 + nw + 1.6} 76 Z`} fill={skin} />}
        {(topStyle === 'tshirt' || topStyle === 'tank') && <path d={`M ${100 - nw - 1.6} 76 Q 100 ${topStyle === 'tank' ? 92 : 86} ${100 + nw + 1.6} 76`} stroke={shade(topColor, -0.25)} strokeWidth="2.2" fill="none" />}
        {arm.onHip && clothTop && [true, false].map(left => <Arm key={left ? 'll' : 'lr'} left={left} lowerOnly />)}

        {/* 운영자 흰 정장: 소매 → 재킷 몸판 → 셔츠·넥타이·라펠·단추 */}
        {gm && (
          <g>
            {[true, false].map(left => {
              const m = left ? (p) => p : mirrorX;
              const S = m(arm.S), E = m(arm.E), W = m(arm.W), D = m([100 - sw + 3, 99]);
              const Wc = lerp(E, W, 0.84);
              return (
                <g key={left ? 'gl' : 'gr'}>
                  <g filter={url('cloth')} fill="#f8fafc">
                    <ellipse cx={D[0]} cy={D[1]} rx={at * 0.62 + 3.6} ry={at * 0.7 + 4} />
                    <path d={limb(m([100 - sw + 5, 94]), E, upper.r1 + 2.8, upper.r2 + 2.2, upper.rb + 2)} />
                    <path d={limb(lerp(E, S, 0.08), Wc, fore.r1 + 2.4, fore.r2 + 2, fore.rb + 2.2)} />
                  </g>
                  <path d={limb(lerp(E, W, 0.79), Wc, fore.r2 + 2.1, fore.r2 + 1.9, fore.r2 + 2)} fill="#d4af37" />
                </g>
              );
            })}
            <clipPath id={id('jacket')}><rect x="30" y="70" width="140" height="154" /></clipPath>
            <g clipPath={url('jacket')}>
              <path d={torsoPath} fill="#f8fafc" filter={url('cloth')} transform="translate(100 0) scale(1.07 1) translate(-100 0)" />
            </g>
            <path d={`M ${100 - nw - 2} 76 L 100 132 L ${100 + nw + 2} 76 Z`} fill={topColor} />
            <path d="M 97.6 78 L 102.4 78 L 101.6 84 L 98.4 84 Z" fill="#059669" />
            <path d="M 98.4 84 L 101.6 84 L 103.2 118 L 100 124 L 96.8 118 Z" fill="#10b981" />
            <path d="M 97.6 96 L 102.6 93 M 97.2 106 L 102.8 103" stroke="#047857" strokeWidth="1.1" />
            {[1, -1].map(sd => (
              <g key={sd}>
                <path d={`M ${100 - sd * (nw + 2)} 76 L ${100 - sd * sw * 0.52} 92 L ${100 - sd * sw * 0.36} 99 L ${100 - sd * 1} 132 L ${100 - sd * (nw + 2) + sd * 1.5} 82 Z`} fill="#e2e8f0" />
                <path d={`M ${100 - sd * (nw + 2)} 76 L ${100 - sd * sw * 0.52} 92 L ${100 - sd * sw * 0.36} 99 L 100 132`} stroke="#d4af37" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
              </g>
            ))}
            <path d={`M 100 132 L 100 222`} stroke="#cbd5e1" strokeWidth="1" />
            {[146, 162].map(y => <circle key={y} cx="101.6" cy={y} r="1.9" fill="#d4af37" stroke="#a16207" strokeWidth="0.5" />)}
            <path d={`M ${100 - sw * 0.66} 110 L ${100 - sw * 0.3} 110`} stroke="#cbd5e1" strokeWidth="1" />
            <path d={`M ${100 - sw * 0.6} 110 L ${100 - sw * 0.52} 104 L ${100 - sw * 0.44} 110 Z`} fill="#10b981" />
            <g transform={`translate(${100 + sw * 0.5} 106)`}>
              <path d="M -4 -4 L 4 -4 L 4 1.5 Q 0 5.5 -4 1.5 Z" fill="#0f172a" stroke="#d4af37" strokeWidth="0.8" />
              <text x="0" y="0.8" textAnchor="middle" fontSize="3.6" fontWeight="900" fill="#facc15">GM</text>
            </g>
            <path d={`M ${100 - hw * 1.08} 221 Q 100 225 ${100 + hw * 1.08} 221`} stroke="#d4af37" strokeWidth="1.4" fill="none" />
          </g>
        )}

        {/* 목 뒤로 지나가는 수건·헤드폰 띠 */}
        {neckAcc === 'towel' && <path d={`M ${100 - nw - 3} 76 Q 100 64 ${100 + nw + 3} 76 L ${100 + nw + 1} 70 Q 100 60 ${100 - nw - 1} 70 Z`} fill={shade(neckAccColor, -0.2)} />}
        {neckAcc === 'headphones' && <path d={`M ${100 - nw - 7} 82 Q 100 64 ${100 + nw + 7} 82`} stroke={shade(neckAccColor, -0.25)} strokeWidth="2.6" fill="none" />}
        {/* 목 */}
        <path d={neckPath} fill={skin} filter={url('vol')} />
        <path d={`M ${100 - nw} 63 Q 100 72 ${100 + nw} 63 L ${100 + nw} 68 Q 100 74 ${100 - nw} 68 Z`} fill={skinDeep} opacity="0.38" filter={url('soft')} />
        {!female && <path d={`M ${100 - nw + 1.5} 64 L ${100 - 2} 80 M ${100 + nw - 1.5} 64 L ${100 + 2} 80`} stroke={skinDeep} strokeOpacity="0.3" strokeWidth="0.8" filter={url('soft')} />}

        {/* 귀·머리 */}
        <ellipse cx={female ? 81.8 : 81} cy="47" rx="3.2" ry="6" fill={skin} filter={url('vol')} />
        <ellipse cx={female ? 118.2 : 119} cy="47" rx="3.2" ry="6" fill={skin} filter={url('vol')} />
        <path d={headPath} fill={skin} filter={url('vol')} />
        <path d={headPath} fill={url('light')} />

        {/* 얼굴 음영: 관자놀이, 광대 아래, 턱 아래, 콧대 */}
        <g filter={url('soft')}>
          <path d={female ? 'M 86 55 Q 90 60 95 61' : 'M 85.4 53 Q 89 59 94 61.6'} stroke={skinDeep} strokeOpacity={female ? 0.12 : 0.18} strokeWidth="2.2" fill="none" />
          <path d={female ? 'M 114 55 Q 110 60 105 61' : 'M 114.6 53 Q 111 59 106 61.6'} stroke={skinDeep} strokeOpacity={female ? 0.15 : 0.22} strokeWidth="2.2" fill="none" />
          <ellipse cx="100" cy="66.6" rx="5" ry="1.6" fill="#ffffff" opacity="0.18" />
          <path d="M 100 44 L 100 53.4" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1.4" />
          <path d="M 102.6 45 Q 104 50.6 104.4 54" stroke={skinDeep} strokeOpacity="0.4" strokeWidth="1.3" fill="none" />
          <ellipse cx="100" cy="64.4" rx="3.6" ry="1" fill={skinDeep} opacity="0.3" />
          {female && <><ellipse cx="89.6" cy="53.6" rx="4.4" ry="2.4" fill="#e8737a" opacity="0.18" /><ellipse cx="110.4" cy="53.6" rx="4.4" ry="2.4" fill="#e8737a" opacity="0.18" /></>}
          {face === 'smile' && <><ellipse cx="90" cy="52.6" rx="3.6" ry="2" fill="#ffffff" opacity="0.2" /><ellipse cx="110" cy="52.6" rx="3.6" ry="2" fill="#ffffff" opacity="0.14" /></>}
        </g>

        {/* 코 */}
        <ellipse cx="100" cy="55.2" rx="3.3" ry="2.2" fill={skinLight} opacity="0.5" filter={url('soft')} />
        <path d="M 96.4 55.4 Q 95.6 57.4 97.6 57.8 M 103.6 55.4 Q 104.4 57.4 102.4 57.8" stroke={skinDeep} strokeOpacity="0.55" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        <ellipse cx="98.4" cy="57.4" rx="0.95" ry="0.5" fill="#2a1710" opacity="0.6" />
        <ellipse cx="101.6" cy="57.4" rx="0.95" ry="0.5" fill="#2a1710" opacity="0.6" />
        <path d="M 99.2 58.4 L 99.2 60 M 100.8 58.4 L 100.8 60" stroke={skinDeep} strokeOpacity="0.2" strokeWidth="0.5" />

        <Eye cx={93.2} side={1} />
        <Eye cx={106.8} side={-1} />
        <Brow side={1} />
        <Brow side={-1} />
        {face === 'angry' && <path d="M 98.6 40.6 L 99 43 M 101.4 40.6 L 101 43" stroke={skinDeep} strokeOpacity="0.4" strokeWidth="0.6" />}
        <Mouth />

        {tattoo === 'scar' && (
          <g opacity="0.7" stroke="#8f2a2a" strokeLinecap="round">
            <line x1="86.4" y1="47" x2="91.4" y2="55" strokeWidth="1.1" />
            <line x1="87" y1="50.4" x2="89.6" y2="49" strokeWidth="0.6" /><line x1="88.4" y1="52.6" x2="91" y2="51.2" strokeWidth="0.6" />
          </g>
        )}
        {tattoo === 'cross' && (
          <g opacity="0.65" stroke={tattooColor} strokeWidth="0.9" strokeLinecap="round">
            <line x1="89.6" y1="49" x2="89.6" y2="53" /><line x1="88.2" y1="50.3" x2="91" y2="50.3" />
          </g>
        )}

        {/* 수염: 끝을 살짝 흐리게 해 피부에 스며들게 */}
        <g filter={url('fuzz')} fill={hairColor}>
          {(facialHair === 'mustache' || facialHair === 'goatee' || facialHair === 'beard') && (
            <path d="M 93 60 C 94.6 57.6 97.6 57 100 58 C 102.4 57 105.4 57.6 107 60 C 105.6 59.6 103 59.4 100 59.9 C 97 59.4 94.4 59.6 93 60 Z" opacity="0.9" />
          )}
          {facialHair === 'goatee' && <path d="M 95.6 64.4 C 97.4 63.4 102.6 63.4 104.4 64.4 C 104.6 68 102.8 70.2 100 70.6 C 97.2 70.2 95.4 68 95.6 64.4 Z" opacity="0.85" />}
          {facialHair === 'beard' && (
            <path d="M 81.4 44 C 81.4 53 83.4 59.4 87.4 64.4 C 91.2 69.2 95.6 71.8 100 71.8 C 104.4 71.8 108.8 69.2 112.6 64.4 C 116.6 59.4 118.6 53 118.6 44 C 117.2 51 114.6 56.2 110.6 58.6 C 107.6 60.2 104.6 60.8 102.4 60.4 C 101.4 63 98.6 63 97.6 60.4 C 95.4 60.8 92.4 60.2 89.4 58.6 C 85.4 56.2 82.8 51 81.4 44 Z" opacity="0.84" />
          )}
        </g>
        {facialHair === 'beard' && <path d="M 89 66 Q 100 73 111 66" stroke={hairLight} strokeOpacity="0.3" strokeWidth="0.6" fill="none" />}

        {/* 모자를 쓰면 정수리 머리카락은 모자 아래로 숨긴다 */}
        {(hat === 'cap' || hat === 'beanie' || hat === 'bandana' || hat === 'gm')
          ? <g clipPath={url('underHat')}><HairFront /></g>
          : <HairFront />}

        {/* 모자 */}
        {(hat === 'cap' || hat === 'beanie' || hat === 'headband') && <path d="M 82 41 Q 100 36.4 118 41 L 118 45 Q 100 40.4 82 45 Z" fill="#000" opacity={hat === 'cap' ? 0.22 : 0.1} filter={url('soft')} />}
        {hat === 'cap' && (
          <g>
            <g filter={url('cloth')} fill={hatColor}>
              <path d="M 79.8 37 C 79 19.6 88.6 12.2 100 12.2 C 111.4 12.2 121 19.6 120.2 37 Q 100 32.6 79.8 37 Z" />
            </g>
            <path d="M 100 12.6 L 100 33.6 M 90 14.6 Q 87 24 86.4 34.6 M 110 14.6 Q 113 24 113.6 34.6" stroke={shade(hatColor, -0.3)} strokeOpacity="0.55" strokeWidth="0.5" fill="none" />
            <circle cx="100" cy="12.8" r="1.5" fill={shade(hatColor, -0.2)} />
            <path d="M 92 22 Q 100 19.4 108 22 L 107.4 27 Q 100 25 92.6 27 Z" fill="#ffffff" opacity="0.85" />
            <g filter={url('cloth')}>
              <path d="M 79.4 36 Q 100 30.4 120.6 36 Q 121.4 40.6 117 42.6 Q 100 38.4 83 42.6 Q 78.6 40.6 79.4 36 Z" fill={shade(hatColor, -0.08)} />
            </g>
            <path d="M 83 42.4 Q 100 38.2 117 42.4" stroke={shade(hatColor, -0.45)} strokeWidth="0.8" fill="none" />
          </g>
        )}
        {hat === 'gm' && (
          <g>
            <path d="M 80 41 Q 100 36 120 41 L 120 45 Q 100 40 80 45 Z" fill="#000" opacity="0.2" filter={url('soft')} />
            <g filter={url('cloth')} fill="#f8fafc">
              <path d="M 83.5 35 C 82.6 22 86.5 11 100 11 C 113.5 11 117.4 22 116.5 35 Z" />
            </g>
            <path d="M 92 13.6 Q 100 18.4 108 13.6" stroke="#cbd5e1" strokeWidth="1" fill="none" />
            <path d="M 83.6 29 Q 100 25.6 116.4 29 L 116.6 35 Q 100 31.6 83.4 35 Z" fill="#d4af37" />
            <g filter={url('cloth')}>
              <path d="M 67.5 37.6 Q 100 27.4 132.5 37.6 Q 133.4 42.2 126 42.6 Q 100 34.6 74 42.6 Q 66.6 42.2 67.5 37.6 Z" fill="#f1f5f9" />
            </g>
            <path d="M 74 42.4 Q 100 34.4 126 42.4" stroke="#94a3b8" strokeWidth="0.7" fill="none" />
            <circle cx="100" cy="30.6" r="4.4" fill="#0f172a" stroke="#facc15" strokeWidth="0.9" />
            <text x="100" y="32.3" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#facc15">GM</text>
          </g>
        )}
        {hat === 'beanie' && (
          <g>
            <g filter={url('cloth')} fill={hatColor}>
              <path d="M 79.6 38.4 C 78.8 18.4 88.6 11.2 100 11.2 C 111.4 11.2 121.2 18.4 120.4 38.4 Z" />
              <circle cx="100" cy="10.4" r="3.6" />
            </g>
            {[86, 90.5, 95, 100, 105, 109.5, 114].map(x => <path key={x} d={`M ${x} ${x === 100 ? 13 : 16} Q ${x + (x - 100) * 0.08} 24 ${x + (x - 100) * 0.04} 30`} stroke={shade(hatColor, -0.3)} strokeOpacity="0.4" strokeWidth="0.6" fill="none" />)}
            <g filter={url('cloth')}>
              <path d="M 79.2 31 Q 100 26.4 120.8 31 L 121 38.6 Q 100 34.4 79 38.6 Z" fill={shade(hatColor, -0.12)} />
            </g>
            {[83, 87, 91, 95, 99, 103, 107, 111, 115].map(x => <path key={x} d={`M ${x + 0.4} ${30 - Math.abs(x - 100) * 0.03} L ${x + 0.4} ${37 - Math.abs(x - 100) * 0.03}`} stroke={shade(hatColor, -0.35)} strokeOpacity="0.4" strokeWidth="0.55" />)}
          </g>
        )}
        {hat === 'headband' && (
          <g>
            <g filter={url('cloth')}>
              <path d="M 80.6 35.6 Q 100 30.2 119.4 35.6 L 119.6 29.4 Q 100 23.6 80.4 29.4 Z" fill={hatColor} />
            </g>
            <path d="M 80.6 32.6 Q 100 27 119.4 32.6" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
            <path d="M 97 28.4 L 103 28.4" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}
        {hat === 'bandana' && (
          <g>
            <g filter={url('cloth')} fill={hatColor}>
              <path d="M 79.8 35.6 C 79.2 18.6 89 12.4 100 12.4 C 111 12.4 120.8 18.6 120.2 35.6 Q 100 30.6 79.8 35.6 Z" />
              <path d="M 119.8 30.4 C 124 31 126.6 34 126 38.6 L 122.6 37 L 121.2 41 C 119.6 38 119.2 34 119.8 30.4 Z" />
            </g>
            {[[88, 20], [96, 17], [106, 18], [113, 23], [92, 28], [101, 25], [110, 30], [86, 32]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#ffffff" opacity="0.7" />)}
            <path d="M 79.8 35.6 Q 100 30.6 120.2 35.6" stroke={shade(hatColor, -0.35)} strokeWidth="0.7" fill="none" />
          </g>
        )}

        {/* 얼굴 장식 */}
        {faceAcc === 'glasses' && (
          <g>
            <path d="M 87.4 42.4 L 98.8 42.4 L 98.4 47.6 Q 97.8 50 93.2 50 Q 88.2 50 87.6 47.6 Z M 112.6 42.4 L 101.2 42.4 L 101.6 47.6 Q 102.2 50 106.8 50 Q 111.8 50 112.4 47.6 Z" fill="#dbeafe" opacity="0.12" />
            <path d="M 87.4 42.4 L 98.8 42.4 L 98.4 47.6 Q 97.8 50 93.2 50 Q 88.2 50 87.6 47.6 Z M 112.6 42.4 L 101.2 42.4 L 101.6 47.6 Q 102.2 50 106.8 50 Q 111.8 50 112.4 47.6 Z" fill="none" stroke={faceAccColor} strokeWidth="1.15" strokeLinejoin="round" />
            <path d="M 87.2 42.4 L 98.9 42.4 M 101.1 42.4 L 112.8 42.4" stroke={faceAccColor} strokeWidth="1.8" />
            <path d="M 98.8 43.4 Q 100 42.2 101.2 43.4 M 87.4 43 L 81.4 44.4 M 112.6 43 L 118.6 44.4" stroke={faceAccColor} strokeWidth="1" fill="none" />
            <path d="M 89.4 44 L 91.6 46.8 M 103.2 44 L 105.4 46.8" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.6" />
          </g>
        )}
        {faceAcc === 'sunglasses' && (
          <g>
            <linearGradient id={id('lens')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={shade(faceAccColor, -0.2)} />
              <stop offset="1" stopColor={shade(faceAccColor, 0.25)} />
            </linearGradient>
            <path d="M 86.8 42 L 98.8 42 L 98.2 47.8 Q 97.2 50.8 92.6 50.8 Q 87.6 50.6 87 47 Z M 113.2 42 L 101.2 42 L 101.8 47.8 Q 102.8 50.8 107.4 50.8 Q 112.4 50.6 113 47 Z" fill={url('lens')} />
            <path d="M 86.4 42 L 98.9 42 M 101.1 42 L 113.6 42" stroke={shade(faceAccColor, -0.4)} strokeWidth="1.8" />
            <path d="M 88.6 43.4 Q 90 47 93.4 48.6 M 102.8 43.4 Q 104.2 47 107.6 48.6" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.9" fill="none" />
            <path d="M 98.8 42.6 Q 100 41.6 101.2 42.6 M 86.6 42.6 L 81.2 44 M 113.4 42.6 L 118.8 44" stroke={shade(faceAccColor, -0.4)} strokeWidth="1.1" fill="none" />
          </g>
        )}
        {faceAcc === 'mask' && (
          <g>
            <path d="M 84.6 50.6 Q 82.4 49.6 81.4 46.6 M 86 61.6 Q 83 59.6 81.6 52.4 M 115.4 50.6 Q 117.6 49.6 118.6 46.6 M 114 61.6 Q 117 59.6 118.4 52.4" stroke={shade(faceAccColor, -0.15)} strokeWidth="0.8" fill="none" />
            <g filter={url('cloth')}>
              <path d="M 84.4 50 Q 92 46.8 100 48 Q 108 46.8 115.6 50 L 114.4 61.2 Q 108.4 69.4 100 70 Q 91.6 69.4 85.6 61.2 Z" fill={faceAccColor} />
            </g>
            <path d="M 86.4 54.4 Q 100 52 113.6 54.4 M 86.6 58.4 Q 100 56.2 113.4 58.4 M 88.4 62.4 Q 100 60.6 111.6 62.4" stroke="#000" strokeOpacity="0.22" strokeWidth="0.6" fill="none" />
            <path d="M 94 48.6 Q 100 47.6 106 48.6" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.7" fill="none" />
          </g>
        )}

        {/* 목 장식 */}
        {(neckAcc === 'gold' || neckAcc === 'silver' || neckAcc === 'chain') && (
          <g>
            <path d={`M ${100 - nw - 0.4} 76.6 Q 100 ${female ? 98 : 101} ${100 + nw + 0.4} 76.6`} stroke={shade(neckAccColor, -0.45)} strokeWidth={female ? 1.4 : 2.1} fill="none" strokeDasharray={female ? '1.2 0.6' : '1.9 0.7'} strokeLinecap="round" />
            <path d={`M ${100 - nw - 0.4} 76.2 Q 100 ${female ? 97.6 : 100.6} ${100 + nw + 0.4} 76.2`} stroke={shade(neckAccColor, 0.35)} strokeWidth={female ? 0.6 : 0.8} fill="none" strokeDasharray={female ? '1.2 0.6' : '1.9 0.7'} strokeLinecap="round" />
            {female
              ? <circle cx="100" cy="90.6" r="1.6" fill={neckAccColor} stroke={shade(neckAccColor, -0.4)} strokeWidth="0.4" />
              : <g><rect x="97.6" y="90.4" width="4.8" height="7" rx="1.2" fill={neckAccColor} stroke={shade(neckAccColor, -0.45)} strokeWidth="0.45" /><path d="M 98.6 92 L 99.6 91.4 L 99.6 95.6" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.5" fill="none" /></g>}
          </g>
        )}
        {neckAcc === 'towel' && (
          <g>
            <g filter={url('cloth')} fill={neckAccColor}>
              <path d={`M ${100 - nw - 1} 72 C ${100 - nw - 9} 80 ${100 - nw - 11} 106 ${100 - nw - 10} 142 L ${100 - nw - 0.5} 142 C ${100 - nw + 0.4} 112 ${100 - nw + 1.4} 92 ${100 - nw + 4.6} 80 Z`} />
              <path d={`M ${100 + nw + 1} 72 C ${100 + nw + 9} 80 ${100 + nw + 11} 106 ${100 + nw + 10} 142 L ${100 + nw + 0.5} 142 C ${100 + nw - 0.4} 112 ${100 + nw - 1.4} 92 ${100 + nw - 4.6} 80 Z`} />
            </g>
            {[0, 1, 2, 3, 4].map(k => <g key={k} stroke={shade(neckAccColor, -0.25)} strokeOpacity="0.5" strokeWidth="0.6"><path d={`M ${100 - nw - 9.4 + k * 2} 142 l 0 2.4`} /><path d={`M ${100 + nw + 1.4 + k * 2} 142 l 0 2.4`} /></g>)}
            <path d={`M ${100 - nw - 9.6} 134 L ${100 - nw - 0.8} 134 M ${100 + nw + 0.8} 134 L ${100 + nw + 9.6} 134`} stroke={shade(neckAccColor, -0.3)} strokeOpacity="0.6" strokeWidth="1.2" />
          </g>
        )}
        {neckAcc === 'headphones' && (
          <g>
            <g filter={url('cloth')}>
              <ellipse cx={100 - nw - 6.5} cy="84" rx="4.6" ry="6.4" fill={neckAccColor} transform={`rotate(-28 ${100 - nw - 6.5} 84)`} />
              <ellipse cx={100 + nw + 6.5} cy="84" rx="4.6" ry="6.4" fill={neckAccColor} transform={`rotate(28 ${100 + nw + 6.5} 84)`} />
            </g>
            <ellipse cx={100 - nw - 5.4} cy="84.6" rx="2.6" ry="4.2" fill={shade(neckAccColor, -0.5)} transform={`rotate(-28 ${100 - nw - 5.4} 84.6)`} />
            <ellipse cx={100 + nw + 5.4} cy="84.6" rx="2.6" ry="4.2" fill={shade(neckAccColor, -0.5)} transform={`rotate(28 ${100 + nw + 5.4} 84.6)`} />
          </g>
        )}

        {/* 몸 장식 */}
        {bodyAcc === 'belt' && (
          <g>
            <g filter={url('cloth')}>
              <path d={`M ${100 - ww - 2.6} 182.4 Q 100 186.6 ${100 + ww + 2.6} 182.4 L ${100 + ww + 2.4} 197.4 Q 100 201.4 ${100 - ww - 2.4} 197.4 Z`} fill={bodyAccColor} />
            </g>
            <path d={`M ${100 - ww - 1.6} 184.6 Q 100 188.6 ${100 + ww + 1.6} 184.6 M ${100 - ww - 1.6} 195.4 Q 100 199.2 ${100 + ww + 1.6} 195.4`} stroke={shade(bodyAccColor, 0.4)} strokeOpacity="0.55" strokeWidth="0.45" strokeDasharray="1.2 0.8" fill="none" />
            <rect x="94" y="184.6" width="12" height="14.2" rx="2.4" fill="none" stroke="#d6d3d1" strokeWidth="1.8" />
            <path d="M 100 185.6 L 100 197.6" stroke="#a8a29e" strokeWidth="1.1" />
            <path d="M 95 185.4 L 99 185.4" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" />
            {[0, 1, 2].map(k => <circle key={k} cx={109.4 + k * 3.4} cy={191.6 + k * 0.1} r="0.7" fill={shade(bodyAccColor, -0.5)} />)}
          </g>
        )}
        {bodyAcc === 'vest' && (
          <g>
            <g filter={url('cloth')} fill={bodyAccColor}>
              <path d={symPath([100 - nw - 3, 80], [
                [[100 - nw - 5, 84], [100 - sw + 10, 86], [100 - sw + 7, 92]],
                [[100 - lat + 2, 104], [100 - lat - 1, 116], [100 - lat - 1, 128]],
                [[100 - lat - 1, 146], [100 - ww - 2, 162], [100 - ww - 2.4, 174]],
              ])} />
            </g>
            {[116, 134, 152].map(y => (
              <g key={y}>
                <rect x={100 - ww + 2.4} y={y} width={ww * 2 - 4.8} height="12" rx="2" fill={shade(bodyAccColor, -0.22)} />
                <path d={`M ${100 - ww + 3} ${y + 4} L ${100 + ww - 3} ${y + 4}`} stroke="#000" strokeOpacity="0.3" strokeWidth="0.6" />
              </g>
            ))}
            <path d={`M ${100 - lat - 0.5} 160 L ${100 - ww - 2} 160 M ${100 + lat + 0.5} 160 L ${100 + ww + 2} 160`} stroke={shade(bodyAccColor, 0.3)} strokeWidth="1.6" />
          </g>
        )}
        {bodyAcc === 'bag' && (
          <g>
            <path d={`M ${100 - sw + 9} 88 Q 100 124 ${100 + ww + 3} 170`} stroke={shade(bodyAccColor, -0.25)} strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <path d={`M ${100 - sw + 9} 88 Q 100 124 ${100 + ww + 3} 170`} stroke={shade(bodyAccColor, 0.3)} strokeOpacity="0.6" strokeWidth="0.5" strokeDasharray="1.4 1" fill="none" />
            <g filter={url('cloth')}>
              <rect x={100 + ww - 7} y="164" width="22" height="16" rx="5" fill={bodyAccColor} transform={`rotate(-12 ${100 + ww + 4} 172)`} />
            </g>
            <path d={`M ${100 + ww - 4.4} 168.6 L ${100 + ww + 11.6} 165.2`} stroke={shade(bodyAccColor, -0.4)} strokeWidth="0.8" />
            <circle cx={100 + ww + 12} cy="165.4" r="0.9" fill="#d6d3d1" />
          </g>
        )}
        </g>

        {/* 오라 (앞쪽): 떠오르는 입자, 번개, 땀방울과 김 */}
        {showAura && aura === 'glow' && SPARKLES.map(([x, y, sc, d], k) => (
          <g key={k} transform={`translate(${x} ${y})`}>
            <path d="M 0 -3.4 L 0.7 -0.7 L 3.4 0 L 0.7 0.7 L 0 3.4 L -0.7 0.7 L -3.4 0 L -0.7 -0.7 Z" fill={auraLight} transform={`scale(${sc})`} opacity="0">
              <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -26" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" additive="sum" />
            </path>
          </g>
        ))}
        {showAura && aura === 'fire' && EMBERS.map(([x, y, r, d], k) => (
          <circle key={k} cx={x} cy={y} r={r} fill={k % 3 ? mix(auraColor, '#fff3b0', 0.6) : auraColor} opacity="0" filter={url('soft')}>
            <animate attributeName="opacity" values="0;1;0.8;0" dur="1.8s" begin={`${d}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values={`${y};${y - 70}`} dur="1.8s" begin={`${d}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values={`${x};${x + (k % 2 ? 6 : -6)};${x}`} dur="1.8s" begin={`${d}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {showAura && aura === 'lightning' && (
          <g filter={url('boltGlow')} stroke={mix(auraColor, '#ffffff', 0.55)} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round">
            {BOLTS.map(([d, dur, begin], k) => (
              <path key={k} d={d} opacity="0">
                <animate attributeName="opacity" values="0;1;0;0.9;0;0" keyTimes="0;0.06;0.12;0.18;0.24;1" dur={dur} begin={begin} repeatCount="indefinite" />
              </path>
            ))}
          </g>
        )}
        {showAura && aura === 'sweat' && (
          <g>
            {STEAM.map(([d, begin], k) => (
              <path key={k} d={d} stroke="#f5f5f5" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0" filter={url('blur3')}>
                <animate attributeName="opacity" values="0;0.24;0" dur="3s" begin={begin} repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur="3s" begin={begin} repeatCount="indefinite" />
              </path>
            ))}
            {DROPS.filter(([, , onChest]) => !onChest || showChest).map(([x, y, , sc, begin], k) => (
              <g key={k} transform={`translate(${x} ${y}) scale(${sc})`}>
                <g>
                  <path d="M 0 -2.6 C 0.9 -1 1.7 0.2 1.7 1.2 C 1.7 2.3 0.9 3 0 3 C -0.9 3 -1.7 2.3 -1.7 1.2 C -1.7 0.2 -0.9 -1 0 -2.6 Z" fill={url('drop')} stroke="#3b82c4" strokeOpacity="0.35" strokeWidth="0.25" />
                  <circle cx="-0.6" cy="0.6" r="0.45" fill="#ffffff" />
                  <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 7" keyTimes="0;0.55;1" dur="2.6s" begin={begin} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="2.6s" begin={begin} repeatCount="indefinite" />
                </g>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};
