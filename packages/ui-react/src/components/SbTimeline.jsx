import React from 'react';
import { Timeline, Skeleton } from 'antd';
/**
 * 时间轴（C-05、B-01）：跟进历史、业务动态。antd Timeline 薄壳。
 * 节点颜色只由 tone 决定：good 成功色、watch 警示色、bad 危险色、pending 主色、neutral 灰，全部来自变量，不收颜色值。
 * items: [{ key, time, title, description, tone, actor, onClick }]；pending 是末尾「进行中」占位；reverse 倒序；size compact 行距更紧。
 * 空列表显示 emptyText，不画空轴；loading 显示骨架。
 */
const TONE_COLOR = { good: 'var(--ui-success)', watch: 'var(--ui-warning)', bad: 'var(--ui-danger)', pending: 'var(--ui-primary)', neutral: 'var(--ui-neutral)' };

export function SbTimeline({ items = [], pending, reverse = false, size = 'default', loading = false, emptyText = '还没有记录', className = '' }) {
  if (loading) return <div className={`sb-timeline sb-timeline-loading ${className}`}><Skeleton active paragraph={{ rows: 3 }} title={false} /></div>;
  if (!items.length && !pending) return <p className={`sb-timeline-empty ${className}`}>{emptyText}</p>;
  const list = items.map((it, i) => {
    const tone = TONE_COLOR[it.tone] ? it.tone : 'neutral';
    const body = (
      <>
        {it.time && <span className="sb-timeline-time">{it.time}</span>}
        <span className="sb-timeline-title">{it.title}</span>
        {it.description && <span className="sb-timeline-desc">{it.description}</span>}
        {it.actor && <span className="sb-timeline-actor">{it.actor}</span>}
      </>
    );
    const content = it.onClick
      ? <button type="button" className="sb-timeline-btn" onClick={() => it.onClick(it)}>{body}</button>
      : <div className="sb-timeline-body">{body}</div>;
    return { key: it.key ?? i, color: TONE_COLOR[tone], className: `sb-timeline-item sb-timeline-${tone}`, content };
  });
  if (pending) list.push({ key: '__pending', loading: true, className: 'sb-timeline-item sb-timeline-pendingnode', content: <div className="sb-timeline-body"><span className="sb-timeline-title sb-timeline-pending-text">{pending}</span></div> });
  return <Timeline className={`sb-timeline sb-timeline-${size} ${className}`} items={list} reverse={reverse} />;
}
