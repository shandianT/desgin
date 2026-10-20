import React, {useRef, useState} from 'react';
import {Alert, Button, Checkbox, DatePicker, Modal, Progress, Select, Tag} from 'antd';
import dayjs from 'dayjs';
import {SbField} from '@shandiant/ui-react';
import {SbTextarea} from '../ImeInput.jsx';
import {identity, runtime} from '../pc/data.js';
import './execution.css';
import GovernancePanel from './GovernancePanel.jsx';
import {ContributionFields} from '../review/tasks/TaskAlignmentFields.jsx';
import {contributionError,contributionPayload} from '../review/tasks/model.js';
import TaskSyncStatus, {taskSyncUnavailable} from './TaskSyncStatus.jsx';

const titles={set_item_progress:'更新推进项',pause:'暂停任务',resume:'恢复任务',recheck_pause:'复查暂停任务',withdraw_completion:'撤回验收申请',accept_task:'接受任务',decline_task:'拒绝任务',submit_completion:'提交验收',review_completion:'验收任务',respond_executor_handover:'确认执行交接',respond_reviewer_handover:'确认验收交接',respond_requirements:'确认要求变更',withdraw_requirements:'撤回要求变更'};
export default function ExecutionPanel({page, data:d, invoke, directory={}}) {
  const x=d.execution, [draft,setDraft]=useState({text:'',versions:null}), [feedbackError,setFeedbackError]=useState('');
  const [reworkIds,setReworkIds]=useState([]);
  const [contribution,setContribution]=useState(null),[contributionIssue,setContributionIssue]=useState('');
  const pending=useRef(false), [saving,setSaving]=useState(false);
  const context=JSON.stringify([identity(),d.taskId]), version=JSON.stringify(x?.versions);
  const stale=Boolean(draft.versions && draft.versions!==version);
  const busy=Boolean(d.executionBusy || d.executionLoading || saving), blocked=busy || Boolean(d.executionError) || taskSyncUnavailable(d.webTaskSync);
  const action=(name,itemId)=>{if(name==='reject')setReworkIds([]);if(name==='complete'){setContribution(null);setContributionIssue('');}return invoke('executionAction',{detail:{action:name,itemId}});};
  const contributionCodes=d.task?.alignment?.metric_codes || [];
  const submitDialog=()=>{
    if(d.executionDialog?.action!=='submit_completion')return invoke('submitExecutionDialog');
    const error=contribution && directory.status!=='ready'?'请先读取可用的指标目录':contributionError(contribution,directory.metrics || [],contributionCodes,true);
    setContributionIssue(error);if(error)return;
    return invoke('submitExecutionDialog',{detail:contribution?{actual_contribution:contributionPayload(contribution)}:{}});
  };
  const input=(key,value)=>invoke('executionInput',{dataset:{key},detail:{value}});
  async function feedback(){
    if(pending.current || blocked || !x?.caps.append_feedback || stale)return;
    const text=draft.text.trim();if(!text || [...text].length>4000){setFeedbackError('请填写 1–4000 字的过程反馈');return;}
    pending.current=true;setSaving(true);setFeedbackError('');
    try{
      const success=await page.sendExecution('append_feedback',{...x.versions,text,reply_to_event_id:null,corrects_event_id:null});
      if(context!==JSON.stringify([identity(),page.data.taskId]) || page._destroyed)return;
      if(success){setDraft({text:'',versions:null});await page.loadExecution();}
      else setFeedbackError(page.data.executionError || '反馈尚未保存，草稿已保留');
    }finally{pending.current=false;setSaving(false);}
  }
  const p=x ? runtime().require('utils/taskExecutionPresentation').progress(x.progress) : null;
  const dialog=d.executionDialog;
  const reviewReject=dialog?.action==='review_completion' && dialog.decision==='reject';
  const noteLabel=dialog?.action==='set_item_progress'?'成果依据或调整原因':dialog?.action==='submit_completion'?'完成说明':dialog?.action==='review_completion'?'验收意见':'操作原因';
  return <section className="task-execution" aria-label="任务执行">
    <div className="task-execution-heading"><h2>任务执行</h2><Button onClick={()=>invoke('loadExecution')} disabled={d.executionBusy || saving} loading={d.executionLoading}>刷新执行信息</Button></div>
    <TaskSyncStatus sync={d.webTaskSync} lastSyncedLabel={d.executionSynced} />
    {d.executionError && <Alert type="warning" showIcon message={d.executionError} description="填写内容会保留；请刷新核对当前要求和责任人后，再确认提交。"/>}
    {!x && <p role="status">{d.executionLoading?'正在读取推进清单和当前责任…':d.executionError?'任务信息仅供查看，执行操作暂不可用。':'新版任务执行信息尚未就绪，暂不可操作。'}</p>}
    {x && <>
      <div className="task-execution-summary"><div><span className="ds-muted">清单进度</span><strong>{p.label}</strong><span>{p.countLabel}</span></div><div><span className="ds-muted">当前执行人</span><strong>{x.executorLabel}</strong></div><div><span className="ds-muted">当前验收人</span><strong>{x.reviewerLabel}</strong></div></div>
      {p.percent!==null && <Progress percent={p.percent} showInfo={false} status="normal"/>}<p className="ds-muted">{p.hint}</p>
      {x.pause?.active && <Alert type="warning" showIcon message="任务已暂停" description={<><p>{x.pause.reason}</p><p>复查时间：{x.pause.recheckLabel} · 到期提醒不会自动恢复任务</p></>}/>}
      <div className="task-execution-actions">
        {x.caps.accept_task===true && <Button type="primary" disabled={blocked} onClick={()=>action('accept')}>接受任务</Button>}
        {x.caps.decline_task===true && <Button danger disabled={blocked} onClick={()=>action('decline')}>拒绝任务</Button>}
        {x.caps.pause===true && <Button disabled={blocked} onClick={()=>action('pause')}>暂停任务</Button>}
        {x.caps.recheck_pause===true && <Button disabled={blocked} onClick={()=>action('recheck')}>复查暂停情况</Button>}
        {x.caps.resume===true && <Button disabled={blocked} onClick={()=>action('resume')}>恢复任务</Button>}
      </div>
      <section aria-label="推进清单"><h3>推进清单 <small>{x.items.length} 项</small></h3>
        {!x.items.length && <p>尚未设置推进清单，不能计算比例。请由有权人员补充任务要求。</p>}
        <ol className="task-execution-items">{x.items.map((item,index)=><li key={item.item_id}>
          <div className="task-execution-heading"><h4>{index+1}. {item.title}</h4><Tag color={item.state==='completed'?'green':item.state==='rework'?'orange':'default'}>{item.stateLabel}</Tag></div>
          <p><b>验收标准：</b>{item.acceptance_criteria}</p>{item.note && <p><b>成果依据：</b>{item.note}</p>}
          {item.requires_revalidation && <p className="ds-td-error">要求已变化，此项需重新核对。</p>}
          {x.caps.set_item_progress===true && <Button disabled={blocked} onClick={()=>action('progress',item.item_id)} aria-label={`更新推进项 ${index+1}`}>更新进度</Button>}
        </li>)}</ol>
      </section>
      <section aria-label="过程反馈"><h3>过程反馈</h3>
        {x.caps.append_feedback===true && <>
          <SbTextarea aria-label="过程反馈内容" value={draft.text} maxLength={4000} autoSize={{minRows:3,maxRows:8}} disabled={busy} onChange={text=>{setDraft({text,versions:draft.versions||version});setFeedbackError('');}} placeholder="记录实际进展、遇到的问题或需要协助的事项"/>
          {stale && <Alert type="warning" message="任务已更新，反馈草稿已保留" action={<Button disabled={blocked} onClick={()=>setDraft({...draft,versions:version})}>已核对最新要求</Button>}/>}
          {feedbackError && <p role="alert" className="ds-td-error">{feedbackError}</p>}
          <Button type="primary" disabled={blocked || stale} loading={saving} onClick={feedback}>发布过程反馈</Button>
        </>}
        <ol className="task-execution-feedback">{x.feedback.map(row=><li key={row.id}><strong>{row.authorLabel}</strong><span className="ds-muted"> {row.timeLabel} {row.relationLabel}</span><p>{row.text}</p></li>)}</ol>
        {!x.feedback.length && <p className="ds-muted">暂无过程反馈</p>}
        <p className="ds-muted">显示最近 200 条执行记录中的反馈；历史记录仍保留。</p>
      </section>
      <GovernancePanel data={d} invoke={invoke}/>
      <section className="task-execution-submit"><h3>提交与验收</h3><p>{x.raw.status==='completed'?'任务已通过验收。':x.raw.status==='pending_review'?'完成说明已提交，等待当前验收人确认。':'完成清单后，填写交付结果并提交验收。进度不会自动变成已完成，也不会自动增加目标业绩。'}</p>
        {['pending_review','completed'].includes(x.raw.status) && <>
          <p><b>完成说明</b></p><blockquote>{x.completionNote}</blockquote>
          {x.raw.status==='completed' && <p><b>验收通过时间：</b>{x.completedAt?<time dateTime={x.completedAt}>{dayjs(x.completedAt).format('YYYY-MM-DD HH:mm')}</time>:'完成时间待核对'}</p>}
        </>}
        <div className="task-execution-actions">
          {x.caps.submit_completion===true && <Button type="primary" disabled={blocked} onClick={()=>action('complete')}>提交验收</Button>}
          {x.caps.withdraw_completion===true && <Button disabled={blocked} onClick={()=>action('withdrawCompletion')}>撤回验收申请</Button>}
          {x.caps.review_completion===true && <><Button type="primary" disabled={blocked} onClick={()=>action('approve')}>确认验收</Button><Button danger disabled={blocked} onClick={()=>action('reject')}>选择返工项并驳回</Button></>}
        </div>
      </section>
    </>}
    <Modal title={titles[dialog?.action] || '确认操作'} open={Boolean(dialog)} onCancel={()=>invoke('closeExecutionDialog')} closable={!d.executionBusy} maskClosable={false} destroyOnHidden footer={<><Button disabled={d.executionBusy} onClick={()=>invoke('closeExecutionDialog')}>取消</Button><Button type="primary" loading={d.executionBusy} disabled={blocked} onClick={submitDialog}>确认保存</Button></>}>
      {dialog?.action==='set_item_progress' && <SbField label="推进状态"><Select aria-label="推进状态" value={Number(d.executionState)} options={(d.executionStates || []).map((label,value)=>({label,value}))} disabled={d.executionBusy} onChange={v=>input('executionState',v)}/></SbField>}
      {['pause','recheck_pause'].includes(dialog?.action) && <SbField label="复查时间" required><DatePicker aria-label="暂停复查时间" showTime={{format:'HH:mm'}} format="YYYY-MM-DD HH:mm" value={d.executionDate?dayjs(`${d.executionDate}T${d.executionTime}`):null} disabled={d.executionBusy} onChange={v=>{input('executionDate',v?.format('YYYY-MM-DD') || '');input('executionTime',v?.format('HH:mm') || '09:00');}}/></SbField>}
      <SbField label={noteLabel}><SbTextarea aria-label={noteLabel} value={d.executionNote || ''} autoSize={{minRows:4,maxRows:8}} maxLength={['set_item_progress','submit_completion','review_completion'].includes(dialog?.action)?4000:1000} disabled={d.executionBusy} onChange={v=>input('executionNote',v)}/></SbField>
      {dialog?.action==='submit_completion' && <><ContributionFields actual value={contribution} metrics={directory.metrics || []} codes={directory.status==='ready'?contributionCodes:[]} onChange={value=>{setContribution(value);setContributionIssue('');}} disabled={d.executionBusy} error={contributionIssue}/>{d.task?.alignment?.actual_contribution && <p className="ds-muted">已有实际贡献申报；本次不填写则保留原申报，不会清空。</p>}{directory.status==='error' && <Alert type="warning" message="指标目录读取失败，暂不能填写新的贡献申报；可重试读取或仅提交完成说明。" action={<Button onClick={directory.reload}>重试指标目录</Button>}/>}</>}
      {reviewReject && <SbField label="需要返工的推进项" required><Checkbox.Group value={reworkIds} disabled={d.executionBusy} onChange={value=>{setReworkIds(value);invoke('executionRework',{detail:{value}});}}>{x?.items.map(item=><Checkbox className="task-rework-option" key={item.item_id} value={item.item_id}>{item.title}</Checkbox>)}</Checkbox.Group></SbField>}
      {d.executionDialogError && <Alert type="error" showIcon message={d.executionDialogError}/>}
    </Modal>
  </section>;
}
