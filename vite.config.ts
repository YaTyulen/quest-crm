import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: { icon: true, exportType: 'default' },
        include: '**/*.svg',
      }),
    ],
    css: { preprocessorOptions: { scss: { silenceDeprecations: ['import'] } } },
    server: {
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    base: '/quest-crm/',
  };
});
