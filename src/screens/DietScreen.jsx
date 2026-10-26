import React from 'react';
import { Camera, ChevronLeft, Minus, Plus, Search, Trash2, Utensils, X } from 'lucide-react';
import { FOOD_DB } from '../data/catalog.js';
import { GlobalOverlays } from './GlobalOverlays.jsx';
import { useApp } from '../appContext.js';

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
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">{String(item.icon)}</div>
                        <div>
                          <div className="font-black text-sm text-neutral-900">{String(item.name)}</div>
                          <div className="text-[10px] font-bold text-neutral-500">{item.weight}g · 단백질 {item.protein}g</div>
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
                    <input type="text" placeholder="음식 이름을 검색하세요 (ex. 닭가슴살)" value={foodSearchQuery} onChange={e => setFoodSearchQuery(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {['전체', '단백질', '탄수화물', '지방', '채소'].map(cat => (
                      <button key={cat} onClick={() => setFoodCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${foodCategoryFilter === cat ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                  {FOOD_DB.filter(f => (foodCategoryFilter === '전체' || String(f.category).includes(foodCategoryFilter)) && String(f.name).includes(foodSearchQuery)).map(food => (
                    <div key={food.id} onClick={() => {setSelectedFood(food); setFoodWeight(100);}} className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-neutral-100 hover:border-[#4768ff] hover:shadow-md transition-all cursor-pointer group active:scale-95">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/50 ${food.bgColor}`}>{String(food.icon)}</div>
                      <div className="flex-1">
                        <h3 className="font-black text-neutral-900 text-base">{String(food.name)}</h3>
                        <div className="text-[10px] font-bold text-neutral-400 mt-0.5">{String(food.unit)} 기준 · {food.calories}kcal</div>
                      </div>
                      <div className={`text-xs font-black bg-neutral-50 px-2 py-1 rounded-md ${food.txColor}`}>{String(food.category)}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 bg-neutral-50 p-6 flex flex-col items-center">
                 <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-6xl shadow-md border-4 border-white mb-6 mt-4 ${selectedFood.bgColor}`}>{String(selectedFood.icon)}</div>
                 <h3 className="text-2xl font-black text-neutral-900 mb-2">{String(selectedFood.name)}</h3>
                 <p className="text-sm font-bold text-neutral-500 mb-10">얼마나 드셨나요?</p>
                 <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm w-full max-w-xs mb-8 flex justify-between items-center">
                   <button onClick={() => setFoodWeight(Math.max(10, foodWeight - 50))} className="p-3 bg-neutral-100 rounded-2xl active:scale-90 transition-transform"><Minus className="w-5 h-5 text-neutral-600"/></button>
                   <div className="text-center">
                     <input type="number" value={foodWeight} onChange={e=>setFoodWeight(Number(e.target.value))} className="w-20 text-center font-black text-4xl text-[#4768ff] bg-transparent outline-none"/>
                     <span className="text-lg font-black text-neutral-400 ml-1">g</span>
                   </div>
                   <button onClick={() => setFoodWeight(foodWeight + 50)} className="p-3 bg-neutral-100 rounded-2xl active:scale-90 transition-transform"><Plus className="w-5 h-5 text-neutral-600"/></button>
                 </div>
                 <div className="w-full bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center mt-auto mb-6">
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">칼로리</div><div className="font-black text-lg text-neutral-900">{Math.round(selectedFood.calories * (foodWeight/100))}</div></div>
                   <div className="w-[1px] h-8 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">탄수화물</div><div className="font-black text-lg text-amber-500">{(selectedFood.carbs * (foodWeight/100)).toFixed(1)}</div></div>
                   <div className="w-[1px] h-8 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">단백질</div><div className="font-black text-lg text-[#4768ff]">{(selectedFood.protein * (foodWeight/100)).toFixed(1)}</div></div>
                   <div className="w-[1px] h-8 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">지방</div><div className="font-black text-lg text-rose-500">{(selectedFood.fat * (foodWeight/100)).toFixed(1)}</div></div>
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
