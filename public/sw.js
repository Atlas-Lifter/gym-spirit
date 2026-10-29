// GYM SPIRIT 서비스 워커: 홈 화면 앱 설치와 오프라인 대비
// 항상 인터넷에서 최신 화면을 먼저 받고(배포가 바로 반영되도록), 인터넷이 끊겼을 때만 저장해 둔 화면을 보여준다.
// Supabase 같은 다른 주소 요청과 GET 이 아닌 요청은 건드리지 않는다.
const CACHE = 'gymspirit-v2';
const SHELL = ['/', '/index.html', '/app.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && (res.type === 'basic' || res.type === 'default')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('/index.html') : undefined) || Response.error())
  );
});

// 휴식 종료 푸시 알림 (서버가 휴식이 끝나는 시각에 보낸다: api/push.js)
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data && e.data.text() }; }
  const title = data.title || '⏱️ 휴식 끝!';
  e.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body: data.body || '다음 세트를 시작하세요 💪',
      tag: data.tag || 'rest-timer',
      renotify: true,
      requireInteraction: false,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [300, 120, 300, 120, 500],
      data: { url: data.url || '/' },
    });
    // 앱을 보고 있는 중이면 앱 안에서 이미 알람이 울렸으니 알림은 바로 거둔다
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some(w => w.visibilityState === 'visible')) {
      const shown = await self.registration.getNotifications({ tag: data.tag || 'rest-timer' });
      shown.forEach(n => n.close());
    }
  })());
});

// 알림을 누르면 열려 있는 앱으로 돌아가거나 새로 연다
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = wins.find(w => new URL(w.url).origin === self.location.origin);
    if (win) return win.focus();
    return self.clients.openWindow(url);
  })());
});
