/**
 * 页面摘要卡（T-02、B-03、14 章）：页面顶部的白卡，替代深色横幅。首字方块与进度条自绘（两三层 view，不引 t-avatar、t-progress）。
 * 标题 20px、副标题与说明 14px、右上范围小标签；可带首字方块、状态标签、一行指标（竖线分隔）、进度条。
 * tags：[{ label, tone }]，tone 为 good／watch／bad／pending 时用 sb-status-tag，否则是中性小标签。
 * metrics：[{ label, value, unit, missingText }]，value 为空显示「未登记」，不显示 0。
 * slot：默认放补充内容；name="side" 放右上角的切换（有 scope 时不显示 side）。
 * 事件 metrictap：{ index, item }（传了 metricsTappable 才发）
 */
const STATUS = ['good', 'watch', 'bad', 'pending', 'unset'];
// 首字方块取字规则与 sb-avatar 一致（中文去姓取后两字、英文取前两个字母）；方块自绘，不引 t-avatar（它连带 t-badge、t-image）
function initials(name) {
  const s = String(name == null ? '' : name).replace(/\s+/g, '');
  if (!s) return '我';
  if (/^[A-Za-z0-9._-]+$/.test(s)) return s.slice(0, 2).toUpperCase();
  return s.length <= 2 ? s : s.slice(-2);
}

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: String, subtitle: String, meta: String, scope: String, mark: String,
    tags: { type: Array, value: [] }, metrics: { type: Array, value: [] }, metricsTappable: { type: Boolean, value: false },
    progress: { type: null, value: null }, progressLabel: String,
    bordered: { type: Boolean, value: false }, // 飞书样式：默认无边框，靠灰底与白卡区分；放在白底上时传 bordered
    size: { type: String, value: 'default' }, // small：标题 16px、指标 20px，页面上方已有大标题（问候语）时用
    loading: { type: Boolean, value: false }, // 数据未到：指标显示「…」，不显示「未登记」
    tone: { type: String, value: '' }, // 顶部 3px 色条：bad 转差（红）、watch 需关注（橙）、brand 主色（看板主卡）；good、pending 与不传都不加。只给对象详情页顶卡在状态异常时用，状态仍以标签为准
  },
  data: { tagList: [], metricList: [], hasProgress: false, percent: 0, markText: '' },
  observers: {
    mark(m) { this.setData({ markText: m ? initials(m) : '' }); },
    tags(tags) { this.setData({ tagList: (tags || []).filter((t) => t && t.label).map((t) => ({ ...t, status: STATUS.includes(t.tone) })) }); },
    'metrics, loading'(list, loading) { this.setData({ metricList: (list || []).map((m) => ({ ...m, missing: !loading && (m.value === null || m.value === undefined || m.value === ''), text: loading ? '…' : m.value })) }); },
    progress(p) { const n = Number(p); const ok = p !== null && p !== undefined && p !== '' && Number.isFinite(n); this.setData({ hasProgress: ok, percent: ok ? Math.max(0, Math.min(100, Math.round(n))) : 0 }); },
  },
  methods: { onMetric(e) { if (!this.data.metricsTappable) return; const index = e.currentTarget.dataset.index; this.triggerEvent('metrictap', { index, item: this.data.metrics[index] }); } },
});
