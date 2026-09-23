/** 分段切换（C-04、T-05）：自绘，胶囊底、选中白底加阴影与主色字，对应 Web antd Segmented。tdesign 小程序没有这个件。事件 change：{ value } */
Component({
  options: { addGlobalClass: true },
  properties: { options: { type: Array, value: [] }, value: { type: null, value: null }, size: { type: String, value: 'middle' },
    block: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false }, // 整组禁用
    emitSame: { type: Boolean, value: false } }, // 点已选中的项也发 change（页面要借此复位时用） // block：撑满一行、各项等宽（页签式三项切换用）
  methods: { onTap(e) { const { value, disabled } = e.currentTarget.dataset; if (this.data.disabled || disabled || (value === this.data.value && !this.data.emitSame)) return; this.triggerEvent('change', { value }); } },
});
