import React from 'react';
import { formatDate } from '../../lib/dates.js';
import { useApp } from '../../appContext.js';

// 상단 헤더 안의 이번 주 날짜 줄 (운동 탭에서만)
export function WeekStrip() {
  const {
    currentDate,
    safeWorkouts,
    setCurrentDate,
    weekDays,
  } = useApp();
  return (
    <div className="relative flex justify-between mt-5 -mx-1">
      {weekDays.map((d, index) => {
        const dateStr = formatDate(d);
        const isSelected = dateStr === currentDate;
        const isToday = dateStr === formatDate(new Date());
        const hasWorkout = Array.isArray(safeWorkouts[dateStr]) && safeWorkouts[dateStr].length > 0;
        return (
          <button key={`wd-${index}`} onClick={() => setCurrentDate(dateStr)} className="flex flex-col items-center gap-1.5 w-11 active:scale-90 transition-transform">
            <span className={`text-[11px] font-bold ${d.getDay()===0 ? 'text-rose-400' : d.getDay()===6 ? 'text-sky-400' : 'text-white/40'}`}>{['일','월','화','수','목','금','토'][d.getDay()]}</span>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[17px] font-black transition-all ${isSelected ? 'bg-emerald-400 text-neutral-950 shadow-[0_0_16px_rgba(52,211,153,0.7)]' : isToday ? 'text-emerald-300 ring-[1.5px] ring-emerald-400/70' : 'text-white/85 hover:bg-white/10'}`}>
              {d.getDate()}
            </div>
            <div className={`w-1 h-1 rounded-full -mt-1 ${hasWorkout ? 'bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.9)]' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </div>
  );
}
