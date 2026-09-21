/** 分段切换（C-04、T-05）：自绘，胶囊底、选中白底加阴影与主色字，对应 Web antd Segmented。tdesign 小程序没有这个件。事件 change：{ value } */
Component({
  options: { addGlobalClass: true },
  properties: { options: { type: Array, value: [] }, value: { type: null, value: null }, size: { type: String, value: 'middle' } },
  methods: { onTap(e) { const { value, disabled } = e.currentTarget.dataset; if (disabled || value === this.data.value) return; this.triggerEvent('change', { value }); } },
});
