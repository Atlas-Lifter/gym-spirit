import React, { useId, useState } from 'react';

// 길드 레이드 보스 그림 (13종 × 속성 색). viewBox 160×160, 바닥 그림자는 y≈150.
// 굵은 외곽선 + 그라데이션 + 빛나는 눈으로 '헬스 방해꾼'을 만화 보스처럼 그린다.

const O = '#0b0f14'; // 외곽선
const SW = 3;

const Eyes = ({ l, r, rad = 7, color, angry = true, id }) => (
  <g>
    {[l, r].map(([x, y], i) => (
      <g key={i}>
        <ellipse cx={x} cy={y} rx={rad} ry={rad * 0.85} fill={color} stroke={O} strokeWidth={2.5} style={{ filter: `url(#${id}-glow)` }} />
        <circle cx={x + (i ? -1.5 : 1.5)} cy={y + 1} r={rad * 0.38} fill={O} />
        {angry && <path d={i ? `M${x - rad - 2} ${y - rad - 4} L${x + rad + 2} ${y - rad + 1}` : `M${x - rad - 2} ${y - rad + 1} L${x + rad + 2} ${y - rad - 4}`} stroke={O} strokeWidth={4} strokeLinecap="round" />}
      </g>
    ))}
  </g>
);

const Teeth = ({ x, y, w, n = 5, down = true }) => {
  const step = w / n;
  return <path d={`M${x} ${y} ${Array.from({ length: n }, (_, i) => `L${x + step * i + step / 2} ${y + (down ? 7 : -7)} L${x + step * (i + 1)} ${y}`).join(' ')}`} fill="#fff" stroke={O} strokeWidth={2} strokeLinejoin="round" />;
};

const ART = {
  sofa: (el, id) => (
    <g>
      <rect x="18" y="44" width="124" height="66" rx="18" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <path d="M40 58 Q60 52 80 58 Q100 52 120 58" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={3} strokeLinecap="round" />
      <rect x="8" y="76" width="30" height="58" rx="14" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <rect x="122" y="76" width="30" height="58" rx="14" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <rect x="32" y="98" width="96" height="36" rx="11" fill="#9a6b4f" stroke={O} strokeWidth={SW} />
      <line x1="80" y1="100" x2="80" y2="132" stroke={O} strokeWidth={2} opacity=".5" />
      <rect x="22" y="134" width="10" height="12" rx="3" fill="#3b2418" stroke={O} strokeWidth={2} />
      <rect x="128" y="134" width="10" height="12" rx="3" fill="#3b2418" stroke={O} strokeWidth={2} />
      <Eyes l={[60, 70]} r={[100, 70]} color={el.eye} id={id} />
      <path d="M58 86 Q80 98 102 86 L102 90 Q80 104 58 90 Z" fill="#3b0d0d" stroke={O} strokeWidth={2.5} />
      <Teeth x={62} y={88} w={36} n={6} />
      <g transform="rotate(-25 138 84)"><rect x="130" y="62" width="14" height="34" rx="4" fill="#1f2937" stroke={O} strokeWidth={2.5} /><circle cx="137" cy="70" r="2.5" fill="#ef4444" /><circle cx="137" cy="78" r="2" fill="#9ca3af" /><circle cx="137" cy="85" r="2" fill="#9ca3af" /></g>
    </g>
  ),
  chicken: (el, id) => (
    <g>
      <rect x="72" y="112" width="16" height="30" rx="6" fill="#f5f0e6" stroke={O} strokeWidth={SW} />
      <circle cx="68" cy="144" r="8" fill="#f5f0e6" stroke={O} strokeWidth={SW} />
      <circle cx="92" cy="144" r="8" fill="#f5f0e6" stroke={O} strokeWidth={SW} />
      <path d="M80 26 C124 26 142 70 126 102 C116 124 94 126 80 118 C66 126 44 124 34 102 C18 70 36 26 80 26 Z" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      {[[52, 50], [104, 46], [44, 82], [116, 86], [70, 108], [96, 106], [84, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill="#7c3f0f" opacity=".7" />)}
      <path d="M50 46 Q64 34 78 36" stroke="rgba(255,255,255,.35)" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M58 22 L64 8 L72 18 L80 4 L88 18 L96 8 L102 22 Z" fill="#facc15" stroke={O} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx="80" cy="12" r="3" fill="#ef4444" stroke={O} strokeWidth={1.5} />
      <Eyes l={[64, 66]} r={[96, 66]} color={el.eye} id={id} />
      <path d="M62 86 Q80 102 98 86 Q80 94 62 86 Z" fill="#3b0d0d" stroke={O} strokeWidth={2.5} />
      <path d="M68 88 L71 95 L74 89 M86 89 L89 95 L92 88" fill="#fff" stroke={O} strokeWidth={1.5} />
    </g>
  ),
  phone: (el, id) => (
    <g>
      <ellipse cx="80" cy="132" rx="46" ry="18" fill="#1f2937" stroke={O} strokeWidth={SW} />
      {[[40, 60, -14, 'M58 124 C44 108 40 92 40 80'], [80, 40, 0, 'M80 118 C80 96 80 80 80 66'], [120, 60, 14, 'M102 124 C116 108 120 92 120 80']].map(([x, y, r, neck], i) => (
        <g key={i}>
          <path d={neck} stroke="#374151" strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d={neck} stroke={O} strokeWidth={17} fill="none" strokeLinecap="round" opacity=".0" />
          <g transform={`rotate(${r} ${x} ${y})`}>
            <rect x={x - 18} y={y - 28} width="36" height="56" rx="8" fill="#111827" stroke={O} strokeWidth={SW} />
            <rect x={x - 14} y={y - 22} width="28" height="44" rx="4" fill={`url(#${id}-a)`} />
            <circle cx={x - 6} cy={y - 6} r="4" fill={el.eye} stroke={O} strokeWidth={1.5} style={{ filter: `url(#${id}-glow)` }} />
            <circle cx={x + 6} cy={y - 6} r="4" fill={el.eye} stroke={O} strokeWidth={1.5} style={{ filter: `url(#${id}-glow)` }} />
            <path d={`M${x - 7} ${y + 8} Q${x} ${y + 14} ${x + 7} ${y + 8}`} stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
            {i === 1 && <path d={`M${x - 3} ${y - 19} L${x + 4} ${y - 15} L${x - 3} ${y - 11} Z`} fill="#fff" />}
          </g>
        </g>
      ))}
    </g>
  ),
  alarm: (el, id) => (
    <g>
      <path d="M80 70 C104 74 120 110 128 146 L32 146 C40 110 56 74 80 70 Z" fill="#312e81" stroke={O} strokeWidth={SW} />
      <path d="M80 70 C92 90 96 120 98 146 L62 146 C64 120 68 90 80 70 Z" fill="#1e1b4b" opacity=".7" />
      <path d="M46 26 A14 14 0 0 1 66 16" fill="#fbbf24" stroke={O} strokeWidth={SW} />
      <path d="M114 26 A14 14 0 0 0 94 16" fill="#fbbf24" stroke={O} strokeWidth={SW} />
      <circle cx="80" cy="56" r="34" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <circle cx="80" cy="56" r="26" fill="#f8fafc" stroke={O} strokeWidth={2} />
      {Array.from({ length: 12 }).map((_, i) => { const a = (i * 30) * Math.PI / 180; return <line key={i} x1={80 + Math.cos(a) * 22} y1={56 + Math.sin(a) * 22} x2={80 + Math.cos(a) * 25} y2={56 + Math.sin(a) * 25} stroke={O} strokeWidth={1.5} />; })}
      <circle cx="70" cy="50" r="6" fill={O} /><circle cx="90" cy="50" r="6" fill={O} />
      <circle cx="70" cy="50" r="2.5" fill={el.eye} style={{ filter: `url(#${id}-glow)` }} /><circle cx="90" cy="50" r="2.5" fill={el.eye} style={{ filter: `url(#${id}-glow)` }} />
      <path d="M72 66 L76 62 L80 66 L84 62 L88 66" stroke={O} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      <path d="M38 104 L22 92 M122 104 L138 92" stroke="#e5e7eb" strokeWidth={5} strokeLinecap="round" />
      <text x="136" y="80" fontSize="16" fontWeight="900" fill={el.glow} style={{ filter: `url(#${id}-glow)` }}>Z</text>
      <text x="146" y="66" fontSize="11" fontWeight="900" fill={el.glow}>z</text>
    </g>
  ),
  cola: (el, id) => (
    <g>
      <path d="M26 144 C14 104 36 54 80 52 C124 54 146 104 134 144 Z" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <path d="M40 120 C34 96 46 72 66 64" stroke="rgba(255,255,255,.3)" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M30 108 Q80 120 130 108 L131 122 Q80 134 29 122 Z" fill="#dc2626" stroke={O} strokeWidth={2} />
      <text x="80" y="122" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" letterSpacing="2">ZERO</text>
      {[[56, 92, 4], [104, 88, 5], [92, 136, 3], [62, 134, 4], [116, 132, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,.35)" />)}
      <g transform="rotate(18 98 40)"><rect x="94" y="8" width="8" height="54" rx="3" fill="#fff" stroke={O} strokeWidth={2} />{[14, 26, 38, 50].map(y => <rect key={y} x="94" y={y} width="8" height="5" fill="#ef4444" />)}</g>
      <Eyes l={[64, 80]} r={[96, 80]} rad={8} color={el.eye} id={id} />
      <path d="M68 98 Q80 104 92 98" stroke={O} strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  ),
  ramen: (el, id) => (
    <g>
      {[[-1, 40], [1, 40], [-1, 70], [1, 70]].map(([s, h], i) => (
        <path key={i} d={`M${80 + s * (14 + i * 6)} 100 C${80 + s * (34 + i * 8)} ${100 - h * 0.4} ${80 + s * (20 + i * 10)} ${100 - h * 0.8} ${80 + s * (40 + i * 6)} ${100 - h}`} stroke="#fcd34d" strokeWidth={8} fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 0 #0b0f14)' }} />
      ))}
      {[[-1, 40], [1, 40], [-1, 70], [1, 70]].map(([s, h], i) => (
        <path key={`o${i}`} d={`M${80 + s * (14 + i * 6)} 100 C${80 + s * (34 + i * 8)} ${100 - h * 0.4} ${80 + s * (20 + i * 10)} ${100 - h * 0.8} ${80 + s * (40 + i * 6)} ${100 - h}`} stroke={O} strokeWidth={11} fill="none" strokeLinecap="round" opacity=".18" />
      ))}
      <g transform="rotate(-30 128 40)"><rect x="124" y="14" width="5" height="56" rx="2" fill="#a16207" stroke={O} strokeWidth={1.5} /><rect x="132" y="14" width="5" height="56" rx="2" fill="#a16207" stroke={O} strokeWidth={1.5} /></g>
      <ellipse cx="80" cy="100" rx="56" ry="14" fill="#fbbf24" stroke={O} strokeWidth={SW} />
      <path d="M24 100 C26 132 50 148 80 148 C110 148 134 132 136 100 Z" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <path d="M36 116 L48 116 L48 124 L60 124 L60 116 L72 116 L72 124 L84 124 L84 116 L96 116 L96 124 L108 124 L108 116 L124 116" stroke="#fff" strokeWidth={2} fill="none" opacity=".6" />
      {[[64, 98], [96, 98]].map(([x, y], i) => (
        <g key={i}><ellipse cx={x} cy={y} rx="12" ry="8" fill="#fff" stroke={O} strokeWidth={2} /><circle cx={x} cy={y} r="5" fill="#f59e0b" stroke={O} strokeWidth={1.5} /><circle cx={x} cy={y} r="2" fill={el.eye} style={{ filter: `url(#${id}-glow)` }} /></g>
      ))}
      <path d="M52 86 L74 92 M108 86 L86 92" stroke={O} strokeWidth={4} strokeLinecap="round" />
    </g>
  ),
  bed: (el, id) => (
    <g>
      <rect x="12" y="46" width="22" height="98" rx="6" fill="#78350f" stroke={O} strokeWidth={SW} />
      <rect x="20" y="96" width="128" height="38" rx="8" fill="#92400e" stroke={O} strokeWidth={SW} />
      <rect x="140" y="104" width="10" height="40" rx="3" fill="#78350f" stroke={O} strokeWidth={2.5} />
      <path d="M30 98 C30 80 46 70 64 72 L140 76 C150 78 150 96 140 98 Z" fill="#fda4af" stroke={O} strokeWidth={SW} />
      <path d="M36 98 L140 98 L140 110 C110 118 70 120 36 112 Z" fill="#3b0d0d" stroke={O} strokeWidth={2.5} />
      <Teeth x={40} y={98} w={96} n={10} />
      <Teeth x={44} y={112} w={88} n={9} down={false} />
      <path d="M40 74 C60 40 120 36 146 60 C150 68 146 76 140 76 L64 72 Z" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <path d="M60 58 Q80 48 100 50" stroke="rgba(255,255,255,.3)" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Eyes l={[84, 60]} r={[112, 58]} rad={6} color={el.eye} id={id} />
    </g>
  ),
  goblin: (el, id) => (
    <g>
      <path d="M50 146 C48 116 60 98 80 98 C100 98 112 116 110 146 Z" fill="#4d7c0f" stroke={O} strokeWidth={SW} />
      <path d="M30 56 L56 66 L52 80 Z" fill="#65a30d" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M130 56 L104 66 L108 80 Z" fill="#65a30d" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx="80" cy="74" rx="30" ry="32" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <Eyes l={[69, 70]} r={[91, 70]} rad={6} color={el.eye} id={id} />
      <path d="M78 76 L74 86 L82 86 Z" fill="#4d7c0f" stroke={O} strokeWidth={1.5} />
      <path d="M68 92 Q80 86 92 92" stroke={O} strokeWidth={3} fill="none" strokeLinecap="round" />
      <rect x="120" y="30" width="5" height="116" rx="2" fill="#a16207" stroke={O} strokeWidth={2} />
      <g transform="rotate(-6 128 30)"><rect x="96" y="10" width="62" height="34" rx="5" fill="#fef3c7" stroke={O} strokeWidth={2.5} /><text x="127" y="24" textAnchor="middle" fontSize="10" fontWeight="900" fill="#b91c1c">진짜로</text><text x="127" y="37" textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">내일부터</text></g>
      <path d="M106 112 L120 100" stroke="#65a30d" strokeWidth={9} strokeLinecap="round" />
    </g>
  ),
  ogre: (el, id) => (
    <g>
      <ellipse cx="80" cy="112" rx="52" ry="38" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <path d="M44 122 Q80 136 116 122" stroke="rgba(0,0,0,.25)" strokeWidth={4} fill="none" />
      <circle cx="80" cy="66" r="26" fill="#a3a3a3" stroke={O} strokeWidth={SW} />
      <rect x="52" y="22" width="56" height="36" rx="5" fill="#f59e0b" stroke={O} strokeWidth={SW} />
      <path d="M52 34 L108 34" stroke={O} strokeWidth={2} />
      <text x="80" y="52" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">배달</text>
      <Eyes l={[70, 68]} r={[90, 68]} rad={5.5} color={el.eye} id={id} />
      <path d="M68 82 Q80 76 92 82 L92 84 Q80 80 68 84 Z" fill="#fff" stroke={O} strokeWidth={2} />
      <path d="M70 82 L72 74 M90 82 L88 74" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <g transform="rotate(10 132 104)"><rect x="118" y="88" width="30" height="34" rx="4" fill="#fff" stroke={O} strokeWidth={2.5} /><path d="M124 88 Q133 76 142 88" stroke={O} strokeWidth={2.5} fill="none" /><text x="133" y="110" textAnchor="middle" fontSize="12">🍔</text></g>
      <path d="M30 100 L18 120" stroke="#737373" strokeWidth={12} strokeLinecap="round" />
    </g>
  ),
  demon: (el, id) => (
    <g>
      <path d="M80 60 C120 62 140 110 146 146 L14 146 C20 110 40 62 80 60 Z" fill="#450a0a" stroke={O} strokeWidth={SW} />
      <path d="M56 36 C40 30 34 14 40 4 C46 18 56 24 64 28 Z" fill="#f5f5f4" stroke={O} strokeWidth={2.5} />
      <path d="M104 36 C120 30 126 14 120 4 C114 18 104 24 96 28 Z" fill="#f5f5f4" stroke={O} strokeWidth={2.5} />
      <ellipse cx="80" cy="54" rx="28" ry="30" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <Eyes l={[69, 50]} r={[91, 50]} rad={6} color={el.eye} id={id} />
      <path d="M66 68 Q80 78 94 68 Q80 72 66 68 Z" fill="#3b0d0d" stroke={O} strokeWidth={2.5} />
      <path d="M70 69 L72 75 L75 70 M85 70 L88 75 L90 69" fill="#fff" stroke={O} strokeWidth={1.2} />
      <g transform="rotate(-8 124 104)">
        <rect x="104" y="84" width="40" height="44" rx="4" fill="#fff" stroke={O} strokeWidth={2.5} />
        <rect x="104" y="84" width="40" height="12" rx="3" fill="#ef4444" stroke={O} strokeWidth={2} />
        <text x="124" y="118" textAnchor="middle" fontSize="18" fontWeight="900" fill="#111">3일</text>
        <path d="M104 128 L110 122 L116 128 L122 122 L128 128 L134 122 L140 128" stroke={O} strokeWidth={1.5} fill="#fff" />
      </g>
      <path d="M40 100 L28 84 L24 92 Z" fill="#f5f5f4" stroke={O} strokeWidth={2} />
    </g>
  ),
  dragon: (el, id) => (
    <g>
      <path d="M34 86 L6 62 L22 92 L4 98 L36 104 Z" fill="#14532d" stroke={O} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M126 86 L154 62 L138 92 L156 98 L124 104 Z" fill="#14532d" stroke={O} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx="80" cy="112" rx="44" ry="34" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <ellipse cx="80" cy="118" rx="26" ry="22" fill="#fde68a" stroke={O} strokeWidth={2} />
      <path d="M58 70 C56 40 104 40 102 70 C104 82 56 82 58 70 Z" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <path d="M62 44 L58 28 L70 40 Z M98 44 L102 28 L90 40 Z" fill="#fde68a" stroke={O} strokeWidth={2} />
      <Eyes l={[70, 58]} r={[90, 58]} rad={5.5} color={el.eye} id={id} />
      <path d="M68 74 Q80 80 92 74" stroke={O} strokeWidth={2.5} fill="none" />
      <path d="M96 74 C110 70 122 76 132 70" stroke={el.glow} strokeWidth={6} fill="none" strokeLinecap="round" style={{ filter: `url(#${id}-glow)` }} />
      <g transform="translate(36 116)"><circle r="13" fill="#f9a8d4" stroke={O} strokeWidth={2.5} /><circle r="5" fill="#fde68a" stroke={O} strokeWidth={2} />{[[-8, -4], [6, -8], [8, 5], [-5, 8]].map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="1.5" fill={['#22d3ee', '#a3e635', '#f97316', '#fff'][i]} />)}</g>
    </g>
  ),
  sloth: (el, id) => (
    <g>
      <ellipse cx="80" cy="112" rx="50" ry="36" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} />
      <path d="M32 100 C16 110 14 126 24 136" stroke="#78716c" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d="M128 100 C144 110 146 126 136 136" stroke="#78716c" strokeWidth={14} fill="none" strokeLinecap="round" />
      <circle cx="80" cy="62" r="34" fill="#a8a29e" stroke={O} strokeWidth={SW} />
      <ellipse cx="80" cy="66" rx="26" ry="22" fill="#e7e5e4" />
      <path d="M58 58 C62 50 72 50 74 60 L74 66 C68 70 60 68 58 58 Z M102 58 C98 50 88 50 86 60 L86 66 C92 70 100 68 102 58 Z" fill="#57534e" />
      <path d="M62 60 Q67 63 72 60 M88 60 Q93 63 98 60" stroke={el.eye} strokeWidth={3} strokeLinecap="round" style={{ filter: `url(#${id}-glow)` }} />
      <ellipse cx="80" cy="72" rx="5" ry="3.5" fill={O} />
      <path d="M72 80 Q80 84 88 80" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <rect x="54" y="118" width="52" height="24" rx="10" fill="#fff" stroke={O} strokeWidth={2.5} />
      <text x="80" y="135" textAnchor="middle" fontSize="11" fontWeight="900" fill="#64748b">Zzz…</text>
    </g>
  ),
  pizza: (el, id) => (
    <g>
      <path d="M80 140 L24 32 C56 18 104 18 136 32 Z" fill={`url(#${id}-a)`} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M24 32 C56 18 104 18 136 32 L131 42 C102 30 58 30 29 42 Z" fill="#b45309" stroke={O} strokeWidth={2.5} />
      {[[58, 56], [100, 54], [80, 86], [66, 108], [98, 76]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill="#b91c1c" stroke={O} strokeWidth={1.5} />)}
      <path d="M44 70 C44 84 40 92 42 100 M118 66 C118 84 122 92 120 102" stroke="#fde68a" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Eyes l={[68, 48]} r={[92, 48]} rad={6} color={el.eye} id={id} />
      <path d="M70 66 Q80 74 90 66" stroke={O} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M34 60 L14 74 M126 60 L146 74" stroke="#b45309" strokeWidth={9} strokeLinecap="round" />
    </g>
  ),
};

// 속성별 바닥 효과와 떠다니는 입자 (서리: 얼음판·눈송이 / 맹독: 독웅덩이·거품 / 용암: 갈라진 용암·불씨 / 심연: 포털·검은 기운)
const Ground = ({ el }) => {
  if (el.particle === 'snow') return (
    <g>
      <ellipse cx="80" cy="150" rx="66" ry="10" fill="#e0f2fe" opacity=".55" />
      {[[30, 146], [52, 152], [110, 150], [132, 146]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l4 -10 l4 10 z`} fill="#bae6fd" stroke="#0b0f14" strokeWidth="1" />)}
    </g>
  );
  if (el.particle === 'bubble') return (
    <g>
      <ellipse cx="80" cy="150" rx="68" ry="10" fill="#65a30d" opacity=".7" />
      {[[34, 147, 4], [124, 148, 5], [96, 153, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#bef264" stroke="#0b0f14" strokeWidth="1" />)}
    </g>
  );
  if (el.particle === 'ember') return (
    <g>
      <ellipse cx="80" cy="150" rx="68" ry="10" fill="#7c2d12" />
      <path d="M22 150 L44 146 L52 153 L72 147 L88 154 L104 146 L120 152 L138 148" stroke="#fb923c" strokeWidth="2.5" fill="none" style={{ filter: 'drop-shadow(0 0 3px #fb923c)' }} />
    </g>
  );
  return (
    <g>
      <ellipse cx="80" cy="150" rx="66" ry="10" fill="#2e1065" />
      <ellipse cx="80" cy="150" rx="58" ry="7" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="6 5" style={{ filter: 'drop-shadow(0 0 4px #c084fc)' }} />
    </g>
  );
};

const PARTICLES = [[18, 40, 0], [140, 30, 0.6], [26, 96, 1.2], [148, 84, 0.3], [70, 14, 0.9], [120, 120, 1.5]];
const Particles = ({ el }) => (
  <g>
    {PARTICLES.map(([x, y, delay], i) => {
      const anim = <animateTransform attributeName="transform" type="translate" values={el.particle === 'snow' ? '0 -6; 3 10; 0 -6' : '0 6; 0 -14; 0 6'} dur={`${2.4 + (i % 3) * 0.6}s`} begin={`${delay}s`} repeatCount="indefinite" />;
      const fade = <animate attributeName="opacity" values="0;1;0" dur={`${2.4 + (i % 3) * 0.6}s`} begin={`${delay}s`} repeatCount="indefinite" />;
      if (el.particle === 'snow') return <g key={i} transform={`translate(${x} ${y})`}><g>{anim}{fade}<path d="M0 -5 V5 M-5 0 H5 M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" stroke="#e0f2fe" strokeWidth="1.5" strokeLinecap="round" /></g></g>;
      if (el.particle === 'bubble') return <g key={i} transform={`translate(${x} ${y})`}><g>{anim}{fade}<circle r="4" fill="none" stroke="#bef264" strokeWidth="1.5" /><circle cx="-1.2" cy="-1.2" r="1" fill="#f7fee7" /></g></g>;
      if (el.particle === 'ember') return <g key={i} transform={`translate(${x} ${y})`}><g>{anim}{fade}<path d="M0 -5 C3 -1 3 3 0 5 C-3 3 -3 -1 0 -5 Z" fill={i % 2 ? '#fde047' : '#fb923c'} /></g></g>;
      return <g key={i} transform={`translate(${x} ${y})`}><g>{anim}{fade}<path d="M-4 4 C-6 -2 2 -2 0 -6 C6 -2 4 4 -4 4 Z" fill="#c084fc" opacity=".8" /></g></g>;
    })}
  </g>
);

// ── 부활 단계별 분노 연출 ─────────────────────────────────────────
// 보스는 쓰러질 때마다 더 강해져 부활한다. 단계가 오를수록 더 난폭해 보이게:
// 2단계 분노(붉은 눈·김·몸의 금) → 3단계 격노(뿔·불꽃 고리·몸이 붉고 커짐)
// → 4단계 광폭(바닥 균열·붉은 불씨·몸 떨림) → 5단계 이상 폭주(검붉은 오라·번개·불꽃 왕관)
export const RAGE_NAMES = ['', '분노', '격노', '광폭', '폭주'];
export const rageOf = (stage = 1) => Math.max(0, Math.min(4, (Number(stage) || 1) - 1));
export const rageName = (stage) => RAGE_NAMES[rageOf(stage)];
const RAGE_RED = '#ff2d2d';

// 몸 위의 금(균열): 몸 모양으로 잘라서 보스 종류와 상관없이 몸에만 보인다
const CRACKS = [
  'M46 70 L56 78 L52 88 L62 96', 'M112 64 L104 74 L110 84 L100 94', 'M70 108 L78 116 L74 126',
  'M92 40 L86 50 L94 56', 'M36 100 L46 104 L42 114', 'M122 104 L114 110 L120 120', 'M60 46 L66 54 L60 62',
];
// 뿔: 끝이 그림 위쪽(약 y 14)에 머물러 몸이 커져도 잘리지 않게
const Horns = ({ rage }) => {
  const w = rage >= 4 ? 1.3 : rage >= 3 ? 1.15 : 1;
  return (
    <g>
      {[[54, -1], [106, 1]].map(([x, dir]) => (
        <path key={x} d={`M${x - 8 * dir} 44 C${x - 10 * dir} 32 ${x - 16 * dir * w} 24 ${x - 22 * dir * w} 14 C${x - 6 * dir} 20 ${x + 4 * dir} 28 ${x + 8 * dir} 44 Z`}
          fill={rage >= 4 ? '#1c0606' : '#2a0b0b'} stroke={O} strokeWidth={2.5} strokeLinejoin="round" />
      ))}
      {[[54, -1], [106, 1]].map(([x, dir]) => <path key={`h${x}`} d={`M${x - 4 * dir} 38 C${x - 8 * dir} 30 ${x - 14 * dir * w} 24 ${x - 19 * dir * w} 17`} stroke={RAGE_RED} strokeWidth={1.5} fill="none" opacity=".75" />)}
    </g>
  );
};
const FlameRing = ({ rage, color }) => (
  <g opacity={rage >= 4 ? 0.95 : 0.75}>
    {Array.from({ length: 14 }).map((_, i) => {
      const a = (i / 14) * Math.PI * 2;
      const x = 80 + Math.cos(a) * 70, y = 88 + Math.sin(a) * 62;
      const h = 10 + (i % 3) * 4 + rage * 2;
      return (
        <path key={i} d={`M${x - 5} ${y} C${x - 6} ${y - h * 0.5} ${x} ${y - h * 0.6} ${x} ${y - h} C${x + 1} ${y - h * 0.6} ${x + 6} ${y - h * 0.5} ${x + 5} ${y} Z`} fill={i % 2 ? color : RAGE_RED} opacity=".8">
          <animate attributeName="opacity" values=".35;.9;.35" dur={`${0.8 + (i % 4) * 0.2}s`} repeatCount="indefinite" />
        </path>
      );
    })}
  </g>
);
const Steam = () => (
  <g>
    {[[52, 26, 0], [108, 24, 0.7], [80, 16, 1.3]].map(([x, y, d], i) => (
      <circle key={i} cx={x} cy={y} r="5" fill="#fff" opacity="0">
        <animate attributeName="cy" values={`${y};${y - 18}`} dur="1.6s" begin={`${d}s`} repeatCount="indefinite" />
        <animate attributeName="r" values="3;8" dur="1.6s" begin={`${d}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values=".7;0" dur="1.6s" begin={`${d}s`} repeatCount="indefinite" />
      </circle>
    ))}
  </g>
);
const GroundCracks = () => (
  <g style={{ filter: `drop-shadow(0 0 3px ${RAGE_RED})` }}>
    <path d="M14 150 L32 146 L40 154 L58 148 M102 152 L118 146 L128 154 L148 149 M70 156 L80 148 L90 156" stroke={RAGE_RED} strokeWidth="2.5" fill="none" strokeLinecap="round">
      <animate attributeName="opacity" values=".5;1;.5" dur="1.2s" repeatCount="indefinite" />
    </path>
  </g>
);
const RageEmbers = () => (
  <g>
    {[[24, 120, 0], [136, 110, 0.4], [44, 70, 0.9], [118, 60, 1.3], [80, 130, 0.6], [150, 140, 1.1], [10, 90, 1.6]].map(([x, y, d], i) => (
      <rect key={i} x={x} y={y} width="3" height="3" fill={i % 2 ? '#fde047' : RAGE_RED} transform={`rotate(45 ${x} ${y})`} opacity="0">
        <animate attributeName="y" values={`${y};${y - 40}`} dur="2s" begin={`${d}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${d}s`} repeatCount="indefinite" />
      </rect>
    ))}
  </g>
);
const Lightning = () => (
  <g style={{ filter: 'drop-shadow(0 0 4px #fca5a5)' }}>
    {[['M20 6 L30 30 L22 32 L34 60', 0], ['M142 10 L130 34 L139 36 L126 62', 0.55]].map(([d, b], i) => (
      <path key={i} d={d} stroke="#fff1f2" strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0;1;0;0" keyTimes="0;.6;.65;.7;.75;.8;1" dur="1.8s" begin={`${b}s`} repeatCount="indefinite" />
      </path>
    ))}
  </g>
);
const FlameCrown = () => (
  <g transform="translate(80 7)">
    {[-16, -8, 0, 8, 16].map((dx, i) => (
      <path key={i} d={`M${dx - 4} 12 C${dx - 5} 6 ${dx} 4 ${dx} ${i === 2 ? -8 : -2} C${dx + 1} 4 ${dx + 5} 6 ${dx + 4} 12 Z`} fill={i === 2 ? '#fde047' : RAGE_RED} stroke={O} strokeWidth="1.2">
        <animate attributeName="opacity" values=".6;1;.6" dur={`${0.6 + i * 0.1}s`} repeatCount="indefinite" />
      </path>
    ))}
  </g>
);

// 종류마다 몸통 기본색 (속성 색을 살짝 섞는다)
const BASE = {
  sofa: ['#8b5e3c', '#5c3a22'], chicken: ['#d98a2b', '#8a4a12'], phone: ['#1e293b', '#0f172a'], alarm: ['#f59e0b', '#b45309'],
  cola: ['#4a2511', '#1c0d06'], ramen: ['#dc2626', '#7f1d1d'], bed: ['#60a5fa', '#1d4ed8'], goblin: ['#84cc16', '#4d7c0f'],
  ogre: ['#a3a3a3', '#525252'], demon: ['#ef4444', '#991b1b'], dragon: ['#22c55e', '#14532d'], sloth: ['#a8a29e', '#57534e'], pizza: ['#fde047', '#f59e0b'],
};

// 보스 일러스트 (Gemini로 만든 그림, 배경을 지운 webp): public/bosses/<종류>-<속성>-<1~4단계>.webp
// 부활 단계 1·2·3은 같은 번호 그림, 4단계 이상은 4번(최종 형태) 그림에 효과가 더 강해진다
const BOSS_IMG_KINDS = new Set(['sofa', 'chicken', 'phone', 'alarm', 'cola', 'ramen', 'bed', 'goblin', 'ogre', 'demon', 'dragon', 'sloth', 'pizza']);
// 아직 그림이 없는 조합 (이 경우엔 기존 벡터 그림으로 보여준다)
const BOSS_IMG_MISSING = new Set(['demon-toxic']);
export const bossImage = (kind, elementKey, stage = 1) => (BOSS_IMG_KINDS.has(kind) && elementKey && !BOSS_IMG_MISSING.has(`${kind}-${elementKey}`) ? `/bosses/${kind}-${elementKey}-${Math.max(1, Math.min(4, Number(stage) || 1))}.webp` : null);

export const BossArt = ({ kind = 'sofa', element, size = 150, defeated = false, stage = 1, className = '' }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [imgFailed, setImgFailed] = useState(null);
  const img = bossImage(kind, element?.key, stage);
  const useImg = img && imgFailed !== img;
  const base = element || { glow: '#34d399', eye: '#ecfdf5' };
  const rage = defeated ? 0 : rageOf(stage);
  // 분노하면 눈이 붉게 타오르고, 폭주하면 오라가 검붉게 변한다
  const el = rage ? { ...base, eye: rage >= 3 ? '#ffe4e6' : '#ff6b6b' } : base;
  const auraColor = rage >= 4 ? '#7f1d1d' : rage >= 2 ? RAGE_RED : base.glow;
  const [c1, c2] = BASE[kind] || BASE.sofa;
  const draw = ART[kind] || ART.sofa;
  const grow = 1 + rage * 0.025; // 너무 커지면 뿔이 그림 밖으로 잘린다
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} className={className} style={defeated ? { filter: 'grayscale(1) brightness(.75)' } : undefined} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <radialGradient id={`${id}-aura`} cx="50%" cy="55%" r="50%">
          <stop offset="0" stopColor={auraColor} stopOpacity={0.45 + rage * 0.1} />
          <stop offset={rage >= 4 ? '.7' : '1'} stopColor={rage >= 4 ? '#000' : auraColor} stopOpacity={rage >= 4 ? 0.35 : 0} />
          {rage >= 4 && <stop offset="1" stopColor="#000" stopOpacity="0" />}
        </radialGradient>
        {/* 분노 단계만큼 몸을 붉고 어둡게 */}
        <filter id={`${id}-rage`} x="0" y="0" width="100%" height="100%">
          <feFlood floodColor="#b91c1c" floodOpacity={Math.min(0.6, rage * 0.16)} result="r" />
          <feComposite in="r" in2="SourceAlpha" operator="in" result="rt" />
          <feBlend in="rt" in2="SourceGraphic" mode="multiply" />
        </filter>
        {/* 몸 모양 그대로의 흰 마스크 (금이 몸 위에만 보이게) */}
        {rage > 0 && !useImg && (
          <mask id={`${id}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160">
            <g filter={`url(#${id}-white)`}>{draw(el, id)}</g>
          </mask>
        )}
        <filter id={`${id}-white`}><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" /></filter>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        {/* 속성 색을 몸 전체에 은은하게 입힌다 */}
        <filter id={`${id}-tint`} x="0" y="0" width="100%" height="100%">
          <feFlood floodColor={el.glow} floodOpacity=".55" result="c" />
          <feComposite in="c" in2="SourceAlpha" operator="in" result="ct" />
          <feBlend in="ct" in2="SourceGraphic" mode="soft-light" />
        </filter>
      </defs>
      <circle cx="80" cy="88" r={76 + rage * 2} fill={`url(#${id}-aura)`}>
        {rage >= 2 && <animate attributeName="r" values={`${74 + rage * 2};${80 + rage * 2};${74 + rage * 2}`} dur={`${1.6 - rage * 0.2}s`} repeatCount="indefinite" />}
      </circle>
      {rage >= 2 && <FlameRing rage={rage} color={base.glow} />}
      <Ground el={el} />
      {rage >= 3 && <GroundCracks />}
      {useImg ? (
        <g transform={defeated ? 'rotate(-8 80 120)' : undefined}>
          <g>
            {rage >= 3 && <animateTransform attributeName="transform" type="translate" values="0 0; 1.2 -0.6; -1 0.8; 0.8 0.4; 0 0" dur={rage >= 4 ? '.35s' : '.6s'} repeatCount="indefinite" />}
            <image href={img} x="0" y="-4" width="160" height="160" preserveAspectRatio="xMidYMax meet" onError={() => setImgFailed(img)} />
          </g>
        </g>
      ) : (
      <g transform={defeated ? 'rotate(-8 80 120)' : `translate(80 146) scale(${grow}) translate(-80 -146)`}>
        <g>
          {rage >= 3 && <animateTransform attributeName="transform" type="translate" values="0 0; 1.2 -0.6; -1 0.8; 0.8 0.4; 0 0" dur={rage >= 4 ? '.35s' : '.6s'} repeatCount="indefinite" />}
          <g filter={rage ? `url(#${id}-rage)` : undefined}>
            <g filter={el.particle ? `url(#${id}-tint)` : undefined}>{draw(el, id)}</g>
          </g>
          {/* 뿔은 몸 앞에 그려서 어떤 보스든 잘 보이게 */}
          {rage >= 2 && <Horns rage={rage} />}
          {rage > 0 && (
            <g mask={`url(#${id}-body)`} style={{ filter: `drop-shadow(0 0 2px ${RAGE_RED})` }}>
              {CRACKS.slice(0, 2 + rage).map((d, i) => (
                <path key={i} d={d} stroke={rage >= 3 ? '#fde047' : RAGE_RED} strokeWidth={1.8 + rage * 0.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="opacity" values=".55;1;.55" dur={`${1.4 - rage * 0.2}s`} begin={`${i * 0.15}s`} repeatCount="indefinite" />
                </path>
              ))}
            </g>
          )}
          {rage >= 1 && <Steam />}
        </g>
      </g>
      )}
      {rage >= 4 && !useImg && <FlameCrown />}
      {!defeated && el.particle && <Particles el={el} />}
      {rage >= 3 && <RageEmbers />}
      {rage >= 4 && <Lightning />}
      {defeated && <text x="80" y="92" textAnchor="middle" fontSize="40" fontWeight="900" fill="#fff" stroke={O} strokeWidth="3" paintOrder="stroke" transform="rotate(-12 80 92)">KO!</text>}
    </svg>
  );
};
