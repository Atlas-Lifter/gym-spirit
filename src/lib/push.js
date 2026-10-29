// 휴식 종료 푸시 알림 (앱을 내려두거나 화면이 꺼져 있어도 휴식이 끝나면 알림)
// · 이 기기의 알림 주소를 Supabase(push_subscriptions)에 저장하고
// · 휴식이 시작되면 끝나는 시각을 rest_alarms 에 적어 둔다. 서버가 그 시각에 알림을 보낸다 (supabase/rest_push.sql, api/push.js)
import { supabase } from '../cloud.js';
import { isIOS, isStandalone } from '../pwa.jsx';

// 공개 열쇠 (api/push.js 와 같은 값, 숨길 필요 없음)
export const VAPID_PUBLIC_KEY = 'BJAa9wXrdz9A4Fq66zbuVjLQ4TNg5nnnsqrM7-bii62bWT2n8tbDZuIJB7YlfGUBUWt_pUfk-WcooBmMD_SX2jI';
const ON_KEY = 'gymspirit_rest_push';
// 서비스 워커 등록을 미리 받아 둔다 (버튼을 누른 순간 기다리는 일 없이 바로 알림 등록을 하려고)
let swReg = null;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) navigator.serviceWorker.ready.then((r) => { swReg = r; }).catch(() => {});

const toUint8 = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

// 지금 이 기기에서 알림을 쓸 수 있는지: 'ok' | 'ios-install'(아이폰은 홈 화면 앱에서만) | 'unsupported' | 'denied'
export const pushAvailability = () => {
  if (typeof window === 'undefined') return 'unsupported';
  if (isIOS() && !isStandalone()) return 'ios-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
};

export const isRestPushOn = () => {
  try { return localStorage.getItem(ON_KEY) === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted'; } catch (e) { return false; }
};

// 알림 켜기 (반드시 버튼을 누른 순간에 불러야 한다: 권한 창은 사용자 동작이 있어야 뜬다)
// 결과: 'on' | 'denied' | 'ios-install' | 'unsupported' | 'login' | 'error:단계:이유'
export const enableRestPush = async (uid) => {
  const avail = pushAvailability();
  if (avail !== 'ok') return avail;
  if (!uid) return 'login';
  let step = 'sw';
  try {
    // 아이폰은 누른 순간에 바로 subscribe 를 불러야 한다 (권한을 먼저 묻고 기다리면 거절된다).
    // subscribe 가 알아서 허용 창을 띄우고, 이미 등록돼 있으면 그 등록을 돌려준다
    const reg = swReg || await Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('service worker not ready')), 6000))]);
    step = 'subscribe';
    let sub;
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8(VAPID_PUBLIC_KEY) });
    } catch (e) {
      if (Notification.permission === 'denied') return 'denied';
      throw e;
    }
    step = 'save';
    const json = sub.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: json.endpoint, user_id: uid, p256dh: json.keys.p256dh, auth: json.keys.auth, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    localStorage.setItem(ON_KEY, '1');
    return 'on';
  } catch (e) {
    console.error('push enable failed', step, e);
    // 어디서 왜 막혔는지 화면에 보여 줘서 원인을 찾을 수 있게
    return `error:${step}:${e?.code || e?.name || ''} ${String(e?.message || e).slice(0, 80)}`;
  }
};

export const disableRestPush = async (uid) => {
  try { localStorage.removeItem(ON_KEY); } catch (e) {}
  try {
    const reg = await navigator.serviceWorker?.ready;
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
    if (uid) await supabase.from('rest_alarms').delete().eq('user_id', uid);
  } catch (e) {}
};

// 휴식이 끝나는 시각을 서버에 적어 둔다 (null 이면 지운다). 자주 바뀌어도 마지막 것만 보낸다
let pendingTimer = null;
export const syncRestAlarm = (uid, fireAtMs) => {
  if (!uid || !isRestPushOn()) return;
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(async () => {
    try {
      if (fireAtMs && fireAtMs > Date.now()) {
        await supabase.from('rest_alarms').upsert({ user_id: uid, fire_at: new Date(fireAtMs).toISOString() });
      } else {
        await supabase.from('rest_alarms').delete().eq('user_id', uid);
      }
    } catch (e) {}
  }, 150);
};
