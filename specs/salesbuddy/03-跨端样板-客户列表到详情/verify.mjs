#!/usr/bin/env node
/**
 * 跨端样板自动验收（Playwright + Chromium）
 * 用法：node verify.mjs（首次：npm i -D playwright@1.56 && npx playwright install chromium）
 * 产出：验收结果.json、截图/*.png；验收记录.md 由 write-report.mjs 生成。
 * 证据等级：本地合成数据 + 浏览器模拟视口。不代表真机、真实接口或权限验证。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

// 优先用项目里的 playwright；没有就回退到全局安装（npm root -g）；都没有则提示安装命令
const { chromium } = await import('playwright')
  .catch(() => import(pathToFileURL(join(execSync('npm root -g').toString().trim(), 'playwright', 'index.mjs')).href))
  .catch(() => { console.error('未找到 Playwright。首次运行请执行：npm i -D playwright@1.56 && npx playwright install chromium'); process.exit(2); });

const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, 'index.html')).href;
mkdirSync(join(here, '截图'), { recursive: true });

const VIEWPORTS = [
  { name: '1440', w: 1440, h: 900, mode: 'desktop' },
  { name: '1366', w: 1366, h: 768, mode: 'desktop' },
  { name: '1024', w: 1024, h: 600, mode: 'desktop' },
  { name: '900', w: 900, h: 700, mode: 'tablet' },
  { name: '760', w: 760, h: 1024, mode: 'tablet' },
  { name: '600', w: 600, h: 800, mode: 'mobile' },
  { name: '390', w: 390, h: 844, mode: 'mobile' },
  { name: '320', w: 320, h: 568, mode: 'mobile' },
];
const results = [];
function rec(group, name, pass, detail = '', shot = '') { results.push({ group, name, pass, detail, shot }); console.log(`${pass ? '通过' : '失败'}  [${group}] ${name}${detail ? ' — ' + detail : ''}`); }

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, locale: 'zh-CN', hasTouch: vp.mode === 'mobile' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForSelector('.row');
  const g = `视口 ${vp.name}`;

  // 1. 档位与横向溢出
  const mode = await page.evaluate(() => document.documentElement.dataset.mode);
  rec(g, '档位判定正确', mode === vp.mode, `期望 ${vp.mode}，实际 ${mode}`);
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  rec(g, '整页无横向溢出（列表）', overflow.sw <= overflow.iw, `scrollWidth ${overflow.sw} / innerWidth ${overflow.iw}`);
  await page.screenshot({ path: join(here, '截图', `${vp.name}-列表.png`) });

  // 2. 搜索 + 筛选 + 滚动 → 打开详情 → 返回，条件与位置保留（X-03、T-02、C-04）
  await page.fill('#q', '科');
  await page.click('.chip[data-filter="attention"]');
  const countAfterFilter = await page.$eval('#result-count', (e) => Number(e.textContent));
  rec(g, '搜索与筛选后结果数已更新', countAfterFilter > 0 && countAfterFilter < 24, `结果 ${countAfterFilter} 家`);
  await page.fill('#q', '');
  await page.click('.chip[data-filter="all"]');
  await page.evaluate(() => { const s = document.getElementById('list-scroll'); s.scrollTop = 400; });
  await page.waitForTimeout(150);
  const scrollBefore = await page.$eval('#list-scroll', (e) => e.scrollTop);
  await page.fill('#q', '');
  await page.click('.chip[data-filter="attention"]');
  await page.evaluate(() => { document.getElementById('list-scroll').scrollTop = 120; });
  await page.waitForTimeout(150);
  const scrollSet = await page.$eval('#list-scroll', (e) => e.scrollTop);
  const targetRow = page.locator('.row').nth(2);
  const targetName = await targetRow.getAttribute('title');
  const targetId = await targetRow.getAttribute('data-id');
  await targetRow.click();
  await page.waitForSelector('#detail-content h1');
  const detailTitle = await page.$eval('#detail-content h1', (e) => e.textContent);
  rec(g, '点击第三行后详情显示同一客户', detailTitle === targetName, `详情标题「${detailTitle}」`);
  const detailOpen = await page.evaluate(() => document.getElementById('app').classList.contains('detail-open'));
  rec(g, '详情已打开（detail-open）', detailOpen);
  const hash = await page.evaluate(() => location.hash);
  rec(g, '地址含客户标识（可刷新／复制定位）', hash === `#c=${targetId}`, hash);
  const overflow2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  rec(g, '整页无横向溢出（详情）', overflow2.sw <= overflow2.iw, `scrollWidth ${overflow2.sw} / innerWidth ${overflow2.iw}`);
  await page.screenshot({ path: join(here, '截图', `${vp.name}-详情.png`) });
  if (vp.mode === 'desktop') {
    const listVisible = await page.$eval('#list-scroll', (e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden');
    rec(g, '电脑：详情打开时列表仍可见（三栏并排）', listVisible);
    const closeVisible = await page.isVisible('#close');
    rec(g, '电脑：有关闭按钮，无返回按钮', closeVisible && !(await page.isVisible('#back')));
  } else {
    const backVisible = await page.isVisible('#back');
    rec(g, '收紧／手机：详情有「返回列表」按钮', backVisible);
    const listCovered = await page.$eval('#detail', (e) => { const r = e.getBoundingClientRect(); return r.width >= window.innerWidth * 0.8; });
    rec(g, '收紧／手机：详情覆盖列表区域', listCovered);
  }
  // 长中文名不溢出
  const longOk = await page.$eval('#detail-content h1', (e) => e.scrollWidth <= e.clientWidth + 1);
  rec(g, '详情标题长中文不横向溢出', longOk);
  // 返回：桌面 Esc，其他按返回；再验证浏览器返回
  if (vp.mode === 'desktop') await page.keyboard.press('Escape'); else await page.click('#back');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    open: document.getElementById('app').classList.contains('detail-open'),
    q: document.getElementById('q').value,
    filter: document.querySelector('.chip[aria-pressed="true"]').dataset.filter,
    scroll: document.getElementById('list-scroll').scrollTop,
    selected: document.querySelector('.row[aria-current="true"]')?.dataset.id,
    focused: document.activeElement?.dataset?.id,
    hash: location.hash,
  }));
  rec(g, '返回后详情已关闭', !after.open);
  rec(g, '返回后筛选条件保留', after.filter === 'attention', `筛选 ${after.filter}`);
  rec(g, '返回后滚动位置保留', Math.abs(after.scroll - scrollSet) <= 2, `返回前 ${scrollSet}，返回后 ${after.scroll}`);
  rec(g, '返回后选中行仍高亮', after.selected === targetId, `${after.selected}`);
  rec(g, '返回后焦点回到原行（C-07）', after.focused === targetId, `焦点 ${after.focused}`);
  rec(g, '返回后地址已清除客户标识', after.hash === '', after.hash);
  await page.screenshot({ path: join(here, '截图', `${vp.name}-返回.png`) });
  // 浏览器／系统返回也能关闭详情
  await page.locator('.row').nth(2).click();
  await page.waitForSelector('#detail-content h1');
  await page.goBack();
  await page.waitForTimeout(300);
  const closedByBack = await page.evaluate(() => !document.getElementById('app').classList.contains('detail-open'));
  rec(g, '浏览器返回键关闭详情且回到列表', closedByBack);
  // 刷新后仍保留条件与选中
  await page.locator('.row').nth(2).click();
  await page.waitForSelector('#detail-content h1');
  await page.reload();
  await page.waitForSelector('.row');
  const afterReload = await page.evaluate(() => ({ filter: document.querySelector('.chip[aria-pressed="true"]').dataset.filter, open: document.getElementById('app').classList.contains('detail-open'), hash: location.hash }));
  rec(g, '刷新后筛选条件与详情地址保留', afterReload.filter === 'attention' && afterReload.hash === `#c=${targetId}`, `筛选 ${afterReload.filter}，hash ${afterReload.hash}，详情 ${afterReload.open ? '开' : '关'}`);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('app').classList.contains('detail-open'));
  await page.waitForTimeout(200);

  // 3. 状态覆盖（C-06、X-11）：空、加载中、失败重试不丢条件、无权限
  await page.fill('#q', '不存在的客户');
  const emptyText = await page.textContent('#list-state');
  rec(g, '无匹配：说明原因并可清除条件', /没有匹配的客户/.test(emptyText) && (await page.isVisible('#empty-reset')));
  await page.screenshot({ path: join(here, '截图', `${vp.name}-无匹配.png`) });
  await page.click('#empty-reset');
  rec(g, '清除条件后恢复全部', (await page.$eval('#result-count', (e) => Number(e.textContent))) === 24);
  await page.click('.chip[data-filter="asset"]');
  await page.fill('#q', '科');
  // 演示控制：打开面板 → 选中即自动收起
  const setDemo = async (name, value) => { await page.click('#demo-toggle'); await page.check(`input[name="${name}"][value="${value}"]`); await page.waitForFunction(() => document.getElementById('demo').hidden); };
  await setDemo('list-state', 'loading');
  rec(g, '加载中：有文案与骨架', /正在加载客户列表/.test(await page.textContent('#list-state')));
  await page.screenshot({ path: join(here, '截图', `${vp.name}-加载中.png`) });
  await setDemo('list-state', 'error');
  rec(g, '加载失败：可重试并说明不丢条件', /加载失败/.test(await page.textContent('#list-state')) && (await page.isVisible('#retry')));
  await page.screenshot({ path: join(here, '截图', `${vp.name}-加载失败.png`) });
  await page.click('#retry');
  const afterRetry = await page.evaluate(() => ({ q: document.getElementById('q').value, filter: document.querySelector('.chip[aria-pressed="true"]').dataset.filter }));
  rec(g, '重试后搜索与筛选未丢失', afterRetry.q === '科' && afterRetry.filter === 'asset', `搜索「${afterRetry.q}」、筛选「${({ all: '全部', attention: '有风险', attack: '主攻区', asset: '客户资产', order: '见单打单', resource: '客户资源' })[afterRetry.filter] || afterRetry.filter}」均保留`);
  await setDemo('detail-state', 'forbidden');
  await page.locator('.row').first().click();
  await page.waitForTimeout(100);
  const forbiddenText = await page.textContent('#detail-content');
  const firstName = await page.locator('.row').first().getAttribute('title');
  rec(g, '无权限：详情说明权限并可返回，列表条件仍在', /暂无查看权限/.test(forbiddenText) && (await page.$eval('#q', (e) => e.value)) === '科');
  rec(g, '无权限：不暴露客户名称（业务约束 约-15）', forbiddenText.indexOf(firstName) < 0, `名称「${firstName}」未出现`);
  await page.screenshot({ path: join(here, '截图', `${vp.name}-无权限.png`) });
  await page.click('#back2');
  await page.waitForFunction(() => !document.getElementById('app').classList.contains('detail-open'));
  await page.waitForTimeout(200);
  await setDemo('detail-state', 'normal');

  // 4. 手机可读可点（X-06、X-07）
  if (vp.mode === 'mobile') {
    const sizes = await page.evaluate(() => {
      const px = (el) => parseFloat(getComputedStyle(el).fontSize);
      const name = document.querySelector('.row-name'), meta = document.querySelector('.row-meta');
      const targets = [...document.querySelectorAll('.nav .nav-item, .btn, .chip')].filter((e) => e.offsetParent !== null).map((e) => ({ label: e.textContent.trim().slice(0, 8), h: e.getBoundingClientRect().height, w: e.getBoundingClientRect().width }));
      return { body: px(name), meta: px(meta), targets, tabbar: document.querySelector('.nav').getBoundingClientRect().height };
    });
    rec(g, '手机正文字号 ≥ 16px（X-06 建议）', sizes.body >= 16, `行主文字 ${sizes.body}px`);
    rec(g, '手机说明文字 ≥ 12px（V-02 底线）', sizes.meta >= 12, `行说明 ${sizes.meta}px`);
    rec(g, '底部导航、按钮与筛选片高度均 ≥ 44px', sizes.targets.every((t) => t.h >= 44), `导航栏高 ${sizes.tabbar}px；最小目标 ${Math.min(...sizes.targets.map((t) => t.h))}px`);
    await page.locator('.row').first().click();
    await page.waitForSelector('#detail-content h1');
    const bar = await page.evaluate(() => { const b = document.querySelector('.action-bar'); const r = b.getBoundingClientRect(); return { visible: getComputedStyle(b).display !== 'none', bottom: Math.round(window.innerHeight - r.bottom), h: r.height, btn: Math.min(...[...b.querySelectorAll('.btn')].map((x) => x.getBoundingClientRect().height)) }; });
    rec(g, '手机详情主动作固定在底部且 ≥ 44px', bar.visible && bar.bottom === 0 && bar.btn >= 44, `距底 ${bar.bottom}px，按钮高 ${bar.btn}px`);
    await page.click('#back');
  }
  // 5. 键盘：↑↓ 移动焦点，Enter 打开（先恢复全部列表，保证至少 3 行）
  await page.fill('#q', '');
  await page.click('.chip[data-filter="all"]');
  rec(g, '核心客户在列表行有文字标识（业务约束 约-23）', (await page.locator('.row .core').count()) === 3, `核心标识 ${await page.locator('.row .core').count()} 处`);
  rec(g, '潜力缺失的客户象限显示「待评估」且不落入任何一格', (await page.locator('.row', { hasText: '泰和银行' }).locator('.row-meta').textContent()).indexOf('象限：待评估') >= 0);
  await page.locator('.row').first().focus();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  const focusedIdx = await page.evaluate(() => [...document.querySelectorAll('.row')].indexOf(document.activeElement));
  rec(g, '键盘 ↑↓ 在列表行间移动焦点', focusedIdx === 2, `焦点在第 ${focusedIdx + 1} 行`);
  await page.keyboard.press('Enter');
  await page.waitForSelector('#detail-content h1');
  rec(g, 'Enter 打开焦点行的详情', await page.evaluate(() => document.getElementById('app').classList.contains('detail-open')));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('app').classList.contains('detail-open'));
  rec(g, '页面无脚本错误', errors.length === 0, errors.join('; '));
  await ctx.close();
}
await browser.close();
const summary = { checkedAt: new Date().toISOString(), scope: '本地合成数据，Chromium 模拟视口；未验证真机、真实接口、权限与 AI 归档', browser: 'Playwright Chromium', total: results.length, passed: results.filter((r) => r.pass).length, failed: results.filter((r) => !r.pass).length, results };
writeFileSync(join(here, '验收结果.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`\n合计 ${summary.total} 项：通过 ${summary.passed}，失败 ${summary.failed}`);
process.exit(summary.failed ? 1 : 0);
