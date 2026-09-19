#!/usr/bin/env node
/** 生成可单文件发布的版本（内联设计变量 CSS，去掉 html/head/body 外壳，供 claude.ai Artifact 或任何只接受一个文件的地方使用） */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'index.html'), 'utf8');
const tokens = readFileSync(join(here, '..', '02-设计变量与同步链路', 'dist', 'design-tokens.css'), 'utf8');
let body = html
  .replace(/<!doctype html>\s*<html lang="zh-CN">\s*<head>\s*/i, '')
  .replace(/<meta charset="UTF-8">\s*<meta name="viewport"[^>]*>\s*<meta name="color-scheme" content="light">\s*/i, '')
  .replace(/<!--[^>]*-->\s*<link[^>]+design-tokens\.css"[^>]*>/, `<style>\n${tokens}</style>`)
  .replace(/<\/head>\s*<body>/i, '')
  .replace(/<\/body>\s*<\/html>\s*$/i, '');
if (/<link\s[^>]*rel="stylesheet"/.test(body)) throw new Error('仍有外部样式表未内联，请检查 index.html 里 design-tokens.css 的 link 标签');
writeFileSync(join(here, 'dist-artifact.html'), body);
console.log('已生成 dist-artifact.html（单文件，内联变量）', body.length, '字节');
