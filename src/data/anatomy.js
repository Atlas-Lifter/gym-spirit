

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
    { key: '상부', label: '등 상부 (승모·능형근)', desc: '슈러그, 페이스 풀, 체스트 서포티드·씰 로우', ids: ['chest_row', 'seal_row', 'face_pull', 'shrug_bb', 'shrug_db', 'mag_lpd'] },
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
// 해부도 스타일 근육 차트: 몸 왼쪽 절반(화면 기준)만 그리고 x=200 기준으로 좌우 반전해 대칭을 만든다.
// id는 종목 썸네일에서 강조할 세부 근육, group은 분석 탭 회복도 부위.
export const ANATOMY_SKIN_HALF = 'M200,62 L189,64 C189,72 190,78 188,84 C176,88 160,90 148,94 C134,98 127,110 127,126 C126,142 126,160 124,176 C121,198 116,222 114,244 C111,254 109,264 112,274 C116,282 124,279 125,270 C126,260 128,251 131,242 C135,222 139,202 141,184 C143,170 146,160 150,148 C153,170 157,194 161,214 C159,228 154,240 154,256 C152,290 155,318 159,340 C157,366 159,396 165,424 L162,436 C170,442 186,442 189,436 L187,424 C190,400 193,372 190,346 C193,318 197,288 198,258 L200,254 Z';
// 몸 중앙선(x=200)은 빼고 바깥 윤곽만
export const ANATOMY_OUTLINE_HALF = 'M189,64 C189,72 190,78 188,84 C176,88 160,90 148,94 C134,98 127,110 127,126 C126,142 126,160 124,176 C121,198 116,222 114,244 C111,254 109,264 112,274 C116,282 124,279 125,270 C126,260 128,251 131,242 C135,222 139,202 141,184 C143,170 146,160 150,148 C153,170 157,194 161,214 C159,228 154,240 154,256 C152,290 155,318 159,340 C157,366 159,396 165,424 L162,436 C170,442 186,442 189,436 L187,424 C190,400 193,372 190,346 C193,318 197,288 198,258';
// 전면 (그리는 순서가 곧 겹침 순서)
export const ANATOMY_MUSCLES = [
  { id: 'lats', group: '등', d: 'M153,140 C151,160 155,186 160,210 C164,194 167,174 167,156 C162,149 158,143 153,140 Z', fibers: ['M156,150 C157,170 159,188 160,202'] },
  { id: 'traps', group: '등', d: 'M189,82 C178,88 166,91 156,93 C166,96 178,97 188,97 L190,86 Z', fibers: ['M186,88 L162,94'] },
  { id: 'serratus', group: '등', d: 'M166,152 L176,156 L174,162 L165,158 Z' },
  { id: 'serratus', group: '등', d: 'M166,162 L177,167 L175,173 L166,169 Z' },
  { id: 'serratus', group: '등', d: 'M167,172 L177,178 L176,184 L168,180 Z' },
  { id: 'obliques', group: '복근', d: 'M169,186 C166,202 166,218 168,232 C172,241 178,246 184,250 L183,188 C178,186 173,185 169,186 Z', fibers: ['M172,192 L181,212', 'M170,206 L181,226', 'M170,220 L181,240'] },
  { id: 'abs', group: '복근', d: 'M184,157 C190,154 196,154 198,155 L198,175 L184,176 Z' },
  { id: 'abs', group: '복근', d: 'M184,179 L198,178 L198,198 L184,199 Z' },
  { id: 'abs', group: '복근', d: 'M184,202 L198,201 L198,221 L184,222 Z' },
  { id: 'abs', group: '복근', d: 'M184,225 L198,224 L198,252 C193,250 188,248 184,246 Z' },
  { id: 'pec_lower', group: '가슴', d: 'M198,119 C184,119 168,121 153,123 C152,127 152,131 152,134 C160,147 176,153 190,151 C196,150 198,146 198,140 Z', fibers: ['M195,128 L155,128', 'M195,138 L157,136', 'M192,146 L162,141'] },
  { id: 'pec_upper', group: '가슴', d: 'M198,100 C186,97 170,97 160,101 C155,108 153,116 153,123 C168,121 184,119 198,119 Z', fibers: ['M195,106 L157,114', 'M195,114 L155,121'] },
  { id: 'delt_side', group: '어깨', d: 'M154,93 C138,96 128,108 128,124 C128,136 130,144 133,150 C134,134 138,118 146,104 C149,99 152,96 154,93 Z', fibers: ['M146,99 C137,110 132,124 132,142'] },
  { id: 'delt_front', group: '어깨', d: 'M154,93 C148,100 140,114 136,128 C134,138 134,146 136,155 C140,144 143,130 150,120 C155,112 160,104 161,97 Z', fibers: ['M155,100 C147,112 142,126 139,146'] },
  { id: 'triceps', group: '팔', d: 'M128,130 C127,146 127,160 126,172 L131,171 C131,156 131,142 131,132 Z' },
  { id: 'biceps', group: '팔', d: 'M140,116 C134,126 130,144 130,160 C130,170 133,177 139,178 C144,166 147,148 147,132 C147,124 144,118 140,116 Z', fibers: ['M139,122 C136,140 135,158 137,173'] },
  { id: 'forearm', group: '팔', d: 'M126,180 C121,198 117,220 115,242 L121,243 C124,222 129,202 134,184 Z', fibers: ['M126,190 L119,236'] },
  { id: 'forearm', group: '팔', d: 'M134,184 C130,204 125,224 122,243 L130,242 C134,222 138,204 141,186 Z', fibers: ['M136,192 L127,236'] },
  { id: 'adductors', group: '하체', d: 'M181,256 C186,274 191,290 194,302 C196,285 197,270 198,258 Z' },
  { id: 'quads', group: '하체', d: 'M157,256 C152,280 152,310 159,336 C164,322 168,296 168,272 C166,264 162,258 157,256 Z', fibers: ['M159,268 C157,290 158,310 161,328'] },
  { id: 'quads', group: '하체', d: 'M168,256 C165,282 167,310 175,334 C181,312 183,282 181,258 C177,254 172,254 168,256 Z', fibers: ['M174,262 C173,285 174,308 176,328'] },
  { id: 'quads', group: '하체', d: 'M186,300 C179,312 179,328 185,340 C191,336 194,322 191,306 Z' },
  { id: 'calves', group: '하체', d: 'M162,352 C157,368 158,386 163,402 C169,392 172,374 172,356 Z', fibers: ['M165,360 L165,394'] },
  { id: 'calves', group: '하체', d: 'M180,352 C182,370 184,388 187,398 C191,384 191,364 187,350 Z', fibers: ['M185,358 L187,390'] },
  { id: 'tibialis', group: '하체', d: 'M173,358 C171,380 172,400 176,420 L181,420 C180,400 179,378 178,358 Z' },
];
// 후면 (종목 썸네일 전용)
export const ANATOMY_BACK_MUSCLES = [
  { id: 'lats', d: 'M150,142 C152,165 156,190 162,214 C170,210 180,200 192,190 L196,165 C186,150 168,144 150,142 Z', fibers: ['M156,150 C164,168 176,182 190,186', 'M154,164 C160,182 170,196 184,200'] },
  { id: 'midback', d: 'M160,106 C152,116 148,128 150,140 C160,140 172,136 184,128 C176,116 168,108 160,106 Z', fibers: ['M156,118 L178,128'] },
  { id: 'traps', d: 'M200,64 L190,66 C188,76 182,86 156,94 C168,100 182,112 192,140 L200,170 Z', fibers: ['M196,74 L162,94', 'M198,100 L172,104', 'M198,130 L186,116'] },
  { id: 'erectors', d: 'M190,172 C188,195 188,220 190,248 L198,250 L198,172 Z', fibers: ['M194,178 L194,244'] },
  { id: 'delt_rear', d: 'M154,93 C138,96 128,108 128,124 C128,136 131,146 136,154 C140,140 146,124 156,112 C160,106 160,99 158,95 Z', fibers: ['M152,100 C142,110 136,126 135,146'] },
  { id: 'triceps', d: 'M128,126 C126,142 126,160 127,176 C132,178 138,176 141,172 C143,158 144,140 142,124 C138,118 132,120 128,126 Z', fibers: ['M134,128 C133,146 133,160 134,172'] },
  { id: 'forearm', d: 'M126,182 C121,200 117,222 115,242 L129,242 C134,222 138,204 141,186 Z', fibers: ['M131,190 L122,236'] },
  { id: 'glutes', d: 'M161,216 C155,230 154,248 156,262 C168,272 186,272 198,262 L198,226 C188,220 174,216 161,216 Z', fibers: ['M164,228 C172,246 184,258 196,262'] },
  { id: 'hamstrings', d: 'M157,270 C154,294 156,316 162,338 C168,320 172,296 172,274 Z', fibers: ['M163,280 L164,330'] },
  { id: 'hamstrings', d: 'M174,274 C174,298 178,320 186,338 C192,318 196,294 196,272 Z', fibers: ['M185,282 L186,330'] },
  { id: 'calves', d: 'M161,348 C154,366 156,388 166,404 C172,392 175,372 175,352 Z', fibers: ['M165,358 L166,396'] },
  { id: 'calves', d: 'M178,350 C178,370 182,390 188,402 C193,386 193,366 189,348 Z', fibers: ['M184,358 L186,394'] },
];
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
export const MUSCLE_THUMB_VIEWBOX = { upper: '104 58 192 192', thigh: '118 204 164 164', lower: '86 212 228 228', full: '72 62 256 300' };
