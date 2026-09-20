Component({
  options: { addGlobalClass: true },
  properties: { value: { type: String, value: '' }, placeholder: { type: String, value: '搜索名称或负责人' }, clearable: { type: Boolean, value: true }, loading: { type: Boolean, value: false }, disabled: { type: Boolean, value: false } },
  methods: {
    onChange(e) { this.triggerEvent('change', { value: e.detail.value }); },
    onSubmit(e) { this.triggerEvent('search', { value: e.detail.value }); },
    onClear() { this.triggerEvent('clear', { value: '' }); },
  },
});
