import React from 'react';
import { Button, Progress } from 'antd';
/** 生成过程（A-09）：具体阶段与进度，可取消并保留已生成部分。stages: string[]；current: 当前阶段下标；status: running | cancelled | failed | done */
export function SbAiProgress({ stages = [], current = 0, status = 'running', detail, onCancel, onRetry }) {
  const pct = stages.length ? Math.round(((status === 'done' ? stages.length : current) / stages.length) * 100) : 0;
  return (
    <div className="sb-progress" role="status">
      <Progress percent={pct} showInfo={false} status={status === 'failed' ? 'exception' : undefined} />
      <ol>{stages.map((s, i) => <li key={s} className={i < current || status === 'done' ? 'done' : ''} aria-current={i === current && status === 'running' ? 'step' : undefined}>{s}{i === current && detail ? `（${detail}）` : ''}</li>)}</ol>
      <div className="sb-progress-foot">
        <span>{status === 'running' ? '取消后保留已生成的字段' : status === 'cancelled' ? '已取消，已生成的字段已保留' : status === 'failed' ? '生成失败，已识别的部分已保留' : '完成'}</span>
        {status === 'running' && onCancel && <Button size="small" onClick={onCancel}>取消</Button>}
        {status === 'failed' && onRetry && <Button size="small" type="primary" onClick={onRetry}>重试</Button>}
      </div>
    </div>
  );
}
