#!/usr/bin/env node
/**
 * 设计变量生成器（零依赖，Node 18+）
 *
 * 读取 tokens.json（基础档位 → 语义 → 端侧映射），生成：
 *   dist/design-tokens.css    电脑网页 + 手机网页（≤600px 媒体查询覆盖）
 *   dist/design-tokens.wxss   微信小程序（page 选择器，px 逻辑像素）
 *   dist/design-tokens.json   其他工具读取的已解析扁平表（原生 App 暂不在范围）
 *   dist/miniprogram-app.tokens.json  小程序 app.json 的 window／tabBar 颜色片段（原生组件不支持 CSS 变量）
 *   dist/变量对照表.md         给人看的中文对照表
 *
 * 用法：node build-tokens.mjs        （在本目录执行）
 *       node build-tokens.mjs --check 只校验，不写文件
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');

// ---------- 1. 解析引用 {a.b.c} ----------
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}
function resolve(value, depth = 0) {
  if (depth > 10) throw new Error(`引用层级过深：${value}`);
  if (typeof value === 'string') {
    const m = value.match(/^\{([^}]+)\}$/);
    if (m) {
      const node = getPath(src, m[1]);
      if (!node || node.$value === undefined) throw new Error(`找不到被引用的变量：${value}`);
      return resolve(node.$value, depth + 1);
    }
  }
  return value;
}
function unit(type, v, u = 'px') {
  // 尺寸值在源文件里已写成 "16px"；若遇到裸数字（历史写法）则补 px
  return type === 'dimension' && typeof v === 'number' ? `${v}${u}` : String(v);
}
function px(v) { return typeof v === 'number' ? v : parseFloat(String(v)); }

// ---------- 2. 语义层 ----------
const semantic = Object.entries(src.ui)
  .filter(([k]) => !k.startsWith('$'))
  .map(([name, t]) => ({
    name,
    css: `--ui-${name}`,
    type: t.$type,
    ref: typeof t.$value === 'string' && t.$value.startsWith('{') ? t.$value.slice(1, -1) : '',
    value: resolve(t.$value),
    description: t.$description || '',
    status: t.$extensions?.['cn.sensetime.sales-design']?.status || '',
    rule: t.$extensions?.['cn.sensetime.sales-design']?.rule || '',
  }));

function platformValue(platform, token) {
  const ov = src.platforms?.[platform]?.ui?.[token.name];
  return ov === undefined ? token.value : resolve(ov.$value);
}
function overridesOf(platform) {
  return semantic
    .filter((t) => src.platforms?.[platform]?.ui?.[t.name] !== undefined)
    .map((t) => ({ ...t, value: platformValue(platform, t) }));
}

const meta = src.$meta;
const banner = (lang) =>
  `/* ${meta.name} ${meta.version} · ${meta.updated}\n` +
  ` * 由 build-tokens.mjs 从 tokens.json 生成，请勿手工修改；改 tokens.json 后重新生成。\n` +
  ` * 目标：${lang}。状态：${meta.status}\n */\n`;

// ---------- 3. Web CSS ----------
let css = banner('电脑网页与手机网页（同一份文件，≤600px 覆盖）');
css += ':root {\n  color-scheme: light;\n';
for (const t of semantic) css += `  ${t.css}: ${unit(t.type, t.value)};\n`;
css += '}\n';
const mw = overridesOf('mobile-web');
if (mw.length) {
  css += '\n/* 手机网页：仅覆盖端侧映射里声明的语义变量（建议，待验证） */\n@media (max-width: 600px) {\n  :root {\n';
  for (const t of mw) css += `    ${t.css}: ${unit(t.type, t.value)};\n`;
  css += '  }\n}\n';
}

// ---------- 4. 小程序 WXSS ----------
let wxss = banner('微信小程序 WXSS（page 为页面根节点；值为 px 逻辑像素，不是 rpx）');
wxss += 'page {\n';
for (const t of semantic) wxss += `  ${t.css}: ${unit(t.type, platformValue('miniprogram', t))};\n`;
wxss += '}\n';

// ---------- 5. 扁平 JSON（App／工具） ----------
const flat = {
  $meta: { ...meta, generatedFrom: 'tokens.json' },
  base: {},
  semantic: {},
  platforms: {},
};
for (const group of ['color', 'space', 'font', 'radius', 'size']) {
  const walk = (node, path) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (v && v.$value !== undefined) flat.base[`${path}.${k}`] = { value: resolve(v.$value), type: v.$type, description: v.$description || '' };
      else if (v && typeof v === 'object') walk(v, `${path}.${k}`);
    }
  };
  walk(src[group], group);
}
for (const t of semantic) flat.semantic[t.name] = { value: t.value, type: t.type, from: t.ref, description: t.description, status: t.status, rule: t.rule };
for (const p of Object.keys(src.platforms).filter((k) => !k.startsWith('$'))) {
  flat.platforms[p] = {};
  for (const t of semantic) flat.platforms[p][t.name] = platformValue(p, t);
}

// ---------- 5b. 小程序 app.json 颜色片段（原生 tabBar／window 不能引用 CSS 变量，只能写十六进制） ----------
const sv = (name) => semantic.find((t) => t.name === name);
const appJsonFragment = {
  $comment: '由 build-tokens.mjs 生成：把这些值同步进 frontend/miniprogram/app.json 的 window 与 tabBar。原生组件不支持 var()，所以这里是十六进制字面值；check-tokens.mjs 会比对 app.json 是否一致',
  window: {
    backgroundColor: platformValue('miniprogram', sv('background')),
    navigationBarBackgroundColor: platformValue('miniprogram', sv('surface')),
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: platformValue('miniprogram', sv('secondary')),
    selectedColor: platformValue('miniprogram', sv('primary')),
    backgroundColor: platformValue('miniprogram', sv('surface')),
    borderStyle: 'white',
  },
};

// ---------- 6. 中文对照表 ----------
const platforms = ['web', 'mobile-web', 'miniprogram']; // 原生 App 暂不在范围（2026-09-19 决定）
const pLabel = { web: '电脑网页', 'mobile-web': '手机网页（≤600px）', miniprogram: '微信小程序' };
let md = `# 设计变量对照表（自动生成）\n\n版本 ${meta.version} · ${meta.updated}。由 build-tokens.mjs 从 tokens.json 生成；改值请改 tokens.json。\n\n`;
md += `状态说明：「已确认」= 值来自 SalesBuddy Web V1.0 已确认规则；「建议」= 本轮新增或跨端映射，尚未登记采用；端侧列中与电脑网页不同的值用 **加粗** 标出，**加粗的端侧值一律是建议，未登记采用**。\n\n`;
md += `| 语义变量 | 用途 | 来源档位 | ${platforms.map((p) => pLabel[p]).join(' | ')} | 状态 | 规则 |\n|---|---|---|${platforms.map(() => '---').join('|')}|---|---|\n`;
for (const t of semantic) {
  const cells = platforms.map((p) => {
    const v = unit(t.type, platformValue(p, t));
    const base = unit(t.type, t.value);
    const shown = t.type === 'fontFamily' ? '系统字体' : v;
    return v !== base ? `**${shown}**` : shown;
  });
  const hasOverride = platforms.some((p) => unit(t.type, platformValue(p, t)) !== unit(t.type, t.value));
  const statusCell = hasOverride ? `${t.status}（电脑值）；端侧覆盖为建议` : t.status;
  md += `| \`${t.css}\` | ${t.description} | ${t.ref ? `\`${t.ref}\`` : '直接值'} | ${cells.join(' | ')} | ${statusCell} | ${t.rule} |\n`;
}
md += `\n## 端侧说明\n\n`;
for (const p of platforms) md += `- **${pLabel[p]}**：${src.platforms[p].$description}${src.platforms[p].$extensions?.['cn.sensetime.sales-design']?.status ? `（${src.platforms[p].$extensions['cn.sensetime.sales-design'].status}）` : ''}\n`;

// ---------- 7. 写文件 ----------
if (!checkOnly) {
  mkdirSync(join(here, 'dist'), { recursive: true });
  writeFileSync(join(here, 'dist', 'design-tokens.css'), css);
  writeFileSync(join(here, 'dist', 'design-tokens.wxss'), wxss);
  writeFileSync(join(here, 'dist', 'design-tokens.json'), JSON.stringify(flat, null, 2) + '\n');
  writeFileSync(join(here, 'dist', '变量对照表.md'), md);
  writeFileSync(join(here, 'dist', 'miniprogram-app.tokens.json'), JSON.stringify(appJsonFragment, null, 2) + '\n');
  console.log(`已生成 ${semantic.length} 个语义变量 → dist/design-tokens.css、design-tokens.wxss、design-tokens.json、miniprogram-app.tokens.json、变量对照表.md`);
} else {
  console.log(`校验通过：${semantic.length} 个语义变量，引用均可解析`);
}
