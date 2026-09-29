import React from 'react';
import { Button, Space } from 'antd';

// Stable ids mirror the advice-actions nodes in each business page template.
// The original component owns permissions, decisions, version checks and navigation.
export const adviceActionSelector = (prefix, suggestion) => `#${prefix}-${suggestion.id}`;
export function adviceActionEntries(prefix, analysisId, suggestions = [], active = true) {
  if (!active || !analysisId) return [];
  return suggestions.filter(row => row?.id).map(suggestion => ({
    selector: adviceActionSelector(prefix, suggestion),
    props: {analysisId, suggestion},
  }));
}

export default function AdviceActions({actions, invokeOn}) {
  if (!actions) return <span className="ds-muted">正在准备建议操作…</span>;
  const d = actions.data, suggestion = d.suggestion || actions.properties?.suggestion;
  if (!suggestion) return null;
  const call = (name, payload = {}) => invokeOn(actions, name, payload);
  if (suggestion.decision === 'pending') {
    if (!d.canDecide && !d.isFde) return <span className="ds-muted">建议供协作参考，由有权负责人决定</span>;
    return <Space wrap>
      <Button size="small" type="primary" disabled={d.saving || !d.canDecide} onClick={() => call('adopt')}>采纳并建待办</Button>
      <Button size="small" disabled={d.saving || !d.canDecide} loading={Boolean(d.saving)} onClick={() => call('dismiss')}>{d.isFde ? '不采纳' : '无需待办'}</Button>
      {d.isFde && !d.canDecide && <span className="ds-muted">建议处理暂未开放</span>}
    </Space>;
  }
  if (suggestion.decision === 'adopted') {
    const tasks = Array.isArray(suggestion.tasks) ? suggestion.tasks.filter(task => task?.id) : [];
    return <Space wrap>
      <span className="ds-muted">已采纳{tasks.length > 1 ? ' · 每人独立待办' : ''}</span>
      {tasks.length ? tasks.map(task => <Button key={task.id} type="link" size="small" onClick={() => call('openTask', {dataset: {id: task.id}})}>{task.assignee_name || '负责人'}{task.assignee_account ? `（${task.assignee_account}）` : ''} · 查看待办</Button>)
        : suggestion.task_id && !suggestion.tasks ? <Button type="link" size="small" onClick={() => call('openTask')}>查看待办</Button>
          : <span className="ds-muted">当前无可查看的待办</span>}
    </Space>;
  }
  return <span className="ds-muted">已处理 · {d.isFde ? '不采纳' : '无需待办'}{suggestion.decision_note ? ` · ${suggestion.decision_note}` : ''}</span>;
}
