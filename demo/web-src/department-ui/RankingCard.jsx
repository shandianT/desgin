import React, {useState} from 'react';
import {Button, Progress} from 'antd';
import {SbBarChart, SbSheet, SbStatePanel} from '@shandiant/ui-react';
import './ranking-card.css';

const unavailable = message => /暂不提供/.test(String(message || ''));
const moneyInWan = value => value == null || !Number.isFinite(Number(value)) ? null : Math.round(Number(value) / 100) / 100;

// 同一张榜只消费业务层给出的名次与选中对象，Web 不在展示层重新排名。
export default function RankingCard({card, cohort, period, onRetry, loading = false, error = '', showChart = false}) {
  const [open, setOpen] = useState(false);
  const selectedIds = new Set(card.summaryIds || []);
  const rows = (card.rows || []).map(row => ({...row, isSelected: row.isSelected || selectedIds.has(row.id)}));
  const summary = rows.filter(row => row.isSelected);
  const selectedIndex = rows.findIndex(row => row.isSelected);
  const message = error || card.error || '';
  const noRank = unavailable(message);
  const money = card.key !== 'followup' && card.key !== 'followupRanking';
  const label = showChart ? '查看完整榜单' : '查看详情';
  const Row = ({row, index, detail = false}) => <li
    key={row.id || row.user_id || index}
    className={`ds-fd-rank-row ${row.isSelected ? 'is-selected' : ''}`}
    ref={detail && index === selectedIndex ? node => { if (node && open) requestAnimationFrame(() => node.scrollIntoView({block:'center', behavior:'instant'})); } : undefined}>
    <span className="ds-fd-rank-no">{row.rank}</span>
    <span className="ds-fd-rank-main"><b>{row.name}{row.isSelected && <small className="ds-muted"> {row.isSelf ? '本人' : '当前查看'}</small>}</b><span className="ds-muted">{row.meta}</span>
      <Progress percent={parseFloat(row.width) || 0} size="small" showInfo={false} strokeColor="var(--ui-primary)" trailColor="var(--ui-line)" />
    </span>
    <b className="ds-fd-rank-value">{row.displayValue}</b>
  </li>;
  return <section className="ds-fd-rank" aria-label={`${card.title} · ${cohort}`}>
    <div className="ds-fd-rank-head"><div><b>{card.title}</b><span className="ds-muted">{cohort} · {period}</span></div>
      <Button type="link" size="small" disabled={loading || Boolean(message)} onClick={() => setOpen(true)}>{label}</Button>
    </div>
    {loading ? <SbStatePanel state="loading" title="正在加载排名…" />
      : message ? <SbStatePanel state={noRank ? 'empty' : 'error'} title={message}
          description={noRank ? '请选择适用的查看对象。' : '请检查当前范围后重试。'} onRetry={noRank ? undefined : onRetry} />
        : summary.length ? <ol className="ds-fd-rank-list">{summary.map((row, index) => <Row key={row.id || row.user_id || index} row={row} index={index} />)}</ol>
          : <p className="ds-muted">{rows.length ? card.emptySummary || '所选对象暂未纳入当前榜单' : '当前范围暂无排名数据'}</p>}
    {showChart && !loading && !message && rows.length > 0 && <div className="ds-rank-chart"><SbBarChart orientation="horizontal"
      categories={rows.map(row => row.name)} series={[{name:money ? 'ACV' : '跟进', data:rows.map(row => money ? moneyInWan(row.value) : row.value)}]}
      unit={money ? '万元' : '次'} maxItems={10} height={Math.max(160, Math.min(rows.length, 10) * 32 + 60)} /></div>}
    <SbSheet open={open} title={<span>{card.title} <small className="ds-muted">{cohort} · 共 {rows.length} 项 · {period}</small></span>}
      onClose={() => setOpen(false)} footer={<Button onClick={() => setOpen(false)}>完成</Button>}>
      {rows.length ? <ol className="ds-fd-rank-list">{rows.map((row, index) => <Row key={row.id || row.user_id || index} row={row} index={index} detail />)}</ol>
        : <p className="ds-muted">当前范围暂无排名数据</p>}
    </SbSheet>
  </section>;
}
