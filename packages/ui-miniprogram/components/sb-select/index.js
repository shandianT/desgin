/** 表单里的单选（C-02、C-03）：一行触发器（标签、值、›）加 t-picker 单列滚轮。筛选栏用 sb-labeled-select，表单用这个。禁用项在滚轮里标「不可选」并拒绝选中。事件 change：{ value, option } */
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: null, value: null }, options: { type: Array, value: [] }, placeholder: { type: String, value: '请选择' },
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false },
  },
  data: { open: false, text: '', columns: [], pickerValue: [] },
  observers: {
    'value, options'(value, options) {
      const list = options || [];
      const hit = list.find((o) => o.value === value);
      const columns = list.map((o) => ({ value: o.value, label: (o.count != null ? `${o.label}（${o.count}）` : o.label) + (o.disabled ? '（不可选）' : '') }));
      this.setData({ text: hit ? hit.label : '', columns, pickerValue: [hit ? hit.value : (list[0] ? list[0].value : '')] });
    },
  },
  methods: {
    onOpen() { if (!this.data.disabled && this.data.columns.length) this.setData({ open: true }); },
    onCancel() { this.setData({ open: false }); },
    onConfirm(e) {
      const v = e.detail.value[0]; const option = (this.data.options || []).find((o) => o.value === v) || null;
      if (option && option.disabled) { wx.showToast({ title: `${option.label}不可选`, icon: 'none' }); return; }
      this.setData({ open: false });
      if (v !== this.data.value) this.triggerEvent('change', { value: v, option });
    },
  },
});
