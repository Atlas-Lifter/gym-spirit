import React, { useState } from 'react';
import MANIFEST from './data/avatarManifest.json';
import { AVATAR_SHOE_COLORS, AVATAR_SKIN_TONES, LEGACY_SKIN } from './avatarOptions.js';

// 실사 아바타: 제미나이로 만든 몸 그림 위에 옷·장식·머리 조각을 겹쳐 그린다 (public/avatar, .tools/avatar_build.py)
// · 체형은 몸무게·골격근·체지방으로 8가지 중 하나를 고른다
// · 옷·장식·머리 조각은 명암만 있는 회색 그림이라, 고른 색을 곱해서 칠한다 (CSS mask + multiply)
// · 그림을 못 불러오면 예전 그림 아바타(fallback)로 보여 준다

const [PW, PH] = MANIFEST.panel;
const IMG = '/avatar';

// ── 체형 고르기 ───────────────────────────────────────────
// 골격근 비율(골격근 ÷ 몸무게)과 체지방률로 나눈다. 기록이 없으면 '보통'
export const pickBodyType = (gender, stats) => {
  const w = parseFloat(stats?.weight), m = parseFloat(stats?.muscle), f = parseFloat(stats?.fat);
  const female = gender === 'female';
  if (!(w > 0)) return 'average';
  const mr = m > 0 ? m / w : null;
  if (female) {
    if (f >= 38) return mr && mr >= 0.4 ? 'powerlifter' : 'obese';
    if (f >= 31) return mr && mr >= 0.41 ? 'powerlifter' : 'chubby';
    if (mr !== null) {
      if (mr >= 0.46 && f <= 18) return 'bodybuilder';
      if (mr >= 0.43) return 'muscular';
      if (mr >= 0.4 && (!(f > 0) || f <= 24)) return 'fit';
    }
    return w < 48 ? 'skinny' : 'average';
  }
  if (f >= 30) return mr && mr >= 0.43 ? 'powerlifter' : 'obese';
  if (f >= 22) return mr && mr >= 0.45 ? 'powerlifter' : 'chubby';
  if (mr !== null) {
    if (mr >= 0.5 && (!(f > 0) || f <= 12)) return 'bodybuilder';
    if (mr >= 0.47) return 'muscular';
    if (mr >= 0.44 && (!(f > 0) || f <= 16)) return 'fit';
  }
  return w < 62 ? 'skinny' : 'average';
};

// 피부색: 그림의 피부(밝은 중간 톤)를 기준으로 밝기·채도를 바꿔 맞춘다
const SKIN_FILTERS = [
  'brightness(1.07) saturate(0.82)', 'none', 'brightness(0.95) saturate(1.06) sepia(0.06)',
  'brightness(0.84) saturate(1.1) sepia(0.12)', 'brightness(0.68) saturate(1.14) sepia(0.18)', 'brightness(0.5) saturate(1.2) sepia(0.22)',
];

// 예전 값·성별에 없는 옷은 비슷한 것으로 바꿔 보여 준다
const TOP_FOR = {
  male: { tshirt: 'tshirt', tank: 'tank', hoodie: 'hoodie', stringer: 'stringer', none: null },
  female: { tshirt: 'tshirt', tank: 'tank', hoodie: 'crophoodie', stringer: 'tank', none: 'bra' },
};
const NECK = { chain: 'chain', towel: 'towel', headphones: 'headphones', dogtag: 'dogtag' };
const BODY_ACC = { belt: 'belt', vest: 'vest', bag: 'bag', kneesleeve: 'kneesleeve' };

// 회색 명암 그림 위에 고른 색을 곱한다
const Tinted = ({ src, color, style }) => (
  <div style={{ position: 'absolute', isolation: 'isolate', ...style }}>
    <img src={src} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
    {color && (
      <div style={{
        position: 'absolute', inset: 0, background: color, mixBlendMode: 'multiply',
        WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
      }} />
    )}
  </div>
);

const FULL = { left: 0, top: 0, width: '100%', height: '100%' };
const pct = (v, total) => `${(v / total) * 100}%`;

// 오라: 실사 오라 그림이 오기 전까지는 아바타 둘레 빛으로 보여 준다
const AURA_CSS = `
@keyframes gsAuraPulse { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes gsAuraFlicker { 0%,100% { opacity: .7 } 20% { opacity: 1 } 40% { opacity: .5 } 60% { opacity: .95 } 80% { opacity: .6 } }
@keyframes gsAuraBolt { 0%,100% { opacity: .35 } 8% { opacity: 1 } 12% { opacity: .3 } 16% { opacity: .9 } 30% { opacity: .4 } }
`;
let auraCssAdded = false;
const ensureAuraCss = () => {
  if (auraCssAdded || typeof document === 'undefined') return;
  auraCssAdded = true;
  const el = document.createElement('style'); el.textContent = AURA_CSS; document.head.appendChild(el);
};

// 이 프로필이면 어떤 그림을 어디에 겹치는지 (화면 아바타와 오운완 카드 그림이 같이 쓴다)
// layers: [{ id, src, color, box }] — box 가 없으면 몸 그림 전체 크기, 있으면 몸 그림 기준 px 위치
export const avatarSpec = (profile, bodyStats) => {
  const gender = profile?.gender === 'female' ? 'female' : 'male';
  const g = gender === 'female' ? 'f' : 'm';
  const key = `${g}-${pickBodyType(gender, bodyStats)}`;
  const body = MANIFEST.bodies[key];
  if (!body) return null;
  const gm = !!profile?.gm && !!MANIFEST.gm[key];
  const skin = LEGACY_SKIN[profile?.skinColor] || profile?.skinColor || AVATAR_SKIN_TONES[1];
  const skinFilter = gm ? 'none' : (SKIN_FILTERS[Math.max(0, AVATAR_SKIN_TONES.indexOf(skin))] || 'none');
  const have = new Set(MANIFEST.wear[key] || []);
  const layers = [];
  const wear = (item, color) => { if (item && have.has(item)) layers.push({ id: item, src: `${IMG}/wear/${key}-${item}.webp`, color }); };

  if (!gm) {
    const legacyAcc = profile?.accessory || 'none';
    const top = TOP_FOR[gender][profile?.topStyle || 'tshirt'] ?? null;
    const bottom = profile?.bottomStyle || 'shorts';
    const neck = NECK[profile?.neckAcc] || null;
    const bodyAcc = BODY_ACC[profile?.bodyAcc !== undefined ? profile.bodyAcc : (legacyAcc === 'belt' ? 'belt' : 'none')] || null;
    // 아래에서 위로: 신발 → 하의 → 무릎 보호대 → 상의 → 벨트·조끼·가방 → 목 장식
    wear('shoes', profile?.shoeColor || AVATAR_SHOE_COLORS[0]);
    wear(bottom, profile?.bottomColor || '#171717');
    if (bodyAcc === 'kneesleeve') wear('kneesleeve', profile?.bodyAccColor || '#171717');
    wear(top, profile?.shirtColor || '#10b981');
    if (bodyAcc && bodyAcc !== 'kneesleeve') wear(bodyAcc, profile?.bodyAccColor || '#171717');
    wear(neck, profile?.neckAccColor || '#fbbf24');

    // 머리 장식은 몸 그림의 머리 크기·위치에 맞춰 놓는다
    const hg = body.head;
    const head = (slot, name, color) => {
      const hk = `${g}-${slot}-${name}`, r = MANIFEST.head[hk];
      if (!r) return;
      const [rx, ry, rw, rh] = r;
      layers.push({ id: hk, src: `${IMG}/head/${hk}.webp`, color, box: { x: hg.cx + rx * hg.w, y: hg.top + ry * hg.w, w: rw * hg.w, h: rh * hg.w } });
    };
    const hairColor = profile?.hairColor || '#171717';
    const hat = profile?.hat !== undefined ? profile.hat : (legacyAcc === 'headband' || legacyAcc === 'cap' ? legacyAcc : 'none');
    const faceAcc = profile?.faceAcc !== undefined ? profile.faceAcc : (legacyAcc === 'glasses' ? 'glasses' : 'none');
    head('hair', profile?.hairStyle || 'classic', hairColor);
    if (gender === 'male') head('beard', profile?.facialHair || 'none', hairColor);
    head('face', faceAcc, profile?.faceAccColor || '#171717');
    head('hat', hat, profile?.hatColor || '#ef4444');
  }
  return {
    key, head: body.head, gm, skinFilter, layers,
    bodySrc: gm ? `${IMG}/gm/${key}.webp` : `${IMG}/body/${key}.webp`,
    aura: profile?.aura || 'none', auraColor: profile?.auraColor || '#eab308',
  };
};

const loadImg = (src) => new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = src; });

// 캔버스에 실사 아바타를 그린다 (오운완 카드 저장용). x·y 는 왼쪽 위, h 는 그릴 높이
export const drawPhotoAvatar = async (ctx, spec, x, y, h) => {
  const k = h / PH;
  const body = await loadImg(spec.bodySrc);
  ctx.save();
  if (spec.aura !== 'none' && spec.aura !== 'sweat') { ctx.shadowColor = spec.auraColor; ctx.shadowBlur = 60; }
  else { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24; }
  if (spec.skinFilter !== 'none' && 'filter' in ctx) ctx.filter = spec.skinFilter;
  ctx.drawImage(body, x, y, PW * k, h);
  ctx.restore();
  for (const L of spec.layers) {
    let im;
    try { im = await loadImg(L.src); } catch (e) { continue; }
    const b = L.box || { x: 0, y: 0, w: PW, h: PH };
    const w = Math.max(1, Math.round(b.w * k)), hh = Math.max(1, Math.round(b.h * k));
    // 회색 명암 × 고른 색, 모양은 원래 그림 그대로
    const c = document.createElement('canvas'); c.width = w; c.height = hh;
    const cx = c.getContext('2d');
    cx.drawImage(im, 0, 0, w, hh);
    if (L.color) {
      cx.globalCompositeOperation = 'multiply'; cx.fillStyle = L.color; cx.fillRect(0, 0, w, hh);
      cx.globalCompositeOperation = 'destination-in'; cx.drawImage(im, 0, 0, w, hh);
    }
    ctx.drawImage(c, x + b.x * k, y + b.y * k);
  }
};

export const PhotoAvatar = ({ profile, bodyStats, size = 'w-32 h-64', crop = false, fallback: Fallback, ...rest }) => {
  const [failed, setFailed] = useState(false);
  const spec = avatarSpec(profile, bodyStats);
  if (failed || !spec) return Fallback ? <Fallback profile={profile} bodyStats={bodyStats} size={size} crop={crop} {...rest} /> : null;
  const { skinFilter, aura, auraColor } = spec;
  const layers = spec.layers.map(L => (
    <Tinted key={L.id} src={L.src} color={L.color} style={L.box
      ? { left: pct(L.box.x, PW), top: pct(L.box.y, PH), width: pct(L.box.w, PW), height: pct(L.box.h, PH) }
      : FULL} />
  ));

  const showAura = !crop && aura !== 'none' && aura !== 'sweat';
  if (showAura) ensureAuraCss();
  const auraAnim = aura === 'fire' ? 'gsAuraFlicker 0.9s infinite' : aura === 'lightning' ? 'gsAuraBolt 1.6s infinite' : 'gsAuraPulse 2.8s ease-in-out infinite';
  const auraBlur = aura === 'fire' ? 10 : aura === 'lightning' ? 6 : 12;

  const { bodySrc } = spec;
  const figure = (
    <div style={{ position: 'relative', height: '100%', aspectRatio: `${PW} / ${PH}`, margin: '0 auto' }}>
      {showAura && (
        <img src={bodySrc} alt="" aria-hidden="true" draggable={false} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', animation: auraAnim,
          filter: `brightness(0) drop-shadow(0 0 ${auraBlur * 0.4}px ${auraColor}) drop-shadow(0 0 ${auraBlur}px ${auraColor}) drop-shadow(0 0 ${auraBlur * 1.8}px ${auraColor})`,
        }} />
      )}
      <img src={bodySrc} alt="" draggable={false} onError={() => setFailed(true)} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', filter: skinFilter,
      }} />
      {layers}
      {aura === 'sweat' && !crop && (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.18), transparent 60%)', mixBlendMode: 'screen', pointerEvents: 'none' }} />
      )}
    </div>
  );

  if (crop) {
    // 얼굴만: 머리를 가운데 두고 확대
    const hg = spec.head;
    const S = hg.w * 2.2;
    const x0 = hg.cx - S / 2, y0 = hg.top - hg.w * 0.3;
    return (
      <div className={`${size} relative overflow-hidden`} role="img" aria-label="내 아바타">
        <div style={{ position: 'absolute', width: `${(PW / S) * 100}%`, height: `${(PH / S) * 100}%`, left: `${(-x0 / S) * 100}%`, top: `${(-y0 / S) * 100}%` }}>
          {figure}
        </div>
      </div>
    );
  }
  return (
    <div className={`${size} flex justify-center items-end relative`} role="img" aria-label="내 아바타">
      {figure}
    </div>
  );
};
