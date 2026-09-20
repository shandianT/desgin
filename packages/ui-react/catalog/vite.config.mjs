import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: here,
  base: './',
  plugins: [react()],
  server: { fs: { allow: [resolve(here, '../../..')] } },
  build: { outDir: resolve(here, '../../../specs/salesbuddy/站点/组件库'), emptyOutDir: true, sourcemap: false },
});
