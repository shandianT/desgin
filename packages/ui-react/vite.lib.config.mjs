import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
// 库构建：只打包本库代码，React、antd、Ant Design X 由使用方安装（peerDependencies）。
export default defineConfig({
  root: here,
  plugins: [react()],
  build: {
    outDir: resolve(here, 'dist'), emptyOutDir: true, sourcemap: true, cssCodeSplit: false,
    lib: { entry: resolve(here, 'src/index.js'), formats: ['es', 'cjs'], fileName: (f) => (f === 'es' ? 'index.js' : 'index.cjs'), cssFileName: 'style' },
    rollupOptions: { external: [/^react($|\/)/, /^react-dom($|\/)/, /^antd($|\/)/, /^@ant-design\//, /^@shandiant\//], output: { globals: { react: 'React', 'react-dom': 'ReactDOM', antd: 'antd' } } },
  },
});
