import React from 'react';
import { Button } from 'antd';
import { SbDatePicker, SbLabeledSelect, SbMetricStrip, SbSearch, SbStatePanel, SbStatusTag, SbTable } from '@shandiant/ui-react';
import './opportunities.css';

// 商机页（原 pages/workbench/index）。原则：总览一行、每格一行、点整行进详情，其余进展开行。业务数据、筛选、分页都还是原 Page 的。
export function supportsOpportunities(page, data = {}) {
  return Boolean(page && page.route === 'pages/workbench/index' && !data.isFde && data.dataReady);
}
const toneOf = t => ({ green: 'good', yellow: 'watch', red: 'bad', gray: 'pending' })[t] || 'pending';
const TONE_LABEL = { good: '向好', watch: '需关注', bad: '转差', pending: '待评估' };
const METRIC_HELP = <div className="ds-opp-help">已成单：当前已赢单，按实际成单日期归季。<br />总商机：在推与已赢单，排除已丢单，按预计关单日期归季。<br />活跃商机：所选期间有已确认跟进，每个商机只计一次。<br />新增商机：按创建日期归季。<br />统计年份和季度只筛上方总览；关单年份、预计关单等只筛下方列表。清除年份可查看全部历史；缺失日期不归入某一年。</div>;
const money = v => (v == null || v === '' || v === '—' || v === '未登记') ? <span className="ds-muted">未登记</span> : v;

export default function Opportunities({ page, data: d, invoke }) {
  const call = (name, payload = {}) => invoke(name, payload);
  // 分组倒序：最近的季度在前（Q4 → Q1），组内顺序沿用原页面
  const groups = [...(d.opportunityGroups || [])].reverse();
  const listState = d.opportunityListError ? 'error' : d.opportunityListLoading ? 'loading' : !groups.length ? 'empty' : 'normal';
  const board = d.opportunityDataReady ? d.opportunityBoard : {};
  const sq = d.summaryQuarter || { year: '', quarters: [], options: [] };
  const lq = d.listQuarter || { quarters: [] };
  // 沿用原接口的季度契约：[] 是全部历史，所选年份的全年必须传 Q1～Q4。
  const setPeriod = (scope, year, quarters) => {
    if (!Number.isInteger(year) || year < 1 || year > 9999) return;
    const options = [1, 2, 3, 4].map(value => ({ value, label: `Q${value}`, selected: quarters.includes(value) }));
    const quarterYearOptions = [...new Set([...(page.data.quarterYearOptions || []).map(o => o.value), year])].sort((a, b) => a - b).map(value => ({ value, label: `${value}年` }));
    const selection = { year, quarters, options, label: !quarters.length ? '全部时间' : `${year}年 ${quarters.length === 4 ? '全年' : quarters.map(q => `Q${q}`).join(' + ')}` };
    page.setData({
      [`${scope}Quarter`]: selection,
      quarterYearOptions,
      summaryYearIndex: quarterYearOptions.findIndex(o => o.value === (scope === 'summary' ? year : page.data.summaryQuarter.year)),
      listYearIndex: quarterYearOptions.findIndex(o => o.value === (scope === 'list' ? year : page.data.listQuarter.year)),
      ...(scope === 'list' ? { opportunityCloseIndex: 0 } : {}),
    }, () => call(scope === 'summary' ? 'applyOpportunitySummary' : 'applyOpportunityFilters'));
  };
  const changeYear = (scope, value) => {
    const previous = page.data[`${scope}Quarter`];
    setPeriod(scope, value ? Number(value.slice(0, 4)) : previous.year, value ? (previous.quarters.length ? previous.quarters : [1, 2, 3, 4]) : []);
  };
  const yearPicker = (scope, label) => {
    const selection = scope === 'summary' ? sq : lq;
    return <label className="ds-opp-year"><span>{label}</span><SbDatePicker aria-label={label} picker="year" format={['YYYY年', 'YYYY']} presets={false} placeholder="全部年份" width={132}
      value={selection.quarters.length ? `${String(selection.year).padStart(4, '0')}-01-01` : null} onChange={value => changeYear(scope, value)} /></label>;
  };
  const pickQuarter = value => setPeriod('summary', sq.year, value === 'all' ? [1, 2, 3, 4] : [Number(value)]);
  // 确认后一次更新全部阶段，沿用原查询、分页重置与范围权限。
  const changeStages = next => {
    const selected = next || [];
    page.setData({
      opportunitySelectedStages: selected,
      opportunityStageOptions: (page.data.opportunityStageOptions || []).map(o => ({ ...o, selected: o.value !== 'all' && selected.includes(o.value) })),
      opportunityStageLabel: selected.length ? `已选${selected.length}项` : '全部阶段',
    }, () => call('applyOpportunityFilters'));
  };
  const columns = [
    { title: '商机 / 客户', key: 'name', width: '36%', render: (_, r) => <div className="ds-opp-name"><b>{r.name}{r.gradeLabel && <span className={`ds-opp-grade ds-opp-grade-${r.gradeCode}`}>{r.gradeLabel}</span>}</b><span className="ds-muted">{r.customer_name}</span></div> },
    { title: '阶段', key: 'stage', width: 150, render: (_, r) => <span className="ds-opp-stage">{r.stageName}{r.probabilityText && <span className="ds-muted"> · {r.probabilityText}</span>}</span> },
    { title: '状态', key: 'signal', width: 110, render: (_, r) => { const t = toneOf(r.signal?.tone); return <SbStatusTag tone={t} label={TONE_LABEL[t]} reason={r.signal?.detail} />; } },
    { title: '确收 / 回款', key: 'money', width: 160, align: 'right', render: (_, r) => <span className="ds-opp-money">{money(r.recognizedLabel)}<span className="ds-muted"> / </span>{money(r.collectionLabel)}</span> },
    { title: '预计关单', key: 'close', width: 120, render: (_, r) => r.closeLabel || <span className="ds-muted">未登记</span> },
  ];
  const expanded = r => <div className="ds-opp-expanded"><span>产品线：{r.productLineLabel || '未登记'}</span><span>负责人：{r.team} · {r.owner}</span><span>依据：{r.signal?.label} · {r.signal?.detail}</span></div>;
  if (d.accessBlocked) return <SbStatePanel state="forbidden" description={d.accessMessage} />;
  return <section className="ds-opps" aria-label="商机">
    <section className="ds-panel ds-opp-board" aria-label="商机总览">
      <SbMetricStrip columns={4} loading={d.opportunityOverviewLoading}
        extra={yearPicker('summary', '统计年份')}
        periods={sq.quarters.length ? [{ value: 'all', label: '全年' }, ...(sq.options || []).map(q => ({ value: q.value, label: q.label }))] : undefined}
        period={sq.quarters.length === 1 ? sq.quarters[0] : 'all'}
        onPeriodChange={pickQuarter}
        caliber={METRIC_HELP}
        items={[
          { key: 'total', label: '总商机', value: board.total ?? null, missingText: '—' },
          { key: 'active', label: '活跃商机', value: board.active ?? null, missingText: '—' },
          { key: 'won', label: '已成单', value: board.won ?? null, missingText: '—' },
          { key: 'new', label: '新增商机', value: board.newCount ?? null, missingText: '—' },
        ]} />
      {d.opportunityDataError && <p className="ds-opp-note" role="alert">{d.opportunityDataError} <Button type="link" size="small" onClick={() => call('applyOpportunitySummary')}>重试</Button></p>}
    </section>
    <section className="ds-panel ds-opp-list" aria-label="商机列表">
      <div className="ds-opp-tools">
        <div className="ds-opp-search"><SbSearch value={d.opportunityQuery || ''} onChange={value => call('searchOpportunities', { detail: { value } })} onSearch={() => call('applyOpportunityFilters')} placeholder="搜索客户、商机或产品线" loading={d.opportunityListLoading} /></div>
        {d.role === 'manager' && <SbLabeledSelect label="团队" value={d.executionTeamIndex > 0 ? d.executionTeamIndex : undefined} options={(d.executionTeamOptions || []).map((o, i) => ({ value: i, label: o.label })).filter(o => o.value > 0)} onChange={i => call('changeExecutionTeam', { detail: { value: i ?? 0 } })} />}
        {d.role !== 'sales' && <SbLabeledSelect label="负责人" value={d.opportunityOwnerIndex > 0 ? d.opportunityOwnerIndex : undefined} options={(d.opportunityOwnerOptions || []).map((o, i) => ({ value: i, label: o.label })).filter(o => o.value > 0)} onChange={i => call('changeOpportunityFilter', { dataset: { key: 'Owner' }, detail: { value: i ?? 0 } })} />}
        <SbLabeledSelect label="阶段" mode="multiple" value={d.opportunitySelectedStages || []} options={(d.opportunityStageOptions || []).filter(o => o.value !== 'all').map(o => ({ value: o.value, label: o.label }))} onChange={changeStages} />
        {yearPicker('list', '关单年份')}
        <SbLabeledSelect label="预计关单" value={d.opportunityCloseIndex > 0 ? d.opportunityCloseIndex : lq.quarters?.length ? 'quarters' : undefined} options={[...(d.opportunityCloseOptions || []).map((o, i) => ({ value: i, label: o.label })).filter(o => o.value > 0), ...(lq.quarters?.length ? [{ value: 'quarters', label: lq.label }] : [])]} onChange={i => call('selectOpportunityClosePeriod', { dataset: { index: i ?? 0 } })} />
        <SbLabeledSelect label="等级" value={d.opportunityGradeIndex > 0 ? d.opportunityGradeIndex : undefined} options={(d.opportunityGradeOptions || []).map((o, i) => ({ value: i, label: o.label })).filter(o => o.value > 0)} onChange={i => call('changeOpportunityFilter', { dataset: { key: 'Grade' }, detail: { value: i ?? 0 } })} />
        {d.opportunityFilterActive && <Button type="link" size="small" onClick={() => call('resetOpportunityFilters')}>清除筛选</Button>}
        {d.canCreateOpportunity && <Button className="ds-opp-create" type="primary" onClick={() => call('createOpportunity')}>新增商机</Button>}
      </div>
      <div className="ds-opp-count"><b>共 {d.opportunityTotal ?? '—'} 条</b></div>
      {listState !== 'normal'
        ? <SbTable columns={columns} rows={[]} state={listState} emptyTitle={listState === 'error' ? '加载失败' : '没有匹配的商机'} emptyDescription={listState === 'error' ? d.opportunityListError : undefined} onRetry={() => call('loadAllOpportunities')} onClear={d.opportunityFilterActive ? () => call('resetOpportunityFilters') : undefined} />
        : <div className="ds-opp-groups">{groups.map((g, gi) => <div key={g.key} className="ds-opp-group">
          <h3>{g.label} <small>{g.items.length} 条</small></h3>
          <SbTable rowKey="id" density="compact" columns={columns} rows={g.items} showHeader={gi === 0} scrollX={760}
            onRowClick={r => call('openOpportunity', { dataset: { customerId: r.customer_id, opportunityId: r.id } })}
            actions={r => r.canEdit ? <Button type="link" size="small" onClick={e => { e.stopPropagation(); call('editOpportunity', { dataset: { customerId: r.customer_id, opportunityId: r.id } }); }}>编辑</Button> : null} actionsWidth={72}
            expandable={{ columnWidth: 28, expandedRowRender: expanded, expandRowByClick: false }} />
        </div>)}</div>}
      {listState === 'normal' && (d.opportunityHasMore || d.opportunityMoreError || d.opportunityLoadingMore) && <div className="ds-opp-more">{d.opportunityTotal > (d.filteredOpportunities || []).length && <span className="ds-muted">还有 {d.opportunityTotal - (d.filteredOpportunities || []).length} 条没加载</span>}{d.opportunityMoreError && <span role="alert">{d.opportunityMoreError}</span>}<Button loading={d.opportunityLoadingMore} onClick={() => call('loadMoreOpportunities')}>{d.opportunityMoreError ? '重试' : '加载更多'}</Button></div>}
    </section>
  </section>;
}
