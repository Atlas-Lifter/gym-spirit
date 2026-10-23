// 기구별 중량 기준 (일반 헬스장 기준)
// - 바벨: 20kg 올림픽 봉을 포함한 총중량. 원판은 양쪽에 똑같이 꽂는다.
// - 원판 머신(레그 프레스·핵 스쿼트·스미스 등): 양쪽에 꽂은 원판의 합계 (기구 자체 무게는 제외)
// - 핀·케이블 머신: 기구에 표시된 무게
// - 덤벨: 덤벨 1개의 무게
// - 맨몸: 추가로 단 무게만 입력 (맨몸은 0). 턱걸이·딥스처럼 몸무게를 드는 종목은 볼륨에 체중을 더한다.
// - 어시스트 머신: 도움받는 무게. 실제 부하는 체중에서 뺀 값
// 기록에 저장되는 숫자(set.weight)는 바꾸지 않고, 보여주는 방식과 볼륨 계산만 달라진다.

export const STANDARD_BAR = 20;
// 일반 헬스장에는 25kg 원판이 없어서 한쪽에 꽂는 가장 큰 원판은 20kg
export const GYM_PLATES = [20, 15, 10, 5, 2.5, 1.25];

const PLATE_MACHINES = ['lpd', 's_lpd', 'hack_sq', 'vsq', 'tbar', 'smith_sq', 'sip', 'smith_ohp'];
const ONE_END_BARBELL = ['landmine_p', 'meadows_row'];
const ASSISTED = ['astpu'];
// 맨몸 종목에서 실제로 드는 체중 비율
const BODY_LOAD = { pu: 1, cu: 1, dips: 1, pushup: 0.65, inv_row: 0.5 };

const RULES = {
  barbell: { key: 'barbell', label: 'KG', hint: '봉 20kg 포함 총중량', placeholder: '20', bar: STANDARD_BAR, plates: 'both', step: 2.5 },
  ezbar: { key: 'ezbar', label: 'KG', hint: 'EZ바 10kg 포함 총중량', placeholder: '10', bar: 10, plates: 'both', step: 2.5 },
  landmine: { key: 'landmine', label: 'KG', hint: '한쪽 끝에 꽂은 원판 무게', placeholder: '0', bar: 0, plates: 'one', step: 2.5 },
  plateMachine: { key: 'plateMachine', label: 'KG', hint: '양쪽 원판 합계 (기구 무게 제외)', placeholder: '0', bar: 0, plates: 'both', step: 5 },
  machine: { key: 'machine', label: 'KG', hint: '기구에 표시된 무게', placeholder: '0', step: 5 },
  cable: { key: 'cable', label: 'KG', hint: '케이블 스택에 표시된 무게', placeholder: '0', step: 2.5 },
  dumbbell: { key: 'dumbbell', label: 'KG', hint: '덤벨 1개 무게', placeholder: '0', step: 2 },
  implement: { key: 'implement', label: 'KG', hint: '도구 무게', placeholder: '0', step: 2 },
  bodyweight: { key: 'bodyweight', label: '+KG', hint: '추가 중량 (맨몸은 0)', placeholder: '0', step: 2.5 },
  assist: { key: 'assist', label: '보조KG', hint: '도움받는 무게 (적을수록 어려움)', placeholder: '0', step: -5 },
};

export const weightRule = (id, tool) => {
  const t = String(tool || '');
  if (ASSISTED.includes(id)) return RULES.assist;
  if (PLATE_MACHINES.includes(id)) return RULES.plateMachine;
  if (ONE_END_BARBELL.includes(id)) return RULES.landmine;
  if (id === 'ez_curl') return RULES.ezbar;
  if (t === '바벨') return RULES.barbell;
  if (t === '덤벨') return RULES.dumbbell;
  if (t === '케이블') return RULES.cable;
  if (t === '맨몸') return RULES.bodyweight;
  if (t === '도구') return RULES.implement;
  return RULES.machine;
};

// 원판 계산: 바벨은 봉을 빼고 양쪽에 나눠, 한쪽 끝에만 꽂는 기구는 전부 한쪽에
export const platesFor = (rule, totalWeight) => {
  if (!rule?.plates) return [];
  const w = parseFloat(totalWeight);
  if (!w || w <= (rule.bar || 0)) return [];
  let target = rule.plates === 'both' ? (w - (rule.bar || 0)) / 2 : w - (rule.bar || 0);
  const out = [];
  for (const p of GYM_PLATES) {
    while (target >= p - 1e-9) { out.push(p); target = Math.round((target - p) * 100) / 100; }
  }
  return out;
};

// 볼륨 계산에 쓰는 실제 부하(kg). bodyWeight를 모르면 입력한 무게 그대로
export const setLoad = (id, tool, weight, bodyWeight) => {
  const w = parseFloat(weight) || 0;
  const bw = parseFloat(bodyWeight) || 0;
  const rule = weightRule(id, tool);
  if (rule.key === 'assist') return bw > 0 ? Math.max(0, bw - w) : 0;
  if (rule.key === 'bodyweight' && BODY_LOAD[id] && bw > 0) return Math.round((bw * BODY_LOAD[id] + w) * 10) / 10;
  return w;
};

// 다음 세트·다음 운동 때 올릴 무게 (어시스트는 도움을 줄인다)
export const nextWeight = (rule, weight) => {
  const w = parseFloat(weight) || 0;
  if (rule.step < 0) return String(Math.max(0, w + rule.step));
  return String(Math.round((w > 0 ? w + rule.step : (rule.bar || rule.step)) * 100) / 100);
};
