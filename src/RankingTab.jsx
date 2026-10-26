import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GmBadge } from './GmBadge.jsx';
import { isGmOn } from './admin.js';
import { createPortal } from 'react-dom';
import { Search, Crown, Heart, UserPlus, Check, Clock, Download, ChevronDown, X, Lock } from 'lucide-react';
import { GuildCenter, GuildBadge, GuildViewSheet } from './GuildCenter.jsx';
import { HERO_BG } from './theme.js';

// 랭킹 탭: 부드러운 전환(슬라이딩 탭, 순위 재정렬 애니메이션, 숫자 카운트업, 끌어서 닫는 시트)에 집중한 화면.

// 주간 볼륨 티어 (순위 메달 🥇🥈🥉과 헷갈리지 않게 메달 모양은 쓰지 않는다)
const TIERS = [
  { name: '브론즈', min: 0, icon: '🟤', ring: '#c2410c', bg: 'from-orange-100 to-orange-50', text: 'text-orange-800' },
  { name: '실버', min: 10000, icon: '⚪', ring: '#64748b', bg: 'from-slate-100 to-slate-50', text: 'text-slate-700' },
  { name: '골드', min: 20000, icon: '🟡', ring: '#d97706', bg: 'from-amber-100 to-amber-50', text: 'text-amber-700' },
  { name: '플래티넘', min: 40000, icon: '✨', ring: '#0d9488', bg: 'from-teal-100 to-teal-50', text: 'text-teal-700' },
  { name: '다이아몬드', min: 60000, icon: '💎', ring: '#0891b2', bg: 'from-cyan-100 to-cyan-50', text: 'text-cyan-700' },
  { name: '그랜드마스터', min: 80000, icon: '👑', ring: '#e11d48', bg: 'from-rose-100 to-rose-50', text: 'text-rose-700' },
];
const tierOf = (vol) => [...TIERS].reverse().find(t => vol >= t.min);
const nextTier = (vol) => TIERS.find(t => t.min > vol) || null;
const AVATAR_GRAD = { 'bg-rose-500': ['#fb7185', '#e11d48'], 'bg-blue-500': ['#60a5fa', '#2563eb'], 'bg-emerald-500': ['#34d399', '#059669'], 'bg-purple-500': ['#c084fc', '#7c3aed'], 'bg-orange-500': ['#fb923c', '#ea580c'], 'bg-cyan-500': ['#22d3ee', '#0891b2'], 'bg-indigo-500': ['#818cf8', '#4f46e5'], 'bg-amber-500': ['#fbbf24', '#d97706'], 'bg-neutral-800': ['#525252', '#171717'] };

const METRIC = {
  volume: { label: '주간 볼륨', short: '볼륨', unit: 'kg', icon: '💪' },
  lift: { label: '3대 중량', short: '3대', unit: 'kg', icon: '🏋️' },
  cardio: { label: '주간 유산소', short: '유산소', unit: '분', icon: '🏃' },
};

// 숫자가 부드럽게 올라가는 카운트업
const useCountUp = (value, ms = 650) => {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now(), a = from.current, b = value;
    let raf;
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(a + (b - a) * e));
      if (k < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return v;
};

// 밑줄이 미끄러지듯 움직이는 탭
export const Segmented = ({ options, value, onChange, dark }) => {
  const idx = Math.max(0, options.findIndex(o => o[0] === value));
  return (
    <div className={`relative flex p-1 rounded-2xl ${dark ? 'bg-neutral-900' : 'bg-neutral-200/70'}`}>
      <div className={`absolute top-1 bottom-1 rounded-xl shadow-sm transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${dark ? 'bg-white/15' : 'bg-white'}`}
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${idx * 100}%)` }} />
      {options.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} className={`relative z-10 flex-1 py-2.5 text-xs font-black transition-colors duration-300 ${value === id ? (dark ? 'text-white' : 'text-neutral-900') : (dark ? 'text-white/50' : 'text-neutral-500')}`}>{label}</button>
      ))}
    </div>
  );
};

export const Avatar = ({ user, size = 48, ring, Avatar3 }) => {
  const g = AVATAR_GRAD[user.avatarColor] || ['#94a3b8', '#475569'];
  return (
    <div className="relative flex-shrink-0 rounded-full" style={{ width: size, height: size, padding: ring ? 2.5 : 0, background: ring || 'transparent' }}>
      <div className="w-full h-full rounded-full overflow-hidden flex items-end justify-center border-2 border-white" style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
        {user.profile && Avatar3
          ? <div className="w-[120%] h-[120%] translate-y-[14%]"><Avatar3 profile={user.profile} size="w-full h-full" crop /></div>
          : <span className="text-white font-black self-center" style={{ fontSize: size * 0.4 }}>{String(user.name).charAt(0)}</span>}
      </div>
    </div>
  );
};

// 아래에서 올라오고, 손잡이를 끌어내리면 닫히는 시트
export const Sheet = ({ open, onClose, children }) => {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  useEffect(() => {
    if (open) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => setShown(true))); }
    else if (mounted) { setShown(false); const t = setTimeout(() => setMounted(false), 320); return () => clearTimeout(t); }
    return undefined;
  }, [open]);
  if (!mounted) return null;
  const close = () => onClose();
  const onDown = (e) => { start.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => { if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current)); };
  const onUp = () => { if (start.current === null) return; start.current = null; if (drag > 110) { setDrag(0); close(); } else setDrag(0); };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300" style={{ opacity: shown ? Math.max(0, 1 - drag / 400) : 0 }} onClick={close} />
      <div className="relative bg-white rounded-t-[36px] shadow-[0_-20px_60px_rgba(0,0,0,0.25)] max-h-[90vh] flex flex-col"
        style={{ transform: `translateY(${shown ? drag : 640}px)`, transition: start.current !== null ? 'none' : 'transform 340ms cubic-bezier(.2,.9,.25,1)' }}>
        <div className="pt-3 pb-2 flex justify-center cursor-grab touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="w-12 h-1.5 rounded-full bg-neutral-200" />
        </div>
        <div className="overflow-y-auto px-6 pb-8">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

// 응원 하트가 위로 떠오르는 효과
const HeartBurst = ({ burst }) => (
  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
    {burst > 0 && [0, 1, 2, 3, 4].map(i => (
      <span key={`${burst}-${i}`} className="absolute text-base rk-heart" style={{ '--dx': `${(i - 2) * 16}px`, animationDelay: `${i * 40}ms` }}>❤️</span>
    ))}
  </span>
);

const UserSheet = ({ user, rank, metric, me, friends, sentRequests, cheers, onCheer, onSteal, onFriend, onClose, Avatar3, limited }) => {
  const [burst, setBurst] = useState(0);
  const [confirmSteal, setConfirmSteal] = useState(false);
  const [pop, setPop] = useState(false);
  if (!user) return null;
  const tier = tierOf(user.volume);
  const isMe = user.isMe;
  const isFriend = friends.includes(user.id);
  const pending = sentRequests.includes(user.id);
  const count = cheers[user.id] || 0;
  // 그 사람이 가장 최근에 저장한 운동 (없으면 루틴 가져오기 비활성)
  const items = Array.isArray(user.routine?.items) ? user.routine.items : [];
  const routine = items.map(it => {
    const sets = Array.isArray(it.sets) ? it.sets : [];
    const top = sets.reduce((m, st) => Math.max(m, Number(st.weight) || 0), 0);
    return { name: it.name, sets: sets.length, reps: sets[0]?.reps || '-', w: top };
  });
  const routineDate = user.routine?.date ? user.routine.date.slice(5).replace('-', '/') : '';
  const cheer = () => { onCheer(user.id); setBurst(b => b + 1); setPop(true); setTimeout(() => setPop(false), 220); };
  return (
    <>
      <div className="flex items-center gap-4 mb-5">
        <Avatar user={user} size={72} ring={`linear-gradient(135deg, ${tier.ring}, #ffffff)`} Avatar3={Avatar3} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xl font-black text-neutral-900 truncate">{user.name}</h3>{isGmOn(user.id, user.profile) && <GmBadge />}
            {isMe && <span className="text-[10px] font-black bg-[#4768ff] text-white px-1.5 py-0.5 rounded-md">ME</span>}
          </div>
          <div className={`inline-flex items-center gap-1 mt-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-gradient-to-r ${tier.bg} ${tier.text}`}>{tier.icon} {tier.name} 티어</div>
          <div className="text-xs font-bold text-neutral-400 mt-1">{METRIC[metric].label} {rank}위{limited ? ' · 개인 참가' : ` · 최애 ${user.fav || '-'}`}{user.guild ? ` · ${user.guild.emblem} ${user.guild.name}` : ''}</div>
        </div>
        <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full bg-neutral-100 text-neutral-500 active:scale-90 transition-transform self-start"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[['주간 볼륨', `${user.volume.toLocaleString()}kg`], ['3대 중량', `${user.lift}kg`], ['받은 응원', `${count}`]].map(([k, v]) => (
          <div key={k} className="bg-neutral-50 border border-neutral-100 rounded-2xl py-3 text-center">
            <div className={`text-base font-black text-neutral-900 transition-transform duration-200 ${k === '받은 응원' && pop ? 'scale-125 text-rose-500' : ''}`}>{v}</div>
            <div className="text-[10px] font-bold text-neutral-400">{k}</div>
          </div>
        ))}
      </div>

      {limited ? (
        <div className="mb-5 bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 text-xs font-bold text-neutral-500 flex items-center gap-2"><Lock className="w-4 h-4 text-neutral-400" /> 친구가 되면 최근 루틴을 보고 가져올 수 있어요</div>
      ) : (
      <div className="mb-5">
        <div className="text-xs font-black text-neutral-500 mb-2">🔥 최근 루틴{routineDate && <span className="text-neutral-400 font-bold"> · {routineDate}</span>}</div>
        {routine.length === 0 && <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3.5 py-4 text-center text-xs font-bold text-neutral-400">아직 저장된 운동 기록이 없어요</div>}
        <div className="space-y-1.5">
          {routine.map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-3.5 py-3 shadow-sm">
              <span className="text-sm font-black text-neutral-800">{r.name}</span>
              <span className="text-xs font-black text-[#4768ff]">{r.w}kg · {r.sets}×{r.reps}</span>
            </div>
          ))}
        </div>
      </div>
      )}

      {!isMe && (
        <>
          <div className="flex gap-2 mb-2">
            <button onClick={cheer} className="relative flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-sm shadow-[0_10px_24px_rgba(244,63,94,0.32)] active:scale-[0.97] transition-transform flex items-center justify-center gap-1.5">
              <HeartBurst burst={burst} />
              <Heart className={`w-4 h-4 fill-current transition-transform ${pop ? 'scale-125' : ''}`} /> 응원하기
            </button>
            {!limited && <button disabled={!routine.length} onClick={() => setConfirmSteal(c => !c)} className={`flex-1 disabled:opacity-40 disabled:shadow-none py-3.5 rounded-2xl font-black text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 ${confirmSteal ? 'bg-neutral-900 text-white' : 'bg-[#4768ff] text-white shadow-[0_10px_24px_rgba(71,104,255,0.3)]'}`}>
              <Download className="w-4 h-4" /> 루틴 가져오기
            </button>}
          </div>
          <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: confirmSteal ? '1fr' : '0fr' }}>
            <div className="overflow-hidden">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-2">
                <p className="text-xs font-bold text-[#3550d6] leading-relaxed mb-2">오늘 운동 화면이 {user.name}님의 루틴으로 바뀌어요. 진행 중인 운동이 있다면 덮어씁니다.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmSteal(false)} className="flex-1 py-2 rounded-xl bg-white text-neutral-600 text-xs font-black border border-neutral-200 active:scale-95 transition-transform">취소</button>
                  <button onClick={() => onSteal(user)} className="flex-[2] py-2 rounded-xl bg-[#4768ff] text-white text-xs font-black active:scale-95 transition-transform">불러와서 운동 시작</button>
                </div>
              </div>
            </div>
          </div>
          {isFriend ? (
            <div className="w-full py-3 rounded-2xl bg-emerald-50 text-emerald-600 text-sm font-black flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> 친구예요</div>
          ) : pending ? (
            <div className="w-full py-3 rounded-2xl bg-neutral-100 text-neutral-400 text-sm font-black flex items-center justify-center gap-1.5"><Clock className="w-4 h-4" /> 친구 요청 수락 대기 중</div>
          ) : (
            <button onClick={() => onFriend(user.id)} className="w-full py-3 rounded-2xl bg-neutral-100 text-neutral-700 text-sm font-black flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform hover:bg-neutral-200"><UserPlus className="w-4 h-4" /> 친구 추가</button>
          )}
        </>
      )}
      {isMe && <div className="w-full py-3 rounded-2xl bg-neutral-100 text-neutral-400 text-sm font-black text-center">내 프로필이에요 · 이번 주 기록이 쌓이면 순위가 올라가요</div>}
    </>
  );
};

// 랭킹 탭
// · 전체 랭킹: 랭킹에 등록한 길드(소속 인원 평균)와 개인 참가자만
// · 친구 랭킹: 서로 친구인 사람만 (친구가 아니면 기록이 보이지 않는다)
// · 길드: 만들기·가입·내 길드
export const RankingTab = ({ initialScope = 'global', onClaimXp, claimedKeys = [], friendUsers = [], globalEntries = [], me, meId, friends = [], sentRequests = [], cheers = {}, weekLabel, daysLeft, onCheer, onSteal, onFriend, onFindFriends, onInvite, guest, onLogin, loading, Avatar3, guildApi, guildData, guildLoading, reloadGuild, onToast }) => {
  const [scope, setScope] = useState(initialScope);
  const [metric, setMetric] = useState('volume');
  const [selected, setSelected] = useState(null);
  const [viewGuild, setViewGuild] = useState(null);
  const [meVisible, setMeVisible] = useState(true);
  const rowRefs = useRef(new Map());
  const rects = useRef(new Map());
  const meRowRef = useRef(null);
  const lastSelected = useRef(null); // 시트가 내려가는 동안에도 내용을 유지
  if (selected) lastSelected.current = selected;
  const myGuildId = guildData?.guild?.id || null;

  // 운영자 모드(흰 정장)인 운영자는 랭킹에 나오지 않는다
  const meHidden = isGmOn(me.id, me.profile);
  // 전체 랭킹 항목: 길드는 엠블럼, 개인은 아바타
  const entries = useMemo(() => globalEntries.filter(e => !(e.kind === 'solo' && isGmOn(e.id, e.avatar))).map(e => ({
    id: e.id, kind: e.kind, name: e.name || '짐스피릿 유저', emblem: e.emblem, color: e.color, level: e.level, members: e.members,
    volume: Math.round(Number(e.volume) || 0), lift: Math.round(Number(e.lift) || 0), cardio: Math.round(Number(e.cardio) || 0),
    profile: e.avatar && Object.keys(e.avatar).length ? e.avatar : null, avatarColor: 'bg-neutral-700',
    isMe: e.kind === 'guild' ? e.id === myGuildId : e.id === meId,
  })), [globalEntries, myGuildId, meId]);

  const list = useMemo(() => {
    const l = scope === 'friends' ? [...friendUsers.filter(u => !isGmOn(u.id, u.profile)), ...(meHidden ? [] : [me])] : scope === 'global' ? [...entries] : [];
    return l.sort((a, b) => b[metric] - a[metric]);
  }, [friendUsers, entries, me, meHidden, scope, metric]);
  const myIndex = list.findIndex(u => u.isMe);
  const myEntry = myIndex >= 0 ? list[myIndex] : null;
  const above = myIndex > 0 ? list[myIndex - 1] : null;
  const tier = tierOf(me.volume), nt = nextTier(me.volume);
  const tierPct = nt ? ((me.volume - tier.min) / (nt.min - tier.min)) * 100 : 100;
  const topVal = list[0]?.[metric] || 1;
  const percentile = list.length > 1 && myIndex >= 0 ? Math.max(1, Math.round(((myIndex + 1) / list.length) * 100)) : 100;
  const myVal = useCountUp(scope === 'global' ? (myEntry?.[metric] || 0) : me[metric]);
  const myGuildRank = useMemo(() => {
    if (!myGuildId) return null;
    const sorted = [...entries].sort((a, b) => b.volume - a.volume);
    const i = sorted.findIndex(e => e.kind === 'guild' && e.id === myGuildId);
    return i >= 0 ? i + 1 : null;
  }, [entries, myGuildId]);

  // 정렬·필터가 바뀌기 직전 위치를 기억했다가, 바뀐 뒤 그 차이만큼 미끄러지게 한다 (FLIP)
  const snapshot = () => rowRefs.current.forEach((el, k) => { if (el && el.offsetParent) rects.current.set(k, el.getBoundingClientRect().top); });
  useLayoutEffect(() => {
    rowRefs.current.forEach((el, k) => {
      if (!el || !el.offsetParent) return;
      const prev = rects.current.get(k);
      const now = el.getBoundingClientRect().top;
      if (prev !== undefined && Math.abs(prev - now) > 1) {
        el.style.transition = 'none';
        el.style.transform = `translateY(${prev - now}px)`;
        requestAnimationFrame(() => { el.style.transition = 'transform 520ms cubic-bezier(.2,.85,.25,1)'; el.style.transform = ''; });
      } else if (prev === undefined) {
        el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
    rects.current.clear();
  }, [list]);

  // 내 줄이 화면 밖이면 '내 순위로' 버튼을 띄운다
  useEffect(() => {
    const el = meRowRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setMeVisible(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [list]);

  const change = (setter) => (v) => { snapshot(); setter(v); };
  const open = (u) => (u.kind === 'guild' ? setViewGuild(u.id) : setSelected(u));
  const podium = list.slice(0, 3);
  const order = [1, 0, 2].filter(i => podium[i]);
  const H = { 0: 'h-28', 1: 'h-20', 2: 'h-16' };
  const medal = ['🥇', '🥈', '🥉'];
  const Mark = ({ u, size, ring }) => (u.kind === 'guild'
    ? <GuildBadge emblem={u.emblem} color={u.color} size={size} glow={!!ring} />
    : <Avatar user={u} size={size} ring={ring} Avatar3={Avatar3} />);
  const sub = (u) => (u.kind === 'guild' ? `Lv.${u.level} · 👥 ${u.members}명 평균` : u.kind === 'solo' ? '개인 참가' : null);
  const loginCard = (title, desc) => (
    <div className="bg-white rounded-[28px] border border-neutral-100 p-8 text-center">
      <div className="text-3xl mb-2">🔒</div>
      <p className="text-sm font-black text-neutral-900 mb-1">{title}</p>
      <p className="text-xs font-bold text-neutral-500 mb-4 leading-relaxed">{desc}</p>
      <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-black active:scale-95 transition-transform">회원가입 / 로그인</button>
    </div>
  );

  return (
    <div className="flex-1 bg-neutral-50 pb-32 overflow-y-auto text-neutral-900 rk-root">
      <style>{`
        @keyframes rkRise { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
        .rk-rise { animation: rkRise 560ms cubic-bezier(.2,.85,.25,1) both; }
        @keyframes rkHeart { 0% { transform: translate(0,0) scale(.6); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(var(--dx), -70px) scale(1.15); opacity: 0; } }
        .rk-heart { animation: rkHeart 800ms ease-out forwards; }
        .rk-root button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* 헤더 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-end justify-between mb-1">
          <div>
            <div className="text-[11px] font-black text-neutral-400">{weekLabel}</div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">{scope === 'guild' ? '길드' : '이번 주 랭킹'}</h2>
          </div>
          <button onClick={onFindFriends} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-black shadow-sm active:scale-95 transition-transform"><Search className="w-3.5 h-3.5" /> 친구 찾기</button>
        </div>
        <p className="text-xs font-bold text-neutral-400 mb-4">시즌 마감까지 {daysLeft} · 월요일 0시에 새 시즌이 시작돼요</p>

        {/* 내 순위 카드 */}
        {scope === 'friends' && !guest && (
          <button onClick={() => setSelected(me)} className="w-full text-left rounded-[26px] p-4 border border-white/5 text-white shadow-[0_12px_28px_rgba(7,11,15,0.18)] active:scale-[0.99] transition-transform" style={{ background: HERO_BG }}>
            <div className="flex items-center gap-3">
              <Avatar user={me} size={54} ring={`linear-gradient(135deg, ${tier.ring}, #ffffff)`} Avatar3={Avatar3} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black truncate">{me.name}</span>{isGmOn(me.id, me.profile) && <GmBadge small />}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r ${tier.bg} ${tier.text}`}>{tier.icon} {tier.name} 티어</span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black tabular-nums">{myVal.toLocaleString()}</span>
                  <span className="text-xs font-bold text-white/50">{METRIC[metric].unit} · {METRIC[metric].label}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-white/50">친구 중</div>
                {meHidden ? (
                  <><div className="text-lg font-black leading-none mt-1">랭킹 제외</div><div className="text-[10px] font-black text-white/50 mt-1">운영자 모드</div></>
                ) : (
                  <><div className="text-3xl font-black leading-none">{myIndex + 1}<span className="text-sm text-white/60">위</span></div>
                  <div className="text-[10px] font-black text-emerald-300 mt-0.5">{percentile < 100 ? `상위 ${percentile}%` : '도전 중'}</div></>
                )}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-bold text-white/50 mb-1">
                <span>{nt ? `${nt.icon} ${nt.name} 티어까지 ${(nt.min - me.volume).toLocaleString()}kg` : '최고 티어 달성!'}</span>
                <span>{meHidden ? '일반 유저 모드로 바꾸면 다시 순위에 들어가요' : above ? `${above.name}님까지 ${(above[metric] - me[metric]).toLocaleString()}${METRIC[metric].unit}` : myIndex === 0 && list.length > 1 ? '1위를 지키는 중' : ''}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all duration-700" style={{ width: `${Math.max(3, tierPct)}%` }} /></div>
            </div>
          </button>
        )}
        {scope === 'global' && (myEntry ? (
          <button onClick={() => open(myEntry)} className="w-full text-left rounded-[26px] p-4 border border-white/5 text-white shadow-[0_12px_28px_rgba(7,11,15,0.18)] active:scale-[0.99] transition-transform" style={{ background: HERO_BG }}>
            <div className="flex items-center gap-3">
              <Mark u={myEntry} size={54} ring="linear-gradient(135deg,#34d399,#ffffff)" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="font-black truncate">{myEntry.name}</span><span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/15">{myEntry.kind === 'guild' ? '내 길드' : '개인 참가'}</span></div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black tabular-nums">{myVal.toLocaleString()}</span>
                  <span className="text-xs font-bold text-white/50">{METRIC[metric].unit} · {myEntry.kind === 'guild' ? `${myEntry.members}명 평균` : METRIC[metric].label}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-white/50">전체</div>
                <div className="text-3xl font-black leading-none">{myIndex + 1}<span className="text-sm text-white/60">위</span></div>
                <div className="text-[10px] font-black text-emerald-300 mt-0.5">{percentile < 100 ? `상위 ${percentile}%` : '도전 중'}</div>
              </div>
            </div>
          </button>
        ) : meHidden ? (
          <div className="rounded-[26px] p-4 border border-white/5 text-white shadow-[0_12px_28px_rgba(7,11,15,0.18)]" style={{ background: HERO_BG }}>
            <div className="flex items-center gap-1.5 text-sm font-black">운영자 모드에서는 랭킹에 나오지 않아요 <GmBadge small /></div>
            <div className="text-[11px] font-bold text-white/50 mt-1 leading-relaxed">개인 순위와 길드 평균·MVP에서 빠져 있어요. 일반 유저 모드로 바꾸면 다시 반영돼요.</div>
          </div>
        ) : !guest && (
          <div className="rounded-[26px] p-4 border border-white/5 text-white shadow-[0_12px_28px_rgba(7,11,15,0.18)]" style={{ background: HERO_BG }}>
            <div className="text-sm font-black">아직 전체 랭킹에 등록하지 않았어요</div>
            <div className="text-[11px] font-bold text-white/50 mt-1 leading-relaxed">길드로 함께 참가하거나(길드원 평균 기록), 개인으로 참가할 수 있어요.</div>
            <button onClick={() => setScope('guild')} className="mt-3 px-4 py-2.5 rounded-xl bg-emerald-400 text-neutral-950 text-xs font-black shadow-[0_0_14px_rgba(52,211,153,.5)] active:scale-95 transition-transform">길드 · 개인 참가 하러 가기</button>
          </div>
        ))}
      </div>

      <div className="px-5 space-y-3 -mt-1">
        <Segmented options={[['global', '🏆 전체 랭킹'], ['friends', '🤝 친구'], ['guild', '🛡️ 길드']]} value={scope} onChange={change(setScope)} />
        {scope !== 'guild' && <Segmented options={Object.entries(METRIC).map(([k, m]) => [k, `${m.icon} ${m.label}`])} value={metric} onChange={change(setMetric)} />}

        {scope === 'guild' ? (
          guest ? loginCard('길드는 회원 전용이에요', '가입하면 길드를 만들거나 들어가서 함께 레이드 보스를 잡고 랭킹에 도전할 수 있어요.')
            : <GuildCenter api={guildApi} data={guildData} loading={guildLoading} reload={reloadGuild} meId={meId} meHidden={meHidden} myGuildRank={myGuildRank} onToast={onToast} Avatar3={Avatar3} onClaimXp={onClaimXp} claimedKeys={claimedKeys} />
        ) : scope === 'friends' && guest ? (
          loginCard('친구 랭킹은 회원 전용이에요', '게스트 기록은 이 기기에만 있어요. 가입하고 친구를 추가하면 서로의 순위를 비교하고 응원할 수 있어요.')
        ) : loading ? (
          /* 새 기록을 받아오는 동안은 지난 순위를 보여주지 않는다 (누른 순위와 시트 순위가 어긋나지 않게) */
          <div className="bg-white rounded-[28px] border border-neutral-100 p-10 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-emerald-500 animate-spin" /></div>
        ) : list.length <= (scope === 'friends' && !meHidden ? 1 : 0) ? (
          <div className="bg-white rounded-[28px] border border-neutral-100 p-8 text-center">
            <div className="text-3xl mb-2">{scope === 'friends' ? '🤝' : '🏁'}</div>
            <p className="text-sm font-black text-neutral-900 mb-1">{scope === 'friends' ? '아직 함께하는 친구가 없어요' : '아직 랭킹에 등록한 길드나 개인이 없어요'}</p>
            <p className="text-xs font-bold text-neutral-500 mb-4">{scope === 'friends' ? '친구를 추가하면 서로의 기록을 보고 순위를 비교할 수 있어요.' : '길드를 만들어 랭킹에 등록하거나, 개인으로 참가해 첫 1위가 되어 보세요.'}</p>
            <div className="flex gap-2 justify-center">
              {scope === 'friends' ? (
                <>
                  {onInvite && <button onClick={onInvite} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black active:scale-95 transition-transform">친구 초대하기</button>}
                  <button onClick={onFindFriends} className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-black active:scale-95 transition-transform">친구 찾기</button>
                </>
              ) : (
                <button onClick={() => setScope('guild')} className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-black active:scale-95 transition-transform">길드 · 개인 참가</button>
              )}
            </div>
          </div>
        ) : (
          <>
            {scope === 'global' && <div className="text-[11px] font-bold text-neutral-400 px-1">🛡️ 길드는 소속 인원 평균 기록이에요 · 등록한 길드와 개인만 보여요</div>}
            {/* 시상대 */}
            <div key={`${scope}-${metric}`} className="bg-white rounded-[28px] border border-neutral-100 shadow-sm px-3 pt-5 pb-0 overflow-hidden">
              <div className="flex items-end justify-center gap-2">
                {order.map(i => {
                  const u = podium[i];
                  return (
                    <button key={u.id} onClick={() => open(u)} className="flex-1 max-w-[120px] flex flex-col items-center rk-rise active:scale-95 transition-transform" style={{ animationDelay: `${[120, 0, 220][i]}ms` }}>
                      {i === 0 && <Crown className="w-6 h-6 text-amber-400 mb-0.5 drop-shadow" />}
                      <Mark u={u} size={i === 0 ? 64 : 52} ring={i === 0 ? 'linear-gradient(135deg,#fde68a,#f59e0b)' : i === 1 ? 'linear-gradient(135deg,#e2e8f0,#94a3b8)' : 'linear-gradient(135deg,#fed7aa,#ea580c)'} />
                      <span className="text-xs font-black text-neutral-900 mt-1.5 truncate max-w-full">{u.name}{u.isMe ? (u.kind === 'guild' ? ' (내 길드)' : ' (나)') : ''}</span>
                      <span className="text-[10px] font-black text-neutral-400 tabular-nums">{u[metric].toLocaleString()}{METRIC[metric].unit}</span>
                      <div className={`w-full mt-2 rounded-t-2xl flex items-start justify-center pt-2 text-xl ${H[i]} ${i === 0 ? 'bg-gradient-to-b from-amber-200 to-amber-100' : i === 1 ? 'bg-gradient-to-b from-slate-200 to-slate-100' : 'bg-gradient-to-b from-orange-200 to-orange-100'}`}>{medal[i]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4위부터 */}
            <div className="bg-white rounded-[28px] border border-neutral-100 shadow-sm overflow-hidden">
              {list.map((u, idx) => {
                const t = tierOf(u.volume);
                const pct = (u[metric] / topVal) * 100;
                return (
                  <div key={`${u.kind || 'u'}-${u.id}`} ref={el => { rowRefs.current.set(u.id, el); if (u.isMe) meRowRef.current = el; }}
                    className={`will-change-transform ${idx < 3 ? 'hidden' : ''}`}>
                    <button onClick={() => open(u)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-neutral-100 ${u.isMe ? 'bg-emerald-50' : 'hover:bg-neutral-50'} ${idx > 3 ? 'border-t border-neutral-50' : ''}`}>
                      <span className={`w-7 text-center text-sm font-black tabular-nums ${u.isMe ? 'text-emerald-600' : 'text-neutral-400'}`}>{idx + 1}</span>
                      <Mark u={u} size={44} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-neutral-900 truncate">{u.name}</span>{!u.kind || u.kind === 'solo' ? isGmOn(u.id, u.profile) && <GmBadge small /> : null}
                          {u.isMe && <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded">{u.kind === 'guild' ? '내 길드' : 'ME'}</span>}
                          {!u.kind && friends.includes(u.id) && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">친구</span>}
                        </div>
                        {sub(u) && <div className="text-[10px] font-bold text-neutral-400">{sub(u)}</div>}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(4, pct)}%`, background: u.isMe ? '#10b981' : u.kind === 'guild' ? '#2563eb' : t.ring }} /></div>
                          <span className="text-[10px] font-black text-neutral-500 tabular-nums w-16 text-right">{u[metric].toLocaleString()}{METRIC[metric].unit}</span>
                        </div>
                      </div>
                      {u.kind !== 'guild' && <span className="text-sm" title={t.name}>{t.icon}</span>}
                    </button>
                  </div>
                );
              })}
              {list.length <= 3 && <div className="p-4 text-center text-xs font-bold text-neutral-400">순위가 위 시상대에 모두 표시됐어요</div>}
            </div>
          </>
        )}
      </div>

      {/* 내 순위로 이동 */}
      {scope !== 'guild' && myIndex >= 3 && (
        <button onClick={() => meRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className={`fixed left-1/2 bottom-24 z-30 -translate-x-1/2 px-4 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-black shadow-xl flex items-center gap-1.5 transition-all duration-300 ${meVisible ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          내 순위 {myIndex + 1}위 <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {lastSelected.current && (
          <UserSheet user={lastSelected.current} rank={list.findIndex(u => u.id === lastSelected.current.id) + 1 || '-'} metric={metric} me={me} friends={friends} sentRequests={sentRequests} cheers={cheers}
            limited={lastSelected.current.kind === 'solo' && !friends.includes(lastSelected.current.id) && !lastSelected.current.isMe}
            onCheer={onCheer} onSteal={(u) => { setSelected(null); onSteal(u); }} onFriend={onFriend} onClose={() => setSelected(null)} Avatar3={Avatar3} />
        )}
      </Sheet>
      {guildApi && <GuildViewSheet guildId={viewGuild} api={guildApi} canJoin={!guest && !myGuildId} onJoined={reloadGuild} onClose={() => setViewGuild(null)} onToast={onToast} Avatar3={Avatar3} />}
    </div>
  );
};
