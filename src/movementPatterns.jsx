import React from 'react';
import { FLOOR, Plate, Cable, Column, Box, PadLine, Leg, TorsoPad, Seat, Bench } from './poseFigure.jsx';

// 동작 패턴: 운동 설명서 그림에 쓰는 자세(frames)와 기구·배경(scene).
// 각 운동 종목은 이 중 하나를 골라 단계별 그림을 만든다. 좌표 규칙은 poseFigure.jsx 상단 주석 참고.

const A = [120, 210];
const Rack = ({ x, y }) => (<g><Column x={x} top={y - 30} /><rect x={x - 12} y={y - 3} width="14" height="5" rx="1" fill="#475569" /></g>);
const PullBar = ({ p }) => (<g><line x1={p[0] - 40} y1={p[1]} x2={p[0] + 40} y2={p[1]} stroke="#475569" strokeWidth="3" strokeLinecap="round" /><Column x={p[0] + 60} top={p[1] - 6} /></g>);
const Footplate = ({ ankle, dir, len = 24 }) => {
  const d = [Math.sin(dir * Math.PI / 180), Math.cos(dir * Math.PI / 180)];
  const c = [ankle[0] + d[0] * 7, ankle[1] + d[1] * 7];
  const pp = [d[1], -d[0]];
  return <PadLine a={[c[0] - pp[0] * len, c[1] - pp[1] * len]} b={[c[0] + pp[0] * len, c[1] + pp[1] * len]} w={6} />;
};
const Roller = ({ p }) => <circle cx={p[0]} cy={p[1]} r="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />;
const shinPoint = (j, k = 38, side = 1) => {
  const sh = Math.atan2(j.ankle[0] - j.knee[0], j.ankle[1] - j.knee[1]) * 180 / Math.PI;
  const base = [j.knee[0] + Math.sin(sh * Math.PI / 180) * k, j.knee[1] + Math.cos(sh * Math.PI / 180) * k];
  const a = (sh + 90 * side) * Math.PI / 180;
  return [base[0] + Math.sin(a) * 9, base[1] + Math.cos(a) * 9];
};
const SeatBack = ({ j }) => (<g><Seat j={j} /><TorsoPad j={j} side={1} legs={false} /></g>);
const FrontSeat = ({ j }) => (<g><PadLine a={[j.cx - 34, j.hipY + 12]} b={[j.cx + 34, j.hipY + 12]} /><Leg x={j.cx} y={j.hipY + 12} /></g>);
const FrontCables = ({ j, anchorY = -6, low = false }) => (<g>
  <Cable from={j.wristL} to={[16, low ? FLOOR - 8 : anchorY]} />
  <Cable from={j.wristR} to={[244, low ? FLOOR - 8 : anchorY]} />
</g>);

const LYING = { hip: [95, 152], t: 90, th: -75, sh: -5, ft: -90 };
const INCLINE = { hip: [110, 163], t: -38, th: 88, sh: 0 };
const DECLINE = { hip: [140, 132], t: -100, th: 62, sh: -18 };
const SEATED = { hip: [108, 165], t: -4, th: 88, sh: 0 };
const HINGE = { ankle: A, sh: 2, th: 32, t: 66 };

export const PATTERNS = {
  // ---------------- 하체 ----------------
  squat_back: { equip: 'barbell', hold: 'back', track: 'hip', frames: {
    start: { ankle: A, t: 8, gr: [-12, -2], eb: -1 },
    bottom: { ankle: A, sh: -32, th: 78, t: 42, gr: [-9, -6], eb: -1 },
  } },
  squat_front: { equip: 'barbell', hold: 'front', track: 'hip', frames: {
    start: { ankle: A, t: 4, gr: [10, 1], eb: -1 },
    bottom: { ankle: A, sh: -30, th: 80, t: 22, gr: [9, 4], eb: -1 },
  } },
  squat_goblet: { equip: 'dumbbell', track: 'hip', frames: {
    start: { ankle: A, t: 5, gr: [12, 14], eb: 1 },
    bottom: { ankle: A, sh: -32, th: 82, t: 28, gr: [14, 10], eb: 1 },
  } },
  squat_zercher: { equip: 'barbell', hold: 'elbow', track: 'hip', frames: {
    start: { ankle: A, t: 6, gr: [18, 8], eb: 1 },
    bottom: { ankle: A, sh: -32, th: 82, t: 26, gr: [18, 6], eb: 1 },
  } },
  squat_machine: { track: 'hip', scene: (j) => (<g><TorsoPad j={j} side={1} legs={false} /><Box x={88} y={210} w={70} h={4} /><Column x={60} top={20} /></g>), frames: {
    start: { ankle: A, t: -4, sh: 5, th: -3, gr: [-8, -4], eb: -1 },
    bottom: { ankle: A, sh: -38, th: 86, t: 12, gr: [-8, -6], eb: -1 },
  } },
  leg_press: { track: 'ankle', scene: (j) => (<g><Seat j={j} /><TorsoPad j={j} side={1} legs={false} /><Footplate ankle={j.ankle} dir={Math.atan2(j.ankle[0] - j.knee[0], j.ankle[1] - j.knee[1]) * 180 / Math.PI} /></g>), frames: {
    extended: { hip: [92, 172], t: -55, th: 128, sh: 128, gr: [44, 36], eb: 1 },
    bent: { hip: [92, 172], t: -55, th: 172, sh: 88, gr: [44, 36], eb: 1 },
  } },
  leg_ext: { track: 'ankle', scene: (j) => (<g><SeatBack j={j} /><Roller p={shinPoint(j, 40, 1)} /></g>), frames: {
    down: { hip: [110, 152], t: -8, th: 90, sh: 2, gr: [10, 56], eb: 1 },
    up: { hip: [110, 152], t: -8, th: 90, sh: 84, gr: [10, 56], eb: 1 },
  } },
  leg_curl: { track: 'ankle', scene: (j) => (<g><Bench x1={60} x2={182} y={163} /><Roller p={shinPoint(j, 40, -1)} /></g>), frames: {
    straight: { hip: [118, 150], t: 90, th: -90, sh: -90, ft: 0, gr: [14, 30], eb: 1 },
    curled: { hip: [118, 150], t: 90, th: -90, sh: 168, ft: 80, gr: [14, 30], eb: 1 },
  } },
  calf_raise: { track: 'ankle', scene: () => (<g><Box x={122} y={204} w={36} h={10} /><Column x={60} top={20} /></g>), frames: {
    low: { ankle: [120, 200], t: 2, ft: 100, gr: [-10, -3], eb: -1 },
    high: { ankle: [118, 186], t: 2, ft: 128, gr: [-10, -3], eb: -1 },
  } },
  rdl: { equip: 'barbell', frames: {
    start: { ankle: A, t: 3, gr: [2, 58] },
    bottom: { ...HINGE, gr: [-14, 56] },
  } },
  deadlift: { equip: 'barbell', track: 'wrist', frames: {
    start: { ankle: A, sh: -28, th: 75, t: 70, gr: [-18, 57] },
    top: { ankle: A, t: 2, gr: [2, 58] },
  } },
  deadlift_deficit: { equip: 'barbell', scene: () => <Box x={84} y={202} w={76} h={12} />, frames: {
    start: { ankle: [120, 198], sh: -30, th: 78, t: 72, gr: [-18, 57] },
    top: { ankle: [120, 198], t: 2, gr: [2, 58] },
  } },
  rack_pull: { equip: 'barbell', scene: () => <Rack x={160} y={168} />, frames: {
    start: { ankle: A, sh: -6, th: 28, t: 46, gr: [-8, 56] },
    top: { ankle: A, t: 2, gr: [2, 58] },
  } },
  lunge: { equip: 'dumbbell', track: 'hip', frames: {
    start: { ankle: [128, 210], t: 2, gr: [2, 58] },
    bottom: { ankle: [150, 210], sh: -12, th: 82, t: 3, th2: -22, sh2: -80, ft2: 10, gr: [2, 56] },
  } },
  split_squat: { equip: 'dumbbell', track: 'hip', scene: () => <Bench x1={36} x2={82} y={162} />, frames: {
    start: { ankle: [140, 210], sh: -4, th: 12, t: 4, th2: -28, sh2: -92, ft2: -60, gr: [2, 56] },
    bottom: { ankle: [140, 210], sh: -15, th: 80, t: 8, th2: -20, sh2: -150, ft2: -60, gr: [2, 56] },
  } },
  step_up: { equip: 'dumbbell', track: 'hip', scene: () => <Box x={132} y={172} w={58} />, frames: {
    start: { ankle: [152, 168], sh: -14, th: 64, t: 12, th2: -4, sh2: -14, gr: [2, 56] },
    top: { ankle: [152, 168], t: 2, th2: 50, sh2: -10, gr: [2, 56] },
  } },
  hip_thrust: { equip: 'barbell', hold: 'hip', track: 'hip', scene: () => <Box x={28} y={164} w={52} />, frames: {
    bottom: { hip: [118, 186], t: -57, th: 110, sh: 20, gr: [47, 30], eb: -1 },
    top: { hip: [130, 160], t: -90, th: 88, sh: 2, gr: [54, 4], eb: -1 },
  } },
  glute_kick: { track: 'ankle2', scene: (j) => (<g><Column x={200} top={20} /><Cable from={j.ankle2} to={[200, FLOOR - 10]} /></g>), frames: {
    start: { ankle: A, t: 22, sh: -4, th: 8, th2: 14, sh2: -4, gr: [58, 6] },
    kick: { ankle: A, t: 22, sh: -4, th: 8, th2: -42, sh2: -30, gr: [58, 6] },
  } },
  hip_add_abd: { view: 'front', scene: (j) => (<g><FrontSeat j={j} /><PadLine a={[j.kneeL[0] - 9, j.kneeL[1] - 6]} b={[j.kneeL[0] - 9, j.kneeL[1] + 14]} w={6} /><PadLine a={[j.kneeR[0] + 9, j.kneeR[1] - 6]} b={[j.kneeR[0] + 9, j.kneeR[1] + 14]} w={6} /></g>), track: 'knee', frames: {
    closed: { seated: true, hipY: 150, lg: 4, ua: 18, fa: 4 },
    open: { seated: true, hipY: 150, lg: 42, ua: 18, fa: 4 },
  } },
  kb_swing: { equip: 'kettlebell', frames: {
    bottom: { ankle: A, sh: -12, th: 40, t: 62, gr: [-34, 44], eb: 1 },
    top: { ankle: A, t: -2, gr: [58, 2] },
  } },
  pistol: { track: 'hip', frames: {
    start: { ankle: A, t: 5, th2: 30, sh2: 30, gr: [50, 10] },
    bottom: { ankle: A, sh: -38, th: 100, t: 40, th2: 95, sh2: 92, gr: [56, 6] },
  } },
  sissy: { track: 'knee', scene: () => <Column x={200} top={60} />, frames: {
    start: { ankle: A, t: -3, ft: 110, gr: [56, 10] },
    bottom: { ankle: A, sh: -62, th: 58, t: -58, ft: 125, gr: [56, -6] },
  } },
  nordic: { track: 'shoulder', scene: (j) => (<g><Box x={110} y={208} w={60} h={6} /><Roller p={[j.ankle[0], j.ankle[1] - 10]} /></g>), frames: {
    start: { knee: [140, 205], th: 0, sh: -90, ft: 0, t: 0, gr: [10, 40] },
    lowered: { knee: [140, 205], th: -60, sh: -90, ft: 0, t: 62, gr: [14, 48] },
  } },

  // ---------------- 가슴 ----------------
  bench_press: { equip: 'barbell', scene: () => (<g><Bench x1={62} x2={176} y={164} /><Rack x={196} y={96} /></g>), frames: {
    top: { ...LYING, gr: [-6, -58] },
    bottom: { ...LYING, gr: [-16, -12], eb: -1 },
  } },
  bench_press_db: { equip: 'dumbbell', scene: () => <Bench x1={62} x2={176} y={164} />, frames: {
    top: { ...LYING, gr: [-4, -58] },
    bottom: { ...LYING, gr: [-14, -10], eb: -1 },
  } },
  incline_press: { equip: 'barbell', scene: (j) => <SeatBack j={j} />, frames: {
    top: { ...INCLINE, gr: [44, -37] },
    bottom: { ...INCLINE, gr: [8, 10], eb: 1 },
  } },
  decline_press: { equip: 'barbell', scene: (j) => (<g><TorsoPad j={j} side={1} /><Roller p={[j.ankle[0] + 6, j.ankle[1] - 8]} /></g>), frames: {
    top: { ...DECLINE, gr: [-10, -57] },
    bottom: { ...DECLINE, gr: [10, -10], eb: 1 },
  } },
  chest_press_machine: { scene: (j) => <SeatBack j={j} />, frames: {
    start: { ...SEATED, gr: [6, 10], eb: 1 },
    press: { ...SEATED, gr: [57, 8], eb: 1 },
  } },
  cable_press: { cable: [14, 92], frames: {
    start: { ankle: A, t: 10, th2: -18, sh2: -12, gr: [6, 10], eb: 1 },
    press: { ankle: A, t: 10, th2: -18, sh2: -12, gr: [57, 8], eb: 1 },
  } },
  fly: { equip: 'dumbbell', scene: () => <Bench x1={62} x2={176} y={164} />, frames: {
    top: { ...LYING, gr: [-4, -56] },
    bottom: { ...LYING, gr: [-4, 40], eb: 1 },
  } },
  cable_cross: { view: 'front', scene: (j) => <FrontCables j={j} />, frames: {
    open: { ua: 112, fa: 104 },
    close: { ua: 28, fa: -12 },
  } },
  pec_deck: { view: 'front', scene: (j) => <FrontSeat j={j} />, frames: {
    open: { seated: true, hipY: 150, ua: 88, fa: 178 },
    close: { seated: true, hipY: 150, ua: 40, fa: 160 },
  } },
  pullover: { equip: 'dumbbell', scene: () => <Bench x1={150} x2={206} y={158} />, frames: {
    top: { hip: [120, 150], t: 86, th: -70, sh: -6, ft: -90, gr: [-4, -56] },
    stretch: { hip: [120, 150], t: 86, th: -70, sh: -6, ft: -90, gr: [54, 12], eb: -1 },
  } },
  pullover_machine: { scene: (j) => <SeatBack j={j} />, frames: {
    top: { ...SEATED, gr: [-2, -58] },
    bottom: { ...SEATED, gr: [24, 50], eb: 1 },
  } },
  floor_press: { equip: 'barbell', frames: {
    top: { hip: [95, 197], t: 90, th: -140, sh: -17, ft: -90, gr: [-4, -56] },
    bottom: { hip: [95, 197], t: 90, th: -140, sh: -17, ft: -90, gr: [-14, -8], eb: -1 },
  } },
  pushup: { track: 'shoulder', frames: {
    top: { hip: [125, 172], t: 70, th: -70, sh: -70, ft: 0, gr: [0, 59] },
    bottom: { hip: [122, 190], t: 78, th: -78, sh: -78, ft: 0, gr: [-2, 34], eb: 1 },
  } },
  dips: { track: 'shoulder', scene: () => (<g><line x1="118" y1="146" x2="160" y2="146" stroke="#475569" strokeWidth="4" strokeLinecap="round" /><Leg x={156} y={146} /></g>), frames: {
    top: { hip: [130, 140], t: 5, th: 15, sh: -60, gr: [0, 58] },
    bottom: { hip: [126, 165], t: 15, th: 15, sh: -60, gr: [-5, 32], eb: 1 },
  } },

  // ---------------- 등 ----------------
  pullup: { track: 'shoulder', scene: () => <PullBar p={[142, 37]} />, frames: {
    hang: { hip: [130, 150], t: 0, th: 18, sh: -95, gr: [12, -57] },
    pull: { hip: [128, 106], t: 2, th: 18, sh: -95, gr: [12, -14], eb: 1 },
  } },
  pullup_assist: { track: 'shoulder', scene: (j) => (<g><PullBar p={[142, 37]} /><PadLine a={[j.knee[0] - 16, j.knee[1] + 8]} b={[j.knee[0] + 14, j.knee[1] + 8]} w={7} /><Leg x={j.knee[0]} y={j.knee[1] + 8} /></g>), frames: {
    hang: { hip: [130, 150], t: 0, th: 12, sh: -80, gr: [12, -57] },
    pull: { hip: [128, 106], t: 2, th: 12, sh: -80, gr: [12, -14], eb: 1 },
  } },
  lat_pulldown: { cable: (j) => [j.wrist[0] + 2, -10], scene: (j) => (<g><Seat j={j} /><PadLine a={[j.knee[0] - 12, j.knee[1] - 10]} b={[j.knee[0] + 10, j.knee[1] - 10]} w={7} /></g>), frames: {
    up: { hip: [110, 165], t: -12, th: 90, sh: 0, gr: [8, -58] },
    down: { hip: [110, 165], t: -14, th: 90, sh: 0, gr: [10, 4], eb: 1 },
  } },
  bent_row: { equip: 'barbell', frames: {
    hang: { ...HINGE, t: 68, gr: [-10, 57] },
    pull: { ...HINGE, t: 68, gr: [-22, 25], eb: 1 },
  } },
  db_row: { equip: 'dumbbell', scene: () => <Bench x1={80} x2={172} y={157} />, frames: {
    hang: { ankle: [95, 210], sh: 0, th: -6, t: 82, th2: 43, sh2: -90, gr2: [0, 40], gr: [0, 57] },
    pull: { ankle: [95, 210], sh: 0, th: -6, t: 82, th2: 43, sh2: -90, gr2: [0, 40], gr: [-18, 24], eb: 1 },
  } },
  cable_row: { cable: [236, 168], scene: (j) => (<g><Box x={40} y={198} w={70} h={16} /><Footplate ankle={j.ankle} dir={90} len={14} /></g>), frames: {
    reach: { hip: [80, 186], t: 10, th: 80, sh: 70, gr: [56, 10] },
    pull: { hip: [80, 186], t: -6, th: 80, sh: 70, gr: [10, 24], eb: 1 },
  } },
  machine_row: { scene: (j) => (<g><Seat j={j} /><PadLine a={[j.shoulder[0] + 18, j.shoulder[1] + 4]} b={[j.shoulder[0] + 18, j.shoulder[1] + 40]} w={8} /></g>), frames: {
    reach: { hip: [96, 170], t: 2, th: 88, sh: 0, gr: [54, 14] },
    pull: { hip: [96, 170], t: -4, th: 88, sh: 0, gr: [8, 22], eb: 1 },
  } },
  chest_supported_row: { equip: 'dumbbell', scene: (j) => <TorsoPad j={j} side={-1} />, frames: {
    hang: { ankle: [72, 210], sh: -5, th: 22, t: 48, gr: [0, 57] },
    pull: { ankle: [72, 210], sh: -5, th: 22, t: 48, gr: [-14, 24], eb: 1 },
  } },
  seal_row: { equip: 'barbell', scene: () => <Bench x1={36} x2={178} y={150} />, frames: {
    hang: { hip: [96, 138], t: 90, th: -90, sh: -90, ft: 0, gr: [0, 57] },
    pull: { hip: [96, 138], t: 90, th: -90, sh: -90, ft: 0, gr: [-12, 20], eb: 1 },
  } },
  straight_arm_pulldown: { cable: [214, -6], frames: {
    top: { ankle: A, t: 28, sh: -6, th: 10, gr: [40, -38] },
    bottom: { ankle: A, t: 28, sh: -6, th: 10, gr: [6, 57] },
  } },
  inverted_row: { track: 'shoulder', scene: () => (<g><line x1="150" y1="122" x2="200" y2="122" stroke="#475569" strokeWidth="4" strokeLinecap="round" /><Column x={204} top={116} /></g>), frames: {
    hang: { hip: [120, 186], t: 75, th: -75, sh: -75, ft: 0, gr: [0, -50] },
    pull: { hip: [124, 172], t: 68, th: -70, sh: -70, ft: 0, gr: [-2, -29], eb: -1 },
  } },
  shrug: { view: 'front', equip: 'barbell', track: 'shoulder', frames: {
    low: { se: 0, ua: 4, fa: 2 },
    high: { se: 10, ua: 4, fa: 2 },
  } },
  face_pull: { cable: [236, 30], frames: {
    reach: { ankle: A, t: -8, gr: [57, -10] },
    pull: { ankle: A, t: -8, gr: [6, -22], eb: -1 },
  } },

  // ---------------- 어깨 ----------------
  ohp_standing: { equip: 'barbell', frames: {
    start: { ankle: A, t: -2, gr: [12, 4], eb: 1 },
    press: { ankle: A, t: -2, gr: [4, -58] },
  } },
  ohp_seated: { equip: 'dumbbell', scene: (j) => <SeatBack j={j} />, frames: {
    start: { ...SEATED, gr: [12, 4], eb: 1 },
    press: { ...SEATED, gr: [4, -58] },
  } },
  ohp_machine: { scene: (j) => (<g><SeatBack j={j} /><Column x={200} top={0} /></g>), frames: {
    start: { ...SEATED, gr: [12, 4], eb: 1 },
    press: { ...SEATED, gr: [4, -58] },
  } },
  z_press: { equip: 'barbell', frames: {
    start: { hip: [90, 200], t: 0, th: 90, sh: 90, ft: 180, gr: [12, 4], eb: 1 },
    press: { hip: [90, 200], t: 0, th: 90, sh: 90, ft: 180, gr: [4, -58] },
  } },
  landmine_press: { overlay: (j) => (<g><line x1={j.wrist[0]} y1={j.wrist[1]} x2={240} y2={FLOOR - 2} stroke="#475569" strokeWidth="4" strokeLinecap="round" /><Plate p={[j.wrist[0] + 14 * (240 - j.wrist[0]) / Math.hypot(240 - j.wrist[0], FLOOR - j.wrist[1]), j.wrist[1] + 14 * (FLOOR - j.wrist[1]) / Math.hypot(240 - j.wrist[0], FLOOR - j.wrist[1])]} r={12} /></g>), frames: {
    start: { ankle: A, t: 12, th2: -20, sh2: -15, gr: [12, 4], eb: 1 },
    press: { ankle: A, t: 12, th2: -20, sh2: -15, gr: [44, -38] },
  } },
  front_raise: { equip: 'dumbbell', frames: {
    down: { ankle: A, t: -2, gr: [6, 58] },
    up: { ankle: A, t: -2, gr: [58, -2] },
  } },
  front_raise_cable: { cable: [18, FLOOR - 8], frames: {
    down: { ankle: A, t: -2, gr: [6, 58] },
    up: { ankle: A, t: -2, gr: [58, -2] },
  } },
  front_raise_plate: { equip: 'plate', frames: {
    down: { ankle: A, t: -2, gr: [10, 56] },
    up: { ankle: A, t: -2, gr: [58, -6] },
  } },
  lateral_raise: { view: 'front', equip: 'dumbbell', frames: {
    down: { ua: 10, fa: 8 },
    up: { ua: 86, fa: 84 },
  } },
  lateral_raise_cable: { view: 'front', scene: (j) => <Cable from={j.wristR} to={[48, FLOOR - 8]} />, frames: {
    down: { ua: 10, fa: 6 },
    up: { ua: 86, fa: 84 },
  } },
  lateral_raise_machine: { view: 'front', scene: (j) => (<g><FrontSeat j={j} /><PadLine a={[j.elbowL[0] - 2, j.elbowL[1] - 10]} b={[j.elbowL[0] - 2, j.elbowL[1] + 10]} w={7} /><PadLine a={[j.elbowR[0] + 2, j.elbowR[1] - 10]} b={[j.elbowR[0] + 2, j.elbowR[1] + 10]} w={7} /></g>), frames: {
    down: { seated: true, hipY: 150, ua: 10, fa: 30 },
    up: { seated: true, hipY: 150, ua: 86, fa: 120 },
  } },
  y_raise: { view: 'front', equip: 'dumbbell', frames: {
    down: { ua: 14, fa: 12 },
    up: { ua: 140, fa: 140 },
  } },
  y_raise_cable: { view: 'front', scene: (j) => <FrontCables j={j} low />, frames: {
    down: { ua: 14, fa: 12 },
    up: { ua: 140, fa: 140 },
  } },
  upright_row: { view: 'front', equip: 'barbell', frames: {
    down: { ua: -2, fa: -14 },
    up: { ua: 100, fa: -125 },
  } },
  reverse_fly: { view: 'front', scene: (j) => <FrontSeat j={j} />, frames: {
    close: { seated: true, hipY: 150, ua: 26, fa: 14 },
    open: { seated: true, hipY: 150, ua: 88, fa: 88 },
  } },
  bentover_raise: { equip: 'dumbbell', frames: {
    down: { ...HINGE, t: 70, gr: [0, 57] },
    up: { ...HINGE, t: 70, gr: [-6, 8], eb: -1 },
  } },

  // ---------------- 팔 ----------------
  curl: { equip: 'dumbbell', frames: {
    down: { ankle: A, t: 0, gr: [3, 58] },
    up: { ankle: A, t: 0, gr: [22, 6], eb: 1 },
  } },
  curl_cable: { cable: [214, FLOOR - 8], frames: {
    down: { ankle: A, t: 0, gr: [6, 57] },
    up: { ankle: A, t: 0, gr: [22, 6], eb: 1 },
  } },
  curl_incline: { equip: 'dumbbell', scene: (j) => <SeatBack j={j} />, frames: {
    down: { ...INCLINE, gr: [-6, 57] },
    up: { ...INCLINE, gr: [16, 20], eb: 1 },
  } },
  curl_spider: { equip: 'dumbbell', scene: (j) => <TorsoPad j={j} side={-1} />, frames: {
    down: { ankle: [60, 210], sh: -5, th: 22, t: 52, gr: [0, 57] },
    up: { ankle: [60, 210], sh: -5, th: 22, t: 52, gr: [20, 24], eb: 1 },
  } },
  curl_concentration: { equip: 'dumbbell', scene: (j) => <Seat j={j} />, frames: {
    down: { hip: [100, 170], t: 38, th: 88, sh: 0, gr: [4, 56] },
    up: { hip: [100, 170], t: 38, th: 88, sh: 0, gr: [-6, 24], eb: 1 },
  } },
  curl_preacher: { equip: 'ezbar', scene: (j) => (<g><Seat j={j} /><PadLine a={[j.shoulder[0] + 6, j.shoulder[1] + 14]} b={[j.shoulder[0] + 30, j.shoulder[1] + 40]} w={8} /><Leg x={j.shoulder[0] + 24} y={j.shoulder[1] + 40} /></g>), frames: {
    down: { ...SEATED, t: 8, gr: [44, 42], eb: 1 },
    up: { ...SEATED, t: 8, gr: [22, 2], eb: 1 },
  } },
  curl_bayesian: { cable: [12, FLOOR - 10], frames: {
    down: { ankle: A, t: 10, th2: -16, sh2: -10, gr: [-32, 48] },
    up: { ankle: A, t: 10, th2: -16, sh2: -10, gr: [6, 8], eb: 1 },
  } },
  pushdown: { cable: [150, -8], frames: {
    start: { ankle: A, t: 10, gr: [18, 18], eb: 1 },
    press: { ankle: A, t: 10, gr: [8, 57] },
  } },
  overhead_ext: { equip: 'dumbbell', frames: {
    bottom: { ankle: A, t: 2, gr: [-2, -6], eb: 1 },
    top: { ankle: A, t: 2, gr: [6, -58] },
  } },
  overhead_ext_cable: { cable: [16, 170], frames: {
    bottom: { ankle: A, t: 14, th2: -16, sh2: -10, gr: [-2, -6], eb: 1 },
    top: { ankle: A, t: 14, th2: -16, sh2: -10, gr: [20, -54] },
  } },
  skullcrusher: { equip: 'ezbar', scene: () => <Bench x1={62} x2={176} y={164} />, frames: {
    top: { ...LYING, gr: [0, -58] },
    bottom: { ...LYING, gr: [22, -26], eb: -1 },
  } },
  kickback: { equip: 'dumbbell', frames: {
    bent: { ...HINGE, t: 70, gr: [-29, 39], eb: 1 },
    straight: { ...HINGE, t: 70, gr: [-57, 8] },
  } },
  kickback_cable: { cable: [214, FLOOR - 8], frames: {
    bent: { ...HINGE, t: 70, gr: [-29, 39], eb: 1 },
    straight: { ...HINGE, t: 70, gr: [-57, 8] },
  } },
  wrist_curl: { equip: 'dumbbell', track: 'hand', scene: (j) => <Seat j={j} />, frames: {
    down: { hip: [100, 170], t: 32, th: 88, sh: 0, gr: [22, 44], hnd: 20 },
    up: { hip: [100, 170], t: 32, th: 88, sh: 0, gr: [22, 44], hnd: 160 },
  } },
  farmers_walk: { equip: 'dumbbell', track: 'hip', frames: {
    stepA: { ankle: [118, 210], sh: -10, th: 14, t: 2, th2: -18, sh2: -26, ft2: 60, gr: [2, 58] },
    stepB: { ankle: [150, 210], sh: -10, th: 14, t: 2, th2: -18, sh2: -26, ft2: 60, gr: [2, 58] },
  } },

  // ---------------- 복근·전신 ----------------
  crunch: { track: 'shoulder', frames: {
    down: { hip: [130, 200], t: -90, th: 150, sh: 20, gr: [-12, -8] },
    up: { hip: [130, 200], t: -62, th: 150, sh: 20, gr: [-12, -10] },
  } },
  crunch_decline: { track: 'shoulder', scene: (j) => (<g><TorsoPad j={{ hip: j.hip, shoulder: [j.hip[0] - 56, j.hip[1] + 14] }} side={-1} /><Roller p={[j.ankle[0] + 4, j.ankle[1] - 9]} /></g>), frames: {
    down: { hip: [140, 168], t: -104, th: 70, sh: -10, gr: [-12, -8] },
    up: { hip: [140, 168], t: -60, th: 70, sh: -10, gr: [-12, -10] },
  } },
  cable_crunch: { cable: [175, -8], track: 'shoulder', frames: {
    up: { knee: [130, 205], th: 0, sh: -90, t: 12, gr: [6, -6], eb: 1 },
    down: { knee: [130, 205], th: -4, sh: -90, t: 76, gr: [8, -4], eb: 1 },
  } },
  hanging_leg_raise: { track: 'ankle', scene: () => <PullBar p={[136, 8]} />, frames: {
    hang: { hip: [130, 122], t: 0, th: 3, sh: 3, gr: [6, -58] },
    raise: { hip: [130, 122], t: -8, th: 92, sh: 92, gr: [6, -58] },
  } },
  toes_to_bar: { track: 'ankle', scene: () => <PullBar p={[136, 8]} />, frames: {
    hang: { hip: [130, 122], t: 0, th: 3, sh: 3, gr: [6, -58] },
    raise: { hip: [130, 122], t: -24, th: 162, sh: 168, gr: [6, -58] },
  } },
  lying_leg_raise: { track: 'ankle', frames: {
    down: { hip: [130, 200], t: -90, th: 86, sh: 86, gr: [28, 8] },
    up: { hip: [130, 200], t: -90, th: 178, sh: 178, gr: [28, 8] },
  } },
  russian_twist: { equip: 'plate', frames: {
    center: { hip: [120, 198], t: -38, th: 125, sh: 70, gr: [32, 18] },
    twist: { hip: [120, 198], t: -38, th: 125, sh: 70, gr: [12, 42] },
  } },
  woodchop: { cable: [18, -6], frames: {
    high: { ankle: A, t: -5, th2: -12, sh2: -8, gr: [-36, -40], eb: 1 },
    low: { ankle: A, t: 22, th2: -12, sh2: -8, gr: [36, 48] },
  } },
  bicycle: { track: 'ankle', frames: {
    a: { hip: [130, 200], t: -65, th: 150, sh: 40, th2: 100, sh2: 100, gr: [-12, -10] },
    b: { hip: [130, 200], t: -65, th: 100, sh: 100, th2: 150, sh2: 40, gr: [-12, -10] },
  } },
  v_up: { track: 'wrist', frames: {
    flat: { hip: [130, 200], t: -90, th: 90, sh: 90, ft: 180, gr: [-58, -2] },
    v: { hip: [130, 204], t: -42, th: 138, sh: 138, ft: 228, gr: [46, -30] },
  } },
  ab_rollout: { track: 'wrist', overlay: (j) => <circle cx={j.wrist[0]} cy={FLOOR - 9} r="9" fill="#475569" />, frames: {
    start: { knee: [100, 205], th: 8, sh: -90, ft: 0, t: 62, gr: [4, 52] },
    extend: { knee: [100, 205], th: -58, sh: -90, ft: 0, t: 86, gr: [56, 18] },
  } },
  plank: { frames: {
    hold: { hip: [118, 192], t: 80, th: -80, sh: -80, ft: 0, gr: [23, 24], eb: 1 },
  } },
  dragon_flag: { track: 'ankle', scene: () => <Bench x1={18} x2={118} y={170} />, frames: {
    top: { hip: [130, 120], t: -135, th: 135, sh: 135, ft: 225, gr: [-30, -4] },
    lowered: { hip: [144, 145], t: -105, th: 105, sh: 105, ft: 195, gr: [-30, -2] },
  } },
  tgu: { equip: 'kettlebell', track: 'shoulder', frames: {
    lying: { hip: [100, 200], t: -90, th: 150, sh: 30, th2: 90, sh2: 90, gr: [0, -58] },
    kneel: { knee: [120, 205], th: 0, sh: -90, ft: 0, t: 0, th2: 88, sh2: 0, gr: [0, -58] },
    stand: { ankle: A, t: 0, gr: [0, -58] },
  } },
  battle_rope: { overlay: (j) => <path d={`M${j.wrist[0]},${j.wrist[1]} Q${(j.wrist[0] + 250) / 2},${j.wrist[1] - 30} ${(j.wrist[0] * 0.3 + 250 * 0.7)},${(j.wrist[1] + 205) / 2} T250,205`} fill="none" stroke="#475569" strokeWidth="3" />, frames: {
    up: { ankle: A, sh: -20, th: 45, t: 22, gr: [42, -6] },
    down: { ankle: A, sh: -20, th: 45, t: 22, gr: [44, 34] },
  } },
};
