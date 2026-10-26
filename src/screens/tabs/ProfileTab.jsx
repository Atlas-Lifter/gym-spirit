import React, { lazy, Suspense } from 'react';
import { Activity, Edit3, LogOut, Settings } from 'lucide-react';
import { InstallCard } from '../../pwa.jsx';
import { QuestCenter } from '../../QuestCenter.jsx';
import { FullBodyAvatar } from '../../realAvatar.jsx';
import { useApp } from '../../appContext.js';


// 3D 포징 가이드(three.js)와 바디 변화는 프로필 탭을 열 때 따로 불러온다 (첫 화면을 가볍게)
const PosingGuideSection = lazy(() => import('../../PosingGuide.jsx').then(m => ({ default: m.PosingGuideSection })));
const BodyTransform = lazy(() => import('../../BodyTransform.jsx').then(m => ({ default: m.BodyTransform })));
const SectionLoading = () => <div className="h-40 rounded-[28px] bg-white border border-neutral-100 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-emerald-500 animate-spin" /></div>;
// 프로필 탭: 아바타·신체 기록·퀘스트·바디 변화
export function ProfileTab() {
  const {
    activeUser,
    avatarPose,
    awakenLevel,
    claimQuestRewards,
    cloudUser,
    deleteBodyEntry,
    editingNick,
    getTotalLift3,
    getUserLevel,
    goToSignup,
    handleLogout,
    openBodyStatsModal,
    safeDiet,
    safeWorkouts,
    saveBodyGoal,
    setEditingNick,
    setIsAvatarStudioOpen,
    setIsInstallOpen,
    showToast,
    updateProfile,
    upsertBodyEntry,
  } = useApp();
  return (
    <div className="flex-1 bg-neutral-50 pb-28 overflow-y-auto animate-fade-in text-neutral-900">
      <div className="bg-white p-6 mx-4 mt-4 rounded-[32px] shadow-sm border border-neutral-100 mb-6 relative">
         <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors z-20"><LogOut className="w-5 h-5"/></button>
         <div className="flex flex-col items-center mb-6 relative">
           <div className="relative cursor-pointer group mb-4" onClick={() => setIsAvatarStudioOpen(true)}>
              <div className="bg-gradient-to-b from-neutral-100 to-neutral-50 rounded-3xl p-4 shadow-inner border border-neutral-100 relative">
                 <FullBodyAvatar profile={activeUser?.profile} bodyStats={activeUser?.bodyStats} size="w-40 h-72" pose={avatarPose} />
                 <div className="absolute bottom-2 right-2 bg-neutral-800 text-white p-2.5 rounded-full border-2 border-white shadow-md group-hover:bg-[#4768ff] transition-colors"><Settings className="w-4 h-4"/></div>
              </div>
           </div>
           <div className="text-center">
              {editingNick !== null ? (
                <form onSubmit={e => { e.preventDefault(); const n = editingNick.trim().slice(0, 12); if (n) { updateProfile({ nickname: n }); showToast('닉네임을 바꿨어요.'); } setEditingNick(null); }} className="flex items-center justify-center gap-2">
                  <input autoFocus value={editingNick} maxLength={12} onChange={e => setEditingNick(e.target.value)} className="w-40 text-center text-lg font-black text-neutral-900 bg-neutral-100 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#4768ff]" />
                  <button type="submit" className="px-3 py-2 rounded-xl bg-[#4768ff] text-white text-xs font-black">저장</button>
                  <button type="button" onClick={() => setEditingNick(null)} className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-black">취소</button>
                </form>
              ) : (
                <h2 className="text-2xl font-black text-neutral-900 flex items-center justify-center gap-2">{String(activeUser?.profile?.nickname || '짐스피릿 유저')}
                  <button onClick={() => setEditingNick(String(activeUser?.profile?.nickname || ''))} aria-label="닉네임 수정" className="p-1 rounded-lg text-neutral-300 hover:text-[#4768ff] hover:bg-neutral-100 transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <div className="bg-[#e8edff] text-[#4768ff] text-[10px] font-black px-2 py-0.5 rounded-md">{getUserLevel()}</div></h2>
              )}
              {!cloudUser && <button onClick={goToSignup} className="mt-2 text-[11px] font-black text-[#4768ff] bg-[#eef2ff] px-3 py-1.5 rounded-lg">게스트 모드 · 회원가입하면 기록이 안전하게 저장돼요</button>}
              <p className="text-sm font-bold text-neutral-500 mt-1 flex items-center justify-center gap-1.5"><Activity className="w-4 h-4 text-emerald-500"/> 3대 운동 <span className="text-neutral-900 text-base font-black">{getTotalLift3()}kg</span></p>
           </div>
         </div>
         <div className="grid grid-cols-3 gap-3 mb-6">
           <div onClick={openBodyStatsModal} className="bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all shadow-inner group">
              <div className="text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-neutral-700">몸무게</div>
              <div className="font-black text-xl text-neutral-900">{activeUser?.bodyStats?.weight || '-'}<span className="text-xs text-neutral-400 ml-0.5">kg</span></div>
           </div>
           <div onClick={openBodyStatsModal} className="bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all shadow-inner group">
              <div className="text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-neutral-700">골격근량</div>
              <div className="font-black text-xl text-neutral-900">{activeUser?.bodyStats?.muscle || '-'}<span className="text-xs text-neutral-400 ml-0.5">kg</span></div>
           </div>
           <div onClick={openBodyStatsModal} className="bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all shadow-inner group">
              <div className="text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-neutral-700">체지방률</div>
              <div className="font-black text-xl text-neutral-900">{activeUser?.bodyStats?.fat || '-'}<span className="text-xs text-neutral-400 ml-0.5">%</span></div>
           </div>
         </div>
         <button onClick={openBodyStatsModal} className="w-full bg-neutral-100 text-neutral-600 font-black py-4 rounded-2xl text-sm hover:bg-neutral-200 transition-colors active:scale-[0.98] mb-6">스탯 입력 및 수정하기</button>

         <div className="mb-4"><InstallCard onOpen={() => setIsInstallOpen(true)} /></div>

         <QuestCenter
           workouts={safeWorkouts}
           diet={safeDiet}
           bodyStats={activeUser?.bodyStats}
           total3={getTotalLift3()}
           questState={activeUser?.questState}
           onClaim={claimQuestRewards}
           onAwaken={awakenLevel}
         />

         <Suspense fallback={<SectionLoading />}><PosingGuideSection profile={activeUser?.profile} /></Suspense>

         <Suspense fallback={<SectionLoading />}>
           <BodyTransform
             history={activeUser?.bodyHistory || []}
             goal={activeUser?.bodyGoal || {}}
             gender={activeUser?.profile?.gender}
             currentStats={activeUser?.bodyStats}
             onSaveEntry={upsertBodyEntry}
             onDeleteEntry={deleteBodyEntry}
             onSaveGoal={saveBodyGoal}
           />
         </Suspense>
      </div>
    </div>
  );
}
