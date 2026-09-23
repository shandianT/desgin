/**
 * 描述列表（C-05、B-03）：只读的「标签：值」清单，任务详情、拜访详情、建档核对都用。
 * layout=row 一行一项（t-cell，标签左、值右，可点的行带箭头）；layout=grid 两列紧凑排。
 * items：[{ key, label, value, required, missingText, tone, tappable }]
 *   value 为空：required 时显示「待补充」（提醒色），否则显示 missingText 或「未填写」（弱化色）。不把空显示成 0。
 *   tone=danger／warning／primary 只给值上色（逾期时间、提醒），其余用正文色。
 * 事件 tap：{ key, index, item }（行 tappable 时发）
 */
Component({
  options: { addGlobalClass: true },
  properties: { items: { type: Array, value: [] }, layout: { type: String, value: 'row' }, title: String },
  data: { list: [] },
  observers: {
    items(items) {
      this.setData({ list: (items || []).map((it, i) => {
        const empty = it.value === null || it.value === undefined || it.value === '';
        return { ...it, key: it.key || String(i), empty, text: empty ? (it.required ? '待补充' : (it.missingText || '未填写')) : String(it.value), cls: empty ? (it.required ? 'is-todo' : 'is-empty') : (it.tone ? 'is-' + it.tone : '') };
      }) });
    },
  },
  methods: { onTap(e) { const index = e.currentTarget.dataset.index; const item = this.data.items[index]; if (!item || !item.tappable) return; this.triggerEvent('tap', { key: this.data.list[index].key, index, item }); } },
});
