#!/usr/bin/env node
/**
 * 把三个包打成 npm 包文件（.tgz）放到 release/，并写一份清单。不发布到任何源；发布要有源地址和凭证，见 specs/salesbuddy/09-npm包与发布.md。
 * 用法：node tools/pack.mjs
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'release');
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f.endsWith('.tgz')) rmSync(join(out, f));
const rows = [];
for (const name of ['tokens', 'ui-react', 'ui-miniprogram']) {
  const dir = join(root, 'packages', name);
  if (name === 'ui-react' && !existsSync(join(dir, 'node_modules', 'vite'))) { console.error('✗ ui-react 未装依赖，先执行 cd packages/ui-react && npm i --legacy-peer-deps'); process.exit(1); }
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', '--pack-destination', out, '--json', '--silent'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
  const jsonStart = r.stdout.lastIndexOf('\n[') >= 0 ? r.stdout.lastIndexOf('\n[') + 1 : r.stdout.indexOf('['); // prepack 的日志也会进 stdout，只取末尾的 JSON
  const info = JSON.parse(r.stdout.slice(jsonStart))[0];
  const file = join(out, info.filename);
  const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
  rows.push({ name: info.name, version: info.version, filename: info.filename, files: info.entryCount, size: statSync(file).size, sha256: sha });
  console.log(`✓ ${info.name}@${info.version} → release/${info.filename}（${info.entryCount} 个文件，${(statSync(file).size / 1024).toFixed(0)} KB）`);
}
const md = `# npm 包文件\n\n由 \`node tools/pack.mjs\` 生成。没有发布到任何源，装法：\`npm i ./release/<文件名>\`。发布到部门私有源见 \`specs/salesbuddy/09-npm包与发布.md\`。\n\n| 包 | 版本 | 文件 | 文件数 | 大小 | sha256 |\n|---|---|---|---|---|---|\n${rows.map((r) => `| ${r.name} | ${r.version} | ${r.filename} | ${r.files} | ${(r.size / 1024).toFixed(0)} KB | ${r.sha256.slice(0, 16)}… |`).join('\n')}\n`;
writeFileSync(join(out, 'README.md'), md);
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ generatedBy: 'tools/pack.mjs', packages: rows }, null, 2) + '\n');
