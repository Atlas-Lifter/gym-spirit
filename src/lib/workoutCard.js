// 오운완 카드를 실제 이미지(PNG)로 그리고, 휴대폰 사진첩에 저장하거나 공유한다.
// 화면의 카드와 같은 모양을 캔버스에 직접 그린다 (아바타는 화면에 있는 SVG를 그대로 옮겨 그림)

const W = 1080, H = 1680;

const THEMES = {
  neon: { bg: ['#0a0a0a'], glow: 'rgba(16,185,129,0.28)', text: '#ffffff', accent: '#34d399', box: 'rgba(23,23,23,0.7)', boxLine: 'rgba(255,255,255,0.1)', chip: 'rgba(255,255,255,0.1)', chipLine: 'rgba(255,255,255,0.1)', chipText: '#e5e5e5' },
  clean: { bg: ['#ffffff'], glow: 'rgba(59,130,246,0.12)', text: '#171717', accent: '#2563eb', box: '#fafafa', boxLine: '#e5e5e5', chip: '#f5f5f5', chipLine: '#e5e5e5', chipText: '#404040' },
  cyber: { bg: ['#0a0a0a', '#3b0764', '#171717'], glow: 'rgba(168,85,247,0.35)', text: '#ffffff', accent: '#c084fc', box: 'rgba(23,23,23,0.6)', boxLine: 'rgba(255,255,255,0.1)', chip: 'rgba(255,255,255,0.1)', chipLine: 'rgba(255,255,255,0.1)', chipText: '#e5e5e5' },
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

  // 아바타
  const img = await svgToImage(avatarSvg);
  if (img) {
    const boxTop = 330, boxH = 800;
    const h = boxH, w = h * (img.width / img.height);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
    ctx.drawImage(img, (W - w) / 2, boxTop, w, h);
    ctx.restore();
  }

  // 기록 상자
  const bx = 80, by = 1170, bw = W - 160, bh = 200;
  roundRect(ctx, bx, by, bw, bh, 44); ctx.fillStyle = t.box; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = t.boxLine; ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = t.text;
  const stats = [['총 운동 볼륨', `${Math.round(data?.totalVolume || 0).toLocaleString()}kg`], ['수행 종목', `${data?.workoutCount || 0}개 종목`]];
  stats.forEach(([label, value], i) => {
    const x = bx + bw * (i * 2 + 1) / 4;
    ctx.globalAlpha = 0.6; ctx.font = `700 30px ${font}`; ctx.fillText(label, x, by + 72);
    ctx.globalAlpha = 1; ctx.font = `900 62px ${font}`; ctx.fillText(value, x, by + 150);
  });
  ctx.textAlign = 'left';

  // 종목 이름 (최대 4개, 넘치면 +N)
  const names = (data?.exercises || []).filter(Boolean);
  const chips = names.slice(0, 4).concat(names.length > 4 ? [`+${names.length - 4}`] : []);
  ctx.font = `900 32px ${font}`;
  let x = bx, y = 1410;
  chips.forEach((name) => {
    let label = String(name);
    while (ctx.measureText(label).width > bw - 48 && label.length > 2) label = label.slice(0, -2) + '…';
    const w = ctx.measureText(label).width + 48;
    if (x + w > bx + bw) { x = bx; y += 76; }
    roundRect(ctx, x, y, w, 62, 18); ctx.fillStyle = t.chip; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = t.chipLine; ctx.stroke();
    ctx.fillStyle = t.chipText; ctx.fillText(label, x + 24, y + 43);
    x += w + 14;
  });

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
