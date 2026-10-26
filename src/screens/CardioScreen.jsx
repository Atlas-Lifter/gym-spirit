import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Flame, Timer, Route, HeartPulse } from 'lucide-react';
import { GlobalOverlays } from './GlobalOverlays.jsx';
import { useApp } from '../appContext.js';
import { formatDate } from '../lib/dates.js';
import { CARDIO_TYPES, CARDIO_BY_ID, LEVELS, WEEKLY_GOAL_MIN, cardioStats, fmtPace } from '../data/cardio.js';
import { ExercisePhotoThumb } from '../components/ExerciseVisuals.jsx';
import { HERO_BG } from '../theme.js';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const MIN_CHIPS = [10, 20, 30, 45, 60];
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const shiftDate = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return formatDate(d); };
const mondayOf = (s) => { const d = parseDate(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };

// 종목 그림: 실제 기구 사진이 있으면 사진, 없으면 이모지
const CardioIcon = ({ type, size = 'w-14 h-14' }) => (type.photo
  ? <ExercisePhotoThumb exerciseId={type.photo} size={size} />
  : <div className={`${size} aspect-[3/2] rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl flex-shrink-0`}>{type.icon}</div>);

const Field = ({ label, unit, value, onChange, step = 1, placeholder }) => (
  <label className="block">
    <span className="text-xs font-black text-neutral-500">{label}</span>
    <div className="mt-1 flex items-center bg-neutral-100 rounded-xl px-3">
      <input type="number" inputMode="decimal" step={step} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="flex-1 min-w-0 bg-transparent py-3 text-lg font-black text-neutral-900 outline-none placeholder:text-neutral-300" />
      <span className="text-sm font-black text-neutral-400">{unit}</span>
    </div>
  </label>
);

// 유산소 기록 화면: 근력 운동 기록과 따로, 날짜별로 종목·시간·거리·강도를 남긴다
export function CardioScreen() {
  const { currentUser, setCurrentUser, currentDate, setCurrentDate, setCurrentScreen, showToast } = useApp();
  const weight = parseFloat(currentUser?.bodyStats?.weight) || 70;
  const all = currentUser?.cardio || {};
  const list = Array.isArray(all[currentDate]) ? all[currentDate] : [];
  const today = formatDate(new Date());
  const [sheet, setSheet] = useState(null); // null | { step: 'pick' } | { step: 'form', form, editId }

  const dayTotal = (date) => (all[date] || []).reduce((acc, e) => {
    const st = cardioStats(e, weight);
    return { min: acc.min + (Number(e.min) || 0), kcal: acc.kcal + st.kcal, km: acc.km + st.km };
  }, { min: 0, kcal: 0, km: 0 });
  const todaySum = dayTotal(currentDate);
  const week = useMemo(() => {
    const mon = mondayOf(currentDate);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const key = formatDate(d); return { key, d, ...dayTotal(key) }; });
  }, [all, currentDate, weight]);
  const weekMin = week.reduce((s, d) => s + d.min, 0);
  const weekKcal = week.reduce((s, d) => s + d.kcal, 0);
  const weekDays = week.filter(d => d.min > 0).length;
  const maxMin = Math.max(30, ...week.map(d => d.min));
  // 최근에 한 유산소 3가지 (같은 조건으로 바로 다시 기록)
  const recent = useMemo(() => {
    const seen = new Set(); const out = [];
    Object.keys(all).sort().reverse().forEach(d => (all[d] || []).slice().reverse().forEach(e => { if (!seen.has(e.type) && CARDIO_BY_ID[e.type] && out.length < 3) { seen.add(e.type); out.push(e); } }));
    return out;
  }, [all]);

  const openForm = (typeId, base = {}, editId = null) => {
    const t = CARDIO_BY_ID[typeId];
    setSheet({ step: 'form', editId, form: { type: typeId, min: base.min ?? 30, speed: base.speed ?? t.speed ?? '', incline: base.incline ?? (t.gait === 'run' ? 1 : 0), km: base.km ?? '', level: base.level ?? 1, hr: base.hr ?? '', kcal: editId && base.kcalManual ? base.kcal : '' } });
  };
  const setForm = (patch) => setSheet(s => ({ ...s, form: { ...s.form, ...patch } }));
  const save = () => {
    const f = sheet.form;
    if (!(Number(f.min) > 0)) { showToast('운동한 시간을 입력해 주세요.'); return; }
    const t = CARDIO_BY_ID[f.type];
    const st = cardioStats(f, weight);
    const entry = {
      id: sheet.editId || `c${Date.now()}`, type: f.type, min: Number(f.min), level: f.level,
      ...(t.mode === 'treadmill' ? { speed: Number(f.speed) || t.speed, incline: Number(f.incline) || 0 } : {}),
      ...(t.mode === 'distance' && Number(f.km) > 0 ? { km: Number(f.km) } : {}),
      ...(Number(f.hr) > 0 ? { hr: Number(f.hr) } : {}),
      kcal: st.kcal, ...(Number(f.kcal) > 0 ? { kcalManual: true } : {}),
      at: new Date().toISOString(),
    };
    setCurrentUser(prev => {
      const day = Array.isArray(prev.cardio?.[currentDate]) ? prev.cardio[currentDate] : [];
      const next = sheet.editId ? day.map(e => (e.id === sheet.editId ? entry : e)) : [...day, entry];
      return { ...prev, cardio: { ...(prev.cardio || {}), [currentDate]: next } };
    });
    setSheet(null);
    showToast(sheet.editId ? '유산소 기록을 고쳤어요.' : `${t.name} ${entry.min}분을 기록했어요. 🔥`);
  };
  const remove = (id) => {
    setCurrentUser(prev => {
      const day = (prev.cardio?.[currentDate] || []).filter(e => e.id !== id);
      const cardio = { ...(prev.cardio || {}) };
      if (day.length) cardio[currentDate] = day; else delete cardio[currentDate];
      return { ...prev, cardio };
    });
    showToast('유산소 기록을 지웠어요.');
  };

  const d = parseDate(currentDate);
  const form = sheet?.step === 'form' ? sheet.form : null;
  const ft = form ? CARDIO_BY_ID[form.type] : null;
  const live = form ? cardioStats(form, weight) : null;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-32 flex flex-col relative animate-fade-in">
      <GlobalOverlays />
      <header className="bg-white border-b border-neutral-100 px-5 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <button onClick={() => setCurrentScreen('home')} aria-label="뒤로" className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-50 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="font-black text-xl tracking-tight text-neutral-900">유산소 기록</h1>
        <div className="w-10" />
      </header>

      <main className="p-5 space-y-5">
        {/* 날짜 */}
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentDate(shiftDate(currentDate, -1))} aria-label="전날" className="p-2 rounded-xl bg-white border border-neutral-100 active:scale-90"><ChevronLeft className="w-5 h-5 text-neutral-500" /></button>
          <div className="text-center">
            <div className="text-lg font-black">{d.getMonth() + 1}월 {d.getDate()}일 ({DOW[d.getDay()]})</div>
            {currentDate !== today && <button onClick={() => setCurrentDate(today)} className="text-[11px] font-black text-orange-500">오늘로 가기</button>}
          </div>
          <button onClick={() => setCurrentDate(shiftDate(currentDate, 1))} disabled={currentDate >= today} aria-label="다음날" className="p-2 rounded-xl bg-white border border-neutral-100 active:scale-90 disabled:opacity-30"><ChevronRight className="w-5 h-5 text-neutral-500" /></button>
        </div>

        {/* 오늘 요약 */}
        <div className="rounded-[28px] p-5 text-white shadow-[0_12px_28px_rgba(7,11,15,0.18)]" style={{ background: HERO_BG }}>
          <div className="text-[11px] font-black text-orange-300 tracking-widest">CARDIO</div>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-4xl font-black tabular-nums">{todaySum.min}</span><span className="text-sm font-bold text-white/60 mb-1">분</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[[Flame, `${todaySum.kcal.toLocaleString()}`, 'kcal'], [Route, todaySum.km ? todaySum.km.toFixed(2) : '-', 'km'], [Timer, `${list.length}`, '회']].map(([Icon, v, u], i) => (
              <div key={i} className="bg-white/5 rounded-xl py-2.5 text-center">
                <div className="text-lg font-black tabular-nums flex items-center justify-center gap-1"><Icon className="w-3.5 h-3.5 text-orange-300" />{v}</div>
                <div className="text-[10px] font-bold text-white/50">{u}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 이번 주 */}
        <div className="bg-white rounded-[28px] border border-neutral-100 shadow-sm p-5">
          <div className="flex justify-between items-end mb-1">
            <div className="text-sm font-black">이번 주 유산소</div>
            <div className="text-xs font-black text-neutral-400"><span className="text-orange-500 text-base">{weekMin}</span> / {WEEKLY_GOAL_MIN}분</div>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden mb-4"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all duration-700" style={{ width: `${Math.min(100, (weekMin / WEEKLY_GOAL_MIN) * 100)}%` }} /></div>
          <div className="grid grid-cols-7 gap-1.5 items-end h-24">
            {week.map(day => (
              <button key={day.key} onClick={() => setCurrentDate(day.key)} className="flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[9px] font-black text-neutral-400 tabular-nums h-3">{day.min || ''}</span>
                <div className={`w-full rounded-lg transition-all ${day.key === currentDate ? 'bg-orange-500' : day.min ? 'bg-orange-300' : 'bg-neutral-100'}`} style={{ height: `${Math.max(6, (day.min / maxMin) * 64)}px` }} />
                <span className={`text-[10px] font-black ${day.key === currentDate ? 'text-orange-500' : 'text-neutral-400'}`}>{DOW[day.d.getDay()]}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] font-bold text-neutral-400 mt-3">{weekDays}일 · {weekKcal.toLocaleString()}kcal · {weekMin >= WEEKLY_GOAL_MIN ? '🎉 이번 주 권장량(주 150분)을 채웠어요!' : `권장량까지 ${WEEKLY_GOAL_MIN - weekMin}분 남았어요 (세계보건기구 권장 주 150분)`}</p>
        </div>

        {/* 기록 목록 */}
        <div className="space-y-3">
          {list.length === 0 && (
            <div className="bg-white rounded-[28px] border border-dashed border-neutral-200 p-8 text-center">
              <div className="text-3xl mb-2">🏃</div>
              <p className="text-sm font-black text-neutral-700">이 날의 유산소 기록이 없어요</p>
              <p className="text-xs font-bold text-neutral-400 mt-1">러닝머신, 천국의 계단, 사이클처럼 근력 운동과 따로 기록해요.</p>
            </div>
          )}
          {list.map(e => {
            const t = CARDIO_BY_ID[e.type] || CARDIO_BY_ID.etc;
            const st = cardioStats(e, weight);
            const detail = [`${e.min}분`, st.km ? `${st.km}km` : '', t.gait === 'run' && st.pace ? `${fmtPace(st.pace)}/km` : '', t.mode === 'treadmill' ? `${st.speed}km/h${e.incline ? ` · 경사 ${e.incline}%` : ''}` : '', !t.gait ? LEVELS[e.level ?? 1] : ''].filter(Boolean).join(' · ');
            return (
              <div key={e.id} className="bg-white rounded-[24px] border border-neutral-100 shadow-sm p-3.5 flex items-center gap-3">
                <button onClick={() => openForm(e.type, e, e.id)} className="flex-1 min-w-0 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
                  <CardioIcon type={t} size="h-14" />
                  <div className="min-w-0">
                    <div className="font-black text-neutral-900 truncate">{t.name}</div>
                    <div className="text-[11px] font-bold text-neutral-500 truncate">{detail}</div>
                    <div className="text-[11px] font-black text-orange-500 mt-0.5 flex items-center gap-2"><span>🔥 {st.kcal}kcal</span>{e.hr ? <span className="text-rose-500">♥ {e.hr}bpm</span> : null}</div>
                  </div>
                </button>
                <button onClick={() => remove(e.id)} aria-label="기록 삭제" className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>

        {recent.length > 0 && (
          <div>
            <div className="text-xs font-black text-neutral-400 mb-2">지난번처럼 바로 기록</div>
            <div className="flex flex-wrap gap-1.5">
              {recent.map(e => (
                <button key={e.type} onClick={() => openForm(e.type, { ...e, kcal: undefined, kcalManual: false })} className="text-xs font-black bg-white border border-neutral-200 text-neutral-700 px-3 py-2 rounded-xl active:scale-95">{CARDIO_BY_ID[e.type].icon} {CARDIO_BY_ID[e.type].name.split(' (')[0]} {e.min}분</button>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setSheet({ step: 'pick' })} className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(249,115,22,0.3)] active:scale-95 transition-transform"><Plus className="w-5 h-5 stroke-[3]" /> 유산소 추가하기</button>
      </main>

      {/* 추가·수정 시트 */}
      {sheet && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => setSheet(null)}>
          <div className="bg-white w-full max-w-lg mx-auto max-h-[90vh] rounded-t-[36px] flex flex-col animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex justify-between items-center border-b border-neutral-100">
              {sheet.step === 'form' && !sheet.editId ? <button onClick={() => setSheet({ step: 'pick' })} aria-label="종목 다시 고르기" className="p-2 -ml-2 text-neutral-500 rounded-full hover:bg-neutral-100"><ChevronLeft className="w-6 h-6" /></button> : <div className="w-10" />}
              <h2 className="text-lg font-black">{sheet.step === 'pick' ? '어떤 유산소를 했나요?' : sheet.editId ? '기록 고치기' : ft.name}</h2>
              <button onClick={() => setSheet(null)} aria-label="닫기" className="p-2 rounded-full hover:bg-neutral-100"><X className="w-6 h-6" /></button>
            </div>

            {sheet.step === 'pick' ? (
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5 bg-neutral-50">
                {CARDIO_TYPES.map(t => (
                  <button key={t.id} onClick={() => openForm(t.id)} className="bg-white rounded-2xl border border-neutral-100 p-2.5 flex flex-col gap-2 text-left hover:border-orange-300 active:scale-95 transition-all">
                    {t.photo ? <ExercisePhotoThumb exerciseId={t.photo} size="w-full h-auto" /> : <div className="w-full aspect-[3/2] rounded-xl bg-orange-50 flex items-center justify-center text-4xl">{t.icon}</div>}
                    <span className="text-[13px] font-black text-neutral-800 leading-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {sheet.editId && <div className="flex items-center gap-3"><CardioIcon type={ft} size="h-12" /><span className="font-black">{ft.name}</span></div>}
                <div>
                  <Field label="운동한 시간" unit="분" value={form.min} onChange={v => setForm({ min: v })} />
                  <div className="flex gap-1.5 mt-2">{MIN_CHIPS.map(m => <button key={m} onClick={() => setForm({ min: m })} className={`flex-1 py-1.5 rounded-lg text-xs font-black ${Number(form.min) === m ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{m}분</button>)}</div>
                </div>
                {ft.mode === 'treadmill' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="속도" unit="km/h" step={0.1} value={form.speed} onChange={v => setForm({ speed: v })} />
                    <Field label="경사" unit="%" step={0.5} value={form.incline} onChange={v => setForm({ incline: v })} />
                  </div>
                )}
                {ft.mode === 'distance' && <Field label="거리 (선택)" unit="km" step={0.1} value={form.km} placeholder="모르면 비워 두세요" onChange={v => setForm({ km: v })} />}
                {!(ft.gait && (ft.mode === 'treadmill' || Number(form.km) > 0)) && (
                  <div>
                    <div className="text-xs font-black text-neutral-500 mb-1.5">강도</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LEVELS.map((l, i) => <button key={l} onClick={() => setForm({ level: i })} className={`py-2.5 rounded-xl text-sm font-black ${form.level === i ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{l}</button>)}
                    </div>
                    <p className="text-[11px] font-bold text-neutral-400 mt-1.5">가볍게: 대화가 편함 · 보통: 숨이 차지만 말은 가능 · 힘들게: 말하기 어려움</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="평균 심박 (선택)" unit="bpm" value={form.hr} placeholder="-" onChange={v => setForm({ hr: v })} />
                  <Field label="칼로리 직접 입력 (선택)" unit="kcal" value={form.kcal} placeholder={`${live.auto}`} onChange={v => setForm({ kcal: v })} />
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-black text-orange-600">예상 소모 칼로리</div>
                    <div className="text-2xl font-black text-neutral-900 tabular-nums">{live.kcal}<span className="text-sm text-neutral-400 ml-1">kcal</span></div>
                  </div>
                  <div className="text-right text-[11px] font-bold text-neutral-500 leading-relaxed">
                    {live.km ? <div>{live.km}km{ft.gait === 'run' && live.pace ? ` · ${fmtPace(live.pace)}/km` : ''}</div> : null}
                    {live.speed && ft.mode !== 'treadmill' ? <div>평균 {live.speed}km/h</div> : null}
                    <div>체중 {weight}kg 기준</div>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-neutral-400 flex items-start gap-1"><HeartPulse className="w-3.5 h-3.5 flex-shrink-0 mt-px" />칼로리는 운동 강도(MET)와 체중으로 계산한 예상치예요. 스마트워치 값이 있으면 직접 입력하세요.</p>
                <button onClick={save} className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black text-lg shadow-[0_10px_25px_rgba(249,115,22,0.3)] active:scale-95 transition-transform">{sheet.editId ? '고친 내용 저장' : '기록하기'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
