/**
 * 底部弹层（C-07、X-03）：t-popup 壳，半屏从底部弹出（WeUI 半屏弹窗做法），上圆角、点遮罩关闭、底部安全区。
 * 结构：标题（title）→ 说明（description）→ header slot（搜索框、已选胶囊，固定不随正文滚动）→ 正文（默认 slot，可滚动）→ 底部（footer slot 与按钮）。
 * 按钮：传 confirmLabel 才出现；左键默认「取消」（发 close），传 secondaryLabel 则左键发 secondary；cancelLabel 传空字符串时只有确定键；两个按钮等分。
 * 事件 close：{ trigger }（遮罩、关闭按钮、取消）；confirm；secondary；scrolltolower（正文滚到底，用于加载更多）
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    visible: { type: Boolean, value: false }, title: String, description: String, closeOnOverlay: { type: Boolean, value: true },
    cancelLabel: { type: String, value: '取消' }, secondaryLabel: String, confirmLabel: String,
    confirmLoading: { type: Boolean, value: false }, confirmDisabled: { type: Boolean, value: false },
  },
  methods: {
    onVisible(e) { if (!e.detail.visible) this.triggerEvent('close', { trigger: e.detail.trigger }); },
    onLeft() { if (this.data.secondaryLabel) this.triggerEvent('secondary'); else this.triggerEvent('close', { trigger: 'cancel' }); },
    onConfirm() { if (!this.data.visible || this.data.confirmLoading || this.data.confirmDisabled) return; this.triggerEvent('confirm'); }, // 关闭动画期间（visible 已为 false）不再发
    onLower() { this.triggerEvent('scrolltolower'); },
  },
});
