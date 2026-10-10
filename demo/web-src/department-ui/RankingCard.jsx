import React, {useEffect, useRef, useState} from 'react';
import {Button, Drawer, Input, Progress} from 'antd';
import {SbBarChart, SbStatePanel} from '@shandiant/ui-react';
import './ranking-card.css';

const unavailable = message => /暂不提供/.test(String(message || ''));
const moneyInWan = value => value == null || !Number.isFinite(Number(value)) ? null : Math.round(Number(value) / 100) / 100;

// 同一张榜只消费业务层给出的名次与选中对象，Web 不在展示层重新排名。
export default function RankingCard({card, cohort, period, onRetry, loading = false, error = '', showChart = false}) {
  const [open, setOpen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => typeof window === 'undefined' ? 640 : Math.min(640, window.innerWidth));
  const [query, setQuery] = useState('');
  const listRef = useRef(null);
  const selectedRef = useRef(null);
  const triggerRef = useRef(null);
  const focusTimerRef = useRef(null);
  useEffect(() => {
    const updateWidth = () => setDrawerWidth(Math.min(640, window.innerWidth));
    window.addEventListener('resize', updateWidth);
    return () => { window.removeEventListener('resize', updateWidth); window.clearTimeout(focusTimerRef.current); };
  }, []);
  const selectedIds = new Set(card.summaryIds || []);
  const rows = (card.rows || []).map(row => ({...row, isSelected: row.isSelected || selectedIds.has(row.id)}));
  const summary = rows.filter(row => row.isSelected);
  const selectedIndex = rows.findIndex(row => row.isSelected);
  const visibleRows = query.trim() ? rows.filter(row => `${row.name} ${row.meta || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : rows;
  const message = error || card.error || '';
  const noRank = unavailable(message);
  const money = card.key !== 'followup' && card.key !== 'followupRanking';
  const label = showChart ? '查看完整榜单' : '查看详情';
  const openDrawer = () => { window.clearTimeout(focusTimerRef.current); setOpen(true); };
  const closeDrawer = () => {
    setOpen(false);
    setQuery('');
    focusTimerRef.current = window.setTimeout(() => { if (document.activeElement === document.body) triggerRef.current?.focus(); }, 500);
  };
  const scrollToRow = row => {
    const body = listRef.current?.closest('.ant-drawer-body');
    if (!row || !body) return;
    const bodyBox = body.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    body.scrollTo({top: body.scrollTop + rowBox.top - bodyBox.top - (body.clientHeight - rowBox.height) / 2, behavior: 'instant'});
  };
  const locateSelected = () => {
    if (query) setQuery('');
    requestAnimationFrame(() => scrollToRow(selectedRef.current));
  };
  const Row = ({row, index, detail = false}) => <li
    key={row.id || row.user_id || index}
    className={`ds-fd-rank-row ${row.isSelected ? 'is-selected' : ''}`}
    aria-current={detail && row.isSelected ? 'true' : undefined}
    ref={detail && row.isSelected && index === selectedIndex ? selectedRef : undefined}>
    <span className="ds-fd-rank-no">{row.rank}</span>
    <span className="ds-fd-rank-main"><b>{row.name}{row.isSelected && <small className="ds-muted"> {row.isSelf ? '本人' : '当前查看'}</small>}</b><span className="ds-muted">{row.meta}</span>
      <Progress percent={parseFloat(row.width) || 0} size="small" showInfo={false} strokeColor="var(--ui-primary)" trailColor="var(--ui-line)" />
    </span>
    <b className="ds-fd-rank-value">{row.displayValue}</b>
  </li>;
  return <section className="ds-fd-rank" aria-label={`${card.title} · ${cohort}`}>
    <div className="ds-fd-rank-head"><div><b>{card.title}</b><span className="ds-muted">{cohort} · {period}</span></div>
      <Button ref={triggerRef} type="link" size="small" disabled={loading || Boolean(message)} onClick={openDrawer}>{label}</Button>
    </div>
    {loading ? <SbStatePanel state="loading" title="正在加载排名…" />
      : message ? <SbStatePanel state={noRank ? 'empty' : 'error'} title={message}
          description={noRank ? '请选择适用的查看对象。' : '请检查当前范围后重试。'} onRetry={noRank ? undefined : onRetry} />
        : summary.length ? <ol className="ds-fd-rank-list">{summary.map((row, index) => <Row key={row.id || row.user_id || index} row={row} index={index} />)}</ol>
          : <p className="ds-muted">{rows.length ? card.emptySummary || '所选对象暂未纳入当前榜单' : '当前范围暂无排名数据'}</p>}
    {showChart && !loading && !message && summary.length > 0 && <div className="ds-rank-chart"><SbBarChart orientation="horizontal"
      categories={summary.map(row => row.name)} series={[{name:money ? 'ACV' : '跟进', data:summary.map(row => money ? moneyInWan(row.value) : row.value)}]}
      unit={money ? '万元' : '次'} maxItems={10} height={Math.max(160, Math.min(summary.length, 10) * 32 + 60)} /></div>}
    <Drawer open={open} title={card.title} placement="right" width={drawerWidth} rootClassName="department-ui ds-rank-drawer"
      onClose={closeDrawer} afterOpenChange={shown => { if (shown) locateSelected(); }} destroyOnHidden>
      <div className="ds-rank-drawer-content" ref={listRef}>
        <p className="ds-muted ds-rank-drawer-scope">{cohort} · {period} · 共 {rows.length} 人</p>
        {rows.length > 0 && <div className="ds-rank-drawer-tools">
          <Input value={query} onChange={event => setQuery(event.target.value)} allowClear placeholder="搜索榜单成员" aria-label="搜索榜单成员" />
          <div className="ds-rank-drawer-actions">
            <span className="ds-muted">显示 {visibleRows.length} / {rows.length} 人</span>
            <Button type="link" size="small" onClick={() => { setQuery(''); listRef.current?.closest('.ant-drawer-body')?.scrollTo({top: 0, behavior: 'instant'}); }}>回到榜首</Button>
            {selectedIndex >= 0 && <Button type="link" size="small" onClick={locateSelected}>定位当前</Button>}
          </div>
        </div>}
        {visibleRows.length ? <ol className="ds-fd-rank-list">{visibleRows.map((row, index) => <Row key={row.id || row.user_id || index} row={row} index={rows.indexOf(row)} detail />)}</ol>
          : <p className="ds-muted">{rows.length ? '没有匹配的成员，请换个关键词' : '当前范围暂无排名数据'}</p>}
      </div>
    </Drawer>
  </section>;
}
