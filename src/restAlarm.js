// 휴식 타이머 알람: 소리는 모두 Web Audio로 직접 합성하고(외부 음원 없음), 멘트는 기기의 음성 합성(TTS)으로 읽는다.
// 아이폰 사파리는 사용자가 화면을 누른 순간에만 소리를 켤 수 있어서, 세트 완료·타이머 버튼을 누를 때 unlockAudio()로 미리 깨워 둔다.

export const DEFAULT_TIMER_SETTINGS = { sound: 'bell', repeat: 3, volume: 0.8, vibrate: true, countdown: true, defaultRest: 90 };

export const ALARM_SOUNDS = [
  { id: 'bell', emoji: '🥊', label: '복싱 벨', desc: '라운드 시작처럼 땡땡땡' },
  { id: 'beep', emoji: '⏰', label: '클래식 비프', desc: '삐삐삐 세 번' },
  { id: 'whistle', emoji: '📣', label: '코치 호루라기', desc: '삑- 삑- 삐익' },
  { id: 'rise', emoji: '⚡', label: '파워 업', desc: '올라가는 화음' },
  { id: 'coach', emoji: '🗣️', label: '코치 음성', desc: '"휴식 끝! 다음 세트 갑니다"', voice: true },
  { id: 'legend', emoji: '👑', label: '레전드 명대사', desc: '"Yeah buddy! Light weight, baby!"', voice: true },
];

export const REPEAT_OPTIONS = [
  { value: 1, label: '짧게', desc: '1번' },
  { value: 3, label: '보통', desc: '3번' },
  { value: 6, label: '길게', desc: '6번' },
  { value: 0, label: '끌 때까지', desc: '최대 30초' },
];

export const REST_OPTIONS = [60, 90, 120, 180];

// 기기 음성으로 읽는 멘트 (실제 인물의 녹음이 아니다)
const COACH_LINES = ['휴식 끝! 다음 세트 갑니다!', '자, 다시 바 앞으로! 할 수 있어요!', '쉬는 시간 끝! 지금이 성장하는 순간이에요!', '좋아요, 한 세트 더 갑시다!'];
const LEGEND_LINES = ['Yeah buddy! Light weight, baby!', "Ain't nothing but a peanut!"]; // 로니 콜먼의 유명한 구호

let ctx = null;
const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

let speechUnlocked = false;
export const unlockAudio = () => {
  const c = getCtx();
  if (c) {
    const o = c.createOscillator(), g = c.createGain();
    g.gain.value = 0;
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.02);
  }
  try {
    if (!speechUnlocked && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
      speechUnlocked = true;
    }
  } catch (e) {}
};

const tone = (c, out, t0, { f, dur, type = 'sine', vol = 1, f2 }) => {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(out);
  o.start(t0); o.stop(t0 + dur + 0.05);
};

// 금속 종: 배음이 정수배가 아니어서 '땡' 하는 쇳소리가 난다
const bellStrike = (c, out, t0) => [[1, 1, 1.6], [2.76, 0.5, 1.1], [5.4, 0.28, 0.7], [8.93, 0.16, 0.45]]
  .forEach(([k, v, d]) => tone(c, out, t0, { f: 620 * k, dur: d, vol: v * 0.5 }));

// 한 번 울리는 패턴. 반환값은 그 패턴의 길이(초)
const CYCLES = {
  bell: (c, out, t) => { [0, 0.32, 0.64].forEach(d => bellStrike(c, out, t + d)); return 2.0; },
  beep: (c, out, t) => { [0, 0.28, 0.56].forEach(d => tone(c, out, t + d, { f: 880, dur: 0.18, type: 'square', vol: 0.32 })); return 1.2; },
  whistle: (c, out, t) => {
    [[0, 0.22], [0.32, 0.22], [0.64, 0.6]].forEach(([d, len]) => {
      tone(c, out, t + d, { f: 2650, dur: len, type: 'triangle', vol: 0.45 });
      tone(c, out, t + d, { f: 2790, dur: len, type: 'triangle', vol: 0.3 }); // 두 음이 맞부딪혀 호루라기 떨림
    });
    return 1.6;
  },
  rise: (c, out, t) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(c, out, t + i * 0.11, { f, dur: 0.22, type: 'triangle', vol: 0.5 }));
    [523, 659, 784, 1047].forEach(f => tone(c, out, t + 0.5, { f, dur: 0.7, type: 'triangle', vol: 0.22 }));
    return 1.4;
  },
};

const pickVoice = (lang) => {
  try {
    const vs = window.speechSynthesis.getVoices();
    return vs.find(v => v.lang === lang) || vs.find(v => v.lang && v.lang.startsWith(lang.slice(0, 2))) || null;
  } catch (e) { return null; }
};

const speak = (text, lang, volume) => new Promise(resolve => {
  try {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.volume = Math.min(1, volume); u.rate = lang === 'ko-KR' ? 1.05 : 0.95; u.pitch = lang === 'ko-KR' ? 1 : 0.8;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.onend = resolve; u.onerror = resolve;
    window.speechSynthesis.speak(u);
    setTimeout(resolve, 6000);
  } catch (e) { resolve(); }
});

// 남은 3·2·1초 카운트다운 틱
export const playTick = (volume = 0.8, last = false) => {
  const c = getCtx();
  if (!c) return;
  const out = c.createGain(); out.gain.value = volume; out.connect(c.destination);
  tone(c, out, c.currentTime, { f: last ? 1320 : 990, dur: 0.12, type: 'sine', vol: 0.55 });
};

// 알람 재생. 멈추는 함수를 돌려준다. onEnd는 끝까지 울렸을 때 한 번 불린다.
export const playAlarm = (settings = {}, onEnd) => {
  const s = { ...DEFAULT_TIMER_SETTINGS, ...settings };
  let stopped = false;
  const timers = [];
  const c = getCtx();
  const out = c ? c.createGain() : null;
  if (out) { out.gain.value = s.volume; out.connect(c.destination); }
  const sound = ALARM_SOUNDS.find(x => x.id === s.sound) || ALARM_SOUNDS[0];
  const loopForever = !s.repeat;
  const maxMs = loopForever ? 30000 : Infinity;
  const startedAt = Date.now();
  let count = 0;

  const finish = () => { if (!stopped) { stopped = true; try { out?.disconnect(); } catch (e) {} onEnd?.(); } };
  const next = async () => {
    if (stopped) return;
    if ((!loopForever && count >= s.repeat) || Date.now() - startedAt > maxMs) return finish();
    count++;
    if (s.vibrate && navigator.vibrate) navigator.vibrate([300, 120, 300]);
    if (sound.voice) {
      // 음성 멘트는 짧은 벨로 주의를 끈 뒤 읽는다
      if (c) CYCLES.bell(c, out, c.currentTime);
      await new Promise(r => timers.push(setTimeout(r, 650)));
      if (stopped) return;
      const lines = sound.id === 'legend' ? LEGEND_LINES : COACH_LINES;
      await speak(lines[(count - 1) % lines.length], sound.id === 'legend' ? 'en-US' : 'ko-KR', s.volume);
      timers.push(setTimeout(next, 400));
    } else {
      const len = c ? CYCLES[sound.id](c, out, c.currentTime + 0.02) : 1;
      timers.push(setTimeout(next, len * 1000));
    }
  };
  next();
  return () => {
    timers.forEach(clearTimeout);
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    try { navigator.vibrate?.(0); } catch (e) {}
    finish();
  };
};
