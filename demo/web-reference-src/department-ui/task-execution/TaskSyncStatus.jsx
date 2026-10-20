import React from 'react';

export const taskSyncUnavailable = sync => ['offline', 'error', 'paused'].includes(sync?.status);
export default function TaskSyncStatus({sync, lastSyncedLabel}) {
  const labels = {current: '自动同步', syncing: '正在同步', offline: '当前离线', error: '同步暂不可用', paused: '已暂停同步'};
  const time = sync?.lastSyncedAt && new Date(sync.lastSyncedAt);
  const last = time && Number.isFinite(time.getTime()) ? time.toLocaleTimeString('zh-CN', {hour12: false}) : lastSyncedLabel;
  return <p className={taskSyncUnavailable(sync) ? 'ds-td-error' : 'ds-muted'} role="status" aria-label="任务同步状态">
    {labels[sync?.status] || '等待同步'}{last ? ` · 最近同步：${last}` : ' · 尚未同步'}
    {sync?.message && <span> · {sync.message}</span>}
  </p>;
}
