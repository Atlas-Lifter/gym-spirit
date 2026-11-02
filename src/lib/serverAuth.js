// 서버 함수(api/*.js) 공통: NVIDIA 키가 있는지, 로그인한 사람이 COACH_ALLOWED_EMAILS 에 있는지 확인한다
import { SUPABASE_URL, SUPABASE_KEY } from '../supabaseConfig.js';

export const jsonError = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

async function userEmail(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return (u && u.email || '').toLowerCase() || null;
}

// 통과하면 { key, email }, 아니면 { error: Response }
export async function checkAiAccess(req, label = 'AI 코치') {
  const key = process.env.NVIDIA_API_KEY;
  const allowed = (process.env.COACH_ALLOWED_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!key || !allowed.length) return { error: jsonError(503, `${label} 설정이 아직 안 됐어요 (NVIDIA_API_KEY, COACH_ALLOWED_EMAILS)`) };
  const email = await userEmail(req).catch(() => null);
  if (!email) return { error: jsonError(401, '로그인한 계정에서만 쓸 수 있어요') };
  if (!allowed.includes(email)) return { error: jsonError(403, `이 계정은 ${label}를 쓸 수 없어요`) };
  return { key, email };
}
