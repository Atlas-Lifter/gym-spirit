import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildFigure, V, UNIT_SPHERE } from './avatar3d.js';
import { GROUPS } from './posingFigure.jsx';

// 포즈 마네킹을 3D로 그리고 드래그로 360° 자유 회전(좌우·위아래 동시)한다.
// 모델 자체를 쿼터니언으로 돌리기 때문에 위아래로 넘겨도 뒤집히거나 막히지 않는다.

const MARK = '#e11d48';

// 표시(화살표·각도·점선)를 3D 선으로
const buildMarks = (marks, map) => {
  const g = new THREE.Group();
  const labels = [];
  const red = new THREE.MeshBasicMaterial({ color: MARK, depthTest: false, transparent: true });
  const tube = (curve, r = 0.85) => { const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 8), red); m.renderOrder = 10; return m; };
  marks.forEach(m => {
    if (m.arrow) {
      const [x1, y1, x2, y2, c = 0] = m.arrow;
      const a = V(map([x1, y1])), b = V(map([x2, y2]));
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir2 = b.clone().sub(a);
      // 그림 평면 안에서 화살표에 수직인 방향으로 휘게 한다
      const o = V(map([0, 0]));
      const planeN = new THREE.Vector3().crossVectors(V(map([1, 0])).sub(o), V(map([0, 1])).sub(o)).normalize();
      const n = new THREE.Vector3().crossVectors(planeN, dir2).normalize();
      const ctrl = mid.clone().add(n.multiplyScalar(c));
      const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
      g.add(tube(curve));
      const tan = curve.getTangent(1);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6, 12), red);
      cone.position.copy(b);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
      cone.renderOrder = 10;
      g.add(cone);
    } else if (m.line) {
      const [x1, y1, x2, y2] = m.line;
      const geo = new THREE.BufferGeometry().setFromPoints([V(map([x1, y1])), V(map([x2, y2]))]);
      const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: MARK, dashSize: 3, gapSize: 2, depthTest: false }));
      line.computeLineDistances();
      line.renderOrder = 10;
      g.add(line);
    } else if (m.angle) {
      const [cx, cy, r, a0, a1, text] = m.angle;
      const pts = [];
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = (a0 + (a1 - a0) * (i / steps)) * Math.PI / 180;
        pts.push(V(map([cx + r * Math.cos(t), cy + r * Math.sin(t)])));
      }
      g.add(tube(new THREE.CatmullRomCurve3(pts), 0.7));
      [a0, a1].forEach(aa => {
        const t = aa * Math.PI / 180;
        const geo = new THREE.BufferGeometry().setFromPoints([V(map([cx, cy])), V(map([cx + (r + 4) * Math.cos(t), cy + (r + 4) * Math.sin(t)]))]);
        const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: MARK, dashSize: 2, gapSize: 1.5, depthTest: false }));
        line.computeLineDistances();
        line.renderOrder = 10;
        g.add(line);
      });
      if (text) {
        const mid = ((a0 + a1) / 2) * Math.PI / 180;
        labels.push({ p: V(map([cx + (r + 10) * Math.cos(mid), cy + (r + 10) * Math.sin(mid)])), text });
      }
    } else if (m.label) {
      const [x, y, text] = m.label;
      labels.push({ p: V(map([x, y])), text });
    }
  });
  return { group: g, labels };
};

export const Posing3D = ({ pose, setGroups = GROUPS, focusGroups = [], marks = [], profile, initialDist = 760, lookY = 0 }) => {
  const wrapRef = useRef(null);
  const labelRef = useRef(null);
  const stateRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [auto, setAuto] = useState(false);

  // 장면은 한 번만 만든다
  useEffect(() => {
    const wrap = wrapRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      setFailed(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 10, 3000);
    camera.position.set(0, lookY, initialDist);
    camera.lookAt(0, lookY, 0);
    // 실내 반사광(환경맵)으로 피부와 머리카락에 자연스러운 하이라이트
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight('#ffffff', '#aab4c3', 0.55));
    const key = new THREE.DirectionalLight('#fff6ee', 1.7);
    key.position.set(-160, 260, 260);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -180, right: 180, top: 220, bottom: -220, near: 10, far: 900 });
    key.shadow.bias = -0.0008;
    key.shadow.radius = 4;
    scene.add(key);
    const rim = new THREE.DirectionalLight('#dbe6ff', 1.1);
    rim.position.set(220, 120, -260);
    scene.add(rim);
    const fill = new THREE.DirectionalLight('#fff4e6', 0.45);
    fill.position.set(200, -40, 200);
    scene.add(fill);

    // 모델과 바닥을 한 그룹으로 묶어 같이 돌린다
    const model = new THREE.Group();
    scene.add(model);
    const holder = new THREE.Group();
    holder.position.y = -140;
    model.add(holder);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(120, 64), new THREE.ShadowMaterial({ opacity: 0.22 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    holder.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(78, 80, 64), new THREE.MeshBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    holder.add(ring);
    // 앞쪽 표시(심사위원 방향)
    const front = new THREE.Mesh(new THREE.ConeGeometry(4, 9, 3), new THREE.MeshBasicMaterial({ color: '#4f7dff' }));
    front.rotation.x = Math.PI / 2;
    front.position.set(0, 0.5, 92);
    holder.add(front);

    const st = { renderer, scene, camera, model, holder, figure: null, marks: null, labels: [], dist: initialDist, dirty: true, vel: [0, 0], auto: false, raf: 0 };
    stateRef.current = st;

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = `${w}px`;
      renderer.domElement.style.height = `${h}px`;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      st.dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // 드래그: 좌우는 세로축, 위아래는 화면 가로축으로 모델을 돌린다(동시에 가능)
    const rotate = (dx, dy) => {
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx);
      const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy);
      model.quaternion.premultiply(qy).premultiply(qx).normalize();
      st.dirty = true;
    };
    st.rotate = rotate;
    const pointers = new Map();
    let last = null, pinch = null;
    const onDown = (e) => {
      renderer.domElement.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      last = [e.clientX, e.clientY, performance.now()];
      st.vel = [0, 0];
      if (pointers.size === 2) { const [p1, p2] = [...pointers.values()]; pinch = { d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), dist: st.dist }; }
    };
    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2 && pinch) {
        const [p1, p2] = [...pointers.values()];
        const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
        st.dist = Math.max(160, Math.min(1100, pinch.dist * (pinch.d / (d || 1))));
        st.dirty = true;
        return;
      }
      if (!last) return;
      const dx = (e.clientX - last[0]) * 0.011, dy = (e.clientY - last[1]) * 0.011;
      const now = performance.now();
      const dt = Math.max(1, now - last[2]);
      st.vel = [dx / dt * 16, dy / dt * 16];
      last = [e.clientX, e.clientY, now];
      rotate(dx, dy);
    };
    const onUp = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) last = null; };
    const onWheel = (e) => { e.preventDefault(); st.dist = Math.max(160, Math.min(1100, st.dist * (1 + Math.sign(e.deltaY) * 0.08))); st.dirty = true; };
    const el = renderer.domElement;
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    const tmp = new THREE.Vector3();
    const loop = () => {
      st.raf = requestAnimationFrame(loop);
      if (!last && (Math.abs(st.vel[0]) > 0.0005 || Math.abs(st.vel[1]) > 0.0005)) {
        rotate(st.vel[0], st.vel[1]);
        st.vel = [st.vel[0] * 0.92, st.vel[1] * 0.92];
      }
      if (st.auto && !last) rotate(0.012, 0);
      if (st.tween) {
        st.tween.t = Math.min(1, st.tween.t + 0.08);
        const k = 1 - Math.pow(1 - st.tween.t, 3);
        model.quaternion.copy(st.tween.from).slerp(st.tween.to, k);
        if (st.tween.t >= 1) st.tween = null;
        st.dirty = true;
      }
      if (Math.abs(camera.position.z - st.dist) > 0.5) { camera.position.z += (st.dist - camera.position.z) * 0.25; st.dirty = true; }
      if (!st.dirty) return;
      st.dirty = false;
      renderer.render(scene, camera);
      // 글자 표시는 3D 위치를 화면 좌표로 옮겨 HTML로 띄운다
      const box = labelRef.current;
      if (box) {
        const w = el.clientWidth, h = el.clientHeight;
        st.labels.forEach((lb, i) => {
          const node = box.children[i];
          if (!node) return;
          tmp.copy(lb.p);
          st.holder.localToWorld(tmp);
          tmp.project(camera);
          node.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px) translate(-50%, -50%)`;
        });
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(st.raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      scene.traverse(o => { if (o.geometry && o.geometry !== UNIT_SPHERE) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
      stateRef.current = null;
    };
  }, []);

  // 포즈·단계가 바뀌면 마네킹과 표시를 다시 만든다
  const [labels, setLabels] = useState([]);
  const refYawRef = useRef(null);
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    const disposeGroup = (g) => g && g.traverse(o => { if (o.geometry && o.geometry !== UNIT_SPHERE) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
    if (st.figure) { st.holder.remove(st.figure); disposeGroup(st.figure); }
    if (st.marks) { st.holder.remove(st.marks); disposeGroup(st.marks); }
    const { root, P } = buildFigure(pose, setGroups, focusGroups, profile);
    st.figure = root;
    st.holder.add(root);
    const mk = buildMarks(marks, P.markMap);
    st.marks = mk.group;
    st.holder.add(mk.group);
    st.labels = mk.labels;
    setLabels(mk.labels.map(l => l.text));
    // 포즈가 처음 열리면 그림과 같은 방향(정면/후면/측면)에서 시작
    const poseKey = `${pose.name}-${pose.view}-${pose.face || ''}`;
    if (refYawRef.current !== poseKey) {
      refYawRef.current = poseKey;
      st.refQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), P.refYaw * Math.PI / 180);
      st.model.quaternion.copy(st.refQ);
    }
    st.dirty = true;
  }, [pose, setGroups.join(','), focusGroups.join(','), JSON.stringify(marks), JSON.stringify(profile || {})]);

  useEffect(() => { if (stateRef.current) stateRef.current.auto = auto; }, [auto]);

  const goView = (yaw, pitch = 0) => {
    const st = stateRef.current;
    if (!st) return;
    const to = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch * Math.PI / 180)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw * Math.PI / 180));
    st.tween = { from: st.model.quaternion.clone(), to, t: 0 };
    st.vel = [0, 0];
  };
  const reset = () => { const st = stateRef.current; if (st?.refQ) { st.tween = { from: st.model.quaternion.clone(), to: st.refQ.clone(), t: 0 }; st.dist = initialDist; } };

  if (failed) return null;
  const btn = 'px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-white/90 text-slate-600 border border-slate-200 active:scale-95 transition-transform shadow-sm';
  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative flex-1 min-h-0">
      <div ref={wrapRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div ref={labelRef} className="absolute inset-0 pointer-events-none">
        {labels.map((t, i) => (
          <span key={i} className="absolute left-0 top-0 text-[11px] font-black text-[#e11d48] bg-white/95 border border-[#e11d48] rounded-md px-1.5 py-0.5 whitespace-nowrap">{t}</span>
        ))}
      </div>
      </div>
      <div className="flex flex-wrap gap-1 justify-center px-2 py-2">
        <button onClick={() => goView(0)} className={btn}>정면</button>
        <button onClick={() => goView(-90)} className={btn}>왼쪽</button>
        <button onClick={() => goView(90)} className={btn}>오른쪽</button>
        <button onClick={() => goView(180)} className={btn}>뒤</button>
        <button onClick={() => goView(0, 60)} className={btn}>위</button>
        <button onClick={() => goView(0, -50)} className={btn}>아래</button>
        <button onClick={reset} className={btn}>처음</button>
        <button onClick={() => setAuto(a => !a)} className={`${btn} ${auto ? '!bg-[#4768ff] !text-white !border-[#4768ff]' : ''}`}>{auto ? '회전 멈춤' : '자동 회전'}</button>
      </div>
    </div>
  );
};
