import React from 'react';
import { NoticeBanner } from '../../NoticeBanner.jsx';
import { CheckCircle2, ChevronRight, Dumbbell, MoreVertical, Plus, Sparkles, Utensils, Zap } from 'lucide-react';
import { WEEKLY_GOAL_MIN, cardioStats } from '../../data/cardio.js';
import { getExName, getExTarget } from '../../data/catalog.js';
import { formatDate } from '../../lib/dates.js';
import { InstallBanner } from '../../pwa.jsx';
import { useApp } from '../../appContext.js';

// 홈(운동) 탭: 주간 날짜, 식단·회복도 바로가기, 내 루틴
export function HomeTab() {
  const {
    currentUser,
    currentDate,
    guardNewWorkout,
    pastWorkoutDates,
    safeWorkouts,
    setActiveTab,
    setCurrentDate,
    setCurrentScreen,
    setIsInstallOpen,
    setIsRoutineLoaderOpen,
    setSelectedDayDetailModal,
    setSelectedPastDate,
    setSession,
    setWorkoutDurationSec,
    appNotice,
  } = useApp();
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex-1 bg-neutral-50 text-neutral-900 p-5 pb-32 min-h-[60vh]">
        <NoticeBanner notice={appNotice} />
      <InstallBanner onOpen={() => setIsInstallOpen(true)} />
        <div className="flex gap-3 mb-8 mt-2">
          <div onClick={() => setCurrentScreen('diet')} className="flex-1 bg-white p-4 rounded-[24px] border border-neutral-100 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer active:scale-95 group">
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 group-hover:scale-110 transition-all"><Utensils className="w-5 h-5 text-emerald-600" /></div>
            <div><div className="font-black text-sm text-neutral-900">식단 플래너</div><div className="text-[11px] font-bold text-neutral-400 mt-0.5">매크로 계산</div></div>
          </div>
          <div onClick={() => setActiveTab('analysis')} className="flex-1 bg-white p-4 rounded-[24px] border border-neutral-100 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer active:scale-95 group">
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 group-hover:scale-110 transition-all"><Zap className="w-5 h-5 text-blue-600" /></div>
            <div><div className="font-black text-sm text-neutral-900">근육 회복도</div><div className="text-[11px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 w-max">상세 보기</div></div>
          </div>
        </div>

        {/* 유산소 기록 바로가기: 근력 루틴과 따로 기록 */}
        {(() => {
          const cardio = currentUser?.cardio || {};
          const weight = parseFloat(currentUser?.bodyStats?.weight) || 70;
          const dayMin = (key) => (cardio[key] || []).reduce((s, e) => s + (Number(e.min) || 0), 0);
          const todayList = cardio[currentDate] || [];
          const todayKcal = todayList.reduce((s, e) => s + cardioStats(e, weight).kcal, 0);
          const [y, m, d] = currentDate.split('-').map(Number);
          const mon = new Date(y, m - 1, d); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
          const weekMin = Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return dayMin(formatDate(x)); }).reduce((a, b) => a + b, 0);
          return (
            <button onClick={() => setCurrentScreen('cardio')} className="w-full -mt-5 mb-8 bg-white p-4 rounded-[24px] border border-neutral-100 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.98] text-left">
              <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 text-xl leading-none">🏃</div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm text-neutral-900">유산소 기록</div>
                <div className="text-[11px] font-bold text-neutral-400 mt-0.5 truncate">{todayList.length ? `오늘 ${dayMin(currentDate)}분 · ${todayKcal}kcal` : '러닝머신·천국의 계단·사이클 따로 기록'}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] font-black text-neutral-400">이번 주</div>
                <div className="text-sm font-black text-orange-500 tabular-nums">{weekMin}<span className="text-[10px] text-neutral-400">/{WEEKLY_GOAL_MIN}분</span></div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
            </button>
          );
        })()}

        <div className="flex justify-between items-end mb-5">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">내 루틴</h2>
          <button onClick={() => guardNewWorkout(() => { setSession([]); setWorkoutDurationSec(0); setCurrentDate(formatDate(new Date())); setCurrentScreen('workout'); })} className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1 active:scale-95"><Plus className="w-4 h-4 stroke-[3]"/> 새 루틴</button>
        </div>

        <div className="space-y-4">
          {(() => {
            const todayWorkout = safeWorkouts[currentDate] || [];
            const otherPastDates = pastWorkoutDates.filter(d => d !== currentDate).slice(0, 3);
            return (
              <>
                {todayWorkout.length > 0 ? (
                  <div onClick={() => setSelectedDayDetailModal(currentDate)} className="bg-white border-2 border-emerald-400 p-5 rounded-[28px] shadow-md relative hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer group mt-2">
                    <div className="absolute -top-3 left-5 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 오운완 완료</div>
                    <div className="flex justify-between items-start mb-2 mt-2">
                      <h3 className="font-black text-xl text-neutral-900 group-hover:text-emerald-600 transition-colors">{currentDate === formatDate(new Date()) ? '오늘의 훈련' : `${currentDate.split('-')[1]}월 ${currentDate.split('-')[2]}일 훈련`}</h3>
                      <div className="relative"><button onClick={(e) => { e.stopPropagation(); setSelectedPastDate(currentDate); setIsRoutineLoaderOpen(true); }} className="text-neutral-400 p-1.5 hover:bg-neutral-100 rounded-full transition-colors active:scale-90"><MoreVertical className="w-5 h-5"/></button></div>
                    </div>
                    <p className="text-sm text-neutral-500 mb-4 font-bold">{[...new Set(todayWorkout.map(ex => getExTarget(ex).split('(')[0]))].join(', ') || '전신'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">{todayWorkout.length}개 종목</span>
                      <span className="text-xs font-bold text-neutral-400">{todayWorkout[0] ? getExName(todayWorkout[0]) : ''} {todayWorkout.length > 1 ? '외' : ''}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-100 p-8 rounded-[28px] text-center shadow-inner mt-4 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100"><Dumbbell className="w-8 h-8 text-neutral-300" /></div>
                    <p className="text-sm font-bold text-neutral-500 mb-1">이 날짜에 기록된 루틴이 없습니다.</p>
                    <p className="text-xs font-bold text-neutral-400 mb-6">하단의 버튼을 눌러 바로 훈련을 시작해보세요!</p>
                    <button onClick={() => guardNewWorkout(() => { setSession([]); setWorkoutDurationSec(0); setCurrentScreen('workout'); })} className="bg-emerald-500 text-white font-black px-6 py-3 rounded-xl shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:bg-emerald-600 active:scale-95 transition-all">빈 운동 시작하기</button>
                  </div>
                )}

                {otherPastDates.length > 0 && (
                  <div className="pt-6 border-t border-neutral-100 mt-6">
                    <h3 className="text-sm font-black text-neutral-400 mb-4 ml-1">최근 기록된 다른 훈련</h3>
                    <div className="space-y-3">
                      {otherPastDates.map((date, idx) => {
                        const sessionData = safeWorkouts[date] || [];
                        const firstExName = sessionData[0] ? getExName(sessionData[0]) : '';
                        const targets = [...new Set(sessionData.map(ex => getExTarget(ex).split('(')[0]))].join(', ') || '전신';
                        return (
                          <div key={`hist-${idx}`} onClick={() => setSelectedDayDetailModal(date)} className="bg-white border border-neutral-100 p-4 rounded-[24px] shadow-sm relative hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-1.5">
                              <h3 className="font-black text-lg text-neutral-900 group-hover:text-emerald-600 transition-colors">{date.split('-')[1]}월 {date.split('-')[2]}일</h3>
                              <div className="relative"><button onClick={(e) => { e.stopPropagation(); setSelectedPastDate(date); setIsRoutineLoaderOpen(true); }} className="text-neutral-400 p-1.5 hover:bg-neutral-100 rounded-full transition-colors active:scale-90"><MoreVertical className="w-5 h-5"/></button></div>
                            </div>
                            <p className="text-xs text-neutral-500 mb-3 font-bold">{targets}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">{sessionData.length}개 종목</span>
                              <span className="text-[11px] font-bold text-neutral-400">{firstExName} {sessionData.length > 1 ? '외' : ''}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="fixed bottom-[96px] left-0 right-0 px-6 flex gap-3 pointer-events-none z-10">
        <button onClick={() => { setIsRoutineLoaderOpen(true); }} className="flex-1 bg-[#4b4e54] text-white font-black py-4 rounded-2xl text-center shadow-xl hover:bg-neutral-700 transition-colors active:scale-95 pointer-events-auto text-lg">이전 기록 불러오기</button>
        <button onClick={() => setActiveTab('program')} className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:brightness-110 transition-all active:scale-95 pointer-events-auto text-lg"><Sparkles className="w-5 h-5" /> 추천 프로그램</button>
      </div>
    </div>
  );
}
