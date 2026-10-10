#!/usr/bin/env node
// 使用内置合成预览验证完整榜单的同页 Drawer 交互，不写入业务数据。
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.WEB_DEMO_URL || 'http://127.0.0.1:5198/';
const browser = await chromium.launch();
const errors = [];
try {
  for (const role of ['sales', 'supervisor', 'manager', 'fde', 'fde_lead']) {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${role}: ${error.message}`));
    await page.goto(`${base}?mode=preview#/pages/bi/index`);
    await page.locator('#preview-role').selectOption(role);
    await page.waitForFunction(value => window.SalesRuntime?.app?.globalData?.role === value, role);
    await page.evaluate(() => SalesRuntime.route('/pages/bi/index'));
    const card = page.locator('.ds-fd-rank').first();
    const button = card.getByRole('button', {name: role.startsWith('fde') ? '查看详情' : '查看完整榜单'});
    await button.waitFor({state: 'visible'});
    const originalUrl = page.url();
    await button.click();
    const drawer = page.getByRole('dialog');
    await drawer.waitFor();
    assert.equal(await page.locator('.ds-rank-drawer.ant-drawer-right').count(), 1, `${role}: 应从右侧打开`);
    assert((await drawer.locator('.ds-fd-rank-row').count()) > 0, `${role}: 应展示榜单`);
    await page.keyboard.press('Escape');
    await drawer.waitFor({state: 'hidden'});
    assert.equal(page.url(), originalUrl, `${role}: 关闭后应留在原页面`);
    await page.waitForFunction(() => document.querySelector('.ds-fd-rank-head button') === document.activeElement, null, {timeout: 3000});
    await context.close();
  }

  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`mobile: ${error.message}`));
  await page.goto(`${base}?mode=preview#/pages/bi/index`);
  await page.locator('#preview-role').selectOption('sales');
  await page.waitForFunction(() => window.SalesRuntime?.app?.globalData?.role === 'sales');
  await page.evaluate(() => SalesRuntime.route('/pages/bi/index'));
  await page.waitForFunction(() => SalesRuntime.current?.data?.rankingCards?.length && !SalesRuntime.current.data.rankingLoading);
  const fixture = Array.from({length: 12}, (_, index) => ({
    id: `synthetic-${index + 1}`, name: `合成成员${index + 1}`, rank: index < 2 ? 1 : index + 1,
    value: 100000 - index * 5000, width: `${100 - index * 5}%`,
    displayValue: `¥${100000 - index * 5000}`, meta: '合成数据',
    isSelected: index === 11, isSelf: index === 11,
  }));
  await page.evaluate(rows => SalesRuntime.current.setData({rankingMessage: '', rankingLoading: false, rankingCards: [{
    key: 'acv', title: '合成排名核对', subtitle: '同级成员', period: '2026 Q3', summaryIds: ['synthetic-12'], rows,
  }]}), fixture);
  const card = page.locator('.ds-fd-rank').filter({hasText: '合成排名核对'});
  await card.getByRole('button', {name: '查看完整榜单'}).click();
  const drawer = page.getByRole('dialog');
  await drawer.waitFor();
  assert.equal(await drawer.locator('.ds-fd-rank-row').count(), 12);
  assert.deepEqual((await drawer.locator('.ds-fd-rank-no').allTextContents()).slice(0, 3), ['1', '1', '3']);
  const search = drawer.locator('input[aria-label="搜索榜单成员"]');
  await search.fill('合成成员1');
  assert.deepEqual(await drawer.locator('.ds-fd-rank-no').allTextContents(), ['1', '10', '11', '12']);
  await search.fill('不存在');
  await drawer.getByText('没有匹配的成员，请换个关键词').waitFor();
  await drawer.getByRole('button', {name: '定位当前'}).click();
  assert.equal(await drawer.locator('.ds-fd-rank-row').count(), 12);
  await page.waitForFunction(() => {
    const row = document.querySelector('.ds-rank-drawer .ds-fd-rank-row.is-selected');
    if (!row) return false;
    const box = row.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight;
  });
  await page.setViewportSize({width: 390, height: 844});
  await page.waitForFunction(() => document.querySelector('.ds-rank-drawer .ant-drawer-content-wrapper')?.getBoundingClientRect().width <= innerWidth);
  const width = await page.locator('.ds-rank-drawer .ant-drawer-content-wrapper').evaluate(node => node.getBoundingClientRect().width);
  assert(width <= 390, `手机端抽屉不得超出屏幕宽度（实际 ${width}px）`);
  await drawer.getByRole('button', {name: '回到榜首'}).click();
  assert.equal(await drawer.locator('.ds-fd-rank-row').first().locator('.ds-fd-rank-no').innerText(), '1');
  assert((await page.locator('.ds-rank-drawer .ant-drawer-body').evaluate(node => node.scrollTop)) < 2, '回到榜首应滚到列表顶部');
  await page.keyboard.press('Escape');
  await drawer.waitFor({state: 'hidden'});
  assert.deepEqual(errors, []);
  console.log('RANKING_DRAWER_OK: 五角色、同页返回、搜索、定位、并列名次、手机宽度');
  await context.close();
} finally {
  await browser.close();
}
