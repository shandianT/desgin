/** 图表卡片壳（12 章 §3.5、§4、T-05）：标题回答一个问题、范围紧邻、口径进 ⓘ；四态 normal、loading、empty、error；图放默认 slot（ec-canvas），图例放 legend slot；summary 给读屏。事件 retry；caliber（点口径图标） */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: String, scope: String, caliber: String, state: { type: String, value: 'normal' }, emptyTitle: { type: String, value: '这个周期还没有数据' }, emptyDescription: { type: String, value: '换一个周期或范围试试。' }, summary: String,
  },
  methods: {
    onRetry() { this.triggerEvent('retry'); },
    onCaliber() { if (this.data.caliber) wx.showModal({ title: '统计口径', content: this.data.caliber, showCancel: false, confirmText: '知道了' }); this.triggerEvent('caliber'); },
  },
});
