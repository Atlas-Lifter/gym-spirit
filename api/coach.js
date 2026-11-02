// AI 코치 서버 함수 (Vercel Edge) — NVIDIA API 키는 여기(서버 환경변수)에만 있고 브라우저로 가지 않는다
// 환경변수 (Vercel → Settings → Environment Variables)
//   NVIDIA_API_KEY        build.nvidia.com 에서 받은 nvapi-… 키 (필수)
//   COACH_ALLOWED_EMAILS  코치를 쓸 수 있는 로그인 이메일, 쉼표로 여러 개 (필수 — 남이 키를 쓰지 못하게)
//   NVIDIA_MODEL          쓸 모델 (선택, 기본 deepseek-ai/deepseek-v4.1-flash)
// 요청: POST { messages: [{ role: 'user'|'assistant', content }], context: '내 기록 요약' }, 헤더 Authorization: Bearer <Supabase 로그인 토큰>
// 응답: 답변 글자를 생기는 대로 흘려보내는 text/plain 스트림
export const config = { runtime: 'edge' };

import { SUPABASE_URL, SUPABASE_KEY } from '../src/supabaseConfig.js';

const DEFAULT_MODELS = ['deepseek-ai/deepseek-v4.1-flash', 'moonshotai/kimi-k2.6', 'google/gemma-4-31b-it'];
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

const SYSTEM = `너는 GYM SPIRIT 앱의 퍼스널 트레이너 겸 영양 코치 "스피릿 코치"야.
- 항상 한국어 존댓말로, 짧고 바로 쓸 수 있게 답해. 기본은 5~8줄, 필요하면 번호 목록.
- 아래 [내 기록]에 있는 실제 운동·회복·식단·체성분 숫자를 근거로 구체적으로 말해 (예: "벤치 60kg×8 → 다음엔 62.5kg×6~8").
- 기록에 없는 건 지어내지 말고 "기록이 없어요"라고 말한 뒤 일반적인 기준을 알려줘.
- 회복도가 60% 미만인 부위는 고강도 운동을 권하지 마.
- 통증·부상·질병·약물 질문은 진단하지 말고 운동을 멈추고 병원(정형외과·재활의학과) 진료를 권해.
- 하루 1,200kcal 미만 섭취, 주 1% 넘는 감량, 스테로이드·위험한 보충제는 권하지 마.
- 운동·식단·회복·몸 관리와 상관없는 질문에는 한 줄로 정중히 운동 이야기로 돌려.`;

const json = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

async function userEmail(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return (u && u.email || '').toLowerCase() || null;
}

// NVIDIA 의 SSE(data: {...}) 응답에서 글자만 꺼내 그대로 흘려보낸다
function textStream(upstream) {
  const dec = new TextDecoder(), enc = new TextEncoder();
  let buf = '';
  return new ReadableStream({
    async start(ctrl) {
      const reader = upstream.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const line of lines) {
            const s = line.trim();
            if (!s.startsWith('data:')) continue;
            const data = s.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const d = JSON.parse(data).choices?.[0]?.delta;
              // 생각하는 과정(reasoning)은 보여주지 않고 답변만
              if (d?.content) ctrl.enqueue(enc.encode(d.content));
            } catch { /* 조각난 줄은 건너뜀 */ }
          }
        }
      } catch (e) {
        ctrl.enqueue(enc.encode('\n\n(답변이 중간에 끊겼어요. 다시 물어봐 주세요.)'));
      }
      ctrl.close();
    },
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') return json(405, 'POST 만 받아요');
  const key = process.env.NVIDIA_API_KEY;
  const allowed = (process.env.COACH_ALLOWED_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!key || !allowed.length) return json(503, 'AI 코치 설정이 아직 안 됐어요 (NVIDIA_API_KEY, COACH_ALLOWED_EMAILS)');

  const email = await userEmail(req).catch(() => null);
  if (!email) return json(401, '로그인한 계정에서만 쓸 수 있어요');
  if (!allowed.includes(email)) return json(403, '이 계정은 AI 코치를 쓸 수 없어요');

  let body;
  try { body = await req.json(); } catch { return json(400, '요청 형식이 잘못됐어요'); }
  const turns = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_TURNS)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!turns.length || turns[turns.length - 1].role !== 'user') return json(400, '질문이 비어 있어요');
  const context = String(body.context || '').slice(0, 6000);
  const messages = [{ role: 'system', content: `${SYSTEM}\n\n[내 기록]\n${context || '(기록 없음)'}` }, ...turns];

  const base = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const models = process.env.NVIDIA_MODEL ? [process.env.NVIDIA_MODEL] : DEFAULT_MODELS;
  let lastErr = '';
  // 모델이 바쁘거나 없어졌으면 다음 모델로
  for (const model of models) {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ model, messages, stream: true, temperature: 0.5, top_p: 0.9, max_tokens: 900 }),
    }).catch(e => ({ ok: false, status: 0, text: async () => String(e) }));
    if (r.ok && r.body) {
      return new Response(textStream(r), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-coach-model': model } });
    }
    lastErr = `${model}: ${r.status}`;
    if (r.status === 401 || r.status === 403) return json(502, 'NVIDIA API 키가 맞지 않아요. Vercel 환경변수를 확인해 주세요');
    if (r.status === 429) return json(429, '잠깐 너무 많이 물어봤어요. 1분 뒤에 다시 해 주세요');
  }
  return json(502, `AI 모델이 응답하지 않아요 (${lastErr})`);
}
