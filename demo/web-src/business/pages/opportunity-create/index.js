const api = require('../../utils/apiClient');
const { identity } = require('../../utils/access');
const opportunityAmount = require('../../utils/opportunityAmount');
const writes = require('../../utils/pageWriteContext').createPageWriteContext(()=>getApp().globalData.session);
Page({
 data: { customerId:'', customerName:'', existing:null, busy:false, loading:false, error:'', query:'', customers:[] },
 onLoad(o) {
    if (typeof getApp === "function" && getApp().guardPage && !getApp().guardPage(this, 'opportunity-create', o)) return; if (!getApp().ensureLogin()) return; this.opportunityId=o.opportunityId || ''; this.setData({customerId:o.customerId || ''}); if(o.customerId) this.load(); },
 onShow() {
   this.writeHidden=false;
   if (this.loadedIdentity !== undefined && this.loadedIdentity !== identity(getApp().globalData.session)) {
     if (getApp().guardPage && !getApp().guardPage(this, 'opportunity-create')) return;
     if (this.data.customerId) return this.load();
   }
 },
 load() {
   const customerId=this.data.customerId, opportunityId=this.opportunityId;
   const context=identity(getApp().globalData.session), serial=this.loadSerial=(this.loadSerial||0)+1;
   this.loadedIdentity=context;
   this.writeIdentity=context;
   const current=()=>!this.closed && serial===this.loadSerial && customerId===this.data.customerId
     && opportunityId===this.opportunityId && context===identity(getApp().globalData.session);
   this.setData({loading:true,busy:!!(this.pageWrites && this.pageWrites.save && this.pageWrites.save.current()),error:'',customerName:'',existing:null});
   const request=opportunityId ? api.getOpportunityDetailOverview(opportunityId) : api.getCustomerReference(customerId);
   return request.then(c=>{
     if(!current()) return;
     const row=opportunityId ? c.primary_opportunity : null;
     if(c.id!==customerId || (opportunityId && (!row || row.id!==opportunityId))) throw new Error('商机不存在或无权查看');
     this.setData({customerName:c.name,existing:row});
     if(!this.writeHidden)wx.setNavigationBarTitle({title:row ? '修改商机' : '新增商机'});
   }).catch(e=>{if(current()) this.setData({error:e.message || '商机信息加载失败'});})
     .finally(()=>{if(current()) this.setData({loading:false});});
 },
 inputCustomer(e) {
   const q=e.detail.value, serial=this.searchSerial=(this.searchSerial||0)+1;
   const context=identity(getApp().globalData.session);
   this.setData({query:q,customers:[]}); clearTimeout(this.timer);
   if(!q.trim()) return;
   const current=()=>!this.closed && serial===this.searchSerial && !this.data.customerId
     && context===identity(getApp().globalData.session);
   this.timer=setTimeout(()=>{
     if(!current()) return;
     api.listCustomers({q,pageSize:20}).then(r=>{if(current()) this.setData({customers:r.items || []});})
       .catch(e=>{if(current()) this.setData({error:e.message || '客户搜索失败'});});
   },250);
 },
 selectCustomer(e) {
   clearTimeout(this.timer);this.searchSerial=(this.searchSerial||0)+1;
   this.setData({customerId:e.currentTarget.dataset.id,customers:[]}); return this.load();
 },
 onHide(){this.writeHidden=true;},
 onUnload(){this.unloaded=true;this.closed=true;this.loadSerial=(this.loadSerial||0)+1;this.searchSerial=(this.searchSerial||0)+1;clearTimeout(this.timer);},
 // BACKEND-CONTRACT 新增和修改均 POST /api/v1/customers/{id}/opportunities，action 区分。
 // 请求 amount/quarterly_forecasts 金额为元；更新携带 opportunity_id/version_no。
 // 必须返回 changed:boolean + version_no，发生变化还须 event_id；缺少回执时可能已保存，需读取核对。
 // 详见 docs/backend-handoff/客户与商机详解.md「商机表单与保存」。
 async submit() {
   if(this.data.busy || this.data.loading) return;
   const write=writes.begin(this,'save',()=>[this.data.customerId,this.opportunityId || '']);if(!write)return;
   const customerId=this.data.customerId;
   this.setData({busy:true,error:''});
   try {
     const form=this.selectComponent('#opportunityForm');
     const signature=()=>JSON.stringify([form.data && form.data.form,this.data.existing]);
     const before=signature();
     const prepared=await form.prepare();
     if(!write.visible())return;
     if(before!==signature())throw Error('商机内容已变化，请重新保存');
     const assessment=await opportunityAmount.assess(api,prepared,this.data.existing);
     if(!write.visible())return;
     if(before!==signature())throw Error('商机内容已变化，请重新保存');
     if(assessment.required){
       const result=await new Promise(resolve=>wx.showModal({title:'请核对商机金额',content:assessment.content,confirmText:'金额正确',cancelText:'返回修改',success:resolve,fail:()=>resolve({confirm:false})}));
       if(!write.visible() || !result.confirm)return;
       if(before!==signature())throw Error('商机内容已变化，请重新保存');
     }
     const payload=opportunityAmount.acknowledged(assessment);
     const r=await api.createOpportunity(customerId,payload);
     if(!write.current())return;
     if (typeof r.changed !== 'boolean' || !r.version_no || (r.changed && !r.event_id)) {
       throw new Error('未收到完整保存回执，请返回刷新商机后核对结果');
     }
     this.setData({existing:{...r},error:''});
     wx.setStorageSync('pendingOpenCustomerId',customerId);
     wx.setStorageSync('pendingOpenOpportunityId',r.id);
     if(write.visible())wx.showToast({title:r.changed ? '商机已保存' : '内容未变化',icon:r.changed ? 'success' : 'none'});
     setTimeout(()=>{if(write.settledVisible())wx.navigateBack();},700);
   } catch(e) { if(write.current())this.setData({error:e.message || '保存失败，请重试'}); }
   finally {write.finish('busy');}
 }
});
