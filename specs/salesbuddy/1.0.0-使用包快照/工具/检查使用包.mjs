import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('请设置 PLAYWRIGHT_MODULE');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],network=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{if(/^https?:/.test(request.url()))network.push(request.url());});
const file=(relative)=>pathToFileURL(path.join(base,relative)).href;
const check=(name,pass,details='')=>{checks.push({name,pass,details});if(!pass)throw new Error(name+': '+details);};
async function overflow(){return page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);}
try{
 await page.goto(file('index.html'));
 check('完整手册含全部 26 个已确认规则',await page.locator('body').evaluate(body=>['P-01','P-02','P-03','V-01','V-02','V-03','V-04','C-01','C-02','C-03','C-04','C-05','C-06','C-07','T-01','T-02','T-03','T-04','T-05','B-01','B-02','B-03','B-04','B-05','G-01','G-02'].every(id=>body.textContent.includes(id))));
 check('完整手册含 10 章',await page.locator('.section').count()===10);
 await page.locator('#search').fill('zzzz-no-match');
 check('无匹配有提示',await page.locator('#no-match').isVisible());
 await page.locator('#search').fill('X-12');
 check('章节查找定位跨端补充',await page.locator('.section:visible').count()===1);
 await page.locator('.sidebar nav a').first().click();
 check('目录恢复完整内容',await page.locator('.section:visible').count()===10);
 await page.locator('#font-size').click();
 check('大字阅读生效',await page.locator('body').evaluate(el=>getComputedStyle(el).fontSize)==='18px');
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:900});
  check('手册无整页横向溢出 '+width,!(await overflow()));
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#font-size').click();
 await page.screenshot({path:path.join(base,'检查截图-手册.png')});
 await page.setViewportSize({width:390,height:844});
 await page.goto(file('index.html'));
 await page.screenshot({path:path.join(base,'检查截图-手机阅读.png')});
 for(const name of ['01-任务单','02-规则变更单','03-页面验收单','04-产品采用登记表']){
  await page.goto(file('模板/'+name+'.html'));
  check('模板可离线阅读 '+name,await page.locator('h1').count()===1&&!(await overflow()));
 }
 for(const name of ['Web设计规范','Web验收清单','Web历史验证','飞书对齐方案','Web交互重构建议']){
  await page.goto(file('依据/'+name+'.html'));
  check('依据可离线阅读 '+name,await page.locator('h1').count()===1&&!(await overflow()));
 }
 for(const width of [1440,1024,390,320]){
  await page.setViewportSize({width,height:900});
  for(const route of ['foundations','components','template-home','template-list','template-detail','template-visit','template-analytics']){
   await page.goto(file('示例册/design-system/index.html')+'#'+route);
   await page.waitForFunction(()=>document.querySelector('#palette')?.children.length>0);
   const selector=route.startsWith('template-')?'[data-template="'+route.slice(9)+'"]':'#'+route;
   await page.locator(selector).waitFor({state:'visible'});
   check('示例路由与适配 '+width+' '+route,!(await overflow()));
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(file('示例册/design-system/index.html')+'#components');
 await page.locator('#validation-note').fill('保留这段合成备注');
 await page.locator('#validation-form button[type=submit]').click();
 check('校验错误保留备注',await page.locator('#validation-note').inputValue()==='保留这段合成备注'&&await page.locator('#validation-error').isVisible());
 await page.locator('#member-picker').click();
 await page.locator('.web-select-dialog').waitFor({state:'visible'});
 await page.keyboard.press('Escape');
 check('选择器打开并可取消',await page.locator('.web-select-dialog').count()===0||!(await page.locator('.web-select-dialog').isVisible()));
 await page.locator('#open-dialog').click();
 await page.locator('#catalog-dialog').waitFor({state:'visible'});
 await page.keyboard.press('Escape');
 check('示例弹窗可关闭',!(await page.locator('#catalog-dialog').isVisible()));
 await page.goto(file('示例册/design-system/index.html')+'#template-list');
 await page.locator('#list-search').fill('不存在的合成对象');
 check('列表无结果反馈',await page.locator('#list-empty').isVisible());
 await page.locator('#list-clear').click();
 check('清除筛选恢复列表',await page.locator('#opportunity-rows tr').count()>0);
 check('无需联网加载资源',network.length===0,network.join('\n'));
 check('浏览器脚本无错误',errors.length===0,errors.join('\n'));
}catch(error){checks.push({name:'运行中断',pass:false,details:error.message});}
await browser.close();
const report={checkedAt:new Date().toISOString(),scope:'本次离线阅读、链接入口、示例基本操作和布局检查；未验证真实业务或三端接入',browser:'Chrome headless / 本机 file 协议',checks,errors,externalRequests:network,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length};
fs.writeFileSync(path.join(base,'交付检查.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,failed:report.failed,last:checks.slice(-3)}));
if(report.failed)process.exitCode=1;
