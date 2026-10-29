// 오운완 카드를 실제 이미지(PNG)로 그리고, 휴대폰 사진첩에 저장하거나 공유한다.
// 화면의 카드와 같은 모양을 캔버스에 직접 그린다 (아바타는 화면에 있는 SVG를 그대로 옮겨 그림)

const W = 1080, H = 1680;

const THEMES = {
  neon: { bg: ['#0a0a0a'], glow: 'rgba(16,185,129,0.28)', text: '#ffffff', accent: '#34d399', box: 'rgba(23,23,23,0.7)', boxLine: 'rgba(255,255,255,0.1)', chip: 'rgba(255,255,255,0.1)', chipLine: 'rgba(255,255,255,0.1)', chipText: '#e5e5e5', bubble: 'rgba(16,185,129,0.16)', onAccent: '#052e16' },
  clean: { bg: ['#ffffff'], glow: 'rgba(59,130,246,0.12)', text: '#171717', accent: '#2563eb', box: '#fafafa', boxLine: '#e5e5e5', chip: '#f5f5f5', chipLine: '#e5e5e5', chipText: '#404040', bubble: 'rgba(37,99,235,0.08)', onAccent: '#ffffff' },
  cyber: { bg: ['#0a0a0a', '#3b0764', '#171717'], glow: 'rgba(168,85,247,0.35)', text: '#ffffff', accent: '#c084fc', box: 'rgba(23,23,23,0.6)', boxLine: 'rgba(255,255,255,0.1)', chip: 'rgba(255,255,255,0.1)', chipLine: 'rgba(255,255,255,0.1)', chipText: '#e5e5e5', bubble: 'rgba(168,85,247,0.2)', onAccent: '#1e0638' },
};

// 카드 안 아바타 자리와, 말풍선이 피해 가는 몸통 영역(타원)
const AV = { top: 350, h: 860 };
const BODY = { x: W / 2, y: 780, rx: 150, ry: 420 };
// 알통 포즈로 들어 올린 두 팔과 머리 자리
const ARMS = { x0: W / 2 - 215, x1: W / 2 + 215, y0: 350, y1: 680 };
const AREA = { x0: 34, x1: W - 34, y0: 320, y1: 1276 };
const R_MAX = 158, R_MIN = 66, GAP = 14;

// 이름을 원 안에 들어가게 최대 2줄로 나눈다
const wrapName = (ctx, name, maxW) => {
  const words = name.split(/\s+/);
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !cur) cur = next; else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  // 한 단어가 너무 길면 글자 단위로 자른다
  const out = [];
  lines.forEach(l => {
    let rest = l;
    while (ctx.measureText(rest).width > maxW && rest.length > 2) {
      let k = rest.length - 1;
      while (k > 1 && ctx.measureText(rest.slice(0, k)).width > maxW) k--;
      out.push(rest.slice(0, k)); rest = rest.slice(k);
    }
    out.push(rest);
  });
  if (out.length > 2) { let l2 = out[1]; while (ctx.measureText(l2 + '…').width > maxW && l2.length > 1) l2 = l2.slice(0, -1); return [out[0], l2 + '…']; }
  return out;
};

// 세트 수에 비례한 넓이의 원을, 아바타 몸통과 다른 원을 피해 아바타 가까이 좌우 번갈아 놓는다.
// 다 안 들어가면 전체 크기를 조금씩 줄여 다시 놓는다
export const layoutBubbles = (ctx, items, font) => {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => b.sets - a.sets);
  const maxSets = sorted[0].sets;
  // 종목이 많으면 처음부터 조금 작게 (원 9개 넘으면 나머지는 하나로 묶는다)
  const shown = sorted.length > 9 ? [...sorted.slice(0, 8), { name: `외 ${sorted.length - 8}종목`, sets: sorted.slice(8).reduce((a, b) => a + b.sets, 0), more: true }] : sorted;
  let scale = Math.min(1, Math.sqrt(5 / Math.max(5, shown.length)) * 1.08);
  for (let attempt = 0; attempt < 14; attempt++, scale *= 0.92) {
    const placed = [];
    let side = { L: 0, R: 0 };
    let ok = true;
    for (let k = 0; k < shown.length; k++) {
      const it = shown[k];
      const r = Math.max(R_MIN * Math.min(1, scale + 0.15), R_MAX * scale * Math.sqrt(Math.min(1, it.sets / maxSets)));
      let best = null;
      for (let y = AREA.y0 + r; y <= AREA.y1 - r; y += 12) {
        for (let x = AREA.x0 + r; x <= AREA.x1 - r; x += 12) {
          const ex = (x - BODY.x) / (BODY.rx + r + GAP), ey = (y - BODY.y) / (BODY.ry + r * 0.4);
          if (ex * ex + ey * ey < 1) continue;
          const nx = Math.max(ARMS.x0, Math.min(x, ARMS.x1)), ny = Math.max(ARMS.y0, Math.min(y, ARMS.y1));
          if (Math.hypot(x - nx, y - ny) < r + GAP) continue;
          if (placed.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r + GAP)) continue;
          const s = x < BODY.x ? 'L' : 'R';
          const score = Math.abs(x - BODY.x) + Math.abs(y - (BODY.y - 40)) * 0.45 + (side[s] - side[s === 'L' ? 'R' : 'L']) * 150;
          if (!best || score < best.score) best = { x, y, score, s };
        }
      }
      if (!best) { ok = false; break; }
      side[best.s]++;
      placed.push({ ...it, x: best.x, y: best.y, r, top: k === 0 && !it.more && shown.length > 1 });
    }
    if (ok) return placed;
  }
  return [];
};

const drawBubble = (ctx, b, t, font) => {
  const strong = b.top;
  ctx.save();
  // 원
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  if (strong) { ctx.shadowColor = t.accent; ctx.shadowBlur = 40; ctx.fillStyle = t.accent; ctx.fill(); ctx.shadowBlur = 0; }
  else {
    ctx.fillStyle = t.bubble; ctx.fill();
    ctx.globalAlpha = 0.85; ctx.lineWidth = 4; ctx.strokeStyle = t.accent; ctx.stroke(); ctx.globalAlpha = 1;
  }
  // 말풍선 꼬리 (아바타 쪽)
  const ang = Math.atan2(BODY.y - 60 - b.y, BODY.x - b.x);
  const tx = b.x + Math.cos(ang) * (b.r + 16), ty = b.y + Math.sin(ang) * (b.r + 16);
  const a1 = ang + 0.32, a2 = ang - 0.32;
  ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a1) * (b.r - 2), b.y + Math.sin(a1) * (b.r - 2)); ctx.lineTo(tx, ty); ctx.lineTo(b.x + Math.cos(a2) * (b.r - 2), b.y + Math.sin(a2) * (b.r - 2)); ctx.closePath();
  ctx.fillStyle = t.accent; ctx.globalAlpha = strong ? 1 : 0.85; ctx.fill(); ctx.globalAlpha = 1;
  // 글자: 이름(최대 2줄) + 세트 수
  const fs = Math.round(Math.max(22, Math.min(40, b.r * 0.25)));
  ctx.font = `900 ${fs}px ${font}`;
  const lines = wrapName(ctx, b.name, b.r * 1.62);
  const setFs = Math.round(fs * (strong ? 1.25 : 1.05));
  const lh = fs * 1.18, total = lines.length * lh + setFs * 1.1;
  let y = b.y - total / 2 + fs * 0.9;
  ctx.textAlign = 'center';
  ctx.fillStyle = strong ? t.onAccent : t.text;
  lines.forEach(l => { ctx.fillText(l, b.x, y); y += lh; });
  ctx.font = `900 ${setFs}px ${font}`;
  ctx.fillStyle = strong ? t.onAccent : t.accent;
  ctx.fillText(`${b.sets}세트`, b.x, y + setFs * 0.15);
  if (strong) { ctx.font = `900 ${Math.round(fs * 0.62)}px ${font}`; ctx.globalAlpha = 0.75; ctx.fillText('🔥 메인 종목', b.x, b.y - total / 2 - fs * 0.15); }
  ctx.restore();
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const prettyDate = (key) => {
  const [y, m, d] = String(key || '').split('-').map(Number);
  if (!y) return String(key || '');
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${DAYS[new Date(y, m - 1, d).getDay()]})`;
};

// 화면의 아바타 SVG를 이미지로 바꾼다 (몸 바깥으로 나가는 오라까지 보이게 영역을 조금 넓힌다)
const svgToImage = (svg) => new Promise((resolve) => {
  if (!svg) { resolve(null); return; }
  const clone = svg.cloneNode(true);
  const [vx, vy, vw, vh] = (svg.getAttribute('viewBox') || '0 0 200 400').split(/\s+/).map(Number);
  const padX = vw * 0.15, padY = vh * 0.06;
  clone.setAttribute('viewBox', `${vx - padX} ${vy - padY} ${vw + padX * 2} ${vh + padY * 2}`);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(Math.round((vw + padX * 2) * 4)));
  clone.setAttribute('height', String(Math.round((vh + padY * 2) * 4)));
  clone.removeAttribute('class');
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

// 오운완 카드 PNG를 만든다
export const renderWorkoutCard = async ({ theme = 'neon', data, avatarSvg }) => {
  const t = THEMES[theme] || THEMES.neon;
  try { await document.fonts?.ready; } catch (e) {}
  const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 배경 + 오른쪽 위 은은한 빛
  if (t.bg.length > 1) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    t.bg.forEach((c, i) => g.addColorStop(i / (t.bg.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = t.bg[0];
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W - 140, 140, 0, W - 140, 140, 520);
  glow.addColorStop(0, t.glow); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // 제목
  ctx.fillStyle = t.text; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 0.6; ctx.font = `900 34px ${font}`; ctx.fillText('GYM SPIRIT', 84, 130);
  ctx.globalAlpha = 1; ctx.font = `900 84px ${font}`; ctx.fillText('오운완 인증🔥', 80, 228);
  ctx.globalAlpha = 0.7; ctx.font = `700 38px ${font}`; ctx.fillText(prettyDate(data?.date), 84, 290);
  ctx.globalAlpha = 1;

  // 오른쪽 위 덤벨 표시
  roundRect(ctx, W - 196, 84, 116, 116, 36); ctx.fillStyle = t.chip; ctx.fill();
  ctx.fillStyle = t.accent;
  const cx = W - 138, cy = 142;
  ctx.fillRect(cx - 30, cy - 4, 60, 8);
  [[-34, 30], [-44, 20], [26, 30], [36, 20]].forEach(([dx, h]) => { roundRect(ctx, cx + dx, cy - h / 2, 8, h, 3); ctx.fill(); });

  // 운동 말풍선 자리 잡기 (세트가 많을수록 큰 원, 아바타 둘레에 마인드맵처럼)
  const items = (data?.items?.length ? data.items : (data?.exercises || []).map(name => ({ name, sets: 1 })))
    .filter(it => it && it.name).map(it => ({ name: String(it.name), sets: Math.max(1, Number(it.sets) || 1) }));
  const bubbles = layoutBubbles(ctx, items, font);

  // 말풍선 → 아바타 점선 (아바타 뒤에 깔린다)
  ctx.save();
  ctx.setLineDash([10, 12]); ctx.lineWidth = 4; ctx.lineCap = 'round';
  bubbles.forEach(b => {
    ctx.strokeStyle = t.accent; ctx.globalAlpha = b.top ? 0.6 : 0.3;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(BODY.x, BODY.y - 60); ctx.stroke();
  });
  ctx.restore();

  // 아바타
  const img = await svgToImage(avatarSvg);
  if (img) {
    const h = AV.h, w = h * (img.width / img.height);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
    ctx.drawImage(img, (W - w) / 2, AV.top, w, h);
    ctx.restore();
  }

  // 말풍선
  bubbles.forEach(b => drawBubble(ctx, b, t, font));

  // 기록 상자: 총 볼륨 · 종목 · 세트
  const bx = 80, by = 1300, bw = W - 160, bh = 190;
  roundRect(ctx, bx, by, bw, bh, 44); ctx.fillStyle = t.box; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = t.boxLine; ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = t.text;
  const totalSets = items.reduce((a, it) => a + it.sets, 0);
  const stats = [['총 운동 볼륨', `${Math.round(data?.totalVolume || 0).toLocaleString()}kg`], ['수행 종목', `${data?.workoutCount || items.length}개`], ['총 세트', `${totalSets}세트`]];
  stats.forEach(([label, value], k) => {
    const x = bx + bw * (k * 2 + 1) / 6;
    ctx.globalAlpha = 0.6; ctx.font = `700 30px ${font}`; ctx.fillText(label, x, by + 70);
    ctx.globalAlpha = 1; ctx.font = `900 ${value.length > 8 ? 46 : 56}px ${font}`; ctx.fillText(value, x, by + 145);
  });
  ctx.textAlign = 'left';

  // 아래 사이트 주소
  ctx.textAlign = 'center'; ctx.fillStyle = t.text; ctx.globalAlpha = 0.4;
  ctx.font = `700 28px ${font}`; ctx.fillText('gym-spirit.vercel.app', W / 2, H - 56);
  ctx.globalAlpha = 1; ctx.textAlign = 'left';

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
};

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '');
export const isIOS = () => /iPad|iPhone|iPod/.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/i.test(ua());

const fileOf = (blob, name) => new File([blob], name, { type: 'image/png' });
const canShareFile = (file) => { try { return !!navigator.canShare?.({ files: [file] }); } catch (e) { return false; } };

const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// 사진첩에 저장. 아이폰은 공유 창의 '이미지 저장'으로 사진 앱에 들어가고(처음 한 번 사진 접근 허용을 묻는다),
// 안드로이드·컴퓨터는 파일로 내려받아 갤러리의 Download 앨범에 들어간다.
// 결과: 'shared' | 'downloaded' | 'cancelled' | 'preview'(직접 길게 눌러 저장해야 함)
export const saveCardToPhotos = async (blob, name) => {
  const file = fileOf(blob, name);
  if (isIOS()) {
    if (canShareFile(file)) {
      try { await navigator.share({ files: [file] }); return 'shared'; }
      catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
    }
    return 'preview';
  }
  try { download(blob, name); return 'downloaded'; } catch (e) { return 'preview'; }
};

// 인스타그램·카카오톡 등으로 공유 (지원하지 않는 기기는 내려받기)
export const shareCard = async (blob, name) => {
  const file = fileOf(blob, name);
  if (canShareFile(file)) {
    try { await navigator.share({ files: [file], title: '오운완 인증', text: 'GYM SPIRIT 오운완 🔥' }); return 'shared'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; return isIOS() ? 'preview' : (download(blob, name), 'downloaded'); }
  }
  if (isIOS()) return 'preview';
  download(blob, name); return 'downloaded';
};
