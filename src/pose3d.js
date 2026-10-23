import { NEUTRAL, GROUP_OF, GROUPS } from './posingFigure.jsx';

// 2D 포즈 데이터(정면/후면/측면 그림 좌표)를 3D 관절 좌표로 바꾼다.
// 세계 좌표: X = 선수의 왼쪽(+)/오른쪽(-), Y = 위, Z = 선수가 바라보는 앞(심사위원 쪽).
// 정면 그림: 화면 x → X, 후면 그림: 좌우 반전, 측면 그림: 화면 x → Z (앞뒤), 좌우 X는 기본값/포즈별 값.

const GROUND = 286;

// 정면·후면 그림에는 깊이 정보가 없으므로 관절별 기본 깊이를 쓰고, 포즈마다 depth로 덮어쓴다
const FRONT_DEPTH = { head: 1, lSh: 0, rSh: 0, lEl: -3, rEl: -3, lWr: -1, rWr: -1, pelvis: 0, lKnee: 2, rKnee: 2, lAnk: -1, rAnk: -1 };
// 측면 그림의 좌우(가까운 쪽 +) 기본 거리
const SIDE_LAT = (female) => ({ sh: female ? 17 : 21, fSh: female ? 17 : 21, nEl: female ? 20 : 24, fEl: female ? 20 : 24, nWr: female ? 19 : 23, fWr: female ? 19 : 23, hip: 8.5, nKnee: 8.5, fKnee: 8.5, nAnk: 8.5, fAnk: 8.5 });

export const merged = (pose, setGroups) => {
  const female = pose.gender === 'female';
  const isSide = pose.view === 'side';
  const base = NEUTRAL[isSide ? 'side' : 'front'][female ? 'female' : 'male'];
  const j = {};
  Object.keys({ ...base, ...pose.joints }).forEach(k => {
    const g = GROUP_OF[k];
    j[k] = pose.joints[k] !== undefined && (!g || setGroups.includes(g)) ? pose.joints[k] : base[k];
  });
  return j;
};

const setOf = (pose, setGroups, key, table) => {
  const g = GROUP_OF[key];
  const own = table && table[key] !== undefined && (!g || setGroups.includes(g));
  return own ? table[key] : undefined;
};

export const buildPose3D = (pose, setGroups = GROUPS) => {
  const female = pose.gender === 'female';
  const j = merged(pose, setGroups);
  const view = pose.view;
  const parts = { arms: [], legs: [] };

  if (view === 'side') {
    const near = pose.face === 'l' ? 1 : -1;      // 가까운 쪽(카메라 쪽)의 X 부호
    const L = SIDE_LAT(female);
    const lat = (key, dflt) => {
      const v = setOf(pose, setGroups, key, pose.lat);
      return v !== undefined ? v : dflt;
    };
    // 가까운 쪽 관절은 +, 먼 쪽 관절은 - (pose.lat 값도 '가까운 쪽이 +' 기준)
    const at = (p, key) => {
      const dflt = L[key] ?? 8.5;
      const v = lat(key, key.startsWith('f') ? -dflt : dflt);
      return [near * v, GROUND - p[1], p[0] - 100];
    };
    const twist = (j.twist || 0) * 32 * near;    // 상체를 카메라 쪽으로 비튼 각도
    const shNear = at(j.sh, 'sh'), shFar = at(j.fSh || j.sh, 'fSh');
    parts.shoulders = [shNear, shFar];
    parts.twist = twist;
    parts.arms = [
      { near: true, sh: shNear, el: at(j.nEl, 'nEl'), wr: at(j.nWr, 'nWr'), hand: j.nHand },
      { near: false, sh: shFar, el: at(j.fEl, 'fEl'), wr: at(j.fWr, 'fWr'), hand: j.fHand },
    ];
    const hipY = GROUND - (j.pelvis[1] + 4);
    const hipZ = j.pelvis[0] - 100;
    parts.legs = [
      { hip: [near * L.hip, hipY, hipZ + 1], knee: at(j.nKnee, 'nKnee'), ank: at(j.nAnk, 'nAnk'), foot: { dir: [0, 1], toe: j.nFoot?.toe } },
      { hip: [-near * L.hip, hipY, hipZ - 1], knee: at(j.fKnee, 'fKnee'), ank: at(j.fAnk, 'fAnk'), foot: { dir: [0, 1], toe: j.fFoot?.toe } },
    ];
    const shC = [(shNear[0] + shFar[0]) / 2, (shNear[1] + shFar[1]) / 2, (shNear[2] + shFar[2]) / 2];
    parts.torso = {
      shoulderC: shC,
      shoulderHalf: Math.abs(shNear[0] - shFar[0]) / 2 + 1,
      pelvis: [0, GROUND - j.pelvis[1], j.pelvis[0] - 100],
      lat: j.lat || 0, waist: female ? 13 : 16, hip: female ? 19 : 15,
      chestDepth: (j.chest || 14) * 0.95 + 2 + (j.twist || 0) * 2,
      // 측면 그림의 엉덩이 값은 기본 체형을 포함하므로 기본값을 빼서 정면 포즈와 같은 기준으로 맞춘다
      glute: Math.max(0, (j.glute || 0) - (female ? 16 : 13)) * 0.9, arch: j.arch || 0, lean: j.lean || 0, tilt: 0,
    };
    const hd = j.head;
    parts.head = { p: [0, GROUND - hd.y, hd.x - 100 - 2], yaw: hd.dir === 'three' ? near * 40 : 0, roll: hd.tilt || 0 };
    parts.refYaw = near > 0 ? -90 : 90;
    parts.markMap = ([x, y]) => [near * 34, GROUND - y, x - 100];
  } else {
    const sgn = view === 'back' ? -1 : 1;
    const depth = (key) => {
      const v = setOf(pose, setGroups, key, pose.depth);
      return v !== undefined ? v : (FRONT_DEPTH[key] ?? 0);
    };
    const at = (p, key) => [sgn * (p[0] - 100), GROUND - p[1], depth(key)];
    const lean = j.lean || 0;
    const leanZ = (p) => [p[0], p[1], p[2] + lean * 1.4];
    const pv = j.pelvis;
    const hipW = (j.hip || 15) + (j.glute || 0) * 0.3;
    const hipY = GROUND - (pv[1] + 4);
    const footOf = (F) => {
      const a = (F?.ang || 0) * Math.PI / 180;
      return { dir: [sgn * Math.sin(a), Math.cos(a)], toe: F?.toe };
    };
    const shL = leanZ(at(j.lSh, 'lSh')), shR = leanZ(at(j.rSh, 'rSh'));
    parts.shoulders = [shL, shR];
    parts.twist = 0;
    parts.arms = [
      { sh: shL, el: leanZ(at(j.lEl, 'lEl')), wr: leanZ(at(j.lWr, 'lWr')), hand: j.lHand },
      { sh: shR, el: leanZ(at(j.rEl, 'rEl')), wr: leanZ(at(j.rWr, 'rWr')), hand: j.rHand },
    ];
    parts.legs = [
      { hip: [sgn * (pv[0] - 100 - hipW * 0.62), hipY, 0], knee: at(j.lKnee, 'lKnee'), ank: at(j.lAnk, 'lAnk'), foot: footOf(j.lFoot) },
      { hip: [sgn * (pv[0] - 100 + hipW * 0.62), hipY, 0], knee: at(j.rKnee, 'rKnee'), ank: at(j.rAnk, 'rAnk'), foot: footOf(j.rFoot) },
    ];
    parts.torso = {
      shoulderC: [(shL[0] + shR[0]) / 2, (shL[1] + shR[1]) / 2, (shL[2] + shR[2]) / 2],
      shoulderHalf: Math.abs(shL[0] - shR[0]) / 2,
      pelvis: [sgn * (pv[0] - 100), GROUND - pv[1], 0],
      lat: j.lat || 0, waist: j.waist || 16, hip: hipW,
      chestDepth: female ? 11 : 13,
      glute: j.glute || 0, arch: 0, lean, tilt: sgn * (j.tilt || 0),
    };
    const hd = j.head;
    parts.head = { p: [sgn * (hd.x - 100), GROUND - hd.y, depth('head') + lean * 1.6], yaw: hd.dir === 'three' ? 25 : 0, roll: sgn * (hd.tilt || 0) };
    parts.refYaw = view === 'back' ? 180 : 0;
    parts.markMap = ([x, y]) => [sgn * (x - 100), GROUND - y, view === 'back' ? -20 : 20];
  }
  parts.female = female;
  parts.outfit = pose.outfit || (female ? 'bikini' : 'trunks');
  return parts;
};
