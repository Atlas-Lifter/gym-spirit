// 음식 사진 → 음식 이름과 추정 무게 (Vercel Edge). 이름을 앱 음식·식약처 DB에서 찾는 건 앱이 한다
// 요청: POST { image: 'data:image/jpeg;base64,…' } (앱이 1024px 이하로 줄여 보낸다), 헤더 Authorization: Bearer <Supabase 로그인 토큰>
// 응답: { items: [{ name, type, brand, grams }], model } 또는 { error } — type 은 못 찾을 때 비슷한 음식을 고르는 데 쓴다
// Edge 는 25초 안에 응답을 시작해야 해서, 바로 응답을 열고 기다리는 동안 공백을 흘린 뒤 마지막에 JSON 을 보낸다 (JSON 앞 공백은 문제없다)
export const config = { runtime: 'edge' };

import { checkAiAccess, jsonError } from '../src/lib/serverAuth.js';

// 무료(체험) 엔드포인트에서 재 본 결과 (2026-11): nemotron-3.5-super-vl 은 생각을 끄면 보통 1초 안팎에 정확히 답하지만
// 가끔 서버가 밀려 멈춘다 → 한 번 더 물어보고, 그래도 안 되면 느린 llama-3.2-90b-vision 으로
const NEMOTRON = { id: 'nvidia/nemotron-3.5-super-vl-120b-a12b', timeout: 15000, extra: { chat_template_kwargs: { enable_thinking: false } } };
const MODELS = [NEMOTRON, NEMOTRON, { id: 'meta/llama-3.2-90b-vision-instruct', timeout: 45000, extra: {} }];
const MAX_IMAGE = 3_000_000; // data URL 길이 (약 2.2MB)

const PROMPT = `사진 속 음식을 찾아 JSON 으로만 답해. 모든 값은 한국어로.
- name: 한국에서 부르는 이름. 포장 제품은 포장에 적힌 한글 제품명을 그대로 (영어 로고보다 한글 우선, 한글이 없으면 한국에서 쓰는 한글 표기로 바꿔서).
- type: 일반적인 음식 종류 (예: "제로 사이다", "컵라면", "닭가슴살", "김밥", "그릭요거트", "제육볶음"). 제로·저당·무가당이면 꼭 넣어.
- brand: 보이는 브랜드·회사 이름 (모르면 "").
- 비빔밥·김밥·돈가스·라면처럼 완성된 요리는 재료로 나누지 말고 하나로. 도시락·한상은 반찬·밥·국·음료를 각각. 같은 음식은 한 번만.
- grams: 사진에 보이는 양 기준 g(음료는 ml) 숫자. 포장 제품이면 포장에 적힌 용량.
- 음식이 없으면 {"items":[]}.
형식: {"items":[{"name":"나랑드사이다 제로","type":"제로 사이다","brand":"동아오츠카","grams":1250}]}`;

// 모델 답에서 items 를 꺼낸다 (설명이 섞이거나 items 가 여러 번 나와도)
const parseItems = (text) => {
  const out = [];
  const raw = String(text || '').replace(/```(json)?/g, '');
  try {
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    if (Array.isArray(j.items)) out.push(...j.items);
  } catch {
    for (const m of raw.matchAll(/\{[^{}]*?"name"\s*:\s*"([^"]+)"[^{}]*?\}/g)) {
      const pick = (k) => (m[0].match(new RegExp(`"${k}"\\s*:\\s*"?([^",}]*)`)) || [])[1];
      out.push({ name: m[1], type: pick('type'), brand: pick('brand'), grams: pick('grams') });
    }
  }
  const seen = new Set();
  return out
    .map(it => ({
      name: String(it.name || '').trim().slice(0, 40),
      type: String(it.type || '').trim().slice(0, 30),
      brand: String(it.brand || '').trim().slice(0, 30),
      grams: Math.min(Math.max(Math.round(parseFloat(it.grams) || 0), 5), 2000),
    }))
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
          messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: image } }] }],
          max_tokens: 600, temperature: 0.2, ...model.extra,
        }),
      });
      if (r.status === 401 || r.status === 403) return { error: 'NVIDIA API 키가 맞지 않아요. Vercel 환경변수를 확인해 주세요.' };
      if (r.status === 429) return { error: '잠깐 너무 많이 보냈어요. 1분 뒤에 다시 해 주세요.' };
      if (!r.ok) return null;
      const j = await r.json();
      return { items: parseItems(j.choices?.[0]?.message?.content), model: model.id };
    } catch {
      return null; // 시간 초과 등 → 다음 모델
    } finally {
      clearTimeout(timer);
    }
  };

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const keepAlive = setInterval(() => ctrl.enqueue(enc.encode(' ')), 5000);
      let result = null;
      for (const model of MODELS) {
        result = await ask(model);
        if (result) break;
      }
      clearInterval(keepAlive);
      ctrl.enqueue(enc.encode(JSON.stringify(result || { error: '지금 사진 분석 모델이 바빠요. 잠시 뒤 다시 해 주세요.' })));
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
