/** 带标签的下拉筛选（C-04）：标签在左，值在右，没选显示「全部」，点开用 t-picker 选。事件 change：{ value, option } */
Component({
  options: { addGlobalClass: true },
  properties: { label: String, value: { type: null, value: null }, options: { type: Array, value: [] }, placeholder: { type: String, value: '全部' }, allowClear: { type: Boolean, value: true }, disabled: { type: Boolean, value: false } },
  data: { text: '全部', open: false, columns: [], pickerValue: [] },
  observers: {
    'value, options, placeholder'(value, options, placeholder) {
      const hit = (options || []).find((o) => o.value === value);
      const columns = [{ value: '', label: placeholder }, ...(options || []).map((o) => ({ value: o.value, label: o.count != null ? `${o.label}（${o.count}）` : o.label }))];
      this.setData({ text: hit ? hit.label : placeholder, columns, pickerValue: [hit ? hit.value : ''] });
    },
  },
  methods: {
    onOpen() { if (!this.data.disabled) this.setData({ open: true }); },
    onCancel() { this.setData({ open: false }); },
    onConfirm(e) { const v = e.detail.value[0]; const option = (this.data.options || []).find((o) => o.value === v) || null; this.setData({ open: false }); this.triggerEvent('change', { value: v === '' ? null : v, option }); },
    onClear(e) { this.triggerEvent('change', { value: null, option: null }); },
  },
});
