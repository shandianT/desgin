import React, { useRef, useState } from 'react';
import { Alert, Button, Checkbox, Progress, Upload } from 'antd';
import { SbBottomBar, SbIcon, SbListRow, SbSearch, SbStatePanel, SbTextarea } from '@shandiant/ui-react';
import { FdeVisitOpportunity } from './FdeVisitOpportunity.jsx';
import './visit-entry.css';

// 记录客户拜访（原 pages/visit-entry/index）。左栏选客户，右栏写原文；语音、文件、草稿都走原页面逻辑。
// FDE 视角：选客户后还要选本人参与的商机（原子组件 fde-visit-opportunity，#fdeVisitOpportunity），没有首次拜访。
export function supportsVisitEntry(page) {
  return Boolean(page && page.route === 'pages/visit-entry/index');
}
VisitEntry.subcomponents = (page, d) => d.isFde ? [{ selector: '#fdeVisitOpportunity', required: Boolean(d.customerConfirmed), props: { customerId: d.customerId || '', selectedId: d.opportunityId || '', disabled: Boolean(d.isProcessing || d.isRecording) } }] : [];

export default function VisitEntry({ page, data: d, invoke, invokeOn, select }) {
  const call = (name, payload = {}) => invoke(name, payload);
  const busy = d.isRecording || d.isStarting || d.isStopping || d.isProcessing;
  const [uploadError, setUploadError] = useState('');
  const picking = useRef(false);
  const receiveFile = (file, batch) => {
    const current = page.data;
    if (picking.current || current.isRecording || current.isStarting || current.isStopping || current.isProcessing) return Upload.LIST_IGNORE;
    const extension = file.name.split('.').pop().toLowerCase();
    const audio = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'amr', 'webm'];
    const documents = ['pdf', 'docx', 'pptx', 'md', 'txt'];
    const error = batch.length > 1 ? '每次导入一个文件，请处理完成后再添加。'
      : ![...audio, ...documents].includes(extension) ? '此文件类型暂不支持，请选择音频或文档。'
      : file.size === 0 ? '文件为空，请重新选择。'
      : file.size > (documents.includes(extension) ? 20 : 100) * 1024 * 1024 ? `文件过大，${documents.includes(extension) ? '文档最大 20MB' : '音频最大 100MB'}。` : '';
    setUploadError(error);
    if (error) return Upload.LIST_IGNORE;
    picking.current = true;
    // 只调用原上传流程：保存本地草稿 → 上传 → 轮询提取。Upload 不另发请求。
    Promise.resolve().then(async () => {
      if (page._destroyed || globalThis.SalesRuntime.current !== page) return;
      await call('switchInputMode', { dataset: { mode: 'file' } });
      const path = globalThis.SalesPlatform.registerLocalFile(file);
      await page.uploadFile({ path, name: file.name, size: file.size, type: file.type });
    }).catch(error => setUploadError(error.message || '未能导入，请重新选择文件。'))
      .finally(() => { picking.current = false; });
    return Upload.LIST_IGNORE;
  };
  const startOrStop = () => {
    setUploadError('');
    if (!d.isRecording) call('switchInputMode', { dataset: { mode: 'voice' } });
    call('toggleRecording');
  };
  const fde = Boolean(d.isFde);
  const picker = fde && d.customerConfirmed ? select('#fdeVisitOpportunity') : null;
  const submitLabel = !d.customerConfirmed ? '请先选择客户' : fde && !d.fdeOpportunityVerified ? '请先选择本人参与的商机' : !d.transcript ? '请先录入拜访内容' : '提交结构化';
  const importText = d.importStatus === 'uploading' ? `${d.uploadProgress}%` : d.importStatus === 'succeeded' ? '文字已提取' : d.importStatus === 'failed' ? '处理失败' : '上传完成，正在提取文字…';
  return <section className="ds-ventry" aria-label="记录客户拜访">
    <aside className="ds-panel ds-ve-side">
      <h2 className="ds-ve-h">选择客户 <small className="ds-ve-required">必填</small></h2>
      {d.customerConfirmed ? <div className="ds-ve-selected">
        <span className="ds-ve-mark" aria-hidden="true">{d.customerInitial}</span>
        <div className="ds-ve-selected-main"><b>{d.customerName}</b><span className="ds-muted">本次关联客户</span></div>
        <Button type="link" size="small" disabled={busy} onClick={() => call('changeCustomer')}>更换</Button>
      </div> : <>
        <SbSearch value={d.customerQuery || ''} placeholder="输入客户名称关键词" loading={Boolean(d.searching)} onChange={value => call('inputCustomerQuery', { detail: { value } })} onSearch={() => call('searchDepartmentCustomers')} />
        <p className="ds-muted ds-ve-hint">{d.searching ? '正在匹配客户…' : fde ? '选择客户后，仅可录入本人参与的商机' : '可搜索公司全部客户，选中后再填写拜访内容'}</p>
        <div className="ds-ve-results">
          {(d.customerResults || []).length ? (d.customerResults || []).map(c => <SbListRow key={c.id} name={c.name} summary={c.team_name || c.team || '本部门'} onClick={() => call('chooseCustomer', { dataset: { id: c.id } })} />)
            : d.customerSearchError ? <SbStatePanel state="error" title={d.customerSearchError} onRetry={() => call('searchDepartmentCustomers')} />
            : !d.searching && <SbStatePanel state="empty" title="没有匹配到客户" description="换个关键词再试。" />}
        </div>
      </>}
      {fde && d.customerConfirmed && <FdeVisitOpportunity picker={picker} invokeOn={invokeOn} selectedId={d.opportunityId} />}
      {!fde && <label className="ds-ve-first"><Checkbox checked={Boolean(d.isFirstVisit)} disabled={Boolean(d.isProcessing)} onChange={e => call('toggleFirstVisit', { detail: { value: e.target.checked ? ['first'] : [] } })} /><span><b>首次拜访</b><small className="ds-muted">会多出主营业务、需求、预算、联系人角色四项，确认页提示补充</small></span></label>}
    </aside>
    <section className="ds-panel ds-ve-main">
      <div className="ds-ve-note-head"><h2 className="ds-ve-h">拜访原始记录 <small className="ds-muted">键盘输入或语音转写</small></h2><span className="ds-muted ds-ve-count">{(d.transcript || '').length} / 50000</span>{(d.transcript || '').length > 0 && <Button type="link" size="small" disabled={d.isRecording || d.isStarting || d.isStopping} onClick={() => call('clearTranscript')}>一键清空</Button>}</div>
      <SbTextarea showCount={false} className="ds-ve-textarea" value={d.transcript || ''} disabled={d.isRecording || d.isProcessing} maxLength={50000} placeholder="可以说说：这次为什么拜访、客户反馈了什么、接下来准备何时做什么……" onChange={v => call('inputTranscript', { detail: { value: v } })} />
      <div className="ds-ve-status">
        {d.draftSaveError ? <span className="ds-ve-error" role="alert">{d.draftSaveError}</span> : d.undoAvailable ? <span>已清空本次内容 <Button type="link" size="small" onClick={() => call('undoClear')}>撤销</Button></span> : d.draftNotice ? <span className="ds-muted">{d.draftNotice}</span> : null}
        <span className={`ds-ve-state ${d.errorText ? 'is-error' : ''}`}>{d.statusText}</span>
      </div>
      <div className="ds-ve-inputs" aria-label="补充拜访材料">
        <section className={`ds-ve-recorder ${d.isRecording ? 'is-recording' : ''}`} aria-label="语音录入">
          <div className="ds-ve-recorder-title"><SbIcon name="voice" /><b>录音补充</b></div>
          <div className="ds-ve-recording-status" role="status" aria-live="polite">
            {d.isStarting ? '正在等待麦克风…' : d.isStopping ? '正在结束录音…' : d.isRecording ? '正在录音' : d.entryMode === 'voice' && d.isProcessing ? '正在处理录音…' : '说说这次拜访'}
          </div>
          <span className="ds-ve-timer" aria-label={`录音时长 ${d.recordingTime || '00:00'}`}>{d.isRecording || d.isStopping ? d.recordingTime : '00:00'}</span>
          <Button type={d.isRecording ? 'default' : 'primary'} danger={Boolean(d.isRecording)} icon={d.isRecording ? <SbIcon name="confirm" /> : <SbIcon name="voice" />}
            loading={Boolean(d.isStarting || d.isStopping)} disabled={Boolean(d.isProcessing)} onClick={startOrStop}>
            {d.isStarting ? '正在启动' : d.isStopping ? '正在结束' : d.isRecording ? '结束并转写' : '开始录音'}
          </Button>
          <small className="ds-muted">最长 10 分钟，结束后自动转写，可继续修改文字。</small>
        </section>
        <section className="ds-ve-upload" aria-label="上传拜访材料">
          <Upload.Dragger accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.amr,.webm,.pdf,.docx,.pptx,.md,.txt" multiple={false}
            disabled={Boolean(busy)} beforeUpload={receiveFile} showUploadList={false}>
            <SbIcon name="file" size="lg" />
            <b>拖入材料，或点击选择文件</b>
            <span className="ds-muted">音频最大 100MB、最长 60 分钟</span>
            <span className="ds-muted">PDF、DOCX、PPTX、MD、TXT 最大 20MB，扫描件暂不支持</span>
          </Upload.Dragger>
        </section>
      </div>
      {uploadError && <Alert type="error" showIcon title={uploadError} />}
      {d.fileName && <div className="ds-ve-file">
        <div className="ds-ve-file-line"><b>{d.fileName}</b><span className={d.importStatus === 'failed' ? 'ds-ve-error' : 'ds-muted'}>{importText}</span></div>
        {d.importStatus === 'uploading' && <Progress percent={Number(d.uploadProgress) || 0} size="small" showInfo={false} strokeColor="var(--ui-primary)" trailColor="var(--ui-line)" />}
        {!d.isProcessing && <div className="ds-ve-file-actions">{d.importStatus !== 'succeeded' && <Button type="link" size="small" onClick={() => call('retryImport')}>重试</Button>}<Button type="link" size="small" onClick={() => call('removeFile')}>移除附件</Button></div>}
      </div>}
      <div className="ds-ve-bar"><SbBottomBar reason="语音识别失败不影响手工录入；点「提交结构化」后才进入字段确认页" primary={{ label: submitLabel, disabled: !d.canSubmit || busy, disabledReason: busy ? '先等这一步完成' : '', onClick: () => call('submitTranscript') }} /></div>
    </section>
  </section>;
}
