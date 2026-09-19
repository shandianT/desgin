#!/usr/bin/env node
/**
 * 规则索引生成器：从规范原文生成机器可读的 rules.json 与给人看的 规则索引.md。
 * 规则文字的维护源仍是原文（1.0.0 快照里的 Web设计规范.md 与 手册正文.md），本脚本只抽取、合并、加来源行号，不改写任何规则。
 * 用法：node tools/build-rules.mjs <规范目录> [--tokens-dir 02-…] [--sample-dir 03-…] [--snapshot-dir 1.0.0-使用包快照]
 *      例：node tools/build-rules.mjs specs/salesbuddy（子目录名默认按 salesbuddy 的布局，其他规范由 check.mjs 按 规范清单.json 传入）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt; };
const specDir = resolve(argv.find((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--')) || 'specs/salesbuddy');
const DIRS = { tokens: opt('--tokens-dir', '02-设计变量与同步链路'), sample: opt('--sample-dir', '03-跨端样板-客户列表到详情'), snapshot: opt('--snapshot-dir', '1.0.0-使用包快照') };
const snap = join(specDir, DIRS.snapshot);
const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
const lines = (file) => readFileSync(file, 'utf8').split('\n');

// 1. 26 条已确认规则（P/V/C/T/B/G）
const rules = [];
const webSpec = join(snap, '依据', 'Web设计规范.md');
lines(webSpec).forEach((line, i) => {
  const m = line.match(/^\| ([PVCTBG]-\d{2})\s+([^|]*)\|/);
  if (!m) return;
  const c = cells(line);
  rules.push({ id: m[1], group: m[1][0], title: m[2].trim(), scene: m[2].trim(), requirement: c[1], examples: c[2], check: c[3], status: '已确认', scope: 'SalesBuddy Web', platforms: [], tokens: [], anchors: [], checks: [], sourceFile: `${DIRS.snapshot}/依据/Web设计规范.md`, sourceLine: i + 1 });
});
// 2. 12 条跨端建议 X-01～X-12
const manual = join(snap, '手册正文.md');
lines(manual).forEach((line, i) => {
  const m = line.match(/^\| (X-\d{2}) \|/);
  if (!m) return;
  const c = cells(line);
  rules.push({ id: m[1], group: 'X', title: c[1], scene: c[1], requirement: c[2], examples: '', check: c[3], status: '建议', scope: '跨端（待样板验证与登记采用）', platforms: [], tokens: [], anchors: [], checks: [], sourceFile: `${DIRS.snapshot}/手册正文.md`, sourceLine: i + 1 });
});
const byId = Object.fromEntries(rules.map((r) => [r.id, r]));
const idsIn = (text) => [...new Set((text.match(/[PVCTBGX]-\d{2}/g) || []))];

// 3. 变量 → 规则（tokens.json 的扩展字段）
const tokensFile = join(specDir, DIRS.tokens, 'tokens.json');
if (existsSync(tokensFile)) {
  const t = JSON.parse(readFileSync(tokensFile, 'utf8'));
  for (const [name, def] of Object.entries(t.ui || {})) {
    if (name.startsWith('$')) continue;
    const rule = def.$extensions?.['cn.sensetime.sales-design']?.rule || '';
    for (const id of idsIn(rule)) byId[id]?.tokens.push(`--ui-${name}`);
  }
}
// 4. 样板部件 → 规则（规则映射表）
const mapFile = join(specDir, DIRS.sample, '规则映射表.md');
if (existsSync(mapFile)) lines(mapFile).forEach((line) => {
  if (!/^\| /.test(line) || /^\| 样板部分|^\|---/.test(line)) return;
  const c = cells(line); if (c.length < 4) return;
  for (const id of idsIn(c[2])) byId[id]?.anchors.push(c[0]);
});
// 5. 验收清单 → 规则
const checkFile = join(snap, '依据', 'Web验收清单.md');
if (existsSync(checkFile)) lines(checkFile).forEach((line) => {
  if (!/^\| /.test(line) || /^\| 检查项|^\|---/.test(line)) return;
  const c = cells(line); if (c.length < 3) return;
  for (const id of idsIn(c[1])) byId[id]?.checks.push(`${c[0]}：${c[2]}`);
});
// 6. 三端对照表：三端做法、结论列、状态列原文；结论归类为 crossKind（统一／适配／引用平台／不分端／未对照）
//    归类只看结论列的字眼：写了「适配」「各端」「按…决定」→ 适配；写了「引用平台」→ 引用平台；只写「统一」→ 统一；B／G 表只有结论列没有三端列 → 不分端。
//    这套划分本身在 01 表头标为「本轮建议」，站点与索引里同样标「建议」。
const kindOf = (text, hasPlatformCols) => { const t = text || ''; if (!t) return '未对照'; if (/适配|各端|决定/.test(t)) return '适配'; if (/引用平台/.test(t)) return '引用平台'; if (/统一/.test(t)) return hasPlatformCols ? '统一' : '不分端'; return '未对照'; };
const cmpFile = join(specDir, '01-三端规则对照表.md');
if (existsSync(cmpFile)) lines(cmpFile).forEach((line, i) => {
  const m = line.match(/^\| ([PVCTBG]-\d{2}) [^|]*\|/); if (!m || !byId[m[1]]) return;
  const c = cells(line); const r = byId[m[1]];
  if (c.length >= 7) { r.platforms = [{ web: c[1], mobileWeb: c[2], miniprogram: c[3], app: c[4] }]; r.crossPlatform = c[5]; r.crossStatus = c[6]; r.crossKind = kindOf(c[5], true); r.crossSourceLine = i + 1; }
  else if (c.length === 3) { r.platforms = []; r.crossPlatform = c[1]; r.crossStatus = c[2]; r.crossKind = kindOf(c[1], false); r.crossSourceLine = i + 1; }
});
for (const r of rules) if (r.group !== 'X' && !r.crossKind) { r.crossKind = '未对照'; r.crossStatus = r.crossStatus || '未对照'; }

const out = { $meta: { generatedFrom: [`${DIRS.snapshot}/依据/Web设计规范.md`, `${DIRS.snapshot}/手册正文.md`, `${DIRS.tokens}/tokens.json`, `${DIRS.sample}/规则映射表.md`, `${DIRS.snapshot}/依据/Web验收清单.md`, '01-三端规则对照表.md'], note: '由 tools/build-rules.mjs 生成，勿手改；规则文字以原文为准，改规则走变更单', confirmed: rules.filter((r) => r.status === '已确认').length, suggested: rules.filter((r) => r.status === '建议').length }, rules };
writeFileSync(join(specDir, 'rules.json'), JSON.stringify(out, null, 2) + '\n');

let md = `# 规则索引（自动生成）\n\n由 \`tools/build-rules.mjs\` 生成，勿手改。已确认 ${out.$meta.confirmed} 条（P／V／C／T／B／G，来自 SalesBuddy Web V1.0），建议 ${out.$meta.suggested} 条（X，跨端）。每条可按「来源」定位到原文行号。「跨端结论」列来自 01-三端规则对照表.md，统一／适配的划分是本轮建议。\n\n| 编号 | 场景 | 要求 | 怎么检查 | 状态 | 跨端结论（建议） | 相关变量 | 样板部件 | 来源 |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rules) md += `| ${r.id} | ${r.scene} | ${r.requirement} | ${r.check} | ${r.status} | ${r.group === 'X' ? '—' : `${r.crossKind}：${r.crossPlatform || '—'}`} | ${r.tokens.join('、') || '—'} | ${[...new Set(r.anchors)].slice(0, 3).join('、') || '—'} | ${r.sourceFile}:${r.sourceLine} |\n`;
writeFileSync(join(specDir, '规则索引.md'), md);
console.log(`规则索引：已确认 ${out.$meta.confirmed} 条，建议 ${out.$meta.suggested} 条 → ${join(specDir, 'rules.json')}、规则索引.md`);
