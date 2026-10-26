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

// 주간 레이드 보스: 매주 바뀌고, 길드원 볼륨이 곧 피해량
export const RAID_BOSSES = [
  { emoji: '👹', name: '작심삼일 대마왕', line: '월요일만 되면 나타나 의지를 꺾는다' },
  { emoji: '🐉', name: '치팅데이 드래곤', line: '한 끼만 더… 라고 속삭인다' },
  { emoji: '🍗', name: '야식 마왕', line: '밤 11시의 치킨 냄새로 공격한다' },
  { emoji: '🛋️', name: '소파 골렘', line: '한 번 앉으면 일어날 수 없다' },
  { emoji: '💀', name: '월요병 리치', line: '출근길 피로를 빨아들인다' },
  { emoji: '📱', name: '숏폼 히드라', line: '하나 자르면 영상이 두 개 생긴다' },
];
export const raidOf = (week, skills) => {
  const ws = week?.week_start ? new Date(`${week.week_start}T00:00:00`) : new Date();
  const idx = Math.floor(ws.getTime() / (7 * 86400000)) % RAID_BOSSES.length;
  const n = Math.max(1, week?.members || 1);
  const hp = 25000 * n;
  const dmg = Math.round((week?.volume || 0) * (1 + 0.1 * skillLv(skills, 'rack')));
  return { boss: RAID_BOSSES[(idx + RAID_BOSSES.length) % RAID_BOSSES.length], hp, dmg, left: Math.max(0, hp - dmg), pct: Math.min(100, (dmg / hp) * 100), defeated: dmg >= hp, reward: 500 };
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
  };
  const key = Object.keys(map).find(k => m.includes(k));
  if (key) return map[key];
  if (/could not find the function|PGRST202|does not exist/i.test(m)) return '길드 기능 준비 중이에요. (DB 설정이 아직 반영되지 않았어요)';
  if (/failed to fetch|network/i.test(m)) return '인터넷 연결을 확인해 주세요.';
  return '잠시 후 다시 시도해 주세요.';
};
