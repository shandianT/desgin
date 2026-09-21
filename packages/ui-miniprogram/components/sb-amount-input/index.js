/** 金额输入（C-02、B-03）：t-input（type digit）薄壳，单位默认万元显示在右侧，只收正数；失焦显示千分位，聚焦还原纯数字。事件 change：{ value: number|null } */
const fmtDisplay = (n, precision) => { if (n === null || n === undefined) return ''; const s = Number(n).toFixed(precision).replace(/\.?0+$/, ''); const [i, d] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : ''); };
const parse = (s, precision) => { const t = String(s || '').replace(/[^\d.]/g, ''); if (!t || t === '.') return null; const n = Number(t); if (!isFinite(n) || n < 0) return null; const p = Math.pow(10, precision); return Math.round(n * p) / p; };
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: null, value: null }, placeholder: { type: String, value: '请输入金额' }, unit: { type: String, value: '万元' },
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false }, precision: { type: Number, value: 2 },
  },
  data: { text: '', focused: false },
  observers: { 'value, precision'(v, p) { if (!this.data.focused) this.setData({ text: fmtDisplay(v, p) }); } },
  methods: {
    onFocus() { const v = this.data.value; this.setData({ focused: true, text: v === null || v === undefined ? '' : String(v) }); },
    onBlur() { const v = parse(this.data.text, this.data.precision); this.setData({ focused: false, text: fmtDisplay(v, this.data.precision) }); if (v !== this.data.value) this.triggerEvent('change', { value: v }); },
    onInput(e) {
      const raw = String(e.detail.value || '').replace(/[^\d.]/g, '').replace(/^(\d*\.\d*).*$/, '$1');
      const v = parse(raw, this.data.precision);
      this.setData({ text: raw });
      if (v !== this.data.value) this.triggerEvent('change', { value: v });
    },
  },
});
