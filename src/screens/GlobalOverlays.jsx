import React from 'react';
import { AdminConsole } from '../AdminConsole.jsx';
import { AlertTriangle, Bell, Camera, CheckCircle2, Dumbbell, Lightbulb, Share2, X, Zap } from 'lucide-react';
import * as cloud from '../cloud.js';
import { SmartExerciseThumbnail } from '../components/ExerciseVisuals.jsx';
import { MUSCLE_LABELS, getExerciseMuscles } from '../data/anatomy.js';
import { EXERCISE_OPTIONS, getExName } from '../data/catalog.js';
import { EXERCISE_GUIDES } from '../exerciseGuides.js';
import { FriendCenter } from '../FriendCenter.jsx';
import { PATTERNS } from '../movementPatterns.jsx';
import { PoseFigure } from '../poseFigure.jsx';
import { InstallSheet } from '../pwa.jsx';
import { FullBodyAvatar } from '../realAvatar.jsx';
import { ALARM_SOUNDS, REPEAT_OPTIONS, REST_OPTIONS } from '../restAlarm.js';
import { useApp } from '../appContext.js';

// 어느 화면에서나 위에 뜨는 창들: 운동 설명서, 앱 설치 안내, 알림 등
export function GlobalOverlays() {
  const {
    acceptFriend,
    activeUser,
    addExerciseFromModal,
    alarmRinging,
    cloudUser,
    currentDate,
    currentScreen,
    declineFriend,
    discardAndStart,
    exitWorkout,
    finishCelebration,
    friendState,
    getAlternativeExercises,
    goToSignup,
    guideExerciseId,
    inviteFriends,
    isAddExerciseModalOpen,
    isAlarmSettingsOpen,
    isExitConfirmOpen,
    isFriendSearchModalOpen,
    isInstallOpen,
    isPhotoCardModalOpen,
    isTimerActive,
    openPhotoCard,
    overtimeOn,
    overtimeSec,
    pendingWorkoutStart,
    photoCardData,
    photoCardTheme,
    previewAlarm,
    profilesById,
    quitAndSaveDone,
    removeFriendship,
    resumeWorkout,
    sendFriendRequest,
    session,
    setGuideExerciseId,
    setIsAlarmSettingsOpen,
    setIsExitConfirmOpen,
    setIsFriendSearchModalOpen,
    setIsInstallOpen,
    setIsPhotoCardModalOpen,
    setPendingWorkoutStart,
    setPhotoCardTheme,
    setSubstituteModalEx,
    showCelebration,
    showToast,
    stopAlarm,
    substituteModalEx,
    swapExercise,
    swapTargetExerciseId,
    timeLeft,
    timerSettings,
    toastMessage,
    updateTimerSettings,
    workoutDurationSec,
    workoutMinimized,
    amAdmin,
    adminMode,
    isAdminConsoleOpen,
    setIsAdminConsoleOpen,
    adminApiImpl,
    refreshNotice,
  } = useApp();
  return (
    <>
      <InstallSheet open={isInstallOpen} onClose={() => setIsInstallOpen(false)} onToast={showToast} />
      {amAdmin && <AdminConsole open={isAdminConsoleOpen && adminMode} onClose={() => setIsAdminConsoleOpen(false)} api={adminApiImpl} onToast={showToast} onNoticeChanged={refreshNotice} />}
      {guideExerciseId && (() => {
        const ex = EXERCISE_OPTIONS.find(e => e.id === guideExerciseId);
        const guide = EXERCISE_GUIDES[guideExerciseId];
        if (!ex || !guide) return null;
        const muscles = getExerciseMuscles(ex);
        const pattern = { ...PATTERNS[guide.pt], ...(guide.eq ? { equip: guide.eq } : {}) };
        const pickFromList = isAddExerciseModalOpen;
        return (
          <div className="fixed inset-0 bg-black/70 z-[96] flex flex-col justify-end animate-fade-in" onClick={() => setGuideExerciseId(null)}>
            <div className="bg-white text-neutral-900 w-full max-w-lg mx-auto h-[92vh] rounded-t-[36px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-neutral-100">
                <SmartExerciseThumbnail exerciseId={ex.id} size="w-14 h-14" showShadow={false} motion={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-[#4768ff] mb-0.5">운동 설명서</p>
                  <h2 className="text-xl font-black tracking-tight truncate">{ex.name}</h2>
                  <p className="text-xs font-bold text-neutral-400">{ex.target} · {ex.tool}</p>
                </div>
                <button onClick={() => setGuideExerciseId(null)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors active:scale-90 self-start"><X className="w-5 h-5 text-neutral-500"/></button>
              </div>

              <div className="flex-1 overflow-y-auto bg-neutral-50 px-5 py-5 space-y-5">
                <p className="text-sm font-bold text-neutral-600 leading-relaxed">{guide.sum}</p>

                <div className="flex flex-wrap gap-1.5">
                  {muscles.p.map(id => <span key={`p-${id}`} className="text-[11px] font-black text-white bg-[#e5484d] px-2 py-1 rounded-lg">{MUSCLE_LABELS[id]}</span>)}
                  {muscles.s.map(id => <span key={`s-${id}`} className="text-[11px] font-black text-[#c2373b] bg-[#fde3e1] px-2 py-1 rounded-lg">{MUSCLE_LABELS[id]}</span>)}
                </div>

                <div>
                  <h3 className="text-sm font-black text-neutral-900 mb-3">운동 방법</h3>
                  <ol className="space-y-3">
                    {guide.steps.map(([frame, title, desc, ghost], i) => (
                      <li key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                        <div className="relative bg-[#f6f7f9] border-b border-neutral-100">
                          <span className="absolute top-2.5 left-2.5 text-[11px] font-black text-white bg-neutral-900 px-2 py-0.5 rounded-md">{i + 1}단계</span>
                          <PoseFigure pattern={pattern} frame={frame} ghost={ghost} p={muscles.p} s={muscles.s} className="w-full h-auto max-h-56 mx-auto block" />
                        </div>
                        <div className="p-4">
                          <h4 className="font-black text-neutral-900 mb-1">{title}</h4>
                          <p className="text-sm font-medium text-neutral-600 leading-relaxed">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {guide.tips?.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <h3 className="text-sm font-black text-[#3550d6] mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4"/> 잘하는 요령</h3>
                    <ul className="space-y-1.5">
                      {guide.tips.map((tip, i) => <li key={i} className="text-sm font-medium text-neutral-700 leading-relaxed">• {tip}</li>)}
                    </ul>
                  </div>
                )}
                {guide.warn && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                    <h3 className="text-sm font-black text-rose-600 mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> 주의</h3>
                    <p className="text-sm font-medium text-neutral-700 leading-relaxed">{guide.warn}</p>
                  </div>
                )}
                <p className="text-[11px] font-bold text-neutral-400 text-center pb-2">빨간색은 주로 쓰는 근육, 연한 빨간색은 함께 쓰는 근육입니다. 파란 화살표는 움직이는 방향입니다.</p>
              </div>

              <div className="p-4 bg-white border-t border-neutral-100 flex gap-2">
                <button onClick={() => setGuideExerciseId(null)} className="flex-1 py-3.5 bg-neutral-100 text-neutral-600 font-black rounded-xl hover:bg-neutral-200 transition-colors active:scale-95">닫기</button>
                {pickFromList && (
                  <button onClick={() => { setGuideExerciseId(null); swapTargetExerciseId ? swapExercise(ex) : addExerciseFromModal(ex); }} className="flex-[2] py-3.5 bg-[#4768ff] text-white font-black rounded-xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] hover:bg-blue-600 transition-colors active:scale-95">{swapTargetExerciseId ? '이 종목으로 변경' : '이 종목 추가하기'}</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
        <FriendCenter open={isFriendSearchModalOpen} onClose={() => setIsFriendSearchModalOpen(false)} isCloud={!!cloudUser} onLogin={goToSignup}
          friends={friendState.friends} sent={friendState.sent} incoming={friendState.incoming} profilesById={profilesById}
          onSearch={async (q) => (await cloud.searchProfiles(q, cloudUser?.id)).map(p => cloud.toRankUser(p))}
          onRequest={sendFriendRequest} onAccept={acceptFriend} onDecline={declineFriend} onRemove={removeFriendship} onInvite={inviteFriends} Avatar3={FullBodyAvatar} />
        {alarmRinging && (
          <button onClick={stopAlarm} className="fixed left-1/2 -translate-x-1/2 bottom-36 z-[95] px-5 py-3 rounded-full bg-rose-500 text-white font-black text-sm shadow-[0_10px_30px_rgba(244,63,94,0.5)] flex items-center gap-2 animate-bounce">
            <Bell className="w-4 h-4" /> 알람 끄기
          </button>
        )}
        {isAlarmSettingsOpen && (
          <div className="fixed inset-0 bg-black/70 z-[90] flex flex-col justify-end animate-fade-in" onClick={() => { stopAlarm(); setIsAlarmSettingsOpen(false); }}>
            <div className="bg-neutral-900 text-white w-full max-w-md mx-auto rounded-t-[32px] p-6 pb-10 border-t border-neutral-800 animate-slide-up max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-4"><div className="w-12 h-1.5 bg-neutral-700 rounded-full"></div></div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-black flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-400" /> 휴식 알람 설정</h3>
                <button onClick={() => { stopAlarm(); setIsAlarmSettingsOpen(false); }} className="p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs font-bold text-neutral-500 mb-5">소리를 누르면 미리 들어볼 수 있어요.</p>

              <p className="text-xs font-black text-neutral-400 mb-2">알람 소리</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {ALARM_SOUNDS.map(a => (
                  <button key={a.id} onClick={() => { updateTimerSettings({ sound: a.id }); previewAlarm({ sound: a.id }); }}
                    className={`text-left p-3 rounded-2xl border transition-all active:scale-[0.97] ${timerSettings.sound === a.id ? 'bg-emerald-500/15 border-emerald-500' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600'}`}>
                    <div className="text-lg mb-0.5">{a.emoji}</div>
                    <div className="text-sm font-black">{a.label}</div>
                    <div className="text-[10px] font-bold text-neutral-500 leading-snug">{a.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-neutral-500 mb-5 leading-relaxed">음성 멘트는 기기에 내장된 음성으로 읽어 줘요. 실제 인물의 목소리는 아니에요. 아이폰은 무음 모드를 끄면 들려요.</p>

              <p className="text-xs font-black text-neutral-400 mb-2">울리는 길이</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {REPEAT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => updateTimerSettings({ repeat: o.value })} className={`py-2.5 rounded-xl border text-center transition-all ${timerSettings.repeat === o.value ? 'bg-emerald-500 text-neutral-950 border-emerald-500' : 'bg-neutral-950 border-neutral-800 text-neutral-300'}`}>
                    <div className="text-xs font-black">{o.label}</div>
                    <div className={`text-[10px] font-bold ${timerSettings.repeat === o.value ? 'text-neutral-800' : 'text-neutral-500'}`}>{o.desc}</div>
                  </button>
                ))}
              </div>

              <p className="text-xs font-black text-neutral-400 mb-2">소리 크기 <span className="text-neutral-500">{Math.round(timerSettings.volume * 100)}%</span></p>
              <input type="range" min="0.1" max="1" step="0.1" value={timerSettings.volume} onChange={e => updateTimerSettings({ volume: parseFloat(e.target.value) })} className="w-full accent-emerald-500 mb-5" />

              <p className="text-xs font-black text-neutral-400 mb-2">세트 완료 후 기본 휴식 시간</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {REST_OPTIONS.map(sec => (
                  <button key={sec} onClick={() => updateTimerSettings({ defaultRest: sec })} className={`py-2.5 rounded-xl border text-xs font-black transition-all ${timerSettings.defaultRest === sec ? 'bg-emerald-500 text-neutral-950 border-emerald-500' : 'bg-neutral-950 border-neutral-800 text-neutral-300'}`}>{sec >= 60 ? `${sec / 60}분` : `${sec}초`}</button>
                ))}
              </div>

              {[['countdown', '끝나기 3초 전 카운트다운', '3·2·1 짧은 신호음'], ['vibrate', '진동', '안드로이드 휴대폰에서 지원돼요']].map(([key, label, desc]) => (
                <button key={key} onClick={() => updateTimerSettings({ [key]: !timerSettings[key] })} className="w-full flex items-center justify-between py-3 border-t border-neutral-800">
                  <span className="text-left"><span className="block text-sm font-black">{label}</span><span className="block text-[11px] font-bold text-neutral-500">{desc}</span></span>
                  <span className={`w-12 h-7 rounded-full p-1 transition-colors ${timerSettings[key] ? 'bg-emerald-500' : 'bg-neutral-700'}`}><span className={`block w-5 h-5 rounded-full bg-white transition-transform ${timerSettings[key] ? 'translate-x-5' : ''}`} /></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {isExitConfirmOpen && (() => {
          const doneSets = session.reduce((n, ex) => n + (ex.sets || []).filter(st => st.completed).length, 0);
          return (
          <div className="fixed inset-0 bg-black/80 z-[85] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsExitConfirmOpen(false)}>
            <div className="bg-[#060b10] border border-rose-500/40 rounded-[32px] p-6 max-w-sm w-full text-white shadow-[0_0_30px_rgba(244,63,94,0.2)] animate-scale-up" onClick={e => e.stopPropagation()}>
              <div className="text-3xl mb-2">🏳️</div>
              <h3 className="text-xl font-black mb-2">오늘 운동은 여기까지 할까요?</h3>
              <p className="text-sm font-bold text-neutral-400 mb-6 leading-relaxed">{doneSets > 0 ? `지금까지 완료한 ${doneSets}세트는 기록으로 남길 수 있어요.` : '아직 완료한 세트가 없어서 남길 기록이 없어요.'}</p>
              <div className="flex flex-col gap-2">
                {doneSets > 0 && <button onClick={quitAndSaveDone} className="w-full py-3.5 bg-emerald-400 text-black font-black rounded-xl active:scale-95 transition-transform shadow-[0_0_18px_rgba(16,185,129,0.5)]">완료한 {doneSets}세트만 저장하고 끝내기</button>}
                <button onClick={exitWorkout} className="w-full py-3.5 bg-black border border-rose-500/50 text-rose-400 font-black rounded-xl active:scale-95 transition-transform">기록 버리고 끝내기</button>
                <button onClick={() => setIsExitConfirmOpen(false)} className="w-full py-3 text-neutral-400 font-black text-sm">계속 운동하기</button>
              </div>
            </div>
          </div>
          );
        })()}

        {workoutMinimized && currentScreen !== 'workout' && (() => {
          const allSets = session.reduce((n, ex) => n + (ex.sets || []).length, 0);
          const doneSets = session.reduce((n, ex) => n + (ex.sets || []).filter(st => st.completed).length, 0);
          const curEx = session.find(ex => (ex.sets || []).some(st => !st.completed)) || session[session.length - 1];
          const mm = `${Math.floor(workoutDurationSec / 60)}:${(workoutDurationSec % 60).toString().padStart(2, '0')}`;
          return (
            <div className={`fixed left-3 right-3 z-[45] max-w-md mx-auto ${currentScreen === 'home' ? 'bottom-[92px]' : 'bottom-4'} animate-slide-up`}>
              <style>{`@keyframes miniFlash { 0%,100% { color: #fb7185; } 50% { color: #fde047; } } .mini-ot { animation: miniFlash .7s ease-in-out infinite; }`}</style>
              <div className="flex items-center gap-2 bg-[#03060a]/95 backdrop-blur-md border border-emerald-400/50 rounded-2xl pl-2.5 pr-1.5 py-2 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                <button onClick={resumeWorkout} className="flex-1 min-w-0 flex items-center gap-2.5 text-left active:scale-[0.98] transition-transform">
                  <span className="relative w-10 h-10 flex-shrink-0 rounded-xl bg-black border border-emerald-400/50 flex items-center justify-center"><Dumbbell className="w-5 h-5 text-emerald-300" /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black text-emerald-400 tracking-widest">운동 중 · {mm}</span>
                    <span className="block text-sm font-black text-white truncate">{curEx ? getExName(curEx) : '운동'} <span className="text-neutral-400 font-bold">· {doneSets}/{allSets}세트</span></span>
                  </span>
                </button>
                {overtimeOn ? (
                  <span className="text-xs font-black font-mono mini-ot flex-shrink-0">+{Math.floor(overtimeSec / 60)}:{(overtimeSec % 60).toString().padStart(2, '0')}</span>
                ) : (isTimerActive || timeLeft > 0) ? (
                  <span className="text-xs font-black font-mono text-yellow-300 flex-shrink-0">휴식 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                ) : null}
                <button onClick={resumeWorkout} className="px-3 py-2 rounded-xl bg-emerald-400 text-black font-black text-xs flex-shrink-0 shadow-[0_0_14px_rgba(16,185,129,0.6)] active:scale-95 transition-transform">복귀</button>
                <button onClick={() => setIsExitConfirmOpen(true)} aria-label="운동 끝내기" className="p-1.5 text-neutral-500 hover:text-white flex-shrink-0"><X className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })()}
        {pendingWorkoutStart && (
          <div className="fixed inset-0 bg-black/70 z-[86] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setPendingWorkoutStart(null)}>
            <div className="bg-[#060b10] border border-emerald-500/40 rounded-[32px] p-6 max-w-sm w-full text-white shadow-[0_0_30px_rgba(16,185,129,0.25)] animate-scale-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black mb-2">진행 중인 운동이 있어요</h3>
              <p className="text-sm font-bold text-neutral-400 mb-6 leading-relaxed">새 운동을 시작하면 지금 기록 중인 운동({session.length}종목)은 저장되지 않고 사라져요.</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => { setPendingWorkoutStart(null); resumeWorkout(); }} className="w-full py-3.5 bg-emerald-400 text-black font-black rounded-xl active:scale-95 transition-transform shadow-[0_0_18px_rgba(16,185,129,0.5)]">진행 중인 운동으로 돌아가기</button>
                <button onClick={discardAndStart} className="w-full py-3.5 bg-black border border-rose-500/50 text-rose-400 font-black rounded-xl active:scale-95 transition-transform">지금 운동 버리고 새로 시작</button>
              </div>
            </div>
          </div>
        )}
        {toastMessage && (
          <div className="fixed top-16 left-0 right-0 z-[100] flex justify-center pointer-events-none animate-slide-down">
            <div className="bg-emerald-500 text-neutral-950 font-black px-6 py-3 rounded-full shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center gap-2 text-sm border border-emerald-400"><CheckCircle2 className="w-5 h-5"/> {toastMessage}</div>
          </div>
        )}

        {showCelebration && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300">
            <div className="text-center flex flex-col items-center">
              <CheckCircle2 className="w-28 h-28 text-emerald-500 mx-auto mb-5 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce" />
              <h2 className="text-5xl font-black text-white drop-shadow-lg tracking-tight">오운완!</h2>
              <p className="text-emerald-400 font-bold mt-3 text-lg bg-emerald-950/50 px-4 py-2 rounded-full border border-emerald-900/50 mb-6">기록이 성공적으로 저장되었습니다.</p>
              <button onClick={() => { openPhotoCard(currentDate); finishCelebration(); }} className="bg-gradient-to-r from-emerald-400 to-blue-500 text-neutral-950 font-black px-6 py-3.5 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-base active:scale-95 pointer-events-auto"><Camera className="w-5 h-5"/> 오운완 SNS 인증카드 만들기</button>
              <button onClick={finishCelebration} className="mt-3 text-sm font-bold text-neutral-400 hover:text-white px-4 py-2 transition-colors">홈으로 가기</button>
            </div>
          </div>
        )}

        {substituteModalEx && (() => {
          const altList = getAlternativeExercises(substituteModalEx);
          return (
            <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setSubstituteModalEx(null)}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 max-w-sm w-full text-white relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSubstituteModalEx(null)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-black text-sm"><Zap className="w-5 h-5 fill-amber-400"/><span>기구 대기시간 절약</span></div>
                <h3 className="text-xl font-black mb-1">[{getExName(substituteModalEx)}] 대체 운동</h3>
                <p className="text-xs text-neutral-400 font-bold mb-5">동일한 타겟 자극 부위를 훈련할 수 있는 다른 기구/도구 추천</p>
                <div className="space-y-3 mb-6">
                  {altList.length > 0 ? altList.map((altEx) => (
                      <div key={`alt-${altEx.id}`} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 flex justify-between items-center hover:border-amber-500/50 transition-all">
                        <div className="flex items-center gap-3">
                          <SmartExerciseThumbnail exerciseId={altEx.id} target={altEx.target} tool={altEx.tool} size="w-12 h-12" showShadow={false}/>
                          <div><div className="font-black text-base text-white">{altEx.name}</div><div className="text-[10px] font-bold text-neutral-400">{altEx.target} · {altEx.tool}</div></div>
                        </div>
                        <button onClick={() => swapExercise(altEx, substituteModalEx.id)} className="px-3 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-neutral-950 font-black text-xs rounded-xl border border-amber-500/40 transition-all active:scale-95">교체하기</button>
                      </div>
                    )) : (<div className="text-center py-8 text-neutral-500 font-bold text-sm">추천할 대체 운동이 없습니다.</div>)}
                </div>
                <button onClick={() => setSubstituteModalEx(null)} className="w-full bg-neutral-800 text-neutral-300 font-black py-3.5 rounded-xl text-sm hover:bg-neutral-700 transition-colors">닫기</button>
              </div>
            </div>
          );
        })()}

        {isPhotoCardModalOpen && photoCardData && (
          <div className="fixed inset-0 bg-black/85 z-[95] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={() => setIsPhotoCardModalOpen(false)}>
            <div className="max-w-xs w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
               <div className="flex gap-2 bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800 mb-4 shadow-lg">
                  <button onClick={() => setPhotoCardTheme('neon')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${photoCardTheme === 'neon' ? 'bg-emerald-500 text-neutral-950 shadow' : 'text-neutral-400'}`}>다크 네온</button>
                  <button onClick={() => setPhotoCardTheme('clean')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${photoCardTheme === 'clean' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400'}`}>클린 화이트</button>
                  <button onClick={() => setPhotoCardTheme('cyber')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${photoCardTheme === 'cyber' ? 'bg-purple-500 text-white shadow' : 'text-neutral-400'}`}>사이버 보라</button>
               </div>
               <div className={`w-full aspect-[9/14] rounded-[36px] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border transition-all ${photoCardTheme === 'neon' ? 'bg-neutral-950 text-white border-emerald-500/30' : photoCardTheme === 'clean' ? 'bg-white text-neutral-900 border-neutral-200' : 'bg-gradient-to-br from-neutral-950 via-purple-950 to-neutral-900 text-white border-purple-500/40'}`}>
                  <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${photoCardTheme === 'neon' ? 'bg-emerald-500/20' : photoCardTheme === 'clean' ? 'bg-blue-500/10' : 'bg-purple-500/30'}`}></div>
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                       <div className="text-[11px] font-black uppercase tracking-widest opacity-60">GYM SPIRIT</div>
                       <h3 className="text-2xl font-black tracking-tight mt-0.5">오운완 인증🔥</h3>
                       <p className="text-xs font-bold opacity-70">{photoCardData.date}</p>
                     </div>
                     <div className="w-9 h-9 bg-neutral-900/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10"><Dumbbell className={`w-5 h-5 ${photoCardTheme === 'neon' ? 'text-emerald-400' : photoCardTheme === 'cyber' ? 'text-purple-400' : 'text-blue-600'}`}/></div>
                  </div>
                  <div className="relative z-10 flex justify-center my-2"><div className="w-36 h-48 drop-shadow-2xl"><FullBodyAvatar profile={activeUser?.profile} bodyStats={activeUser?.bodyStats} size="w-full h-full" pose="flex" /></div></div>
                  <div className="relative z-10 space-y-3">
                     <div className={`grid grid-cols-2 gap-2 p-3 rounded-2xl border backdrop-blur-md ${photoCardTheme === 'clean' ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-white/10'}`}>
                        <div className="text-center"><span className="text-[9px] font-bold opacity-60 block">총 운동 볼륨</span><span className="text-lg font-black">{photoCardData.totalVolume.toLocaleString()}kg</span></div>
                        <div className="text-center"><span className="text-[9px] font-bold opacity-60 block">수행 종목</span><span className="text-lg font-black">{photoCardData.workoutCount}개 종목</span></div>
                     </div>
                     <div className="flex flex-wrap gap-1">
                        {photoCardData.exercises.slice(0, 4).map((exName, idx) => (
                          <span key={`card-ex-${idx}`} className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${photoCardTheme === 'clean' ? 'bg-neutral-100 border-neutral-200 text-neutral-700' : 'bg-white/10 border-white/10 text-neutral-200'}`}>{exName}</span>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="flex gap-2 w-full mt-4">
                 <button onClick={() => { showToast("📸 오운완 카드가 이미지로 저장되었습니다!"); setIsPhotoCardModalOpen(false); }} className="flex-1 bg-emerald-500 text-neutral-950 font-black py-3.5 rounded-2xl shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"><Share2 className="w-4 h-4"/> 카드 공유/저장</button>
                 <button onClick={() => setIsPhotoCardModalOpen(false)} className="p-3.5 bg-neutral-900 text-neutral-400 hover:text-white rounded-2xl border border-neutral-800 transition-colors"><X className="w-5 h-5"/></button>
               </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
          @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}} />
    </>
  );
}
