import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CalendarDays, ChevronDown, Dumbbell, List, Play, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
import { supabase } from '../cloud.js';
import { mentionedExercises, parseRoutine, visibleText } from '../lib/coachRoutine.js';
import { CoachRoutineEditor, routineSummary } from './CoachRoutineEditor.jsx';
import { loadThreads, newThreadId, saveThreads, titleOf, whenLabel } from '../lib/coachThreads.js';

// AI 코치와 대화 — 질문할 때마다 '내 기록' 요약을 같이 보내고, 서버(/api/coach)가 NVIDIA 모델에 물어 답을 흘려보낸다
// 대화는 이 기기에만 저장 (대화 30개, 대화마다 최근 40개 — lib/coachThreads.js)
const MODE_KEY = 'gymspirit_coach_mode_v1';
const MODES = [{ id: 'deep', label: '🧠 꼼꼼하게', hint: '약 20초' }, { id: 'fast', label: '⚡ 빠르게', hint: '약 3초' }];
const QUICK = [
  '오늘 뭐 운동하면 좋을까요?',
  '다음 운동 때 무게를 얼마로 올릴까요?',
  '오늘 남은 끼니 뭐 먹을까요?',
  '이번 주 운동 평가해 주세요',
  '요즘 정체기 같아요. 어떻게 바꿀까요?',
];

// 운동 조언을 묻는 질문인지 (내 루틴을 아직 모르면 먼저 물어본다)
const WORKOUT_Q = /운동|루틴|부위|무게|세트|분할|스케줄|가슴|등|하체|어깨|팔|복근|스쿼트|벤치|데드/;

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

// 지난 대화 목록
const ThreadList = ({ threads, currentId, onOpen, onNew, onDelete, onClose }) => {
  const [confirm, setConfirm] = useState(null);
  const sorted = [...threads].filter(t => t.msgs.length).sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="absolute inset-0 z-30 bg-white flex flex-col animate-fade-in">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100">
        <div>
          <div className="text-lg font-black text-neutral-900">대화 목록</div>
          <div className="text-[11px] font-bold text-neutral-400">이 기기에 저장된 코치와의 대화 (최근 30개)</div>
        </div>
        <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full hover:bg-neutral-100"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-50">
        <button onClick={onNew} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#4768ff]/30 text-[13px] font-black text-[#4768ff] flex items-center justify-center gap-1.5 bg-white active:scale-[0.98] transition-all"><Plus className="w-4 h-4" />새 채팅 시작하기</button>
        {sorted.length === 0 && <div className="text-center text-sm font-bold text-neutral-400 py-10">아직 저장된 대화가 없어요.</div>}
        {sorted.map(t => {
          const last = [...t.msgs].reverse().find(m => m.role === 'assistant' && !m.error);
          const snippet = last ? visibleText(last.content).replace(/\*\*/g, '').replace(/\s+/g, ' ').slice(0, 60) : '';
          return (
            <div key={t.id} className={`bg-white rounded-2xl border p-3.5 flex items-start gap-3 ${t.id === currentId ? 'border-[#4768ff]/40 shadow-sm' : 'border-neutral-100'}`}>
              <button onClick={() => onOpen(t.id)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  {t.id === currentId && <span className="text-[9px] font-black text-white bg-[#4768ff] rounded px-1.5 py-0.5 flex-shrink-0">보는 중</span>}
                  <div className="text-[14px] font-black text-neutral-900 truncate">{t.title}</div>
                </div>
                {snippet && <div className="text-[11px] font-bold text-neutral-400 truncate mt-0.5">{snippet}</div>}
                <div className="text-[10px] font-bold text-neutral-300 mt-1">{whenLabel(t.updatedAt)} · 질문 {t.msgs.filter(m => m.role === 'user').length}개</div>
              </button>
              {confirm === t.id ? (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => { onDelete(t.id); setConfirm(null); }} className="text-[11px] font-black text-white bg-rose-500 rounded-lg px-2.5 py-1.5">삭제</button>
                  <button onClick={() => setConfirm(null)} className="text-[11px] font-bold text-neutral-400 px-2.5 py-1">취소</button>
                </div>
              ) : (
                <button onClick={() => setConfirm(t.id)} aria-label="대화 삭제" className="p-2 text-neutral-300 hover:text-rose-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// **굵게** 정도만 살린다
const Rich = ({ text }) => text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
  part.startsWith('**') && part.endsWith('**') ? <b key={i} className="font-black text-neutral-900">{part.slice(2, -2)}</b> : <React.Fragment key={i}>{part.replace(/^#{1,4}\s/gm, '')}</React.Fragment>
));

// topic: 종목 설명서에서 열 때 { title, context, quick } — 새 대화로 시작하고, 첫 질문에 종목 정보를 같이 보낸다
export function CoachChat({ topic, seed, onSeedUsed, getContext, canChat, exercises = [], hasGuide = () => false, onOpenGuide = () => {}, onStartRoutine, coachRoutine, onSaveRoutine, suggestWeekly }) {
  const [store, setStore] = useState(loadThreads);
  const [showList, setShowList] = useState(false);
  const current = store.threads.find(t => t.id === store.currentId) || null;
  const msgs = current ? current.msgs : [];
  // 대화 하나의 메시지를 바꾼다 (답을 받는 중 다른 대화로 옮겨도 원래 대화에 들어가게 id 로 찾는다)
  const setMsgsOf = (id, fn) => setStore(st => ({
    ...st,
    threads: st.threads.map(t => (t.id === id ? { ...t, msgs: fn(t.msgs), updatedAt: Date.now() } : t)),
  }));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCtx, setShowCtx] = useState(false);
  const [mode, setMode] = useState(() => { try { return localStorage.getItem(MODE_KEY) === 'fast' ? 'fast' : 'deep'; } catch { return 'deep'; } });
  const pickMode = (m) => { setMode(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* 이번만 적용 */ } };
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const allowed = canChat || import.meta.env.DEV;
  const [editor, setEditor] = useState(null); // { startType } — 내 루틴 설정 화면
  const [asking, setAsking] = useState(null); // 루틴을 묻는 동안 잠깐 미뤄 둔 질문
  const [queued, setQueued] = useState(null); // 루틴 저장 뒤 (새 루틴이 반영된 다음) 보낼 질문
  const askedRef = useRef(false);
  const routineText = routineSummary(coachRoutine);

  useEffect(() => { saveThreads(store); }, [store]);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [msgs]);
  useEffect(() => () => abortRef.current?.abort(), []);

  // display: 화면에 보일 짧은 글 (상담 메뉴에서 넘어올 때 긴 내용은 코치에게만 보낸다). fresh: 새 대화로 보낸다
  const send = async (raw, { display, fresh } = {}) => {
    const text = String(raw || '').trim();
    if (!text || busy || !allowed) return;
    const base = fresh ? [] : msgs;
    // 종목 대화의 첫 질문에는 종목 정보(설명·내 기록)를 붙인다. 화면에는 질문만
    const withTopic = topic && !base.length && !display;
    const history = [...base.filter(m => !m.error), { role: 'user', content: withTopic ? `${topic.context}\n\n질문: ${text}` : text, ...(display || withTopic ? { display: display || text } : {}) }];
    // 새 채팅이면 첫 질문을 보낼 때 대화를 만든다
    const id = current && !fresh ? current.id : newThreadId();
    if (current && !fresh) setMsgsOf(id, () => [...history, { role: 'assistant', content: '', pending: true }]);
    else {
      const now = Date.now();
      setStore(st => ({ threads: [{ id, title: titleOf(history), createdAt: now, updatedAt: now, msgs: [...history, { role: 'assistant', content: '', pending: true }] }, ...st.threads], currentId: id }));
    }
    const setMsgs = (fn) => setMsgsOf(id, fn);
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

  // 루틴을 아직 모르는데 운동 조언을 물으면, 한 번만 먼저 루틴이 있는지 묻는다
  const ask = (raw) => {
    const text = String(raw || '').trim();
    if (!text || busy || !allowed) return;
    if (!coachRoutine?.type && onSaveRoutine && !askedRef.current && !topic && WORKOUT_Q.test(text)) {
      askedRef.current = true;
      setAsking(text);
      setInput('');
      return;
    }
    send(text);
  };
  const saveRoutine = (r) => {
    onSaveRoutine(r);
    setEditor(null);
    if (asking) { setQueued(asking); setAsking(null); }
  };
  const skipAsking = () => { const q = asking; setAsking(null); send(q); };
  // 저장한 루틴이 화면(props)에 들어온 뒤 미뤄 둔 질문을 보낸다
  useEffect(() => { if (queued && coachRoutine?.type) { send(queued); setQueued(null); } }, [coachRoutine, queued]); // eslint-disable-line react-hooks/exhaustive-deps
  // 종목 대화는 새 채팅으로 시작
  useEffect(() => { if (topic) setStore(st => ({ ...st, currentId: null })); }, [topic?.title]); // eslint-disable-line react-hooks/exhaustive-deps
  // 상담 메뉴에서 넘어온 주제: 새 대화로 바로 묻는다
  useEffect(() => {
    if (!seed || !allowed) return;
    setAsking(null);
    send(topic ? `${topic.context}\n\n${seed.content}` : seed.content, { display: seed.display, fresh: true });
    onSeedUsed?.(); // 탭을 오가며 다시 그려져도 같은 주제를 또 보내지 않게
  }, [seed?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const newChat = () => { setStore(st => ({ ...st, currentId: null })); setAsking(null); setShowList(false); setInput(''); };
  const openThread = (id) => { setStore(st => ({ ...st, currentId: id })); setAsking(null); setShowList(false); };
  const deleteThread = (id) => setStore(st => ({ threads: st.threads.filter(t => t.id !== id), currentId: st.currentId === id ? null : st.currentId }));
  const savedCount = store.threads.filter(t => t.msgs.length).length;

  return (
    <div className="relative flex flex-col h-full bg-neutral-50">
      {allowed && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-neutral-100">
          <button onClick={() => setShowList(true)} className="flex items-center gap-1.5 text-[12px] font-black text-neutral-600 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 active:scale-95 flex-shrink-0"><List className="w-4 h-4" />대화 목록{savedCount ? <span className="text-neutral-400">{savedCount}</span> : null}</button>
          <div className="flex-1 min-w-0 text-center text-[12px] font-black text-neutral-800 truncate">{current ? current.title : '새 채팅'}</div>
          <button onClick={newChat} disabled={!current} className="flex items-center gap-1 text-[12px] font-black text-[#4768ff] px-2.5 py-1.5 rounded-lg hover:bg-[#4768ff]/5 active:scale-95 disabled:opacity-40 flex-shrink-0"><Plus className="w-4 h-4" />새 채팅</button>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        <div className="bg-gradient-to-br from-[#4768ff] to-indigo-500 text-white rounded-3xl p-4 shadow-md shadow-[#4768ff]/20">
          <div className="flex items-center gap-2 text-[15px] font-black"><Sparkles className="w-4 h-4" />{topic ? `「${topic.title}」 물어보기` : '스피릿 코치에게 물어보기'}</div>
          <p className="text-[12px] font-bold text-white/85 mt-1 leading-relaxed">{topic ? '이 종목 설명과 내 기록(지난 무게·다음 무게 추천)을 보고 답해요.' : '최근 2주 운동·부위별 회복도·오늘 식단·체성분을 보고 답해요.'}</p>
          <button onClick={() => setShowCtx(v => !v)} className="mt-2 text-[11px] font-black text-white/90 flex items-center gap-1">코치가 보는 내 기록 {showCtx ? '접기' : '보기'}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCtx ? 'rotate-180' : ''}`} /></button>
          {showCtx && <pre className="mt-2 bg-black/15 rounded-xl p-2.5 text-[10px] font-bold whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{getContext()}</pre>}
        </div>

        {allowed && onSaveRoutine && (
          <button onClick={() => setEditor({})} className="w-full text-left bg-white border border-neutral-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all">
            <CalendarDays className="w-5 h-5 text-[#4768ff] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-black text-neutral-800">내 운동 루틴</div>
              <div className="text-[11px] font-bold text-neutral-400 truncate">{routineText || '아직 안 알려주셨어요 · 알려주면 루틴에 맞춰 조언해요'}</div>
            </div>
            <span className="text-[11px] font-black text-[#4768ff] flex-shrink-0">{routineText ? '수정' : '설정하기'}</span>
          </button>
        )}

        {!allowed && (
          <div className="bg-white border border-neutral-100 rounded-2xl p-4 text-sm font-bold text-neutral-600">로그인한 계정에서만 쓸 수 있어요. 게스트 모드에서는 위쪽 '상담 메뉴'를 이용해 주세요.</div>
        )}

        {msgs.length === 0 && allowed && !asking && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(topic?.quick || QUICK).map(q => <button key={q} onClick={() => (topic ? send(q) : ask(q))} className="text-[12px] font-black px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 active:scale-95 transition-all hover:border-[#4768ff]">{q}</button>)}
          </div>
        )}

        {msgs.map((m, i) => {
          const routine = m.role === 'assistant' && !m.pending && !m.error ? parseRoutine(m.content, exercises) : null;
          const mentions = m.role === 'assistant' && !m.pending && !m.error && !routine ? mentionedExercises(m.content, exercises).filter(e => hasGuide(e.id)) : [];
          const shown = m.role === 'assistant' ? visibleText(m.content) : m.content;
          return m.role === 'user' ? (
          <div key={i} className="flex justify-end"><div className="bg-[#4768ff] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-black max-w-[82%] whitespace-pre-wrap shadow-sm">{m.display || m.content}</div></div>
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

        {asking && (
          <>
            <div className="flex justify-end"><div className="bg-[#4768ff] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-black max-w-[82%] whitespace-pre-wrap shadow-sm">{asking}</div></div>
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4768ff] to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm"><Sparkles className="w-4 h-4 text-white" /></div>
              <div className="max-w-[85%] flex-1 space-y-2">
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-bold leading-relaxed bg-white border border-neutral-100 text-neutral-700 shadow-sm">
                  운동 조언 전에 하나만 여쭤볼게요. <b className="font-black text-neutral-900">정해진 운동 루틴</b>이 있으신가요? 알려주시면 그 루틴에 맞춰 추천해 드릴게요.
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button onClick={() => setEditor({ startType: 'weekly' })} className="text-left text-[12px] font-black px-3 py-2.5 rounded-xl bg-white border border-[#4768ff]/25 text-[#4768ff] active:scale-95">📅 요일마다 하는 부위가 정해져 있어요</button>
                  <button onClick={() => setEditor({ startType: 'cycle' })} className="text-left text-[12px] font-black px-3 py-2.5 rounded-xl bg-white border border-[#4768ff]/25 text-[#4768ff] active:scale-95">🔁 분할 순서대로 돌려요 (예: 가슴→등→하체)</button>
                  <button onClick={() => saveRoutine({ type: 'none' })} className="text-left text-[12px] font-black px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 active:scale-95">🙅 정해진 루틴은 없어요</button>
                  <button onClick={skipAsking} className="text-left text-[11px] font-bold px-3 py-2 text-neutral-400">나중에 할게요 · 그냥 답해 주세요</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-neutral-100 bg-white px-4 pt-3 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-black text-neutral-400 mr-0.5">답변</span>
          {MODES.map(m => (
            <button key={m.id} onClick={() => pickMode(m.id)} disabled={busy} className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${mode === m.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{m.label} <span className="opacity-60 font-bold">{m.hint}</span></button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(input); } }}
            rows={1}
            disabled={!allowed}
            placeholder={allowed ? '운동·식단·회복, 무엇이든 물어보세요' : '로그인 후 이용할 수 있어요'}
            className="flex-1 resize-none bg-neutral-100 rounded-xl px-3.5 py-3 text-sm font-bold outline-none max-h-28 placeholder:text-neutral-400 disabled:opacity-60"
          />
          <button onClick={() => ask(input)} disabled={!allowed || busy || !input.trim() || !!asking} aria-label="보내기" className="p-3 rounded-xl bg-[#4768ff] text-white disabled:bg-neutral-200 active:scale-90 transition-all"><Send className="w-5 h-5" /></button>
        </div>
        <p className="text-[10px] font-bold text-neutral-400 mt-2 text-center">AI 답변은 틀릴 수 있어요 · 통증·부상은 꼭 병원 진료를 받으세요</p>
      </div>
      {showList && <ThreadList threads={store.threads} currentId={store.currentId} onOpen={openThread} onNew={newChat} onDelete={deleteThread} onClose={() => setShowList(false)} />}
      {editor && <CoachRoutineEditor routine={coachRoutine} startType={editor.startType} suggestWeekly={suggestWeekly} onSave={saveRoutine} onClose={() => setEditor(null)} />}
    </div>
  );
}
