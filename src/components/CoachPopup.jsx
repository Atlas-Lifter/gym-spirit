import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { CoachChat } from './CoachChat.jsx';
import { EXERCISE_OPTIONS } from '../data/catalog.js';
import { EXERCISE_GUIDES } from '../exerciseGuides.js';
import { EXERCISE_TIPS } from '../data/exerciseTips.js';
import { useApp } from '../appContext.js';

// 종목 설명서·자세 체크에서 바로 띄우는 AI 코치 (어느 화면에서나 위에 뜬다)
// coachPopup: { exerciseId, seed? } — seed 가 있으면(자세 체크 결과) 새 대화로 바로 묻는다
export function CoachPopup() {
  const {
    activeUser, cloudUser, coachPopup, getCoachContext, getExerciseInsight, getUsualWeekly,
    saveCoachRoutine, setCoachPopup, setGuideExerciseId, startCoachRoutine,
  } = useApp();
  const ex = EXERCISE_OPTIONS.find(e => e.id === coachPopup?.exerciseId);

  // 이 종목 이야기의 바탕: 설명서 요약·주의·요령 + 내 기록·다음 무게
  const topic = useMemo(() => {
    if (!ex) return null;
    const g = EXERCISE_GUIDES[ex.id] || {};
    const tip = EXERCISE_TIPS[ex.id] || {};
    const { history, next } = getExerciseInsight(ex.id);
    const context = [
      `[이 종목] ${ex.name} · ${ex.target} · ${ex.tool}`,
      (g.sum || tip.sum) && `설명: ${g.sum || tip.sum}`,
      g.tips?.length && `요령: ${g.tips.join(' / ')}`,
      (g.warn || tip.warn) && `주의: ${g.warn || tip.warn}`,
      history.length ? `내 최근 기록: ${history.join(' · ')}` : '내 기록: 이 종목은 아직 기록이 없어요',
      next && `앱이 계산한 다음 무게: ${next}`,
    ].filter(Boolean).join('\n');
    return {
      title: ex.name,
      context,
      quick: [`${ex.name} 자세에서 제일 중요한 포인트는요?`, '다음 세트 무게는 얼마로 할까요?', '하다가 어깨·허리가 불편하면 어떻게 바꿔요?', '이 종목 대신 할 만한 운동은요?'],
    };
  }, [ex?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!coachPopup || !topic) return null;
  const close = () => setCoachPopup(null);
  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex flex-col justify-end animate-fade-in" onClick={close}>
      <div className="bg-white w-full max-w-lg mx-auto h-[88vh] rounded-t-[36px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100">
          <div className="min-w-0">
            <div className="text-[11px] font-black text-[#4768ff]">AI 코치</div>
            <div className="text-lg font-black text-neutral-900 truncate">{ex.name}</div>
          </div>
          <button onClick={close} aria-label="닫기" className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 active:scale-90"><X className="w-5 h-5 text-neutral-500" /></button>
        </div>
        <div className="flex-1 min-h-0">
          <CoachChat
            topic={topic}
            seed={coachPopup.seed}
            onSeedUsed={() => setCoachPopup(p => (p ? { ...p, seed: null } : p))}
            getContext={getCoachContext}
            canChat={!!cloudUser}
            exercises={EXERCISE_OPTIONS}
            hasGuide={(id) => !!EXERCISE_GUIDES[id]}
            onOpenGuide={(id) => { close(); setGuideExerciseId(id); }}
            onStartRoutine={(r) => { close(); setGuideExerciseId(null); startCoachRoutine(r); }}
            coachRoutine={activeUser?.coachRoutine}
            onSaveRoutine={saveCoachRoutine}
            suggestWeekly={getUsualWeekly}
          />
        </div>
      </div>
    </div>
  );
}
