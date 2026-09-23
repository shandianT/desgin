#!/usr/bin/env node
// Verify the actual preview response and drawer, not a hand-injected ranking.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.WEB_DEMO_URL || 'http://127.0.0.1:5198/';
const browser = await chromium.launch();
try {
  for (const role of ['sales', 'supervisor', 'manager', 'fde', 'fde_lead']) {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}?mode=preview#/pages/bi/index`);
    await page.locator('#preview-role').selectOption(role);
    await page.waitForFunction(value => window.SalesRuntime?.app?.globalData?.role === value, role);
    await page.evaluate(() => SalesRuntime.route('/pages/bi/index'));

    if (!role.startsWith('fde')) {
      if (role === 'manager') await page.evaluate(() => SalesRuntime.current.changeView({currentTarget: {dataset: {mode: 'personal'}}}));
      await page.waitForFunction(() => SalesRuntime.current?.data?.rankingCards?.length && !SalesRuntime.current.data.rankingLoading);
      const cards = await page.evaluate(() => SalesRuntime.current.data.rankingCards);
      for (const key of ['acv', 'followup']) {
        const card = cards.find(row => row.key === key);
        assert.ok(card && card.rows.length > 1, `${role} ${key} should include peers`);
        assert.ok(card.rows.some(row => row.isSelf), `${role} ${key} should keep the current person`);
        assert.ok(card.rows.some(row => row.name.startsWith('示例')), `${role} ${key} should identify example peers`);
      }
      const acv = cards.find(card => card.key === 'acv');
      assert.ok(acv.rows.some(row => row.name.startsWith('示例') && row.value > 0), `${role} sample peers should have matching activity`);
      await page.getByRole('button', {name: '查看完整榜单'}).first().click();
      const drawer = page.getByRole('dialog');
      await drawer.waitFor();
      assert.equal(await drawer.locator('.ds-fd-rank-row').count(), acv.rows.length);
      assert.deepEqual(await drawer.locator('.ds-fd-rank-no').allTextContents(), acv.rows.map(row => String(row.rank)));
      if (role === 'sales') {
        await page.reload();
        await page.waitForFunction(() => window.SalesRuntime?.current?.data?.rankingCards?.length && !window.SalesRuntime.current.data.rankingLoading);
        const reloaded = await page.evaluate(() => SalesRuntime.current.data.rankingCards.find(card => card.key === 'acv').rows);
        assert.deepEqual(reloaded.map(row => [row.name, row.value]), acv.rows.map(row => [row.name, row.value]), 'reload must not duplicate example records');
        await page.evaluate(() => {
          const key = 'sales-web:preview-workspace:v1', saved = JSON.parse(localStorage.getItem(key));
          saved.opportunities = saved.opportunities.filter(row => !row.id.startsWith('00000031-'));
          saved.visits = saved.visits.filter(row => !/^0000003[23]-/.test(row.id));
          delete saved.preview_rank_peers_v1;
          saved.serial = 12345; // Existing preview edits must survive the fixture upgrade.
          localStorage.setItem(key, JSON.stringify(saved));
        });
        await page.reload();
        await page.waitForFunction(() => window.SalesRuntime?.current?.data?.rankingCards?.length && !window.SalesRuntime.current.data.rankingLoading);
        const migrated = await page.evaluate(() => {
          const state = JSON.parse(localStorage.getItem('sales-web:preview-workspace:v1'));
          return {serial: state.serial, count: state.opportunities.filter(row => row.id.startsWith('00000031-')).length,
            unique: new Set(state.opportunities.map(row => row.id)).size === state.opportunities.length};
        });
        assert.deepEqual(migrated, {serial: 12345, count: 9, unique: true});
      }
      console.log(`PASS ${role}: ${acv.rows.length} people in complete ranking`);
    } else {
      await page.waitForFunction(() => SalesRuntime.current?.selectComponent('#fdeContent')?.data?.ready);
      if (role === 'fde_lead') {
        await page.evaluate(() => SalesRuntime.current.selectComponent('#fdeContent').scope({currentTarget: {dataset: {scope: 'self'}}}));
        await page.waitForFunction(() => SalesRuntime.current.selectComponent('#fdeContent')?.data?.ready &&
          SalesRuntime.current.selectComponent('#fdeContent').data.rankingSelection?.personal === true);
      }
      const cards = await page.evaluate(() => SalesRuntime.current.selectComponent('#fdeContent').data.companyCards);
      assert.ok(cards[0]?.rows.length > 1, `${role} should include FDE peers`);
      await page.getByRole('button', {name: '查看详情'}).first().click();
      const drawer = page.getByRole('dialog');
      await drawer.waitFor();
      assert.equal(await drawer.locator('.ds-fd-rank-row').count(), cards[0].rows.length);
      console.log(`PASS ${role}: ${cards[0].rows.length} people in complete ranking`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PREVIEW_RANKING_COHORT_OK');
} finally {
  await browser.close();
}
