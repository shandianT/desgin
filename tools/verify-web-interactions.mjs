#!/usr/bin/env node
// 只运行合成示例数据。录音使用 Chromium 虚拟音源，不访问真实麦克风。
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.WEB_DEMO_URL || 'http://127.0.0.1:5198/';
const out = 'out/web-interactions';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['microphone'] });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [], results = [];
page.on('pageerror', e => errors.push(e.message));
async function test(name, fn) {
  try { await fn(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (e) { results.push({ name, passed: false, error: e.message }); throw e; }
}
async function go(route) {
  await page.goto(`${base}?mode=preview#/${route}`);
  await page.waitForFunction(route => window.SalesRuntime?.current?.route === route, route);
  await page.waitForSelector('.department-ui');
}
const selected = () => page.evaluate(() => SalesRuntime.current.data.opportunitySelectedStages);
const stage = () => page.getByRole('button', { name: /^阶段：/ });
const dialog = () => page.getByRole('dialog', { name: '阶段筛选' });
try {
  await go('pages/workbench/index');
  await page.waitForFunction(() => SalesRuntime.current.data.opportunityTotal === 24);
  const initialBoard = await page.evaluate(() => SalesRuntime.current.data.opportunityBoard);
  await page.evaluate(() => {
    const p = SalesRuntime.current, original = p.applyOpportunityFilters;
    window.filterCalls = 0;
    p.applyOpportunityFilters = function (...args) { window.filterCalls++; return original.apply(this, args); };
  });
  await test('连续勾选保持展开，应用前不改变结果；应用只查询一次', async () => {
    await stage().click();
    await dialog().getByRole('checkbox', { name: '意向沟通－10%' }).check();
    await dialog().getByRole('checkbox', { name: '方案沟通－50%' }).check();
    assert.deepEqual(await selected(), []);
    assert.equal(await page.evaluate(() => filterCalls), 0);
    await page.waitForTimeout(350); // 等待组件勾选动效完成再留图
    await page.screenshot({ path: `${out}/stage-checkboxes.png` });
    await dialog().getByRole('button', { name: /^应\s*用$/ }).click();
    await page.waitForFunction(() => !SalesRuntime.current.data.opportunityListLoading && SalesRuntime.current.data.opportunityTotal === 9);
    assert.deepEqual(await selected(), ['identified', 'solution']);
    assert.equal(await page.evaluate(() => filterCalls), 1);
    assert.deepEqual(await page.evaluate(() => SalesRuntime.current.data.opportunityBoard), initialBoard);
    const rows = await page.evaluate(() => SalesRuntime.current.data.opportunityItems);
    assert.equal(rows.length, 9);
    assert(rows.every(r => ['identified', 'solution'].includes(r.stage_code)));
  });
  await test('取消、Esc、点外部均保留生效条件；搜索和键盘勾选可用', async () => {
    for (const action of ['cancel', 'escape', 'outside']) {
      await stage().click();
      assert(await dialog().getByRole('checkbox', { name: '方案沟通－50%' }).isChecked());
      await dialog().getByRole('button', { name: /^清\s*空$/ }).click();
      if (action === 'cancel') await dialog().getByRole('button', { name: /^取\s*消$/ }).click();
      else if (action === 'escape') await page.keyboard.press('Escape');
      else await page.mouse.click(600, 120);
      await dialog().waitFor({ state: 'hidden' });
      assert.deepEqual(await selected(), ['identified', 'solution']);
    }
    await stage().click();
    await dialog().getByRole('textbox', { name: '搜索阶段' }).fill('不存在的阶段');
    assert(await dialog().getByText('没有匹配选项').isVisible());
    await dialog().getByRole('textbox', { name: '搜索阶段' }).fill('');
    const first = dialog().getByRole('checkbox').first();
    await first.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space');
    assert(await dialog().getByRole('checkbox', { name: '商机确认－30%' }).isChecked());
    await dialog().getByRole('button', { name: /^应\s*用$/ }).focus();
    await page.keyboard.press('Tab');
    assert(await dialog().getByRole('textbox', { name: '搜索阶段' }).evaluate(el => el === document.activeElement));
    await page.keyboard.press('Shift+Tab');
    assert(await dialog().getByRole('button', { name: /^应\s*用$/ }).evaluate(el => el === document.activeElement));
    await dialog().getByRole('button', { name: /^取\s*消$/ }).click();
    await dialog().waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => filterCalls), 1);
  });
  await test('清空并应用恢复全部，分页继续加载', async () => {
    await stage().click();
    await dialog().getByRole('button', { name: /^清\s*空$/ }).click();
    await dialog().getByRole('button', { name: /^应\s*用$/ }).click();
    await page.waitForFunction(() => SalesRuntime.current.data.opportunityTotal === 24 && !SalesRuntime.current.data.opportunityListLoading);
    assert.deepEqual(await selected(), []);
    assert.equal(await page.evaluate(() => SalesRuntime.current.data.opportunityItems.length), 20);
    await page.getByRole('button', { name: '加载更多', exact: true }).click();
    await page.waitForFunction(() => SalesRuntime.current.data.opportunityItems.length === 24);
  });
  await test('阶段与关键词组合筛选，空结果可恢复', async () => {
    await stage().click();
    await dialog().getByRole('checkbox', { name: '方案沟通－50%' }).check();
    await dialog().getByRole('button', { name: /^应\s*用$/ }).click();
    const search = page.getByPlaceholder('搜索客户、商机或产品线');
    await search.fill('星河'); await search.press('Enter');
    await page.waitForFunction(() => !SalesRuntime.current.data.opportunityListLoading && SalesRuntime.current.data.opportunityTotal === 1);
    const rows = await page.evaluate(() => SalesRuntime.current.data.opportunityItems);
    assert(rows.every(r => r.stage_code === 'solution' && r.customer_name.includes('星河')));
    await search.fill('不存在的客户名称'); await search.press('Enter');
    await page.waitForFunction(() => SalesRuntime.current.data.opportunityTotal === 0);
    await page.getByRole('button', { name: '清除筛选', exact: true }).first().click();
    await page.waitForFunction(() => SalesRuntime.current.data.opportunityTotal === 24);
  });
  await go('pages/customers/index');
  await page.waitForSelector('.sb-bmap-points circle');
  await test('作战地图四区等大，70 分分类和原始评分保留', async () => {
    const rects = await page.locator('.sb-bmap-cell rect').evaluateAll(els => els.map(e => ({ w: +e.getAttribute('width'), h: +e.getAttribute('height') })));
    assert.equal(rects.length, 4);
    assert(rects.every(r => Math.abs(r.w - rects[0].w) < .01 && Math.abs(r.h - rects[0].h) < .01));
    const raw = await page.evaluate(() => SalesRuntime.current.data.plotCustomers.map(r => ({ potential: r.potential, relationship: r.relationship })));
    const expected = [
      ['主攻区', p => p.potential >= 70 && p.relationship < 70],
      ['客户资产', p => p.potential >= 70 && p.relationship >= 70],
      ['见单打单', p => p.potential < 70 && p.relationship < 70],
      ['客户资源', p => p.potential < 70 && p.relationship >= 70],
    ];
    const summary = await page.locator('.sb-bmap-svg').getAttribute('aria-label');
    for (const [label, predicate] of expected) assert(summary.includes(`${label} ${raw.filter(predicate).length} 家`));
    await page.screenshot({ path: `${out}/battle-map-equal.png` });
    await page.locator('.sb-bmap-cell[aria-label^="放大客户资产"]').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: '返回全部象限' }).waitFor();
    await page.getByRole('button', { name: '返回全部象限' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.sb-bmap-cell rect').length === 4 && SalesRuntime.current.data.plotCustomers.length === 6);
    assert.deepEqual(await page.evaluate(() => SalesRuntime.current.data.plotCustomers.map(r => ({ potential: r.potential, relationship: r.relationship }))), raw);
  });
  await test('地图宽屏占半栏，窗口缩放后圆点和提示位置正确，手机上下排列', async () => {
    const sizes = [];
    for (const [width, height] of [[1440, 900], [1920, 900], [1920, 768], [1024, 600], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForFunction(() => {
        const svg = document.querySelector('.sb-bmap-svg'), box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
        return Math.abs(box.width / box.height - vb.width / vb.height) < .001;
      });
      const dimensions = await page.evaluate(() => {
        const box = s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
        return { workspace: box('.ds-customer-workspace'), panel: box('.ds-customer-map-panel'), map: box('.sb-bmap-square'), list: box('.ds-customer-list'),
          circles: [...document.querySelectorAll('.sb-bmap-points circle')].map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height }; }),
          cells: [...document.querySelectorAll('.sb-bmap-cell rect')].map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height }; }),
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(!dimensions.overflow);
      assert(dimensions.circles.every(c => Math.abs(c.width - c.height) < .1));
      assert(dimensions.cells.every(c => Math.abs(c.width - dimensions.cells[0].width) < .1 && Math.abs(c.height - dimensions.cells[0].height) < .1));
      if (width > 900) {
        assert(Math.abs(dimensions.panel.width / dimensions.workspace.width - (width <= 1100 ? .46 : .5)) < .001);
        assert(dimensions.map.bottom <= height && dimensions.list.bottom <= height);
        if (width === 1920) assert(dimensions.map.width > dimensions.map.height * 1.4);
      } else {
        assert(dimensions.list.y >= dimensions.panel.bottom - 1);
        assert(Math.abs(dimensions.map.width - dimensions.map.height) < 1);
      }
      sizes.push({ viewport: { width, height }, ...dimensions });
      if (width === 1920 && height === 900) {
        await page.screenshot({ path: `${out}/battle-map-wide.png` });
        const point = page.locator('.sb-bmap-point').first();
        await point.hover();
        const tip = page.getByRole('tooltip').filter({ has: page.locator('b') });
        await tip.waitFor();
        const pointBox = await point.locator('circle').last().boundingBox(), tipBox = await tip.boundingBox();
        assert(Math.abs(tipBox.x + tipBox.width / 2 - pointBox.x - pointBox.width / 2) < 2);
        assert(Math.abs(tipBox.y + tipBox.height - (pointBox.y - 8)) < 2);
        await page.mouse.move(0, 0);
      }
    }
    writeFileSync(`${out}/map-dimensions.json`, JSON.stringify(sizes, null, 2));
    await page.setViewportSize({ width: 1440, height: 900 });
  });
  await go('pages/visit-entry/index');
  await page.getByRole('button', { name: '开始录音', exact: true }).waitFor();
  await page.locator('.ds-ve-textarea').fill('测试原始记录：客户希望下周确认方案。');
  await page.evaluate(() => {
    const p = SalesRuntime.current, original = p.uploadFile;
    window.uploadCalls = 0;
    p.uploadFile = function (...args) { window.uploadCalls++; return original.apply(this, args); };
  });
  await test('录音与拖拽区同时可见；非法文件被拦截且保留文字', async () => {
    assert(await page.locator('.ds-ve-upload .ant-upload-drag').isVisible());
    await page.screenshot({ path: `${out}/visit-desktop.png` });
    await page.locator('input[type=file]').setInputFiles({ name: 'invalid.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('invalid') });
    await page.getByText('此文件类型暂不支持，请选择音频或文档。').waitFor();
    assert.equal(await page.evaluate(() => uploadCalls), 0);
    assert((await page.locator('.ds-ve-textarea').inputValue()).includes('测试原始记录'));
  });
  await test('选文件只触发一次原上传；示例接口失败后可重试且不丢文字', async () => {
    await page.locator('input[type=file]').setInputFiles({ name: 'visit-test.txt', mimeType: 'text/plain', buffer: Buffer.from('本次拜访材料，仅用于合成测试') });
    await page.waitForFunction(() => SalesRuntime.current.data.importStatus === 'failed' && !SalesRuntime.current.data.isProcessing);
    assert.equal(await page.evaluate(() => uploadCalls), 1);
    await page.getByRole('button', { name: /^重\s*试$/ }).click();
    await page.waitForFunction(() => uploadCalls === 2 && !SalesRuntime.current.data.isProcessing);
    assert((await page.locator('.ds-ve-textarea').inputValue()).includes('测试原始记录'));
    await page.getByRole('button', { name: '移除附件', exact: true }).click();
  });
  await test('拖拽文件只触发一次原上传', async () => {
    const transfer = await page.evaluateHandle(() => {
      const data = new DataTransfer(); data.items.add(new File(['拖拽测试'], 'drag-test.txt', { type: 'text/plain' })); return data;
    });
    await page.locator('.ant-upload-drag .ant-upload-btn').dispatchEvent('drop', { dataTransfer: transfer });
    await page.waitForFunction(() => uploadCalls === 3 && !SalesRuntime.current.data.isProcessing);
    assert.equal(await page.evaluate(() => uploadCalls), 3);
    await page.getByRole('button', { name: '移除附件', exact: true }).click();
    await transfer.dispose();
  });
  await test('虚拟麦克风可开始、计时、结束并进入原上传；录音时禁用上传', async () => {
    await page.getByRole('button', { name: '开始录音', exact: true }).click();
    await page.waitForFunction(() => SalesRuntime.current.data.isRecording && SalesRuntime.current.data.recordingTime !== '00:00');
    assert(await page.locator('input[type=file]').isDisabled());
    await page.screenshot({ path: `${out}/visit-recording.png` });
    await page.getByRole('button', { name: '结束并转写', exact: true }).click();
    await page.waitForFunction(() => uploadCalls === 4 && !SalesRuntime.current.data.isProcessing && !SalesRuntime.current.data.isRecording);
    assert((await page.locator('.ds-ve-textarea').inputValue()).includes('测试原始记录'));
  });
  await test('合成状态检查：上传进度、提取成功与处理期间禁用', async () => {
    await page.evaluate(() => SalesRuntime.current.setData({ isProcessing: true, importStatus: 'uploading', uploadProgress: 47, fileName: 'fixture.txt' }));
    await page.getByText('47%', { exact: true }).waitFor();
    assert(await page.getByRole('button', { name: '开始录音', exact: true }).isDisabled());
    assert(await page.locator('input[type=file]').isDisabled());
    await page.evaluate(() => SalesRuntime.current.setData({ isProcessing: false, importStatus: 'succeeded', errorText: '', statusText: '合成成功状态，仅检查展示' }));
    await page.getByText('文字已提取', { exact: true }).waitFor();
    assert(await page.getByRole('button', { name: '开始录音', exact: true }).isEnabled());
  });
  await test('录入页面在窄屏和较矮桌面可操作', async () => {
    for (const [width, height] of [[1024, 600], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.getByRole('button', { name: '开始录音', exact: true }).scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${width}px page horizontal overflow`);
      const rect = await page.getByRole('button', { name: '开始录音', exact: true }).boundingBox();
      assert(rect && rect.y >= 0 && rect.y + rect.height <= height);
      await page.getByRole('button', { name: '开始录音', exact: true }).click({ trial: true });
      const timer = await page.locator('.ds-ve-timer').boundingBox();
      assert(timer.x + timer.width <= rect.x, '计时与按钮不应重叠');
      if (width <= 900) assert.equal(await page.locator('.web-sidebar').isVisible(), false);
      await page.screenshot({ path: `${out}/visit-${width}.png` });
    }
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await test('模拟拒绝麦克风权限后恢复录入操作', async () => {
    const denied = await browser.newContext();
    await denied.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Test denied', 'NotAllowedError')); });
    const p = await denied.newPage(); p.setDefaultTimeout(15000);
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(`${base}?mode=preview#/pages/visit-entry/index`);
    await p.getByRole('button', { name: '开始录音', exact: true }).click();
    await p.waitForFunction(() => !SalesRuntime.current.data.isStarting && !SalesRuntime.current.data.isRecording);
    assert((await p.locator('body').innerText()).includes('麦克风'));
    assert(await p.locator('.ds-ve-textarea').isEnabled());
    assert(await p.locator('input[type=file]').isEnabled());
    await denied.close();
  });
  await test('总览、任务、创建客户页面冒烟，无脚本错误', async () => {
    // 新标签页避免正在编辑的拜访草稿触发原有离开确认。
    for (const route of ['pages/index/index', 'pages/tasks/index', 'pages/customer-create/index']) {
      const p = await context.newPage(); p.setDefaultTimeout(15000);
      p.on('pageerror', e => errors.push(e.message));
      await p.goto(`${base}?mode=preview#/${route}`);
      await p.waitForFunction(route => window.SalesRuntime?.current?.route === route, route);
      await p.locator('.department-ui').waitFor();
      await p.close();
    }
    assert.deepEqual(errors, []);
  });
} finally {
  writeFileSync(`${out}/results.json`, JSON.stringify({ mode: 'synthetic-preview', realTranscriptionVerified: false, results, errors }, null, 2));
  await browser.close();
}
console.log(`WEB_INTERACTIONS_OK ${results.length} checks`);
