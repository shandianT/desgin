#!/usr/bin/env node
/**
 * Apply department project-config overlay to the generated Pages copy.
 * The reviewed demo/web snapshot remains byte-identical; this writes only to out/site/web.
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(process.argv[2] || join(root, 'out', 'site', 'web'));
const overlay = join(root, 'demo', 'web-generalized');
const indexPath = join(target, 'index.html');
if (!existsSync(indexPath)) throw new Error(`Web Pages 输出不存在：${indexPath}`);

cpSync(join(overlay, 'project-config.js'), join(target, 'project-config.js'));
cpSync(join(overlay, 'project-config.css'), join(target, 'project-config.css'));
let html = readFileSync(indexPath, 'utf8');
if (!html.includes('project-config.css')) {
  html = html.replace('<link rel="stylesheet" href="design-tokens.css">', '<link rel="stylesheet" href="design-tokens.css"><link rel="stylesheet" href="project-config.css">');
}
if (!html.includes('project-config.js')) {
  html = html.replace('  <script src="entry.js"></script>', '  <script src="project-config.js"></script><script src="entry.js"></script>');
}
writeFileSync(indexPath, html);
console.log(`✓ Web 项目配置 overlay 已应用到 ${target}`);
