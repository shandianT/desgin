#!/usr/bin/env node
// Build UI and the explicitly owned business modules; preserve other upstream modules.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = join(root, 'packages/ui-react');
const require = createRequire(join(pkg, 'package.json'));
const { build } = require('esbuild');
const bundlePath = join(root, 'demo/web/bundle.js');
const rawBundle = readFileSync(bundlePath, 'utf8');
const prefix = 'window.SALES_BUNDLE=';
if (!rawBundle.startsWith(prefix)) throw Error('Unexpected business bundle format');
const bundle = JSON.parse(rawBundle.slice(prefix.length).trim().replace(/;$/, ''));
const business = join(root, 'demo/web-src/business');
function ownedFiles(directory, prefix = '') {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => entry.isDirectory()
    ? ownedFiles(join(directory, entry.name), prefix + entry.name + '/') : [prefix + entry.name]);
}
for (const file of ownedFiles(business).filter(file => file.endsWith('.js'))) {
  bundle.modules[file.slice(0, -3)] = readFileSync(join(business, file), 'utf8');
}
const templates = JSON.parse(execFileSync('python3', [join(root, 'tools/build-web-templates.py'), business], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
for (const [id, record] of Object.entries(templates)) {
  const group = id.startsWith('pages/') ? bundle.pages : bundle.components;
  group[id] = {...group[id], ...record, css: group[id]?.css || ''};
}
bundle.revision = '5f022c53432ace4f22958f12f3f61fbc7511fec7';
bundle.webRevision = 'v1.1.0-web-alignment';
writeFileSync(bundlePath, prefix + JSON.stringify(bundle) + ';\n');
await build({
  absWorkingDir: root,
  entryPoints: ['demo/web-src/department-ui/index.jsx'],
  bundle: true, minify: true, outfile: 'demo/web/department-ui/app.js',
  format: 'iife', platform: 'browser', target: ['es2022'],
  define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'linked',
  nodePaths: [join(pkg, 'node_modules')],
  plugins: [{
    name: 'web-baseline-battle-map',
    setup(builder) {
      // AMT-01 preserves the renderer shipped in the user's Web 20260924 ZIP.
      // The snapshot records its source commit/hash; reconcile in the map item.
      builder.onLoad({ filter: /[/\\]components[/\\]SbBattleMap\.jsx$/ }, args => {
        if (resolve(args.path) !== join(pkg, 'src/components/SbBattleMap.jsx')) return;
        return {
          contents: readFileSync(join(root, 'demo/web-src/baseline/SbBattleMap-20260924.jsx'), 'utf8'),
          loader: 'jsx',
          resolveDir: dirname(args.path),
        };
      });
    },
  }],
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
const runtimeFiles = ['bundle.js', 'preview-api.js', 'preview-workflow.js', 'runtime.js', 'browser-platform.js', 'shell.js', 'detail-workspace.js'];
for (const name of runtimeFiles) hash.update(readFileSync(join(root, 'demo/web', name)));
const stamp = hash.digest('hex').slice(0, 12);
for (const name of ['index.html', 'entry.js']) {
  const path = join(root, 'demo/web', name);
  writeFileSync(path, readFileSync(path, 'utf8').replace(/(department-ui\/app\.(?:css|js)|bundle\.js|preview-api\.js|preview-workflow\.js|runtime\.js|browser-platform\.js|shell\.js|detail-workspace\.js)(\?v=[a-z0-9]+)?/g, (_, resource) => `${resource}?v=${stamp}`));
}
console.log(`WEB_DEMO_BUILD_OK ${stamp}`);
