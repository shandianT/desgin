// 每个组件的用例（test/run.cjs 读）：data 是属性，expect 是渲染后应含的文字，event 触发一次交互并返回是否触发了对外事件。
const exparser = require('miniprogram-exparser');
// 点某个节点：自绘节点用组件选择器；t-* 上游组件的宿主选不到，就从它内部的真实 DOM 节点沿 exparser 冒泡上来，和真机的 tap 冒泡一致
const tapFirst = (sel, ev, domSel) => async (comp, simulate) => {
  let hit = false; comp.addEventListener(ev, () => (hit = true));
  const el = comp.querySelector(sel);
  if (el) el.dispatchEvent('tap');
  else { const d = comp.dom.querySelector(domSel || sel); if (!d || !d.__wxElement) throw new Error('找不到 ' + sel); exparser.Event.dispatchEvent(d.__wxElement, exparser.Event.create('tap', {}, { bubbles: true, capturePhase: true, composed: true })); }
  await simulate.sleep(20); return hit;
};
module.exports = {
  'sb-icon': [
    { title: '三档尺寸', data: { name: 'customer', size: 'lg' } },
    { title: '语义色', data: { name: 'risk', tone: 'warning', size: 'md' } },
    { title: '带底方块', data: { name: 'visit', tile: true, tone: 'primary', size: 'lg', label: '拜访' }, expect: ['sb-icon-tile'] },
    { title: '未知名字不渲染', data: { name: 'nope' }, empty: true },
  ],
  'sb-status-tag': [
    { title: '向好', data: { tone: 'good' }, expect: ['向好'] },
    { title: '需关注带依据', data: { tone: 'watch', reason: '一周无跟进', showReason: true }, expect: ['需关注', '一周无跟进'] },
    { title: '未登记', data: { tone: 'unset' }, expect: ['未登记'] },
  ],
  'sb-state-panel': [
    { title: '加载中', data: { state: 'loading' }, expect: ['正在加载'] },
    { title: '骨架', data: { state: 'loading', skeleton: true } },
    { title: '空', data: { state: 'empty', showClear: true }, expect: ['没有匹配', '清除条件'], event: tapFirst('t-button', 'clear', '.t-button--t-button') },
    { title: '失败并重试', data: { state: 'error' }, expect: ['重试', '不会清除'], event: tapFirst('t-button', 'retry', '.t-button--t-button') },
    { title: '无权限', data: { state: 'forbidden' }, expect: ['权限'] },
  ],
  'sb-filter-bar': [
    { title: '已选', data: { title: '客户', scope: '本人负责', options: [{ value: 'risk', label: '有风险', count: 6 }, { value: 'main', label: '主攻区', count: 9 }], value: ['risk'], resultCount: 6 }, expect: ['有风险', '已选 1 项', '共 6'], event: tapFirst('.sb-chip', 'change') },
    { title: '禁用', data: { options: [{ value: 'a', label: '甲' }], disabled: true }, expect: ['甲'] },
  ],
  'sb-search': [{ title: '默认', data: { value: '华宸' } }, { title: '加载中', data: { loading: true } }, { title: '禁用', data: { disabled: true } }],
  'sb-list-row': [
    { title: '默认', data: { name: '华宸数据', summary: '客户资产', tone: 'good', time: '2 天前' }, expect: ['华宸数据', '客户资产', '向好', '2 天前'], event: tapFirst('.sb-row', 'tap') },
    { title: '选中', data: { name: '北辰', selected: true }, expect: ['北辰'] },
    { title: '无权限', data: { name: '某客户', disabled: true, disabledReason: '不在授权范围' }, expect: ['无权限', '不在授权范围'] },
  ],
  'sb-bottom-bar': [
    { title: '默认', data: { primaryLabel: '归档', secondaryLabel: '存草稿' }, expect: ['归档', '存草稿'], event: tapFirst('t-button', 'secondary', '.t-button--t-button') },
    { title: '处理中', data: { primaryLabel: '归档', loading: true }, expect: ['处理中'] },
    { title: '禁用说原因', data: { primaryLabel: '归档', disabled: true, disabledReason: '还有 3 项必填' }, expect: ['还有 3 项必填'] },
  ],
  'sb-field': [
    { title: '必填', data: { label: '客户名称', required: true }, expect: ['客户名称', '*'] },
    { title: '错误', data: { label: '下一步', error: '要含时间与目标' }, expect: ['要含时间与目标'] },
    { title: '只读', data: { label: '地盘', readOnly: true, value: 'HB-01' }, expect: ['HB-01'] },
  ],
  'sb-sheet': [{ title: '打开', data: { visible: true, title: '选择季度', confirmLabel: '应用' }, expect: ['选择季度', '取消', '应用'], event: tapFirst('t-button', 'close', '.t-button--t-button') }, { title: '处理中', data: { visible: true, title: '选择季度', confirmLabel: '应用', confirmLoading: true }, expect: ['处理中'] }],
  'sb-pagination': [
    { title: '中间页', data: { current: 2, total: 124, pageSize: 20 }, expect: ['共 124', '第 2／7 页'], event: tapFirst('t-button', 'change', '.t-button--t-button') },
    { title: '末页', data: { current: 7, total: 124, pageSize: 20 } },
    { title: '加载更多', data: { mode: 'more', total: 124 }, expect: ['共 124', '加载更多'], event: tapFirst('t-button', 'more', '.t-button--t-button') },
    { title: '加载更多到底', data: { mode: 'more', total: 124, end: true }, expect: ['已显示全部'] },
  ],
  'sb-metric-tile': [{ title: '有值', data: { value: 24, label: '客户数' }, expect: ['24', '客户数'] }, { title: '缺失', data: { value: null, label: '毛利' }, expect: ['未登记'] }],
  'sb-page-header': [{ title: '默认', data: { title: '客户', scope: '本人负责 · 24 家' }, expect: ['客户', '24 家'] }],
  'sb-ai-badge': [{ title: '生成中', data: { state: 'generating' }, expect: ['AI'] }, { title: '待确认', data: { state: 'pending' }, expect: ['待确认'] }, { title: '已确认', data: { state: 'confirmed', confirmedBy: '李鹏程' }, expect: ['李鹏程'] }],
  'sb-ai-field': [
    { title: 'AI 原值待确认', data: { label: '联系人角色', value: '张总（CIO）', state: 'ai' }, expect: ['联系人角色', '待确认', '确认'], event: tapFirst('.sb-link', 'confirm') },
    { title: '人已修改', data: { label: '联系人角色', value: '张总', aiValue: '张总（CIO）', state: 'edited' }, expect: ['已由你修改', '恢复'], event: tapFirst('.sb-link', 'restore') },
    { title: '已确认', data: { label: '联系人角色', value: '张总', state: 'confirmed' }, expect: ['已确认'] },
    { title: '低把握给候选', data: { label: '客户预算', value: '', state: 'ai', confidence: 'low', candidates: ['200 万', '320 万'] }, expect: ['不确定', '200 万'], event: tapFirst('.sb-chip', 'change') },
    { title: '错误', data: { label: '客户预算', error: '必填' }, expect: ['必填'] },
  ],
  'sb-ai-sources': [
    { title: '折叠', data: { items: [{ key: 1, title: '9 月 12 日拜访记录', description: '已获得 CIO 支持' }] }, expect: ['依据 1 条'] },
    { title: '展开', data: { items: [{ key: 1, title: '9 月 12 日拜访记录' }], defaultExpanded: true }, expect: ['9 月 12 日拜访记录'], event: tapFirst('.sb-sources-item', 'tap') },
    { title: '无依据', data: { items: [] }, expect: ['依据'] },
  ],
  'sb-ai-progress': [
    { title: '进行中', data: { stages: ['转写语音', '提取字段'], current: 1, status: 'running' }, expect: ['提取字段', '取消'], event: tapFirst('t-button', 'cancel', '.t-button--t-button') },
    { title: '已取消', data: { stages: ['转写语音'], status: 'cancelled' }, expect: ['已取消'] },
    { title: '失败', data: { stages: ['转写语音'], status: 'failed' }, expect: ['失败', '重试'], event: tapFirst('t-button', 'retry', '.t-button--t-button') },
    { title: '完成', data: { stages: ['转写语音'], current: 1, status: 'done' }, expect: ['完成'] },
  ],
};
