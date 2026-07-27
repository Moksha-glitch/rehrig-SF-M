import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appMode = env.VITE_APP_MODE === 'api' ? 'api' : 'demo';
  const isApi = appMode === 'api';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Demo builds resolve only local store/hooks; API builds resolve JWT + services.
        '@backend': path.resolve(__dirname, `src/backends/${appMode}`),
      },
    },
    server: {
      open: false,
      strictPort: true,
      // Demo never proxies to vision-api. API mode may use the proxy or VITE_API_URL.
      proxy: isApi
        ? {
            '/api': {
              target: 'http://localhost:4000',
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
