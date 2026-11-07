import React, { useState } from 'react';
import { Bell, BookOpen, Camera, Check, Clock, Dumbbell, Flame, History, MoreVertical, Pause, Play, Plus, RotateCw, Save, Search, Settings, Target, Trash2, X, Zap } from 'lucide-react';
import { EmergencyExitIcon, SmartExerciseThumbnail } from '../components/ExerciseVisuals.jsx';
import { EXERCISE_OPTIONS, SET_TYPE_LABEL, SET_TYPE_STYLE, getExId, getExName, getExTarget, ruleOfEx, toolOfEx } from '../data/catalog.js';
import { calculate1RM } from '../lib/dates.js';
import { ALARM_SOUNDS, unlockAudio } from '../restAlarm.js';
import { StopwatchDial } from '../StopwatchDial.jsx';
import { formatPlates, platesFor, setLoad, sideWeight } from '../weightRules.js';
import { RPE_SCALE, rpeMeaning, rpeTone } from '../lib/rpe.js';
import { GlobalOverlays } from './GlobalOverlays.jsx';
import { useApp } from '../appContext.js';

// 운동 기록 중 화면 (세트 입력·휴식 타이머·운동 완료)
// 종목 고르기 필터: '승모'는 승모근 위쪽 종목(슈러그·업라이트 로우)만 모아 보여 준다
const TRAP_IDS = /shrug|uprow|upright/;
const matchesCategory = (ex, cat) => {
  if (cat === '전체') return true;
  const t = String(ex.target);
  if (cat === '승모') return t.includes('상부승모') || (t.includes('승모') && TRAP_IDS.test(String(ex.id)));
  return t.includes(cat);
};
// 검색: 이름뿐 아니라 부위(예: 승모)·기구(예: 스미스·덤벨)로도 찾는다
const matchesSearch = (ex, q) => {
  const k = String(q || '').trim();
  if (!k) return true;
  return `${ex.name} ${ex.target} ${ex.tool}`.includes(k);
};

// 다음 무게 추천 상자 모양
const SUGGEST_LOOK = {
  up: { icon: '📈', label: '오늘 추천', title: 'text-emerald-300', box: 'bg-emerald-500/10 border-emerald-500/40', btn: 'bg-emerald-400 text-black' },
  reps: { icon: '➕', label: '오늘 추천', title: 'text-sky-300', box: 'bg-sky-500/10 border-sky-500/40', btn: 'bg-sky-400 text-black' },
  same: { icon: '🎯', label: '오늘 추천', title: 'text-yellow-200', box: 'bg-yellow-400/10 border-yellow-400/40', btn: 'bg-yellow-300 text-black' },
  deload: { icon: '🔄', label: '디로드 추천', title: 'text-violet-300', box: 'bg-violet-500/10 border-violet-500/40', btn: 'bg-violet-400 text-black' },
  rest: { icon: '🛌', label: '회복 우선', title: 'text-rose-300', box: 'bg-rose-500/10 border-rose-500/40', btn: 'bg-rose-400 text-black' },
};

export function WorkoutScreen() {
  const {
    requestSaveWorkout,
    addExerciseFromModal,
    addSet,
    adjustTimer,
    applySuggestion,
    bodyWeightKg,
    getNextSuggestion,
    prCelebration,
    cycleSetType,
    exCategoryFilter,
    exSearchQuery,
    exerciseHistoryModal,
    exerciseOptionsModal,
    getExerciseLogsHistory,
    getPreviousRecord,
    isAddExerciseModalOpen,
    isTimerActive,
    maxTime,
    minimizeWorkout,
    onTimerPagerScroll,
    overtimeOn,
    overtimeSec,
    plateVisualizerModal,
    removeExercise,
    removeSet,
    scrollTimerPage,
    session,
    setExCategoryFilter,
    setExSearchQuery,
    setExerciseHistoryModal,
    setExerciseOptionsModal,
    setGuideExerciseId,
    setIsAddExerciseModalOpen,
    setIsAlarmSettingsOpen,
    setIsExitConfirmOpen,
    setIsTimerActive,
    setOvertimeSec,
    setPlateVisualizerModal,
    setSubstituteModalEx,
    setSwapTargetExerciseId,
    setVolume,
    showToast,
    startRest,
    stopAlarm,
    rpeInfo,
    swapExercise,
    swapTargetExerciseId,
    timeLeft,
    timerPage,
    timerPagerRef,
    timerSettings,
    toggleSetComplete,
    triggerSaveWorkout,
    updateSet,
    workoutDurationSec,
    setFormCheck,
  } = useApp();
  const formattedWorkoutTime = `${Math.floor(workoutDurationSec / 3600).toString().padStart(2, '0')}:${Math.floor((workoutDurationSec % 3600) / 60).toString().padStart(2, '0')}:${(workoutDurationSec % 60).toString().padStart(2, '0')}`;
  const currentSessionVolume = session.reduce((total, ex) => total + (ex.sets || []).reduce((sum, s) => {
    if (s.completed && s.reps) return sum + setVolume(ex, s);
    return sum;
  }, 0), 0);
  // RPE 칸 색: 직접 고른 값은 진하게, 앱이 추정한 값은 흐리게
  const RPE_TONE = {
    hard: 'bg-rose-950/40 text-rose-400 border-rose-900/50 shadow-[0_0_10px_rgba(225,29,72,0.2)]',
    mid: 'bg-amber-950/40 text-amber-400 border-amber-900/50 shadow-[0_0_10px_rgba(217,119,6,0.2)]',
    easy: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    none: 'bg-neutral-900/50 text-neutral-400 border-neutral-800',
  };
  const [rpePick, setRpePick] = useState(null); // RPE 고르는 중인 세트 id
  return (
    <div className="min-h-screen bg-[#03060a] text-neutral-100 pb-32 flex flex-col relative animate-fade-in">
      {prCelebration && (
        // 신기록 축하: 화면 위쪽에 잠깐 떴다 사라진다
        <div key={prCelebration.id} className="fixed top-16 inset-x-0 z-[85] flex justify-center px-4 pointer-events-none">
          <div className="gs-pr-pop relative max-w-sm w-full rounded-[24px] p-4 pl-5 border border-amber-300/70 bg-gradient-to-br from-[#2a1b02] via-[#1a1203] to-[#0b0802] shadow-[0_0_40px_rgba(251,191,36,0.55)] overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-400/30 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="text-4xl gs-pr-medal">🏅</span>
              <div className="min-w-0">
                <div className="text-[11px] font-black tracking-widest text-amber-300">NEW PERSONAL RECORD</div>
                <div className="text-lg font-black text-white leading-tight break-keep">신기록! {prCelebration.name}</div>
                {prCelebration.items.map(p => (
                  <div key={p.kind} className="text-[12px] font-bold text-amber-100/90 mt-0.5">{p.label} <span className="text-white font-black">{p.value}</span> <span className="text-amber-200/60">(이전 {p.prev})</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <GlobalOverlays />
      {/* 트론 테마: 에메랄드 격자 + 위쪽 에메랄드·아래쪽 노란 광원 */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(16,185,129,0.14), transparent 70%), radial-gradient(ellipse 70% 30% at 50% 100%, rgba(250,204,21,0.08), transparent 70%), linear-gradient(rgba(16,185,129,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.07) 1px, transparent 1px)', backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px' }} />
      <header className="bg-[#03060a]/85 backdrop-blur-md px-4 py-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="absolute left-0 right-0 -bottom-px h-[2px] bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
        <button onClick={minimizeWorkout} aria-label="운동 잠깐 나가기 (최소화)" title="잠깐 나가기 · 운동은 계속 기록돼요" className="p-1 rounded-xl bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 active:scale-90 transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)]"><EmergencyExitIcon className="w-9 h-9" /></button>
        <div className="flex items-center gap-3">
          {currentSessionVolume > 0 && (<div className="text-sm font-black text-yellow-300 tracking-tight bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/40 shadow-[0_0_12px_rgba(250,204,21,0.35)] animate-fade-in">{currentSessionVolume.toLocaleString()} <span className="text-[10px]">kg</span></div>)}
          <div className="font-black text-base text-emerald-300 tracking-wider flex items-center gap-1.5 bg-black px-3 py-1 rounded-xl border border-emerald-400/50 shadow-[0_0_14px_rgba(16,185,129,0.45)] [text-shadow:0_0_8px_rgba(16,185,129,0.8)]"><Clock className="w-4 h-4 animate-pulse"/> {formattedWorkoutTime}</div>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(window.location.href)?.catch(() => {}); showToast("운동 루틴 링크가 클립보드에 복사되었습니다!"); }} className="text-xs font-bold text-yellow-300 bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/40 active:scale-95">공유</button>
      </header>

      <main className="max-w-md mx-auto w-full p-4 space-y-6 flex-1 mt-2 relative z-10">
        {session.length === 0 ? (
          <div className="text-center py-24 opacity-60 flex flex-col items-center">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-5 border border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.4)]"><Dumbbell className="w-10 h-10 text-emerald-400" /></div>
            <p className="font-black text-neutral-300 text-xl mb-2">운동을 시작해볼까요?</p>
            <p className="font-medium text-neutral-500 text-sm">하단의 버튼을 눌러 종목을 추가하세요.</p>
          </div>
        ) : (
          session.map((ex) => {
            const max1RM = (ex.sets || []).filter(s => s.completed && s.type === '-' && s.weight && s.reps).reduce((max, s) => Math.max(max, calculate1RM(s.weight, s.reps)), 0);
            const exNameStr = getExName(ex);
            const exTargetStr = getExTarget(ex);
            const exIdStr = getExId(ex);
            const exToolStr = ex.exercise && ex.exercise.tool ? String(ex.exercise.tool) : '바벨';
            const exRule = ruleOfEx(ex);
            return (
              <div key={ex.id} className="bg-[#060b10]/95 rounded-[28px] p-5 border border-emerald-500/30 shadow-[0_0_28px_rgba(16,185,129,0.12),inset_0_0_24px_rgba(16,185,129,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_14px_rgba(16,185,129,1)]" />
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-300/80 rounded-tl-md shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-300/80 rounded-br-md shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                <div className="flex justify-between items-start gap-2 mb-5 border-b border-emerald-500/15 pb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                     <SmartExerciseThumbnail exerciseId={exIdStr} target={exTargetStr} tool={exToolStr} showShadow={false} size="w-14 h-14" />
                     <div className="min-w-0">
                       <button onClick={() => { setSwapTargetExerciseId(ex.id); setIsAddExerciseModalOpen(true); }} className="text-left active:scale-95 transition-transform group flex items-center gap-1.5 max-w-full">
                         <h2 className="text-lg leading-tight font-black text-white break-keep group-hover:text-emerald-300 transition-colors [text-shadow:0_0_10px_rgba(16,185,129,0.35)]">{exNameStr}</h2>
                         <Settings className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                       </button>
                       <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                         <span className="text-[11px] font-bold text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]">{exTargetStr}</span>
                         <span className="text-[11px] font-bold text-yellow-200/90 bg-yellow-400/5 px-2 py-0.5 rounded-md border border-yellow-400/30 whitespace-nowrap">⚖️ {exRule.hint}</span>
                         <button onClick={() => setGuideExerciseId(exIdStr)} className="text-[11px] font-black text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-900/60 hover:bg-blue-500/20 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"><BookOpen className="w-3 h-3"/> 설명</button>
                         <button onClick={() => setSubstituteModalEx(ex)} className="text-[11px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-900/60 hover:bg-amber-500/20 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap" title="기구 대기 시 대체 운동 추천"><Zap className="w-3 h-3 fill-amber-400"/> 대체</button>
                         {max1RM > 0 && <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1"><Target className="w-3 h-3"/> 1RM <span className="text-white bg-neutral-800 px-1.5 py-0.5 rounded">{max1RM}kg</span></span>}
                       </div>
                     </div>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <button onClick={() => setExerciseOptionsModal(ex.id)} className="text-neutral-500 hover:text-white transition-colors p-2 rounded-full hover:bg-neutral-800 active:scale-90"><MoreVertical className="w-6 h-6"/></button>
                  </div>
                </div>
                {(() => {
                  // 다음 무게 추천 (아직 다 안 한 종목만)
                  if (ex.sets.length && ex.sets.every(st => st.completed)) return null;
                  const sug = getNextSuggestion(ex);
                  if (!sug) return null;
                  const look = SUGGEST_LOOK[sug.kind] || SUGGEST_LOOK.reps;
                  return (
                    <div className={`-mt-1 mb-4 rounded-2xl border px-3 py-2.5 flex items-center gap-3 ${look.box}`}>
                      <span className="text-xl leading-none">{look.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] font-black ${look.title}`}>{look.label} · {sug.text}{sug.rpe ? <span className="opacity-70"> · RPE {sug.rpe}</span> : null}</div>
                        <div className="text-[10px] font-bold text-neutral-400 leading-snug mt-0.5 break-keep">{sug.why}</div>
                      </div>
                      <button onClick={() => applySuggestion(ex.id)} className={`flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 transition-transform ${look.btn}`}>적용</button>
                    </div>
                  );
                })()}
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-center text-[10px] font-black text-emerald-400/60 tracking-widest mb-1 px-1">
                    <div className="col-span-2">세트 ↻</div><div className="col-span-3">{exRule.label}</div><div className="col-span-3">REPS</div><div className="col-span-2">RPE</div><div className="col-span-2">DONE</div>
                  </div>
                  {ex.sets.map((set, setIndex) => {
                    const plateCalc = platesFor(exRule, set.weight);
                    const realLoad = (exRule.key === 'bodyweight' || exRule.key === 'assist') && bodyWeightKg > 0 ? setLoad(exIdStr, toolOfEx(ex), set.weight, bodyWeightKg) : null;
                    const isDropSet = set.type === 'D';
                    const prevSet = getPreviousRecord(exIdStr, setIndex);
                    const info = rpeInfo(ex, set);
                    const setRpe = info?.rpe ?? null;
                    return (
                      <div key={set.id} className="relative group/set">
                        <div className={`grid grid-cols-12 gap-2 items-center transition-all duration-300 ${set.completed ? 'opacity-50' : 'opacity-100'} ${isDropSet ? 'bg-rose-950/20 border border-rose-900/50 p-2 -mx-2 rounded-xl' : ''}`}>
                          <button onClick={() => cycleSetType(ex.id, set.id)} title="누르면 워밍업 → 메인 → 드랍으로 바뀌어요" className={`col-span-2 h-[50px] rounded-xl flex flex-col items-center justify-center leading-none transition-colors active:scale-95 border ${SET_TYPE_STYLE[set.type] || SET_TYPE_STYLE['-']}`}>
                            <span className="text-lg font-black tabular-nums">{ex.sets.slice(0, setIndex + 1).filter(st => (st.type || '-') === (set.type || '-')).length}</span>
                            <span className="text-[9px] font-black mt-1 tracking-tight">{SET_TYPE_LABEL[set.type] || '메인'}</span>
                          </button>
                          <div className="col-span-3"><input type="number" inputMode="decimal" placeholder={exRule.placeholder} value={set.weight ?? ''} onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)} className="w-full bg-black text-white text-center font-black rounded-xl py-3 outline-none border border-emerald-500/25 focus:border-emerald-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.5)] transition-all text-lg placeholder:text-neutral-700" /></div>
                          <div className="col-span-3"><input type="number" placeholder="0" value={set.reps ?? ''} onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)} className="w-full bg-black text-white text-center font-black rounded-xl py-3 outline-none border border-emerald-500/25 focus:border-emerald-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.5)] transition-all text-lg placeholder:text-neutral-700" /></div>
                          <div className="col-span-2">
                            <button onClick={() => setRpePick(p => (p === set.id ? null : set.id))} aria-label="RPE 고르기"
                              className={`w-full h-[50px] rounded-xl border flex flex-col items-center justify-center leading-none transition-colors active:scale-95 ${String(set.rpe || '').trim() ? RPE_TONE[rpeTone(set.rpe)] : RPE_TONE.none} ${set.rpeAuto ? 'opacity-70' : ''} ${rpePick === set.id ? 'ring-2 ring-emerald-300' : ''}`}>
                              {String(set.rpe || '').trim()
                                ? <><span className="text-sm font-black tabular-nums">{set.rpeAuto ? '≈' : ''}{set.rpe}</span><span className="text-[8px] font-black mt-1 opacity-80">{set.rpeAuto ? '추정' : (rpeMeaning(set.rpe)?.short || '')}</span></>
                                : setRpe !== null ? <><span className="text-sm font-black text-neutral-500 tabular-nums">≈{setRpe}</span><span className="text-[8px] font-black mt-1 text-neutral-600">예상</span></>
                                : <span className="text-sm font-black text-neutral-600">-</span>}
                            </button>
                          </div>
                          <div className="col-span-2 flex justify-center relative">
                             <button onClick={() => toggleSetComplete(ex.id, set.id)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-75 z-10 relative ${set.completed ? 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.8)]' : 'bg-black text-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-500/30'}`}><Check className="w-6 h-6 stroke-[3]" /></button>
                             <button onClick={() => removeSet(ex.id, set.id)} className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-rose-500 transition-all opacity-0 group-hover/set:opacity-100 bg-neutral-900 rounded-full shadow-md"><X className="w-4 h-4"/></button>
                          </div>
                        </div>
                        <div className="flex justify-between items-start gap-2 px-2 mt-2 mb-4 min-h-[16px]">
                          <span className="flex-1 min-w-0 text-[10px] text-neutral-500 font-bold leading-snug">{set.completed && Array.isArray(set.pr) && set.pr.length > 0 && <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/50 text-amber-300 font-black">🏅 신기록</span>}{prevSet ? `이전: ${prevSet.weight}kg x ${prevSet.reps}회` : ''}{info?.over && <span className="ml-1.5 text-amber-300/90">· 예상보다 많이 했어요 💪 RPE 를 직접 골라 주세요</span>}
                            {!(parseInt(set.reps, 10) > 0) && info?.max > 0 && (() => {
                              const max = Math.max(1, Math.floor(info.max));
                              return <span className="ml-1.5 text-emerald-400/80">· 이 무게 최대 약 {max}회 · RPE 8(2개 남기기) ≈ {Math.max(1, max - 2)}회</span>;
                            })()}
                            {setRpe !== null && !info?.over && parseInt(set.reps, 10) > 0 && (set.rpeAuto || !String(set.rpe || '').trim()) && <span className="ml-1.5 text-emerald-400/70">· 예상 RPE {setRpe} (지금 1RM 약 {info.rm}kg 기준)</span>}</span>
                          {realLoad !== null && realLoad !== (parseFloat(set.weight) || 0) && (
                            <span className="text-[10px] font-bold text-sky-300">실제 부하 {realLoad}kg {exRule.key === 'assist' ? '(체중 − 보조)' : '(체중 포함)'}</span>
                          )}
                          {plateCalc.length > 0 && (
                            <button onClick={() => setPlateVisualizerModal({ weight: set.weight, plates: plateCalc, rule: exRule })} className="flex gap-1 justify-end items-center opacity-70 hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-bold text-yellow-300">{exRule.plates === 'both' ? `한쪽 ${sideWeight(plateCalc)}kg` : `원판 ${sideWeight(plateCalc)}kg`}</span>
                              <span className="text-[10px] font-black bg-yellow-400/10 text-yellow-200 border border-yellow-400/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(250,204,21,0.3)]">{formatPlates(plateCalc)}</span>
                            </button>
                          )}
                        </div>
                        {rpePick === set.id && (
                          <div className="-mt-2 mb-4 rounded-2xl border border-emerald-500/30 bg-black/60 p-3 animate-fade-in">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-black text-emerald-300">이 세트 얼마나 힘들었나요? (RPE)</span>
                              <button onClick={() => setRpePick(null)} aria-label="닫기" className="p-1 text-neutral-500"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {RPE_SCALE.map(o => {
                                const on = !set.rpeAuto && parseFloat(set.rpe) === o.v;
                                return (
                                  <button key={o.v} onClick={() => { updateSet(ex.id, set.id, 'rpe', String(o.v)); setRpePick(null); }}
                                    className={`rounded-xl py-2 border flex flex-col items-center leading-none active:scale-95 transition-transform ${on ? 'bg-emerald-400 text-black border-emerald-300' : `${RPE_TONE[rpeTone(o.v)]}`}`}>
                                    <span className="text-sm font-black tabular-nums">{o.v}</span>
                                    <span className="text-[9px] font-black mt-1 opacity-80">{o.short}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[10px] font-bold text-neutral-400 mt-2 leading-snug">
                              RPE = 10 − 남은 반복. {setRpe !== null ? `무게·횟수로 본 예상은 ${setRpe} (${rpeMeaning(setRpe)?.text})예요. ` : ''}직접 고른 RPE 가 있어야 다음 무게 추천에 반영돼요.
                            </div>
                            {String(set.rpe || '').trim() && <button onClick={() => { updateSet(ex.id, set.id, 'rpe', ''); setRpePick(null); }} className="mt-2 text-[11px] font-black text-neutral-500">RPE 지우기</button>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => addSet(ex.id)} className="w-full py-3.5 rounded-xl border-2 border-dashed border-emerald-500/30 text-emerald-400 font-black hover:text-emerald-200 hover:border-emerald-300 hover:bg-emerald-400/5 transition-all active:scale-[0.98] mt-2">+ 세트 추가</button>
              </div>
            );
          })
        )}
      </main>

      <div className="max-w-md mx-auto w-full px-4 mb-6 relative z-10">
        <button onClick={() => { setSwapTargetExerciseId(null); setIsAddExerciseModalOpen(true); }} className="w-full bg-black text-yellow-300 font-black py-4 rounded-2xl mb-4 h-14 hover:bg-yellow-400/5 transition-colors active:scale-[0.98] shadow-[0_0_18px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 border border-yellow-400/50"><Plus className="w-5 h-5"/> 종목 추가하기</button>
        <button onClick={requestSaveWorkout} className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 h-14 transition-all active:scale-[0.98] text-lg ${session.length > 0 ? 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.6)]' : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'}`}><Save className="w-5 h-5 stroke-[3]"/> 훈련 완료 및 저장</button>
        {session.length > 0 && <button onClick={() => setIsExitConfirmOpen(true)} className="w-full mt-3 py-3 text-sm font-black text-rose-400/80 hover:text-rose-300 transition-colors">🏳️ 운동 그만두기</button>}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 bg-[#03060a]/95 backdrop-blur-xl border-t p-5 rounded-t-[32px] transform transition-transform duration-500 z-40 ${overtimeOn ? 'ot-border' : 'border-emerald-400/40 shadow-[0_-10px_40px_rgba(16,185,129,0.18)]'} ${isTimerActive || timeLeft > 0 || overtimeOn ? 'translate-y-0' : 'translate-y-full'}`}>
        <style>{`
          @keyframes otFlash { 0%,100% { color: #fb7185; text-shadow: 0 0 14px rgba(251,113,133,.95); } 50% { color: #fde047; text-shadow: 0 0 20px rgba(250,204,21,1); } }
          @keyframes otBorder { 0%,100% { border-color: rgba(251,113,133,.95); box-shadow: 0 -10px 44px rgba(251,113,133,.4); } 50% { border-color: rgba(250,204,21,.95); box-shadow: 0 -10px 44px rgba(250,204,21,.4); } }
          @keyframes otFill { 0%,100% { background: rgba(251,113,133,.16); border-color: rgba(251,113,133,.7); } 50% { background: rgba(250,204,21,.16); border-color: rgba(250,204,21,.7); } }
          .ot-text { animation: otFlash .7s ease-in-out infinite; }
          .ot-border { animation: otBorder .7s ease-in-out infinite; }
          .ot-fill { animation: otFill .7s ease-in-out infinite; }
        `}</style>
        <div className="max-w-md mx-auto relative">
          <div className="absolute -top-5 left-0 right-0 h-1.5 bg-neutral-800 rounded-t-3xl overflow-hidden">
            {overtimeOn
              ? <div className="h-full w-full ot-fill" />
              : <div className="h-full bg-gradient-to-r from-emerald-400 to-yellow-300 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{ width: `${(timeLeft / maxTime) * 100}%` }} />}
          </div>
          {overtimeOn ? (
            <div className="ot-fill border rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
              <span className="text-sm font-black ot-text">⚡ 휴식 끝! 얼른 다음 세트 시작하세요</span>
              <span className="text-[11px] font-bold text-neutral-400">세트 ✓ 하면 꺼져요</span>
            </div>
          ) : (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-3">
            <button onClick={() => setIsAlarmSettingsOpen(true)} className="px-3 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-xs font-black text-yellow-300 rounded-lg flex-shrink-0 transition-colors border border-yellow-400/40 flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> {(ALARM_SOUNDS.find(a => a.id === timerSettings.sound) || ALARM_SOUNDS[0]).label}</button>
            {[30, 60, 90, 120, 180].map(sec => (
              <button key={`preset-${sec}`} onClick={() => startRest(sec)} className="px-3 py-1.5 bg-black hover:bg-emerald-400/10 text-xs font-bold text-emerald-300 rounded-lg flex-shrink-0 transition-colors border border-emerald-500/30">{sec >= 60 ? `${sec/60}분` : `${sec}초`}</button>
            ))}
          </div>
          )}
          {/* 옆으로 밀면 숫자 ↔ 스톱워치 시계 보기 */}
          <div ref={timerPagerRef} onScroll={onTimerPagerScroll} className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar transition-[height] duration-300" style={{ height: timerPage === 1 ? 128 : 60 }}>
            <div className="w-full flex-shrink-0 snap-center">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-black rounded-2xl flex items-center justify-center border ${overtimeOn ? 'ot-fill' : isTimerActive ? 'border-yellow-300/60 shadow-[0_0_18px_rgba(250,204,21,0.45)]' : 'border-emerald-500/20'}`}><Flame className={`w-7 h-7 ${overtimeOn ? 'text-rose-400 animate-pulse' : isTimerActive ? 'text-yellow-300 animate-pulse' : 'text-neutral-600'}`} /></div>
              <div>
                {overtimeOn ? (
                  <>
                    <div className="text-xs font-black mb-0.5 tracking-widest ot-text">휴식 초과</div>
                    <div className="text-3xl font-black font-mono tracking-tight ot-text">+{Math.floor(overtimeSec / 60)}:{(overtimeSec % 60).toString().padStart(2, '0')}</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-emerald-400/70 font-bold mb-0.5 tracking-widest">REST TIMER</div>
                    <div className="text-3xl font-black font-mono text-yellow-300 tracking-tight [text-shadow:0_0_12px_rgba(250,204,21,0.8)]">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                  </>
                )}
              </div>
            </div>
            {overtimeOn ? (
              <div className="flex gap-2">
                <button onClick={() => startRest(30)} className="h-12 px-3 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 text-sm hover:bg-emerald-400/10 active:scale-95 transition-all">+30초 더 쉬기</button>
                <button onClick={() => { stopAlarm(); setOvertimeSec(null); }} aria-label="초과 타이머 닫기" className="w-12 h-12 rounded-2xl bg-black border border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"><X className="w-5 h-5" /></button>
              </div>
            ) : (
            <div className="flex gap-2">
              <button onClick={() => adjustTimer(-10)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">-10</button>
              <button onClick={() => adjustTimer(30)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">+30</button>
              <button onClick={() => { unlockAudio(); setIsTimerActive(!isTimerActive); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${isTimerActive ? 'bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.7)]' : 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.7)]'}`}>{isTimerActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}</button>
            </div>
            )}
          </div>
            </div>
            <div className="w-full flex-shrink-0 snap-center flex items-center justify-between gap-2">
              <StopwatchDial timeLeft={timeLeft} maxTime={maxTime} overtimeSec={overtimeSec} className="w-[116px] h-[120px] flex-shrink-0" />
              <div className="flex flex-col items-end gap-2">
                <div className={`text-xs font-black tracking-widest ${overtimeOn ? 'ot-text' : 'text-emerald-400/70'}`}>{overtimeOn ? '휴식 초과' : isTimerActive ? 'REST TIMER' : '일시정지'}</div>
                {overtimeOn ? (
                  <div className="flex gap-2">
                    <button onClick={() => startRest(30)} className="h-12 px-3 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 text-sm hover:bg-emerald-400/10 active:scale-95 transition-all">+30초 더 쉬기</button>
                    <button onClick={() => { stopAlarm(); setOvertimeSec(null); }} aria-label="초과 타이머 닫기" className="w-12 h-12 rounded-2xl bg-black border border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"><X className="w-5 h-5" /></button>
                  </div>
                ) : (
                <div className="flex gap-2">
                  <button onClick={() => adjustTimer(-10)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">-10</button>
                  <button onClick={() => adjustTimer(30)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">+30</button>
                  <button onClick={() => { unlockAudio(); setIsTimerActive(!isTimerActive); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${isTimerActive ? 'bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.7)]' : 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.7)]'}`}>{isTimerActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}</button>
                </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {[0, 1].map(i => (
              <button key={i} onClick={() => scrollTimerPage(i)} aria-label={i ? '스톱워치 보기' : '숫자 보기'} className={`h-1.5 rounded-full transition-all ${timerPage === i ? 'w-5 bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'w-1.5 bg-neutral-600'}`} />
            ))}
          </div>
        </div>
      </div>

      {exerciseOptionsModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center backdrop-blur-sm transition-opacity" onClick={() => setExerciseOptionsModal(null)}>
          <div className="bg-neutral-900 w-full max-w-md rounded-t-[32px] pb-10 pt-3 px-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-neutral-800 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-neutral-700 rounded-full"></div></div>
            <div className="space-y-3">
              <button onClick={() => { setSwapTargetExerciseId(exerciseOptionsModal); setExerciseOptionsModal(null); setIsAddExerciseModalOpen(true); }} className="w-full flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-colors text-left active:scale-95">
                <div className="bg-neutral-900 p-2.5 rounded-xl"><RotateCw className="w-5 h-5 text-neutral-400"/></div>
                <div><div className="font-black text-white">종목 변경하기</div><div className="text-xs font-bold text-neutral-400">다른 운동으로 대체합니다.</div></div>
              </button>
              <button onClick={() => { const targetEx = session.find(s => s.id === exerciseOptionsModal); setExerciseHistoryModal(targetEx ? targetEx.exercise : null); setExerciseOptionsModal(null); }} className="w-full flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-colors text-left active:scale-95">
                <div className="bg-neutral-900 p-2.5 rounded-xl"><History className="w-5 h-5 text-neutral-400"/></div>
                <div><div className="font-black text-white">이 종목 기록 보기</div><div className="text-xs font-bold text-neutral-400">과거 최고 기록 및 수행 로그를 확인합니다.</div></div>
              </button>
              <button onClick={() => removeExercise(exerciseOptionsModal)} className="w-full flex items-center gap-3 p-4 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/50 rounded-2xl transition-colors text-left active:scale-95">
                <div className="bg-rose-950 p-2.5 rounded-xl"><Trash2 className="w-5 h-5 text-rose-400"/></div>
                <div><div className="font-black text-rose-400">루틴에서 삭제</div></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {exerciseHistoryModal && (() => {
        const logs = getExerciseLogsHistory(exerciseHistoryModal.id);
        const maxWeight = logs.reduce((m, l) => Math.max(m, ...l.sets.map(s=>parseFloat(s.weight)||0)), 0);
        return (
          <div className="fixed inset-0 bg-black/80 z-[75] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setExerciseHistoryModal(null)}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 max-w-sm w-full max-h-[80vh] flex flex-col text-white shadow-2xl relative" onClick={e=>e.stopPropagation()}>
              <button onClick={() => setExerciseHistoryModal(null)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
              <div className="flex items-center gap-3 mb-4">
                <SmartExerciseThumbnail exerciseId={exerciseHistoryModal.id} target={exerciseHistoryModal.target} tool={exerciseHistoryModal.tool} size="w-12 h-12" showShadow={false}/>
                <div><h3 className="font-black text-xl">{exerciseHistoryModal.name}</h3><p className="text-xs text-emerald-400 font-bold">역대 최고: {maxWeight}kg</p></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
                {logs.length > 0 ? logs.map((log, i) => (
                    <div key={`hist-log-${i}`} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                      <div className="text-xs font-black text-neutral-400 mb-2 flex justify-between"><span>{log.date}</span><span className="text-emerald-500 font-bold">{log.sets.length}세트</span></div>
                      <div className="space-y-1">
                        {log.sets.map((s, j) => (
                          <div key={`s-${j}`} className="text-xs text-neutral-300 font-mono flex justify-between"><span>세트 {j+1}: {s.weight}kg x {s.reps}회</span><span className="text-neutral-500">1RM {calculate1RM(s.weight, s.reps)}kg</span></div>
                        ))}
                      </div>
                    </div>
                  )) : (<div className="text-center py-12 text-neutral-500 font-bold text-sm">과거 수행 기록이 없습니다.</div>)}
              </div>
            </div>
          </div>
        );
      })()}

      {plateVisualizerModal && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setPlateVisualizerModal(null)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 max-w-sm w-full text-center text-white relative shadow-2xl" onClick={e=>e.stopPropagation()}>
            <button onClick={() => setPlateVisualizerModal(null)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
            <h3 className="text-2xl font-black mb-1">{plateVisualizerModal.weight} kg</h3>
            <p className="text-xs font-bold text-neutral-400 mb-6">{(() => {
              const r = plateVisualizerModal.rule || { plates: 'both', bar: 20 };
              if (r.plates === 'one') return '한쪽 끝에만 꽂을 원판';
              return r.bar ? `${r.bar}kg 봉 + 양쪽에 똑같이 꽂을 원판` : '양쪽에 똑같이 꽂을 원판 (기구 무게 제외)';
            })()}</p>
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex items-center justify-center min-h-[120px] mb-6 relative overflow-x-auto">
              <div className="w-full h-3 bg-neutral-600 rounded-full absolute"></div>
              {(() => {
                const r = plateVisualizerModal.rule || { plates: 'both' };
                const Plate = ({ p }) => {
                  let h = "h-20"; let col = "bg-rose-500";
                  if (p === 20) { h = "h-20"; col = "bg-blue-500"; }
                  if (p === 15) { h = "h-16"; col = "bg-amber-500"; }
                  if (p === 10) { h = "h-14"; col = "bg-emerald-500"; }
                  if (p === 5) { h = "h-12"; col = "bg-purple-500"; }
                  if (p < 5) { h = "h-10"; col = "bg-neutral-400"; }
                  return <div className={`w-5 ${h} ${col} rounded-sm shadow-md flex items-center justify-center text-[9px] font-black text-white`}>{p}</div>;
                };
                const side = plateVisualizerModal.plates;
                return (
                  <div className="flex items-center justify-between w-full z-10">
                    <div className="flex gap-1 items-center flex-row-reverse">{r.plates === 'both' && side.map((p, i) => <Plate key={`l-${i}`} p={p} />)}</div>
                    <span className="text-[10px] font-black text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded">{r.bar ? `봉 ${r.bar}kg` : r.plates === 'one' ? '고정 축' : '기구'}</span>
                    <div className="flex gap-1 items-center">{side.map((p, i) => <Plate key={`r-${i}`} p={p} />)}</div>
                  </div>
                );
              })()}
            </div>
            <p className="text-sm font-black text-emerald-400 mb-1">{(plateVisualizerModal.rule || { plates: 'both' }).plates === 'both' ? '한쪽' : '원판'} {sideWeight(plateVisualizerModal.plates)}kg = {formatPlates(plateVisualizerModal.plates)}</p>
            <p className="text-[11px] font-bold text-neutral-500 mb-3">{(plateVisualizerModal.rule || { plates: 'both' }).plates === 'both' ? '반대쪽에도 똑같이 꽂아요' : '한쪽 끝에만 꽂아요'}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {plateVisualizerModal.plates.map((p, idx) => (<span key={`txt-p-${idx}`} className="text-xs font-black bg-neutral-800 px-3 py-1 rounded-lg border border-neutral-700">{p}kg</span>))}
            </div>
          </div>
        </div>
      )}

      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => setIsAddExerciseModalOpen(false)}>
          <div className="bg-white w-full h-[90vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col animate-slide-up text-neutral-900 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-neutral-100">
              <button onClick={() => setFormCheck({ identify: true })} aria-label="영상으로 운동 찾기" className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full transition-colors"><Camera className="w-6 h-6"/></button>
              <h2 className="text-xl font-black">{swapTargetExerciseId ? '종목 변경' : '종목 추가'}</h2>
              <button onClick={() => {setIsAddExerciseModalOpen(false); setSwapTargetExerciseId(null);}} className="text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors"><X className="w-6 h-6"/></button>
            </div>
            <div className="p-4 bg-white sticky top-[65px] z-10 border-b border-neutral-50 shadow-[0_5px_10px_rgba(0,0,0,0.02)]">
              <div className="bg-neutral-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-neutral-400" />
                <input type="text" placeholder="종목 이름을 검색하세요. (ex. 스쿼트)" value={exSearchQuery} onChange={e => setExSearchQuery(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
              </div>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {['전체', '가슴', '등', '승모', '하체', '어깨', '팔', '복근'].map(cat => (
                  <button key={cat} onClick={() => setExCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${exCategoryFilter === cat ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
              {EXERCISE_OPTIONS.filter(ex => matchesCategory(ex, exCategoryFilter) && matchesSearch(ex, exSearchQuery)).map((ex) => (
                <div key={ex.id} onClick={() => swapTargetExerciseId ? swapExercise(ex) : addExerciseFromModal(ex)} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-100 hover:border-[#4768ff] hover:shadow-md transition-all cursor-pointer group active:scale-95">
                  <SmartExerciseThumbnail exerciseId={ex.id} target={String(ex.target)} tool={String(ex.tool)} size="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-neutral-900 text-base leading-snug break-keep group-hover:text-[#4768ff] transition-colors">{String(ex.name)}</h3>
                    <p className="text-[11px] font-bold text-neutral-400 mt-0.5 break-keep">{String(ex.target)} · {String(ex.tool)}</p>
                    <button onClick={(e) => { e.stopPropagation(); setGuideExerciseId(ex.id); }} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black text-[#4768ff] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors active:scale-95"><BookOpen className="w-3 h-3"/> 설명</button>
                  </div>
                  <button className="p-2 bg-neutral-50 rounded-full group-hover:bg-blue-100 text-neutral-400 group-hover:text-blue-600 transition-colors flex-shrink-0"><Plus className="w-5 h-5"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
