import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Search, X } from 'lucide-react';
import { KFOOD_SOURCE, iconOf, kfoodToFood, loadKfood, searchKfood } from '../lib/kfood.js';

// 식약처·농진청 영양 DB 둘러보기 — 큰 묶음 → 작은 묶음·브랜드 → 정렬 → 목록
// 고르면 onPick(음식) 으로 식단 화면의 중량 입력으로 넘긴다

const GROUPS = [
  { id: 'all', label: '전체', emoji: '🇰🇷', tile: 'from-[#4768ff] to-indigo-500', soft: 'bg-blue-50', tx: 'text-[#4768ff]' },
  { id: 'meal', label: '한식·요리', emoji: '🍲', tile: 'from-orange-400 to-rose-500', soft: 'bg-orange-50', tx: 'text-orange-600' },
  { id: 'fast', label: '피자·버거·치킨', emoji: '🍔', tile: 'from-amber-400 to-orange-500', soft: 'bg-amber-50', tx: 'text-amber-600' },
  { id: 'drink', label: '커피·음료', emoji: '☕', tile: 'from-sky-400 to-cyan-500', soft: 'bg-sky-50', tx: 'text-sky-600' },
  { id: 'bakery', label: '빵·디저트', emoji: '🍰', tile: 'from-pink-400 to-fuchsia-500', soft: 'bg-pink-50', tx: 'text-pink-600' },
  { id: 'raw', label: '식재료', emoji: '🥦', tile: 'from-emerald-400 to-teal-500', soft: 'bg-emerald-50', tx: 'text-emerald-600' },
];
const GROUP = Object.fromEntries(GROUPS.map(g => [g.id, g]));

const SORTS = [
  { id: 'best', label: '추천순' },
  { id: 'protein', label: '단백질 많은 순' },
  { id: 'ratio', label: '💪 단백질 비율' },
  { id: 'light', label: '칼로리 낮은 순' },
];

const PAGE = 40;
const LIGHT_FIRST = new Set(['drink', 'bakery']);
const hasMacros = (r) => r.carbs != null && r.fat != null;
const proteinRatio = (r) => (r.kcal > 0 ? (r.protein * 4) / r.kcal : 0);

// 칼로리 중 탄·단·지 비율 막대
const MacroBar = ({ r }) => {
  if (!hasMacros(r)) return <div className="text-[9px] font-bold text-neutral-400">탄수화물·지방 정보 없음 · 단백질 {r.protein}g</div>;
  const p = r.protein * 4, c = r.carbs * 4, f = r.fat * 9, sum = p + c + f || 1;
  return (
    <div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-neutral-100 w-full">
        <div className="bg-amber-400" style={{ width: `${(c / sum) * 100}%` }} />
        <div className="bg-[#4768ff]" style={{ width: `${(p / sum) * 100}%` }} />
        <div className="bg-rose-400" style={{ width: `${(f / sum) * 100}%` }} />
      </div>
      <div className="flex gap-2 mt-1 text-[9px] font-black">
        <span className="text-amber-500">탄 {r.carbs}g</span><span className="text-[#4768ff]">단 {r.protein}g</span><span className="text-rose-500">지 {r.fat}g</span>
      </div>
    </div>
  );
};

export function KfoodBrowser({ initialQuery = '', onPick, onBack }) {
  const [rows, setRows] = useState(null);
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState(initialQuery);
  const [group, setGroup] = useState('all');
  const [sub, setSub] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('best');
  const [shown, setShown] = useState(PAGE);
  const q = useDeferredValue(query.trim());

  const load = () => { setState('loading'); loadKfood().then(r => { setRows(r); setState('ready'); }).catch(() => setState('error')); };
  useEffect(load, []);
  useEffect(() => { setShown(PAGE); }, [q, group, sub, brand, sort]);
  const pickGroup = (id) => { setGroup(id); setSub(''); setBrand(''); };

  const counts = useMemo(() => {
    const c = { all: rows?.length || 0 };
    (rows || []).forEach(r => { c[r.grp] = (c[r.grp] || 0) + 1; });
    return c;
  }, [rows]);

  const inGroup = useMemo(() => (rows || []).filter(r => group === 'all' || r.grp === group), [rows, group]);

  // 이 묶음에서 많이 나오는 작은 묶음·브랜드
  const { subs, brands } = useMemo(() => {
    if (group === 'all') return { subs: [], brands: [] };
    const sc = {}, bc = {};
    inGroup.forEach(r => {
      if (r.sub) sc[r.sub] = (sc[r.sub] || 0) + 1;
      if (r.brand && (!sub || r.sub === sub)) bc[r.brand] = (bc[r.brand] || 0) + 1;
    });
    const top = (o, n) => Object.entries(o).filter(([k]) => k !== '기타').sort((a, b) => b[1] - a[1]).slice(0, n);
    return { subs: [...top(sc, 14), ...(sc['기타'] ? [['기타', sc['기타']]] : [])], brands: top(bc, 16) };
  }, [inGroup, group, sub]);

  const list = useMemo(() => {
    let xs = inGroup.filter(r => (!sub || r.sub === sub) && (!brand || r.brand === brand));
    if (q) xs = searchKfood(xs, q, 100000);
    if (sort === 'protein') xs = [...xs].sort((a, b) => b.protein - a.protein);
    else if (sort === 'ratio') xs = xs.filter(r => r.protein >= 5).sort((a, b) => proteinRatio(b) - proteinRatio(a));
    else if (sort === 'light') xs = [...xs].sort((a, b) => a.kcal - b.kcal);
    // 검색어 없을 때 추천 (운동하는 사람 기준): 영양 정보가 다 있는 것 먼저,
    // 음료·디저트는 칼로리 낮은 것, 나머지는 단백질 비율 높은 것 (단백질 5g 이상 먼저)
    else if (!q && LIGHT_FIRST.has(group)) xs = [...xs].sort((a, b) => (hasMacros(b) - hasMacros(a)) || a.kcal - b.kcal);
    else if (!q) xs = [...xs].sort((a, b) => (hasMacros(b) - hasMacros(a)) || ((b.protein >= 5) - (a.protein >= 5)) || proteinRatio(b) - proteinRatio(a));
    return xs;
  }, [inGroup, group, sub, brand, q, sort]);

  const g = GROUP[group];
  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50">
      {/* 머리 */}
      <div className={`bg-gradient-to-br ${g.tile} text-white px-5 pt-4 pb-5`}>
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] font-black text-white/80 hover:text-white -ml-1 mb-3"><ChevronLeft className="w-4 h-4" />식재료 검색으로</button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black text-white/70 tracking-wide">공공데이터 · 식품의약품안전처</div>
            <h2 className="text-2xl font-black leading-tight mt-0.5">영양 정보 둘러보기</h2>
            <p className="text-[12px] font-bold text-white/80 mt-1">음식·프랜차이즈 메뉴·식재료 {counts.all ? counts.all.toLocaleString() : '1.9만'}개</p>
          </div>
          <div className="text-5xl drop-shadow-sm select-none">{g.emoji}</div>
        </div>
        <div className="mt-4 bg-white rounded-2xl px-3 py-2.5 flex items-center gap-2 shadow-lg shadow-black/10">
          <Search className="w-4 h-4 text-neutral-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="메뉴·브랜드 검색 (예: 제육, 스타벅스, 닭가슴살)" className="flex-1 bg-transparent outline-none text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
          {query && <button onClick={() => setQuery('')} className="p-0.5 text-neutral-400"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 큰 묶음 타일 */}
        <div className="grid grid-cols-3 gap-2">
          {GROUPS.map(x => (
            <button key={x.id} onClick={() => pickGroup(x.id)} className={`relative rounded-2xl p-2.5 text-left transition-all active:scale-95 border ${group === x.id ? `bg-gradient-to-br ${x.tile} text-white border-transparent shadow-md` : 'bg-white text-neutral-800 border-neutral-100'}`}>
              <div className="text-2xl leading-none">{x.emoji}</div>
              <div className="text-[12px] font-black mt-1.5 leading-tight">{x.label}</div>
              <div className={`text-[10px] font-bold ${group === x.id ? 'text-white/80' : 'text-neutral-400'}`}>{counts[x.id] ? `${counts[x.id].toLocaleString()}개` : '…'}</div>
            </button>
          ))}
        </div>

        {/* 작은 묶음 · 브랜드 */}
        {subs.length > 0 && (
          <div>
            <div className="text-[11px] font-black text-neutral-500 mb-1.5 px-0.5">종류</div>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
              {[['', inGroup.length], ...subs].map(([k, n]) => (
                <button key={k || 'all'} onClick={() => { setSub(k); setBrand(''); }} className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition-all ${sub === k ? `${g.soft} ${g.tx} border-current` : 'bg-white text-neutral-600 border-neutral-200'}`}>
                  {k || '전체'} <span className="opacity-60">{n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {brands.length > 0 && (
          <div>
            <div className="text-[11px] font-black text-neutral-500 mb-1.5 px-0.5">브랜드</div>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
              {brands.map(([k, n]) => (
                <button key={k} onClick={() => setBrand(brand === k ? '' : k)} className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap border transition-all ${brand === k ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200'}`}>
                  {k} <span className="opacity-50">{n}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 정렬 */}
        <div className="space-y-2">
          <div className="text-[12px] font-black text-neutral-800 whitespace-nowrap">{state === 'ready' ? `${list.length.toLocaleString()}개` : ''}{brand && <span className="text-neutral-400"> · {brand}</span>}</div>
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {SORTS.map(s => (
              <button key={s.id} onClick={() => setSort(s.id)} className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ${sort === s.id ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-500 border border-neutral-200'}`}>{s.label}</button>
            ))}
          </div>
        </div>
        {sort === 'best' && !query.trim() && <div className="text-[10px] font-bold text-neutral-400 -mt-2 px-0.5">{LIGHT_FIRST.has(group) ? '칼로리 낮은 것부터 보여 줘요' : '운동하는 분께 맞게 단백질 비율이 높은 것부터 보여 줘요'}</div>}
        {sort === 'ratio' && <div className="text-[10px] font-bold text-neutral-400 -mt-2 px-0.5">칼로리 중 단백질이 차지하는 비율이 높은 순 (단백질 5g 이상)</div>}

        {/* 목록 */}
        {state === 'loading' && (
          <div className="space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-[76px] rounded-2xl bg-white border border-neutral-100 animate-pulse" />)}</div>
        )}
        {state === 'error' && <button onClick={load} className="w-full py-8 text-sm font-black text-rose-500">영양 정보를 못 불러왔어요. 눌러서 다시 시도</button>}
        {state === 'ready' && list.length === 0 && <div className="text-center py-10 text-sm font-bold text-neutral-400">찾는 음식이 없어요.<br />띄어쓰기 없이 짧게(예: 제육, 라떼) 찾아보거나 묶음을 바꿔 보세요.</div>}
        <div className="space-y-2">
          {list.slice(0, shown).map((r, i) => {
            const rg = GROUP[r.grp] || g;
            return (
              <button key={`${r.name}|${r.brand}|${r.unit}|${i}`} onClick={() => onPick(kfoodToFood(r))} className="w-full text-left flex items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-100 hover:border-[#4768ff] hover:shadow-md transition-all active:scale-[0.98]">
                <div className={`w-12 h-12 rounded-xl ${rg.soft} flex items-center justify-center flex-shrink-0 text-2xl`}>{iconOf(r)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-black text-neutral-900 text-[14px] truncate">{r.name}</h3>
                  </div>
                  <div className="text-[10px] font-bold text-neutral-400 truncate mb-1">
                    {r.brand && <span className={`${rg.tx} font-black`}>{r.brand} · </span>}{r.sub || r.cat}{r.serving ? ` · 1회 ${r.serving}${r.unit}` : ''}
                  </div>
                  <MacroBar r={r} />
                </div>
                <div className="text-right flex-shrink-0 pl-1">
                  <div className="text-lg font-black text-neutral-900 leading-none">{r.kcal}</div>
                  <div className="text-[9px] font-bold text-neutral-400">kcal/100{r.unit}</div>
                  {r.serving ? <div className="text-[9px] font-black text-neutral-500 mt-1">1회 {Math.round(r.kcal * r.serving / 100)}kcal</div> : null}
                </div>
              </button>
            );
          })}
        </div>
        {list.length > shown && (
          <button onClick={() => setShown(shown + PAGE)} className="w-full py-3 rounded-xl bg-white border border-neutral-200 text-sm font-black text-neutral-600 active:scale-95 transition-all">더 보기 ({(list.length - shown).toLocaleString()}개 남음)</button>
        )}
        <p className="text-[9px] font-bold text-neutral-300 text-center leading-relaxed pt-2">출처: {KFOOD_SOURCE} (공공데이터포털, 이용허락범위 제한 없음)<br />영양 정보는 100g(음료는 100ml) 기준이에요.</p>
      </div>
    </div>
  );
}
