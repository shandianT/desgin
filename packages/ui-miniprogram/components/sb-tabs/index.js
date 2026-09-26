/** 带数量的标签页（C-05）：数量小号灰字，超过 99 显示 99+，当前页签主色。items: [{ key, label, count, disabled }]。事件 change：{ key } */
Component({
  options: { addGlobalClass: true },
  properties: { items: { type: Array, value: [] }, activeKey: String,
    size: { type: String, value: 'default' }, // small：14px，卡片内的二级页签
    plain: { type: Boolean, value: false }, // plain：不画整行底线
    fit: { type: Boolean, value: false } }, // fit：各页签按文字宽度分满一行，不横滑；5 个及以上在窄于 360px 的屏上退回横滑
  data: { list: [], activeId: '' },
  observers: { 'list, activeKey'(list, key) { const i = (list || []).findIndex((t) => t.key === key); this.setData({ activeId: i >= 0 ? 'sbtab-' + i : '' }); }, // 横滑时把当前页签滚进可见区
    items(items) { this.setData({ list: (items || []).map((t) => ({ ...t, countText: t.count == null ? '' : t.count > 99 ? '99+' : String(t.count) })) }); } },
  methods: { onTap(e) { const { key, disabled } = e.currentTarget.dataset; if (disabled || key === this.data.activeKey) return; this.triggerEvent('change', { key }); } },
});
