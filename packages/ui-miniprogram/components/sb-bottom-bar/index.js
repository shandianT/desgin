Component({
  options: { addGlobalClass: true },
  properties: { primaryLabel: { type: String, value: '确定' }, loading: { type: Boolean, value: false }, loadingLabel: { type: String, value: '处理中…' }, disabled: { type: Boolean, value: false }, disabledReason: String, secondaryLabel: String, secondaryDisabled: { type: Boolean, value: false } },
  methods: { onPrimary() { if (this.data.disabled || this.data.loading) return; this.triggerEvent('primary'); }, onSecondary() { if (this.data.secondaryDisabled) return; this.triggerEvent('secondary'); } },
});
