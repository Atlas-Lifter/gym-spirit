import { PATTERNS } from '../movementPatterns.jsx';
import { EXERCISE_TIPS } from './exerciseTips.js';

// 사진으로 추가한 종목의 단계별 그림 설명서
// 가장 비슷한 동작 패턴(pt)을 골라, 짧은 설명 3단계(준비 → 동작 → 돌아오기)를 그 패턴의 자세 그림과 함께 보여준다.
// [패턴, 기구 바꾸기(선택: 'dumbbell' | 'barbell' | 'kettlebell' | 'ezbar' | 'plate' | 'none')]
const PT = {
  // ── 하체 ──
  seated_lc: ['leg_curl'], standing_lc: ['leg_curl'], seated_calf: ['calf_raise'], db_calf: ['calf_raise'],
  box_sq: ['squat_back'], bb_lunge: ['lunge_barbell'], db_sq: ['squat_goblet'], sumo_dl: ['deadlift'],
  good_morning: ['rdl'], back_ext: ['rdl', 'none'], glute_bridge: ['hip_thrust'], sl_bridge: ['hip_thrust', 'none'],
  rev_lunge: ['lunge'], bw_sq: ['squat_goblet', 'none'], jump_sq: ['squat_goblet', 'none'], box_jump: ['step_up', 'none'],
  cable_add: ['hip_add_abd'],
  wide_sq: ['squat_back'], narrow_lpd: ['leg_press'], sl_le: ['leg_ext'], smith_calf: ['calf_raise'], bb_calf: ['calf_raise'],
  lp_calf: ['leg_press'], db_sldl: ['rdl', 'dumbbell'], smith_sldl: ['rdl'], sl_rdl: ['rdl', 'kettlebell'],
  pull_through: ['kb_swing', 'none'], plie_sq: ['squat_goblet'], bb_stepup: ['step_up'], walk_lunge_bw: ['lunge', 'none'],
  smith_split: ['split_squat', 'none'], bw_bridge: ['hip_thrust', 'none'], donkey_kick: ['glute_kick'], rev_hyper: ['glute_kick'],
  kb_front_sq: ['squat_goblet', 'kettlebell'], jump_lunge: ['lunge', 'none'], tuck_jump: ['squat_goblet', 'none'],
  star_jump: ['y_raise', 'none'], floor_ghr: ['nordic'],
  // ── 가슴 ──
  inc_dfly: ['fly'], dec_db_press: ['bench_press_db'], decline_pushup: ['pushup'], incline_pushup: ['pushup'],
  inc_cpm: ['chest_press_machine'], smith_bp: ['bench_press'], low_cf: ['cable_cross'], wide_bp: ['bench_press'],
  neutral_dbp: ['bench_press_db'],
  machine_bp: ['chest_press_machine'], dec_cpm: ['chest_press_machine'], smith_dec: ['decline_press'], dec_dfly: ['fly'],
  inc_cable_fly: ['cable_cross'], flat_cable_fly: ['cable_cross'], inc_cable_press: ['cable_press'], stand_cable_press: ['cable_press'],
  sa_cable_cross: ['cable_cross'], neutral_idp: ['incline_press', 'dumbbell'], oa_dbp: ['bench_press_db'], sa_db_pullover: ['pullover'],
  wide_pushup: ['pushup'], plyo_pushup: ['pushup'], wide_dec_bp: ['decline_press'], oa_pushup: ['pushup'],
  // ── 등 ──
  db_row2: ['bent_row', 'dumbbell'], smith_row: ['bent_row'], high_row: ['lat_pulldown'], rev_br: ['bent_row'],
  under_pd: ['lat_pulldown'], weighted_pu: ['pullup'], cable_shrug: ['shrug'], machine_shrug: ['shrug'],
  wide_pu: ['pullup'], vbar_pu: ['pullup'], scap_pu: ['pullup'], kneel_hp_row: ['lat_pulldown'], oa_csr: ['cable_row'],
  neutral_db_row: ['bent_row', 'dumbbell'], oa_lm_row: ['db_row', 'barbell'], lm_tbar: ['bent_row'], inc_bench_row: ['chest_supported_row', 'barbell'],
  rope_apd: ['straight_arm_pulldown'], shotgun_row: ['cable_row'], kb_row: ['db_row', 'kettlebell'], smith_bshrug: ['shrug'],
  // ── 어깨 ──
  cable_rdf: ['reverse_fly'], seated_lr: ['lateral_raise'], rope_rd_row: ['face_pull'], reverse_fly: ['bentover_raise'],
  lr_front: ['lateral_raise'],
  stand_dp: ['ohp_standing', 'dumbbell'], seated_bb_ohp: ['ohp_seated', 'barbell'], cable_ohp: ['ohp_machine'],
  db_uprow: ['upright_row', 'dumbbell'], cable_uprow: ['upright_row'], bo_cable_lr: ['bentover_raise', 'none'],
  lying_rdr: ['bentover_raise'], oa_lr: ['lateral_raise'], cable_er: ['face_pull'], db_er: ['face_pull', 'dumbbell'],
  cuban_press: ['upright_row', 'dumbbell'], neutral_ohp: ['ohp_standing', 'dumbbell'], btn_press: ['ohp_standing'],
  // ── 팔 ──
  machine_curl: ['curl_preacher', 'none'], cable_hc: ['curl_cable'], cable_pcurl: ['curl_preacher', 'none'], overhead_cc: ['curl_cable'],
  seated_dc: ['curl'], machine_tri: ['pushdown'], vbar_pd: ['pushdown'], rev_pd: ['pushdown'], close_pushup: ['pushup'],
  bench_dips: ['dips'],
  alt_hc: ['curl'], alt_dc: ['curl'], bb_pcurl: ['curl_preacher', 'barbell'], oa_db_pcurl: ['curl_preacher', 'dumbbell'], cross_hc: ['curl'],
  drag_curl: ['curl', 'barbell'], wide_bc: ['curl', 'barbell'], cg_bc: ['curl', 'barbell'], rev_cable_curl: ['curl_cable'],
  inc_hc: ['curl_incline'], ez_skull: ['skullcrusher'], jm_press: ['skullcrusher', 'barbell'], tri_dips: ['dips'], dip_machine: ['dips'],
  lying_db_ext: ['skullcrusher', 'dumbbell'], oa_db_ohext: ['overhead_ext'], tate_press: ['skullcrusher', 'dumbbell'],
  cable_lying_ext: ['skullcrusher'], oa_cable_ohext: ['overhead_ext_cable'], db_wrist_curl: ['wrist_curl'],
  btb_wrist_curl: ['wrist_curl', 'barbell'], db_rev_curl: ['curl'],
  // ── 복근·전신 ──
  ab_machine: ['crunch'], rev_crunch: ['lying_leg_raise'], mountain: ['plank'], dead_bug: ['bicycle'], captain: ['hanging_leg_raise'],
  oblique_cr: ['crunch'], superman: ['plank'], flutter: ['lying_leg_raise'], side_bend: ['shrug', 'dumbbell'], plate_twist: ['russian_twist'],
  situp: ['crunch'], cross_crunch: ['crunch'], bench_kneeup: ['lying_leg_raise'], heel_touch: ['crunch'],
  stand_cable_crunch: ['cable_crunch'], cable_rtwist: ['russian_twist', 'none'], pallof: ['cable_press'], cable_lift: ['woodchop'],
  cable_side_bend: ['woodchop'], bb_rollout: ['ab_rollout'], kb_windmill: ['ohp_standing', 'kettlebell'], pushup_sp: ['plank'],
  kb_thruster: ['squat_goblet', 'kettlebell'], kb_sumo_hp: ['upright_row', 'kettlebell'],
};

const TITLES = ['준비 자세', '동작', '돌아오기'];

export const PHOTO_GUIDES = Object.fromEntries(Object.entries(PT)
  .filter(([id, [pt]]) => EXERCISE_TIPS[id] && PATTERNS[pt])
  .map(([id, [pt, eq]]) => {
    const tip = EXERCISE_TIPS[id];
    const frames = Object.keys(PATTERNS[pt].frames);
    const a = frames[0], b = frames[1] || frames[0];
    // 1단계는 시작 자세, 2단계는 힘을 쓰는 자세(시작 자세를 흐리게 겹쳐서), 3단계는 다시 시작 자세로
    const steps = [
      [a, TITLES[0], tip.how[0]],
      [b, TITLES[1], tip.how[1], b !== a ? a : undefined],
      [a, TITLES[2], tip.how[2], b !== a ? b : undefined],
    ];
    return [id, { pt, ...(eq ? { eq } : {}), sum: tip.sum, steps, tips: [], warn: tip.warn }];
  }));
