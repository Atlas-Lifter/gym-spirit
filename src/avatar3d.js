import * as THREE from 'three';
import { buildPose3D } from './pose3d.js';
import { AVATAR_SKIN_TONES, AVATAR_EYE_COLORS, LEGACY_SKIN } from './realAvatar.jsx';

// 프로필 아바타처럼 사실적인 3D 포징 모델.
// 조각 몸통 위에 근육 덩어리(가슴·복근·광배·삼각근·이두·대퇴사두 등)를 피부 재질로 겹쳐 해부학적 굴곡을 만들고,
// 얼굴(눈·눈꺼풀·코·입술·귀)과 헤어스타일, 손가락이 있는 손, 발가락이 있는 발을 붙인다.

export const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
export const UNIT_SPHERE = new THREE.SphereGeometry(1, 36, 24);
const UP = new THREE.Vector3(0, 1, 0);
const FRONT = new THREE.Vector3(0, 0, 1);

const toRgb = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a, b, t) => { const x = toRgb(a), y = toRgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerpProfile = (pts, t) => {
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, a0] = pts[i - 1], [t1, a1] = pts[i];
      return a0 + (a1 - a0) * smooth((t - t0) / ((t1 - t0) || 1));
    }
  }
  return pts[pts.length - 1][1];
};

const place = (mesh, p, quat, scale) => {
  mesh.position.copy(p);
  if (quat) mesh.quaternion.copy(quat);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
const sphere = (mat, p, s, quat) => place(new THREE.Mesh(UNIT_SPHERE, mat), p, quat, s);
const between = (a, b, r, mat, stretch = 1.08) => {
  const A = V(a), B = V(b);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, B.clone().sub(A).normalize());
  return sphere(mat, A.clone().add(B).multiplyScalar(0.5), [r, (A.distanceTo(B) / 2) * stretch, r], q);
};
const capsule = (mat, a, b, r) => {
  const A = a.clone(), B = b.clone();
  const len = Math.max(0.01, A.distanceTo(B));
  const q = new THREE.Quaternion().setFromUnitVectors(UP, B.clone().sub(A).normalize());
  // 손가락·포니테일처럼 끝이 둥근 막대 (반지름이 달라 매번 형상을 만든다)
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);
  m.position.copy(A.add(B).multiplyScalar(0.5));
  m.quaternion.copy(q);
  m.castShadow = true;
  return m;
};
// 축(axis)·앞(fwd)·옆(side) 기준틀에서 회전
const frameQuat = (side, axis, fwd) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, axis, fwd));
const limbFrame = (A, B, ref = FRONT) => {
  const axis = B.clone().sub(A).normalize();
  let fwd = ref.clone().sub(axis.clone().multiplyScalar(ref.dot(axis)));
  if (fwd.lengthSq() < 0.01) fwd = new THREE.Vector3(0, 1, 0).sub(axis.clone().multiplyScalar(axis.y));
  fwd.normalize();
  const side = new THREE.Vector3().crossVectors(axis, fwd).normalize();
  return { axis, fwd, side, len: A.distanceTo(B), q: frameQuat(side, axis, fwd) };
};
// 팔다리 위 근육 덩어리: t(위치), f/s(앞·옆 방향 오프셋), 반지름(옆, 길이, 앞)
const belly = (mat, A, B, fr, t, f, s, r) => {
  const p = A.clone().lerp(B, t).add(fr.fwd.clone().multiplyScalar(f)).add(fr.side.clone().multiplyScalar(s));
  return sphere(mat, p, [r[0], r[1], r[2]], fr.q);
};

// ── 몸통 ────────────────────────────────────────────────────
const torsoProfile = (T, female) => {
  const sh = T.shoulderHalf;
  const lat = Math.max(T.waist + 3, sh - (female ? 6 : 4) + T.lat * 0.45);
  return {
    bottom: T.pelvis[1] - 18, top: T.shoulderC[1] + 5,
    W: [[0, T.hip * 0.62], [0.1, T.hip * 0.96], [0.2, T.hip], [0.34, (T.hip + T.waist) / 2 + 0.5], [0.46, T.waist + 1], [0.6, (T.waist + lat) / 2 + 1.5], [0.72, lat], [0.84, sh - 1.5], [0.92, sh - 3.5], [0.965, sh - (female ? 9 : 10)], [0.99, female ? 7 : 9.5], [1, female ? 6 : 8.5]],
    D: [[0, 7], [0.12, (female ? 10.5 : 10) + T.glute * 0.18], [0.24, (female ? 10 : 10.5) + T.glute * 0.1], [0.42, female ? 8.6 : 10], [0.62, female ? 9.4 : 10.4], [0.8, T.chestDepth], [0.93, T.chestDepth - 2], [1, female ? 5.6 : 7]],
    Z: [[0, -1], [0.12, -T.glute * 0.25 - T.arch * 0.15], [0.3, -T.glute * 0.08 + T.arch * 0.1], [0.5, 0.5], [0.75, T.chestDepth * 0.12 + T.lean * 0.6], [1, T.lean * 1.2 - 1]],
  };
};
// 높이 t(0=사타구니, 1=목), 둘레 각도 th(0=앞 가운데, +는 선수의 왼쪽)에서 몸통 표면 점
const torsoPoint = (T, female, twistDeg, t, th, grow = 0) => {
  const pr = torsoProfile(T, female);
  const w = lerpProfile(pr.W, t) + grow, d = lerpProfile(pr.D, t) + grow;
  const X = Math.sin(th) * w, Zp = Math.cos(th) * d + lerpProfile(pr.Z, t);
  const pc = T.pelvis, sc = T.shoulderC;
  const cx = pc[0] + (sc[0] - pc[0]) * smooth(clamp01((t - 0.3) / 0.6));
  const cz = pc[2] + (sc[2] - pc[2]) * t;
  const tw = (twistDeg * Math.PI / 180) * smooth(clamp01((t - 0.45) / 0.45));
  const tilt = (T.tilt || 0) * Math.PI / 180 * (1 - smooth(clamp01(t / 0.45)));
  const rx = X * Math.cos(tw) + Zp * Math.sin(tw);
  const rz = -X * Math.sin(tw) + Zp * Math.cos(tw);
  const Y = pr.bottom + (pr.top - pr.bottom) * t;
  return new THREE.Vector3(cx + rx * Math.cos(tilt), Y + rx * Math.sin(tilt), cz + rz);
};
const buildTorsoMesh = (T, female, twistDeg, mat, tRange = [0, 1], grow = 0) => {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 48, 56, false);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = tRange[0] + (tRange[1] - tRange[0]) * (y + 0.5);
    const rad = Math.hypot(x, z);
    const th = Math.atan2(x, z);
    const p = rad < 1e-4 ? torsoPoint(T, female, twistDeg, t, 0, -100) : torsoPoint(T, female, twistDeg, t, th, grow);
    if (rad < 1e-4) {
      // 위·아래 뚜껑 가운데 점은 중심축에
      const a = torsoPoint(T, female, twistDeg, t, 0, grow), b = torsoPoint(T, female, twistDeg, t, Math.PI, grow);
      p.copy(a.add(b).multiplyScalar(0.5));
    }
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
// 몸통 표면에 붙는 근육 (표면 법선 방향으로 납작한 타원체)
const torsoMuscle = (mat, T, female, tw, t, th, r, inset = 1) => {
  const p = torsoPoint(T, female, tw, t, th);
  const n = torsoPoint(T, female, tw, t, th, 1).sub(p).normalize();
  const tan = new THREE.Vector3().crossVectors(UP, n).normalize();
  const up = new THREE.Vector3().crossVectors(n, tan).normalize();
  return sphere(mat, p.sub(n.clone().multiplyScalar(r[2] * inset * 0.55)), r, frameQuat(tan, up, n));
};

// ── 손 ──────────────────────────────────────────────────────
const buildHand = (type, el, wr, mat, outwardSign) => {
  const g = new THREE.Group();
  if (!type || type === 'hidden') return g;
  const E = V(el), W = V(wr);
  const dir = W.clone().sub(E).normalize();
  // 손바닥이 몸 쪽(편 손) 또는 앞(openUp)을 보게 하는 기준틀
  let n0 = type === 'openUp' ? FRONT.clone() : new THREE.Vector3(-outwardSign, 0, 0);
  n0.sub(dir.clone().multiplyScalar(n0.dot(dir)));
  if (n0.lengthSq() < 0.01) n0 = FRONT.clone().sub(dir.clone().multiplyScalar(dir.z));
  const n = n0.normalize();
  let s = new THREE.Vector3().crossVectors(dir, n).normalize();
  if (s.dot(FRONT) < 0 && type !== 'openUp') s.negate(); // 엄지는 앞쪽
  const q = frameQuat(s, dir, n);
  if (type === 'fist' || type === 'grip') {
    g.add(sphere(mat, W.clone().add(dir.clone().multiplyScalar(3.6)), [3.6, 3.9, 3], q));
    [-1.8, -0.6, 0.6, 1.8].forEach((o, i) => g.add(sphere(mat, W.clone().add(dir.clone().multiplyScalar(6.6 - Math.abs(o) * 0.3)).add(s.clone().multiplyScalar(o)).add(n.clone().multiplyScalar(0.6)), [1.05, 1.25, 1.35 - i * 0.02], q)));
    g.add(capsule(mat, W.clone().add(dir.clone().multiplyScalar(3)).add(s.clone().multiplyScalar(2.8)).add(n.clone().multiplyScalar(1.2)), W.clone().add(dir.clone().multiplyScalar(5.6)).add(s.clone().multiplyScalar(0.8)).add(n.clone().multiplyScalar(2.6)), 0.95));
    return g;
  }
  // 편 손: 손바닥 + 모은 네 손가락 + 엄지
  g.add(sphere(mat, W.clone().add(dir.clone().multiplyScalar(4.2)), [3.3, 4.2, 1.45], q));
  [[-1.65, 5.2], [-0.55, 6.2], [0.55, 6], [1.6, 4.8]].forEach(([o, len]) => {
    const a = W.clone().add(dir.clone().multiplyScalar(7.6)).add(s.clone().multiplyScalar(o));
    g.add(capsule(mat, a, a.clone().add(dir.clone().multiplyScalar(len - 1.4)).add(n.clone().multiplyScalar(0.5)), 0.72));
  });
  const ta = W.clone().add(dir.clone().multiplyScalar(2.4)).add(s.clone().multiplyScalar(2.6)).add(n.clone().multiplyScalar(0.6));
  g.add(capsule(mat, ta, ta.clone().add(dir.clone().multiplyScalar(3.4)).add(s.clone().multiplyScalar(1.2)).add(n.clone().multiplyScalar(0.8)), 0.85));
  return g;
};

// ── 발 ──────────────────────────────────────────────────────
const buildFoot = (ank, foot, mat, shoeMat, female) => {
  const g = new THREE.Group();
  const A = V(ank);
  const d = new THREE.Vector3(foot.dir[0], 0, foot.dir[1]).normalize();
  const yaw = Math.atan2(d.x, d.z);
  const pitch = foot.toe ? 0.72 : female ? 0.42 : 0;
  const frame = new THREE.Group();
  frame.position.copy(A);
  frame.rotation.set(0, yaw, 0, 'YXZ');
  g.add(frame);
  const inner = new THREE.Group();
  inner.rotation.x = pitch;
  inner.position.y = female || foot.toe ? -4 : -7;
  frame.add(inner);
  const add = (m) => { inner.add(m); return m; };
  if (female) {
    // 하이힐
    add(sphere(shoeMat, new THREE.Vector3(0, -2.6, 5), [3.7, 2.2, 8.6]));
    const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.5, 9.5, 12), shoeMat);
    heel.position.set(0, -7.4, -2.6);
    heel.rotation.x = -pitch;
    heel.castShadow = true;
    inner.add(heel);
    add(sphere(mat, new THREE.Vector3(0, -0.6, 4), [3.2, 2.2, 7.4]));
  } else {
    add(sphere(mat, new THREE.Vector3(0, -2.4, 4.6), [3.8, 2.6, 8.4]));
    add(sphere(mat, new THREE.Vector3(0, -2.2, -2), [3, 3, 3.2]));
    // 엄지발가락은 몸 안쪽에
    const side = Math.sign(A.x) || 1;
    [1.15, 0.95, 0.9, 0.85, 0.8].forEach((r, i) => add(sphere(mat, new THREE.Vector3(-side * 2.4 + side * i * 1.15, -3.6, 12 - i * 0.45), [r, r * 0.85, r * 1.15])));
  }
  return g;
};

// ── 머리 ────────────────────────────────────────────────────
const buildHead = (h, M, female, look) => {
  const g = new THREE.Group();
  g.position.copy(V(h.p));
  g.rotation.set(0, (h.yaw || 0) * Math.PI / 180, -(h.roll || 0) * Math.PI / 180, 'YXZ');
  const P3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const add = (m) => { g.add(m); return m; };
  const sk = M.head;
  add(sphere(sk, P3(0, 0.4, -0.4), female ? [10.2, 12.8, 11] : [10.8, 13.2, 11.6]));
  add(sphere(sk, P3(0, -8.2, 2.6), female ? [7.2, 5.6, 7] : [8.4, 6.4, 7.8]));
  add(sphere(sk, P3(0, -11.8, 6.4), female ? [2.2, 1.8, 2] : [2.6, 2, 2.2]));
  [-1, 1].forEach(s => add(sphere(sk, P3(s * 6, -2.6, 7.8), [3.4, 2.6, 3])));
  if (!female) add(sphere(sk, P3(0, 3.9, 8.8), [7.6, 2, 3]));
  // 눈: 흰자 + 홍채 + 동공 + 하이라이트 + 윗눈꺼풀
  [-1, 1].forEach(s => {
    const ex = s * 4.05;
    add(sphere(M.eyeWhite, P3(ex, 0.9, 9.4), [1.75, 1.45, 1.6]));
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), M.iris);
    iris.position.set(ex, 0.85, 11.02);
    g.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), M.pupil);
    pupil.position.set(ex, 0.85, 11.04);
    g.add(pupil);
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), M.eyeWhite);
    hl.position.set(ex - 0.3, 1.2, 11.06);
    g.add(hl);
    add(sphere(sk, P3(ex, 1.95, 9.75), [2.05, 1.05, 1.75]));
    add(sphere(M.lash, P3(ex, 1.35, 11.05), [1.9, female ? 0.28 : 0.18, 0.3]));
    const brow = add(sphere(M.brow, P3(s * 4.2, 4.15, 10.4), female ? [2.6, 0.38, 0.6] : [2.9, 0.62, 0.8]));
    brow.rotation.z = s * (look === 'angry' ? 0.2 : -0.1);
    // 귀
    add(sphere(sk, P3(s * (female ? 10 : 10.6), -0.6, 0.6), [1.35, 3.2, 2.1]));
    add(sphere(M.earIn, P3(s * (female ? 10.5 : 11.1), -0.6, 0.9), [0.5, 2, 1.1]));
  });
  // 코
  add(sphere(sk, P3(0, -0.8, 11), [1.15, 3.4, 1.4]));
  add(sphere(sk, P3(0, -3.7, 12), [1.7, 1.45, 1.6]));
  [-1, 1].forEach(s => add(sphere(sk, P3(s * 1.55, -4, 11), [1.05, 0.95, 1])));
  // 입술
  add(sphere(M.lipTop, P3(0, -6.7, 10.2), [female ? 2.7 : 2.9, female ? 0.75 : 0.6, 1]));
  add(sphere(M.lip, P3(0, -7.75, 10), [female ? 2.5 : 2.6, female ? 0.95 : 0.75, 1.05]));
  return g;
};

// 헤어스타일 (프로필 설정을 따른다)
const buildHair = (h, style, M, female) => {
  const g = new THREE.Group();
  g.position.copy(V(h.p));
  g.rotation.set(0, (h.yaw || 0) * Math.PI / 180, -(h.roll || 0) * Math.PI / 180, 'YXZ');
  const add = (m) => { g.add(m); return m; };
  const P3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const capGeo = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const cap = (mat, s, y = 2.4, tilt = -0.6) => {
    const m = new THREE.Mesh(capGeo, mat);
    m.scale.set(s[0], s[1], s[2]);
    m.position.set(0, y, -0.6);
    m.rotation.x = tilt;
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const base = female ? [10.9, 12, 12] : [11.5, 11.4, 12.5];
  switch (style) {
    case 'none':
      cap(M.stubble, [11, 10.6, 12]);
      break;
    case 'short':
      cap(M.hair, [11.15, 10.6, 12.1], 2.6);
      break;
    case 'spiky':
      cap(M.hair, base);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2, 6, 10), M.hair);
        cone.position.set(Math.sin(a) * 5.2, 12, Math.cos(a) * 5.2 - 1);
        cone.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
        cone.castShadow = true;
        g.add(cone);
      }
      break;
    case 'long':
      cap(M.hair, base);
      add(sphere(M.hair, P3(0, -12, -6.6), [10.6, 19, 6]));
      [-1, 1].forEach(s => add(sphere(M.hair, P3(s * 9.6, -8, -0.6), [2.8, 13, 4.6])));
      break;
    case 'ponytail':
      cap(M.hair, base, 2.4, -0.55);
      add(sphere(M.accent, P3(0, 3, -12.2), [2.2, 2.2, 2.2]));
      add(capsule(M.hair, P3(0, 2, -13.2), P3(0, -14, -14.6), 3.1));
      break;
    case 'bob':
      cap(M.hair, base);
      add(sphere(M.hair, P3(0, -3.6, -4.6), [11.8, 10.8, 7]));
      [-1, 1].forEach(s => add(sphere(M.hair, P3(s * 9.8, -4.6, 0.8), [2.8, 8.4, 6])));
      break;
    case 'bun':
      cap(M.hair, base, 2.4, -0.55);
      add(sphere(M.hair, P3(0, 11, -7.6), [5, 4.6, 5]));
      break;
    case 'classic':
    default:
      cap(M.hair, base);
      add(sphere(M.hair, P3(1.4, 9.6, 7.6), [7, 2.6, 3.6])).rotation.z = -0.15;
      break;
  }
  return g;
};

// ── 전체 모델 ──────────────────────────────────────────────
export const buildFigure = (pose, setGroups, focusGroups, profile) => {
  const P = buildPose3D(pose, setGroups);
  const female = P.female;
  const sameGender = (profile?.gender || 'male') === (female ? 'female' : 'male');
  const skinHex = LEGACY_SKIN[profile?.skinColor] || profile?.skinColor || AVATAR_SKIN_TONES[2];
  const eyeHex = profile?.eyeColor || AVATAR_EYE_COLORS[0];
  const hairHex = (sameGender && profile?.hairColor) || (female ? '#3f2a1d' : '#1f1a17');
  const hairStyle = (sameGender && profile?.hairStyle) || (female ? 'long' : 'classic');
  const look = (sameGender && profile?.faceExpression) || 'normal';
  const outfitHex = P.outfit === 'board' ? '#334155' : P.outfit === 'trunks' ? '#111827' : '#db2777';

  const skinMat = (group) => {
    const focused = focusGroups.includes(group);
    const isSet = setGroups.includes(group) || focused;
    return new THREE.MeshPhysicalMaterial({
      color: focused ? mixHex(skinHex, '#3d6dff', 0.5) : skinHex,
      roughness: 0.48, metalness: 0, sheen: 0.45, sheenRoughness: 0.55,
      sheenColor: new THREE.Color(mixHex(skinHex, '#ff8a70', 0.35)), clearcoat: 0.12, clearcoatRoughness: 0.5,
      emissive: new THREE.Color(focused ? '#2348c8' : '#000000'), emissiveIntensity: focused ? 0.28 : 0,
      transparent: !isSet, opacity: isSet ? 1 : 0.3, depthWrite: isSet,
    });
  };
  const plain = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...opts });
  const M = {
    torso: skinMat('torso'), arms: skinMat('arms'), hands: skinMat('hands'), legs: skinMat('legs'), feet: skinMat('feet'), head: skinMat('head'), pelvis: skinMat('pelvis'),
    outfit: new THREE.MeshPhysicalMaterial({ color: outfitHex, roughness: 0.42, sheen: 0.6, sheenColor: new THREE.Color(mixHex(outfitHex, '#ffffff', 0.3)), transparent: !setGroups.includes('pelvis'), opacity: setGroups.includes('pelvis') ? 1 : 0.45 }),
    hair: new THREE.MeshPhysicalMaterial({ color: hairHex, roughness: 0.42, sheen: 1, sheenColor: new THREE.Color(mixHex(hairHex, '#ffffff', 0.35)), sheenRoughness: 0.35 }),
    stubble: plain(hairHex, { transparent: true, opacity: 0.4, roughness: 0.9 }),
    brow: plain(mixHex(hairHex, '#120c08', 0.3), { roughness: 0.9 }),
    lash: plain('#1b130e', { roughness: 0.9 }),
    eyeWhite: plain('#f4efea', { roughness: 0.25 }),
    iris: plain(eyeHex, { roughness: 0.3 }),
    pupil: plain('#0b0807', { roughness: 0.2 }),
    earIn: plain(mixHex(skinHex, '#7a3a2c', 0.35), { roughness: 0.7 }),
    lip: plain(mixHex(skinHex, female ? '#b2384a' : '#9b4a40', female ? 0.5 : 0.35), { roughness: 0.35 }),
    lipTop: plain(mixHex(skinHex, female ? '#8f2a3a' : '#7d3a32', female ? 0.5 : 0.38), { roughness: 0.4 }),
    accent: plain('#ef4444'),
    shoe: new THREE.MeshPhysicalMaterial({ color: '#f1e4dc', roughness: 0.25, clearcoat: 0.8, transparent: !setGroups.includes('feet'), opacity: setGroups.includes('feet') ? 1 : 0.4 }),
  };
  const def = female ? 0.55 : 1; // 근육 선명도
  const root = new THREE.Group();
  const add = (m) => { root.add(m); return m; };

  // ── 몸통과 근육 ──
  const T = P.torso, tw = P.twist || 0;
  add(buildTorsoMesh(T, female, tw, M.torso));
  add(buildTorsoMesh(T, female, tw, M.outfit, [0, female ? 0.17 : 0.2], 0.55));
  add(buildTorsoMesh(T, female, tw, new THREE.MeshStandardMaterial({ color: mixHex(outfitHex, '#000000', 0.35), roughness: 0.6, transparent: M.outfit.transparent, opacity: M.outfit.opacity }), [female ? 0.155 : 0.18, female ? 0.172 : 0.2], 0.85));
  const tm = (t, th, r, inset, mat = M.torso) => add(torsoMuscle(mat, T, female, tw, t, th, r, inset));
  const sh = T.shoulderHalf;
  if (!female) {
    [-1, 1].forEach(s => tm(0.81, s * 0.36, [sh * 0.44, 7, 3.4 * def], 1.25));         // 대흉근 (넓고 납작하게)
    [0.55, 0.47, 0.39].forEach(t => [-1, 1].forEach(s => tm(t, s * 0.17, [3.5, 3.6, 1.7 * def], 0.7))); // 복근
    [-1, 1].forEach(s => tm(0.31, s * 0.15, [3.2, 3.8, 1.4 * def], 0.7));
  } else {
    [0.52, 0.44].forEach(t => [-1, 1].forEach(s => tm(t, s * 0.16, [3, 3, 0.9], 0.7)));
    [-1, 1].forEach(s => tm(0.8, s * 0.36, [5.6, 5, 4.4], 0.35, M.outfit));               // 비키니 상의
  }
  [-1, 1].forEach(s => {
    tm(0.43, s * 0.95, [4, 9, 2.2 * def], 0.8);       // 외복사근
    [0.61, 0.66].forEach(t => tm(t, s * 1.2, [2.8, 1.8, 0.8 * def], 1.1));           // 전거근 (은은하게)
    tm(0.66, s * 2.02, [6.6 + T.lat * 0.2, 13, 3.4 * def], 0.9); // 광배근
    tm(0.95, s * 2.7, [7.6, 7, 3 * def], 0.8);        // 승모 (등쪽)
    tm(0.8, s * 2.5, [5, 5, 2.4 * def], 0.8);         // 능형·대원근
    tm(0.38, s * 2.98, [2.8, 10, 2.2 * def], 0.8);    // 척추기립근
    tm(0.11, s * 2.6, [7.4 + T.glute * 0.3, 7.6 + T.glute * 0.2, 3.6 + T.glute * 0.35], 1.25, M.outfit); // 둔근(하의로 덮임)
  });

  // ── 목·머리·머리카락 ──
  const sc = V(T.shoulderC), H = P.head;
  add(between([H.p[0], H.p[1] - 7, H.p[2] - 1.5], [sc.x, sc.y - 4, sc.z - 1], female ? 5.4 : 8, M.head, 1.12)); // 목은 몸통 안까지 이어지게
  [-1, 1].forEach(s => add(between([H.p[0] + s * 4, H.p[1] - 10, H.p[2] + 3], [sc.x + s * 2.4, sc.y - 1, sc.z + 5], female ? 1.3 : 1.9, M.head, 1.0))); // 흉쇄유돌근
  add(buildHead(H, M, female, look));
  add(buildHair(H, hairStyle, M, female));

  // ── 팔 ──
  P.arms.forEach(a => {
    const S = V(a.sh), E = V(a.el), Wr = V(a.wr);
    const outward = new THREE.Vector3(S.x - sc.x, 0, S.z - sc.z);
    const outSign = Math.sign(S.x - sc.x) || 1;
    if (outward.lengthSq() < 0.01) outward.set(outSign, 0, 0);
    outward.normalize();
    const ur = female ? 5.2 : 7, fr = female ? 4.2 : 5.4;
    // 삼각근 3갈래
    add(sphere(M.arms, S.clone().add(new THREE.Vector3(0, 0.6, 0)), [female ? 6.4 : 8.4, female ? 6.8 : 8.8, female ? 6.4 : 8.4]));
    add(sphere(M.arms, S.clone().add(FRONT.clone().multiplyScalar(3.4)).add(outward.clone().multiplyScalar(1.2)).add(new THREE.Vector3(0, -2.4, 0)), [4.4 * (0.6 + def * 0.4), 6, 4.2 * (0.6 + def * 0.4)]));
    add(sphere(M.arms, S.clone().add(FRONT.clone().multiplyScalar(-3.4)).add(outward.clone().multiplyScalar(1.2)).add(new THREE.Vector3(0, -2.4, 0)), [4.2 * (0.6 + def * 0.4), 6, 4 * (0.6 + def * 0.4)]));
    const uf = limbFrame(S, E);
    add(between(a.sh, a.el, ur, M.arms, 1.06));
    add(belly(M.arms, S, E, uf, 0.56, ur * 0.42, 0, [ur * 0.66, uf.len * 0.32, ur * 0.6 * (0.7 + def * 0.3)]));  // 이두
    add(belly(M.arms, S, E, uf, 0.42, -ur * 0.44, 0, [ur * 0.72, uf.len * 0.4, ur * 0.6 * (0.7 + def * 0.3)])); // 삼두
    add(sphere(M.arms, E, [fr * 0.95, fr * 0.95, fr * 0.95]));
    const ff = limbFrame(E, Wr);
    add(between(a.el, a.wr, fr, M.arms, 1.06));
    add(belly(M.arms, E, Wr, ff, 0.28, fr * 0.3, outSign * fr * 0.25, [fr * 0.72, ff.len * 0.34, fr * 0.66]));    // 전완근
    // 우먼스 피지크 더블 바이셉스는 손바닥이 앞을 본다
    const palmsFront = female && a.hand === 'open' && /Double Biceps/.test(pose.en || '');
    add(buildHand(palmsFront ? 'openUp' : a.hand, a.el, a.wr, M.hands, outSign));
  });

  // ── 다리 ──
  P.legs.forEach(l => {
    const Hp = V(l.hip), K = V(l.knee), A = V(l.ank);
    const outSign = Math.sign(Hp.x - T.pelvis[0]) || 1;
    const tr = female ? 9.2 : 10.2, cr = female ? 5.9 : 6.7;
    const tf = limbFrame(Hp, K);
    add(between(l.hip, l.knee, tr, M.legs, 1.1));
    const sideSign = tf.side.x * outSign >= 0 ? 1 : -1;
    add(belly(M.legs, Hp, K, tf, 0.45, tr * 0.5, 0, [tr * 0.5, tf.len * 0.36, tr * 0.45 * (0.7 + def * 0.3)]));                 // 대퇴직근
    add(belly(M.legs, Hp, K, tf, 0.52, tr * 0.12, sideSign * tr * 0.5, [tr * 0.5, tf.len * 0.4, tr * 0.5 * (0.7 + def * 0.3)])); // 외측광근
    add(belly(M.legs, Hp, K, tf, 0.8, tr * 0.32, -sideSign * tr * 0.42, [tr * 0.46, tf.len * 0.18, tr * 0.42 * (0.7 + def * 0.3)])); // 내측광근(눈물방울)
    add(belly(M.legs, Hp, K, tf, 0.5, -tr * 0.5, 0, [tr * 0.6, tf.len * 0.4, tr * 0.5]));                                          // 햄스트링
    add(sphere(M.legs, K, [6, 6, 6]));
    const cf = limbFrame(K, A);
    add(between(l.knee, l.ank, cr, M.legs, 1.08));
    [-1, 1].forEach(s => add(belly(M.legs, K, A, cf, 0.28, -cr * 0.48, s * cr * 0.3, [cr * 0.5, cf.len * 0.27, cr * 0.55 * (0.75 + def * 0.25)]))); // 비복근
    add(belly(M.legs, K, A, cf, 0.36, cr * 0.42, sideSign * cr * 0.2, [cr * 0.34, cf.len * 0.32, cr * 0.32]));          // 전경골근
    if (P.outfit === 'board') {
      add(between(l.hip, Hp.clone().lerp(K, 0.85).toArray(), tr + 2.2, M.outfit, 1.06));
    }
    add(buildFoot(l.ank, l.foot, M.feet, M.shoe, female));
  });

  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root, P };
};
