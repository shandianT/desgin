Component({
  options: { addGlobalClass: true },
  properties: { value: { type: String, value: '' }, placeholder: { type: String, value: '搜索名称或负责人' }, clearable: { type: Boolean, value: true }, loading: { type: Boolean, value: false }, disabled: { type: Boolean, value: false },
    maxlength: { type: Number, value: -1 }, // 字数上限，-1 不限（原生输入框常见 100）
    plain: { type: Boolean, value: false } }, // plain：不带自己的白底与页边距，放进已有卡片或页面底色上时用
  methods: {
    onChange(e) { this.triggerEvent('change', { value: e.detail.value }); },
    onSubmit(e) { this.triggerEvent('search', { value: e.detail.value }); },
    onClear() { this.triggerEvent('clear', { value: '' }); },
  },
});
