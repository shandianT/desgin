Component({
  options: { addGlobalClass: true },
  properties: {
    stages: { type: Array },
    current: { type: Number },
    status: { type: String },
    detail: { type: String }
  },
  methods: {
    onCancel(event) { this.triggerEvent('cancel', event.detail); },
    onRetry(event) { this.triggerEvent('retry', event.detail); }
  }
});
