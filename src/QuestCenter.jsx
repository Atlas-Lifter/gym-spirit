import React, { useMemo, useState } from 'react';
import { Trophy, Check, Gift, ChevronDown, Lock, Flame, Sparkles } from 'lucide-react';
import { summarize, dailyQuests, weeklyQuests, achievements, levelInfo, timeLeft, TIER_STYLE, TIER_XP, dateKey } from './questSystem.js';

const WEEK = ['월', '화', '수', '목', '금', '토', '일'];

// 단계별 메달 (브론즈 → 다이아몬드)
const Medal = ({ tier, icon, locked, size = 44 }) => {
  const st = TIER_STYLE[tier];
  const id = `md-${tier}-${locked ? 'l' : 'u'}`;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={locked ? '#f1f5f9' : st.fill[0]} />
          <stop offset="1" stopColor={locked ? '#cbd5e1' : st.fill[1]} />
        </linearGradient>
      </defs>
      <path d="M13 2 L19 14 L25 14 L31 2 Z" fill={locked ? '#cbd5e1' : '#ef4444'} opacity="0.9" />
      <circle cx="22" cy="26" r="15" fill={`url(#${id})`} stroke={locked ? '#94a3b8' : st.ring} strokeWidth="2.4" />
      <circle cx="22" cy="26" r="11" fill="none" stroke="#ffffff" strokeOpacity={locked ? 0.4 : 0.55} strokeWidth="1.2" />
      <text x="22" y="31" textAnchor="middle" fontSize="13" opacity={locked ? 0.35 : 1}>{icon}</text>
    </svg>
  );
};

const Bar = ({ pct, color = 'from-[#4768ff] to-[#8b5cf6]' }) => (
  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
    <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} />
  </div>
);

const QuestRow = ({ q, claimed, onClaim }) => {
  const pct = Math.min(100, (q.cur / q.goal) * 100);
  const ready = q.done && !claimed;
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${claimed ? 'bg-neutral-50 border-neutral-100' : ready ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-neutral-100'}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${claimed ? 'bg-neutral-100 grayscale' : 'bg-gradient-to-br from-blue-50 to-violet-50'}`}>{q.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-black truncate ${claimed ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>{q.title}</span>
          <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md flex-shrink-0">+{q.xp} XP</span>
        </div>
        <p className="text-[11px] font-bold text-neutral-400 truncate mb-1.5">{q.desc}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1"><Bar pct={pct} color={q.done ? 'from-emerald-400 to-emerald-500' : undefined} /></div>
          <span className="text-[10px] font-black text-neutral-500 w-16 text-right">{Math.min(q.cur, q.goal).toLocaleString()}/{q.goal.toLocaleString()}{q.unit || ''}</span>
        </div>
      </div>
      {claimed
        ? <div className="w-16 flex justify-center"><span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span></div>
        : <button disabled={!ready} onClick={() => onClaim([{ key: q.key, xp: q.xp, label: q.title }])} className={`w-16 py-2 rounded-xl text-[11px] font-black transition-all ${ready ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md animate-pulse active:scale-95' : 'bg-neutral-100 text-neutral-400'}`}>{ready ? '받기' : '진행 중'}</button>}
    </div>
  );
};

export const QuestCenter = ({ workouts, diet, bodyStats, total3, questState, onClaim }) => {
  const [tab, setTab] = useState('daily');
  const [openAch, setOpenAch] = useState(null);
  const [pop, setPop] = useState(null);
  const claimed = questState?.claimed || {};
  const xp = questState?.xp || 0;

  const S = useMemo(() => summarize(workouts, diet), [workouts, diet]);
  const now = new Date();
  const daily = dailyQuests(S, bodyStats, now);
  const weekly = weeklyQuests(S, now);
  const achs = achievements(S, total3);
  const lv = levelInfo(xp);
  const left = timeLeft(now);
  const todayKey = dateKey(now);

  // 오늘부터 거꾸로 이어지는 연속 운동일
  let streak = 0;
  { const d = new Date(now); if (!S.day[dateKey(d)]) d.setDate(d.getDate() - 1); while (S.day[dateKey(d)]) { streak++; d.setDate(d.getDate() - 1); } }

  const claimableDaily = daily.filter(q => q.done && !claimed[q.key]);
  const claimableWeekly = weekly.quests.filter(q => q.done && !claimed[q.key]);
  const claimableAch = achs.flatMap(a => a.tierKeys.map((k, i) => ({ k, i, a })).filter(({ k, i }) => i < a.reached && !claimed[k]).map(({ k, i, a }) => ({ key: k, xp: TIER_XP[i], label: `${a.title} · ${a.names[i]}` })));
  const badgesEarned = achs.reduce((n, a) => n + a.reached, 0);
  const badgesTotal = achs.reduce((n, a) => n + a.targets.length, 0);

  const claim = (items) => {
    if (!items.length) return;
    onClaim(items);
    const total = items.reduce((a, it) => a + it.xp, 0);
    setPop({ total, n: items.length, at: Date.now() });
    setTimeout(() => setPop(p => (p && Date.now() - p.at >= 1500 ? null : p)), 1600);
  };

  const TABS = [
    ['daily', '일일', claimableDaily.length],
    ['weekly', '주간', claimableWeekly.length],
    ['ach', '업적', claimableAch.length],
    ['badges', '뱃지', 0],
  ];
  const currentClaimables = tab === 'daily' ? claimableDaily.map(q => ({ key: q.key, xp: q.xp, label: q.title }))
    : tab === 'weekly' ? claimableWeekly.map(q => ({ key: q.key, xp: q.xp, label: q.title }))
      : tab === 'ach' ? claimableAch : [];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-black text-neutral-900 mb-3 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> 퀘스트 & 업적</h3>

      {/* 레벨 카드 */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] text-white p-5 shadow-lg mb-3">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(251,146,60,0.45)] flex-shrink-0">
            <span className="text-[10px] font-black text-white/80 leading-none">LV</span>
            <span className="text-2xl font-black leading-none">{lv.level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white/60">나의 칭호</div>
            <div className="text-lg font-black leading-tight">{lv.title}</div>
            <div className="mt-2 h-2.5 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-300 to-pink-400 rounded-full transition-all duration-700" style={{ width: `${Math.max(3, lv.pct)}%` }} /></div>
            <div className="flex justify-between text-[10px] font-bold text-white/60 mt-1"><span>{xp.toLocaleString()} XP</span><span>다음 레벨까지 {(lv.need - lv.into).toLocaleString()} XP</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 relative">
          <div className="bg-white/10 rounded-xl py-2 text-center"><div className="text-base font-black flex items-center justify-center gap-1"><Flame className="w-4 h-4 text-orange-300" />{streak}일</div><div className="text-[10px] font-bold text-white/60">연속 운동</div></div>
          <div className="bg-white/10 rounded-xl py-2 text-center"><div className="text-base font-black">{badgesEarned}/{badgesTotal}</div><div className="text-[10px] font-bold text-white/60">획득 뱃지</div></div>
          <div className="bg-white/10 rounded-xl py-2 text-center"><div className="text-base font-black">{S.prCount}회</div><div className="text-[10px] font-bold text-white/60">개인 신기록</div></div>
        </div>
        <div className="flex justify-between mt-3 relative">
          {weekly.days.map((d, i) => {
            const done = !!S.day[d];
            const isToday = d === todayKey;
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${done ? 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-emerald-950' : 'bg-white/10 text-white/50'} ${isToday ? 'ring-2 ring-amber-300' : ''}`}>{done ? '✓' : Number(d.slice(8))}</div>
                <span className={`text-[9px] font-bold ${isToday ? 'text-amber-300' : 'text-white/40'}`}>{isToday ? '오늘' : WEEK[i]}</span>
              </div>
            );
          })}
        </div>
        {pop && (
          <div key={pop.at} className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
            <div className="bg-amber-300 text-amber-950 font-black text-lg px-4 py-2 rounded-2xl shadow-xl flex items-center gap-1.5"><Sparkles className="w-5 h-5" /> +{pop.total} XP{pop.n > 1 ? ` (${pop.n}개)` : ''}</div>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex bg-neutral-100 p-1 rounded-xl mb-3">
        {TABS.map(([id, label, n]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all relative ${tab === id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}>
            {label}
            {n > 0 && <span className="absolute -top-1 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{n}</span>}
          </button>
        ))}
      </div>

      {currentClaimables.length > 1 && (
        <button onClick={() => claim(currentClaimables)} className="w-full mb-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
          <Gift className="w-4 h-4" /> 보상 모두 받기 (+{currentClaimables.reduce((a, c) => a + c.xp, 0)} XP)
        </button>
      )}

      {tab === 'daily' && (
        <div className="space-y-2">
          {daily.map(q => <QuestRow key={q.id} q={q} claimed={!!claimed[q.key]} onClaim={claim} />)}
          <p className="text-[10px] font-bold text-neutral-400 text-center pt-1">일일 퀘스트는 자정에 초기화됩니다 · {left.daily} 남음</p>
        </div>
      )}
      {tab === 'weekly' && (
        <div className="space-y-2">
          {weekly.quests.map(q => <QuestRow key={q.id} q={q} claimed={!!claimed[q.key]} onClaim={claim} />)}
          <p className="text-[10px] font-bold text-neutral-400 text-center pt-1">주간 퀘스트는 월요일 0시에 초기화됩니다 · {left.weekly} 남음</p>
        </div>
      )}
      {tab === 'ach' && (
        <div className="space-y-2">
          {achs.map(a => {
            const maxed = a.reached >= a.targets.length;
            const pending = a.tierKeys.filter((k, i) => i < a.reached && !claimed[k]);
            const isOpen = openAch === a.id;
            return (
              <div key={a.id} className={`rounded-2xl border bg-white transition-all ${pending.length ? 'border-amber-200 shadow-sm' : 'border-neutral-100'}`}>
                <button onClick={() => setOpenAch(isOpen ? null : a.id)} className="w-full flex items-center gap-3 p-3.5 text-left">
                  <Medal tier={Math.max(0, a.reached - 1)} icon={a.icon} locked={a.reached === 0} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-neutral-900">{a.title}</span>
                      <span className="text-[10px] font-black text-neutral-400">{a.reached ? TIER_STYLE[a.reached - 1].name : '미획득'}</span>
                      <div className="flex gap-0.5 ml-auto">{a.targets.map((_, i) => <span key={i} className="w-2 h-2 rounded-full" style={{ background: i < a.reached ? TIER_STYLE[i].ring : '#e5e7eb' }} />)}</div>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-400 mb-1.5">{maxed ? '모든 단계를 달성했어요!' : `다음: ${a.names[a.reached]} (${a.next.toLocaleString()}${a.unit})`}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><Bar pct={a.pct} color="from-amber-400 to-orange-500" /></div>
                      <span className="text-[10px] font-black text-neutral-500">{a.cur.toLocaleString()}{a.unit}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-300 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {pending.length > 0 && (
                  <div className="px-3.5 pb-3 -mt-1">
                    <button onClick={() => claim(pending.map(k => { const i = a.tierKeys.indexOf(k); return { key: k, xp: TIER_XP[i], label: `${a.title} · ${a.names[i]}` }; }))} className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-black shadow-md active:scale-95 transition-transform">
                      🎁 달성 보상 받기 (+{pending.reduce((s, k) => s + TIER_XP[a.tierKeys.indexOf(k)], 0)} XP)
                    </button>
                  </div>
                )}
                {isOpen && (
                  <div className="px-3.5 pb-3.5 grid grid-cols-5 gap-1.5 border-t border-neutral-50 pt-3">
                    {a.targets.map((t, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <Medal tier={i} icon={a.icon} locked={i >= a.reached} size={38} />
                        <span className={`text-[9px] font-black leading-tight mt-0.5 ${i < a.reached ? 'text-neutral-800' : 'text-neutral-400'}`}>{a.names[i]}</span>
                        <span className="text-[9px] font-bold text-neutral-400">{t >= 10000 ? `${t / 10000}만` : t.toLocaleString()}{a.unit}</span>
                        <span className={`text-[9px] font-black ${claimed[a.tierKeys[i]] ? 'text-emerald-500' : 'text-violet-500'}`}>{claimed[a.tierKeys[i]] ? '받음' : `+${TIER_XP[i]}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab === 'badges' && (
        <div className="bg-white border border-neutral-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-neutral-500">뱃지 컬렉션</span>
            <span className="text-xs font-black text-neutral-900">{badgesEarned} / {badgesTotal}</span>
          </div>
          <div className="space-y-3">
            {achs.map(a => (
              <div key={a.id}>
                <div className="text-[11px] font-black text-neutral-700 mb-1">{a.icon} {a.title}</div>
                <div className="grid grid-cols-5 gap-1">
                  {a.targets.map((_, i) => (
                    <div key={i} className="flex flex-col items-center relative">
                      <Medal tier={i} icon={a.icon} locked={i >= a.reached} size={40} />
                      {i >= a.reached && <Lock className="w-3 h-3 text-slate-400 absolute bottom-3 right-2" />}
                      <span className={`text-[9px] font-black ${i < a.reached ? 'text-neutral-700' : 'text-neutral-300'}`}>{TIER_STYLE[i].name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
