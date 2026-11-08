import React from 'react';
import {Alert,Button} from 'antd';
import {SbListRow,SbStatePanel} from '@shandiant/ui-react';
import {WorkflowDialog} from './WorkflowOverlays.jsx';
import {SbSearch} from './ImeInput.jsx';
export default function VisitFollowUpPicker({data:d,invoke}){
 const busy=Boolean(d.isProcessing||d.isRecording||d.followUpChecking);
 return <WorkflowDialog width={760} open={Boolean(d.followUpPickerOpen)} title="选择跟进商机" onClose={busy?undefined:()=>invoke('closeFollowUpDiscovery')} footer={<Button disabled={busy} onClick={()=>invoke('closeFollowUpDiscovery')}>关闭</Button>}>
  <div className="ds-followup-picker"><p className="ds-muted">仅显示当前有权跟进的商机，包含你参与协作的商机。选择后会再次核对权限。</p>
   <SbSearch aria-label="搜索可跟进商机" value={d.followUpQuery||''} placeholder="搜索商机或客户名称" disabled={busy} loading={Boolean(d.followUpLoading)} onChange={value=>invoke('inputFollowUpQuery',{detail:{value}})} onSearch={()=>invoke('searchFollowUp')}/>
   {d.followUpError&&<Alert type="warning" showIcon message={d.followUpError} action={<Button disabled={busy} onClick={()=>invoke('searchFollowUp')}>重新读取</Button>}/>}
   {(d.followUpItems||[]).map(row=><SbListRow key={row.opportunity_id} name={row.name} summary={row.customer_reference.name} onClick={busy?undefined:()=>invoke('chooseFollowUp',{dataset:{id:row.opportunity_id}})}/>)}
   {d.followUpLoading&&<p role="status">正在读取可跟进商机…</p>}
   {d.followUpChecking&&<p role="status">正在核对所选商机的跟进权限…</p>}
   {!d.followUpLoading&&!d.followUpError&&!d.followUpItems?.length&&<SbStatePanel state="empty" title="没有匹配的可跟进商机" description="可调整关键词；列表仅包含服务端允许你跟进的商机。"/>}
   {d.followUpMore&&<Button disabled={busy} loading={d.followUpLoading} onClick={()=>invoke('searchFollowUp',{dataset:{more:true}})}>加载更多商机</Button>}
   {d.followUpOnly&&d.opportunityResolveError&&<Alert type="warning" showIcon message={d.opportunityResolveError} description="原文和草稿已保留，可重新选择有权跟进的商机。"/>}
  </div>
 </WorkflowDialog>;
}
