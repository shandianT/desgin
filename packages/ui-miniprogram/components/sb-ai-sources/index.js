Component({
  options: { addGlobalClass: true },
  properties: { items: { type: Array, value: [] }, title: String, defaultExpanded: { type: Boolean, value: false } },
  data: { open: false, heading: '' },
  observers: { 'items, title'(items, title) { this.setData({ heading: title || `依据 ${(items || []).length} 条` }); } },
  lifetimes: { attached() { this.setData({ open: this.data.defaultExpanded }); } },
  methods: {
    onToggle() { this.setData({ open: !this.data.open }); },
    onItem(e) { const item = this.data.items[e.currentTarget.dataset.index]; this.triggerEvent('tap', { item }); },
  },
});
