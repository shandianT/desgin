// 部门 Web 组件库的类型声明。与 src/ 里各组件的属性一一对应，改组件属性时同步改这里；tools/check.mjs 会核对导出名。
import type React from 'react';
import type { ReactNode, MouseEventHandler } from 'react';
import type { ThemeConfig } from 'antd';

/** 状态标签的四色加未登记（B-01） */
export type SbTone = 'good' | 'watch' | 'bad' | 'pending' | 'unset';
/** 四态面板的状态（C-06） */
export type SbPanelState = 'normal' | 'loading' | 'empty' | 'error' | 'forbidden';
/** AI 标识的三态（A-02） */
export type SbAiState = 'generating' | 'pending' | 'confirmed';
/** 待确认字段的三态（A-04） */
export type SbAiFieldState = 'ai' | 'edited' | 'confirmed';
/** 生成过程的状态（A-09） */
export type SbAiProgressStatus = 'running' | 'cancelled' | 'failed' | 'done';
/** 三段布局的档位（T-03） */
export type SbLayoutTier = 'desktop' | 'rail' | 'mobile';

export interface SbProviderProps {
  children?: ReactNode;
  /** 覆盖桥接主题：token 与桥接文件合并，components 原样传给 antd */
  theme?: Pick<ThemeConfig, 'token' | 'components'>;
}
export declare function SbProvider(props: SbProviderProps): JSX.Element;

export interface SbStatusTagProps {
  tone?: SbTone;
  /** 不传时按 tone 显示向好、需关注、转差、待评估、未登记 */
  label?: string;
  /** 依据。showReason 为 false 时放在悬浮提示里 */
  reason?: string;
  showReason?: boolean;
}
export declare function SbStatusTag(props: SbStatusTagProps): JSX.Element;

export interface SbStatePanelProps {
  state?: SbPanelState;
  title?: ReactNode;
  description?: ReactNode;
  /** error 态的重试。不清除已选条件 */
  onRetry?: () => void;
  /** empty 态的清除条件 */
  onClear?: () => void;
  /** loading 态用骨架屏而不是转圈 */
  skeleton?: boolean;
  /** state 为 normal 时渲染 */
  children?: ReactNode;
}
export declare function SbStatePanel(props: SbStatePanelProps): JSX.Element | null;

export interface SbFilterOption {
  value: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}
export interface SbFilterBarProps {
  title?: string;
  /** 范围名，显示在标题旁（B-05） */
  scope?: string;
  options?: SbFilterOption[];
  /** 已选 value 数组 */
  value?: string[];
  onChange?: (value: string[]) => void;
  resultCount?: number;
  /** 结果的量词，默认「条」 */
  resultLabel?: string;
  disabled?: boolean;
  /** 放在筛选片之后的额外内容 */
  extra?: ReactNode;
}
export declare function SbFilterBar(props: SbFilterBarProps): JSX.Element;

export interface SbSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}
export declare function SbSearch(props: SbSearchProps): JSX.Element;

export interface SbListRowProps {
  name: ReactNode;
  summary?: ReactNode;
  status?: SbStatusTagProps;
  time?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  /** 禁用时显示在摘要位置 */
  disabledReason?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}
export declare function SbListRow(props: SbListRowProps): JSX.Element;

export interface SbBottomBarAction {
  label: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
}
export interface SbBottomBarPrimary extends SbBottomBarAction {
  loading?: boolean;
  /** 处理中显示的文字，默认「处理中…」 */
  loadingLabel?: ReactNode;
  /** 禁用原因，显示在按钮旁并作悬浮提示 */
  disabledReason?: string;
}
export interface SbBottomBarProps {
  primary?: SbBottomBarPrimary;
  secondary?: SbBottomBarAction;
  /** 与主操作无关的说明 */
  reason?: ReactNode;
}
export declare function SbBottomBar(props: SbBottomBarProps): JSX.Element;

export interface SbFieldProps {
  label?: ReactNode;
  name?: string;
  required?: boolean;
  /** 错误文案，就地显示 */
  error?: ReactNode;
  help?: ReactNode;
  /** 只读态直接显示 children 的 value */
  readOnly?: boolean;
  /** 预留给表单校验规则，当前不参与渲染 */
  rules?: unknown[];
  children?: ReactNode;
}
export declare function SbField(props: SbFieldProps): JSX.Element;

export interface SbSheetProps {
  open?: boolean;
  title?: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  height?: number | string;
  children?: ReactNode;
}
export declare function SbSheet(props: SbSheetProps): JSX.Element;

export interface SbPaginationProps {
  current?: number;
  total?: number;
  pageSize?: number;
  onChange?: (page: number, pageSize: number) => void;
}
export declare function SbPagination(props: SbPaginationProps): JSX.Element;

export interface SbMetricTileProps {
  /** 空或 null 显示 missingText，不显示 0（B-03） */
  value?: ReactNode;
  label?: ReactNode;
  note?: ReactNode;
  missingText?: string;
  /** 跟在说明后面，比如「可点进」的箭头 */
  labelSuffix?: ReactNode;
}
export declare function SbMetricTile(props: SbMetricTileProps): JSX.Element;

export interface SbPageHeaderProps {
  title?: ReactNode;
  scope?: string;
  actions?: ReactNode;
}
export declare function SbPageHeader(props: SbPageHeaderProps): JSX.Element;

export interface SbDetailLayoutProps {
  nav?: ReactNode;
  list?: ReactNode;
  detail?: ReactNode;
  /** 窄屏下显示详情而不是列表 */
  detailOpen?: boolean;
  onBack?: () => void;
  /** 强制档位，演示用；不传按容器宽度判断 */
  tier?: SbLayoutTier;
}
export declare function SbDetailLayout(props: SbDetailLayoutProps): JSX.Element;

export interface SbLabeledSelectOption { value: string | number; label: ReactNode; count?: number; disabled?: boolean }
export interface SbLabeledSelectProps {
  label: ReactNode;
  value?: string | number | Array<string | number>;
  options?: SbLabeledSelectOption[];
  onChange?: (value: any) => void;
  /** 没选时显示的字，默认「全部」 */
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  mode?: 'multiple' | 'tags';
  width?: number | string;
  className?: string;
}
export declare function SbLabeledSelect(props: SbLabeledSelectProps): JSX.Element;

export interface SbMetricStripItem { key?: string; label: ReactNode; value?: ReactNode; note?: ReactNode; missingText?: string; /** 传了就整张卡可点，进明细 */ onClick?: () => void; ariaLabel?: string }
export interface SbMetricStripProps {
  items?: SbMetricStripItem[];
  periods?: Array<{ value: string | number; label: ReactNode }>;
  period?: string | number;
  onPeriodChange?: (value: any) => void;
  /** 统计口径，显示在提示图标的悬停里 */
  caliber?: ReactNode;
  /** 放在周期切换左边的额外控件，比如年份下拉 */
  extra?: ReactNode;
  loading?: boolean;
  columns?: number;
  /** flat 默认：一行放下，说明在左数字在右；card：每张描边、数字在上 */
  variant?: 'flat' | 'card';
  className?: string;
}
export declare function SbMetricStrip(props: SbMetricStripProps): JSX.Element;

export interface SbTabsItem { key: string; label: ReactNode; count?: number; children?: ReactNode; disabled?: boolean }
export interface SbTabsProps {
  items?: SbTabsItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}
export declare function SbTabs(props: SbTabsProps): JSX.Element;

export interface SbTableProps<T = any> {
  columns?: any[];
  rows?: T[];
  rowKey?: string | ((row: T) => string);
  state?: SbPanelState;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  onRetry?: () => void;
  onClear?: () => void;
  /** 操作列，固定在最右 */
  actions?: (row: T) => ReactNode;
  actionsWidth?: number;
  pagination?: SbPaginationProps;
  expandable?: any;
  density?: 'default' | 'compact';
  onRowClick?: (row: T) => void;
  scrollX?: number | string;
  /** 分组表格时，后面几组传 false，只留第一组的表头 */
  showHeader?: boolean;
  className?: string;
}
export declare function SbTable<T = any>(props: SbTableProps<T>): JSX.Element;

export type SbIconSize = 'sm' | 'md' | 'lg';
export type SbIconTone = 'default' | 'secondary' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
export interface SbIconProps {
  /** 含义名，见 ICONS：customer、visit、risk… */
  name: string;
  size?: SbIconSize;
  tone?: SbIconTone;
  /** 套一个带底色的圆角方块 */
  tile?: boolean;
  /** 只有图标没有文字时必须给 */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function SbIcon(props: SbIconProps): JSX.Element | null;

export interface SbAiBadgeProps {
  state?: SbAiState;
  /** 已确认时写谁确认 */
  confirmedBy?: string;
  /** 覆盖默认文案，仍须含「AI」与「生成」字样 */
  text?: string;
}
export declare function SbAiBadge(props: SbAiBadgeProps): JSX.Element;

export interface SbAiFieldProps {
  label?: ReactNode;
  required?: boolean;
  value?: string;
  /** AI 原值，edited 态下可恢复 */
  aiValue?: string;
  state?: SbAiFieldState;
  /** low 且 state 为 ai 时留空给候选 */
  confidence?: 'high' | 'low';
  candidates?: string[];
  onChange?: (value: string) => void;
  onConfirm?: () => void;
  onRestore?: () => void;
  error?: ReactNode;
}
export declare function SbAiField(props: SbAiFieldProps): JSX.Element;

export interface SbAiSourceItem {
  key: string;
  title: ReactNode;
  description?: ReactNode;
  url?: string;
}
export interface SbAiSourcesProps {
  /** 为空时不展示结论，只显示提示（A-03） */
  items?: SbAiSourceItem[];
  title?: ReactNode;
  onClick?: (item: SbAiSourceItem) => void;
  defaultExpanded?: boolean;
}
export declare function SbAiSources(props: SbAiSourcesProps): JSX.Element;

export interface SbAiProgressProps {
  stages?: string[];
  /** 当前阶段下标 */
  current?: number;
  status?: SbAiProgressStatus;
  /** 当前阶段的补充说明 */
  detail?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}
export declare function SbAiProgress(props: SbAiProgressProps): JSX.Element;

/** 作战地图的一个客户点（12 章 2.3） */
export interface SbBattleMapPoint {
  id: string | number;
  name: string;
  /** 客户潜力 1～10，横轴 */
  potential: number;
  /** 关系深度 1～10，纵轴 */
  relationship: number;
  /** 当前状态，决定点的颜色：向好、需关注、转差、待评估 */
  tone?: 'good' | 'watch' | 'bad' | 'pending';
  /** 金额档，决定点的直径 12／16／22 */
  amountBand?: 'small' | 'medium' | 'large';
  /** 悬停或选中时的一行摘要，如「关系 8/10 · 预算 320 万」 */
  summary?: string;
}
/** 四个格子：客户资产（右上）、主攻区（左上）、客户资源（右下）、见单打单（左下） */
export type SbBattleMapQuadrant = 'asset' | 'attack' | 'resource' | 'spot';
export interface SbBattleMapProps {
  points?: SbBattleMapPoint[];
  /** 分界线，默认都是 5.5 */
  thresholds?: { potential?: number; relationship?: number };
  /** 没填关系或潜力的客户数，> 0 时图下方出「待评估 N 家」 */
  unrated?: number;
  /** 点数超过这个值时聚合更积极（合并半径翻倍），默认 30 */
  clusterAfter?: number;
  /** 受控的放大象限；不传则内部管理 */
  zoomQuadrant?: SbBattleMapQuadrant | null;
  defaultZoomQuadrant?: SbBattleMapQuadrant | null;
  onZoomChange?: (quadrant: SbBattleMapQuadrant | null) => void;
  onPointClick?: (point: SbBattleMapPoint) => void;
  /** 点开聚合的大圆，回传里面的客户 */
  onClusterClick?: (points: SbBattleMapPoint[]) => void;
  onUnratedClick?: () => void;
  selectedId?: string | number | null;
  loading?: boolean;
  emptyText?: string;
  /** 空态按钮，label 默认「去客户列表」 */
  emptyAction?: { label?: string; onClick?: () => void };
  className?: string;
  style?: React.CSSProperties;
}
export declare function SbBattleMap(props: SbBattleMapProps): JSX.Element;
/** 点属于哪个格子：潜力 ≥ 阈值为「大」，关系 ≥ 阈值为「深」 */
export declare function quadrantOf(point: Pick<SbBattleMapPoint, 'potential' | 'relationship'>, thresholds: { potential: number; relationship: number }): SbBattleMapQuadrant;

/** 图表卡片的状态（12 章 §3.5） */
export type SbChartState = 'normal' | 'loading' | 'empty' | 'error';
export interface SbChartCardProps {
  /** 写这张图回答什么问题 */
  title?: ReactNode;
  /** 范围与周期，紧挨标题 */
  scope?: ReactNode;
  /** 口径，放在悬停 ⓘ 里 */
  caliber?: ReactNode;
  /** 图例，图上方左侧 */
  legend?: ReactNode;
  state?: SbChartState;
  emptyTitle?: ReactNode;
  /** 空态的原因与下一步 */
  emptyDescription?: ReactNode;
  onRetry?: () => void;
  /** 给读屏的一句摘要，写进 aria-label 与视觉隐藏文本 */
  summary?: string;
  /** 传了就出现「查看图表数据」折叠表；空值显示未登记 */
  data?: { columns: ReactNode[]; rows: ReactNode[][] };
  className?: string;
  children?: ReactNode;
}
export declare function SbChartCard(props: SbChartCardProps): JSX.Element;

export interface SbKpiChange {
  text: ReactNode;
  /** 只决定箭头 */
  tone?: 'up' | 'down' | 'flat';
  /** true 绿、false 红、不传灰：无好坏的指标不上色 */
  good?: boolean;
}
export interface SbKpiCardProps {
  /** 空或 null 显示 missingText，不显示 0 */
  value?: ReactNode;
  /** 单位，小一号跟在数字后 */
  unit?: ReactNode;
  label?: ReactNode;
  note?: ReactNode;
  change?: SbKpiChange;
  missingText?: string;
  /** 显示「正在读取」而不是 0 */
  loading?: boolean;
  /** 传了整张卡可点进明细 */
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}
export declare function SbKpiCard(props: SbKpiCardProps): JSX.Element;

export interface SbChartSeries {
  name: string;
  /** null 不画成 0，柱位或点位写「未登记」 */
  data: Array<number | null>;
  /** 指定顺序色档位 1～5；不传按系列顺序取 chart-1～5，两个系列时取 1 和 5 */
  tone?: 1 | 2 | 3 | 4 | 5;
}
export interface SbBarChartProps {
  categories?: string[];
  /** 最多五个 */
  series?: SbChartSeries[];
  unit?: string;
  valueFormatter?: (value: number) => string;
  /** 不传时柱少于 8 根才显示数字 */
  showLabel?: boolean;
  /** 横向排名默认 10，超出显示「查看全部」 */
  maxItems?: number;
  onShowAll?: () => void;
  onClick?: (index: number, seriesIndex: number) => void;
  height?: number;
  /** horizontal 横向条形（排名、阶段 ACV），vertical 竖向柱状 */
  orientation?: 'horizontal' | 'vertical';
  /** 不传时多于一个系列才显示图例 */
  showLegend?: boolean;
  className?: string;
}
export declare function SbBarChart(props: SbBarChartProps): JSX.Element;

export interface SbLineChartProps {
  categories?: string[];
  series?: SbChartSeries[];
  unit?: string;
  valueFormatter?: (value: number) => string;
  smooth?: boolean;
  area?: boolean;
  /** 可以不从 0 开始，轴上会标最小值 */
  yMin?: number;
  onClick?: (index: number, seriesIndex: number) => void;
  height?: number;
  showLegend?: boolean;
  className?: string;
}
export declare function SbLineChart(props: SbLineChartProps): JSX.Element;

export interface SbMeta {
  id: string;
  name: string;
  rules: string[];
  pages: string;
  purpose: string;
  props: string;
  states: string[];
}
/** 每个组件的说明，目录页与规范站从这里读 */
export declare const META: SbMeta[];
export interface SbIcon { key: string; label: string; antd: string; tdesign: string }
/** 常用图标对照：含义、Ant Design 图标名、TDesign 图标名 */
export declare const ICONS: SbIcon[];
/** 每个组件的引入与最小用例，键与 META 的 id 一致 */
export declare const USAGE: Record<string, string>;

/* ---- 0.6.0：顶栏、侧导航、表单壳 ---- */
export interface SbSideNavItem { key: string; label: ReactNode; /** ReactNode 或 SbIcon 的含义名 */ icon?: ReactNode | string; path?: string; hidden?: boolean }
export interface SbSideNavGroup { key?: string; title?: ReactNode; items: SbSideNavItem[] }
export interface SbSideNavBrand { logoSrc?: string; /** 折叠时用的小标 */ markSrc?: string; alt?: string; href?: string }
export interface SbSideNavProps {
  brand?: ReactNode | SbSideNavBrand;
  workspace?: { name: ReactNode; scope?: ReactNode; onClick?: () => void };
  groups?: SbSideNavGroup[];
  activeKey?: string;
  onSelect?: (key: string, item?: SbSideNavItem) => void;
  /** 折叠成 64 宽的窄条，只留图标 */
  collapsed?: boolean;
  /** 传了就显示收起／展开按钮 */
  onCollapse?: (collapsed: boolean) => void;
  footer?: ReactNode;
  account?: { name: string; role?: string; team?: string; /** 图片地址或两个字；不传取姓名前两字 */ avatar?: string; active?: boolean; onClick?: () => void };
  adminLink?: { label?: string; href: string };
  className?: string;
}
export declare function SbSideNav(props: SbSideNavProps): JSX.Element;

export type SbTopBarStatus = 'ready' | 'preview' | 'unavailable' | 'checking';
export interface SbTopBarCrumb { label: ReactNode; onClick?: () => void }
export interface SbTopBarProps {
  /** 面包屑，最后一项是当前页 */
  items?: SbTopBarCrumb[];
  onBack?: () => void;
  status?: SbTopBarStatus;
  /** 覆盖状态文字 */
  statusText?: string;
  /** 不传显示今天，如「2026年9月21日 周一」 */
  date?: string;
  onCreate?: () => void;
  createLabel?: ReactNode;
  createHidden?: boolean;
  onHelp?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** 放在动作区左侧 */
  extra?: ReactNode;
  className?: string;
}
export declare function SbTopBar(props: SbTopBarProps): JSX.Element;

export interface SbDatePickerPreset { label: ReactNode; value: any }
export interface SbDatePickerProps {
  /** 'YYYY-MM-DD'；range 时为两元数组 */
  value?: string | null | [string | null, string | null];
  onChange?: (value: any) => void;
  range?: boolean;
  /** 不传用「今天、本周、本季」；false 不显示 */
  presets?: SbDatePickerPreset[] | false;
  allowClear?: boolean;
  disabled?: boolean;
  disabledDate?: (d: any) => boolean;
  placeholder?: string | [string, string];
  locale?: any;
  width?: number | string;
  className?: string;
  [key: string]: any;
}
export declare function SbDatePicker(props: SbDatePickerProps): JSX.Element;

export interface SbSelectOption { value: string | number; label: ReactNode; count?: number; disabled?: boolean }
export interface SbSelectProps {
  value?: any;
  onChange?: (value: any, option?: any) => void;
  options?: SbSelectOption[];
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  width?: number | string;
  mode?: 'multiple' | 'tags';
  showSearch?: boolean;
  className?: string;
  [key: string]: any;
}
export declare function SbSelect(props: SbSelectProps): JSX.Element;

export interface SbSearchSelectProps {
  value?: any;
  onChange?: (value: any, option?: any) => void;
  /** 远程搜索；不传则用 options 本地过滤 */
  search?: (keyword: string) => Promise<SbSelectOption[]> | SbSelectOption[];
  options?: SbSelectOption[];
  /** 毫秒，默认 300 */
  debounce?: number;
  /** 少于这个字数不发请求，默认 1 */
  minLength?: number;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  width?: number | string;
  mode?: 'multiple' | 'tags';
  className?: string;
  [key: string]: any;
}
export declare function SbSearchSelect(props: SbSearchSelectProps): JSX.Element;

export interface SbAmountInputProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  /** 后缀单位，默认「万元」；传空字符串不显示 */
  unit?: string;
  min?: number;
  max?: number;
  precision?: number;
  placeholder?: string;
  disabled?: boolean;
  width?: number | string;
  className?: string;
  [key: string]: any;
}
export declare function SbAmountInput(props: SbAmountInputProps): JSX.Element;

export interface SbTextareaProps {
  value?: string;
  onChange?: (value: string, event?: any) => void;
  maxLength?: number;
  showCount?: boolean;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  [key: string]: any;
}
export declare function SbTextarea(props: SbTextareaProps): JSX.Element;

export interface SbSegmentedOption { value: string | number; label: ReactNode; disabled?: boolean }
export interface SbSegmentedProps {
  value?: string | number;
  onChange?: (value: any) => void;
  options?: SbSegmentedOption[];
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  block?: boolean;
  className?: string;
  [key: string]: any;
}
export declare function SbSegmented(props: SbSegmentedProps): JSX.Element;
