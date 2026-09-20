import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, DatePicker, Input, Select, Form } from 'antd';
import { SbProvider, SbStatusTag, SbStatePanel, SbFilterBar, SbSearch, SbListRow, SbBottomBar, SbField, SbSheet, SbPagination, SbMetricTile, SbPageHeader, SbDetailLayout, SbAiBadge, SbAiField, SbAiSources, SbAiProgress, META } from '../src/index.js';

const State = ({ title, children }) => <div className="state"><h4>{title}</h4>{children}</div>;
const rows = [
  { name: '华宸数据科技有限公司', summary: '客户资产 · 关系 8/10 · 地盘 HB-01', status: { tone: 'good', reason: '近 30 天有高层拜访' }, time: '2 天前跟进' },
  { name: '北辰智造集团', summary: '主攻区 · 关系 4/10 · 地盘 HB-01', status: { tone: 'watch', reason: '一周无跟进' }, time: '9 天前跟进' },
  { name: '金桥制造股份有限公司', summary: '客户资产 · 关系 9/10', status: { tone: 'bad', reason: '两周无高层或技术动作' }, time: '16 天前跟进' },
];
const FILTER_OPTS = [{ value: 'risk', label: '有风险', count: 6 }, { value: 'main', label: '主攻区', count: 9 }, { value: 'asset', label: '客户资产', count: 7 }, { value: 'mine', label: '本人负责', count: 24 }];

function FilterDemo({ disabled }) { const [v, setV] = useState(['risk']); return <SbFilterBar title="客户列表" scope="本人负责" options={FILTER_OPTS} value={v} onChange={setV} resultCount={v.length ? 6 : 24} resultLabel="家" disabled={disabled} />; }
function SheetDemo() { const [open, setOpen] = useState(false); return <><Button onClick={() => setOpen(true)}>打开底部弹层</Button><SbSheet open={open} title="选择季度" onClose={() => setOpen(false)} footer={<Button type="primary" onClick={() => setOpen(false)}>应用</Button>}><p>第三季度 · 已选 2 项</p></SbSheet></>; }
function LayoutDemo({ tier }) {
  const [open, setOpen] = useState(tier !== 'desktop' ? false : true); const [sel, setSel] = useState(0);
  const list = <div>{rows.map((r, i) => <SbListRow key={r.name} {...r} selected={i === sel} onClick={() => { setSel(i); setOpen(true); }} />)}</div>;
  const detail = <div><h3 style={{ margin: 0 }}>{rows[sel].name}</h3><p style={{ color: 'var(--ui-secondary)' }}>{rows[sel].summary}</p><SbStatusTag {...rows[sel].status} showReason /></div>;
  return <SbDetailLayout tier={tier} nav={<div>{tier === 'mobile' ? ['总览', '客户', '任务', '我的'].map((t) => <span key={t}>{t}</span>) : tier === 'rail' ? '☰' : '总览 · 客户 · 商机 · 任务'}</div>} list={list} detail={detail} detailOpen={open} onBack={() => setOpen(false)} />;
}
function AiFieldDemo({ state, confidence, error }) {
  const [v, setV] = useState(confidence === 'low' ? '' : '张总（CIO）'); const [st, setSt] = useState(state);
  return <SbAiField label="联系人角色" required value={v} aiValue="张总（CIO）" state={st} confidence={confidence} candidates={['CIO', '信息中心主任', 'IT 负责人']} error={error} onChange={(x) => { setV(x); if (st === 'ai') setSt('edited'); }} onConfirm={() => setSt('confirmed')} onRestore={() => { setV('张总（CIO）'); setSt('ai'); }} />;
}
const SOURCES = [{ key: 1, title: '9 月 12 日拜访记录', description: '「已获得 CIO 支持，预算在四季度审批」', url: '#' }, { key: 2, title: '客户档案 · 潜力', description: '预算 320 万，台数 1200', url: '#' }];

const DEMOS = {
  SbProvider: () => <div className="states"><State title="主色与控件高度来自桥接"><Button type="primary">记录拜访</Button> <Button>创建任务</Button></State><State title="表单字段高 40"><Input placeholder="搜索客户名称或负责人" /></State></div>,
  SbStatusTag: () => <div className="states"><State title="向好"><SbStatusTag tone="good" /></State><State title="需关注"><SbStatusTag tone="watch" /></State><State title="转差"><SbStatusTag tone="bad" /></State><State title="待评估"><SbStatusTag tone="pending" /></State><State title="未登记"><SbStatusTag tone="unset" /></State><State title="带依据"><SbStatusTag tone="watch" reason="一周无跟进" showReason /></State></div>,
  SbStatePanel: () => <div className="states"><State title="加载中"><SbStatePanel state="loading" /></State><State title="骨架"><SbStatePanel state="loading" skeleton /></State><State title="空"><SbStatePanel state="empty" title="没有匹配的客户" description="当前筛选：有风险、本人负责。" onClear={() => {}} /></State><State title="失败"><SbStatePanel state="error" onRetry={() => {}} /></State><State title="无权限"><SbStatePanel state="forbidden" /></State></div>,
  SbFilterBar: () => <div className="states wide"><State title="默认与已选"><FilterDemo /></State><State title="禁用"><FilterDemo disabled /></State></div>,
  SbSearch: () => <div className="states"><State title="默认"><SbSearch /></State><State title="输入中"><SbSearch value="华宸" /></State><State title="加载中"><SbSearch value="华宸" loading /></State><State title="禁用"><SbSearch disabled /></State></div>,
  SbListRow: () => <div className="states wide"><State title="默认、选中、无权限"><SbListRow {...rows[0]} /><SbListRow {...rows[1]} selected /><SbListRow name="泰和银行数据中心" disabled disabledReason="不在你的授权范围内" /></State></div>,
  SbBottomBar: () => <div className="states wide"><State title="默认"><SbBottomBar primary={{ label: '归档' }} secondary={{ label: '存草稿' }} /></State><State title="处理中"><SbBottomBar primary={{ label: '归档', loading: true, loadingLabel: '归档中…' }} secondary={{ label: '存草稿', disabled: true }} /></State><State title="禁用说原因"><SbBottomBar primary={{ label: '归档', disabled: true, disabledReason: '还有 3 项必填未确认：下一步、客户预算、联系人角色' }} secondary={{ label: '存草稿' }} /></State></div>,
  SbField: () => <Form layout="vertical"><div className="states"><State title="默认"><SbField label="客户名称"><Input value="华宸数据科技" /></SbField></State><State title="必填"><SbField label="下一步" required help="须含时间与目标"><Input placeholder="10 月 8 日前发方案" /></SbField></State><State title="错误"><SbField label="客户预算" required error="请填写客户预算，已保留其余输入"><Input status="error" /></SbField></State><State title="只读"><SbField label="拜访日期" readOnly><Input value="2026-09-19" /></SbField></State><State title="选择与日期"><SbField label="季度"><Select defaultValue="q3" options={[{ value: 'q3', label: '第三季度' }, { value: 'q4', label: '第四季度' }]} /></SbField><SbField label="日期"><DatePicker style={{ width: '100%' }} /></SbField></State></div></Form>,
  SbSheet: () => <div className="states"><State title="打开"><SheetDemo /></State></div>,
  SbPagination: () => <div className="states"><State title="默认"><SbPagination current={2} total={124} /></State><State title="末页"><SbPagination current={7} total={124} /></State></div>,
  SbMetricTile: () => <div className="states"><State title="有值"><SbMetricTile value="1,250,000" label="ACV（元）" note="本季度" /></State><State title="缺失"><SbMetricTile value={null} label="回款（元）" note="不显示 0" /></State></div>,
  SbPageHeader: () => <div className="states wide"><State title="默认"><SbPageHeader title="客户" scope="本人负责 · 24 家" actions={<><Button type="primary">记录拜访</Button><Button>创建任务</Button></>} /></State></div>,
  SbDetailLayout: () => <div className="states wide"><State title="电脑 >900：三栏并排"><LayoutDemo tier="desktop" /></State><State title="收紧 601～900：图标导航，列表或详情"><div style={{ maxWidth: 760 }}><LayoutDemo tier="rail" /></div></State><State title="手机 ≤600：底部导航，点一行整页进详情"><div style={{ maxWidth: 390 }}><LayoutDemo tier="mobile" /></div></State></div>,
  SbAiBadge: () => <div className="states"><State title="生成中"><SbAiBadge state="generating" /></State><State title="待确认"><SbAiBadge state="pending" /></State><State title="已确认"><SbAiBadge state="confirmed" confirmedBy="王明 9 月 19 日 " /></State></div>,
  SbAiField: () => <div className="states"><State title="AI 原值，待确认"><AiFieldDemo state="ai" /></State><State title="人已修改，可恢复"><AiFieldDemo state="edited" /></State><State title="已确认"><AiFieldDemo state="confirmed" /></State><State title="低把握，给候选"><AiFieldDemo state="ai" confidence="low" /></State><State title="错误"><AiFieldDemo state="ai" error="联系人角色不能为空" /></State></div>,
  SbAiSources: () => <div className="states"><State title="折叠"><SbAiSources items={SOURCES} /></State><State title="展开"><SbAiSources items={SOURCES} defaultExpanded /></State><State title="无依据"><SbAiSources items={[]} /></State></div>,
  SbAiProgress: () => { const stages = ['转写语音', '提取 16 项基础字段', '核对「下一步」是否含时间与目标']; return <div className="states"><State title="进行中"><SbAiProgress stages={stages} current={1} detail="12/16" onCancel={() => {}} /></State><State title="已取消"><SbAiProgress stages={stages} current={1} status="cancelled" /></State><State title="失败"><SbAiProgress stages={stages} current={0} status="failed" onRetry={() => {}} /></State><State title="完成"><SbAiProgress stages={stages} current={3} status="done" /></State></div>; },
};

function App() {
  return (
    <div className="cat">
      <nav className="cat-nav"><h1>部门组件库<small>Web · Ant Design 6 与 Ant Design X 之上</small></h1>{META.map((m) => <a key={m.id} href={`#${m.id}`}>{m.name}<small>{m.id}</small></a>)}</nav>
      <main className="cat-main">
        <p className="lead">每个组件在每个状态下的真实渲染。基础控件直接用 Ant Design，这里只放规范要求的组合件与 AI 件。主题只来自 tokens.json 生成的桥接文件，改一个变量这里全变。</p>
        {META.map((m) => { const Demo = DEMOS[m.id]; return (
          <section className="comp" key={m.id} id={m.id}>
            <h2>{m.name}<code>{m.id}</code></h2>
            <div className="comp-meta"><b>做什么</b><span>{m.purpose}</span><b>规则</b><span>{m.rules.map((r) => <span className="rule" key={r}>{r}</span>)}</span><b>用在哪</b><span>{m.pages}</span><b>属性</b><span>{m.props}</span></div>
            {Demo ? <Demo /> : null}
          </section>); })}
      </main>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<SbProvider><App /></SbProvider>);
