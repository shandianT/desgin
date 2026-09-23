#!/usr/bin/env node
// GitHub Pages 合成示例：检查各角色原有多选筛选统一为复选框确认。
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.WEB_DEMO_URL || 'http://127.0.0.1:5198/';
const out = 'out/multiple-filters'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
const results = [], errors = [];
page.on('pageerror', e => errors.push(e.message));
async function go(route) {
  await page.goto(`${base}?mode=preview#/${route}`);
  await page.waitForFunction(route => window.SalesRuntime?.current?.route === route, route);
  await page.locator('.department-ui').waitFor();
}
async function target(component = false) {
  await page.evaluate(component => { window.filterTarget = component ? SalesRuntime.current.selectComponent('#fdeContent') : SalesRuntime.current; }, component);
}
async function exercise({ label, key, method, expected, screenshot, afterApply }) {
  const name = `${label} / ${key}`;
  const trigger = page.getByRole('button', { name: new RegExp(`^${label}：`) });
  const dialog = page.getByRole('dialog', { name: `${label}筛选` });
  const read = () => page.evaluate(key => filterTarget.data[key], key);
  const previous = await read();
  await page.evaluate(method => {
    const target = filterTarget, original = target[method];
    window.multiFilterCalls = 0;
    window.restoreFilterSpy = () => { target[method] = original; };
    target[method] = function (...args) { multiFilterCalls++; return original.apply(this, args); };
  }, method);
  try {
    await trigger.click();
    await dialog.getByRole('checkbox').nth(0).check();
    await dialog.getByRole('checkbox').nth(1).check();
    assert.deepEqual(await read(), previous);
    assert.equal(await page.evaluate(() => multiFilterCalls), 0);
    await dialog.getByRole('button', { name: /^取\s*消$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await trigger.click();
    assert.equal(await dialog.getByRole('checkbox').first().isChecked(), previous.includes(expected[0]));
    await dialog.getByRole('checkbox').nth(0).check();
    await dialog.getByRole('checkbox').nth(1).check();
    if (screenshot) { await page.waitForTimeout(350); await page.screenshot({ path: `${out}/${screenshot}.png` }); }
    await dialog.getByRole('button', { name: /^应\s*用$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => multiFilterCalls > 0 && !filterTarget.data.loading && !filterTarget.data.acvLoading && !filterTarget.data.directoryLoading);
    assert.deepEqual(await read(), expected);
    assert.equal(await page.evaluate(() => multiFilterCalls), 1, '一次应用仅调用一次既有筛选或加载');
    if (afterApply) await afterApply();
    await trigger.click();
    assert(await dialog.getByRole('checkbox').nth(0).isChecked());
    assert(await dialog.getByRole('checkbox').nth(1).isChecked());
    await dialog.getByRole('button', { name: /^清\s*空$/ }).click();
    assert.deepEqual(await read(), expected);
    await dialog.getByRole('button', { name: /^应\s*用$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => multiFilterCalls >= 2 && !filterTarget.data.loading && !filterTarget.data.acvLoading);
    assert.deepEqual(await read(), []);
    assert.equal(await page.evaluate(() => multiFilterCalls), 2);
    results.push({ name, passed: true }); console.log(`PASS ${name}`);
  } catch (e) { results.push({ name, passed: false, error: e.message }); throw e; }
  finally { await page.evaluate(() => restoreFilterSpy()); }
}
try {
  await go('pages/customers/index');
  await page.waitForFunction(() => SalesRuntime.current.data.customers.length > 0 && !SalesRuntime.current.data.acvLoading);
  await target();
  const all = await page.evaluate(() => filterTarget.data.customers.map(c => ({ id: c.id, level: c.level })));
  await exercise({ label: '优先级', key: 'mapSelectedLevels', method: 'applyFilters', expected: ['Tier-1', 'Tier-2'], screenshot: 'customer-priority', afterApply: async () => {
    const ids = await page.evaluate(() => filterTarget.data.customers.map(c => c.id));
    assert.deepEqual(ids, all.filter(c => ['Tier-1', 'Tier-2'].includes(c.level)).map(c => c.id));
    assert.equal(await page.evaluate(() => filterTarget._departmentCustomerPage), 1);
  } });
  assert.equal(await page.evaluate(() => filterTarget.data.customers.length), all.length);

  await go('pages/opportunities/index');
  await page.waitForFunction(() => SalesRuntime.current.data.stageOptions.length >= 2 && !SalesRuntime.current.data.loading);
  await target();
  const boardStages = await page.evaluate(() => filterTarget.data.stageOptions.slice(0, 2).map(s => s.value));
  await exercise({ label: '阶段', key: 'selectedStages', method: 'applyFilters', expected: boardStages, afterApply: async () => {
    assert(await page.evaluate(() => filterTarget.data.filtered.every(r => filterTarget.data.selectedStages.includes(r.stage_code))));
  } });

  await page.locator('#preview-role').selectOption('fde_lead');
  await page.waitForFunction(() => SalesRuntime.current.data.isFde);
  await go('pages/customers/index');
  await page.waitForFunction(() => SalesRuntime.current.data.fdeMapMembers?.filter(m => m.id).length >= 2 && !SalesRuntime.current.data.acvLoading && !SalesRuntime.current.data.directoryLoading);
  await target();
  const members = await page.evaluate(() => filterTarget.data.fdeMapMembers.filter(m => m.id).slice(0, 2).map(m => m.id));
  await exercise({ label: '协助成员', key: 'fdeMapMemberIds', method: 'loadData', expected: members });

  await go('pages/workbench/index');
  await page.waitForFunction(() => { const c = SalesRuntime.current.selectComponent('#fdeContent'); return c?.data.stages.length >= 2 && !c.data.loading && !c.data.membersLoading; });
  await target(true);
  const fdeOptions = await page.evaluate(() => ({
    members: filterTarget.data.members.filter(m => m.id).slice(0, 2).map(m => m.id),
    stages: filterTarget.data.stages.slice(0, 2).map(s => s.code),
    quarters: filterTarget.data.quarterOptions.slice(0, 2).map(q => q.value),
  }));
  await exercise({ label: '人员', key: 'memberIds', method: 'load', expected: fdeOptions.members });
  await exercise({ label: '阶段', key: 'selectedStages', method: 'filter', expected: fdeOptions.stages, screenshot: 'fde-stage', afterApply: async () => {
    assert(await page.evaluate(() => filterTarget.data.filtered.every(r => filterTarget.data.selectedStages.includes(r.stage_code))));
  } });
  await exercise({ label: '关单季度', key: 'quarters', method: 'filter', expected: fdeOptions.quarters, screenshot: 'fde-quarter', afterApply: async () => {
    assert(await page.evaluate(() => filterTarget.data.filtered.every(r => filterTarget.data.quarters.includes(Math.floor((Number(r.expected_close_date.slice(5, 7)) - 1) / 3) + 1))));
  } });
  // 年份／等级仍是原单选；字段数量和下拉类型没有随默认多选交互误改。
  assert(await page.locator('.sb-lselect').filter({ hasText: '关单年份' }).getByRole('combobox').count());
  assert(await page.locator('.sb-lselect').filter({ hasText: '等级' }).getByRole('combobox').count());
  assert.equal(await page.locator('.sb-lselect .ant-select-multiple').count(), 0);
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/results.json`, JSON.stringify({ mode: 'synthetic-preview', results, errors }, null, 2));
  await browser.close();
}
console.log(`MULTIPLE_FILTERS_OK ${results.length} checks`);
