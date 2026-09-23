#!/usr/bin/env node
/**
 * 一条命令跑完整条链（开发、AI、钩子、CI 都只记这一条）：
 *   对 规范清单.json 里的每套规范：生成变量 → 兼容校验 → 生成规则索引 → 生成规范站 → 样式检查 → 生成 AI 技能引用文件
 * 选项：
 *   --ci       全部生成后检查生成物与源一致（git status 里不能有 specs／references／.agents 的改动或新文件），用于评审前与 CI
 *   --verify   额外跑样板的 Playwright 验收（约 3 分钟，需要 Chromium）
 *   --spec <id> 只跑某一套规范
 * 退出码：0 通过；非 0 有失败。
 */
import { readFileSync, existsSync, mkdirSync, copyFileSync, cpSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const ci = args.includes('--ci'), verify = args.includes('--verify');
const only = args.includes('--spec') ? args[args.indexOf('--spec') + 1] : null;
const manifest = JSON.parse(readFileSync(join(root, '规范清单.json'), 'utf8'));
let failed = 0;
function run(label, cmd, cmdArgs, cwd) {
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`✗ ${label} 失败（退出码 ${r.status}）`); failed++; } else console.log(`✓ ${label}`);
  return r.status === 0;
}
if (only && !manifest.specs.some((s) => s.id === only)) { console.error(`未知规范 id「${only}」，规范清单.json 里有：${manifest.specs.map((s) => s.id).join('、')}`); process.exit(2); }
for (const spec of manifest.specs) {
  if (only && spec.id !== only) continue;
  const dir = join(root, spec.dir);
  console.log(`\n=== ${spec.name}（${spec.dir}，${spec.version}）===`);
  const tok = join(dir, spec.tokensDir);
  const dirArgs = ['--tokens-dir', spec.tokensDir, '--sample-dir', spec.sampleDir || '', '--snapshot-dir', spec.snapshotDir || '1.0.0-使用包快照'].filter((a, i, arr) => !(i % 2 === 0 && arr[i + 1] === ''));
  run('生成设计变量', 'node', ['build-tokens.mjs'], tok);
  run('变量兼容校验', 'node', ['check-tokens.mjs'], tok);
  run('生成规则索引', 'node', [join(root, 'tools', 'build-rules.mjs'), dir, ...dirArgs], root);
  if (spec.siteDir) run('生成规范站', 'node', [join(root, 'tools', 'build-site.mjs'), dir, ...dirArgs, '--site-dir', spec.siteDir], root);
  run('样式检查（样板与文档）', 'node', [join(root, 'tools', 'lint-styles.mjs'), ...spec.lintTargets.map((t) => join(dir, t)), '--spec', dir], root);
  if (verify && spec.sampleDir) {
    run('样板 Playwright 验收', 'node', ['verify.mjs'], join(dir, spec.sampleDir));
    run('生成验收记录', 'node', ['write-report.mjs'], join(dir, spec.sampleDir));
  }
  // AI 技能引用文件：从生成物复制，保证技能里的资料永不过期
  const refs = join(root, '.claude', 'skills', 'design-spec', 'references');
  mkdirSync(refs, { recursive: true });
  copyFileSync(join(dir, '规则索引.md'), join(refs, `${spec.id}-规则索引.md`));
  copyFileSync(join(tok, 'dist', '变量对照表.md'), join(refs, `${spec.id}-变量对照表.md`));
  console.log('✓ 更新技能引用文件 .claude/skills/design-spec/references/');
}
// 组件库：packages/ui-react 装了依赖就构建目录页到站点；没装就说明并跳过。样式文件一律查
// tokens 包的 dist 不进仓库，干净环境里先从规范 dist 同步一份，目录页与库构建都从它读
const tokensPkg = join(root, 'packages', 'tokens');
if (existsSync(join(tokensPkg, 'sync.mjs'))) run('同步 tokens 包产物', 'node', ['sync.mjs'], tokensPkg);
const uiReact = join(root, 'packages', 'ui-react');
if (existsSync(join(uiReact, 'node_modules', 'vite'))) run('构建 Web 组件库目录页', 'npm', ['run', 'build', '--silent'], uiReact);
else if (existsSync(uiReact)) console.log('· 未安装 packages/ui-react 依赖，跳过组件库构建（cd packages/ui-react && npm i --legacy-peer-deps）');
if (existsSync(join(root, 'demo/web-src/department-ui'))) {
  run('Web 展示源码样式检查', 'node', [join(root, 'tools/lint-styles.mjs'), join(root, 'demo/web-src/department-ui')], root);
  if (existsSync(join(uiReact, 'node_modules/esbuild'))) run('重建 Web 样板', 'node', [join(root, 'tools/build-web-demo.mjs')], root);
}
// 类型声明与入口导出一致：index.js 每个 export 在 index.d.ts 里都要有声明，反之亦然
{
  const idx = join(uiReact, 'src', 'index.js'), dts = join(uiReact, 'src', 'index.d.ts');
  if (existsSync(idx) && existsSync(dts)) {
    const js = [...readFileSync(idx, 'utf8').matchAll(/export \{ (\w+) \}/g)].map((m) => m[1]);
    const ts = [...readFileSync(dts, 'utf8').matchAll(/export declare (?:function|const) (\w+)/g)].map((m) => m[1]);
    const miss = js.filter((n) => !ts.includes(n)), extra = ts.filter((n) => !js.includes(n));
    if (miss.length || extra.length) { console.error(`✗ 类型声明与导出不一致：缺 ${miss.join(', ') || '无'}；多 ${extra.join(', ') || '无'}`); failed++; } else console.log(`✓ 类型声明覆盖 ${js.length} 个导出`);
  }
}
const uiMp = join(root, 'packages', 'ui-miniprogram');
if (existsSync(join(uiMp, 'node_modules', 'miniprogram-simulate'))) run('小程序组件模拟渲染（packages/ui-miniprogram）', 'npm', ['test', '--silent'], uiMp);
for (const pkg of ['ui-react/src', 'ui-miniprogram']) if (existsSync(join(root, 'packages', pkg))) run(`样式检查（packages/${pkg}）`, 'node', [join(root, 'tools', 'lint-styles.mjs'), join(root, 'packages', pkg), '--spec', join(root, manifest.specs[0].dir)], root);
// 技能副本：.agents/skills 供 Codex／Cursor 等工具（用 fs.cpSync 复制而非软链或外部命令，Windows 也能跑）
const src = join(root, '.claude', 'skills', 'design-spec'), dst = join(root, '.agents', 'skills', 'design-spec');
if (existsSync(src)) { try { cpSync(src, dst, { recursive: true }); console.log('✓ 同步技能副本到 .agents/skills'); } catch (e) { console.error(`✗ 同步技能副本失败：${e.message}`); failed++; } }
if (ci) {
  const r = spawnSync('git', ['status', '--porcelain', '--', 'specs', '.claude/skills/design-spec/references', '.agents'], { cwd: root, encoding: 'utf8' });
  const dirty = (r.stdout || '').trim();
  if (r.status !== 0 || dirty) { console.error(`✗ 生成物与源不一致（含未跟踪的新文件）：请把下面的改动一起提交\n${dirty}`); failed++; } else console.log('✓ 生成物与源一致');
}
console.log(failed ? `\n有 ${failed} 项失败` : '\n全部通过');
process.exit(failed ? 1 : 0);
