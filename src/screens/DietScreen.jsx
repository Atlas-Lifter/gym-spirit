import React, { useEffect, useMemo, useState } from 'react';
import { Camera, ChevronLeft, Minus, Plus, Search, Trash2, Utensils, X } from 'lucide-react';
import { FOOD_DB, FOOD_CATEGORIES, foodTags } from '../data/foods.js';
import { GlobalOverlays } from './GlobalOverlays.jsx';
import { FoodImage } from '../components/FoodImage.jsx';
import { useApp } from '../appContext.js';
import { KFOOD_SOURCE, kfoodToFood, loadKfood, searchKfood } from '../lib/kfood.js';

// 식단 플래너 화면
export function DietScreen() {
  const {
    addDietMeal,
    addFoodToMeal,
    currentDate,
    foodCategoryFilter,
    foodSearchQuery,
    foodWeight,
    isAddFoodModalOpen,
    removeDietMeal,
    removeFoodFromMeal,
    selectedFood,
    setCurrentScreen,
    setFoodCategoryFilter,
    setFoodSearchQuery,
    setFoodWeight,
    setIsAddFoodModalOpen,
    setSelectedFood,
    setSelectedMealId,
    showToast,
    todayDiet,
    todayMacros,
  } = useApp();
  const foodQuery = String(foodSearchQuery || '').trim();
  const foods = FOOD_DB.filter(f => (foodCategoryFilter === '전체' || (foodCategoryFilter === '고단백' ? foodTags(f).includes('고단백') : f.category === foodCategoryFilter))
    && (!foodQuery || `${f.name} ${f.kw}`.includes(foodQuery)));
  // 식약처 DB: 검색을 시작하면 그때 불러온다. 분류 칩과 상관없이 검색 결과를 함께 보여 준다 (고단백만 걸러 줌)
  const [kRows, setKRows] = useState(null);
  const [kState, setKState] = useState('idle');
  const wantK = isAddFoodModalOpen && !!foodQuery;
  useEffect(() => {
    if (!wantK || kRows || kState === 'loading') return;
    setKState('loading');
    loadKfood().then(rows => { setKRows(rows); setKState('ready'); }).catch(() => setKState('error'));
  }, [wantK, kRows, kState]);
  const kFoods = useMemo(() => {
    if (!kRows || !foodQuery) return [];
    const list = searchKfood(kRows, foodQuery, foodCategoryFilter === '고단백' ? 200 : 40).map(kfoodToFood);
    return foodCategoryFilter === '고단백' ? list.filter(f => foodTags(f).includes('고단백')).slice(0, 40) : list;
  }, [kRows, foodQuery, foodCategoryFilter]);
  const fmtMacro = (v) => (selectedFood?.noMacros ? '–' : v);
  const pickFood = (food) => { setSelectedFood(food); setFoodWeight(food.serv?.[0]?.g || 100); };
  const per = selectedFood?.per || 100;
  const unit = selectedFood?.unit || 'g';
  const step = (selectedFood?.serv?.[0]?.g || 100) <= 50 ? 10 : 50;
  const TAG_STYLE = { 고단백: 'bg-blue-50 text-[#4768ff]', 저칼로리: 'bg-emerald-50 text-emerald-600', 고칼로리: 'bg-rose-50 text-rose-500', '지방 많음': 'bg-amber-50 text-amber-600' };
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-32 flex flex-col relative animate-fade-in">
      <GlobalOverlays />
      <header className="bg-white border-b border-neutral-100 px-5 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <button onClick={() => setCurrentScreen('home')} className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-50 rounded-full transition-colors"><ChevronLeft className="w-6 h-6"/></button>
        <h1 className="font-black text-xl tracking-tight text-neutral-900">식단 플래너</h1>
        <div className="w-10"></div>
      </header>
      <main className="p-5 space-y-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
           <div className="flex justify-between items-end mb-6">
             <div>
               <p className="text-xs font-black text-neutral-400 mb-1">{currentDate.split('-')[1]}월 {currentDate.split('-')[2]}일</p>
               <h2 className="text-2xl font-black text-neutral-900">오늘의 섭취량</h2>
             </div>
             <div className="text-right"><div className="text-3xl font-black text-[#4768ff]">{todayMacros.cal.toLocaleString()} <span className="text-base text-neutral-400 font-bold">kcal</span></div></div>
           </div>
           <div className="grid grid-cols-3 gap-3">
             <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
               <div className="text-[10px] font-black text-neutral-500 mb-1">탄수화물</div>
               <div className="text-lg font-black text-neutral-900">{todayMacros.c.toFixed(0)}g</div>
               <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-amber-500 h-full" style={{width: `${Math.min((todayMacros.c/300)*100, 100)}%`}}></div></div>
             </div>
             <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
               <div className="text-[10px] font-black text-neutral-500 mb-1">단백질</div>
               <div className="text-lg font-black text-[#4768ff]">{todayMacros.p.toFixed(0)}g</div>
               <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-[#4768ff] h-full" style={{width: `${Math.min((todayMacros.p/150)*100, 100)}%`}}></div></div>
             </div>
             <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
               <div className="text-[10px] font-black text-neutral-500 mb-1">지방</div>
               <div className="text-lg font-black text-neutral-900">{todayMacros.f.toFixed(0)}g</div>
               <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-rose-500 h-full" style={{width: `${Math.min((todayMacros.f/70)*100, 100)}%`}}></div></div>
             </div>
           </div>
        </div>
        <div className="space-y-4">
          {todayDiet.meals.map(meal => (
            <div key={meal.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-neutral-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2"><Utensils className="w-4 h-4 text-neutral-400"/> {String(meal.name)}</h3>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-neutral-500">{meal.items.reduce((sum, item) => sum + item.calories, 0)} kcal</div>
                  <button onClick={() => removeDietMeal(meal.id)} className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-90" title="끼니 삭제"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              {meal.items.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {meal.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-neutral-50 p-3 rounded-2xl border border-neutral-100 group hover:border-rose-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <FoodImage id={item.foodId} icon={String(item.icon)} className="w-11 h-11" bg="bg-white" />
                        <div>
                          <div className="font-black text-sm text-neutral-900">{String(item.name)}</div>
                          <div className="text-[10px] font-bold text-neutral-500">{item.weight}{item.unit || 'g'} · 단백질 {item.protein}g</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-black text-neutral-700">{item.calories} kcal</div>
                        <button onClick={() => removeFoodFromMeal(meal.id, item.id)} className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors active:scale-90"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <button onClick={() => { setSelectedMealId(meal.id); setIsAddFoodModalOpen(true); }} className="w-full py-3.5 rounded-xl border-2 border-dashed border-neutral-200 text-neutral-400 font-black hover:text-[#4768ff] hover:border-[#4768ff]/30 hover:bg-[#e8edff] transition-all active:scale-[0.98] flex items-center justify-center gap-1"><Plus className="w-4 h-4 stroke-[3]"/> 음식 추가하기</button>
            </div>
          ))}
        </div>
        <button onClick={addDietMeal} className="w-full py-4 rounded-2xl border border-neutral-200 bg-white text-neutral-600 font-black hover:bg-neutral-50 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"><Plus className="w-5 h-5"/> 끼니 추가하기</button>
      </main>

      {isAddFoodModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => {setIsAddFoodModalOpen(false); setSelectedFood(null); setFoodCategoryFilter('전체');}}>
          <div className="bg-white w-full h-[90vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col animate-slide-up text-neutral-900 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-neutral-100">
              <button onClick={() => showToast("스마트 사진 분석은 준비 중입니다.")} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full transition-colors"><Camera className="w-6 h-6"/></button>
              <h2 className="text-xl font-black">{selectedFood ? '중량 입력' : '식재료 검색'}</h2>
              <button onClick={() => {setIsAddFoodModalOpen(false); setSelectedFood(null); setFoodCategoryFilter('전체');}} className="text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors"><X className="w-6 h-6"/></button>
            </div>
            {!selectedFood ? (
              <>
                <div className="p-4 bg-white sticky top-[65px] z-10 border-b border-neutral-50 shadow-[0_5px_10px_rgba(0,0,0,0.02)]">
                  <div className="bg-neutral-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="음식 이름을 검색하세요 (예: 닭가슴살, 김밥, 커피)" value={foodSearchQuery} onChange={e => setFoodSearchQuery(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {['전체', '고단백', ...FOOD_CATEGORIES].map(cat => (
                      <button key={cat} onClick={() => setFoodCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${foodCategoryFilter === cat ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                  <div className="text-[11px] font-bold text-neutral-400 px-1">{foods.length}개 · 영양 정보는 100g(음료 100ml) 기준이에요</div>
                  {!foodQuery && (
                    <div className="bg-[#4768ff]/5 border border-[#4768ff]/15 rounded-2xl p-3.5 text-[12px] font-bold text-neutral-600 leading-relaxed">
                      <div className="font-black text-[#4768ff] mb-0.5">🇰🇷 식약처 영양 DB 1.9만 개 연결됨</div>
                      위 검색창에 음식·메뉴 이름(예: 제육볶음, 김치찌개, 메가커피 라떼)을 입력하면 아래 목록에 함께 나와요.
                    </div>
                  )}
                  {foodQuery && foods.length > 2 && kFoods.length > 0 && (
                    <button onClick={() => document.getElementById('kfood-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left bg-[#4768ff]/5 border border-[#4768ff]/15 rounded-xl px-3 py-2 text-[12px] font-black text-[#4768ff]">🇰🇷 식약처 영양 DB에서 {kFoods.length >= 40 ? '40개 이상' : `${kFoods.length}개`} 더 찾았어요 · 아래로 ↓</button>
                  )}
                  {foods.map(food => {
                    const sv = food.serv?.[0];
                    return (
                      <div key={food.id} onClick={() => pickFood(food)} className="flex items-center gap-3.5 bg-white p-3.5 rounded-2xl border border-neutral-100 hover:border-[#4768ff] hover:shadow-md transition-all cursor-pointer group active:scale-95">
                        <FoodImage id={food.id} icon={food.icon} className="w-16 h-16" rounded="rounded-2xl" bg={food.bgColor} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-neutral-900 text-[15px] truncate">{String(food.name)}</h3>
                          <div className="text-[10px] font-bold text-neutral-400 mt-0.5">100{food.unit} {food.calories}kcal · 단백질 {food.protein}g{sv ? ` · ${sv.l} ${Math.round(food.calories * sv.g / food.per)}kcal` : ''}</div>
                          {foodTags(food).length > 0 && <div className="flex gap-1 mt-1">{foodTags(food).map(t => <span key={t} className={`text-[9px] font-black px-1.5 py-0.5 rounded ${TAG_STYLE[t]}`}>{t}</span>)}</div>}
                        </div>
                        <div className={`text-[10px] font-black bg-neutral-50 px-2 py-1 rounded-md flex-shrink-0 ${food.txColor}`}>{String(food.category)}</div>
                      </div>
                    );
                  })}
                  {foods.length === 0 && kFoods.length === 0 && kState !== 'loading' && <div className="text-center text-sm font-bold text-neutral-400 py-10">찾는 음식이 없어요. 다른 이름(예: 닭, 밥, 커피)으로 찾아보세요.</div>}
                  {foodQuery && (
                    <div id="kfood-results" className="pt-3 space-y-2 scroll-mt-2">
                      <div className="flex items-end justify-between px-1">
                        <div className="text-xs font-black text-neutral-700">🇰🇷 식약처 영양 DB <span className="text-neutral-400 font-bold">· 음식·프랜차이즈 메뉴·식재료 1.9만 개</span></div>
                        {kFoods.length > 0 && <div className="text-[10px] font-bold text-neutral-400">{kFoods.length >= 40 ? '상위 40개' : `${kFoods.length}개`}</div>}
                      </div>
                      {kState === 'loading' && <div className="text-center text-xs font-bold text-neutral-400 py-6">영양 DB 불러오는 중…</div>}
                      {kState === 'error' && <button onClick={() => setKState('idle')} className="w-full text-center text-xs font-bold text-rose-500 py-6">영양 DB를 못 불러왔어요. 눌러서 다시 시도</button>}
                      {kState === 'ready' && kFoods.length === 0 && <div className="text-center text-xs font-bold text-neutral-400 py-6">영양 DB에도 없어요. 띄어쓰기 없이 짧게(예: 제육, 라떼) 찾아보세요.</div>}
                      {kFoods.map(food => {
                        const sv = food.serv[0];
                        return (
                          <div key={food.id} onClick={() => pickFood(food)} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-100 hover:border-[#4768ff] hover:shadow-md transition-all cursor-pointer active:scale-95">
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 text-2xl">{food.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-black text-neutral-900 text-[14px] truncate">{food.name}</h3>
                              <div className="text-[10px] font-bold text-neutral-400 mt-0.5 truncate">{food.brand && <span className="text-neutral-600">{food.brand} · </span>}100{food.unit} {food.calories}kcal · 단백질 {food.protein}g{sv ? ` · 1회 ${sv.g}${food.unit} ${Math.round(food.calories * sv.g / 100)}kcal` : ''}</div>
                              {food.noMacros && <div className="text-[9px] font-bold text-neutral-400 mt-0.5">탄수화물·지방 정보 없음</div>}
                            </div>
                            <div className="text-[10px] font-black bg-neutral-50 px-2 py-1 rounded-md flex-shrink-0 text-neutral-500 max-w-[72px] truncate">{food.category}</div>
                          </div>
                        );
                      })}
                      <div className="text-[9px] font-bold text-neutral-300 text-center pt-1">출처: {KFOOD_SOURCE} (공공데이터포털)</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 bg-neutral-50 p-5 flex flex-col items-center overflow-y-auto">
                 <div className="mb-3 mt-1 shadow-lg rounded-[28px] border-4 border-white"><FoodImage id={selectedFood.id} icon={selectedFood.icon} className="w-36 h-36" rounded="rounded-3xl" bg={selectedFood.bgColor} /></div>
                 <h3 className="text-2xl font-black text-neutral-900 mb-1 text-center">{String(selectedFood.name)}</h3>
                 {selectedFood.brand && <div className="text-xs font-black text-neutral-400 mb-1">{selectedFood.brand}</div>}
                 <div className="flex flex-wrap justify-center gap-1 mb-4">
                   <span className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-white ${selectedFood.txColor}`}>{selectedFood.category}</span>
                   {foodTags(selectedFood).map(t => <span key={t} className={`text-[10px] font-black px-2 py-0.5 rounded-md ${TAG_STYLE[t]}`}>{t}</span>)}
                 </div>
                 {selectedFood.note && (
                   <div className="w-full bg-white rounded-2xl border border-neutral-100 p-4 mb-4 shadow-sm">
                     <div className="text-xs font-black text-neutral-900 mb-1.5">📋 영양 정보</div>
                     <p className="text-[13px] font-bold text-neutral-600 leading-relaxed">{selectedFood.note}</p>
                     <div className="grid grid-cols-4 gap-1 mt-3 text-center">
                       {[['칼로리', `${selectedFood.calories}`, 'text-neutral-900'], ['탄수', fmtMacro(`${selectedFood.carbs}g`), 'text-amber-500'], ['단백질', `${selectedFood.protein}g`, 'text-[#4768ff]'], ['지방', fmtMacro(`${selectedFood.fat}g`), 'text-rose-500']].map(([k, v, c]) => (
                         <div key={k} className="bg-neutral-50 rounded-lg py-1.5"><div className={`text-xs font-black ${c}`}>{v}</div><div className="text-[9px] font-bold text-neutral-400">{k}</div></div>
                       ))}
                     </div>
                     <div className="text-[10px] font-bold text-neutral-400 mt-1.5 text-right">100{unit} 기준</div>
                   </div>
                 )}
                 <p className="text-sm font-bold text-neutral-500 mb-2">얼마나 드셨나요?</p>
                 <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                   {[...(selectedFood.serv || []), ...((selectedFood.serv || []).some(sv => sv.g === 100) ? [] : [{ l: `100${unit}`, g: 100 }])].map(sv => (
                     <button key={sv.l} onClick={() => setFoodWeight(sv.g)} className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all active:scale-95 ${foodWeight === sv.g ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-white text-neutral-600 border-neutral-200'}`}>{sv.l}{sv.l.startsWith('100') ? '' : ` · ${sv.g}${unit}`}</button>
                   ))}
                 </div>
                 <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm w-full max-w-xs mb-5 flex justify-between items-center">
                   <button onClick={() => setFoodWeight(Math.max(step, foodWeight - step))} className="p-3 bg-neutral-100 rounded-2xl active:scale-90 transition-transform"><Minus className="w-5 h-5 text-neutral-600"/></button>
                   <div className="text-center">
                     <input type="number" value={foodWeight} onChange={e=>setFoodWeight(Number(e.target.value))} className="w-20 text-center font-black text-4xl text-[#4768ff] bg-transparent outline-none"/>
                     <span className="text-lg font-black text-neutral-400 ml-1">{unit}</span>
                   </div>
                   <button onClick={() => setFoodWeight(foodWeight + step)} className="p-3 bg-neutral-100 rounded-2xl active:scale-90 transition-transform"><Plus className="w-5 h-5 text-neutral-600"/></button>
                 </div>
                 <div className="w-full bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center mt-auto mb-5">
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">칼로리</div><div className="font-black text-lg text-neutral-900">{Math.round(selectedFood.calories * (foodWeight/per))}</div></div>
                   <div className="w-[1px] h-8 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">탄수화물</div><div className="font-black text-lg text-amber-500">{fmtMacro((selectedFood.carbs * (foodWeight/per)).toFixed(1))}</div></div>
                   <div className="w-[1px] h-8 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">단백질</div><div className="font-black text-lg text-[#4768ff]">{(selectedFood.protein * (foodWeight/per)).toFixed(1)}</div></div>
                   <div className="w-[1px] h-8 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">지방</div><div className="font-black text-lg text-rose-500">{fmtMacro((selectedFood.fat * (foodWeight/per)).toFixed(1))}</div></div>
                 </div>
                 <button onClick={addFoodToMeal} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] hover:bg-blue-600 active:scale-95 transition-all text-lg">식단에 추가하기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
