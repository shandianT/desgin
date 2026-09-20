Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: { visible: { type: Boolean, value: false }, title: String, closeOnOverlay: { type: Boolean, value: true }, cancelLabel: { type: String, value: '取消' }, confirmLabel: String, confirmLoading: { type: Boolean, value: false } },
  methods: {
    onVisible(e) { if (!e.detail.visible) this.triggerEvent('close', { trigger: e.detail.trigger }); },
    onCancel() { this.triggerEvent('close', { trigger: 'cancel' }); },
    onConfirm() { if (this.data.confirmLoading) return; this.triggerEvent('confirm'); },
  },
});
