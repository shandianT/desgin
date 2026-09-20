// 常用图标对照表：含义、网页 Ant Design 图标名、小程序 TDesign 图标名。规范见 specs/salesbuddy/10-图标.md，两边名字都对着安装包核过。
export const ICONS = [
  ['customer', '客户', 'UserOutlined', 'user-1'], ['team', '客户群、团队', 'TeamOutlined', 'usergroup'], ['opportunity', '商机', 'FundOutlined', 'chart-line'],
  ['visit', '拜访', 'CalendarOutlined', 'calendar-1'], ['task', '任务', 'CheckSquareOutlined', 'task'], ['risk', '风险、需关注', 'WarningOutlined', 'error-circle'],
  ['dashboard', '看板、总览', 'DashboardOutlined', 'dashboard'], ['map', '作战地图', 'FlagOutlined', 'map'], ['money', '金额、毛利', 'DollarOutlined', 'money'],
  ['company', '公司、机构', 'ShopOutlined', 'building'], ['phone', '电话', 'PhoneOutlined', 'call'], ['place', '地点、地盘', 'EnvironmentOutlined', 'location'],
  ['search', '搜索', 'SearchOutlined', 'search'], ['filter', '筛选', 'FilterOutlined', 'filter-1'], ['back', '返回', 'LeftOutlined', 'chevron-left'],
  ['forward', '前进、进入', 'RightOutlined', 'chevron-right'], ['expand', '展开', 'DownOutlined', 'chevron-down'], ['collapse', '收起', 'UpOutlined', 'chevron-up'],
  ['close', '关闭', 'CloseOutlined', 'close'], ['add', '新增', 'PlusOutlined', 'add'], ['edit', '编辑', 'EditOutlined', 'edit-1'], ['delete', '删除', 'DeleteOutlined', 'delete'],
  ['confirm', '确认、完成', 'CheckOutlined', 'check'], ['retry', '重试、刷新', 'ReloadOutlined', 'refresh'], ['undo', '撤销', 'RollbackOutlined', 'rollback'],
  ['more', '更多', 'MoreOutlined', 'more'], ['voice', '语音录入', 'AudioOutlined', 'microphone-1'], ['ai', 'AI', 'RobotOutlined', 'robot'],
  ['info', '提示', 'InfoCircleOutlined', 'info-circle'], ['help', '帮助', 'QuestionCircleOutlined', 'help-circle'], ['success', '成功', 'CheckCircleOutlined', 'check-circle'],
  ['fail', '失败', 'CloseCircleOutlined', 'error-circle'], ['time', '时间、历史', 'ClockCircleOutlined', 'time'], ['link', '链接、依据', 'LinkOutlined', 'link'],
  ['file', '文件、记录', 'FileTextOutlined', 'file-1'], ['notice', '通知', 'BellOutlined', 'notification'], ['setting', '设置', 'SettingOutlined', 'setting'],
  ['lock', '权限、锁', 'LockOutlined', 'lock-on'], ['view', '查看', 'EyeOutlined', 'browse'], ['export', '导出、分享', 'ExportOutlined', 'share'], ['sync', '同步、处理中', 'SyncOutlined', 'loading'],
].map(([key, label, antd, tdesign]) => ({ key, label, antd, tdesign }));
