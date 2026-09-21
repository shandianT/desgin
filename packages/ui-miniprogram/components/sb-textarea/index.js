/** 多行文本（C-02）：t-textarea 薄壳，带字数（默认 500）与自动增高，标签常显、必填星号。事件 change：{ value } */
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: String, value: '' }, placeholder: { type: String, value: '请输入' }, maxlength: { type: Number, value: 500 },
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false },
  },
  methods: { onInput(e) { const value = e.detail.value; if (value !== this.data.value) this.triggerEvent('change', { value }); } },
});
