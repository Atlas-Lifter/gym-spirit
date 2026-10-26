import React, { useEffect, useRef, useState } from 'react';
import { Search, Plus, KeyRound, Share2, X, Check, ChevronRight, LogOut, Trash2, Pencil, Users, Send, Megaphone } from 'lucide-react';
import { Sheet, Segmented, Avatar } from './RankingTab.jsx';
import {
  GUILD_EMBLEMS, GUILD_COLORS, guildColor, GUILD_ROLES, COACH_MAX, MEMBER_TIERS, memberTier, nextMemberTier,
  guildLevelInfo, GUILD_SKILLS, skillLv, skillPoints, weeklyMissions, raidOf, guildErrorText, CHEER_DAILY, claimStreak, guildBadges,
  raidStages, raidPersonalReward, bossOfWeek,
} from './guildSystem.js';
import { HERO_BG, heroBg } from './theme.js';
import { RaidArena } from './RaidArena.jsx';

// 길드: 만들기·찾기·가입, 내 길드(레이드 보스·주간 미션·출석부·길드원 계급·스킬·관리)

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
const num = (v) => Math.round(Number(v) || 0).toLocaleString();
const ago = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  return `${Math.floor(m / 1440)}일 전`;
};
const memberUser = (m) => ({ id: m.id, name: m.nickname || '짐스피릿 유저', profile: m.avatar && Object.keys(m.avatar).length ? m.avatar : null, avatarColor: 'bg-neutral-700' });

export const GuildBadge = ({ emblem, color, size = 48, glow }) => {
  const c = guildColor(color);
  return (
    <div className="flex-shrink-0 rounded-2xl flex items-center justify-center border-2 border-white/80"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: glow ? `0 0 18px ${c.from}99` : undefined, fontSize: size * 0.5 }}>
      <span className="leading-none">{emblem || '🏋️'}</span>
    </div>
  );
};

const Bar = ({ pct, from = '#34d399', to = '#2563eb', track = 'bg-neutral-100', h = 'h-2' }) => (
  <div className={`${h} rounded-full ${track} overflow-hidden`}>
    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
  </div>
);

const RoleChip = ({ role }) => {
  const r = GUILD_ROLES[role] || GUILD_ROLES.member;
  return <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${r.cls}`}>{r.icon} {r.name}</span>;
};

const Switch = ({ on, onChange, disabled }) => (
  <button disabled={disabled} onClick={() => onChange(!on)} className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${on ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
  </button>
);

// 길드 만들기 / 정보 수정
const GuildForm = ({ open, initial, mode, busy, onSubmit, onClose }) => {
  const [f, setF] = useState({ name: '', emblem: '🏋️', color: 'emerald', intro: '', joinMode: 'open' });
  useEffect(() => {
    if (open) setF(initial ? { name: initial.name, emblem: initial.emblem, color: initial.color, intro: initial.intro || '', joinMode: initial.join_mode } : { name: '', emblem: '🏋️', color: 'emerald', intro: '', joinMode: 'open' });
  }, [open]);
  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim().length >= 2 && f.name.trim().length <= 12;
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-neutral-900">{mode === 'edit' ? '길드 정보 수정' : '길드 만들기'}</h3>
        <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full bg-neutral-100 text-neutral-500"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
        <GuildBadge emblem={f.emblem} color={f.color} size={56} glow />
        <div className="min-w-0">
          <div className="text-lg font-black text-neutral-900 truncate">{f.name.trim() || '길드 이름'}</div>
          <div className="text-xs font-bold text-neutral-400 truncate">{f.intro || '한 줄 소개'}</div>
        </div>
      </div>
      <label className="block text-xs font-black text-neutral-500 mb-1.5">길드 이름 (2~12자)</label>
      <input value={f.name} maxLength={12} onChange={e => set('name')(e.target.value)} placeholder="예: 새벽 쇠질단" className="w-full bg-neutral-100 rounded-2xl px-4 py-3 text-sm font-black outline-none mb-4 focus:ring-2 focus:ring-emerald-300" />
      <label className="block text-xs font-black text-neutral-500 mb-1.5">엠블럼</label>
      <div className="grid grid-cols-6 gap-2 mb-4">
        {GUILD_EMBLEMS.map(e => (
          <button key={e} onClick={() => set('emblem')(e)} className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${f.emblem === e ? 'bg-neutral-900 scale-105 shadow-md' : 'bg-neutral-100'}`}>{e}</button>
        ))}
      </div>
      <label className="block text-xs font-black text-neutral-500 mb-1.5">길드 색</label>
      <div className="flex gap-2 mb-4">
        {Object.entries(GUILD_COLORS).map(([k, c]) => (
          <button key={k} onClick={() => set('color')(k)} aria-label={c.label} className={`w-9 h-9 rounded-full transition-all ${f.color === k ? 'ring-4 ring-offset-2 ring-neutral-900/20 scale-110' : ''}`} style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
        ))}
      </div>
      <label className="block text-xs font-black text-neutral-500 mb-1.5">한 줄 소개</label>
      <input value={f.intro} maxLength={80} onChange={e => set('intro')(e.target.value)} placeholder="예: 매일 새벽 6시 출석하는 헬창 모임" className="w-full bg-neutral-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none mb-4 focus:ring-2 focus:ring-emerald-300" />
      <label className="block text-xs font-black text-neutral-500 mb-1.5">가입 방식</label>
      <div className="mb-6"><Segmented value={f.joinMode} onChange={set('joinMode')} options={[['open', '누구나 바로 가입'], ['approval', '관장·코치 승인']]} /></div>
      <button disabled={!valid || busy} onClick={() => onSubmit({ ...f, name: f.name.trim() })} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-black disabled:opacity-40 active:scale-[0.98] transition-transform">
        {busy ? '저장 중…' : mode === 'edit' ? '저장하기' : '길드 창설하기'}
      </button>
    </Sheet>
  );
};

// 다른 길드 구경 (공개 정보만) + 가입
export const GuildViewSheet = ({ guildId, api, canJoin, onJoined, onClose, onToast, Avatar3 }) => {
  const [g, setG] = useState(null);
  const [busy, setBusy] = useState(false);
  const last = useRef(null);
  if (guildId) last.current = guildId;
  useEffect(() => {
    if (!guildId) return undefined;
    let alive = true; setG(null);
    api.view(guildId).then(d => { if (alive) setG(d); }).catch(e => { if (alive) { onToast(guildErrorText(e)); onClose(); } });
    return () => { alive = false; };
  }, [guildId]);
  const join = async () => {
    setBusy(true);
    try {
      const r = await api.join(g.id);
      onToast(r === 'joined' ? `${g.emblem} ${g.name} 길드에 가입했어요!` : '가입 신청을 보냈어요. 관장·코치가 승인하면 가입돼요.');
      onJoined();
      onClose();
    } catch (e) { onToast(guildErrorText(e)); } finally { setBusy(false); }
  };
  const lv = g ? guildLevelInfo(g.xp) : null;
  return (
    <Sheet open={!!guildId} onClose={onClose}>
      {!g ? (
        <div className="py-16 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-emerald-500 animate-spin" /></div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <GuildBadge emblem={g.emblem} color={g.color} size={68} glow />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-neutral-900 truncate">{g.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-neutral-900 text-white">Lv.{g.level}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">👥 {g.members}/{g.cap}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${g.join_mode === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{g.join_mode === 'open' ? '바로 가입' : '승인 가입'}</span>
                {g.ranked && <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">🏆 랭킹 참가 중</span>}
              </div>
            </div>
            <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full bg-neutral-100 text-neutral-500 self-start"><X className="w-4 h-4" /></button>
          </div>
          {g.intro && <p className="text-sm font-bold text-neutral-600 bg-neutral-50 rounded-2xl px-4 py-3 mb-4">{g.intro}</p>}
          <div className="mb-4">
            <div className="flex justify-between text-[11px] font-bold text-neutral-400 mb-1"><span>길드 경험치</span><span>{lv.max ? 'MAX' : `${num(lv.into)} / ${num(lv.need)}`}</span></div>
            <Bar pct={lv.max ? 100 : (lv.into / lv.need) * 100} />
          </div>
          <div className="text-xs font-black text-neutral-500 mb-2">길드원</div>
          <div className="bg-white border border-neutral-100 rounded-2xl px-3 mb-5">
            {(g.member_list || []).map((m, i) => {
              const t = memberTier(m.contrib);
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-neutral-50 last:border-0">
                  <Avatar user={memberUser(m)} size={36} Avatar3={Avatar3} />
                  <span className="flex-1 text-sm font-black text-neutral-800 truncate">{m.nickname}</span>
                  <span className="text-[10px] font-bold text-neutral-400">{t.icon} {t.name}</span>
                  {m.role !== 'member' && <RoleChip role={m.role} />}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] font-bold text-neutral-400 text-center mb-3">길드원 개인 기록은 같은 길드원과 친구에게만 보여요</p>
          {canJoin && (
            <button disabled={busy || g.members >= g.cap} onClick={join} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-black disabled:opacity-40 active:scale-[0.98] transition-transform">
              {g.members >= g.cap ? '정원이 가득 찼어요' : busy ? '처리 중…' : g.join_mode === 'open' ? '가입하기' : '가입 신청하기'}
            </button>
          )}
        </>
      )}
    </Sheet>
  );
};

// 길드원 한 명에 대한 관장·코치 메뉴
const MemberSheet = ({ member, myRole, meId, coachCount, busy, onAction, onClose, Avatar3 }) => {
  const [confirm, setConfirm] = useState(null);
  const last = useRef(null);
  if (member) last.current = member;
  const m = member || last.current;
  useEffect(() => { setConfirm(null); }, [member?.id]);
  if (!m) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const t = memberTier(m.contrib), nt = nextMemberTier(m.contrib);
  const isMe = m.id === meId;
  const canKick = !isMe && (myRole === 'leader' || (myRole === 'coach' && m.role === 'member'));
  const ask = (key, label, run, danger) => confirm === key ? (
    <div className="flex gap-2">
      <button onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 text-neutral-600 text-sm font-black">취소</button>
      <button disabled={busy} onClick={run} className={`flex-[2] py-3 rounded-2xl text-white text-sm font-black disabled:opacity-50 ${danger ? 'bg-rose-500' : 'bg-neutral-900'}`}>{label} 확인</button>
    </div>
  ) : (
    <button onClick={() => setConfirm(key)} className={`w-full py-3 rounded-2xl text-sm font-black ${danger ? 'bg-rose-50 text-rose-600' : 'bg-neutral-100 text-neutral-700'}`}>{label}</button>
  );
  return (
    <Sheet open={!!member} onClose={onClose}>
      <div className="flex items-center gap-4 mb-4">
        <Avatar user={memberUser(m)} size={60} Avatar3={Avatar3} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5"><h3 className="text-lg font-black text-neutral-900 truncate">{m.nickname}</h3><RoleChip role={m.role} /></div>
          <div className="text-xs font-bold text-neutral-500 mt-0.5">{t.icon} {t.name} · 기여 {num(m.contrib)} XP</div>
          {nt && <div className="text-[11px] font-bold text-neutral-400">{nt.icon} {nt.name}까지 {num(nt.min - m.contrib)} XP</div>}
        </div>
        <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full bg-neutral-100 text-neutral-500 self-start"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[['이번 주 볼륨', `${num(m.volume)}kg`], ['이번 주 출석', `${m.days || 0}회`], ['3대 중량', `${num(m.lift)}kg`]].map(([k, v]) => (
          <div key={k} className="bg-neutral-50 border border-neutral-100 rounded-2xl py-3 text-center"><div className="text-sm font-black text-neutral-900">{v}</div><div className="text-[10px] font-bold text-neutral-400">{k}</div></div>
        ))}
      </div>
      <div className="space-y-2">
        {myRole === 'leader' && !isMe && m.role === 'member' && (coachCount < COACH_MAX
          ? ask('coach', '🎖️ 코치로 임명', () => onAction('setRole', m, 'coach'))
          : <div className="text-center text-xs font-bold text-neutral-400 py-2">코치는 최대 {COACH_MAX}명까지예요</div>)}
        {myRole === 'leader' && !isMe && m.role === 'coach' && ask('uncoach', '코치 해제', () => onAction('setRole', m, 'member'))}
        {myRole === 'leader' && !isMe && ask('transfer', '👑 관장 넘기기', () => onAction('transfer', m))}
        {canKick && ask('kick', '길드에서 내보내기', () => onAction('kick', m), true)}
        {isMe && <div className="text-center text-xs font-bold text-neutral-400 py-2">내 정보예요</div>}
      </div>
    </Sheet>
  );
};

export const GuildCenter = ({ api, data, loading, reload, meId, myGuildRank, onToast, Avatar3, onClaimXp, claimedKeys = [] }) => {
  const [tab, setTab] = useState('home');
  const [busy, setBusy] = useState(null);
  const [formMode, setFormMode] = useState(null); // 'create' | 'edit'
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [member, setMember] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [draft, setDraft] = useState('');
  const [rankBy, setRankBy] = useState('volume'); // 길드원 랭킹 기준
  const [asNotice, setAsNotice] = useState(false);
  const seq = useRef(0);
  const g = data?.guild;

  // 길드가 없을 때: 길드 찾기 (입력이 멈추면 검색)
  useEffect(() => {
    if (g || loading) return undefined;
    const my = ++seq.current;
    setSearching(true);
    const t = setTimeout(async () => {
      try { const r = await api.search(query); if (my === seq.current) setResults(r || []); }
      catch (e) { if (my === seq.current) setResults([]); }
      finally { if (my === seq.current) setSearching(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query, !!g, loading]);

  const run = async (key, fn, ok) => {
    setBusy(key);
    try { const r = await fn(); if (ok) onToast(typeof ok === 'function' ? ok(r) : ok); await reload(); return true; }
    catch (e) { onToast(guildErrorText(e)); return false; }
    finally { setBusy(null); }
  };

  if (loading && !data) {
    return <div className="bg-white rounded-[28px] border border-neutral-100 p-10 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-emerald-500 animate-spin" /></div>;
  }

  const form = (
    <GuildForm open={!!formMode} mode={formMode} initial={formMode === 'edit' ? g : null} busy={busy === 'form'} onClose={() => setFormMode(null)}
      onSubmit={async (f) => {
        const done = await run('form', () => (formMode === 'edit' ? api.update(f) : api.create(f)), formMode === 'edit' ? '길드 정보를 저장했어요' : `${f.emblem} ${f.name} 길드를 창설했어요! 관장이 되었어요 👑`);
        if (done) { setFormMode(null); setTab('home'); }
      }} />
  );

  // ── 길드가 없을 때 ──
  if (!g) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-[28px] p-5 overflow-hidden text-white" style={{ background: HERO_BG }}>
          <div className="relative">
            <div className="text-[11px] font-black tracking-[.25em] text-emerald-300">GUILD</div>
            <h3 className="text-xl font-black mt-1">함께 들면 더 무거워져요</h3>
            <p className="text-xs font-bold text-white/60 mt-1 leading-relaxed">길드원이 운동할수록 길드 레벨이 오르고, 매주 미션과 레이드 보스를 함께 깨요. 랭킹에 등록하면 길드원 평균 기록으로 전체 랭킹에 올라가요.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setFormMode('create')} className="flex-1 py-3 rounded-2xl bg-emerald-400 text-neutral-950 text-sm font-black flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(52,211,153,.5)] active:scale-[0.97] transition-transform"><Plus className="w-4 h-4" /> 길드 만들기</button>
              <button onClick={() => setCodeOpen(o => !o)} className="flex-1 py-3 rounded-2xl bg-white/10 text-white text-sm font-black flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"><KeyRound className="w-4 h-4" /> 초대 코드</button>
            </div>
            {codeOpen && (
              <div className="flex gap-2 mt-2">
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="6자리 코드" className="flex-1 min-w-0 bg-white/10 rounded-xl px-3 py-2.5 text-sm font-black tracking-[.3em] outline-none placeholder:tracking-normal placeholder:text-white/40" />
                <button disabled={code.trim().length < 6 || busy === 'code'} onClick={() => run('code', () => api.joinByCode(code), '초대 코드로 길드에 가입했어요!')} className="px-4 rounded-xl bg-white text-neutral-900 text-sm font-black disabled:opacity-40">가입</button>
              </div>
            )}
          </div>
        </div>

        {data?.request && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <span className="text-xl">{data.request.emblem}</span>
            <span className="flex-1 text-xs font-bold text-amber-800"><b className="font-black">{data.request.name}</b> 길드에 가입 신청 중이에요</span>
            <button disabled={busy === 'cancel'} onClick={() => run('cancel', () => api.cancelRequest(), '가입 신청을 취소했어요')} className="px-3 py-1.5 rounded-lg bg-white text-amber-700 text-xs font-black border border-amber-200">취소</button>
          </div>
        )}

        <div className="bg-white rounded-[24px] border border-neutral-100 p-4 flex items-center gap-3">
          <div className="text-2xl">🙋</div>
          <div className="flex-1">
            <div className="text-sm font-black text-neutral-900">개인으로 전체 랭킹 참가</div>
            <div className="text-[11px] font-bold text-neutral-400 leading-relaxed">길드 없이 혼자 이름을 올려요. 켜면 이번 주 볼륨·3대가 전체 랭킹에 공개돼요.</div>
          </div>
          <Switch on={!!data?.solo_ranked} disabled={busy === 'solo'} onChange={(on) => run('solo', () => api.setSolo(on), on ? '개인으로 전체 랭킹에 참가했어요' : '전체 랭킹에서 내려왔어요')} />
        </div>

        <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
          <div className="text-sm font-black text-neutral-900 mb-3">길드 찾기</div>
          <div className="flex items-center gap-2 bg-neutral-100 rounded-2xl px-4 py-3 mb-2">
            <Search className="w-4 h-4 text-neutral-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="길드 이름으로 검색" className="flex-1 bg-transparent outline-none text-sm font-bold placeholder:text-neutral-400" />
            {searching && <div className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-emerald-500 animate-spin" />}
          </div>
          {results.map(r => (
            <button key={r.id} onClick={() => setViewId(r.id)} className="w-full flex items-center gap-3 py-3 border-b border-neutral-50 last:border-0 text-left active:bg-neutral-50">
              <GuildBadge emblem={r.emblem} color={r.color} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-sm font-black text-neutral-900 truncate">{r.name}</span><span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-neutral-900 text-white">Lv.{r.level}</span></div>
                <div className="text-[11px] font-bold text-neutral-400 truncate">👥 {r.members}/{r.cap} · {r.join_mode === 'open' ? '바로 가입' : '승인 가입'}{r.intro ? ` · ${r.intro}` : ''}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300" />
            </button>
          ))}
          {!searching && results.length === 0 && <div className="text-center py-6 text-xs font-bold text-neutral-400">{query ? `'${query}' 길드를 찾지 못했어요` : '아직 길드가 없어요. 첫 길드의 관장이 되어 보세요!'}</div>}
        </div>

        <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
          <div className="text-sm font-black text-neutral-900 mb-3">길드에서 할 수 있는 것</div>
          {[['🏆', '길드 랭킹', '길드원 평균 볼륨·3대로 전체 랭킹 경쟁'], ['👹', '주간 레이드 보스', '길드원 볼륨이 곧 피해량, 매주 새 보스'], ['🎯', '주간 미션', '합동 볼륨·출석 도장·같이 운동'], ['⭐', '길드 레벨·스킬', '레벨업마다 스킬 포인트로 길드 강화'], ['🐣', '헬스 계급도', '헬린이부터 3대500 전설까지']].map(([i, t, d]) => (
            <div key={t} className="flex items-center gap-3 py-2"><span className="text-xl w-8 text-center">{i}</span><div><div className="text-xs font-black text-neutral-800">{t}</div><div className="text-[11px] font-bold text-neutral-400">{d}</div></div></div>
          ))}
        </div>

        {form}
        <GuildViewSheet guildId={viewId} api={api} canJoin onJoined={reload} onClose={() => setViewId(null)} onToast={onToast} Avatar3={Avatar3} />
      </div>
    );
  }

  // ── 내 길드 ──
  const c = guildColor(g.color);
  const lv = guildLevelInfo(g.xp);
  const members = data.members || [];
  const myRole = data.my_role;
  const me = members.find(m => m.id === meId);
  const isLeader = myRole === 'leader', isStaff = myRole === 'leader' || myRole === 'coach';
  const week = data.week || {};
  const claims = data.claims || [];
  const missions = weeklyMissions(week, g.skills);
  const raid = raidOf(week, g.skills);
  const points = skillPoints(g.xp, g.skills);
  const coachCount = members.filter(m => m.role === 'coach').length;
  const requests = data.requests || [];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const todayCount = members.filter(m => (m.week_days || []).includes(todayIdx + 1)).length;
  const posts = data.posts || [];
  const notice = posts.find(p => p.kind === 'notice');
  const stats = data.stats || {};
  const streak = claimStreak(stats.claim_weeks || [], week.week_start);
  const badges = guildBadges({ level: lv.level, members: members.length, stats, streak, rank: g.ranked ? myGuildRank : null });
  const cheersLeft = Math.max(0, CHEER_DAILY - (data.my_cheers_today || 0));
  // 레이드 개인 보상: 이번 주 예상치와 지난주 정산 (guilds_v3.sql 이후 정확한 '내 피해'를 쓴다)
  const myDamageNow = me ? (me.guild_volume ?? me.volume ?? 0) : 0;
  const rewardNow = raidPersonalReward({ kills: raid.kills, myDamage: myDamageNow, mvp: data.mvp && me && data.mvp.nickname === me.nickname });
  const lw = data.last_week || {};
  const lwHasData = lw.my_volume !== undefined && !!lw.week_start;
  const lwRaid = lwHasData ? raidStages(Math.round((lw.volume || 0) * (1 + 0.1 * skillLv(g.skills, 'rack'))), members.length) : null;
  const lwBoss = lwHasData ? bossOfWeek(String(lw.week_start)) : null;
  const lwReward = lwHasData ? raidPersonalReward({ kills: lwRaid.kills, myDamage: lw.my_volume, mvp: lw.mvp_id === meId }) : null;
  const lwKey = lwHasData ? `raid-${lw.week_start}` : '';
  const lwClaimed = lwKey && claimedKeys.includes(lwKey);
  const lastWeek = data.last_week || {};
  const cheer = (m) => run(`cheer-${m.id}`, () => api.cheer(m.id), `👏 ${m.nickname}님을 응원했어요! 길드 +10 XP`);
  const sendPost = async () => {
    const body = draft.trim();
    if (!body) return;
    if (await run('post', () => api.post(body, asNotice), asNotice ? '📢 공지를 올렸어요' : null)) { setDraft(''); setAsNotice(false); }
  };

  const share = async () => {
    const text = `GYM SPIRIT '${g.name}' 길드에 들어와요! 💪 초대 코드: ${g.invite_code}`;
    if (navigator.share) { try { await navigator.share({ title: g.name, text, url: 'https://gym-spirit.vercel.app' }); } catch (e) {} return; }
    try { await navigator.clipboard.writeText(`${text} https://gym-spirit.vercel.app`); onToast('초대 문구를 복사했어요'); } catch (e) { onToast(`초대 코드: ${g.invite_code}`); }
  };
  const memberAction = async (kind, m, role) => {
    const map = {
      setRole: [() => api.setRole(m.id, role), role === 'coach' ? `${m.nickname}님을 코치로 임명했어요 🎖️` : '코치를 해제했어요'],
      transfer: [() => api.transfer(m.id), `${m.nickname}님이 새 관장이 되었어요 👑`],
      kick: [() => api.kick(m.id), `${m.nickname}님을 내보냈어요`],
    };
    const done = await run('member', map[kind][0], map[kind][1]);
    if (done) setMember(null);
  };

  return (
    <div className="space-y-3">
      {/* 길드 카드 */}
      <div className="relative rounded-[28px] p-5 overflow-hidden text-white" style={{ background: heroBg(c.from) }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="relative flex items-center gap-4">
          <GuildBadge emblem={g.emblem} color={g.color} size={64} glow />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xl font-black truncate">{g.name}</h3>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-neutral-900">Lv.{lv.level}</span>
            </div>
            {g.intro && <div className="text-xs font-bold text-white/55 truncate mt-0.5">{g.intro}</div>}
            <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] font-black">
              <span className="px-2 py-0.5 rounded-full bg-white/10">👥 {members.length}/{g.cap}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10">💪 오늘 출석 {todayCount}/{members.length}</span>
              {streak > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-300">🔥 {streak}주 연속</span>}
              <span className="px-2 py-0.5 rounded-full bg-white/10">내 직책 {GUILD_ROLES[myRole]?.icon} {GUILD_ROLES[myRole]?.name}</span>
              {g.ranked
                ? <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300">🏆 전체 {myGuildRank ? `${myGuildRank}위` : '랭킹 참가 중'}</span>
                : <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50">랭킹 미등록</span>}
            </div>
          </div>
        </div>
        <div className="relative mt-4">
          <div className="flex justify-between text-[10px] font-bold text-white/50 mb-1"><span>길드 경험치</span><span>{lv.max ? 'MAX' : `${num(lv.into)} / ${num(lv.need)} XP`}</span></div>
          <Bar pct={lv.max ? 100 : (lv.into / lv.need) * 100} track="bg-white/10" from={c.from} to="#60a5fa" />
        </div>
        <div className="relative flex items-center gap-2 mt-3">
          <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold text-white/50">초대 코드</span>
            <span className="text-sm font-black tracking-[.25em]">{g.invite_code}</span>
          </div>
          <button onClick={share} className="px-3 py-2 rounded-xl bg-white text-neutral-900 text-xs font-black flex items-center gap-1 active:scale-95 transition-transform"><Share2 className="w-3.5 h-3.5" /> 초대</button>
        </div>
      </div>

      <Segmented value={tab} onChange={setTab} options={[['home', '홈'], ['board', '게시판'], ['members', '길드원'], ['skills', points > 0 ? `스킬·${points}` : '스킬'], ['settings', isStaff && requests.length ? `설정·${requests.length}` : '설정']]} />

      {tab === 'home' && (
        <>
          {notice && (
            <button onClick={() => setTab('board')} className="w-full flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-left active:scale-[0.99] transition-transform">
              <Megaphone className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="flex-1 min-w-0"><span className="block text-[10px] font-black text-amber-600">공지 · {notice.nickname} · {ago(notice.at)}</span><span className="block text-sm font-bold text-amber-900 line-clamp-2">{notice.body}</span></span>
            </button>
          )}

          {/* 이번 주 MVP · 지난주 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[22px] p-4 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/60">
              <div className="text-[10px] font-black text-amber-700">👑 이번 주 MVP</div>
              {data.mvp ? (
                <>
                  <div className="text-base font-black text-neutral-900 truncate mt-1">{data.mvp.nickname}</div>
                  <div className="text-[11px] font-bold text-amber-800">{num(data.mvp.volume)}kg · {data.mvp.days}회</div>
                </>
              ) : <div className="text-xs font-bold text-amber-800/70 mt-1">첫 운동을 저장하면<br />MVP 후보가 돼요</div>}
            </div>
            <div className="rounded-[22px] p-4 bg-white border border-neutral-100">
              <div className="text-[10px] font-black text-neutral-400">📜 지난주 기록</div>
              <div className="text-base font-black text-neutral-900 mt-1">{num(lastWeek.volume)}kg</div>
              <div className="text-[11px] font-bold text-neutral-500 truncate">{(lastWeek.claims || []).includes('raid') ? '👹 보스 처치' : '보스 생존'} · 미션 {(lastWeek.claims || []).filter(k => k !== 'raid').length}개</div>
              {lastWeek.mvp && <div className="text-[10px] font-bold text-amber-600 truncate">MVP {lastWeek.mvp.nickname}</div>}
            </div>
          </div>

          {/* 지난주 레이드 정산 */}
          {lwHasData && lwReward.total > 0 && (
            <div className={`rounded-[24px] p-4 border ${lwClaimed ? 'bg-white border-neutral-100' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-black text-amber-700">📜 지난주 레이드 정산</div>
                  <div className="text-sm font-black text-neutral-900 truncate">{lwBoss.name} · {lwRaid.stage}단계 도달</div>
                  <div className="text-[11px] font-bold text-neutral-500">{lwRaid.kills}번 처치 · 내 피해 {num(lw.my_volume)}kg</div>
                </div>
                {lwClaimed
                  ? <span className="text-[11px] font-black text-neutral-400 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> 받음</span>
                  : <button onClick={() => onClaimXp && onClaimXp({ key: lwKey, label: `${lwBoss.name} 레이드`, xp: lwReward.total })} className="px-3 py-2.5 rounded-xl bg-amber-400 text-neutral-950 text-xs font-black shadow-[0_0_14px_rgba(251,191,36,.6)] whitespace-nowrap active:scale-95 transition-transform">+{num(lwReward.total)} XP 받기</button>}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">{lwReward.items.map(it => <span key={it.label} className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">{it.label} +{it.xp}</span>)}</div>
            </div>
          )}

          {/* 레이드 보스 */}
          <div className="relative rounded-[28px] p-4 overflow-hidden text-white" style={{ background: heroBg(raid.boss.element.glow, '#0b0f14') }}>
            <div className="relative flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black tracking-[.2em] text-rose-300">WEEKLY RAID</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10">{raid.boss.week}주차</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: `${raid.boss.element.glow}26`, color: raid.boss.element.glow }}>{raid.boss.element.season}</span>
            </div>
            <div className="relative text-xl font-black mt-1">{raid.boss.name} <span className="text-sm" style={{ color: raid.boss.element.glow }}>· {raid.stage}단계</span></div>
            <div className="relative text-[11px] font-bold text-white/55">{raid.boss.line}</div>
            <RaidArena raid={raid} members={members} meId={meId} todayIdx={todayIdx} />
            <div className="relative mt-3">
              <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1">
                <span>{raid.stage}단계 HP {num(raid.left)} / {num(raid.hp)}</span>
                <span>{Math.ceil(100 - raid.pct)}% 남음</span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-700" style={{ width: `${100 - raid.pct}%` }} /></div>
              <p className="text-[11px] font-bold text-white/50 mt-2">길드원 이번 주 볼륨 합계가 그대로 피해가 돼요{skillLv(g.skills, 'rack') ? ` (파워랙 +${skillLv(g.skills, 'rack') * 10}%)` : ''} · 누적 피해 {num(raid.dmg)} · 쓰러뜨리면 HP +50%로 부활해요</p>
            </div>
            {/* 이번 주 예상 개인 보상 */}
            <div className="relative mt-3 rounded-2xl bg-white/[0.06] border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-white/80">🎁 이번 주 내 예상 보상</span>
                <span className="text-sm font-black text-yellow-300">{rewardNow.total ? `+${num(rewardNow.total)} XP` : '–'}</span>
              </div>
              {rewardNow.total ? (
                <div className="flex flex-wrap gap-1 mt-1.5">{rewardNow.items.map(it => <span key={it.label} className="text-[10px] font-bold text-white/60 bg-white/5 px-1.5 py-0.5 rounded">{it.label} +{it.xp}</span>)}</div>
              ) : <div className="text-[10px] font-bold text-white/45 mt-1">이번 주에 운동을 저장하면 보스에게 피해를 주고 보상이 쌓여요</div>}
              <div className="text-[10px] font-bold text-white/40 mt-1.5">월요일 0시에 이번 주가 끝나면 단계·내 피해에 따라 프로필 경험치로 정산돼요</div>
            </div>
            {raid.defeated && (claims.includes('raid')
              ? <div className="relative mt-3 py-2.5 rounded-xl bg-white/10 text-center text-xs font-black text-white/60">✅ 처치 보상 수령 완료</div>
              : <button disabled={busy === 'raid'} onClick={() => run('raid', () => api.claim('raid'), (x) => `레이드 보상 +${x} XP!`)} className="relative mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white text-sm font-black shadow-[0_0_20px_rgba(244,63,94,.5)] active:scale-[0.98] transition-transform">🎁 처치 보상 받기 +{raid.reward} XP</button>)}
          </div>

          {/* 주간 미션 */}
          <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
            <div className="flex items-end justify-between mb-3"><div className="text-sm font-black text-neutral-900">🎯 이번 주 미션</div><div className="text-[10px] font-bold text-neutral-400">월요일 0시 초기화</div></div>
            <div className="space-y-3">
              {missions.map(ms => {
                const claimed = claims.includes(ms.key), done = !ms.locked && ms.cur >= ms.goal;
                return (
                  <div key={ms.key} className={`rounded-2xl p-3.5 border ${claimed ? 'bg-neutral-50 border-neutral-100' : done ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-neutral-100'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ms.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5"><span className="text-sm font-black text-neutral-900">{ms.title}</span><span className="text-[10px] font-black text-emerald-600">+{ms.reward} XP</span></div>
                        <div className="text-[11px] font-bold text-neutral-400">{ms.locked ? '길드원이 2명 이상일 때 열려요' : ms.desc}</div>
                      </div>
                      {claimed ? <span className="text-[11px] font-black text-neutral-400 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> 완료</span>
                        : done ? <button disabled={busy === ms.key} onClick={() => run(ms.key, () => api.claim(ms.key), (x) => `${ms.title} 달성! +${x} XP`)} className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-[0_0_12px_rgba(16,185,129,.45)] active:scale-95 transition-transform">받기</button>
                          : null}
                    </div>
                    {!ms.locked && !claimed && (
                      <div className="mt-2.5">
                        <Bar pct={(ms.cur / ms.goal) * 100} h="h-1.5" />
                        <div className="text-right text-[10px] font-black text-neutral-400 mt-1 tabular-nums">{num(ms.cur)} / {num(ms.goal)}{ms.unit}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 출석부 */}
          <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
            <div className="flex items-end justify-between mb-3"><div className="text-sm font-black text-neutral-900">📅 이번 주 출석부</div><div className="text-[10px] font-bold text-neutral-400">운동을 저장하면 체크돼요</div></div>
            <div className="grid grid-cols-[1fr_repeat(7,22px)] gap-x-1.5 gap-y-2 items-center">
              <span />
              {DAY_NAMES.map((d, i) => <span key={d} className={`text-center text-[10px] font-black ${i === todayIdx ? 'text-emerald-600' : 'text-neutral-400'}`}>{d}</span>)}
              {members.map(m => (
                <React.Fragment key={m.id}>
                  <span className="text-xs font-black text-neutral-700 truncate pr-1">{m.nickname}{m.id === meId ? ' (나)' : ''}</span>
                  {DAY_NAMES.map((d, i) => {
                    const hit = (m.week_days || []).includes(i + 1);
                    return <span key={d} className={`w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] ${hit ? 'bg-emerald-500 text-white shadow-[0_0_6px_rgba(16,185,129,.5)]' : i === todayIdx ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-neutral-100'}`}>{hit ? '💪' : ''}</span>;
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 길드 업적 */}
          <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
            <div className="flex items-end justify-between mb-3"><div className="text-sm font-black text-neutral-900">🏅 길드 업적</div><div className="text-[11px] font-black text-emerald-600">{badges.filter(b => b.done).length} / {badges.length}</div></div>
            <div className="grid grid-cols-4 gap-2">
              {badges.map(b => (
                <div key={b.name} title={b.desc} className={`rounded-2xl py-2.5 px-1 text-center border ${b.done ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,.18)]' : 'bg-neutral-50 border-neutral-100'}`}>
                  <div className={`text-2xl ${b.done ? '' : 'grayscale opacity-30'}`}>{b.icon}</div>
                  <div className={`text-[10px] font-black mt-0.5 ${b.done ? 'text-neutral-800' : 'text-neutral-400'}`}>{b.name}</div>
                  <div className="text-[9px] font-bold text-neutral-400 leading-tight">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 랭킹 등록 */}
          {!g.ranked && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
              <span className="text-xl">🏆</span>
              <span className="flex-1 text-[11px] font-bold text-blue-800 leading-relaxed">{isLeader ? '랭킹에 등록하면 길드원 평균 기록으로 전체 랭킹에 올라가요.' : '관장이 랭킹에 등록하면 전체 랭킹에 올라가요.'}</span>
              {isLeader && <button disabled={busy === 'ranked'} onClick={() => run('ranked', () => api.setRanked(true), '전체 랭킹에 등록했어요!')} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black">등록</button>}
            </div>
          )}

          {/* 최근 활동 */}
          <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
            <div className="text-sm font-black text-neutral-900 mb-2">🔥 최근 활동</div>
            {(data.feed || []).length === 0 && <div className="text-center py-5 text-xs font-bold text-neutral-400">아직 활동이 없어요. 오늘 운동을 저장하면 첫 기록이 올라가요!</div>}
            {(data.feed || []).map((f, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-neutral-50 last:border-0">
                <span className="text-xs font-black text-neutral-800 truncate flex-1">{f.nickname} <span className="text-neutral-400 font-bold">· {String(f.day).slice(5).replace('-', '/')} 운동</span></span>
                <span className="text-[11px] font-black text-neutral-500 tabular-nums">{num(f.volume)}kg</span>
                <span className="text-[10px] font-black text-emerald-600 w-14 text-right">+{f.xp} XP</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'board' && (
        <div className="space-y-3">
          <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
            <textarea value={draft} onChange={e => setDraft(e.target.value.slice(0, 200))} rows={2} placeholder={asNotice ? '길드원 모두에게 알릴 공지를 적어 주세요' : '오늘 운동 인증, 응원 한마디를 남겨 보세요 💪'}
              className="w-full resize-none bg-neutral-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-300" />
            <div className="flex items-center gap-2 mt-2">
              {isStaff && (
                <button onClick={() => setAsNotice(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 ${asNotice ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-500'}`}><Megaphone className="w-3.5 h-3.5" /> 공지로</button>
              )}
              <span className="flex-1 text-right text-[10px] font-bold text-neutral-400">{draft.length}/200</span>
              <button disabled={!draft.trim() || busy === 'post'} onClick={sendPost} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black flex items-center gap-1 disabled:opacity-40 active:scale-95 transition-transform"><Send className="w-3.5 h-3.5" /> 올리기</button>
            </div>
          </div>
          {posts.length === 0 && <div className="bg-white rounded-[28px] border border-neutral-100 p-8 text-center text-xs font-bold text-neutral-400">아직 글이 없어요. 첫 인사를 남겨 보세요!</div>}
          {/* 가장 최근 공지는 맨 위에 고정 */}
          {(notice ? [notice, ...posts.filter(p => p !== notice)] : posts).map(p => {
            const canDelete = p.mine || isStaff;
            return p.kind === 'notice' ? (
              <div key={p.id} className="rounded-[22px] p-4 bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-1.5 mb-1"><Megaphone className="w-3.5 h-3.5 text-amber-600" /><span className="text-[11px] font-black text-amber-700">공지 · {p.nickname}</span><span className="text-[10px] font-bold text-amber-600/70">{ago(p.at)}</span>
                  {canDelete && <button onClick={() => run(`del-${p.id}`, () => api.deletePost(p.id), '글을 지웠어요')} aria-label="삭제" className="ml-auto p-1 text-amber-400"><Trash2 className="w-3.5 h-3.5" /></button>}</div>
                <p className="text-sm font-bold text-amber-950 whitespace-pre-wrap break-words">{p.body}</p>
              </div>
            ) : (
              <div key={p.id} className="flex gap-3 bg-white rounded-[22px] border border-neutral-100 p-3.5">
                <Avatar user={memberUser({ id: p.id, nickname: p.nickname, avatar: p.avatar })} size={36} Avatar3={Avatar3} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><span className="text-xs font-black text-neutral-800 truncate">{p.nickname}</span>{p.role && p.role !== 'member' && <RoleChip role={p.role} />}<span className="text-[10px] font-bold text-neutral-400">{ago(p.at)}</span>
                    {canDelete && <button onClick={() => run(`del-${p.id}`, () => api.deletePost(p.id), '글을 지웠어요')} aria-label="삭제" className="ml-auto p-1 text-neutral-300"><Trash2 className="w-3.5 h-3.5" /></button>}</div>
                  <p className="text-sm font-bold text-neutral-700 mt-0.5 whitespace-pre-wrap break-words">{p.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <>
          <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
            <div className="text-sm font-black text-neutral-900 mb-1">🏅 헬스 계급도</div>
            <div className="text-[11px] font-bold text-neutral-400 mb-3">길드에 쌓은 기여 경험치로 계급이 올라가요</div>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {MEMBER_TIERS.map(t => {
                const mine = me && memberTier(me.contrib).name === t.name;
                return (
                  <div key={t.name} className={`flex-shrink-0 w-[72px] rounded-2xl py-2.5 text-center border ${mine ? 'bg-emerald-50 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,.25)]' : 'bg-neutral-50 border-neutral-100'}`}>
                    <div className="text-xl">{t.icon}</div>
                    <div className={`text-[10px] font-black ${mine ? 'text-emerald-700' : 'text-neutral-700'}`}>{t.name}</div>
                    <div className="text-[9px] font-bold text-neutral-400">{num(t.min)}+</div>
                  </div>
                );
              })}
            </div>
            {me && (() => {
              const nt = nextMemberTier(me.contrib), t = memberTier(me.contrib);
              return (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-500 mb-1"><span>내 계급 {t.icon} {t.name} · 기여 {num(me.contrib)} XP</span><span>{nt ? `${nt.icon} ${nt.name}까지 ${num(nt.min - me.contrib)}` : '최고 계급!'}</span></div>
                  <Bar pct={nt ? ((me.contrib - t.min) / (nt.min - t.min)) * 100 : 100} h="h-1.5" />
                </div>
              );
            })()}
          </div>
          {/* 길드 안 랭킹: 기준을 바꾸면 순서가 다시 매겨진다 */}
          <div className="flex items-end justify-between px-1 pt-1">
            <div className="text-sm font-black text-neutral-900">🏆 길드원 랭킹</div>
            <div className="text-[10px] font-bold text-neutral-400">👏 응원 1번 = 길드 +10 XP · 오늘 {cheersLeft}/{CHEER_DAILY}</div>
          </div>
          <Segmented value={rankBy} onChange={setRankBy} options={[['volume', '이번 주 볼륨'], ['days', '출석'], ['contrib', '누적 기여'], ['lift', '3대']]} />
          <div className="bg-white rounded-[28px] border border-neutral-100 overflow-hidden">
            {[...members].sort((a, b) => (Number(b[rankBy]) || 0) - (Number(a[rankBy]) || 0) || (b.contrib || 0) - (a.contrib || 0)).map((m, i) => {
              const t = memberTier(m.contrib);
              const val = Number(m[rankBy]) || 0;
              const valText = rankBy === 'days' ? `${val}회` : rankBy === 'contrib' ? `${num(val)} XP` : `${num(val)}kg`;
              const medal = ['🥇', '🥈', '🥉'][i];
              const canCheer = m.id !== meId && !m.cheered_today && cheersLeft > 0;
              return (
                <div key={m.id} className={`flex items-center gap-2 pr-3 ${i ? 'border-t border-neutral-50' : ''} ${m.id === meId ? 'bg-emerald-50/50' : ''}`}>
                  <button onClick={() => setMember(m)} className="flex-1 min-w-0 flex items-center gap-3 pl-3 py-3 text-left active:bg-neutral-50">
                    <span className={`w-7 text-center flex-shrink-0 ${medal ? 'text-xl' : 'text-sm font-black text-neutral-400 tabular-nums'}`}>{medal || i + 1}</span>
                    <Avatar user={memberUser(m)} size={42} Avatar3={Avatar3} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-sm font-black text-neutral-900 truncate">{m.nickname}</span>{m.role !== 'member' && <RoleChip role={m.role} />}{m.id === meId && <span className="text-[9px] font-black bg-neutral-900 text-white px-1.5 py-0.5 rounded">나</span>}</div>
                      <div className="text-[11px] font-bold text-neutral-400 truncate">{t.icon} {t.name}{rankBy !== 'days' ? ` · 이번 주 ${m.days || 0}회` : ` · ${num(m.volume)}kg`}{m.cheers ? ` · 👏${m.cheers}` : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-black tabular-nums ${i === 0 && val > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{valText}</div>
                      <div className="text-[9px] font-bold text-neutral-400">{{ volume: '이번 주', days: '이번 주', contrib: '누적', lift: '1RM 합계' }[rankBy]}</div>
                    </div>
                  </button>
                  {m.id !== meId && (
                    <button disabled={!canCheer || busy === `cheer-${m.id}`} onClick={() => cheer(m)} aria-label={`${m.nickname} 응원하기`}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all active:scale-90 ${m.cheered_today ? 'bg-emerald-50 opacity-60' : canCheer ? 'bg-amber-50 hover:bg-amber-100' : 'bg-neutral-100 opacity-40'}`}>{m.cheered_today ? '✅' : '👏'}</button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'skills' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white rounded-[24px] border border-neutral-100 p-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 text-white flex items-center justify-center text-xl font-black shadow-[0_0_14px_rgba(52,211,153,.45)]">{points}</div>
            <div className="flex-1">
              <div className="text-sm font-black text-neutral-900">남은 스킬 포인트</div>
              <div className="text-[11px] font-bold text-neutral-400">길드 레벨이 오를 때마다 1포인트 · {isLeader ? '관장만 투자할 수 있어요' : '관장이 투자해요'}</div>
            </div>
          </div>
          {GUILD_SKILLS.map(s => {
            const cur = skillLv(g.skills, s.key);
            const maxed = cur >= s.max;
            return (
              <div key={s.key} className="bg-white rounded-[24px] border border-neutral-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-2xl">{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-sm font-black text-neutral-900">{s.name}</span><span className="text-[10px] font-black text-neutral-400">Lv.{cur}/{s.max}</span></div>
                    <div className="flex gap-1 mt-1.5">{Array.from({ length: s.max }).map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < cur ? 'bg-gradient-to-r from-emerald-400 to-blue-500' : 'bg-neutral-100'}`} />)}</div>
                    <div className="text-[11px] font-bold text-neutral-500 mt-1.5">{cur ? `현재: ${s.desc(cur)}` : '아직 배우지 않았어요'}{!maxed && <span className="text-emerald-600"> → 다음: {s.desc(cur + 1)}</span>}</div>
                  </div>
                  {isLeader && !maxed && (
                    <button disabled={points <= 0 || busy === s.key} onClick={() => run(s.key, () => api.upgradeSkill(s.key), `${s.icon} ${s.name} Lv.${cur + 1}!`)} className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black disabled:bg-neutral-200 disabled:text-neutral-400 active:scale-95 transition-transform">강화</button>
                  )}
                  {maxed && <span className="text-[10px] font-black text-amber-600">MAX</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-3">
          {isStaff && (
            <div className="bg-white rounded-[28px] border border-neutral-100 p-4">
              <div className="text-sm font-black text-neutral-900 mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" /> 가입 신청 {requests.length}</div>
              {requests.length === 0 && <div className="text-center py-4 text-xs font-bold text-neutral-400">들어온 가입 신청이 없어요</div>}
              {requests.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-neutral-50 last:border-0">
                  <Avatar user={memberUser(r)} size={38} Avatar3={Avatar3} />
                  <span className="flex-1 text-sm font-black text-neutral-800 truncate">{r.nickname}</span>
                  <button disabled={!!busy} onClick={() => run(`req-${r.id}`, () => api.respond(r.id, false), '가입 신청을 거절했어요')} className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-black">거절</button>
                  <button disabled={!!busy || members.length >= g.cap} onClick={() => run(`req-${r.id}`, () => api.respond(r.id, true), `${r.nickname}님이 길드에 들어왔어요!`)} className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black disabled:opacity-40">승인</button>
                </div>
              ))}
            </div>
          )}
          {isLeader && (
            <div className="bg-white rounded-[28px] border border-neutral-100 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1"><div className="text-sm font-black text-neutral-900">전체 랭킹 등록</div><div className="text-[11px] font-bold text-neutral-400">길드원 평균 볼륨·3대로 순위가 매겨져요 (2명 이상)</div></div>
                <Switch on={g.ranked} disabled={busy === 'ranked'} onChange={(on) => run('ranked', () => api.setRanked(on), on ? '전체 랭킹에 등록했어요!' : '전체 랭킹에서 내려왔어요')} />
              </div>
              <button onClick={() => setFormMode('edit')} className="w-full py-3 rounded-2xl bg-neutral-100 text-neutral-700 text-sm font-black flex items-center justify-center gap-1.5"><Pencil className="w-4 h-4" /> 이름·엠블럼·소개·가입 방식 수정</button>
            </div>
          )}
          <div className="bg-white rounded-[28px] border border-neutral-100 p-4 space-y-2">
            {confirm === 'leave' ? (
              <>
                <p className="text-xs font-bold text-neutral-500 text-center">{isLeader ? (members.length > 1 ? '나가면 코치 또는 기여도가 가장 높은 길드원이 관장이 돼요.' : '혼자 남은 길드라 나가면 길드가 사라져요.') : '나가도 내 운동 기록은 그대로예요.'}</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 text-neutral-600 text-sm font-black">취소</button>
                  <button disabled={busy === 'leave'} onClick={async () => { if (await run('leave', () => api.leave(), '길드에서 나왔어요')) setConfirm(null); }} className="flex-[2] py-3 rounded-2xl bg-rose-500 text-white text-sm font-black">길드 나가기</button>
                </div>
              </>
            ) : (
              <button onClick={() => setConfirm('leave')} className="w-full py-3 rounded-2xl bg-rose-50 text-rose-600 text-sm font-black flex items-center justify-center gap-1.5"><LogOut className="w-4 h-4" /> 길드 나가기</button>
            )}
            {isLeader && members.length > 1 && (confirm === 'disband' ? (
              <>
                <p className="text-xs font-bold text-rose-500 text-center">길드 레벨·스킬·기여도가 모두 사라지고 되돌릴 수 없어요.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-2xl bg-neutral-100 text-neutral-600 text-sm font-black">취소</button>
                  <button disabled={busy === 'disband'} onClick={async () => { if (await run('disband', () => api.disband(), '길드를 해산했어요')) setConfirm(null); }} className="flex-[2] py-3 rounded-2xl bg-rose-600 text-white text-sm font-black">해산 확인</button>
                </div>
              </>
            ) : (
              <button onClick={() => setConfirm('disband')} className="w-full py-3 rounded-2xl text-rose-400 text-xs font-black flex items-center justify-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> 길드 해산</button>
            ))}
          </div>
        </div>
      )}

      {form}
      <MemberSheet member={member} myRole={myRole} meId={meId} coachCount={coachCount} busy={busy === 'member'} onAction={memberAction} onClose={() => setMember(null)} Avatar3={Avatar3} />
    </div>
  );
};
