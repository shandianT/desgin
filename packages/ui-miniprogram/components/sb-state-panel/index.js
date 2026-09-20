Component({
  options: { addGlobalClass: true, multipleSlots: false },
  properties: { state: { type: String, value: 'normal' }, title: String, description: String, skeleton: { type: Boolean, value: false }, retryLabel: { type: String, value: '重试' }, clearLabel: { type: String, value: '清除条件' }, showClear: { type: Boolean, value: false } },
  methods: { onRetry() { this.triggerEvent('retry'); }, onClear() { this.triggerEvent('clear'); } },
});
