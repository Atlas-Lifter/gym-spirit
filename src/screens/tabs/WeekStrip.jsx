import React from 'react';
import { formatDate } from '../../lib/dates.js';
import { useApp } from '../../appContext.js';

// 상단 헤더 안의 이번 주 날짜 줄 (운동 탭에서만)
// 운동한 날은 초록 링이 빛나고, 고른 날은 꽉 찬 초록 원, 오늘은 초록 숫자
export function WeekStrip() {
  const {
    cardioMinOn,
    currentDate,
    safeWorkouts,
    setCurrentDate,
    weekDays,
  } = useApp();
  const today = formatDate(new Date());
  return (
    <div className="relative grid grid-cols-7 mt-4 -mx-1 text-center">
      {weekDays.map((d, index) => {
        const dateStr = formatDate(d);
        const isSelected = dateStr === currentDate;
        const isToday = dateStr === today;
        const hasWorkout = Array.isArray(safeWorkouts[dateStr]) && safeWorkouts[dateStr].length > 0;
        const hasCardio = cardioMinOn(dateStr) > 0;
        return (
          <button key={`wd-${index}`} onClick={() => setCurrentDate(dateStr)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <span className={`text-[10px] font-bold ${d.getDay() === 0 ? 'text-rose-300' : d.getDay() === 6 ? 'text-sky-300' : 'text-white/45'}`}>{['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}</span>
            <span className="relative w-10 h-10 flex items-center justify-center">
              <svg className="absolute inset-0" viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
                {hasWorkout && <circle cx="20" cy="20" r="17" fill="none" stroke="#34d399" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 3px #34d399)' }} />}
              </svg>
              <span className={`relative flex items-center justify-center text-[14px] font-black transition-all ${isSelected ? 'w-8 h-8 rounded-full bg-emerald-400 text-neutral-950 shadow-[0_0_14px_rgba(52,211,153,.75)]' : isToday ? 'text-emerald-300' : 'text-white/85'}`}>
                {d.getDate()}
              </span>
              {hasCardio && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#fb923c]" title="유산소" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
