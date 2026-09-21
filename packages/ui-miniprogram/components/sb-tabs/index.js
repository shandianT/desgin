/** 带数量的标签页（C-05）：数量小号灰字，超过 99 显示 99+，当前页签主色。items: [{ key, label, count, disabled }]。事件 change：{ key } */
Component({
  options: { addGlobalClass: true },
  properties: { items: { type: Array, value: [] }, activeKey: String },
  data: { list: [] },
  observers: { items(items) { this.setData({ list: (items || []).map((t) => ({ ...t, countText: t.count == null ? '' : t.count > 99 ? '99+' : String(t.count) })) }); } },
  methods: { onTap(e) { const { key, disabled } = e.currentTarget.dataset; if (disabled || key === this.data.activeKey) return; this.triggerEvent('change', { key }); } },
});
