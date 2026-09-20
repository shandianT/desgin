Component({
  options: { addGlobalClass: true },
  properties: { label: String, required: { type: Boolean, value: false }, value: String, aiValue: String, state: { type: String, value: 'ai' }, confidence: { type: String, value: 'high' }, candidates: { type: Array, value: [] }, error: String },
  data: { low: false },
  observers: { 'confidence, state'(c, s) { this.setData({ low: c === 'low' && s === 'ai' }); } },
  methods: {
    onInput(e) { this.triggerEvent('change', { value: e.detail.value, state: this.data.state === 'ai' ? 'edited' : this.data.state }); },
    onPick(e) { this.triggerEvent('change', { value: e.currentTarget.dataset.value, state: 'edited' }); },
    onConfirm() { this.triggerEvent('confirm'); },
    onRestore() { this.triggerEvent('restore', { value: this.data.aiValue }); },
  },
});
