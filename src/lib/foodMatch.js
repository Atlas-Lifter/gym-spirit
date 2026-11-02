// 사진에서 알아낸 음식 이름 → 앱 음식(FOOD_DB) · 식약처 DB 후보
// 앱 음식(사진·설명이 있는 것)을 먼저, 그다음 식약처 DB의 일반 음식 → 식재료 → 가공식품 순
import { FOOD_DB } from '../data/foods.js';
import { kfoodToFood, searchKfood } from './kfood.js';

const norm = (s) => String(s || '').replace(/\([^)]*\)/g, '').replace(/[\s·,_-]/g, '').toLowerCase();
// 모델이 흔히 쓰는 이름 → 앱 음식 이름
const ALIAS = { 밥: '백미밥', 흰밥: '백미밥', 쌀밥: '백미밥', 공기밥: '백미밥', 흰쌀밥: '백미밥', 돈가스: '돈까스', 볶음김치: '김치볶음' };

const builtinScore = (f, q) => {
  const base = norm(f.name);
  if (base === q) return 100;
  // 앱 음식 이름이 검색어를 품으면(소불고기 ⊃ 불고기) 강하게, 검색어가 더 구체적이면(신라면 ⊃ 라면) 약하게
  if (base.length >= 2 && base.includes(q)) return 85 - (base.length - q.length);
  if (base.length >= 2 && q.includes(base)) return 65 - (q.length - base.length);
  const kws = String(f.kw || '').split(/\s+/).map(norm);
  if (kws.includes(q)) return 60;
  return 0;
};

const SRC_PENALTY = { m: 0, r: 3, p: 6 };

// 식약처 DB 점수: 이름이 같으면 95, 이름이 검색어로 시작하면 85(뒤에 붙은 말이 길수록 낮게), 아니면 검색 순위대로. 브랜드 제품·가공식품은 조금 뒤로
const kfoodScore = (r, q, rank) => {
  const n = norm(r.name);
  const base = n === q ? 95 : n.startsWith(q) ? 85 - 2 * Math.min(n.length - q.length, 8) : 70 - Math.min(rank, 20);
  return base - (r.brand ? 10 : 0) - (SRC_PENALTY[r.src] || 0);
};

// name: 모델이 준 이름, rows: loadKfood() 결과 (없으면 앱 음식만)
export function foodCandidates(name, rows, limit = 5) {
  const raw = norm(name);
  const q = norm(ALIAS[raw] || raw);
  if (!q) return [];
  const scored = FOOD_DB.map(f => [builtinScore(f, q) + 1, f]).filter(([sc]) => sc > 1); // 같은 점수면 앱 음식 먼저
  if (rows) {
    // 식약처 DB 는 '달걀'로 적은 게 많아 '계란'도 같이 찾는다
    const qs = [...new Set([q, q.replace(/계란/g, '달걀')])];
    qs.forEach(qq => searchKfood(rows, qq, 30).forEach((r, i) => scored.push([kfoodScore(r, qq, i), kfoodToFood(r)])));
  }
  scored.sort((a, b) => b[0] - a[0]);
  const out = [];
  const seen = new Set();
  for (const [sc, f] of scored) {
    const key = `${norm(f.name)}|${f.brand || ''}`;
    if (sc < 40 || seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length >= limit) break;
  }
  return out;
}

// 띄어 쓴 낱말이 모두 들어 있는 것 ('제로 사이다' → 칠성사이다제로, 나랑드사이다 제로 …). 짧은 이름 먼저
const wordSearch = (rows, text, limit) => {
  const words = String(text || '').split(/\s+/).map(norm).filter(w => w.length >= 2);
  if (!rows || !words.length) return [];
  return rows.filter(r => words.every(w => r.hay.includes(w)))
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, limit)
    .map(kfoodToFood);
};

// 사진에서 찾은 음식 하나 → 후보. 이름으로 먼저 찾고, 모자라면 음식 종류·낱말로 '비슷한 음식'을 채운다
// item: { name, type, brand }. 결과: [{ ...food, approx }] — approx 는 이름이 아니라 종류로 찾은 것
export function photoCandidates(item, rows, limit = 6) {
  const hasHangul = (s) => /[가-힣]/.test(s || '');
  const out = [];
  const seen = new Set();
  const add = (list, approx) => list.forEach(f => {
    const key = `${norm(f.name)}|${f.brand || ''}`;
    if (out.length < limit && !seen.has(key)) { seen.add(key); out.push({ ...f, approx }); }
  });
  if (hasHangul(item.name)) {
    add(foodCandidates(item.name, rows, limit), false);
    if (out.length < 2) add(wordSearch(rows, item.name, limit), false);
  }
  if (out.length < limit && item.type) {
    if (item.brand) add(wordSearch(rows, `${item.brand} ${item.type}`, 2), true);
    add(wordSearch(rows, item.type, limit), true);
    add(foodCandidates(item.type, rows, limit), true);
    // 그래도 없으면 종류의 마지막 낱말만 ('제로 사이다' → '사이다')
    const last = item.type.trim().split(/\s+/).pop();
    if (!out.length && last && last !== item.type) add(foodCandidates(last, rows, limit), true);
  }
  return out;
}
