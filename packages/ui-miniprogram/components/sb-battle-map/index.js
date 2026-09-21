/** 作战地图（12 章 §2、§2.6）：自绘四象限，view 绝对定位不用 canvas。横轴潜力左小右大，纵轴关系下浅上深；点色表示状态、点大小表示金额档；重叠聚合、超过 30 个点默认聚合；缺关系或潜力的不画进格子。
 *  事件 pointtap：{ point }；clustertap：{ points }；zoomchange：{ zoom }；unratedtap；emptyaction */
const QUADS = [
  { key: 'asset', name: '客户资产', short: '资产', hiP: true, hiR: true },
  { key: 'attack', name: '主攻区', short: '主攻', hiP: false, hiR: true },
  { key: 'resource', name: '客户资源', short: '资源', hiP: true, hiR: false },
  { key: 'spot', name: '见单打单', short: '见单', hiP: false, hiR: false },
];
const SIZE = { small: 32, medium: 40, large: 52 };
const PAD = 5; // 图内留白百分比，点不贴边
const num = (v) => { const n = Number(v); return isFinite(n) && v !== null && v !== '' ? n : null; };
const valid = (p) => { const a = num(p.potential), b = num(p.relationship); return a !== null && b !== null && a >= 1 && a <= 10 && b >= 1 && b <= 10; };
const pct = (v, lo, hi) => { const r = hi > lo ? (v - lo) / (hi - lo) : 0.5; return PAD + Math.min(1, Math.max(0, r)) * (100 - 2 * PAD); };
Component({
  options: { addGlobalClass: true },
  properties: {
    points: { type: Array, value: [] }, thresholds: { type: Object, value: { potential: 5.5, relationship: 5.5 } }, zoom: { type: String, value: '' },
    selectedId: { type: null, value: null }, unrated: { type: Number, value: 0 }, loading: { type: Boolean, value: false },
  },
  data: { quads: [], marks: [], counts: [], xLine: 50, yLine: 50, empty: true, zoomName: '', summary: '' },
  lifetimes: { attached() { this.build(); } },
  observers: { 'points, thresholds, zoom, selectedId, unrated'() { this.build(); } },
  methods: {
    quadOf(p, t) { const hiP = num(p.potential) >= t.potential, hiR = num(p.relationship) >= t.relationship; return QUADS.find((q) => q.hiP === hiP && q.hiR === hiR).key; },
    build() {
      const t = { potential: 5.5, relationship: 5.5, ...(this.data.thresholds || {}) };
      const all = (this.data.points || []).filter(valid).map((p) => ({ ...p, quad: this.quadOf(p, t) }));
      const counts = QUADS.map((q) => ({ key: q.key, short: q.short, name: q.name, count: all.filter((p) => p.quad === q.key).length }));
      const zoomQ = QUADS.find((q) => q.key === this.data.zoom) || null;
      const shown = zoomQ ? all.filter((p) => p.quad === zoomQ.key) : all;
      const range = zoomQ
        ? { pLo: zoomQ.hiP ? t.potential : 1, pHi: zoomQ.hiP ? 10 : t.potential, rLo: zoomQ.hiR ? t.relationship : 1, rHi: zoomQ.hiR ? 10 : t.relationship }
        : { pLo: 1, pHi: 10, rLo: 1, rHi: 10 };
      const placed = shown.map((p) => ({ ...p, x: pct(num(p.potential), range.pLo, range.pHi), y: pct(num(p.relationship), range.rLo, range.rHi), size: SIZE[p.amountBand] || SIZE.medium }));
      // 聚合：距离小于一个点（按 700rpx 宽的图折算成百分比）；超过 30 个点放宽半径默认聚合
      const radius = placed.length > 30 ? 9 : 6;
      const clusters = [];
      for (const p of placed) {
        const c = clusters.find((k) => Math.hypot(k.x - p.x, k.y - p.y) < radius);
        if (c) { c.items.push(p); c.x = c.items.reduce((s, i) => s + i.x, 0) / c.items.length; c.y = c.items.reduce((s, i) => s + i.y, 0) / c.items.length; } else clusters.push({ x: p.x, y: p.y, items: [p] });
      }
      const sel = this.data.selectedId;
      const marks = clusters.map((c, i) => {
        if (c.items.length === 1) { const p = c.items[0]; return { id: String(p.id), key: 'p' + i, cluster: false, x: p.x, y: p.y, size: p.size, tone: p.tone || 'pending', name: p.name, selected: sel !== null && sel !== undefined && String(sel) === String(p.id), items: [p], label: `${p.name}，潜力 ${p.potential}，关系 ${p.relationship}` }; }
        const selected = sel !== null && sel !== undefined && c.items.some((p) => String(p.id) === String(sel));
        return { id: 'c' + i, key: 'c' + i, cluster: true, x: c.x, y: c.y, size: 64, count: c.items.length, selected, items: c.items, name: selected ? c.items.find((p) => String(p.id) === String(sel)).name : '', label: `${c.items.length} 家客户重叠` };
      });
      const summary = counts.map((c) => `${c.name} ${c.count} 家`).join('，') + (this.data.unrated > 0 ? `，待评估 ${this.data.unrated} 家` : '');
      this.setData({
        quads: QUADS, marks, counts, xLine: pct(t.potential, 1, 10), yLine: pct(t.relationship, 1, 10), empty: all.length === 0, zoomName: zoomQ ? zoomQ.name : '', summary,
      });
    },
    onQuadName(e) { wx.showToast({ title: e.currentTarget.dataset.name, icon: 'none' }); },
    onMark(e) { const m = this.data.marks[e.currentTarget.dataset.index]; if (!m) return; if (m.cluster) this.triggerEvent('clustertap', { points: m.items }); else this.triggerEvent('pointtap', { point: m.items[0] }); },
    onCount(e) { const key = e.currentTarget.dataset.key; this.triggerEvent('zoomchange', { zoom: key === this.data.zoom ? '' : key }); },
    onBack() { this.triggerEvent('zoomchange', { zoom: '' }); },
    onUnrated() { this.triggerEvent('unratedtap'); },
    onEmpty() { this.triggerEvent('emptyaction'); },
  },
});
