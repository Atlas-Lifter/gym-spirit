# Gymwork Pro

React + Vite로 만든 헬스 기록 앱.

## 실행
```
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/app.js 생성
```

## 파일 구성
- `src/App.jsx` — 앱 전체 화면과 상태 (운동·식단·분석·프로그램·랭킹·프로필)
- `src/exerciseGuides.js` — 125개 종목의 단계별 운동 설명서 글
- `src/movementPatterns.jsx` — 설명서 그림용 동작 패턴(자세·기구)
- `src/poseFigure.jsx` — 설명서 마네킹 그림을 그리는 엔진
- `src/legendCovers.jsx` — 전설 루틴 카드의 일러스트 표지
- `src/animeFilter.js` — 표지 사진용 애니메이션풍 필터
- `src/main.jsx` — 진입점
- `dist/gymwork-pro.html` — 아티팩트로 올리는 페이지 (dist/app.js를 불러옴)

Tailwind는 CDN(cdn.tailwindcss.com)으로 불러옵니다.
