import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  base: './',
  build: {
    emptyOutDir: false,
    // 3D 포징 가이드(three.js)는 따로 나뉘어 열 때만 받는다
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        assetFileNames: '[name][extname]',
        // 자주 안 바뀌는 라이브러리(React·Supabase·아이콘)는 따로 묶어 배포 뒤에도 브라우저에 남아 있게
        manualChunks(id) { if (id.includes('node_modules') && !id.includes('/three/')) return 'vendor'; },
      },
    },
  },
});
