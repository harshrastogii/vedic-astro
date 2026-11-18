import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from the root of https://astrotalk.space (GitHub Pages custom domain).
export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [react()],
  server: { port: 5183 },
  build: { chunkSizeWarningLimit: 800 },
});
