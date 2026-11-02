import React, { useState } from 'react';
import { BarChart2, Plus, X } from 'lucide-react';

// AI 코치가 따를 '내 운동 루틴' 정하기: 요일별 고정 / 분할 순환(요일 상관없이 순서대로) / 정해진 루틴 없음
export const ROUTINE_GROUPS = ['가슴', '등', '하체', '어깨', '팔', '복근', '유산소'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY = '일월화수목금토';
const PRESETS = [
  { l: '상하체 2분할', cycle: [['가슴', '등', '어깨', '팔'], ['하체', '복근']] },
  { l: '3분할 (밀기·당기기·하체)', cycle: [['가슴', '어깨', '팔'], ['등', '팔'], ['하체', '복근']] },
  { l: '3분할 (가슴·등·하체)', cycle: [['가슴'], ['등'], ['하체']] },
  { l: '4분할', cycle: [['가슴', '팔'], ['등'], ['하체'], ['어깨', '복근']] },
  { l: '5분할', cycle: [['가슴'], ['등'], ['하체'], ['어깨'], ['팔', '복근']] },
];
const TYPES = [{ id: 'weekly', l: '📅 요일별' }, { id: 'cycle', l: '🔁 분할 순환' }, { id: 'none', l: '🙅 없음' }];

export const routineSummary = (r) => {
  if (!r || !r.type) return null;
  if (r.type === 'none') return '정해진 루틴 없음 · 그날 컨디션에 맞춰 추천';
  const j = (gs) => (gs && gs.length ? gs.join('·') : '휴식');
  if (r.type === 'weekly') return WEEK_ORDER.map(d => `${WEEKDAY[d]} ${j(r.weekly?.[d])}`).join(' / ');
  return (r.cycle || []).map((st, i) => `${i + 1}) ${j(st)}`).join(' → ');
};

const toggle = (list = [], g) => (list.includes(g) ? list.filter(x => x !== g) : [...list, g]);

const Chips = ({ value = [], onToggle }) => (
  <div className="flex flex-wrap gap-1">
    {ROUTINE_GROUPS.map(g => {
      const on = value.includes(g);
      return (
        <button key={g} onClick={() => onToggle(g)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all active:scale-95 ${on ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-white text-neutral-500 border-neutral-200'}`}>{g}</button>
      );
    })}
  </div>
);

export function CoachRoutineEditor({ routine, startType, suggestWeekly, onSave, onClose }) {
  const [type, setType] = useState(startType || routine?.type || 'weekly');
  const [weekly, setWeekly] = useState(() => ({ ...(routine?.weekly || {}) }));
  const [cycle, setCycle] = useState(() => (routine?.cycle?.length ? routine.cycle.map(st => [...st]) : [[], [], []]));
  const [note, setNote] = useState(routine?.note || '');
  const usual = suggestWeekly ? suggestWeekly() : null;

  const save = () => {
    if (type === 'none') { onSave({ type: 'none', note: note.trim() }); return; }
    if (type === 'weekly') { onSave({ type: 'weekly', weekly, note: note.trim() }); return; }
    onSave({ type: 'cycle', cycle: cycle.filter(st => st.length), note: note.trim() });
  };
  const canSave = type === 'none' || (type === 'weekly' ? Object.values(weekly).some(v => v && v.length) : cycle.some(st => st.length));

  return (
    <div className="absolute inset-0 z-30 bg-white flex flex-col animate-fade-in">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100">
        <div>
          <div className="text-lg font-black text-neutral-900">내 운동 루틴</div>
          <div className="text-[11px] font-bold text-neutral-400">코치가 이 루틴에 맞춰 오늘 운동을 추천해요</div>
        </div>
        <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full hover:bg-neutral-100"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50">
        <div className="grid grid-cols-3 bg-neutral-100 rounded-xl p-1 text-[12px] font-black">
          {TYPES.map(t => <button key={t.id} onClick={() => setType(t.id)} className={`py-2 rounded-lg transition-all ${type === t.id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}>{t.l}</button>)}
        </div>

        {type === 'weekly' && (
          <>
            <p className="text-[12px] font-bold text-neutral-500 leading-relaxed">요일마다 하는 부위를 골라 주세요. 아무것도 안 고르면 쉬는 날이에요.</p>
            <button onClick={() => usual && setWeekly(Object.fromEntries(Object.entries(usual).map(([d, gs]) => [d, gs])))} disabled={!usual}
              className="w-full py-2.5 rounded-xl border border-[#4768ff]/25 bg-white text-[12px] font-black text-[#4768ff] flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all">
              <BarChart2 className="w-4 h-4" />{usual ? '최근 8주 운동 기록으로 채우기' : '기록이 더 쌓이면 자동으로 채울 수 있어요'}
            </button>
            <div className="space-y-2">
              {WEEK_ORDER.map(d => (
                <div key={d} className="bg-white rounded-2xl border border-neutral-100 p-3 flex gap-3 items-start">
                  <div className={`w-8 pt-1 text-sm font-black flex-shrink-0 ${d === 0 ? 'text-rose-400' : d === 6 ? 'text-blue-400' : 'text-neutral-800'}`}>{WEEKDAY[d]}</div>
                  <div className="flex-1 space-y-1">
                    <Chips value={weekly[d] || []} onToggle={(g) => setWeekly(w => ({ ...w, [d]: toggle(w[d], g) }))} />
                    {!(weekly[d] || []).length && <div className="text-[10px] font-bold text-neutral-400">휴식</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {type === 'cycle' && (
          <>
            <p className="text-[12px] font-bold text-neutral-500 leading-relaxed">요일과 상관없이 운동하는 날마다 순서대로 돌리는 방식이에요. 코치가 지난 운동을 보고 오늘 차례를 찾아요.</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => <button key={p.l} onClick={() => setCycle(p.cycle.map(st => [...st]))} className="px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-white border border-neutral-200 text-neutral-700 active:scale-95">{p.l}</button>)}
            </div>
            <div className="space-y-2">
              {cycle.map((st, i) => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-3 flex gap-3 items-start">
                  <div className="w-12 pt-1 text-[12px] font-black text-neutral-800 flex-shrink-0">{i + 1}일차</div>
                  <div className="flex-1"><Chips value={st} onToggle={(g) => setCycle(c => c.map((x, k) => (k === i ? toggle(x, g) : x)))} /></div>
                  {cycle.length > 1 && <button onClick={() => setCycle(c => c.filter((_, k) => k !== i))} aria-label="이 날 빼기" className="p-1 text-neutral-300 hover:text-rose-500"><X className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
            {cycle.length < 7 && <button onClick={() => setCycle(c => [...c, []])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-neutral-200 text-[12px] font-black text-neutral-400 flex items-center justify-center gap-1"><Plus className="w-4 h-4" />날 추가</button>}
          </>
        )}

        {type === 'none' && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-4 text-[13px] font-bold text-neutral-600 leading-relaxed">
            괜찮아요! 정해진 루틴이 없으면 코치가 부위별 회복도, 이번 주에 덜 한 부위, 평소 운동 습관을 보고 그날그날 알맞은 운동을 추천해요.
          </div>
        )}

        <div>
          <div className="text-[11px] font-black text-neutral-500 mb-1.5">메모 (선택)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={200} placeholder="예: 화·목은 30분만 가능, 왼쪽 어깨 조심, 집에서는 덤벨만"
            className="w-full resize-none bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-[13px] font-bold outline-none focus:border-[#4768ff] placeholder:text-neutral-300" />
        </div>
      </div>

      <div className="p-4 border-t border-neutral-100 bg-white">
        <button onClick={save} disabled={!canSave} className="w-full py-3 rounded-xl bg-[#4768ff] text-white font-black disabled:bg-neutral-200 active:scale-95 transition-all">저장하기</button>
      </div>
    </div>
  );
}
