// AI 코치 서버 함수 (Vercel Edge) — NVIDIA API 키는 여기(서버 환경변수)에만 있고 브라우저로 가지 않는다
// 환경변수 (Vercel → Settings → Environment Variables)
//   NVIDIA_API_KEY        build.nvidia.com 에서 받은 nvapi-… 키 (필수)
//   COACH_ALLOWED_EMAILS  코치를 쓸 수 있는 로그인 이메일, 쉼표로 여러 개 (필수 — 남이 키를 쓰지 못하게)
//   NVIDIA_MODEL          쓸 모델 하나로 고정 (선택. 없으면 아래 ORDER)
// 요청: POST { messages: [{ role: 'user'|'assistant', content }], context: '내 기록 요약', mode: 'deep'|'fast' }, 헤더 Authorization: Bearer <Supabase 로그인 토큰>
// 응답: 답변 글자를 생기는 대로 흘려보내는 text/plain 스트림
export const config = { runtime: 'edge' };

import { SUPABASE_URL, SUPABASE_KEY } from '../src/supabaseConfig.js';

// 무료(체험) 엔드포인트에서 재 본 결과 (2026-11): glm 은 답이 가장 꼼꼼하지만 생각하느라 약 20초,
// nemotron-lightning 은 생각을 끄면 약 3초. 요청의 mode 로 순서를 정하고, 늦거나 실패하면 다른 모델로 넘어간다
const DEEP = { id: 'z-ai/glm-5.3-flash', firstWithin: 40000, extra: { max_tokens: 1500, reasoning_effort: 'low' } };
const FAST = { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', firstWithin: 20000, extra: { max_tokens: 900, chat_template_kwargs: { enable_thinking: false } } };
const ORDER = { deep: [DEEP, FAST], fast: [FAST, DEEP] };
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

const SYSTEM = `너는 GYM SPIRIT 앱의 퍼스널 트레이너 겸 영양 코치 "스피릿 코치"야.
- 항상 한국어 존댓말로, 짧고 바로 쓸 수 있게 답해. 기본은 5~8줄, 필요하면 번호 목록.
- 아래 [내 기록]에 있는 실제 운동·회복·식단·체성분 숫자를 근거로 구체적으로 말해 (예: "벤치 60kg×8 → 다음엔 62.5kg×6~8").
- 무게는 바벨 2.5kg, 덤벨 1~2kg 단위로 조금씩 올리라고 해 (점진적 과부하).
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

// 모델 하나에 물어 답 글자를 write 로 넘긴다. 첫 글자가 firstWithin 안에 안 오면 포기 (→ 다음 모델)
// 결과: 'ok' | 'skip'(다음 모델로) | { error }(바로 끝냄)
async function ask(model, messages, key, write) {
  const base = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const ctrl = new AbortController();
  let timer = setTimeout(() => ctrl.abort(), model.firstWithin);
  let wrote = false;
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ model: model.id, messages, stream: true, temperature: 0.5, top_p: 0.9, ...model.extra }),
    });
    if (r.status === 401 || r.status === 403) return { error: 'NVIDIA API 키가 맞지 않아요. Vercel 환경변수를 확인해 주세요.' };
    if (!r.ok || !r.body) return 'skip';
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
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
        let d;
        try { d = JSON.parse(data).choices?.[0]?.delta; } catch { continue; }
        // 생각하는 과정(reasoning)은 보여주지 않고 답변만
        if (d?.content) {
          if (!wrote) { clearTimeout(timer); timer = null; wrote = true; }
          write(d.content);
        }
      }
    }
    return wrote ? 'ok' : 'skip';
  } catch (e) {
    if (wrote) { write('\n\n(답변이 중간에 끊겼어요. 다시 물어봐 주세요.)'); return 'ok'; }
    return 'skip';
  } finally {
    if (timer) clearTimeout(timer);
  }
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
  const models = process.env.NVIDIA_MODEL ? [{ id: process.env.NVIDIA_MODEL, firstWithin: 60000, extra: { max_tokens: 1500 } }] : ORDER[body.mode === 'fast' ? 'fast' : 'deep'];

  // 응답은 바로 시작하고(Edge 는 25초 안에 응답을 시작해야 한다) 답 글자는 생기는 대로 흘려보낸다
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const write = (t) => ctrl.enqueue(enc.encode(t));
      let result = 'skip';
      for (const m of models) {
        result = await ask(m, messages, key, write);
        if (result !== 'skip') break;
      }
      if (result === 'skip') write('지금 AI 모델이 바빠서 답하지 못했어요. 잠시 뒤 다시 물어봐 주세요.');
      else if (result.error) write(result.error);
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
