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
const DEEP = { id: 'z-ai/glm-5.3-flash', firstWithin: 40000, extra: { max_tokens: 2000, reasoning_effort: 'low' } };
const FAST = { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', firstWithin: 20000, extra: { max_tokens: 1200, chat_template_kwargs: { enable_thinking: false } } };
const ORDER = { deep: [DEEP, FAST], fast: [FAST, DEEP] };
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

const SYSTEM = `너는 GYM SPIRIT 앱의 퍼스널 트레이너 겸 영양 코치 "스피릿 코치"야.
- 항상 한국어 존댓말로, 짧고 바로 쓸 수 있게 답해. 기본은 5~8줄, 필요하면 번호 목록.
- 아래 [내 기록]에 있는 실제 운동·회복·식단·체성분 숫자를 근거로 구체적으로 말해 (예: "벤치 60kg×8 → 다음엔 62.5kg×6~8").
- 무게·반복 수는 "▶ 앱이 계산한 다음 무게"에 있는 종목이면 그 숫자를 그대로 써. 거기 없는 종목은 숫자를 지어내지 말고 "처음엔 가벼운 무게로 10~12회"처럼 말해.
- 기록에 없는 건 지어내지 말고 "기록이 없어요"라고 말한 뒤 일반적인 기준을 알려줘.
- 운동 부위 추천은 반드시 [내 기록]의 "▶ 오늘 운동 추천 가능 부위" 안에서만 해 (회복도 80% 이상이고 오늘 안 한 부위).
- "▶ 오늘 쉬어야 할 부위"와 오늘 이미 운동한 부위는 절대 다시 추천하지 마. 사용자가 그 부위를 하고 싶다고 하면 회복도와 남은 시간을 알려 주고 가볍게(낮은 무게·적은 세트) 하거나 쉬라고 해.
- 추천 가능 부위가 '없음'이면 휴식·가벼운 유산소·스트레칭을 권해.
- "▶ 내 루틴"이 요일별 고정이나 분할 순환이면 그게 이 사람이 직접 정한 루틴이야. 오늘 운동은 "▶ 오늘 루틴"/"오늘 차례" 부위를 최우선으로 추천하고, 종목·세트도 그 부위로 짜.
  · 단 그 부위가 "아직 쉬어야 할 부위"에 있으면 그대로 시키지 말고 이유를 말한 뒤 순서를 바꾸거나(다음 차례 부위를 먼저) 휴식을 권해.
  · 루틴 메모(시간 제약 등)가 있으면 지켜.
- "▶ 내 루틴: 정해진 루틴 없음"이면 회복도·이번 주 균형·요일별 습관을 보고 자유롭게 추천해.
- "▶ 내 루틴: 아직 안 알려줌"이면 운동을 추천한 답의 마지막 줄에 "요일별이나 분할 루틴이 있으면 위쪽 '내 루틴'에서 알려주세요. 그 루틴에 맞춰 드릴게요." 라고 한 번만 덧붙여.
- 내 루틴이 없을 때 "요일별 운동 습관"이 있으면 그 사람의 실제 습관으로 보고 존중해. 오늘 요일에 평소 하던 부위가 추천 가능하면 그걸 먼저 제안하고, 회복이 덜 됐으면 "평소 ○요일엔 ○○를 하시는데 아직 회복 중이라 오늘은 △△를 하고 ○○는 ○요일로 미루세요"처럼 일정을 조정해 줘.
- "이번 주 운동한 부위"를 보고 이번 주에 아직 안 한(또는 적게 한) 부위를 채우는 쪽으로 제안해.
- 통증·부상·질병·약물 질문은 진단하지 말고 운동을 멈추고 병원(정형외과·재활의학과) 진료를 권해.
- 하루 1,200kcal 미만 섭취, 주 1% 넘는 감량, 스테로이드·위험한 보충제는 권하지 마.
- 운동·식단·회복·몸 관리와 상관없는 질문에는 한 줄로 정중히 운동 이야기로 돌려.
- 오늘(또는 다음에) 할 운동 루틴을 구체적으로 추천했다면, 답변 맨 끝에 아래 형식의 블록을 딱 한 번 붙여. 앱이 이걸 읽어 [이 루틴으로 운동 시작] 버튼을 만든다.
  <routine>{"title":"등 운동","items":[{"name":"랫풀다운","sets":3,"reps":10,"weight":52.5},{"name":"바벨 로우","sets":3,"reps":8,"weight":null}]}</routine>
  · name 은 "▶ 부위별 종목 후보"나 내 기록에 있는 종목 이름을 글자 그대로. 3~6종목.
  · weight 는 "▶ 앱이 계산한 다음 무게"의 kg, 없거나 맨몸이면 null. reps 는 숫자 하나.
  · 블록 안에는 JSON 만. 블록에 대해 설명하지 말고, 운동 루틴을 추천하지 않은 답(식단·일반 질문)에는 붙이지 마.`;

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
