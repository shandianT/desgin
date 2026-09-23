/** 金额输入（C-02、B-03）：t-input（type digit）薄壳，单位默认万元显示在右侧，只收正数；失焦显示千分位，聚焦还原纯数字。
 * 事件 change：{ value: number|null }；valueType="string" 时（0.9.1）全程按字符串处理、不经 Number（避免 0.1+0.2 这类精度误差与大数），空值为 ''，change 发 { value: string }。 */
const fmtDisplay = (n, precision) => { if (n === null || n === undefined) return ''; const s = Number(n).toFixed(precision).replace(/\.?0+$/, ''); const [i, d] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : ''); };
const clean = (s, precision) => { let t = String(s == null ? '' : s).replace(/[^\d.]/g, ''); const i = t.indexOf('.'); if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '').slice(0, precision); if (precision === 0) t = t.replace('.', ''); return t; };
const fmtString = (s) => { if (s === '' || s == null) return ''; const [i, d] = String(s).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d !== undefined && d !== '' ? '.' + d : ''); };
const parse = (s, precision) => { const t = String(s || '').replace(/[^\d.]/g, ''); if (!t || t === '.') return null; const n = Number(t); if (!isFinite(n) || n < 0) return null; const p = Math.pow(10, precision); return Math.round(n * p) / p; };
Component({
  options: { addGlobalClass: true },
  properties: {
    label: String, value: { type: null, value: null }, placeholder: { type: String, value: '请输入金额' }, unit: { type: String, value: '万元' },
    disabled: { type: Boolean, value: false }, required: { type: Boolean, value: false }, precision: { type: Number, value: 2 }, // 0～6
    valueType: { type: String, value: 'number' }, // number | string
    maxlength: { type: Number, value: -1 },
    layout: { type: String, value: 'inline' }, // inline：标签左、值右一行；stacked：标签在上、下面一个带细线的框（放进表单白卡）
    plain: { type: Boolean, value: false }, // 不带自己的白底与页边距
  },
  data: { text: '', focused: false },
  observers: { 'value, precision, valueType'(v, p, vt) { if (!this.data.focused) this.setData({ text: vt === 'string' ? fmtString(clean(v, p)) : fmtDisplay(v, p) }); } },
  methods: {
    onFocus() { const v = this.data.value; this.setData({ focused: true, text: v === null || v === undefined ? '' : (this.data.valueType === 'string' ? clean(v, this.data.precision) : String(v)) }); },
    onBlur() { if (this.data.valueType === 'string') { const s = clean(this.data.text, this.data.precision).replace(/\.$/, ''); this.setData({ focused: false, text: fmtString(s) }); if (s !== String(this.data.value == null ? '' : this.data.value)) this.triggerEvent('change', { value: s }); return; }
      const v = parse(this.data.text, this.data.precision); this.setData({ focused: false, text: fmtDisplay(v, this.data.precision) }); if (v !== this.data.value) this.triggerEvent('change', { value: v }); },
    onInput(e) {
      if (this.data.valueType === 'string') { const s = clean(e.detail.value, this.data.precision); this.setData({ text: s }); this.triggerEvent('change', { value: s }); return; }
      const raw = String(e.detail.value || '').replace(/[^\d.]/g, '').replace(/^(\d*\.\d*).*$/, '$1');
      const v = parse(raw, this.data.precision);
      this.setData({ text: raw });
      if (v !== this.data.value) this.triggerEvent('change', { value: v });
    },
  },
});
