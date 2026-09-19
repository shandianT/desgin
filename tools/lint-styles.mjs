#!/usr/bin/env node
/**
 * 样式检查器（lint）：把设计规范里的硬约束变成机器检查，报错带规则编号。
 *   ① 不写裸色值（V-01：颜色用 --ui-* 变量）
 *   ② 小程序字号不低于 24rpx＝12px（V-02：说明 ≥12px；正文 ≥14px＝28rpx 只提示）
 *   ③ 用到的 var(--ui-xxx) 必须存在于 dist/design-tokens.json（V-03：不发明第二套变量）
 * 用法：
 *   node tools/lint-styles.mjs <文件或目录…> [--spec specs/salesbuddy] [--baseline 基线.json] [--write-baseline 基线.json]
 * 基线：旧文件里已有的违规按「文件 → 每条规则计数」记录；有基线时只报「超过基线」的新增违规，旧债不阻塞增量修改。
 * 退出码：0 无新增违规；1 有违规；2 参数错误。
 */
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, extname, relative } from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const specDir = resolve(opt('--spec') || 'specs/salesbuddy');
const baselineFile = opt('--baseline'); const writeBaseline = opt('--write-baseline');
const targets = args.filter((a, i) => !a.startsWith('--') && !['--spec', '--baseline', '--write-baseline'].includes(args[i - 1]));
if (!targets.length) { console.error('用法：node tools/lint-styles.mjs <文件或目录…> [--spec 规范目录] [--baseline 基线.json]'); process.exit(2); }

const tokensJson = join(specDir, '02-设计变量与同步链路', 'dist', 'design-tokens.json');
const known = new Set(existsSync(tokensJson) ? Object.keys(JSON.parse(readFileSync(tokensJson, 'utf8')).semantic).map((n) => `--ui-${n}`) : []);
const SKIP = /(\/dist\/|\/dist-artifact\.html$|1\.0\.0-使用包快照|\/vendor\/|\/截图\/|node_modules|tokens\.json$|\.min\.)/;
const EXT = new Set(['.css', '.wxss', '.html', '.wxml', '.vue', '.jsx', '.tsx', '.js']);

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) { for (const n of readdirSync(p)) if (n !== 'node_modules' && n !== '.git') walk(join(p, n), out); }
  else if (EXT.has(extname(p)) && !SKIP.test(p.replace(/\\/g, '/'))) out.push(p);
  return out;
}
const files = targets.flatMap((t) => walk(resolve(t)));
const findings = []; // {file, line, rule, msg}
for (const f of files) {
  const rel = relative(process.cwd(), f);
  const text = readFileSync(f, 'utf8');
  const isStyle = /\.(css|wxss)$/.test(f) || /<style/.test(text);
  text.split('\n').forEach((line, i) => {
    if (isStyle || /style=/.test(line)) {
      for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
        if (/^#[0-9a-fA-F]{3,8}$/.test(m[0]) && !/url\(|&#|\/\/|^\s*\/\*/.test(line.slice(Math.max(0, m.index - 6), m.index))) findings.push({ file: rel, line: i + 1, rule: 'V-01', msg: `裸色值 ${m[0]}，应改用 var(--ui-…)（颜色只在 tokens.json 定义）` });
      }
    }
    if (/\.wxss$/.test(f)) {
      for (const m of line.matchAll(/font-size:\s*(\d+(?:\.\d+)?)rpx/g)) {
        const v = parseFloat(m[1]);
        if (v < 24) findings.push({ file: rel, line: i + 1, rule: 'V-02', msg: `字号 ${m[1]}rpx＜24rpx（12px 底线）` });
      }
    }
    for (const m of line.matchAll(/var\((--ui-[a-z0-9-]+)/g)) {
      if (known.size && !known.has(m[1])) findings.push({ file: rel, line: i + 1, rule: 'V-03', msg: `变量 ${m[1]} 不存在于 dist/design-tokens.json，不要发明新变量名` });
    }
  });
}
// 基线：文件 → 规则 → 计数
const count = {};
for (const x of findings) { count[x.file] ??= {}; count[x.file][x.rule] = (count[x.file][x.rule] || 0) + 1; }
if (writeBaseline) { writeFileSync(writeBaseline, JSON.stringify({ $note: '样式检查基线：旧文件已有违规的计数，只报新增；每迁移一页就收缩基线', generatedAt: '按提交记录', files: count }, null, 2) + '\n'); console.log(`已写基线 ${writeBaseline}：${Object.keys(count).length} 个文件`); process.exit(0); }
let baseline = {};
if (baselineFile && existsSync(baselineFile)) baseline = JSON.parse(readFileSync(baselineFile, 'utf8')).files || {};
let newCount = 0;
for (const [file, rules] of Object.entries(count)) for (const [rule, n] of Object.entries(rules)) {
  const base = baseline[file]?.[rule] || 0;
  if (n > base) { newCount += n - base; }
}
const toShow = baselineFile ? findings.filter((x) => (count[x.file][x.rule] > (baseline[x.file]?.[x.rule] || 0))) : findings;
for (const x of toShow.slice(0, 60)) console.log(`${x.file}:${x.line}  [${x.rule}] ${x.msg}`);
if (toShow.length > 60) console.log(`… 还有 ${toShow.length - 60} 条`);
const total = findings.length;
if (baselineFile) console.log(`检查 ${files.length} 个文件：违规 ${total} 处，其中超过基线的新增 ${newCount} 处`);
else console.log(`检查 ${files.length} 个文件：违规 ${total} 处`);
process.exit((baselineFile ? newCount : total) ? 1 : 0);
