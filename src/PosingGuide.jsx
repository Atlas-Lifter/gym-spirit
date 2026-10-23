import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Trophy, Lightbulb, AlertTriangle } from 'lucide-react';
import { PosingFigure, GROUPS } from './posingFigure.jsx';
import { POSES, DIVISIONS } from './posingData.js';
import { Posing3D } from './Posing3D.jsx';

// WebGL을 쓸 수 있으면 360° 3D, 아니면 기존 그림
const canWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const Figure3DOr2D = ({ profile, ...props }) => (canWebGL ? <Posing3D {...props} profile={profile} /> : <div className="h-full py-2"><PosingFigure {...props} /></div>);

const VIEW_LABEL = { front: '정면', back: '후면', side: '측면' };
const GROUP_LABEL = { feet: '발', legs: '다리', pelvis: '골반', torso: '몸통', arms: '팔', hands: '손', head: '머리' };

// 단계 i까지 맞춘 부위 (마지막 단계는 전신)
const groupsUntil = (pose, i) => {
  if (i >= pose.steps.length - 1) return GROUPS;
  const set = new Set();
  pose.steps.slice(0, i + 1).forEach(s => s.g.forEach(g => set.add(g)));
  return [...set];
};

const PoseViewer = ({ entry, division, onClose, profile }) => {
  const pose = POSES[entry.id];
  const [step, setStep] = useState(0);
  const scrollRef = useRef(null);
  const jumpTo = (i) => { setStep(i); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); };
  const total = pose.steps.length;
  const cur = pose.steps[step];
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col justify-end animate-fade-in" onClick={onClose}>
      <div className="bg-white text-neutral-900 w-full h-[92vh] rounded-t-[36px] flex flex-col overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[10px] font-black bg-neutral-900 text-white px-2 py-0.5 rounded-md">{division.name} · {entry.no}</span>
              <span className="text-[10px] font-black bg-blue-50 text-[#4768ff] px-2 py-0.5 rounded-md">{VIEW_LABEL[pose.view]}{pose.view === 'side' ? ' (왼쪽 옆면 예시)' : ''}</span>
              {entry.note && <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">{entry.note}</span>}
            </div>
            <h2 className="text-xl font-black tracking-tight leading-tight">{pose.name}</h2>
            <p className="text-[11px] font-bold text-neutral-400">{pose.en}</p>
          </div>
          <button onClick={onClose} aria-label="닫기" className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 active:scale-90 transition-all"><X className="w-5 h-5 text-neutral-500" /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <p className="px-5 pt-3 text-xs font-bold text-neutral-600 leading-relaxed">{pose.summary}</p>

          {/* 단계 그림 */}
          <div className="mx-5 mt-3 rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 relative">
            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
              {cur.g.map(g => <span key={g} className="text-[10px] font-black bg-[#2563eb] text-white px-2 py-0.5 rounded-md">{GROUP_LABEL[g]}</span>)}
            </div>
            <div className="absolute top-3 right-3 z-10 text-[10px] font-black text-slate-400">{step + 1} / {total}</div>
            <div className="h-[450px]">
              <Figure3DOr2D pose={pose} setGroups={groupsUntil(pose, step)} focusGroups={cur.g} marks={cur.m || []} profile={profile} />
            </div>
            {canWebGL && <div className="text-center text-[10px] font-black text-slate-400 -mt-1 mb-1">손가락으로 끌어서 좌우·위아래 360° 돌려 보기 · 두 손가락으로 확대</div>}
            <div className="flex items-center justify-center gap-3 pb-3 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#cfe0ff] border border-[#2563eb]" />지금 맞추는 부위</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#eef0f3] border border-slate-400" />맞춘 부위</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#eef0f3] border border-slate-400 opacity-40" />아직</span>
            </div>
          </div>

          {/* 현재 단계 설명 */}
          <div className="mx-5 mt-3 bg-white border-2 border-[#4768ff] rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-black text-[#4768ff] mb-1">{step + 1}단계 · {cur.t}</div>
            <p className="text-sm font-bold text-neutral-800 leading-relaxed">{cur.d}</p>
          </div>
          <div className="mx-5 mt-3 flex gap-2">
            <button disabled={step === 0} onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-600 font-black text-sm flex items-center justify-center gap-1 disabled:opacity-40 active:scale-95 transition-transform"><ChevronLeft className="w-4 h-4" /> 이전</button>
            <button disabled={step === total - 1} onClick={() => setStep(s => s + 1)} className="flex-[2] py-3 rounded-xl bg-[#4768ff] text-white font-black text-sm flex items-center justify-center gap-1 disabled:opacity-40 active:scale-95 transition-transform shadow-[0_8px_20px_rgba(71,104,255,0.3)]">다음 단계 <ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* 전체 단계 목록 */}
          <div className="mx-5 mt-5">
            <h3 className="text-xs font-black text-neutral-500 mb-2">전체 단계</h3>
            <div className="space-y-2">
              {pose.steps.map((s, i) => (
                <button key={i} onClick={() => jumpTo(i)} className={`w-full text-left flex gap-3 p-3 rounded-2xl border transition-all active:scale-[0.99] ${i === step ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'}`}>
                  <div className="w-16 h-24 flex-shrink-0 bg-white rounded-xl border border-neutral-100">
                    <PosingFigure pose={pose} setGroups={groupsUntil(pose, i)} focusGroups={s.g} marks={[]} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[11px] font-black mb-0.5 ${i === step ? 'text-[#4768ff]' : 'text-neutral-500'}`}>{i + 1}단계 · {s.t}</div>
                    <p className="text-xs font-bold text-neutral-600 leading-relaxed line-clamp-3">{s.d}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-5 mt-5 mb-8 grid gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="text-xs font-black text-emerald-700 mb-2 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> 핵심 팁</div>
              {pose.tips.map(t => <p key={t} className="text-xs font-bold text-emerald-800 leading-relaxed">• {t}</p>)}
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="text-xs font-black text-red-600 mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 자주 하는 실수</div>
              {pose.mistakes.map(t => <p key={t} className="text-xs font-bold text-red-700 leading-relaxed">• {t}</p>)}
            </div>
            <p className="text-[10px] font-bold text-neutral-400 leading-relaxed">세부 규정은 연맹(IFBB, NPC, NABBA, WNBF 등)과 대회마다 다를 수 있으니 출전 대회의 선수 안내서를 꼭 확인하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 프로필 탭 섹션: 성별 → 종목 → 포즈 카드
export const PosingGuideSection = ({ profile }) => {
  const [gender, setGender] = useState('male');
  const divisions = DIVISIONS.filter(d => d.gender === gender);
  const [divId, setDivId] = useState('bb');
  const division = divisions.find(d => d.id === divId) || divisions[0];
  const [showFlow, setShowFlow] = useState(false);
  const [open, setOpen] = useState(null);

  const switchGender = (g) => { setGender(g); setDivId(DIVISIONS.find(d => d.gender === g).id); setShowFlow(false); };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-black text-neutral-900 mb-3 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> 대회 포징 가이드</h3>
      <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-4">
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-3">
          {[['male', '남자'], ['female', '여자']].map(([g, l]) => (
            <button key={g} onClick={() => switchGender(g)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${gender === g ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-3">
          {divisions.map(d => (
            <button key={d.id} onClick={() => { setDivId(d.id); setShowFlow(false); }} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${division.id === d.id ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-500 border-neutral-200'}`}>{d.name}</button>
          ))}
        </div>
        <div className="bg-neutral-50 rounded-xl p-3 mb-3">
          <div className="text-[11px] font-black text-neutral-400">{division.en}</div>
          <p className="text-xs font-bold text-neutral-700 mt-0.5 leading-relaxed"><span className="text-neutral-400">심사 포인트 · </span>{division.judging}</p>
          <button onClick={() => setShowFlow(v => !v)} className="text-[11px] font-black text-[#4768ff] mt-1.5">{showFlow ? '무대 진행 순서 접기' : '무대 진행 순서 보기'}</button>
          {showFlow && (
            <ol className="mt-1.5 space-y-1">
              {division.flow.map((s, i) => <li key={i} className="text-[11px] font-bold text-neutral-600 leading-relaxed flex gap-1.5"><span className="text-[#4768ff] font-black">{i + 1}.</span>{s}</li>)}
            </ol>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {division.poses.map(entry => {
            const pose = POSES[entry.id];
            return (
              <button key={entry.id} onClick={() => setOpen(entry)} className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-1.5 text-left hover:border-blue-300 active:scale-95 transition-all">
                <div className="h-28"><PosingFigure pose={pose} /></div>
                <div className="px-1 pb-1">
                  <div className="text-[10px] font-black text-[#4768ff]">{entry.no}</div>
                  <div className="text-[11px] font-black text-neutral-800 leading-tight">{pose.name}</div>
                  {entry.note && <div className="text-[9px] font-bold text-amber-600 mt-0.5">{entry.note}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* 프로필 화면의 애니메이션 컨테이너 밖(문서 맨 위)에 띄워야 하단 메뉴 위로 올라온다 */}
      {open && createPortal(<PoseViewer entry={open} division={division} profile={profile} onClose={() => setOpen(null)} />, document.body)}
    </div>
  );
};
