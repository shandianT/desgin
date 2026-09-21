// 每个组件的引入与最小用例。目录页的用法按钮从这里读，不手写第二份。
// 键与 meta.js 的 id 一致。
const PKG = '@shandiant/ui-react';
const TOKENS = '@shandiant/tokens/css';

export const USAGE = {
  Basics: `import { App, Button, Input, Select } from 'antd';
import { SbProvider } from '${PKG}';
import '${TOKENS}';

// 页面最外层包一次 SbProvider，antd 的主题就来自桥接文件。
// 基础控件直接用 antd，不另封装。
<SbProvider>
  <App>
    <Button type="primary">记录拜访</Button>
    <Input placeholder="客户名称" />
    <Select options={[{ value: 'q3', label: '第三季度' }]} />
  </App>
</SbProvider>

// message 与 notification 在 App 之内用 hook 取，才带主题。
const { message, notification } = App.useApp();
message.success('已归档');
notification.open({ message: '任务已下发', description: '对方拒绝时需填意见。' });`,

  SbProvider: `import { SbProvider } from '${PKG}';
import '${TOKENS}';

<SbProvider>
  <YourApp />
</SbProvider>

// 要覆盖个别 token 时：
<SbProvider theme={{ token: { controlHeight: 40 } }}>
  <YourApp />
</SbProvider>`,

  SbStatusTag: `import { SbStatusTag } from '${PKG}';

<SbStatusTag tone="watch" reason="一周无跟进" showReason />
// tone：good | watch | bad | pending | unset
// 不传 showReason 时，依据放在悬停提示里`,

  SbStatePanel: `import { SbStatePanel } from '${PKG}';

<SbStatePanel state={status} onRetry={reload} onClear={() => setFilters([])}>
  <CustomerList rows={rows} />
</SbStatePanel>
// state：normal | loading | empty | error | forbidden
// normal 时渲染 children；loading 加 skeleton 用骨架`,

  SbFilterBar: `import { SbFilterBar } from '${PKG}';

const options = [
  { value: 'risk', label: '有风险', count: 6 },
  { value: 'mine', label: '本人负责', count: 24 },
];
<SbFilterBar title="客户列表" scope="本人负责" options={options}
  value={selected} onChange={setSelected} resultCount={rows.length} resultLabel="家" />`,

  SbSearch: `import { SbSearch } from '${PKG}';

<SbSearch value={keyword} onChange={setKeyword} onSearch={load}
  placeholder="搜索客户名称或负责人" loading={loading} />`,

  SbListRow: `import { SbListRow } from '${PKG}';

<SbListRow name="华宸数据科技有限公司" summary="客户资产 · 关系 8/10"
  status={{ tone: 'good', reason: '近 30 天有高层拜访' }} time="2 天前跟进"
  selected={id === current} onClick={() => open(id)} />

// 无权限的行：
<SbListRow name="泰和银行数据中心" disabled disabledReason="不在你的授权范围内" />`,

  SbBottomBar: `import { SbBottomBar } from '${PKG}';

<SbBottomBar
  primary={{ label: '归档', onClick: archive, loading: saving,
    disabled: missing.length > 0, disabledReason: '还有 ' + missing.length + ' 项必填未确认' }}
  secondary={{ label: '存草稿', onClick: saveDraft }}
/>`,

  SbField: `import { Form, Input } from 'antd';
import { SbField } from '${PKG}';

<Form layout="vertical">
  <SbField label="下一步" name="next" required help="须含时间与目标" error={errors.next}>
    <Input placeholder="10 月 8 日前发方案" />
  </SbField>
  <SbField label="拜访日期" readOnly>
    <Input value={visit.date} />
  </SbField>
</Form>`,

  SbSheet: `import { Button } from 'antd';
import { SbSheet } from '${PKG}';

<SbSheet open={open} title="选择季度" onClose={() => setOpen(false)}
  footer={<Button type="primary" onClick={apply}>应用</Button>}>
  <QuarterPicker />
</SbSheet>`,

  SbPagination: `import { SbPagination } from '${PKG}';

<SbPagination current={page} total={total} pageSize={20} onChange={setPage} />

// 让用户选每页条数：传 onPageSizeChange 才显示选择器，档位默认 10／20／50
<SbPagination current={page} total={total} pageSize={size} onChange={setPage}
  pageSizeOptions={[10, 20, 50]} onPageSizeChange={(s) => { setSize(s); setPage(1); }} />

// 加载更多模式（手机或动态流）：不显示每页条数
<SbPagination mode="more" loading={loading} end={!hasMore} onLoadMore={loadNext} />`,

  SbMetricTile: `import { SbMetricTile } from '${PKG}';

<SbMetricTile value="1,250,000" label="ACV（元）" note="本季度" />
// 缺失显示未登记，不显示 0：
<SbMetricTile value={null} label="回款（元）" />`,

  SbPageHeader: `import { Button } from 'antd';
import { SbPageHeader } from '${PKG}';

<SbPageHeader title="客户" scope="本人负责 · 24 家"
  actions={<Button type="primary">记录拜访</Button>} />`,

  SbDetailLayout: `import { SbDetailLayout } from '${PKG}';

<SbDetailLayout nav={<SideNav />}
  list={<CustomerList onOpen={() => setOpen(true)} />}
  detail={<CustomerDetail />}
  detailOpen={open} onBack={() => setOpen(false)} />
// 档位按容器宽度自动判断；演示时可传 tier="desktop" | "rail" | "mobile"`,

  SbLabeledSelect: `import { SbLabeledSelect } from '${PKG}';

<SbLabeledSelect label="象限" value={q} onChange={setQ}
  options={[{ value: 'attack', label: '主攻区', count: 9 }, { value: 'asset', label: '客户资产', count: 12 }]} />
// 不传 value 显示「全部」；清空回到「全部」`,

  SbMetricStrip: `import { SbMetricStrip } from '${PKG}';

<SbMetricStrip
  items={[{ key: 'acv', label: '年度合同额 · 万元', value: 1880 }, { key: 'rev', label: '确收 · 万元', value: 138 }, { key: 'cash', label: '回款 · 万元', value: null }]}
  periods={[{ value: 'year', label: '本年' }, { value: 'all', label: '历年' }]} period={period} onPeriodChange={setPeriod}
  caliber="确收按合同签署月，回款按到账月" />`,

  SbTabs: `import { SbTabs } from '${PKG}';

<SbTabs activeKey={tab} onChange={setTab}
  items={[{ key: 'todo', label: '待处理', count: 18 }, { key: 'done', label: '已完成', count: 4 }, { key: 'all', label: '全部', count: 122 }]} />`,

  SbTable: `import { SbTable, SbStatusTag } from '${PKG}';
import { Button } from 'antd';

<SbTable rowKey="id" rows={rows} state={loading ? 'loading' : 'normal'}
  columns={[
    { title: '客户 / 负责人', dataIndex: 'name' },
    { title: '当前状态', key: 'status', render: (_, r) => <SbStatusTag tone={r.tone} reason={r.reason} showReason /> },
    { title: '预算', dataIndex: 'budget', render: (v) => v ?? '未登记' },
  ]}
  actions={(r) => <Button type="link" onClick={() => open(r)}>查看</Button>}
  pagination={{ current: page, total: 124, pageSize: 20, onChange: setPage }}
  onRetry={reload} onClear={clearFilters} />

// 可排序：列上写 sorter（antd 原生），默认只有升、降两档；服务端排序时 sorter 传 true，在 onChange 里拿 sorter.field 与 sorter.order
<SbTable rowKey="id" rows={rows}
  columns={[
    { title: '客户', dataIndex: 'name' },
    { title: '预算（万元）', dataIndex: 'budget', sorter: (a, b) => (a.budget ?? -1) - (b.budget ?? -1) },
    { title: '最近沟通', dataIndex: 'time', sorter: true },
  ]}
  onChange={(_, __, sorter) => reload({ orderBy: sorter.field, order: sorter.order })} />

// 可勾选：rowSelection 原样透传，onChange 回选中的 keys 与行；批量操作放在表格上方
<SbTable rowKey="id" rows={rows} columns={columns}
  rowSelection={{ selectedRowKeys: keys, onChange: (k, selectedRows) => setKeys(k) }}
  actions={(r) => <Button type="link">查看</Button>} />`,

  SbIcon: `import { SbIcon, ICONS } from '${PKG}';

// 传含义名，不传 UserOutlined 这种库里的名字。40 个含义在 ICONS 里
<SbIcon name="customer" />                       // 16px，颜色跟文字
<SbIcon name="risk" tone="warning" size="md" />  // 20px，警告色
<SbIcon name="visit" tile tone="primary" size="lg" label="拜访" />  // 带底色方块，48px

// 图标旁要有字；只有图标时给 label
<Button icon={<SbIcon name="add" />}>记录拜访</Button>
<Button icon={<SbIcon name="search" label="搜索" />} />`,

  SbAiBadge: `import { SbAiBadge } from '${PKG}';

<SbAiBadge state="generating" />
<SbAiBadge state="pending" />
<SbAiBadge state="confirmed" confirmedBy="王明 9 月 19 日 " />`,

  SbAiField: `import { SbAiField } from '${PKG}';

<SbAiField label="联系人角色" required
  value={value} aiValue={draft.role} state={state}
  confidence={draft.roleConfidence} candidates={['CIO', '信息中心主任']}
  onChange={(v) => { setValue(v); setState('edited'); }}
  onConfirm={() => setState('confirmed')}
  onRestore={() => { setValue(draft.role); setState('ai'); }} />
// state：ai | edited | confirmed；confidence 为 low 时留空给候选`,

  SbAiSources: `import { SbAiSources } from '${PKG}';

const items = [
  { key: 1, title: '9 月 12 日拜访记录', description: '已获得 CIO 支持', url: '/visits/1' },
];
<SbAiSources items={items} onClick={(item) => navigate(item.url)} />
// items 为空时不展示结论，只提示没有依据`,

  SbAiProgress: `import { SbAiProgress } from '${PKG}';

<SbAiProgress stages={['转写语音', '提取 16 项基础字段', '核对下一步']}
  current={1} status="running" detail="12/16" onCancel={cancel} onRetry={retry} />
// status：running | cancelled | failed | done`,

  // 0.6.0：顶栏、侧导航、表单壳
  SbSideNav: `import { SbSideNav } from '${PKG}';

const groups = [
  { title: '销售管理', items: [
    { key: 'overview', label: '总览', icon: 'dashboard', path: '/overview' },
    { key: 'customer', label: '客户', icon: 'customer', path: '/customers' },
    { key: 'opportunity', label: '商机', icon: 'opportunity', path: '/opportunities' },
  ] },
  { title: '团队', items: [{ key: 'members', label: '成员', icon: 'team', path: '/members', hidden: !isManager }] },
];
<SbSideNav brand={{ logoSrc: '/brand/logo.svg', alt: '销售小浣熊', href: '/' }}
  workspace={{ name: '企业工作空间', scope: '客户经营与销售协作', onClick: openWorkspace }}
  groups={groups} activeKey={route} onSelect={(key, item) => navigate(item.path)}
  collapsed={collapsed} onCollapse={setCollapsed}
  adminLink={{ label: '运营管理后台', href: 'https://admin.example.com' }}
  account={{ name: '王小明', role: '一线销售', team: '华北一组', onClick: openAccount }} />
// icon 传 SbIcon 的含义名或 ReactNode；hidden 的项不渲染
// 颜色只走 --ui-sidebar* 变量，宽 232，折叠 64`,

  SbTopBar: `import { SbTopBar } from '${PKG}';

<SbTopBar items={[{ label: '销售管理', onClick: () => navigate('/') }, { label: '客户' }]}
  onBack={history.back} status="ready" onCreate={openCreate} createLabel="新建客户"
  onHelp={openHelp} onRefresh={reload} refreshing={loading} />
// status：ready | preview | unavailable | checking；date 不传显示今天
// 有顶栏面包屑的页面不再放 SbPageHeader，主按钮就是这里的「新建」`,

  SbDatePicker: `import { SbDatePicker } from '${PKG}';

<SbDatePicker value={date} onChange={setDate} />
// value 与 onChange 都是 'YYYY-MM-DD' 字符串，快捷项：今天、本周、本季
<SbDatePicker range value={[from, to]} onChange={([a, b]) => setRange(a, b)} />
// 区间：快捷项给整周、整季；disabledDate 透传 antd`,

  SbSelect: `import { SbSelect } from '${PKG}';

<SbSelect value={stage} onChange={setStage} placeholder="选择阶段" width={200}
  options={[{ value: 10, label: '识别', count: 12 }, { value: 30, label: '验证', count: 8 }, { value: 50, label: '方案' }]} />
// count 显示成灰小字；缺省 allowClear=false；筛选场景用 SbLabeledSelect`,

  SbSearchSelect: `import { SbSearchSelect } from '${PKG}';

<SbSearchSelect value={customerId} onChange={(id, opt) => pick(id, opt)} width={280}
  placeholder="输入客户名称搜索" search={async (kw) => (await api.customers({ q: kw })).map((c) => ({ value: c.id, label: c.name }))} />
// 防抖 300ms；下拉里显示「输入关键词搜索 / 正在搜索 / 没有匹配」
// 传 options 不传 search 就是本地过滤`,

  SbAmountInput: `import { SbAmountInput } from '${PKG}';

<SbAmountInput value={amount} onChange={setAmount} />
// 单位默认「万元」，千分位，min 0，precision 2；空回 null 不是 0
<SbAmountInput value={qty} onChange={setQty} unit="台" precision={0} />`,

  SbTextarea: `import { SbTextarea } from '${PKG}';

<SbTextarea value={text} onChange={setText} placeholder="口述这次拜访：见了谁、聊了什么、下一步什么时候做什么" />
// 默认 maxLength 500、showCount、autoSize 3～8 行`,

  SbSegmented: `import { SbSegmented } from '${PKG}';

<SbSegmented value={period} onChange={setPeriod} options={[{ value: 'year', label: '本年' }, { value: 'all', label: '历年' }]} />
// 默认 size="small"；多于 5 项用 SbTabs 或下拉`,

  SbBattleMap: `import { SbBattleMap } from '${PKG}';

const points = [
  { id: 1, name: '华宸数据科技', potential: 8, relationship: 8, tone: 'good', amountBand: 'large', summary: '关系 8/10 · 预算 320 万' },
  { id: 2, name: '北辰智造集团', potential: 7, relationship: 3, tone: 'watch', amountBand: 'medium', summary: '关系 3/10 · 预算 120 万' },
];
<SbBattleMap points={points} unrated={3}
  zoomQuadrant={zoom} onZoomChange={setZoom}
  selectedId={current?.id} onPointClick={(p) => navigate(\`/customers/\${p.id}\`)}
  onClusterClick={(list) => openList(list)} onUnratedClick={() => openUnrated()}
  emptyAction={{ label: '去客户列表', onClick: () => navigate('/customers') }} />
// 横轴潜力、纵轴关系，都是 1～10，分界线默认 5.5；tone 决定点色，amountBand 决定点径；象限不可拖动`,

  SbChartCard: `import { SbChartCard, SbBarChart } from '${PKG}';

// 卡片只是壳：标题写图回答什么问题，范围周期紧挨标题，口径放悬停 ⓘ；图区放 SbBarChart 或 SbLineChart
<SbChartCard title="哪些客户贡献了最多 ACV" scope="本人负责 · 第三季度"
  caliber="ACV 按合同签署月计入" state={loading ? 'loading' : rows.length ? 'normal' : 'empty'}
  onRetry={reload} summary="ACV 排名前十：华宸 320 万元最高，泰和银行未登记"
  data={{ columns: ['客户', 'ACV（万元）'], rows: rows.map((r) => [r.name, r.acv]) }}>
  <SbBarChart categories={rows.map((r) => r.name)} series={[{ name: 'ACV', data: rows.map((r) => r.acv) }]} unit="万元" />
</SbChartCard>
// state：normal | loading | empty | error；空态默认「这个周期还没有数据」`,

  SbKpiCard: `import { SbKpiCard } from '${PKG}';

<SbKpiCard value="1,880" unit="万元" label="年度合同额" change={{ text: '比上季 +12%', tone: 'up', good: true }} onClick={openDetail} />
<SbKpiCard value={24} unit="家" label="客户" change={{ text: '比上季 +2 家', tone: 'up' }} />  // 无好坏：灰
<SbKpiCard value={null} label="回款" note="财务还没登记" />                                  // 缺失：未登记，不显示 0
<SbKpiCard loading label="确收" />                                                          // 正在读取
// change.good：true 绿、false 红、不传灰；tone 只决定箭头`,

  SbBarChart: `import { SbChartCard, SbBarChart } from '${PKG}';

// 横向排名：名字在左、第一条在上、最多 10 条，其余「查看全部」；null 的柱位写「未登记」
<SbChartCard title="哪些客户贡献了最多 ACV" scope="本人负责 · 第三季度">
  <SbBarChart categories={['华宸数据科技', '北辰智造', '泰和银行']}
    series={[{ name: 'ACV', data: [320, 260, null] }]} unit="万元"
    onClick={(i) => openCustomer(i)} onShowAll={openList} />
</SbChartCard>

// 竖向对比，两个系列自动用 chart-1 与 chart-5（本期实色、上期灰）
<SbBarChart orientation="vertical" categories={['7 月', '8 月', '9 月']}
  series={[{ name: '本期', data: [42, 51, 38] }, { name: '上期', data: [30, 44, 40] }]} unit="次" />`,

  SbLineChart: `import { SbChartCard, SbLineChart } from '${PKG}';

<SbChartCard title="毛利率走势" scope="部门 · 近六个月">
  <SbLineChart categories={['4 月', '5 月', '6 月', '7 月', '8 月', '9 月']}
    series={[{ name: '毛利率', data: [18.2, 19.1, null, 20.4, 21.0, 22.3] }]}
    unit="%" yMin={15} area />
</SbChartCard>
// yMin：不从 0 开始时轴上标最小值；null 断开不连线，点位写「未登记」`,
  SbTimeline: `import { SbTimeline } from '${PKG}';

<SbTimeline items={[
  { key: 1, time: '9 月 19 日 14:30', title: '拜访：见了 CIO 张总', description: '预算在四季度审批', tone: 'good', actor: '王小明', onClick: openVisit },
  { key: 2, time: '9 月 12 日', title: '任务被拒绝', description: '对方意见：时间冲突', tone: 'bad' },
  { key: 3, time: '9 月 8 日', title: '商机进入验证 30%', tone: 'neutral' },
]} pending="等待下一次跟进" />
// tone：good | watch | bad | pending | neutral；size="compact" 一行式；loading 骨架；空列表显示 emptyText`,

  SbUpload: `import { SbUpload } from '${PKG}';

const [files, setFiles] = useState([]);
<SbUpload accept=".pdf,.jpg,.png" maxSize={20} maxCount={5} multiple
  value={files} onChange={setFiles}
  request={(file) => api.upload(file).then((r) => ({ url: r.url }))} />
// 不传 request 只维护本地列表，页面提交时再上传
// 超类型、超大小、超数量就地红字说明，不弹 toast；drag 换成拖拽区`,

  SbResult: `import { SbResult, SbMetricStrip } from '${PKG}';

<SbResult status="success" title="拜访已归档" description="Agent 正在按已确认事实重算象限与风险，几分钟后在客户详情里看。"
  primary={{ label: '查看客户', onClick: openCustomer }}
  secondary={{ label: '再记一条', onClick: recordAgain }}
  extra={<SbMetricStrip items={[{ label: '本周拜访', value: 6 }, { label: '待确认', value: 2 }]} />} />
// status：success | error | info | warning`,

  SbAvatar: `import { SbAvatar, avatarInitials } from '${PKG}';

<SbAvatar name="王小明" />                 // 「小明」，主色淡底，32
<SbAvatar name="李雷" size="sm" tone="neutral" />
<SbAvatar name="周玮" src={user.avatarUrl} size="lg" />
<SbAvatar name="薛佳欣" shape="square" />
avatarInitials('王小明')  // '小明'`,
};
