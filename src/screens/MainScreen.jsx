import React, { lazy, Suspense } from 'react';
import { HERO_BG, TRON_GRID } from '../theme.js';
import { BarChart2, Bell, Calculator, CalendarDays, Camera, ChevronLeft, ChevronRight, Clock, Dumbbell, Edit3, History, Info, LayoutGrid, Trophy, User, Users, X, Zap } from 'lucide-react';
import { SmartExerciseThumbnail } from '../components/ExerciseVisuals.jsx';
import { MUSCLE_SUBGROUPS } from '../data/anatomy.js';
import { ACC_COLORS, BOTTOM_COLORS, EXERCISE_OPTIONS, HAIR_COLORS, PROGRAMS, SHIRT_COLORS, getExId, getExName, getExTarget } from '../data/catalog.js';
import { EXERCISE_GUIDES } from '../exerciseGuides.js';
import { calculate1RM, formatDate } from '../lib/dates.js';
import { AVATAR_EYE_COLORS, AVATAR_SHOE_COLORS, AVATAR_SKIN_TONES, FullBodyAvatar } from '../realAvatar.jsx';
import { GlobalOverlays } from './GlobalOverlays.jsx';
import { CalendarPopup } from './CalendarPopup.jsx';
import { AnalysisTab } from './tabs/AnalysisTab.jsx';
import { HomeTab } from './tabs/HomeTab.jsx';
import { WeekRings } from './tabs/WeekRings.jsx';
import { ProfileTab } from './tabs/ProfileTab.jsx';
import { ProgramTab } from './tabs/ProgramTab.jsx';
import { RankingScreen } from './tabs/RankingScreen.jsx';
import { WeekStrip } from './tabs/WeekStrip.jsx';
import { useApp } from '../appContext.js';


// AI 코치는 열 때 따로 불러온다 (첫 화면을 가볍게)
const AiCoach = lazy(() => import('../aiCoach.jsx').then(m => ({ default: m.AiCoach })));
// 로그인 뒤 기본 화면: 상단 헤더·탭 전환·하단 메뉴·공용 팝업
export function MainScreen() {
  const {
    LegendArt,
    acceptFriend,
    activeTab,
    activeUser,
    avatarPose,
    calcInputs,
    cloudUser,
    currentDate,
    currentUser,
    declineFriend,
    friendState,
    getAnalysisWeekInfo,
    getBestLifts,
    getMuscleExercises,
    getMuscleRecoveryStatus,
    getWeeklyLoadReport,
    goToSignup,
    guardNewWorkout,
    isAiCoachOpen,
    isAvatarStudioOpen,
    isBodyStatsModalOpen,
    isFullCalendarOpen,
    isManualRmModalOpen,
    isNotiOpen,
    isOneRmCalculatorOpen,
    isRoutineLoaderOpen,
    loadLegendRoutine,
    loadProgramWorkout,
    loadSpecificWorkout,
    manualRmInputs,
    muscleConfirmModal,
    muscleSubPicker,
    openPhotoCard,
    pastWorkoutDates,
    pickMuscleSub,
    profilesById,
    renderAccessoryCategory,
    safeWorkouts,
    saveBodyStats,
    saveManualRm,
    selectedDayDetailModal,
    selectedLegendModal,
    selectedPastDate,
    selectedProgramModal,
    setActiveTab,
    setAvatarPose,
    setCalcInputs,
    setCurrentDate,
    setCurrentScreen,
    setGuideExerciseId,
    setIsAiCoachOpen,
    setIsAvatarStudioOpen,
    setIsBodyStatsModalOpen,
    setIsFriendSearchModalOpen,
    setIsFullCalendarOpen,
    setIsManualRmModalOpen,
    setIsNotiOpen,
    setIsOneRmCalculatorOpen,
    setIsRoutineLoaderOpen,
    setManualRmInputs,
    setMuscleConfirmModal,
    setMuscleSubPicker,
    setSelectedDayDetailModal,
    setSelectedLegendModal,
    setSelectedPastDate,
    setSelectedProgramModal,
    setSession,
    setTempStats,
    setVolume,
    setWorkoutDurationSec,
    showToast,
    startMuscleRoutine,
    tempStats,
    unreadCount,
    updateProfile,
  } = useApp();
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-[80px] flex flex-col relative overflow-hidden">
      <GlobalOverlays />
      <header className="relative z-20 px-3 pt-3">
        <div className="relative rounded-[30px] px-5 pt-5 pb-4 shadow-[0_14px_34px_rgba(7,11,15,0.28)]" style={{ background: HERO_BG }}>
        <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.07]" style={TRON_GRID} />
          <div className="absolute bottom-0 left-10 right-10 h-px shadow-[0_0_10px_rgba(52,211,153,0.8)]" style={{ background: 'linear-gradient(90deg, transparent, #34d399 30%, #60a5fa 70%, transparent)' }} />
        </div>
        <div className="relative flex justify-between items-center">
        {(() => {
          const d = new Date(currentDate);
          const isToday = currentDate === formatDate(new Date());
          return (
            <button onClick={() => setIsFullCalendarOpen(true)} className="text-left active:scale-[0.98] transition-transform">
              <span className={`block text-[11px] font-black tracking-[.2em] ${isToday ? 'text-emerald-300' : 'text-sky-300'}`}>{isToday ? 'TODAY' : '선택한 날'} · {['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}요일</span>
              <span className="flex items-center gap-1 text-[26px] font-black tracking-tight text-white leading-tight whitespace-nowrap">{d.getMonth() + 1}월 {d.getDate()}일<ChevronRight className="w-5 h-5 rotate-90 text-emerald-400" /></span>
            </button>
          );
        })()}
        <div className="flex gap-2 items-center relative">
          <button onClick={() => setIsFullCalendarOpen(true)} aria-label="달력" className="relative w-10 h-10 rounded-xl bg-white shadow-[0_0_14px_rgba(52,211,153,0.45)] overflow-hidden flex flex-col active:scale-90 transition-transform">
            <span className="h-[13px] bg-emerald-500 text-[8px] font-black text-white leading-[13px] text-center">{new Date().getMonth() + 1}월</span>
            <span className="flex-1 flex items-center justify-center text-[15px] font-black text-neutral-900 leading-none">{new Date().getDate()}</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsNotiOpen(!isNotiOpen)} aria-label="알림" className={`relative w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all bg-yellow-300 ${isNotiOpen ? 'shadow-[0_0_16px_rgba(250,204,21,0.8)] bg-yellow-400' : 'shadow-[0_0_10px_rgba(250,204,21,0.45)] hover:bg-yellow-400'}`}>
              <Bell className="w-5 h-5 text-neutral-900" />
              {unreadCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-[#070b0f]">{unreadCount}</div>}
            </button>
            {isNotiOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.16)] border border-neutral-100 overflow-hidden z-50 animate-fade-in origin-top-right text-left">
                <div className="h-[3px] bg-gradient-to-r from-yellow-300 via-yellow-400 to-emerald-400" />
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                  <span className="font-black text-neutral-900 text-sm">알림</span>
                  {cloudUser && <button onClick={() => { setIsNotiOpen(false); setIsFriendSearchModalOpen(true); }} className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors">친구 관리</button>}
                </div>
                <div className="max-h-80 overflow-y-auto hide-scrollbar">
                  {friendState.incoming.map(r => (
                    <div key={`req-${r.requestId}`} className="p-4 border-b border-neutral-100">
                      <div className="text-xs font-black text-emerald-600 mb-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> 친구 요청</div>
                      <div className="text-sm font-bold text-neutral-600 leading-relaxed mb-3"><span className="text-neutral-900 font-black">{profilesById[r.from]?.name || '짐스피릿 유저'}</span>님이 친구를 맺고 싶어해요.</div>
                      <div className="flex gap-2">
                        <button onClick={() => declineFriend(r.requestId)} className="flex-1 bg-neutral-100 text-neutral-600 text-xs font-black py-2 rounded-lg hover:bg-neutral-200 transition-colors">거절</button>
                        <button onClick={() => acceptFriend(r.requestId)} className="flex-[2] bg-emerald-500 text-white text-xs font-black py-2 rounded-lg hover:bg-emerald-600 transition-colors">수락하기</button>
                      </div>
                    </div>
                  ))}
                  {!cloudUser && (
                    <button onClick={() => { setIsNotiOpen(false); goToSignup(); }} className="w-full p-4 text-left border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <div className="text-xs font-black text-emerald-600 mb-1">게스트 모드</div>
                      <div className="text-xs font-bold text-neutral-500 leading-relaxed">회원가입하면 친구 요청과 응원 알림을 받을 수 있어요.</div>
                    </button>
                  )}
                  {cloudUser && unreadCount === 0 && (<div className="p-8 text-center text-neutral-400 font-bold text-sm">새로운 알림이 없어요</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
              </div>
        {activeTab === 'workout' && (
          <>
            <WeekRings />
            <WeekStrip />
          </>
        )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'workout' && (
          <HomeTab />
        )}

        {activeTab === 'analysis' && <AnalysisTab />}

        {activeTab === 'program' && (
          <ProgramTab />
        )}

        {activeTab === 'ranking' && <RankingScreen />}

        {activeTab === 'profile' && (
          <ProfileTab />
        )}
      </div>

      {selectedDayDetailModal && (() => {
        const sessionData = safeWorkouts[selectedDayDetailModal] || [];
        let totalVol = 0;
        let totalSets = 0;
        sessionData.forEach(ex => { if (ex.sets) ex.sets.forEach(s => { if (s.completed && s.reps) { totalVol += setVolume(ex, s); totalSets++; } }); });
        return (
          <div className="fixed inset-0 bg-black/70 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => setSelectedDayDetailModal(null)}>
            <div className="bg-white text-neutral-900 w-full h-[85vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="flex justify-center pt-3 pb-2 bg-white"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
               <div className="px-6 flex justify-between items-start mb-4 border-b border-neutral-100 pb-5 bg-white">
                 <div>
                   <h2 className="text-2xl font-black tracking-tight">{(() => { const d = new Date(selectedDayDetailModal); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`; })()}</h2>
                   <p className="text-sm font-bold text-neutral-400 mt-1">{sessionData.length > 0 ? `운동 기록 · ${sessionData.length}개 종목` : '운동 기록 없음'}</p>
                 </div>
                 <button onClick={() => setSelectedDayDetailModal(null)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors active:scale-90"><X className="w-5 h-5 text-neutral-500"/></button>
               </div>
               <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4 bg-neutral-50 pt-4">
                 <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center mb-4">
                   <div className="text-center"><div className="text-xs text-neutral-400 font-bold mb-1">총 볼륨</div><div className="text-2xl font-black text-neutral-900">{totalVol.toLocaleString()}<span className="text-sm text-neutral-400 ml-1">kg</span></div></div>
                   <div className="w-[1px] h-12 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-xs text-neutral-400 font-bold mb-1">완료 세트</div><div className="text-2xl font-black text-blue-600">{totalSets}<span className="text-sm text-neutral-400 ml-1">세트</span></div></div>
                 </div>
                 <div className="space-y-4">
                    {sessionData.length === 0 ? (
                      <div className="text-center py-20 text-neutral-400 font-bold flex flex-col items-center"><Dumbbell className="w-12 h-12 mb-3 opacity-50"/>이 날은 기록된 운동이 없어요</div>
                    ) : (
                      sessionData.map((ex, idx) => (
                        <div key={`d-ex-${idx}`} className="bg-white p-4 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <SmartExerciseThumbnail exerciseId={getExId(ex)} target={getExTarget(ex)} tool={ex.exercise && ex.exercise.tool ? String(ex.exercise.tool) : '바벨'} size="w-14 h-14" showShadow={false}/>
                            <div>
                              <div className="font-black text-neutral-900 text-base mb-1 group-hover:text-emerald-600 transition-colors">{getExName(ex)}</div>
                              <div className="text-xs font-bold text-neutral-400">{(ex.sets||[]).filter(s=>s.completed).length}세트 완료</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
               </div>
               {sessionData.length > 0 && (
                 <div className="p-5 bg-white border-t border-neutral-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] flex gap-2">
                   <button onClick={() => openPhotoCard(selectedDayDetailModal)} className="flex-1 bg-neutral-900 text-white font-black py-4 rounded-xl shadow-md hover:bg-neutral-800 active:scale-95 transition-all text-base flex items-center justify-center gap-2"><Camera className="w-5 h-5 text-yellow-300"/> 인증카드</button>
                   <button onClick={() => { loadSpecificWorkout(selectedDayDetailModal); setSelectedDayDetailModal(null); }} className="flex-[2] bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-black py-4 rounded-xl shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all text-base">이 루틴 불러와서 운동하기</button>
                 </div>
               )}
             </div>
          </div>
        );
      })()}

      {isRoutineLoaderOpen && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex justify-end flex-col animate-fade-in" onClick={() => setIsRoutineLoaderOpen(false)}>
          <div className="bg-white text-neutral-900 w-full h-[85vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2 bg-white"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
            <h2 className="text-2xl font-black tracking-tight text-center mb-4 bg-white pb-2">이전 기록 불러오기</h2>
            {pastWorkoutDates.length > 0 ? (
              <div className="flex-1 overflow-y-auto px-5 pt-5 bg-neutral-50 space-y-3">
                {pastWorkoutDates.map((date, idx) => (
                  <button key={`ld-${idx}`} onClick={() => setSelectedPastDate(date)} className={`w-full text-left p-5 rounded-[24px] border-2 transition-all active:scale-[0.98] ${selectedPastDate === date ? 'bg-neutral-800 text-white border-neutral-800 shadow-md' : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300 shadow-sm'}`}>
                    <div className="font-black text-lg">{date} 루틴</div>
                    <div className="text-sm font-bold text-neutral-400 mt-1">{(safeWorkouts[date]||[]).length}개 종목 수행</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-50 bg-neutral-50"><History className="w-16 h-16 mb-4 text-neutral-400"/><p className="font-bold text-neutral-500 text-center">아직 저장된 과거 기록이 없습니다.</p></div>
            )}
            <div className="px-5 pt-4 pb-6 bg-white mt-auto border-t border-neutral-100 flex gap-3">
              <button onClick={() => { setIsRoutineLoaderOpen(false); guardNewWorkout(() => { setSession([]); setWorkoutDurationSec(0); setCurrentScreen('workout'); }); }} className="flex-1 bg-[#4b4e54] text-white font-black py-4 rounded-xl hover:bg-neutral-700 transition-colors text-lg active:scale-95">빈 운동 시작</button>
              <button onClick={() => { if(selectedPastDate){ loadSpecificWorkout(selectedPastDate); setIsRoutineLoaderOpen(false); }}} className={`flex-1 font-black py-4 rounded-xl transition-all text-lg active:scale-95 ${selectedPastDate ? 'bg-emerald-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.3)]' : 'bg-neutral-100 text-neutral-400'}`} disabled={!selectedPastDate}>불러오기</button>
            </div>
          </div>
        </div>
      )}

      {isAvatarStudioOpen && (
        <div className="fixed inset-0 bg-[#111111] z-[90] flex flex-col items-center pt-8 p-4 animate-fade-in" onClick={e=>e.stopPropagation()}>
          <div className="w-full max-w-md bg-neutral-900 rounded-[40px] border border-neutral-800 shadow-2xl animate-slide-up flex flex-col h-[90vh] overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center border-b border-neutral-800 bg-neutral-900 z-10">
              <button onClick={() => setIsAvatarStudioOpen(false)} className="text-neutral-400 hover:text-white flex items-center gap-1 font-bold transition-colors"><ChevronLeft className="w-5 h-5"/> 닫기</button>
              <h2 className="text-xl font-black text-white tracking-tight">아바타 스튜디오 2.0</h2>
              <button onClick={() => { setIsAvatarStudioOpen(false); showToast("아바타가 성공적으로 저장되었습니다!"); }} className="text-[#4768ff] font-black text-sm bg-blue-500/10 px-3 py-1.5 rounded-lg active:scale-95">저장</button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 bg-neutral-950">
              <div className="flex flex-col items-center my-8 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/20 to-transparent pointer-events-none"></div>
                <div className="relative mb-6 drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"><FullBodyAvatar profile={currentUser?.profile} bodyStats={currentUser?.bodyStats} size="w-56 h-[380px]" pose={avatarPose} /></div>
                <div className="flex gap-2 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 shadow-inner z-10">
                  <button onClick={() => setAvatarPose("standard")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${avatarPose === "standard" ? "bg-emerald-500 text-neutral-950 shadow-md" : "text-neutral-400 hover:text-white"}`}>스탠다드</button>
                  <button onClick={() => setAvatarPose("hip")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${avatarPose === "hip" ? "bg-emerald-500 text-neutral-950 shadow-md" : "text-neutral-400 hover:text-white"}`}>당당함 😤</button>
                  <button onClick={() => setAvatarPose("flex")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${avatarPose === "flex" ? "bg-emerald-500 text-neutral-950 shadow-md" : "text-neutral-400 hover:text-white"}`}>포징 🏋️‍♂️</button>
                </div>
              </div>
              <div className="px-6 space-y-8">
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">성별 베이스</span>
                  <div className="flex gap-3">
                     <button onClick={() => updateProfile({ gender: 'male' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.gender === 'male' ? 'bg-[#4768ff] text-white border-[#4768ff] shadow-[0_5px_15px_rgba(71,104,255,0.3)]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>남자 (근육형)</button>
                     <button onClick={() => updateProfile({ gender: 'female' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.gender === 'female' ? 'bg-[#4768ff] text-white border-[#4768ff] shadow-[0_5px_15px_rgba(71,104,255,0.3)]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>여자 (슬림형)</button>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">얼굴 표정</span>
                  <div className="flex gap-3">
                     <button onClick={() => updateProfile({ faceExpression: 'normal' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.faceExpression === 'normal' ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>기본</button>
                     <button onClick={() => updateProfile({ faceExpression: 'smile' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.faceExpression === 'smile' ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>미소</button>
                     <button onClick={() => updateProfile({ faceExpression: 'angry' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.faceExpression === 'angry' ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>진지</button>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">피부 톤</span>
                  <div className="flex bg-neutral-900 p-4 rounded-[20px] border border-neutral-800 shadow-inner gap-3 overflow-x-auto hide-scrollbar">
                    {AVATAR_SKIN_TONES.map(color => (<button key={`skinColor-${color}`} onClick={() => updateProfile({ skinColor: color })} style={{ backgroundColor: color }} aria-label="피부 톤 선택" className={`w-10 h-10 flex-shrink-0 rounded-full border-2 transition-all ${(currentUser?.profile?.skinColor || AVATAR_SKIN_TONES[1]) === color ? 'border-white scale-110 shadow-md ring-2 ring-white/20' : 'border-neutral-700 opacity-60 hover:opacity-100'}`} />))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">눈동자 색</span>
                  <div className="flex bg-neutral-900 p-4 rounded-[20px] border border-neutral-800 shadow-inner gap-3 overflow-x-auto hide-scrollbar">
                    {AVATAR_EYE_COLORS.map(color => (<button key={`eyeColor-${color}`} onClick={() => updateProfile({ eyeColor: color })} style={{ backgroundColor: color }} aria-label="눈동자 색 선택" className={`w-10 h-10 flex-shrink-0 rounded-full border-2 transition-all ${(currentUser?.profile?.eyeColor || AVATAR_EYE_COLORS[0]) === color ? 'border-white scale-110 shadow-md ring-2 ring-white/20' : 'border-neutral-700 opacity-60 hover:opacity-100'}`} />))}
                  </div>
                </div>
                {renderAccessoryCategory("상의", "topStyle", "shirtColor", [{ label: "티셔츠", value: "tshirt" }, { label: "민소매", value: "tank" }, { label: currentUser?.profile?.gender === 'female' ? "스포츠 브라" : "상의 탈의", value: "none" }], SHIRT_COLORS, 'tshirt', currentUser?.profile?.gender === 'female')}
                {renderAccessoryCategory("하의", "bottomStyle", "bottomColor", [{ label: "반바지", value: "shorts" }, { label: "조거 팬츠", value: "joggers" }, { label: "레깅스", value: "leggings" }], BOTTOM_COLORS, 'shorts')}
                {renderAccessoryCategory("운동화", "shoeStyle", "shoeColor", [{ label: "러닝화", value: "runner" }], AVATAR_SHOE_COLORS, 'runner')}
                {renderAccessoryCategory("머리 장식 (모자/밴드)", "hat", "hatColor", [{ label: "없음", value: "none" }, { label: "헤어밴드", value: "headband" }, { label: "스냅백", value: "cap" }, { label: "비니", value: "beanie" }, { label: "반다나", value: "bandana" }])}
                {renderAccessoryCategory("얼굴 장식 (안경/마스크)", "faceAcc", "faceAccColor", [{ label: "없음", value: "none" }, { label: "뿔테안경", value: "glasses" }, { label: "선글라스", value: "sunglasses" }, { label: "마스크", value: "mask" }])}
                {renderAccessoryCategory("목 장식 (목걸이/헤드폰)", "neckAcc", "neckAccColor", [{ label: "없음", value: "none" }, { label: "체인 목걸이", value: "chain" }, { label: "스포츠 수건", value: "towel" }, { label: "헤드폰", value: "headphones" }])}
                {renderAccessoryCategory("바디 장식 (가방/장비)", "bodyAcc", "bodyAccColor", [{ label: "없음", value: "none" }, { label: "리프팅벨트", value: "belt" }, { label: "중량조끼", value: "vest" }, { label: "크로스백", value: "bag" }])}
                {renderAccessoryCategory("헤어 스타일", "hairStyle", "hairColor", [{ label: "민머리", value: "none" }, { label: "짧은머리", value: "short" }, { label: "투블럭", value: "classic" }, { label: "스파이키", value: "spiky" }, { label: "긴머리", value: "long" }, { label: "포니테일", value: "ponytail" }, { label: "단발", value: "bob" }, { label: "올림머리", value: "bun" }], HAIR_COLORS)}
                {renderAccessoryCategory("수염 (Facial Hair)", "facialHair", "hairColor", [{ label: "없음", value: "none" }, { label: "콧수염", value: "mustache" }, { label: "턱수염", value: "goatee" }, { label: "풀 비어드", value: "beard" }], HAIR_COLORS)}
                {renderAccessoryCategory("타투 & 흉터 (Tattoo)", "tattoo", "tattooColor", [{ label: "없음", value: "none" }, { label: "상처", value: "scar" }, { label: "눈밑 십자가", value: "cross" }, { label: "가슴 트라이벌", value: "chest_tribal" }], ["#171717", "#ef4444", "#3b82f6", "#10b981", "#f59e0b"])}
                {renderAccessoryCategory("특수 오라 (Aura & Effects)", "aura", "auraColor", [{ label: "없음", value: "none" }, { label: "은은한 빛", value: "glow" }, { label: "타오르는 불꽃", value: "fire" }, { label: "강력한 번개", value: "lightning" }, { label: "땀방울", value: "sweat" }], ACC_COLORS)}
                <div className="pb-8"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFullCalendarOpen && <CalendarPopup />}

      {selectedProgramModal && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => setSelectedProgramModal(null)}>
          <div className="bg-white text-neutral-900 w-full h-[85vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2 bg-white"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
            <div className="px-6 flex justify-between items-start mb-4 border-b border-neutral-100 pb-5 bg-white">
              <div>
                <div className={`${selectedProgramModal.badgeColor} text-[10px] font-black px-2.5 py-1 rounded-md w-max mb-2`}>{String(selectedProgramModal.level)} · {String(selectedProgramModal.duration)}</div>
                <h2 className="text-2xl font-black tracking-tight">{String(selectedProgramModal.title)}</h2>
                <p className="text-sm font-bold text-neutral-500 mt-2">{String(selectedProgramModal.desc)}</p>
              </div>
              <button onClick={() => setSelectedProgramModal(null)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors active:scale-90"><X className="w-5 h-5 text-neutral-500"/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4 bg-neutral-50 pt-4">
              {selectedProgramModal.workouts.map((w, idx) => {
                const ex = EXERCISE_OPTIONS.find(e => e.id === w.exerciseId);
                return (
                  <div key={`prm-${idx}`} className="flex gap-4 items-center bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm hover:border-[#4768ff] transition-colors group">
                    <SmartExerciseThumbnail exerciseId={ex?.id} target={ex ? ex.target : '전신'} tool={ex ? ex.tool : '바벨'} size="w-14 h-14" showShadow={false}/>
                    <div className="flex-1">
                      <div className="font-black text-neutral-900 text-lg group-hover:text-[#4768ff] transition-colors">{ex ? ex.name : '운동'}</div>
                      <div className="text-xs text-neutral-500 font-bold mt-1 bg-neutral-50 px-2 py-1 rounded w-max">{w.sets}세트 · {w.reps}회 · {w.weight}kg</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 pt-4 pb-6 bg-white mt-auto border-t border-neutral-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <button onClick={() => { loadProgramWorkout(selectedProgramModal.id); setSelectedProgramModal(null); }} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(71,104,255,0.3)] text-lg active:scale-95 transition-transform hover:bg-blue-600">이 프로그램 시작하기</button>
            </div>
          </div>
        </div>
      )}

      {selectedLegendModal && (
        <div className="fixed inset-0 bg-black/80 z-[75] flex flex-col justify-end animate-fade-in" onClick={() => setSelectedLegendModal(null)}>
          <div className="bg-white text-neutral-900 w-full h-[90vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative text-white h-64 flex-shrink-0 bg-neutral-900 overflow-hidden">
              <LegendArt id={selectedLegendModal.id} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <button onClick={() => setSelectedLegendModal(null)} className="absolute top-5 right-5 z-10 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors active:scale-90 backdrop-blur-sm"><X className="w-5 h-5"/></button>
              <div className="relative z-10 h-full w-[66%] px-6 py-6 flex flex-col justify-end">
                <div className="text-[10px] font-black bg-white/15 px-2.5 py-1 rounded-md w-max mb-2 border border-white/25 backdrop-blur-sm">{selectedLegendModal.era}</div>
                <h2 className="text-2xl font-black tracking-tight leading-tight mb-2 drop-shadow">{selectedLegendModal.name.split(' (')[0]}</h2>
                <p className="text-xs font-bold text-white/85 leading-relaxed line-clamp-3">{selectedLegendModal.desc}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-neutral-50 space-y-4">
              {selectedLegendModal.split && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-[#4768ff] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-neutral-400">주간 분할</p>
                      <p className="text-sm font-black text-neutral-900 leading-snug">{selectedLegendModal.split}</p>
                    </div>
                  </div>
                  {selectedLegendModal.basis && <p className="text-[11px] font-bold text-neutral-500 leading-relaxed bg-neutral-50 rounded-xl p-3 flex gap-1.5"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />{selectedLegendModal.basis}</p>}
                </div>
              )}
              <h3 className="text-sm font-black text-neutral-500 mb-2">🔥 부위별 훈련 프로그램</h3>
              {selectedLegendModal.routines.map((routine, idx) => (
                <div key={`leg-r-${idx}`} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden group">
                  <div className="p-5 border-b border-neutral-100">
                    <div className="flex justify-between items-center mb-1">
                       <h4 className="font-black text-lg text-neutral-900 group-hover:text-[#4768ff] transition-colors">{routine.title}</h4>
                       <span className="text-[10px] font-bold bg-blue-50 text-[#4768ff] px-2 py-1 rounded">총 {routine.workouts.length}종목</span>
                    </div>
                    <p className="text-xs text-neutral-500 font-bold">{routine.desc}</p>
                  </div>
                  <div className="bg-neutral-50 p-4 space-y-3">
                    {routine.workouts.map((w, wIdx) => {
                      const ex = EXERCISE_OPTIONS.find(e => e.id === w.exerciseId);
                      return (
                        <div key={`wrk-${wIdx}`} className="flex justify-between items-center bg-white p-3 rounded-xl border border-neutral-100">
                           <div className="flex items-center gap-3">
                              <SmartExerciseThumbnail exerciseId={ex?.id} target={ex ? ex.target : '전신'} tool={ex ? ex.tool : '바벨'} size="w-10 h-10" showShadow={false}/>
                              <span className="font-black text-sm text-neutral-800">{ex ? ex.name : '운동'}</span>
                           </div>
                           <div className="flex flex-col items-end gap-1 flex-shrink-0">
                             <span className="text-xs font-black text-neutral-400 bg-neutral-100 px-2 py-1 rounded">{w.sets}세트 x {w.reps}회</span>
                             {w.note && <span className="text-[10px] font-black text-[#4768ff]">{w.note}</span>}
                           </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 bg-white border-t border-neutral-100"><button onClick={() => loadLegendRoutine(routine)} className="w-full bg-neutral-900 text-white font-black py-3 rounded-xl hover:bg-neutral-800 transition-colors text-sm">선택한 루틴 시작하기</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isBodyStatsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex flex-col justify-end backdrop-blur-sm transition-opacity" onClick={() => setIsBodyStatsModalOpen(false)}>
          <div className="bg-white text-neutral-900 rounded-t-[40px] p-6 w-full shadow-2xl border-t border-neutral-100 animate-slide-up pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
            <h3 className="text-2xl font-black mb-6 tracking-tight text-center">신체 정보 업데이트</h3>
            <div className="space-y-4 mb-8">
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-inner">
                <span className="font-black text-neutral-600 text-sm">몸무게 (kg)</span>
                <input type="number" value={tempStats.weight} onChange={e=>setTempStats({...tempStats, weight: e.target.value})} className="w-24 text-right font-black text-2xl bg-transparent border-b-2 border-neutral-300 focus:border-[#4768ff] outline-none transition-colors text-neutral-900 placeholder:text-neutral-300" placeholder="-"/>
              </div>
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-inner">
                <span className="font-black text-neutral-600 text-sm">골격근량 (kg)</span>
                <input type="number" value={tempStats.muscle} onChange={e=>setTempStats({...tempStats, muscle: e.target.value})} className="w-24 text-right font-black text-2xl bg-transparent border-b-2 border-neutral-300 focus:border-[#4768ff] outline-none transition-colors text-neutral-900 placeholder:text-neutral-300" placeholder="-"/>
              </div>
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-inner">
                <span className="font-black text-neutral-600 text-sm">체지방률 (%)</span>
                <input type="number" value={tempStats.fat} onChange={e=>setTempStats({...tempStats, fat: e.target.value})} className="w-24 text-right font-black text-2xl bg-transparent border-b-2 border-neutral-300 focus:border-[#4768ff] outline-none transition-colors text-neutral-900 placeholder:text-neutral-300" placeholder="-"/>
              </div>
            </div>
            <button onClick={saveBodyStats} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] text-lg hover:bg-blue-600 active:scale-95 transition-all">저장하기</button>
          </div>
        </div>
      )}

      {isOneRmCalculatorOpen && (
        <div className="fixed inset-0 bg-black/80 z-[95] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setIsOneRmCalculatorOpen(false)}>
          <div className="bg-neutral-900 text-white rounded-[32px] p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
            <button onClick={() => setIsOneRmCalculatorOpen(false)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
            <div className="flex items-center gap-2 mb-6"><Calculator className="w-6 h-6 text-emerald-400"/><h3 className="text-xl font-black">1RM 추정 계산기</h3></div>
            <div className="space-y-4 mb-6">
              <div><label className="text-xs font-bold text-neutral-400 mb-1 block">수행 중량 (kg)</label><input type="number" value={calcInputs.weight} onChange={e => setCalcInputs({...calcInputs, weight: parseFloat(e.target.value)||0})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-lg font-black text-white text-center outline-none focus:border-emerald-500"/></div>
              <div><label className="text-xs font-bold text-neutral-400 mb-1 block">반복 횟수 (Reps)</label><input type="number" value={calcInputs.reps} onChange={e => setCalcInputs({...calcInputs, reps: parseInt(e.target.value, 10)||0})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-lg font-black text-white text-center outline-none focus:border-emerald-500"/></div>
            </div>
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 text-center mb-6">
              <span className="text-xs font-bold text-neutral-400 block mb-1">추정 1RM (최대 1회 무게)</span>
              <span className="text-4xl font-black text-emerald-400 font-mono">{calculate1RM(calcInputs.weight, calcInputs.reps)} <span className="text-base text-neutral-400 font-bold">kg</span></span>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-800 text-xs">
                 <div className="text-left"><span className="text-neutral-500 block">85% (근력/스트렝스)</span><span className="font-bold text-white">{Math.round(calculate1RM(calcInputs.weight, calcInputs.reps)*0.85)}kg</span></div>
                 <div className="text-right"><span className="text-neutral-500 block">75% (근비대 타겟)</span><span className="font-bold text-white">{Math.round(calculate1RM(calcInputs.weight, calcInputs.reps)*0.75)}kg</span></div>
              </div>
            </div>
            <button onClick={() => setIsOneRmCalculatorOpen(false)} className="w-full bg-emerald-500 text-neutral-950 font-black py-3.5 rounded-xl text-base shadow-[0_0_15px_rgba(16,185,129,0.3)]">확인 완료</button>
          </div>
        </div>
      )}

      {isManualRmModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[95] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setIsManualRmModalOpen(false)}>
          <div className="bg-neutral-900 text-white rounded-[32px] p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
            <button onClick={() => setIsManualRmModalOpen(false)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
            <div className="flex items-center gap-2 mb-2"><Edit3 className="w-6 h-6 text-[#4768ff]"/><h3 className="text-xl font-black">수동 1RM 기록</h3></div>
            <p className="text-xs font-bold text-neutral-400 mb-6">헬스장에서 측정한 기록을 직접 입력하면 앱 기록을 덮어씁니다. (비워두면 앱 기록 사용)</p>
            <div className="space-y-3 mb-6">
              {[['sq', '스쿼트', 'text-rose-400'], ['bp', '벤치프레스', 'text-blue-400'], ['dl', '데드리프트', 'text-emerald-500']].map(([key, label, color]) => (
                <div key={key} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                  <span className={`font-black ${color} text-sm`}>{label}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" inputMode="decimal" placeholder="0" value={manualRmInputs[key]} onFocus={e => e.target.select()} onChange={e=>setManualRmInputs({...manualRmInputs, [key]: e.target.value})} className="w-20 text-right font-black text-xl bg-transparent border-b border-neutral-700 focus:border-[#4768ff] outline-none transition-colors" placeholder="-"/>
                    <span className="text-neutral-500 font-bold text-sm">kg</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={saveManualRm} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-xl text-base shadow-[0_10px_25px_rgba(71,104,255,0.3)] hover:bg-blue-600 transition-colors">저장하기</button>
          </div>
        </div>
      )}

      {muscleSubPicker && (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setMuscleSubPicker(null)}>
          <div className="bg-white text-neutral-900 rounded-[32px] p-6 w-full max-w-sm shadow-2xl border border-neutral-100 animate-scale-up relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMuscleSubPicker(null)} className="absolute top-4 right-4 p-2 bg-neutral-100 rounded-full text-neutral-400 hover:bg-neutral-200 transition-colors"><X className="w-5 h-5"/></button>
            <p className="text-xs font-black text-[#4768ff] mb-1">세부 부위 선택</p>
            <h3 className="text-2xl font-black tracking-tight mb-1">{muscleSubPicker}</h3>
            <p className="text-sm font-bold text-neutral-500 mb-5">어느 부위를 집중해서 훈련할까요?</p>
            <div className="space-y-2.5">
              {MUSCLE_SUBGROUPS[muscleSubPicker].map(sub => {
                const count = getMuscleExercises({ group: muscleSubPicker, sub }).length;
                return (
                  <button key={sub.key} onClick={() => pickMuscleSub(muscleSubPicker, sub)} className="w-full text-left bg-neutral-50 hover:bg-[#e8edff] border border-neutral-100 hover:border-[#4768ff] rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] group">
                    <span className="text-[11px] font-black text-white bg-neutral-900 group-hover:bg-[#4768ff] px-2.5 py-1 rounded-lg transition-colors">{sub.key}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-black text-neutral-900">{sub.label}</span>
                      <span className="block text-[11px] font-bold text-neutral-400 truncate">{sub.desc}</span>
                    </span>
                    <span className="text-[10px] font-black text-neutral-400 whitespace-nowrap">{count}종목</span>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#4768ff]" />
                  </button>
                );
              })}
            </div>
            <button onClick={() => pickMuscleSub(muscleSubPicker, null)} className="w-full mt-4 text-xs font-bold text-neutral-400 hover:text-neutral-700 py-2 transition-colors">{muscleSubPicker} 전체 골고루 하기</button>
          </div>
        </div>
      )}

      {muscleConfirmModal && (() => {
        const muscleStatus = getMuscleRecoveryStatus()[muscleConfirmModal.group];
        const isRecovered = !muscleStatus || muscleStatus.percent >= 90;
        const confirmTitle = muscleConfirmModal.sub ? `${muscleConfirmModal.group} · ${muscleConfirmModal.sub.key}` : muscleConfirmModal.group;
        const previewExercises = getMuscleExercises(muscleConfirmModal).slice(0, 4);
        return (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setMuscleConfirmModal(null)}>
          <div className="bg-white text-neutral-900 rounded-[40px] p-8 w-full max-w-sm shadow-2xl border border-neutral-100 animate-scale-up text-center relative" onClick={e=>e.stopPropagation()}>
             <button onClick={() => setMuscleConfirmModal(null)} className="absolute top-4 right-4 p-2 bg-neutral-100 rounded-full text-neutral-400 hover:bg-neutral-200 transition-colors"><X className="w-5 h-5"/></button>
             {isRecovered ? (
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm"><Zap className="w-10 h-10 text-emerald-500 fill-emerald-500/20" /></div>
             ) : (
               <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-100 shadow-sm"><Clock className="w-10 h-10 text-amber-500" /></div>
             )}
             <h3 className="text-2xl font-black mb-2 tracking-tight">[{confirmTitle}] {isRecovered ? '회복 완료!' : '아직 회복 중'}</h3>
             {isRecovered ? (
               <p className="text-sm font-bold text-neutral-500 mb-5 leading-relaxed">근육이 충분히 쉬었습니다.<br/>바로 추천 루틴으로 훈련을 시작할까요?</p>
             ) : (
               <p className="text-sm font-bold text-neutral-500 mb-5 leading-relaxed">{muscleStatus.text}<br/>회복 전에 훈련하면 부상 위험이 있어요. 그래도 시작할까요?</p>
             )}
             <div className="flex flex-wrap justify-center gap-1.5 mb-7">
               {previewExercises.map(ex => (
                 <span key={ex.id} className="text-[11px] font-black text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-lg">{ex.name}</span>
               ))}
             </div>
             <div className="flex gap-3">
               <button onClick={() => setMuscleConfirmModal(null)} className="flex-1 py-4 bg-neutral-100 text-neutral-500 font-black rounded-2xl hover:bg-neutral-200 transition-colors active:scale-95">닫기</button>
               <button onClick={startMuscleRoutine} className="flex-[2] py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all active:scale-95 text-lg">{isRecovered ? '훈련 시작하기' : '그래도 시작하기'}</button>
             </div>
          </div>
        </div>
        );
      })()}

      {isAiCoachOpen && (
        <Suspense fallback={null}><AiCoach
          onClose={() => setIsAiCoachOpen(false)}
          profile={activeUser?.profile}
          bodyStats={activeUser?.bodyStats}
          report={getWeeklyLoadReport(getAnalysisWeekInfo(new Date()).monday)}
          bestLifts={getBestLifts()}
          programs={PROGRAMS}
          exercises={EXERCISE_OPTIONS}
          onOpenProgram={(id) => { const prog = PROGRAMS.find(p => p.id === id); if (prog) { setIsAiCoachOpen(false); setSelectedProgramModal(prog); } }}
          onOpenGuide={(id) => { if (EXERCISE_GUIDES[id]) setGuideExerciseId(id); }}
        /></Suspense>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-around items-center pt-2 px-2 z-30 text-neutral-400 h-[80px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
        <button onClick={() => setActiveTab('workout')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='workout' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><Dumbbell className={`w-6 h-6 ${activeTab==='workout' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">운동</span></button>
        <button onClick={() => setActiveTab('analysis')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='analysis' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><BarChart2 className={`w-6 h-6 ${activeTab==='analysis' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">분석</span></button>
        <button onClick={() => setActiveTab('program')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='program' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><LayoutGrid className={`w-6 h-6 ${activeTab==='program' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">프로그램</span></button>
        <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='ranking' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><Trophy className={`w-6 h-6 ${activeTab==='ranking' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">랭킹</span></button>
        <button onClick={() => setActiveTab('profile')} className="flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16">
          {activeUser ? <div className={`border-2 rounded-full p-0.5 ${activeTab==='profile' ? 'border-[#4768ff] shadow-md scale-110' : 'border-transparent'}`}><FullBodyAvatar profile={activeUser.profile} bodyStats={activeUser.bodyStats} size="w-6 h-6" crop={true} /></div> : <User className={`w-6 h-6 ${activeTab==='profile' ? 'text-neutral-900 drop-shadow-md' : ''}`} />}
          <span className={`text-[10px] font-black tracking-wider ${activeTab==='profile' ? 'text-neutral-900' : 'text-neutral-500'}`}>프로필</span>
        </button>
      </div>
    </div>
  );
}
