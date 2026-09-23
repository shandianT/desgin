#!/usr/bin/env node
// Web 展示源码和组件源码一起构建，业务 bundle 保持原样。
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = join(root, 'packages/ui-react');
const require = createRequire(join(pkg, 'package.json'));
const { build } = require('esbuild');
await build({
  absWorkingDir: root,
  entryPoints: ['demo/web-src/department-ui/index.jsx'],
  bundle: true, minify: true, outfile: 'demo/web/department-ui/app.js',
  format: 'iife', platform: 'browser', target: ['es2022'],
  define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'linked',
  nodePaths: [join(pkg, 'node_modules')],
  alias: {
    '@shandiant/ui-react/style.css': join(pkg, 'src/styles.css'),
    '@shandiant/ui-react': join(pkg, 'src/index.js'),
    '@shandiant/tokens/css': join(root, 'packages/tokens/dist/design-tokens.css'),
    '@shandiant/tokens/bridge-antd': join(root, 'packages/tokens/dist/bridge-antd.theme.json'),
    '@shandiant/tokens/bridge-echarts': join(root, 'packages/tokens/dist/bridge-echarts.theme.json'),
  },
});
const hash = createHash('sha256');
for (const ext of ['js', 'css']) hash.update(readFileSync(join(root, `demo/web/department-ui/app.${ext}`)));
const stamp = hash.digest('hex').slice(0, 12);
for (const name of ['index.html', 'entry.js']) {
  const path = join(root, 'demo/web', name);
  writeFileSync(path, readFileSync(path, 'utf8').replace(/department-ui\/app\.(css|js)(\?v=[a-z0-9]+)?/g, (_, ext) => `department-ui/app.${ext}?v=${stamp}`));
}
console.log(`WEB_DEMO_BUILD_OK ${stamp}`);
