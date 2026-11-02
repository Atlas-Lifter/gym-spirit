import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, Dumbbell, Play, Send, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '../cloud.js';
import { mentionedExercises, parseRoutine, visibleText } from '../lib/coachRoutine.js';

// AI 코치와 대화 — 질문할 때마다 '내 기록' 요약을 같이 보내고, 서버(/api/coach)가 NVIDIA 모델에 물어 답을 흘려보낸다
// 대화는 이 기기에만 저장 (최근 40개)
const STORE_KEY = 'gymspirit_coach_chat_v1';
const MODE_KEY = 'gymspirit_coach_mode_v1';
const MODES = [{ id: 'deep', label: '🧠 꼼꼼하게', hint: '약 20초' }, { id: 'fast', label: '⚡ 빠르게', hint: '약 3초' }];
const QUICK = [
  '오늘 뭐 운동하면 좋을까요?',
  '다음 운동 때 무게를 얼마로 올릴까요?',
  '오늘 남은 끼니 뭐 먹을까요?',
  '이번 주 운동 평가해 주세요',
  '요즘 정체기 같아요. 어떻게 바꿀까요?',
];

const loadChat = () => { try { const v = JSON.parse(localStorage.getItem(STORE_KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
const saveChat = (msgs) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-40))); } catch { /* 저장 못 해도 화면에서는 유지 */ } };

// 코치가 짜 준 루틴 카드: 앱 종목으로 찾은 것만 운동에 넣는다
const RoutineCard = ({ routine, hasGuide, onOpenGuide, onStart }) => {
  const usable = routine.items.filter(it => it.exercise);
  return (
    <div className="bg-white border border-[#4768ff]/20 rounded-2xl p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black text-neutral-900 flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-[#4768ff]" />{routine.title}</div>
        <div className="text-[10px] font-black text-neutral-400">{usable.length}종목</div>
      </div>
      <div className="space-y-1.5">
        {routine.items.map((it, k) => (
          <div key={k} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${it.exercise ? 'bg-neutral-50' : 'bg-neutral-50/60 opacity-60'}`}>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-black text-neutral-800 truncate">{it.exercise ? it.exercise.name : it.name}</div>
              <div className="text-[10px] font-bold text-neutral-500">
                {it.exercise ? `${it.sets}세트${it.reps ? ` × ${it.reps}회` : ''} · ${it.weight ? `${it.weight}kg` : '무게는 직접 입력'}` : '앱에 없는 종목이라 빼고 시작해요'}
              </div>
            </div>
            {it.exercise && hasGuide(it.exercise.id) && (
              <button onClick={() => onOpenGuide(it.exercise.id)} className="text-[10px] font-black text-[#4768ff] bg-white border border-[#4768ff]/20 rounded-lg px-2 py-1 flex items-center gap-1 active:scale-95"><BookOpen className="w-3 h-3" />자세</button>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => onStart({ title: routine.title, items: usable })} disabled={!usable.length} className="w-full py-2.5 rounded-xl bg-[#4768ff] text-white text-sm font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:bg-neutral-200">
        <Play className="w-4 h-4 fill-white" />이 루틴으로 운동 시작
      </button>
    </div>
  );
};

// **굵게** 정도만 살린다
const Rich = ({ text }) => text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
  part.startsWith('**') && part.endsWith('**') ? <b key={i} className="font-black text-neutral-900">{part.slice(2, -2)}</b> : <React.Fragment key={i}>{part.replace(/^#{1,4}\s/gm, '')}</React.Fragment>
));

export function CoachChat({ getContext, canChat, exercises = [], hasGuide = () => false, onOpenGuide = () => {}, onStartRoutine }) {
  const [msgs, setMsgs] = useState(loadChat);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCtx, setShowCtx] = useState(false);
  const [mode, setMode] = useState(() => { try { return localStorage.getItem(MODE_KEY) === 'fast' ? 'fast' : 'deep'; } catch { return 'deep'; } });
  const pickMode = (m) => { setMode(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* 이번만 적용 */ } };
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const allowed = canChat || import.meta.env.DEV;

  useEffect(() => { saveChat(msgs.filter(m => !m.pending)); }, [msgs]);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [msgs]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (raw) => {
    const text = String(raw || '').trim();
    if (!text || busy || !allowed) return;
    const history = [...msgs.filter(m => !m.error), { role: 'user', content: text }];
    setMsgs([...history, { role: 'assistant', content: '', pending: true }]);
    setInput('');
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const finish = (content, error) => setMsgs(prev => [...prev.slice(0, -1), { role: 'assistant', content, ...(error ? { error: true } : {}) }]);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const res = await fetch('/api/coach', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: history.slice(-12).map(({ role, content }) => ({ role, content: role === 'assistant' ? visibleText(content) : content })), context: getContext(), mode }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        finish(j.error || `코치 연결에 실패했어요 (${res.status})`, true);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs(prev => [...prev.slice(0, -1), { role: 'assistant', content: acc, pending: true }]);
      }
      finish(acc.trim() || '답을 받지 못했어요. 다시 물어봐 주세요.', !acc.trim());
    } catch (e) {
      if (e.name !== 'AbortError') finish('인터넷 연결을 확인하고 다시 물어봐 주세요.', true);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => { abortRef.current?.abort(); setMsgs([]); setBusy(false); };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        <div className="bg-gradient-to-br from-[#4768ff] to-indigo-500 text-white rounded-3xl p-4 shadow-md shadow-[#4768ff]/20">
          <div className="flex items-center gap-2 text-[15px] font-black"><Sparkles className="w-4 h-4" />스피릿 코치에게 물어보기</div>
          <p className="text-[12px] font-bold text-white/85 mt-1 leading-relaxed">최근 2주 운동·부위별 회복도·오늘 식단·체성분을 보고 답해요.</p>
          <button onClick={() => setShowCtx(v => !v)} className="mt-2 text-[11px] font-black text-white/90 flex items-center gap-1">코치가 보는 내 기록 {showCtx ? '접기' : '보기'}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCtx ? 'rotate-180' : ''}`} /></button>
          {showCtx && <pre className="mt-2 bg-black/15 rounded-xl p-2.5 text-[10px] font-bold whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{getContext()}</pre>}
        </div>

        {!allowed && (
          <div className="bg-white border border-neutral-100 rounded-2xl p-4 text-sm font-bold text-neutral-600">로그인한 계정에서만 쓸 수 있어요. 게스트 모드에서는 위쪽 '상담 메뉴'를 이용해 주세요.</div>
        )}

        {msgs.length === 0 && allowed && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK.map(q => <button key={q} onClick={() => send(q)} className="text-[12px] font-black px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 active:scale-95 transition-all hover:border-[#4768ff]">{q}</button>)}
          </div>
        )}

        {msgs.map((m, i) => {
          const routine = m.role === 'assistant' && !m.pending && !m.error ? parseRoutine(m.content, exercises) : null;
          const mentions = m.role === 'assistant' && !m.pending && !m.error && !routine ? mentionedExercises(m.content, exercises).filter(e => hasGuide(e.id)) : [];
          const shown = m.role === 'assistant' ? visibleText(m.content) : m.content;
          return m.role === 'user' ? (
          <div key={i} className="flex justify-end"><div className="bg-[#4768ff] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-black max-w-[82%] whitespace-pre-wrap shadow-sm">{m.content}</div></div>
        ) : (
          <div key={i} className="flex gap-2.5 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4768ff] to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm"><Sparkles className="w-4 h-4 text-white" /></div>
            <div className="max-w-[85%] min-w-0 flex-1 space-y-2">
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-bold leading-relaxed whitespace-pre-wrap shadow-sm border ${m.error ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-white border-neutral-100 text-neutral-700'}`}>
              {shown ? <Rich text={shown} /> : (
                <span className="flex flex-col gap-1.5 py-0.5">
                  <span className="inline-flex gap-1">{[0, 1, 2].map(d => <span key={d} className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}</span>
                  <span className="text-[11px] font-bold text-neutral-400">내 기록을 살펴보는 중이에요 · {mode === 'fast' ? '보통 3초' : '보통 20초'}</span>
                </span>
              )}
            </div>
            {routine && onStartRoutine && <RoutineCard routine={routine} hasGuide={hasGuide} onOpenGuide={onOpenGuide} onStart={onStartRoutine} />}
            {mentions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mentions.map(e => <button key={e.id} onClick={() => onOpenGuide(e.id)} className="text-[11px] font-black text-[#4768ff] bg-white border border-[#4768ff]/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1 active:scale-95"><BookOpen className="w-3.5 h-3.5" />{e.name} 자세</button>)}
              </div>
            )}
            </div>
          </div>
          );
        })}
      </div>

      <div className="border-t border-neutral-100 bg-white px-4 pt-3 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-black text-neutral-400 mr-0.5">답변</span>
          {MODES.map(m => (
            <button key={m.id} onClick={() => pickMode(m.id)} disabled={busy} className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${mode === m.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{m.label} <span className="opacity-60 font-bold">{m.hint}</span></button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          {msgs.length > 0 && <button onClick={clear} aria-label="대화 지우기" className="p-3 rounded-xl text-neutral-400 hover:bg-neutral-100 active:scale-90 transition-all"><Trash2 className="w-5 h-5" /></button>}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
            rows={1}
            disabled={!allowed}
            placeholder={allowed ? '운동·식단·회복, 무엇이든 물어보세요' : '로그인 후 이용할 수 있어요'}
            className="flex-1 resize-none bg-neutral-100 rounded-xl px-3.5 py-3 text-sm font-bold outline-none max-h-28 placeholder:text-neutral-400 disabled:opacity-60"
          />
          <button onClick={() => send(input)} disabled={!allowed || busy || !input.trim()} aria-label="보내기" className="p-3 rounded-xl bg-[#4768ff] text-white disabled:bg-neutral-200 active:scale-90 transition-all"><Send className="w-5 h-5" /></button>
        </div>
        <p className="text-[10px] font-bold text-neutral-400 mt-2 text-center">AI 답변은 틀릴 수 있어요 · 통증·부상은 꼭 병원 진료를 받으세요</p>
      </div>
    </div>
  );
}
