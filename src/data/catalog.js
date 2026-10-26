import { weightRule } from '../weightRules.js';

// 종목·프로그램·레전드 루틴·음식·아바타 색 같은 고정 데이터와 종목 정보 도우미
export const EXERCISE_OPTIONS = [
  { id: 'sq', name: '바벨 스쿼트', target: '하체(전면)', tool: '바벨' },
  { id: 'fsq', name: '프론트 스쿼트', target: '하체(전면)', tool: '바벨' },
  { id: 'vsq', name: '브이스쿼트', target: '하체(전면)', tool: '머신' },
  { id: 'hack_sq', name: '핵 스쿼트', target: '하체(전면)', tool: '머신' },
  { id: 'smith_sq', name: '스미스머신 스쿼트', target: '하체(전면)', tool: '머신' },
  { id: 'lpd', name: '레그 프레스', target: '하체(전면)', tool: '머신' },
  { id: 's_lpd', name: '원레그 프레스', target: '하체(전체)', tool: '머신' },
  { id: 'le', name: '레그 익스텐션', target: '하체(전면)', tool: '머신' },
  { id: 'lc', name: '레그 컬', target: '하체(후면)', tool: '머신' },
  { id: 'rdl', name: '루마니안 데드리프트', target: '하체(후면)', tool: '바벨' },
  { id: 'stiff_dl', name: '스티프 레그 데드리프트', target: '하체(후면)', tool: '바벨' },
  { id: 'lunge', name: '덤벨 런지', target: '하체(전체)', tool: '덤벨' },
  { id: 'walk_lunge', name: '바벨 워킹 런지', target: '하체(전체)', tool: '바벨' },
  { id: 'bss', name: '불가리안 스플릿 스쿼트', target: '하체(둔근)', tool: '덤벨' },
  { id: 'ht', name: '힙 쓰러스트', target: '하체(둔근)', tool: '바벨' },
  { id: 'glute_kick', name: '글루트 킥백', target: '하체(둔근)', tool: '케이블' },
  { id: 'inth', name: '이너 타이 (어덕터)', target: '하체(내전근)', tool: '머신' },
  { id: 'outh', name: '아웃 타이 (앱덕터)', target: '하체(둔근)', tool: '머신' },
  { id: 'calf', name: '카프 레이즈', target: '하체(종아리)', tool: '머신' },
  { id: 'goblet', name: '고블렛 스쿼트', target: '하체(전면)', tool: '덤벨' },
  { id: 'kb_swing', name: '케틀벨 스윙', target: '하체(둔근/전신)', tool: '도구' },
  { id: 'pistol_sq', name: '피스톨 스쿼트', target: '하체(전면)', tool: '맨몸' },
  { id: 'sissy_sq', name: '씨씨 스쿼트', target: '하체(전면)', tool: '맨몸' },
  { id: 'step_up', name: '스텝업', target: '하체(둔근/전면)', tool: '덤벨' },
  { id: 'bp', name: '벤치프레스', target: '가슴(중부)', tool: '바벨' },
  { id: 'ip', name: '인클라인 벤치프레스', target: '가슴(상부)', tool: '바벨' },
  { id: 'dbp', name: '디클라인 벤치프레스', target: '가슴(하부)', tool: '바벨' },
  { id: 'sip', name: '스미스머신 인클라인 프레스', target: '가슴(상부)', tool: '머신' },
  { id: 'cpm', name: '체스트 프레스 머신', target: '가슴(중부)', tool: '머신' },
  { id: 'dp_chest', name: '덤벨 프레스', target: '가슴(중부)', tool: '덤벨' },
  { id: 'idp', name: '인클라인 덤벨 프레스', target: '가슴(상부)', tool: '덤벨' },
  { id: 'dfly', name: '덤벨 플라이', target: '가슴(전체)', tool: '덤벨' },
  { id: 'cf', name: '케이블 크로스 오버', target: '가슴(하부)', tool: '케이블' },
  { id: 'pdf', name: '펙 덱 플라이', target: '가슴(전체)', tool: '머신' },
  { id: 'db_pullover', name: '덤벨 풀오버', target: '가슴(전체/광배)', tool: '덤벨' },
  { id: 'cable_press', name: '케이블 체스트 프레스', target: '가슴(전체)', tool: '케이블' },
  { id: 'floor_press', name: '플로어 프레스', target: '가슴(중부)', tool: '바벨' },
  { id: 'hex_press', name: '헥스 프레스', target: '가슴(안쪽)', tool: '덤벨' },
  { id: 'cg_bench', name: '클로즈그립 벤치프레스', target: '가슴(삼두/안쪽)', tool: '바벨' },
  { id: 'pushup', name: '푸시업 (팔굽혀펴기)', target: '가슴(전체)', tool: '맨몸' },
  { id: 'dips', name: '딥스', target: '가슴(하부)', tool: '맨몸' },
  { id: 'dl', name: '컨벤셔널 데드리프트', target: '등(기립근)', tool: '바벨' },
  { id: 'rack_pull', name: '랙 풀', target: '등(기립근/상부)', tool: '바벨' },
  { id: 'pu', name: '풀업 (턱걸이)', target: '등(광배)', tool: '맨몸' },
  { id: 'astpu', name: '어시스트 풀업', target: '등(광배)', tool: '머신' },
  { id: 'cu', name: '친업', target: '등(광배)', tool: '맨몸' },
  { id: 'pd', name: '랫풀다운', target: '등(광배)', tool: '머신' },
  { id: 'cg_pd', name: '클로즈그립 랫풀다운', target: '등(광배 하부)', tool: '머신' },
  { id: 'br', name: '바벨 로우', target: '등(전체)', tool: '바벨' },
  { id: 'prow', name: '펜들레이 로우', target: '등(전체)', tool: '바벨' },
  { id: 'meadows_row', name: '메도우스 로우', target: '등(광배)', tool: '바벨' },
  { id: 'dr_back', name: '덤벨 로우', target: '등(광배)', tool: '덤벨' },
  { id: 'sr', name: '시티드 로우', target: '등(중하부승모)', tool: '머신' },
  { id: 'csr', name: '케이블 시티드 로우', target: '등(중하부승모)', tool: '케이블' },
  { id: 'chest_row', name: '체스트 서포티드 로우', target: '등(광배/승모)', tool: '머신' },
  { id: 'tbar', name: '티바 로우', target: '등(전체)', tool: '머신' },
  { id: 'apd', name: '암풀다운', target: '등(광배)', tool: '케이블' },
  { id: 'shrug_bb', name: '바벨 슈러그', target: '등(상부승모)', tool: '바벨' },
  { id: 'shrug_db', name: '덤벨 슈러그', target: '등(상부승모)', tool: '덤벨' },
  { id: 'inv_row', name: '인버티드 로우', target: '등(전체)', tool: '맨몸' },
  { id: 'ohp', name: '오버헤드 프레스', target: '어깨(전면)', tool: '바벨' },
  { id: 'smith_ohp', name: '스미스머신 숄더 프레스', target: '어깨(전면)', tool: '머신' },
  { id: 'spm', name: '숄더 프레스 머신', target: '어깨(전면)', tool: '머신' },
  { id: 'dp', name: '덤벨 숄더 프레스', target: '어깨(전면)', tool: '덤벨' },
  { id: 'arnold', name: '아놀드 프레스', target: '어깨(전/측면)', tool: '덤벨' },
  { id: 'landmine_p', name: '랜드마인 프레스', target: '어깨(전면/가슴)', tool: '바벨' },
  { id: 'fr', name: '프론트 레이즈', target: '어깨(전면)', tool: '덤벨' },
  { id: 'cable_front', name: '케이블 프론트 레이즈', target: '어깨(전면)', tool: '케이블' },
  { id: 'plate_front', name: '원판 프론트 레이즈', target: '어깨(전면)', tool: '도구' },
  { id: 'lr', name: '사이드 레터럴 레이즈', target: '어깨(측면)', tool: '덤벨' },
  { id: 'clr', name: '케이블 레터럴 레이즈', target: '어깨(측면)', tool: '케이블' },
  { id: 'egyptian_lr', name: '이집시안 레터럴 레이즈', target: '어깨(측면)', tool: '케이블' },
  { id: 'uprow', name: '업라이트 로우', target: '어깨(측면)', tool: '바벨' },
  { id: 'rpdf', name: '리버스 펙 덱 플라이', target: '어깨(후면)', tool: '머신' },
  { id: 'bentover', name: '벤트오버 레터럴 레이즈', target: '어깨(후면)', tool: '덤벨' },
  { id: 'face_pull', name: '페이스 풀', target: '등(후면삼각근/승모)', tool: '케이블' },
  { id: 'y_raise', name: 'Y 레이즈', target: '어깨(측면/하부승모)', tool: '덤벨' },
  { id: 'bc', name: '바벨 컬', target: '팔(이두)', tool: '바벨' },
  { id: 'ez_curl', name: 'EZ바 컬', target: '팔(이두)', tool: '바벨' },
  { id: 'dc', name: '덤벨 컬', target: '팔(이두)', tool: '덤벨' },
  { id: 'hc', name: '해머 컬', target: '팔(이두)', tool: '덤벨' },
  { id: 'inc_curl', name: '인클라인 덤벨 컬', target: '팔(이두 장두)', tool: '덤벨' },
  { id: 'spider_curl', name: '스파이더 컬', target: '팔(이두 단두)', tool: '덤벨' },
  { id: 'con_curl', name: '컨센트레이션 컬', target: '팔(이두 단두)', tool: '덤벨' },
  { id: 'cable_curl', name: '케이블 컬', target: '팔(이두)', tool: '케이블' },
  { id: 'pcurl', name: '프리처 컬', target: '팔(이두)', tool: '머신' },
  { id: 'rcurl', name: '리버스 컬', target: '팔(전완)', tool: '바벨' },
  { id: 'tc', name: '트라이셉스 푸시다운', target: '팔(삼두)', tool: '케이블' },
  { id: 'rope_pd', name: '케이블 로프 푸시다운', target: '팔(삼두 외측두)', tool: '케이블' },
  { id: 'ct', name: '오버헤드 트라이셉스 익스텐션', target: '팔(삼두)', tool: '케이블' },
  { id: 'sc', name: '라잉 트라이셉스 익스텐션', target: '팔(삼두)', tool: '바벨' },
  { id: 'french_p', name: '프렌치 프레스', target: '팔(삼두 장두)', tool: '덤벨' },
  { id: 'tkb', name: '덤벨 킥백', target: '팔(삼두)', tool: '덤벨' },
  { id: 'kickback_cable', name: '케이블 킥백', target: '팔(삼두)', tool: '케이블' },
  { id: 'wrist_curl', name: '리스트 컬', target: '팔(전완 굴곡근)', tool: '바벨' },
  { id: 'rev_wrist', name: '리버스 리스트 컬', target: '팔(전완 신전근)', tool: '바벨' },
  { id: 'farmers_walk', name: '파머스 워크', target: '팔(전완/전신)', tool: '덤벨' },
  { id: 'cr', name: '크런치', target: '복근(상복부)', tool: '맨몸' },
  { id: 'decline_cr', name: '디클라인 크런치', target: '복근(상복부)', tool: '맨몸' },
  { id: 'ccrunch', name: '케이블 크런치', target: '복근(상복부)', tool: '케이블' },
  { id: 'hl', name: '행잉 레그레이즈', target: '복근(하복부)', tool: '맨몸' },
  { id: 'leg_raise_floor', name: '라잉 레그레이즈', target: '복근(하복부)', tool: '맨몸' },
  { id: 'toes_to_bar', name: '토즈 투 바 (T2B)', target: '복근(하복부)', tool: '맨몸' },
  { id: 'rtwist', name: '러시안 트위스트', target: '복근(외복사근)', tool: '맨몸' },
  { id: 'woodchop', name: '케이블 우드찹', target: '복근(외복사근)', tool: '케이블' },
  { id: 'bicycle', name: '바이시클 크런치', target: '복근(외복사근)', tool: '맨몸' },
  { id: 'v_up', name: 'V-업', target: '복근(전체)', tool: '맨몸' },
  { id: 'abroll', name: 'AB 롤아웃 (앱롤러)', target: '복근(전체)', tool: '도구' },
  { id: 'plank', name: '플랭크', target: '복근(전체)', tool: '맨몸' },
  { id: 'side_plank', name: '사이드 플랭크', target: '복근(외복사근)', tool: '맨몸' },
  { id: 'dragon_flag', name: '드래곤 플래그', target: '복근(코어 전체)', tool: '맨몸' },
  { id: 'zercher_sq', name: '제르셔 스쿼트', target: '하체(전면/코어)', tool: '바벨' },
  { id: 'nordic_curl', name: '노르딕 컬', target: '하체(햄스트링)', tool: '맨몸' },
  { id: 'deficit_dl', name: '데피싯 데드리프트', target: '하체(후면/기립근)', tool: '바벨' },
  { id: 'seal_row', name: '씰 로우', target: '등(중상부)', tool: '바벨' },
  { id: 'onearm_lpd', name: '원암 랫풀다운', target: '등(광배 하부)', tool: '케이블' },
  { id: 'pullover_mac', name: '풀오버 머신', target: '등(광배 전체)', tool: '머신' },
  { id: 'mag_lpd', name: '맥그립 랫풀다운', target: '등(광배/승모)', tool: '머신' },
  { id: 'spoto_press', name: '스포토 프레스', target: '가슴(중부/삼두)', tool: '바벨' },
  { id: 'cable_fly_stand', name: '스탠딩 케이블 플라이', target: '가슴(전체)', tool: '케이블' },
  { id: 'cable_y', name: '케이블 Y-레이즈', target: '어깨(하부승모/후면)', tool: '케이블' },
  { id: 'z_press', name: 'Z 프레스', target: '어깨(전면/코어)', tool: '바벨' },
  { id: 'machine_lr', name: '머신 레터럴 레이즈', target: '어깨(측면)', tool: '머신' },
  { id: 'bayesian_curl', name: '베이시안 컬', target: '팔(이두 장두)', tool: '케이블' },
  { id: 'zottman_curl', name: '조트만 컬', target: '팔(이두/전완)', tool: '덤벨' },
  { id: 'tgu', name: '터키시 겟업', target: '전신(코어/협응)', tool: '도구' },
  { id: 'battle_rope', name: '배틀 로프', target: '전신(유산소/심폐)', tool: '도구' },
  // ── 실제 사진이 있는 추가 종목 ──
  { id: 'seated_lc', name: '시티드 레그 컬', target: '하체(후면)', tool: '머신' },
  { id: 'standing_lc', name: '스탠딩 레그 컬', target: '하체(햄스트링)', tool: '머신' },
  { id: 'seated_calf', name: '시티드 카프 레이즈', target: '하체(종아리)', tool: '머신' },
  { id: 'db_calf', name: '덤벨 카프 레이즈', target: '하체(종아리)', tool: '덤벨' },
  { id: 'box_sq', name: '박스 스쿼트', target: '하체(전면)', tool: '바벨' },
  { id: 'bb_lunge', name: '바벨 런지', target: '하체(둔근/전면)', tool: '바벨' },
  { id: 'db_sq', name: '덤벨 스쿼트', target: '하체(전면)', tool: '덤벨' },
  { id: 'sumo_dl', name: '스모 데드리프트', target: '하체(전체)', tool: '바벨' },
  { id: 'good_morning', name: '굿모닝', target: '하체(후면/기립근)', tool: '바벨' },
  { id: 'back_ext', name: '백 익스텐션', target: '등(기립근)', tool: '맨몸' },
  { id: 'glute_bridge', name: '바벨 글루트 브릿지', target: '하체(둔근)', tool: '바벨' },
  { id: 'sl_bridge', name: '싱글 레그 힙 브릿지', target: '하체(둔근)', tool: '맨몸' },
  { id: 'rev_lunge', name: '덤벨 리버스 런지', target: '하체(둔근/전면)', tool: '덤벨' },
  { id: 'bw_sq', name: '맨몸 스쿼트 (에어 스쿼트)', target: '하체(전면)', tool: '맨몸' },
  { id: 'jump_sq', name: '점프 스쿼트', target: '하체(전면)', tool: '맨몸' },
  { id: 'box_jump', name: '박스 점프', target: '하체(전체)', tool: '맨몸' },
  { id: 'cable_add', name: '케이블 힙 어덕션', target: '하체(내전근)', tool: '케이블' },
  { id: 'inc_dfly', name: '인클라인 덤벨 플라이', target: '가슴(상부)', tool: '덤벨' },
  { id: 'dec_db_press', name: '디클라인 덤벨 프레스', target: '가슴(하부)', tool: '덤벨' },
  { id: 'decline_pushup', name: '디클라인 푸시업', target: '가슴(상부)', tool: '맨몸' },
  { id: 'incline_pushup', name: '인클라인 푸시업 (초보용)', target: '가슴(하부)', tool: '맨몸' },
  { id: 'bench_dips', name: '벤치 딥스', target: '팔(삼두)', tool: '맨몸' },
  { id: 'inc_cpm', name: '인클라인 체스트 프레스 머신', target: '가슴(상부)', tool: '머신' },
  { id: 'smith_bp', name: '스미스머신 벤치프레스', target: '가슴(중부)', tool: '머신' },
  { id: 'low_cf', name: '로우 케이블 크로스오버', target: '가슴(상부)', tool: '케이블' },
  { id: 'wide_bp', name: '와이드그립 벤치프레스', target: '가슴(전체)', tool: '바벨' },
  { id: 'neutral_dbp', name: '뉴트럴그립 덤벨 프레스', target: '가슴(중부/삼두)', tool: '덤벨' },
  { id: 'db_row2', name: '덤벨 벤트오버 로우', target: '등(전체)', tool: '덤벨' },
  { id: 'smith_row', name: '스미스머신 로우', target: '등(전체)', tool: '머신' },
  { id: 'high_row', name: '하이 로우 머신', target: '등(광배)', tool: '머신' },
  { id: 'rev_br', name: '언더그립 바벨 로우', target: '등(광배 하부)', tool: '바벨' },
  { id: 'under_pd', name: '언더그립 랫풀다운', target: '등(광배 하부)', tool: '케이블' },
  { id: 'weighted_pu', name: '중량 턱걸이', target: '등(광배)', tool: '맨몸' },
  { id: 'cable_shrug', name: '케이블 슈러그', target: '등(상부승모)', tool: '케이블' },
  { id: 'machine_shrug', name: '머신 슈러그', target: '등(상부승모)', tool: '머신' },
  { id: 'cable_rdf', name: '케이블 리어 델트 플라이', target: '어깨(후면)', tool: '케이블' },
  { id: 'seated_lr', name: '시티드 사이드 레터럴 레이즈', target: '어깨(측면)', tool: '덤벨' },
  { id: 'rope_rd_row', name: '케이블 리어 델트 로우', target: '어깨(후면)', tool: '케이블' },
  { id: 'reverse_fly', name: '덤벨 리버스 플라이', target: '어깨(후면)', tool: '덤벨' },
  { id: 'lr_front', name: '레터럴 투 프론트 레이즈', target: '어깨(전/측면)', tool: '덤벨' },
  { id: 'machine_curl', name: '머신 바이셉 컬', target: '팔(이두)', tool: '머신' },
  { id: 'cable_hc', name: '케이블 로프 해머 컬', target: '팔(이두/전완)', tool: '케이블' },
  { id: 'cable_pcurl', name: '케이블 프리처 컬', target: '팔(이두 단두)', tool: '케이블' },
  { id: 'overhead_cc', name: '오버헤드 케이블 컬', target: '팔(이두 단두)', tool: '케이블' },
  { id: 'seated_dc', name: '시티드 덤벨 컬', target: '팔(이두)', tool: '덤벨' },
  { id: 'machine_tri', name: '머신 트라이셉스 익스텐션', target: '팔(삼두)', tool: '머신' },
  { id: 'vbar_pd', name: 'V바 트라이셉스 푸시다운', target: '팔(삼두)', tool: '케이블' },
  { id: 'rev_pd', name: '리버스 그립 푸시다운', target: '팔(삼두 외측두)', tool: '케이블' },
  { id: 'close_pushup', name: '클로즈그립 푸시업', target: '팔(삼두)', tool: '맨몸' },
  { id: 'ab_machine', name: '크런치 머신', target: '복근(상복부)', tool: '머신' },
  { id: 'rev_crunch', name: '리버스 크런치', target: '복근(하복부)', tool: '맨몸' },
  { id: 'mountain', name: '마운틴 클라이머', target: '복근(코어 전체)', tool: '맨몸' },
  { id: 'dead_bug', name: '데드버그', target: '복근(코어 전체)', tool: '맨몸' },
  { id: 'captain', name: '캡틴스 체어 레그레이즈', target: '복근(하복부)', tool: '맨몸' },
  { id: 'oblique_cr', name: '오블리크 크런치', target: '복근(외복사근)', tool: '맨몸' },
  { id: 'superman', name: '슈퍼맨', target: '등(기립근)', tool: '맨몸' },
  { id: 'flutter', name: '플러터 킥', target: '복근(하복부)', tool: '맨몸' },
  { id: 'side_bend', name: '덤벨 사이드 벤드', target: '복근(외복사근)', tool: '덤벨' },
  { id: 'plate_twist', name: '원판 트위스트', target: '복근(외복사근)', tool: '도구' },
];
export const PROGRAMS = [
  { id: 'p1', title: '괴물 3분할 훈련법 (밀/당/하)', author: '대중적 근비대', level: '초중급', duration: '주 6일', type: '근비대', tags: ['추천', '근비대', '상체', '하체'], badgeColor: 'bg-purple-100 text-purple-700', desc: '가장 대중적이고 확실한 근비대를 위한 가슴/등/하체 3분할 루틴', workouts: [{ exerciseId: 'bp', sets: 4, reps: 8, weight: 60 }, { exerciseId: 'ohp', sets: 4, reps: 10, weight: 40 }, { exerciseId: 'ip', sets: 3, reps: 10, weight: 40 }, { exerciseId: 'dp', sets: 3, reps: 12, weight: 15 }, { exerciseId: 'tc', sets: 4, reps: 15, weight: 25 }] },
  { id: 'p2', title: '스트렝스 5x5 파워빌딩', author: '전통 리프팅', level: '중급', duration: '주 3일', type: '스트렝스', tags: ['추천', '스트렝스', '전신'], badgeColor: 'bg-emerald-100 text-emerald-700', desc: '3대 중량을 폭발적으로 늘리기 위한 전통적인 5x5 프로그램', workouts: [{ exerciseId: 'sq', sets: 5, reps: 5, weight: 80 }, { exerciseId: 'bp', sets: 5, reps: 5, weight: 70 }, { exerciseId: 'br', sets: 5, reps: 5, weight: 60 }] },
  { id: 'p3', title: '직장인 주 2회 전신 압축', author: '효율 극대화', level: '초급', duration: '주 2~3일', type: '전신', tags: ['직장인', '전신'], badgeColor: 'bg-blue-100 text-blue-700', desc: '바쁜 직장인을 위해 전신을 한 번에 강하게 털어주는 가성비 루틴', workouts: [{ exerciseId: 'sq', sets: 4, reps: 10, weight: 60 }, { exerciseId: 'pd', sets: 4, reps: 12, weight: 40 }, { exerciseId: 'bp', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'dp', sets: 3, reps: 12, weight: 15 }] },
  { id: 'p4', title: '입문자 안전 머신 루틴', author: '초보자 가이드', level: '입문', duration: '주 3일', type: '기초', tags: ['초보', '머신'], badgeColor: 'bg-orange-100 text-orange-700', desc: '프리웨이트가 두려운 초보자를 위한 안전하고 자극 위주의 머신 세팅', workouts: [{ exerciseId: 'lpd', sets: 3, reps: 15, weight: 40 }, { exerciseId: 'pd', sets: 3, reps: 15, weight: 25 }, { exerciseId: 'pdf', sets: 3, reps: 15, weight: 20 }, { exerciseId: 'sr', sets: 3, reps: 15, weight: 25 }] },
  { id: 'p5', title: '하체 폭파 힙업 집중', author: '하체 마스터', level: '중급', duration: '주 2일', type: '하체', tags: ['하체', '근비대'], badgeColor: 'bg-pink-100 text-pink-700', desc: '탄탄한 둔근과 햄스트링을 만들기 위한 하체 후면 집중 타겟 루틴', workouts: [{ exerciseId: 'sq', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'ht', sets: 4, reps: 12, weight: 60 }, { exerciseId: 'rdl', sets: 4, reps: 12, weight: 40 }, { exerciseId: 'lc', sets: 3, reps: 15, weight: 25 }] },
  { id: 'p6', title: '역삼각형 등 프레임 만들기', author: '등 집중', level: '중급', duration: '주 2일', type: '등', tags: ['등', '근비대'], badgeColor: 'bg-indigo-100 text-indigo-700', desc: '광배근 하부와 승모근까지 꽉 채우는 볼륨 위주의 등 훈련', workouts: [{ exerciseId: 'pu', sets: 5, reps: 8, weight: 0 }, { exerciseId: 'br', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'pd', sets: 4, reps: 12, weight: 45 }, { exerciseId: 'sr', sets: 4, reps: 12, weight: 40 }] },
  { id: 'p7', title: '대포알 어깨 볼륨 루틴', author: '어깨 집중', level: '중급', duration: '주 2일', type: '어깨', tags: ['어깨', '근비대'], badgeColor: 'bg-teal-100 text-teal-700', desc: '전/측/후면 삼각근을 골고루 타격하여 입체적인 대포알 어깨 만들기', workouts: [{ exerciseId: 'ohp', sets: 4, reps: 8, weight: 40 }, { exerciseId: 'dp', sets: 4, reps: 10, weight: 15 }, { exerciseId: 'lr', sets: 5, reps: 15, weight: 5 }, { exerciseId: 'rpdf', sets: 4, reps: 15, weight: 25 }] },
  { id: 'p8', title: '홈트레이닝 맨몸 마스터', author: '방구석 트레이너', level: '초중급', duration: '주 4일', type: '맨몸', tags: ['맨몸운동', '전신'], badgeColor: 'bg-yellow-100 text-yellow-700', desc: '헬스장에 가지 않고 집이나 공원에서 할 수 있는 강력한 맨몸 운동', workouts: [{ exerciseId: 'pu', sets: 4, reps: 10, weight: 0 }, { exerciseId: 'pushup', sets: 4, reps: 20, weight: 0 }, { exerciseId: 'dips', sets: 4, reps: 12, weight: 0 }, { exerciseId: 'plank', sets: 3, reps: 60, weight: 0 }] },
  { id: 'p9', title: '바디프로필 D-30 극한 커팅', author: '다이어트 마스터', level: '고급', duration: '주 5일', type: '다이어트', tags: ['추천', '다이어트', '전신'], badgeColor: 'bg-red-100 text-red-700', desc: '휴식시간을 최소화하고 칼로리 소모를 극대화하는 고강도 서킷 베이스 루틴', workouts: [{ exerciseId: 'sq', sets: 5, reps: 15, weight: 40 }, { exerciseId: 'lpd', sets: 4, reps: 20, weight: 80 }, { exerciseId: 'lunge', sets: 4, reps: 20, weight: 10 }, { exerciseId: 'pushup', sets: 4, reps: 15, weight: 0 }, { exerciseId: 'abroll', sets: 4, reps: 15, weight: 0 }] },
  { id: 'p10', title: '어깨 깡패 프레임 메이커', author: '어깨 집중', level: '중급', duration: '주 2일', type: '어깨/등', tags: ['어깨', '등', '근비대'], badgeColor: 'bg-teal-100 text-teal-700', desc: '넓은 프레임을 만들기 위해 측면/후면 어깨와 광배근 상부를 집중 타격', workouts: [{ exerciseId: 'ohp', sets: 4, reps: 8, weight: 40 }, { exerciseId: 'lr', sets: 6, reps: 15, weight: 5 }, { exerciseId: 'uprow', sets: 4, reps: 12, weight: 20 }, { exerciseId: 'rpdf', sets: 4, reps: 15, weight: 25 }, { exerciseId: 'pd', sets: 4, reps: 12, weight: 45 }] },
  { id: 'p11', title: '오운완! 30분 덤벨 전신 타격', author: '효율 극대화', level: '초중급', duration: '주 3일', type: '전신', tags: ['전신', '직장인'], badgeColor: 'bg-blue-100 text-blue-700', desc: '바벨이나 머신 눈치 볼 필요 없이 덤벨 하나로 전신을 빠르게 털어주는 루틴', workouts: [{ exerciseId: 'goblet', sets: 4, reps: 15, weight: 15 }, { exerciseId: 'dp_chest', sets: 4, reps: 12, weight: 15 }, { exerciseId: 'dr_back', sets: 4, reps: 12, weight: 15 }, { exerciseId: 'dp', sets: 3, reps: 12, weight: 10 }] },
  { id: 'p12', title: '초보자 등 자극 마스터', author: '초보자 가이드', level: '입문', duration: '주 1~2일', type: '등', tags: ['초보', '등', '머신'], badgeColor: 'bg-orange-100 text-orange-700', desc: '등 근육 사용법을 모르는 초보자를 위해 자극 위주의 머신들로만 구성된 루틴', workouts: [{ exerciseId: 'pd', sets: 4, reps: 15, weight: 25 }, { exerciseId: 'astpu', sets: 3, reps: 10, weight: 30 }, { exerciseId: 'sr', sets: 4, reps: 15, weight: 25 }, { exerciseId: 'apd', sets: 3, reps: 15, weight: 15 }] },
  { id: 'p13', title: 'PHUL 4분할 파워빌딩', author: '해외 스트렝스', level: '중고급', duration: '주 4일', type: '파워빌딩', tags: ['추천', '스트렝스', '근비대', '상체', '하체'], badgeColor: 'bg-purple-100 text-purple-700', desc: 'Power Hypertrophy Upper Lower: 스트렝스(파워)와 근비대(볼륨)를 동시에 잡기 위해 상하체를 번갈아 고중량과 고반복으로 타격하는 하이브리드 루틴 (상체 파워 데이 예시).', workouts: [{ exerciseId: 'bp', sets: 4, reps: 5, weight: 80 }, { exerciseId: 'br', sets: 4, reps: 5, weight: 80 }, { exerciseId: 'ip', sets: 3, reps: 8, weight: 60 }, { exerciseId: 'pd', sets: 3, reps: 8, weight: 55 }, { exerciseId: 'ohp', sets: 3, reps: 8, weight: 50 }] },
  { id: 'p14', title: 'GVT 10x10 매스업', author: '클래식 보디빌딩', level: '고급', duration: '주 3일', type: '근비대', tags: ['근비대', '전신'], badgeColor: 'bg-rose-100 text-rose-700', desc: 'German Volume Training: 단일 종목을 1RM 60% 무게로 10세트 10회 반복하여 근육을 극한으로 파괴, 한계점 이상의 사이즈(매스업)를 끌어내는 악명 높은 루틴 (가슴/등 데이 예시).', workouts: [{ exerciseId: 'bp', sets: 10, reps: 10, weight: 60 }, { exerciseId: 'br', sets: 10, reps: 10, weight: 60 }, { exerciseId: 'dfly', sets: 3, reps: 15, weight: 15 }, { exerciseId: 'sr', sets: 3, reps: 15, weight: 40 }] },
  { id: 'p15', title: 'PHAT 5분할 (하체 비대)', author: 'Layne Norton', level: '고급', duration: '주 5일', type: '파워빌딩', tags: ['추천', '하체', '스트렝스'], badgeColor: 'bg-indigo-100 text-indigo-700', desc: '근비대 전문 박사 레인 노튼의 5분할 루틴. 파워 2일, 근비대 3일로 나뉘며, 본 루틴은 스피드 훈련과 펌핑을 결합한 하체 근비대(Hypertrophy) 데이입니다.', workouts: [{ exerciseId: 'sq', sets: 6, reps: 3, weight: 90 }, { exerciseId: 'hack_sq', sets: 3, reps: 10, weight: 100 }, { exerciseId: 'lpd', sets: 3, reps: 15, weight: 160 }, { exerciseId: 'le', sets: 4, reps: 20, weight: 40 }, { exerciseId: 'rdl', sets: 3, reps: 10, weight: 80 }, { exerciseId: 'lc', sets: 4, reps: 15, weight: 35 }] },
  { id: 'p16', title: '6일 PPL (Push-밀기)', author: '가장 완벽한 분할', level: '중고급', duration: '주 6일', type: '근비대', tags: ['가슴', '어깨', '근비대'], badgeColor: 'bg-blue-100 text-blue-700', desc: '현대 보디빌딩에서 가장 선호되는 PPL(밀/당/하) 주 2회 타격 루틴 중, 가슴/어깨/삼두를 묶어서 폭파시키는 강력한 밀기(Push) 데이 세팅입니다.', workouts: [{ exerciseId: 'bp', sets: 4, reps: 8, weight: 80 }, { exerciseId: 'ohp', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'idp', sets: 3, reps: 12, weight: 25 }, { exerciseId: 'lr', sets: 5, reps: 15, weight: 10 }, { exerciseId: 'tc', sets: 4, reps: 15, weight: 35 }] }
];
export const OLYMPIA_LEGENDS = [
  {
    id: 'leg_ronnie', name: '로니 콜먼 (Ronnie Coleman)', nickname: 'The King', era: '1998-2005 (올림피아 8회 우승)',
    desc: '"Yeah Buddy! Light weight, baby!" 역대 최고의 등과 하체를 지닌 압도적인 매스 몬스터. 초고중량 프리웨이트를 즐겨했습니다.',
    imageColor: 'from-blue-700 to-blue-900',
    split: '주 6일 · 3분할을 주 2회 (등·이두·어깨 / 하체 / 가슴·삼두)',
    basis: '로니 콜먼이 훈련 영상과 인터뷰에서 밝힌 주 6일 3분할을 바탕으로, 그가 즐겨 한 종목으로 구성했어요. 세트·횟수는 따라 하기 좋게 다듬은 값이에요.',
    routines: [
      { id: 'r_d1', title: '등·이두·어깨 (A)', desc: '데드리프트로 시작하는 두께 중심의 등, 바벨 컬, 밀리터리 프레스까지 한 번에', workouts: [{exerciseId: 'dl', sets: 4, reps: 8, weight: 160, note: '점점 무겁게'}, {exerciseId: 'br', sets: 4, reps: 10, weight: 110}, {exerciseId: 'tbar', sets: 3, reps: 10, weight: 90}, {exerciseId: 'dr_back', sets: 3, reps: 10, weight: 50}, {exerciseId: 'bc', sets: 4, reps: 12, weight: 45}, {exerciseId: 'dc', sets: 3, reps: 12, weight: 20}, {exerciseId: 'ohp', sets: 4, reps: 10, weight: 70}, {exerciseId: 'fr', sets: 3, reps: 12, weight: 15}, {exerciseId: 'lr', sets: 3, reps: 12, weight: 15}] },
      { id: 'r_d2', title: '하체 (A) 스쿼트 데이', desc: '"Light weight, baby!" 초고중량 스쿼트와 바벨 워킹 런지로 다리를 키우는 날', workouts: [{exerciseId: 'sq', sets: 5, reps: 10, weight: 160, note: '허벅지가 평행이 될 때까지'}, {exerciseId: 'lpd', sets: 4, reps: 12, weight: 300}, {exerciseId: 'hack_sq', sets: 3, reps: 12, weight: 140}, {exerciseId: 'walk_lunge', sets: 2, reps: 24, weight: 60, note: '좌우 합쳐 24걸음'}, {exerciseId: 'stiff_dl', sets: 3, reps: 12, weight: 100}, {exerciseId: 'lc', sets: 3, reps: 12, weight: 50}] },
      { id: 'r_d3', title: '가슴·삼두 (A)', desc: '벤치프레스 중심으로 가슴 매스를 쌓고 클로즈그립으로 삼두를 마무리', workouts: [{exerciseId: 'bp', sets: 5, reps: 12, weight: 130}, {exerciseId: 'ip', sets: 3, reps: 12, weight: 100}, {exerciseId: 'dp_chest', sets: 3, reps: 12, weight: 50}, {exerciseId: 'dfly', sets: 3, reps: 12, weight: 25}, {exerciseId: 'cg_bench', sets: 3, reps: 12, weight: 90}, {exerciseId: 'sc', sets: 3, reps: 12, weight: 45}, {exerciseId: 'tc', sets: 3, reps: 15, weight: 40}] },
      { id: 'r_d4', title: '등·이두·어깨 (B)', desc: '풀다운과 케이블 로우로 등 너비를, 덤벨 프레스로 어깨를 채우는 날', workouts: [{exerciseId: 'pd', sets: 4, reps: 12, weight: 90}, {exerciseId: 'pu', sets: 3, reps: 10, weight: 0}, {exerciseId: 'csr', sets: 3, reps: 12, weight: 80}, {exerciseId: 'pcurl', sets: 3, reps: 12, weight: 35}, {exerciseId: 'cable_curl', sets: 3, reps: 12, weight: 30}, {exerciseId: 'dp', sets: 4, reps: 12, weight: 40}, {exerciseId: 'lr', sets: 3, reps: 15, weight: 15}, {exerciseId: 'bentover', sets: 3, reps: 15, weight: 14}] },
      { id: 'r_d5', title: '하체 (B) 프론트 스쿼트 데이', desc: '프론트 스쿼트와 레그 익스텐션으로 대퇴사두를, 루마니안 데드로 뒷다리를', workouts: [{exerciseId: 'fsq', sets: 4, reps: 10, weight: 120}, {exerciseId: 'lpd', sets: 4, reps: 15, weight: 280}, {exerciseId: 'le', sets: 4, reps: 15, weight: 60}, {exerciseId: 'lc', sets: 4, reps: 12, weight: 50}, {exerciseId: 'rdl', sets: 3, reps: 10, weight: 120}, {exerciseId: 'calf', sets: 4, reps: 15, weight: 100}] },
      { id: 'r_d6', title: '가슴·삼두 (B) 덤벨 데이', desc: '90kg 덤벨 프레스로 유명했던 로니의 덤벨 중심 가슴 루틴', workouts: [{exerciseId: 'dp_chest', sets: 4, reps: 12, weight: 55}, {exerciseId: 'idp', sets: 3, reps: 12, weight: 45}, {exerciseId: 'dbp', sets: 3, reps: 12, weight: 100}, {exerciseId: 'pdf', sets: 3, reps: 15, weight: 50}, {exerciseId: 'french_p', sets: 3, reps: 12, weight: 30}, {exerciseId: 'rope_pd', sets: 3, reps: 15, weight: 35}, {exerciseId: 'dips', sets: 3, reps: 12, weight: 0}] }
    ]
  },
  {
    id: 'leg_jay', name: '제이 커틀러 (Jay Cutler)', nickname: 'The Comeback Kid', era: '2006-2007, 2009-2010 (올림피아 4회 우승)',
    desc: '엄청난 볼륨과 근육의 고립, 철저한 식단과 정석적인 펌핑으로 로니 콜먼의 시대를 끝낸 장본인입니다.',
    imageColor: 'from-amber-600 to-amber-900',
    split: '주 5~6일 · 부위별 분할 (가슴 / 등 / 팔 / 어깨 / 대퇴사두 / 햄스트링)',
    basis: '제이 커틀러가 오래 써 온 부위별 분할과 그가 자주 소개한 종목을 바탕으로 구성했어요. 대회 시즌마다 바꿔서 하나의 공식 루틴은 없어요.',
    routines: [
      { id: 'j_chest', title: '가슴', desc: '인클라인 덤벨로 시작하는 커틀러식 가슴. 수축 구간을 끝까지 쥐어짜요.', workouts: [{exerciseId: 'idp', sets: 4, reps: 10, weight: 45}, {exerciseId: 'dp_chest', sets: 3, reps: 10, weight: 45}, {exerciseId: 'sip', sets: 3, reps: 10, weight: 100}, {exerciseId: 'dfly', sets: 3, reps: 12, weight: 22}, {exerciseId: 'cf', sets: 3, reps: 15, weight: 25}] },
      { id: 'j_back', title: '등', desc: '너비(풀다운)와 두께(로우)를 모두 잡는 고볼륨 등', workouts: [{exerciseId: 'pd', sets: 4, reps: 10, weight: 90}, {exerciseId: 'dr_back', sets: 3, reps: 10, weight: 55}, {exerciseId: 'chest_row', sets: 3, reps: 10, weight: 90}, {exerciseId: 'csr', sets: 3, reps: 12, weight: 80}, {exerciseId: 'apd', sets: 3, reps: 15, weight: 35}, {exerciseId: 'dl', sets: 3, reps: 8, weight: 180}] },
      { id: 'j_arm', title: '팔 (이두·삼두)', desc: '이두와 삼두를 번갈아 다양한 각도로 고립', workouts: [{exerciseId: 'ez_curl', sets: 4, reps: 10, weight: 45}, {exerciseId: 'dc', sets: 3, reps: 10, weight: 20}, {exerciseId: 'pcurl', sets: 3, reps: 12, weight: 35}, {exerciseId: 'hc', sets: 3, reps: 12, weight: 22}, {exerciseId: 'tc', sets: 4, reps: 12, weight: 45}, {exerciseId: 'sc', sets: 3, reps: 10, weight: 45}, {exerciseId: 'ct', sets: 3, reps: 12, weight: 35}] },
      { id: 'j_sh', title: '어깨·승모', desc: '앉아서 하는 덤벨 프레스, 측면 고볼륨, 슈러그까지', workouts: [{exerciseId: 'dp', sets: 4, reps: 10, weight: 40}, {exerciseId: 'lr', sets: 4, reps: 12, weight: 16}, {exerciseId: 'clr', sets: 3, reps: 15, weight: 12}, {exerciseId: 'rpdf', sets: 3, reps: 15, weight: 50}, {exerciseId: 'bentover', sets: 3, reps: 15, weight: 14}, {exerciseId: 'shrug_db', sets: 4, reps: 12, weight: 45}] },
      { id: 'j_quad', title: '대퇴사두 (Quad Stomp)', desc: '"Quad Stomp"로 알려진 커틀러의 앞허벅지 집중 하체', workouts: [{exerciseId: 'le', sets: 4, reps: 20, weight: 50, note: '예비 피로용 고반복'}, {exerciseId: 'hack_sq', sets: 4, reps: 10, weight: 160}, {exerciseId: 'lpd', sets: 4, reps: 12, weight: 300}, {exerciseId: 'smith_sq', sets: 3, reps: 10, weight: 100}, {exerciseId: 'lunge', sets: 3, reps: 12, weight: 25}] },
      { id: 'j_ham', title: '햄스트링·종아리', desc: '레그 컬과 스티프 데드리프트로 뒷다리 결을 살리는 날', workouts: [{exerciseId: 'lc', sets: 4, reps: 12, weight: 50}, {exerciseId: 'stiff_dl', sets: 4, reps: 10, weight: 110}, {exerciseId: 's_lpd', sets: 3, reps: 12, weight: 120, note: '발을 발판 위쪽에'}, {exerciseId: 'calf', sets: 5, reps: 15, weight: 120}] }
    ]
  },
  {
    id: 'leg_arnold', name: '아놀드 슈왈제네거 (Arnold)', nickname: 'The Austrian Oak', era: '1970-1975, 1980 (올림피아 7회 우승)',
    desc: '보디빌딩의 상징. 조각 같은 가슴과 봉우리 같은 이두근, 그리고 펌핑을 극대화하는 슈퍼세트의 창시자입니다.',
    imageColor: 'from-emerald-600 to-emerald-900',
    split: '주 6일 · 가슴·등 / 어깨·팔 / 하체를 주 2회 (더블 스플릿)',
    basis: '아놀드가 「보디빌딩 백과사전(The New Encyclopedia of Modern Bodybuilding)」에서 소개한 주 6일 분할을 바탕으로 구성했어요. 가슴과 등은 슈퍼세트로 번갈아 하던 방식이에요.',
    routines: [
      { id: 'a_cb_1', title: '가슴·등 (A) 슈퍼세트', desc: '벤치프레스와 턱걸이를 번갈아 하는 아놀드의 대표 상체 훈련', workouts: [{exerciseId: 'bp', sets: 5, reps: 10, weight: 100, note: '턱걸이와 슈퍼세트'}, {exerciseId: 'pu', sets: 5, reps: 10, weight: 0, note: '와이드 그립'}, {exerciseId: 'ip', sets: 4, reps: 10, weight: 80}, {exerciseId: 'br', sets: 4, reps: 10, weight: 90}, {exerciseId: 'dfly', sets: 4, reps: 10, weight: 22}, {exerciseId: 'tbar', sets: 4, reps: 10, weight: 80}, {exerciseId: 'db_pullover', sets: 4, reps: 12, weight: 30, note: '흉곽을 넓히는 느낌으로'}] },
      { id: 'a_sa_1', title: '어깨·팔 (A)', desc: '프레스와 레이즈로 어깨를, 바벨 컬로 봉우리 이두를', workouts: [{exerciseId: 'ohp', sets: 4, reps: 10, weight: 60}, {exerciseId: 'arnold', sets: 4, reps: 10, weight: 26}, {exerciseId: 'lr', sets: 4, reps: 10, weight: 12}, {exerciseId: 'bentover', sets: 4, reps: 10, weight: 12}, {exerciseId: 'bc', sets: 4, reps: 10, weight: 45}, {exerciseId: 'inc_curl', sets: 3, reps: 10, weight: 16}, {exerciseId: 'sc', sets: 4, reps: 10, weight: 40}, {exerciseId: 'tc', sets: 4, reps: 12, weight: 35}] },
      { id: 'a_leg_1', title: '하체 (A)', desc: '스쿼트와 "종아리 10세트"로 유명한 클래식 하체', workouts: [{exerciseId: 'sq', sets: 5, reps: 10, weight: 120}, {exerciseId: 'fsq', sets: 4, reps: 10, weight: 90}, {exerciseId: 'le', sets: 4, reps: 12, weight: 55}, {exerciseId: 'lc', sets: 4, reps: 10, weight: 45}, {exerciseId: 'stiff_dl', sets: 3, reps: 10, weight: 90}, {exerciseId: 'calf', sets: 10, reps: 10, weight: 100, note: '아놀드식 10×10'}] },
      { id: 'a_cb_2', title: '가슴·등 (B)', desc: '인클라인 덤벨과 친업, 딥스와 로우로 다른 각도를 채우는 날', workouts: [{exerciseId: 'idp', sets: 4, reps: 10, weight: 36}, {exerciseId: 'cu', sets: 4, reps: 10, weight: 0, note: '인클라인과 슈퍼세트'}, {exerciseId: 'dips', sets: 4, reps: 12, weight: 0}, {exerciseId: 'csr', sets: 4, reps: 10, weight: 70}, {exerciseId: 'cf', sets: 4, reps: 12, weight: 22}, {exerciseId: 'dr_back', sets: 4, reps: 10, weight: 45}, {exerciseId: 'dl', sets: 3, reps: 8, weight: 160}] },
      { id: 'a_sa_2', title: '어깨·팔 (B)', desc: '업라이트 로우와 컨센트레이션 컬, 프렌치 프레스로 디테일을', workouts: [{exerciseId: 'dp', sets: 4, reps: 10, weight: 30}, {exerciseId: 'uprow', sets: 4, reps: 10, weight: 40}, {exerciseId: 'clr', sets: 3, reps: 12, weight: 10}, {exerciseId: 'dc', sets: 4, reps: 10, weight: 18}, {exerciseId: 'con_curl', sets: 3, reps: 10, weight: 14}, {exerciseId: 'french_p', sets: 4, reps: 10, weight: 28}, {exerciseId: 'tkb', sets: 3, reps: 12, weight: 12}, {exerciseId: 'wrist_curl', sets: 3, reps: 15, weight: 30}] },
      { id: 'a_leg_2', title: '하체 (B)·복근', desc: '핵 스쿼트와 런지, 그리고 매일 하던 복근 운동', workouts: [{exerciseId: 'hack_sq', sets: 4, reps: 10, weight: 120}, {exerciseId: 'lunge', sets: 4, reps: 12, weight: 22}, {exerciseId: 'lc', sets: 4, reps: 10, weight: 45}, {exerciseId: 'calf', sets: 5, reps: 15, weight: 100}, {exerciseId: 'hl', sets: 4, reps: 15, weight: 0}, {exerciseId: 'cr', sets: 4, reps: 25, weight: 0}] }
    ]
  },
  {
    id: 'leg_cbum', name: '크리스 범스테드 (CBUM)', nickname: 'Daddy CBum', era: '2019-2023 (클래식 피지크 5연패)',
    desc: '현대 클래식 피지크의 완벽한 표본. 넓은 어깨와 잘록한 허리로 완벽한 V테이퍼를 자랑합니다.',
    imageColor: 'from-rose-600 to-rose-900',
    split: '3일 운동 · 1일 휴식 (대퇴사두 / 가슴·등 / 어깨 / 햄스트링 / 팔)',
    basis: '크리스 범스테드의 2023 올림피아 준비 분할(3일 운동, 1일 휴식)과 그가 영상에서 자주 보여준 종목을 바탕으로 구성했어요. 세트 수는 적게, 대신 실패 지점까지 하는 방식이에요.',
    routines: [
      { id: 'c_quad', title: '대퇴사두·종아리', desc: '레그 익스텐션 드롭세트로 시작해 스미스 스쿼트, 한 다리 레그 프레스로 마무리', workouts: [{exerciseId: 'le', sets: 2, reps: 10, weight: 60, note: '마지막 세트 드롭세트'}, {exerciseId: 'smith_sq', sets: 2, reps: 8, weight: 120, note: '실패 지점까지'}, {exerciseId: 's_lpd', sets: 3, reps: 10, weight: 120, note: '한 다리씩'}, {exerciseId: 'sissy_sq', sets: 3, reps: 10, weight: 0}, {exerciseId: 'calf', sets: 3, reps: 10, weight: 80}] },
      { id: 'c_pp', title: '가슴·등 (푸시 & 풀)', desc: '인클라인 스미스로 윗가슴을, 클로즈그립 풀다운과 머신 로우로 등을', workouts: [{exerciseId: 'sip', sets: 3, reps: 8, weight: 100}, {exerciseId: 'dp_chest', sets: 2, reps: 10, weight: 45}, {exerciseId: 'pdf', sets: 2, reps: 12, weight: 50}, {exerciseId: 'cg_pd', sets: 3, reps: 10, weight: 80}, {exerciseId: 'chest_row', sets: 3, reps: 10, weight: 90}, {exerciseId: 'apd', sets: 2, reps: 15, weight: 35, note: '케이블 랫 익스텐션'}] },
      { id: 'c_sh', title: '어깨', desc: '무거운 덤벨 레터럴로 시작하는 2023 올림피아 준비 어깨 루틴', workouts: [{exerciseId: 'lr', sets: 3, reps: 12, weight: 20}, {exerciseId: 'spm', sets: 3, reps: 10, weight: 90}, {exerciseId: 'clr', sets: 2, reps: 12, weight: 12}, {exerciseId: 'rpdf', sets: 3, reps: 12, weight: 55, note: '마지막 세트 드롭세트'}, {exerciseId: 'machine_lr', sets: 2, reps: 15, weight: 40}] },
      { id: 'c_ham', title: '햄스트링·둔근', desc: '앉아서 하는 레그 컬과 루마니안 데드리프트로 뒷다리와 엉덩이 경계를 선명하게', workouts: [{exerciseId: 'lc', sets: 3, reps: 10, weight: 50}, {exerciseId: 'rdl', sets: 3, reps: 8, weight: 120}, {exerciseId: 'bss', sets: 2, reps: 10, weight: 24}, {exerciseId: 'inth', sets: 2, reps: 15, weight: 60}] },
      { id: 'c_arm', title: '팔', desc: '프리처 컬과 로프 푸시다운 중심으로 팔을 펌핑', workouts: [{exerciseId: 'pcurl', sets: 3, reps: 10, weight: 35}, {exerciseId: 'inc_curl', sets: 3, reps: 10, weight: 14}, {exerciseId: 'bayesian_curl', sets: 2, reps: 12, weight: 15}, {exerciseId: 'rope_pd', sets: 3, reps: 12, weight: 35}, {exerciseId: 'ct', sets: 3, reps: 12, weight: 30}, {exerciseId: 'dips', sets: 2, reps: 12, weight: 0}] }
    ]
  }
];
export const KOREAN_LEGENDS = [
  {
    id: 'k_park', name: '박재훈 (Jaehoon Park)', nickname: 'Korean Classic', era: 'IFBB 프로 클래식 피지크 · 2022 올림피아 TOP 15',
    desc: '한국을 대표하는 클래식 피지크 프로. 넓은 어깨와 윗가슴, 잘록한 허리로 만드는 V라인과 무대에서 빛나는 다리 라인이 강점이에요.',
    imageColor: 'from-blue-600 to-indigo-900',
    split: '주 5~6일 · 부위별 분할 (하체 2회)',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kp_leg_1', title: '하체 전면 (멘탈 붕괴 볼륨)', desc: '토가 나올 때까지 밀어붙이는 고강도 대퇴사두 타격', workouts: [{exerciseId: 'sq', sets: 5, reps: 10, weight: 140}, {exerciseId: 'vsq', sets: 4, reps: 12, weight: 120}, {exerciseId: 'lpd', sets: 5, reps: 15, weight: 240}, {exerciseId: 'le', sets: 4, reps: 20, weight: 60}] },
      { id: 'kp_leg_2', title: '하체 후면 (둔근/햄스트링 분리)', desc: '클래식 피지크의 완성, 다리 후면부를 깊게 파는 루틴', workouts: [{exerciseId: 'rdl', sets: 5, reps: 12, weight: 100}, {exerciseId: 'lc', sets: 5, reps: 15, weight: 45}, {exerciseId: 'bss', sets: 4, reps: 12, weight: 40}, {exerciseId: 'calf', sets: 4, reps: 20, weight: 60}] },
      { id: 'kp_chest_1', title: '가슴 상부 (윗가슴 매스업)', desc: '웅장한 윗가슴 볼륨을 채우는 인클라인 위주의 훈련', workouts: [{exerciseId: 'ip', sets: 5, reps: 10, weight: 90}, {exerciseId: 'idp', sets: 4, reps: 12, weight: 35}, {exerciseId: 'sip', sets: 4, reps: 12, weight: 80}, {exerciseId: 'cf', sets: 4, reps: 15, weight: 25}] },
      { id: 'kp_chest_2', title: '가슴 전체 (흉곽 확장 펌핑)', desc: '가슴의 너비와 두께를 동시에 잡는 베이직 루틴', workouts: [{exerciseId: 'bp', sets: 5, reps: 10, weight: 100}, {exerciseId: 'cpm', sets: 4, reps: 12, weight: 80}, {exerciseId: 'dips', sets: 4, reps: 15, weight: 0}, {exerciseId: 'pdf', sets: 4, reps: 15, weight: 35}] },
      { id: 'kp_back_1', title: '등 (V테이퍼 광배 너비)', desc: '클래식 피지크의 핵심인 V라인을 위한 광배 너비·하부 집중', workouts: [{exerciseId: 'pd', sets: 5, reps: 12, weight: 70}, {exerciseId: 'onearm_lpd', sets: 4, reps: 12, weight: 30}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 30}, {exerciseId: 'csr', sets: 4, reps: 12, weight: 60}] },
      { id: 'kp_back_2', title: '등 (두께감 집중 매스업)', desc: '등판의 두께를 거대하게 만드는 프리웨이트 로우', workouts: [{exerciseId: 'br', sets: 5, reps: 10, weight: 100}, {exerciseId: 'tbar', sets: 4, reps: 12, weight: 80}, {exerciseId: 'pu', sets: 4, reps: 10, weight: 0}, {exerciseId: 'csr', sets: 4, reps: 15, weight: 55}] },
      { id: 'kp_sh_1', title: '어깨 전/측면 (대포알 볼륨)', desc: '둥글고 거대한 어깨를 만드는 측면 고반복 훈련', workouts: [{exerciseId: 'ohp', sets: 5, reps: 10, weight: 60}, {exerciseId: 'dp', sets: 4, reps: 12, weight: 25}, {exerciseId: 'lr', sets: 6, reps: 15, weight: 12}, {exerciseId: 'clr', sets: 4, reps: 15, weight: 15}] },
      { id: 'kp_sh_2', title: '어깨 후면 (입체감 완성)', desc: '어깨의 완성도를 높이는 후면 삼각근 폭격', workouts: [{exerciseId: 'rpdf', sets: 5, reps: 15, weight: 40}, {exerciseId: 'bentover', sets: 4, reps: 15, weight: 10}, {exerciseId: 'uprow', sets: 4, reps: 12, weight: 40}, {exerciseId: 'fr', sets: 4, reps: 15, weight: 15}] },
      { id: 'kp_arm_1', title: '이두근 (봉우리 펌핑)', desc: '이두의 높이와 분리도를 위한 고립 컬', workouts: [{exerciseId: 'bc', sets: 4, reps: 12, weight: 40}, {exerciseId: 'pcurl', sets: 4, reps: 12, weight: 30}, {exerciseId: 'dc', sets: 4, reps: 15, weight: 15}] },
      { id: 'kp_arm_2', title: '삼두근 (말굽 두께감)', desc: '팔의 전체적인 두께를 키우는 삼두 훈련', workouts: [{exerciseId: 'tc', sets: 4, reps: 15, weight: 35}, {exerciseId: 'sc', sets: 4, reps: 12, weight: 35}, {exerciseId: 'ct', sets: 4, reps: 15, weight: 25}] }
    ]
  },
  {
    id: 'k_kim_gw', name: '김건우 (Gunwoo Kim)', nickname: '건담포스 (Gundam Force)', era: 'IFBB 프로 212 · 2024 올림피아 진출',
    desc: "'건담포스'로 활동하는 212 보디빌더. 2023 몬스터짐 프로 퀄리파이어 212 종합 우승과 같은 날 열린 프로쇼 우승으로 IFBB 프로카드와 올림피아 출전권을 함께 얻었어요.",
    imageColor: 'from-emerald-600 to-teal-900',
    split: '주 5~6일 · 부위별 분할',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kg_back_1', title: '등 (너비감 극대화 랫풀)', desc: '넓은 프레임을 위한 랫풀다운/풀업 위주 타격', workouts: [{exerciseId: 'pd', sets: 5, reps: 12, weight: 80}, {exerciseId: 'pu', sets: 4, reps: 10, weight: 0}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 30}, {exerciseId: 'csr', sets: 4, reps: 12, weight: 60}] },
      { id: 'kg_back_2', title: '등 (두께감 머신/바벨 로우)', desc: '등 상/중부를 꽉 채우는 묵직한 로우 루틴', workouts: [{exerciseId: 'br', sets: 5, reps: 10, weight: 100}, {exerciseId: 'sr', sets: 4, reps: 12, weight: 70}, {exerciseId: 'tbar', sets: 4, reps: 12, weight: 80}, {exerciseId: 'dr_back', sets: 4, reps: 10, weight: 45}] },
      { id: 'kg_sh_1', title: '어깨 (3D 측면 고립)', desc: '태평양 어깨를 위한 디테일한 측면 레이즈 중심', workouts: [{exerciseId: 'lr', sets: 6, reps: 20, weight: 10}, {exerciseId: 'clr', sets: 4, reps: 15, weight: 15}, {exerciseId: 'spm', sets: 4, reps: 12, weight: 70}, {exerciseId: 'dp', sets: 4, reps: 10, weight: 25}] },
      { id: 'kg_sh_2', title: '어깨 (전/후면 밸런스)', desc: '전면과 후면을 골고루 채워 입체감을 만드는 루틴', workouts: [{exerciseId: 'ohp', sets: 4, reps: 10, weight: 70}, {exerciseId: 'fr', sets: 4, reps: 15, weight: 15}, {exerciseId: 'rpdf', sets: 5, reps: 15, weight: 45}, {exerciseId: 'bentover', sets: 4, reps: 15, weight: 12}] },
      { id: 'kg_chest_1', title: '가슴 (덤벨 위주 가동범위)', desc: '가동범위를 극한으로 쓰는 덤벨 프레스/플라이', workouts: [{exerciseId: 'dp_chest', sets: 5, reps: 10, weight: 40}, {exerciseId: 'idp', sets: 4, reps: 12, weight: 35}, {exerciseId: 'dfly', sets: 4, reps: 15, weight: 20}, {exerciseId: 'cpm', sets: 4, reps: 12, weight: 70}] },
      { id: 'kg_chest_2', title: '가슴 (프레스 고중량 타격)', desc: '안전한 머신과 바벨로 밀어붙이는 매스업', workouts: [{exerciseId: 'bp', sets: 5, reps: 8, weight: 110}, {exerciseId: 'sip', sets: 4, reps: 10, weight: 90}, {exerciseId: 'dbp', sets: 4, reps: 12, weight: 100}, {exerciseId: 'cf', sets: 4, reps: 15, weight: 30}] },
      { id: 'kg_leg_1', title: '하체 (대퇴사두 분리도)', desc: '갈라지는 앞다리를 위한 익스텐션/프론트 스쿼트', workouts: [{exerciseId: 'le', sets: 5, reps: 20, weight: 60}, {exerciseId: 'fsq', sets: 4, reps: 10, weight: 90}, {exerciseId: 'lpd', sets: 4, reps: 15, weight: 260}, {exerciseId: 'vsq', sets: 4, reps: 12, weight: 140}] },
      { id: 'kg_leg_2', title: '하체 (후면 파워 훈련)', desc: '햄스트링과 둔근의 두께를 키우는 데드리프트 베이스', workouts: [{exerciseId: 'dl', sets: 5, reps: 5, weight: 140}, {exerciseId: 'rdl', sets: 4, reps: 10, weight: 110}, {exerciseId: 'lc', sets: 4, reps: 15, weight: 50}, {exerciseId: 'ht', sets: 4, reps: 12, weight: 100}] },
      { id: 'kg_arm_1', title: '팔 (이두 터질듯한 펌핑)', desc: '전완과 이두를 동시에 잡는 해머컬 포함 루틴', workouts: [{exerciseId: 'hc', sets: 4, reps: 12, weight: 20}, {exerciseId: 'dc', sets: 4, reps: 12, weight: 15}, {exerciseId: 'bc', sets: 4, reps: 10, weight: 40}] },
      { id: 'kg_arm_2', title: '팔 (삼두 꽉 채우기)', desc: '삼두 장두를 길게 뽑아내는 익스텐션 위주 훈련', workouts: [{exerciseId: 'sc', sets: 5, reps: 12, weight: 40}, {exerciseId: 'tc', sets: 4, reps: 15, weight: 40}, {exerciseId: 'tkb', sets: 3, reps: 15, weight: 10}] }
    ]
  },
  {
    id: 'k_jang', name: '장성엽 (Sungyeop Jang)', nickname: '리틀성엽', era: 'IFBB 프로 212 · 2025 올림피아 출전',
    desc: '안양에서 체육관을 운영하는 212 프로. 2022 재팬 프로와 2024 차이나 프로에서 우승했고 2025 212 올림피아 무대에 섰어요. 정확한 자세와 느린 네거티브를 강조하는 운동 영상으로 유명해요.',
    imageColor: 'from-rose-600 to-red-900',
    split: '주 5~6일 · 부위별 분할',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kj_leg_1', title: '하체 (매스업 V스쿼트 중심)', desc: '거대한 대퇴사두를 만드는 초고중량 머신 훈련', workouts: [{exerciseId: 'vsq', sets: 5, reps: 10, weight: 160, note: '네거티브 3~4초'}, {exerciseId: 'lpd', sets: 5, reps: 12, weight: 300}, {exerciseId: 'sq', sets: 4, reps: 8, weight: 140}, {exerciseId: 'le', sets: 4, reps: 15, weight: 70}] },
      { id: 'kj_leg_2', title: '하체 (후면 고중량 데드)', desc: '212 파운드를 꽉 채운 거대한 하체 후면 두께', workouts: [{exerciseId: 'rdl', sets: 5, reps: 8, weight: 140, note: '네거티브 3~4초'}, {exerciseId: 'lc', sets: 5, reps: 12, weight: 55}, {exerciseId: 'ht', sets: 4, reps: 10, weight: 140}, {exerciseId: 'calf', sets: 4, reps: 15, weight: 80}] },
      { id: 'kj_chest_1', title: '가슴 (스트렝스 고중량 프레스)', desc: '가슴 두께를 무식하게 키우는 베이직 프레스', workouts: [{exerciseId: 'bp', sets: 5, reps: 8, weight: 120, note: '네거티브 3~4초'}, {exerciseId: 'ip', sets: 4, reps: 8, weight: 100}, {exerciseId: 'dips', sets: 4, reps: 12, weight: 20}, {exerciseId: 'dp_chest', sets: 4, reps: 10, weight: 45}] },
      { id: 'kj_chest_2', title: '가슴 (윗가슴 집중 두께)', desc: '비어있는 윗가슴을 꽉 채우는 인클라인 타격', workouts: [{exerciseId: 'sip', sets: 5, reps: 10, weight: 100}, {exerciseId: 'idp', sets: 4, reps: 10, weight: 40}, {exerciseId: 'pdf', sets: 4, reps: 12, weight: 50}, {exerciseId: 'cf', sets: 4, reps: 15, weight: 35}] },
      { id: 'kj_back_1', title: '등 (등신 바벨로우)', desc: '등을 가장 두껍게 만드는 프리웨이트 로우 마스터', workouts: [{exerciseId: 'br', sets: 5, reps: 8, weight: 120, note: '네거티브 3~4초'}, {exerciseId: 'prow', sets: 4, reps: 8, weight: 100}, {exerciseId: 'tbar', sets: 4, reps: 10, weight: 100}, {exerciseId: 'sr', sets: 4, reps: 12, weight: 80}] },
      { id: 'kj_back_2', title: '등 (너비감 케이블/머신)', desc: '안전하고 강하게 광배근을 뽑아내는 훈련', workouts: [{exerciseId: 'pd', sets: 5, reps: 10, weight: 90, note: '네거티브 3~4초'}, {exerciseId: 'csr', sets: 4, reps: 12, weight: 70}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 35}, {exerciseId: 'astpu', sets: 4, reps: 10, weight: 20}] },
      { id: 'kj_sh_1', title: '어깨 (고중량 숄더프레스)', desc: '밀어올리는 힘으로 삼각근 전체 사이즈업', workouts: [{exerciseId: 'spm', sets: 5, reps: 10, weight: 100, note: '네거티브 3~4초'}, {exerciseId: 'ohp', sets: 4, reps: 8, weight: 80}, {exerciseId: 'dp', sets: 4, reps: 10, weight: 35}, {exerciseId: 'uprow', sets: 4, reps: 12, weight: 50}] },
      { id: 'kj_sh_2', title: '어깨 (측/후면 입체 타격)', desc: '어깨 측면과 후면을 찢어놓는 디테일 루틴', workouts: [{exerciseId: 'lr', sets: 5, reps: 15, weight: 15}, {exerciseId: 'rpdf', sets: 5, reps: 15, weight: 50}, {exerciseId: 'bentover', sets: 4, reps: 15, weight: 15}, {exerciseId: 'clr', sets: 4, reps: 15, weight: 15}] },
      { id: 'kj_arm_1', title: '이두 (고중량 바벨컬)', desc: '무거운 바벨로 이두근의 매스를 극한으로 키움', workouts: [{exerciseId: 'bc', sets: 5, reps: 8, weight: 50, note: '네거티브 3~4초'}, {exerciseId: 'hc', sets: 4, reps: 10, weight: 25}, {exerciseId: 'dc', sets: 4, reps: 12, weight: 20}] },
      { id: 'kj_arm_2', title: '삼두 (헤비 프레스)', desc: '팔 둘레를 넓히는 고중량 삼두 프레스와 익스텐션', workouts: [{exerciseId: 'tc', sets: 5, reps: 10, weight: 50}, {exerciseId: 'sc', sets: 4, reps: 10, weight: 45, note: '네거티브 3~4초'}, {exerciseId: 'ct', sets: 4, reps: 12, weight: 35}] }
    ]
  },
  {
    id: 'k_kim_km', name: '김강민 (Kangmin Kim)', nickname: '나바의 왕', era: 'NABBA 프로전 5회 우승',
    desc: "NABBA 프로전에서 다섯 번 우승해 '나바의 왕'으로 불리는 보디빌더. 단점 없는 밸런스를 위해 고반복과 짧은 휴식으로 펌핑을 극대화하는 스타일이에요.",
    imageColor: 'from-amber-500 to-orange-800',
    split: '주 5~6일 · 부위별 분할 (고볼륨)',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kk_sh_1', title: '어깨 (쉬는 시간 없는 측면 폭격)', desc: '지독한 고반복으로 어깨 측면을 불태우는 볼륨 루틴', workouts: [{exerciseId: 'lr', sets: 8, reps: 20, weight: 8}, {exerciseId: 'clr', sets: 5, reps: 15, weight: 10}, {exerciseId: 'spm', sets: 4, reps: 15, weight: 50}, {exerciseId: 'uprow', sets: 4, reps: 15, weight: 30}] },
      { id: 'kk_sh_2', title: '어깨 (전/후면 입체 슈퍼세트)', desc: '전면과 후면을 번갈아 타격하여 펌핑 극대화', workouts: [{exerciseId: 'ohp', sets: 5, reps: 12, weight: 50}, {exerciseId: 'rpdf', sets: 5, reps: 20, weight: 35}, {exerciseId: 'fr', sets: 4, reps: 15, weight: 12}, {exerciseId: 'bentover', sets: 4, reps: 20, weight: 8}] },
      { id: 'kk_arm_1', title: '팔 (이두/삼두 터닝 슈퍼세트)', desc: '이두와 삼두를 쉬지 않고 번갈아 묶어서 진행', workouts: [{exerciseId: 'bc', sets: 5, reps: 15, weight: 30}, {exerciseId: 'tc', sets: 5, reps: 15, weight: 35}, {exerciseId: 'pcurl', sets: 4, reps: 15, weight: 20}, {exerciseId: 'ct', sets: 4, reps: 15, weight: 20}] },
      { id: 'kk_arm_2', title: '팔 (고립 자이언트 세트)', desc: '가벼운 무게로 혈류량을 폭발시키는 미친 펌핑감', workouts: [{exerciseId: 'dc', sets: 4, reps: 20, weight: 10}, {exerciseId: 'sc', sets: 4, reps: 15, weight: 25}, {exerciseId: 'hc', sets: 4, reps: 15, weight: 12}, {exerciseId: 'tkb', sets: 4, reps: 15, weight: 8}] },
      { id: 'kk_leg_1', title: '하체 (전면 고볼륨 서킷)', desc: '다리가 후들거릴 때까지 반복하는 대퇴사두 훈련', workouts: [{exerciseId: 'sq', sets: 5, reps: 15, weight: 100}, {exerciseId: 'le', sets: 5, reps: 25, weight: 50}, {exerciseId: 'lpd', sets: 4, reps: 20, weight: 200}, {exerciseId: 'goblet', sets: 4, reps: 15, weight: 25}] },
      { id: 'kk_leg_2', title: '하체 (둔근/햄스트링 고문)', desc: '탄탄한 둔근과 뒷다리를 위한 혹독한 프리웨이트', workouts: [{exerciseId: 'bss', sets: 5, reps: 15, weight: 20}, {exerciseId: 'rdl', sets: 4, reps: 15, weight: 80}, {exerciseId: 'lc', sets: 5, reps: 20, weight: 40}, {exerciseId: 'lunge', sets: 4, reps: 20, weight: 15}] },
      { id: 'kk_chest_1', title: '가슴 (인클라인 펌핑 집중)', desc: '가슴 윗부분을 꽉 채우는 고반복 인클라인', workouts: [{exerciseId: 'ip', sets: 5, reps: 12, weight: 70}, {exerciseId: 'idp', sets: 4, reps: 15, weight: 25}, {exerciseId: 'cf', sets: 5, reps: 20, weight: 20}, {exerciseId: 'pushup', sets: 3, reps: 20, weight: 0}] },
      { id: 'kk_chest_2', title: '가슴 (머신 프레스/플라이 볼륨)', desc: '머신을 이용해 가슴 근육에만 타격감을 집중', workouts: [{exerciseId: 'cpm', sets: 5, reps: 15, weight: 60}, {exerciseId: 'pdf', sets: 5, reps: 15, weight: 30}, {exerciseId: 'dips', sets: 4, reps: 15, weight: 0}, {exerciseId: 'dfly', sets: 4, reps: 15, weight: 15}] },
      { id: 'kk_back_1', title: '등 (너비감 극대화 턱걸이)', desc: '등의 넓이를 한계까지 뽑아내는 풀다운 계열', workouts: [{exerciseId: 'pu', sets: 5, reps: 12, weight: 0}, {exerciseId: 'pd', sets: 4, reps: 15, weight: 60}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 25}, {exerciseId: 'cu', sets: 3, reps: 12, weight: 0}] },
      { id: 'kk_back_2', title: '등 (두께 및 승모 디테일)', desc: '오밀조밀한 등 근육의 디테일을 채우는 로우 훈련', workouts: [{exerciseId: 'sr', sets: 5, reps: 15, weight: 60}, {exerciseId: 'br', sets: 4, reps: 12, weight: 70}, {exerciseId: 'uprow', sets: 4, reps: 15, weight: 30}, {exerciseId: 'dr_back', sets: 4, reps: 15, weight: 25}] }
    ]
  }
];
export { FOOD_DB } from './foods.js';
export const SKIN_COLORS = ['#eec4a6', '#f6dccb', '#e0ab86', '#c98d64', '#a46a45', '#74472c'];
export const SHIRT_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#171717', '#ffffff', '#eab308', '#ec4899', '#06b6d4'];
export const BOTTOM_COLORS = ['#171717', '#4b5563', '#1e3a8a', '#3b82f6', '#f3f4f6', '#a8a29e', '#7f1d1d'];
export const ACC_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#171717', '#ffffff', '#fbbf24', '#9ca3af', '#ec4899', '#06b6d4'];
export const HAIR_COLORS = ['#171717', '#451a03', '#b45309', '#fcd34d', '#dc2626', '#e4e4e7', '#a855f7'];
export const getExName = (exItem) => {
  if (!exItem) return '운동';
  if (typeof exItem === 'string') return exItem;
  if (exItem.exercise && exItem.exercise.name) return String(exItem.exercise.name);
  if (exItem.name) return String(exItem.name);
  return '운동';
};
export const getExTarget = (exItem) => {
  if (!exItem) return '전신';
  if (exItem.exercise && exItem.exercise.target) return String(exItem.exercise.target);
  if (exItem.target) return String(exItem.target);
  return '전신';
};
export const getExId = (exItem) => {
  if (!exItem) return '';
  if (exItem.exercise && exItem.exercise.id) return String(exItem.exercise.id);
  if (exItem.id) return String(exItem.id);
  return '';
};
// 세트 종류: 저장 값은 예전 그대로 W(워밍업)·-(메인)·D(드랍), 화면에는 한글로
export const SET_TYPE_LABEL = { W: '워밍업', '-': '메인', D: '드랍' };
export const SET_TYPE_STYLE = {
  W: 'text-sky-300 bg-sky-400/10 border-sky-400/40',
  '-': 'text-yellow-300 bg-yellow-400/10 border-yellow-400/50 shadow-[0_0_8px_rgba(250,204,21,0.35)]',
  D: 'text-rose-400 bg-rose-500/10 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
};
// 종목의 중량 기준(바벨·덤벨·머신·맨몸). 종목표의 기구 정보를 우선 쓴다
export const ruleOfEx = (exItem) => {
  const id = String(getExId(exItem));
  const opt = EXERCISE_OPTIONS.find(e => e.id === id);
  return weightRule(id, opt?.tool || exItem?.exercise?.tool || exItem?.tool);
};
export const toolOfEx = (exItem) => {
  const id = String(getExId(exItem));
  return EXERCISE_OPTIONS.find(e => e.id === id)?.tool || exItem?.exercise?.tool || exItem?.tool;
};
