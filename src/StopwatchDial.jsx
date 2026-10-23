import React, { useId } from 'react';

// 휴식 타이머의 스톱워치(아날로그) 보기.
// 바깥 링은 남은 휴식 비율, 바늘은 1초마다 한 칸씩 움직이는 초침. 휴식을 넘기면 링이 빨강·노랑으로 깜빡이고 초침도 빨갛게 돈다.
export const StopwatchDial = ({ timeLeft = 0, maxTime = 90, overtimeSec = null, className = 'w-[120px] h-[124px]' }) => {
  const uid = useId().replace(/:/g, '');
  const over = overtimeSec !== null;
  const cx = 60, cy = 66, r = 46;
  const C = 2 * Math.PI * r;
  const frac = over ? 1 : maxTime > 0 ? Math.max(0, Math.min(1, timeLeft / maxTime)) : 0;
  const elapsed = over ? overtimeSec : Math.max(0, maxTime - timeLeft);
  const angle = elapsed * 6; // 360°에서 0°로 되감기지 않게 누적 각도
  const shown = over ? overtimeSec : timeLeft;
  const label = `${over ? '+' : ''}${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, '0')}`;

  return (
    <svg viewBox="0 0 120 124" className={className} aria-label={`휴식 ${label}`}>
      <style>{`
        @keyframes sw-over-${uid} { 0%,100% { stroke: #fb7185; } 50% { stroke: #fde047; } }
        .sw-over-${uid} { animation: sw-over-${uid} .7s ease-in-out infinite; }
      `}</style>
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
        <radialGradient id={`face-${uid}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#0b1410" />
          <stop offset="100%" stopColor="#020403" />
        </radialGradient>
      </defs>
      {/* 꼭지(용두)와 옆 버튼 */}
      <rect x="54" y="4" width="12" height="7" rx="2" fill="#0b1410" stroke="#34d399" strokeOpacity=".6" />
      <rect x="57" y="10" width="6" height="5" fill="#0b1410" stroke="#34d399" strokeOpacity=".6" />
      <rect x="95" y="20" width="8" height="5" rx="1.5" fill="#0b1410" stroke="#34d399" strokeOpacity=".5" transform="rotate(45 99 22.5)" />
      {/* 시계판 */}
      <circle cx={cx} cy={cy} r={r + 8} fill={`url(#face-${uid})`} stroke="#34d399" strokeOpacity=".35" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10241b" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={over ? '#fb7185' : `url(#g-${uid})`} strokeWidth="6" strokeLinecap="round"
        className={over ? `sw-over-${uid}` : ''}
        strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 4px ${over ? 'rgba(251,113,133,.9)' : 'rgba(250,204,21,.7)'})` }} />
      {/* 눈금: 60칸, 5초마다 굵게 */}
      {Array.from({ length: 60 }).map((_, i) => {
        const a = (i * 6 - 90) * Math.PI / 180;
        const major = i % 5 === 0;
        const r1 = r - (major ? 12 : 9), r2 = r - 6;
        return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
          stroke={major ? '#a7f3d0' : '#34d399'} strokeOpacity={major ? 0.85 : 0.3} strokeWidth={major ? 1.6 : 0.9} strokeLinecap="round" />;
      })}
      {[0, 15, 30, 45].map(n => {
        const a = (n * 6 - 90) * Math.PI / 180;
        return <text key={n} x={cx + Math.cos(a) * (r - 19)} y={cy + Math.sin(a) * (r - 19) + 3} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#6ee7b7" fillOpacity=".75">{n || 60}</text>;
      })}
      {/* 초침 */}
      <g transform={`rotate(${angle} ${cx} ${cy})`} style={{ transition: 'transform 250ms cubic-bezier(.3,1.6,.6,1)' }}>
        <line x1={cx} y1={cy + 9} x2={cx} y2={cy - r + 10} stroke={over ? '#fb7185' : '#fde047'} strokeWidth="2" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${over ? 'rgba(251,113,133,.9)' : 'rgba(250,204,21,.9)'})` }} />
      </g>
      {/* 가운데 숫자 (초침이 지나가도 읽히도록 바탕을 깐다) */}
      <rect x={cx - 21} y={cy + 11} width="42" height="15" rx="7.5" fill="#020403" fillOpacity=".9" stroke={over ? '#fb7185' : '#fde047'} strokeOpacity=".35" />
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="ui-monospace, Menlo, monospace"
        fill={over ? '#fb7185' : '#fde047'} className={over ? `sw-over-${uid}` : ''} style={{ filter: 'drop-shadow(0 0 3px rgba(250,204,21,.6))' }}>{label}</text>
      <circle cx={cx} cy={cy} r="3.6" fill={over ? '#fb7185' : '#fde047'} stroke="#020403" strokeWidth="1.5" />
    </svg>
  );
};
