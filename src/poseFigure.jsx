import React from 'react';

// 운동 설명서용 마네킹 그림.
// 옆모습(side): 오른쪽(+x)을 바라보는 사람. 각도는 도(deg) 단위이며
//   - 팔다리 각도(th 허벅지, sh 정강이, ua 위팔, fa 아래팔)는 "바로 아래"를 0으로, 앞(+x)쪽으로 돌수록 +
//   - 몸통 각도(t)는 "바로 위"를 0으로, 앞(+x)쪽으로 숙일수록 +
//   - 뿌리: ankle(발목 고정, 서 있는 자세) / hip(엉덩이 고정, 눕거나 매달린 자세) / knee(무릎 고정, 무릎 꿇은 자세)
//   - gr: 어깨 기준 손 위치 [dx, dy]. 주면 팔꿈치를 역기구학으로 계산 (eb: 팔꿈치 굽는 방향 1/-1)
// 앞모습(front): 정면 사람. ua/fa는 바로 아래 0에서 바깥쪽으로 +, se는 어깨 으쓱, lg는 다리 벌림, seated는 앉은 자세.

export const FIG = { torso: 56, neck: 6, head: 11, thigh: 46, shin: 46, foot: 15, ua: 31, fa: 28, hand: 8 };
export const FLOOR = 214;

const sinD = a => Math.sin(a * Math.PI / 180);
const cosD = a => Math.cos(a * Math.PI / 180);
const dn = (p, a, l) => [p[0] + sinD(a) * l, p[1] + cosD(a) * l];
const upv = (p, a, l) => [p[0] + sinD(a) * l, p[1] - cosD(a) * l];
const add = (p, d) => [p[0] + d[0], p[1] + d[1]];
const angOf = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]) * 180 / Math.PI; // 아래 기준 각도

const ik = (s, target, l1, l2, bend) => {
  const dx = target[0] - s[0], dy = target[1] - s[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.5);
  const a = Math.atan2(dy, dx);
  const b = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const ang = a + bend * b;
  const elbow = [s[0] + Math.cos(ang) * l1, s[1] + Math.sin(ang) * l1];
  const wrist = [s[0] + Math.cos(a) * d, s[1] + Math.sin(a) * d];
  return [elbow, wrist];
};

export const solveSide = (q) => {
  const th = q.th ?? 0, sh = q.sh ?? 0, t = q.t ?? 0;
  let hip, knee, ankle;
  if (q.ankle) {
    ankle = q.ankle;
    knee = [ankle[0] - sinD(sh) * FIG.shin, ankle[1] - cosD(sh) * FIG.shin];
    hip = [knee[0] - sinD(th) * FIG.thigh, knee[1] - cosD(th) * FIG.thigh];
  } else if (q.knee) {
    knee = q.knee;
    hip = [knee[0] - sinD(th) * FIG.thigh, knee[1] - cosD(th) * FIG.thigh];
    ankle = dn(knee, sh, FIG.shin);
  } else {
    hip = q.hip;
    knee = dn(hip, th, FIG.thigh);
    ankle = dn(knee, sh, FIG.shin);
  }
  const toe = dn(ankle, q.ft ?? sh + 90, FIG.foot);
  const knee2 = dn(hip, q.th2 ?? angOf(hip, knee), FIG.thigh);
  const ankle2 = dn(knee2, q.sh2 ?? angOf(knee, ankle), FIG.shin);
  const toe2 = dn(ankle2, q.ft2 ?? (q.sh2 !== undefined ? q.sh2 + 90 : (q.ft ?? sh + 90)), FIG.foot);
  const shoulder = upv(hip, t, FIG.torso);
  const head = upv(shoulder, t + (q.hd ?? 0), FIG.neck + FIG.head);
  const arm = (gr, ua, fa, eb) => {
    if (gr) return ik(shoulder, add(shoulder, gr), FIG.ua, FIG.fa, eb ?? 1);
    const e = dn(shoulder, ua ?? 0, FIG.ua);
    return [e, dn(e, fa ?? ua ?? 0, FIG.fa)];
  };
  const [elbow, wrist] = arm(q.gr, q.ua, q.fa, q.eb);
  const [elbow2, wrist2] = (q.gr2 || q.ua2 !== undefined) ? arm(q.gr2, q.ua2, q.fa2, q.eb2 ?? q.eb) : [elbow, wrist];
  const handAng = q.hnd ?? angOf(elbow, wrist);
  const hand = dn(wrist, handAng, FIG.hand);
  return { view: 'side', hip, knee, ankle, toe, knee2, ankle2, toe2, shoulder, head, elbow, wrist, elbow2, wrist2, hand, t };
};

export const solveFront = (q) => {
  const cx = q.cx ?? 130, hipY = q.hipY ?? 118, se = q.se ?? 0, lg = q.lg ?? 4;
  const hipL = [cx - 11, hipY], hipR = [cx + 11, hipY];
  const shY = hipY - 52 - se;
  const shL = [cx - 21, shY], shR = [cx + 21, shY];
  const head = [cx, hipY - 52 - 18];
  const leg = (h, s) => {
    if (q.seated) {
      const k = [h[0] + s * sinD(lg) * 30, h[1] + 10];
      return [k, [k[0], k[1] + 44]];
    }
    const k = [h[0] + s * sinD(lg) * FIG.thigh, h[1] + cosD(lg) * FIG.thigh];
    return [k, [k[0] + s * sinD(lg) * FIG.shin, k[1] + cosD(lg) * FIG.shin]];
  };
  const [kneeL, ankleL] = leg(hipL, -1), [kneeR, ankleR] = leg(hipR, 1);
  const arm = (sh, s) => {
    const e = [sh[0] + s * sinD(q.ua ?? 6) * FIG.ua, sh[1] + cosD(q.ua ?? 6) * FIG.ua];
    const fa = q.fa ?? q.ua ?? 6;
    return [e, [e[0] + s * sinD(fa) * FIG.fa, e[1] + cosD(fa) * FIG.fa]];
  };
  const [elbowL, wristL] = arm(shL, -1), [elbowR, wristR] = arm(shR, 1);
  return { view: 'front', cx, hipY, hipL, hipR, shL, shR, head, kneeL, ankleL, kneeR, ankleR, elbowL, wristL, elbowR, wristR, seated: q.seated };
};

// ---------- 소품 ----------
const C = { line: '#64748b', body: '#b8c0cc', far: '#d6dbe3', metal: '#475569', pad: '#94a3b8', padFill: '#e2e8f0', cable: '#94a3b8', floor: '#cbd5e1', hi: '#e5484d', hi2: '#f3a29b' };

export const Plate = ({ p, r = 17 }) => (<g><circle cx={p[0]} cy={p[1]} r={r} fill={C.metal} /><circle cx={p[0]} cy={p[1]} r={r * 0.62} fill="none" stroke="#94a3b8" strokeWidth="1.2" /><circle cx={p[0]} cy={p[1]} r="2.6" fill="#e2e8f0" /></g>);
export const Dumbbell = ({ p }) => (<g><circle cx={p[0]} cy={p[1]} r="7.5" fill={C.metal} /><circle cx={p[0]} cy={p[1]} r="2.2" fill="#e2e8f0" /></g>);
export const Kettlebell = ({ p }) => (<g><path d={`M${p[0] - 6},${p[1] + 2} C${p[0] - 6},${p[1] - 8} ${p[0] + 6},${p[1] - 8} ${p[0] + 6},${p[1] + 2}`} fill="none" stroke={C.metal} strokeWidth="3" /><circle cx={p[0]} cy={p[1] + 9} r="9" fill={C.metal} /></g>);
export const Handle = ({ p }) => (<rect x={p[0] - 4} y={p[1] - 4} width="8" height="8" rx="2" fill={C.metal} />);
export const Cable = ({ from, to }) => (<g><line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={C.cable} strokeWidth="1.6" /><circle cx={to[0]} cy={to[1]} r="5" fill="#fff" stroke={C.metal} strokeWidth="2" /><Handle p={from} /></g>);
export const Column = ({ x, top = 0 }) => (<rect x={x - 5} y={top} width="10" height={FLOOR - top} rx="2" fill={C.padFill} stroke={C.pad} strokeWidth="1.2" />);
export const Box = ({ x, y, w, h }) => (<rect x={x} y={y} width={w} height={h ?? FLOOR - y} rx="2" fill={C.padFill} stroke={C.pad} strokeWidth="1.2" />);
export const PadLine = ({ a, b, w = 8 }) => (<line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.pad} strokeWidth={w} strokeLinecap="round" />);
export const Leg = ({ x, y }) => (<line x1={x} y1={y} x2={x} y2={FLOOR} stroke={C.pad} strokeWidth="3" />);
// 몸통 등쪽(혹은 배쪽)에 붙는 패드. side: 1이면 등 쪽(서 있을 때 뒤), -1이면 배 쪽
// 몸통의 등 방향 단위벡터 (서 있을 때 뒤쪽 = -x)
export const backNormal = (j) => {
  const u = [j.shoulder[0] - j.hip[0], j.shoulder[1] - j.hip[1]];
  const L = Math.hypot(u[0], u[1]);
  return { n: [u[1] / L, -u[0] / L], u: [u[0] / L, u[1] / L] };
};
export const TorsoPad = ({ j, side = 1, gap = 12, ext = 6, legs = true }) => {
  const { n, u } = backNormal(j);
  const o = [n[0] * side * gap, n[1] * side * gap];
  const a = [j.hip[0] + o[0] - u[0] * ext, j.hip[1] + o[1] - u[1] * ext];
  const b = [j.shoulder[0] + o[0] + u[0] * ext, j.shoulder[1] + o[1] + u[1] * ext];
  return (<g>{legs && <><Leg x={a[0]} y={a[1]} /><Leg x={b[0]} y={b[1]} /></>}<PadLine a={a} b={b} /></g>);
};
export const Seat = ({ j, w = 26 }) => (<g><Leg x={j.hip[0]} y={j.hip[1] + 14} /><PadLine a={[j.hip[0] - w / 2, j.hip[1] + 13]} b={[j.hip[0] + w / 2, j.hip[1] + 13]} /></g>);
export const Bench = ({ x1, x2, y }) => (<g><Leg x={x1 + 6} y={y} /><Leg x={x2 - 6} y={y} /><PadLine a={[x1, y]} b={[x2, y]} /></g>);

// ---------- 몸 그리기 ----------
const segColor = (seg, p, s) => {
  const has = (ids) => ids.some(id => p.includes(id)) ? C.hi : ids.some(id => s.includes(id)) ? C.hi2 : null;
  const map = {
    torso: ['pec_upper', 'pec_lower', 'abs', 'obliques', 'serratus', 'lats', 'traps', 'midback', 'erectors'],
    shoulder: ['delt_front', 'delt_side', 'delt_rear'],
    upper: ['biceps', 'triceps'], fore: ['forearm'], hip: ['glutes'], thigh: ['quads', 'hamstrings', 'adductors'], shin: ['calves', 'tibialis'],
  };
  return has(map[seg]);
};

const Seg = ({ a, b, w, color }) => (<line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={w} strokeLinecap="round" />);

export const BodySide = ({ j, p = [], s = [], ghost = false }) => {
  const col = (seg, base) => (ghost ? base : (segColor(seg, p, s) || base));
  const far = ghost ? C.far : '#cfd5de';
  return (
    <g opacity={ghost ? 0.28 : 1}>
      {/* 먼 쪽 팔다리 */}
      <Seg a={j.hip} b={j.knee2} w={13} color={ghost ? far : (segColor('thigh', p, s) ? C.hi2 : far)} />
      <Seg a={j.knee2} b={j.ankle2} w={11} color={ghost ? far : (segColor('shin', p, s) ? C.hi2 : far)} />
      <Seg a={j.ankle2} b={j.toe2} w={6} color={far} />
      <Seg a={j.shoulder} b={j.elbow2} w={10} color={ghost ? far : (segColor('upper', p, s) ? C.hi2 : far)} />
      <Seg a={j.elbow2} b={j.wrist2} w={9} color={ghost ? far : (segColor('fore', p, s) ? C.hi2 : far)} />
      {/* 몸통·머리 */}
      <Seg a={j.hip} b={j.shoulder} w={22} color={col('torso', C.body)} />
      <Seg a={j.shoulder} b={j.head} w={8} color={C.body} />
      <circle cx={j.head[0]} cy={j.head[1]} r={FIG.head} fill={C.body} />
      <circle cx={j.hip[0]} cy={j.hip[1]} r="9" fill={col('hip', C.body)} />
      {/* 가까운 쪽 다리 */}
      <Seg a={j.hip} b={j.knee} w={14} color={col('thigh', C.body)} />
      <Seg a={j.knee} b={j.ankle} w={11} color={col('shin', C.body)} />
      <Seg a={j.ankle} b={j.toe} w={6} color={C.body} />
      {/* 가까운 쪽 팔 */}
      <circle cx={j.shoulder[0]} cy={j.shoulder[1]} r="8" fill={col('shoulder', C.body)} />
      <Seg a={j.shoulder} b={j.elbow} w={10} color={col('upper', C.body)} />
      <Seg a={j.elbow} b={j.wrist} w={9} color={col('fore', C.body)} />
      <Seg a={j.wrist} b={j.hand} w={7} color={C.body} />
      {!ghost && (
        <g fill="none" stroke={C.line} strokeOpacity="0.35" strokeWidth="1">
          <circle cx={j.head[0]} cy={j.head[1]} r={FIG.head} />
        </g>
      )}
    </g>
  );
};

export const BodyFront = ({ j, p = [], s = [], ghost = false }) => {
  const col = (seg) => (ghost ? C.body : (segColor(seg, p, s) || C.body));
  const torso = `M${j.shL[0] - 2},${j.shL[1]} L${j.shR[0] + 2},${j.shR[1]} L${j.hipR[0] + 3},${j.hipR[1]} L${j.hipL[0] - 3},${j.hipL[1]} Z`;
  return (
    <g opacity={ghost ? 0.28 : 1}>
      {[[j.hipL, j.kneeL, j.ankleL, -1], [j.hipR, j.kneeR, j.ankleR, 1]].map(([h, k, a, sgn], i) => (
        <g key={i}>
          <Seg a={h} b={k} w={14} color={col('thigh')} />
          <Seg a={k} b={a} w={11} color={col('shin')} />
          <Seg a={a} b={[a[0] + sgn * 8, a[1] + 2]} w={6} color={C.body} />
        </g>
      ))}
      <path d={torso} fill={col('torso')} stroke={col('torso')} strokeWidth="6" strokeLinejoin="round" />
      <Seg a={[j.cx, j.shL[1]]} b={j.head} w={9} color={C.body} />
      <circle cx={j.head[0]} cy={j.head[1]} r={FIG.head} fill={C.body} />
      {[[j.shL, j.elbowL, j.wristL], [j.shR, j.elbowR, j.wristR]].map(([sh, e, w], i) => (
        <g key={i}>
          <circle cx={sh[0]} cy={sh[1]} r="8" fill={col('shoulder')} />
          <Seg a={sh} b={e} w={10} color={col('upper')} />
          <Seg a={e} b={w} w={9} color={col('fore')} />
        </g>
      ))}
    </g>
  );
};

const solve = (view, q) => (view === 'front' ? solveFront(q) : solveSide(q));

const trackPoint = (j, track) => {
  if (j.view === 'front') return track === 'hip' ? [j.cx, j.hipY] : track === 'shoulder' ? [j.cx, j.shL[1]] : track === 'knee' ? j.kneeR : j.wristR;
  return j[track] || j.wrist;
};

const MotionArrow = ({ from, to }) => {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 10) return null;
  const k = 7 / len;
  const a = [from[0] + dx * k, from[1] + dy * k];
  const b = [to[0] - dx * k, to[1] - dy * k];
  const mid = [(a[0] + b[0]) / 2 - dy * 0.18, (a[1] + b[1]) / 2 + dx * 0.18];
  const ang = Math.atan2(b[1] - mid[1], b[0] - mid[0]);
  const h1 = [b[0] - 7 * Math.cos(ang - 0.45), b[1] - 7 * Math.sin(ang - 0.45)];
  const h2 = [b[0] - 7 * Math.cos(ang + 0.45), b[1] - 7 * Math.sin(ang + 0.45)];
  return (
    <g stroke="#4768ff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${a[0]},${a[1]} Q${mid[0]},${mid[1]} ${b[0]},${b[1]}`} strokeDasharray="4 3" />
      <path d={`M${h1[0]},${h1[1]} L${b[0]},${b[1]} L${h2[0]},${h2[1]}`} />
    </g>
  );
};

// pattern: { view, frames, equip, hold, cable, scene, track }
export const PoseFigure = ({ pattern, frame, ghost, p = [], s = [], className = 'w-full h-auto' }) => {
  const view = pattern.view || 'side';
  const q = pattern.frames[frame] || Object.values(pattern.frames)[0];
  const j = solve(view, q);
  const gq = ghost && pattern.frames[ghost];
  const gj = gq ? solve(view, gq) : null;
  const Body = view === 'front' ? BodyFront : BodySide;
  const equipAt = (jj) => {
    const eq = pattern.equip;
    if (!eq || eq === 'none') return null;
    if (view === 'front') {
      if (eq === 'barbell' || eq === 'ezbar') {
        const y = (jj.wristL[1] + jj.wristR[1]) / 2;
        return (<g><line x1={jj.cx - 62} y1={y} x2={jj.cx + 62} y2={y} stroke={C.metal} strokeWidth="3" /><rect x={jj.cx - 72} y={y - 16} width="9" height="32" rx="2" fill={C.metal} /><rect x={jj.cx + 63} y={y - 16} width="9" height="32" rx="2" fill={C.metal} /></g>);
      }
      if (eq === 'dumbbell') return (<g>{[jj.wristL, jj.wristR].map((w, i) => <rect key={i} x={w[0] - 4} y={w[1] - 9} width="8" height="18" rx="2" fill={C.metal} />)}</g>);
      return null;
    }
    const at = pattern.hold === 'elbow' ? jj.elbow : pattern.hold === 'hip' ? [jj.hip[0], jj.hip[1] - 12] : jj.hand ? [(jj.wrist[0] + jj.hand[0]) / 2, (jj.wrist[1] + jj.hand[1]) / 2] : jj.wrist;
    if (pattern.hold === 'back' || pattern.hold === 'front') {
      const { n, u } = backNormal(jj);
      const sgn = pattern.hold === 'back' ? 1 : -1;
      return <Plate p={[jj.shoulder[0] + n[0] * sgn * 10 - u[0] * 4, jj.shoulder[1] + n[1] * sgn * 10 - u[1] * 4]} />;
    }
    if (eq === 'barbell') return <Plate p={at} />;
    if (eq === 'ezbar') return <Plate p={at} r={13} />;
    if (eq === 'plate') return <Plate p={at} r={11} />;
    if (eq === 'dumbbell') return <Dumbbell p={at} />;
    if (eq === 'kettlebell') return <Kettlebell p={at} />;
    return null;
  };
  return (
    <svg viewBox="0 -14 260 236" className={className} role="img">
      <line x1="6" y1={FLOOR + 1} x2="254" y2={FLOOR + 1} stroke={C.floor} strokeWidth="2" />
      {pattern.scene && pattern.scene(j, frame)}
      {gj && <Body j={gj} ghost />}
      {gj && equipAt(gj) && <g opacity="0.28">{equipAt(gj)}</g>}
      {pattern.cable && view === 'side' && <Cable from={j.wrist} to={typeof pattern.cable === 'function' ? pattern.cable(j) : pattern.cable} />}
      <Body j={j} p={p} s={s} />
      {equipAt(j)}
      {pattern.overlay && pattern.overlay(j, frame)}
      {gj && <MotionArrow from={trackPoint(gj, pattern.track || 'wrist')} to={trackPoint(j, pattern.track || 'wrist')} />}
    </svg>
  );
};
