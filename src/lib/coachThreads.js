// AI 코치 대화 목록 (이 기기에만 저장). { threads: [{ id, title, createdAt, updatedAt, msgs }], currentId }
// currentId 가 null 이면 '새 채팅' 화면 — 첫 질문을 보낼 때 대화가 만들어진다
const KEY = 'gymspirit_coach_threads_v1';
const OLD_KEY = 'gymspirit_coach_chat_v1'; // 대화가 하나뿐이던 예전 저장 방식
export const MAX_THREADS = 30;
export const MAX_MSGS = 40;

export const titleOf = (msgs) => {
  const first = (msgs || []).find(m => m.role === 'user');
  const t = first ? String(first.content).replace(/\s+/g, ' ').trim() : '';
  return t ? (t.length > 28 ? `${t.slice(0, 28)}…` : t) : '새 채팅';
};

export const newThreadId = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const loadThreads = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && Array.isArray(v.threads)) return { threads: v.threads, currentId: v.currentId || null };
  } catch { /* 아래에서 예전 방식 확인 */ }
  try {
    const old = JSON.parse(localStorage.getItem(OLD_KEY));
    if (Array.isArray(old) && old.length) {
      const now = Date.now();
      const t = { id: newThreadId(), title: titleOf(old), createdAt: now, updatedAt: now, msgs: old };
      return { threads: [t], currentId: t.id };
    }
  } catch { /* 없으면 빈 목록 */ }
  return { threads: [], currentId: null };
};

export const saveThreads = (store) => {
  try {
    const threads = store.threads
      .map(t => ({ ...t, msgs: t.msgs.filter(m => !m.pending).slice(-MAX_MSGS) }))
      .filter(t => t.msgs.length)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_THREADS);
    localStorage.setItem(KEY, JSON.stringify({ threads, currentId: store.currentId }));
    localStorage.removeItem(OLD_KEY);
  } catch { /* 저장 못 해도 화면에서는 유지 */ }
};

// '오늘 14:05' / '어제' / '11월 2일'
export const whenLabel = (ts, now = new Date()) => {
  const d = new Date(ts);
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return `오늘 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diff === 1) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};
