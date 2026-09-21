import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
// 产物是一个普通脚本加一个 CSS，不是 ES module：站点用 iframe 嵌入时，file:// 与任何托管环境都能打开。
// 构建后由 catalog/postbuild.mjs 把 index.html 里的模块脚本标签改成 defer 脚本。
export default defineConfig({
  root: here,
  base: './',
  plugins: [react()],
  resolve: { alias: [{ find: /^@shandiant\/tokens\/bridge-antd$/, replacement: resolve(here, '../../tokens/dist/bridge-antd.theme.json') }, { find: /^@shandiant\/tokens\/bridge-echarts$/, replacement: resolve(here, '../../tokens/dist/bridge-echarts.theme.json') }, { find: /^@shandiant\/tokens\/css$/, replacement: resolve(here, '../../tokens/dist/design-tokens.css') }] },
  server: { fs: { allow: [resolve(here, '../../..')] } },
  build: {
    outDir: resolve(here, '../../../specs/salesbuddy/站点/组件库'),
    emptyOutDir: true,
    sourcemap: false,
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined } },
  },
});
