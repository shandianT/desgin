/**
 * 带标签的下拉筛选（C-04）：点开用 t-picker 选。事件 change：{ value, option }
 * size=default：一行「标签 值」细线框（Web 式筛选栏）；size=small：飞书筛选片（高 32px、灰底无边框，选中浅蓝底主色字；未选只显示标签，选中只显示值）。
 * allOption：默认在滚轮第一项插「全部」（值为 null）；传 false 不插、不显示清除（排序、季度这类必有一个值的筛选）。
 * title：滚轮标题，默认取 label。
 * defaultValue：allOption=false 时哪个值算「默认、未筛选」（灰底），不传取第一项；例如季度片默认当前季度。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    label: String, value: { type: null, value: null }, options: { type: Array, value: [] }, placeholder: { type: String, value: '全部' },
    allowClear: { type: Boolean, value: true }, disabled: { type: Boolean, value: false },
    size: { type: String, value: 'default' }, allOption: { type: Boolean, value: true }, title: String,
    defaultValue: { type: null, value: null },
    useLabelSlot: { type: Boolean, value: false }, // 标签用 slot="label" 的内容代替 label 文本（label 仍用于读屏与滚轮标题）
  },
  data: { text: '全部', open: false, columns: [], pickerValue: [], selected: false, showValue: false },
  observers: {
    'value, options, placeholder, allOption, defaultValue'(value, options, placeholder, allOption, defaultValue) {
      const list = options || [];
      const hit = list.find((o) => o.value === value);
      const items = list.map((o) => ({ value: o.value, label: o.count != null ? `${o.label}（${o.count}）` : o.label }));
      const columns = allOption ? [{ value: '', label: placeholder }, ...items] : items;
      const empty = value === null || value === undefined || value === '';
      // 不插「全部」时，默认值（defaultValue，不传取第一项，如默认排序）不算已筛选
      const base = defaultValue !== null && defaultValue !== undefined ? defaultValue : (list[0] ? list[0].value : undefined);
      const selected = !!hit && !empty && (allOption || base !== value);
      this.setData({ text: hit ? hit.label : placeholder, columns, selected, showValue: selected || (!!hit && !allOption), pickerValue: [hit ? hit.value : (allOption ? '' : (items[0] ? items[0].value : ''))] });
    },
  },
  methods: {
    onOpen() { if (!this.data.disabled && this.data.columns.length) this.setData({ open: true }); },
    onCancel() { this.setData({ open: false }); },
    onConfirm(e) { const v = e.detail.value[0]; const option = (this.data.options || []).find((o) => o.value === v) || null; this.setData({ open: false }); this.triggerEvent('change', { value: v === '' ? null : v, option }); },
    onClear() { this.triggerEvent('change', { value: null, option: null }); },
  },
});
