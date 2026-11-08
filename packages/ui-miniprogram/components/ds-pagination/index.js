Component({
  options: { addGlobalClass: true },
  properties: {
    current: { type: Number },
    total: { type: Number },
    pageSize: { type: Number },
    mode: { type: String },
    loading: { type: Boolean },
    end: { type: Boolean },
    summary: { type: String },
    plain: { type: Boolean },
    error: { type: Boolean }
  },
  methods: {
    onChange(event) { this.triggerEvent('change', event.detail); }
    onMore(event) { this.triggerEvent('more', event.detail); }
    onRetry(event) { this.triggerEvent('retry', event.detail); }
  }
});
