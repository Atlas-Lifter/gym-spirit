import React from 'react';
import { ChevronRight, MessageSquare, Search, Sparkles } from 'lucide-react';
import { KOREAN_LEGENDS, OLYMPIA_LEGENDS, PROGRAMS } from '../../data/catalog.js';
import { useApp } from '../../appContext.js';

// 프로그램 탭: 추천 프로그램·레전드 루틴
export function ProgramTab() {
  const {
    LegendArt,
    programFilter,
    setIsAiCoachOpen,
    setProgramFilter,
    setSelectedLegendModal,
    setSelectedProgramModal,
  } = useApp();
  return (
    <div className="flex-1 bg-white pb-28 overflow-y-auto animate-fade-in text-neutral-900">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 px-5 pt-5 pb-3 border-b border-neutral-100">
         <div className="bg-neutral-100 rounded-xl p-3.5 flex items-center gap-2 mb-4 shadow-inner">
            <Search className="w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="루틴 또는 코치 이름을 검색하세요" className="bg-transparent border-none outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
         </div>
         <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
           {['전체', '추천', '근비대', '스트렝스', '맨몸운동', '전신', '상체', '하체', '어깨', '등'].map((tag) => (
             <button key={tag} onClick={() => setProgramFilter(tag)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all ${programFilter === tag ? 'bg-neutral-900 text-white shadow-sm' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>{tag}</button>
           ))}
         </div>
      </div>

      <div className="px-5 mt-5 mb-2">
        <div onClick={() => setIsAiCoachOpen(true)} className="bg-gradient-to-r from-[#4768ff] to-[#8b5cf6] p-5 rounded-[24px] shadow-lg text-white flex items-center justify-between cursor-pointer active:scale-95 transition-transform overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="font-black text-lg mb-1 flex items-center gap-2"><MessageSquare className="w-5 h-5 fill-white/20"/> 스마트 AI 코치 상담소</h3>
            <p className="text-[11px] font-bold text-blue-100">선택형 질문으로 나만의 맞춤 솔루션 찾기</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative z-10"><ChevronRight className="w-6 h-6 text-white" /></div>
        </div>
      </div>

      <div className="px-5 mt-6 mb-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-lg text-neutral-900 flex items-center gap-1.5">👑 전설의 올림피아 루틴</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {OLYMPIA_LEGENDS.map((legend, idx) => {
            const [nameKo, nameEn] = legend.name.split(' (');
            return (
            <div key={`legend-${idx}`} onClick={() => setSelectedLegendModal(legend)} className="w-72 h-52 flex-shrink-0 text-white rounded-[28px] shadow-lg hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden bg-neutral-900">
              <LegendArt id={legend.id} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
              <div className="relative z-10 h-full w-[64%] p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black bg-white/15 text-white px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block border border-white/25 backdrop-blur-sm">{legend.nickname}</span>
                  <h4 className="font-black text-xl leading-tight drop-shadow">{nameKo}</h4>
                  {nameEn && <p className="text-[11px] font-bold text-white/70 mt-0.5">{nameEn.replace(')', '')}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/80 line-clamp-2 leading-relaxed">{legend.desc}</p>
                  <span className="inline-block mt-2 text-[10px] bg-white/15 px-2 py-1 rounded text-white font-bold backdrop-blur-sm">{legend.routines.length}개의 부위별 루틴</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6 mb-2">
        <h3 className="font-black text-lg text-neutral-900 mb-3 flex items-center gap-1.5">🇰🇷 대한민국 피트니스 4대장</h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {KOREAN_LEGENDS.map((legend, idx) => {
            const [nameKo, nameEn] = legend.name.split(' (');
            return (
            <div key={`k-legend-${idx}`} onClick={() => setSelectedLegendModal(legend)} className="w-72 h-52 flex-shrink-0 text-white rounded-[28px] shadow-lg hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden bg-neutral-900">
              <LegendArt id={legend.id} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
              <div className="relative z-10 h-full w-[64%] p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black bg-white/15 text-white px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block border border-white/25 backdrop-blur-sm">{legend.era}</span>
                  <h4 className="font-black text-xl leading-tight drop-shadow">{nameKo}</h4>
                  {nameEn && <p className="text-[11px] font-bold text-white/70 mt-0.5">{nameEn.replace(')', '')}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/80 line-clamp-2 leading-relaxed">{legend.desc}</p>
                  <span className="inline-block mt-2 text-[10px] bg-white/15 px-2 py-1 rounded text-white font-bold backdrop-blur-sm">{legend.routines.length}개의 부위별 루틴</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-5">
        <h3 className="font-black text-lg text-neutral-900 mb-3 flex items-center gap-1.5">🔥 최근 인기 프로그램</h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {PROGRAMS.slice(0, 4).map((p, idx) => (
            <div key={`feat-${idx}`} onClick={() => setSelectedProgramModal(p)} className="w-60 flex-shrink-0 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-5 rounded-[28px] shadow-lg hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden flex flex-col justify-between h-48">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
              <div>
                <span className="text-[10px] font-black bg-emerald-500 text-neutral-950 px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">{p.level}</span>
                <h4 className="font-black text-lg leading-tight line-clamp-2">{p.title}</h4>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400">{p.author}</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{p.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <h3 className="font-black text-lg text-neutral-900 mb-1">나에게 맞는 프로그램 찾기</h3>
        {PROGRAMS.filter(p => programFilter === '전체' || (p.tags && p.tags.includes(programFilter))).map((prog, idx) => (
          <div key={`list-${idx}`} onClick={() => setSelectedProgramModal(prog)} className="flex items-center gap-4 cursor-pointer group bg-neutral-50 p-4 rounded-[24px] border border-neutral-100 hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98]">
            <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shadow-sm flex-shrink-0 border border-neutral-100 flex items-center justify-center relative"><Sparkles className="w-6 h-6 text-[#4768ff] group-hover:scale-110 transition-transform" /></div>
            <div className="flex-1 min-w-0">
               <h3 className="font-black text-neutral-900 text-base group-hover:text-[#4768ff] transition-colors truncate">{String(prog.title)}</h3>
               <p className="text-xs text-neutral-500 font-bold mt-0.5">{String(prog.author)}</p>
               <p className="text-[10px] text-neutral-400 mt-1">{String(prog.level)} · {String(prog.duration)}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 flex-shrink-0 group-hover:translate-x-1 transition-transform"/>
          </div>
        ))}
      </div>
    </div>
  );
}
