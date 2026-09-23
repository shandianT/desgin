import React, { useEffect, useState } from 'react';
import { palette } from '../../../specs/salesbuddy/02-设计变量与同步链路/palette.mjs';
import { createRoot } from 'react-dom/client';
import * as AntIcons from '@ant-design/icons';
import { App as AntApp, Affix, Avatar, Badge, Button, Carousel, Cascader, Checkbox, Col, Collapse, DatePicker, Divider, Drawer, Dropdown, FloatButton, Form, Image, Input, Mentions, Modal, Popover, Progress, QRCode, Radio, Row, Select, Skeleton, Slider, Space, Spin, Steps, Switch, Table, Tabs, Tag, Tooltip, Transfer, Tree, Typography, Upload } from 'antd';
import '@shandiant/tokens/css';
import { SbSideNav, SbTopBar, SbDatePicker, SbSelect, SbSearchSelect, SbAmountInput, SbTextarea, SbSegmented, SbChartCard, SbKpiCard, SbBarChart, SbLineChart } from '../src/index.js';
import { SbProvider, SbStatusTag, SbStatePanel, SbFilterBar, SbSearch, SbListRow, SbBottomBar, SbField, SbSheet, SbPagination, SbMetricTile, SbPageHeader, SbDetailLayout, SbAiBadge, SbAiField, SbAiSources, SbAiProgress, META, USAGE, ICONS, SbIcon, SbLabeledSelect, SbMetricStrip, SbTabs, SbTable } from '../src/index.js';
import { SbBattleMap, SbTimeline, SbUpload, SbResult, SbAvatar } from '../src/index.js';

const State = ({ title, children, className }) => <div className={className ? `state ${className}` : 'state'}><h4>{title}</h4>{children}</div>;
const rows = [
  { name: '华宸数据科技有限公司', summary: '客户资产 · 关系 8/10 · 地盘 HB-01', status: { tone: 'good', reason: '近 30 天有高层拜访' }, time: '2 天前跟进' },
  { name: '北辰智造集团', summary: '主攻区 · 关系 4/10 · 地盘 HB-01', status: { tone: 'watch', reason: '一周无跟进' }, time: '9 天前跟进' },
  { name: '金桥制造股份有限公司', summary: '客户资产 · 关系 9/10', status: { tone: 'bad', reason: '两周无高层或技术动作' }, time: '16 天前跟进' },
];
const FILTER_OPTS = [{ value: 'risk', label: '有风险', count: 6 }, { value: 'main', label: '主攻区', count: 9 }, { value: 'asset', label: '客户资产', count: 7 }, { value: 'mine', label: '本人负责', count: 24 }];

function FilterDemo({ disabled }) { const [v, setV] = useState(['risk']); return <SbFilterBar title="客户列表" scope="本人负责" options={FILTER_OPTS} value={v} onChange={setV} resultCount={v.length ? 6 : 24} resultLabel="家" disabled={disabled} />; }
function LabeledSelectDemo() { const [multi, setMulti] = useState([]); const [q, setQ] = useState(); const [p, setP] = useState('q3'); const opts = [{ value: 'attack', label: '主攻区', count: 9 }, { value: 'asset', label: '客户资产', count: 12 }, { value: 'spot', label: '见单打单', count: 3 }, { value: 'resource', label: '客户资源', count: 7 }]; return <div className="states"><State title="未选：显示全部"><SbLabeledSelect label="象限" value={q} onChange={setQ} options={opts} /></State><State title="已选，可清空回到全部"><SbLabeledSelect label="周期" value={p} onChange={setP} options={[{ value: 'q3', label: '第三季度' }, { value: 'q4', label: '第四季度' }]} /></State><State title="复选框：勾选后应用；取消保持原条件"><SbLabeledSelect label="象限" mode="multiple" confirmMultiple value={multi} onChange={setMulti} options={opts} /><p>已应用：{multi.join("、") || "全部"}</p></State><State title="多个并排"><div className="inline"><SbLabeledSelect label="象限" value={q} onChange={setQ} options={opts} /><SbLabeledSelect label="计划" options={[{ value: 'y', label: '有 IT 计划' }, { value: 'n', label: '无' }]} /><SbLabeledSelect label="金额" disabled options={[]} /></div></State></div>; }
function MetricStripDemo() { const [period, setPeriod] = useState('year'); const items = [{ key: 'acv', label: '年度合同额 · 万元', value: period === 'year' ? 1880 : 5260 }, { key: 'rev', label: '确收 · 万元', value: period === 'year' ? 138 : 412 }, { key: 'cash', label: '回款 · 万元', value: null, note: '财务还没登记' }, { key: 'cnt', label: '客户', value: 24, note: '比上季 +2 家' }]; return <div className="states wide"><State title="flat 默认：不描边，放在页面自己的容器里，悬停才出底色"><div style={{ background: 'var(--ui-surface)', border: '1px solid var(--ui-line)', borderRadius: 'var(--ui-radius-panel)', padding: 'var(--ui-space-2)' }}><SbMetricStrip items={items.map((m, i) => i < 2 ? { ...m, onClick: () => {} } : m)} /></div></State><State title="带周期与口径"><SbMetricStrip variant="card" items={items} periods={[{ value: 'year', label: '本年' }, { value: 'all', label: '历年' }]} period={period} onPeriodChange={setPeriod} caliber="确收按合同签署月，回款按到账月，缺失显示未登记" /></State><State title="加载中：不显示 0"><SbMetricStrip items={items.slice(0, 3)} loading /></State></div>; }
function TabsDemo() { const [t, setT] = useState('todo'); return <div className="states wide"><State title="带数量"><SbTabs activeKey={t} onChange={setT} items={[{ key: 'todo', label: '待处理', count: 18 }, { key: 'done', label: '已完成', count: 4 }, { key: 'closed', label: '已结束', count: 0 }, { key: 'all', label: '全部', count: 122 }]} /></State><State title="超过 99 与禁用"><SbTabs defaultActiveKey="a" items={[{ key: 'a', label: '客户', count: 240 }, { key: 'b', label: '商机', count: 12 }, { key: 'c', label: '风险', count: 0, disabled: true }]} /></State></div>; }
function TableDemo() { const [state, setState] = useState('normal'); const [page, setPage] = useState(1); const [sortInfo, setSortInfo] = useState('未排序，点表头试试'); const [selected, setSelected] = useState([1]); const data = [{ id: 1, name: '华宸数据科技有限公司', owner: 'HB-01', tone: 'good', reason: '近 30 天有高层拜访', budget: '320 万', budgetNum: 320, time: '2 天前', days: 2 }, { id: 2, name: '北辰智造集团', owner: 'HB-03', tone: 'watch', reason: '一周无跟进', budget: null, budgetNum: null, time: '9 天前', days: 9 }, { id: 3, name: '金桥制造股份有限公司', owner: 'HB-02', tone: 'bad', reason: '预算被砍', budget: '90 万', budgetNum: 90, time: '12 天前', days: 12 }]; const columns = [{ title: '客户 / 负责人', key: 'name', render: (_, r) => <><b>{r.name}</b><br /><small style={{ color: 'var(--ui-secondary)' }}>地盘 {r.owner}</small></> }, { title: '当前状态', key: 's', render: (_, r) => <SbStatusTag tone={r.tone} reason={r.reason} showReason /> }, { title: '预算', dataIndex: 'budget', render: (v) => v ?? <span style={{ color: 'var(--ui-muted)' }}>未登记</span> }, { title: '最近沟通', dataIndex: 'time' }]; return <div className="states wide"><State title="切换状态看四态"><div className="inline" style={{ marginBottom: 8 }}>{['normal', 'loading', 'empty', 'error', 'forbidden'].map((s) => <Button key={s} size="small" type={state === s ? 'primary' : 'default'} onClick={() => setState(s)}>{({ normal: '有数据', loading: '加载中', empty: '空', error: '失败', forbidden: '无权限' })[s]}</Button>)}</div><SbTable rowKey="id" columns={columns} rows={state === 'normal' ? data : []} state={state} actions={(r) => <Button type="link" size="small">查看</Button>} pagination={{ current: page, total: 124, pageSize: 20, onChange: setPage }} onRetry={() => setState('normal')} onClear={() => setState('normal')} emptyTitle="没有匹配的客户" /></State><State title="紧凑"><SbTable rowKey="id" density="compact" columns={columns} rows={data} actions={() => <Button type="link" size="small">查看</Button>} /></State><State title="可排序：列上写 sorter，antd 原生排序，默认只有升、降两档；操作列照旧固定右侧"><SbTable rowKey="id" columns={[columns[0], columns[1], { title: '预算', dataIndex: 'budget', sorter: (a, b) => (a.budgetNum ?? -1) - (b.budgetNum ?? -1), render: (v) => v ?? <span style={{ color: 'var(--ui-muted)' }}>未登记</span> }, { title: '最近沟通', dataIndex: 'time', sorter: (a, b) => a.days - b.days }]} rows={data} actions={() => <Button type="link" size="small">查看</Button>} onChange={(_, __, sorter) => setSortInfo(sorter?.order ? `按「${sorter.column?.title}」${sorter.order === 'ascend' ? '升序' : '降序'}` : '未排序')} /><p className="demo-note">{sortInfo}</p></State><State title="可勾选：rowSelection 透传，onChange 回选中的 keys；批量操作放表格上方"><div className="inline" style={{ marginBottom: 8, alignItems: 'center' }}><Button size="small" disabled={!selected.length}>下发任务</Button><span className="demo-note">已选 {selected.length} 家{selected.length ? `：${selected.join('、')}` : ''}</span></div><SbTable rowKey="id" columns={columns} rows={data} rowSelection={{ selectedRowKeys: selected, onChange: setSelected }} actions={() => <Button type="link" size="small">查看</Button>} pagination={{ current: 1, total: 3, pageSize: 20 }} /></State></div>; }
function PaginationDemo() {
  const [page, setPage] = useState(2); const [size, setSize] = useState(20); const [loading, setLoading] = useState(false); const [count, setCount] = useState(20);
  const more = () => { setLoading(true); setTimeout(() => { setLoading(false); setCount((c) => Math.min(c + 20, 48)); }, 600); };
  return <div className="states"><State title="默认：不传 onPageSizeChange 就没有每页条数"><SbPagination current={2} total={124} /></State><State title="末页"><SbPagination current={7} total={124} /></State><State title={`可选每页条数：第 ${page} 页，每页 ${size} 条，档位默认 10／20／50`}><SbPagination current={page} total={124} pageSize={size} onChange={setPage} onPageSizeChange={(s) => { setSize(s); setPage(1); }} /></State><State title={`加载更多：已显示 ${count}／48 条，不显示每页条数`}><SbPagination mode="more" loading={loading} end={count >= 48} onLoadMore={more} /></State></div>;
}
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
// 复制到剪贴板：优先 navigator.clipboard，file:// 或旧浏览器退回隐藏文本框加 execCommand。
const copyText = (text) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  return new Promise((res, rej) => { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand && document.execCommand('copy'); document.body.removeChild(ta); ok ? res() : rej(new Error('copy')); });
};
const inCard = (n) => n.parentNode;
// 常开的下拉固定在字段下方，不随视口位置翻到上面。
const STAY_BELOW = { points: ['tl', 'bl'], offset: [0, 4], overflow: { adjustX: false, adjustY: false } };

function BasicsDemo() {
  const { message, notification } = AntApp.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('visits');
  const [checked, setChecked] = useState(true);
  const [iconQ, setIconQ] = useState('');
  const iq = iconQ.trim().toLowerCase();
  const icons = iq ? ICONS.filter((ic) => [ic.key, ic.label, ic.antd, ic.tdesign].some((f) => String(f).toLowerCase().includes(iq))) : ICONS;
  const copyIcon = (key) => { const text = `<SbIcon name="${key}" />`; copyText(text).then(() => message.success(`已复制 ${text}`), () => message.error('复制失败，请手动复制')); };
  return (
    <div className="basics">
      <h3>Icon 图标</h3>
      <p className="note">网页用 Ant Design 自带图标的线性一族，小程序用 TDesign 自带的 t-icon，两边风格一致。这里是 40 个常用图标的对照，每个下面写着两端的名字。尺寸三档：16 文字旁，20 图标按钮，24 导航与空态。图标旁必须有字，颜色跟文字走。</p>
      <div className="icon-tools"><Input id="icon-search" allowClear placeholder="按含义搜图标，如「客户」「risk」「calendar」" value={iconQ} onChange={(e) => setIconQ(e.target.value)} prefix={<SbIcon name="search" tone="muted" />} className="icon-search" /><span className="demo-note">{iq ? `匹配 ${icons.length} 个` : `共 ${ICONS.length} 个`}，点一个把 {'<SbIcon name="…" />'} 复制到剪贴板</span></div>
      {icons.length === 0 && <SbStatePanel state="empty" title="没有匹配的图标" description="换个含义词、Ant Design 名或 TDesign 名试试。" onClear={() => setIconQ('')} />}
      <div className="icon-grid">
        {icons.map((ic) => { const I = AntIcons[ic.antd]; return <div className="icon-cell" key={ic.key} role="button" tabIndex={0} title={`复制 <SbIcon name="${ic.key}" />`} onClick={() => copyIcon(ic.key)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyIcon(ic.key); } }}><span className="icon-sizes">{I && <I style={{ fontSize: 'var(--ui-icon-sm)' }} />}{I && <I style={{ fontSize: 'var(--ui-icon-md)' }} />}{I && <I style={{ fontSize: 'var(--ui-icon-lg)', color: 'var(--ui-primary)' }} />}</span><b>{ic.label}<code className="icon-key">{ic.key}</code></b><code>{ic.antd}</code><code>{ic.tdesign}</code></div>; })}
      </div>
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
      <p className="note">这里只演示 antd 原生能力：加载、空数据、固定表头。业务表格一律用 SbTable，它带操作列固定、四态、分页和行高两档，排序与勾选也从它透传。</p>
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
      <p className="note">业务状态用 SbStatusTag，Tag 只做分类标识：象限名、客户层级、部门这类不带好坏的归类。不要用 Tag 的颜色表达进行中、已确认、已拒绝。</p>
      <div className="states">
        <State title="分类标识：象限、层级、部门"><Tag>主攻区</Tag><Tag>客户资产</Tag><Tag>Tier-1</Tag><Tag>渠道销售-南区</Tag></State>
        <State title="可关闭：已选的筛选条件"><Tag closable>主攻区</Tag><Tag closable>本人负责</Tag></State>
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
      <BasicsHowTo />
      <BasicsSpare />
    </div>
  );
}

// 基础控件怎么用：十个常用的 antd 控件，每个几种状态加一句用在哪。全部直接 import antd，颜色来自 SbProvider，不手写。
const STEP_ITEMS = [{ title: '转写语音' }, { title: '核对 16 项字段' }, { title: '确认归档' }];
function BasicsHowTo() {
  const [on, setOn] = useState(true);
  const [stage, setStage] = useState(30);
  const [picked, setPicked] = useState(['华宸数据科技有限公司']);
  const all = CUSTOMERS.slice(0, 3);
  const allChecked = picked.length === all.length, some = picked.length > 0 && !allChecked;
  return (
    <div id="basics-howto" className="basics-howto">
      <h3>基础控件怎么用</h3>
      <p className="note">下面十个控件也直接从 antd 引入，主题来自 SbProvider，不要手写颜色。每张卡写了几种状态和它在销售智助里用在哪。空态不单独展示：空态用 SbStatePanel。</p>
      <div className="states">
        <State title="Switch 开关：用在筛选栏「只看本人负责」、设置页的通知开关"><div className="inline" style={{ alignItems: 'center' }}><Switch checked={on} onChange={setOn} /><span>只看本人负责</span><Switch defaultChecked disabled /><Switch disabled /><Switch loading defaultChecked /></div></State>
        <State title="Radio 单选：商机阶段的五档用按钮样式，表单里的二选一用普通样式"><div className="stack"><Radio.Group optionType="button" buttonStyle="solid" value={stage} onChange={(e) => setStage(e.target.value)} options={[{ value: 10, label: '识别' }, { value: 30, label: '验证' }, { value: 50, label: '方案' }, { value: 70, label: '谈判' }, { value: 90, label: '签约', disabled: true }]} /><Radio.Group defaultValue="first" options={[{ value: 'first', label: '首次拜访' }, { value: 'again', label: '再次拜访' }]} /><Radio.Group disabled defaultValue="a" options={[{ value: 'a', label: '禁用' }]} /></div></State>
        <State title="Checkbox 多选：客户列表批量勾选，表头用半选表示选了一部分"><div className="stack"><Checkbox indeterminate={some} checked={allChecked} onChange={(e) => setPicked(e.target.checked ? all : [])}>全选（已选 {picked.length}／{all.length}）</Checkbox><Checkbox.Group value={picked} onChange={setPicked} options={all.map((c) => ({ value: c, label: c }))} style={{ display: 'flex', flexDirection: 'column', gap: 4 }} /><Checkbox disabled>无权限的客户</Checkbox></div></State>
        <State className="span2" title="Steps 步骤条：拜访确认三步，当前步高亮，出错的步标红"><div className="stack"><Steps size="small" current={1} items={STEP_ITEMS} /><Steps size="small" current={1} status="error" items={STEP_ITEMS} /><Steps size="small" current={3} items={STEP_ITEMS} /></div></State>
        <State title="Progress 进度：线形放任务详情的完成进度，环形放拜访确认的字段完成度"><div className="inline" style={{ alignItems: 'center', gap: 'var(--ui-space-4)' }}><div className="stack" style={{ flex: 1, minWidth: 160 }}><Progress percent={62} size="small" /><Progress percent={100} size="small" /><Progress percent={40} size="small" status="exception" /></div><Progress type="circle" percent={75} size={72} format={() => '12/16'} /><Progress type="circle" percent={100} size={72} /></div></State>
        <State title="Badge 角标：总览的未读通知数、页签上的待处理数、状态点"><div className="inline" style={{ alignItems: 'center', gap: 'var(--ui-space-4)' }}><Badge count={5}><Avatar shape="square" icon={<SbIcon name="notice" />} /></Badge><Badge count={128} overflowCount={99}><Avatar shape="square" icon={<SbIcon name="task" />} /></Badge><Badge dot><Avatar shape="square" icon={<SbIcon name="notice" />} /></Badge><Badge count={0} showZero><Avatar shape="square" icon={<SbIcon name="notice" />} /></Badge><Badge status="processing" text="生成中" /><Badge status="default" text="已结束" /></div></State>
        <State title="Skeleton 骨架：客户详情、总览首屏的加载占位；列表与表格的加载走 SbStatePanel 与 SbTable"><div className="stack"><Skeleton active avatar paragraph={{ rows: 2 }} /><Skeleton.Button active size="small" /></div></State>
        <State title="Spin 转圈：局部刷新与提交中；整块内容的加载用 SbStatePanel"><div className="inline" style={{ alignItems: 'center', gap: 'var(--ui-space-4)' }}><Spin size="small" /><Spin /><Spin tip="正在重算象限…"><div style={{ width: 220, height: 64 }} /></Spin></div></State>
        <State title="Divider 分隔线：详情页分区、动态流里按天分组；同组内靠留白，不用线"><div className="stack"><Divider style={{ margin: 0 }} /><Divider orientation="left" plain style={{ margin: 0 }}>9 月 19 日</Divider><div className="inline" style={{ alignItems: 'center' }}><span>拜访</span><Divider type="vertical" /><span>商机</span><Divider type="vertical" /><span>合同</span></div></div></State>
      </div>
    </div>
  );
}


// 备用控件：还没有业务场景的 16 个 antd 控件，先接好主题放着。每张卡两三种状态，一句可能用在哪。全部直接 import antd，颜色来自 SbProvider。
const TREE_DATA = [
  { title: '南区', key: 'south', children: [{ title: '地盘 HB-01 · 王小明', key: 'HB-01' }, { title: '地盘 HB-02 · 李雷', key: 'HB-02' }, { title: '地盘 HB-03 · 周玮', key: 'HB-03', disabled: true }] },
  { title: '东区', key: 'east', children: [{ title: '地盘 SH-01 · 薛佳欣', key: 'SH-01' }] },
];
const MEMBERS = ['王小明', '李雷', '周玮', '薛佳欣', '金豫玮', '张家涛'].map((n, i) => ({ key: String(i), title: n, description: i < 3 ? '华北一组' : '华东二组' }));
const PHOTO = (label, i) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#e8eef8"/><rect x="24" y="${40 + i * 10}" width="272" height="120" rx="8" fill="#c9d6ec"/><text x="160" y="110" font-size="18" text-anchor="middle" fill="#2c3e5d" font-family="sans-serif">${label}</text></svg>`)}`;
const PHOTOS = ['会议室合影', '方案白板', '机房现场'].map(PHOTO);
const QR_URL = 'https://example.invalid/customer/HC-2026-0001';
function BasicsSpare() {
  const { message } = AntApp.useApp();
  const [range, setRange] = useState([50, 320]);
  const [targetKeys, setTargetKeys] = useState(['0', '1']);
  const [checkedKeys, setCheckedKeys] = useState(['HB-01']);
  const [popOpen, setPopOpen] = useState(false);
  const [files, setFiles] = useState([{ uid: '1', name: '拜访纪要.pdf', status: 'done' }, { uid: '2', name: '现场照片.jpg', status: 'error' }]);
  const menu = { items: [{ key: 'edit', label: '编辑客户', icon: <SbIcon name="edit" /> }, { key: 'task', label: '下发任务', icon: <SbIcon name="task" /> }, { type: 'divider' }, { key: 'archive', label: '移出我的客户', danger: true, icon: <SbIcon name="delete" /> }], onClick: ({ key }) => message.info(`点了 ${key}`) };
  return (
    <div id="basics-spare" className="basics-spare">
      <h3>备用控件：暂无场景，先接好主题</h3>
      <p className="note">这 16 个控件销售智助现在还没有用到，先直接从 antd 引入、接上 SbProvider 的主题放在这里，需要时拿来就是对的颜色和字号。每张卡两三种状态，一句「可能用在哪」是合理的猜想，不是需求。真要用时，先看 15 章选型指南，有部门口径的再包成 Sb 组件。</p>
      <div className="states">
        <State title="Slider 滑块：筛选预算区间、关系等级 1～10"><div className="stack"><Slider min={1} max={10} defaultValue={6} marks={{ 1: '1', 5: '5', 10: '10' }} /><Slider range min={0} max={500} value={range} onChange={setRange} tooltip={{ formatter: (v) => `${v} 万` }} /><span className="demo-note">预算 {range[0]}～{range[1]} 万</span><Slider disabled defaultValue={30} /></div></State>
        <State title="Transfer 穿梭框：给主管分配成员、把客户批量划到另一个地盘"><Transfer dataSource={MEMBERS} targetKeys={targetKeys} onChange={setTargetKeys} render={(m) => m.title} titles={['未分配', '华北一组']} listStyle={{ width: 140, height: 200 }} /></State>
        <State title="Tree 树：组织与地盘层级，可勾选授权范围"><Tree checkable defaultExpandAll treeData={TREE_DATA} checkedKeys={checkedKeys} onCheck={(k) => setCheckedKeys(k)} /><span className="demo-note">已勾 {checkedKeys.length} 项</span></State>
        <State title="Mentions 提及：任务评论里 @ 同事"><div className="stack"><Mentions rows={2} placeholder="输入 @ 提到同事" options={[{ value: '李鹏程', label: '李鹏程' }, { value: '周玮', label: '周玮' }, { value: '薛佳欣', label: '薛佳欣' }]} /><Mentions rows={1} disabled defaultValue="@周玮 请补充客户预算" /></div></State>
        <State title="Image 图片：拜访照片点开放大，多张可左右翻"><Image.PreviewGroup><div className="inline">{PHOTOS.map((src, i) => <Image key={i} src={src} width={96} height={60} style={{ objectFit: 'cover', borderRadius: 'var(--ui-radius-control)' }} alt={`拜访照片 ${i + 1}`} />)}</div></Image.PreviewGroup></State>
        <State title="Popover 气泡：带按钮的就地确认，比 Modal 轻"><div className="inline"><Popover open={popOpen} onOpenChange={setPopOpen} trigger="click" title="移出我的客户？" content={<div className="stack"><span className="demo-note">客户档案保留，只是不再出现在你的列表。</span><div className="inline"><Button size="small" danger type="primary" onClick={() => { setPopOpen(false); message.success('已移出'); }}>移出</Button><Button size="small" onClick={() => setPopOpen(false)}>取消</Button></div></div>}><Button>移出我的客户</Button></Popover><Popover content="预算 320 万，台数 1200"><Button type="text">悬停看潜力依据</Button></Popover></div></State>
        <State title="Dropdown 下拉菜单：列表行的「更多操作」"><div className="inline"><Dropdown menu={menu}><Button icon={<SbIcon name="more" />}>更多</Button></Dropdown><Dropdown.Button menu={menu} type="primary" onClick={() => message.info('主动作')}>记录拜访</Dropdown.Button><Dropdown menu={menu} disabled><Button disabled>无权限</Button></Dropdown></div></State>
        <State title="Collapse 手风琴：客户详情里的联系人、合同、毛利分区，一次只展开一组"><Collapse accordion defaultActiveKey="1" items={[{ key: '1', label: '联系人 3 位', children: <p>张总 CIO、王经理 信息中心、李工 运维。</p> }, { key: '2', label: '合同 1 份', children: <p>2026 年数据中心扩容，已签。</p> }, { key: '3', label: '毛利', children: <p>未登记。</p> }]} /></State>
        <State title="Typography 排版：Title 与 Text 的字号对照变量，正文不小于 14"><div className="stack"><Typography.Title level={4} style={{ margin: 0 }}>页标题 = --ui-text-page</Typography.Title><Typography.Title level={5} style={{ margin: 0 }}>分区标题 = --ui-text-section</Typography.Title><Typography.Text>正文 = --ui-text-body</Typography.Text><Typography.Text type="secondary">次要文字 = --ui-secondary</Typography.Text><Typography.Text type="danger">错误文字 = --ui-danger</Typography.Text><Typography.Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} style={{ margin: 0 }}>Paragraph 段落带省略：今天见了华宸的 IT 总监，聊了明年数据中心扩容的预算，下周三前给方案，同时对方提到四季度还有一笔算力采购，需要我们先给参考报价，再约一次技术交流。</Typography.Paragraph><Typography.Text copyable={{ text: 'HC-2026-0001', tooltips: ['复制客户编号', '已复制'] }} code>HC-2026-0001</Typography.Text></div></State>
        <State title="Space 间距：按钮组、标签组用它排，间距取 8 / 16"><div className="stack"><Space><Button type="primary">记录拜访</Button><Button>创建任务</Button><Button type="text">更多</Button></Space><Space size="large" wrap><Tag>主攻区</Tag><Tag>Tier-1</Tag><Tag>渠道销售-南区</Tag></Space><Space orientation="vertical" size="small"><Typography.Text type="secondary">竖向</Typography.Text><Typography.Text type="secondary">两行</Typography.Text></Space></div></State>
        <State className="span2" title="Grid 栅格：Row 与 Col 12 列，总览的指标卡与图表排版；手机一列"><div className="stack"><Row gutter={[12, 12]}>{[12, 12, 8, 8, 8].map((span, i) => <Col key={i} xs={24} md={span}><div className="grid-cell">md={span}</div></Col>)}</Row><Row gutter={[12, 12]}><Col xs={24} md={16}><div className="grid-cell">图表 md=16</div></Col><Col xs={24} md={8}><div className="grid-cell">列表 md=8</div></Col></Row></div></State>
        <State title="Affix 固钉：长表单的分区导航、批量操作条跟着滚动停在顶部"><div className="affix-box"><Affix offsetTop={8} target={() => document.querySelector('.affix-box')}><div className="affix-bar"><span>已选 3 家</span><Button size="small" type="primary">下发任务</Button></div></Affix><div className="affix-fill">往下滚，操作条停在容器顶部</div></div></State>
        <State title="BackTop 回到顶部：长列表页右下角，滚过一屏才出现"><div className="backtop-box"><div className="affix-fill" style={{ height: 480 }}>往下滚，右下角出现回到顶部</div><FloatButton.BackTop visibilityHeight={80} target={() => document.querySelector('.backtop-box')} style={{ position: 'absolute', insetInlineEnd: 16, bottom: 16 }} /></div></State>
        <State title="QRCode 二维码：分享客户档案给同事扫码，带过期态"><div className="inline" style={{ alignItems: 'flex-start' }}><QRCode value={QR_URL} size={112} /><QRCode value={QR_URL} size={112} status="expired" onRefresh={() => message.info('重新生成')} /><QRCode value={QR_URL} size={112} status="loading" /></div></State>
        <State title="Carousel 走马灯：总览顶部的公告、新手引导三步"><Carousel autoplay dotPosition="bottom" className="carousel-demo">{['本周有 3 家客户超过一周无跟进', '新版拜访确认支持语音口述', '作战地图新增待评估计数'].map((t) => <div key={t}><div className="carousel-slide">{t}</div></div>)}</Carousel></State>
      </div>
    </div>
  );
}

// 0.6.0：顶栏、侧导航、表单壳
const NAV_GROUPS = [
  { title: '销售管理', items: [{ key: 'overview', label: '总览', icon: 'dashboard' }, { key: 'customer', label: '客户', icon: 'customer' }, { key: 'opportunity', label: '商机', icon: 'opportunity' }, { key: 'visit', label: '拜访', icon: 'visit' }, { key: 'task', label: '任务', icon: 'task' }] },
  { title: '经营', items: [{ key: 'map', label: '作战地图', icon: 'map' }, { key: 'board', label: '看板', icon: 'dashboard' }, { key: 'hidden', label: '不显示', icon: 'more', hidden: true }] },
  { title: '团队', items: [{ key: 'members', label: '成员', icon: 'team' }] },
];
function SideNavDemo() {
  const [active, setActive] = useState('customer'); const [collapsed, setCollapsed] = useState(false);
  const common = { brand: { alt: '销售小浣熊', href: '#SbSideNav' }, workspace: { name: '企业工作空间', scope: '客户经营与销售协作' }, groups: NAV_GROUPS, activeKey: active, onSelect: setActive, adminLink: { label: '运营管理后台', href: '#SbSideNav' }, account: { name: '王小明', role: '一线销售', team: '华北一组' } };
  return <div className="states wide"><State title="展开 232：品牌、工作区、分组导航、底部后台链接与账号；点「收起」变窄条"><div style={{ display: 'flex', height: 560, border: '1px solid var(--ui-line)', borderRadius: 'var(--ui-radius-panel)', overflow: 'hidden' }}><SbSideNav {...common} collapsed={collapsed} onCollapse={setCollapsed} /><div style={{ flex: 1, background: 'var(--ui-background)', padding: 'var(--ui-page-gutter)', color: 'var(--ui-secondary)' }}>当前：{active}</div></div></State><State title="折叠窄条 64：只留图标，悬停出提示；账号激活态"><div style={{ display: 'flex', height: 480, border: '1px solid var(--ui-line)', borderRadius: 'var(--ui-radius-panel)', overflow: 'hidden' }}><SbSideNav {...common} collapsed account={{ ...common.account, active: true }} /><div style={{ flex: 1, background: 'var(--ui-background)' }} /></div></State></div>;
}
function TopBarDemo() {
  const crumbs = [{ label: '销售管理', onClick: () => {} }, { label: '客户' }];
  return <div className="states wide"><State title="已连接：返回、面包屑、状态点、日期、新建、帮助、刷新"><SbTopBar items={crumbs} onBack={() => {}} status="ready" onCreate={() => {}} createLabel="新建客户" onHelp={() => {}} onRefresh={() => {}} /></State><State title="演示数据，没有返回，动作区左侧放 extra"><SbTopBar items={[{ label: '总览' }]} status="preview" date="2026年9月21日 周一" extra={<SbSegmented options={[{ value: 'mine', label: '本人' }, { value: 'team', label: '团队' }]} value="mine" />} onCreate={() => {}} onRefresh={() => {}} /></State><State title="服务不可用：新建隐藏，刷新中"><SbTopBar items={crumbs} status="unavailable" onCreate={() => {}} createHidden onHelp={() => {}} onRefresh={() => {}} refreshing /></State><State title="正在检查服务"><SbTopBar items={[{ label: '销售管理' }, { label: '拜访' }, { label: '拜访确认' }]} onBack={() => {}} status="checking" /></State></div>;
}
function DatePickerDemo() {
  const [d, setD] = useState('2026-09-21'); const [r, setR] = useState([null, null]);
  return <div className="states"><State title={`单日，快捷项今天 / 本周 / 本季：${d ?? '空'}`}><SbDatePicker value={d} onChange={setD} /></State><State title={`区间：${r?.[0] ?? '—'} ～ ${r?.[1] ?? '—'}`}><SbDatePicker range value={r} onChange={(v) => setR(v || [null, null])} /></State><State title="禁用"><SbDatePicker value="2026-09-21" disabled /></State></div>;
}
const STAGE_OPTS = [{ value: 10, label: '识别 10%', count: 12 }, { value: 30, label: '验证 30%', count: 8 }, { value: 50, label: '方案 50%', count: 5 }, { value: 70, label: '谈判 70%' }, { value: 90, label: '签约 90%', disabled: true }];
function SelectDemo() {
  const [v, setV] = useState(); const [m, setM] = useState([10, 30]);
  return <div className="states"><State title="未选"><SbSelect placeholder="选择阶段" options={STAGE_OPTS} value={v} onChange={setV} width={200} /></State><State title="已选，带数量灰小字"><SbSelect options={STAGE_OPTS} value={30} width={200} /></State><State title="多选、可清除"><SbSelect mode="multiple" allowClear options={STAGE_OPTS} value={m} onChange={setM} width={260} /></State><State title="禁用"><SbSelect options={STAGE_OPTS} value={50} disabled width={200} /></State></div>;
}
const SEARCH_CUSTOMERS = ['华宸数据科技有限公司', '北辰智造集团', '金桥制造股份有限公司', '泰和银行数据中心', '华北云图科技'];
function SearchSelectDemo() {
  const [v, setV] = useState(); const search = (kw) => new Promise((res) => setTimeout(() => res(SEARCH_CUSTOMERS.filter((c) => c.includes(kw)).map((c, i) => ({ value: `${kw}-${i}`, label: c }))), 600));
  return <div className="states"><State title="远程搜索：试输入「华」或「不存在」"><SbSearchSelect value={v} onChange={setV} search={search} placeholder="输入客户名称搜索" width={260} /></State><State title="静态选项本地过滤"><SbSearchSelect options={SEARCH_CUSTOMERS.map((c) => ({ value: c, label: c }))} placeholder="选人" width={260} /></State><State title="禁用"><SbSearchSelect disabled placeholder="输入客户名称搜索" width={260} /></State></div>;
}
function AmountDemo() {
  const [a, setA] = useState(1234567.5); const [b, setB] = useState(null);
  return <div className="states"><State title={`有值，千分位：${a}`}><SbAmountInput value={a} onChange={setA} /></State><State title={`空是 null 不是 0：${String(b)}`}><SbAmountInput value={b} onChange={setB} /></State><State title="换单位、整数"><SbAmountInput value={120} unit="台" precision={0} /></State><State title="禁用"><SbAmountInput value={88} disabled /></State></div>;
}
function TextareaDemo() {
  const [t, setT] = useState('今天见了华宸的 IT 总监，聊了明年数据中心扩容的预算，下周三前给方案。');
  return <div className="states"><State title="默认：带字数，3～8 行"><SbTextarea placeholder="口述这次拜访：见了谁、聊了什么、下一步什么时候做什么" /></State><State title="有内容"><SbTextarea value={t} onChange={setT} /></State><State title="禁用"><SbTextarea value={t} disabled /></State></div>;
}
function SegmentedDemo() {
  const [p, setP] = useState('year');
  return <div className="states"><State title="默认 small"><SbSegmented options={[{ value: 'year', label: '本年' }, { value: 'all', label: '历年' }]} value={p} onChange={setP} /></State><State title="带禁用项"><SbSegmented options={[{ value: 'list', label: '列表' }, { value: 'map', label: '地图' }, { value: 'kanban', label: '看板', disabled: true }]} value="list" /></State><State title="中号、撑满"><SbSegmented size="middle" block options={[{ value: 'mine', label: '本人' }, { value: 'team', label: '团队' }, { value: 'dept', label: '部门' }]} value="team" /></State></div>;
}

// 作战地图：24 个点四种状态三种档位，含几组重叠；放大态受控；空态；手机 360px
const BMAP_NAMES = ['华宸数据科技', '北辰智造集团', '金桥制造股份', '泰和银行数据中心', '云启物流', '海晟半导体', '恒润能源', '中科智算', '广汇建设', '星河教育', '嘉信医疗', '远达通信', '博源化工', '润泽水务', '联创汽车', '鼎新食品', '盛世传媒', '天成地产', '瑞丰农业', '安泰保险', '凌云航空', '国泰纺织', '锦程酒店', '正大电子'];
const BMAP_POINTS = BMAP_NAMES.map((name, i) => {
  const grid = [[8, 8], [8, 8], [8.2, 7.9], [9, 9], [7, 7], [6, 9], [8, 3], [8, 3], [7, 4], [9, 2], [6, 5], [7, 2], [3, 8], [2, 9], [3, 8.1], [4, 7], [5, 6], [2, 2], [3, 3], [4, 2], [2, 4], [5, 5], [1, 1], [3, 5]];
  const tone = ['good', 'watch', 'bad', 'pending'][i % 4], band = ['small', 'medium', 'large'][i % 3];
  return { id: i + 1, name, potential: grid[i][0], relationship: grid[i][1], tone, amountBand: band, summary: `关系 ${Math.round(grid[i][1])}/10 · 预算 ${[60, 120, 320][i % 3]} 万` };
});
function BattleMapDemo() {
  const [zoom, setZoom] = useState('asset');
  const [selected, setSelected] = useState(4);
  const [last, setLast] = useState('');
  return <div className="states">
    <State title="默认：24 家，四种状态、三档金额，三组重叠聚成数字；点客户选中"><SbBattleMap points={BMAP_POINTS} unrated={3} selectedId={selected} onPointClick={(p) => { setSelected(p.id); setLast(`点了 ${p.name}`); }} onClusterClick={(list) => setLast(`展开 ${list.length} 家：${list.map((p) => p.name).join('、')}`)} onUnratedClick={() => setLast('打开待评估列表')} /><p className="cat-nav-note">{last || '点一个点、一个数字圆或「待评估」看回调'}</p></State>
    <State title="放大一个象限（受控 zoomQuadrant）"><div className="inline" style={{ marginBottom: 8 }}>{[['asset', '客户资产'], ['attack', '主攻区'], ['resource', '客户资源'], ['spot', '见单打单'], [null, '全部']].map(([v, l]) => <Button key={String(v)} size="small" type={zoom === v ? 'primary' : 'default'} onClick={() => setZoom(v)}>{l}</Button>)}</div><SbBattleMap points={BMAP_POINTS} zoomQuadrant={zoom} onZoomChange={setZoom} onPointClick={(p) => setLast(`点了 ${p.name}`)} /></State>
    <State title="等分分类布局：阈值 7，四区相同大小；评分和分类不变"><SbBattleMap points={BMAP_POINTS} thresholds={{potential: 7, relationship: 7}} layout="equal" /></State>
    <State title="空：坐标轴照画"><SbBattleMap points={[]} emptyAction={{ onClick: () => setLast('去客户列表') }} /></State>
    <State title="加载中"><SbBattleMap loading /></State>
    <State title="手机 360px：格子名两个字，底部四个数字"><div style={{ maxWidth: 360 }}><SbBattleMap points={BMAP_POINTS} unrated={3} onPointClick={(p) => setLast(`点了 ${p.name}`)} /></div></State>
  </div>;
}

function ChartsDemo() {
  const [state, setState] = useState('normal');
  const rank = { categories: ['华宸数据科技', '北辰智造集团', '金桥制造股份', '泰和银行数据中心', '云启软件', '恒信物流'], data: [320, 260, 180, null, 96, 40] };
  const months = ['4 月', '5 月', '6 月', '7 月', '8 月', '9 月'];
  return (
    <div className="states wide">
      <State title="KPI 一行四张：单位小一号跟在数字后，升绿降红只在有好坏时用，客户数这类无好坏用灰，缺失显示未登记">
        <div className="sb-kpi-row">
          <SbKpiCard value="1,880" unit="万元" label="年度合同额" change={{ text: '比上季 +12%', tone: 'up', good: true }} onClick={() => {}} />
          <SbKpiCard value="138" unit="万元" label="确收" change={{ text: '比上季 −3%', tone: 'down', good: false }} />
          <SbKpiCard value={24} unit="家" label="客户" change={{ text: '比上季 +2 家', tone: 'up' }} />
          <SbKpiCard value={null} label="回款" note="财务还没登记" />
        </div>
      </State>
      <State title="横向排名条形：名字在左、第一条在上、缺失的柱位写未登记；卡片带口径、读屏摘要与数据表">
        <SbChartCard title="哪些客户贡献了最多 ACV" scope="本人负责 · 第三季度" caliber="ACV 按合同签署月计入，未签合同不计" summary="ACV 排名前六：华宸数据科技 320 万元最高，泰和银行数据中心未登记" data={{ columns: ['客户', 'ACV（万元）'], rows: rank.categories.map((c, i) => [c, rank.data[i]]) }}>
          <SbBarChart categories={rank.categories} series={[{ name: 'ACV', data: rank.data }]} unit="万元" onClick={() => {}} />
        </SbChartCard>
      </State>
      <State title="竖向柱状，两个系列自动用 chart-1 与 chart-5（本期实色、上期灰），图例在图上方左侧">
        <SbChartCard title="每月跟进数够不够" scope="团队 · 近六个月" caliber="按拜访确认归档日统计">
          <SbBarChart orientation="vertical" categories={months} series={[{ name: '本期', data: [42, 51, 38, 60, null, 47] }, { name: '上期', data: [30, 44, 40, 52, 49, 35] }]} unit="次" />
        </SbChartCard>
      </State>
      <State title="折线：不从 0 开始时轴上标最小值；缺失断开并写未登记">
        <SbChartCard title="毛利率走势" scope="部门 · 近六个月">
          <SbLineChart categories={months} series={[{ name: '毛利率', data: [18.2, 19.1, null, 20.4, 21.0, 22.3] }]} unit="%" yMin={15} area />
        </SbChartCard>
      </State>
      <State title="空态与加载态：空态说原因，失败可重试且不清筛选">
        <div className="inline" style={{ marginBottom: 8 }}>{['normal', 'loading', 'empty', 'error'].map((s) => <Button key={s} size="small" type={state === s ? 'primary' : 'default'} onClick={() => setState(s)}>{({ normal: '有数据', loading: '加载中', empty: '空', error: '失败' })[s]}</Button>)}</div>
        <SbChartCard title="本季毛利够不够" scope="本人 · 第三季度" state={state} onRetry={() => setState('normal')} emptyDescription="还没有已确认的合同，归档拜访并录入合同后再看。">
          <SbBarChart orientation="vertical" categories={['7 月', '8 月', '9 月']} series={[{ name: '毛利', data: [12, 18, 9] }]} unit="万元" />
        </SbChartCard>
      </State>
    </div>
  );
}

// 0.6.0：时间轴、附件上传、结果页、头像
const TL_ITEMS = [
  { key: 1, time: '9 月 19 日 14:30', title: '拜访：见了 CIO 张总', description: '已获得 CIO 支持，预算在四季度审批', tone: 'good', actor: '王小明' },
  { key: 2, time: '9 月 15 日', title: '任务「补充客户预算」被拒绝', description: '对方意见：预算还没批，下周再填', tone: 'bad', actor: '李雷' },
  { key: 3, time: '9 月 12 日', title: '一周无跟进，转为需关注', tone: 'watch' },
  { key: 4, time: '9 月 8 日', title: '商机进入验证 30%', description: '数据中心扩容，预算 320 万', tone: 'neutral', actor: '王小明' },
];
function TimelineDemo() {
  const [last, setLast] = useState('');
  return <div className="states"><State title="默认：时间小灰字、标题、说明、记录人；节点色由 tone 决定"><SbTimeline items={TL_ITEMS} /></State><State title="可点进：传 onClick 的条目整块可点，悬停标题变主色"><SbTimeline items={TL_ITEMS.slice(0, 3).map((it) => ({ ...it, onClick: (x) => setLast(`打开：${x.title}`) }))} /><p className="demo-note">{last || '点一条看回调'}</p></State><State title="末尾「进行中」占位"><SbTimeline items={TL_ITEMS.slice(0, 2)} pending="等待下一次跟进，下一步：10 月 8 日前发方案" /></State><State title="倒序：最早的在上"><SbTimeline items={TL_ITEMS.slice(0, 3)} reverse /></State><State title="紧凑：一行式，只留时间与标题，放列表行展开区"><SbTimeline items={TL_ITEMS} size="compact" /></State><State title="加载中与空"><div className="stack"><SbTimeline loading /><SbTimeline items={[]} emptyText="还没有跟进记录，记一次拜访后这里会出现。" /></div></State></div>;
}
function UploadDemo() {
  const [a, setA] = useState([{ uid: 'a1', name: '拜访纪要.pdf', size: 245760, status: 'done', url: '#' }]);
  const [b, setB] = useState([]);
  const [c, setC] = useState([{ uid: 'c1', name: '合同扫描件.pdf', size: 1258291, status: 'uploading' }, { uid: 'c2', name: '现场照片.jpg', size: 3145728, status: 'error' }]);
  const slowUpload = (file) => new Promise((res) => setTimeout(() => res({ url: `#${file.name}` }), 1200));
  return <div className="states"><State title="点击：只做本地列表，页面提交时再上传；说明按 accept 与 maxSize 生成"><SbUpload accept=".pdf,.jpg,.png" maxSize={20} maxCount={5} multiple value={a} onChange={setA} /></State><State title="拖拽区，带 request：选文件后 1.2 秒上传完成"><SbUpload drag accept=".pdf,.jpg,.png" maxSize={20} multiple value={b} onChange={setB} request={slowUpload} /></State><State title="上传中与失败：失败留在列表里，可删除后重传"><SbUpload accept=".pdf,.jpg" maxSize={20} value={c} onChange={setC} /></State><State title="超限就地说明：这里限 1 个、2MB、只收 pdf，试着选第二个或选张图"><SbUpload accept=".pdf" maxSize={2} maxCount={1} value={a} onChange={setA} /></State><State title="禁用"><SbUpload accept=".pdf" value={a} disabled hint="归档后不能再改附件" /></State></div>;
}
function ResultDemo() {
  const strip = <SbMetricStrip items={[{ key: 'w', label: '本周拜访', value: 6 }, { key: 'p', label: '待确认字段', value: 0 }, { key: 'n', label: '下一步', value: null, note: '10 月 8 日前发方案' }]} />;
  return <div className="states wide"><State title="成功：拜访已归档，主按钮查看客户、次按钮再记一条，extra 放三个数字"><div className="result-box"><SbResult status="success" title="拜访已归档" description="Agent 正在按已确认事实重算象限与风险，几分钟后在客户详情里看。" primary={{ label: '查看客户', onClick: () => {} }} secondary={{ label: '再记一条', onClick: () => {} }} extra={strip} /></div></State><div className="states"><State title="失败：保留输入，可重试"><div className="result-box"><SbResult status="error" title="归档失败" description="网络或服务暂时不可用，你的输入已保留。" primary={{ label: '重试', onClick: () => {} }} secondary={{ label: '存草稿', onClick: () => {} }} /></div></State><State title="提示"><div className="result-box"><SbResult status="info" title="草稿已保存" description="回到列表后可以从「我的草稿」继续。" primary={{ label: '回到列表', onClick: () => {} }} /></div></State><State title="警示：还差 3 项必填"><div className="result-box"><SbResult status="warning" title="还有 3 项必填未确认" description="下一步、客户预算、联系人角色。" primary={{ label: '回去补充', onClick: () => {} }} /></div></State><State title="主按钮处理中"><div className="result-box"><SbResult status="success" title="拜访已归档" primary={{ label: '查看客户', loading: true }} /></div></State></div></div>;
}
function AvatarDemo() {
  return <div className="states"><State title="取字：中文去姓取后两字，两字原样，英文取前两个字母，空显示「我」"><div className="inline" style={{ alignItems: 'center' }}><SbAvatar name="王小明" /><SbAvatar name="李雷" /><SbAvatar name="欧阳修文" /><SbAvatar name="zhangjt" /><SbAvatar name="" /></div><p className="demo-note">王小明 → 小明，李雷 → 李雷，欧阳修文 → 修文，zhangjt → ZH</p></State><State title="图片：有 src 用图，加载失败退回取字"><div className="inline" style={{ alignItems: 'center' }}><SbAvatar name="周玮" src={PHOTOS[0]} /><SbAvatar name="周玮" src="data:," /></div></State><State title="三档 24 / 32 / 40：sm 列表里、md 侧栏与记录人、lg 详情页头"><div className="inline" style={{ alignItems: 'center' }}><SbAvatar name="王小明" size="sm" /><SbAvatar name="王小明" size="md" /><SbAvatar name="王小明" size="lg" /></div></State><State title="底色档：默认主色淡底；其余只在有业务含义时用"><div className="inline" style={{ alignItems: 'center' }}><SbAvatar name="王小明" tone="primary" /><SbAvatar name="李雷" tone="neutral" /><SbAvatar name="周玮" tone="success" /><SbAvatar name="薛佳欣" tone="warning" /><SbAvatar name="金豫玮" tone="danger" /><span className="sidebar-chip"><SbAvatar name="王小明" tone="sidebar" /></span></div></State><State title="方形与一行人"><div className="inline" style={{ alignItems: 'center' }}><SbAvatar name="王小明" shape="square" /><SbAvatar name="李雷" shape="square" size="lg" /><Avatar.Group max={{ count: 3 }}><SbAvatar name="王小明" /><SbAvatar name="李雷" tone="neutral" /><SbAvatar name="周玮" tone="success" /><SbAvatar name="薛佳欣" /></Avatar.Group></div></State></div>;
}

const DEMOS = {
  SbChartCard: ChartsDemo,
  SbKpiCard: ChartsDemo,
  SbBarChart: ChartsDemo,
  SbLineChart: ChartsDemo,
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
  SbPagination: PaginationDemo,
  SbMetricTile: () => <div className="states"><State title="有值"><SbMetricTile value="1,250,000" label="ACV（元）" note="本季度" /></State><State title="缺失"><SbMetricTile value={null} label="回款（元）" note="不显示 0" /></State></div>,
  SbPageHeader: () => <div className="states wide"><State title="默认"><SbPageHeader title="客户" scope="本人负责 · 24 家" actions={<><Button type="primary">记录拜访</Button><Button>创建任务</Button></>} /></State></div>,
  SbDetailLayout: () => <div className="states wide"><State title="电脑 >900：三栏并排"><LayoutDemo tier="desktop" /></State><State title="收紧 601～900：图标导航，列表或详情"><div style={{ maxWidth: 760 }}><LayoutDemo tier="rail" /></div></State><State title="手机 ≤600：底部导航，点一行整页进详情"><div style={{ maxWidth: 390 }}><LayoutDemo tier="mobile" /></div></State></div>,
  SbLabeledSelect: LabeledSelectDemo,
  SbMetricStrip: MetricStripDemo,
  SbTabs: TabsDemo,
  SbTable: TableDemo,
  SbBattleMap: BattleMapDemo,
  SbIcon: () => <div className="states"><State title="三档尺寸：16 文字旁，20 图标按钮，24 导航与空态"><div className="inline"><SbIcon name="customer" size="sm" /><SbIcon name="customer" size="md" /><SbIcon name="customer" size="lg" /></div></State><State title="语义色：只给业务状态"><div className="inline"><SbIcon name="success" tone="success" size="md" /><SbIcon name="risk" tone="warning" size="md" /><SbIcon name="fail" tone="danger" size="md" /><SbIcon name="info" tone="muted" size="md" /></div></State><State title="带底方块：导航、空态、指标卡"><div className="inline"><SbIcon name="customer" tile tone="primary" size="lg" label="客户" /><SbIcon name="opportunity" tile size="md" label="商机" /><SbIcon name="risk" tile tone="warning" size="md" label="风险" /><SbIcon name="ai" tile tone="primary" size="sm" label="AI" /></div></State><State title="和文字一起"><div className="inline"><Button type="primary" icon={<SbIcon name="add" />}>记录拜访</Button><Button icon={<SbIcon name="filter" />}>筛选</Button><Button icon={<SbIcon name="search" label="搜索" />} /></div></State></div>,
  SbAiBadge: () => <div className="states"><State title="生成中"><SbAiBadge state="generating" /></State><State title="待确认"><SbAiBadge state="pending" /></State><State title="已确认"><SbAiBadge state="confirmed" confirmedBy="王明 9 月 19 日 " /></State></div>,
  SbAiField: () => <div className="states"><State title="AI 原值，待确认"><AiFieldDemo state="ai" /></State><State title="人已修改，可恢复"><AiFieldDemo state="edited" /></State><State title="已确认"><AiFieldDemo state="confirmed" /></State><State title="低把握，给候选"><AiFieldDemo state="ai" confidence="low" /></State><State title="错误"><AiFieldDemo state="ai" error="联系人角色不能为空" /></State></div>,
  SbAiSources: () => <div className="states"><State title="折叠"><SbAiSources items={SOURCES} /></State><State title="展开"><SbAiSources items={SOURCES} defaultExpanded /></State><State title="无依据"><SbAiSources items={[]} /></State></div>,
  SbAiProgress: () => { const stages = ['转写语音', '提取 16 项基础字段', '核对「下一步」是否含时间与目标']; return <div className="states"><State title="进行中"><SbAiProgress stages={stages} current={1} detail="12/16" onCancel={() => {}} /></State><State title="已取消"><SbAiProgress stages={stages} current={1} status="cancelled" /></State><State title="失败"><SbAiProgress stages={stages} current={0} status="failed" onRetry={() => {}} /></State><State title="完成"><SbAiProgress stages={stages} current={3} status="done" /></State></div>; },
  // 0.6.0：顶栏、侧导航、表单壳
  SbSideNav: SideNavDemo,
  SbTopBar: TopBarDemo,
  SbDatePicker: DatePickerDemo,
  SbSelect: SelectDemo,
  SbSearchSelect: SearchSelectDemo,
  SbAmountInput: AmountDemo,
  SbTextarea: TextareaDemo,
  SbSegmented: SegmentedDemo,
  // 0.6.0：时间轴、附件上传、结果页、头像
  SbTimeline: TimelineDemo,
  SbUpload: UploadDemo,
  SbResult: ResultDemo,
  SbAvatar: AvatarDemo,
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
        {visible.map((m) => <React.Fragment key={m.id}><a href={`#${m.id}`}>{m.name}<small>{m.id}</small></a>{m.id === 'Basics' && <><a href="#basics-howto" className="cat-nav-sub">基础控件怎么用</a><a href="#basics-spare" className="cat-nav-sub">备用控件</a></>}</React.Fragment>)}
        {visible.length < META.length && <p className="cat-nav-note">还有 {META.length - visible.length} 个被过滤，点重置全部显示。</p>}
      </nav>
      <main className="cat-main">
        <Toolbar only={only} setOnly={setOnly} query={query} setQuery={setQuery} primary={primary} setPrimary={setPrimary} onReset={reset} />
        <p className="lead">每个组件在每个状态下的真实渲染。第一节是基础控件，直接用 Ant Design 6，不另做封装。后面是规范要求的组合件与 AI 件。主题只来自 tokens.json 生成的桥接文件，改上面的主色，整页一起变。每张卡右上角的用法按钮给出引入与最小用例。拿不准该用上游控件还是部门组件，看 <a href="../../15-组件选型指南.md" target="_top">15 章组件选型指南</a>。</p>
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
