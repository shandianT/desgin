#!/usr/bin/env node
/**
 * 一条命令跑完整条链（开发、AI、钩子、CI 都只记这一条）：
 *   对 规范清单.json 里的每套规范：生成变量 → 兼容校验 → 生成规则索引 → 生成规范站 → 样式检查 → 生成 AI 技能引用文件
 * 选项：
 *   --ci       全部生成后检查生成物与源一致（git diff --exit-code），用于评审前与 CI
 *   --verify   额外跑样板的 Playwright 验收（约 3 分钟，需要 Chromium）
 *   --spec <id> 只跑某一套规范
 * 退出码：0 通过；非 0 有失败。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
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
for (const spec of manifest.specs) {
  if (only && spec.id !== only) continue;
  const dir = join(root, spec.dir);
  console.log(`\n=== ${spec.name}（${spec.dir}，${spec.version}）===`);
  const tok = join(dir, spec.tokensDir);
  run('生成设计变量', 'node', ['build-tokens.mjs'], tok);
  run('变量兼容校验', 'node', ['check-tokens.mjs'], tok);
  run('生成规则索引', 'node', [join(root, 'tools', 'build-rules.mjs'), dir], root);
  if (spec.siteDir) run('生成规范站', 'node', [join(root, 'tools', 'build-site.mjs'), dir], root);
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
// 技能副本：.agents/skills 供 Codex／Cursor 等工具（复制而非软链，兼容 Windows）
const src = join(root, '.claude', 'skills', 'design-spec'), dst = join(root, '.agents', 'skills', 'design-spec');
if (existsSync(src)) { mkdirSync(dst, { recursive: true }); run('同步技能副本到 .agents/skills', 'cp', ['-r', src + '/.', dst + '/'], root); }
if (ci) {
  const r = spawnSync('git', ['diff', '--exit-code', '--stat', '--', 'specs', '.claude/skills/design-spec/references', '.agents'], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) { console.error('✗ 生成物与源不一致：请把上面的改动一起提交'); failed++; } else console.log('✓ 生成物与源一致');
}
console.log(failed ? `\n有 ${failed} 项失败` : '\n全部通过');
process.exit(failed ? 1 : 0);
