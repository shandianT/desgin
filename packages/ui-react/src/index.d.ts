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
