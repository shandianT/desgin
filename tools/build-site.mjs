#!/usr/bin/env node
/**
 * 可视化规范站生成器（零依赖）。
 * 输入（全部是仓库内的源或生成物，本脚本不手写任何规则、CSS 不含任何字面色值）：
 *   rules.json、02/dist/design-tokens.json、02/tokens.json（$meta）、02/产品现状/miniprogram-app.json（tools/sync-product.mjs 同步的快照）、
 *   03/验收结果.json、03/截图/、1.0.0/模板/*.md、采用登记表.md、01-三端规则对照表.md、
 *   packages/ui-react/src/meta.js（组件说明表）、<站点目录>/组件库/index.html（组件库目录页，由 packages/ui-react 构建，没构建就提示命令）
 * 输出：<规范目录>/<站点目录>/index.html（相对引用样板、变量 CSS、截图、组件库）
 *      --portable <目录>：把站点与依赖复制成可独立发布的一份（GitHub Pages、claude.ai、U 盘），--artifact 再去掉 html 外壳
 * 用法：node tools/build-site.mjs specs/salesbuddy [--tokens-dir 02-…] [--sample-dir 03-…] [--snapshot-dir 1.0.0-…] [--site-dir 站点] [--portable out/site] [--artifact]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const usage = () => { console.error('用法：node tools/build-site.mjs <规范目录> [--tokens-dir 目录] [--sample-dir 目录] [--snapshot-dir 目录] [--site-dir 目录] [--portable <输出目录>] [--artifact]'); process.exit(2); };
const OPT = { '--tokens-dir': '02-设计变量与同步链路', '--sample-dir': '03-跨端样板-客户列表到详情', '--snapshot-dir': '1.0.0-使用包快照', '--site-dir': '站点', '--portable': null };
let specArg = null, artifact = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--artifact') artifact = true;
  else if (a in OPT) { if (!argv[i + 1] || argv[i + 1].startsWith('--')) usage(); OPT[a] = argv[++i]; }
  else if (a.startsWith('--')) usage();
  else specArg = specArg || a;
}
const specDir = resolve(specArg || 'specs/salesbuddy');
const D = { tokens: OPT['--tokens-dir'], sample: OPT['--sample-dir'], snap: OPT['--snapshot-dir'], site: OPT['--site-dir'] };
const portable = OPT['--portable'] ? resolve(OPT['--portable']) : null;
const R = (p) => readFileSync(join(specDir, p), 'utf8');
const J = (p) => JSON.parse(R(p));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');

// ---------- 读源 ----------
const rules = J('rules.json');
const tokens = J(`${D.tokens}/dist/design-tokens.json`);
const tokensMeta = J(`${D.tokens}/tokens.json`).$meta;
const acceptFile = `${D.sample}/验收结果.json`;
const accept = existsSync(join(specDir, acceptFile)) ? J(acceptFile) : { total: 0, passed: 0, failed: 0, checkedAt: '' };
const shotsDir = join(specDir, D.sample, '截图');
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => f.endsWith('.png')).sort() : [];
const templates = ['01-任务单', '02-规则变更单', '03-页面验收单', '04-产品采用登记表'].map((n) => ({ name: n, md: R(`${D.snap}/模板/${n}.md`) }));
const register = R('采用登记表.md');
const cmp = R('01-三端规则对照表.md');
const specVersion = tokensMeta.version;
const cells = (line) => line.split('|').slice(1, -1).map((s) => s.trim());

// 采用登记表：## 1 产品行、## 2 决策表、## 3 下一步
const decisions = [], products = [], nextSteps = [];
{ let sec = ''; for (const line of register.split('\n')) {
  const h = line.match(/^## (\d)/); if (h) { sec = h[1]; continue; }
  if (sec === '1' && /^\| /.test(line) && !/^\| 产品／终端|^\|---/.test(line)) { const c = cells(line); if (c.length >= 9) products.push({ name: c[0], version: c[1], received: c[2], scope: c[3], owner: c[4], evidence: c[6], gaps: c[7], next: c[8] }); }
  if (sec === '2' && /^\| /.test(line) && !/^\| 事项|^\|---/.test(line)) { const c = cells(line); if (c.length >= 4) decisions.push({ item: c[0], who: c[1], impact: c[2], status: c[3] }); }
  if (sec === '3') { const m = line.match(/^\d+\.\s+(.+)$/); if (m) nextSteps.push(m[1]); }
} }
const decided = decisions.filter((d) => /^已决定/.test(d.status)), pending = decisions.filter((d) => !/^已决定/.test(d.status));
const mpProduct = products.find((p) => /小程序/.test(p.name));
// X 规则的样板验证结果（01 章 3.7 表）
const xVerify = {}; for (const line of cmp.split('\n')) { const m = line.match(/^\| (X-\d{2}) ([^|]*)\| ([^|]*)\| ([^|]*)\|/); if (m) xVerify[m[1]] = { sample: m[3].trim(), device: m[4].trim() }; }
// 小程序原生颜色：只读仓库内快照（由 tools/sync-product.mjs 同步），保证任何机器生成结果一致
let appDiff = null, appSnap = null;
{ const snapFile = `${D.tokens}/产品现状/miniprogram-app.json`;
  if (existsSync(join(specDir, snapFile))) {
    appSnap = J(snapFile); const frag = J(`${D.tokens}/dist/miniprogram-app.tokens.json`); appDiff = [];
    for (const sec of ['window', 'tabBar']) for (const [k, v] of Object.entries(frag[sec] || {})) { if (!/^#/.test(String(v))) continue; const cur = appSnap[sec]?.[k]; appDiff.push({ key: `${sec}.${k}`, cur: String(cur ?? '未设置'), spec: String(v), same: String(cur).toLowerCase() === String(v).toLowerCase() }); }
  } }
const appMismatch = appDiff ? appDiff.filter((d) => !d.same).length : null;

const byGroup = (g) => rules.rules.filter((r) => r.group === g);
const ruleById = Object.fromEntries(rules.rules.map((r) => [r.id, r]));
const PL = { web: '电脑网页', 'mobile-web': '手机网页', miniprogram: '小程序' };
const sem = Object.entries(tokens.semantic).map(([name, t]) => ({ name, css: `--ui-${name}`, ...t, platforms: Object.fromEntries(Object.entries(tokens.platforms).map(([p, m]) => [p, m[name]])) }));
const colorTokens = sem.filter((t) => t.type === 'color');
const dimTokens = sem.filter((t) => t.type === 'dimension');
const confirmedTokens = sem.filter((t) => t.status === '已确认').length, suggestedTokens = sem.length - confirmedTokens;
const overrideCount = sem.filter((t) => new Set(Object.keys(PL).map((p) => t.platforms[p])).size > 1).length;

// ---------- 路径 ----------
const P = portable ? { sample: 'sample/index.html', tokensCss: 'sample/design-tokens.css', shots: 'shots/', lib: 'lib/index.html' } : { sample: `../${D.sample}/index.html`, tokensCss: `../${D.tokens}/dist/design-tokens.css`, shots: `../${D.sample}/截图/`, lib: '组件库/index.html' };

// ---------- 极简 Markdown 渲染（模板与说明用） ----------
function md(text) {
  const lines = text.replace(/^---\n[\s\S]*?\n---\n/, '').split('\n'); let out = '', i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { if (!/^\|\s*-/.test(lines[i])) rows.push(cells(lines[i])); i++; } out += '<div class="tbl"><table>' + rows.map((r, ri) => '<tr>' + r.map((c) => (ri ? '<td>' : '<th>') + inline(c) + (ri ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</table></div>'; continue; }
    if (/^#+ /.test(l)) { const lv = l.match(/^#+/)[0].length; out += `<h${Math.min(lv + 2, 5)}>${inline(l.replace(/^#+ /, ''))}</h${Math.min(lv + 2, 5)}>`; i++; continue; }
    if (/^[-*] /.test(l)) { out += '<ul>'; while (i < lines.length && /^[-*] /.test(lines[i])) { out += '<li>' + inline(lines[i].slice(2)) + '</li>'; i++; } out += '</ul>'; continue; }
    if (/^\d+\. /.test(l)) { out += '<ol>'; while (i < lines.length && /^(\d+\. |   )/.test(lines[i])) { if (/^\d+\. /.test(lines[i])) out += (out.endsWith('<ol>') ? '' : '</li>') + '<li>' + inline(lines[i].replace(/^\d+\. /, '')); else out += '<br>' + inline(lines[i].trim()); i++; } out += '</li></ol>'; continue; }
    if (/^> /.test(l)) { out += '<blockquote>' + inline(l.slice(2)) + '</blockquote>'; i++; continue; }
    if (l.trim() === '') { i++; continue; }
    out += '<p>' + inline(l) + '</p>'; i++;
  }
  return out;
}

// 只取一份 Markdown 里标题匹配的若干节（## 开头）
function mdSections(text, re) { const body = text.replace(/^---\n[\s\S]*?\n---\n/, ''); const parts = body.split(/\n(?=## )/); return parts.filter((p) => re.test(p.split('\n')[0])).join('\n'); }
const ecoDoc = existsSync(join(specDir, '05-组件生态选型.md')) ? R('05-组件生态选型.md') : '';
// 组件库目录页（packages/ui-react 构建到 <站点>/组件库/）与组件说明（src/meta.js）
const libDir = join(specDir, D.site, '组件库');
const hasLib = existsSync(join(libDir, 'index.html'));
const metaFile = resolve(specDir, '..', '..', 'packages', 'ui-react', 'src', 'meta.js');
const LIB_META = existsSync(metaFile) ? (await import(pathToFileURL(metaFile).href)).META : [];

// ---------- 片段 ----------
const STATUS_CLASS = { '已确认': 'ok', '建议': 'warn', '业务事实': 'fact', '已验证（本地）': 'local', '未验证': 'none' };
const badge = (s) => `<span class="st st-${STATUS_CLASS[s] || 'none'}">${esc(s)}</span>`;
const firstClause = (s) => String(s || '').split(/[；。]/)[0];
const seenIds = {};
function ruleCard(r, { open = false, extra = '' } = {}) {
  seenIds[r.id] = (seenIds[r.id] || 0) + 1; const id = seenIds[r.id] === 1 ? `rule-${r.id}` : `rule-${r.id}-${seenIds[r.id]}`; // 同一条规则出现在多章时 id 不重复；搜索与锚点按 data-id 找第一处
  const anchors = [...new Set(r.anchors)].slice(0, 4);
  return `<details class="card rule" id="${id}" data-id="${r.id}"${open ? ' open' : ''}><summary><span class="rid">${r.id}</span><span class="rtitle"><span>${esc(r.scene)}</span><small class="rreq">${esc(firstClause(r.requirement))}</small></span>${badge(r.status)}</summary>
  <div class="rbody"><p class="req">${esc(r.requirement)}</p>
  ${r.examples ? `<p><b>正确示例／反例</b>　${esc(r.examples)}</p>` : ''}
  <p><b>怎么检查</b>　${esc(r.check)}</p>
  ${r.tokens.length ? `<p><b>相关变量</b>　${r.tokens.map((t) => `<code>${esc(t)}</code>`).join(' ')}</p>` : ''}
  ${anchors.length ? `<p><b>样板部件</b>　${anchors.map(esc).join('、')}</p>` : ''}
  ${r.origin ? `<p><b>来自哪几家</b>　${esc(r.origin)}</p>` : ''}
  ${/[PVCTBG]/.test(r.group) && r.crossKind ? `<p><b>跨端结论</b>　${esc(r.crossKind)}：${esc(r.crossPlatform || '—')}　<small>（统一还是适配的划分还是建议，见 01 章）</small></p>` : ''}
  ${extra}
  <p class="src">来源：${esc(r.sourceFile)}:${r.sourceLine}${r.status === '建议' ? '　（跨端建议，待登记采用）' : ''}</p></div></details>`;
}
const cards = (ids, openFirst = false) => ids.map((id) => ruleById[id]).filter(Boolean).map((r, i) => ruleCard(r, { open: openFirst && i === 0 })).join('');
const factCard = (title, body, src, vars = [], n = 0) => `<details class="card rule fact"><summary><span class="rid">${n ? `原则 ${n}` : '原则'}</span><span class="rtitle"><span>${esc(title)}</span></span>${badge('业务事实')}</summary><div class="rbody"><p class="req">${esc(body)}</p>${vars.length ? `<p><b>相关变量</b>　${vars.map((v) => `<code>${esc(v)}</code>`).join(' ')}</p>` : ''}<p class="src">来源：${esc(src)}</p></div></details>`;
// 产品原则：逐字引用产品仓库 CLAUDE.md「必须遵守的产品原则」（业务事实，不是设计规则）
const PRINCIPLES = [
  ['以客户为核心，不以订单或商机为核心。', '客户下面挂商机、拜访、毛利、合同。一个客户可有多条商机。', 43],
  ['销售不手工打分、不填复杂表单。', '语音口述拜访 → Agent 结构化 → 人工确认归档；象限、风险、画像由 Agent 依据已确认事实重算，不可手工拖动或改分。', 44],
  ['四条不可破坏：同一对象、同一事实、统一权限、关键动作可确认可追溯。', '客户、商机在各端是同一条记录；同一件事只有一个事实来源；权限规则各端一致；归档、下发这类关键动作要有人确认并留下记录。', 45],
  ['Agent 只生成草稿和洞察；写入正式业务表必须经人工确认。', 'Tool 分 Read / Draft / Command / External 四类，Agent 不直连数据库。', 46],
  ['产品核心 / 产品配置 / 项目定制三层分开。', '神码专属内容走定制或配置，不改跟进记录逻辑与三张表（客户表、商机表、跟进记录表）。', 47],
  ['权限由服务端判定，数据库行级权限兜底。', '销售看本人，主管看直属团队，总经理看授权部门，董事长只读核心客户。界面不能靠隐藏按钮来做权限。', 48],
  ['对客文案使用中文全角标点；正文字号不小于 14px，卡片说明不小于 12px。', '（本条直接决定 --ui-text-body 与 --ui-text-small 的底线。）', 49, ['--ui-text-body', '--ui-text-small']],
];
const principleCards = PRINCIPLES.map(([t, b, line, vars], i) => factCard(t, b, `产品仓库 shandianT/xiaoshouguanli CLAUDE.md:${line}「必须遵守的产品原则」`, vars || [], i + 1)).join('');

// 产品里的状态标签用 .tag（业务状态），与站点的证据状态词 .st 分开。视觉基础章的预览和跨端章的比对列用它
const tag = (cls, text) => `<span class="tag ${cls}">${text}</span>`;

// 组件章：组件库目录页就是章节本体。Web 组件与小程序组件的对应关系，来自 08-组件清单.md 第 3 节
const MP_OF = { SbStatusTag: 'sb-status-tag', SbStatePanel: 'sb-state-panel', SbFilterBar: 'sb-filter-bar', SbSearch: 'sb-search', SbListRow: 'sb-list-row', SbBottomBar: 'sb-bottom-bar', SbField: 'sb-field', SbSheet: 'sb-sheet', SbPagination: 'sb-pagination', SbMetricTile: 'sb-metric-tile', SbPageHeader: 'sb-page-header', SbAiBadge: 'sb-ai-badge', SbAiField: 'sb-ai-field', SbAiSources: 'sb-ai-sources', SbAiProgress: 'sb-ai-progress', SbProvider: 'app.wxss 两行 import', SbDetailLayout: '不适用，小程序用 navigateTo', Basics: 't-* 直接用' };
const mpName = (id) => { const v = MP_OF[id] || '—'; return /^sb-/.test(v) ? `<code>${esc(v)}</code>` : esc(v); };
const BUILD_CMD = 'cd packages/ui-react && npm i --legacy-peer-deps && npm run build';
const libFrame = hasLib
  ? `<div class="card libcard"><div class="ph"><a class="btn sec" href="${P.lib}" target="_blank" rel="noopener">新窗口打开</a><small>小程序版浏览器里看不到。用微信开发者工具打开 packages/ui-miniprogram，首页从上到下排开 15 个组件的每个状态</small></div><iframe class="frame lib" title="组件库目录" src="${P.lib}" loading="lazy"></iframe></div>`
  : `<div class="card"><p class="note">组件库还没构建：<code>${BUILD_CMD}</code>。构建后重新生成站点，这里就是可以直接点的组件库。</p></div>`;
const libTable = LIB_META.length
  ? `<div class="card"><h2>组件说明表</h2><p class="note">上面目录页里每个组件对应这里一行：叫什么、在两端各叫什么、做什么、依据哪条规则、有哪些状态。</p><div class="tbl"><table class="libmeta"><tr><th>组件</th><th>Web 组件</th><th>小程序组件</th><th>做什么</th><th>规则</th><th>状态</th></tr>${LIB_META.map((m) => `<tr><td class="idc"><b>${esc(m.name)}</b></td><td><code>${esc(m.id)}</code></td><td>${mpName(m.id)}</td><td>${esc(m.purpose)}<br><small>用在：${esc(m.pages)}</small></td><td>${m.rules.map(esc).join('、')}</td><td>${m.states.map(esc).join('、')}</td></tr>`).join('')}</table></div><p class="src">来源：packages/ui-react/src/meta.js。清单依据 08-组件清单.md。</p></div>`
  : '';

// 跨端表：分类来自 rules.json 的 crossKind（由 01 表结论列归类，划分本身是建议）；状态列保留 01 表原文
const crossBadges = (raw) => { const b = []; if (/已确认/.test(raw)) b.push(badge('已确认')); if (/验证（本地）|已验证/.test(raw)) b.push(badge('已验证（本地）')); if (/建议/.test(raw)) b.push(badge('建议')); if (!b.length) b.push(badge('未验证')); return b.join(' '); };
const crossRows = rules.rules.filter((r) => /[PVCTBG]/.test(r.group)).map((r) => {
  const p = r.platforms[0]; const kind = r.crossKind || '未对照';
  const plat = p ? `<td>${esc(p.web)}</td><td>${esc(p.mobileWeb)}</td><td>${esc(p.miniprogram)}</td>` : `<td colspan="3" class="span">不分端：业务口径或流程，三端同一句话</td>`;
  return `<tr data-kind="${esc(kind)}" data-text="${esc(r.id + ' ' + r.scene)}"><td class="idc"><b>${r.id}</b><br><small>${esc(r.scene)}</small></td>${plat}<td><span class="kind">${esc(kind)}</span>${esc(r.crossPlatform || '')}</td><td>${crossBadges(r.crossStatus || '')}<br><small>${esc(r.crossStatus || '')}</small></td></tr>`; }).join('');
const xRows = byGroup('X').map((r) => `<tr data-kind="建议" data-text="${esc(r.id + ' ' + r.scene)}"><td class="idc"><b>${r.id}</b><br><small>${esc(r.scene)}</small></td><td colspan="3">${esc(r.requirement)}</td><td>${esc(xVerify[r.id]?.sample || '—')}<br><small>真机：${esc(xVerify[r.id]?.device || '未验证')}</small></td><td>${badge('建议')}</td></tr>`).join('');
const KINDS = ['统一', '适配', '引用平台', '不分端'];
const varRows = sem.map((t) => { const vals = Object.keys(PL).map((p) => t.platforms[p]); const diff = new Set(vals).size > 1; return `<tr class="${diff ? 'diff' : ''}"><td class="idc"><code>${esc(t.css)}</code><br><small>${esc(t.description)}</small></td>${vals.map((v, i) => `<td>${t.type === 'color' ? `<i class="sw" style="background:${esc(v)}"></i>` : ''}${esc(t.type === 'fontFamily' ? '系统字体' : v)}${diff && i > 0 && v !== vals[0] ? '<small>（建议）</small>' : ''}</td>`).join('')}<td>${badge(t.status || '建议')}${diff ? ' ' + badge('建议') + '<br><small>端侧覆盖为建议</small>' : ''}</td></tr>`; }).join('');

// 截图画廊：视口 × 详情
const VPS = ['1440', '1366', '1024', '900', '760', '600', '390', '320'];
const tierOf = (w) => (w > 900 ? '电脑 >900' : w > 600 ? '收紧 601～900' : '手机 ≤600');
const gallery = VPS.filter((v) => shots.includes(`${v}-详情.png`)).map((v) => `<figure><a href="${P.shots}${v}-详情.png" target="_blank" rel="noopener"><img loading="lazy" src="${P.shots}${v}-详情.png" alt="${v} 宽详情"></a><figcaption>${v}px · ${tierOf(Number(v))}</figcaption></figure>`).join('');

// 变量面板：颜色分组，描述留在 DOM 里供搜索但不显示
const groupOf = (n) => /sidebar|on-primary|overlay/.test(n) ? '导航与遮罩' : /danger|warning|success|neutral/.test(n) ? '业务状态色' : '基础色';
const tkRow = (t, input) => `<label class="tk">${input}<code>${esc(t.css)}</code><span class="desc">${esc(t.description)}</span>${badge(t.status || '建议')}</label>`;
const panelRows = ['基础色', '业务状态色', '导航与遮罩'].map((g) => `<h4>${g}</h4>` + colorTokens.filter((t) => groupOf(t.name) === g).map((t) => tkRow(t, `<input type="color" data-token="${esc(t.css)}" value="${esc(t.value.slice(0, 7))}">`)).join('')).join('');
const dimRows = dimTokens.filter((t) => /text-|space-|radius|height/.test(t.name)).map((t) => tkRow(t, `<input type="number" min="0" max="64" data-token="${esc(t.css)}" data-unit="px" value="${parseFloat(t.value)}">`)).join('');
const typeScale = sem.filter((t) => /^text-/.test(t.name)).map((t) => `<div class="ts"><span style="font-size:var(${t.css})">${esc(t.description)}：客户经营详情</span><code>${esc(t.css)} · ${esc(t.value)}</code></div>`).join('');
const spaceScale = sem.filter((t) => /^space-\d/.test(t.name)).map((t) => `<div class="ss"><i style="width:var(${t.css})"></i><code>${esc(t.css)} · ${esc(t.value)}</code><span>${esc(t.description)}</span></div>`).join('');

// 流程图（团队）：内容来自 04 章（建议）
const FLOW = [
  { k: 'issue', t: '发现问题', d: '规则不够用、页面有偏差、要换颜色或间距。先查规则索引里有没有现成规则。', tpl: '01-任务单' },
  { k: 'change', t: '填变更单', d: '当前规则 → 实际问题 → 候选改法 → 受影响页面 → 如何验证。', tpl: '02-规则变更单' },
  { k: 'pr', t: '开 PR 改四样', d: 'PR 就是在 Git 上提交一次修改申请。规则条目、样例或变量、代码或接入说明、验收项一起改。规则索引和 AI 技能引用由 node tools/check.mjs 自动刷新。' },
  { k: 'review', t: '评审', d: '设计负责人和产品负责人各一人。check.mjs --ci 必须通过。' },
  { k: 'tag', t: '合并 · 打标签', d: '语义化版本。只改值升修订号。新增兼容规则或变量升次版本。改含义、默认样式、导航约定升主版本，附迁移说明。' },
  { k: 'adopt', t: '登记采用', d: '每个产品的每个终端一行。收到、采用、已验证是三件事，分开写。', tpl: '04-产品采用登记表' },
];
const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5 0 10z" class="ahead"/></marker></defs>`; // 每张图一个 marker id，页面内不重复
const flowSvg = `<svg viewBox="0 0 ${FLOW.length * 150} 90" class="flow" role="img" aria-label="变更流程">${ARROW('ah-flow')}<g>${FLOW.map((f, i) => `<g class="node" data-step="${f.k}" tabindex="0" role="button"><rect x="${i * 150 + 8}" y="16" width="130" height="52" rx="10"/><text x="${i * 150 + 73}" y="47">${f.t}</text><text x="${i * 150 + 132}" y="30" class="hint">▸</text></g>${i < FLOW.length - 1 ? `<path d="M${i * 150 + 138} 42 L${i * 150 + 156} 42" class="arrow" marker-end="url(#ah-flow)"/>` : ''}`).join('')}</g></svg>`;

// 状态机（交互状态）：左「正常」，中三态，右两态。每个方向一条带箭头的线，标签沿法线偏移、最后绘制（不被节点盖住）
const NODES = [
  { id: 'normal', x: 20, y: 103, t: '正常', demo: { list: 'normal', detail: 'normal', q: '' } },
  { id: 'loading', x: 250, y: 8, t: '加载中', demo: { list: 'loading' } },
  { id: 'empty', x: 250, y: 103, t: '无匹配', demo: { list: 'normal', q: '不存在的客户' } },
  { id: 'detail', x: 250, y: 198, t: '打开详情', demo: { list: 'normal', q: '', detail: 'normal', open: true } },
  { id: 'error', x: 540, y: 8, t: '加载失败', demo: { list: 'error' } },
  { id: 'forbidden', x: 540, y: 198, t: '无权限', demo: { list: 'normal', q: '', detail: 'forbidden', open: true } },
];
const EDGES = [['normal', 'loading', '请求', '成功'], ['loading', 'error', '失败', '重试，条件不丢'], ['normal', 'empty', '搜索无结果', '清除条件'], ['normal', 'detail', '点一行', '返回，保留条件'], ['detail', 'forbidden', '无权限（403）', '']];
const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));
const W = 120, H = 44;
const smParts = EDGES.map(([a, b, fwd, back]) => {
  const A = nodeById[a], B = nodeById[b]; const x1 = A.x + W, y1 = A.y + H / 2, x2 = B.x, y2 = B.y + H / 2;
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len; // 法线
  const off = back ? 5 : 0; const line = (sx, sy, ex, ey) => `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}" class="edge" marker-end="url(#ah-sm)"/>`;
  const t = dy ? 0.65 : 0.5; // 斜线标签靠近终点一侧，避免在「正常」附近挤成一团
  const label = (text, side) => `<text x="${(x1 + dx * t + nx * side).toFixed(1)}" y="${(y1 + dy * t + ny * side + 4).toFixed(1)}" class="el">${text}</text>`;
  const lines = line(x1 + nx * -off, y1 + ny * -off, x2 + nx * -off, y2 + ny * -off) + (back ? line(x2 + nx * off, y2 + ny * off, x1 + nx * off, y1 + ny * off) : '');
  const labels = label(fwd, -16) + (back ? label(back, 16) : '');
  return { lines, labels };
});
const smSvg = `<svg viewBox="0 0 680 252" class="sm" role="img" aria-label="列表与详情的状态机">${ARROW('ah-sm')}${smParts.map((p) => p.lines).join('')}${NODES.map((n) => `<g class="node" data-demo='${JSON.stringify(n.demo)}' tabindex="0" role="button"><rect x="${n.x}" y="${n.y}" width="${W}" height="${H}" rx="10"/><text x="${n.x + W / 2}" y="${n.y + 27}">${n.t}</text></g>`).join('')}<g class="labels">${smParts.map((p) => p.labels).join('')}</g></svg>`;

// 决策表与产品行
const decisionRows = decisions.map((d) => `<tr><td>${inline(d.item)}</td><td>${inline(d.who)}</td><td>${inline(d.impact)}</td><td>${inline(d.status)}</td></tr>`).join('');
const ROLES = [['产品／业务负责人', '变更单业务影响；PR 评审'], ['设计负责人', 'tokens.json 与规则文字；PR 评审'], ['开发负责人', '各端接入与脚本'], ['测试／验收负责人', '验收单与真机'], ['规范维护人', '合并、打标签、更新日志、采用表']];

// ---------- 页面 ----------
const NAV = [['home', '首页'], ['principles', '原则'], ['visual', '视觉基础'], ['components', '组件'], ['layout', '布局'], ['states', '交互状态'], ['cross', '跨端适配'], ['team', '团队怎么用']];
const acceptTile = accept.total ? `<b>${accept.passed}/${accept.total}</b><span>项样板验收通过</span><small>${badge('已验证（本地）')} 合成数据，8 个视口，未上真机</small>` : `<b>—</b><span>样板验收</span><small>${badge('未验证')} 尚未运行验收脚本</small>`;
const problemLine = appDiff ? `小程序原生颜色 ${appMismatch}/${appDiff.length} 项与规范不一致${mpProduct ? `，${esc(firstClause(mpProduct.gaps))}` : ''}` : '小程序原生颜色尚未同步快照（node tools/sync-product.mjs）';
const body = `
<a class="skip" href="#main">跳到内容</a>
<div class="site">
<nav class="nav" aria-label="章节">
  <div class="brand"><span class="mark">SB</span><span>部门产品设计规范<small>规则 1.0.0 已确认 · 跨端草稿 ${esc(specVersion)}</small></span></div>
  ${NAV.map(([k, t], i) => `<a href="#${k}" data-nav="${k}"><span>${String(i).padStart(2, '0')}</span>${t}</a>`).join('')}
  <div class="navfoot"><b>状态词</b>${['已确认', '建议', '业务事实', '已验证（本地）', '未验证'].map(badge).join(' ')}</div>
</nav>
<main class="main" id="main">
<header class="top"><label class="find"><span class="sr">查规则编号或变量名</span><input id="find" type="search" placeholder="查编号或变量，如 T-02、--ui-primary"></label><span class="topnote">内容由规范源文件生成，改源文件后重新生成即可</span></header>

<section data-panel="home">
  <h1>部门产品设计规范</h1>
  <p class="lead">我们的产品在电脑网页、手机网页和微信小程序上应该长什么样、怎么反应，这里说了算。产品、设计、开发、测试看的是同一份。下面每个例子都是用规范里的真实颜色和尺寸画出来的，看到的就是产品该有的样子。</p>

  <div class="card brief"><h2>这套规范是为了什么</h2>
    <ol>
      <li><b>让用户一眼看清、顺手做完。</b>销售打开客户列表，三秒内知道谁需要关注、下一步做什么。每条规则都在回答一个这样的具体问题。</li>
      <li><b>让电脑、手机、小程序长得一样、反应一样。</b>同一个「需关注」在三端是同一个颜色同一个词。以前颜色靠截图口口相传，改一处要改三处。</li>
      <li><b>让改动有据可查。</b>改规则要填变更单，改颜色只改一个变量，产品用了要登记。谁改的、为什么改、验过没有，都能查到。</li>
      <li><b>让 AI 参与的界面守住底线。</b>AI 出草稿，人拍板。AI 写的东西一直标着，能看依据，能撤销。这些写成规则，不靠自觉。</li>
    </ol></div>
  <div class="card"><h2>先看一眼：这套规范长什么样</h2>
    <div class="glance">
      <div class="gl"><div class="gl-demo"><span class="swatch" style="background:var(--ui-primary)"></span><span class="swatch" style="background:var(--ui-sidebar)"></span><span class="swatch" style="background:var(--ui-background);border:1px solid var(--ui-line)"></span></div><b>三个底色</b><p>蓝色只用在按钮和选中项，深蓝是左侧导航，浅灰是页面底。别的地方不用蓝。</p><a href="#rule-V-01">规则 V-01</a></div>
      <div class="gl"><div class="gl-demo"><button class="ui-btn ui-primary" type="button">记录拜访</button><button class="ui-btn ui-secondary" type="button">创建任务</button></div><b>一页只有一个实心按钮</b><p>实心蓝的是这一页最该做的事，其余都是描边。两个实心按钮并排，用户就不知道先点哪个。</p><a href="#rule-C-01">规则 C-01</a></div>
      <div class="gl"><div class="gl-demo">${tag('tag-ok', '● 向好')} ${tag('tag-warn', '● 需关注')} ${tag('tag-err', '● 转差')} ${tag('tag-none', '● 待评估')}</div><b>红黄绿灰必须带字</b><p>颜色旁边一定有「向好」「需关注」这样的字，还要能看到为什么。只有一个色点，色弱的人和打印出来都看不懂。</p><a href="#rule-B-01">规则 B-01</a></div>
      <div class="gl"><div class="gl-demo gl-metric"><span><b>320 万</b><small>客户预算</small></span><span><b class="miss">未登记</b><small>年台数</small></span></div><b>没填的数字写「未登记」</b><p>不显示 0。0 是「真的没有」，「未登记」是「还没人填」，这两件事对销售管理完全不同。</p><a href="#rule-B-03">规则 B-03</a></div>
      <div class="gl"><div class="gl-demo gl-empty"><b>没有匹配的客户</b><small>换一个条件试试，或清除全部条件。</small><button class="ui-btn ui-secondary" type="button">清除条件</button></div><b>列表空了要说原因、给出路</b><p>加载中、空、出错、无权限四种情况都要有话说。出错后点重试，用户选好的筛选条件不能丢。</p><a href="#rule-C-06">规则 C-06</a></div>
      <div class="gl"><div class="gl-demo"><span class="ai-badge"><i>AI</i>AI 生成，待确认</span> <span class="ai-badge ok"><i>AI</i>由 AI 起草，李鹏程确认</span></div><b>AI 写的东西要一直标着</b><p>拜访记录、客户画像、总结，只要是 AI 生成的，标识不能消失，还要能点开看依据。归档后写上是谁确认的。</p><a href="#rule-A-02">规则 A-02</a></div>
    </div>
    <p class="note">想改颜色看效果，去「视觉基础」章；想看每个组件所有状态，去「组件」章，那里能直接点。</p></div>

  <div class="card"><h2>常见问题，直接给答案</h2><div class="tbl"><table>
    <tr><th>问题</th><th>答案</th><th>出处</th></tr>
    <tr><td>主色是哪个</td><td><span class="swatch sm" style="background:var(--ui-primary)"></span> <code>#2863CD</code>，代码里写 <code>var(--ui-primary)</code>，不要写色值</td><td><a href="#visual">视觉基础</a></td></tr>
    <tr><td>字多大</td><td>正文 14，辅助说明 12，分区标题 16，页面标题 24，关键数字 32。小程序把 px 换成两倍的 rpx，正文 28rpx</td><td><a href="#rule-V-02">V-02</a></td></tr>
    <tr><td>按钮禁用了怎么办</td><td>旁边写原因，比如「还有 3 项必填未确认」。灰掉不说话等于让用户猜</td><td><a href="#rule-C-01">C-01</a></td></tr>
    <tr><td>表单填错了怎么提示</td><td>错误写在那个字段下面，红字，输入的内容保留。不弹窗，不清空</td><td><a href="#rule-C-02">C-02</a></td></tr>
    <tr><td>筛选条件放哪</td><td>紧挨着结果列表上方，写明范围（本人负责／全部门），显示已选几项、共几条，有「清除」</td><td><a href="#rule-C-04">C-04</a></td></tr>
    <tr><td>手机上怎么进详情</td><td>列表点一行，详情整页进入。返回时列表还在原来的位置，筛选和搜索都还在</td><td><a href="#rule-X-03">X-03</a></td></tr>
    <tr><td>电脑上列表和详情怎么摆</td><td>窗口宽过 900 三栏并排：导航、列表、详情。601 到 900 收成图标导航加二选一。600 以下和手机一样</td><td><a href="#layout">布局</a></td></tr>
    <tr><td>AI 生成的字段用户要改怎么办</td><td>可以直接改，改完标「已由你修改」，旁边留着 AI 原值，可以一键恢复。AI 没把握的字段留空给候选</td><td><a href="#rule-A-03">A-03</a></td></tr>
    <tr><td>规则不合适想改</td><td>填一张变更单：现在的规则、遇到的问题、想怎么改、影响哪些页面。评审通过后改源文件，站点自动更新</td><td><a href="#team">团队怎么用</a></td></tr>
  </table></div></div>

  <div class="card"><h2>你是谁，从哪开始</h2><div class="roles">
    <div class="role"><b>产品经理</b><ol><li>读「原则」章前三条，写需求时按它取舍。</li><li>写空态、出错、无权限时的文案，规则在「交互状态」章。</li><li>验收时对着「常见问题」这张表逐条问。</li></ol></div>
    <div class="role"><b>设计师</b><ol><li>颜色、字号、间距只从「视觉基础」章取，不新造。</li><li>先在「组件」章找现成的，找不到再画新的。</li><li>新画的组件要标出用了哪些变量，交给开发时一起给。</li></ol></div>
    <div class="role"><b>前端开发</b><ol><li>安装组件包，装法在「组件」章下方的说明。</li><li>样式只写 <code>var(--ui-…)</code>，跑一次检查脚本，新增违规为零。</li><li>页面做完按「跨端适配」章看三个宽度。</li></ol></div>
    <div class="role"><b>测试</b><ol><li>每个列表页试四种情况：加载中、空、出错、无权限。</li><li>出错点重试，看筛选条件有没有丢。</li><li>AI 生成的内容，看标识在不在、依据能不能点开。</li></ol></div>
  </div></div>

  <div class="card"><h2>这个站有什么</h2><div class="tbl"><table><tr><th>章</th><th>回答什么问题</th></tr>
    <tr><td><a href="#principles">原则</a></td><td>取舍时按什么判。设计原则、产品原则、业务表达，以及 AI 时代的候选原则</td></tr>
    <tr><td><a href="#visual">视觉基础</a></td><td>颜色、字号、间距、圆角叫什么、值是多少。改一个变量看三端一起变</td></tr>
    <tr><td><a href="#components">组件</a></td><td>有哪些可复用的组件，每个状态长什么样。这章就是组件库本体，能直接操作</td></tr>
    <tr><td><a href="#layout">布局</a></td><td>电脑三栏到手机单页怎么折，拖宽看三档</td></tr>
    <tr><td><a href="#states">交互状态</a></td><td>加载、空、出错、无权限、处理中怎么表现，重试后条件丢不丢</td></tr>
    <tr><td><a href="#cross">跨端适配</a></td><td>哪些必须一样、哪些允许不一样，端侧覆盖值有哪些</td></tr>
    <tr><td><a href="#team">团队怎么用</a></td><td>角色、变更单、采用登记、版本流程，待决定的事和进度数字</td></tr>
  </table></div>
  <p class="note">规则卡片右上角的小标签：${badge('已确认')} 是正式规则，改它要走变更单；${badge('建议')} 是还在讨论的；其余含义在「团队怎么用」章。</p></div>
</section>

<section data-panel="principles" hidden>
  <h1>原则</h1><p class="lead">做页面时经常要取舍：信息放多少、先显示什么、出错了怎么办。原则就是取舍的依据，有了它不用每次重新争。这章四组，从上往下重要程度递减：设计原则三条是根本；产品原则七条是这个业务的事实，不能违反；业务表达五条规定客户、商机、缺失值、红黄绿灰怎么说；最后两组是还在讨论的候选原则。点开任何一张卡片能看正例、反例和怎么检查。</p>
  <h2>设计原则（已确认）</h2><p class="note">三条讲的是：先给结论再给细节；一页里用留白和面板把总览、操作、结果分开；用户输入过的东西别弄丢。</p>${cards(['P-01', 'P-02', 'P-03'], true)}
  <h2>产品原则（业务事实，共 ${PRINCIPLES.length} 条）</h2><p class="note">这七条来自产品仓库，是这个业务怎么运转的事实，设计只能顺着它做。比如「以客户为核心」决定了首页是客户列表而不是商机列表；「销售不手工打分」决定了象限图不能拖动。</p>${principleCards}
  <h2>业务表达（已确认）</h2><p class="note">同一个业务概念在三端怎么叫、怎么显示。红黄绿灰各代表什么，金额和时间怎么写，没填的值显示什么。</p>${cards(['B-01', 'B-02', 'B-03', 'B-04', 'B-05'])}
  ${byGroup('D').length ? `<h2>候选原则：多家之长 ${badge('建议')}</h2><p class="note">从 Apple、Google、蚂蚁、腾讯、微软等十二家的设计规范里提炼出来的共识，还没正式通过。先看 D-01、D-03、D-04 三条，最常用到。来源见 06 章。</p>${cards(byGroup('D').map((r) => r.id))}` : ''}
  ${byGroup('A').length ? `<h2>候选原则：AI 时代 ${badge('建议')}</h2><p class="note">AI 参与的界面怎么做才不出事。核心就一句：AI 出草稿，人拍板。先看 A-01 到 A-04 四条，拜访确认页全靠它们。来源见 06 章。</p>${cards(byGroup('A').map((r) => r.id))}` : ''}
</section>

<section data-panel="visual" hidden>
  <h1>视觉基础</h1><p class="lead">换个主色以前要改三端几十处，现在改一个变量。颜色、字号、间距、圆角都是变量。左边改一个值，右边的预览和下面的样板一起变。改完可以生成变更单草稿。这里的修改只在你的浏览器里，不会写回仓库。</p>
  <div class="two">
    <div class="card panel"><div class="ph"><h2>变量面板</h2><div><button class="btn sec" id="tk-reset">重置</button><button class="btn pri" id="tk-copy">复制为变更单草稿</button></div></div>
      <h3>颜色（共 ${colorTokens.length} 个，列表可滚动）</h3><div class="tks">${panelRows}</div>
      <h3>字号、间距、尺寸（px）</h3><div class="tks">${dimRows}</div>
      <p class="note">这里是电脑网页的值。手机网页和小程序有几个值不同，在「跨端适配」章。标 ${badge('建议')} 的变量还没正式采用。</p></div>
    <div class="card preview"><h2>预览</h2>
      <div class="pv-nav"><span class="mark">SB</span><a class="on">客户</a><a>商机</a><a>任务</a></div>
      <div class="pv-work"><div class="pv-surface"><div class="pv-title">客户 <small>范围：本人负责 · 24 家</small></div><div class="pv-btns"><button class="ui-btn ui-primary">记录拜访</button><button class="ui-btn ui-secondary">创建任务</button><span class="ui-chip on">有风险</span></div><div class="ui-row on"><b>云岭教育科技</b><small>客户资源 · 关系 6/10 · 地盘 HB-03</small>${tag('tag-warn', '● 需关注')}</div><div class="ui-row"><b>金桥制造股份有限公司</b><small>客户资产 · 关系 9/10</small>${tag('tag-err', '● 转差')}</div><div class="ui-row"><b>华宸数据科技有限公司</b><small>客户资产 · 关系 8/10</small>${tag('tag-ok', '● 向好')}</div><div class="ui-row"><b>泰和银行数据中心</b><small>象限：待评估</small>${tag('tag-none', '● 待评估')}</div></div></div>
      <h3>字号</h3>${typeScale}
      <h3>间距</h3>${spaceScale}
    </div>
  </div>
  <div class="card"><h2>样板实时跟随</h2><iframe class="frame" data-sample title="样板（视觉基础）" src="${P.sample}?frame=visual" loading="lazy"></iframe></div>
  <h2>规则</h2>${cards(['V-01', 'V-02', 'V-03', 'V-04'], true)}
</section>

<section data-panel="components" hidden>
  <h1>组件</h1><p class="lead">按钮、输入框、选择器这些基础控件直接用 Ant Design，筛选栏、四态面板这些组合件和 AI 标识、待确认字段这些 AI 件是部门自己的。下面就是组件库本体，每个组件每个状态都能直接点。</p>
  ${libFrame}
  ${libTable}
  <h2>规则</h2>${cards(['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07'], true)}
  <p class="note">C-03 里写的 SalesSelect、SalesDatePicker 是 Web 1.0 自己做的两个控件。Web 改用 Ant Design 后由它的 Select 与 DatePicker 替代，规则文本要走变更单更新。</p>
  <h2>组件用哪家 ${badge('建议')}</h2><div class="card doc">
    <p>不自己造轮子。每个端选一个成熟的开源组件库当底座，按钮、输入框、弹窗这些直接用它的，部门只做三件事：一份颜色字号变量、给这个库的主题桥接文件、在它之上搭的十几个组合件。</p>
    <div class="tbl"><table><tr><th>端</th><th>用哪家</th><th>为什么</th></tr>
      <tr><td>微信小程序</td><td>腾讯 TDesign 小程序版（tdesign-miniprogram）</td><td>它的颜色变量在网页和小程序同名，一份桥接两边生效；组件全；每月更新；开源免费</td></tr>
      <tr><td>电脑与手机网页</td><td>蚂蚁 Ant Design 6 加 Ant Design X，用 React</td><td>用的人最多，招人最容易；Ant Design X 专门有 AI 对话、来源引用这类组件，AI 原则最省事</td></tr>
    </table></div>
    <p>两家不是一家，但颜色字号都从同一份变量桥接过去，实际不影响。2026-09-20 定的。备选方案、每家的缺口和接入步骤在 05 章。</p>
    <p class="src">来源：05-组件生态选型.md。</p></div>
</section>

<section data-panel="layout" hidden>
  <h1>布局</h1><p class="lead">电脑三栏到手机单页怎么折，每个开发理解不一样。规范定死：电脑上是导航、列表、详情三段，到手机变成列表页进详情页再返回。电脑上拖预览框右下角的小三角把预览拉窄，看它在 900 和 600 两个门槛怎么折。手机上点上方的宽度按钮。</p>
  <div class="card"><div class="ph"><h2>拖宽看三档</h2><div class="presets">${['1200', '900', '760', '600', '390', '320'].map((w) => `<button class="btn sec" data-w="${w}">${w}</button>`).join('')}</div></div>
    <div class="readout" id="readout">当前宽度 — · —</div>
    <div class="resizer" id="resizer"><iframe class="frame tall" data-sample title="样板（布局）" src="${P.sample}?frame=layout" loading="lazy"></iframe></div>
    <div class="ascii"><pre>电脑 >900        [导航 220][客户列表 360][客户详情 其余宽度]        三栏并排
收紧 601～900    [栏 56][客户列表 ────────────]  → 点一行 →  [栏 56][详情覆盖列表 ‹返回]
手机 ≤600        [客户列表 整宽 + 底部导航]  → 点一行 →  [详情整页 ‹返回 + 底部操作条]</pre></div></div>
  <div class="card"><h2>8 个视口的自动截图</h2><div class="gallery">${gallery}</div></div>
  <h2>页面模板（已确认）</h2>${cards(['T-01', 'T-02', 'T-03', 'T-04', 'T-05'], true)}
  <h2>跨端布局建议</h2>${cards(['X-02', 'X-03', 'X-05'])}
</section>

<section data-panel="states" hidden>
  <h1>交互状态</h1><p class="lead">加载、空数据、失败、无权限也是规范的一部分，不由开发自由发挥。点状态机的节点，下面的样板会真的切到那个画面，搜索和筛选条件不丢。返回时保留条件这条按 X-03，还是建议。</p>
  <div class="card"><div class="ph"><h2>状态机</h2><small>点节点，样板跟着切。手机上图可以左右滑</small></div><div class="tbl">${smSvg}</div></div>
  <div class="card"><iframe class="frame tall" data-sample data-states title="样板（交互状态）" src="${P.sample}?frame=states" loading="lazy"></iframe></div>
  <h2>规则</h2>${cards(['C-06', 'C-07', 'B-04', 'P-03', 'X-03', 'X-11'], true)}
</section>

<section data-panel="cross" hidden>
  <h1>跨端适配</h1><p class="lead">电脑网页、手机网页、小程序，哪些必须一样，哪些可以不一样。</p>
  <div class="card brief"><h2>三句话</h2><ol>
    <li><b>含义必须一样。</b>「需关注」在三端是同一个黄色同一个词；客户、商机的字段名和状态名一致；权限规则一致。</li>
    <li><b>尺寸和摆放可以不一样。</b>电脑三栏并排，手机上下排；手机上字可以大一点，按钮放底部；间距按端选档位。</li>
    <li><b>平台自带的东西用平台的。</b>小程序的导航栏、底部标签栏、日期选择用微信原生的，只把颜色调成规范的。</li>
  </ol><p class="note">下面第一张表是每条规则在三端各怎么做，第二张是每个变量在三端的值。都很长，默认收起。</p></div>
  <details class="card"><summary class="fold"><h2>规则逐条对照 ${badge('建议')}</h2><small>点开看全部 ${crossRows.split('<tr').length - 1 + xRows.split('<tr').length - 1} 行</small></summary><div class="ph"><span></span><div class="presets" id="cross-filter"><button class="btn sec on" data-kind="">全部</button>${KINDS.map((k) => `<button class="btn sec" data-kind="${k}">${k}</button>`).join('')}<button class="btn sec" data-kind="建议">跨端建议</button></div></div>
    <p class="note">电脑网页一列是正式规则，另外两列是建议。右上按钮可以只看某一类。</p>
    <div class="tbl"><table class="cross"><tr><th>规则</th><th>电脑网页 <small>已确认</small></th><th>手机网页 <small>建议</small></th><th>小程序 <small>建议</small></th><th>结论／样板验证</th><th>状态</th></tr>${crossRows}${xRows}</table></div></details>
  <details class="card"><summary class="fold"><h2>变量在三端的值</h2><small>点开看全部 ${sem.length} 个变量</small></summary><p class="note">高亮的行是三端值不一样的变量。手机网页和小程序的值都还是 ${badge('建议')}。</p><div class="tbl"><table class="vars"><tr><th>变量</th><th>电脑网页</th><th>手机网页</th><th>小程序</th><th>状态</th></tr>${varRows}</table></div></details>
  <div class="card"><h2>小程序现在的颜色和规范差多少</h2>${appDiff ? `<div class="tbl"><table><tr><th>app.json 项</th><th>产品现状</th><th>规范</th><th>比对</th></tr>${appDiff.map((d) => `<tr><td><code>${esc(d.key)}</code></td><td><i class="sw" style="background:${esc(d.cur)}"></i>${esc(d.cur)}</td><td><i class="sw" style="background:${esc(d.spec)}"></i>${esc(d.spec)}</td><td>${d.same ? tag('tag-ok', '一致') : tag('tag-err', '不一致')}</td></tr>`).join('')}</table></div><p class="note">${appMismatch} 项不一致，这是第一张待办变更，改产品仓库要先授权。原生 tabBar 和导航栏不认 CSS 变量，只能写十六进制，规范值由 tokens.json 生成到 miniprogram-app.tokens.json。产品现状来自快照 ${esc(appSnap.source || '')}${appSnap.sourceCommit ? `，提交 ${esc(appSnap.sourceCommit)}` : ''}。重新同步用 node tools/sync-product.mjs。</p>` : '<p class="note">还没同步产品现状快照。运行 node tools/sync-product.mjs 后重新生成。</p>'}</div>
  <h2>跨端建议全文</h2>${cards(byGroup('X').map((r) => r.id))}
</section>

<section data-panel="team" hidden>
  <h1>团队怎么用</h1><p class="lead">规则改了谁知道、谁批、谁接入。这章回答四件事：想改规则怎么走（变更单），产品用了怎么登记（采用登记表），谁负责什么（角色），还有哪些事没定（待决定）。流程和角色还是 ${badge('建议')}，部门指定负责人后生效。点流程图里的一步能看到对应模板。</p>
  <div class="card"><h2>变更流程 ${badge('建议')}</h2><p class="note">点每一步看说明和模板。手机上图可以左右滑。</p><div class="tbl">${flowSvg}</div></div>
  <div class="card"><h2>东西放在哪、怎么进来、怎么把关 ${badge('建议')}</h2><p class="note">所有规则、变量、样板只在仓库里有一份。人看站点，开发装包，AI 读技能文件，产品登记采用。改动只有一个口：变更单加评审。</p><div class="arch"><div class="src"><b>一份来源</b><span>specs/salesbuddy/</span><small>规则原文 · tokens.json · 样板 · 模板 · 验收</small></div><div class="arrows">→</div><div class="entries"><div><b>人看</b><span>README、各章、本站</span></div><div><b>开发用</b><span>dist/ 变量产物、rules.json</span></div><div><b>AI 用</b><span>.claude/skills/design-spec 技能 + 按路径规则</span></div><div><b>其他工具</b><span>AGENTS.md、.agents、.cursor、.github</span></div></div><div class="arrows">→</div><div class="gate"><b>一道闸门</b><span>node tools/check.mjs（一条命令）</span><small>生成变量、兼容校验、规则索引、规范站、样式检查、技能引用，一次跑完。Claude Code 钩子每次写文件后自动跑</small></div></div></div>
  <div class="card"><h2>怎么引用 ${badge('建议')}</h2><div class="tbl"><table><tr><th>谁</th><th>怎么写</th></tr><tr><td>产品写需求</td><td>写规则编号、页面模板和样板部件名。比如「客户列表按 T-02、C-04，返回保留按 X-03（建议）」</td></tr><tr><td>设计出稿</td><td>标注变量名不标数值，如「按钮底色 --ui-primary」</td></tr><tr><td>开发写代码</td><td>颜色和尺寸只写 var(--ui-*)。PR 描述写规则编号。改完跑 node tools/check.mjs</td></tr><tr><td>测试验收</td><td>页面验收单逐项填实际结果和证据。空白不算通过</td></tr><tr><td>AI</td><td>技能自动触发，也可以手动输入 /design-spec。交回时说清规则编号、改动文件、新增变量数、检查输出、证据等级</td></tr></table></div></div>
  <div class="card"><h2>角色（人名待填） ${badge('建议')}</h2><div class="tbl"><table><tr><th>角色</th><th>负责</th><th>实际负责人</th></tr>${ROLES.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>待填</td></tr>`).join('')}</table></div></div>
  <div class="card"><h2>待决定与已决定</h2><div class="tbl"><table><tr><th>事项</th><th>谁决定</th><th>影响</th><th>状态</th></tr>${decisionRows}</table></div><p class="note">来自采用登记表的待决定事项表。</p><h3>下一步</h3>${nextSteps.length ? `<ul>${nextSteps.map((s) => `<li>${inline(s)}</li>`).join('')}</ul>` : '<p class="note">见采用登记表</p>'}</div>
  <h2>验收与维护规则（已确认）</h2>${cards(['G-01', 'G-02'], true)}
</section>
</main>
</div>
<div class="modal" id="modal" hidden role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="mbox"><div class="mh"><h2 id="modal-title"></h2><button class="btn sec" id="modal-close" aria-label="关闭">×</button></div><div class="mb" id="modal-body"></div></div></div>
<script type="application/json" id="tpl-data">${JSON.stringify(Object.fromEntries(templates.map((t) => [t.name, md(t.md)]))).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="flow-data">${JSON.stringify(FLOW).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="token-defaults">${JSON.stringify(Object.fromEntries(sem.map((t) => [t.css, t.value]))).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="site-meta">${JSON.stringify({ version: specVersion }).replace(/</g, '\\u003c')}</script>
`;

const css = `
html, body { height: auto; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--ui-background); color: var(--ui-ink); font-family: var(--ui-font); font-size: var(--ui-text-body); line-height: 1.65; }
h1, h2, h3, h4, p { margin: 0; }
h1 { font-size: var(--ui-text-page); font-weight: 650; line-height: 1.5; margin-bottom: var(--ui-space-2); }
h2 { font-size: var(--ui-text-section); font-weight: 600; margin: var(--ui-space-6) 0 var(--ui-space-3); }
h3 { font-size: var(--ui-text-body); font-weight: 600; margin: var(--ui-space-4) 0 var(--ui-space-2); color: var(--ui-secondary); }
h4 { font-size: var(--ui-text-small); font-weight: 600; color: var(--ui-muted); margin: var(--ui-space-2) 0 2px; }
h2 .st { vertical-align: middle; margin-left: var(--ui-space-2); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: var(--ui-text-small); background: var(--ui-neutral-soft); padding: 0 4px; border-radius: 4px; }
button { font: inherit; cursor: pointer; }
:is(a, button, input, [tabindex="0"]):focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.skip { position: absolute; left: -9999px; } .skip:focus { left: 8px; top: 8px; background: var(--ui-surface); padding: 8px; z-index: 99; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.site { display: grid; grid-template-columns: var(--ui-nav-width) minmax(0, 1fr); min-height: 100vh; }
.nav { position: sticky; top: 0; height: 100vh; overflow: auto; background: var(--ui-sidebar); color: var(--ui-sidebar-ink); padding: var(--ui-space-4) var(--ui-space-3); display: flex; flex-direction: column; gap: var(--ui-space-1); }
.brand { display: flex; gap: var(--ui-space-2); align-items: center; padding: var(--ui-space-2) var(--ui-space-2) var(--ui-space-4); color: var(--ui-on-primary); font-weight: 650; font-size: var(--ui-text-section); line-height: 1.3; }
.brand small { display: block; font-weight: 400; font-size: var(--ui-text-small); color: var(--ui-sidebar-muted); }
.mark { width: 28px; height: 28px; border-radius: 8px; background: var(--ui-primary); color: var(--ui-on-primary); display: grid; place-items: center; font-size: 12px; flex: none; }
.nav a { display: flex; gap: var(--ui-space-3); align-items: center; min-height: var(--ui-control-height); padding: 0 var(--ui-space-3); border-radius: var(--ui-radius-control); color: var(--ui-sidebar-nav); text-decoration: none; }
.nav a span { font-size: var(--ui-text-small); opacity: .7; width: 20px; }
.nav a:hover { background: var(--ui-sidebar-hover); color: var(--ui-on-primary); }
.nav a[aria-current="page"] { background: var(--ui-sidebar-active); color: var(--ui-on-primary); box-shadow: inset 3px 0 var(--ui-sidebar-accent); font-weight: 600; }
.navfoot { margin-top: auto; padding: var(--ui-space-3) var(--ui-space-2) 0; font-size: var(--ui-text-small); color: var(--ui-sidebar-muted); display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.navfoot b { width: 100%; color: var(--ui-on-primary); }
.main { min-width: 0; padding: var(--ui-space-4) var(--ui-page-gutter) var(--ui-space-8); max-width: 1280px; }
.top { display: flex; gap: var(--ui-space-3); align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: var(--ui-space-4); }
.find { flex: 1 1 320px; max-width: 360px; display: block; }
.find input { height: var(--ui-field-height); width: 100%; padding: 0 var(--ui-space-3); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); color: var(--ui-ink); font: inherit; }
.topnote { color: var(--ui-muted); font-size: var(--ui-text-small); }
.lead { color: var(--ui-secondary); max-width: 64em; margin-bottom: var(--ui-space-4); }
.lead .st { vertical-align: middle; }
.card { background: var(--ui-surface); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-panel); padding: var(--ui-card-padding); margin-bottom: var(--ui-space-3); }
.card > h2:first-child { margin-top: 0; }
.doc h3 { font-size: var(--ui-text-section); color: var(--ui-ink); margin-top: var(--ui-space-4); } .doc h4, .doc h5 { color: var(--ui-secondary); font-size: var(--ui-text-body); } .doc p, .doc ul, .doc ol { margin: 0 0 var(--ui-space-2); } .doc li { margin-bottom: 4px; } .doc td { min-width: 110px; } .doc td:first-child { min-width: 140px; font-weight: 500; }
.brief { border-color: var(--ui-primary); box-shadow: inset 4px 0 var(--ui-primary); }
.brief ol { margin: 0; padding-left: 1.4em; } .brief li { margin-bottom: var(--ui-space-2); } .brief ul { margin: 4px 0 0; padding-left: 1.2em; } .brief li li { margin-bottom: 2px; }
.brief small, .card li small { color: var(--ui-muted); font-size: var(--ui-text-small); }
.ph { display: flex; justify-content: space-between; align-items: center; gap: var(--ui-space-3); flex-wrap: wrap; } .ph h2 { margin: 0; } .ph small { color: var(--ui-muted); font-size: var(--ui-text-small); }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--ui-space-3); margin: var(--ui-space-4) 0; }
summary.fold { display: flex; align-items: center; gap: var(--ui-space-3); cursor: pointer; list-style: none; } summary.fold::-webkit-details-marker { display: none; } summary.fold h2 { margin: 0; } summary.fold small { color: var(--ui-muted); font-size: var(--ui-text-small); } summary.fold::before { content: '▸'; color: var(--ui-muted); } details[open] > summary.fold::before { content: '▾'; }
abbr[title] { text-decoration: underline dotted var(--ui-muted); text-underline-offset: 3px; cursor: help; }
.glance { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--ui-space-4); }
.gl { border: 1px solid var(--ui-line); border-radius: var(--ui-radius-panel); padding: var(--ui-space-4); display: flex; flex-direction: column; gap: var(--ui-space-2); }
.gl-demo { min-height: 56px; display: flex; align-items: center; flex-wrap: wrap; gap: var(--ui-space-2); background: var(--ui-background); border-radius: var(--ui-radius-control); padding: var(--ui-space-3); }
.gl b { font-size: var(--ui-text-section); } .gl p { margin: 0; color: var(--ui-secondary); flex: 1; } .gl a { font-size: var(--ui-text-small); }
.swatch { display: inline-block; width: 40px; height: 40px; border-radius: var(--ui-radius-control); } .swatch.sm { width: 16px; height: 16px; vertical-align: -3px; }
.gl-metric span { display: inline-flex; flex-direction: column; margin-right: var(--ui-space-6); } .gl-metric b { font-size: var(--ui-text-metric); color: var(--ui-primary); line-height: 1.2; font-variant-numeric: tabular-nums; } .gl-metric b.miss { color: var(--ui-muted); font-weight: 500; } .gl-metric small { color: var(--ui-secondary); font-size: var(--ui-text-small); }
.gl-empty { flex-direction: column; align-items: flex-start; } .gl-empty b { font-size: var(--ui-text-body); } .gl-empty small { color: var(--ui-secondary); font-size: var(--ui-text-small); }
.ai-badge { display: inline-flex; align-items: center; gap: var(--ui-space-1); padding: 2px var(--ui-space-2); border-radius: 999px; background: var(--ui-selected); color: var(--ui-primary); font-size: var(--ui-text-small); } .ai-badge i { font-style: normal; font-weight: 700; padding: 0 4px; border-radius: 3px; background: var(--ui-primary); color: var(--ui-on-primary); } .ai-badge.ok { background: var(--ui-success-soft); color: var(--ui-success); } .ai-badge.ok i { background: var(--ui-success); }
.roles { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--ui-space-4); } .role { border: 1px solid var(--ui-line); border-radius: var(--ui-radius-panel); padding: var(--ui-space-4); } .role b { display: block; font-size: var(--ui-text-section); margin-bottom: var(--ui-space-2); } .role ol { margin: 0; padding-left: 1.3em; } .role li { margin-bottom: var(--ui-space-1); }
.tile { background: var(--ui-surface); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-panel); padding: var(--ui-card-padding); }
.tile b { display: block; font-size: var(--ui-text-metric); font-weight: 650; line-height: 1.2; color: var(--ui-primary); font-variant-numeric: tabular-nums; }
.tile span { display: block; font-weight: 600; } .tile small { color: var(--ui-muted); font-size: var(--ui-text-small); }
.st, .tag { display: inline-flex; align-items: center; gap: 4px; padding: 0 var(--ui-space-2); border-radius: 4px; font-size: var(--ui-text-small); line-height: 20px; white-space: nowrap; font-weight: 500; }
.st-ok { background: var(--ui-success-soft); color: var(--ui-success); } .st-warn { background: var(--ui-warning-soft); color: var(--ui-warning); }
.st-fact { background: var(--ui-neutral-soft); color: var(--ui-neutral); } .st-local { background: var(--ui-selected); color: var(--ui-primary); } .st-none { background: var(--ui-neutral-soft); color: var(--ui-neutral); border: 1px dashed var(--ui-line); }
.tag { border-radius: 999px; } .tag-ok { background: var(--ui-success-soft); color: var(--ui-success); } .tag-warn { background: var(--ui-warning-soft); color: var(--ui-warning); } .tag-err { background: var(--ui-danger-soft); color: var(--ui-danger); } .tag-none { background: var(--ui-neutral-soft); color: var(--ui-neutral); }
.rule summary { display: flex; align-items: center; gap: var(--ui-space-3); cursor: pointer; list-style: none; min-height: var(--ui-control-height); }
.rule summary::-webkit-details-marker { display: none; }
.rule .rid { font-family: ui-monospace, Menlo, monospace; font-weight: 650; color: var(--ui-primary); min-width: 44px; }
.rule .rtitle { flex: 1; font-weight: 600; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.rule .rreq { font-weight: 400; color: var(--ui-secondary); font-size: var(--ui-text-small); line-height: 1.4; }
.rule[open] .rreq { display: none; }
.rule .st { margin-left: auto; }
.rbody { padding-top: var(--ui-space-3); border-top: 1px solid var(--ui-line); margin-top: var(--ui-space-3); display: flex; flex-direction: column; gap: var(--ui-space-2); }
.req { font-size: var(--ui-text-section); line-height: 1.6; }
.src, .note { color: var(--ui-muted); font-size: var(--ui-text-small); }
.note .st { vertical-align: middle; }
.rule.hit { outline: 2px solid var(--ui-focus); }
.tbl { overflow-x: auto; -webkit-overflow-scrolling: touch; } table { border-collapse: collapse; width: 100%; } th, td { text-align: left; vertical-align: top; padding: var(--ui-space-2) var(--ui-space-3); border-bottom: 1px solid var(--ui-line); } th { color: var(--ui-secondary); font-weight: 600; font-size: var(--ui-text-small); white-space: nowrap; }
th small { font-weight: 400; color: var(--ui-muted); }
td.idc { min-width: 120px; } td.idc b, td.idc code { white-space: nowrap; }
td.span { color: var(--ui-muted); }
.kind { display: inline-block; font-size: var(--ui-text-small); color: var(--ui-primary); border: 1px solid var(--ui-primary); border-radius: 4px; padding: 0 6px; margin-right: 6px; }
tr.diff td { background: var(--ui-selected); }
.sw { display: inline-block; width: 14px; height: 14px; border-radius: 4px; border: 1px solid var(--ui-line); vertical-align: -2px; margin-right: 6px; }
.two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--ui-space-3); }
.tks { display: flex; flex-direction: column; gap: 4px; max-height: 480px; overflow: auto; scrollbar-gutter: stable; }
.tks::after { content: ''; position: sticky; bottom: 0; display: block; flex: none; height: 20px; background: linear-gradient(transparent, var(--ui-surface)); pointer-events: none; }
.tk { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: var(--ui-space-2); align-items: center; min-height: 32px; }
.tk .desc { display: none; } .tk code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tk input[type=color] { width: 40px; height: 28px; padding: 0; border: 1px solid var(--ui-line); border-radius: 6px; background: var(--ui-surface); }
.tk input[type=number] { width: 44px; height: 28px; padding: 0 4px; border: 1px solid var(--ui-line); border-radius: 6px; font: inherit; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: var(--ui-control-height); padding: 0 var(--ui-space-3); border-radius: var(--ui-radius-control); border: 1px solid transparent; }
.btn.pri { background: var(--ui-primary); color: var(--ui-on-primary); } .btn.pri:hover { background: var(--ui-primary-hover); }
.btn.sec { background: var(--ui-surface); color: var(--ui-primary); border-color: var(--ui-line); } .btn.sec:hover, .btn.sec.on { background: var(--ui-selected); border-color: var(--ui-primary); }
.presets { display: flex; gap: var(--ui-space-2); flex-wrap: wrap; }
.preview .pv-nav { display: flex; gap: var(--ui-space-2); align-items: center; background: var(--ui-sidebar); color: var(--ui-sidebar-nav); padding: var(--ui-space-2) var(--ui-space-3); border-radius: var(--ui-radius-control) var(--ui-radius-control) 0 0; }
.pv-nav a { padding: 4px var(--ui-space-3); border-radius: var(--ui-radius-control); } .pv-nav a.on { background: var(--ui-sidebar-active); color: var(--ui-on-primary); box-shadow: inset 3px 0 var(--ui-sidebar-accent); }
.pv-work { background: var(--ui-background); padding: var(--ui-space-3); border-radius: 0 0 var(--ui-radius-control) var(--ui-radius-control); }
.pv-surface { background: var(--ui-surface); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-panel); padding: var(--ui-card-padding); }
.pv-title { font-size: var(--ui-text-page); font-weight: 650; } .pv-title small { font-size: var(--ui-text-small); color: var(--ui-secondary); font-weight: 400; margin-left: var(--ui-space-2); }
.pv-btns { display: flex; gap: var(--ui-space-2); align-items: center; margin: var(--ui-space-3) 0; flex-wrap: wrap; }
.ui-btn { min-height: var(--ui-control-height); padding: 0 var(--ui-space-4); border-radius: var(--ui-radius-control); border: 1px solid transparent; font: inherit; }
.ui-primary { background: var(--ui-primary); color: var(--ui-on-primary); } .ui-primary:hover { background: var(--ui-primary-hover); }
.ui-secondary { background: var(--ui-surface); color: var(--ui-primary); border-color: var(--ui-line); } .ui-secondary:hover { background: var(--ui-selected); }
.ui-chip { display: inline-flex; align-items: center; min-height: 32px; padding: 0 var(--ui-space-3); border-radius: 999px; border: 1px solid var(--ui-line); color: var(--ui-secondary); background: var(--ui-surface); }
.ui-chip.on { background: var(--ui-selected); border-color: var(--ui-primary); color: var(--ui-primary); font-weight: 600; }
.ui-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px var(--ui-space-3); padding: var(--ui-space-2) var(--ui-space-3); border-bottom: 1px solid var(--ui-line); min-width: 150px; align-items: center; }
.ui-row b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .ui-row small { color: var(--ui-secondary); font-size: var(--ui-text-small); grid-column: 1; } .ui-row .tag { grid-column: 2; grid-row: 1 / 3; align-self: center; }
.ui-row.on { background: var(--ui-selected); box-shadow: inset 3px 0 var(--ui-primary); }
.libcard .ph { margin-bottom: var(--ui-space-3); } .libcard .ph small { flex: 1 1 260px; } .libmeta td { min-width: 96px; } .libmeta td small { color: var(--ui-muted); font-size: var(--ui-text-small); }
.ts { display: flex; justify-content: space-between; align-items: baseline; gap: var(--ui-space-3); padding: var(--ui-space-2) 0; border-bottom: 1px solid var(--ui-line); }
.ss { display: grid; grid-template-columns: 40px auto minmax(0, 1fr); gap: var(--ui-space-3); align-items: center; padding: 4px 0; font-size: var(--ui-text-small); color: var(--ui-secondary); } .ss i { display: block; height: 12px; background: var(--ui-primary); border-radius: 2px; }
.frame { width: 100%; height: 560px; border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); display: block; } .frame.tall { height: 640px; } .frame.lib { height: 860px; }
.resizer { resize: horizontal; overflow: hidden; min-width: 280px; max-width: 100%; width: 100%; border: 2px dashed var(--ui-line); border-radius: var(--ui-radius-control); padding: 4px; }
.readout { font-weight: 600; margin: var(--ui-space-3) 0; color: var(--ui-primary); font-variant-numeric: tabular-nums; }
.ascii pre { margin: var(--ui-space-3) 0 0; padding: var(--ui-space-3); background: var(--ui-background); border-radius: var(--ui-radius-control); font-size: var(--ui-text-small); overflow-x: auto; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--ui-space-3); } figure { margin: 0; } figure img { width: 100%; border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); } figcaption { font-size: var(--ui-text-small); color: var(--ui-secondary); margin-top: 4px; }
svg.sm { width: 100%; min-width: 560px; max-width: 680px; height: auto; display: block; } svg.flow { width: 100%; min-width: 720px; max-width: 900px; height: auto; display: block; }
.node rect { fill: var(--ui-surface); stroke: var(--ui-primary); stroke-width: 1.5; } .node text { fill: var(--ui-ink); font-size: 14px; text-anchor: middle; font-weight: 600; } .node { cursor: pointer; } .node:hover rect, .node:focus rect, .node.on rect { fill: var(--ui-selected); } .node:focus { outline: none; }
.node .hint { font-size: 12px; fill: var(--ui-muted); font-weight: 400; }
.arrow, .edge { stroke: var(--ui-muted); stroke-width: 1.5; fill: none; } .ahead { fill: var(--ui-muted); } .el { fill: var(--ui-secondary); font-size: 12px; text-anchor: middle; paint-order: stroke; stroke: var(--ui-surface); stroke-width: 4px; }
.arch { display: grid; grid-template-columns: 1fr auto 1.4fr auto 1fr; gap: var(--ui-space-3); align-items: center; } .arch > div { border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); padding: var(--ui-space-3); } .arch .arrows { border: 0; text-align: center; color: var(--ui-muted); font-size: var(--ui-text-page); }
.arch b { display: block; color: var(--ui-primary); } .arch span { display: block; font-weight: 600; } .arch small { color: var(--ui-muted); font-size: var(--ui-text-small); } .entries { display: grid; gap: var(--ui-space-2); } .entries > div { border: 1px solid var(--ui-line); border-radius: 6px; padding: var(--ui-space-2); }
.modal { position: fixed; inset: 0; background: var(--ui-overlay); display: grid; place-items: center; padding: var(--ui-space-4); z-index: 50; } .modal[hidden] { display: none; }
.mbox { background: var(--ui-surface); border-radius: var(--ui-radius-panel); max-width: 860px; width: 100%; max-height: 90vh; overflow: auto; padding: var(--ui-card-padding); box-shadow: var(--ui-shadow-popup); }
.mh { display: flex; justify-content: space-between; align-items: center; gap: var(--ui-space-3); margin-bottom: var(--ui-space-3); } .mh h2 { margin: 0; }
.mb h3, .mb h4, .mb h5 { margin: var(--ui-space-4) 0 var(--ui-space-2); } .mb p { margin: 0 0 var(--ui-space-2); } .mb blockquote { margin: 0 0 var(--ui-space-2); padding-left: var(--ui-space-3); border-left: 3px solid var(--ui-line); color: var(--ui-secondary); }
@media (max-width: 900px) {
  .site { grid-template-columns: minmax(0, 1fr); }
  .nav { position: sticky; top: 0; height: auto; flex-direction: row; flex-wrap: wrap; gap: 4px var(--ui-space-2); padding: var(--ui-space-2) var(--ui-page-gutter); z-index: 5; }
  .brand { width: 100%; padding: 0 0 var(--ui-space-1); font-size: var(--ui-text-body); } .navfoot { width: 100%; margin: 0; padding: var(--ui-space-1) 0 0; } .navfoot b { width: auto; }
  .nav a { flex: none; min-height: var(--ui-touch-target); } .nav a span { display: none; }
  .find { flex-basis: 100%; max-width: none; }
  .two { grid-template-columns: minmax(0, 1fr); } .arch { grid-template-columns: minmax(0, 1fr); } .arch .arrows { transform: rotate(90deg); }
  .tks { max-height: none; } .tks::after { display: none; }
  .frame, .frame.tall { height: 520px; } .frame.lib { height: 640px; } .resizer { resize: none; }
  .tile b { font-size: var(--ui-text-page); }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;
// 自检：生成器 CSS 只允许 var(--ui-*)，不允许任何字面色值（铁律；站点目录被 lint 跳过，所以在这里查）
{ const NAMED = /\b(white|black|red|blue|green|gray|grey|yellow|orange|purple|pink|silver|navy|teal|cyan|magenta)\b/;
  for (const m of css.matchAll(/(color|background|border|outline|fill|stroke|shadow)[a-z-]*\s*:\s*([^;{}]*)/gi)) { const v = m[2]; if (/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/.test(v) || NAMED.test(v)) { console.error(`build-site 自检失败：CSS 含字面色值「${m[0].trim()}」，只允许 var(--ui-*)`); process.exit(1); } }
  for (const m of css.matchAll(/var\((--ui-[a-z0-9-]+)/g)) if (!tokens.semantic[m[1].slice(5)]) { console.error(`build-site 自检失败：变量 ${m[1]} 不存在于 design-tokens.json`); process.exit(1); } }

const js = `
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var meta = JSON.parse($('#site-meta').textContent);
  // 章节路由
  var panels = $$('[data-panel]'), links = $$('.nav a[data-nav]');
  function show(name) {
    if (!panels.some(function (p) { return p.dataset.panel === name; })) name = 'home';
    panels.forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    links.forEach(function (a) { if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
  }
  function ruleEl(id) { return $$('.rule[data-id="' + id + '"]')[0] || null; }
  function route() { var h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { h = 'home'; } var m = h.match(/^rule-([A-Z]-\\d\\d)$/); if (m) { var el = ruleEl(m[1]); if (el) { show(el.closest('[data-panel]').dataset.panel); el.open = true; el.classList.add('hit'); el.scrollIntoView({ block: 'center' }); return; } } show(h || 'home'); }
  window.addEventListener('hashchange', route); route();
  // 查编号或变量
  $('#find').addEventListener('change', function () {
    var q = this.value.trim(); if (!q) return;
    var rid = q.toUpperCase().match(/[PVCTBGX]-\\d\\d/); if (rid && ruleEl(rid[0])) { location.hash = 'rule-' + rid[0]; return; }
    if (/^--ui-/.test(q)) { var inp = $$('.tk input').filter(function (i) { return i.dataset.token === q; })[0]; if (inp) { show('visual'); inp.closest('.tk').scrollIntoView({ block: 'center' }); inp.focus(); return; } }
    var el = $$('.rule').filter(function (d) { return d.textContent.indexOf(q) >= 0; })[0]; if (el) { show(el.closest('[data-panel]').dataset.panel); el.open = true; el.scrollIntoView({ block: 'center' }); }
  });
  // 变量面板：改站点根变量并广播给样板
  var defaults = JSON.parse($('#token-defaults').textContent), changed = {};
  function frames() { return $$('iframe[data-sample]').map(function (f) { return f.contentWindow; }).filter(Boolean); }
  function setToken(name, value) { document.documentElement.style.setProperty(name, value); changed[name] = value; frames().forEach(function (w) { w.postMessage({ type: 'set-token', name: name, value: value }, '*'); }); }
  $$('.tk input').forEach(function (inp) { inp.addEventListener('input', function () { setToken(inp.dataset.token, inp.dataset.unit ? inp.value + inp.dataset.unit : inp.value); }); });
  $('#tk-reset').addEventListener('click', function () { document.documentElement.removeAttribute('style'); changed = {}; frames().forEach(function (w) { w.postMessage({ type: 'reset-tokens' }, '*'); }); $$('.tk input').forEach(function (inp) { inp.value = inp.dataset.unit ? parseFloat(defaults[inp.dataset.token]) : String(defaults[inp.dataset.token]).slice(0, 7); }); });
  $('#tk-copy').addEventListener('click', function () {
    var rows = Object.keys(changed).map(function (k) { return '| ' + k + ' | ' + defaults[k] + ' | ' + changed[k] + ' |'; });
    var text = '# 设计规则变更单（草稿，由规范站生成）\\n\\n状态：提出。当前规范版本：' + meta.version + '。\\n\\n| 变量 | 当前值 | 候选值 |\\n|---|---|---|\\n' + (rows.length ? rows.join('\\n') : '| （尚未修改任何变量） | | |') + '\\n\\n遇到的实际问题与证据：____\\n受影响的产品、终端、页面、组件：____\\n实现与验证方法：改 tokens.json 后运行 node tools/check.mjs；样板验收；各端截图。\\n决策负责人：设计负责人＋产品负责人。\\n';
    var done = function () { $('#tk-copy').textContent = '已复制到剪贴板'; setTimeout(function () { $('#tk-copy').textContent = '复制为变更单草稿'; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { openModal('变更单草稿', '<pre style="white-space:pre-wrap">' + text.replace(/</g, '&lt;') + '</pre>'); });
    else openModal('变更单草稿', '<pre style="white-space:pre-wrap">' + text.replace(/</g, '&lt;') + '</pre>');
  });
  // 布局：拖宽读数
  var resizer = $('#resizer'), readout = $('#readout');
  function tier(w) { return w > 900 ? '电脑 >900（三栏并排）' : w > 600 ? '收紧 601～900（图标导航，列表／详情二选一）' : '手机 ≤600（底部导航，详情整页进入）'; }
  function update() { if (!resizer) return; var w = Math.round(resizer.clientWidth - 8); readout.textContent = '当前宽度 ' + w + 'px · ' + tier(w); }
  if (window.ResizeObserver && resizer) new ResizeObserver(update).observe(resizer); update();
  $$('.presets [data-w]').forEach(function (b) { b.addEventListener('click', function () { var w = Number(b.dataset.w); resizer.style.width = Math.min(w + 12, resizer.parentElement.clientWidth) + 'px'; update(); }); });
  // 状态机
  var statesFrame = $('iframe[data-states]');
  $$('svg.sm .node').forEach(function (n) { var go = function () { $$('svg.sm .node').forEach(function (x) { x.classList.remove('on'); }); n.classList.add('on'); var d = JSON.parse(n.dataset.demo); if (statesFrame && statesFrame.contentWindow) statesFrame.contentWindow.postMessage(Object.assign({ type: 'demo', close: !d.open }, d), '*'); }; n.addEventListener('click', go); n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
  // 跨端筛选
  $$('#cross-filter button').forEach(function (b) { b.addEventListener('click', function () { $$('#cross-filter button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); var k = b.dataset.kind; $$('table.cross tr[data-kind]').forEach(function (tr) { tr.hidden = !!k && tr.dataset.kind !== k; }); }); });
  // 流程图与模板弹窗
  var tpl = JSON.parse($('#tpl-data').textContent), flow = JSON.parse($('#flow-data').textContent), modal = $('#modal'), lastFocus = null;
  function openModal(title, html) { lastFocus = document.activeElement; $('#modal-title').textContent = title; $('#modal-body').innerHTML = html; modal.hidden = false; $('#modal-close').focus(); }
  function closeModal() { modal.hidden = true; if (lastFocus) lastFocus.focus(); }
  $('#modal-close').addEventListener('click', closeModal); modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  $$('svg.flow .node').forEach(function (n) { var go = function () { var f = flow.filter(function (x) { return x.k === n.dataset.step; })[0]; if (!f) return; openModal(f.t, '<p>' + f.d + '</p>' + (f.tpl ? '<h3>模板：' + f.tpl + '</h3>' + tpl[f.tpl] : '')); }; n.addEventListener('click', go); n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
})();
`;

const head = `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="color-scheme" content="light"><title>部门产品设计规范</title><link rel="stylesheet" href="${P.tokensCss}"><style>${css}</style>`;

// 术语首次出现时加悬停解释。只处理标签之间的正文，不碰 code、script、style 和属性。每个章节各解释一次。
const GLOSSARY = [['ACV', '年度合同金额'], ['RLS', '数据库行级权限：同一张表，不同人只能看到自己有权看的行'], ['rpx', '小程序的长度单位，750rpx 等于屏幕宽度，正文 14px 写 28rpx'], ['PR', '代码合并申请：改完提交，别人评审通过后合入'], ['Outbox', '一种保证数据改动和后续通知不丢的写法'], ['tabBar', '小程序底部的标签栏'], ['npm', 'JavaScript 的包管理器，装组件库用它'], ['CSS 变量', '给颜色、字号起名字，改名字对应的值，所有用到的地方一起变'], ['桥接文件', '把我们的变量名翻译成上游组件库变量名的文件，脚本生成'], ['样板', '03 章那页可点的演示页，用来验证规则，不是真实产品'], ['变更单', '改规则前填的一页表：当前规则、问题、改法、影响页面、怎么验证'], ['登记采用', '某产品某端在采用登记表写下「已采用」；收到不等于采用'], ['视口', '浏览器窗口的宽度'], ['Agent', 'AI 助手'], ['Vite', '前端构建工具'], ['React', 'Web 前端框架'], ['岛屿式', '不整站重写，只在现有页面的一块区域里挂新框架']];
function glossary(html) {
  return html.replace(/(<section[\s\S]*?<\/section>)/g, (sec) => {
    const seen = new Set();
    return sec.split(/(<(?:code|script|style|pre)[\s\S]*?<\/(?:code|script|style|pre)>|<[^>]+>)/g).map((seg, i) => {
      if (i % 2 === 1) return seg;
      for (const [term, def] of GLOSSARY) {
        if (seen.has(term)) continue;
        const re = new RegExp(`(^|[^\\w-])(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w-])`);
        if (re.test(seg)) { seg = seg.replace(re, `$1<abbr title="${def}">$2</abbr>`); seen.add(term); }
      }
      return seg;
    }).join('');
  });
}

const bodyG = glossary(body);
const full = `<!doctype html>\n<html lang="zh-CN">\n<head>\n${head}\n</head>\n<body>\n${bodyG}\n<script>${js}</script>\n</body>\n</html>\n`;

if (!portable) {
  const out = join(specDir, D.site); mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'index.html'), full);
  console.log(`规范站 → ${join(out, 'index.html')}（${(full.length / 1024).toFixed(0)} KB）`);
} else {
  mkdirSync(join(portable, 'sample'), { recursive: true }); mkdirSync(join(portable, 'shots'), { recursive: true });
  writeFileSync(join(portable, 'sample', 'design-tokens.css'), R(`${D.tokens}/dist/design-tokens.css`));
  const sample = R(`${D.sample}/index.html`).replace(/<link rel="stylesheet" href="[^"]*design-tokens\.css">/, '<link rel="stylesheet" href="design-tokens.css">');
  writeFileSync(join(portable, 'sample', 'index.html'), sample);
  for (const v of VPS) if (shots.includes(`${v}-详情.png`)) copyFileSync(join(shotsDir, `${v}-详情.png`), join(portable, 'shots', `${v}-详情.png`));
  if (hasLib) cpSync(libDir, join(portable, 'lib'), { recursive: true });
  const page = artifact ? `<title>部门产品设计规范</title><link rel="stylesheet" href="${P.tokensCss}"><style>${css}</style>\n${bodyG}\n<script>${js}</script>\n` : full;
  writeFileSync(join(portable, 'index.html'), page);
  console.log(`可发布站点 → ${portable}（index.html + sample/ + shots/）`);
}
