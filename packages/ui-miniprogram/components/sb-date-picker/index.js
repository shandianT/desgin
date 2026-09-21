/** 日期选择（C-02、C-03）：sb-field 风格的一行触发器加 t-date-time-picker（mode date），值统一 'YYYY-MM-DD' 字符串。快捷片默认今天、本周（周日）、本季（季末），点了直接选中。事件 change：{ value } */
const pad = (n) => (n < 10 ? '0' : '') + n;
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toStr = (v) => { if (v === null || v === undefined || v === '') return ''; if (typeof v === 'number') return fmt(new Date(v)); const d = new Date(String(v).replace(/-/g, '/')); return String(v).length >= 10 && !isNaN(d.getTime()) ? fmt(d) : String(v).slice(0, 10); };
const PRESET = {
  today: { label: '今天', date: () => fmt(new Date()) },
  week: { label: '本周', date: () => { const d = new Date(); const wd = d.getDay() || 7; d.setDate(d.getDate() + (7 - wd)); return fmt(d); } },
  quarter: { label: '本季', date: () => { const d = new Date(); const m = Math.floor(d.getMonth() / 3) * 3 + 3; return fmt(new Date(d.getFullYear(), m, 0)); } },
};
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: null, value: '' }, placeholder: { type: String, value: '请选择日期' }, start: { type: null, value: null }, end: { type: null, value: null },
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false }, shortcuts: { type: Array, value: ['today', 'week', 'quarter'] },
  },
  data: { open: false, text: '', pickerValue: '', chips: [] },
  lifetimes: { attached() { this.buildChips(this.data.shortcuts); if (!this.data.pickerValue) this.setData({ pickerValue: fmt(new Date()) }); } },
  observers: {
    value(v) { const s = toStr(v); this.setData({ text: s, pickerValue: s || fmt(new Date()) }); },
    shortcuts(list) { this.buildChips(list); },
  },
  methods: {
    buildChips(list) { this.setData({ chips: (list || []).map((s) => (typeof s === 'string' ? { key: s, label: PRESET[s] ? PRESET[s].label : s, value: PRESET[s] ? PRESET[s].date() : s } : { key: s.value, label: s.label, value: s.value })) }); },
    onOpen() { if (!this.data.disabled) this.setData({ open: true }); },
    onClose() { this.setData({ open: false }); },
    onConfirm(e) { const value = toStr(e.detail.value); this.setData({ open: false }); this.emit(value); },
    onChip(e) { if (this.data.disabled) return; this.emit(e.currentTarget.dataset.value); },
    emit(value) { if (value !== this.data.text) this.triggerEvent('change', { value }); },
  },
});
