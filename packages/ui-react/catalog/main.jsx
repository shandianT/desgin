import React, { useEffect, useState } from 'react';
import { palette } from '../../../specs/salesbuddy/02-设计变量与同步链路/palette.mjs';
import { createRoot } from 'react-dom/client';
import { App as AntApp, Button, Cascader, Collapse, DatePicker, Drawer, Form, Input, Modal, Select, Table, Tabs, Tag, Tooltip } from 'antd';
import '@shandiant/tokens/css';
import { SbProvider, SbStatusTag, SbStatePanel, SbFilterBar, SbSearch, SbListRow, SbBottomBar, SbField, SbSheet, SbPagination, SbMetricTile, SbPageHeader, SbDetailLayout, SbAiBadge, SbAiField, SbAiSources, SbAiProgress, META, USAGE } from '../src/index.js';

const State = ({ title, children, className }) => <div className={className ? `state ${className}` : 'state'}><h4>{title}</h4>{children}</div>;
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

// 基础控件的演示数据
const CUSTOMERS = ['华宸数据科技有限公司', '北辰智造集团', '金桥制造股份有限公司', '泰和银行数据中心', '云启物流', '海晟半导体'];
const SELECT_OPTS = CUSTOMERS.map((c) => ({ value: c, label: c }));
const CASCADER_OPTS = [
  { value: 'south', label: '南区', children: [{ value: 'HB-01', label: '地盘 HB-01' }, { value: 'HB-02', label: '地盘 HB-02' }] },
  { value: 'east', label: '东区', children: [{ value: 'SH-01', label: '地盘 SH-01' }] },
];
const TABLE_COLS = [
  { title: '客户', dataIndex: 'name', width: 220 },
  { title: '象限', dataIndex: 'zone', width: 100 },
  { title: '关系', dataIndex: 'rel', width: 80 },
  { title: '地盘', dataIndex: 'plot', width: 100 },
  { title: '最近跟进', dataIndex: 'time' },
];
const ZONES = ['主攻区', '客户资产', '见单打单', '客户资源'];
const TABLE_ROWS = Array.from({ length: 24 }, (_, i) => ({ key: i, name: i < CUSTOMERS.length ? CUSTOMERS[i] : `${CUSTOMERS[i % CUSTOMERS.length]} ${i + 1}`, zone: ZONES[i % 4], rel: `${(i % 10) + 1}/10`, plot: `HB-0${(i % 3) + 1}`, time: `${i + 1} 天前` }));
const full = { width: '100%' };
const inCard = (n) => n.parentNode;
// 常开的下拉固定在字段下方，不随视口位置翻到上面。
const STAY_BELOW = { points: ['tl', 'bl'], offset: [0, 4], overflow: { adjustX: false, adjustY: false } };

function BasicsDemo() {
  const { message, notification } = AntApp.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('visits');
  const [checked, setChecked] = useState(true);
  return (
    <div className="basics">
      <h3>Button 按钮</h3>
      <div className="states">
        <State title="主：一页只放一个"><Button type="primary">记录拜访</Button></State>
        <State title="次"><Button>创建任务</Button></State>
        <State title="文字"><Button type="text">查看依据</Button><Button type="link">查看全部</Button></State>
        <State title="禁用"><div className="inline"><Button type="primary" disabled>归档</Button><Button disabled>存草稿</Button></div></State>
        <State title="处理中：防重复提交"><Button type="primary" loading>归档中…</Button></State>
      </div>
      <h3>Input 输入框 与 Input.TextArea 多行输入</h3>
      <div className="states">
        <State title="默认"><div className="stack"><Input placeholder="客户名称" /><Input.TextArea rows={2} placeholder="拜访要点" /></div></State>
        <State title="聚焦样式"><div className="stack"><Input className="demo-focus" defaultValue="华宸数据科技" /><Input.TextArea className="demo-focus" rows={2} defaultValue="已获得 CIO 支持" /><span className="demo-note">点进输入框看真实的焦点环</span></div></State>
        <State title="禁用"><div className="stack"><Input disabled value="华宸数据科技" /><Input.TextArea disabled rows={2} value="已获得 CIO 支持" /></div></State>
        <State title="错误：就地说明，保留输入"><div className="stack"><Input status="error" placeholder="客户预算" /><Input.TextArea status="error" rows={2} defaultValue="发方案" /><span className="demo-error">下一步须含明确时间与目标</span></div></State>
      </div>
      <h3>Select 选择器</h3>
      <div className="states">
        <State title="默认"><Select defaultValue={CUSTOMERS[0]} options={SELECT_OPTS} style={full} /></State>
        <State title="多选"><Select mode="multiple" defaultValue={[CUSTOMERS[0], CUSTOMERS[1]]} options={SELECT_OPTS} style={full} /></State>
        <State title="加载中"><Select loading placeholder="正在取客户…" options={[]} style={full} /></State>
        <State title="无匹配" className="popup-host"><Select open showSearch searchValue="泰山" notFoundContent="没有匹配的客户，换个词试试" options={[]} placeholder="搜索客户" style={full} getPopupContainer={inCard} placement="bottomLeft" popupAlign={STAY_BELOW} /></State>
        <State title="禁用"><Select disabled defaultValue={CUSTOMERS[0]} options={SELECT_OPTS} style={full} /></State>
      </div>
      <h3>DatePicker 日期选择</h3>
      <div className="states">
        <State title="默认"><DatePicker style={full} placeholder="拜访日期" /></State>
        <State title="范围"><DatePicker.RangePicker style={full} /></State>
        <State title="禁用"><DatePicker disabled style={full} placeholder="拜访日期" /></State>
      </div>
      <h3>Cascader 级联选择</h3>
      <div className="states">
        <State title="默认：区域到地盘"><Cascader options={CASCADER_OPTS} placeholder="选择地盘" style={full} /></State>
        <State title="已选"><Cascader options={CASCADER_OPTS} defaultValue={['south', 'HB-01']} style={full} /></State>
        <State title="禁用"><Cascader disabled options={CASCADER_OPTS} placeholder="选择地盘" style={full} /></State>
      </div>
      <h3>Table 表格</h3>
      <div className="states wide">
        <State title="加载中"><Table size="small" loading columns={TABLE_COLS} dataSource={TABLE_ROWS.slice(0, 3)} pagination={false} scroll={{ x: 'max-content' }} /></State>
        <State title="空数据：文案交给四态面板"><Table size="small" columns={TABLE_COLS} dataSource={[]} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: <SbStatePanel state="empty" title="没有匹配的客户" description="当前筛选：有风险、本人负责。" /> }} /></State>
        <State title="24 行，固定表头"><Table size="small" columns={TABLE_COLS} dataSource={TABLE_ROWS} pagination={false} scroll={{ y: 280, x: 'max-content' }} /></State>
      </div>
      <h3>Modal 对话框</h3>
      <div className="states">
        <State title="按钮打开，Esc 可关，关闭后焦点回到按钮">
          <Button id="demo-modal-open" onClick={() => setModalOpen(true)}>打开确认框</Button>
          <Modal title="归档这条拜访记录？" open={modalOpen} onOk={() => setModalOpen(false)} onCancel={() => setModalOpen(false)} okText="归档" cancelText="取消"><p>归档后由 Agent 重算象限与风险，不可手工改分。</p></Modal>
        </State>
      </div>
      <h3>Drawer 抽屉</h3>
      <div className="states">
        <State title="右侧抽屉">
          <Button id="demo-drawer-open" onClick={() => setDrawerOpen(true)}>打开抽屉</Button>
          <Drawer title="客户档案" open={drawerOpen} onClose={() => setDrawerOpen(false)}><p>华宸数据科技有限公司</p><p>客户资产，关系 8/10，地盘 HB-01。</p></Drawer>
        </State>
      </div>
      <h3>message 消息提示 与 notification 通知</h3>
      <div className="states">
        <State title="message：轻提示，自动消失"><div className="inline"><Button id="demo-message-ok" onClick={() => message.success('已归档')}>成功</Button><Button onClick={() => message.error('保存失败，已保留你的输入')}>失败</Button></div></State>
        <State title="notification：带标题与说明"><Button id="demo-notify-open" onClick={() => notification.open({ message: '任务已下发', description: '对方拒绝时需填意见，并推送给你。' })}>下发任务</Button></State>
      </div>
      <h3>Tag 标签</h3>
      <div className="states">
        <State title="默认"><Tag>主攻区</Tag><Tag>HB-01</Tag></State>
        <State title="带色：状态请用 SbStatusTag"><Tag color="processing">进行中</Tag><Tag color="success">已确认</Tag><Tag color="warning">待确认</Tag><Tag color="error">已拒绝</Tag></State>
        <State title="可关闭"><Tag closable>有风险</Tag><Tag closable>本人负责</Tag></State>
        <State title="可选"><Tag.CheckableTag checked={checked} onChange={setChecked}>本人负责</Tag.CheckableTag></State>
      </div>
      <h3>Tooltip 气泡提示</h3>
      <div className="states">
        <State title="悬停显示：禁用要说原因"><Tooltip title="不在你的授权范围内"><Button disabled>查看详情</Button></Tooltip></State>
        <State title="常显" className="popup-host-right"><Tooltip title="一周无跟进" open placement="right" getPopupContainer={inCard}><Button>需关注</Button></Tooltip></State>
      </div>
      <h3>Tabs 页签</h3>
      <div className="states wide">
        <State title="默认，含禁用项"><Tabs activeKey={tab} onChange={setTab} items={[{ key: 'visits', label: '拜访', children: '3 条拜访记录' }, { key: 'opps', label: '商机', children: '2 条商机' }, { key: 'contracts', label: '合同', children: '暂无合同' }, { key: 'profit', label: '毛利', disabled: true }]} /></State>
      </div>
      <h3>Collapse 折叠面板</h3>
      <div className="states wide">
        <State title="默认展开第一项"><Collapse defaultActiveKey={['1']} items={[{ key: '1', label: 'AI 依据 2 条', children: <p>9 月 12 日拜访记录：已获得 CIO 支持，预算在四季度审批。</p> }, { key: '2', label: '联系人', children: <p>张总，CIO。</p> }]} /></State>
      </div>
    </div>
  );
}

const DEMOS = {
  Basics: BasicsDemo,
  SbProvider: () => <div className="states"><State title="主色与控件高度来自桥接"><Button type="primary">记录拜访</Button> <Button>创建任务</Button></State><State title="表单字段高 40"><Input placeholder="搜索客户名称或负责人" /></State></div>,
  SbStatusTag: () => <div className="states"><State title="向好"><SbStatusTag tone="good" /></State><State title="需关注"><SbStatusTag tone="watch" /></State><State title="转差"><SbStatusTag tone="bad" /></State><State title="待评估"><SbStatusTag tone="pending" /></State><State title="未登记"><SbStatusTag tone="unset" /></State><State title="带依据"><SbStatusTag tone="watch" reason="一周无跟进" showReason /></State></div>,
  SbStatePanel: () => <div className="states"><State title="加载中"><SbStatePanel state="loading" /></State><State title="骨架"><SbStatePanel state="loading" skeleton /></State><State title="空"><SbStatePanel state="empty" title="没有匹配的客户" description="当前筛选：有风险、本人负责。" onClear={() => {}} /></State><State title="失败"><SbStatePanel state="error" onRetry={() => {}} /></State><State title="无权限"><SbStatePanel state="forbidden" /></State></div>,
  SbFilterBar: () => <div className="states wide"><State title="默认与已选"><FilterDemo /></State><State title="禁用"><FilterDemo disabled /></State></div>,
  SbSearch: () => <div className="states"><State title="默认"><SbSearch /></State><State title="输入中"><SbSearch value="华宸" /></State><State title="加载中"><SbSearch value="华宸" loading /></State><State title="禁用"><SbSearch disabled /></State></div>,
  SbListRow: () => <div className="states"><State title="默认"><SbListRow {...rows[0]} /></State><State title="选中"><SbListRow {...rows[1]} selected /></State><State title="无权限"><SbListRow name="泰和银行数据中心" disabled disabledReason="不在你的授权范围内" /></State></div>,
  SbBottomBar: () => <div className="states wide"><State title="默认"><SbBottomBar primary={{ label: '归档' }} secondary={{ label: '存草稿' }} /></State><State title="处理中"><SbBottomBar primary={{ label: '归档', loading: true, loadingLabel: '归档中…' }} secondary={{ label: '存草稿', disabled: true }} /></State><State title="禁用说原因"><SbBottomBar primary={{ label: '归档', disabled: true, disabledReason: '还有 3 项必填未确认：下一步、客户预算、联系人角色' }} secondary={{ label: '存草稿' }} /></State></div>,
  SbField: () => <Form layout="vertical"><div className="states"><State title="默认"><SbField label="客户名称"><Input value="华宸数据科技" /></SbField></State><State title="必填"><SbField label="下一步" required help="须含时间与目标"><Input placeholder="10 月 8 日前发方案" /></SbField></State><State title="错误"><SbField label="客户预算" required error="请填写客户预算，已保留其余输入"><Input status="error" /></SbField></State><State title="只读"><SbField label="拜访日期" readOnly><Input value="2026-09-19" /></SbField></State><State title="选择与日期"><SbField label="季度"><Select defaultValue="q3" options={[{ value: 'q3', label: '第三季度' }, { value: 'q4', label: '第四季度' }]} /></SbField><SbField label="日期"><DatePicker style={full} /></SbField></State></div></Form>,
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

// 顶部工具条：只看某组件、按名称或规则编号搜索、改主色、重置。
function Toolbar({ only, setOnly, query, setQuery, primary, setPrimary, onReset }) {
  const options = [{ value: 'all', label: '全部展开' }, ...META.map((m) => ({ value: m.id, label: `${m.name} ${m.id}` }))];
  return (
    <div className="tools" role="toolbar" aria-label="目录工具">
      <div className="tool"><span>看</span><Select id="tool-only" showSearch optionFilterProp="label" value={only} onChange={setOnly} options={options} popupMatchSelectWidth={false} className="tool-only" /></div>
      <div className="tool"><span>找</span><Input id="tool-search" allowClear placeholder="组件名或规则编号，如 A-04" value={query} onChange={(e) => setQuery(e.target.value)} className="tool-search" /></div>
      <label className="tool" htmlFor="tool-primary"><span>主色</span><input id="tool-primary" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} /><code>{primary}</code></label>
      <Button id="tool-reset" onClick={onReset}>重置</Button>
    </div>
  );
}

function Catalog({ primary, setPrimary, resetPrimary }) {
  const [only, setOnly] = useState('all');
  const [query, setQuery] = useState('');
  const [usageId, setUsageId] = useState(null);
  const q = query.trim().toLowerCase();
  const hit = (m) => !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.rules.some((r) => r.toLowerCase().includes(q));
  const visible = META.filter((m) => (only === 'all' || m.id === only) && hit(m));
  const usage = usageId ? META.find((m) => m.id === usageId) : null;
  const reset = () => { setOnly('all'); setQuery(''); resetPrimary(); };
  return (
    <div className="cat">
      <nav className="cat-nav">
        <h1>部门组件库<small>Web · Ant Design 6 与 Ant Design X 之上</small></h1>
        {visible.map((m) => <a key={m.id} href={`#${m.id}`}>{m.name}<small>{m.id}</small></a>)}
        {visible.length < META.length && <p className="cat-nav-note">还有 {META.length - visible.length} 个被过滤，点重置全部显示。</p>}
      </nav>
      <main className="cat-main">
        <Toolbar only={only} setOnly={setOnly} query={query} setQuery={setQuery} primary={primary} setPrimary={setPrimary} onReset={reset} />
        <p className="lead">每个组件在每个状态下的真实渲染。第一节是基础控件，直接用 Ant Design 6，不另做封装。后面是规范要求的组合件与 AI 件。主题只来自 tokens.json 生成的桥接文件，改上面的主色，整页一起变。每张卡右上角的用法按钮给出引入与最小用例。</p>
        {visible.length === 0 && <SbStatePanel state="empty" title="没有匹配的组件" description="换个组件名或规则编号试试。" onClear={reset} />}
        {visible.map((m) => { const Demo = DEMOS[m.id]; return (
          <section className="comp" key={m.id} id={m.id}>
            <div className="comp-head"><h2>{m.name}<code>{m.id}</code></h2><Button size="small" className="usage-btn" onClick={() => setUsageId(m.id)}>用法</Button></div>
            <div className="comp-meta"><b>做什么</b><span>{m.purpose}</span><b>规则</b><span>{m.rules.map((r) => <span className="rule" key={r}>{r}</span>)}</span><b>用在哪</b><span>{m.pages}</span><b>属性</b><span>{m.props}</span></div>
            {Demo ? <Demo /> : null}
          </section>); })}
      </main>
      <Modal open={!!usage} title={usage ? `${usage.name} ${usage.id} 的用法` : ''} footer={null} width={720} onCancel={() => setUsageId(null)}>
        <pre className="usage"><code>{usage ? USAGE[usage.id] || '还没有写用法。' : ''}</code></pre>
      </Modal>
    </div>
  );
}

// 主色从 design-tokens.css 读初值；改动时按 palette.mjs 派生十档，同时改 --ui-primary、悬停（第 7 档）、选中底（第 1 档）、焦点（第 5 档）与 antd 的 colorPrimary，重置就删掉覆盖。
const DERIVED = { '--ui-primary': 5, '--ui-primary-hover': 6, '--ui-selected': 0, '--ui-focus': 4 };
const applyPrimary = (v) => { const p = palette(v); for (const [k, i] of Object.entries(DERIVED)) document.documentElement.style.setProperty(k, p[i]); };
const clearPrimary = () => { for (const k of Object.keys(DERIVED)) document.documentElement.style.removeProperty(k); };
const readPrimary = () => (typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue('--ui-primary').trim().toLowerCase());
function Root() {
  const [base, setBase] = useState(readPrimary);
  const [primary, setPrimaryState] = useState(base);
  useEffect(() => { if (!base) { const v = readPrimary(); setBase(v); setPrimaryState(v); } }, [base]);
  const setPrimary = (v) => { applyPrimary(v); setPrimaryState(v); };
  const resetPrimary = () => { clearPrimary(); setPrimaryState(base); };
  const theme = primary && primary !== base ? { token: { colorPrimary: primary, colorInfo: primary, colorLink: primary } } : undefined;
  return (
    <SbProvider theme={theme}>
      <AntApp component={false}><Catalog primary={primary} setPrimary={setPrimary} resetPrimary={resetPrimary} /></AntApp>
    </SbProvider>
  );
}
createRoot(document.getElementById('root')).render(<Root />);
