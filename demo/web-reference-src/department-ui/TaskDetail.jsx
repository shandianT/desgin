import React from 'react';
import {Alert,Button} from 'antd';
import {SbStatusTag} from '@shandiant/ui-react';
import {TaskCancellationDialog} from './NativeDialogs.jsx';
import TaskAlignmentDetail from './review/tasks/TaskAlignmentDetail.jsx';
import {useTaskAlignmentDirectory} from './review/tasks/useTaskAlignmentDirectory.js';
import ExecutionPanel from './task-execution/ExecutionPanel.jsx';
import './task-detail.css';
import LegacyTaskPanel from './task-execution/LegacyTaskPanel.jsx';
import {runtime,session} from './pc/data.js';
function taskMode(task){try{return runtime().require('utils/taskExecutionMode').mode(task,session()?.capabilities?.task_execution);}catch{return 'invalid';}}
export function supportsTaskDetail(page,data={}) {return Boolean(page && page.route==='pages/task-detail/index' && data.task);}
function ExecutionTaskDetail({page,data:d,invoke,invokeOn,select}) {
  const t=d.task, x=d.execution, busy=Boolean(d.executionBusy || d.executionLoading || d.submitting);
  const directory=useTaskAlignmentDirectory(Boolean(t.alignment));
  const info=[['执行人',x?.executorLabel || t.owner],['验收人',x?.reviewerLabel || '待核对'],['下发人',t.creator],['截止时间',t.dueLabel],['关联商机',t.opportunityLabel],['创建时间',t.createdLabel]];
  return <section className="ds-tdetail task-execution-detail" aria-label="任务详情">
    <aside className="ds-panel ds-td-side"><div className="ds-td-tags"><SbStatusTag tone={t.status==='completed'?'good':'pending'} label={t.statusLabel}/><span>{t.priority}优先级</span></div><h1>{t.title}</h1><p className="ds-muted">{[t.customer,t.team].filter(Boolean).join(' · ')}</p>
      <dl className="ds-td-info">{info.filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {x && !d.executionError && t.canCancel && <Button danger disabled={busy} onClick={()=>invoke('openCancellation')}>取消任务</Button>}
    </aside>
    <section className="ds-panel ds-td-main">
      <section className="ds-td-card"><h2>任务要求</h2><p className="ds-td-desc">{t.description}</p></section>
      <TaskAlignmentDetail task={{...t,can_coordinate:Boolean(x && !d.executionError && t.can_coordinate)}} page={page} directory={directory} busy={busy}/>
      <ExecutionPanel key={`${d.executionContext || 'loading'}:${t.id}`} page={page} data={d} invoke={invoke} directory={directory}/>
      {(t.history || []).length>0 && <section className="ds-td-card"><h2>任务记录</h2><ol className="ds-td-history">{t.history.map(h=><li key={h.id}><b>{h.label} · {h.actor_name}</b><span>{h.time}</span><p>{h.note}</p></li>)}</ol></section>}
    </section>
    <TaskCancellationDialog instance={select('task-cancel-dialog')} invokeOn={invokeOn}/>
  </section>;
}
export default function TaskDetail(props){
  const mode=taskMode(props.data.task);
  if(mode==='legacy')return <LegacyTaskPanel {...props}/>;
  if(mode==='execution_v1')return <ExecutionTaskDetail {...props}/>;
  return <section className="ds-panel" aria-label="任务模式待核对"><Alert type="warning" showIcon message="任务响应不完整，暂不能操作" description="任务模式与当前服务协议不匹配，请刷新核对。" action={<Button onClick={()=>props.invoke('loadTask')}>重新读取任务</Button>}/></section>;
}
TaskDetail.subcomponents=(page,d)=>{
  const mode=taskMode(d.task);
  if(mode==='legacy')return LegacyTaskPanel.subcomponents(page,d);
  if(mode!=='execution_v1')return [];
  return [{selector:'task-cancel-dialog',required:!!d.task,props:{open:d.cancelOpen,taskId:d.taskId,taskVersion:d.task?.version_no || 0}}];
};
