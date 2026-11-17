import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages the site lives at https://<user>.github.io/vedic-astro/
export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [react()],
  server: { port: 5183 },
  build: { chunkSizeWarningLimit: 800 },
});
