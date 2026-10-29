// 휴식 종료 푸시 알림 보내기 (Vercel 서버 함수)
// Supabase 가 2초마다 끝난 휴식 알람을 모아 이 주소로 보내면, 각 기기에 알림을 보낸다.
// 열쇠는 코드에 넣지 않고 Vercel 환경 변수에서 읽는다: VAPID_PRIVATE_KEY, PUSH_SECRET
import webpush from 'web-push';

// 공개 열쇠는 앱 코드에도 들어가는 값이라 숨길 필요가 없다 (src/lib/push.js 와 같은 값)
const VAPID_PUBLIC_KEY = 'BJAa9wXrdz9A4Fq66zbuVjLQ4TNg5nnnsqrM7-bii62bWT2n8tbDZuIJB7YlfGUBUWt_pUfk-WcooBmMD_SX2jI';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const secret = process.env.PUSH_SECRET;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !privateKey) { res.status(500).json({ error: 'push not configured' }); return; }
  if (req.headers['x-push-secret'] !== secret) { res.status(401).json({ error: 'unauthorized' }); return; }

  webpush.setVapidDetails('https://gym-spirit.vercel.app', VAPID_PUBLIC_KEY, privateKey);
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const items = Array.isArray(body.items) ? body.items.slice(0, 500) : [];

  const results = await Promise.allSettled(items.map((it) => webpush.sendNotification(
    { endpoint: it.endpoint, keys: { p256dh: it.p256dh, auth: it.auth } },
    JSON.stringify({ title: it.title || '⏱️ 휴식 끝!', body: it.body || '다음 세트를 시작하세요 💪', tag: 'rest-timer', url: '/' }),
    { TTL: 120, urgency: 'high' },
  )));
  const sent = results.filter(r => r.status === 'fulfilled').length;
  // 더는 쓰지 않는 알림 주소(앱 삭제·알림 끄기)는 410/404 로 돌아온다
  const gone = results.map((r, i) => (r.status === 'rejected' && [404, 410].includes(r.reason?.statusCode) ? items[i].endpoint : null)).filter(Boolean);
  res.status(200).json({ sent, failed: items.length - sent, gone: gone.length });
}
