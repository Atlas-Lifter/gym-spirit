import React, { useState } from 'react';
import { ChevronLeft, Dumbbell, Sparkles, Users, Shield, Smartphone, Play, ListChecks } from 'lucide-react';
import { useApp } from '../appContext.js';
import { useInstallState } from '../pwa.jsx';

// 처음 쓰는 사람 안내: 환영 → 몸무게·3대 1RM → 친구·길드 → 첫 운동
// 기록이 하나도 없는 사용자에게 한 번만 보이고, 끝내거나 건너뛰면 onboarded 로 저장된다 (클라우드에도 함께 저장)

const STEPS = 4;
const LIFTS = [['sq', '스쿼트'], ['bp', '벤치프레스'], ['dl', '데드리프트']];

export function Onboarding() {
  const {
    currentUser, setCurrentUser, cloudUser, showToast, setActiveTab, setCurrentScreen, setSession, setWorkoutDurationSec,
    guardNewWorkout, setIsFriendSearchModalOpen, goToSignup, setIsInstallOpen,
  } = useApp();
  const install = useInstallState();
  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState(String(currentUser?.bodyStats?.weight || ''));
  const [lifts, setLifts] = useState(() => Object.fromEntries(LIFTS.map(([k]) => [k, String(currentUser?.manual1RM?.[k] || '')])));
  const nickname = currentUser?.profile?.nickname || '짐스피릿';
  const total = LIFTS.reduce((a, [k]) => a + (parseFloat(lifts[k]) || 0), 0);

  // 입력한 값과 함께 안내를 마쳤다고 저장하고, 고른 다음 행동을 한다
  const finish = (then) => {
    const rm = Object.fromEntries(LIFTS.map(([k]) => [k, String(Math.round(parseFloat(lifts[k]) || 0) || '')]).filter(([, v]) => v));
    const w = parseFloat(weight);
    setCurrentUser(prev => ({
      ...prev,
      onboarded: true,
      manual1RM: { ...(prev.manual1RM || {}), ...rm },
      bodyStats: w > 0 ? { ...(prev.bodyStats || {}), weight: String(w) } : prev.bodyStats,
    }));
    if (then) then();
  };

  const next = () => setStep(s => Math.min(STEPS - 1, s + 1));
  const numInput = (value, onChange, placeholder) => (
    <input type="number" inputMode="decimal" value={value} placeholder={placeholder} onFocus={e => e.target.select()}
      onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))}
      className="w-full bg-white/10 rounded-xl px-3 py-3 text-right text-lg font-black text-white outline-none placeholder:text-white/25 focus:ring-2 focus:ring-emerald-400" />
  );

  return (
    <div className="fixed inset-0 z-[110] bg-[#070b0f] text-white flex flex-col animate-fade-in overflow-hidden">
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-blue-600/30 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* 상단: 뒤로 · 진행 점 · 건너뛰기 */}
      <div className="relative flex items-center justify-between px-5 pt-6">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} aria-label="이전" className={`p-2 rounded-full bg-white/10 ${step ? '' : 'invisible'}`}><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex gap-1.5">
          {Array.from({ length: STEPS }).map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]' : i < step ? 'w-1.5 bg-emerald-400/60' : 'w-1.5 bg-white/20'}`} />)}
        </div>
        <button onClick={() => finish()} className="text-xs font-black text-white/50 px-2 py-2">건너뛰기</button>
      </div>

      <div className="relative flex-1 overflow-y-auto px-6 pt-8 pb-6 max-w-md w-full mx-auto">
        {step === 0 && (
          <div className="animate-fade-in">
            <img src="/icon-192.png" alt="" className="w-20 h-20 rounded-3xl shadow-[0_0_30px_rgba(52,211,153,.45)] mb-6" />
            <div className="text-[11px] font-black tracking-[.3em] text-emerald-300">WELCOME</div>
            <h1 className="text-3xl font-black leading-tight mt-2">{nickname}님,<br />GYM SPIRIT에 오신 걸<br />환영해요 💪</h1>
            <p className="text-sm font-bold text-white/55 mt-3">1분이면 준비가 끝나요. 앱이 당신에게 맞춰지도록 몇 가지만 알려 주세요.</p>
            <div className="mt-7 space-y-2.5">
              {[[Dumbbell, '세트만 입력하면 RPE(운동 강도)를 자동으로 계산'], [Sparkles, '부위별 근육 회복도를 시간 단위로 계산'], [Users, '친구와 기록 비교, 길드로 함께 레이드']].map(([Icon, t]) => (
                <div key={t} className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3">
                  <Icon className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                  <span className="text-sm font-bold text-white/85">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-[11px] font-black tracking-[.3em] text-emerald-300">STEP 1</div>
            <h1 className="text-2xl font-black mt-2">지금 내 힘을 알려 주세요</h1>
            <p className="text-sm font-bold text-white/55 mt-2 leading-relaxed">3대 1RM(1회 최대 무게)을 넣으면 모든 종목의 RPE와 '이 무게로 최대 몇 회' 계산이 더 정확해져요. 모르면 비워 두세요. 운동하면 자동으로 계산돼요.</p>
            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3">
                <span className="w-24 text-sm font-black text-white/80">몸무게</span>
                {numInput(weight, setWeight, '예: 72')}
                <span className="text-sm font-bold text-white/40 w-6">kg</span>
              </label>
              <div className="h-px bg-white/10 my-1" />
              {LIFTS.map(([k, label]) => (
                <label key={k} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-black text-white/80">{label}</span>
                  {numInput(lifts[k], v => setLifts(p => ({ ...p, [k]: v })), '모르면 비워두기')}
                  <span className="text-sm font-bold text-white/40 w-6">kg</span>
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-white/10 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-white/60">3대 합계</span>
              <span className="text-xl font-black">{Math.round(total).toLocaleString()}<span className="text-xs text-white/50 ml-1">kg</span></span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-[11px] font-black tracking-[.3em] text-emerald-300">STEP 2</div>
            <h1 className="text-2xl font-black mt-2">함께하면 더 오래가요</h1>
            <p className="text-sm font-bold text-white/55 mt-2 leading-relaxed">친구로 서로 수락하면 운동 기록을 비교하고 응원할 수 있어요. 길드에 들어가면 함께 주간 미션과 레이드 보스를 깨요.</p>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                <div className="flex items-center gap-2 text-sm font-black"><Users className="w-4 h-4 text-sky-300" /> 친구 랭킹</div>
                <div className="text-xs font-bold text-white/50 mt-1">서로 친구가 된 사람끼리만 볼륨·3대·루틴이 보여요.</div>
              </div>
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                <div className="flex items-center gap-2 text-sm font-black"><Shield className="w-4 h-4 text-emerald-300" /> 길드</div>
                <div className="text-xs font-bold text-white/50 mt-1">길드원 평균 기록으로 전체 랭킹에 도전하고, 레벨·스킬·계급을 함께 키워요.</div>
              </div>
              {!install.installed && (
                <button onClick={() => setIsInstallOpen(true)} className="w-full rounded-2xl bg-white/[0.06] border border-white/10 p-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-black"><Smartphone className="w-4 h-4 text-yellow-300" /> 홈 화면에 앱으로 추가하기</div>
                  <div className="text-xs font-bold text-white/50 mt-1">아이콘으로 바로 열고, 운동 중에는 화면이 꺼지지 않아요. 눌러서 방법 보기</div>
                </button>
              )}
            </div>
            {cloudUser ? (
              <button onClick={() => finish(() => { setActiveTab('ranking'); setIsFriendSearchModalOpen(true); })} className="mt-5 w-full py-3.5 rounded-2xl bg-white/10 text-sm font-black">지금 친구 찾으러 가기</button>
            ) : (
              <button onClick={() => finish(goToSignup)} className="mt-5 w-full py-3.5 rounded-2xl bg-white/10 text-sm font-black">회원가입하고 친구·길드 쓰기</button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-[11px] font-black tracking-[.3em] text-emerald-300">STEP 3</div>
            <h1 className="text-2xl font-black mt-2">첫 운동을 시작해 볼까요?</h1>
            <p className="text-sm font-bold text-white/55 mt-2">첫 세트를 저장하면 오늘의 퀘스트와 레벨이 바로 올라가요.</p>
            <div className="mt-6 space-y-3">
              <button onClick={() => finish(() => setActiveTab('program'))} className="w-full flex items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 p-4 text-left shadow-[0_10px_30px_rgba(37,99,235,.35)] active:scale-[0.98] transition-transform">
                <ListChecks className="w-7 h-7 flex-shrink-0" />
                <span><span className="block text-base font-black">추천 프로그램으로 시작</span><span className="block text-xs font-bold text-white/75">초보·중급 루틴과 레전드 선수 루틴 중에서 골라요</span></span>
              </button>
              <button onClick={() => finish(() => { setActiveTab('workout'); guardNewWorkout(() => { setSession([]); setWorkoutDurationSec(0); setCurrentScreen('workout'); }); })} className="w-full flex items-center gap-4 rounded-2xl bg-white/[0.08] border border-white/10 p-4 text-left active:scale-[0.98] transition-transform">
                <Play className="w-7 h-7 flex-shrink-0 text-emerald-300" />
                <span><span className="block text-base font-black">빈 운동 바로 시작</span><span className="block text-xs font-bold text-white/55">오늘 할 종목을 직접 골라 기록해요</span></span>
              </button>
            </div>
            <button onClick={() => finish(() => { showToast('준비 완료! 언제든 운동을 시작해 보세요 💪'); })} className="mt-4 w-full py-3 text-sm font-black text-white/50">먼저 둘러볼게요</button>
          </div>
        )}
      </div>

      {step < STEPS - 1 && (
        <div className="relative px-6 pb-8 max-w-md w-full mx-auto">
          <button onClick={next} className="w-full py-4 rounded-2xl bg-emerald-400 text-neutral-950 text-base font-black shadow-[0_0_24px_rgba(52,211,153,.5)] active:scale-[0.98] transition-transform">
            {step === 0 ? '시작하기' : step === 1 && !total && !weight ? '나중에 할게요' : '다음'}
          </button>
        </div>
      )}
    </div>
  );
}
