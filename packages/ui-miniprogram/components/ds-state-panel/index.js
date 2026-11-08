Component({
  options: { addGlobalClass: true },
  properties: {
    state: { type: String },
    title: { type: String },
    description: { type: String },
    skeleton: { type: Boolean },
    retryLabel: { type: String },
    clearLabel: { type: String },
    showClear: { type: Boolean },
    retryNote: { type: String },
    size: { type: String }
  },
  methods: {
    onRetry(event) { this.triggerEvent('retry', event.detail); },
    onClear(event) { this.triggerEvent('clear', event.detail); }
  }
});
