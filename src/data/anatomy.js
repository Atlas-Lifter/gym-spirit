

// 근육 해부도 데이터와 종목별 주동근·협응근
// 근육 그림에서 부위를 누르면 고르는 세부 부위. match는 EXERCISE_OPTIONS의 target 문자열(또는 ids 목록)로 종목을 거른다.
export const byIds = (ids) => (t, ex) => ids.includes(ex?.id);
export const MUSCLE_SUBGROUPS = {
  '가슴': [
    { key: '상부', label: '윗가슴 (대흉근 상부)', desc: '인클라인 바벨·덤벨 프레스, 랜드마인 프레스', ids: ['ip', 'idp', 'sip', 'landmine_p'] },
    { key: '중부', label: '가슴 중앙 (중부·안쪽)', desc: '벤치프레스, 체스트 프레스, 플라이, 헥스 프레스', ids: ['bp', 'dp_chest', 'pdf', 'cpm', 'dfly', 'hex_press', 'cable_press', 'cable_fly_stand', 'floor_press', 'spoto_press', 'pushup', 'cg_bench'] },
    { key: '하부', label: '아랫가슴 (대흉근 하부)', desc: '딥스, 디클라인 벤치프레스, 케이블 크로스오버', ids: ['dips', 'dbp', 'cf'] },
  ],
  '등': [
    { key: '상부', label: '등 상부 (승모·능형근)', desc: '슈러그, 페이스 풀, 체스트 서포티드·씰 로우', ids: ['chest_row', 'seal_row', 'face_pull', 'shrug_bb', 'shrug_db', 'cable_shrug', 'machine_shrug', 'smith_bshrug', 'bb_bshrug', 'snatch_shrug', 'clean_shrug', 'calf_shrug', 'mag_lpd'] },
    { key: '중부', label: '등 중부 (광배 폭·두께)', desc: '풀업, 랫풀다운, 바벨·티바·시티드 로우', ids: ['pu', 'pd', 'br', 'sr', 'tbar', 'csr', 'cu', 'astpu', 'prow', 'meadows_row', 'inv_row', 'apd', 'pullover_mac'] },
    { key: '하부', label: '등 하부 (광배 하부·기립근)', desc: '원암·클로즈그립 랫풀다운, 덤벨 로우, 데드리프트', ids: ['onearm_lpd', 'cg_pd', 'dr_back', 'dl', 'rack_pull'] },
  ],
  '어깨': [
    { key: '전면', label: '전면 삼각근', desc: '오버헤드·숄더 프레스, 프론트 레이즈', match: t => t.startsWith('어깨') && /전면|전\//.test(t) },
    { key: '측면', label: '측면 삼각근', desc: '사이드 레터럴 레이즈, 업라이트 로우', match: t => t.startsWith('어깨') && t.includes('측면') },
    { key: '후면', label: '후면 삼각근', desc: '리버스 펙덱, 벤트오버 레이즈, 페이스 풀', match: t => (t.startsWith('어깨') && t.includes('후면')) || t.includes('후면삼각근') },
  ],
  '팔': [
    { key: '이두', label: '이두근', desc: '바벨·덤벨·해머 컬', match: t => t.startsWith('팔') && t.includes('이두') },
    { key: '삼두', label: '삼두근', desc: '푸시다운, 익스텐션, 킥백', match: t => t.startsWith('팔') && t.includes('삼두') },
  ],
  '하체': [
    { key: '전면', label: '전면 (대퇴사두)', desc: '스쿼트, 레그 프레스, 레그 익스텐션', match: t => t.startsWith('하체') && t.includes('전면') },
    { key: '후면', label: '후면 (햄스트링·둔근)', desc: '루마니안 데드리프트, 레그 컬, 힙 쓰러스트', match: t => t.startsWith('하체') && /후면|햄스트링|둔근/.test(t) },
  ],
};
// 종목별 주동근(p) / 협응근(s). 여기 없는 종목은 target 문자열로 추정한다.
export const EXERCISE_MUSCLE_OVERRIDES = {
  // 사진으로 추가한 종목 중 부위 이름만으로는 근육이 정확히 안 나오는 것
  back_ext: { p: ['erectors', 'glutes'], s: ['hamstrings'] },
  superman: { p: ['erectors', 'glutes'], s: ['delt_rear'] },
  good_morning: { p: ['hamstrings', 'erectors'], s: ['glutes'] },
  sumo_dl: { p: ['glutes', 'quads', 'adductors'], s: ['hamstrings', 'erectors', 'traps'] },
  jump_sq: { p: ['quads', 'glutes'], s: ['calves'] },
  box_jump: { p: ['quads', 'glutes'], s: ['calves', 'hamstrings'] },
  mountain: { p: ['abs'], s: ['delt_front', 'quads', 'obliques'] },
  dead_bug: { p: ['abs'], s: ['obliques'] },
  bench_dips: { p: ['triceps'], s: ['pec_lower', 'delt_front'] },
  close_pushup: { p: ['triceps'], s: ['pec_lower', 'delt_front'] },
  decline_pushup: { p: ['pec_upper'], s: ['delt_front', 'triceps'] },
  incline_pushup: { p: ['pec_lower'], s: ['delt_front', 'triceps'] },
  weighted_pu: { p: ['lats'], s: ['biceps', 'midback'] },
  lr_front: { p: ['delt_front', 'delt_side'], s: ['traps'] },
  rope_rd_row: { p: ['delt_rear', 'midback'], s: ['traps'] },
  cable_hc: { p: ['biceps', 'forearm'], s: [] },
  plate_twist: { p: ['obliques'], s: ['abs'] },
  plie_sq: { p: ['adductors', 'glutes'], s: ['quads'] },
  scap_pu: { p: ['traps', 'midback'], s: ['lats'] },
  sa_db_pullover: { p: ['pec_lower', 'lats'], s: ['triceps', 'serratus'] },
  pushup_sp: { p: ['abs', 'obliques'], s: ['pec_lower', 'delt_front'] },
  pallof: { p: ['abs', 'obliques'], s: [] },
  kb_windmill: { p: ['obliques'], s: ['delt_side', 'glutes'] },
  kb_thruster: { p: ['quads', 'delt_front'], s: ['glutes', 'triceps'] },
  kb_sumo_hp: { p: ['traps', 'glutes'], s: ['delt_side', 'quads'] },
  star_jump: { p: ['quads', 'calves'], s: ['delt_side', 'glutes'] },
  tuck_jump: { p: ['quads', 'glutes'], s: ['abs', 'calves'] },
  oa_pushup: { p: ['pec_lower', 'triceps'], s: ['abs', 'delt_front'] },
  sq: { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'erectors'] },
  fsq: { p: ['quads'], s: ['glutes', 'abs'] },
  zercher_sq: { p: ['quads'], s: ['glutes', 'abs', 'biceps'] },
  vsq: { p: ['quads'], s: ['glutes'] },
  hack_sq: { p: ['quads'], s: ['glutes'] },
  smith_sq: { p: ['quads'], s: ['glutes', 'adductors'] },
  lpd: { p: ['quads'], s: ['glutes', 'adductors'] },
  s_lpd: { p: ['quads', 'glutes'], s: ['hamstrings'] },
  goblet: { p: ['quads'], s: ['glutes', 'abs'] },
  pistol_sq: { p: ['quads'], s: ['glutes', 'abs'] },
  lunge: { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'] },
  walk_lunge: { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'abs'] },
  bss: { p: ['glutes', 'quads'], s: ['hamstrings', 'adductors'] },
  step_up: { p: ['glutes', 'quads'], s: ['hamstrings'] },
  rdl: { p: ['hamstrings', 'glutes'], s: ['erectors'] },
  stiff_dl: { p: ['hamstrings'], s: ['glutes', 'erectors'] },
  deficit_dl: { p: ['hamstrings', 'erectors'], s: ['glutes', 'traps', 'forearm'] },
  dl: { p: ['erectors', 'glutes', 'hamstrings'], s: ['traps', 'lats', 'forearm', 'quads'] },
  rack_pull: { p: ['erectors', 'traps'], s: ['glutes', 'lats', 'forearm'] },
  ht: { p: ['glutes'], s: ['hamstrings'] },
  glute_kick: { p: ['glutes'], s: ['hamstrings'] },
  kb_swing: { p: ['glutes', 'hamstrings'], s: ['erectors', 'delt_front'] },
  nordic_curl: { p: ['hamstrings'], s: ['calves'] },
  outh: { p: ['glutes'], s: [] },
  pu: { p: ['lats'], s: ['biceps', 'midback'] },
  cu: { p: ['lats'], s: ['biceps', 'midback'] },
  astpu: { p: ['lats'], s: ['biceps', 'midback'] },
  apd: { p: ['lats'], s: ['triceps'] },
  db_pullover: { p: ['lats', 'pec_lower'], s: ['triceps'] },
  pullover_mac: { p: ['lats'], s: ['triceps'] },
  shrug_bb: { p: ['traps'], s: ['forearm'] },
  shrug_db: { p: ['traps'], s: ['forearm'] },
  bb_bshrug: { p: ['traps'], s: ['forearm', 'midback'] },
  snatch_shrug: { p: ['traps'], s: ['forearm', 'delt_side'] },
  clean_shrug: { p: ['traps'], s: ['forearm', 'erectors', 'glutes'] },
  calf_shrug: { p: ['traps'], s: [] },
  smith_uprow: { p: ['delt_side', 'traps'], s: ['biceps'] },
  face_pull: { p: ['delt_rear', 'midback'], s: ['traps'] },
  ohp: { p: ['delt_front'], s: ['delt_side', 'triceps', 'traps'] },
  smith_ohp: { p: ['delt_front'], s: ['delt_side', 'triceps'] },
  spm: { p: ['delt_front'], s: ['delt_side', 'triceps'] },
  dp: { p: ['delt_front'], s: ['delt_side', 'triceps'] },
  arnold: { p: ['delt_front', 'delt_side'], s: ['triceps'] },
  z_press: { p: ['delt_front'], s: ['triceps', 'abs'] },
  landmine_p: { p: ['delt_front', 'pec_upper'], s: ['triceps'] },
  uprow: { p: ['delt_side', 'traps'], s: ['biceps'] },
  y_raise: { p: ['delt_side', 'traps'], s: ['delt_rear'] },
  cable_y: { p: ['traps', 'delt_rear'], s: ['delt_side'] },
  dips: { p: ['pec_lower', 'triceps'], s: ['delt_front'] },
  cg_bench: { p: ['triceps'], s: ['pec_lower', 'delt_front'] },
  spoto_press: { p: ['pec_lower', 'pec_upper'], s: ['triceps', 'delt_front'] },
  rcurl: { p: ['forearm'], s: ['biceps'] },
  hc: { p: ['biceps', 'forearm'], s: [] },
  zottman_curl: { p: ['biceps', 'forearm'], s: [] },
  farmers_walk: { p: ['forearm', 'traps'], s: ['abs'] },
  plank: { p: ['abs'], s: ['obliques', 'delt_front'] },
  abroll: { p: ['abs'], s: ['lats', 'obliques'] },
  dragon_flag: { p: ['abs'], s: ['obliques'] },
  tgu: { p: ['delt_front', 'abs'], s: ['glutes', 'obliques'] },
  battle_rope: { p: ['delt_front', 'delt_side'], s: ['abs', 'forearm'] },
};
export const deriveMusclesFromTarget = (exercise) => {
  const t = String(exercise?.target || '');
  const name = String(exercise?.name || '');
  const group = t.split('(')[0];
  const sub = (t.match(/\((.*)\)/) || [])[1] || '';
  const isPress = /프레스|푸시업|딥스/.test(name);
  if (group === '가슴') {
    const p = sub.includes('상부') ? ['pec_upper'] : sub.includes('하부') ? ['pec_lower'] : ['pec_upper', 'pec_lower'];
    return { p, s: isPress ? ['delt_front', 'triceps'] : ['delt_front'] };
  }
  if (group === '등') {
    if (sub.includes('승모')) return { p: ['traps', 'midback'], s: ['lats', 'biceps', 'delt_rear'] };
    if (sub.includes('광배')) return { p: ['lats'], s: ['biceps', 'midback', 'delt_rear'] };
    return { p: ['lats', 'midback'], s: ['biceps', 'traps', 'delt_rear', 'erectors'] };
  }
  if (group === '어깨') {
    const p = [];
    if (/전면|전\//.test(sub)) p.push('delt_front');
    if (sub.includes('측면')) p.push('delt_side');
    if (sub.includes('후면')) p.push('delt_rear');
    return { p: p.length ? p : ['delt_front', 'delt_side'], s: ['traps'] };
  }
  if (group === '팔') {
    if (sub.includes('삼두')) return { p: ['triceps'], s: [] };
    if (sub.includes('전완')) return { p: ['forearm'], s: [] };
    return { p: ['biceps'], s: ['forearm'] };
  }
  if (group === '복근') {
    if (sub.includes('외복사근')) return { p: ['obliques'], s: ['abs'] };
    return { p: ['abs'], s: ['obliques'] };
  }
  if (group === '하체') {
    if (sub.includes('내전근')) return { p: ['adductors'], s: [] };
    if (sub.includes('종아리')) return { p: ['calves'], s: [] };
    if (sub.includes('후면') || sub.includes('햄스트링')) return { p: ['hamstrings'], s: ['glutes'] };
    if (sub.includes('둔근')) return { p: ['glutes'], s: ['hamstrings'] };
    return { p: ['quads'], s: ['glutes'] };
  }
  return { p: ['abs', 'delt_front'], s: ['glutes', 'quads'] };
};
export const getExerciseMuscles = (exercise) => EXERCISE_MUSCLE_OVERRIDES[exercise?.id] || deriveMusclesFromTarget(exercise);
export const MUSCLE_LABELS = {
  pec_upper: '윗가슴', pec_lower: '가슴 중·하부', delt_front: '전면 삼각근', delt_side: '측면 삼각근', delt_rear: '후면 삼각근',
  biceps: '이두근', triceps: '삼두근', forearm: '전완근', abs: '복직근', obliques: '복사근', serratus: '전거근',
  lats: '광배근', traps: '승모근', midback: '등 중앙(능형근)', erectors: '척추기립근', quads: '대퇴사두근',
  adductors: '내전근', glutes: '둔근', hamstrings: '햄스트링', calves: '종아리', tibialis: '전경골근',
};
export const BACK_VIEW_MUSCLES = ['delt_rear', 'triceps', 'lats', 'traps', 'midback', 'erectors', 'glutes', 'hamstrings', 'calves'];
export const FRONT_VIEW_MUSCLES = ['pec_upper', 'pec_lower', 'delt_front', 'delt_side', 'biceps', 'abs', 'obliques', 'serratus', 'quads', 'adductors', 'tibialis'];
export const LOWER_BODY_MUSCLES = ['quads', 'adductors', 'glutes', 'hamstrings', 'calves', 'tibialis'];
// 주동근이 잘 보이는 면(앞/뒤)과 확대 영역을 고른다
export const getExerciseMuscleView = ({ p, s }) => {
  const score = (list, w) => list.reduce((acc, id) => acc + (BACK_VIEW_MUSCLES.includes(id) ? w : 0) - (FRONT_VIEW_MUSCLES.includes(id) ? w : 0), 0);
  // 주동근끼리 앞뒤가 비기면(예: 스쿼트의 대퇴사두+둔근) 앞면을 보여준다
  const primaryScore = score(p, 1);
  const side = primaryScore > 0 || (primaryScore === 0 && p.every(id => !FRONT_VIEW_MUSCLES.includes(id)) && score(s, 1) > 0) ? 'back' : 'front';
  const lower = p.filter(id => LOWER_BODY_MUSCLES.includes(id)).length;
  const thighOnly = p.every(id => ['quads', 'adductors', 'glutes', 'hamstrings'].includes(id));
  const crop = lower === p.length ? (thighOnly ? 'thigh' : 'lower') : lower === 0 ? 'upper' : 'full';
  return { side, crop };
};
