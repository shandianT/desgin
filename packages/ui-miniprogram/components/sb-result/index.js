// 操作结果整页（C-01、C-06、B-01）：t-result 薄壳。归档成功、提交失败、需要补充这类整页反馈。
// status: success | error | info | warning，图标色只走 --ui-success / danger / primary / warning；一个主按钮一个次按钮；extra slot 放补充内容。
// 拜访确认的归档成功页以后可以直接换成它：status=success，primaryLabel「查看客户」，secondaryLabel「再记一条」。
const THEME = { success: 'success', error: 'error', info: 'default', warning: 'warning' };
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: { status: { type: String, value: 'info' }, title: String, description: String, primaryLabel: String, primaryLoading: { type: Boolean, value: false }, primaryDisabled: { type: Boolean, value: false }, secondaryLabel: String, secondaryDisabled: { type: Boolean, value: false } },
  data: { theme: 'default', s: 'info' },
  observers: { status(status) { const s = THEME[status] ? status : 'info'; this.setData({ s, theme: THEME[s] }); } },
  methods: {
    onPrimary() { if (this.data.primaryLoading || this.data.primaryDisabled) return; this.triggerEvent('primary'); },
    onSecondary() { if (this.data.secondaryDisabled) return; this.triggerEvent('secondary'); },
  },
});
