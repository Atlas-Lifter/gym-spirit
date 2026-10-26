// 운영자 확인: 운영자 아이디 목록은 DB(app_admins)에서 받아온다.
// 운영자 칭호·전용 의상(profile.gm)은 진짜 운영자일 때만 보여준다 (다른 사람이 아바타 정보를 바꿔도 흉내 낼 수 없게)
let adminIds = new Set();

export const setAdminIds = (ids) => { adminIds = new Set(ids || []); };
export const isAdminId = (id) => !!id && adminIds.has(id);

// 운영자가 아닌데 gm 표시가 붙은 아바타는 지운다
export const cleanAvatar = (id, avatar) => {
  if (!avatar || typeof avatar !== 'object' || !avatar.gm || isAdminId(id)) return avatar;
  const { gm: _gm, ...rest } = avatar;
  return rest;
};

// 운영자 모드로 접속 중인지 (운영자이고 아바타에 운영자 의상을 입고 있을 때)
export const isGmOn = (id, avatar) => isAdminId(id) && !!avatar?.gm;
