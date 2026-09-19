import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const design=path.dirname(base);
const project=process.env.WEB_SOURCE;
if(!project||!process.env.MARKED_MODULE)throw new Error('请设置 WEB_SOURCE 和 MARKED_MODULE，指向当前工程及本机 marked 模块');
const {marked}=await import(pathToFileURL(process.env.MARKED_MODULE).href);
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const read=file=>fs.readFileSync(file,'utf8');
const write=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);};
const strip=text=>text.replace(/^---\n[\s\S]*?\n---\n/,'').trim();
const esc=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sources=[];
const example=path.join(base,'示例册');
const copyFile=(source,destination)=>{fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source,destination);sources.push({source:path.relative(project,source),output:path.relative(base,destination),sha256:sha(fs.readFileSync(source)),kind:'工程分发快照'});};
function copyTree(source,destination){for(const entry of fs.readdirSync(source,{withFileTypes:true})){const from=path.join(source,entry.name),to=path.join(destination,entry.name);if(entry.isDirectory())copyTree(from,to);else if(entry.isFile())copyFile(from,to);}}
copyTree(path.join(project,'design-system'),path.join(example,'design-system'));
for(const name of ['design-tokens.css','select-components.js','select-components.css','date-picker.js','date-picker.css','theme.css'])copyFile(path.join(project,name),path.join(example,name));
for(const name of ['tom-select-2.6.2','flatpickr-4.6.13','echarts-6.1.0'])copyTree(path.join(project,'assets/vendor',name),path.join(example,'assets/vendor',name));
for(const name of ['favicon.svg','raccoon-salesbuddy-horizontal-white-sidebar.svg'])copyFile(path.join(project,'assets/brand',name),path.join(example,'assets/brand',name));

const mappings=[
 ['01-SalesBuddy-Web规范/设计规范.md','Web设计规范.md'],
 ['01-SalesBuddy-Web规范/验收清单.md','Web验收清单.md'],
 ['01-SalesBuddy-Web规范/实现与验证.md','Web历史验证.md'],
 ['02-飞书对齐方案/对齐方案.md','飞书对齐方案.md']
];
function portable(text,prefix){
 let out=text.replaceAll(project+'/',prefix+'示例册/');
 out=out.replace(/https?:\/\/127\.0\.0\.1:(5196|5186)\/design-system\/index\.html/g,prefix+'示例册/design-system/index.html');
 out=out.replaceAll('](验收清单.md)',']('+prefix+'依据/Web验收清单.md)').replaceAll('](实现与验证.md)',']('+prefix+'依据/Web历史验证.md)').replaceAll('](设计规范.md)',']('+prefix+'依据/Web设计规范.md)');
 out=out.replaceAll('](../01-SalesBuddy-Web规范/设计规范.md)',']('+prefix+'依据/Web设计规范.md)');
 out=out.replaceAll('](../../Web交互重构建议-20260915/Web交互重构建议.md)',']('+prefix+'依据/Web交互重构建议.md)');
 out=out.replaceAll(']('+prefix+'示例册/design-system)',']('+prefix+'示例册/design-system/index.html)');
 return out.replaceAll('/Users/zhangjiatao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs','<本机 Playwright 模块路径>');
}
for(const [sourceName,outName]of mappings){const src=path.join(design,sourceName);const raw=read(src);write(path.join(base,'依据',outName),portable(raw,'../'));sources.push({source:sourceName,output:'依据/'+outName,sha256:sha(raw),kind:'文档阅读副本；相对链接适配，规则不改写'});}
const proposalSource=path.resolve(design,'../Web交互重构建议-20260915/Web交互重构建议.md');
if(fs.existsSync(proposalSource)){
 let proposal=read(proposalSource);
 // Keep the original design recommendations as text; local evidence links remain source labels in this portable supplement.
 proposal=proposal.replace(/\[([^\]]+)\]\((?!https?:|#)([^)]+)\)/g,'$1（原工程参考：$2）');
 proposal=proposal.replaceAll(project,'sales-web').replaceAll('/Users/zhangjiatao/','<原维护机>/');
 write(path.join(base,'依据/Web交互重构建议.md'),proposal);
 sources.push({source:'交付/Web交互重构建议-20260915/Web交互重构建议.md',output:'依据/Web交互重构建议.md',sha256:sha(read(proposalSource)),kind:'建议原文；本机证据链接转为文字来源标注'});
}
const evidenceRoot=path.join(design,'01-SalesBuddy-Web规范');
for(const name of ['verification.json','验证日志.txt']){
 fs.copyFileSync(path.join(evidenceRoot,name),path.join(base,'依据',name));
}
fs.cpSync(path.join(evidenceRoot,'截图'),path.join(base,'依据/截图'),{recursive:true});
const approvedRaw=read(path.join(evidenceRoot,'设计规范.md'));
const ids=[...approvedRaw.matchAll(/^\| ([PVCBTG]-\d{2})\b/gm)].map(x=>x[1]);
if(ids.length!==26||new Set(ids).size!==26)throw new Error('现行规则数量变化，需人工核对正文');
let approved=approvedRaw.slice(approvedRaw.indexOf('## 1. 设计原则'));
approved=portable(approved,'').replace(/^### /gm,'#### ').replace(/^## (\d)\. /gm,'### 5.$1 ');
const full=read(path.join(base,'手册正文.md')).replace('<!-- APPROVED_RULES -->',approved);
write(path.join(base,'部门产品设计规范.md'),full);

const template=read(path.join(base,'工具/阅读模板.html'));
function pageFromMarkdown(md,file,isMain=false){
 const lines=strip(md).split('\n');
 const title=(lines.find(l=>l.startsWith('# '))||'# 设计规范').slice(2);
 const groups=[];let intro=[];let current=null;
 for(const line of lines){if(line.startsWith('## ')){current={title:line.slice(3),lines:[line]};groups.push(current);}else if(current)current.lines.push(line);else intro.push(line);}
 if(!groups.length){groups.push({title:'内容与填写',lines:intro.filter(l=>!l.startsWith('# '))});intro=['# '+title];}
 const convert=text=>marked.parse(text).replace(/<a href="([^"#]+)\.md(#[^"]*)?"/g,'<a href="$1.html$2"').replaceAll('<table>','<div class="table-wrap"><table>').replaceAll('</table>','</table></div>');
 const toc=groups.map((g,i)=>'<a href="#chapter-'+(i+1)+'">'+esc(g.title)+'</a>').join('\n');
 const sections=groups.map((g,i)=>'<section class="section" id="chapter-'+(i+1)+'">'+convert(g.lines.join('\n'))+'</section>').join('\n');
 const home=path.relative(path.dirname(file),path.join(base,'index.html')).split(path.sep).join('/');
 const actions=isMain?'<div class="scope-note">已确认：销售 Web V1 的 26 条规则。新增：三端补充和协作采用建议。具体项目接入与验证分别登记。</div><div class="link-actions"><a href="示例册/design-system/index.html">打开可交互示例册</a><a href="模板/01-任务单.html">复制任务单</a><a href="模板/03-页面验收单.html">查看验收单</a><a href="部门产品设计规范.md" download>下载 Markdown 阅读稿</a></div>':'';
 let html=template.replaceAll('%%TITLE%%',esc(title)).replace('%%TOC%%',toc).replace('%%HOME%%',home).replace('%%INTRO%%',convert(intro.join('\n'))).replace('%%SECTIONS%%',sections).replace('%%ACTIONS%%',actions);
 write(file,html);
}
pageFromMarkdown(full,path.join(base,'index.html'),true);
pageFromMarkdown(read(path.join(base,'README.md')),path.join(base,'README.html'));
for(const folder of ['模板','依据'])for(const name of fs.readdirSync(path.join(base,folder))){if(name.endsWith('.md'))pageFromMarkdown(read(path.join(base,folder,name)),path.join(base,folder,name.replace(/\.md$/,'.html')));}
write(path.join(base,'来源清单.json'),JSON.stringify({version:'1.0.0',assembled:'2026-09-19',confirmedScope:'SalesBuddy Web V1.0',confirmedRuleIds:ids,departmentExtensions:'proposed',sources},null,2)+'\n');
console.log(JSON.stringify({base,confirmedRules:ids.length,sourceFiles:sources.length,handbookBytes:Buffer.byteLength(full)}));
