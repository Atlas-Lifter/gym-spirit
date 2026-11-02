// AI 코치 답변 속 <routine>{…}</routine> 블록 읽기와 종목 이름 → 앱 종목 찾기
const norm = (s) => String(s || '').toLowerCase().replace(/[\s()\-·_/]/g, '');

// 화면에 보일 글: 루틴 블록(만들어지는 중인 조각 포함)은 숨긴다
export const visibleText = (text) => String(text || '')
  .replace(/<routine>[\s\S]*?(<\/routine>|$)/g, '')
  .replace(/<(r(o(u(t(i(n(e)?)?)?)?)?)?)?$/, '')
  .replace(/```(json)?\s*```/g, '')
  .trim();

// 이름이 정확히 같으면 그 종목, 아니면 한쪽 이름이 다른 쪽을 포함하는 것 중 길이가 가장 비슷한 종목
export const matchExercise = (name, catalog) => {
  const q = norm(name);
  if (q.length < 2) return null;
  let best = null, gap = Infinity;
  for (const e of catalog) {
    const n = norm(e.name);
    if (n === q) return e;
    if (n.length >= 3 && (n.includes(q) || q.includes(n))) {
      const d = Math.abs(n.length - q.length);
      if (d < gap) { best = e; gap = d; }
    }
  }
  return best;
};

// 루틴 블록 → { title, items: [{ name, sets, reps, weight, exercise|null }] } 또는 null
export const parseRoutine = (text, catalog) => {
  const m = String(text || '').match(/<routine>([\s\S]*?)<\/routine>/);
  if (!m) return null;
  try {
    const raw = JSON.parse(m[1].replace(/```(json)?/g, '').trim());
    const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 10).map(it => ({
      name: String(it.name || ''),
      sets: Math.min(Math.max(parseInt(it.sets, 10) || 3, 1), 8),
      reps: parseInt(it.reps, 10) || null,
      weight: parseFloat(it.weight) > 0 ? parseFloat(it.weight) : null,
      exercise: matchExercise(it.name, catalog),
    })).filter(it => it.name);
    return items.length ? { title: String(raw.title || 'AI 코치 루틴').slice(0, 30), items } : null;
  } catch {
    return null;
  }
};

// 루틴이 없는 답에서 언급된 종목 (자세 보기 버튼용). 긴 이름 먼저, 겹치는 짧은 이름은 뺀다
export const mentionedExercises = (text, catalog, limit = 4) => {
  const t = norm(visibleText(text));
  const hits = catalog.filter(e => norm(e.name).length >= 4 && t.includes(norm(e.name)))
    .sort((a, b) => norm(b.name).length - norm(a.name).length);
  const out = [];
  for (const e of hits) {
    if (!out.some(o => norm(o.name).includes(norm(e.name)))) out.push(e);
    if (out.length >= limit) break;
  }
  return out;
};
