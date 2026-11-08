Component({
  options: { addGlobalClass: true },
  properties: {
    name: { type: String },
    summary: { type: String },
    tone: { type: String },
    statusLabel: { type: String },
    reason: { type: String },
    time: { type: String },
    selected: { type: Boolean },
    disabled: { type: Boolean },
    disabledReason: { type: String }
  },
  methods: {
    onTap(event) { this.triggerEvent('tap', event.detail); }
  }
});
