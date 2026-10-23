// 3대 1RM으로 다른 종목의 1RM을 추정한다.
//
// 근거 데이터: Strength Level(strengthlevel.com) 남성·체중 80kg 기준 1RM 기준표
//   [초급, 입문, 중급, 상급, 엘리트]. 실제 리프터 기록을 모아 만든 표로, 바벨은 봉 20kg 포함,
//   덤벨은 덤벨 1개 무게, 머신·케이블은 기구 표시 무게다. (2026-10 조회)
// 방법: 내 3대 기록이 기준표에서 어느 수준(초급~엘리트 사이 위치)인지 구한 뒤,
//   다른 종목도 같은 수준이라고 보고 그 종목 기준표에서 같은 위치의 무게를 읽는다.
//   단순히 "스쿼트의 몇 %"로 곱하지 않는 이유: 종목마다 초급→엘리트로 늘어나는 폭이 다르기 때문
//   (예: 레그 프레스는 초급 때 스쿼트의 1.45배, 엘리트 때 1.92배).
// 기준이 되는 3대: 무릎 위주 하체 → 스쿼트, 엉덩이·등 → 데드리프트, 미는 운동 → 벤치,
//   당기는 상체·팔 → 벤치와 데드리프트의 평균 수준.
// 기준표에 없는 종목은 가장 비슷한 종목에 보정 배수를 곱했다 (confidence: 'derived').

const SL = {
  squat: [75, 101, 132, 168, 206], bench: [56, 75, 98, 124, 151], deadlift: [89, 119, 155, 196, 239],
  front_squat: [59, 79, 104, 133, 163], leg_press: [109, 162, 230, 309, 395], hack_squat: [63, 102, 152, 213, 280],
  smith_squat: [57, 84, 118, 158, 202], leg_extension: [48, 72, 103, 140, 180], seated_leg_curl: [39, 58, 83, 112, 144],
  rdl: [65, 92, 125, 163, 203], sldl: [66, 94, 130, 170, 215], hip_thrust: [56, 96, 149, 213, 285],
  db_lunge: [10, 18, 30, 45, 62], db_bss: [13, 22, 33, 47, 63], goblet: [15, 26, 41, 59, 80],
  calf_machine: [49, 88, 141, 207, 282], hip_add: [41, 67, 102, 145, 192], hip_abd: [38, 63, 95, 135, 179],
  rack_pull: [99, 138, 185, 239, 297], bb_shrug: [53, 85, 126, 175, 230], db_shrug: [17, 28, 44, 63, 84],
  incline_bench: [50, 66, 87, 109, 134], decline_bench: [58, 79, 104, 133, 164], cg_bench: [55, 72, 93, 116, 140],
  db_bench: [19, 28, 40, 53, 68], incline_db: [22, 29, 39, 50, 62], db_fly: [8, 15, 24, 35, 47],
  chest_press: [39, 61, 89, 123, 160], machine_fly: [42, 63, 89, 119, 152], cable_fly: [8, 19, 36, 58, 84],
  smith_bench: [53, 72, 95, 120, 148], db_pullover: [15, 24, 35, 49, 65],
  ohp: [33, 46, 62, 81, 101], seated_db_shoulder: [18, 25, 34, 44, 54], machine_shoulder: [29, 50, 76, 109, 145],
  arnold: [10, 16, 24, 34, 44], db_lateral: [5, 10, 16, 25, 34], cable_lateral: [3, 8, 16, 27, 39],
  db_front: [4, 10, 17, 27, 38], upright_row: [23, 39, 59, 84, 111], face_pull: [15, 29, 47, 69, 95],
  landmine_press: [20, 35, 56, 82, 112],
  bb_row: [48, 66, 88, 114, 141], pendlay: [53, 70, 91, 114, 138], tbar: [38, 58, 82, 111, 143],
  db_row: [19, 30, 43, 59, 76], cable_row: [47, 65, 87, 112, 140], lat_pulldown: [47, 64, 85, 108, 133],
  cg_pulldown: [54, 71, 92, 115, 139], machine_row: [47, 72, 104, 142, 184], straight_arm: [20, 34, 54, 77, 104],
  bb_curl: [22, 33, 46, 63, 80], db_curl: [8, 14, 22, 32, 42], ez_curl: [25, 35, 46, 60, 75],
  hammer: [11, 16, 24, 33, 42], preacher: [20, 31, 45, 61, 78], cable_curl: [20, 33, 51, 73, 98],
  incline_db_curl: [10, 14, 20, 26, 33], conc_curl: [9, 14, 22, 30, 40], reverse_curl: [15, 26, 40, 57, 76],
  pushdown: [22, 36, 56, 80, 107], rope_pushdown: [17, 30, 46, 66, 89], lying_tri: [20, 30, 43, 59, 76],
  db_tri_ext: [6, 12, 22, 33, 47], cable_oh_tri: [14, 26, 43, 64, 87], db_kickback: [5, 10, 18, 28, 40],
  wrist_curl: [7, 21, 44, 74, 110], cable_crunch: [26, 44, 68, 97, 130],
};

// 종목 id → [기준표, 보정 배수, 기준 3대]. 배수 1이면 기준표 그대로(data), 아니면 비슷한 종목에서 보정(derived)
const MAP = {
  // 하체 (무릎 위주 → 스쿼트)
  sq: ['squat', 1, 'sq'], fsq: ['front_squat', 1, 'sq'], smith_sq: ['smith_squat', 1, 'sq'], hack_sq: ['hack_squat', 1, 'sq'],
  vsq: ['hack_squat', 1, 'sq'], lpd: ['leg_press', 1, 'sq'], s_lpd: ['leg_press', 0.55, 'sq'], le: ['leg_extension', 1, 'sq'],
  lunge: ['db_lunge', 1, 'sq'], walk_lunge: ['db_lunge', 1.9, 'sq'], bss: ['db_bss', 1, 'sq'], goblet: ['goblet', 1, 'sq'],
  step_up: ['db_lunge', 0.9, 'sq'], zercher_sq: ['front_squat', 0.95, 'sq'], calf: ['calf_machine', 1, 'sq'],
  inth: ['hip_add', 1, 'sq'], outh: ['hip_abd', 1, 'sq'],
  // 하체 뒤쪽·엉덩이 (→ 데드리프트)
  dl: ['deadlift', 1, 'dl'], rdl: ['rdl', 1, 'dl'], stiff_dl: ['sldl', 1, 'dl'], deficit_dl: ['deadlift', 0.9, 'dl'],
  rack_pull: ['rack_pull', 1, 'dl'], ht: ['hip_thrust', 1, 'dl'], lc: ['seated_leg_curl', 1, 'dl'], glute_kick: ['hip_abd', 0.3, 'dl'],
  // 등 (→ 데드리프트, 당기는 상체 → 벤치·데드 평균)
  br: ['bb_row', 1, 'dl'], prow: ['pendlay', 1, 'dl'], tbar: ['tbar', 1, 'dl'], dr_back: ['db_row', 1, 'dl'],
  meadows_row: ['tbar', 0.55, 'dl'], seal_row: ['bb_row', 0.8, 'dl'], sr: ['machine_row', 1, 'dl'], csr: ['cable_row', 1, 'dl'],
  chest_row: ['machine_row', 0.9, 'dl'], shrug_bb: ['bb_shrug', 1, 'dl'], shrug_db: ['db_shrug', 1, 'dl'],
  pd: ['lat_pulldown', 1, 'pull'], cg_pd: ['cg_pulldown', 1, 'pull'], mag_lpd: ['cg_pulldown', 1, 'pull'], onearm_lpd: ['lat_pulldown', 0.5, 'pull'],
  apd: ['straight_arm', 1, 'pull'], pullover_mac: ['straight_arm', 1.3, 'pull'], face_pull: ['face_pull', 1, 'pull'],
  // 가슴 (→ 벤치)
  bp: ['bench', 1, 'bp'], ip: ['incline_bench', 1, 'bp'], dbp: ['decline_bench', 1, 'bp'], cg_bench: ['cg_bench', 1, 'bp'],
  sip: ['incline_bench', 0.97, 'bp'], cpm: ['chest_press', 1, 'bp'], dp_chest: ['db_bench', 1, 'bp'], idp: ['incline_db', 1, 'bp'],
  dfly: ['db_fly', 1, 'bp'], cf: ['cable_fly', 1, 'bp'], cable_fly_stand: ['cable_fly', 1, 'bp'], pdf: ['machine_fly', 1, 'bp'],
  db_pullover: ['db_pullover', 1, 'bp'], cable_press: ['chest_press', 0.6, 'bp'], floor_press: ['bench', 0.9, 'bp'],
  hex_press: ['db_bench', 0.8, 'bp'], spoto_press: ['bench', 0.9, 'bp'],
  // 어깨 (→ 벤치, 뒤쪽 어깨는 당기는 평균)
  ohp: ['ohp', 1, 'bp'], smith_ohp: ['ohp', 1.05, 'bp'], spm: ['machine_shoulder', 1, 'bp'], dp: ['seated_db_shoulder', 1, 'bp'],
  arnold: ['arnold', 1, 'bp'], landmine_p: ['landmine_press', 1, 'bp'], z_press: ['ohp', 0.85, 'bp'],
  fr: ['db_front', 1, 'bp'], cable_front: ['cable_lateral', 1.1, 'bp'], plate_front: ['db_front', 1.5, 'bp'],
  lr: ['db_lateral', 1, 'bp'], clr: ['cable_lateral', 1, 'bp'], egyptian_lr: ['cable_lateral', 0.9, 'bp'], machine_lr: ['cable_lateral', 1.6, 'bp'],
  uprow: ['upright_row', 1, 'bp'], y_raise: ['db_lateral', 0.5, 'bp'], cable_y: ['cable_lateral', 0.6, 'bp'],
  rpdf: ['machine_fly', 0.55, 'pull'], bentover: ['db_lateral', 0.9, 'pull'],
  // 팔: 이두 (→ 당기는 평균), 삼두 (→ 벤치)
  bc: ['bb_curl', 1, 'pull'], ez_curl: ['ez_curl', 1, 'pull'], dc: ['db_curl', 1, 'pull'], hc: ['hammer', 1, 'pull'],
  inc_curl: ['incline_db_curl', 1, 'pull'], spider_curl: ['conc_curl', 0.95, 'pull'], con_curl: ['conc_curl', 1, 'pull'],
  cable_curl: ['cable_curl', 1, 'pull'], pcurl: ['preacher', 1, 'pull'], bayesian_curl: ['cable_curl', 0.5, 'pull'],
  zottman_curl: ['db_curl', 0.85, 'pull'], rcurl: ['reverse_curl', 1, 'pull'], wrist_curl: ['wrist_curl', 1, 'pull'], rev_wrist: ['wrist_curl', 0.5, 'pull'],
  tc: ['pushdown', 1, 'bp'], rope_pd: ['rope_pushdown', 1, 'bp'], ct: ['cable_oh_tri', 1, 'bp'], sc: ['lying_tri', 1, 'bp'],
  french_p: ['db_tri_ext', 1, 'bp'], tkb: ['db_kickback', 1, 'bp'], kickback_cable: ['db_kickback', 1, 'bp'],
  // 복근 (→ 3대 평균)
  ccrunch: ['cable_crunch', 1, 'all'],
};

const ANCHOR_TABLE = { sq: SL.squat, bp: SL.bench, dl: SL.deadlift };
export const ANCHOR_NAME = { sq: '스쿼트', bp: '벤치', dl: '데드리프트', pull: '벤치·데드', all: '3대' };

// 기준표에서 무게 → 수준 위치 (0=초급 … 4=엘리트, 양끝은 마지막 구간 기울기로 연장)
const levelOf = (w, t) => {
  if (!(w > 0)) return null;
  for (let i = 0; i < t.length - 1; i++) if (w <= t[i + 1]) return i + (w - t[i]) / (t[i + 1] - t[i]);
  const n = t.length - 1;
  return n + (w - t[n]) / (t[n] - t[n - 1]);
};
// 수준 위치 → 그 종목 기준표의 무게
const weightAt = (p, t) => {
  const i = Math.max(0, Math.min(t.length - 2, Math.floor(p)));
  return t[i] + (p - i) * (t[i + 1] - t[i]);
};

// anchors: { sq, bp, dl } 사용자의 3대 1RM(kg). 없으면 0
export const estimateFromLifts = (id, anchors = {}) => {
  const m = MAP[id];
  if (!m) return null;
  const [key, factor, anchor] = m;
  const lv = (k) => levelOf(anchors[k], ANCHOR_TABLE[k]);
  const known = ['sq', 'bp', 'dl'].map(lv).filter(v => v !== null);
  if (!known.length) return null;
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  let p;
  if (anchor === 'pull') { const xs = [lv('bp'), lv('dl')].filter(v => v !== null); p = xs.length ? avg(xs) : avg(known); }
  else if (anchor === 'all') p = avg(known);
  else p = lv(anchor) ?? avg(known); // 기준 3대가 없으면 나머지 3대의 평균 수준
  p = Math.max(-0.8, Math.min(5.5, p));
  const w = weightAt(p, SL[key]) * factor;
  if (!(w > 0)) return null;
  return { rm: Math.round(w * 2) / 2, anchor, confidence: factor === 1 ? 'data' : 'derived' };
};

export const hasStrengthStandard = (id) => !!MAP[id];
