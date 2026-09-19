#!/usr/bin/env node
/**
 * 可视化规范站生成器（零依赖）。
 * 输入（全部是仓库内的源或生成物，本脚本不手写任何规则、CSS 不含任何字面色值）：
 *   rules.json、02/dist/design-tokens.json、02/tokens.json（$meta）、02/产品现状/miniprogram-app.json（tools/sync-product.mjs 同步的快照）、
 *   03/验收结果.json、03/截图/、1.0.0/模板/*.md、采用登记表.md、01-三端规则对照表.md
 * 输出：<规范目录>/<站点目录>/index.html（相对引用样板、变量 CSS、截图）
 *      --portable <目录>：把站点与依赖复制成可独立发布的一份（GitHub Pages、claude.ai、U 盘），--artifact 再去掉 html 外壳
 * 用法：node tools/build-site.mjs specs/salesbuddy [--tokens-dir 02-…] [--sample-dir 03-…] [--snapshot-dir 1.0.0-…] [--site-dir 站点] [--portable out/site] [--artifact]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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
const P = portable ? { sample: 'sample/index.html', tokensCss: 'sample/design-tokens.css', shots: 'shots/' } : { sample: `../${D.sample}/index.html`, tokensCss: `../${D.tokens}/dist/design-tokens.css`, shots: `../${D.sample}/截图/` };

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
  ${/[PVCTBG]/.test(r.group) && r.crossKind ? `<p><b>跨端结论</b>　${esc(r.crossKind)}：${esc(r.crossPlatform || '—')}　<small>（统一／适配划分为本轮建议，见 01 章）</small></p>` : ''}
  ${extra}
  <p class="src">来源：${esc(r.sourceFile)}:${r.sourceLine}${r.status === '建议' ? '　（跨端建议，待登记采用）' : ''}</p></div></details>`;
}
const cards = (ids, openFirst = false) => ids.map((id) => ruleById[id]).filter(Boolean).map((r, i) => ruleCard(r, { open: openFirst && i === 0 })).join('');
const factCard = (title, body, src, vars = []) => `<details class="card rule fact"><summary><span class="rid">原则</span><span class="rtitle"><span>${esc(title)}</span></span>${badge('业务事实')}</summary><div class="rbody"><p class="req">${esc(body)}</p>${vars.length ? `<p><b>相关变量</b>　${vars.map((v) => `<code>${esc(v)}</code>`).join(' ')}</p>` : ''}<p class="src">来源：${esc(src)}</p></div></details>`;
// 产品原则：逐字引用产品仓库 CLAUDE.md「必须遵守的产品原则」（业务事实，不是设计规则）
const PRINCIPLES = [
  ['以客户为核心，不以订单或商机为核心。', '客户下面挂商机、拜访、毛利、合同。一个客户可有多条商机。', 43],
  ['销售不手工打分、不填复杂表单。', '语音口述拜访 → Agent 结构化 → 人工确认归档；象限、风险、画像由 Agent 依据已确认事实重算，不可手工拖动或改分。', 44],
  ['四条不可破坏的原则：', '同一对象、同一事实、统一权限、关键动作可确认可追溯。', 45],
  ['Agent 只生成草稿和洞察；写入正式业务表必须经人工确认。', 'Tool 分 Read / Draft / Command / External 四类，Agent 不直连数据库。', 46],
  ['产品核心 / 产品配置 / 项目定制三层分开。', '神码专属内容走定制或配置，不改跟进记录逻辑与三张表（客户表、商机表、跟进记录表）。', 47],
  ['权限由服务端判定，数据库 RLS 兜底。', '销售看本人，主管看直属团队，总经理看授权部门，董事长只读核心客户。', 48],
  ['对客文案使用中文全角标点；正文字号不小于 14px，卡片说明不小于 12px。', '（本条直接决定 --ui-text-body 与 --ui-text-small 的底线。）', 49, ['--ui-text-body', '--ui-text-small']],
];
const principleCards = PRINCIPLES.map(([t, b, line, vars]) => factCard(t, b, `产品仓库 shandianT/xiaoshouguanli CLAUDE.md:${line}「必须遵守的产品原则」`, vars || [])).join('');

// 组件状态矩阵：行 × 列，用类模拟伪状态。产品里的状态标签用 .tag（业务状态），与站点的证据状态词 .st 分开
const STATES = ['默认', '悬停', '聚焦', '禁用', '处理中', '错误／空'];
const tag = (cls, text) => `<span class="tag ${cls}">${text}</span>`;
const comp = {
  '主按钮': (s) => `<button class="ui-btn ui-primary ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" ${s === '禁用' || s === '处理中' ? 'disabled' : ''}>${s === '处理中' ? '保存中…' : s === '错误／空' ? '重试' : '记录拜访'}</button>`,
  '次按钮': (s) => `<button class="ui-btn ui-secondary ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" ${s === '禁用' ? 'disabled' : ''}>${s === '处理中' ? '处理中…' : '创建任务'}</button>`,
  '输入框': (s) => `<label class="ui-field ${s === '错误／空' ? 'is-error' : ''}"><span>客户名称${s === '错误／空' ? '（必填）' : ''}</span><input class="${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" value="${s === '错误／空' ? '' : '华宸数据科技'}" ${s === '禁用' ? 'disabled' : ''} ${s === '处理中' ? 'readonly' : ''} placeholder="搜索客户名称或负责人"></label>${s === '错误／空' ? '<small class="ui-err">请填写客户名称，已保留其余输入</small>' : ''}`,
  '选择器': (s) => `<button class="ui-select ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''}" ${s === '禁用' ? 'disabled' : ''}><span>${s === '错误／空' ? '无匹配结果' : s === '处理中' ? '加载选项…' : '第三季度'}</span><i>▾</i></button>`,
  '筛选片': (s) => `<span class="ui-chip ${s === '聚焦' ? 'is-focus' : ''} ${s === '悬停' ? 'is-hover' : ''} ${s === '处理中' ? 'on' : ''} ${s === '禁用' ? 'off' : ''}">${s === '处理中' ? '有风险 · 已选' : '有风险'}</span>`,
  '列表行': (s) => `<div class="ui-row ${s === '悬停' ? 'is-hover' : ''} ${s === '聚焦' ? 'is-focus' : ''} ${s === '处理中' ? 'on' : ''}"><b>云岭教育科技</b><small>${s === '错误／空' ? '没有匹配的客户 · 清除条件' : s === '处理中' ? '已选中 · 详情打开' : '客户资源 · 关系 6/10'}</small>${s === '禁用' ? '<em>无权限</em>' : tag('tag-warn', '需关注')}</div>`,
  '状态标签': (s) => ({ '默认': tag('tag-ok', '● 向好'), '悬停': tag('tag-warn', '● 需关注'), '聚焦': tag('tag-err', '● 转差'), '禁用': tag('tag-none', '● 待评估'), '处理中': tag('tag-none', '加载中…'), '错误／空': tag('tag-none', '未登记') })[s],
};
const matrix = `<div class="tbl"><table class="matrix"><tr><th>组件</th>${STATES.map((s) => `<th>${s}</th>`).join('')}</tr>${Object.entries(comp).map(([n, f]) => `<tr><th>${n}</th>${STATES.map((s) => `<td>${f(s)}</td>`).join('')}</tr>`).join('')}</table></div>`;

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
  <h1>让用户看清信息、完成操作；让产品、设计、开发、测试和 AI 用同一套规则</h1>
  <p class="lead">三端现在各画各的。${problemLine}，颜色和字号靠截图口口相传，改一处要改三处。这个站把规则、颜色、样板放在一处，都由规范源文件生成。改源文件、跑一条命令，站点跟着更新。覆盖 SalesBuddy 销售管理的电脑网页、手机网页和微信小程序「销售智助」。</p>
  <div class="card brief"><h2>汇报用这一页</h2>
    <ol>
      <li><b>问题</b>　${problemLine}。哪些必须一样、哪些允许不一样，以前没人拍板。</li>
      <li><b>做了什么</b>　${rules.$meta.confirmed} 条 Web 规则 ${badge('已确认')}，${byGroup('X').length} 条跨端规则 ${badge('建议')}${byGroup('D').length + byGroup('A').length ? `，${byGroup('D').length + byGroup('A').length} 条候选原则 ${badge('建议')}` : ''}，${sem.length} 个设计变量，一页「客户列表到详情再返回」的样板 ${accept.total ? `${accept.passed}/${accept.total} 项 ${badge('已验证（本地）')}` : badge('未验证')}。</li>
      <li><b>证据到什么程度</b>　看每张卡片右上角的状态词。真机和真实工程接入都还没做。</li>
      <li><b>今天要决定的事</b>　${pending.length ? `<ul>${pending.map((d) => `<li>${inline(d.item)}　<small>谁决定：${inline(d.who)} · ${inline(d.status)}</small></li>`).join('')}</ul>` : '暂无'}</li>
      <li><b>要认领的角色</b>　${ROLES.map((r) => r[0]).join('、')}。目前都还没填人，见「团队怎么用」。</li>
      <li><b>下一步</b>　${nextSteps.length ? `<ul>${nextSteps.map((s) => `<li>${inline(s)}</li>`).join('')}</ul>` : '见采用登记表'}</li>
    </ol>
    <p class="note">15 分钟汇报可以这样走：这一页 3 分钟，视觉基础改一个颜色 3 分钟，布局拖宽 2 分钟，交互状态点节点 2 分钟，跨端对照点「适配」2 分钟，回到这一页要决策 3 分钟。</p></div>
  <div class="tiles">
    <div class="tile"><b>${rules.$meta.confirmed}</b><span>条 Web 规则已确认</span><small>P、V、C、T、B、G 六组，规范 1.0.0</small></div>
    <div class="tile"><b>${rules.$meta.suggested}</b><span>条建议规则</span><small>跨端 X ${byGroup('X').length} 条${byGroup('D').length + byGroup('A').length ? `，候选原则 D 与 A ${byGroup('D').length + byGroup('A').length} 条` : ''}。草稿版本 ${esc(specVersion)}，登记采用后转正</small></div>
    <div class="tile"><b>${sem.length}</b><span>个设计变量</span><small>${confirmedTokens} 个已确认，${suggestedTokens} 个建议，${overrideCount} 个有端侧覆盖值</small></div>
    <div class="tile">${acceptTile}</div>
  </div>
  <div class="card"><h2>几个词</h2><div class="tbl"><table><tr><th>词</th><th>意思</th></tr><tr><td>设计变量</td><td>颜色、字号、间距的统一名字（如 <code>--ui-primary</code>）；改名字对应的值，各端一起变</td></tr><tr><td>样板</td><td>03 章那页可点的「客户列表→详情→返回」演示页，用来验证规则，不是真实产品</td></tr><tr><td>变更单</td><td>改规则前填的一页表：当前规则、实际问题、候选改法、受影响页面、怎么验证</td></tr><tr><td>登记采用</td><td>某产品的某个端在采用登记表写下「已采用」；收到 ≠ 采用 ≠ 已验证</td></tr><tr><td>视口</td><td>浏览器窗口的宽度；本规范按 >900、601～900、≤600 三档</td></tr><tr><td>PR</td><td>在 Git 上提交一次修改申请，评审通过后合并</td></tr></table></div></div>
  <div class="card"><h2>状态词</h2><div class="tbl"><table><tr><th>词</th><th>含义</th></tr><tr><td>${badge('已确认')}</td><td>Web 1.0 的 ${rules.$meta.confirmed} 条正式规则，和 1.0.0 已定值的 ${confirmedTokens} 个变量。改它要走变更单</td></tr><tr><td>${badge('建议')}</td><td>跨端 X 规则、候选原则 D 与 A、新增变量、端侧覆盖值、流程。还没登记采用</td></tr><tr><td>${badge('业务事实')}</td><td>产品原则和业务口径，不是设计规则</td></tr><tr><td>${badge('已验证（本地）')}</td><td>样板自动验收通过。合成数据，模拟视口，没上真机</td></tr><tr><td>${badge('未验证')}</td><td>还没有任何证据</td></tr></table></div></div>
  <div class="card"><h2>已经决定的事</h2>${decided.length ? `<ul>${decided.map((d) => `<li>${inline(d.item)}：${inline(d.impact)}　<small>${inline(d.status)}</small></li>`).join('')}</ul>` : '<p class="note">暂无</p>'}<p class="note">来自采用登记表的待决定事项表，全表在「团队怎么用」。</p></div>
  <div class="card"><h2>怎么看</h2><ol><li>按左侧七章顺序看。原则章是读的，其余六章每章先有一个能动手的东西，后面是规则卡片。</li><li>卡片折叠时显示编号、场景和要求的第一句，右上角是状态词。点开看完整要求、正反例、怎么检查、来源行号。</li><li>顶部搜索框输入编号或变量名能直接跳过去。</li></ol></div>
</section>

<section data-panel="principles" hidden>
  <h1>原则</h1><p class="lead">没有共同标准，每个页面都要重新争一遍取舍。原则回答的是：优先解决谁的什么问题，取舍时怎么判。设计原则 P 是已确认规则。产品原则是业务事实，逐字引自产品仓库。业务表达 B 规定客户、商机、缺失值、红黄绿灰怎么说。可以先点开 P-01 看正例和反例。</p>
  <h2>设计原则（已确认）</h2>${cards(['P-01', 'P-02', 'P-03'], true)}
  <h2>产品原则（业务事实，共 ${PRINCIPLES.length} 条）</h2>${principleCards}
  <h2>业务表达（已确认）</h2>${cards(['B-01', 'B-02', 'B-03', 'B-04', 'B-05'])}
  ${byGroup('D').length ? `<h2>候选原则：多家之长 ${badge('建议')}</h2><p class="note">从 Apple、Material、Ant Design、Semi、TDesign、Arco、Fluent、Atlassian、Polaris、GOV.UK、Salesforce、Nielsen 提炼。来源见 06 章和依据 13。评审通过后走变更单登记。</p>${cards(byGroup('D').map((r) => r.id))}` : ''}
  ${byGroup('A').length ? `<h2>候选原则：AI 时代 ${badge('建议')}</h2><p class="note">AI 出草稿，人拍板。标识、依据、可撤销、可追溯、行动前授权。来源见 06 章和依据 14、15。</p>${cards(byGroup('A').map((r) => r.id))}` : ''}
</section>

<section data-panel="visual" hidden>
  <h1>视觉基础</h1><p class="lead">换个主色以前要改三端几十处，现在改一个变量。颜色、字号、间距、圆角都是变量。左边改一个值，右边的预览和下面的样板一起变。改完可以生成变更单草稿。这里的修改只在你的浏览器里，不会写回仓库。</p>
  <div class="two">
    <div class="card panel"><div class="ph"><h2>变量面板</h2><div><button class="btn sec" id="tk-reset">重置</button><button class="btn pri" id="tk-copy">复制为变更单草稿</button></div></div>
      <h3>颜色（共 ${colorTokens.length} 个，列表可滚动）</h3><div class="tks">${panelRows}</div>
      <h3>字号、间距、尺寸（px）</h3><div class="tks">${dimRows}</div>
      <p class="note">面板只显示电脑网页的值，端侧覆盖值在「跨端适配」章的高亮行。标 ${badge('建议')} 的变量和端侧覆盖值还没登记采用。${confirmedTokens} 个已确认变量与 1.0.0 一致，脚本每次自动校验。</p></div>
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
  <h1>组件</h1><p class="lead">同一个按钮三端三种样子，禁用了不说原因，这是最常见的返工。每个组件在每个状态下长什么样都有定论。横着看是同一个组件从默认到出错的六种样子，竖着看是同一状态下所有组件像不像一家。悬停和聚焦两列是把鼠标效果固定住给你看。</p>
  <div class="card"><p class="note">共 ${STATES.length} 列，窄屏可以左右滑，第一列固定。</p>${matrix}<p class="note">选择器、日期这类复杂控件的真实交互见 1.0.0 示例册，这里只定外观和状态。</p></div>
  <h2>规则</h2>${cards(['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07'], true)}
  ${ecoDoc ? `<h2>组件用哪家 ${badge('建议')}</h2><div class="card doc">${md(mdSections(ecoDoc, /^## [012５5]/))}<p class="src">来源：05-组件生态选型.md，全文还有接入步骤和待决定事项。依据在 依据/外部查证-20260919/ 的 08 到 12。</p></div>` : ''}
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
  <h1>跨端适配</h1><p class="lead">哪些必须一样、哪些允许不一样，以前没人拍板。现在的划分是：含义统一，尺寸和摆放适配，平台自带的东西直接引用平台。点右上「适配」只剩三端做法不同的条目，点「跨端建议」只看还没转正的 X 规则。</p>
  <div class="card"><div class="ph"><h2>规则逐条对照 ${badge('建议')}</h2><div class="presets" id="cross-filter"><button class="btn sec on" data-kind="">全部</button>${KINDS.map((k) => `<button class="btn sec" data-kind="${k}">${k}</button>`).join('')}<button class="btn sec" data-kind="建议">跨端建议</button></div></div>
    <p class="note">统一还是适配的划分还是建议，01 章标为草案。每行状态列保留 01 表原文。电脑网页列是已确认，手机网页和小程序列是建议。</p>
    <div class="tbl"><table class="cross"><tr><th>规则</th><th>电脑网页 <small>已确认</small></th><th>手机网页 <small>建议</small></th><th>小程序 <small>建议</small></th><th>结论／样板验证</th><th>状态</th></tr>${crossRows}${xRows}</table></div></div>
  <div class="card"><h2>变量在三端的值</h2><p class="note">高亮行是有端侧覆盖值的变量。电脑网页值按它自己的状态词，手机网页和小程序的覆盖值都是 ${badge('建议')}，还没登记采用。原生 App 暂不在范围。</p><div class="tbl"><table class="vars"><tr><th>变量</th><th>电脑网页</th><th>手机网页</th><th>小程序</th><th>状态</th></tr>${varRows}</table></div></div>
  <div class="card"><h2>小程序原生颜色接入情况</h2>${appDiff ? `<div class="tbl"><table><tr><th>app.json 项</th><th>产品现状</th><th>规范</th><th>比对</th></tr>${appDiff.map((d) => `<tr><td><code>${esc(d.key)}</code></td><td><i class="sw" style="background:${esc(d.cur)}"></i>${esc(d.cur)}</td><td><i class="sw" style="background:${esc(d.spec)}"></i>${esc(d.spec)}</td><td>${d.same ? tag('tag-ok', '一致') : tag('tag-err', '不一致')}</td></tr>`).join('')}</table></div><p class="note">${appMismatch} 项不一致，这是第一张待办变更，改产品仓库要先授权。原生 tabBar 和导航栏不认 CSS 变量，只能写十六进制，规范值由 tokens.json 生成到 miniprogram-app.tokens.json。产品现状来自快照 ${esc(appSnap.source || '')}${appSnap.sourceCommit ? `，提交 ${esc(appSnap.sourceCommit)}` : ''}。重新同步用 node tools/sync-product.mjs。</p>` : '<p class="note">还没同步产品现状快照。运行 node tools/sync-product.mjs 后重新生成。</p>'}</div>
  <h2>跨端建议全文</h2>${cards(byGroup('X').map((r) => r.id))}
</section>

<section data-panel="team" hidden>
  <h1>团队怎么用</h1><p class="lead">规则改了谁知道、谁批、谁接入，以前没有流程。这章的流程和角色还是 ${badge('建议')}，部门指定负责人后生效，见 04 章。一份来源、四个入口、一道闸门。改规则走变更单和 PR，版本打标签，各产品登记采用。点流程里的一步能看到对应模板。</p>
  <div class="card"><h2>变更流程 ${badge('建议')}</h2><p class="note">点每一步看说明和模板。手机上图可以左右滑。</p><div class="tbl">${flowSvg}</div></div>
  <div class="card"><h2>一份来源、四个入口、一道闸门 ${badge('建议')}</h2><div class="arch"><div class="src"><b>一份来源</b><span>specs/salesbuddy/</span><small>规则原文 · tokens.json · 样板 · 模板 · 验收</small></div><div class="arrows">→</div><div class="entries"><div><b>人看</b><span>README、各章、本站</span></div><div><b>开发用</b><span>dist/ 变量产物、rules.json</span></div><div><b>AI 用</b><span>.claude/skills/design-spec 技能 + 按路径规则</span></div><div><b>其他工具</b><span>AGENTS.md、.agents、.cursor、.github</span></div></div><div class="arrows">→</div><div class="gate"><b>一道闸门</b><span>node tools/check.mjs（一条命令）</span><small>生成变量、兼容校验、规则索引、规范站、样式检查、技能引用，一次跑完。Claude Code 钩子每次写文件后自动跑</small></div></div></div>
  <div class="card"><h2>怎么引用 ${badge('建议')}</h2><div class="tbl"><table><tr><th>谁</th><th>怎么写</th></tr><tr><td>产品写需求</td><td>写规则编号、页面模板和样板部件名。比如「客户列表按 T-02、C-04，返回保留按 X-03（建议）」</td></tr><tr><td>设计出稿</td><td>标注变量名不标数值，如「按钮底色 --ui-primary」</td></tr><tr><td>开发写代码</td><td>颜色和尺寸只写 var(--ui-*)。PR 描述写规则编号。改完跑 node tools/check.mjs</td></tr><tr><td>测试验收</td><td>页面验收单逐项填实际结果和证据。空白不算通过</td></tr><tr><td>AI</td><td>技能自动触发，也可以手动输入 /design-spec。交回时说清规则编号、改动文件、新增变量数、检查输出、证据等级</td></tr></table></div></div>
  <div class="card"><h2>角色（人名待填） ${badge('建议')}</h2><div class="tbl"><table><tr><th>角色</th><th>负责</th><th>实际负责人</th></tr>${ROLES.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>待填</td></tr>`).join('')}</table></div></div>
  <div class="card"><h2>待决定与已决定</h2><div class="tbl"><table><tr><th>事项</th><th>谁决定</th><th>影响</th><th>状态</th></tr>${decisionRows}</table></div><p class="note">来自采用登记表的待决定事项表。</p></div>
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
.ui-primary { background: var(--ui-primary); color: var(--ui-on-primary); } .ui-primary:hover, .ui-primary.is-hover { background: var(--ui-primary-hover); }
.ui-secondary { background: var(--ui-surface); color: var(--ui-primary); border-color: var(--ui-line); } .ui-secondary:hover, .ui-secondary.is-hover { background: var(--ui-selected); }
.ui-btn:disabled { opacity: .55; cursor: not-allowed; } .is-focus { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.ui-field { display: flex; flex-direction: column; gap: 4px; font-size: var(--ui-text-small); color: var(--ui-secondary); }
.ui-field input { height: var(--ui-field-height); padding: 0 var(--ui-space-3); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); font: inherit; font-size: var(--ui-text-body); color: var(--ui-ink); background: var(--ui-surface); width: 100%; min-width: 110px; }
.ui-field input.is-hover { border-color: var(--ui-focus); } .ui-field input:disabled { background: var(--ui-neutral-soft); } .ui-field.is-error input { border-color: var(--ui-danger); }
.ui-err { color: var(--ui-danger); font-size: var(--ui-text-small); display: block; margin-top: 4px; }
.ui-select { display: inline-flex; justify-content: space-between; gap: var(--ui-space-2); min-width: 130px; height: var(--ui-control-height); padding: 0 var(--ui-space-3); border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); color: var(--ui-ink); font: inherit; align-items: center; }
.ui-select.is-hover { border-color: var(--ui-focus); } .ui-select:disabled { opacity: .55; } .ui-select i { font-style: normal; color: var(--ui-muted); }
.ui-chip { display: inline-flex; align-items: center; min-height: 32px; padding: 0 var(--ui-space-3); border-radius: 999px; border: 1px solid var(--ui-line); color: var(--ui-secondary); background: var(--ui-surface); }
.ui-chip.is-hover { border-color: var(--ui-focus); color: var(--ui-primary); } .ui-chip.on { background: var(--ui-selected); border-color: var(--ui-primary); color: var(--ui-primary); font-weight: 600; } .ui-chip.off { opacity: .55; }
.ui-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px var(--ui-space-3); padding: var(--ui-space-2) var(--ui-space-3); border-bottom: 1px solid var(--ui-line); min-width: 150px; align-items: center; }
.ui-row b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .ui-row small { color: var(--ui-secondary); font-size: var(--ui-text-small); grid-column: 1; } .ui-row .tag, .ui-row em { grid-column: 2; grid-row: 1 / 3; align-self: center; font-style: normal; color: var(--ui-muted); font-size: var(--ui-text-small); }
.ui-row.is-hover { background: var(--ui-background); } .ui-row.on { background: var(--ui-selected); box-shadow: inset 3px 0 var(--ui-primary); }
.matrix td { min-width: 120px; padding: var(--ui-space-2); } .matrix th:first-child, .matrix td:first-child { position: sticky; left: 0; background: var(--ui-surface); z-index: 1; min-width: 80px; }
.ts { display: flex; justify-content: space-between; align-items: baseline; gap: var(--ui-space-3); padding: var(--ui-space-2) 0; border-bottom: 1px solid var(--ui-line); }
.ss { display: grid; grid-template-columns: 40px auto minmax(0, 1fr); gap: var(--ui-space-3); align-items: center; padding: 4px 0; font-size: var(--ui-text-small); color: var(--ui-secondary); } .ss i { display: block; height: 12px; background: var(--ui-primary); border-radius: 2px; }
.frame { width: 100%; height: 560px; border: 1px solid var(--ui-line); border-radius: var(--ui-radius-control); background: var(--ui-surface); display: block; } .frame.tall { height: 640px; }
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
  .frame, .frame.tall { height: 520px; } .resizer { resize: none; }
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
const full = `<!doctype html>\n<html lang="zh-CN">\n<head>\n${head}\n</head>\n<body>\n${body}\n<script>${js}</script>\n</body>\n</html>\n`;

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
  const page = artifact ? `<title>部门产品设计规范</title><link rel="stylesheet" href="${P.tokensCss}"><style>${css}</style>\n${body}\n<script>${js}</script>\n` : full;
  writeFileSync(join(portable, 'index.html'), page);
  console.log(`可发布站点 → ${portable}（index.html + sample/ + shots/）`);
}
