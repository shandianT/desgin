import React from 'react';
import { Button, Input, Progress } from 'antd';
import { SbAiBadge, SbBottomBar, SbSheet, SbTextarea } from '@shandiant/ui-react';
import './customer-create.css';

// 创建客户（原 pages/customer-create/index）。字段清单点一项改一项，编辑在抽屉里；语音草案照旧走原页面逻辑。
export function supportsCustomerCreate(page, data = {}) {
  return Boolean(page && page.route === 'pages/customer-create/index' && Array.isArray(data.fields));
}

export default function CustomerCreate({ page, data: d, invoke }) {
  const call = (name, payload = {}) => invoke(name, payload);
  const voiceBusy = d.isRecording || d.isStarting || d.isStopping || d.isParsing;
  const voiceTitle = d.isStarting ? '正在启动录音' : d.isStopping ? '正在结束录音' : d.isParsing ? '正在识别并填充字段' : d.isRecording ? `正在语音录入 ${d.recordingTime}` : d.voiceParsed ? '重新语音填写客户信息' : '语音填写客户信息';
  const voiceHint = d.isRecording ? '再次点击即可结束录入' : d.isParsing ? '识别结果只会生成待确认草案' : '描述客户、行业、来源和联系人';
  const notice = d.draftRestored ? '已恢复你上次保存的建档草稿，可继续编辑。' : d.voiceParsed ? '语音草案已填入，请重点核对客户名称、客户类型和联系人信息。' : '';
  return <section className="ds-ccreate" aria-label="创建客户">
    <div className="ds-panel ds-cc-main">
      <div className="ds-cc-top">
        <div className="ds-cc-progress">
          <div className="ds-cc-progress-head"><b>必填 {d.completedRequiredCount} / {d.requiredCount}</b><span className="ds-muted">{d.missingCount ? `还有 ${d.missingCount} 项待补充` : '必填项已齐'} · {d.roleName} · {d.creatorName}</span></div>
          <Progress percent={Number(d.progressPercent) || 0} size="small" showInfo={false} strokeColor="var(--ui-primary)" trailColor="var(--ui-line)" />
        </div>
        <button type="button" className={`ds-cc-voice ${d.isRecording ? 'is-recording' : ''}`} onClick={() => call('toggleVoice')} disabled={d.isStarting || d.isStopping || d.isParsing} aria-live="polite">
          <span className="ds-cc-voice-dot" aria-hidden="true" />
          <span className="ds-cc-voice-copy"><b>{voiceTitle}</b><small className="ds-muted">{voiceHint}</small></span>
          <span className="ds-cc-voice-action">{d.isRecording ? '结束' : d.isParsing ? '识别中' : '开始'}</span>
        </button>
      </div>
      {notice && <p className={`ds-cc-notice ${d.voiceParsed && !d.draftRestored ? 'is-ai' : ''}`}>{d.voiceParsed && !d.draftRestored && <SbAiBadge state="pending" text="AI 生成 · 待核对" />}{notice}</p>}
      <div className="ds-cc-fields">
        {(d.fields || []).map((f, i) => <button key={f.key} type="button" className={`ds-cc-field ${f.missing ? 'is-missing' : ''} ${f.edited ? 'is-edited' : ''} ${f.voiceFilled ? 'is-voice' : ''} ${f.readonly ? 'is-readonly' : ''}`} onClick={() => call('openEditor', { dataset: { index: i } })} aria-label={`${f.label}，${f.value || (f.required ? '待补充' : '未填写')}，${f.readonly ? '只读' : '点击编辑'}`}>
          <span className="ds-cc-field-label">{f.label}<small>{f.required ? '必填' : f.system ? '自动' : '选填'}</small></span>
          <span className={`ds-cc-field-value ${f.value ? '' : 'is-empty'}`}>{f.value || (f.required ? '待补充' : '未填写')}</span>
          <span className="ds-cc-field-action">{f.readonly ? (d.role === 'sales' ? '仅本人' : '本团队') : f.missing ? '补充' : '编辑'}</span>
        </button>)}
      </div>
      <div className="ds-cc-bar"><SbBottomBar reason={d.role === 'sales' ? '创建后客户负责人自动设为本人' : '创建后进入待分配客户池'} secondary={{ label: '保存草稿', disabled: voiceBusy, onClick: () => call('saveDraft') }} primary={{ label: '创建客户', disabled: voiceBusy || Boolean(d.missingCount), disabledReason: voiceBusy ? '先录完这段语音' : d.missingCount ? `还有 ${d.missingCount} 个必填项` : '', onClick: () => call('submitCustomer') }} /></div>
    </div>
    <SbSheet open={Boolean(d.editorVisible)} title={d.editorTitle} onClose={() => call('closeEditor')} footer={<><Button onClick={() => call('closeEditor')}>取消</Button><Button type="primary" onClick={() => call('saveEditor')}>保存修改</Button></>}>
      {d.editorType === 'text' && <Input autoFocus value={d.editorValue || ''} placeholder={d.editorPlaceholder} onChange={e => call('inputEditor', { detail: { value: e.target.value } })} onPressEnter={() => call('saveEditor')} />}
      {d.editorType === 'textarea' && <SbTextarea autoFocus value={d.editorValue || ''} placeholder={d.editorPlaceholder} maxLength={500} autoSize={{ minRows: 5, maxRows: 10 }} onChange={v => call('inputEditor', { detail: { value: v } })} />}
      {d.editorType === 'select' && <div className="ds-cc-options" role="listbox">{(d.editorOptions || []).map((o, i) => <button key={o.label} type="button" role="option" aria-selected={Boolean(o.selected)} className={`ds-cc-option ${o.selected ? 'is-selected' : ''}`} onClick={() => call('selectOption', { dataset: { index: i } })}>{o.label}</button>)}</div>}
      <p className="ds-muted ds-cc-helper">{d.role === 'sales' ? '修改只更新当前草案；创建后客户负责人自动设为本人。' : '修改只更新当前草案，点「创建客户」后才写入待分配客户池。'}</p>
    </SbSheet>
  </section>;
}
