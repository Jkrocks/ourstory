import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` makes the normal site for hosting.
// `npm run build:preview` makes one self-contained HTML file (used for the Claude preview).
const single = process.env.SINGLE === '1';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: { target: 'es2019', ...(single ? { assetsInlineLimit: 100000000 } : {}) },
});
