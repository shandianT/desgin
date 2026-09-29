import React from 'react';
import { Button, Progress } from 'antd';
import { SbBottomBar, SbField, SbStatePanel, SbStatusTag, SbTextarea } from '@shandiant/ui-react';
import './task-detail.css';
import { PersonPicker, TaskCancelDialog } from './TaskDialogs.jsx';

// 任务详情（原 pages/task-detail/index）。左栏任务身份与信息，右栏当前要做的事；底栏是动作。业务动作都走原 Page。
export function supportsTaskDetail(page, data = {}) {
  return Boolean(page && page.route === 'pages/task-detail/index');
}
const toneOf = t => ({ green: 'good', yellow: 'watch', red: 'bad', gray: 'pending' })[t] || 'pending';
const PROGRESS = { completed: 100, pending_confirm: 16 };
TaskDetail.subcomponents = (page, d) => [
  {selector: '#personPicker', props: {open: Boolean(d.coordinatePickerOpen), members: d.coordinateMembers || [], teams: d.coordinateTeams || [], defaultTeamId: d.coordinateDefaultTeamId || '', selected: d.coordinateSelectedIds || [], multiple: false, allowAll: false, maxSelected: 1, title: '选择接手人员', loading: Boolean(d.coordinateLoading), error: d.coordinateDirectoryError || ''}},
  {selector: '#taskCancellation', props: {open: Boolean(d.cancelOpen), taskId: d.taskId || '', taskVersion: d.task?.version_no || 0}},
];

export default function TaskDetail({ page, data: d, invoke, invokeOn }) {
  const call = (name, payload = {}) => invoke(name, payload);
  const t = d.task;
  if (!t) return <SbStatePanel state={d.accessBlocked ? 'forbidden' : d.loading ? 'loading' : 'empty'} title={d.loading ? '正在读取任务' : '任务不存在或已不可见'} description={d.accessMessage} onRetry={() => call('loadTask')} />;
  const busy = Boolean(d.submitting);
  const info = [['任务类别', t.associationLabel], ...(t.opportunityLabel ? [['关联商机', t.opportunityLabel]] : []), ['负责人', t.owner], [t.task_type === 'visit_follow_up' ? '记录人' : '下发人', t.creator], ['任务来源', t.sourceLabel], ['截止时间', t.dueLabel, 'due'], ['创建时间', t.createdLabel], ['相关方', t.relatedText]];
  const coordinating = Boolean(d.coordinateOpen);
  const members = d.coordinateMembers || [];
  let panel = null, bar = null;
  if (coordinating) {
    panel = <section className="ds-td-card">
      <h2>任务转交 <small className="ds-muted">保留原负责人及交接记录</small></h2>
      <SbField label="接手人员" error={d.coordinateDirectoryError}><Button disabled={busy} onClick={() => call('openCoordinatePicker')}>{d.coordinateSelectedName || (d.coordinateLoading ? '正在读取…' : '选择接手人员')}</Button></SbField>
      {d.coordinateDirectoryError && <Button type="link" onClick={() => call('loadCoordinationOptions')}>重新加载接手人员</Button>}
      {!d.coordinateLoading && !members.length && !d.coordinateDirectoryError && <p className="ds-muted ds-td-help">当前没有可接手人员，可联系运营处理。</p>}
      <SbField label="协调原因" required error={d.coordinateError}><SbTextarea value={d.coordinateNote || ''} disabled={busy} maxLength={500} autoSize={{ minRows: 4, maxRows: 8 }} placeholder="请说明转交原因" onChange={v => call('coordinateNote', { detail: { value: v } })} /></SbField>
    </section>;
    bar = <SbBottomBar reason={<span><Button type="link" size="small" disabled={busy} onClick={() => call('closeCoordination')}>返回</Button>转交后由新负责人处理，历史记录仍保留</span>}
      primary={{ label: '转交任务', loading: busy, disabled: !d.coordinateSelectedId || d.coordinateLoading || Boolean(d.coordinateDirectoryError), disabledReason: d.coordinateSelectedId ? '' : '请选择接手人员', onClick: () => call('coordinate', { dataset: { event: 'reassign' } }) }} />;
  } else if (t.status === 'completed') {
    panel = <section className="ds-td-card ds-td-done"><h2>{t.completedBy} 已完成 <small className="ds-muted">{t.completedLabel}</small></h2><p>{t.completionNote}</p></section>;
  } else if (t.status === 'cancelled') {
    panel = <section className="ds-td-card ds-td-rejected"><h2>{t.wasCancelled ? '任务已取消' : '任务已被拒绝'} <small className="ds-muted">{t.wasCancelled ? '协调人说明' : '接收方说明'}</small></h2><p>{t.wasCancelled ? t.cancellationNote : (t.rejectionComment || '暂未填写拒绝原因')}</p></section>;
    if (t.canRetry) bar = <SbBottomBar reason="原任务和拒绝说明会被保留，新任务可重新修改" primary={{ label: '重新发起新任务', onClick: () => call('retryTask') }} />;
  } else if (t.canRespond) {
    panel = <section className="ds-td-card">
      <h2>接受或拒绝</h2>
      <p className="ds-muted ds-td-help">确认后进入执行；岗位任务只需一人领取，拒绝仅表示本人不领取。拒绝时必须填写原因，系统会立即通知发起人。</p>
      <SbField label="拒绝原因" help="拒绝时必填，将立即推送给发起人"><SbTextarea value={d.responseComment || ''} maxLength={2000} autoSize={{ minRows: 4, maxRows: 8 }} placeholder="说明无法接受的原因或建议调整方式" onChange={v => call('inputResponseComment', { detail: { value: v } })} /></SbField>
    </section>;
    bar = <SbBottomBar reason={`拒绝原因将立即推送给 ${t.creator}`} secondary={t.canDecline ? { label: '拒绝', disabled: busy, onClick: () => call('rejectTask') } : undefined} primary={t.canAccept ? { label: t.responseLabel || '接受任务', loading: busy, onClick: () => call('acceptTask') } : undefined} />;
  } else if (t.status === 'pending_review') {
    panel = <section className="ds-td-card">
      <h2>{t.canReview ? '待你验收' : '等待发起人确认'} <small className="ds-muted">{t.owner} 提交的完成说明</small></h2>
      <blockquote className="ds-td-quote">{t.completionNote}</blockquote>
      {t.canReview && <SbField label="验收意见" help="驳回时必填，说明需要补充或改进的内容"><SbTextarea value={d.reviewNote || ''} maxLength={2000} autoSize={{ minRows: 4, maxRows: 8 }} placeholder="验收意见" onChange={v => call('inputReviewNote', { detail: { value: v } })} /></SbField>}
    </section>;
    if (t.canReview) bar = <SbBottomBar reason="确认完成后任务结束" secondary={{ label: '驳回', disabled: busy, onClick: () => call('reviewCompletion', { dataset: { event: 'reject_completion' } }) }} primary={{ label: '确认完成', loading: busy, onClick: () => call('reviewCompletion', { dataset: { event: 'approve_completion' } }) }} />;
  } else if (t.canComplete) {
    panel = <section className="ds-td-card">
      <h2>完成反馈</h2>
      {t.reviewRejected && <p className="ds-td-error" role="alert">驳回原因：{t.reviewNote}</p>}
      <p className="ds-muted ds-td-help">{t.selfAssigned ? '填写完成说明后可直接完成。' : '请填写完成说明，提交后由发起人验收，通过才算完成。'}</p>
      <SbField label="完成说明" required><SbTextarea value={d.completionNote || ''} maxLength={2000} autoSize={{ minRows: 5, maxRows: 9 }} placeholder="说明交付结果、附件位置或后续安排" onChange={v => call('inputCompletionNote', { detail: { value: v } })} /></SbField>
    </section>;
    bar = <SbBottomBar reason={t.selfAssigned ? '填写说明后直接完成' : `提交后由 ${t.creator} 验收`} primary={{ label: t.selfAssigned ? '确认完成' : '提交完成', loading: busy, loadingLabel: '正在同步…', onClick: () => call('markCompleted') }} />;
  } else {
    panel = <SbStatePanel state="empty" title={`该任务由 ${t.owner} 负责完成`} description="你可以查看最新状态。" />;
  }
  return <section className="ds-tdetail" aria-label="任务详情">
    <aside className="ds-panel ds-td-side">
      <div className="ds-td-tags"><SbStatusTag tone={toneOf(t.signal?.tone)} label={`${t.signal?.label || ''} · ${t.statusLabel}`} /><span className="ds-td-chip">{t.priority}优先级</span></div>
      <h1>{t.title}</h1>
      <p className="ds-muted">{[t.customer, t.team].filter(Boolean).join(' · ')}</p>
      {t.status !== 'cancelled' && !t.handover_required && <Progress percent={PROGRESS[t.status] ?? 42} size="small" showInfo={false} strokeColor="var(--ui-primary)" trailColor="var(--ui-line)" />}
      <p className="ds-muted ds-td-stage">{t.stageLabel}</p>
      {t.handover_required && <p className="ds-td-note">原接收人账号或岗位资格已变化，任务待交接；不自动完成或删除。</p>}
      <dl className="ds-td-info">{info.map(([k, v, kind]) => <div key={k}><dt>{k}</dt><dd className={kind === 'due' ? 'ds-td-due' : ''}>{v}</dd></div>)}</dl>
      {t.can_coordinate && t.status !== 'pending_review' && !coordinating && <Button onClick={() => call('openCoordination')}>协调任务</Button>}
      {t.canCancel && <Button danger disabled={busy} onClick={() => call('openCancellation')}>取消任务</Button>}
    </aside>
    <section className="ds-panel ds-td-main">
      <section className="ds-td-card"><h2>任务要求</h2><p className="ds-td-desc">{t.description}</p></section>
      {panel}
      {(t.history || []).length > 0 && <section className="ds-td-card"><h2>任务处理记录</h2><ol className="ds-td-history">{t.history.map(h => <li key={h.id}><b>{h.label} · {h.actor_name || '操作人未记录'}</b><span className="ds-muted">{h.time}</span>{h.transferSummary && <p>{h.transferSummary}</p>}<p>{h.note}</p></li>)}</ol></section>}
      {bar && <div className="ds-td-bar">{bar}</div>}
    </section>
    <PersonPicker picker={page.selectComponent('#personPicker')} invokeOn={invokeOn} />
    <TaskCancelDialog dialog={page.selectComponent('#taskCancellation')} invokeOn={invokeOn} />
  </section>;
}
