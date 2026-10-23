import React, { useId } from 'react';

// 휴식 타이머의 살아 있는 불꽃.
// 겉불꽃·속불꽃·심지 세 겹이 서로 다른 박자로 일렁이고, 노이즈 왜곡(feTurbulence)이 불꽃 끝을 계속 흔든다.
// mode: 'burning'(타이머 진행) · 'roar'(마지막 몇 초, 더 크고 빠르게) · 'ember'(멈춤, 작게 남은 불씨)
export const FireFlame = ({ mode = 'burning', className = 'w-10 h-10' }) => {
  const uid = useId().replace(/:/g, '');
  const id = (k) => `${k}-${uid}`;
  const speed = mode === 'roar' ? 0.6 : mode === 'ember' ? 1.8 : 1;
  const scale = mode === 'roar' ? 1.12 : mode === 'ember' ? 0.55 : 1;
  const d = (s) => `${(s * speed).toFixed(2)}s`;

  return (
    <svg viewBox="0 0 64 80" className={className} style={{ overflow: 'visible' }} aria-hidden="true">
      <style>{`
        @keyframes ff-flick-${uid} { 0%,100% { transform: scale(1,1) skewX(0deg); } 20% { transform: scale(.96,1.05) skewX(2deg); } 45% { transform: scale(1.03,.95) skewX(-1.5deg); } 70% { transform: scale(.98,1.04) skewX(1deg); } }
        @keyframes ff-glow-${uid} { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .9; transform: scale(1.12); } }
        @keyframes ff-ember-${uid} { 0% { transform: translate(0,0) scale(1); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(var(--dx), -46px) scale(.3); opacity: 0; } }
        .ff-o-${uid} { transform-origin: 32px 76px; animation: ff-flick-${uid} ${d(1.1)} ease-in-out infinite; }
        .ff-m-${uid} { transform-origin: 32px 76px; animation: ff-flick-${uid} ${d(0.8)} ease-in-out infinite reverse; }
        .ff-i-${uid} { transform-origin: 32px 76px; animation: ff-flick-${uid} ${d(0.6)} ease-in-out infinite; }
        .ff-g-${uid} { transform-origin: 32px 66px; animation: ff-glow-${uid} ${d(1.4)} ease-in-out infinite; }
        .ff-e-${uid} { animation: ff-ember-${uid} ${d(1.6)} ease-out infinite; }
      `}</style>
      <defs>
        <radialGradient id={id('outer')} cx="50%" cy="88%" r="78%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="28%" stopColor="#ffd23f" />
          <stop offset="58%" stopColor="#ff8a00" />
          <stop offset="85%" stopColor="#ff3d00" />
          <stop offset="100%" stopColor="#ff3d00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('mid')} cx="50%" cy="90%" r="70%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="45%" stopColor="#ffe066" />
          <stop offset="100%" stopColor="#ffa200" />
        </radialGradient>
        <radialGradient id={id('core')} cx="50%" cy="85%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#fff6c8" />
          <stop offset="100%" stopColor="#ffe27a" />
        </radialGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb000" stopOpacity=".75" />
          <stop offset="60%" stopColor="#ff6a00" stopOpacity=".25" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
        {/* 불꽃 끝이 계속 흔들리도록 노이즈로 왜곡 */}
        <filter id={id('warp')} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045 0.11" numOctaves="2" seed="3" result="n">
            <animate attributeName="baseFrequency" dur={d(2.2)} repeatCount="indefinite" values="0.045 0.11;0.05 0.16;0.04 0.12;0.045 0.11" />
            <animate attributeName="seed" dur={d(1.2)} repeatCount="indefinite" values="3;7;11;5;3" calcMode="discrete" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale={mode === 'ember' ? 3 : 7} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" /></filter>
      </defs>

      <g transform={`translate(32 76) scale(${scale}) translate(-32 -76)`} style={{ transition: 'transform 400ms ease' }}>
        {/* 바닥 열기 */}
        <ellipse className={`ff-g-${uid}`} cx="32" cy="64" rx="26" ry="22" fill={`url(#${id('halo')})`} filter={`url(#${id('soft')})`} />
        <g filter={`url(#${id('warp')})`}>
          <path className={`ff-o-${uid}`} fill={`url(#${id('outer')})`}
            d="M32 77 C15 77 8 63 13 49 C17 39 25 33 23 15 C33 23 37 31 39 39 C41 33 43 28 43 21 C53 33 58 48 54 61 C51 71 44 77 32 77 Z" />
          <path className={`ff-m-${uid}`} fill={`url(#${id('mid')})`}
            d="M32 77 C21 77 17 67 20 58 C23 50 29 46 28 34 C35 41 37 47 38 52 C40 48 41 45 41 41 C47 49 49 59 46 67 C44 73 39 77 32 77 Z" />
          <path className={`ff-i-${uid}`} fill={`url(#${id('core')})`}
            d="M32 77 C26 77 23 72 25 66 C27 61 31 58 31 51 C35 56 37 60 37 64 C39 61 39 59 39 57 C42 62 42 69 40 73 C38 76 35 77 32 77 Z" />
        </g>
        {/* 튀어 오르는 불티 */}
        {mode !== 'ember' && [[30, -6, 0], [36, 7, 0.55], [27, 3, 1.05]].map(([x, dx, delay], i) => (
          <circle key={i} className={`ff-e-${uid}`} cx={x} cy="40" r="1.6" fill="#ffd23f"
            style={{ '--dx': `${dx}px`, animationDelay: d(delay), filter: 'drop-shadow(0 0 2px #ff8a00)' }} />
        ))}
      </g>
    </svg>
  );
};
