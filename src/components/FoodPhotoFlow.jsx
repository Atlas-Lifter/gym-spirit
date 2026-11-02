import React, { useEffect, useState } from 'react';
import { Camera, Check, Minus, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { supabase } from '../cloud.js';
import { loadKfood } from '../lib/kfood.js';
import { photoCandidates } from '../lib/foodMatch.js';
import { FoodImage } from './FoodImage.jsx';

// 음식 사진 → (서버 /api/food-photo 가 이름·무게 추정) → 앱 음식·식약처 DB에서 찾기 → 확인 후 끼니에 추가
// 사진은 분석에만 쓰고 저장하지 않는다

// 긴 변 1024px JPEG 로 줄인다 (전송량·분석 시간 줄이기)
const shrink = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    resolve(c.toDataURL('image/jpeg', 0.82));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('format')); };
  img.src = url;
});

const kcalOf = (food, w) => Math.round(food.calories * w / (food.per || 100));
const proteinOf = (food, w) => Math.round(food.protein * w / (food.per || 100) * 10) / 10;

export function FoodPhotoFlow({ file, onClose, onRetake, onAdd }) {
  const [phase, setPhase] = useState('loading'); // loading → review | error
  const [preview, setPreview] = useState(null);
  const [items, setItems] = useState([]); // [{ name, weight, include, candidates, pick }]
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const image = await shrink(file).catch(() => { throw new Error('이 사진 형식은 열 수 없어요. 다른 사진으로 해 주세요.'); });
        if (!alive) return;
        setPreview(image);
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        const [res, rows] = await Promise.all([
          fetch('/api/food-photo', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ image }) }),
          loadKfood().catch(() => null),
        ]);
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j.error) throw new Error(j.error || `사진 분석에 실패했어요 (${res.status})`);
        if (!alive) return;
        setItems((j.items || []).map(it => {
          const candidates = photoCandidates(it, rows);
          return { name: it.name, type: it.type, weight: it.grams, include: candidates.length > 0, candidates, pick: 0 };
        }));
        setPhase('review');
      } catch (e) {
        if (!alive) return;
        setError(e.message === 'Failed to fetch' ? '인터넷 연결을 확인하고 다시 해 주세요.' : e.message);
        setPhase('error');
      }
    })();
    return () => { alive = false; };
  }, [file]);

  const update = (i, patch) => setItems(list => list.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const chosen = items.filter(it => it.include && it.candidates[it.pick]);
  const total = chosen.reduce((s, it) => ({ kcal: s.kcal + kcalOf(it.candidates[it.pick], it.weight), p: s.p + proteinOf(it.candidates[it.pick], it.weight) }), { kcal: 0, p: 0 });

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {preview && <img src={preview} alt="" className="w-full max-h-48 object-cover rounded-2xl shadow-sm" />}

        {phase === 'loading' && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-5 text-center space-y-2">
            <div className="inline-flex gap-1">{[0, 1, 2].map(d => <span key={d} className="w-2 h-2 rounded-full bg-[#4768ff]/50 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}</div>
            <div className="text-sm font-black text-neutral-800">사진 속 음식을 찾는 중이에요</div>
            <div className="text-[11px] font-bold text-neutral-400">보통 몇 초 걸려요 · 찾은 음식은 식약처 영양 DB와 맞춰 봐요</div>
          </div>
        )}

        {phase === 'error' && (
          <div className="bg-white rounded-2xl border border-rose-100 p-5 text-center space-y-3">
            <div className="text-sm font-black text-rose-500">{error}</div>
            <div className="flex gap-2 justify-center">
              <button onClick={onRetake} className="px-4 py-2 rounded-xl bg-[#4768ff] text-white text-[13px] font-black flex items-center gap-1"><Camera className="w-4 h-4" />다시 찍기</button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-[13px] font-black">직접 검색</button>
            </div>
          </div>
        )}

        {phase === 'review' && (
          <>
            <div className="flex items-center justify-between px-1">
              <div className="text-sm font-black text-neutral-900 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#4768ff]" />{items.length ? `사진에서 ${items.length}개를 찾았어요` : '음식을 찾지 못했어요'}</div>
              <button onClick={onRetake} className="text-[11px] font-black text-neutral-500 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />다시 찍기</button>
            </div>
            {items.length > 0 && <div className="text-[11px] font-bold text-neutral-400 px-1 -mt-1">무게는 사진으로 짐작한 값이에요. 맞게 고친 뒤 추가하세요.</div>}
            {items.length === 0 && (
              <div className="bg-white rounded-2xl border border-neutral-100 p-4 text-[13px] font-bold text-neutral-500">음식이 잘 보이게 위에서 다시 찍거나, 닫고 직접 검색해 주세요.</div>
            )}
            {items.map((it, i) => {
              const food = it.candidates[it.pick];
              const step = it.weight >= 200 ? 50 : 10;
              return (
                <div key={i} className={`bg-white rounded-2xl border p-3 space-y-2.5 transition-all ${it.include && food ? 'border-[#4768ff]/30 shadow-sm' : 'border-neutral-100 opacity-60'}`}>
                  <div className="flex items-start gap-2.5">
                    <button onClick={() => food && update(i, { include: !it.include })} disabled={!food} aria-label="포함"
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${it.include && food ? 'bg-[#4768ff] border-[#4768ff]' : 'border-neutral-300'}`}>
                      {it.include && food && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    {food && <FoodImage id={food.id} icon={food.icon} className="w-11 h-11" bg="bg-neutral-100" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-neutral-400">사진: {it.name}{food?.approx && <span className="ml-1 text-amber-600">· 똑같은 제품이 없어 비슷한 음식이에요</span>}</div>
                      <div className="text-[14px] font-black text-neutral-900 truncate">{food ? food.name : '비슷한 음식도 찾지 못했어요'}{food?.brand && <span className="text-[11px] text-neutral-400 font-bold"> · {food.brand}</span>}</div>
                      {food && <div className="text-[11px] font-bold text-neutral-500">{kcalOf(food, it.weight)}kcal · 단백질 {proteinOf(food, it.weight)}g{food.noMacros ? ' · 탄·지 정보 없음' : ''}</div>}
                    </div>
                    <button onClick={() => update(i, { include: false })} aria-label="빼기" className="p-1 text-neutral-300 hover:text-rose-500"><X className="w-4 h-4" /></button>
                  </div>
                  {it.candidates.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                      {it.candidates.map((c, k) => (
                        <button key={k} onClick={() => update(i, { pick: k, include: true })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap border ${k === it.pick ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                          {c.name}{c.brand ? ` (${c.brand})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {food && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => update(i, { weight: Math.max(step, it.weight - step) })} className="p-2 bg-neutral-100 rounded-xl active:scale-90"><Minus className="w-4 h-4 text-neutral-600" /></button>
                      <input type="number" value={it.weight} onChange={e => update(i, { weight: Math.max(0, Number(e.target.value)) })} className="w-20 text-center font-black text-lg text-[#4768ff] bg-transparent outline-none" />
                      <span className="text-sm font-black text-neutral-400">{food.unit || 'g'}</span>
                      <button onClick={() => update(i, { weight: it.weight + step })} className="p-2 bg-neutral-100 rounded-xl active:scale-90"><Plus className="w-4 h-4 text-neutral-600" /></button>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-[10px] font-bold text-neutral-300 text-center px-2">사진은 분석에만 쓰이고 앱에 저장되지 않아요 · NVIDIA 체험판 AI로 분석해요</p>
          </>
        )}
      </div>

      {phase === 'review' && chosen.length > 0 && (
        <div className="p-4 border-t border-neutral-100 bg-white">
          <div className="flex justify-between text-[12px] font-black text-neutral-500 mb-2 px-1"><span>합계</span><span className="text-neutral-900">{total.kcal}kcal · 단백질 {Math.round(total.p * 10) / 10}g</span></div>
          <button onClick={() => onAdd(chosen.map(it => ({ food: it.candidates[it.pick], weight: it.weight })))} className="w-full bg-[#4768ff] text-white font-black py-3.5 rounded-xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] active:scale-95 transition-all">{chosen.length}개 식단에 추가하기</button>
        </div>
      )}
    </div>
  );
}
