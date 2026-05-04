import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // ⚠️ 보안: 프로덕션 빌드에는 키를 절대 인라인하지 않는다. (Google leak detector 회피)
  // dev 서버(npm run dev)에서만 .env(.local)의 GEMINI_API_KEY를 노출해 편의 제공.
  // 프로덕션은 사용자가 UI에서 직접 입력 → localStorage에 저장.
  const isDev = command === 'serve';
  const geminiKey = isDev ? (env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '') : '';

  return {
    base: env.GH_PAGES_BASE ?? '/writing-coach/',
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    server: {
      port: 5173,
      host: '127.0.0.1',
    },
  };
});
