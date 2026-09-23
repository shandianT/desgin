/** 指标卡（12 章 §3.1、B-03）：数字 32 相当、单位小一号放数字后、说明一行，变化只在业务有好坏时升绿降红，否则灰；缺失显示「未登记」不显示 0；可点。事件 tap */
Component({
  options: { addGlobalClass: true },
  properties: { label: String, value: { type: null, value: null }, unit: String, note: String, change: { type: Object, value: null }, loading: { type: Boolean, value: false }, missingText: { type: String, value: '未登记' },
    size: { type: String, value: 'default' }, // compact：数字 20px、说明 14px，两列半宽卡或长金额（¥23,130,000）用
    bordered: { type: Boolean, value: false }, // 飞书样式：默认无边框，靠灰底与白卡区分；放在白底上时传 bordered
    tappable: { type: Boolean, value: false }, // 可点（下钻）时传 true：才有按下态与读屏「按钮」；放在可点的外层里时不要传，免得两层按下态叠加
  },
  data: { missing: true, text: '未登记', changeTone: 'flat', long: false },
  observers: {
    'value, missingText, loading'(value, missingText, loading) { const missing = value === null || value === undefined || value === ''; const text = loading ? '…' : missing ? missingText : String(value); this.setData({ missing: missing && !loading, text, long: !missing && !loading && text.length > 11 }); }, // 超过 11 个字符（¥123,456,789 起）compact 下降到 16px
    change(c) { let tone = 'flat'; if (c && c.good && c.tone === 'up') tone = 'good'; else if (c && c.good && c.tone === 'down') tone = 'bad'; this.setData({ changeTone: tone }); },
  },
  methods: { onTap() { this.triggerEvent('tap', { label: this.data.label, value: this.data.value }); } },
});
