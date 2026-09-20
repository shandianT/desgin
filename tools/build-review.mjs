#!/usr/bin/env node
// 把 11、12 两份草稿加对照表生成一页评审稿（HTML，单文件），带真实变量渲染的四象限与色板。用法：node tools/build-review.mjs <输出文件>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = (f) => readFileSync(resolve(root, 'specs/salesbuddy', f), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
const tokens = readFileSync(resolve(root, 'specs/salesbuddy/02-设计变量与同步链路/dist/design-tokens.css'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/［([^］]+)］/g, '<span class="btn">$1</span>');
function md(text) {
  const lines = text.split('\n'); const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^# /.test(l)) { i++; continue; }
    if (/^## /.test(l)) { out.push(`<h2 id="${esc(l.slice(3).replace(/\s/g, ''))}">${inline(l.slice(3))}</h2>`); i++; continue; }
    if (/^### /.test(l)) { out.push(`<h3>${inline(l.slice(4))}</h3>`); i++; continue; }
    if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; } const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()); const head = cells(rows[0]); const body = rows.slice(2).map(cells); out.push(`<div class="tbl"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c, k) => `<td>${k === 0 && body[0].length === 3 && /修改前|现在|修改后/.test(head[0]) ? `<s>${inline(c)}</s>` : inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue; }
    if (/^(\d+)\. /.test(l)) { const items = []; while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++; } out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`); continue; }
    if (/^- /.test(l)) { const items = []; while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i++; } out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`); continue; }
    if (l.trim()) { out.push(`<p>${inline(l)}</p>`); }
    i++;
  }
  return out.join('\n');
}
// 四象限示例：12 个客户，合成数据
const CUST = [['华宸数据科技', 8.6, 8.2, 3, 'good'], ['金桥制造', 9, 7.4, 3, 'bad'], ['泰和银行数据中心', 7.6, 9, 3, 'good'], ['北辰智造集团', 4, 8.4, 3, 'watch'], ['云岭教育', 3.2, 6.8, 2, 'watch'], ['恒信物流', 2.4, 8.8, 2, 'good'], ['南方电力设计院', 8.2, 3.6, 2, 'good'], ['星海传媒', 6.4, 2.2, 1, 'none'], ['嘉禾食品', 7.2, 4.4, 1, 'good'], ['蓝湾科技园', 2.6, 3, 1, 'none'], ['大成律所', 4.6, 1.8, 1, 'watch'], ['启明中学', 1.6, 4.6, 1, 'none']];
const W = 560, H = 480, PAD = 44, PX = (v) => PAD + ((v - 1) / 9) * (W - PAD * 2), PY = (v) => H - PAD - ((v - 1) / 9) * (H - PAD * 2);
const R = { 1: 6, 2: 8, 3: 11 }, TONE = { good: 'var(--ui-success)', watch: 'var(--ui-warning)', bad: 'var(--ui-danger)', none: 'var(--ui-neutral)' };
const mid = PX(5.5), midY = PY(5.5);
const quad = `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="作战地图示例：客户资产 3 家，主攻区 3 家，客户资源 3 家，见单打单 3 家">
  <rect x="${PAD}" y="${PAD}" width="${mid - PAD}" height="${midY - PAD}" fill="var(--q-attack)"/><rect x="${mid}" y="${PAD}" width="${W - PAD - mid}" height="${midY - PAD}" fill="var(--q-asset)"/>
  <rect x="${PAD}" y="${midY}" width="${mid - PAD}" height="${H - PAD - midY}" fill="var(--q-spot)"/><rect x="${mid}" y="${midY}" width="${W - PAD - mid}" height="${H - PAD - midY}" fill="var(--q-resource)"/>
  <rect x="${PAD}" y="${PAD}" width="${W - PAD * 2}" height="${H - PAD * 2}" fill="none" stroke="var(--ui-line)"/>
  <line x1="${mid}" y1="${PAD}" x2="${mid}" y2="${H - PAD}" stroke="var(--ui-line)" stroke-dasharray="4 4"/><line x1="${PAD}" y1="${midY}" x2="${W - PAD}" y2="${midY}" stroke="var(--ui-line)" stroke-dasharray="4 4"/>
  <text x="${PAD + 10}" y="${PAD + 20}" class="qn">主攻区</text><text x="${W - PAD - 10}" y="${PAD + 20}" class="qn" text-anchor="end">客户资产</text><text x="${PAD + 10}" y="${H - PAD - 10}" class="qn">见单打单</text><text x="${W - PAD - 10}" y="${H - PAD - 10}" class="qn" text-anchor="end">客户资源</text>
  <text x="${PAD}" y="${H - 14}" class="ax">潜力小</text><text x="${W - PAD}" y="${H - 14}" class="ax" text-anchor="end">潜力大</text>
  <text x="14" y="${H - PAD}" class="ax" transform="rotate(-90 14 ${H - PAD})">关系浅</text><text x="14" y="${PAD + 40}" class="ax" transform="rotate(-90 14 ${PAD + 40})">关系深</text>
  ${CUST.map(([n, p, r, s, t]) => `<g class="pt"><circle cx="${PX(p)}" cy="${PY(r)}" r="${R[s]}" fill="${TONE[t]}" stroke="var(--ui-surface)" stroke-width="2"><title>${n} · 关系 ${r}/10 · 潜力 ${p}/10</title></circle></g>`).join('')}
  <g class="lab"><text x="${PX(8.6) - 16}" y="${PY(8.2) + 4}" text-anchor="end">华宸数据科技 · 关系 8/10 · 预算 320 万</text></g>
</svg>
<div class="maplegend"><span><i style="background:var(--ui-success)"></i>向好</span><span><i style="background:var(--ui-warning)"></i>需关注</span><span><i style="background:var(--ui-danger)"></i>转差</span><span><i style="background:var(--ui-neutral)"></i>待评估</span><span class="sep">点的大小 = 潜力三档</span><span class="miss">待评估 3 家，还没登记潜力 ›</span></div>`;
const bars = [['7 月', 180, 150], ['8 月', 240, 200], ['9 月', 320, 260]];
const bar = `<svg class="chart" viewBox="0 0 420 220" role="img" aria-label="毛利示例：本季三个月与上季对比"><g class="grid">${[0, 1, 2, 3].map((k) => `<line x1="40" x2="400" y1="${170 - k * 45}" y2="${170 - k * 45}"/>`).join('')}</g>${[0, 1, 2, 3].map((k) => `<text class="ax" x="34" y="${174 - k * 45}" text-anchor="end">${k * 120}</text>`).join('')}${bars.map(([m, a, b], k) => `<rect x="${70 + k * 110}" y="${170 - a / 360 * 135}" width="34" height="${a / 360 * 135}" fill="var(--ui-chart-1)"/><rect x="${108 + k * 110}" y="${170 - b / 360 * 135}" width="34" height="${b / 360 * 135}" fill="var(--ui-chart-5)"/><text class="ax" x="${106 + k * 110}" y="192" text-anchor="middle">${m}</text><text class="val" x="${87 + k * 110}" y="${164 - a / 360 * 135}" text-anchor="middle">${a}</text>`).join('')}<text class="ax" x="400" y="210" text-anchor="end">单位：万元</text></svg>
<div class="maplegend"><span><i style="background:var(--ui-chart-1)"></i>本季</span><span><i style="background:var(--ui-chart-5)"></i>上季</span></div>`;
const tiles = `<div class="tiles"><div class="tile"><b>320<small>万</small></b><span>本季毛利</span><em class="up">比上季 +23%</em></div><div class="tile"><b>24<small>家</small></b><span>客户</span><em>比上季 +2 家</em></div><div class="tile"><b class="miss">未登记</b><span>回款</span><em>财务还没登记</em></div><div class="tile"><b>70<small>%</small></b><span>赢单概率</span><em class="down">比上季 −10%</em></div></div>`;
const pal = `<div class="pal">${[['--ui-chart-1', '#2863CD', '第一系列、本期'], ['--ui-chart-2', '#0E8A8A', '第二系列'], ['--ui-chart-3', '#6B4FBB', '第三系列'], ['--ui-chart-4', '#C7741B', '第四系列'], ['--ui-chart-5', '#7A8A9E', '第五系列、上期、其他']].map(([v, h, u]) => `<div><i style="background:${h}"></i><code>${v}</code><small>${h} · ${u}</small></div>`).join('')}</div>`;
const copy = spec('11-文案规范.md'), diff = spec('11-文案规范-对照表.md'), chart = spec('12-图表规范.md');
const chartHtml = md(chart).replace('<h2 id="2｜作战地图（四象限）">', `<h2 id="示例">先看示例</h2><p>下面两张是按本规范用真实变量画的，数据是编的。作战地图的示例先不放，等图表规范定稿后再按最终样式画。</p><div class="demo two"><div><h4>看板指标卡</h4>${tiles}</div><div><h4>柱状图：本季对上季</h4>${bar}</div></div><div class="demo"><h4>顺序色</h4>${pal}</div><h2 id="2｜作战地图（四象限）">`);
const html = `<title>文案与图表规范评审稿</title>
<meta name="description" content="部门产品设计规范第 11、12 章第一版：文案规范、修改前后对照、图表规范，供负责人评审">
<style>
${tokens}
:root { --q-asset: color-mix(in srgb, var(--ui-primary) 12%, var(--ui-surface)); --q-attack: color-mix(in srgb, var(--ui-primary) 6%, var(--ui-surface)); --q-resource: color-mix(in srgb, var(--ui-neutral) 8%, var(--ui-surface)); --q-spot: var(--ui-surface); --ui-chart-1: #2863CD; --ui-chart-2: #0E8A8A; --ui-chart-3: #6B4FBB; --ui-chart-4: #C7741B; --ui-chart-5: #7A8A9E; --ink: var(--ui-ink); --paper: var(--ui-background); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ui-background: #0F1826; --ui-surface: #17233A; --ui-ink: #E6ECF5; --ui-secondary: #A6B4C8; --ui-muted: #8493A9; --ui-line: #2A3A55; --ui-selected: #1E3358; --ui-success-soft: #173427; --ui-warning-soft: #3A2E14; --ui-danger-soft: #3D1F1D; --ui-neutral-soft: #24304A; --q-spot: var(--ui-surface); } }
:root[data-theme="dark"] { --ui-background: #0F1826; --ui-surface: #17233A; --ui-ink: #E6ECF5; --ui-secondary: #A6B4C8; --ui-muted: #8493A9; --ui-line: #2A3A55; --ui-selected: #1E3358; --ui-success-soft: #173427; --ui-warning-soft: #3A2E14; --ui-danger-soft: #3D1F1D; --ui-neutral-soft: #24304A; }
body { background: var(--ui-background); color: var(--ui-ink); font: 15px/1.7 var(--ui-font-family, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif); margin: 0; }
.wrap { max-width: 920px; margin: 0 auto; padding-block: 24px 64px; padding-inline: 16px; }
header.top { display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: baseline; border-bottom: 1px solid var(--ui-line); padding-bottom: 16px; margin-bottom: 8px; }
header.top h1 { font-size: 26px; margin: 0; text-wrap: balance; } header.top small { color: var(--ui-secondary); }
nav.tabs { position: sticky; top: env(safe-area-inset-top, 0px); background: var(--ui-background); display: flex; gap: 4px; padding: 8px 0; z-index: 2; border-bottom: 1px solid var(--ui-line); margin-bottom: 16px; overflow-x: auto; }
nav.tabs a { padding: 6px 12px; border-radius: 999px; color: var(--ui-secondary); text-decoration: none; white-space: nowrap; } nav.tabs a:hover, nav.tabs a:focus-visible { background: var(--ui-selected); color: var(--ui-primary); outline: none; }
section { scroll-margin-top: 64px; } section + section { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--ui-line); }
h2 { font-size: 20px; margin: 32px 0 8px; } h3 { font-size: 16px; margin: 20px 0 6px; } h4 { margin: 0 0 8px; font-size: 14px; color: var(--ui-secondary); font-weight: 600; }
p { margin: 8px 0; max-width: 72ch; } .lead { color: var(--ui-secondary); max-width: 72ch; }
ol, ul { padding-left: 1.4em; } li { margin: 4px 0; }
code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; background: var(--ui-neutral-soft); padding: 1px 5px; border-radius: 4px; }
.tbl { overflow-x: auto; margin: 8px 0 16px; } table { border-collapse: collapse; width: 100%; font-size: 14px; } th, td { text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid var(--ui-line); } th { color: var(--ui-secondary); font-weight: 600; font-size: 13px; }
td s { text-decoration: line-through; text-decoration-color: var(--ui-danger); color: var(--ui-secondary); }
.btn { display: inline-block; border: 1px solid var(--ui-primary); color: var(--ui-primary); border-radius: 6px; padding: 0 8px; font-size: 13px; line-height: 22px; }
.status { display: inline-block; background: var(--ui-warning-soft); color: var(--ui-warning); border-radius: 999px; padding: 2px 10px; font-size: 13px; }
.demo { background: var(--ui-surface); border: 1px solid var(--ui-line); border-radius: 12px; padding: 16px; margin: 12px 0; } .demo.two { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; } @media (max-width: 640px) { .demo.two { grid-template-columns: 1fr; } }
.map { width: 100%; max-width: 560px; height: auto; display: block; } .map .qn { font-size: 14px; font-weight: 600; fill: var(--ui-secondary); } .map .ax { font-size: 12px; fill: var(--ui-muted); } .map .lab text { font-size: 12px; fill: var(--ui-ink); } .pt circle:hover { stroke: var(--ui-focus); stroke-width: 3; }
.chart { width: 100%; height: auto; } .chart .grid line { stroke: var(--ui-line); } .chart .ax { font-size: 12px; fill: var(--ui-muted); } .chart .val { font-size: 12px; fill: var(--ui-ink); }
.maplegend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: var(--ui-secondary); margin-top: 8px; align-items: center; } .maplegend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; } .maplegend .sep { margin-left: auto; } .maplegend .miss { color: var(--ui-primary); }
.tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; } .tile { border: 1px solid var(--ui-line); border-radius: 12px; padding: 12px 14px; } .tile b { display: block; font-size: 32px; line-height: 1.2; color: var(--ui-primary); font-variant-numeric: tabular-nums; font-weight: 650; } .tile b small { font-size: 14px; margin-left: 2px; color: var(--ui-secondary); font-weight: 500; } .tile b.miss { color: var(--ui-muted); font-size: 22px; font-weight: 500; line-height: 1.75; } .tile span { display: block; font-size: 14px; } .tile em { font-style: normal; font-size: 12px; color: var(--ui-muted); } .tile em.up { color: var(--ui-success); } .tile em.down { color: var(--ui-danger); }
.pal { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; } .pal i { display: block; height: 40px; border-radius: 6px; margin-bottom: 6px; } .pal small { display: block; color: var(--ui-muted); font-size: 12px; }
.ask { background: var(--ui-selected); border-left: 3px solid var(--ui-primary); border-radius: 6px; padding: 10px 14px; margin: 16px 0; }
@media (prefers-reduced-motion: no-preference) { .pt circle { transition: stroke-width .15s; } }
</style>
<div class="wrap">
<header class="top"><h1>文案与图表规范评审稿</h1><small>部门产品设计规范 · 第 11、12 章 · 第一版 · 2026-09-20</small></header>
<p class="lead">三部分：文案规范讲界面上的字怎么写；对照表把小程序 v1.0.6 里现在的文案和改法一行一行摆在一起；图表规范讲作战地图和看板怎么画。都是草稿，对过之后走变更单转正。看的时候在不同意的行旁边写理由就行。</p>
<div class="ask"><b>要拍板的几件事</b><ol><li>按钮上不再出现「确定」「提交」，一律写动作。</li><li>「跟进」改叫「拜访」，「待办」改叫「任务」，全产品替换。</li><li>提示语不用「请」开头，不用感叹号。</li><li>作战地图的四个格子用深浅分，不用红黄绿；点的颜色才表示状态。</li><li>没登记潜力的客户不进格子，另列「待评估 N 家」。</li></ol></div>
<nav class="tabs"><a href="#copy">文案规范</a><a href="#diff">修改前后对照</a><a href="#chart">图表规范</a><a href="#示例">图表示例</a></nav>
<section id="copy"><h2 style="font-size:24px;margin-top:0">一、文案规范 <span class="status">草稿</span></h2>${md(copy)}</section>
<section id="diff"><h2 style="font-size:24px;margin-top:0">二、修改前 → 修改后 <span class="status">草稿</span></h2>${md(diff)}</section>
<section id="chart"><h2 style="font-size:24px;margin-top:0">三、图表规范 <span class="status">草稿</span></h2>${chartHtml}</section>
</div>`;
writeFileSync(process.argv[2] || resolve(root, 'specs/salesbuddy/站点/评审稿-文案与图表.html'), html);
console.error(`评审稿 → ${process.argv[2] || '站点/评审稿-文案与图表.html'}（${(html.length / 1024).toFixed(0)} KB）`);
