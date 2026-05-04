import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

loadDotenv({ path: '.env.local' });

function devApiPlugin() {
  return {
    name: 'writing-coach-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        try {
          const route = req.url.split('?')[0].replace(/^\/api\//, '');
          const handlerPath = path.resolve(process.cwd(), 'api', `${route}.ts`);
          const mod = await server.ssrLoadModule(handlerPath);
          const handler = mod.default;
          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: `No default export in api/${route}.ts` }));
            return;
          }
          await handler(req, res);
        } catch (err) {
          res.statusCode = 500;
          const message = err instanceof Error ? err.message : 'unknown error';
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
