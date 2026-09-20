Page({
  data: {
    filter: ['risk'], filterOpts: [{ value: 'risk', label: '有风险', count: 6 }, { value: 'main', label: '主攻区', count: 9 }, { value: 'asset', label: '客户资产', count: 7 }, { value: 'mine', label: '本人负责', count: 24 }],
    rows: [{ name: '华宸数据科技有限公司', summary: '客户资产 · 关系 8/10 · 地盘 HB-01', tone: 'good', reason: '近 30 天有高层拜访', time: '2 天前跟进' }, { name: '北辰智造集团', summary: '主攻区 · 关系 4/10', tone: 'watch', reason: '一周无跟进', time: '9 天前跟进' }],
    ai: { value: '张总（CIO）', state: 'ai' }, aiLow: { value: '', state: 'ai' }, submitting: false,
  },
  onFilter(e) { this.setData({ filter: e.detail.value }); },
  onAi(e) { this.setData({ 'ai.value': e.detail.value, 'ai.state': e.detail.state }); },
  onAiConfirm() { this.setData({ 'ai.state': 'confirmed' }); },
  onAiRestore(e) { this.setData({ 'ai.value': e.detail.value, 'ai.state': 'ai' }); },
  onAiLow(e) { this.setData({ 'aiLow.value': e.detail.value, 'aiLow.state': e.detail.state }); },
  onSubmit() { this.setData({ submitting: true }); setTimeout(() => this.setData({ submitting: false }), 1500); },
});
