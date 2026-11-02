// 영상 장면 → 어떤 종목인지 알아내기
// 1) 휴대폰(MediaPipe)이 잰 관절 움직임으로 그럴듯한 부위를 좁히고 2) 장면 사진 + 움직임 + 좁힌 종목 목록을 AI(/api/exercise-identify)에 보낸다
// 사진만 보내면 컬을 프레스로, 푸시다운을 크로스오버로 헷갈렸는데 움직임을 같이 주면 크게 나아졌다 (2026-11 테스트)
import { supabase } from '../cloud.js';
import { EXERCISE_OPTIONS } from '../data/catalog.js';

const range = (vals) => (vals.length > 1 ? Math.max(...vals) - Math.min(...vals) : 0);
const pick = (samples, f) => samples.map(s => f(s.m)).filter(v => v != null && isFinite(v) && v < 999);

// samples: [{ m: measure() 결과, handsAbove, wristUp }] — wristUp: 손목이 팔꿈치보다 위 (컬처럼 팔을 굽혀 올림)
export function motionFeatures(samples) {
  const s = samples.filter(x => x.m);
  const knees = pick(s, m => Math.min(m.knee ?? 999, m.kneeOther ?? 999));
  return {
    elbow: Math.round(range(pick(s, m => m.elbowMin))),
    shoulder: Math.round(range(pick(s, m => m.shoulder))),
    knee: Math.round(range(knees)),
    hip: Math.round(range(pick(s, m => m.hip))),
    trunk: Math.round(pick(s, m => m.trunk).reduce((a, b) => a + b, 0) / (s.length || 1)),
    kneeAvg: Math.round(knees.reduce((a, b) => a + b, 0) / (knees.length || 1)),
    handsAbove: samples.some(x => x.handsAbove),
    wristUp: samples.some(x => x.wristUp),
    seen: s.length,
  };
}

// 움직임으로 그럴듯한 부위 (앱 종목의 target 앞부분과 같은 이름)
export function likelyGroups(f) {
  const g = new Set();
  const lying = f.trunk > 60, arms = f.elbow >= 50, shoulderBig = f.shoulder >= 50, legs = f.knee >= 40;
  if (lying) {
    g.add('가슴');
    if (arms && f.shoulder < 45) g.add('팔');
    if (legs || f.hip >= 40) g.add('복근');
  } else {
    if (arms && !shoulderBig && !legs && f.hip < 30) g.add('팔');
    if (arms && (shoulderBig || f.hip >= 30 || f.trunk > 25)) g.add('등');
    if (arms && shoulderBig && f.handsAbove) g.add('어깨');
    if (!arms && f.shoulder >= 45 && !legs && f.hip < 40) g.add('어깨');
    if ((legs || f.hip >= 40) && !arms) { g.add('하체'); g.add('등'); } // 스쿼트·런지 / 데드리프트류(앱에서 '등'으로 분류된 것도 있음)
  }
  return [...g];
}

export const hintText = (f) => {
  const joints = [['팔꿈치', f.elbow], ['어깨', f.shoulder], ['무릎', f.knee], ['엉덩이', f.hip]].sort((a, b) => b[1] - a[1]);
  const pose = f.trunk > 60 ? '누워 있거나 엎드림' : f.trunk > 25 ? '상체를 숙임' : '상체를 세움';
  const seated = f.kneeAvg < 130 && f.knee < 30;
  const arm = f.elbow >= 50 ? ` · 손이 팔꿈치보다 위로 올라옴: ${f.wristUp ? '예(컬처럼 굽혀 올림)' : '아니오(푸시다운·익스텐션처럼 아래로 폄)'}` : '';
  return `각도 변화 ${joints.map(([n, v]) => `${n} ${v}°`).join(', ')} · 가장 많이 움직인 관절 ${joints[0][0]} · 자세: ${pose}${seated ? ', 앉아 있음' : ''} · 손이 머리 위로: ${f.handsAbove ? '예' : '아니오'}${arm}`;
};

// frames: data URL 2~5장, samples: 움직임. 결과: [{ exercise, confidence }]
export async function identifyExercise(frames, samples) {
  const f = motionFeatures(samples);
  const groups = f.seen >= 2 ? likelyGroups(f) : [];
  let list = EXERCISE_OPTIONS.filter(e => !groups.length || groups.includes(String(e.target).split('(')[0]));
  // 팔만 움직이면: 손이 팔꿈치 위로 올라오면 이두(컬)·전완, 아니면 삼두(푸시다운·익스텐션) — AI 가 굽힘/폄을 자주 헷갈린다
  if (groups.length === 1 && groups[0] === '팔') {
    const arm = list.filter(e => (f.wristUp ? /이두|전완/ : /삼두/).test(e.target));
    if (arm.length) list = arm;
  }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch('/api/exercise-identify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ frames, choices: list.map(e => `${e.id}:${e.name}(${e.tool})`).join('\n'), hint: f.seen >= 2 ? hintText(f) : '' }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error || `운동 인식에 실패했어요 (${res.status})`);
  return (j.candidates || []).map(c => ({ exercise: EXERCISE_OPTIONS.find(e => e.id === c.id), confidence: c.confidence })).filter(c => c.exercise);
}
