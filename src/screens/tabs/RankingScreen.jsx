import React, { useEffect } from 'react';
import { RankingTab } from '../../RankingTab.jsx';
import { FullBodyAvatar } from '../../realAvatar.jsx';
import { useApp } from '../../appContext.js';
import { formatDate } from '../../lib/dates.js';

// 랭킹 탭 (전체·친구·길드)
export function RankingScreen() {
  const {
    cheersData,
    currentUser,
    devMock,
    friendRank,
    friendState,
    getAnalysisWeekInfo,
    getTotalLift3,
    getWeeklyVolumeData,
    globalEntries,
    goToSignup,
    guildApiImpl,
    guildData,
    guildLoading,
    handleCheer,
    inviteFriends,
    rankLoading,
    rankingUser,
    reloadGuild,
    sendFriendRequest,
    setIsFriendSearchModalOpen,
    showToast,
    stealRoutine,
    claimQuestRewards,
    buildPublicProfile,
    cardioMinOn,
    rankingScope,
    setRankingScope,
  } = useApp();
  // 초대 링크로 가입한 직후 한 번만 길드 화면으로 연다
  useEffect(() => { if (rankingScope !== 'global') setRankingScope('global'); }, []);
  const weekInfo = getAnalysisWeekInfo(new Date());
  const mon = new Date(weekInfo.monday), sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const left = Math.ceil((new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + 1) - new Date()) / 86400000);
  const me = {
    id: rankingUser?.id || 'guest', name: currentUser?.profile?.nickname || '나',
    volume: getWeeklyVolumeData(weekInfo.monday).total, lift: getTotalLift3(), avatarColor: 'bg-neutral-800', isMe: true, profile: currentUser?.profile,
    cardio: Array.from({ length: 7 }, (_, i) => { const x = new Date(weekInfo.monday); x.setDate(x.getDate() + i); return cardioMinOn(formatDate(x)); }).reduce((a, b) => a + b, 0),
  };
  // 내 시트에도 친구들이 보는 것과 같은 최근 루틴·최애 종목을 보여준다
  const pub = buildPublicProfile();
  me.routine = pub.last_routine;
  me.fav = pub.fav || '-';
  return (
    <RankingTab
      initialScope={rankingScope}
      onClaimXp={(item) => claimQuestRewards([item])}
      claimedKeys={Object.keys(currentUser?.questState?.claimed || {})}
      friendUsers={/* 서로 친구 수락한 사람만 (대기 중 요청은 제외) */ friendRank.filter(u => u.id !== rankingUser?.id && (devMock || friendState.friends.includes(u.id)))}
      globalEntries={globalEntries}
      me={me}
      meId={rankingUser?.id}
      guildApi={guildApiImpl}
      guildData={guildData}
      guildLoading={guildLoading}
      reloadGuild={reloadGuild}
      onToast={showToast}
      friends={friendState.friends}
      sentRequests={friendState.sent}
      cheers={cheersData}
      weekLabel={`${mon.getMonth() + 1}.${mon.getDate()} – ${sun.getMonth() + 1}.${sun.getDate()}`}
      daysLeft={left <= 1 ? '오늘 자정' : `${left}일`}
      onCheer={handleCheer}
      onSteal={stealRoutine}
      onFriend={sendFriendRequest}
      onFindFriends={() => setIsFriendSearchModalOpen(true)}
      onInvite={inviteFriends}
      guest={!rankingUser}
      onLogin={goToSignup}
      loading={rankLoading}
      Avatar3={FullBodyAvatar}
    />
  );
}
