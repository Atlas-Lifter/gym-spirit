import React, { useEffect, useState } from 'react';
import { cleanAvatar } from './admin.js';
import { BossArt } from './BossArt.jsx';
import { FullBodyAvatar } from './realAvatar.jsx';

// 주간 레이드 전투 장면
// 요일을 고르면 그날 운동한 길드원 캐릭터가 보스 앞에서 덤벨을 던지며 싸운다. 아무도 안 했으면 보스만 여유롭게 서 있다.
// 피해 숫자는 그 길드원이 그날 길드에 기록한 볼륨 (실제 레이드 피해는 길드 이번 주 볼륨 합계)
// 보스는 죽지 않고 쓰러질 때마다 더 강해져 부활한다 (단계가 오를수록 오라가 커진다)

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
const CYCLE = 1.8; // 초: 한 번 공격하는 주기
const num = (v) => Math.round(Number(v) || 0).toLocaleString();

const SPOTS = [
  { left: 4, bottom: 12 }, { left: 46, bottom: 26 }, { left: 88, bottom: 10 }, { left: 26, bottom: 46 }, { left: 68, bottom: 52 },
];

export const RaidArena = ({ raid, members = [], meId, todayIdx, isThisWeek = true }) => {
  const [day, setDay] = useState(todayIdx);
  useEffect(() => { setDay(todayIdx); }, [todayIdx]);
  const fightersOf = (d) => members.filter(m => (m.week_days || []).includes(d + 1));
  const fighters = fightersOf(day);
  const shown = fighters.slice(0, SPOTS.length);
  const extra = fighters.length - shown.length;
  const { boss } = raid;
  const el = boss.element;
  const ko = false; // 보스는 쓰러져도 바로 부활한다
  const stage = raid.stage || 1;
  const dmgOf = (m) => {
    const log = (m.week_log || []).find(x => x.dow === day + 1);
    return log ? log.volume : Math.round((m.guild_volume ?? m.volume ?? 0) / Math.max(1, m.days || 1));
  };

  return (
    <div>
      <style>{`
        @keyframes ra-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        @keyframes ra-hit { 0%, 84%, 100% { transform: translateX(0) } 87% { transform: translateX(7px) } 90% { transform: translateX(-6px) } 93% { transform: translateX(3px) } }
        @keyframes ra-flash { 0%, 84%, 100% { filter: none } 88% { filter: brightness(1.9) saturate(1.4) } }
        @keyframes ra-lunge { 0%, 55%, 100% { transform: translateX(0) } 70% { transform: translateX(14px) rotate(5deg) } }
        @keyframes ra-shot { 0% { left: var(--from); bottom: var(--fromy); opacity: 0; transform: rotate(0) } 12% { opacity: 1 } 78% { left: calc(100% - 96px); bottom: 70px; opacity: 1; transform: rotate(600deg) } 84%, 100% { left: calc(100% - 96px); bottom: 70px; opacity: 0 } }
        @keyframes ra-pop { 0%, 78% { opacity: 0; transform: translateY(6px) scale(.8) } 84% { opacity: 1; transform: translateY(0) scale(1.15) } 100% { opacity: 0; transform: translateY(-26px) scale(1) } }
        @keyframes ra-burst { 0%, 80% { opacity: 0; transform: scale(.3) } 86% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1.5) } }
        @keyframes ra-cheer { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
        @keyframes ra-zz { 0% { opacity: 0; transform: translate(0,0) } 30% { opacity: 1 } 100% { opacity: 0; transform: translate(10px,-24px) } }
      `}</style>

      {/* 전투 무대 */}
      <div className="relative h-[230px] rounded-2xl overflow-hidden mt-3" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${el.bg[1]}cc 100%)` }}>
        {/* 원근 바닥 격자 */}
        <div className="absolute inset-x-[-40%] bottom-0 h-[55%] opacity-40" style={{ backgroundImage: `linear-gradient(${el.glow}55 1px, transparent 1px), linear-gradient(90deg, ${el.glow}55 1px, transparent 1px)`, backgroundSize: '26px 26px', transform: 'perspective(220px) rotateX(58deg)', transformOrigin: 'bottom' }} />

        {/* 보스 */}
        <div className="absolute right-[-6px] bottom-1" style={{ animation: ko ? 'none' : 'ra-bob 2.6s ease-in-out infinite' }}>
          <div style={{ animation: !ko && fighters.length ? `ra-hit ${CYCLE / Math.max(1, shown.length)}s linear infinite, ra-flash ${CYCLE / Math.max(1, shown.length)}s linear infinite` : 'none' }}>
            <div style={{ filter: stage > 1 ? `drop-shadow(0 0 ${Math.min(18, 4 + stage * 3)}px ${el.glow})` : 'none' }}>
              <BossArt kind={boss.kind.key} element={el} size={164} />
            </div>
          </div>
        </div>

        {/* 길드원 */}
        {shown.map((m, i) => {
          const spot = SPOTS[i];
          const delay = `${(i * CYCLE) / shown.length}s`;
          return (
            <React.Fragment key={m.id}>
              <div className="absolute flex flex-col items-center" style={{ left: spot.left, bottom: spot.bottom, zIndex: 10 - Math.floor(spot.bottom / 10), animation: ko ? `ra-cheer .9s ease-in-out ${delay} infinite` : `ra-lunge ${CYCLE}s ease-in-out ${delay} infinite` }}>
                <div className={`relative ${m.id === meId ? 'drop-shadow-[0_0_8px_rgba(52,211,153,.9)]' : 'drop-shadow-[0_4px_6px_rgba(0,0,0,.5)]'}`}>
                  <FullBodyAvatar profile={m.avatar && Object.keys(m.avatar).length ? cleanAvatar(m.id, m.avatar) : undefined} size="w-[46px] h-[92px]" pose="flex" />
                </div>
                <span className={`-mt-1 px-1.5 rounded-md text-[9px] font-black whitespace-nowrap max-w-[64px] truncate ${m.id === meId ? 'bg-emerald-400 text-neutral-950' : 'bg-black/60 text-white'}`}>{m.id === meId ? '나' : m.nickname}</span>
              </div>
              {!ko && (
                <>
                  {/* 날아가는 덤벨 */}
                  <span className="absolute text-[15px] pointer-events-none" style={{ '--from': `${spot.left + 34}px`, '--fromy': `${spot.bottom + 58}px`, animation: `ra-shot ${CYCLE}s ease-in ${delay} infinite`, zIndex: 20 }}>🏋️</span>
                  {/* 맞은 자리 */}
                  <span className="absolute w-10 h-10 rounded-full pointer-events-none" style={{ right: 70 - (i % 2) * 18, bottom: 76 + (i % 3) * 12, background: `radial-gradient(circle, #fff 0%, ${el.glow} 40%, transparent 70%)`, animation: `ra-burst ${CYCLE}s ease-out ${delay} infinite`, zIndex: 21 }} />
                  <span className="absolute text-[12px] font-black text-yellow-300 pointer-events-none whitespace-nowrap" style={{ right: 60 - (i % 2) * 16, bottom: 104 + (i % 3) * 14, textShadow: '0 1px 0 #000, 0 0 6px rgba(0,0,0,.8)', animation: `ra-pop ${CYCLE}s ease-out ${delay} infinite`, zIndex: 22 }}>-{num(dmgOf(m))}</span>
                </>
              )}
            </React.Fragment>
          );
        })}
        {extra > 0 && <span className="absolute left-2 top-2 text-[10px] font-black text-white bg-black/50 px-2 py-0.5 rounded-full">+{extra}명 함께 공격 중</span>}

        {/* 아무도 없을 때 */}
        {!fighters.length && !ko && (
          <>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 max-w-[150px]">
              <div className="text-xs font-black text-white/85">{day > todayIdx && isThisWeek ? '아직 오지 않은 날이에요' : '이날은 아무도 덤비지 않았어요'}</div>
              <div className="text-[10px] font-bold text-white/45 mt-1 leading-relaxed">운동을 저장하면 그날 내 캐릭터가 보스 앞에 나타나 싸워요</div>
            </div>
            {[0, 0.8, 1.6].map((d, i) => <span key={i} className="absolute text-sm font-black text-white/70" style={{ right: 52 + i * 8, top: 26 - i * 4, animation: `ra-zz 2.4s ease-out ${d}s infinite` }}>z</span>)}
          </>
        )}
        {/* 단계 표시 */}
        <span className="absolute right-3 top-3 text-[11px] font-black px-2 py-0.5 rounded-full text-neutral-950" style={{ background: el.glow, boxShadow: `0 0 12px ${el.glow}` }}>★ {stage}단계</span>
        {raid.kills > 0 && <div className="absolute left-3 top-3 max-w-[60%] text-[11px] font-black text-yellow-300 leading-snug">💀 {raid.kills}번 쓰러뜨렸지만<br />더 강해져 부활했어요!</div>}
      </div>

      {/* 요일 고르기 */}
      <div className="grid grid-cols-7 gap-1 mt-2">
        {DAY_NAMES.map((d, i) => {
          const n = fightersOf(i).length;
          const future = isThisWeek && i > todayIdx;
          return (
            <button key={d} disabled={future} onClick={() => setDay(i)}
              className={`rounded-xl py-1.5 flex flex-col items-center transition-all ${day === i ? 'bg-white text-neutral-900 shadow-[0_0_12px_rgba(255,255,255,.35)]' : future ? 'opacity-30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
              <span className="text-[10px] font-black">{d}{i === todayIdx && isThisWeek ? '·오늘' : ''}</span>
              <span className={`text-[9px] font-bold ${day === i ? 'text-emerald-600' : 'text-white/45'}`}>{n ? `⚔️ ${n}명` : '–'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
