/** 日期选择（C-02、C-03）：一行触发器加 t-date-time-picker，值统一字符串：mode=date 为 'YYYY-MM-DD'，mode=datetime 为 'YYYY-MM-DD HH:mm'（0.9.0 起，任务截止时间这类到分钟的场景）。快捷片默认今天、本周（周日）、本季（季末），datetime 模式下快捷片补 defaultTime。事件 change：{ value } */
const pad = (n) => (n < 10 ? '0' : '') + n;
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseDate = (v) => { if (v === null || v === undefined || v === '') return null; if (typeof v === 'number') return new Date(v); const s = String(v).replace('T', ' ').replace(/-/g, '/').replace(/(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/, ''); const d = new Date(s); return isNaN(d.getTime()) ? null : d; };
const toStr = (v, mode) => { if (v === null || v === undefined || v === '') return ''; const d = parseDate(v); if (!d) return String(v).slice(0, mode === 'datetime' ? 16 : 10); return mode === 'datetime' ? `${fmt(d)} ${fmtTime(d)}` : fmt(d); };
const PRESET = {
  today: { label: '今天', date: () => fmt(new Date()) },
  week: { label: '本周', date: () => { const d = new Date(); const wd = d.getDay() || 7; d.setDate(d.getDate() + (7 - wd)); return fmt(d); } },
  yesterday: { label: '昨天', date: () => { const d = new Date(); d.setDate(d.getDate() - 1); return fmt(d); } },
  quarter: { label: '本季', date: () => { const d = new Date(); const m = Math.floor(d.getMonth() / 3) * 3 + 3; return fmt(new Date(d.getFullYear(), m, 0)); } },
};
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: null, value: '' }, placeholder: { type: String, value: '请选择日期' }, start: { type: null, value: null }, end: { type: null, value: null },
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false }, shortcuts: { type: Array, value: ['today', 'week', 'quarter'] },
    mode: { type: String, value: 'date' }, // date | datetime
    title: String, error: String, help: String, clearable: { type: Boolean, value: false }, // clearable：值旁出清除，发 change { value: '' }
    defaultTime: { type: String, value: '18:00' }, // datetime 模式下快捷片的时刻
    layout: { type: String, value: 'inline' }, // inline：标签左、值右一行；stacked：标签在上、下面一个带细线的框（放进表单白卡）
    plain: { type: Boolean, value: false }, // 不带自己的白底与页边距
  },
  data: { open: false, text: '', pickerValue: '', chips: [] },
  lifetimes: { attached() { this.buildChips(this.data.shortcuts); if (!this.data.pickerValue) this.setData({ pickerValue: this.now() }); } },
  observers: {
    'value, mode'(v, mode) { const s = toStr(v, mode); this.setData({ text: s, pickerValue: s || this.now() }); },
    'shortcuts, mode, defaultTime, start, end'(list) { this.buildChips(list); },
  },
  methods: {
    now() { const d = new Date(); return this.data.mode === 'datetime' ? `${fmt(d)} ${fmtTime(d)}` : fmt(d); },
    buildChips(list) { const t = this.data.mode === 'datetime' ? ' ' + (this.data.defaultTime || '18:00') : ''; const lo = toStr(this.data.start, 'date'), hi = toStr(this.data.end, 'date'); this.setData({ chips: (list || []).map((s) => (typeof s === 'string' ? { key: s, label: PRESET[s] ? PRESET[s].label : s, value: PRESET[s] ? PRESET[s].date() + t : s } : { key: s.value, label: s.label, value: s.value })).filter((c) => { const d = String(c.value).slice(0, 10); return (!lo || d >= lo) && (!hi || d <= hi); }) }); },
    onClear() { if (this.data.disabled) return; this.emit(''); },
    onOpen() { if (!this.data.disabled) this.setData({ open: true }); },
    onClose() { this.setData({ open: false }); },
    onConfirm(e) { const value = toStr(e.detail.value, this.data.mode); this.setData({ open: false }); this.emit(value); },
    onChip(e) { if (this.data.disabled) return; this.emit(e.currentTarget.dataset.value); },
    emit(value) { if (value !== this.data.text) this.triggerEvent('change', { value }); },
  },
});
