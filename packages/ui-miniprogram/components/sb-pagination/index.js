Component({
  options: { addGlobalClass: true },
  properties: { current: { type: Number, value: 1 }, total: { type: Number, value: 0 }, pageSize: { type: Number, value: 20 }, mode: { type: String, value: 'page' }, loading: { type: Boolean, value: false }, end: { type: Boolean, value: false } },
  data: { pages: 1, first: true, last: true },
  observers: { 'current, total, pageSize'(current, total, pageSize) { const pages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1))); this.setData({ pages, first: current <= 1, last: current >= pages }); } },
  methods: {
    onPrev() { if (this.data.first) return; this.triggerEvent('change', { current: this.data.current - 1 }); },
    onNext() { if (this.data.last) return; this.triggerEvent('change', { current: this.data.current + 1 }); },
    onMore() { if (this.data.loading || this.data.end) return; this.triggerEvent('more'); },
  },
});
