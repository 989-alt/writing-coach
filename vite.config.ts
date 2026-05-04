import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // .env, .env.local 등 모든 .env 변수 로드 (VITE_ prefix 무관)
  const env = loadEnv(mode, process.cwd(), '');
  // 사용자가 .env에 GEMINI_API_KEY로만 넣어도 빌드 시 VITE_GEMINI_API_KEY로 자동 매핑
  const geminiKey = env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '';

  return {
    // GitHub Pages는 https://<user>.github.io/<repo>/ 경로에서 서비스되므로 base 필수.
    // 사용자 환경의 GH_PAGES_BASE 환경변수로 override 가능 (예: 커스텀 도메인 사용 시 '/').
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
