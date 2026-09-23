#!/usr/bin/env node
// 独立浏览器中的合成跨年数据；只在测试响应中开放 preview state，不改产品数据或源码。
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const base = process.env.WEB_DEMO_URL || 'http://127.0.0.1:5198/';
const out = 'out/opportunity-years'; mkdirSync(out, { recursive: true });
const source = readFileSync('demo/web/preview-api.js', 'utf8');
assert(source.includes('inspect() {return localDataset ? getState() : null;}'));
const fixtureSource = source.replace('inspect() {return localDataset ? getState() : null;}', 'inspect() {return getState();}')
  .replace('function dispatch(options) {', `function dispatch(options) {
    (global.__yearRequests ||= []).push(options.url);
    if (global.__failYearOnce && options.url.includes('/opportunities/overview')) { global.__failYearOnce = false; error(503, '合成测试：年度统计暂时失败'); }
  `);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
const results = [], errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route('**/preview-api.js*', route => route.fulfill({ contentType: 'application/javascript', body: fixtureSource }));
const input = label => page.getByRole('textbox', { name: label, exact: true });
const current = () => page.evaluate(() => ({ summary: SalesRuntime.current.data.summaryQuarter, list: SalesRuntime.current.data.listQuarter, board: SalesRuntime.current.data.opportunityBoard, total: SalesRuntime.current.data.opportunityTotal }));
async function ready() {
  // 原运行时在下一帧执行 setData 回调，再发起查询；先等待回调，避免读到上一次结果。
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !SalesRuntime.current.data.opportunityListLoading && !SalesRuntime.current.data.opportunityOverviewLoading && !SalesRuntime.current.data.opportunityLoadingMore);
}
async function year(label, value) {
  await input(label).fill(String(value)); await input(label).press('Enter');
  await page.locator('.ds-opp-count').click();
  await page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)').waitFor({ state: 'hidden' });
  await ready();
}
async function clear(label) {
  const control = page.locator('.ds-opp-year').filter({ has: input(label) });
  await control.hover(); await control.locator('.ant-picker-clear').click(); await ready();
}
async function test(name, fn) {
  try { await fn(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (e) { results.push({ name, passed: false, error: e.message }); throw e; }
}
try {
  await page.goto(`${base}?mode=preview#/pages/workbench/index`); await input('统计年份').waitFor(); await ready();
  await page.evaluate(async () => {
    const s = SalesPreview.inspect(), base = s.opportunities[0];
    const dates = Array.from({ length: 23 }, (_, i) => `2023-${String(3 * (i % 4 + 1)).padStart(2, '0')}-15`).concat(['2011-03-15', '2035-03-15', null]);
    s.opportunities = dates.map((date, i) => ({ ...base, id: `70000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, name: `合成年度测试 ${i + 1}`, expected_close_date: date, created_at: date ? `${date}T08:00:00+08:00` : null, won_at: null, actual_close_date: null, stage_code: 'solution', probability: 50, status: 'open' }));
    await Promise.all([SalesRuntime.current.applyOpportunitySummary(), SalesRuntime.current.applyOpportunityFilters()]);
    window.__yearRequests = [];
  });
  await test('统计年份支持点选 2023、输入更早年份，全年与全部年份有明确区别', async () => {
    assert.equal((await current()).board.total, 26);
    assert.equal(await input('统计年份').inputValue(), '');
    await input('统计年份').click();
    await page.locator('.ant-picker-cell[title="2023"]').click(); await ready();
    let state = await current();
    assert.equal(state.summary.year, 2023); assert.deepEqual(state.summary.quarters, [1, 2, 3, 4]);
    assert.equal(state.board.total, 23); assert.equal(state.total, 26);
    const requests = await page.evaluate(() => __yearRequests.filter(u => u.includes('/opportunities/overview')));
    assert.equal(requests.length, 1);
    const query = new URL(requests[0], base).searchParams;
    assert.equal(query.get('year'), '2023'); assert.deepEqual(query.getAll('quarters'), ['1', '2', '3', '4']);
    await page.getByText('Q2', { exact: true }).click(); await ready();
    assert.equal((await current()).board.total, 6);
    await year('统计年份', 2011); assert.equal((await current()).board.total, 0);
    await page.getByText('全年', { exact: true }).click(); await ready();
    assert.equal((await current()).board.total, 1);
    await clear('统计年份'); state = await current();
    assert.equal(state.board.total, 26); assert.deepEqual(state.summary.quarters, []);
    assert.equal(await page.getByText('Q2', { exact: true }).count(), 0);
  });
  await test('列表关单年份实际查询历史记录，分页继续保留所选年份，清空包含未登记日期', async () => {
    await page.evaluate(() => { window.__yearRequests = []; });
    await year('关单年份', 2023);
    assert.equal((await current()).total, 23); assert.equal((await current()).board.total, 26);
    assert.equal(await page.evaluate(() => SalesRuntime.current.data.opportunityItems.length), 20);
    await page.getByRole('button', { name: '加载更多', exact: true }).click(); await ready();
    const rows = await page.evaluate(() => SalesRuntime.current.data.opportunityItems);
    assert.equal(rows.length, 23); assert(rows.every(o => o.expected_close_date.startsWith('2023-')));
    const requests = await page.evaluate(() => __yearRequests.filter(u => /\/opportunities\?/.test(u)));
    assert.equal(requests.length, 2);
    for (const url of requests) { const q = new URL(url, base).searchParams; assert.equal(q.get('year'), '2023'); assert.equal(q.getAll('quarters').length, 4); }
    assert.equal(new URL(requests[1], base).searchParams.get('offset'), '20');
    await year('关单年份', 2011); assert.equal((await current()).total, 1);
    await year('关单年份', 2035); assert.equal((await current()).total, 1);
    await clear('关单年份'); assert.equal((await current()).total, 26);
    await page.getByRole('button', { name: '加载更多', exact: true }).click(); await ready();
    assert(await page.evaluate(() => SalesRuntime.current.data.opportunityItems.some(o => !o.expected_close_date)));
  });
  await test('年份与阶段、搜索组合；无结果、清除和统计失败重试可恢复', async () => {
    await year('关单年份', 2023);
    await page.getByRole('button', { name: /^阶段：/ }).click();
    const dialog = page.getByRole('dialog', { name: '阶段筛选' });
    await dialog.getByRole('checkbox', { name: '方案沟通－50%' }).check();
    await dialog.getByRole('button', { name: /^应\s*用$/ }).click(); await ready();
    const search = page.getByPlaceholder('搜索客户、商机或产品线');
    await search.fill('合成年度测试 1'); await search.press('Enter'); await ready();
    assert.equal((await current()).total, 11);
    await year('关单年份', 2035); assert.equal((await current()).total, 0);
    assert.deepEqual(await page.evaluate(() => SalesRuntime.current.data.opportunitySelectedStages), ['solution']);
    assert.equal(await search.inputValue(), '合成年度测试 1');
    await year('关单年份', 2023); assert.equal((await current()).total, 11);
    await page.getByRole('button', { name: '清除筛选', exact: true }).first().click(); await ready();
    assert.equal((await current()).total, 26); assert.equal(await input('关单年份').inputValue(), '');
    await page.evaluate(() => { window.__failYearOnce = true; });
    await year('统计年份', 2023);
    await page.getByRole('alert').filter({ hasText: '合成测试' }).waitFor();
    assert.equal((await current()).summary.year, 2023);
    await page.getByRole('button', { name: /^重\s*试$/ }).click(); await ready();
    assert.equal((await current()).board.total, 23);
  });
  await test('年份选择在桌面和手机可操作，无整页横向溢出', async () => {
    await year('关单年份', 2023);
    await page.screenshot({ path: `${out}/years-2023.png` });
    await input('统计年份').click();
    await page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden) .ant-picker-year-panel').waitFor();
    await page.waitForTimeout(250); // 留图等待年份面板展开动效完成。
    await page.screenshot({ path: `${out}/year-picker.png` });
    await page.keyboard.press('Escape');
    for (const width of [1024, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await input('统计年份').scrollIntoViewIfNeeded();
      await year('统计年份', 2011); assert.equal((await current()).board.total, 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${out}/year-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
  });
} finally {
  writeFileSync(`${out}/results.json`, JSON.stringify({ mode: 'synthetic-cross-year-fixture', productionVerified: false, results, errors }, null, 2));
  await browser.close();
}
console.log(`OPPORTUNITY_YEARS_OK ${results.length} checks`);
