// 식약처·농진청 식품영양성분 DB (public/data/kfood.json, .tools/kfood_build.py 로 만듦)
// 6.6MB(압축 시 약 1.3MB)라 둘러보기·사진 기록을 처음 쓸 때 한 번만 불러온다
export const KFOOD_SOURCE = '식품의약품안전처 식품영양성분 DB · 농촌진흥청 국가표준식품성분표';

let cache = null;
export const loadKfood = () => {
  if (!cache) {
    cache = fetch('/data/kfood.json')
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(d => d.rows.map(([name, brand, cat, kcal, protein, carbs, fat, unit, serving, src, grp, sub]) => ({
        name, brand, cat, kcal, protein, carbs, fat, unit, serving, src, grp, sub, hay: `${name} ${brand} ${cat} ${sub}`.replace(/\s+/g, ''),
      })))
      .catch(e => { cache = null; throw e; });
  }
  return cache;
};

// 띄어쓰기 무시. 이름이 검색어로 시작 → 이름에 포함 → 브랜드·분류에 포함 순, 같으면 짧은 이름 먼저
export const searchKfood = (rows, query, limit = 40) => {
  const q = String(query || '').replace(/\s+/g, '');
  if (!q) return [];
  const hits = [];
  for (const r of rows) {
    if (!r.hay.includes(q)) continue;
    const n = r.name.replace(/\s+/g, '');
    hits.push([n.startsWith(q) ? 0 : n.includes(q) ? 1 : 2, r.src === 'r' ? 0 : 1, n.length, r]);
  }
  hits.sort((a, b) => a[0] - b[0] || a[2] - b[2] || a[1] - b[1]);
  return hits.slice(0, limit).map(h => h[3]);
};

const ICONS = [
  [/피자/, '🍕'], [/버거|햄버거/, '🍔'], [/커피|아메리카노|라떼|에스프레소|카푸치노/, '☕'], [/차$|티$|버블티|밀크티/, '🍵'],
  [/스무디|에이드|주스|음료|요구르트|우유/, '🥤'], [/케이크|타르트|카스텔라/, '🍰'], [/아이스크림|빙수/, '🍨'], [/도넛/, '🍩'],
  [/빵|베이글|크로와상|토스트|바게트|번|머핀|스콘|와플|크로플|페이스트리|프레즐/, '🥐'], [/쿠키|비스킷|크래커|마카롱/, '🍪'],
  [/샌드위치|핫도그/, '🥪'], [/샐러드/, '🥗'], [/닭|치킨/, '🍗'], [/소고기|돼지|고기|갈비|불고기|삼겹|제육|족발|보쌈/, '🥩'],
  [/생선|고등어|연어|참치|꽁치|오징어|새우|게|조개|굴|낙지|문어/, '🐟'], [/찌개|국$|탕$|전골|스프/, '🍲'], [/면|국수|라면|스파게티|파스타|우동|냉면/, '🍜'],
  [/밥|비빔|덮밥|김밥|쌀|죽/, '🍚'], [/떡/, '🍡'], [/달걀|계란/, '🥚'], [/두부|콩/, '🫘'], [/김치/, '🥬'],
  [/사과|배|포도|귤|딸기|바나나|감|복숭아|수박|참외|과일/, '🍎'], [/감자|고구마|옥수수|호박/, '🥔'], [/버섯/, '🍄'],
  [/채소|배추|양배추|시금치|상추|오이|당근|무|가지|나물|순/, '🥦'],
];
export const iconOf = (r) => (ICONS.find(([re]) => re.test(r.cat) || re.test(r.name)) || [null, '🍽️'])[1];

// 검색 결과 → 식단 화면이 쓰는 음식 모양 (탄수화물·지방이 없는 자료는 0 으로 계산하되 noMacros 로 표시)
export const kfoodToFood = (r) => ({
  id: `k:${r.name}|${r.brand}|${r.unit}`,
  name: r.name,
  brand: r.brand,
  category: r.src === 'p' ? r.sub : r.cat || (r.src === 'r' ? '식재료' : '음식'),
  icon: iconOf(r),
  calories: r.kcal,
  protein: r.protein,
  carbs: r.carbs ?? 0,
  fat: r.fat ?? 0,
  noMacros: r.carbs == null || r.fat == null,
  per: 100,
  unit: r.unit,
  serv: r.serving ? [{ l: r.src === 'p' ? '1포장' : '1회 제공량', g: r.serving }] : [],
  note: `${r.brand ? `${r.brand} ${r.src === 'p' ? '제품' : '메뉴'} · ` : ''}${r.src === 'r' ? '농촌진흥청 국가표준식품성분표' : r.src === 'p' ? '식품의약품안전처 가공식품 영양성분 DB' : '식품의약품안전처 식품영양성분 DB'} 자료예요.${r.carbs == null || r.fat == null ? ' 이 메뉴는 업체가 탄수화물·지방을 공개하지 않아 칼로리·단백질만 정확해요.' : ''}`,
  bgColor: 'bg-neutral-100',
  txColor: 'text-neutral-500',
  kfood: true,
});
