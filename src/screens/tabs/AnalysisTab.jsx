import React from 'react';
import { Activity, Calculator, ChevronLeft, ChevronRight, Edit3, MessageSquare, TrendingDown, TrendingUp } from 'lucide-react';
import { AnimeMuscleBodySVG } from '../../components/ExerciseVisuals.jsx';
import { getExName } from '../../data/catalog.js';
import { formatDate } from '../../lib/dates.js';
import { useApp } from '../../appContext.js';

// 분석 탭: 주간 부하·회복도·볼륨 분석
export function AnalysisTab() {
  const {
    activeUser,
    analysisDate,
    getAnalysisWeekInfo,
    getEffective1RM,
    getLiftPercentile,
    getMuscleRecoveryStatus,
    getTop1RM,
    getTotalLift3,
    getWeeklyLoadReport,
    getWeeklyVolumeData,
    handleMuscleClick,
    safeWorkouts,
    setAnalysisDate,
    setIsManualRmModalOpen,
    setIsOneRmCalculatorOpen,
    setManualRmInputs,
    setSelectedDayDetailModal,
    setVolume,
  } = useApp();
  const weekInfo = getAnalysisWeekInfo(analysisDate);
  const volData = getWeeklyVolumeData(weekInfo.monday);
  const recoveryData = getMuscleRecoveryStatus();
  let volumeChangePercent = 0;
  if(volData.prevTotal > 0) volumeChangePercent = Math.round(((volData.total - volData.prevTotal) / volData.prevTotal) * 100);
  else if(volData.total > 0) volumeChangePercent = 100;
  const sq1RM = getEffective1RM('sq');
  const bp1RM = getEffective1RM('bp');
  const dl1RM = getEffective1RM('dl');
  const userGender = activeUser?.profile?.gender || 'male';
  const sqTier = getLiftPercentile('sq', sq1RM, userGender);
  const bpTier = getLiftPercentile('bp', bp1RM, userGender);
  const dlTier = getLiftPercentile('dl', dl1RM, userGender);
  const load = getWeeklyLoadReport(weekInfo.monday);
  const LEVEL_UI = {
    empty: { label: '기록 없음', chip: 'text-neutral-500 bg-neutral-100 border-neutral-200' },
    low: { label: '훈련량 부족', chip: 'text-sky-600 bg-sky-50 border-sky-200' },
    collecting: { label: '기준 데이터 수집 중', chip: 'text-neutral-600 bg-neutral-100 border-neutral-200' },
    good: { label: '적정 부하 · 성장 구간', chip: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    caution: { label: '주의 · 피로 누적', chip: 'text-amber-600 bg-amber-50 border-amber-200' },
    danger: { label: '위험 · 휴식 필요', chip: 'text-rose-600 bg-rose-50 border-rose-200' },
  };
  const SET_STATUS_UI = {
    none: { label: '안 함', color: 'text-neutral-400', bar: 'bg-neutral-300' },
    low: { label: '부족', color: 'text-sky-600', bar: 'bg-sky-400' },
    good: { label: '적정', color: 'text-emerald-600', bar: 'bg-emerald-500' },
    high: { label: '과다', color: 'text-rose-600', bar: 'bg-rose-500' },
  };
  const ADVICE_UI = {
    danger: 'bg-rose-50 border-rose-100 text-rose-700',
    caution: 'bg-amber-50 border-amber-100 text-amber-800',
    good: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    info: 'bg-neutral-50 border-neutral-100 text-neutral-700',
  };
  const acwrPos = load.acwr === null ? null : Math.min(load.acwr, 2) / 2 * 100;
  const trendWeeks = [...load.history.map((h, i) => ({ label: `${4 - i}주 전`, sets: h.sets })), { label: load.isCurrentWeek ? '이번 주' : '이 주', sets: load.current.sets, current: true }];
  const trendMax = Math.max(...trendWeeks.map(w => w.sets), load.chronicSets, 10);
  return (
    <div className="flex-1 bg-neutral-50 text-neutral-900 pb-28 overflow-y-auto animate-fade-in">
      <div className="bg-white px-6 py-6 shadow-sm mb-4 sticky top-0 z-20 border-b border-neutral-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">{String(weekInfo.title)}</h2>
          <p className="text-sm font-bold text-neutral-400 mt-1">{String(weekInfo.subtitle)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const d = new Date(analysisDate); d.setDate(d.getDate()-7); setAnalysisDate(d); }} className="p-2.5 bg-neutral-50 rounded-xl hover:bg-neutral-100 border border-neutral-100 transition-colors active:scale-90"><ChevronLeft className="w-5 h-5 text-neutral-600"/></button>
          <button onClick={() => { const d = new Date(analysisDate); d.setDate(d.getDate()+7); setAnalysisDate(d); }} className="p-2.5 bg-neutral-50 rounded-xl hover:bg-neutral-100 border border-neutral-100 transition-colors active:scale-90"><ChevronRight className="w-5 h-5 text-neutral-600"/></button>
        </div>
      </div>

      <div className="px-5 space-y-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2"><Activity className="w-5 h-5 text-[#4768ff]"/> 주간 신체 피로도 및 부하 분석</h3>
            <span className={`text-xs font-black px-3 py-1 rounded-xl border ${LEVEL_UI[load.level].chip}`}>{LEVEL_UI[load.level].label}</span>
          </div>
          <p className="text-xs font-bold text-neutral-500 mb-5">완료한 본세트(워밍업 제외)를 기준으로 훈련량, 강도, 휴식을 함께 분석합니다.</p>

          {/* 핵심 지표 */}
          <div className="grid grid-cols-4 gap-2 text-center mb-5">
            {[
              { label: '운동일', value: `${load.current.days}일` },
              { label: '본세트', value: `${load.current.sets}` },
              { label: '평균 RPE', value: load.current.avgRpe !== null ? load.current.avgRpe.toFixed(1) : '-' },
              { label: '연속 운동', value: `${load.streak}일`, warn: load.streak >= 4 },
            ].map(m => (
              <div key={m.label} className="bg-neutral-50 py-3 px-1 rounded-xl border border-neutral-100">
                <div className="text-[10px] font-bold text-neutral-400 mb-0.5">{m.label}</div>
                <div className={`text-lg font-black tabular-nums ${m.warn ? 'text-rose-500' : 'text-neutral-900'}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* 부하 비율 게이지 */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 mb-5">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-black text-neutral-700">평소 대비 훈련량 (부하 비율)</span>
              <span className="text-lg font-black text-neutral-900 tabular-nums">{load.acwr !== null ? `${load.acwr.toFixed(2)}배` : '-'}</span>
            </div>
            <p className="text-[11px] font-bold text-neutral-400 mb-3">이 주 본세트 ÷ 최근 4주 평균({load.chronicSets ? Math.round(load.chronicSets) : 0}세트)</p>
            <div className="relative h-3 rounded-full overflow-hidden flex">
              <div className="bg-sky-200" style={{ width: '40%' }} />
              <div className="bg-emerald-300" style={{ width: '25%' }} />
              <div className="bg-amber-300" style={{ width: '10%' }} />
              <div className="bg-rose-300" style={{ width: '25%' }} />
            </div>
            <div className="relative h-4">
              {acwrPos !== null && <div className="absolute -top-[15px] w-1.5 h-5 bg-neutral-900 rounded-full border-2 border-white shadow" style={{ left: `calc(${acwrPos}% - 3px)` }} />}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-black">
              <span className="text-sky-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-sky-300 inline-block" />부족 0.8 미만</span>
              <span className="text-emerald-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />적정 0.8~1.3</span>
              <span className="text-amber-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-400 inline-block" />주의 1.3~1.5</span>
              <span className="text-rose-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-rose-400 inline-block" />급증 1.5 이상</span>
            </div>
            {load.acwr === null && <p className="text-[11px] font-bold text-neutral-500 mt-2">2주 이상 기록이 쌓이면 계산됩니다.</p>}
          </div>

          {/* 5주 추이 */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-3">
              <h4 className="text-xs font-black text-neutral-700">최근 5주 본세트 추이</h4>
              {load.chronicSets > 0 && <span className="text-[10px] font-bold text-neutral-400">점선 = 4주 평균 {Math.round(load.chronicSets)}세트</span>}
            </div>
            <div className="relative flex items-end justify-between gap-2 h-24 border-b border-neutral-200">
              {load.chronicSets > 0 && (
                <div className="absolute left-0 right-0 border-t border-dashed border-neutral-400 pointer-events-none" style={{ bottom: `${(load.chronicSets / trendMax) * 100}%` }}>
                </div>
              )}
              {trendWeeks.map(w => (
                <div key={w.label} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-black text-neutral-500 tabular-nums mb-0.5">{w.sets || ''}</span>
                  <div className={`w-full max-w-[34px] rounded-t-md ${w.current ? 'bg-[#4768ff]' : 'bg-neutral-300'}`} style={{ height: `${Math.max((w.sets / trendMax) * 100, w.sets ? 4 : 0)}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2 mt-1.5">
              {trendWeeks.map(w => <span key={w.label} className={`flex-1 text-center text-[10px] font-bold ${w.current ? 'text-[#4768ff]' : 'text-neutral-400'}`}>{w.label}</span>)}
            </div>
          </div>

          {/* 부위별 주간 세트 */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-3">
              <h4 className="text-xs font-black text-neutral-700">부위별 주간 세트</h4>
              <span className="text-[10px] font-bold text-neutral-400">권장 10~20세트</span>
            </div>
            <div className="space-y-2.5">
              {load.groupStatus.map(gs => {
                const ui = SET_STATUS_UI[gs.status];
                return (
                  <div key={gs.group} className="flex items-center gap-3">
                    <span className="w-9 text-xs font-black text-neutral-700">{gs.group}</span>
                    <div className="relative flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 bg-emerald-100" style={{ left: `${10 / 25 * 100}%`, width: `${10 / 25 * 100}%` }} />
                      <div className={`absolute inset-y-0 left-0 rounded-full ${ui.bar}`} style={{ width: `${Math.min(gs.sets / 25, 1) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-black text-neutral-900 tabular-nums">{gs.sets}</span>
                    <span className={`w-8 text-[10px] font-black ${ui.color}`}>{ui.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 코치 제안 */}
          <div>
            <h4 className="text-xs font-black text-neutral-700 mb-2.5 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-[#4768ff]"/> 이번 주 코치 제안</h4>
            <ul className="space-y-2">
              {load.advice.map((a, i) => (
                <li key={i} className={`text-xs font-bold leading-relaxed p-3 rounded-xl border ${ADVICE_UI[a.tone]}`}>{a.text}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
           <div className="flex justify-between items-center mb-4">
             <div>
               <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">3대 운동 Peak 1RM Total</h3>
               <p className="text-[10px] font-bold text-emerald-600 mb-1">입력한 1RM으로 운동 기록 때 RPE(힘든 정도)를 자동 추천해요</p>
               <div className="text-3xl font-black text-neutral-900">{getTotalLift3()} <span className="text-base text-neutral-400 font-bold">kg</span></div>
             </div>
             <div className="flex flex-col gap-2">
               <button onClick={() => { setManualRmInputs(Object.fromEntries(['sq', 'bp', 'dl'].map(k => { const v = parseFloat((activeUser?.manual1RM || {})[k]) || getTop1RM(k); return [k, v > 0 ? String(v) : '']; }))); setIsManualRmModalOpen(true); }} className="flex items-center gap-1.5 justify-center text-xs font-black text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-200 transition-colors"><Edit3 className="w-3 h-3"/> 수동 기록</button>
               <button onClick={() => setIsOneRmCalculatorOpen(true)} className="flex items-center justify-center gap-1.5 text-[11px] font-black text-[#4768ff] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"><Calculator className="w-3 h-3"/> 계산기</button>
             </div>
           </div>
           <div className="grid grid-cols-3 gap-3">
             <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center relative overflow-hidden">
               <div className="text-[10px] font-black text-rose-500 mb-1">스쿼트</div>
               <div className="text-lg font-black text-neutral-900 mb-1">{sq1RM > 0 ? `${sq1RM}kg` : '-'}</div>
               {sq1RM > 0 && <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block ${sqTier.color}`}>{sqTier.tier} {sqTier.label}</div>}
             </div>
             <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center relative overflow-hidden">
               <div className="text-[10px] font-black text-blue-500 mb-1">벤치프레스</div>
               <div className="text-lg font-black text-neutral-900 mb-1">{bp1RM > 0 ? `${bp1RM}kg` : '-'}</div>
               {bp1RM > 0 && <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block ${bpTier.color}`}>{bpTier.tier} {bpTier.label}</div>}
             </div>
             <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center relative overflow-hidden">
               <div className="text-[10px] font-black text-emerald-600 mb-1">데드리프트</div>
               <div className="text-lg font-black text-neutral-900 mb-1">{dl1RM > 0 ? `${dl1RM}kg` : '-'}</div>
               {dl1RM > 0 && <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block ${dlTier.color}`}>{dlTier.tier} {dlTier.label}</div>}
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
          <h3 className="text-sm font-black text-neutral-400 mb-2 tracking-wider">주간 총 볼륨</h3>
          <div className="text-4xl font-black text-neutral-900 mb-3 tracking-tighter">{volData.total.toLocaleString()}<span className="text-xl text-neutral-400 ml-1">kg</span></div>
          <div className={`flex items-center text-sm font-bold w-max px-3 py-1.5 rounded-lg mb-8 ${volumeChangePercent >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
            {volumeChangePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1.5"/> : <TrendingDown className="w-4 h-4 mr-1.5"/>}
            지난주 대비 {Math.abs(volumeChangePercent)}% {volumeChangePercent >= 0 ? '증가했어요' : '감소했어요'}
          </div>
          <div className="flex items-end justify-between h-48 border-b border-dashed border-neutral-200 pb-2 relative mt-8">
            {volData.volumes.map((vol, i) => {
              const dayDateStr = formatDate(volData.dayDates[i]);
              const dayName = ['월','화','수','목','금','토','일'][i];
              const daySession = safeWorkouts[dayDateStr] || [];
              let bestEx = "휴식";
              let maxExVol = 0;
              daySession.forEach(ex => {
                  let exVol = 0;
                  if(ex.sets) ex.sets.forEach(s => { if(s.completed && s.reps) exVol += setVolume(ex, s); });
                  if(exVol > maxExVol) { maxExVol = exVol; bestEx = getExName(ex); }
              });
              return (
                <div key={`vol-${i}`} onClick={() => setSelectedDayDetailModal(dayDateStr)} className="w-[12%] flex flex-col items-center justify-end h-full cursor-pointer group active:scale-90 transition-transform relative z-10">
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-[10px] p-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-20 flex flex-col items-center">
                     <span className="font-black text-emerald-400">{vol.toLocaleString()}kg</span>
                     <span className="text-neutral-300 font-bold max-w-[60px] truncate">{bestEx}</span>
                     <div className="absolute -bottom-1 w-2 h-2 bg-neutral-800 rotate-45"></div>
                  </div>
                  <div className="w-full bg-neutral-50 rounded-lg relative overflow-hidden group-hover:bg-neutral-100 transition-colors shadow-inner" style={{ height: '140px' }}>
                    <div className={`absolute bottom-0 w-full rounded-lg transition-all duration-1000 ease-out shadow-md ${i%2===0 ? 'bg-[#4768ff]' : 'bg-[#ff6b6b]'}`} style={{ height: `${Math.max((vol/volData.maxVolume)*100, vol > 0 ? 6 : 0)}%` }}></div>
                  </div>
                  <div className={`mt-3 text-[11px] font-bold transition-colors group-hover:text-emerald-600 px-2 py-1 rounded-md ${vol > 0 ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-400'}`}>{dayName}</div>
                </div>
              );
            })}
          </div>
        </div>

        {(() => {
          const radarLabels = ['하체', '가슴', '팔', '복근', '어깨', '등'];
          const maxShare = Math.max(...radarLabels.map(l => volData.muscleShare[l] || 0), 1);
          const getPoint = (index, ratio) => {
            const angle = (Math.PI / 3) * index - (Math.PI / 2);
            const r = ratio * 70;
            return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
          };
          const bgPoints = radarLabels.map((_, i) => getPoint(i, 1)).join(' ');
          const midPoints = radarLabels.map((_, i) => getPoint(i, 0.5)).join(' ');
          const dataPoints = radarLabels.map((l, i) => getPoint(i, (volData.muscleShare[l] || 0) / maxShare)).join(' ');
          return (
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-neutral-900 tracking-tight">나의 운동 육각 스탯</h3>
                 <span className="text-[10px] font-bold bg-[#e8edff] text-[#4768ff] px-2 py-1 rounded-md">주간 볼륨</span>
              </div>
              <div className="flex items-center justify-center relative h-56 mb-2">
                <svg viewBox="0 0 200 200" className="w-full h-full max-w-[220px] drop-shadow-md overflow-visible">
                  <polygon points={bgPoints} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
                  <polygon points={midPoints} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"/>
                  {radarLabels.map((_, i) => (<line key={`axis-${i}`} x1="100" y1="100" x2={getPoint(i, 1).split(',')[0]} y2={getPoint(i, 1).split(',')[1]} stroke="#e2e8f0" strokeWidth="1"/>))}
                  <polygon points={dataPoints} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="3" className="transition-all duration-1000 ease-out origin-center hover:fill-[rgba(16,185,129,0.4)] cursor-pointer" style={{ filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))" }} />
                  {radarLabels.map((l, i) => {
                     const p = getPoint(i, (volData.muscleShare[l] || 0) / maxShare).split(',');
                     return (<circle key={`dot-${i}`} cx={p[0]} cy={p[1]} r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" className="hover:r-[6px] hover:fill-rose-500 transition-all cursor-pointer"/>);
                  })}
                  {radarLabels.map((l, i) => {
                     const p = getPoint(i, 1.25).split(',');
                     return (<text key={`label-${i}`} x={p[0]} y={p[1]} fill="#64748b" fontSize="10" fontWeight="900" textAnchor="middle" dominantBaseline="middle">{l}</text>);
                  })}
                </svg>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {radarLabels.map(l => (
                  <div key={`legend-${l}`} className="bg-neutral-50 border border-neutral-100 px-3 py-1.5 rounded-xl flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:-translate-y-1 transition-all cursor-pointer shadow-sm">
                     <span className="text-[10px] font-black text-neutral-500">{l}</span>
                     <span className="text-xs font-black text-neutral-900">{(volData.muscleShare[l] || 0).toLocaleString()}kg</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100 overflow-hidden relative">
          <div className="relative z-10 mb-6">
            <h3 className="text-xl font-black text-neutral-900 mb-1 tracking-tight">회복된 근육으로 운동을 시작해보세요</h3>
            <p className="text-sm text-neutral-500 font-bold">지시선 모서리나 근육을 터치하면 부위별 맞춤 훈련이 생성됩니다!</p>
          </div>
          <div className="flex justify-between items-center relative py-6 bg-neutral-50 rounded-2xl border border-neutral-100 min-h-[480px] px-2 shadow-inner">
            <div className="absolute inset-0 flex justify-center items-center pointer-events-auto p-2 opacity-100 z-20">
              <AnimeMuscleBodySVG recoveryData={recoveryData} onMuscleClick={handleMuscleClick} />
            </div>
          </div>
          {(() => {
            const tired = Object.entries(recoveryData).filter(([, v]) => v.percent < 100).sort((x, y) => x[1].percent - y[1].percent);
            return (
              <div className="mt-4 space-y-2">
                {tired.length === 0 ? (
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">모든 부위가 완전히 회복됐어요. 어떤 운동이든 좋아요!</p>
                ) : tired.map(([g, v]) => (
                  <button key={g} onClick={() => handleMuscleClick(g)} className="w-full flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-left active:scale-[0.99] transition-transform">
                    <span className="w-10 text-sm font-black text-neutral-900">{g}</span>
                    <span className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden"><span className={`block h-full rounded-full ${v.percent < 50 ? 'bg-rose-500' : v.percent < 90 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${v.percent}%` }} /></span>
                    <span className="text-right">
                      <span className={`block text-xs font-black ${v.color}`}>{v.percent}%{v.hoursLeft > 0 ? ` · ${v.hoursLeft}시간 남음` : ''}</span>
                      {v.lastAt && <span className="block text-[10px] font-bold text-neutral-400">{v.text.split(' 운동')[0]} 운동</span>}
                    </span>
                  </button>
                ))}
                <p className="text-[10px] font-bold text-neutral-400 leading-relaxed px-1">운동을 마친 시각부터 지난 시간과, 그날의 세트 수·무게 강도(내 최고 기록 대비)·RPE로 계산해요. 큰 근육(하체·등·가슴)일수록 회복이 오래 걸려요.</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
