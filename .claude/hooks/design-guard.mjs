#!/usr/bin/env node
/**
 * PostToolUse 钩子（Edit|Write 之后自动跑）：把「不写裸色值、字号底线、变量必须存在」变成强制。
 * 读 stdin 的 JSON（tool_input.file_path），对样式类文件跑 lint-styles；对 tokens.json 跑生成与兼容校验。
 * 退出码 2 = 阻止并把原因反馈给 Claude（它会自行修正）；0 = 放行。规则只是请求，钩子才是强制。
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let file = '';
  try { file = JSON.parse(input).tool_input?.file_path || ''; } catch { process.exit(0); }
  if (!file) process.exit(0);
  const rel = file.replace(root + '/', '');
  const isStyle = /\.(css|wxss|wxml|html|vue|jsx|tsx)$/.test(file) && !/\/dist\/|1\.0\.0-使用包快照|dist-artifact\.html|\/vendor\//.test(file);
  const isTokens = /tokens\.json$/.test(file);
  if (isTokens) {
    const dir = dirname(file);
    for (const script of ['build-tokens.mjs', 'check-tokens.mjs']) {
      const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
      if (r.status !== 0) { console.error(`设计规范钩子：${script} 失败\n${r.stdout}${r.stderr}`); process.exit(2); }
    }
    const b = spawnSync('node', [resolve(root, 'tools', 'build-rules.mjs'), resolve(dir, '..')], { encoding: 'utf8' });
    if (b.status !== 0) { console.error(`设计规范钩子：规则索引生成失败\n${b.stdout}${b.stderr}`); process.exit(2); }
    process.exit(0);
  }
  if (isStyle && existsSync(file)) {
    const m = rel.match(/^(specs\/[^/]+)\//);
    const spec = m ? resolve(root, m[1]) : resolve(root, 'specs', 'salesbuddy');
    const r = spawnSync('node', [resolve(root, 'tools', 'lint-styles.mjs'), file, '--spec', spec], { encoding: 'utf8' });
    if (r.status === 1) { console.error(`设计规范钩子：样式检查未通过（见规则编号），请改用 var(--ui-*) 或调整字号：\n${r.stdout}`); process.exit(2); }
  }
  process.exit(0);
});
