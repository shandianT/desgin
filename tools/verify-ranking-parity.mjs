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
    await page.evaluate(rows=>SalesRuntime.current.setData({rankingMessage:'',rankingLoading:false,rankingCards:[{
      key:'acv',title:'合成排名核对',subtitle:'同级成员',period:'2026 Q3',summaryIds:['synthetic-12'],rows,
    }]}),fixture);
    const card=page.locator('.ds-fd-rank').filter({hasText:'合成排名核对'});
    await card.locator('.ds-fd-rank-row.is-selected').waitFor();
    assert.match(await card.locator('.ds-fd-rank-row.is-selected').innerText(),/12[\s\S]*合成成员12/);
    assert.equal(await card.getByText('还有 2 项').count(),1);
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
    console.log(`PASS ${role}: 并列名次、本人第 12、完整榜单定位、不适用提示`);
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
