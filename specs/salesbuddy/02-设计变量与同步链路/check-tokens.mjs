#!/usr/bin/env node
/**
 * 兼容性校验：生成的 dist/design-tokens.css 的 :root 变量，必须与 1.0.0 使用包快照里的
 * design-tokens.css 名字一一对应、值完全相同（十六进制不区分大小写）。
 * 新增的「建议」变量允许只在新文件中出现，会单独列出。
 * 退出码：0 一致；1 有差异。
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
if (!existsSync(join(here, 'dist', 'design-tokens.css'))) { console.error('没有 dist/design-tokens.css，请先运行：node build-tokens.mjs'); process.exit(2); }
const oldCss = readFileSync(join(here, '..', '1.0.0-使用包快照', '示例册', 'design-tokens.css'), 'utf8');
const newCss = readFileSync(join(here, 'dist', 'design-tokens.css'), 'utf8');

function rootVars(cssText) {
  const m = cssText.match(/:root\s*\{([\s\S]*?)\}/);
  const out = new Map();
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?);\s*$/);
    if (mm) out.set(mm[1], mm[2].trim().toLowerCase());
  }
  return out;
}
const a = rootVars(oldCss), b = rootVars(newCss);
let bad = 0;
for (const [k, v] of a) {
  if (!b.has(k)) { console.log(`缺少变量：${k}`); bad++; }
  else if (b.get(k) !== v) { console.log(`值不同：${k}  旧=${v}  新=${b.get(k)}`); bad++; }
}
const added = [...b.keys()].filter((k) => !a.has(k));
console.log(`1.0.0 变量 ${a.size} 个：${bad === 0 ? '全部一致' : `${bad} 处差异`}`);
console.log(`新增（建议）变量 ${added.length} 个：${added.join(', ')}`);

// 第二段：小程序 app.json 的原生颜色是否与生成片段一致（只报告，不算失败：接入前本来就不一致）
try {
  const frag = JSON.parse(readFileSync(join(here, 'dist', 'miniprogram-app.tokens.json'), 'utf8'));
  // 产品仓库位置：环境变量 MINIPROGRAM_DIR，默认为与本仓库并列的 xiaoshouguanli/frontend/miniprogram
  const mpDir = process.env.MINIPROGRAM_DIR || join(here, '..', '..', '..', '..', 'xiaoshouguanli', 'frontend', 'miniprogram');
  const appJson = JSON.parse(readFileSync(join(mpDir, 'app.json'), 'utf8'));
  let diff = 0;
  for (const sec of ['window', 'tabBar']) for (const [k, v] of Object.entries(frag[sec])) {
    const cur = appJson[sec]?.[k];
    if (String(cur).toLowerCase() !== String(v).toLowerCase()) { diff++; console.log(`小程序 app.json 未接入：${sec}.${k}  当前=${cur}  规范=${v}`); }
  }
  console.log(`小程序 app.json 原生颜色：${diff === 0 ? '与规范一致' : `${diff} 项与规范不一致（待接入，记录为差距，不算本脚本失败）`}`);
} catch (e) { console.log('未找到小程序 app.json（设置 MINIPROGRAM_DIR 指向产品仓库的 frontend/miniprogram），跳过原生颜色比对'); }
process.exit(bad ? 1 : 0);
