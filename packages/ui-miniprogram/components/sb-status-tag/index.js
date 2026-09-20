const TONES = { good: '向好', watch: '需关注', bad: '转差', pending: '待评估', unset: '未登记' };
Component({
  options: { addGlobalClass: true },
  properties: { tone: { type: String, value: 'pending' }, label: String, reason: String, showReason: { type: Boolean, value: false } },
  data: { text: '' },
  observers: { 'tone, label'(tone, label) { this.setData({ text: label || TONES[tone] || tone }); } },
});
