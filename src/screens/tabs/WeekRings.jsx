import React, { useMemo } from 'react';
import { formatDate } from '../../lib/dates.js';
import { useApp } from '../../appContext.js';

// 홈 상단의 이번 주 활동 링 (Apple 피트니스·WHOOP 느낌)
// · 바깥 초록 링: 이번 주 운동한 날 ÷ 주간 목표(기본 4일, 링을 누르면 3~7일로 바뀜)
// · 안쪽 파란 링: 이번 주 볼륨 ÷ 지난주 볼륨
// · 연속 기록: 운동한 주가 끊기지 않고 이어진 주 수 (이번 주에 아직 안 했으면 지난주부터 센다)

const Ring = ({ r, stroke, pct, color, glow, track = 'rgba(255,255,255,.1)' }) => {
  const c = 2 * Math.PI * r;
  return (
    <>
      <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, pct)))} transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)', filter: pct > 0 ? `drop-shadow(0 0 5px ${glow})` : 'none' }} />
    </>
  );
};

const mondayOf = (d) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; };

export function WeekRings() {
  const { getAnalysisWeekInfo, getWeeklyVolumeData, safeWorkouts, currentUser, setCurrentUser, showToast } = useApp();
  const goal = Math.min(7, Math.max(3, Number(currentUser?.weeklyGoal) || 4));
  const { monday } = getAnalysisWeekInfo(new Date());
  const { total, prevTotal } = getWeeklyVolumeData(monday);

  const { days, streak } = useMemo(() => {
    const weeks = new Set();
    const mon = mondayOf(new Date());
    let thisWeek = 0;
    Object.entries(safeWorkouts || {}).forEach(([k, v]) => {
      if (!Array.isArray(v) || !v.length) return;
      const d = new Date(`${k}T00:00:00`);
      if (isNaN(d)) return;
      weeks.add(formatDate(mondayOf(d)));
      if (d >= mon && d < new Date(mon.getTime() + 7 * 86400000)) thisWeek += 1;
    });
    let n = 0;
    const cur = new Date(mon);
    if (!weeks.has(formatDate(cur))) cur.setDate(cur.getDate() - 7);
    while (weeks.has(formatDate(cur))) { n += 1; cur.setDate(cur.getDate() - 7); }
    return { days: thisWeek, streak: n };
  }, [safeWorkouts]);

  const volPct = prevTotal > 0 ? total / prevTotal : total > 0 ? 1 : 0;
  const left = Math.max(0, goal - days);
  const cycleGoal = () => {
    const next = goal >= 7 ? 3 : goal + 1;
    setCurrentUser(prev => ({ ...prev, weeklyGoal: next }));
    showToast(`주간 목표를 ${next}일로 바꿨어요`);
  };

  return (
    <div className="relative flex items-center gap-4 mt-4">
      <button onClick={cycleGoal} aria-label="주간 목표 바꾸기" className="relative flex-shrink-0 active:scale-95 transition-transform">
        <svg width="96" height="96" viewBox="0 0 100 100">
          <defs><linearGradient id="ringGoal" x1="0" x2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#a3e635" /></linearGradient></defs>
          <Ring r={42} stroke={10} pct={days / goal} color="url(#ringGoal)" glow="rgba(52,211,153,.8)" />
          <Ring r={29} stroke={8} pct={volPct} color="#38bdf8" glow="rgba(56,189,248,.8)" track="rgba(255,255,255,.08)" />
          <text x="50" y="50" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fff">{days}/{goal}</text>
          <text x="50" y="63" textAnchor="middle" fontSize="8" fontWeight="800" fill="rgba(255,255,255,.55)">이번 주</text>
        </svg>
      </button>
      <div className="flex-1 min-w-0 space-y-2 text-white">
        <div>
          <div className="text-[10px] font-bold text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 운동한 날</div>
          <div className="text-lg font-black leading-none mt-0.5">{days}<span className="text-xs font-bold text-white/50"> / {goal}일 목표</span></div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> 주간 볼륨{prevTotal > 0 && <span className="text-sky-300 font-black"> · 지난주 대비 {Math.round(volPct * 100)}%</span>}</div>
          <div className="text-lg font-black leading-none mt-0.5">{Math.round(total).toLocaleString()}<span className="text-xs font-bold text-white/50"> kg</span></div>
        </div>
        {streak >= 2
          ? <div className="inline-flex items-center gap-1 text-[10px] font-black text-orange-300 bg-orange-400/15 px-2 py-0.5 rounded-full">🔥 {streak}주 연속 운동</div>
          : <div className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-400/15 px-2 py-0.5 rounded-full">{left ? `목표까지 ${left}일 남았어요` : '이번 주 목표 달성! 🎉'}</div>}
      </div>
    </div>
  );
}
