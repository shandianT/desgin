// 时间轴（C-05、B-01）：跟进历史、业务动态。tdesign 小程序没有时间轴，这里用 view 自绘：左侧一条竖线加圆点，圆点色只由 tone 决定
// （good 成功、watch 警示、bad 危险、pending 主色、neutral 灰）。items 与 Web 端 SbTimeline 同一结构；pending 是末尾「进行中」占位；空列表不画空轴。
const TONES = ['good', 'watch', 'bad', 'pending', 'neutral'];
Component({
  options: { addGlobalClass: true },
  properties: { items: { type: Array, value: [] }, pending: String, reverse: { type: Boolean, value: false }, size: { type: String, value: 'default' }, loading: { type: Boolean, value: false }, emptyText: { type: String, value: '还没有记录' } },
  data: { list: [] },
  observers: {
    'items, reverse'(items, reverse) {
      const list = (items || []).map((it, i) => ({ key: it.key != null ? it.key : i, time: it.time || '', title: it.title || '', description: it.description || '', actor: it.actor || '', tone: TONES.includes(it.tone) ? it.tone : 'neutral', tappable: !!it.tappable, raw: it }));
      this.setData({ list: reverse ? list.reverse() : list });
    },
  },
  methods: { onTap(e) { const it = this.data.list[e.currentTarget.dataset.index]; if (it && it.tappable) this.triggerEvent('tap', { item: it.raw }); } },
});
