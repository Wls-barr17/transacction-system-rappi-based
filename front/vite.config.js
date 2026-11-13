import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    // Con VITE_USE_MOCK=false las llamadas a /api van a tu backend (ajusta el puerto).
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },
});
