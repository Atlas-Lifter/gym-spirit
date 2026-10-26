// 길드: 엠블럼·색·직책·계급·레벨·스킬·주간 미션·레이드 보스
// 숫자 규칙은 supabase/guilds.sql 과 같아야 한다 (보상 지급·검증은 DB가 하고, 화면은 같은 식으로 미리 보여준다)

export const GUILD_EMBLEMS = ['🏋️', '💪', '🦍', '🔥', '⚡', '🛡️', '🐉', '🦁', '🐺', '👊', '🏆', '💎'];

export const GUILD_COLORS = {
  emerald: { label: '에메랄드', from: '#34d399', to: '#059669', soft: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  blue: { label: '블루', from: '#60a5fa', to: '#2563eb', soft: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-300' },
  rose: { label: '레드', from: '#fb7185', to: '#e11d48', soft: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-300' },
  amber: { label: '골드', from: '#fbbf24', to: '#d97706', soft: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-300' },
  violet: { label: '퍼플', from: '#a78bfa', to: '#7c3aed', soft: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-300' },
  black: { label: '블랙', from: '#525252', to: '#0a0a0a', soft: 'bg-neutral-100', text: 'text-neutral-800', ring: 'ring-neutral-300' },
};
export const guildColor = (c) => GUILD_COLORS[c] || GUILD_COLORS.emerald;

// 직책: 관장(길드장) · 코치(부길드장, 최대 3명) · 회원
export const GUILD_ROLES = {
  leader: { name: '관장', icon: '👑', cls: 'bg-amber-100 text-amber-800' },
  coach: { name: '코치', icon: '🎖️', cls: 'bg-blue-100 text-blue-700' },
  member: { name: '회원', icon: '', cls: 'bg-neutral-100 text-neutral-500' },
};
export const COACH_MAX = 3;

// 계급: 길드에 쌓은 기여 경험치로 오른다
export const MEMBER_TIERS = [
  { min: 0, name: '헬린이', icon: '🐣' },
  { min: 300, name: '쇠질러', icon: '🔩' },
  { min: 1000, name: '펌핑러', icon: '💪' },
  { min: 2500, name: '헬창', icon: '🔥' },
  { min: 5000, name: '근육몬', icon: '🦍' },
  { min: 10000, name: '3대500 전설', icon: '🏆' },
];
export const memberTier = (contrib = 0) => [...MEMBER_TIERS].reverse().find(t => contrib >= t.min);
export const nextMemberTier = (contrib = 0) => MEMBER_TIERS.find(t => t.min > contrib) || null;

// 길드 레벨: 1→2에 600, 이후 레벨마다 300씩 더 필요 (최대 30)
export const GUILD_MAX_LEVEL = 30;
export const guildLevelInfo = (xp = 0) => {
  let level = 1, need = 600, rem = Math.max(0, xp);
  while (rem >= need && level < GUILD_MAX_LEVEL) { rem -= need; level += 1; need = 600 + 300 * (level - 1); }
  return { level, into: rem, need, max: level >= GUILD_MAX_LEVEL };
};

export const GUILD_SKILLS = [
  { key: 'pt', icon: '🏋️', name: '단체 PT', max: 5, desc: (lv) => `운동 기록 경험치 +${lv * 10}%` },
  { key: 'membership', icon: '🎫', name: '회원권 확장', max: 5, desc: (lv) => `길드 정원 +${lv * 2}명` },
  { key: 'protein', icon: '🥤', name: '프로틴 보급', max: 3, desc: (lv) => `주간 미션 보상 +${lv * 20}%` },
  { key: 'rack', icon: '🦾', name: '파워랙 증설', max: 5, desc: (lv) => `레이드 보스 피해 +${lv * 10}%` },
];
export const skillLv = (skills, key) => Number(skills?.[key]) || 0;
export const skillPoints = (xp, skills) => guildLevelInfo(xp).level - 1 - Object.values(skills || {}).reduce((a, b) => a + (Number(b) || 0), 0);
export const guildCap = (xp, skills) => Math.min(25, 9 + guildLevelInfo(xp).level) + 2 * skillLv(skills, 'membership');

// 운동 하루당 길드 경험치 (DB와 같은 식)
export const dayXp = (volume, skills) => (volume > 0 ? Math.round((40 + Math.min(60, Math.floor(volume / 250))) * (1 + 0.1 * skillLv(skills, 'pt'))) : 0);

// 이번 주 미션 (월요일마다 초기화)
export const weeklyMissions = (week, skills) => {
  const n = Math.max(1, week?.members || 1);
  const bonus = 1 + 0.2 * skillLv(skills, 'protein');
  return [
    { key: 'volume', icon: '🏋️', title: '합동 볼륨', desc: `길드 합계 ${(15000 * n).toLocaleString()}kg 들기`, cur: Math.round(week?.volume || 0), goal: 15000 * n, unit: 'kg', reward: Math.round(300 * bonus) },
    { key: 'attend', icon: '📅', title: '출석 도장', desc: `길드원 1명당 평균 주 3회 운동 (총 ${3 * n}회)`, cur: week?.days || 0, goal: 3 * n, unit: '회', reward: Math.round(300 * bonus) },
    { key: 'together', icon: '🤝', title: '같이 운동', desc: `${Math.max(2, Math.min(3, n))}명 이상 같은 날 운동한 날 2일`, cur: n >= 2 ? (week?.together || 0) : 0, goal: 2, unit: '일', reward: Math.round(200 * bonus), locked: n < 2 },
  ];
};

// 주간 레이드 보스: 1년(52주) 동안 한 번도 겹치지 않고 매주 바뀐다
// 13종의 헬스 방해꾼 × 분기마다 바뀌는 4가지 속성(서리·맹독·용암·심연) = 52마리, 53주차가 있는 해는 황금 최종 보스
// 길드원 이번 주 볼륨 합계가 곧 피해량 (보상·HP 계산은 DB와 같다)
export const BOSS_KINDS = [
  { key: 'sofa', name: '소파 골렘', line: '한 번 앉으면 다시는 일어날 수 없다' },
  { key: 'chicken', name: '치킨 마왕', line: '밤 11시, 바삭한 유혹으로 공격한다' },
  { key: 'phone', name: '숏폼 히드라', line: '하나 넘기면 영상이 두 개 생긴다' },
  { key: 'alarm', name: '스누즈 리치', line: '5분만 더… 를 영원히 반복시킨다' },
  { key: 'cola', name: '콜라 슬라임', line: '제로라서 괜찮다고 속삭인다' },
  { key: 'ramen', name: '라면 크라켄', line: '국물까지 마시게 만드는 면발 촉수' },
  { key: 'bed', name: '이불 미믹', line: '아침마다 온몸을 꽉 붙잡는다' },
  { key: 'goblin', name: '핑계 고블린', line: '"진짜 내일부터 할게"를 외친다' },
  { key: 'ogre', name: '배달 오우거', line: '최소주문금액을 채우라고 강요한다' },
  { key: 'demon', name: '작심삼일 대마왕', line: '결심 사흘째 되는 날 반드시 나타난다' },
  { key: 'dragon', name: '치팅데이 드래곤', line: '"오늘만 먹자"며 도넛 불꽃을 뿜는다' },
  { key: 'sloth', name: '나무늘보 거인', line: '움직이지 않을수록 강해진다' },
  { key: 'pizza', name: '피자 골렘', line: '치즈처럼 유혹이 끝없이 늘어난다' },
];
export const BOSS_ELEMENTS = [
  { key: 'frost', name: '서리', season: '1분기 · 겨울', glow: '#7dd3fc', eye: '#e0f2fe', accent: '#38bdf8', bg: ['#0c4a6e', '#082f49'], particle: 'snow' },
  { key: 'toxic', name: '맹독', season: '2분기 · 봄', glow: '#a3e635', eye: '#f7fee7', accent: '#65a30d', bg: ['#365314', '#1a2e05'], particle: 'bubble' },
  { key: 'magma', name: '용암', season: '3분기 · 여름', glow: '#fb923c', eye: '#fef08a', accent: '#ea580c', bg: ['#7c2d12', '#431407'], particle: 'ember' },
  { key: 'void', name: '심연', season: '4분기 · 가을', glow: '#c084fc', eye: '#fae8ff', accent: '#7c3aed', bg: ['#4c1d95', '#2e1065'], particle: 'wisp' },
];
const GOLD = { key: 'gold', name: '황금', season: '연말 특별', glow: '#fde047', eye: '#fffbeb', accent: '#ca8a04', bg: ['#713f12', '#422006'], particle: 'ember' };

// 한 해의 몇째 주인지 (ISO 주차, 1~53)
export const isoWeek = (date) => {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
};

export const bossOfWeek = (weekStart) => {
  const ws = weekStart ? new Date(`${weekStart}T00:00:00`) : new Date();
  const week = isoWeek(ws);
  if (week >= 53) {
    return { week, kind: BOSS_KINDS[9], element: GOLD, name: '최종 보스 · 황금 작심삼일 대마왕', line: '한 해의 마지막 주, 모든 결심을 시험한다', final: true };
  }
  const kind = BOSS_KINDS[(week - 1) % BOSS_KINDS.length];
  const element = BOSS_ELEMENTS[Math.floor((week - 1) / BOSS_KINDS.length)];
  return { week, kind, element, name: `${element.name}의 ${kind.name}`, line: kind.line };
};

// 보스는 죽지 않는다: 쓰러지면 HP가 50%씩 더 늘어난 다음 단계로 바로 부활한다 (1단계 = 길드원 수 × 25,000)
export const RAID_BASE_HP = 25000;
export const stageHp = (members, stage) => Math.round(RAID_BASE_HP * Math.max(1, members) * (1 + 0.5 * (stage - 1)));
export const raidStages = (damage, members) => {
  let left = Math.max(0, damage), stage = 1;
  while (left >= stageHp(members, stage) && stage < 99) { left -= stageHp(members, stage); stage += 1; }
  const hp = stageHp(members, stage);
  return { stage, kills: stage - 1, hp, into: left, left: hp - left, pct: (left / hp) * 100 };
};

export const raidOf = (week, skills) => {
  const n = Math.max(1, week?.members || 1);
  const dmg = Math.round((week?.volume || 0) * (1 + 0.1 * skillLv(skills, 'rack')));
  const st = raidStages(dmg, n);
  // defeated: 1단계를 한 번이라도 쓰러뜨렸는지 (길드 경험치 보상 조건, DB와 같음)
  return { boss: bossOfWeek(week?.week_start), dmg, ...st, defeated: st.kills >= 1, reward: 500 };
};

// 주간 개인 경험치 정산: 참여 50 + 내가 준 피해 200kg당 1 (최대 500) + 보스를 쓰러뜨린 단계마다 120 + 주간 MVP 100
// 그 주에 이 길드에서 한 번이라도 운동(피해)했을 때만 받는다
export const raidPersonalReward = ({ kills = 0, myDamage = 0, mvp = false }) => {
  if (!(myDamage > 0)) return { total: 0, items: [] };
  const items = [
    { label: '참여', xp: 50 },
    { label: `내 피해 ${Math.round(myDamage).toLocaleString()}kg`, xp: Math.min(500, Math.floor(myDamage / 200)) },
    { label: `보스 ${kills}단계 처치`, xp: kills * 120 },
    ...(mvp ? [{ label: '주간 MVP', xp: 100 }] : []),
  ].filter(it => it.xp > 0);
  return { total: items.reduce((a, it) => a + it.xp, 0), items };
};

// DB 오류 → 안내 문장
export const guildErrorText = (e) => {
  const m = String(e?.message || e || '');
  const map = {
    'GS:LOGIN': '로그인이 필요해요.',
    'GS:IN_GUILD': '이미 길드에 속해 있어요. 먼저 길드를 나가 주세요.',
    'GS:NAME_LEN': '길드 이름은 2~12자로 정해 주세요.',
    'GS:NAME_TAKEN': '이미 있는 길드 이름이에요.',
    'GS:NO_GUILD': '길드를 찾을 수 없어요.',
    'GS:FULL': '길드 정원이 가득 찼어요.',
    'GS:BAD_CODE': '초대 코드가 맞지 않아요.',
    'GS:NO_PERMISSION': '권한이 없어요.',
    'GS:NOT_LEADER': '관장만 할 수 있어요.',
    'GS:NO_REQUEST': '가입 신청을 찾을 수 없어요.',
    'GS:NO_MEMBER': '길드원을 찾을 수 없어요.',
    'GS:COACH_MAX': `코치는 최대 ${COACH_MAX}명까지예요.`,
    'GS:MIN2': '길드원이 2명 이상이어야 랭킹에 등록할 수 있어요.',
    'GS:NO_POINTS': '남은 스킬 포인트가 없어요. 길드 레벨을 올려 주세요.',
    'GS:SKILL_MAX': '이미 최고 단계예요.',
    'GS:NOT_DONE': '아직 목표를 달성하지 못했어요.',
    'GS:CLAIMED': '이번 주 보상은 이미 받았어요.',
    'GS:NOT_ADMIN': '운영자만 할 수 있어요.',
    'GS:POST_LEN': '1~200자로 적어 주세요.',
    'GS:POST_LIMIT': '오늘은 글을 너무 많이 썼어요. 내일 다시 써 주세요.',
    'GS:NO_POST': '글을 찾을 수 없어요.',
    'GS:CHEERED': '오늘은 이미 응원했어요.',
    'GS:CHEER_LIMIT': '응원은 하루 5번까지예요.',
  };
  const key = Object.keys(map).find(k => m.includes(k));
  if (key) return map[key];
  if (/could not find the function|PGRST202|does not exist/i.test(m)) return '길드 기능 준비 중이에요. (DB 설정이 아직 반영되지 않았어요)';
  if (/failed to fetch|network/i.test(m)) return '인터넷 연결을 확인해 주세요.';
  return '잠시 후 다시 시도해 주세요.';
};

// 응원: 하루 5번, 같은 사람에게 하루 한 번, 1번에 길드 경험치 +10
export const CHEER_DAILY = 5;

// 연속 기록: 미션·레이드 보상을 받은 주가 이어진 수 (이번 주에 아직 없으면 지난주부터 센다)
export const claimStreak = (weeks = [], thisWeek) => {
  const set = new Set(weeks);
  const back = (k, n) => { const d = new Date(`${k}T00:00:00`); d.setDate(d.getDate() - 7 * n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  let start = set.has(thisWeek) ? 0 : 1, n = 0;
  while (set.has(back(thisWeek, start + n))) n += 1;
  return n;
};

// 길드 업적: 조건을 채우면 반짝이고, 아직이면 회색
export const guildBadges = ({ level = 1, members = 1, stats = {}, streak = 0, rank = null }) => [
  { icon: '🎉', name: '창단', desc: '길드를 만들었어요', done: true },
  { icon: '👥', name: '북적북적', desc: '길드원 5명', done: members >= 5 },
  { icon: '🏟️', name: '대형 길드', desc: '길드원 10명', done: members >= 10 },
  { icon: '⭐', name: '성장 중', desc: '길드 Lv.5', done: level >= 5 },
  { icon: '🌟', name: '명문 길드', desc: '길드 Lv.10', done: level >= 10 },
  { icon: '💫', name: '전설의 체육관', desc: '길드 Lv.20', done: level >= 20 },
  { icon: '👹', name: '첫 토벌', desc: '레이드 보스 1회 처치', done: (stats.raids || 0) >= 1 },
  { icon: '🗡️', name: '보스 사냥꾼', desc: '레이드 보스 5회 처치', done: (stats.raids || 0) >= 5 },
  { icon: '🎯', name: '미션 마스터', desc: '주간 미션 10회 달성', done: (stats.missions || 0) >= 10 },
  { icon: '🔥', name: '3주 연속', desc: '3주 연속 보상 획득', done: streak >= 3 },
  { icon: '👏', name: '응원단', desc: '길드 응원 50회', done: (stats.cheers || 0) >= 50 },
  { icon: '🏆', name: '랭킹 TOP 3', desc: '전체 랭킹 3위 안', done: !!rank && rank <= 3 },
];
