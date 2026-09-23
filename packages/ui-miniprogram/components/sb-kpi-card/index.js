/** 指标卡（12 章 §3.1、B-03）：数字 32 相当、单位小一号放数字后、说明一行，变化只在业务有好坏时升绿降红，否则灰；缺失显示「未登记」不显示 0；可点。事件 tap */
Component({
  options: { addGlobalClass: true },
  properties: { label: String, value: { type: null, value: null }, unit: String, note: String, change: { type: Object, value: null }, loading: { type: Boolean, value: false }, missingText: { type: String, value: '未登记' },
    size: { type: String, value: 'default' } }, // compact：数字 20px、说明 14px，两列半宽卡或长金额（¥23,130,000）用
  data: { missing: true, text: '未登记', changeTone: 'flat' },
  observers: {
    'value, missingText, loading'(value, missingText, loading) { const missing = value === null || value === undefined || value === ''; this.setData({ missing: missing && !loading, text: loading ? '…' : missing ? missingText : String(value) }); },
    change(c) { let tone = 'flat'; if (c && c.good && c.tone === 'up') tone = 'good'; else if (c && c.good && c.tone === 'down') tone = 'bad'; this.setData({ changeTone: tone }); },
  },
  methods: { onTap() { this.triggerEvent('tap', { label: this.data.label, value: this.data.value }); } },
});
