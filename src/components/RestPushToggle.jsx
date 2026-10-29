import React, { useState } from 'react';
import { disableRestPush, enableRestPush, isRestPushOn, pushAvailability } from '../lib/push.js';

// 휴식 알람 설정 안의 '앱을 내려도 알림 받기' 스위치
export function RestPushToggle({ uid, showToast, onInstall }) {
  const [on, setOn] = useState(isRestPushOn());
  const [busy, setBusy] = useState(false);
  const avail = pushAvailability();

  const toggle = async () => {
    if (busy) return;
    if (on) { setBusy(true); await disableRestPush(uid); setOn(false); setBusy(false); showToast('휴식 종료 알림을 껐어요.'); return; }
    if (avail === 'ios-install') { onInstall?.(); showToast('아이폰은 홈 화면에 추가한 앱에서 알림을 받을 수 있어요.'); return; }
    setBusy(true);
    const r = await enableRestPush(uid);
    setBusy(false);
    if (r === 'on') { setOn(true); showToast('🔔 이제 앱을 내려도 휴식이 끝나면 알려 드려요!'); }
    else if (r === 'login') showToast('휴식 종료 알림은 회원가입 후 쓸 수 있어요.');
    else if (r === 'denied') showToast('알림이 꺼져 있어요. 휴대폰 설정에서 GYM SPIRIT 알림을 허용해 주세요.');
    else if (r === 'unsupported') showToast('이 브라우저는 알림을 지원하지 않아요.');
    else showToast(`알림을 켜지 못했어요. (${String(r).replace(/^error:/, '')})`);
  };

  const desc = !uid ? '회원가입 후 쓸 수 있어요'
    : avail === 'ios-install' ? '아이폰은 홈 화면에 추가한 앱에서만 돼요 (눌러서 방법 보기)'
    : avail === 'denied' ? '휴대폰 설정에서 이 앱의 알림을 허용해 주세요'
    : avail === 'unsupported' ? '이 브라우저는 알림을 지원하지 않아요'
    : on ? '화면이 꺼져 있거나 다른 앱을 써도 알림이 와요'
    : '화면이 꺼져 있거나 다른 앱을 써도 휴식이 끝나면 알림';

  return (
    <button onClick={toggle} disabled={busy} className="w-full flex items-center justify-between py-3 border-t border-neutral-800 disabled:opacity-60">
      <span className="text-left pr-3"><span className="block text-sm font-black">🔔 앱을 내려도 휴식 종료 알림</span><span className="block text-[11px] font-bold text-neutral-500">{desc}</span></span>
      <span className={`shrink-0 w-12 h-7 rounded-full p-1 transition-colors ${on ? 'bg-emerald-500' : 'bg-neutral-700'}`}><span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} /></span>
    </button>
  );
}
