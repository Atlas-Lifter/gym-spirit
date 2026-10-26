import React, { useEffect, useRef, useState } from 'react';
import { GmBadge } from './GmBadge.jsx';
import { isGmOn } from './admin.js';
import { Search, UserPlus, Check, Clock, X, Share2 } from 'lucide-react';
import { Sheet, Segmented, Avatar } from './RankingTab.jsx';

// 친구 센터: 닉네임으로 유저 찾기, 받은 요청 수락/거절, 내 친구 목록, 초대 링크
export const FriendCenter = ({ open, onClose, isCloud, onLogin, friends, sent, incoming, profilesById, onSearch, onRequest, onAccept, onDecline, onRemove, onInvite, Avatar3 }) => {
  const [tab, setTab] = useState('find');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(null); // 처리 중인 유저/요청 id
  const [confirmRemove, setConfirmRemove] = useState(null);
  const seq = useRef(0);

  // 열릴 때 받은 요청이 있으면 그 탭부터 보여준다
  useEffect(() => { if (open) setTab(incoming.length ? 'incoming' : 'find'); }, [open]);

  // 입력이 잠깐 멈추면 검색 (빈 칸이면 최근 활동한 유저)
  useEffect(() => {
    if (!open || tab !== 'find') return undefined;
    const my = ++seq.current;
    setSearching(true);
    const t = setTimeout(async () => {
      try { const list = await onSearch(query); if (my === seq.current) setResults(list); }
      catch (e) { if (my === seq.current) setResults([]); }
      finally { if (my === seq.current) setSearching(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query, open, tab]);

  const run = async (id, fn) => { setBusy(id); try { await fn(); } finally { setBusy(null); } };
  const userOf = (id) => profilesById[id] || { id, name: '짐스피릿 유저', profile: null };

  const Row = ({ u, right, sub }) => (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-50 last:border-0">
      <Avatar user={u} size={44} Avatar3={Avatar3} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black text-neutral-900 truncate flex items-center gap-1">{u.name}{isGmOn(u.id, u.profile) && <GmBadge small />}</div>
        <div className="text-[11px] font-bold text-neutral-400 truncate">{sub ?? (u.volume == null ? '친구가 되면 서로의 운동 기록이 보여요' : `이번 주 ${Number(u.volume || 0).toLocaleString()}kg · 3대 ${u.lift || 0}kg`)}</div>
      </div>
      {right}
    </div>
  );

  const actionFor = (u) => {
    if (friends.includes(u.id)) return <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-black flex items-center gap-1"><Check className="w-3.5 h-3.5" /> 친구</span>;
    if (sent.includes(u.id)) return <span className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-black flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 대기 중</span>;
    const req = incoming.find(r => r.from === u.id);
    if (req) return <button disabled={busy === req.requestId} onClick={() => run(req.requestId, () => onAccept(req.requestId))} className="px-3 py-2 rounded-xl bg-[#4768ff] text-white text-xs font-black active:scale-95 transition-transform disabled:opacity-50">수락</button>;
    return <button disabled={busy === u.id} onClick={() => run(u.id, () => onRequest(u.id))} className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-black flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"><UserPlus className="w-3.5 h-3.5" /> 추가</button>;
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-neutral-900">친구</h3>
        <div className="flex items-center gap-2">
          <button onClick={onInvite} className="px-3 py-2 rounded-xl bg-[#eef2ff] text-[#4768ff] text-xs font-black flex items-center gap-1 active:scale-95 transition-transform"><Share2 className="w-3.5 h-3.5" /> 초대 링크</button>
          <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full bg-neutral-100 text-neutral-500 active:scale-90 transition-transform"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {!isCloud ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm font-black text-neutral-900 mb-1">친구 기능은 회원 전용이에요</p>
          <p className="text-xs font-bold text-neutral-500 mb-5 leading-relaxed">게스트 기록은 이 기기에만 저장돼요.<br />가입하면 친구 요청이 상대방에게 바로 전달돼요.</p>
          <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-black active:scale-95 transition-transform">회원가입 / 로그인</button>
        </div>
      ) : (
        <>
          <Segmented value={tab} onChange={setTab} options={[
            ['find', '찾기'],
            ['incoming', `받은 요청${incoming.length ? ` ${incoming.length}` : ''}`],
            ['friends', `내 친구${friends.length ? ` ${friends.length}` : ''}`],
          ]} />

          {tab === 'find' && (
            <div className="mt-4">
              <div className="flex items-center gap-2 bg-neutral-100 rounded-2xl px-4 py-3 mb-2">
                <Search className="w-4 h-4 text-neutral-400" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="닉네임으로 검색" className="flex-1 bg-transparent outline-none text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
                {searching && <div className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-[#4768ff] animate-spin" />}
              </div>
              {!query && <div className="text-[11px] font-bold text-neutral-400 mb-1">최근 활동한 유저</div>}
              {results.map(u => <Row key={u.id} u={u} right={actionFor(u)} />)}
              {!searching && results.length === 0 && (
                <div className="text-center py-8 text-xs font-bold text-neutral-400">{query ? `'${query}' 닉네임을 찾지 못했어요` : '아직 다른 유저가 없어요. 초대 링크를 보내 보세요!'}</div>
              )}
            </div>
          )}

          {tab === 'incoming' && (
            <div className="mt-4">
              {incoming.length === 0 && <div className="text-center py-10 text-xs font-bold text-neutral-400">받은 친구 요청이 없어요</div>}
              {incoming.map(r => {
                const u = userOf(r.from);
                return (
                  <Row key={r.requestId} u={u} sub="친구가 되고 싶어 해요" right={
                    <div className="flex gap-1.5">
                      <button disabled={busy === r.requestId} onClick={() => run(r.requestId, () => onDecline(r.requestId))} className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-black active:scale-95 transition-transform disabled:opacity-50">거절</button>
                      <button disabled={busy === r.requestId} onClick={() => run(r.requestId, () => onAccept(r.requestId))} className="px-3 py-2 rounded-xl bg-[#4768ff] text-white text-xs font-black active:scale-95 transition-transform disabled:opacity-50">수락</button>
                    </div>
                  } />
                );
              })}
            </div>
          )}

          {tab === 'friends' && (
            <div className="mt-4">
              {friends.length === 0 && <div className="text-center py-10 text-xs font-bold text-neutral-400">아직 친구가 없어요. '찾기'에서 친구를 추가해 보세요</div>}
              {friends.map(id => {
                const u = userOf(id);
                return (
                  <Row key={id} u={u} right={confirmRemove === id ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => setConfirmRemove(null)} className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-black">취소</button>
                      <button disabled={busy === id} onClick={() => run(id, async () => { await onRemove(id); setConfirmRemove(null); })} className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-black disabled:opacity-50">삭제</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemove(id)} className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-black active:scale-95 transition-transform">친구 끊기</button>
                  )} />
                );
              })}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
};
