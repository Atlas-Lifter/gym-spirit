import React, { useEffect, useState } from 'react';
import { X, Search, Megaphone, Trash2, RefreshCw } from 'lucide-react';
import { Sheet, Segmented } from './RankingTab.jsx';
import { GuildBadge } from './GuildCenter.jsx';
import { BossArt } from './BossArt.jsx';
import { bossOfWeek, BOSS_KINDS, BOSS_ELEMENTS, guildErrorText } from './guildSystem.js';
import { HERO_BG } from './theme.js';
import { GmBadge } from './GmBadge.jsx';

const num = (v) => Math.round(Number(v) || 0).toLocaleString();
const day = (iso) => (iso ? String(iso).slice(0, 10) : '-');

// 운영자 콘솔: 대시보드 · 전체 공지 · 회원 · 길드 · 게시판 · 보스 도감
// 모든 동작은 DB 함수에서 운영자인지 다시 확인한다
export const AdminConsole = ({ open, onClose, api, onToast, onNoticeChanged }) => {
  const [tab, setTab] = useState('home');
  const [ov, setOv] = useState(null);
  const [notice, setNotice] = useState('');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const run = async (key, fn, ok) => {
    setBusy(key);
    try { const r = await fn(); if (ok) onToast(ok); return r; }
    catch (e) { onToast(guildErrorText(e)); return null; }
    finally { setBusy(null); }
  };
  const loadTab = async (t = tab) => {
    if (t === 'home' || t === 'notice') { const r = await run('load', () => api.overview()); if (r) setOv(r); }
    if (t === 'users') { const r = await run('load', () => api.users(q)); if (r) setUsers(r); }
    if (t === 'guilds') { const r = await run('load', () => api.guilds(q)); if (r) setGuilds(r); }
    if (t === 'posts') { const r = await run('load', () => api.posts()); if (r) setPosts(r); }
  };
  useEffect(() => { if (open) { setConfirm(null); loadTab(tab); } }, [open, tab]);
  useEffect(() => { if (!open || !['users', 'guilds'].includes(tab)) return undefined; const t = setTimeout(() => loadTab(tab), 300); return () => clearTimeout(t); }, [q]);

  const boss = bossOfWeek();
  const ask = (key, label, fn) => confirm === key ? (
    <span className="flex gap-1">
      <button onClick={() => setConfirm(null)} className="px-2 py-1.5 rounded-lg bg-neutral-100 text-neutral-500 text-[11px] font-black">취소</button>
      <button disabled={!!busy} onClick={async () => { await fn(); setConfirm(null); }} className="px-2 py-1.5 rounded-lg bg-rose-500 text-white text-[11px] font-black">{label}</button>
    </span>
  ) : <button onClick={() => setConfirm(key)} className="px-2 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-black">{label}</button>;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="relative rounded-[24px] p-4 mb-4 text-white overflow-hidden" style={{ background: HERO_BG }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black tracking-[.25em] text-yellow-300">GM CONSOLE</div>
            <div className="text-xl font-black">운영자 콘솔</div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => loadTab(tab)} aria-label="새로고침" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><RefreshCw className={`w-4 h-4 ${busy === 'load' ? 'animate-spin' : ''}`} /></button>
            <button onClick={onClose} aria-label="닫기" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <Segmented value={tab} onChange={(t) => { setTab(t); setQ(''); }} options={[['home', '현황'], ['notice', '공지'], ['users', '회원'], ['guilds', '길드'], ['posts', '게시판'], ['boss', '보스']]} />

      {tab === 'home' && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[['전체 회원', ov?.users], ['최근 7일 가입', ov?.new_7d], ['이번 주 운동', ov?.active_week], ['길드', ov?.guilds], ['랭킹 등록 길드', ov?.ranked_guilds], ['개인 참가', ov?.solo_ranked], ['친구 관계', ov?.friendships], ['24시간 글', ov?.posts_24h], ['이번 주 총 볼륨', ov ? `${num(ov.week_volume / 1000)}t` : null]].map(([k, v]) => (
              <div key={k} className="bg-neutral-50 border border-neutral-100 rounded-2xl py-3 text-center">
                <div className="text-lg font-black text-neutral-900 tabular-nums">{v ?? '–'}</div>
                <div className="text-[10px] font-bold text-neutral-400">{k}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-2xl p-3 text-white" style={{ background: HERO_BG }}>
            <BossArt kind={boss.kind.key} element={boss.element} size={72} />
            <div className="min-w-0">
              <div className="text-[10px] font-black text-white/50">이번 주({boss.week}주차) 레이드 보스</div>
              <div className="text-sm font-black truncate">{boss.name}</div>
              <div className="text-[11px] font-bold text-white/50 truncate">{boss.line}</div>
            </div>
          </div>
          {ov?.notice && <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5">📢 게시 중인 공지: {ov.notice.body}</div>}
        </div>
      )}

      {tab === 'notice' && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold text-neutral-500">모든 회원의 홈 화면 맨 위와 알림 창에 공지가 떠요. 새로 올리면 이전 공지는 내려가요.</p>
          <textarea value={notice} onChange={e => setNotice(e.target.value.slice(0, 200))} rows={3} placeholder="예: 10/30(목) 새벽 2시~3시 서버 점검이 있어요." className="w-full resize-none bg-neutral-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-300" />
          <div className="flex gap-2">
            <button disabled={!notice.trim() || !!busy} onClick={async () => { const r = await run('notice', () => api.postNotice(notice.trim()), '📢 전체 공지를 올렸어요'); if (r !== null) { setNotice(''); onNoticeChanged(); loadTab('notice'); } }} className="flex-[2] py-3 rounded-2xl bg-amber-400 text-neutral-950 text-sm font-black flex items-center justify-center gap-1.5 disabled:opacity-40"><Megaphone className="w-4 h-4" /> 전체 공지 올리기</button>
            <button disabled={!ov?.notice || !!busy} onClick={async () => { const r = await run('end', () => api.endNotice(), '공지를 내렸어요'); if (r !== null) { onNoticeChanged(); loadTab('notice'); } }} className="flex-1 py-3 rounded-2xl bg-neutral-100 text-neutral-600 text-sm font-black disabled:opacity-40">공지 내리기</button>
          </div>
          {ov?.notice ? <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5">현재 공지 · {day(ov.notice.at)}<br /><span className="text-sm text-amber-950">{ov.notice.body}</span></div>
            : <div className="text-xs font-bold text-neutral-400 text-center py-3">게시 중인 공지가 없어요</div>}
        </div>
      )}

      {(tab === 'users' || tab === 'guilds') && (
        <div className="mt-4 flex items-center gap-2 bg-neutral-100 rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-neutral-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'users' ? '닉네임 검색 (비우면 최근 가입순)' : '길드 이름 검색'} className="flex-1 bg-transparent outline-none text-sm font-bold" />
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-2 py-3 border-b border-neutral-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-sm font-black text-neutral-900 truncate">{u.nickname}</span>{u.is_admin && <GmBadge small />}</div>
                <div className="text-[11px] font-bold text-neutral-400 truncate">가입 {day(u.joined_at)} · 이번 주 {num(u.volume)}kg · 3대 {num(u.lift)}kg{u.guild_name ? ` · ${u.guild_name}` : ''}</div>
              </div>
              {!u.is_admin && ask(`nick-${u.id}`, '닉네임 초기화', () => run('nick', () => api.resetNickname(u.id), `${u.nickname} → 짐스피릿 유저`).then(() => loadTab('users')))}
            </div>
          ))}
          {!users.length && busy !== 'load' && <div className="text-center py-8 text-xs font-bold text-neutral-400">회원이 없어요</div>}
        </div>
      )}

      {tab === 'guilds' && (
        <div className="mt-2">
          {guilds.map(g => (
            <div key={g.id} className="flex items-center gap-2 py-3 border-b border-neutral-50 last:border-0">
              <GuildBadge emblem={g.emblem} color={g.color} size={38} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-neutral-900 truncate">{g.name} <span className="text-[10px] text-neutral-400">Lv.{g.level}</span></div>
                <div className="text-[11px] font-bold text-neutral-400 truncate">관장 {g.leader || '-'} · 👥 {g.members} · {g.ranked ? '랭킹 등록' : '미등록'} · {day(g.created_at)}</div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                {g.ranked && <button disabled={!!busy} onClick={() => run('rank', () => api.setGuildRanked(g.id, false), '랭킹에서 내렸어요').then(() => loadTab('guilds'))} className="px-2 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 text-[11px] font-black">랭킹 내리기</button>}
                {ask(`dis-${g.id}`, '해산', () => run('dis', () => api.disbandGuild(g.id), `${g.name} 길드를 해산했어요`).then(() => loadTab('guilds')))}
              </div>
            </div>
          ))}
          {!guilds.length && busy !== 'load' && <div className="text-center py-8 text-xs font-bold text-neutral-400">길드가 없어요</div>}
        </div>
      )}

      {tab === 'posts' && (
        <div className="mt-4 space-y-2">
          {posts.map(p => (
            <div key={p.id} className={`flex gap-2 rounded-2xl p-3 border ${p.kind === 'notice' ? 'bg-amber-50 border-amber-100' : 'bg-white border-neutral-100'}`}>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-black text-neutral-500 truncate">{p.emblem} {p.guild} · {p.nickname} · {day(p.at)}{p.kind === 'notice' ? ' · 공지' : ''}</div>
                <div className="text-sm font-bold text-neutral-800 break-words">{p.body}</div>
              </div>
              <button disabled={!!busy} onClick={() => run('del', () => api.deletePost(p.id), '글을 지웠어요').then(() => loadTab('posts'))} aria-label="삭제" className="p-2 text-rose-400 self-start"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {!posts.length && busy !== 'load' && <div className="text-center py-8 text-xs font-bold text-neutral-400">글이 없어요</div>}
        </div>
      )}

      {tab === 'boss' && (
        <div className="mt-4 space-y-4">
          <p className="text-xs font-bold text-neutral-500">1년 52주 레이드 보스 도감 (53주차가 있는 해는 황금 최종 보스)</p>
          {BOSS_ELEMENTS.map((el, ei) => (
            <div key={el.key}>
              <div className="text-xs font-black mb-2" style={{ color: el.accent }}>{el.name} · {el.season} ({ei * 13 + 1}~{ei * 13 + 13}주차)</div>
              <div className="grid grid-cols-4 gap-2">
                {BOSS_KINDS.map((k, ki) => {
                  const week = ei * 13 + ki + 1;
                  return (
                    <div key={k.key} className={`rounded-2xl p-1 text-center ${week === boss.week ? 'ring-2 ring-amber-400' : ''}`} style={{ background: `linear-gradient(${el.bg[0]}, ${el.bg[1]})` }}>
                      <BossArt kind={k.key} element={el} size={64} />
                      <div className="text-[9px] font-black text-white leading-tight">{week}주 · {k.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
};
