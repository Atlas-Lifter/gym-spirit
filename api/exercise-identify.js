// 운동 영상의 장면 몇 장 → 앱 종목 목록 중 어떤 운동인지, 또는 (mode: 'equipment') 운동 기구 사진 → 어떤 기구이고 그 기구로 하는 종목 (Vercel Edge)
// 요청: POST { frames: ['data:image/jpeg;base64,…' ×1~5], choices: 'id:이름' 줄 목록(앱이 움직임으로 좁힌 것), hint: 휴대폰이 잰 움직임, mode }, 헤더 Authorization: Bearer <Supabase 로그인 토큰>
// 응답: { candidates: [{ id, confidence }], equipment?, agree?, model } 또는 { error }
// Edge 는 25초 안에 응답을 시작해야 해서, 바로 응답을 열고 기다리는 동안 공백을 흘린 뒤 마지막에 JSON 을 보낸다
export const config = { runtime: 'edge' };

import { checkAiAccess, jsonError } from '../src/lib/serverAuth.js';

const NEMOTRON = { id: 'nvidia/nemotron-3.5-super-vl-120b-a12b', timeout: 15000, extra: { chat_template_kwargs: { enable_thinking: false } } };
const MODELS = [NEMOTRON, NEMOTRON, { id: 'meta/llama-3.2-90b-vision-instruct', timeout: 45000, extra: {} }];
// 기구 사진은 생각을 켜면 더 정확하지만(약 10초) 가끔 답을 못 낸다 → 생각 끈 것과 동시에 묻고 합친다 (2026-11 테스트)
const NEMOTRON_THINK = { id: 'nvidia/nemotron-3.5-super-vl-120b-a12b', timeout: 22000, extra: { max_tokens: 3000 } };
const MAX_FRAME = 700_000;

// 사진만으로는 팔 운동(컬·프레스·푸시다운)을 자주 헷갈려서, 휴대폰이 잰 관절 움직임을 같이 준다
const prompt = (choices, hint) => `사진들은 한 사람이 웨이트 운동 한 세트를 하는 영상에서 순서대로 뽑은 장면이야.
${hint ? `휴대폰이 잰 움직임: ${hint}\n가장 많이 움직인 관절이 이 운동의 주된 동작이야.\n` : ''}아래 [종목 목록]에서 이 사람이 하는 운동과 가장 맞는 것을 최대 3개 골라 JSON 으로만 답해.
- 사진의 기구(바벨·덤벨·머신·케이블·맨몸)와 자세(서서·앉아서·누워서·엎드려서), 움직임을 같이 보고 골라.
- id 는 목록에 있는 것만. confidence 는 0~1.
- 운동 장면이 아니면 {"candidates":[]}.
형식: {"candidates":[{"id":"sq","confidence":0.8}]}

[종목 목록]
${choices}`;

// 기구 사진: 무슨 기구인지 + 그 기구로 하는 종목
const equipmentPrompt = (choices) => `사진은 헬스장의 운동 기구야 (사람이 같이 찍혀 있을 수도 있어).
먼저 look 에 기구 생김새를 짧게 적어: 의자·등받이·누운 벤치 유무, 손잡이 위치(머리 위·가슴 앞·옆), 다리를 거는 패드, 발판, 케이블·도르래, 바벨 거치대, 기구에 붙은 이름표·그림.
그다음 그 생김새에 맞는 기구 이름(equipment, 한국 헬스장에서 부르는 이름)과,
아래 [종목 목록]에서 이 기구로 하는 운동을 많이 하는 순서로 최대 5개(candidates)를 골라. 이름표·그림 설명이 보이면 그걸 가장 우선해.
- id 는 목록에 있는 것만. confidence 는 0~1.
- 운동 기구가 아니면 equipment 는 "" 이고 candidates 는 [].
JSON 으로만: {"look":"…","equipment":"…","candidates":[{"id":"…","confidence":0.9}]}

[종목 목록]
${choices}`;

const parse = (text, ids, max) => {
  const raw = String(text || '').replace(/```(json)?/g, '');
  let list = [], equipment = '';
  try {
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    list = j.candidates || [];
    equipment = String(j.equipment || '').slice(0, 40);
  } catch {
    list = [...raw.matchAll(/"id"\s*:\s*"([^"]+)"/g)].map(m => ({ id: m[1] }));
  }
  const seen = new Set();
  return {
    equipment,
    candidates: list
      .map(c => ({ id: String(c.id || '').trim(), confidence: Math.min(Math.max(parseFloat(c.confidence) || 0.5, 0), 1) }))
      .filter(c => ids.has(c.id) && !seen.has(c.id) && seen.add(c.id))
      .slice(0, max),
  };
};

export default async function handler(req) {
  if (req.method !== 'POST') return jsonError(405, 'POST 만 받아요');
  const access = await checkAiAccess(req, '운동 인식');
  if (access.error) return access.error;

  let body;
  try { body = await req.json(); } catch { return jsonError(400, '요청 형식이 잘못됐어요'); }
  const frames = (Array.isArray(body.frames) ? body.frames : []).filter(f => /^data:image\/(jpeg|png|webp);base64,/.test(f) && f.length < MAX_FRAME).slice(0, 5);
  const choices = String(body.choices || '').slice(0, 12000);
  const hint = String(body.hint || '').slice(0, 400);
  const equipmentMode = body.mode === 'equipment';
  const ids = new Set(choices.split('\n').map(l => l.split(':')[0].trim()).filter(Boolean));
  if (!frames.length || !ids.size) return jsonError(400, '장면이나 종목 목록이 없어요');

  const base = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const ask = async (model) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout);
    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { authorization: `Bearer ${access.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'user', content: [{ type: 'text', text: equipmentMode ? equipmentPrompt(choices) : prompt(choices, hint) }, ...frames.map(url => ({ type: 'image_url', image_url: { url } }))] }],
          max_tokens: equipmentMode ? 600 : 300, temperature: 0.1, ...model.extra,
        }),
      });
      if (r.status === 401 || r.status === 403) return { error: 'NVIDIA API 키가 맞지 않아요. Vercel 환경변수를 확인해 주세요.' };
      if (r.status === 429) return { error: '잠깐 너무 많이 보냈어요. 1분 뒤에 다시 해 주세요.' };
      if (!r.ok) return null;
      const j = await r.json();
      return { ...parse(j.choices?.[0]?.message?.content, ids, equipmentMode ? 5 : 3), model: model.id };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const keepAlive = setInterval(() => ctrl.enqueue(enc.encode(' ')), 5000);
      let result = null;
      if (equipmentMode) {
        // 두 답이 같은 운동을 1순위로 꼽으면 agree (앱이 바로 설명서를 연다)
        const [fast, think] = await Promise.all([ask(NEMOTRON), ask(NEMOTRON_THINK)]);
        const good = [think, fast].filter(r => r && !r.error && r.candidates);
        if (good.length) {
          const seen = new Set();
          result = {
            equipment: good.find(r => r.equipment)?.equipment || '',
            candidates: good.flatMap(r => r.candidates).filter(c => !seen.has(c.id) && seen.add(c.id)).slice(0, 5),
            agree: good.length === 2 && !!think.candidates[0] && think.candidates[0].id === fast.candidates[0]?.id,
            model: NEMOTRON.id,
          };
        } else result = fast || think;
      }
      for (const model of equipmentMode ? [] : MODELS) {
        result = await ask(model);
        if (result) break;
      }
      clearInterval(keepAlive);
      ctrl.enqueue(enc.encode(JSON.stringify(result || { error: '지금 운동 인식 모델이 바빠요. 잠시 뒤 다시 해 주세요.' })));
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
