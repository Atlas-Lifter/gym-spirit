import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, Plus, Target, Trash2, X, Sparkles, ChevronRight } from 'lucide-react';

// 바디 트랜스포메이션: 체중·골격근량·체지방률 기록을 시간에 따라 쌓아
// 그래프, 목표 진행률·도달 예상일, 변화 속도 점검, 자동 분석을 보여준다.

const todayKey = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]; };
const DAY = 86400000;
const t = (date) => new Date(date + 'T00:00:00').getTime();
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
const r1 = (v) => Math.round(v * 10) / 10;
const fmtDate = (d) => `${+d.slice(5, 7)}.${+d.slice(8, 10)}`;
const fmtFull = (d) => `${d.slice(0, 4)}년 ${+d.slice(5, 7)}월 ${+d.slice(8, 10)}일`;

const METRICS = {
  weight: { label: '체중', unit: 'kg', color: '#4768ff', good: 0 },
  muscle: { label: '골격근량', unit: 'kg', color: '#10b981', good: 1 },
  fat: { label: '체지방률', unit: '%', color: '#f97316', good: -1 },
  lbm: { label: '제지방량', unit: 'kg', color: '#8b5cf6', good: 1 },
};
const PERIODS = [['1M', 30], ['3M', 91], ['6M', 182], ['전체', 0]];

// 최소제곱 회귀: 하루당 변화량
const slopePerDay = (pts) => {
  if (pts.length < 2) return null;
  const xs = pts.map(p => p.x / DAY), ys = pts.map(p => p.y);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let nu = 0, de = 0;
  xs.forEach((x, i) => { nu += (x - mx) * (ys[i] - my); de += (x - mx) ** 2; });
  return de ? nu / de : null;
};

// 점들을 부드러운 곡선으로 (모노톤 큐빅: 값이 튀어 오르는 과장된 곡선 방지)
const smoothPath = (P) => {
  if (P.length < 2) return '';
  const n = P.length, dx = [], m = [], s = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1][0] - P[i][0]; s[i] = (P[i + 1][1] - P[i][1]) / (dx[i] || 1); }
  m[0] = s[0]; m[n - 1] = s[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2;
  let d = `M ${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C ${P[i][0] + h} ${P[i][1] + m[i] * h} ${P[i + 1][0] - h} ${P[i + 1][1] - m[i + 1] * h} ${P[i + 1][0]} ${P[i + 1][1]}`;
  }
  return d;
};

const Chart = ({ entries, metric, goalValue }) => {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const M = METRICS[metric];
  const pts = entries.map(e => ({ date: e.date, x: t(e.date), y: e[metric] })).filter(p => p.y !== null && p.y !== undefined);
  const W = 340, H = 196, L = 34, R = 12, T = 16, B = 26;
  if (pts.length === 0) return <div className="h-[196px] flex items-center justify-center text-xs font-bold text-neutral-400">이 항목의 기록이 아직 없어요</div>;
  const x0 = pts[0].x, x1 = Math.max(pts[pts.length - 1].x, x0 + DAY * 6);
  const ys = pts.map(p => p.y).concat(goalValue != null ? [goalValue] : []);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = Math.max((y1 - y0) * 0.18, metric === 'fat' ? 1 : 0.8);
  y0 -= pad; y1 += pad;
  const X = (x) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R);
  const Y = (y) => T + (1 - (y - y0) / (y1 - y0 || 1)) * (H - T - B);
  const P = pts.map(p => [r1(X(p.x)), r1(Y(p.y))]);
  const line = pts.length > 1 ? smoothPath(P) : '';
  const area = pts.length > 1 ? `${line} L ${P[P.length - 1][0]} ${H - B} L ${P[0][0]} ${H - B} Z` : '';
  const ticks = Array.from({ length: 4 }, (_, i) => y0 + ((y1 - y0) * (i + 0.5)) / 4);
  const slope = slopePerDay(pts);
  const trend = slope !== null && pts.length >= 3 ? (() => {
    const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const at = (x) => my + slope * ((x - mx) / DAY);
    return [[X(x0), Y(at(x0))], [X(x1), Y(at(x1))]];
  })() : null;
  const xLabels = pts.length <= 4 ? pts : [pts[0], pts[Math.floor(pts.length / 3)], pts[Math.floor((2 * pts.length) / 3)], pts[pts.length - 1]];

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    P.forEach((p, i) => { if (Math.abs(p[0] - vx) < Math.abs(P[best][0] - vx)) best = i; });
    setHover(best);
  };
  const hp = hover !== null ? P[hover] : null;
  const gid = `bt-${metric}`;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none select-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`${M.label} 변화 그래프`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={M.color} stopOpacity="0.28" />
          <stop offset="1" stopColor={M.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="#eef0f3" strokeWidth="1" />
          <text x={L - 6} y={Y(v) + 3} textAnchor="end" fontSize="9" fontWeight="700" fill="#a3a3a3">{r1(v)}</text>
        </g>
      ))}
      {goalValue != null && (
        <g>
          <line x1={L} x2={W - R} y1={Y(goalValue)} y2={Y(goalValue)} stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="4 3" />
          <rect x={W - R - 50} y={Y(goalValue) - 15} width="50" height="13" rx="4" fill="#fff1f2" />
          <text x={W - R - 25} y={Y(goalValue) - 5.5} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#e11d48">목표 {goalValue}{M.unit}</text>
        </g>
      )}
      {area && <path d={area} fill={`url(#${gid})`} />}
      {trend && <line x1={trend[0][0]} y1={trend[0][1]} x2={trend[1][0]} y2={trend[1][1]} stroke={M.color} strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="2 3" />}
      {line && <path d={line} fill="none" stroke={M.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
      {P.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === P.length - 1 ? 4.4 : 3} fill="#ffffff" stroke={M.color} strokeWidth="2" />)}
      {xLabels.map((p, i) => <text key={i} x={X(p.x)} y={H - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#a3a3a3">{fmtDate(p.date)}</text>)}
      {hp && (
        <g pointerEvents="none">
          <line x1={hp[0]} x2={hp[0]} y1={T} y2={H - B} stroke="#cbd5e1" strokeWidth="1" />
          <circle cx={hp[0]} cy={hp[1]} r="6" fill={M.color} fillOpacity="0.2" />
          {(() => {
            const bx = Math.min(Math.max(hp[0] - 42, L), W - R - 84);
            const by = hp[1] - 40 < T ? hp[1] + 10 : hp[1] - 40;
            return (
              <g>
                <rect x={bx} y={by} width="84" height="30" rx="8" fill="#171717" />
                <text x={bx + 42} y={by + 12} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#a3a3a3">{fmtDate(pts[hover].date)}</text>
                <text x={bx + 42} y={by + 24} textAnchor="middle" fontSize="11" fontWeight="900" fill="#ffffff">{pts[hover].y}{M.unit}</text>
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
};

const Delta = ({ v, unit, good }) => {
  if (v === null || v === undefined || Math.abs(v) < 0.05) return <span className="text-[10px] font-black text-neutral-400">변화 없음</span>;
  const better = good === 0 ? null : (good > 0 ? v > 0 : v < 0);
  const color = better === null ? 'text-neutral-500' : better ? 'text-emerald-600' : 'text-rose-500';
  return <span className={`text-[10px] font-black ${color}`}>{v > 0 ? '▲' : '▼'} {Math.abs(r1(v))}{unit}</span>;
};

export const BodyTransform = ({ history = [], goal = {}, gender = 'male', onSaveEntry, onDeleteEntry, onSaveGoal, currentStats }) => {
  const [metric, setMetric] = useState('weight');
  const [period, setPeriod] = useState('전체');
  const [form, setForm] = useState(null);       // 기록 추가
  const [goalForm, setGoalForm] = useState(null); // 목표 설정
  const [showAll, setShowAll] = useState(false);

  const entries = useMemo(() => [...history].map(e => {
    const w = num(e.weight), f = num(e.fat);
    return { date: e.date, weight: w, muscle: num(e.muscle), fat: f, lbm: w !== null && f !== null ? r1(w * (1 - f / 100)) : null };
  }).sort((a, b) => a.date.localeCompare(b.date)), [history]);

  const days = PERIODS.find(p => p[0] === period)[1];
  const shown = days ? entries.filter(e => t(e.date) >= Date.now() - days * DAY) : entries;
  const first = entries[0], last = entries[entries.length - 1];
  const height = num(goal.height);

  // 최근 28일(기록이 적으면 전체) 추세
  const recent = entries.filter(e => t(e.date) >= (last ? t(last.date) : 0) - 28 * DAY);
  const series = (key, list = recent) => list.filter(e => e[key] !== null).map(e => ({ x: t(e.date), y: e[key] }));
  const wSlope = slopePerDay(series('weight', recent.length >= 2 ? recent : entries));
  const change = (key, a = first, b = last) => (a && b && a[key] !== null && b[key] !== null ? b[key] - a[key] : null);

  // 목표
  const targetW = num(goal.targetWeight), targetF = num(goal.targetFat);
  const mode = targetW !== null && last?.weight !== null && last ? (targetW < last.weight - 0.3 ? 'cut' : targetW > last.weight + 0.3 ? 'bulk' : 'keep') : null;
  const progressOf = (key, target) => {
    if (target === null || !first || !last || first[key] === null || last[key] === null) return null;
    const total = target - first[key], done = last[key] - first[key];
    if (Math.abs(total) < 0.05) return 100;
    return Math.max(0, Math.min(100, (done / total) * 100));
  };
  const eta = (() => {
    if (targetW === null || !last || last.weight === null || !wSlope || Math.abs(wSlope) < 0.002) return null;
    const remain = targetW - last.weight;
    if (Math.sign(remain) !== Math.sign(wSlope)) return { wrong: true };
    const d = new Date(t(last.date) + (remain / wSlope) * DAY);
    return { date: new Date(d - d.getTimezoneOffset() * 60000).toISOString().split('T')[0], days: Math.round(remain / wSlope) };
  })();
  const weeklyPct = wSlope !== null && last?.weight ? (wSlope * 7 / last.weight) * 100 : null;
  const pace = (() => {
    if (weeklyPct === null || !mode || mode === 'keep') return null;
    const p = weeklyPct;
    if (mode === 'cut') {
      if (p > -0.2) return { tone: 'slow', text: `주당 ${r1(Math.abs(p))}% 감량 중이에요. 권장 속도(0.5~1%)보다 느려요. 하루 150~250kcal를 더 줄여 보세요.` };
      if (p < -1.1) return { tone: 'fast', text: `주당 ${r1(Math.abs(p))}% 감량은 너무 빨라요. 근손실 위험이 커지니 섭취를 조금 늘리세요(권장 0.5~1%).` };
      return { tone: 'good', text: `주당 ${r1(Math.abs(p))}% 감량 — 근육을 지키면서 빼는 이상적인 속도예요.` };
    }
    if (p < 0.1) return { tone: 'slow', text: `증량 속도가 느려요(주당 ${r1(p)}%). 하루 200kcal 정도 더 드세요.` };
    if (p > 0.75) return { tone: 'fast', text: `주당 ${r1(p)}% 증량은 지방이 붙기 쉬운 속도예요. 권장은 0.25~0.5%예요.` };
    return { tone: 'good', text: `주당 ${r1(p)}% 증량 — 근육 위주로 늘리기 좋은 속도예요.` };
  })();

  // 자동 분석
  const insights = (() => {
    const out = [];
    if (entries.length < 2) return out;
    const base = recent.length >= 2 ? recent[0] : first;
    const dw = change('weight', base), dm = change('muscle', base), df = change('fat', base);
    const span = Math.round((t(last.date) - t(base.date)) / DAY);
    const span2 = span ? `최근 ${span}일` : '최근';
    if (dm !== null && df !== null && dm >= 0.2 && df <= -0.3) out.push({ tone: 'good', icon: '🏆', text: `${span2} 골격근 +${r1(dm)}kg, 체지방 ${r1(df)}%p — 근육은 늘고 지방은 빠지는 리컴포지션이 진행 중이에요.` });
    if (dw !== null && dm !== null && dw < -0.3 && dm <= -0.3) out.push({ tone: 'warn', icon: '⚠️', text: `체중과 함께 골격근도 ${r1(dm)}kg 줄었어요. 단백질을 체중×2g까지 늘리고 고중량 훈련을 유지하세요.` });
    if (dw !== null && df !== null && dw > 0.3 && df >= 0.8) out.push({ tone: 'warn', icon: '🍔', text: `증량하면서 체지방률이 ${r1(df)}%p 올랐어요. 하루 섭취를 150~200kcal 줄이면 지방 증가를 늦출 수 있어요.` });
    if (dw !== null && Math.abs(dw) < 0.3 && span >= 14 && mode && mode !== 'keep') out.push({ tone: 'info', icon: '⏸️', text: `${span}일 동안 체중 변화가 ${r1(Math.abs(dw))}kg로 거의 없어요(정체기). 칼로리를 ±150kcal 조정하거나 유산소를 주 1~2회 더해 보세요.` });
    if (!out.length && dw !== null) out.push({ tone: 'info', icon: '📊', text: `${span2} 체중 ${dw >= 0 ? '+' : ''}${r1(dw)}kg${dm !== null ? `, 골격근 ${dm >= 0 ? '+' : ''}${r1(dm)}kg` : ''}${df !== null ? `, 체지방 ${df >= 0 ? '+' : ''}${r1(df)}%p` : ''} 변화했어요.` });
    return out;
  })();

  // 체성분 지표
  const lbm = last?.lbm ?? null;
  const fatMass = last && last.weight !== null && last.fat !== null ? r1(last.weight * last.fat / 100) : null;
  const ffmi = lbm !== null && height ? r1(lbm / (height / 100) ** 2 + 6.1 * (1.8 - height / 100)) : null;
  const ffmiLabel = ffmi === null ? null : gender === 'female'
    ? (ffmi < 14 ? '평균 이하' : ffmi < 16 ? '평균' : ffmi < 18 ? '우수' : ffmi < 20 ? '매우 우수' : '최상위')
    : (ffmi < 18 ? '평균 이하' : ffmi < 20 ? '평균' : ffmi < 22 ? '우수' : ffmi < 25 ? '매우 우수' : '자연 한계 근처');
  const bmi = last?.weight && height ? r1(last.weight / (height / 100) ** 2) : null;

  const goalValue = metric === 'weight' ? targetW : metric === 'fat' ? targetF : null;

  const openForm = () => setForm({ date: todayKey(), weight: last?.weight ?? currentStats?.weight ?? '', muscle: last?.muscle ?? currentStats?.muscle ?? '', fat: last?.fat ?? currentStats?.fat ?? '' });
  const submitForm = () => {
    if (!form) return;
    if (num(form.weight) === null && num(form.muscle) === null && num(form.fat) === null) return;
    onSaveEntry({ date: form.date || todayKey(), weight: form.weight === '' ? '' : String(form.weight), muscle: form.muscle === '' ? '' : String(form.muscle), fat: form.fat === '' ? '' : String(form.fat) });
    setForm(null);
  };

  const list = [...entries].reverse();
  const card = 'bg-white border border-neutral-100 rounded-[22px] shadow-sm';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-[#4768ff]" /> 바디 트랜스포메이션</h3>
        <button onClick={openForm} className="text-[11px] font-black text-white bg-[#4768ff] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-transform"><Plus className="w-3.5 h-3.5" /> 오늘 기록</button>
      </div>

      {entries.length === 0 ? (
        <div className={`${card} p-6 text-center`}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-50 to-violet-100 flex items-center justify-center text-2xl mb-3">📈</div>
          <p className="text-sm font-black text-neutral-900 mb-1">몸의 변화를 그래프로 확인하세요</p>
          <p className="text-xs font-bold text-neutral-500 leading-relaxed mb-4">체중·골격근량·체지방률을 기록하면 변화 추세, 목표 도달 예상일, 감량·증량 속도 점검과 자동 분석을 보여 드려요. 인바디를 잰 날마다 남겨 보세요.</p>
          <button onClick={openForm} className="px-5 py-3 rounded-xl bg-[#4768ff] text-white text-sm font-black shadow-[0_8px_20px_rgba(71,104,255,0.3)] active:scale-95 transition-transform">{currentStats?.weight ? '현재 신체 정보로 시작하기' : '첫 기록 남기기'}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 요약 지표 */}
          <div className="grid grid-cols-3 gap-2">
            {['weight', 'muscle', 'fat'].map(k => (
              <button key={k} onClick={() => setMetric(k)} className={`${card} p-3 text-left transition-all ${metric === k ? 'ring-2 ring-offset-1' : ''}`} style={metric === k ? { '--tw-ring-color': METRICS[k].color } : undefined}>
                <div className="text-[10px] font-black text-neutral-400">{METRICS[k].label}</div>
                <div className="text-lg font-black text-neutral-900 leading-tight">{last[k] ?? '-'}<span className="text-[10px] text-neutral-400 ml-0.5">{METRICS[k].unit}</span></div>
                <Delta v={change(k)} unit={METRICS[k].unit === '%' ? '%p' : METRICS[k].unit} good={METRICS[k].good} />
              </button>
            ))}
          </div>

          {/* 그래프 */}
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                {Object.entries(METRICS).map(([k, m]) => (
                  <button key={k} onClick={() => setMetric(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap transition-all ${metric === k ? 'text-white shadow-sm' : 'text-neutral-500 bg-neutral-100'}`} style={metric === k ? { background: m.color } : undefined}>{m.label}</button>
                ))}
              </div>
              <div className="flex bg-neutral-100 rounded-lg p-0.5 flex-shrink-0">
                {PERIODS.map(([p]) => <button key={p} onClick={() => setPeriod(p)} className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${period === p ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}>{p}</button>)}
              </div>
            </div>
            <Chart entries={shown} metric={metric} goalValue={goalValue} />
            <p className="text-[10px] font-bold text-neutral-400 text-center">점을 누르거나 끌어서 날짜별 값을 확인하세요 · 점선은 추세선</p>
          </div>

          {/* 목표 */}
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-neutral-900 flex items-center gap-1"><Target className="w-3.5 h-3.5 text-rose-500" /> 나의 목표</span>
              <button onClick={() => setGoalForm({ height: goal.height || '', targetWeight: goal.targetWeight || '', targetFat: goal.targetFat || '', targetDate: goal.targetDate || '' })} className="text-[11px] font-black text-[#4768ff] flex items-center">{targetW !== null || targetF !== null ? '수정' : '목표 설정'}<ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            {targetW === null && targetF === null ? (
              <p className="text-xs font-bold text-neutral-500 leading-relaxed">목표 체중이나 체지방률을 정하면 진행률과 도달 예상일, 변화 속도가 적절한지 알려 드려요.</p>
            ) : (
              <div className="space-y-3">
                {targetW !== null && (
                  <div>
                    <div className="flex justify-between text-[11px] font-black mb-1"><span className="text-neutral-600">체중 {first.weight}kg → {targetW}kg</span><span className="text-[#4768ff]">{Math.round(progressOf('weight', targetW) ?? 0)}%</span></div>
                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#4768ff] to-[#8b5cf6] transition-all duration-700" style={{ width: `${Math.max(3, progressOf('weight', targetW) ?? 0)}%` }} /></div>
                    <div className="text-[10px] font-bold text-neutral-400 mt-1">남은 변화 {last.weight !== null ? `${r1(targetW - last.weight) > 0 ? '+' : ''}${r1(targetW - last.weight)}kg` : '-'}</div>
                  </div>
                )}
                {targetF !== null && (
                  <div>
                    <div className="flex justify-between text-[11px] font-black mb-1"><span className="text-neutral-600">체지방률 {first.fat ?? '-'}% → {targetF}%</span><span className="text-orange-500">{Math.round(progressOf('fat', targetF) ?? 0)}%</span></div>
                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-700" style={{ width: `${Math.max(3, progressOf('fat', targetF) ?? 0)}%` }} /></div>
                  </div>
                )}
                {eta && (
                  <div className={`rounded-xl p-3 text-xs font-bold leading-relaxed ${eta.wrong ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-[#3550d6]'}`}>
                    {eta.wrong
                      ? '최근 추세가 목표와 반대 방향이에요. 식단과 훈련량을 점검해 보세요.'
                      : <>지금 속도라면 <b className="font-black">{fmtFull(eta.date)}</b>쯤 목표 체중에 도달해요 (약 {eta.days}일).{goal.targetDate ? (eta.date <= goal.targetDate ? ' 목표일보다 빨라요 👍' : ` 목표일(${fmtFull(goal.targetDate)})보다 늦어요.`) : ''}</>}
                  </div>
                )}
                {pace && <div className={`rounded-xl p-3 text-xs font-bold leading-relaxed ${pace.tone === 'good' ? 'bg-emerald-50 text-emerald-700' : pace.tone === 'fast' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>{pace.text}</div>}
              </div>
            )}
          </div>

          {/* 자동 분석 + 체성분 지표 */}
          {(insights.length > 0 || lbm !== null) && (
            <div className="rounded-[22px] p-4 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white shadow-lg">
              <div className="text-xs font-black text-white/70 mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-300" /> 변화 분석</div>
              <div className="space-y-2 mb-3">
                {insights.map((it, i) => <div key={i} className={`text-xs font-bold leading-relaxed rounded-xl p-3 ${it.tone === 'good' ? 'bg-emerald-400/15 text-emerald-100' : it.tone === 'warn' ? 'bg-rose-400/15 text-rose-100' : 'bg-white/10 text-white/85'}`}>{it.icon} {it.text}</div>)}
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[['제지방량', lbm, 'kg'], ['체지방량', fatMass, 'kg'], ['FFMI', ffmi, ''], ['BMI', bmi, '']].map(([k, v, u]) => (
                  <div key={k} className="bg-white/10 rounded-xl py-2">
                    <div className="text-sm font-black">{v ?? '-'}<span className="text-[9px] text-white/50">{v !== null ? u : ''}</span></div>
                    <div className="text-[9px] font-bold text-white/50">{k}</div>
                  </div>
                ))}
              </div>
              {ffmi !== null
                ? <p className="text-[10px] font-bold text-white/60 mt-2">FFMI {ffmi} · {ffmiLabel} (키 대비 근육량 지표, 체지방률 기록 기준)</p>
                : <p className="text-[10px] font-bold text-white/50 mt-2">목표 설정에서 키를 입력하면 FFMI·BMI를 계산해 드려요.</p>}
            </div>
          )}

          {/* 기록 목록 */}
          <div className={`${card} p-4`}>
            <div className="text-xs font-black text-neutral-900 mb-2">기록 ({entries.length})</div>
            <div className="divide-y divide-neutral-50">
              {(showAll ? list : list.slice(0, 5)).map((e) => {
                const prev = list[list.indexOf(e) + 1];
                return (
                  <div key={e.date} className="flex items-center gap-2 py-2.5">
                    <div className="w-14 flex-shrink-0"><div className="text-xs font-black text-neutral-900">{fmtDate(e.date)}</div><div className="text-[9px] font-bold text-neutral-400">{e.date.slice(0, 4)}</div></div>
                    {['weight', 'muscle', 'fat'].map(k => (
                      <div key={k} className="flex-1 min-w-0">
                        <div className="text-xs font-black text-neutral-800">{e[k] ?? '-'}<span className="text-[9px] text-neutral-400">{e[k] !== null ? METRICS[k].unit : ''}</span></div>
                        {prev && e[k] !== null && prev[k] !== null ? <Delta v={e[k] - prev[k]} unit={METRICS[k].unit === '%' ? '%p' : METRICS[k].unit} good={METRICS[k].good} /> : <span className="text-[9px] text-neutral-300 font-bold">{METRICS[k].label}</span>}
                      </div>
                    ))}
                    <button onClick={() => onDeleteEntry(e.date)} aria-label={`${e.date} 기록 삭제`} className="p-1.5 text-neutral-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
            {list.length > 5 && <button onClick={() => setShowAll(v => !v)} className="w-full text-[11px] font-black text-neutral-500 pt-2">{showAll ? '접기' : `전체 ${list.length}개 보기`}</button>}
          </div>
        </div>
      )}

      {/* 기록 추가 시트 (프로필의 애니메이션 컨테이너 밖에 띄운다) */}
      {form && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end backdrop-blur-sm animate-fade-in" onClick={() => setForm(null)}>
          <div className="bg-white rounded-t-[36px] p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black">체성분 기록</h3>
              <button onClick={() => setForm(null)} aria-label="닫기" className="p-2 bg-neutral-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <label className="block mb-3">
              <span className="text-xs font-black text-neutral-500">측정일</span>
              <input type="date" value={form.date} max={todayKey()} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1 w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 font-black text-sm" />
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {['weight', 'muscle', 'fat'].map(k => (
                <label key={k} className="bg-neutral-50 border border-neutral-100 rounded-xl p-3">
                  <span className="text-[10px] font-black text-neutral-500">{METRICS[k].label} ({METRICS[k].unit})</span>
                  <input type="number" inputMode="decimal" step="0.1" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="w-full bg-transparent font-black text-xl outline-none mt-1" placeholder="-" />
                </label>
              ))}
            </div>
            <p className="text-[11px] font-bold text-neutral-400 mb-4">같은 날짜에 다시 저장하면 그날 기록을 덮어씁니다. 가장 최근 기록은 프로필 신체 정보에도 반영돼요.</p>
            <button onClick={submitForm} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] active:scale-95 transition-transform">저장하기</button>
          </div>
        </div>, document.body
      )}

      {/* 목표 설정 시트 */}
      {goalForm && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end backdrop-blur-sm animate-fade-in" onClick={() => setGoalForm(null)}>
          <div className="bg-white rounded-t-[36px] p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black">목표 설정</h3>
              <button onClick={() => setGoalForm(null)} aria-label="닫기" className="p-2 bg-neutral-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[['height', '키 (cm)'], ['targetWeight', '목표 체중 (kg)'], ['targetFat', '목표 체지방률 (%)']].map(([k, l]) => (
                <label key={k} className="bg-neutral-50 border border-neutral-100 rounded-xl p-3">
                  <span className="text-[10px] font-black text-neutral-500">{l}</span>
                  <input type="number" inputMode="decimal" step="0.1" value={goalForm[k]} onChange={e => setGoalForm({ ...goalForm, [k]: e.target.value })} className="w-full bg-transparent font-black text-xl outline-none mt-1" placeholder="-" />
                </label>
              ))}
              <label className="bg-neutral-50 border border-neutral-100 rounded-xl p-3">
                <span className="text-[10px] font-black text-neutral-500">목표일 (선택)</span>
                <input type="date" value={goalForm.targetDate} min={todayKey()} onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })} className="w-full bg-transparent font-black text-sm outline-none mt-2" />
              </label>
            </div>
            <p className="text-[11px] font-bold text-neutral-400 mb-4 leading-relaxed">권장 속도: 감량은 주당 체중의 0.5~1%, 증량은 0.25~0.5%예요. 너무 빠르면 근손실이나 지방 증가가 커집니다.</p>
            <button onClick={() => { onSaveGoal(goalForm); setGoalForm(null); }} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] active:scale-95 transition-transform">저장하기</button>
          </div>
        </div>, document.body
      )}
    </div>
  );
};
