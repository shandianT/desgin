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

<SbPagination current={page} total={total} pageSize={20} onChange={setPage} />`,

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
};
