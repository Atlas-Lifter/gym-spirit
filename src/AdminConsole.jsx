import React, { useEffect, useState } from 'react';
import { X, Search, Megaphone, Trash2, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Sheet, Segmented, Avatar, UserSheet } from './RankingTab.jsx';
import { friendRowToRankUser } from './cloud.js';
import { GuildBadge } from './GuildCenter.jsx';
import { BossArt } from './BossArt.jsx';
import { bossOfWeek, BOSS_KINDS, BOSS_ELEMENTS, guildErrorText } from './guildSystem.js';
import { HERO_BG } from './theme.js';
import { GmBadge } from './GmBadge.jsx';

const num = (v) => Math.round(Number(v) || 0).toLocaleString();
const day = (iso) => (iso ? String(iso).slice(0, 10) : '-');
// '3일 전' 처럼
const ago = (iso) => {
  if (!iso) return '-';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m < 2 ? '방금' : `${m}분 전`;
  if (m < 1440) return `${Math.round(m / 60)}시간 전`;
  return `${Math.round(m / 1440)}일 전`;
};
const ROLE = { leader: '관장', coach: '코치', member: '길드원' };
const Tag = ({ tone, children }) => <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${tone === 'red' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>{children}</span>;

// 회원 상세: 숫자로 본 활동, 정지·랭킹 제외·초기화, 다른 회원에게 보이는 화면 미리보기
const MemberDetail = ({ id, api, run, busy, ask, onBack, Avatar3 }) => {
  const [d, setD] = useState(null);
  const [reason, setReason] = useState('');
  const [view, setView] = useState(null); // null | 'stranger' | 'friend'
  const load = async () => { const r = await run('load', () => api.userDetail(id)); if (r) { setD(r); setReason(r.flags?.reason || ''); } };
  useEffect(() => { setD(null); setView(null); load(); }, [id]);
  if (!d) return <div className="py-10 text-center text-xs font-bold text-neutral-400">{busy === 'load' ? '불러오는 중…' : '회원 정보를 불러오지 못했어요'}</div>;
  const f = d.flags || {};
  const pub = friendRowToRankUser(d.public || { id });
  const setFlag = (next, ok) => run('flag', () => api.setMemberFlag(id, { suspended: !!f.suspended, rankHidden: !!f.rank_hidden, reason, ...next }), ok).then(load);
  const stats = [
    ['가입', day(d.joined_at)], ['최근 로그인', ago(d.last_sign_in_at)], ['최근 활동', ago(d.active_at)],
    ['운동한 날', `${num(d.workout_days)}일`], ['마지막 운동', d.last_workout ? d.last_workout.slice(5).replace('-', '/') : '-'], ['누적 볼륨', `${num(d.total_volume)}kg`],
    ['이번 주 볼륨', `${num(pub.volume)}kg`], ['3대', `${num(pub.lift)}kg`], ['이번 주 유산소', `${num(pub.cardio)}분`],
    ['친구', num(d.friends)], ['길드 글', num(d.posts)], ['받은 응원', num(d.cheers_got)],
  ];
  return (
    <div className="mt-3">
      <button onClick={onBack} className="flex items-center gap-0.5 text-xs font-black text-neutral-500 mb-3"><ChevronLeft className="w-4 h-4" /> 회원 목록</button>
      <div className="flex items-center gap-3 mb-4">
        <Avatar user={pub} size={56} Avatar3={Avatar3} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg font-black text-neutral-900 truncate">{d.nickname}</span>{d.is_admin && <GmBadge small />}
            {f.suspended && <Tag tone="red">이용 정지</Tag>}{f.rank_hidden && !f.suspended && <Tag>랭킹 제외</Tag>}
          </div>
          <div className="text-[11px] font-bold text-neutral-400 truncate">
            {d.guild ? `${d.guild.emblem} ${d.guild.name} · ${ROLE[d.guild.role] || d.guild.role}` : '길드 없음'}{d.solo_ranked ? ' · 개인 랭킹 참가' : ''}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-neutral-50 border border-neutral-100 rounded-xl py-2 text-center">
            <div className="text-sm font-black text-neutral-900 tabular-nums">{v}</div>
            <div className="text-[10px] font-bold text-neutral-400">{k}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-bold text-neutral-400 mb-4">운동 기록은 숫자로만 보여요 (종목·식단·몸무게 같은 개인 기록은 열지 않아요)</p>

      {f.suspended && (
        <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2.5 mb-3">
          정지 중 · {day(f.updated_at)}{f.by ? ` · ${f.by}` : ''}{f.reason ? <><br /><span className="text-rose-900">사유: {f.reason}</span></> : null}
        </div>
      )}

      {d.is_admin ? (
        <div className="text-xs font-bold text-neutral-400 bg-neutral-50 rounded-2xl px-3 py-3 text-center mb-3">운영자 계정은 정지·랭킹 제외를 할 수 없어요</div>
      ) : (
        <div className="space-y-2 mb-3">
          <div className="rounded-2xl border border-neutral-100 p-3">
            <div className="text-xs font-black text-neutral-800 mb-1">이용 정지</div>
            <p className="text-[11px] font-bold text-neutral-400 mb-2">랭킹·길드 평균에서 빠지고 글쓰기·응원·친구 요청·길드 가입을 못 해요. 회원 앱에 사유가 보여요.</p>
            {!f.suspended && <input value={reason} onChange={e => setReason(e.target.value.slice(0, 100))} placeholder="사유 (예: 부적절한 게시글)" className="w-full bg-neutral-100 rounded-xl px-3 py-2 text-xs font-bold outline-none mb-2" />}
            {f.suspended
              ? <button disabled={!!busy} onClick={() => setFlag({ suspended: false }, '정지를 풀었어요')} className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black">정지 풀기</button>
              : <div className="flex justify-end">{ask(`sus-${id}`, '이용 정지하기', () => setFlag({ suspended: true }, `${d.nickname} 님을 정지했어요`))}</div>}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-100 p-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-neutral-800">랭킹 제외</div>
              <div className="text-[11px] font-bold text-neutral-400">정지 없이 전체·친구 랭킹, 길드 평균에서만 빼요</div>
            </div>
            <button disabled={!!busy} onClick={() => setFlag({ rankHidden: !f.rank_hidden }, f.rank_hidden ? '랭킹에 다시 넣었어요' : '랭킹에서 뺐어요')}
              className={`px-3 py-2 rounded-xl text-[11px] font-black ${f.rank_hidden ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{f.rank_hidden ? '다시 넣기' : '빼기'}</button>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-100 p-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-neutral-800">초기화</div>
              <div className="text-[11px] font-bold text-neutral-400">회원 앱이 다음에 열릴 때 기본값으로 바뀌어요</div>
            </div>
            {ask(`ava-${id}`, '아바타', () => run('ava', () => api.resetAvatar(id), '아바타를 초기화했어요').then(load))}
            {ask(`nick-${id}`, '닉네임', () => run('nick', () => api.resetNickname(id), `${d.nickname} → 짐스피릿 유저`).then(load))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-3 text-white" style={{ background: HERO_BG }}>
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-yellow-300" />
          <div className="flex-1 text-xs font-black">회원 화면 미리보기</div>
        </div>
        <p className="text-[11px] font-bold text-white/50 mb-2">랭킹에서 이 회원을 누르면 다른 회원에게 보이는 화면 그대로예요.</p>
        <div className="flex gap-1.5">
          {[['stranger', '친구 아닌 사람'], ['friend', '친구']].map(([k, label]) => (
            <button key={k} onClick={() => setView(v => (v === k ? null : k))} className={`flex-1 py-2 rounded-xl text-[11px] font-black ${view === k ? 'bg-yellow-300 text-neutral-900' : 'bg-white/10 text-white'}`}>{label}에게</button>
          ))}
        </div>
      </div>
      {view && (
        <div className="mt-3 rounded-[28px] border-2 border-dashed border-neutral-200 p-4">
          <UserSheet user={pub} rank={null} metric="volume" me={{}} friends={view === 'friend' ? [id] : []} sentRequests={[]} cheers={{ [id]: d.cheers_got || 0 }}
            limited={view === 'stranger'} preview Avatar3={Avatar3} onCheer={() => {}} onSteal={() => {}} onFriend={() => {}} />
        </div>
      )}
    </div>
  );
};

// 운영자 콘솔: 대시보드 · 전체 공지 · 회원 · 길드 · 게시판 · 보스 도감
// 모든 동작은 DB 함수에서 운영자인지 다시 확인한다
export const AdminConsole = ({ open, onClose, api, onToast, onNoticeChanged, focusUser, Avatar3 }) => {
  const [tab, setTab] = useState(focusUser ? 'users' : 'home');
  const [ov, setOv] = useState(null);
  const [notice, setNotice] = useState('');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [member, setMember] = useState(focusUser || null); // 회원 상세로 연 회원
  const [flagged, setFlagged] = useState(false); // 정지·랭킹 제외 회원만

  const run = async (key, fn, ok) => {
    setBusy(key);
    try { const r = await fn(); if (ok) onToast(ok); return r; }
    catch (e) { onToast(guildErrorText(e)); return null; }
    finally { setBusy(null); }
  };
  const loadTab = async (t = tab) => {
    if (t === 'home' || t === 'notice') { const r = await run('load', () => api.overview()); if (r) setOv(r); }
    if (t === 'users') { const r = await run('load', () => api.users(flagged ? '!정지' : q)); if (r) setUsers(r); }
    if (t === 'guilds') { const r = await run('load', () => api.guilds(q)); if (r) setGuilds(r); }
    if (t === 'posts') { const r = await run('load', () => api.posts()); if (r) setPosts(r); }
  };
  useEffect(() => { if (open) { setConfirm(null); loadTab(tab); } }, [open, tab]);
  useEffect(() => { if (!open || !['users', 'guilds'].includes(tab)) return undefined; const t = setTimeout(() => loadTab(tab), 300); return () => clearTimeout(t); }, [q, flagged]);
  useEffect(() => { if (focusUser) { setTab('users'); setMember(focusUser); } }, [focusUser]);

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
      <Segmented value={tab} onChange={(t) => { setTab(t); setQ(''); setMember(null); }} options={[['home', '현황'], ['notice', '공지'], ['users', '회원'], ['guilds', '길드'], ['posts', '게시판'], ['boss', '보스']]} />

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
          {ov?.suspended != null && (
            <button onClick={() => { setTab('users'); setQ(''); setMember(null); setFlagged(true); }} className="w-full flex items-center justify-between bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2.5 text-xs font-black text-rose-700">
              <span>🚫 이용 정지 {num(ov.suspended)}명 · 랭킹 제외 {num(ov.rank_hidden)}명</span><ChevronRight className="w-4 h-4" />
            </button>
          )}
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

      {tab === 'users' && member && <MemberDetail id={member} api={api} run={run} busy={busy} ask={ask} Avatar3={Avatar3} onBack={() => { setMember(null); loadTab('users'); }} />}

      {((tab === 'users' && !member) || tab === 'guilds') && (
        <div className="mt-4 flex items-center gap-2 bg-neutral-100 rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-neutral-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'users' ? '닉네임 검색 (비우면 최근 가입순)' : '길드 이름 검색'} className="flex-1 bg-transparent outline-none text-sm font-bold" />
        </div>
      )}

      {tab === 'users' && !member && (
        <div className="mt-2">
          <div className="flex gap-1.5 mb-1">
            {[[false, '전체'], [true, '정지·랭킹 제외']].map(([k, label]) => (
              <button key={label} onClick={() => setFlagged(k)} className={`px-3 py-1.5 rounded-full text-[11px] font-black ${flagged === k ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{label}</button>
            ))}
          </div>
          {users.map(u => (
            <button key={u.id} onClick={() => setMember(u.id)} className="w-full text-left flex items-center gap-2 py-3 border-b border-neutral-50 last:border-0 active:bg-neutral-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-sm font-black text-neutral-900 truncate">{u.nickname}</span>{u.is_admin && <GmBadge small />}
                  {u.suspended && <Tag tone="red">정지</Tag>}{u.rank_hidden && !u.suspended && <Tag>랭킹 제외</Tag>}</div>
                <div className="text-[11px] font-bold text-neutral-400 truncate">가입 {day(u.joined_at)}{u.active_at ? ` · 활동 ${ago(u.active_at)}` : ''} · 이번 주 {num(u.volume)}kg · 3대 {num(u.lift)}kg{u.guild_name ? ` · ${u.guild_name}` : ''}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
            </button>
          ))}
          {!users.length && busy !== 'load' && <div className="text-center py-8 text-xs font-bold text-neutral-400">{flagged ? '정지·랭킹 제외된 회원이 없어요' : '회원이 없어요'}</div>}
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
