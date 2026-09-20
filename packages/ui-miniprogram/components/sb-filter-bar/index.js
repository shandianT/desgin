Component({
  options: { addGlobalClass: true },
  properties: { title: String, scope: String, options: { type: Array, value: [] }, value: { type: Array, value: [] }, resultCount: { type: null, value: null }, resultLabel: { type: String, value: '条' }, disabled: { type: Boolean, value: false } },
  data: { items: [] },
  observers: { 'options, value'(options, value) { this.setData({ items: (options || []).map((o) => ({ ...o, on: (value || []).includes(o.value) })) }); } },
  methods: {
    onChip(e) { if (this.data.disabled) return; const v = e.currentTarget.dataset.value; const cur = this.data.value || []; const next = cur.includes(v) ? cur.filter((x) => x !== v) : cur.concat(v); this.triggerEvent('change', { value: next }); },
    onClear() { this.triggerEvent('change', { value: [] }); },
  },
});
