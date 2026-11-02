import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// 개발 서버에서만: Vercel 서버 함수(api/*.js)를 같은 주소(/api/이름)로 돌려 본다. 키 등은 .env.local (git 에 안 올라감)
// COACH_DEV_BYPASS=1 이면 로그인 확인을 건너뛰고 COACH_ALLOWED_EMAILS 의 첫 계정으로 본다 (로컬 시험용)
const devApi = (env) => ({
  name: 'dev-api',
  configureServer(server) {
    Object.assign(process.env, env);
    server.middlewares.use('/api', async (req, res, next) => {
      const name = (req.url || '').split('?')[0].replace(/^\//, '');
      if (!/^[a-z-]+$/.test(name)) return next();
      const mod = await server.ssrLoadModule(`/api/${name}.js`).catch(() => null);
      if (!mod) return next();
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const realFetch = globalThis.fetch;
      if (env.COACH_DEV_BYPASS === '1') {
        globalThis.fetch = (url, opt) => (String(url).includes('/auth/v1/user')
          ? Promise.resolve(new Response(JSON.stringify({ email: (env.COACH_ALLOWED_EMAILS || '').split(',')[0] }), { status: 200 }))
          : realFetch(url, opt));
      }
      try {
        const headers = { ...req.headers };
        if (env.COACH_DEV_BYPASS === '1') headers.authorization = 'Bearer dev';
        const out = await mod.default(new Request(`http://localhost/api/${name}`, { method: req.method, headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined }));
        res.statusCode = out.status;
        out.headers.forEach((v, k) => res.setHeader(k, v));
        if (out.body) for await (const c of out.body) res.write(c);
        res.end();
      } finally {
        globalThis.fetch = realFetch;
      }
    });
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(loadEnv(mode, process.cwd(), ''))],
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
}));
