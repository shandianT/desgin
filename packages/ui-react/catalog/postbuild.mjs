#!/usr/bin/env node
// 构建后处理：Vite 总是输出 <script type="module" crossorigin>，file:// 下打不开。
// 这里改成普通 defer 脚本，去掉 crossorigin 与 modulepreload，并确认变量样式已打进 CSS。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../../specs/salesbuddy/站点/组件库');
const htmlFile = join(outDir, 'index.html');

let html = readFileSync(htmlFile, 'utf8');
html = html.replace(/<script\s+type="module"([^>]*)><\/script>/g, (m, attrs) => `<script defer${attrs.replace(/\s*crossorigin(="[^"]*")?/g, '')}></script>`);
html = html.replace(/\s*<link\s+rel="modulepreload"[^>]*>/g, '');
html = html.replace(/<link([^>]*)\s+crossorigin(="[^"]*")?([^>]*)>/g, '<link$1$3>');

const problems = [];
if (/type="module"/.test(html)) problems.push('index.html 里仍有 type="module" 的脚本');
if (/crossorigin/.test(html)) problems.push('index.html 里仍有 crossorigin');
if (/rel="modulepreload"/.test(html)) problems.push('index.html 里仍有 modulepreload');
if (/\.\.\/\.\.\/\.\.\/specs\//.test(html)) problems.push('index.html 仍引用 ../../../specs/ 下的文件，样式应由 Vite 打进 CSS');
const cssFiles = readdirSync(join(outDir, 'assets')).filter((f) => f.endsWith('.css'));
const withTokens = cssFiles.filter((f) => readFileSync(join(outDir, 'assets', f), 'utf8').includes('--ui-primary'));
if (!withTokens.length) problems.push('构建出的 CSS 里没有 --ui-primary，design-tokens.css 没打进去');
if (problems.length) { console.error('构建后检查未通过：\n  ' + problems.join('\n  ')); process.exit(1); }

writeFileSync(htmlFile, html);
console.log(`组件库目录页：脚本已改为普通 defer 脚本；${withTokens.join('、')} 含 --ui-primary`);
