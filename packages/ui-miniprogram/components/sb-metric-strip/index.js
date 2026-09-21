/** 指标条（T-05、B-03）：指标卡两列排，右上周期切换与口径说明。缺失显示未登记，加载中显示正在读取。事件 periodchange：{ value }；caliber：点了口径图标 */
Component({
  options: { addGlobalClass: true },
  properties: { items: { type: Array, value: [] }, periods: { type: Array, value: [] }, period: { type: null, value: null }, caliber: String, loading: { type: Boolean, value: false } },
  methods: {
    onPeriod(e) { const v = e.currentTarget.dataset.value; if (v !== this.data.period) this.triggerEvent('periodchange', { value: v }); },
    onCaliber() { if (this.data.caliber) wx.showModal({ title: '统计口径', content: this.data.caliber, showCancel: false, confirmText: '知道了' }); this.triggerEvent('caliber'); },
  },
});
