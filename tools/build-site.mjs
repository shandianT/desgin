#!/usr/bin/env node
/**
 * 可视化规范站生成器（零依赖）。
 * 输入（全部是已有源或生成物，本脚本不手写任何规则、不含任何字面色值）：
 *   rules.json、02/dist/design-tokens.json、03/验收结果.json、03/截图/、1.0.0/模板/*.md、采用登记表.md、01-三端规则对照表.md
 * 输出：<规范目录>/站点/index.html（相对引用样板、变量 CSS、截图）
 *      --portable <目录>：把站点与依赖复制成可独立发布的一份（GitHub Pages、claude.ai、U 盘），--artifact 再去掉 html 外壳
 * 用法：node tools/build-site.mjs specs/salesbuddy [--portable out/site] [--artifact]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const specDir = resolve(args.find((a) => !a.startsWith('--')) || 'specs/salesbuddy');
const portable = args.includes('--portable') ? resolve(args[args.indexOf('--portable') + 1]) : null;
const artifact = args.includes('--artifact');
const R = (p) => readFileSync(join(specDir, p), 'utf8');
const J = (p) => JSON.parse(R(p));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 读源 ----------
const rules = J('rules.json');
const tokens = J('02-设计变量与同步链路/dist/design-tokens.json');
const tokensMeta = J('02-设计变量与同步链路/tokens.json').$meta;
const accept = existsSync(join(specDir, '03-跨端样板-客户列表到详情/验收结果.json')) ? J('03-跨端样板-客户列表到详情/验收结果.json') : { total: 0, passed: 0, failed: 0, checkedAt: '' };
const shotsDir = join(specDir, '03-跨端样板-客户列表到详情/截图');
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => f.endsWith('.png')).sort() : [];
const templates = ['01-任务单', '02-规则变更单', '03-页面验收单', '04-产品采用登记表'].map((n) => ({ name: n, md: R(`1.0.0-使用包快照/模板/${n}.md`) }));
const register = R('采用登记表.md');
const cmp = R('01-三端规则对照表.md');
const specVersion = tokensMeta.version;

// 决策表：采用登记表 ## 2 之后的表格行
const decisions = [];
{ let inSec = false; for (const line of register.split('\n')) { if (/^## 2/.test(line)) inSec = true; else if (/^## /.test(line)) inSec = false; if (inSec && /^\| /.test(line) && !/^\| 事项|^\|---/.test(line)) { const c = line.split('|').slice(1, -1).map((s) => s.trim()); if (c.length >= 4) decisions.push({ item: c[0], who: c[1], impact: c[2], status: c[3] }); } } }
// X 规则的样板验证结果（01 章 3.7 表）
const xVerify = {}; for (const line of cmp.split('\n')) { const m = line.match(/^\| (X-\d{2}) ([^|]*)\| ([^|]*)\| ([^|]*)\|/); if (m) xVerify[m[1]] = { sample: m[3].trim(), device: m[4].trim() }; }
// 小程序 app.json 差距（产品仓库存在时）
let appDiff = null;
try {
  const frag = J('02-设计变量与同步链路/dist/miniprogram-app.tokens.json');
  const mpDir = process.env.MINIPROGRAM_DIR || resolve(specDir, '..', '..', '..', 'xiaoshouguanli', 'frontend', 'miniprogram');
  const appJson = JSON.parse(readFileSync(join(mpDir, 'app.json'), 'utf8'));
  appDiff = []; for (const sec of ['window', 'tabBar']) for (const [k, v] of Object.entries(frag[sec])) { const cur = appJson[sec]?.[k]; appDiff.push({ key: `${sec}.${k}`, cur: String(cur), spec: String(v), same: String(cur).toLowerCase() === String(v).toLowerCase() }); }
} catch { appDiff = null; }

const byGroup = (g) => rules.rules.filter((r) => r.group === g);
const ruleById = Object.fromEntries(rules.rules.map((r) => [r.id, r]));
const sem = Object.entries(tokens.semantic).map(([name, t]) => ({ name, css: `--ui-${name}`, ...t, platforms: Object.fromEntries(Object.entries(tokens.platforms).map(([p, m]) => [p, m[name]])) }));
const colorTokens = sem.filter((t) => t.type === 'color');
const dimTokens = sem.filter((t) => t.type === 'dimension');

// ---------- 路径 ----------
const P = portable ? { sample: 'sample/index.html', tokensCss: 'sample/design-tokens.css', shots: 'shots/' } : { sample: '../03-跨端样板-客户列表到详情/index.html', tokensCss: '../02-设计变量与同步链路/dist/design-tokens.css', shots: '../03-跨端样板-客户列表到详情/截图/' };

// ---------- 极简 Markdown 渲染（模板与说明用） ----------
function md(text) {
  const lines = text.replace(/^---\n[\s\S]*?\n---\n/, '').split('\n'); let out = '', i = 0;
  const inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  while (i < lines.length) {
    const l = lines[i];
    if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { if (!/^\|\s*-/.test(lines[i])) rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim())); i++; } out += '<div class="tbl"><table>' + rows.map((r, ri) => '<tr>' + r.map((c) => (ri ? '<td>' : '<th>') + inline(c) + (ri ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</table></div>'; continue; }
    if (/^#+ /.test(l)) { const lv = l.match(/^#+/)[0].length; out += `<h${Math.min(lv + 2, 5)}>${inline(l.replace(/^#+ /, ''))}</h${Math.min(lv + 2, 5)}>`; i++; continue; }
    if (/^[-*] /.test(l)) { out += '<ul>'; while (i < lines.length && /^[-*] /.test(lines[i])) { out += '<li>' + inline(lines[i].slice(2)) + '</li>'; i++; } out += '</ul>'; continue; }
    if (/^> /.test(l)) { out += '<blockquote>' + inline(l.slice(2)) + '</blockquote>'; i++; continue; }
    if (l.trim() === '') { i++; continue; }
    out += '<p>' + inline(l) + '</p>'; i++;
  }
  return out;
}

// ---------- 片段 ----------
const STATUS_CLASS = { '已确认': 'ok', '建议': 'warn', '业务事实': 'fact', '已验证（本地）': 'local', '未验证': 'none' };
const badge = (s) => `<span class="st st-${STATUS_CLASS[s] || 'none'}">${esc(s)}</span>`;
function ruleCard(r, extra = '') {
  const anchors = [...new Set(r.anchors)].slice(0, 4);
  return `<details class="card rule" id="rule-${r.id}" data-id="${r.id}"><summary><span class="rid">${r.id}</span><span class="rtitle">${esc(r.scene)}</span>${badge(r.status)}</summary>
  <div class="rbody"><p class="req">${esc(r.requirement)}</p>
  ${r.examples ? `<p><b>正确示例／反例</b>　${esc(r.examples)}</p>` : ''}
  <p><b>怎么检查</b>　${esc(r.check)}</p>
  ${r.tokens.length ? `<p><b>相关变量</b>　${r.tokens.map((t) => `<code>${t}</code>`).join(' ')}</p>` : ''}
  ${anchors.length ? `<p><b>样板部件</b>　${anchors.map(esc).join('、')}</p>` : ''}
  ${extra}
  <p class="src">来源：${esc(r.sourceFile)}:${r.sourceLine}${r.status === '建议' ? '　（跨端建议，待登记采用）' : ''}</p></div></details>`;
}
const cards = (ids) => ids.map((id) => ruleById[id]).filter(Boolean).map((r) => ruleCard(r)).join('');
const factCard = (title, body, src) => `<details class="card rule fact"><summary><span class="rid">原则</span><span class="rtitle">${esc(title)}</span>${badge('业务事实')}</summary><div class="rbody"><p class="req">${esc(body)}</p><p class="src">来源：${esc(src)}</p></div></details>`;

// 组件状态矩阵：行 × 列，用类模拟伪状态
const STATES = ['默认', '悬停', '聚焦', '禁用', '处理中', '错误／空'];
const comp = {
  '主按钮': (s) => `<button class="ui-btn ui-primary ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" ${s === '禁用' || s === '处理中' ? 'disabled' : ''}>${s === '处理中' ? '保存中…' : s === '错误／空' ? '重试' : '记录拜访'}</button>`,
  '次按钮': (s) => `<button class="ui-btn ui-secondary ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" ${s === '禁用' ? 'disabled' : ''}>${s === '处理中' ? '处理中…' : '创建任务'}</button>`,
  '输入框': (s) => `<label class="ui-field ${s === '错误／空' ? 'is-error' : ''}"><span>客户名称${s === '错误／空' ? '（必填）' : ''}</span><input class="${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" value="${s === '错误／空' ? '' : '华宸数据科技'}" ${s === '禁用' ? 'disabled' : ''} ${s === '处理中' ? 'readonly' : ''} placeholder="搜索客户名称或负责人"></label>${s === '错误／空' ? '<small class="ui-err">请填写客户名称，已保留其余输入</small>' : ''}`,
  '选择器': (s) => `<button class="ui-select ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" ${s === '禁用' ? 'disabled' : ''}><span>${s === '错误／空' ? '无匹配结果' : s === '处理中' ? '加载选项…' : '第三季度 · 已选 2 项'}</span><i>▾</i></button>`,
  '筛选片': (s) => `<span class="ui-chip ${s === '聚焦' ? 'is-focus' : ''} ${s === '悬停' ? 'is-hover' : ''} ${s === '处理中' ? 'on' : ''} ${s === '禁用' ? 'off' : ''}">${s === '处理中' ? '有风险 · 已选' : '有风险'}</span>`,
  '列表行': (s) => `<div class="ui-row ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''} ${s === '处理中' ? 'on' : ''}"><b>云岭教育科技</b><small>${s === '错误／空' ? '没有匹配的客户 · 清除条件' : s === '处理中' ? '已选中 · 详情打开' : '客户资源 · 关系 6/10'}</small>${s === '禁用' ? '<em>无权限</em>' : '<span class="st st-warn">需关注</span>'}</div>`,
  '状态标签': (s) => ({ '默认': '<span class="st st-ok">● 向好</span>', '悬停': '<span class="st st-warn">● 需关注</span>', '聚焦': '<span class="st st-err">● 转差</span>', '禁用': '<span class="st st-none">● 待评估</span>', '处理中': '<span class="st st-local">加载中…</span>', '错误／空': '<span class="st st-none">未登记</span>' })[s],
};
const matrix = `<div class="tbl"><table class="matrix"><tr><th>组件</th>${STATES.map((s) => `<th>${s}</th>`).join('')}</tr>${Object.entries(comp).map(([n, f]) => `<tr><th>${n}</th>${STATES.map((s) => `<td>${f(s)}</td>`).join('')}</tr>`).join('')}</table></div>`;

// 跨端表
const crossRows = rules.rules.filter((r) => r.group !== 'X').map((r) => { const p = r.platforms[0] || {}; const kind = /统一/.test(r.crossPlatform || '') && !/适配/.test(r.crossPlatform || '') ? '统一' : /适配/.test(r.crossPlatform || '') ? '适配' : '统一'; return `<tr data-kind="${kind}" data-text="${esc(r.id + ' ' + r.scene)}"><td><b>${r.id}</b><br><small>${esc(r.scene)}</small></td><td>${esc(p.web || '')}</td><td>${esc(p.mobileWeb || '')}</td><td>${esc(p.miniprogram || '')}</td><td>${esc(r.crossPlatform || '')}</td><td>${badge(r.status)}</td></tr>`; }).join('');
const xRows = byGroup('X').map((r) => `<tr data-kind="建议" data-text="${esc(r.id + ' ' + r.scene)}"><td><b>${r.id}</b><br><small>${esc(r.scene)}</small></td><td colspan="3">${esc(r.requirement)}</td><td>${esc(xVerify[r.id]?.sample || '—')}<br><small>真机：${esc(xVerify[r.id]?.device || '未验证')}</small></td><td>${badge('建议')}</td></tr>`).join('');
const PL = { web: '电脑网页', 'mobile-web': '手机网页', miniprogram: '小程序' };
const varRows = sem.map((t) => { const vals = Object.keys(PL).map((p) => t.platforms[p]); const diff = new Set(vals).size > 1; return `<tr class="${diff ? 'diff' : ''}"><td><code>${t.css}</code><br><small>${esc(t.description)}</small></td>${vals.map((v) => `<td>${t.type === 'color' ? `<i class="sw" style="background:${v}"></i>` : ''}${esc(t.type === 'fontFamily' ? '系统字体' : v)}</td>`).join('')}<td>${badge(t.status || '建议')}</td></tr>`; }).join('');

// 截图画廊：视口 × 列表／详情
const VPS = ['1440', '1366', '1024', '900', '760', '600', '390', '320'];
const tierOf = (w) => (w > 900 ? '电脑 >900' : w > 600 ? '收紧 601～900' : '手机 ≤600');
const gallery = VPS.filter((v) => shots.includes(`${v}-详情.png`)).map((v) => `<figure><a href="${P.shots}${v}-详情.png" target="_blank" rel="noopener"><img loading="lazy" src="${P.shots}${v}-详情.png" alt="${v} 宽详情"></a><figcaption>${v}px · ${tierOf(Number(v))}</figcaption></figure>`).join('');

// 变量面板
const groupOf = (n) => /sidebar|on-primary/.test(n) ? '导航' : /danger|warning|success|neutral/.test(n) ? '业务状态' : /text-/.test(n) ? '字号' : /space|gutter|padding|gap/.test(n) ? '间距' : /radius|height|target|width/.test(n) ? '尺寸' : /shadow|font$/.test(n) ? '其他' : '基础色';
const panelRows = sem.filter((t) => t.type === 'color').map((t) => `<label class="tk"><input type="color" data-token="${t.css}" value="${t.value}"><code>${t.css}</code><span>${esc(t.description)}</span>${badge(t.status || '建议')}</label>`).join('');
const dimRows = dimTokens.filter((t) => /text-|space-|radius|height/.test(t.name)).map((t) => `<label class="tk"><input type="number" min="0" max="64" data-token="${t.css}" data-unit="px" value="${parseFloat(t.value)}"><code>${t.css}</code><span>${esc(t.description)}</span>${badge(t.status || '建议')}</label>`).join('');
const typeScale = sem.filter((t) => /^text-/.test(t.name)).map((t) => `<div class="ts"><span style="font-size:var(${t.css})">${esc(t.description)}：客户经营详情</span><code>${t.css} · ${t.value}</code></div>`).join('');
const spaceScale = sem.filter((t) => /^space-\d/.test(t.name)).map((t) => `<div class="ss"><i style="width:var(${t.css})"></i><code>${t.css} · ${t.value}</code><span>${esc(t.description)}</span></div>`).join('');

// 流程图（团队）
const FLOW = [
  { k: 'issue', t: '发现问题', d: '规则不够用、页面有偏差、要换颜色或间距。先看规则索引里有没有现成规则。', tpl: '01-任务单' },
  { k: 'change', t: '填变更单', d: '当前规则 → 实际问题 → 候选改法 → 受影响页面 → 如何验证。', tpl: '02-规则变更单' },
  { k: 'pr', t: '开 PR 改四样', d: '规则条目、样例／变量、代码或接入说明、验收项一起改；第五样（规则索引与 AI 技能引用）由 node tools/check.mjs 自动刷新。' },
  { k: 'review', t: '评审', d: '设计负责人＋产品负责人各一人；check.mjs --ci 必须通过。' },
  { k: 'tag', t: '合并 · 打标签', d: '语义化版本：只改值→修订号；新增兼容规则或变量→次版本；改含义、默认样式、导航约定→主版本并附迁移说明。' },
  { k: 'adopt', t: '登记采用', d: '每个产品 × 终端一行：收到 ≠ 采用 ≠ 已验证。', tpl: '04-产品采用登记表' },
];
const flowSvg = `<svg viewBox="0 0 ${FLOW.length * 150} 90" class="flow" role="img" aria-label="变更流程"><g>${FLOW.map((f, i) => `<g class="node" data-step="${f.k}" tabindex="0" role="button"><rect x="${i * 150 + 8}" y="16" width="130" height="52" rx="10"/><text x="${i * 150 + 73}" y="47">${f.t}</text></g>${i < FLOW.length - 1 ? `<path d="M${i * 150 + 138} 42 L${i * 150 + 158} 42" class="arrow"/>` : ''}`).join('')}</g></svg>`;

// 状态机（交互状态）：左「正常」，中三态，右两态；同一条线上两个方向的标签分别放线上方与下方
const NODES = [
  { id: 'normal', x: 20, y: 95, t: '正常', demo: { list: 'normal', detail: 'normal', q: '' } },
  { id: 'loading', x: 260, y: 20, t: '加载中', demo: { list: 'loading' } },
  { id: 'empty', x: 260, y: 95, t: '无匹配', demo: { list: 'normal', q: '不存在的客户' } },
  { id: 'detail', x: 260, y: 170, t: '打开详情', demo: { list: 'normal', q: '', detail: 'normal', open: true } },
  { id: 'error', x: 440, y: 20, t: '加载失败', demo: { list: 'error' } },
  { id: 'forbidden', x: 440, y: 170, t: '无权限', demo: { list: 'normal', q: '', detail: 'forbidden', open: true } },
];
const EDGES = [['normal', 'loading', '请求', '成功'], ['loading', 'error', '失败', '重试，条件不丢'], ['normal', 'empty', '搜索无结果', '清除条件'], ['normal', 'detail', '点一行', '返回，保留条件与位置'], ['detail', 'forbidden', '403', '']];
const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));
const smSvg = `<svg viewBox="0 0 580 240" class="sm" role="img" aria-label="列表与详情的状态机">${EDGES.map(([a, b, up, down]) => { const A = nodeById[a], B = nodeById[b]; const x1 = A.x + 120, y1 = A.y + 22, x2 = B.x, y2 = B.y + 22; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len; return `<path d="M${x1} ${y1} L${x2} ${y2}" class="edge"/><text x="${(mx + nx * -9).toFixed(1)}" y="${(my + ny * -9 + 4).toFixed(1)}" class="el">${up}</text>${down ? `<text x="${(mx + nx * 9).toFixed(1)}" y="${(my + ny * 9 + 4).toFixed(1)}" class="el">${down}</text>` : ''}`; }).join('')}${NODES.map((n) => `<g class="node" data-demo='${JSON.stringify(n.demo)}' tabindex="0" role="button"><rect x="${n.x}" y="${n.y}" width="120" height="44" rx="10"/><text x="${n.x + 60}" y="${n.y + 27}">${n.t}</text></g>`).join('')}</svg>`;

// 决策表
const decisionRows = decisions.map((d) => `<tr><td>${esc(d.item)}</td><td>${esc(d.who)}</td><td>${esc(d.impact)}</td><td>${esc(d.status)}</td></tr>`).join('');

// ---------- 页面 ----------
const NAV = [['home', '首页'], ['principles', '原则'], ['visual', '视觉基础'], ['components', '组件'], ['layout', '布局'], ['states', '交互状态'], ['cross', '跨端适配'], ['team', '团队怎么用']];
const confirmedTokens = sem.filter((t) => t.status === '已确认').length;
const body = `
<a class="skip" href="#main">跳到内容</a>
<div class="site">
<nav class="nav" aria-label="章节">
  <div class="brand"><span class="mark">SB</span><span>部门产品设计规范<small>SalesBuddy · ${esc(specVersion)}</small></span></div>
  ${NAV.map(([k, t], i) => `<a href="#${k}" data-nav="${k}"><span>${String(i).padStart(2, '0')}</span>${t}</a>`).join('')}
  <div class="navfoot"><b>状态词</b>${['已确认', '建议', '业务事实', '已验证（本地）', '未验证'].map(badge).join(' ')}</div>
</nav>
<main class="main" id="main">
<header class="top"><label class="find"><span class="sr">查规则编号或变量名</span><input id="find" type="search" placeholder="查编号或变量，如 T-02、--ui-primary"></label><span class="topnote">生成于 rules.json 与 dist 产物 · 本站不含任何手写规则</span></header>

<section data-panel="home">
  <h1>让用户看清信息、完成操作；让产品、设计、开发、测试和 AI 用同一套规则</h1>
  <p class="lead">这个站由规范仓库的源文件生成：规则来自 <code>rules.json</code>，颜色和间距来自 <code>tokens.json</code>，样板与验收来自 03 章。改源文件、跑一条命令，站点随之更新；站点本身不是第二份规范。</p>
  <div class="tiles">
    <div class="tile"><b>${rules.$meta.confirmed}</b><span>条 Web 规则已确认</span><small>P／V／C／T／B／G，1.0.0</small></div>
    <div class="tile"><b>${rules.$meta.suggested}</b><span>条跨端建议</span><small>X-01～X-12，待登记采用</small></div>
    <div class="tile"><b>${sem.length}</b><span>个设计变量</span><small>${confirmedTokens} 已确认 · ${sem.length - confirmedTokens} 建议</small></div>
    <div class="tile"><b>${accept.passed}/${accept.total}</b><span>项样板验收通过</span><small>本地合成数据 · 8 个视口</small></div>
  </div>
  <div class="card"><h2>五个状态词，别混</h2><div class="tbl"><table><tr><th>词</th><th>含义</th></tr><tr><td>${badge('已确认')}</td><td>Web V1 的 26 条正式规则，改它要走变更单</td></tr><tr><td>${badge('建议')}</td><td>跨端 X 规则、新增变量与流程，尚未登记采用</td></tr><tr><td>${badge('业务事实')}</td><td>产品原则与业务口径，不是设计规则</td></tr><tr><td>${badge('已验证（本地）')}</td><td>样板自动验收通过：合成数据、模拟视口，未真机</td></tr><tr><td>${badge('未验证')}</td><td>还没有任何证据</td></tr></table></div></div>
  <div class="card"><h2>已经决定的事</h2><ul><li>主色沿用 <code>--ui-primary</code>（已确认值），小程序待接入。</li><li>部门仓库 shandianT/desgin 是共同入口，文件约定 + Git，无后端。</li><li>原生 App 暂不在范围。</li></ul></div>
  <div class="card"><h2>怎么看这个站</h2><ol><li>按左侧七章顺序看，每章先有一个能动手的东西，再是对应规则卡片。</li><li>每张卡片右上角是状态词；点卡片展开要求、正反例、怎么检查、来源行号。</li><li>顶部搜索框输入编号或变量名可直接跳到。</li></ol></div>
</section>

<section data-panel="principles" hidden>
  <h1>原则</h1><p class="lead">先定「优先解决谁的什么问题，遇到取舍怎么判」。设计原则 P 是已确认规则；产品原则是业务事实；业务表达 B 规定客户、商机、缺失值、红黄绿灰怎么说。</p>
  <h2>设计原则（已确认）</h2>${cards(['P-01', 'P-02', 'P-03'])}
  <h2>产品原则（业务事实）</h2>
  ${factCard('以客户为核心，不以订单或商机为核心', '客户下面挂商机、拜访、毛利、合同；一个客户可有多条商机。', '产品仓库 CLAUDE.md「必须遵守的产品原则」')}
  ${factCard('销售不手工打分、不填复杂表单', '语音口述拜访 → Agent 结构化 → 人工确认归档；象限、风险、画像由 Agent 依据已确认事实重算，不可手工拖动或改分。', '产品仓库 CLAUDE.md')}
  ${factCard('四条不可破坏的原则', '同一对象、同一事实、统一权限、关键动作可确认可追溯。', '产品仓库 CLAUDE.md')}
  ${factCard('Agent 只生成草稿和洞察', '写入正式业务表必须经人工确认；权限由服务端判定，数据库 RLS 兜底。', '产品仓库 CLAUDE.md')}
  <h2>业务表达（已确认）</h2>${cards(['B-01', 'B-02', 'B-03', 'B-04', 'B-05'])}
</section>

<section data-panel="visual" hidden>
  <h1>视觉基础</h1><p class="lead">颜色、字号、间距、圆角都是变量。左边改一个值，右边的预览和下面的样板会一起变，这就是「改一处、各端同步」在浏览器里的样子。改完可以一键生成变更单草稿；这里的修改只在你的浏览器里，不会写回仓库。</p>
  <div class="two">
    <div class="card panel"><div class="ph"><h2>变量面板</h2><div><button class="btn sec" id="tk-reset">重置</button><button class="btn pri" id="tk-copy">复制为变更单草稿</button></div></div>
      <h3>颜色</h3><div class="tks">${panelRows}</div>
      <h3>字号、间距、尺寸（px）</h3><div class="tks">${dimRows}</div>
      <p class="note">加粗的端侧覆盖值与所有「建议」变量尚未登记采用；36 个已确认变量与 1.0.0 完全一致（check-tokens 校验）。</p></div>
    <div class="card preview"><h2>预览</h2>
      <div class="pv-nav"><span class="mark">SB</span><a class="on">客户</a><a>商机</a><a>任务</a></div>
      <div class="pv-work"><div class="pv-surface"><div class="pv-title">客户 <small>范围：本人负责 · 24 家</small></div><div class="pv-btns"><button class="ui-btn ui-primary">记录拜访</button><button class="ui-btn ui-secondary">创建任务</button><span class="ui-chip on">有风险</span></div><div class="ui-row on"><b>云岭教育科技</b><small>客户资源 · 关系 6/10 · 地盘 HB-03</small><span class="st st-warn">● 需关注</span></div><div class="ui-row"><b>金桥制造股份有限公司</b><small>客户资产 · 关系 9/10</small><span class="st st-err">● 转差</span></div><div class="ui-row"><b>华宸数据科技有限公司</b><small>客户资产 · 关系 8/10</small><span class="st st-ok">● 向好</span></div><div class="ui-row"><b>泰和银行数据中心</b><small>象限：待评估</small><span class="st st-none">● 待评估</span></div></div></div>
      <h3>字号</h3>${typeScale}
      <h3>间距</h3>${spaceScale}
    </div>
  </div>
  <div class="card"><h2>样板实时跟随</h2><iframe class="frame" data-sample title="样板（视觉基础）" src="${P.sample}?frame=visual" loading="lazy"></iframe></div>
  <h2>规则</h2>${cards(['V-01', 'V-02', 'V-03', 'V-04'])}
</section>

<section data-panel="components" hidden>
  <h1>组件</h1><p class="lead">每个组件在每个状态下长什么样都有定论。这张矩阵用类名模拟悬停与聚焦，全部只引用变量。</p>
  <div class="card">${matrix}<p class="note">选择器、日期等复杂控件的真实交互见 1.0.0 示例册；这里只定外观与状态。</p></div>
  <h2>规则</h2>${cards(['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07'])}
</section>

<section data-panel="layout" hidden>
  <h1>布局</h1><p class="lead">电脑上的「导航—列表—详情」三段，到手机变成「列表页 → 详情页 → 返回」。拖右下角把预览拉窄，看它在 900 与 600 两个门槛怎么折叠；手机上用下面的宽度按钮。</p>
  <div class="card"><div class="ph"><h2>拖宽看三档</h2><div class="presets">${['1200', '900', '760', '600', '390', '320'].map((w) => `<button class="btn sec" data-w="${w}">${w}</button>`).join('')}</div></div>
    <div class="readout" id="readout">当前宽度 — · —</div>
    <div class="resizer" id="resizer"><iframe class="frame tall" data-sample title="样板（布局）" src="${P.sample}?frame=layout" loading="lazy"></iframe></div>
    <div class="ascii"><pre>电脑 >900        [导航 220][客户列表 360][客户详情 其余宽度]        三栏并排
收紧 601～900    [栏 56][客户列表 ────────────]  → 点一行 →  [栏 56][详情覆盖列表 ‹返回]
手机 ≤600        [客户列表 整宽 + 底部导航]  → 点一行 →  [详情整页 ‹返回 + 底部操作条]</pre></div></div>
  <div class="card"><h2>8 个视口的自动截图</h2><div class="gallery">${gallery}</div></div>
  <h2>页面模板（已确认）</h2>${cards(['T-01', 'T-02', 'T-03', 'T-04', 'T-05'])}
  <h2>跨端布局建议</h2>${cards(['X-02', 'X-03', 'X-05'])}
</section>

<section data-panel="states" hidden>
  <h1>交互状态</h1><p class="lead">加载、空数据、失败、无权限是规范的一部分，不是开发自由发挥。点状态机的节点，下面的样板会真的切到那个画面，而且搜索与筛选条件不丢。</p>
  <div class="card"><div class="ph"><h2>状态机</h2><small>点节点驱动样板</small></div>${smSvg}</div>
  <div class="card"><iframe class="frame tall" data-sample data-states title="样板（交互状态）" src="${P.sample}?frame=states" loading="lazy"></iframe></div>
  <h2>规则</h2>${cards(['C-06', 'C-07', 'B-04', 'P-03', 'X-11'])}
</section>

<section data-panel="cross" hidden>
  <h1>跨端适配</h1><p class="lead">「含义」统一，「尺寸和摆放」适配，「平台自带的东西」直接引用平台。按端筛选，只剩需要适配的条目。</p>
  <div class="card"><div class="ph"><h2>规则逐条对照</h2><div class="presets" id="cross-filter"><button class="btn sec on" data-kind="">全部</button><button class="btn sec" data-kind="统一">统一</button><button class="btn sec" data-kind="适配">适配</button><button class="btn sec" data-kind="建议">跨端建议</button></div></div>
    <div class="tbl"><table class="cross"><tr><th>规则</th><th>电脑网页</th><th>手机网页</th><th>小程序</th><th>结论／样板验证</th><th>状态</th></tr>${crossRows}${xRows}</table></div></div>
  <div class="card"><h2>变量在三端的值</h2><p class="note">高亮行是端侧不同的值（均为建议）。原生 App 暂不在范围。</p><div class="tbl"><table class="vars"><tr><th>变量</th><th>电脑网页</th><th>手机网页</th><th>小程序</th><th>状态</th></tr>${varRows}</table></div></div>
  <div class="card"><h2>小程序原生颜色接入情况</h2>${appDiff ? `<div class="tbl"><table><tr><th>app.json 项</th><th>当前</th><th>规范</th><th>状态</th></tr>${appDiff.map((d) => `<tr><td><code>${d.key}</code></td><td><i class="sw" style="background:${esc(d.cur)}"></i>${esc(d.cur)}</td><td><i class="sw" style="background:${esc(d.spec)}"></i>${esc(d.spec)}</td><td>${d.same ? badge('已验证（本地）') : '<span class="st st-none">待接入</span>'}</td></tr>`).join('')}</table></div><p class="note">原生 tabBar 与导航栏不认 CSS 变量，只能写十六进制；值由 tokens.json 生成到 miniprogram-app.tokens.json。当前小程序样式 0 处引用变量，是第一张待办变更。</p>` : '<p class="note">生成时未找到产品仓库的 app.json（设置 MINIPROGRAM_DIR），跳过比对。</p>'}</div>
  <h2>跨端建议全文</h2>${cards(byGroup('X').map((r) => r.id))}
</section>

<section data-panel="team" hidden>
  <h1>团队怎么用</h1><p class="lead">一份来源、四个入口、一道闸门。改规则走变更单和 PR，版本打标签，各产品登记采用。点流程里的一步，看对应模板。</p>
  <div class="card"><h2>变更流程</h2>${flowSvg}<p class="note">点每一步查看说明与模板。</p></div>
  <div class="card"><h2>一份来源、四个入口、一道闸门</h2><div class="arch"><div class="src"><b>一份来源</b><span>specs/salesbuddy/</span><small>规则原文 · tokens.json · 样板 · 模板 · 验收</small></div><div class="arrows">→</div><div class="entries"><div><b>人看</b><span>README、各章、本站</span></div><div><b>开发用</b><span>dist/ 变量产物、rules.json</span></div><div><b>AI 用</b><span>.claude/skills/design-spec 技能 + 按路径规则</span></div><div><b>其他工具</b><span>AGENTS.md、.agents、.cursor、.github</span></div></div><div class="arrows">→</div><div class="gate"><b>一道闸门</b><span>node tools/check.mjs</span><small>生成变量 → 兼容校验 → 规则索引 → 样式检查（报规则编号）→ 技能引用；Claude Code 钩子每次写文件后自动跑</small></div></div></div>
  <div class="card"><h2>怎么引用</h2><div class="tbl"><table><tr><th>谁</th><th>怎么写</th></tr><tr><td>产品写需求</td><td>规则编号 + 页面模板 + 样板锚点，如「客户列表按 T-02、C-04；返回保留按 X-03（建议）」</td></tr><tr><td>设计出稿</td><td>标注变量名不标数值，如「按钮底色 --ui-primary」</td></tr><tr><td>开发写代码</td><td>只写 var(--ui-*)；PR 描述写规则编号；改完 node tools/check.mjs</td></tr><tr><td>测试验收</td><td>页面验收单逐项填实际结果与证据；空白不算通过</td></tr><tr><td>AI</td><td>技能自动触发；手动 /design-spec；交回规则编号、改动文件、新增变量数、检查输出、证据等级</td></tr></table></div></div>
  <div class="card"><h2>角色（人名待填）</h2><div class="tbl"><table><tr><th>角色</th><th>负责</th><th>实际负责人</th></tr><tr><td>产品／业务负责人</td><td>变更单业务影响；PR 评审</td><td>待填</td></tr><tr><td>设计负责人</td><td>tokens.json 与规则文字；PR 评审</td><td>待填</td></tr><tr><td>开发负责人</td><td>各端接入与脚本</td><td>待填</td></tr><tr><td>测试／验收负责人</td><td>验收单与真机</td><td>待填</td></tr><tr><td>规范维护人</td><td>合并、打标签、更新日志、采用表</td><td>待填</td></tr></table></div></div>
  <div class="card"><h2>待决定与已决定</h2><div class="tbl"><table><tr><th>事项</th><th>谁决定</th><th>影响</th><th>状态</th></tr>${decisionRows}</table></div></div>
  <h2>验收与维护规则（已确认）</h2>${cards(['G-01', 'G-02'])}
</section>
</main>
</div>
<div class="modal" id="modal" hidden role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="mbox"><div class="mh"><h2 id="modal-title"></h2><button class="btn sec" id="modal-close" aria-label="关闭">×</button></div><div class="mb" id="modal-body"></div></div></div>
<script type="application/json" id="tpl-data">${JSON.stringify(Object.fromEntries(templates.map((t) => [t.name, md(t.md)]))).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="flow-data">${JSON.stringify(FLOW).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="token-defaults">${JSON.stringify(Object.fromEntries(sem.map((t) => [t.css, t.value]))).replace(/</g, '\\u003c')}</script>
`;

const css = `
html, body { height: auto; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--ui-background); color: var(--ui-ink); font-family: var(--ui-font); font-size: var(--ui-text-body); line-height: 1.65; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: var(--ui-text-page); font-weight: 650; line-height: 1.5; margin-bottom: var(--ui-space-2); }
h2 { font-size: var(--ui-text-section); font-weight: 600; margin: var(--ui-space-6) 0 var(--ui-space-3); }
h3 { font-size: var(--ui-text-body); font-weight: 600; margin: var(--ui-space-4) 0 var(--ui-space-2); color: var(--ui-secondary); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: var(--ui-text-small); background: var(--ui-neutral-soft); padding: 0 4px; border-radius: 4px; }
button { font: inherit; cursor: pointer; }
:is(a, button, input, [tabindex="0"]):focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.skip { position: absolute; left: -9999px; } .skip:focus { left: 8px; top: 8px; background: var(--ui-surface); padding: 8px; z-index: 99; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.site { display: grid; grid-template-columns: var(--ui-nav-width) minmax(0, 1fr); min-height: 100vh; }
.nav { position: sticky; top: 0; height: 100vh; overflow: auto; background: var(--ui-sidebar); color: var(--ui-sidebar-ink); padding: var(--ui-space-4) var(--ui-space-3); display: flex; flex-direction: column; gap: var(--ui-space-1); }
.brand { display: flex; gap: var(--ui-space-2); align-items: center; padding: var(--ui-space-2) var(--ui-space-2) var(--ui-space-4); color: var(--ui-on-primary); font-weight: 650; font-size: var(--ui-text-section); line-height: 1.3; }
.brand small, .pv-nav .mark { display: block; font-weight: 400; font-size: var(--ui-text-small); color: var(--ui-sidebar-muted); }
.mark { width: 28px; height: 28px; border-radius: 8px; background: var(--ui-primary); color: var(--ui-on-primary); display: grid; place-items: center; font-size: 12px; flex: none; }
.nav a { display: flex; gap: var(--ui-space-3); align-items: center; min-height: var(--ui-control-height); padding: 0 var(--ui-space-3); border-radius: var(--ui-radius-control); color: var(--ui-sidebar-nav); text-decoration: none; }
.nav a span { font-size: var(--ui-text-small); opacity: .7; width: 20px; }
.nav a:hover { background: var(--ui-sidebar-hover); color: var(--ui-on-primary); }
.nav a[aria-current="page"] { background: var(--ui-sidebar-active); color: var(--ui-on-primary); box-shadow: inset 3px 0 var(--ui-sidebar-accent); font-weight: 600; }
.navfoot { margin-top: auto; padding: var(--ui-space-3) var(--ui-space-2) 0; font-size: var(--ui-text-small); color: var(--ui-sidebar-muted); display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.navfoot b { width: 100%; color: var(--ui-on-primary); }
.main { min-width: 0; padding: var(--ui-space-4) var(--ui-page-gutter) var(--ui-space-8); max-width: 1180px; }
.top { display: flex; gap: var(--ui-space-3); align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: var(--ui-space-4); }
.find input { height: var(--ui-field-height); width: min(360px, 100%); padding: 0 var(--ui-space-3); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); color: var(--ui-ink); font: inherit; }
.topnote { color: var(--ui-muted); font-size: var(--ui-text-small); }
.lead { color: var(--ui-secondary); max-width: 64em; margin-bottom: var(--ui-space-4); }
.card { background: var(--ui-surface); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-panel); padding: var(--ui-card-padding); margin-bottom: var(--ui-space-3); }
.card > h2:first-child { margin-top: 0; }
.ph { display: flex; justify-content: space-between; align-items: center; gap: var(--ui-space-3); flex-wrap: wrap; } .ph h2 { margin: 0; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--ui-space-3); margin: var(--ui-space-4) 0; }
.tile { background: var(--ui-surface); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-panel); padding: var(--ui-card-padding); }
.tile b { display: block; font-size: var(--ui-text-metric); font-weight: 650; line-height: 1.2; color: var(--ui-primary); font-variant-numeric: tabular-nums; }
.tile span { display: block; font-weight: 600; } .tile small { color: var(--ui-muted); font-size: var(--ui-text-small); }
.st { display: inline-flex; align-items: center; gap: 4px; padding: 0 var(--ui-space-2); border-radius: 4px; font-size: var(--ui-text-small); line-height: 20px; white-space: nowrap; font-weight: 500; }
.st-ok { background: var(--ui-success-soft); color: var(--ui-success); } .st-warn { background: var(--ui-warning-soft); color: var(--ui-warning); } .st-err { background: var(--ui-danger-soft); color: var(--ui-danger); }
.st-fact { background: var(--ui-neutral-soft); color: var(--ui-neutral); } .st-local { background: var(--ui-selected); color: var(--ui-primary); } .st-none { background: var(--ui-neutral-soft); color: var(--ui-muted); }
.rule summary { display: flex; align-items: center; gap: var(--ui-space-3); cursor: pointer; list-style: none; min-height: var(--ui-control-height); }
.rule summary::-webkit-details-marker { display: none; }
.rule .rid { font-family: ui-monospace, Menlo, monospace; font-weight: 650; color: var(--ui-primary); min-width: 44px; }
.rule .rtitle { flex: 1; font-weight: 600; min-width: 0; }
.rule .st { margin-left: auto; }
.rbody { padding-top: var(--ui-space-3); border-top: 1px solid var(--ui-line); margin-top: var(--ui-space-3); display: flex; flex-direction: column; gap: var(--ui-space-2); }
.req { font-size: var(--ui-text-section); line-height: 1.6; }
.src, .note { color: var(--ui-muted); font-size: var(--ui-text-small); }
.rule.hit { outline: 2px solid var(--ui-focus); }
.tbl { overflow-x: auto; } table { border-collapse: collapse; width: 100%; } th, td { text-align: left; vertical-align: top; padding: var(--ui-space-2) var(--ui-space-3); border-bottom: 1px solid var(--ui-line); } th { color: var(--ui-secondary); font-weight: 600; font-size: var(--ui-text-small); white-space: nowrap; }
tr.diff td { background: var(--ui-selected); }
.sw { display: inline-block; width: 14px; height: 14px; border-radius: 4px; border: 1px solid var(--ui-line); vertical-align: -2px; margin-right: 6px; }
.two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--ui-space-3); }
.tks { display: flex; flex-direction: column; gap: 4px; max-height: 360px; overflow: auto; }
.tk { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: var(--ui-space-2); align-items: center; min-height: 32px; }
.tk span { display: none; } .tk code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
.ui-primary { background: var(--ui-primary); color: var(--ui-on-primary); } .ui-primary:hover, .ui-primary.is-hover { background: var(--ui-primary-hover); }
.ui-secondary { background: var(--ui-surface); color: var(--ui-primary); border-color: var(--ui-line); } .ui-secondary:hover, .ui-secondary.is-hover { background: var(--ui-selected); }
.ui-btn:disabled { opacity: .55; cursor: not-allowed; } .is-focus { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.ui-field { display: flex; flex-direction: column; gap: 4px; font-size: var(--ui-text-small); color: var(--ui-secondary); }
.ui-field input { height: var(--ui-field-height); padding: 0 var(--ui-space-3); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); font: inherit; font-size: var(--ui-text-body); color: var(--ui-ink); background: var(--ui-surface); width: 100%; min-width: 150px; }
.ui-field input.is-hover { border-color: var(--ui-focus); } .ui-field input:disabled { background: var(--ui-neutral-soft); } .ui-field.is-error input { border-color: var(--ui-danger); }
.ui-err { color: var(--ui-danger); font-size: var(--ui-text-small); display: block; margin-top: 4px; }
.ui-select { display: inline-flex; justify-content: space-between; gap: var(--ui-space-2); min-width: 170px; height: var(--ui-control-height); padding: 0 var(--ui-space-3); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); color: var(--ui-ink); font: inherit; align-items: center; }
.ui-select.is-hover { border-color: var(--ui-focus); } .ui-select:disabled { opacity: .55; } .ui-select i { font-style: normal; color: var(--ui-muted); }
.ui-chip { display: inline-flex; align-items: center; min-height: 32px; padding: 0 var(--ui-space-3); border-radius: 999px; border: 1px solid var(--ui-line); color: var(--ui-secondary); background: var(--ui-surface); }
.ui-chip.is-hover { border-color: var(--ui-focus); color: var(--ui-primary); } .ui-chip.on { background: var(--ui-selected); border-color: var(--ui-primary); color: var(--ui-primary); font-weight: 600; } .ui-chip.off { opacity: .55; }
.ui-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px var(--ui-space-3); padding: var(--ui-space-2) var(--ui-space-3); border-bottom: 1px solid var(--ui-line); min-width: 200px; align-items: center; }
.ui-row b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .ui-row small { color: var(--ui-secondary); font-size: var(--ui-text-small); grid-column: 1; } .ui-row .st, .ui-row em { grid-column: 2; grid-row: 1 / 3; align-self: center; font-style: normal; color: var(--ui-muted); font-size: var(--ui-text-small); }
.ui-row.is-hover { background: var(--ui-background); } .ui-row.on { background: var(--ui-selected); box-shadow: inset 3px 0 var(--ui-primary); }
.matrix td { min-width: 150px; }
.ts { display: flex; justify-content: space-between; align-items: baseline; gap: var(--ui-space-3); padding: var(--ui-space-2) 0; border-bottom: 1px solid var(--ui-line); }
.ss { display: grid; grid-template-columns: 40px auto minmax(0, 1fr); gap: var(--ui-space-3); align-items: center; padding: 4px 0; font-size: var(--ui-text-small); color: var(--ui-secondary); } .ss i { display: block; height: 12px; background: var(--ui-primary); border-radius: 2px; }
.frame { width: 100%; height: 560px; border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); display: block; } .frame.tall { height: 640px; }
.resizer { resize: horizontal; overflow: hidden; min-width: 280px; max-width: 100%; width: 100%; border: 2px dashed var(--ui-line); border-radius: var(--ui-radius-control); padding: 4px; }
.readout { font-weight: 600; margin: var(--ui-space-3) 0; color: var(--ui-primary); font-variant-numeric: tabular-nums; }
.ascii pre { margin: var(--ui-space-3) 0 0; padding: var(--ui-space-3); background: var(--ui-background); border-radius: var(--ui-radius-control); font-size: var(--ui-text-small); overflow-x: auto; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--ui-space-3); } figure { margin: 0; } figure img { width: 100%; border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); } figcaption { font-size: var(--ui-text-small); color: var(--ui-secondary); margin-top: 4px; }
svg.flow, svg.sm { width: 100%; height: auto; max-width: 100%; }
.node rect { fill: var(--ui-surface); stroke: var(--ui-primary); stroke-width: 1.5; } .node text { fill: var(--ui-ink); font-size: 14px; text-anchor: middle; font-weight: 600; } .node { cursor: pointer; } .node:hover rect, .node:focus rect, .node.on rect { fill: var(--ui-selected); } .node:focus { outline: none; }
.arrow, .edge { stroke: var(--ui-muted); stroke-width: 1.5; fill: none; } .el { fill: var(--ui-secondary); font-size: 11px; text-anchor: middle; paint-order: stroke; stroke: var(--ui-surface); stroke-width: 4px; }
.arch { display: grid; grid-template-columns: 1fr auto 1.4fr auto 1fr; gap: var(--ui-space-3); align-items: center; } .arch > div { border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); padding: var(--ui-space-3); } .arch .arrows { border: 0; text-align: center; color: var(--ui-muted); font-size: var(--ui-text-page); }
.arch b { display: block; color: var(--ui-primary); } .arch span { display: block; font-weight: 600; } .arch small { color: var(--ui-muted); font-size: var(--ui-text-small); } .entries { display: grid; gap: var(--ui-space-2); } .entries > div { border: 1px solid var(--ui-line); border-radius: 6px; padding: var(--ui-space-2); }
.modal { position: fixed; inset: 0; background: rgb(25 40 66 / .45); display: grid; place-items: center; padding: var(--ui-space-4); z-index: 50; } .modal[hidden] { display: none; }
.mbox { background: var(--ui-surface); border-radius: var(--ui-radius-panel); max-width: 860px; width: 100%; max-height: 90vh; overflow: auto; padding: var(--ui-card-padding); box-shadow: var(--ui-shadow-popup); }
.mh { display: flex; justify-content: space-between; align-items: center; gap: var(--ui-space-3); margin-bottom: var(--ui-space-3); } .mh h2 { margin: 0; }
.mb h3, .mb h4, .mb h5 { margin: var(--ui-space-4) 0 var(--ui-space-2); } .mb p { margin: 0 0 var(--ui-space-2); } .mb blockquote { margin: 0 0 var(--ui-space-2); padding-left: var(--ui-space-3); border-left: 3px solid var(--ui-line); color: var(--ui-secondary); }
@media (max-width: 900px) {
  .site { grid-template-columns: minmax(0, 1fr); }
  .nav { position: sticky; top: 0; height: auto; flex-direction: row; overflow-x: auto; gap: var(--ui-space-2); padding: var(--ui-space-2) var(--ui-page-gutter); z-index: 5; }
  .brand { display: none; } .navfoot { display: none; } .nav a { flex: none; min-height: var(--ui-touch-target); } .nav a span { display: none; }
  .two { grid-template-columns: minmax(0, 1fr); } .arch { grid-template-columns: minmax(0, 1fr); } .arch .arrows { transform: rotate(90deg); }
  .frame, .frame.tall { height: 520px; } .resizer { resize: none; }
  .tile b { font-size: var(--ui-text-page); }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const js = `
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  // 章节路由
  var panels = $$('[data-panel]'), links = $$('.nav a[data-nav]');
  function show(name) {
    if (!panels.some(function (p) { return p.dataset.panel === name; })) name = 'home';
    panels.forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    links.forEach(function (a) { if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
  }
  function route() { var h = decodeURIComponent(location.hash.slice(1)); var m = h.match(/^(rule-[A-Z]-\\d\\d)$/); if (m) { var el = document.getElementById(m[1]); if (el) { show(el.closest('[data-panel]').dataset.panel); el.open = true; el.classList.add('hit'); el.scrollIntoView({ block: 'center' }); return; } } show(h || 'home'); }
  window.addEventListener('hashchange', route); route();
  // 查编号或变量
  $('#find').addEventListener('change', function () {
    var q = this.value.trim(); if (!q) return;
    var rid = q.toUpperCase().match(/[PVCTBGX]-\\d\\d/); if (rid && document.getElementById('rule-' + rid[0])) { location.hash = 'rule-' + rid[0]; return; }
    if (/^--ui-/.test(q)) { var inp = $('.tk input[data-token="' + q + '"]'); if (inp) { show('visual'); inp.closest('.tk').scrollIntoView({ block: 'center' }); inp.focus(); return; } }
    var el = $$('.rule').filter(function (d) { return d.textContent.indexOf(q) >= 0; })[0]; if (el) { show(el.closest('[data-panel]').dataset.panel); el.open = true; el.scrollIntoView({ block: 'center' }); }
  });
  // 变量面板：改站点根变量并广播给样板
  var defaults = JSON.parse($('#token-defaults').textContent), changed = {};
  function frames() { return $$('iframe[data-sample]').map(function (f) { return f.contentWindow; }).filter(Boolean); }
  function setToken(name, value) { document.documentElement.style.setProperty(name, value); changed[name] = value; frames().forEach(function (w) { w.postMessage({ type: 'set-token', name: name, value: value }, '*'); }); }
  $$('.tk input').forEach(function (inp) { inp.addEventListener('input', function () { setToken(inp.dataset.token, inp.dataset.unit ? inp.value + inp.dataset.unit : inp.value); }); });
  $('#tk-reset').addEventListener('click', function () { document.documentElement.removeAttribute('style'); changed = {}; frames().forEach(function (w) { w.postMessage({ type: 'reset-tokens' }, '*'); }); $$('.tk input').forEach(function (inp) { inp.value = inp.dataset.unit ? parseFloat(defaults[inp.dataset.token]) : defaults[inp.dataset.token]; }); });
  $('#tk-copy').addEventListener('click', function () {
    var rows = Object.keys(changed).map(function (k) { return '| ' + k + ' | ' + defaults[k] + ' | ' + changed[k] + ' |'; });
    var text = '# 设计规则变更单（草稿，由规范站生成）\\n\\n状态：提出。当前规范版本：${esc(specVersion)}。\\n\\n| 变量 | 当前值 | 候选值 |\\n|---|---|---|\\n' + (rows.length ? rows.join('\\n') : '| （尚未修改任何变量） | | |') + '\\n\\n遇到的实际问题与证据：____\\n受影响的产品、终端、页面、组件：____\\n实现与验证方法：改 tokens.json 后运行 node tools/check.mjs；样板验收；各端截图。\\n决策负责人：设计负责人＋产品负责人。\\n';
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
const full = `<!doctype html>\n<html lang="zh-CN">\n<head>\n${head}\n</head>\n<body>\n${body}\n<script>${js}</script>\n</body>\n</html>\n`;

if (!portable) {
  const out = join(specDir, '站点'); mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'index.html'), full);
  console.log(`规范站 → ${join(out, 'index.html')}（${(full.length / 1024).toFixed(0)} KB）`);
} else {
  mkdirSync(join(portable, 'sample'), { recursive: true }); mkdirSync(join(portable, 'shots'), { recursive: true });
  const tokensCss = R('02-设计变量与同步链路/dist/design-tokens.css');
  writeFileSync(join(portable, 'sample', 'design-tokens.css'), tokensCss);
  const sample = R('03-跨端样板-客户列表到详情/index.html').replace(/<link rel="stylesheet" href="[^"]*design-tokens\.css">/, '<link rel="stylesheet" href="design-tokens.css">');
  writeFileSync(join(portable, 'sample', 'index.html'), sample);
  for (const v of VPS) for (const k of ['详情']) if (shots.includes(`${v}-${k}.png`)) copyFileSync(join(shotsDir, `${v}-${k}.png`), join(portable, 'shots', `${v}-${k}.png`));
  const page = artifact ? `<title>部门产品设计规范</title><link rel="stylesheet" href="${P.tokensCss}"><style>${css}</style>\n${body}\n<script>${js}</script>\n` : full;
  writeFileSync(join(portable, 'index.html'), page);
  console.log(`可发布站点 → ${portable}（index.html + sample/ + shots/）`);
}
