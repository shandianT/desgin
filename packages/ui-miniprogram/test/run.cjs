#!/usr/bin/env node
/**
 * 用微信官方的 miniprogram-simulate 在 Node 里渲染 15 个 sb-* 组件：每个状态能不能渲染、该有的文字在不在、点了会不会对外发事件。
 * 不是真机，也不是开发者工具，但和真机走同一套组件框架（exparser）。真机与开发者工具的验证仍要人做。
 * 用法：在本目录 npm i 之后 npm test
 * 做法：把 components/ 复制到临时目录；把 tdesign-miniprogram 的 ESM 产物转成 CommonJS 放进 miniprogram_npm/（开发者工具「构建 npm」做的事）；
 *      每个组件目录下放一个指向它的链接，让 usingComponents 里的 "tdesign-miniprogram/…" 能按相对路径找到。
 */
const fs = require('fs'), path = require('path'), os = require('os');
const pkg = path.resolve(__dirname, '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-mp-'));
fs.cpSync(path.join(pkg, 'components'), path.join(work, 'components'), { recursive: true });

// 1. 构建 npm：ESM → CommonJS
const esbuild = require('esbuild');
const src = path.join(pkg, 'node_modules/tdesign-miniprogram/miniprogram_dist'), dst = path.join(work, 'miniprogram_npm/tdesign-miniprogram');
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f), out = path.join(dst, path.relative(src, p));
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    if (f.endsWith('.d.ts')) continue;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (f.endsWith('.js')) fs.writeFileSync(out, esbuild.transformSync(fs.readFileSync(p, 'utf8'), { format: 'cjs', target: 'es2018' }).code);
    else fs.copyFileSync(p, out);
  }
})(src);
fs.mkdirSync(path.join(work, 'node_modules'), { recursive: true });
for (const m of ['tslib', 'dayjs']) fs.symlinkSync(path.join(pkg, 'node_modules', m), path.join(work, 'node_modules', m), 'dir');
const names = fs.readdirSync(path.join(work, 'components')).filter((n) => n.startsWith('sb-'));
for (const n of names) fs.symlinkSync(dst, path.join(work, 'components', n, 'tdesign-miniprogram'), 'dir');

// 2. 小程序运行环境：jsdom 加最小的 wx 与 getApp
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'CustomEvent', 'getComputedStyle']) global[k] = dom.window[k];
global.requestAnimationFrame = (f) => setTimeout(f, 0);
const info = { windowWidth: 375, windowHeight: 667, pixelRatio: 2, platform: 'devtools', SDKVersion: '3.0.0', statusBarHeight: 20, safeArea: { bottom: 667 } };
const query = () => ({ in() { return this; }, select() { return this; }, selectAll() { return this; }, boundingClientRect(cb) { cb && cb({ width: 0, height: 0, top: 0, left: 0 }); return this; }, exec(cb) { cb && cb([{ width: 0, height: 0 }]); } });
global.wx = { getSystemInfoSync: () => info, getWindowInfo: () => info, getDeviceInfo: () => info, getAppBaseInfo: () => ({ SDKVersion: '3.0.0', theme: 'light' }), getMenuButtonBoundingClientRect: () => ({ top: 24, bottom: 56, height: 32 }), nextTick: (f) => setTimeout(f, 0), createSelectorQuery: query, canIUse: () => true, onThemeChange() {}, offThemeChange() {}, showToast() {} };
global.getApp = () => ({ globalData: {} }); global.getCurrentPages = () => [];
const simulate = require('miniprogram-simulate');
const CASES = require('./cases.cjs');

// 3. 逐个组件、逐个状态渲染
(async () => {
  let fail = 0, total = 0, events = 0; const out = [];
  for (const name of names) {
    const rows = [];
    try {
      const id = simulate.load(path.join(work, 'components', name, 'index'), name, { rootPath: work, compiler: 'simulate' });
      for (const c of CASES[name] || [{ title: '默认', data: {} }]) {
        total++;
        const comp = simulate.render(id, c.data || {}); comp.attach(document.createElement('parent-wrapper'));
        const html = comp.dom.innerHTML;
        let evt = '';
        if (c.event) { try { const ok = await c.event(comp, simulate); evt = ok ? '事件通过' : '事件未触发'; if (ok) events++; } catch (e) { evt = '事件异常：' + e.message; } }
        const missing = (c.expect || []).filter((t) => !html.includes(t));
        const ok = (c.empty ? html.trim().length === 0 : html.length > 0) && !missing.length && !/事件未|事件异常/.test(evt);
        if (!ok) fail++;
        rows.push(`${ok ? '✓' : '✗'} ${c.title}${missing.length ? '，缺 ' + missing.join('、') : ''}${evt ? '，' + evt : ''}`);
        comp.detach();
      }
    } catch (e) { fail++; total++; rows.push(`✗ 加载失败：${e.message.split('\n')[0]}`); if (process.env.DEBUG) console.error(e.stack); }
    out.push(`${name}\n  ${rows.join('\n  ')}`);
  }
  console.log(out.join('\n'));
  console.log(`\n${fail ? `✗ ${fail} 项失败` : `✓ 小程序组件模拟渲染：${names.length} 个组件、${total} 个状态全部通过，${events} 次交互事件对外触发`}`);
  fs.rmSync(work, { recursive: true, force: true });
  process.exit(fail ? 1 : 0);
})();
