/**
 * 单行输入（C-02）：t-input 薄壳，和 sb-textarea 同一套版式。
 * layout=inline 标签左、输入右；layout=stacked 标签在上（14px 常规字重）、下面一个白底细线 6px 圆角的框（飞书表单版式；高 44px，按小程序点击底线）；plain 不带自己的白底与页边距。
 * 小程序体验：数字用 type=digit／number；clearable 默认开；confirmType 对应键盘右下角按钮；error、help 在框下一行 12px。
 * 事件 change：{ value }（每次输入与点清除都发，清除时 value 为 ''）；confirm：{ value }；focus、blur：{ value }；visibility：{ visible }（点密码眼睛）
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: null, value: '' }, placeholder: { type: String, value: '请输入' },
    type: { type: String, value: 'text' }, // text | number | digit | idcard | password
    maxlength: { type: Number, value: 140 }, clearable: { type: Boolean, value: true }, // 140 与原生 input 默认一致；-1 不限
    cursorSpacing: { type: Number, value: 0 }, // 光标与键盘的距离（px），输入框在固定底部条上方时传
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false },
    error: String, help: String, suffix: String, focus: { type: Boolean, value: false }, confirmType: { type: String, value: 'done' },
    passwordVisible: { type: Boolean, value: false }, // type=password 时右侧显示眼睛
    showPassword: { type: Boolean, value: false }, // 明文与否由页面控制（受控）：点眼睛发 visibility { visible }，页面回写 showPassword；页面复位时 setData 为 false 即可
    layout: { type: String, value: 'inline' }, plain: { type: Boolean, value: false },
  },
  data: { showPlain: false, text: '' },
  observers: { value(v) { this.setData({ text: v === null || v === undefined ? '' : String(v) }); }, showPassword(v) { this.setData({ showPlain: !!v }); } },
  methods: {
    onChange(e) { const value = e.detail.value; this.setData({ text: value }); this.triggerEvent('change', { value }); },
    onClear() { this.setData({ text: '' }); this.triggerEvent('change', { value: '' }); },
    onConfirm(e) { this.triggerEvent('confirm', { value: e.detail.value }); },
    onFocus(e) { this.triggerEvent('focus', { value: e.detail.value }); },
    onBlur(e) { this.triggerEvent('blur', { value: e.detail.value }); },
    onEye() { const visible = !this.data.showPlain; this.setData({ showPlain: visible }); this.triggerEvent('visibility', { visible }); },
  },
});
