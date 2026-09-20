Component({
  options: { addGlobalClass: true },
  properties: { value: { type: null, value: null }, label: String, note: String, missingText: { type: String, value: '未登记' } },
  data: { missing: true, text: '未登记' },
  observers: { 'value, missingText'(value, missingText) { const missing = value === null || value === undefined || value === ''; this.setData({ missing, text: missing ? missingText : String(value) }); } },
});
