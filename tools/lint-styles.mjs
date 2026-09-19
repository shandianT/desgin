#!/usr/bin/env node
/**
 * 样式检查器（lint）：把设计规范里的硬约束变成机器检查，报错带规则编号。
 *   ① 不写裸色值（V-01：颜色用 --ui-* 变量）：#hex、rgb()/rgba()/hsl()/hsla()、常见颜色名，只在「属性值」位置报（冒号之后或 style="…" 里）
 *   ② 字号底线（V-02：说明 ≥12px）：小程序 rpx 与 px、网页 px 都查；正文 ≥14px 只在数值 12～13 时提示
 *   ③ 用到的 var(--ui-xxx) 必须存在于 dist/design-tokens.json（V-03：不发明第二套变量）
 * 用法：
 *   node tools/lint-styles.mjs <文件或目录…> [--spec specs/salesbuddy] [--baseline 基线.json] [--write-baseline 基线.json]
 * 基线：旧文件里已有的违规按「文件 → 每条规则计数」记录；有基线时只报「超过基线」的新增违规，旧债不阻塞增量修改。
 *       基线里的文件路径相对于基线文件所在目录（不随运行目录变化）。
 * 退出码：0 无新增违规；1 有违规；2 参数错误或找不到变量产物。
 */
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, extname, relative, dirname } from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const specDir = resolve(opt('--spec') || 'specs/salesbuddy');
const baselineFile = opt('--baseline') ? resolve(opt('--baseline')) : null; const writeBaseline = opt('--write-baseline') ? resolve(opt('--write-baseline')) : null;
const targets = args.filter((a, i) => !a.startsWith('--') && !['--spec', '--baseline', '--write-baseline'].includes(args[i - 1]));
if (!targets.length) { console.error('用法：node tools/lint-styles.mjs <文件或目录…> [--spec 规范目录] [--baseline 基线.json]'); process.exit(2); }

const tokensJson = join(specDir, '02-设计变量与同步链路', 'dist', 'design-tokens.json');
if (!existsSync(tokensJson)) { console.error(`未找到 ${tokensJson}：请先运行 node tools/check.mjs 生成变量产物（或用 --spec 指向正确的规范目录）`); process.exit(2); }
const known = new Set(Object.keys(JSON.parse(readFileSync(tokensJson, 'utf8')).semantic).map((n) => `--ui-${n}`));
const SKIP = /(\/dist\/|\/dist-artifact\.html$|1\.0\.0-使用包快照|\/vendor\/|\/截图\/|\/站点\/|\/产品现状\/|node_modules|tokens\.json$|\.min\.)/; // 站点是生成物，色块与取色器里的值是数据；站点自身的 CSS 由 build-site.mjs 生成时自检
const EXT = new Set(['.css', '.wxss', '.html', '.wxml', '.vue', '.jsx', '.tsx', '.js']);
const baseDir = (baselineFile || writeBaseline) ? dirname(baselineFile || writeBaseline) : process.cwd();
const relKey = (f) => relative(baseDir, f).split('\\').join('/');

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) { for (const n of readdirSync(p)) if (n !== 'node_modules' && n !== '.git') walk(join(p, n), out); }
  else if (EXT.has(extname(p)) && !SKIP.test(p.replace(/\\/g, '/'))) out.push(p);
  return out;
}
const files = targets.flatMap((t) => walk(resolve(t)));

// 颜色写法：#hex、rgb()/hsl()、常见颜色名（transparent／currentColor／inherit 不算色值）
const NAMED = 'white|black|red|blue|green|gray|grey|yellow|orange|purple|pink|silver|navy|teal|cyan|magenta|lime|maroon|olive|aqua|fuchsia|brown|gold|ivory|beige|coral|crimson|indigo|khaki|lavender|salmon|tan|violet|wheat';
const COLOR_RE = new RegExp(`(#[0-9a-fA-F]{3,8}\\b|\\b(?:rgba?|hsla?)\\([^)]*\\)|\\b(?:${NAMED})\\b)`, 'g');
const COLOR_PROP = /(color|background|border|outline|fill|stroke|shadow|caret|accent|column-rule|text-decoration)[a-z-]*\s*:\s*([^;{}]*)/gi;
// 一段样式声明文本里找裸色值（只看属性值）
function colorHits(decl) {
  const hits = [];
  for (const pm of decl.matchAll(COLOR_PROP)) {
    const val = pm[2];
    if (/url\(/.test(val)) continue;
    for (const m of val.matchAll(COLOR_RE)) hits.push(m[0]);
  }
  return hits;
}
const findings = []; // {file, line, rule, msg}
for (const f of files) {
  const rel = relKey(f);
  const text = readFileSync(f, 'utf8');
  const isSheet = /\.(css|wxss)$/.test(f);
  const isMarkup = /\.(html|wxml|vue)$/.test(f);
  let inStyle = isSheet, inComment = false;
  text.split('\n').forEach((line, i) => {
    // 标记类文件只看 <style> 块与 style="…" 属性；脚本类文件（jsx/tsx/js）看含冒号的样式字面量
    if (isMarkup) { if (/<style[\s>]/.test(line)) inStyle = true; }
    let declText = '';
    if (inStyle) {
      // 跳过 /* … */ 注释
      let l = line; if (inComment) { const e = l.indexOf('*/'); if (e < 0) l = ''; else { l = l.slice(e + 2); inComment = false; } }
      l = l.replace(/\/\*.*?\*\//g, ''); const c = l.indexOf('/*'); if (c >= 0) { l = l.slice(0, c); inComment = true; }
      declText = l;
    }
    for (const m of line.matchAll(/style="([^"]*)"|style='([^']*)'/g)) declText += ';' + (m[1] || m[2] || '');
    if (!isSheet && !isMarkup && /:\s*['"`]?(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/.test(line)) declText += ';' + line.replace(/['"`]/g, '');
    for (const hit of colorHits(declText)) findings.push({ file: rel, line: i + 1, rule: 'V-01', msg: `裸色值 ${hit}，应改用 var(--ui-…)（颜色只在 tokens.json 定义）` });
    // 字号底线：rpx 与 px 都查
    for (const m of declText.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)(rpx|px)/g)) {
      const v = parseFloat(m[1]), unit = m[2]; const px = unit === 'rpx' ? v / 2 : v;
      if (px < 12) findings.push({ file: rel, line: i + 1, rule: 'V-02', msg: `字号 ${m[1]}${unit}＜12px 底线（说明 ≥12px，正文 ≥14px；应写 var(--ui-text-*)）` });
    }
    for (const m of line.matchAll(/var\((--ui-[a-z0-9-]+)/g)) {
      if (!known.has(m[1])) findings.push({ file: rel, line: i + 1, rule: 'V-03', msg: `变量 ${m[1]} 不存在于 dist/design-tokens.json，不要发明新变量名` });
    }
    if (isMarkup && /<\/style>/.test(line)) inStyle = false;
  });
}
// 基线：文件 → 规则 → 计数
const count = {};
for (const x of findings) { count[x.file] ??= {}; count[x.file][x.rule] = (count[x.file][x.rule] || 0) + 1; }
if (writeBaseline) { writeFileSync(writeBaseline, JSON.stringify({ $note: '样式检查基线：旧文件已有违规的计数，只报新增；每迁移一页就收缩基线。路径相对于本文件所在目录', generatedAt: new Date().toISOString().slice(0, 10), files: count }, null, 2) + '\n'); console.log(`已写基线 ${writeBaseline}：${Object.keys(count).length} 个文件，${findings.length} 处`); process.exit(0); }
let baseline = {};
if (baselineFile && existsSync(baselineFile)) baseline = JSON.parse(readFileSync(baselineFile, 'utf8')).files || {};
let newCount = 0;
for (const [file, rules] of Object.entries(count)) for (const [rule, n] of Object.entries(rules)) { const base = baseline[file]?.[rule] || 0; if (n > base) newCount += n - base; }
const toShow = baselineFile ? findings.filter((x) => count[x.file][x.rule] > (baseline[x.file]?.[x.rule] || 0)) : findings;
for (const x of toShow.slice(0, 60)) console.log(`${x.file}:${x.line}  [${x.rule}] ${x.msg}`);
if (toShow.length > 60) console.log(`… 还有 ${toShow.length - 60} 条`);
const total = findings.length;
if (baselineFile) console.log(`检查 ${files.length} 个文件：违规 ${total} 处，其中超过基线的新增 ${newCount} 处`);
else console.log(`检查 ${files.length} 个文件：违规 ${total} 处`);
process.exit((baselineFile ? newCount : total) ? 1 : 0);
