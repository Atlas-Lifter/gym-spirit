import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
const root = createRoot(document.getElementById('root'));
// 개발 서버에서 ?bossgallery 로 열면 레이드 보스 그림 모음 (배포본에는 포함되지 않음)
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('bossgallery')) {
  import('./dev/BossGallery.jsx').then(m => root.render(<m.default />));
} else {
  root.render(<App />);
}

// 홈 화면 앱 설치·오프라인을 위한 서비스 워커 (배포본에서만)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
