const api = require('../../utils/apiClient');
const access = require('../../utils/access');
Component({
  properties:{analysisId:String,suggestion:Object},
  data:{saving:false,canDecide:false,isFde:false},
  lifetimes:{attached(){this._hidden=false;this.refreshPermissions();},detached(){this._detached=true;this._confirmSerial=(this._confirmSerial||0)+1;}},
  pageLifetimes:{
    show(){
      this._hidden=false;this.refreshPermissions();
      const refresh=(this._decisionRefresh&&this.sameDecisionContext(this._decisionRefresh))||(this._returnFromTask&&this.sameDecisionContext(this._returnFromTask));
      this._decisionRefresh=null;
      this._returnFromTask=null;
      if(refresh)this.triggerEvent('changed');
    },
    hide(){this._hidden=true;this._confirmSerial=(this._confirmSerial||0)+1;}
  },
  methods:{
    refreshPermissions(){const app=getApp(),session=(app.globalData||{}).session;this.setData({isFde:access.isFde(session&&session.role||(app.globalData||{}).role),canDecide:app.can?app.can('advice.decide'):access.can(session,'advice.decide')});},
    decisionContext(){const s=this.data.suggestion||{};return {identity:access.identity(getApp().globalData.session),analysisId:this.data.analysisId,id:s.id,version:s.version_no,decision:s.decision};},
    sameDecisionContext(context){const current=this.decisionContext();return !!context&&!this._detached&&Object.keys(current).every(key=>current[key]===context[key]);},
    adopt(){
      const s=this.data.suggestion;
      this.refreshPermissions();if(!this.data.canDecide)return;
      if(this._hidden || this._detached || !s || s.decision!=='pending' || this.data.saving)return;
      this._returnFromTask=this.decisionContext();
      wx.navigateTo({url:`/pages/management-task-create/index?adviceId=${encodeURIComponent(this.data.analysisId)}&suggestionId=${encodeURIComponent(s.id)}`});
    },
    dismiss(){
      const s=this.data.suggestion;
      this.refreshPermissions();if(!this.data.canDecide)return;
      if(this._hidden || this._detached || !s || s.decision!=='pending' || this.data.saving)return;
      const context=this.decisionContext(),serial=this._confirmSerial=(this._confirmSerial||0)+1;
      wx.showModal({title:this.data.isFde?'不采纳这条建议？':'这条建议无需待办？',content:'保存处理决定，不会创建任务。',editable:true,placeholderText:'可填写原因',confirmText:'确认',
        success:async result=>{
          if(!result.confirm || this._hidden || this.data.saving || serial!==this._confirmSerial || !this.sameDecisionContext(context))return;
          this.refreshPermissions();if(!this.data.canDecide)return;
          this._confirmSerial++;
          this.setData({saving:true});
          try{
            await api.decideSuggestion(context.id,{decision:'no_task',version_no:context.version,note:result.content||''});
            if(this.sameDecisionContext(context)){
              if(this._hidden)this._decisionRefresh=context;
              else this.triggerEvent('changed');
            }
          }
          catch(error){if(!this._hidden&&this.sameDecisionContext(context))wx.showToast({title:error.message||'保存失败，请重试',icon:'none'});}
          finally{if(!this._detached)this.setData({saving:false});}
        }
      });
    },
    openTask(e){const s=this.data.suggestion;const id=e&&e.currentTarget.dataset.id || s&&s.task_id;if(this._hidden || this._detached || !s || !id || !(s.task_id===id || (s.tasks||[]).some(task=>task.id===id)))return;wx.navigateTo({url:`/pages/task-detail/index?id=${encodeURIComponent(id)}`});}
  }
});
