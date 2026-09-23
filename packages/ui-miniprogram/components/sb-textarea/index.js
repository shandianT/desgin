/** 多行文本（C-02）：t-textarea 薄壳，带字数（默认 500）与自动增高，标签常显、必填星号。事件 change：{ value } */
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: String, value: '' }, placeholder: { type: String, value: '请输入' }, maxlength: { type: Number, value: 500 },
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false },
    layout: { type: String, value: 'inline' }, // inline：标签左、值右一行；stacked：标签在上、下面一个带细线的框（放进表单白卡）
    plain: { type: Boolean, value: false }, // 不带自己的白底与页边距
    minRows: { type: Number, value: 3 }, maxRows: { type: Number, value: 8 },
    error: String, help: String,
    cursorSpacing: { type: Number, value: 0 }, fixed: { type: Boolean, value: false }, // fixed：放在 position:fixed 区域（弹层）里时传 true
    focus: { type: Boolean, value: false }, // 打开编辑弹层就弹键盘时传 true（与原生 textarea 的 focus 相同）
  },
  data: { autosizeObj: { minHeight: 72, maxHeight: 192 } },
  observers: { 'minRows, maxRows'(a, b) { this.setData({ autosizeObj: b > 0 ? { minHeight: a * 24, maxHeight: b * 24 } : { minHeight: a * 24 } }); } }, // maxRows=0：一直长高，不在框里滚动
  methods: { onInput(e) { this.triggerEvent('change', { value: e.detail.value }); } }, // 0.9.1：每次输入都发（以前和 value 比较去重，页面不回写 value 时会漏发）
});
