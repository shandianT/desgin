Component({
  options: { addGlobalClass: true },
  properties: { name: String, summary: String, tone: String, statusLabel: String, reason: String, time: String, selected: { type: Boolean, value: false }, disabled: { type: Boolean, value: false }, disabledReason: String },
  methods: { onTap() { if (this.data.disabled) return; this.triggerEvent('tap', {}); } },
});
