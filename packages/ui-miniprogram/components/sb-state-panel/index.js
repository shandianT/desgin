Component({
  options: { addGlobalClass: true, multipleSlots: false },
  properties: { state: { type: String, value: 'normal' }, title: String, description: String, skeleton: { type: Boolean, value: false }, retryLabel: { type: String, value: '重试' }, clearLabel: { type: String, value: '清除条件' }, showClear: { type: Boolean, value: false },
    // 失败态按钮下的小字；没有筛选条件的页面传空字符串隐藏
    retryNote: { type: String, value: '重试不会清除已选条件' } },
  methods: { onRetry() { this.triggerEvent('retry'); }, onClear() { this.triggerEvent('clear'); } },
});
