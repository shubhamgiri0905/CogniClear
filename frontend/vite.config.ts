import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), 'VITE_'); // ensures env is loaded

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    server: {
      port: 3000,
      host: '0.0.0.0',

      // DEV ONLY proxy
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
