import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDate, getMonthDays } from '../lib/dates.js';
import { HERO_BG } from '../theme.js';
import { useApp } from '../appContext.js';

// 달력 팝업: 날짜를 고르면 그날로 이동
// 위쪽 'YYYY년 M월'을 누르면 연·월을 한 번에 고르는 화면으로 바뀐다 (월마다 운동한 날 수 표시)
export function CalendarPopup() {
  const {
    calendarMonth,
    calendarYear,
    currentDate,
    safeWorkouts,
    setCalendarMonth,
    setCalendarYear,
    setCurrentDate,
    setIsFullCalendarOpen,
  } = useApp();
  const [picker, setPicker] = useState(false);
  const [pickYear, setPickYear] = useState(calendarYear);
  useEffect(() => { if (picker) setPickYear(calendarYear); }, [picker]);

  const now = new Date();
  const todayStr = formatDate(now);
  const workedDays = (y, m) => {
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
    return Object.keys(safeWorkouts).filter(k => k.startsWith(prefix) && Array.isArray(safeWorkouts[k]) && safeWorkouts[k].length > 0).length;
  };
  const monthWorkoutDays = workedDays(calendarYear, calendarMonth);
  const yearCounts = useMemo(() => Array.from({ length: 12 }, (_, m) => workedDays(pickYear, m)), [pickYear, safeWorkouts]);
  const yearTotal = yearCounts.reduce((a, b) => a + b, 0);

  const moveMonth = (delta) => {
    const m = calendarMonth + delta;
    if (m < 0) { setCalendarMonth(11); setCalendarYear(prev => prev - 1); }
    else if (m > 11) { setCalendarMonth(0); setCalendarYear(prev => prev + 1); }
    else setCalendarMonth(m);
  };
  const pickMonth = (m) => { setCalendarYear(pickYear); setCalendarMonth(m); setPicker(false); };
  const close = () => setIsFullCalendarOpen(false);

  return (
    <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-[2px] animate-fade-in" onClick={close}>
      <div className="bg-white rounded-[28px] max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-neutral-900 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative px-4 pt-4 pb-4 overflow-hidden" style={{ background: HERO_BG }}>
          <div className="absolute bottom-0 left-6 right-6 h-px shadow-[0_0_10px_rgba(52,211,153,0.8)]" style={{ background: 'linear-gradient(90deg, transparent, #34d399 30%, #60a5fa 70%, transparent)' }} />
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-1">
              <button onClick={() => (picker ? setPickYear(y => y - 1) : moveMonth(-1))} aria-label={picker ? '이전 해' : '이전 달'} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-300 active:scale-90 transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setPicker(p => !p)} aria-label="연도·월 고르기" className={`flex items-center gap-1 px-2.5 h-9 rounded-xl text-lg font-black tracking-tight text-white transition-colors ${picker ? 'bg-white/15' : 'hover:bg-white/10'}`}>
                {picker ? `${pickYear}년` : `${calendarYear}년 ${calendarMonth + 1}월`}
                <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform ${picker ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => (picker ? setPickYear(y => y + 1) : moveMonth(1))} aria-label={picker ? '다음 해' : '다음 달'} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-300 active:scale-90 transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setCalendarYear(now.getFullYear()); setCalendarMonth(now.getMonth()); setCurrentDate(todayStr); close(); }} className="text-xs font-black text-neutral-950 bg-emerald-400 px-3 h-8 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)] hover:bg-emerald-300 transition-colors">오늘</button>
              <button onClick={close} aria-label="닫기" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all"><X className="w-4 h-4 text-white/70" /></button>
            </div>
          </div>
          <div className="relative text-xs font-bold text-white/50 px-2 mt-2">
            {picker
              ? <>{pickYear}년 <span className="text-sky-300 font-black">{yearTotal}일</span> 운동했어요 · 월을 고르세요</>
              : <>이번 달 <span className="text-sky-300 font-black">{monthWorkoutDays}일</span> 운동했어요 · 위 연·월을 누르면 빠르게 이동해요</>}
          </div>
        </div>

        {picker ? (
          <div className="p-4 animate-fade-in">
            <div className="grid grid-cols-3 gap-2">
              {yearCounts.map((cnt, m) => {
                const selected = pickYear === calendarYear && m === calendarMonth;
                const isNow = pickYear === now.getFullYear() && m === now.getMonth();
                const maxCnt = Math.max(1, ...yearCounts);
                return (
                  <button key={m} onClick={() => pickMonth(m)} className={`relative rounded-2xl py-3.5 flex flex-col items-center gap-1 transition-all active:scale-95 ${selected ? 'bg-[#070b0f] text-white shadow-[0_0_0_2px_rgba(52,211,153,0.9),0_0_14px_rgba(52,211,153,0.4)]' : isNow ? 'bg-emerald-50 text-emerald-700 ring-[1.5px] ring-emerald-300' : 'bg-neutral-50 text-neutral-800 hover:bg-emerald-50'}`}>
                    <span className="text-base font-black">{m + 1}월</span>
                    <span className="w-10 h-1 rounded-full bg-black/5 overflow-hidden"><span className="block h-full rounded-full bg-blue-500" style={{ width: `${(cnt / maxCnt) * 100}%` }} /></span>
                    <span className={`text-[10px] font-bold ${selected ? 'text-white/60' : 'text-neutral-400'}`}>{cnt ? `${cnt}일 운동` : '기록 없음'}</span>
                  </button>
                );
              })}
            </div>
            {pickYear !== now.getFullYear() && (
              <button onClick={() => setPickYear(now.getFullYear())} className="mt-3 w-full py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-black">올해({now.getFullYear()}년)로</button>
            )}
          </div>
        ) : (
          <div className="p-4 pt-3">
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <div key={`dw-${d}`} className={`text-[11px] font-bold pb-2 ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-neutral-400'}`}>{d}</div>)}
              {getMonthDays(calendarYear, calendarMonth).map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />;
                const dateStr = formatDate(d);
                const isSelected = dateStr === currentDate;
                const isToday = dateStr === todayStr;
                const hasWorkout = Array.isArray(safeWorkouts[dateStr]) && safeWorkouts[dateStr].length > 0;
                return (
                  <button key={`day-${i}`} onClick={() => { setCurrentDate(dateStr); close(); }} className="flex flex-col items-center gap-0.5 py-0.5 active:scale-90 transition-transform">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold transition-colors ${isSelected ? 'bg-[#070b0f] text-emerald-300 font-black shadow-[0_0_0_2px_rgba(52,211,153,0.9),0_0_14px_rgba(52,211,153,0.5)]' : isToday ? 'text-emerald-600 font-black ring-[1.5px] ring-emerald-400' : d.getDay() === 0 ? 'text-rose-400 hover:bg-emerald-50' : 'text-neutral-800 hover:bg-emerald-50'}`}>{d.getDate()}</span>
                    <span className={`w-1 h-1 rounded-full ${hasWorkout ? 'bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.9)]' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100 px-1 text-[11px] font-bold text-neutral-400">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />운동한 날</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full ring-[1.5px] ring-emerald-400" />오늘</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#070b0f] ring-[1.5px] ring-emerald-400" />선택한 날</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
