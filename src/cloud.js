// Supabase 연결: 회원(로그인), 개인 기록 저장, 공개 프로필(랭킹), 친구 요청, 응원
// publishable 키는 브라우저에 공개되도록 만들어진 키라 코드에 둬도 안전하다. (권한은 DB의 RLS 규칙이 막는다)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jparwpjyertrfncmftil.supabase.co';
const SUPABASE_KEY = 'sb_publishable_chMnSPGH1m0CN0oDwg26-Q_wy5nUHVO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export const SITE_URL = 'https://gym-spirit.vercel.app';

const PROFILE_COLS = 'id, nickname, avatar, week_start, weekly_volume, lift3, fav, last_routine';

// 이번 주 월요일 (YYYY-MM-DD, 기기 시간 기준)
export const mondayKey = (d = new Date()) => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`;
};

// Supabase 오류를 사용자에게 보여줄 한국어 문장으로
export const authErrorText = (error) => {
  const msg = String(error?.message || error || '');
  if (/invalid login credentials/i.test(msg)) return '이메일 또는 비밀번호가 맞지 않아요.';
  if (/email not confirmed/i.test(msg)) return '메일함에서 인증 링크를 먼저 눌러 주세요.';
  if (/already registered|already been registered/i.test(msg)) return '이미 가입된 이메일이에요. 로그인해 주세요.';
  if (/password should be at least/i.test(msg)) return '비밀번호는 6자리 이상이어야 해요.';
  if (/rate limit|too many/i.test(msg)) return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.';
  if (/invalid.*email|email.*invalid/i.test(msg)) return '이메일 주소를 다시 확인해 주세요.';
  if (/failed to fetch|network/i.test(msg)) return '인터넷 연결을 확인해 주세요.';
  return msg || '알 수 없는 오류가 발생했어요.';
};

// ── 회원 ──
export const signUp = async ({ email, password, nickname }) => {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { nickname }, emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  // 이미 가입된 이메일이면 Supabase는 오류 대신 identities가 빈 사용자를 돌려준다
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('already registered');
  }
  return data; // data.session 이 없으면 메일 인증 대기
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = () => supabase.auth.signOut();

export const sendPasswordReset = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) throw error;
};

export const updatePassword = async (password) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

// ── 개인 기록 ──
export const loadUserData = async (uid) => {
  const { data, error } = await supabase.from('user_data').select('data').eq('id', uid).maybeSingle();
  if (error) throw error;
  return data?.data || {};
};

export const saveUserData = async (uid, payload) => {
  const { error } = await supabase.from('user_data').update({ data: payload, updated_at: new Date().toISOString() }).eq('id', uid);
  if (error) throw error;
};

// ── 공개 프로필 ──
export const loadMyProfile = async (uid) => {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS).eq('id', uid).maybeSingle();
  if (error) throw error;
  return data;
};

export const savePublicProfile = async (uid, fields) => {
  const { error } = await supabase.from('profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', uid);
  if (error) throw error;
};

// 랭킹 화면에서 쓰는 모양으로 변환 (이번 주 기록이 없으면 볼륨 0)
export const toRankUser = (p, week = mondayKey()) => ({
  id: p.id,
  name: p.nickname || '짐스피릿 유저',
  volume: p.week_start === week ? Math.round(Number(p.weekly_volume) || 0) : 0,
  lift: Math.round(Number(p.lift3) || 0),
  fav: p.fav || '',
  profile: p.avatar && Object.keys(p.avatar).length ? p.avatar : null,
  routine: p.last_routine || null,
  avatarColor: 'bg-neutral-700',
});

export const fetchRanking = async () => {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS)
    .order('weekly_volume', { ascending: false }).limit(300);
  if (error) throw error;
  return data || [];
};

export const fetchProfiles = async (ids) => {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS).in('id', ids);
  if (error) throw error;
  return data || [];
};

export const searchProfiles = async (query, excludeId) => {
  const q = query.trim().replace(/[%_,()]/g, '');
  let req = supabase.from('profiles').select(PROFILE_COLS).order('updated_at', { ascending: false }).limit(30);
  if (q) req = req.ilike('nickname', `%${q}%`);
  if (excludeId) req = req.neq('id', excludeId);
  const { data, error } = await req;
  if (error) throw error;
  return data || [];
};

// ── 응원 ──
export const fetchCheerCounts = async (week = mondayKey()) => {
  const { data, error } = await supabase.from('cheers').select('to_id').eq('week_start', week).limit(5000);
  if (error) throw error;
  return (data || []).reduce((acc, r) => { acc[r.to_id] = (acc[r.to_id] || 0) + 1; return acc; }, {});
};

export const sendCheer = async (fromId, toId) => {
  const { error } = await supabase.from('cheers').insert({ from_id: fromId, to_id: toId, week_start: mondayKey() });
  if (error) throw error;
};

// ── 친구 ──
export const fetchFriendRequests = async (uid) => {
  const { data, error } = await supabase.from('friend_requests').select('id, from_id, to_id, status, created_at')
    .or(`from_id.eq.${uid},to_id.eq.${uid}`).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// 친구 상태 정리: friends(서로 친구), sent(내가 보낸 대기), incoming(나에게 온 대기)
export const summarizeFriends = (rows, uid) => {
  const friends = [], sent = [], incoming = [];
  rows.forEach(r => {
    const other = r.from_id === uid ? r.to_id : r.from_id;
    if (r.status === 'accepted') { if (!friends.includes(other)) friends.push(other); }
    else if (r.from_id === uid) sent.push(other);
    else incoming.push({ requestId: r.id, from: other, at: r.created_at });
  });
  return { friends, sent: sent.filter(id => !friends.includes(id)), incoming: incoming.filter(r => !friends.includes(r.from)) };
};

// 상대가 이미 나에게 요청을 보냈다면 새로 보내지 않고 바로 수락한다
export const requestFriend = async (uid, targetId) => {
  const rows = await fetchFriendRequests(uid);
  const reverse = rows.find(r => r.from_id === targetId && r.to_id === uid);
  if (reverse) {
    if (reverse.status !== 'accepted') await acceptFriendRequest(reverse.id);
    return 'accepted';
  }
  if (rows.some(r => r.from_id === uid && r.to_id === targetId)) return 'pending';
  const { error } = await supabase.from('friend_requests').insert({ from_id: uid, to_id: targetId });
  if (error && error.code !== '23505') throw error; // 23505: 이미 보낸 요청
  return 'pending';
};

export const acceptFriendRequest = async (requestId) => {
  const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
  if (error) throw error;
};

export const deleteFriendRequest = async (requestId) => {
  const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
  if (error) throw error;
};

export const removeFriend = async (uid, otherId) => {
  const { error } = await supabase.from('friend_requests').delete()
    .or(`and(from_id.eq.${uid},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${uid})`);
  if (error) throw error;
};

// 나와 관련된 친구 요청이 생기거나 바뀌면 바로 알려준다 (실시간)
export const subscribeFriendRequests = (uid, onChange) => {
  const channel = supabase.channel(`friend-requests-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `to_id=eq.${uid}` }, (p) => onChange(p, 'to'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `from_id=eq.${uid}` }, (p) => onChange(p, 'from'))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};
