// 실시간 자세 체크 규칙: 관절 각도 계산 · 반복 세기 · 반복마다 피드백
// 각도는 MediaPipe 의 3D 좌표(worldLandmarks)로 재서 카메라 각도에 덜 흔들린다. 몸 한쪽이 가리면 잘 보이는 쪽을 쓴다
import { LM } from './pose.js';

const deg = (r) => r * 180 / Math.PI;
export const angle3 = (a, b, c) => {
  const v1 = [a.x - b.x, a.y - b.y, a.z - b.z], v2 = [c.x - b.x, c.y - b.y, c.z - b.z];
  const d = (v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1);
  return deg(Math.acos(Math.max(-1, Math.min(1, d))));
};
// 화면 좌표 각도 (aspect: 가로÷세로 — 화면 비율대로 펴서 잰다)
const angle2 = (a, b, c, aspect) => angle3({ x: a.x * aspect, y: a.y, z: 0 }, { x: b.x * aspect, y: b.y, z: 0 }, { x: c.x * aspect, y: c.y, z: 0 });
// 화면에서 a→b 선이 세로(위쪽)에서 얼마나 기울었는지 (0 = 똑바로 서 있음)
const tilt2d = (low, high) => deg(Math.atan2(Math.abs(high.x - low.x), Math.max(1e-6, low.y - high.y)));

const SIDES = {
  l: { s: LM.lShoulder, e: LM.lElbow, w: LM.lWrist, h: LM.lHip, k: LM.lKnee, a: LM.lAnkle },
  r: { s: LM.rShoulder, e: LM.rElbow, w: LM.rWrist, h: LM.rHip, k: LM.rKnee, a: LM.rAnkle },
};
const vis = (p, ids) => ids.reduce((s, i) => s + (p[i]?.visibility ?? 0), 0) / ids.length;

// 한 장면의 측정값. pts: 화면 좌표(0~1), world: 3D(m). 몸이 잘 안 보이면 null
// 관절마다 카메라에 더 잘 보이는 쪽(왼쪽/오른쪽)을 따로 고른다 — 가려진 쪽 좌표는 많이 틀린다
export function measure(pts, world, aspect = 1) {
  if (!pts || !world) return null;
  if (Math.max(vis(pts, Object.values(SIDES.l)), vis(pts, Object.values(SIDES.r))) < 0.45) return null;
  const best = (ids) => (vis(pts, ids(SIDES.l)) >= vis(pts, ids(SIDES.r)) ? SIDES.l : SIDES.r);
  const joint = (ids, a, b, c, min = 0.4) => {
    const S = best(ids);
    return vis(pts, ids(S)) > min ? angle3(world[S[a]], world[S[b]], world[S[c]]) : null;
  };
  const K = best(S => [S.h, S.k, S.a]);
  const O = K === SIDES.l ? SIDES.r : SIDES.l;
  const E = best(S => [S.s, S.e, S.w]);
  const T = best(S => [S.s, S.h]);
  const upper = tilt2d(pts[E.s], pts[E.e]);
  return {
    knee: joint(S => [S.h, S.k, S.a], 'h', 'k', 'a'),
    kneeOther: vis(pts, [O.k, O.a]) > 0.4 ? angle3(world[O.h], world[O.k], world[O.a]) : null,
    hip: joint(S => [S.s, S.h, S.k], 's', 'h', 'k', 0.3),
    elbow: joint(S => [S.s, S.e, S.w], 's', 'e', 'w', 0.3),
    // 당기기·컬: 팔이 카메라 쪽을 향하면 3D 팔 각도가 많이 틀려서 화면 각도로, 양쪽 중 더 굽은 쪽 (한 팔씩 하는 컬도 잡힌다)
    elbowMin: Math.min(...[SIDES.l, SIDES.r].filter(S => vis(pts, [S.s, S.e, S.w]) > 0.3).map(S => angle2(pts[S.s], pts[S.e], pts[S.w], aspect)), 999),
    shoulder: joint(S => [S.h, S.s, S.e], 'h', 's', 'e', 0.3), // 팔이 몸통에서 벌어진 각도
    body: joint(S => [S.s, S.h, S.a], 's', 'h', 'a'), // 어깨-엉덩이-발목 일직선
    trunk: tilt2d(pts[T.h], pts[T.s]), // 상체 기울기 (화면 기준)
    upperArm: upper > 90 ? 180 - upper : upper, // 위팔이 세로에서 벗어난 정도
    fullBody: vis(pts, [K.k, K.a]) > 0.4,
  };
}

// 종목별 규칙. metric: 반복을 세는 각도, low/high: 그 각도가 이보다 작/크면 아래/위 자세
// check(rep): 한 번 반복하는 동안의 최소·최대값으로 피드백 [{ ok, text }]
const PROFILES = [
  {
    id: 'squat', label: '스쿼트', match: /^(?!.*(스플릿|split)).*(스쿼트|squat|레그\s?프레스)/i, metric: 'kneeMin', low: 110, high: 140, needLegs: true,
    view: '옆이나 45° 앞에서, 머리부터 발끝까지',
    check: (r) => [
      r.min.kneeMin <= 95 ? { ok: true, text: `깊이 좋아요 (무릎 ${Math.round(r.min.kneeMin)}°)` } : { ok: false, text: `조금 더 앉아요 (무릎 ${Math.round(r.min.kneeMin)}° → 95° 아래로)` },
      r.max.trunk > 55 ? { ok: false, text: '바닥에서 상체가 많이 숙여져요. 가슴을 세워요' } : null,
    ],
  },
  {
    id: 'rdl', label: '루마니안 데드리프트', match: /루마니안|rdl|스티프|굿모닝/i, metric: 'hip', low: 115, high: 160,
    view: '옆에서, 머리부터 발끝까지',
    check: (r) => [
      r.min.hip <= 100 ? { ok: true, text: `엉덩이 접기 충분해요 (${Math.round(r.min.hip)}°)` } : { ok: false, text: '엉덩이를 더 뒤로 빼며 상체를 숙여요' },
      r.min.knee != null && r.min.knee < 130 ? { ok: false, text: '무릎이 많이 굽어요. 무릎은 살짝만, 엉덩이로 접어요' } : null,
      r.max.hip < 165 ? { ok: false, text: '올라와서 엉덩이를 끝까지 펴요' } : null,
    ],
  },
  {
    id: 'deadlift', label: '데드리프트', match: /데드리프트|deadlift|랙\s?풀/i, metric: 'hip', low: 110, high: 160,
    view: '옆에서, 머리부터 발끝까지',
    check: (r) => [
      r.max.hip >= 165 ? { ok: true, text: '끝까지 일어섰어요' } : { ok: false, text: '맨 위에서 엉덩이를 끝까지 펴요' },
      r.max.hip > 190 ? { ok: false, text: '맨 위에서 허리를 뒤로 젖히지 마세요' } : null,
    ],
  },
  {
    id: 'lunge', label: '런지', match: /런지|lunge|스플릿/i, metric: 'kneeMin', low: 110, high: 140, needLegs: true,
    view: '옆에서, 머리부터 발끝까지',
    check: (r) => [
      r.min.kneeMin <= 100 ? { ok: true, text: `깊이 좋아요 (앞무릎 ${Math.round(r.min.kneeMin)}°)` } : { ok: false, text: '조금 더 내려가요 (앞무릎 90° 근처까지)' },
      r.max.trunk > 30 ? { ok: false, text: '상체가 앞으로 숙여져요. 몸을 세워요' } : null,
    ],
  },
  {
    id: 'press', label: '오버헤드 프레스', match: /오버헤드|밀리터리|숄더\s?프레스|ohp|아놀드/i, metric: 'elbow', low: 100, high: 150,
    view: '옆이나 45° 앞에서, 상체가 다 나오게',
    check: (r) => [
      r.max.elbow >= 160 ? { ok: true, text: '팔을 끝까지 폈어요' } : { ok: false, text: '머리 위로 팔을 끝까지 펴요' },
      r.max.trunk > 20 ? { ok: false, text: '허리를 뒤로 젖히지 마세요. 배에 힘!' } : null,
    ],
  },
  {
    id: 'bench', label: '벤치프레스', match: /벤치|bench|체스트\s?프레스|덤벨\s?프레스/i, metric: 'elbow', low: 100, high: 150,
    view: '옆에서, 팔과 몸통이 다 나오게',
    check: (r) => [
      r.min.elbow <= 95 ? { ok: true, text: '충분히 내렸어요' } : { ok: false, text: '바를 가슴 근처까지 더 내려요' },
      r.max.elbow < 155 ? { ok: false, text: '위에서 팔을 거의 다 펴요' } : null,
    ],
  },
  {
    id: 'pushup', label: '푸시업', match: /푸시업|팔굽혀|push/i, metric: 'elbow', low: 100, high: 150,
    view: '옆에서, 머리부터 발끝까지',
    check: (r) => [
      r.min.elbow <= 95 ? { ok: true, text: '충분히 내려갔어요' } : { ok: false, text: '가슴을 바닥 가까이 더 내려요' },
      r.min.body != null && r.min.body < 155 ? { ok: false, text: '엉덩이가 처지거나 들려요. 몸을 일직선으로' } : null,
    ],
  },
  {
    id: 'curl', label: '컬', match: /^(?!.*(레그|leg)).*(컬|curl)/i, metric: 'elbowMin', low: 85, high: 140, startHigh: true,
    view: '옆에서, 상체가 다 나오게',
    check: (r) => [
      r.min.elbowMin <= 60 ? { ok: true, text: '끝까지 감아 올렸어요' } : { ok: false, text: '조금 더 감아 올려요' },
      r.max.elbowMin < 145 ? { ok: false, text: '내릴 때 팔을 거의 다 펴요' } : null,
      r.max.upperArm > 40 ? { ok: false, text: '팔꿈치가 앞으로 움직여요. 옆구리에 고정!' } : null,
    ],
  },
  {
    id: 'pullup', label: '풀업·랫풀다운', match: /풀업|턱걸이|친업|랫\s?풀\s?다운|pull.?up|pulldown|chin/i, metric: 'elbowMin', low: 85, high: 145, startHigh: true,
    view: '옆이나 뒤에서, 팔과 몸통이 다 나오게',
    check: (r) => [
      r.min.elbowMin <= 75 ? { ok: true, text: '충분히 당겼어요' } : { ok: false, text: '턱이 바 위로 오도록 더 당겨요' },
      r.max.elbowMin < 140 ? { ok: false, text: '내려올 때 팔을 거의 다 펴요' } : null,
    ],
  },
  {
    id: 'raise', label: '레터럴 레이즈', match: /레터럴|사이드\s?레이즈|lateral/i, metric: 'shoulder', low: 35, high: 70, startLow: true,
    view: '정면에서, 상체가 다 나오게',
    check: (r) => [
      r.max.shoulder >= 75 ? { ok: true, text: '어깨 높이까지 올렸어요' } : { ok: false, text: '팔을 어깨 높이까지 올려요' },
      r.max.shoulder > 110 ? { ok: false, text: '어깨보다 너무 높아요. 어깨 높이까지만' } : null,
    ],
  },
  {
    id: 'row', label: '로우', match: /로우|row/i, metric: 'elbowMin', low: 100, high: 140, startHigh: true,
    view: '옆에서, 상체가 다 나오게',
    check: (r) => [
      r.min.elbowMin <= 95 ? { ok: true, text: '끝까지 당겼어요' } : { ok: false, text: '팔꿈치를 몸 뒤로 더 당겨요' },
      r.max.trunk - r.min.trunk > 20 ? { ok: false, text: '당길 때 상체가 들썩여요. 각도를 고정!' } : null,
    ],
  },
];

export const profileFor = (exercise) => {
  const name = `${exercise?.name || ''} ${exercise?.id || ''}`;
  return PROFILES.find(p => p.match.test(name)) || null;
};
export const SUPPORTED_LABELS = PROFILES.map(p => p.label);

const metricOf = (m, key) => (key === 'kneeMin' ? Math.min(...[m.knee, m.kneeOther].filter(v => v != null)) : m[key]);

// 반복 세기: 쉬는 자세(처음 머문 쪽 끝)를 떠나 반대쪽 끝에 닿았다가 돌아오면 1회. 반대쪽에 못 닿고 돌아오면 세지 않는다
// 돌아온 순간 횟수는 바로 올리고, 끝까지 펴졌는지 같은 판단은 조금 더(최대 SETTLE 장면) 지켜본 뒤 한다
// 각도는 지수 평균으로 떨림을 줄인다
const KEYS = ['knee', 'kneeMin', 'hip', 'elbow', 'elbowMin', 'shoulder', 'body', 'trunk', 'upperArm'];
const SETTLE = 15; // 약 0.5초
export function createRepCounter(profile) {
  let rest = profile.startHigh ? 'high' : profile.startLow ? 'low' : null;
  let cur = null, settling = null, settleLeft = 0;
  let reps = [];
  const smooth = {};
  const track = (r) => KEYS.forEach(k => { if (smooth[k] == null) return; r.min[k] = Math.min(r.min[k] ?? smooth[k], smooth[k]); r.max[k] = Math.max(r.max[k] ?? smooth[k], smooth[k]); });
  const finalize = () => {
    const r = settling;
    r.feedback = profile.check(r).filter(Boolean);
    settling = null;
    reps = reps.map(x => (x === r ? { ...r } : x));
    return r;
  };
  return {
    get reps() { return reps; },
    update(m) {
      if (!m) return null;
      const raw = { ...m, kneeMin: metricOf(m, 'kneeMin'), elbowMin: m.elbowMin < 999 ? m.elbowMin : null };
      KEYS.forEach(k => { if (raw[k] == null || !isFinite(raw[k])) return; smooth[k] = smooth[k] == null ? raw[k] : smooth[k] * 0.6 + raw[k] * 0.4; });
      const v = smooth[profile.metric];
      if (v == null) return null;
      const zone = v <= profile.low ? 'low' : v >= profile.high ? 'high' : null;
      if (!rest) { if (zone) rest = zone; return { value: v, smooth }; }
      let counted = null, done = null;
      if (settling) {
        if (zone === rest && settleLeft-- > 0) track(settling);
        else done = finalize();
      }
      if (!cur && zone !== rest) cur = { min: { ...smooth }, max: { ...smooth }, reached: false };
      if (cur) {
        track(cur);
        if (zone && zone !== rest) cur.reached = true;
        if (zone === rest) {
          if (cur.reached) {
            if (settling) done = finalize();
            cur.feedback = [];
            reps = [...reps, cur];
            settling = cur; settleLeft = SETTLE;
            counted = cur;
          }
          cur = null;
        }
      }
      return { value: v, smooth, counted, done, moving: !!cur };
    },
    // 세트를 끝낼 때 아직 판단 안 한 마지막 반복을 마무리
    finish() { if (settling) finalize(); return reps; },
  };
}

// 세트 요약 (AI 코치에게 보낼 글)
export function setSummary(profile, exercise, reps) {
  const NAME = { knee: '무릎', kneeMin: '무릎', hip: '엉덩이', elbow: '팔꿈치', elbowMin: '팔꿈치', shoulder: '어깨' };
  const lines = [`종목: ${exercise?.name || profile.label} (휴대폰 카메라로 잰 관절 각도)`, `반복: ${reps.length}회`];
  reps.forEach((r, i) => {
    const lo = Math.round(r.min[profile.metric]), hi = Math.round(r.max[profile.metric]);
    lines.push(`- ${i + 1}회: ${NAME[profile.metric]} ${lo}°~${hi}° · ${r.feedback.map(f => `${f.ok ? '✓' : '✗'} ${f.text}`).join(' / ')}`);
  });
  return lines.join('\n');
}
