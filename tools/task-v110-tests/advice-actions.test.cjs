// Web entry regression: suggestions retain native permissions and lifecycle rules.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(decide=async()=>({})){
  let definition;const modals=[],sent=[],events=[],toasts=[],urls=[];
  const app={globalData:{session:{userId:'one',workspaceId:'space',allowed:true}},can(){return this.globalData.session.allowed;}};
  const api={decideSuggestion(id,body){sent.push({id,body});return decide(id,body);}};
  const access={identity:s=>JSON.stringify([s.workspaceId,s.userId]),isFde:()=>false,can:s=>s.allowed};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../miniprogram/components/advice-actions/index.js'),'utf8'),{
    Component:value=>definition=value,require:name=>name.endsWith('/access')?access:api,getApp:()=>app,
    wx:{showModal:value=>modals.push(value),showToast:value=>toasts.push(value),navigateTo:value=>urls.push(value.url)}
  });
  const instance={...definition.methods,data:{...definition.data,analysisId:'analysis',suggestion:{id:'suggestion',version_no:3,decision:'pending'}},setData(value){Object.assign(this.data,value);},triggerEvent:name=>events.push(name)};
  definition.lifetimes.attached.call(instance);
  return {instance,app,modals,sent,events,toasts,urls,
    hide:()=>definition.pageLifetimes.hide.call(instance),show:()=>definition.pageLifetimes.show.call(instance),detach:()=>definition.lifetimes.detached.call(instance)};
}
test('建议采纳进入已有多人任务表单，返回后重新读取处理结果',()=>{
  const h=harness();h.instance.adopt();assert.equal(h.urls[0],'/pages/management-task-create/index?adviceId=analysis&suggestionId=suggestion');
  h.hide();h.show();assert.deepEqual(h.events,['changed']);h.show();assert.equal(h.events.length,1);
});
test('无需待办确认保留建议版本与原因，只触发当前建议刷新',async()=>{
  const h=harness();h.instance.dismiss();await h.modals[0].success({confirm:true,content:'已在线下完成'});
  assert.deepEqual(JSON.parse(JSON.stringify(h.sent)),[{id:'suggestion',body:{decision:'no_task',version_no:3,note:'已在线下完成'}}]);
  assert.deepEqual(h.events,['changed']);assert.equal(h.instance.data.saving,false);
  await h.modals[0].success({confirm:true,content:'同一确认回调不可复用'});assert.equal(h.sent.length,1);
});
test('取消建议确认不会写入，权限未开放时也不能发起操作',async()=>{
  const h=harness();h.instance.dismiss();await h.modals[0].success({confirm:false});assert.equal(h.sent.length,0);
  h.app.globalData.session.allowed=false;h.instance.dismiss();h.instance.adopt();assert.equal(h.modals.length,1);assert.equal(h.urls.length,0);
});
test('旧确认不能跨身份、工作区、建议版本、建议对象、隐藏页面或权限变化提交',async()=>{
  const changes=[h=>h.app.globalData.session.userId='two',h=>h.app.globalData.session.workspaceId='other',h=>h.instance.data.suggestion.version_no++,h=>h.instance.data.suggestion.id='other',h=>h.instance.data.analysisId='other',h=>h.hide(),h=>{h.hide();h.show();},h=>h.detach(),h=>h.app.globalData.session.allowed=false];
  for(const change of changes){const h=harness();h.instance.dismiss();change(h);await h.modals[0].success({confirm:true});assert.equal(h.sent.length,0);}
});
test('重复确认与双击仅提交一次；隐藏时成功在返回后刷新一次',async()=>{
  let resolve;const h=harness(()=>new Promise(done=>resolve=done));h.instance.dismiss();const pending=h.modals[0].success({confirm:true});
  await h.modals[0].success({confirm:true});h.instance.dismiss();assert.equal(h.sent.length,1);assert.equal(h.modals.length,1);
  h.hide();resolve({});await pending;assert.equal(h.events.length,0);assert.equal(h.instance.data.saving,false);
  h.show();assert.deepEqual(h.events,['changed']);h.show();assert.equal(h.events.length,1);
});
test('迟到成功和失败不得刷新或提示已切换身份的页面',async()=>{
  for(const failed of [false,true]){let settle;const h=harness(()=>new Promise((resolve,reject)=>settle=failed?reject:resolve));h.instance.dismiss();const pending=h.modals[0].success({confirm:true});h.app.globalData.session.userId='two';settle(failed?Error('late'):{});await pending;h.show();assert.equal(h.events.length,0);assert.equal(h.toasts.length,0);assert.equal(h.instance.data.saving,false);}
});
test('隐藏或已销毁的建议不能创建或打开待办，切换身份后的返回不重放刷新',()=>{
  const h=harness();h.instance.adopt();h.hide();h.instance.adopt();h.instance.data.suggestion.task_id='task';h.instance.openTask();assert.equal(h.urls.length,1);
  h.app.globalData.session.userId='two';h.show();assert.equal(h.events.length,0);h.detach();h.instance.openTask();assert.equal(h.urls.length,1);
});
test('三处 Web 建议动作节点提供按建议 ID 的稳定接线',()=>{
  for(const [page,prefix] of [['visit-confirm','archiveAdvice'],['visit-detail','visitAdvice'],['customer-assets','opportunityAdvice']]){
    const source=fs.readFileSync(path.resolve(__dirname,'../miniprogram/pages/'+page+'/index.wxml'),'utf8');
    assert.ok(source.includes('<advice-actions id="'+prefix+'-{{item.id}}"'));
  }
});
