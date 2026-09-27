#!/usr/bin/env node
// 在独立的示例会话中验证 Web 排名呈现；只注入合成榜单，不写入业务数据。
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base = process.env.WEB_DEMO_URL || 'http://127.0.0.1:5198/';
const browser = await chromium.launch();
const fixture = Array.from({length:12}, (_, index) => ({
  id:`synthetic-${index+1}`, name:`合成成员${index+1}`, rank:index<2?1:index+1,
  value:index<2?100000:100000-index*5000, width:`${100-index*5}%`,
  displayValue:`¥${index<2?100000:100000-index*5000}`, meta:'合成审计数据',
  isSelected:index===11, isSelf:index===11,
}));
const errors=[];
let departmentBoard;
try {
  for (const role of ['sales','supervisor','manager']) {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();
    page.on('pageerror', error=>errors.push(`${role}: ${error.message}`));
    await page.goto(`${base}?mode=preview#/pages/bi/index`);
    await page.locator('#preview-role').waitFor();
    if(role!=='sales') await page.locator('#preview-role').selectOption(role);
    await page.waitForFunction(value=>window.SalesRuntime?.app?.globalData?.role===value,role);
    await page.evaluate(()=>SalesRuntime.route('/pages/bi/index'));
    await page.waitForFunction(()=>SalesRuntime.current?.data?.rankingCards?.length && !SalesRuntime.current.data.rankingLoading);
    const publicRows = await page.evaluate(() => SalesRuntime.current.data.rankingCards[0].rows);
    assert.deepEqual(publicRows.map(row => row.name).sort(), ['王新源','李明哲','陈国栋'].sort(), `${role}: 全部销售职级必须在同一榜单`);
    assert(publicRows.some(row => row.name === '陈国栋' && row.value === 0), '零业绩人员也必须上榜');
    assert.equal(publicRows.filter(row => row.isSelf && row.isSelected).length, 1);
    const board = publicRows.map(({name,rank,value}) => ({name,rank,value}));
    if (departmentBoard) assert.deepEqual(board, departmentBoard, '各角色看到相同的排名和汇总值');
    else departmentBoard = board;
    const actualCard = page.locator('.ds-fd-rank').first();
    const self = publicRows.find(row => row.isSelf);
    for (let index=0; index<2; index++) {
      const summaryCard=page.locator('.ds-fd-rank').nth(index);
      assert.equal(await summaryCard.locator('.ds-fd-rank-row').count(), 1, '未展开只显示本人');
      assert((await summaryCard.locator('.ds-fd-rank-row').innerText()).includes(self.name));
      await summaryCard.locator('.ds-rank-chart svg text').filter({hasText:self.name}).waitFor();
      for (const other of publicRows.filter(row => !row.isSelf)) {
        assert.equal(await summaryCard.getByText(other.name, {exact:true}).count(), 0, '未展开的列表与图表不显示他人');
      }
    }
    assert.equal(await actualCard.locator('.ds-fd-rank-no').innerText(), String(self.rank), '本人名次仍为全员榜名次');
    await actualCard.getByRole('button', {name:'查看完整榜单'}).click();
    assert.equal(await page.getByRole('dialog').locator('.ds-fd-rank-row').count(), 3);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.equal(await actualCard.locator('.ds-fd-rank-row').count(), 1, '关闭完整榜单恢复本人摘要');
    if (role !== 'sales') {
      await page.evaluate(async () => {
        const p = SalesRuntime.current;
        await p.changeView({currentTarget:{dataset:{mode:p.data.viewMode === 'team' ? 'personal' : 'team'}}});
      });
      assert.deepEqual(await page.evaluate(() => SalesRuntime.current.data.rankingCards[0].rows.map(row => row.name)), publicRows.map(row => row.name));
    }
    await page.waitForFunction(() => !SalesRuntime.current.data.loading);
    assert.equal(await page.evaluate(() => SalesRuntime.current.data.activeOpportunityCount), await page.evaluate(() => SalesRuntime.current.data.opportunityCount), '在推商机数必须仍使用所选统计范围');
    if (role === 'sales') {
      const checks = await page.evaluate(async () => {
        const request = path => new Promise(resolve => SalesPreview.request({url:'/api/v1'+path,header:{Authorization:'Bearer preview-access-sales'},success:resolve}));
        const year = SalesRuntime.current.data.selectedQuarter.year;
        const ranks = quarter => request(`/dashboard/rankings?ranking_scope=department_sales&personal=true&year=${year}&quarters=${quarter}`);
        const q1 = await ranks(1), q4 = await ranks(4);
        const ownFacts = await request('/dashboard?personal=true');
        const otherFacts = await request('/dashboard?personal=true&member_id=00000001-0000-4000-8000-000000000002');
        const otherCustomer = await request('/customers/00000010-0000-4000-8000-000000000007');
        return {q1,q4,ownFacts,otherFacts,otherCustomer};
      });
      assert.equal(checks.q1.statusCode, 200);
      assert.equal(checks.q4.statusCode, 200);
      assert.equal(checks.q1.data.scope, 'department_sales');
      assert.equal(checks.q1.data.opportunity_acv.rows.length, 3);
      assert.notDeepEqual(checks.q1.data.opportunity_acv.rows.map(r => r.value), checks.q4.data.opportunity_acv.rows.map(r => r.value), 'ACV 随季度筛选更新');
      assert.deepEqual(checks.q1.data.followup.rows, checks.q4.data.followup.rows, '跟进仍使用近七天');
      assert.equal(checks.ownFacts.statusCode, 200);
      assert.equal(checks.otherFacts.statusCode, 403, '公开汇总不开放其他成员看板明细');
      assert([403,404].includes(checks.otherCustomer.statusCode), '公开汇总不开放其他成员客户详情');
      for (const invalid of ['peer','incomplete']) {
        await page.evaluate(async invalid => {
          const original = SalesPreview;
          window.SalesPreview = {...original, request(options) {
            return original.request({...options, success(response) {
              if (options.url.includes('/dashboard/rankings')) {
                if (invalid === 'peer') response.data.scope = 'peer';
                else response.data.complete = false;
              }
              options.success(response);
            }});
          }};
          try {await SalesRuntime.current.reloadRankings();} finally {window.SalesPreview = original;}
        }, invalid);
        assert.match(await page.evaluate(() => SalesRuntime.current.data.rankingMessage), invalid === 'peer' ? /尚未提供部门全员/ : /未取得完整/);
        assert.equal(await page.evaluate(() => SalesRuntime.current.data.rankingCards[0].rows.length), 0);
      }
      await page.evaluate(() => SalesRuntime.current.reloadRankings());
    }
    await page.evaluate(rows=>SalesRuntime.current.setData({rankingMessage:'',rankingLoading:false,rankingCards:[{
      key:'acv',title:'合成排名核对',subtitle:'同级成员',period:'2026 Q3',summaryIds:['synthetic-12'],rows,
    }]}),fixture);
    const card=page.locator('.ds-fd-rank').filter({hasText:'合成排名核对'});
    await card.locator('.ds-fd-rank-row.is-selected').waitFor();
    assert.match(await card.locator('.ds-fd-rank-row.is-selected').innerText(),/12[\s\S]*合成成员12/);
    assert.equal(await card.locator('.ds-fd-rank-row').count(),1);
    assert.equal(await card.getByText('还有 2 项').count(),0);
    await card.getByRole('button',{name:'查看完整榜单'}).click();
    const drawer=page.getByRole('dialog');await drawer.waitFor();
    const ranks=await drawer.locator('.ds-fd-rank-no').allTextContents();
    assert.deepEqual(ranks.slice(0,3),['1','1','3']);
    assert.equal(ranks.length,12);
    assert.match(await drawer.locator('.ds-fd-rank-row.is-selected').innerText(),/12[\s\S]*合成成员12/);
    await page.waitForFunction(()=>{
      const row=document.querySelector('.ant-drawer .ds-fd-rank-row.is-selected');
      if(!row)return false;
      const box=row.getBoundingClientRect();return box.top>=0&&box.bottom<=innerHeight;
    },null,{timeout:5000});
    await page.keyboard.press('Escape');
    await drawer.waitFor({state:'hidden'});
    await page.evaluate(()=>SalesRuntime.current.setData({rankingMessage:'FDE暂不提供销售排名'}));
    await card.getByText('FDE暂不提供销售排名').waitFor();
    assert.equal(await card.getByRole('button',{name:'重试'}).count(),0);
    assert.equal(await card.getByText('加载失败').count(),0);
    assert.deepEqual(await page.evaluate(()=>SalesRuntime.errors),[]);
    console.log(`PASS ${role}: 跨职级全员、零值、本人高亮、范围独立、完整榜单、并列名次、本人第 12、不适用提示`);
    await context.close();
  }
  for(const role of ['fde','fde_lead']){
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();page.on('pageerror', error=>errors.push(`${role}: ${error.message}`));
    await page.goto(`${base}?mode=preview#/pages/bi/index`);
    await page.locator('#preview-role').selectOption(role);
    await page.waitForFunction(value=>window.SalesRuntime?.app?.globalData?.role===value,role);
    await page.evaluate(()=>SalesRuntime.route('/pages/bi/index'));
    await page.waitForFunction(()=>SalesRuntime.current?.selectComponent('#fdeContent')?.data?.ready);
    const card=page.locator('.ds-fd-rank').first();
    await card.getByRole('button',{name:'查看详情'}).click();
    const drawer=page.getByRole('dialog');await drawer.waitFor();
    const ranks=await drawer.locator('.ds-fd-rank-no').allTextContents();
    assert.deepEqual(ranks,await page.evaluate(()=>SalesRuntime.current.selectComponent('#fdeContent').data.companyCards[0].rows.map(row=>String(row.rank))));
    assert.deepEqual(await page.evaluate(()=>SalesRuntime.errors),[]);
    console.log(`PASS ${role}: 原始名次与完整榜单`);
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log('RANKING_PARITY_WEB_OK');
} finally {await browser.close();}
