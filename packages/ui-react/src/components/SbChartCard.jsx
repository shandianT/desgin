import React from 'react';
import { Skeleton, Tooltip } from 'antd';
import { SbStatePanel } from './SbStatePanel.jsx';
import { SbIcon } from './SbIcon.jsx';
/**
 * 图表卡片壳（12 章 §1、§4）：标题写图回答什么问题，范围与周期紧挨标题，口径放悬停 ⓘ，图例在图上方左侧；
 * 加载中骨架，空与错用四态面板（重试不清筛选）；summary 是给读屏的一句摘要；传 data 出现「查看图表数据」折叠表（图旁必有数）。
 */
export function SbChartCard({ title, scope, caliber, legend, state = 'normal', emptyTitle, emptyDescription, onRetry, summary, data, className = '', children }) {
  const columns = data?.columns || [];
  const rows = data?.rows || [];
  return (
    <section className={`sb-chart ${className}`} aria-label={summary || (typeof title === 'string' ? title : undefined)}>
      <header className="sb-chart-head">
        <h3 className="sb-chart-title">{title}{scope && <small className="sb-chart-scope">{scope}</small>}</h3>
        {caliber && <Tooltip title={caliber}><button type="button" className="sb-chart-help" aria-label="统计口径"><SbIcon name="info" tone="muted" size="md" /></button></Tooltip>}
      </header>
      {legend && state === 'normal' && <div className="sb-chart-legend">{legend}</div>}
      <div className="sb-chart-body" aria-busy={state === 'loading' || undefined}>
        {state === 'loading' && <Skeleton active title={false} paragraph={{ rows: 5 }} />}
        {state === 'empty' && <SbStatePanel state="empty" title={emptyTitle || '这个周期还没有数据'} description={emptyDescription || '换一个周期或范围，或先登记数据。'} />}
        {state === 'error' && <SbStatePanel state="error" title="加载失败" description="网络不通或服务暂时不可用。" onRetry={onRetry} />}
        {state === 'normal' && children}
      </div>
      {summary && <p className="sb-chart-sr">{summary}</p>}
      {data && columns.length > 0 && (
        <details className="sb-chart-data">
          <summary>查看图表数据</summary>
          <table>
            <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{columns.map((_, j) => <td key={j}>{r[j] == null || r[j] === '' ? <span className="sb-chart-missing">未登记</span> : r[j]}</td>)}</tr>)}</tbody>
          </table>
        </details>
      )}
    </section>
  );
}
