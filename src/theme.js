// 앱 공통 어두운 카드 배경 (검정 + 에메랄드·파랑 빛)
// 흐림(blur) 원을 쓰면 둥근 모서리 밖으로 빛이 번져 가장자리가 지저분해 보여서, 같은 느낌을 그라데이션으로 그린다.
const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const heroBg = (glow = '#10b981', glow2 = '#2563eb') =>
  `radial-gradient(110% 85% at 0% 0%, ${rgba(glow, 0.34)}, transparent 60%), radial-gradient(110% 95% at 100% 100%, ${rgba(glow2, 0.4)}, transparent 62%), #070b0f`;

export const HERO_BG = heroBg();
export const TRON_GRID = { backgroundImage: 'linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)', backgroundSize: '28px 28px' };
