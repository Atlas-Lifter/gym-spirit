// 음식 사진 → 음식 이름과 추정 무게 (Vercel Edge). 이름을 앱 음식·식약처 DB에서 찾는 건 앱이 한다
// 요청: POST { image: 'data:image/jpeg;base64,…' } (앱이 1024px 이하로 줄여 보낸다), 헤더 Authorization: Bearer <Supabase 로그인 토큰>
// 응답: { items: [{ name, grams }], model }
export const config = { runtime: 'edge' };

import { checkAiAccess, jsonError } from '../src/lib/serverAuth.js';

// 무료(체험) 엔드포인트에서 재 본 결과 (2026-11): nemotron-3.5-super-vl 은 생각을 끄면 1~10초에 메뉴 이름으로 정확히 답했다.
// llama-3.2-90b-vision 은 15~40초로 느려 실패했을 때만 쓴다
const MODELS = [
  { id: 'nvidia/nemotron-3.5-super-vl-120b-a12b', timeout: 30000, extra: { chat_template_kwargs: { enable_thinking: false } } },
  { id: 'meta/llama-3.2-90b-vision-instruct', timeout: 45000, extra: {} },
];
const MAX_IMAGE = 3_000_000; // data URL 길이 (약 2.2MB)

const PROMPT = `사진 속 음식을 한국에서 부르는 메뉴 이름으로 찾아 JSON 으로만 답해.
- 비빔밥·김밥·돈가스·라면처럼 완성된 요리는 재료로 나누지 말고 요리 이름 하나로 써.
- 도시락·한상처럼 따로 담긴 반찬·밥·국·음료는 각각 써. 같은 음식은 한 번만.
- 포장 제품이면 보이는 제품 이름(브랜드 포함)을 그대로 써.
- 무게는 사진에 보이는 양 기준 g(음료는 ml) 숫자로 추정해.
- 음식이 없으면 {"items":[]}.
형식: {"items":[{"name":"음식 이름","grams":숫자}]}`;

// 모델 답에서 items 를 꺼낸다 (설명이 섞이거나 items 가 여러 번 나와도)
const parseItems = (text) => {
  const out = [];
  const raw = String(text || '').replace(/```(json)?/g, '');
  try {
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    if (Array.isArray(j.items)) out.push(...j.items);
  } catch {
    for (const m of raw.matchAll(/\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"grams"\s*:\s*([\d.]+)/g)) out.push({ name: m[1], grams: m[2] });
  }
  const seen = new Set();
  return out
    .map(it => ({ name: String(it.name || '').trim().slice(0, 40), grams: Math.min(Math.max(Math.round(parseFloat(it.grams) || 0), 5), 1500) }))
    .filter(it => it.name && !seen.has(it.name) && seen.add(it.name))
    .slice(0, 8);
};

export default async function handler(req) {
  if (req.method !== 'POST') return jsonError(405, 'POST 만 받아요');
  const access = await checkAiAccess(req, '사진 식단 기록');
  if (access.error) return access.error;

  let body;
  try { body = await req.json(); } catch { return jsonError(400, '요청 형식이 잘못됐어요'); }
  const image = String(body.image || '');
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image)) return jsonError(400, '사진 형식이 잘못됐어요');
  if (image.length > MAX_IMAGE) return jsonError(413, '사진이 너무 커요');

  const base = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  for (const model of MODELS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout);
    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { authorization: `Bearer ${access.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: image } }] }],
          max_tokens: 600, temperature: 0.2, ...model.extra,
        }),
      });
      if (r.status === 401 || r.status === 403) return jsonError(502, 'NVIDIA API 키가 맞지 않아요. Vercel 환경변수를 확인해 주세요.');
      if (r.status === 429) return jsonError(429, '잠깐 너무 많이 보냈어요. 1분 뒤에 다시 해 주세요.');
      if (!r.ok) continue;
      const j = await r.json();
      const items = parseItems(j.choices?.[0]?.message?.content);
      return new Response(JSON.stringify({ items, model: model.id }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
    } catch {
      // 시간 초과 등 → 다음 모델
    } finally {
      clearTimeout(timer);
    }
  }
  return jsonError(502, '지금 사진 분석 모델이 바빠요. 잠시 뒤 다시 해 주세요.');
}
