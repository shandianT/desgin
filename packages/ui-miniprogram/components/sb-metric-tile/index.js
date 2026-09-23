Component({
  options: { addGlobalClass: true },
  properties: { value: { type: null, value: null }, label: String, note: String, missingText: { type: String, value: '未登记' },
    bordered: { type: Boolean, value: false } }, // 飞书样式默认无边框；单独放在白底上时传 bordered
  data: { missing: true, text: '未登记' },
  observers: { 'value, missingText'(value, missingText) { const missing = value === null || value === undefined || value === ''; this.setData({ missing, text: missing ? missingText : String(value) }); } },
});
