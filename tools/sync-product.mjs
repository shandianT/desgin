#!/usr/bin/env node
/**
 * 同步产品现状快照：把产品仓库里规范要比对的文件复制进规范目录，让生成器与 CI 只读仓库内文件（同一份源在任何机器生成同样的站点）。
 * 目前只同步微信小程序的 app.json（原生 tabBar／导航栏颜色）。这是显式动作，复制后连同快照一起提交。
 * 用法：node tools/sync-product.mjs [specs/salesbuddy] [--from <产品仓库的 miniprogram 目录>]
 *      默认来源：环境变量 MINIPROGRAM_DIR，或与本仓库并列的 xiaoshouguanli/frontend/miniprogram
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
let specDir = 'specs/salesbuddy', from = process.env.MINIPROGRAM_DIR || '';
for (let i = 0; i < args.length; i++) { if (args[i] === '--from') from = args[++i] || ''; else if (!args[i].startsWith('--')) specDir = args[i]; }
specDir = resolve(specDir);
if (!from) from = resolve(specDir, '..', '..', '..', 'xiaoshouguanli', 'frontend', 'miniprogram');
const src = join(from, 'app.json');
if (!existsSync(src)) { console.error(`未找到 ${src}：用 --from 或 MINIPROGRAM_DIR 指向产品仓库的 frontend/miniprogram`); process.exit(2); }
const app = JSON.parse(readFileSync(src, 'utf8'));
// 只留规范关心的两段（原生颜色与文字样式），不带页面清单，避免快照跟着业务改动频繁变化
const remote = spawnSync('git', ['-C', from, 'remote', 'get-url', 'origin'], { encoding: 'utf8' });
const repo = remote.status === 0 ? remote.stdout.trim().replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '') : '未知仓库';
const snap = { $note: '产品现状快照：由 tools/sync-product.mjs 从产品仓库复制，只保留 window 与 tabBar（不含 list）；勿手改，重新同步即可', source: `${repo} · frontend/miniprogram/app.json`, window: app.window || {}, tabBar: Object.fromEntries(Object.entries(app.tabBar || {}).filter(([k]) => k !== 'list')) };
const git = spawnSync('git', ['-C', from, 'log', '-1', '--format=%h %ci'], { encoding: 'utf8' });
if (git.status === 0 && git.stdout.trim()) snap.sourceCommit = git.stdout.trim();
const outDir = join(specDir, '02-设计变量与同步链路', '产品现状');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'miniprogram-app.json'), JSON.stringify(snap, null, 2) + '\n');
console.log(`产品现状快照 → ${join(outDir, 'miniprogram-app.json')}${snap.sourceCommit ? `（来源提交 ${snap.sourceCommit}）` : ''}`);
