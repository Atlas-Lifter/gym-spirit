import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

// 홈 화면에 앱처럼 설치 (PWA) + 운동 중 화면 꺼짐 방지
// · 안드로이드·크롬·엣지: 브라우저가 주는 설치 창(beforeinstallprompt)을 띄운다
// · 아이폰·아이패드: 설치 창이 없어서 "공유 → 홈 화면에 추가" 방법을 보여준다

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach(f => f());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; notify(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; notify(); });
}

export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
export const isIOS = () => typeof navigator !== 'undefined' && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export const useInstallState = () => {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force(x => x + 1); listeners.add(f); return () => { listeners.delete(f); }; }, []);
  return { installed: isStandalone(), canPrompt: !!deferredPrompt, ios: isIOS() };
};

const promptInstall = async () => {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
  deferredPrompt = null; notify();
  return choice.outcome;
};

// 운동 화면에 있는 동안 화면이 꺼지지 않게 한다 (앱을 다시 보면 자동으로 다시 켠다)
export const useWakeLock = (on) => {
  useEffect(() => {
    if (!on || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;
    let lock = null, alive = true;
    const request = async () => { try { lock = await navigator.wakeLock.request('screen'); } catch (e) { lock = null; } };
    const onVisible = () => { if (alive && document.visibilityState === 'visible') request(); };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible); lock?.release?.().catch(() => {}); };
  }, [on]);
};

// 설치 방법 안내 (아이폰은 직접 따라 하는 방법, 그 외는 설치 버튼)
export const InstallSheet = ({ open, onClose, onToast }) => {
  const st = useInstallState();
  if (!open) return null;
  const install = async () => {
    const r = await promptInstall();
    if (r === 'accepted') { onToast?.('홈 화면에 GYM SPIRIT을 추가했어요! 📲'); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-[120] bg-black/55 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-[32px] p-6 pb-10 text-neutral-900 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black">앱으로 설치하기</h3>
          <button onClick={onClose} aria-label="닫기" className="p-2 rounded-full bg-neutral-100 text-neutral-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#070b0f] text-white mb-5">
          <img src="/icon-192.png" alt="" className="w-12 h-12 rounded-xl" />
          <div className="text-xs font-bold text-white/70 leading-relaxed">홈 화면 아이콘으로 바로 열리고, 주소창 없이 앱처럼 전체 화면으로 써요. 운동 중에는 화면이 꺼지지 않아요.</div>
        </div>
        {st.installed ? (
          <div className="py-4 text-center text-sm font-black text-emerald-600">이미 앱으로 설치해서 쓰고 있어요 ✅</div>
        ) : st.ios ? (
          <ol className="space-y-3">
            {[[<Share key="s" className="w-4 h-4" />, '사파리 아래쪽(아이패드는 위쪽) 공유 버튼을 눌러요'], [<PlusSquare key="p" className="w-4 h-4" />, "목록을 내려 '홈 화면에 추가'를 눌러요"], [<Smartphone key="m" className="w-4 h-4" />, "오른쪽 위 '추가'를 누르면 홈 화면에 아이콘이 생겨요"]].map(([icon, text], i) => (
              <li key={i} className="flex items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3">
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-neutral-500">{icon}</span>
                <span className="text-sm font-bold text-neutral-700">{text}</span>
              </li>
            ))}
            <li className="text-[11px] font-bold text-neutral-400 px-1">카카오톡·인스타 안에서 열었다면 먼저 '사파리로 열기'를 눌러 주세요.</li>
          </ol>
        ) : st.canPrompt ? (
          <button onClick={install} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"><Download className="w-5 h-5" /> 홈 화면에 설치</button>
        ) : (
          <div className="space-y-2 text-sm font-bold text-neutral-600">
            <p className="bg-neutral-50 rounded-2xl px-4 py-3">크롬·삼성 인터넷: 오른쪽 위(또는 아래) <b>⋮ 메뉴 → '홈 화면에 추가'</b> 또는 <b>'앱 설치'</b>를 눌러요.</p>
            <p className="text-[11px] text-neutral-400 px-1">메뉴에 없으면 크롬에서 사이트를 열어 주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 홈 화면 상단의 작은 설치 안내 (한 번 닫으면 다시 안 보임)
const BANNER_KEY = 'gymspirit_install_banner_closed';
export const InstallBanner = ({ onOpen }) => {
  const st = useInstallState();
  const [closed, setClosed] = useState(() => { try { return localStorage.getItem(BANNER_KEY) === '1'; } catch (e) { return false; } });
  if (st.installed || closed || (!st.ios && !st.canPrompt)) return null;
  const close = () => { setClosed(true); try { localStorage.setItem(BANNER_KEY, '1'); } catch (e) {} };
  return (
    <div className="flex items-center gap-3 bg-white border border-emerald-100 rounded-2xl px-4 py-3 mb-4 shadow-sm">
      <span className="text-xl">📲</span>
      <button onClick={onOpen} className="flex-1 text-left text-xs font-bold text-neutral-600 leading-snug"><b className="font-black text-neutral-900">홈 화면에 추가</b>하면 앱처럼 바로 열고, 운동 중 화면이 꺼지지 않아요</button>
      <button onClick={onOpen} className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black">설치</button>
      <button onClick={close} aria-label="닫기" className="p-1 text-neutral-300"><X className="w-4 h-4" /></button>
    </div>
  );
};

// 프로필 탭의 설치 카드
export const InstallCard = ({ onOpen }) => {
  const st = useInstallState();
  return (
    <button onClick={onOpen} className="w-full flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-3.5 text-left shadow-sm active:scale-[0.99] transition-transform">
      <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
      <span className="flex-1">
        <span className="block text-sm font-black text-neutral-900">{st.installed ? '앱으로 사용 중' : '앱으로 설치하기'}</span>
        <span className="block text-[11px] font-bold text-neutral-400">{st.installed ? '홈 화면 아이콘으로 열었어요' : '홈 화면 아이콘 · 전체 화면 · 운동 중 화면 꺼짐 방지'}</span>
      </span>
      {!st.installed && <Download className="w-4 h-4 text-emerald-500" />}
    </button>
  );
};
