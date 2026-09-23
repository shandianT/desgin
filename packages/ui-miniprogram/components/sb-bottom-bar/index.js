Component({
  options: { addGlobalClass: true },
  properties: {
    primaryLabel: { type: String, value: '确定' }, loading: { type: Boolean, value: false }, loadingLabel: { type: String, value: '处理中…' },
    disabled: { type: Boolean, value: false }, disabledReason: String,
    // inactive：看起来是禁用，但点了仍发 primary（detail.inactive=true），页面借此说明还缺什么。条件没满足又要给提示时用它，不要用 disabled
    inactive: { type: Boolean, value: false },
    note: String, // 按钮上方一行说明，例如「提交后由李明哲验收」
    secondaryLabel: String, secondaryDisabled: { type: Boolean, value: false },
  },
  methods: {
    onPrimary() { if (this.data.disabled || this.data.loading) return; this.triggerEvent('primary', { inactive: this.data.inactive }); },
    onSecondary() { if (this.data.secondaryDisabled) return; this.triggerEvent('secondary'); },
  },
});
