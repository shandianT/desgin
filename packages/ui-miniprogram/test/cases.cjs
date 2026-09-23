// 每个组件的用例（test/run.cjs 读）：data 是属性，expect 是渲染后应含的文字，event 触发一次交互并返回是否触发了对外事件。
const exparser = require('miniprogram-exparser');
// 点某个节点：自绘节点用组件选择器；t-* 上游组件的宿主选不到，就从它内部的真实 DOM 节点沿 exparser 冒泡上来，和真机的 tap 冒泡一致
// 点第 n 个（模拟器的选择器不支持 :last-child）
const tapNth = (sel, ev, n) => async (comp, simulate) => {
  let hit = false; comp.addEventListener(ev, () => (hit = true));
  const all = comp.querySelectorAll(sel); const el = all[n < 0 ? all.length + n : n];
  if (!el) throw new Error('找不到 ' + sel + ' 第 ' + n + ' 个'); el.dispatchEvent('tap'); await simulate.sleep(20); return hit;
};
const tapFirst = (sel, ev, domSel) => async (comp, simulate) => {
  let hit = false; comp.addEventListener(ev, () => (hit = true));
  const el = comp.querySelector(sel);
  if (el) el.dispatchEvent('tap');
  else { const d = comp.dom.querySelector(domSel || sel); if (!d || !d.__wxElement) throw new Error('找不到 ' + sel); exparser.Event.dispatchEvent(d.__wxElement, exparser.Event.create('tap', {}, { bubbles: true, capturePhase: true, composed: true })); }
  await simulate.sleep(20); return hit;
};
// 点 t-* 内部第 n 个真实 DOM 节点（宿主选不到时用），沿 exparser 冒泡
const tapDomNth = (domSel, ev, n) => async (comp, simulate) => {
  let hit = false; comp.addEventListener(ev, () => (hit = true));
  const all = comp.dom.querySelectorAll(domSel); const d = all[n < 0 ? all.length + n : n];
  if (!d || !d.__wxElement) throw new Error('找不到 ' + domSel + ' 第 ' + n + ' 个');
  exparser.Event.dispatchEvent(d.__wxElement, exparser.Event.create('tap', {}, { bubbles: true, capturePhase: true, composed: true }));
  await simulate.sleep(20); return hit;
};
// 输入类：模拟器里敲不了键盘，直接调组件里接 t-input／t-textarea／t-picker 事件的方法，再看有没有对外发事件
const callMethod = (method, detail, ev) => async (comp, simulate) => {
  let hit = false; comp.addEventListener(ev, () => (hit = true));
  comp.instance[method]({ detail }); await simulate.sleep(20); return hit;
};
module.exports = {
  'sb-summary-card': [
    { title: '小号加载中', data: { size: 'small', loading: true, title: '今日经营摘要', metrics: [{ label: '今日待办', value: null }] }, expect: ['今日经营摘要', '…', 'small'] },
    { title: '标题加指标', data: { title: '我的待办', subtitle: '每一项都可进入详情', scope: '仅本人', metrics: [{ label: '未完成', value: 18 }, { label: '已完成', value: 4 }, { label: '毛利', value: null }] }, expect: ['我的待办', '仅本人', '18', '未登记'] },
    { title: '客户摘要', data: { mark: '星河智能', title: '星河智能制造（广州）有限公司', subtitle: '制造业 · 渠道销售-南区', tags: [{ label: '主攻区' }, { label: '需关注', tone: 'watch' }] }, expect: ['星河智能制造', '主攻区', '需关注'] },
    { title: '进度', data: { title: '创建新客户', progress: 25, progressLabel: '必填已完成 2／8' }, expect: ['必填已完成 2／8'] },
    { title: '指标可点', data: { title: '风险中心', metricsTappable: true, metrics: [{ label: '待解除', value: 2 }] }, expect: ['待解除'], event: tapNth('.sb-summary-metric', 'metrictap', 0) },
  ],
  'sb-desc-list': [
    { title: '行式', data: { items: [{ label: '负责人', value: '王新源' }, { label: '截止时间', value: '2026年9月23日 09:00', tone: 'danger' }, { label: '关联商机', value: '知识助理项目', tappable: true }] }, expect: ['负责人', '王新源', '知识助理项目'] },
    { title: '空值与待补充', data: { items: [{ label: '合作伙伴', value: '' }, { label: '客户来源', value: null, required: true }] }, expect: ['未填写', '待补充'] },
    { title: '两列', data: { layout: 'grid', items: [{ label: '客户类型', value: '商机客户' }, { label: '拜访方式', value: '线上会议' }] }, expect: ['商机客户', '线上会议'] },
    { title: '两列可点', data: { layout: 'grid', items: [{ key: 'op', label: '商机', value: '智能质检', tappable: true }] }, expect: ['智能质检'], event: tapNth('.sb-desc-cell', 'tap', 0) },
  ],
  'sb-section': [
    { title: '标题说明链接', data: { title: '当前商机', description: '4 个商机', extraLabel: '查看全部' }, expect: ['当前商机', '4 个商机', '查看全部'], event: tapNth('.sb-section-extra', 'extra', 0) },
    { title: '无卡片', data: { title: '判断依据', plain: true }, expect: ['判断依据', 'is-plain'] },
  ],
  'sb-tab-bar': [
    { title: '默认五个 Tab', data: { value: 'home' }, expect: ['总览', '客户', '商机', '拜访', '我的'], event: tapDomNth('.t-tab-bar-item--t-tab-bar-item__icon', 'change', 1) },
    { title: '自定义三个', data: { items: [{ key: 'a', label: '看板', icon: 'dashboard', pagePath: 'pages/bi/index' }, { key: 'b', label: '任务', icon: 'task', pagePath: 'pages/tasks/index' }], value: 'b' }, expect: ['看板', '任务'] },
  ],
  'sb-date-picker': [
    { title: '未选带快捷片', data: { label: '下次拜访', required: true }, expect: ['下次拜访', '*', '请选择日期', '今天', '本周', '本季'], event: tapFirst('.sb-chip', 'change') },
    { title: '已选', data: { label: '签约日期', value: '2026-09-30' }, expect: ['2026-09-30'], event: callMethod('onConfirm', { value: '2026-10-08' }, 'change') },
    { title: '禁用不出快捷片', data: { label: '签约日期', value: '2026-09-30', disabled: true }, expect: ['2026-09-30'] },
  ],
  'sb-select': [
    { title: '未选', data: { label: '商机阶段', required: true, options: [{ value: 'a', label: '识别' }, { value: 'b', label: '验证', count: 3 }] }, expect: ['商机阶段', '*', '请选择'], event: callMethod('onConfirm', { value: ['b'] }, 'change') },
    { title: '已选', data: { label: '商机阶段', value: 'a', options: [{ value: 'a', label: '识别' }, { value: 'c', label: '签约', disabled: true }] }, expect: ['识别'] },
  ],
  'sb-amount-input': [
    { title: '有值千分位', data: { label: '预算', value: 1200.5, required: true }, expect: ['预算', '*', '万元'], event: async (comp, simulate) => comp.instance.data.text === '1,200.5' && (await callMethod('onInput', { value: '320' }, 'change')(comp, simulate)) && comp.instance.data.text === '320' },
    { title: '空值改单位', data: { label: '合同额', unit: '元' }, expect: ['合同额', '元'], event: async (comp, simulate) => { comp.instance.onFocus(); comp.instance.onInput({ detail: { value: '12a.345' } }); await simulate.sleep(10); let hit = false; comp.addEventListener('change', (e) => (hit = e.detail.value === 12.35)); comp.instance.onBlur(); await simulate.sleep(10); return hit && comp.instance.data.text === '12.35'; } },
  ],
  'sb-textarea': [
    { title: '必填带字数', data: { label: '拜访摘要', required: true, value: '已获得 CIO 支持', maxlength: 200 }, expect: ['拜访摘要', '*', '200'], event: callMethod('onInput', { value: '改了' }, 'change') },
    { title: '禁用', data: { label: '备注', disabled: true, value: '只读内容' }, expect: ['备注'] },
  ],
  'sb-segmented': [
    { title: '撑满一行', data: { block: true, options: [{ value: 'a', label: '营销成熟度' }, { value: 'b', label: '营销效率' }, { value: 'c', label: '销售画像' }], value: 'a' }, expect: ['营销效率', 'block'] },
    { title: '中号', data: { options: [{ value: 'map', label: '地图' }, { value: 'list', label: '列表' }], value: 'map' }, expect: ['地图', '列表'], event: tapNth('.sb-seg-item', 'change', -1) },
    { title: '小号带禁用', data: { size: 'small', options: [{ value: 'q', label: '本季' }, { value: 'y', label: '本年', disabled: true }], value: 'q' }, expect: ['本季', '本年'] },
  ],
  'sb-battle-map': [
    { title: '四格带点与计数', data: { points: [{ id: 1, name: '华宸数据', potential: 8, relationship: 9, tone: 'good', amountBand: 'large' }, { id: 2, name: '北辰智造', potential: 7, relationship: 3, tone: 'watch', amountBand: 'medium' }, { id: 3, name: '云岭', potential: 2, relationship: 2, tone: 'pending', amountBand: 'small' }], selectedId: 1, unrated: 3 }, expect: ['资产', '主攻', '资源', '见单', '华宸数据', '待评估 3 家', '小', '大', '浅', '深'], event: tapFirst('.sb-bmap-hit', 'pointtap') },
    { title: '重叠聚合', data: { points: [{ id: 1, name: '甲', potential: 8, relationship: 8, tone: 'good' }, { id: 2, name: '乙', potential: 8.2, relationship: 8.1, tone: 'bad' }] }, expect: ['sb-bmap-cluster', '2'], event: tapFirst('.sb-bmap-hit', 'clustertap') },
    { title: '点数字放大', data: { points: [{ id: 1, name: '甲', potential: 8, relationship: 8, tone: 'good' }] }, expect: ['资产'], event: tapFirst('.sb-bmap-count', 'zoomchange') },
    { title: '放大一格', data: { zoom: 'attack', points: [{ id: 1, name: '甲', potential: 8, relationship: 8, tone: 'good' }, { id: 2, name: '乙', potential: 8, relationship: 2, tone: 'bad' }] }, expect: ['主攻区', '返回全图'], event: tapFirst('.sb-bmap-back', 'zoomchange') },
    { title: '空态', data: { points: [{ id: 9, name: '没评', potential: null, relationship: 4 }] }, expect: ['还没有客户进入作战地图', '去客户列表'], event: tapFirst('t-button', 'emptyaction', '.t-button--t-button') },
    { title: '加载中', data: { loading: true }, expect: ['正在读取'] },
  ],
  'sb-kpi-card': [
    { title: '紧凑', data: { size: 'compact', label: '已登记确收', value: '¥23,130,000', note: '6 笔已确认记录' }, expect: ['¥23,130,000', 'compact'] },
    { title: '有值带单位与变化', data: { label: '年度合同额', value: 1880, unit: '万元', change: { text: '比上季 +12%', tone: 'up', good: true } }, expect: ['年度合同额', '1880', '万元', '比上季 +12%', 'tone-good'], event: tapFirst('.sb-kpi', 'tap') },
    { title: '无好坏灰', data: { label: '客户', value: 24, unit: '家', change: { text: '比上季 +2 家', tone: 'up' } }, expect: ['tone-flat'] },
    { title: '缺失', data: { label: '回款', value: null, unit: '万元', note: '财务还没登记' }, expect: ['未登记', '财务还没登记'] },
    { title: '加载中', data: { label: '回款', value: 12, loading: true, note: 'x' }, expect: ['…', '正在读取'] },
  ],
  'sb-chart-card': [
    { title: '正常', data: { title: '本季毛利够不够', scope: '本人 · 第三季度', caliber: '毛利按确收算', summary: '三个月毛利 12、15、18 万' }, expect: ['本季毛利够不够', '第三季度'] },
    { title: '空', data: { title: '排名', state: 'empty' }, expect: ['这个周期还没有数据'] },
    { title: '失败可重试', data: { title: '排名', state: 'error' }, expect: ['加载失败', '重试'], event: tapFirst('t-button', 'retry', '.t-button--t-button') },
    { title: '加载中', data: { title: '排名', state: 'loading' }, expect: ['正在读取'] },
  ],
  'sb-labeled-select': [
    { title: '未选显示全部', data: { label: '象限', options: [{ value: 'a', label: '主攻区', count: 9 }] }, expect: ['象限', '全部'] },
    { title: '已选', data: { label: '象限', value: 'a', options: [{ value: 'a', label: '主攻区', count: 9 }] }, expect: ['主攻区'], event: tapFirst('.sb-lselect-clear', 'change') },
    { title: '禁用', data: { label: '金额', disabled: true }, expect: ['金额'] },
  ],
  'sb-metric-strip': [
    { title: '带周期与口径', data: { items: [{ label: '确收 · 万元', value: 138 }, { label: '回款 · 万元', value: null }], periods: [{ value: 'year', label: '本年' }, { value: 'all', label: '历年' }], period: 'year', caliber: '口径' }, expect: ['138', '未登记', '本年', '历年'], event: tapNth('.sb-mstrip-seg-item', 'periodchange', -1) },
    { title: '加载中不显示 0', data: { items: [{ label: '确收', value: 0 }], loading: true }, expect: ['正在读取', '…'] },
  ],
  'sb-tabs': [
    { title: '带数量', data: { items: [{ key: 'todo', label: '待处理', count: 18 }, { key: 'all', label: '全部', count: 122 }], activeKey: 'todo' }, expect: ['待处理', '18', '99+'], event: tapNth('.sb-tabs-tab', 'change', -1) },
    { title: '禁用不触发', data: { items: [{ key: 'a', label: '客户', count: 0 }, { key: 'b', label: '风险', disabled: true }], activeKey: 'a' }, expect: ['风险'] },
  ],
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
    { title: '失败不带小字', data: { state: 'error', retryNote: '' }, expect: ['重试'] },
    { title: '无权限', data: { state: 'forbidden' }, expect: ['权限'] },
  ],
  'sb-filter-bar': [
    { title: '已选', data: { title: '客户', scope: '本人负责', options: [{ value: 'risk', label: '有风险', count: 6 }, { value: 'main', label: '主攻区', count: 9 }], value: ['risk'], resultCount: 6 }, expect: ['有风险', '已选 1 项', '共 6'], event: tapFirst('.sb-chip', 'change') },
    { title: '禁用', data: { options: [{ value: 'a', label: '甲' }], disabled: true }, expect: ['甲'] },
  ],
  'sb-search': [{ title: '无底色限字数', data: { value: '华宸', plain: true, maxlength: 100 }, expect: ['is-plain'] }, { title: '默认', data: { value: '华宸' } }, { title: '加载中', data: { loading: true } }, { title: '禁用', data: { disabled: true } }],
  'sb-list-row': [
    { title: '默认', data: { name: '华宸数据', summary: '客户资产', tone: 'good', time: '2 天前' }, expect: ['华宸数据', '客户资产', '向好', '2 天前'], event: tapFirst('.sb-row', 'tap') },
    { title: '选中', data: { name: '北辰', selected: true }, expect: ['北辰'] },
    { title: '无权限', data: { name: '某客户', disabled: true, disabledReason: '不在授权范围' }, expect: ['无权限', '不在授权范围'] },
  ],
  'sb-bottom-bar': [
    { title: '默认', data: { primaryLabel: '归档', secondaryLabel: '存草稿' }, expect: ['归档', '存草稿'], event: tapFirst('t-button', 'secondary', '.t-button--t-button') },
    { title: '处理中', data: { primaryLabel: '归档', loading: true }, expect: ['处理中'] },
    { title: '禁用说原因', data: { primaryLabel: '归档', disabled: true, disabledReason: '还有 3 项必填' }, expect: ['还有 3 项必填'] },
    { title: '看似禁用仍可点', data: { primaryLabel: '发送任务', inactive: true, disabledReason: '还没选负责人' }, expect: ['还没选负责人', 'sb-bottombar-inactive'], event: tapFirst('t-button', 'primary', '.t-button--t-button') },
    { title: '按钮上方说明', data: { primaryLabel: '提交完成', note: '提交后由李明哲验收' }, expect: ['提交后由李明哲验收'] },
  ],
  'sb-field': [
    { title: '放进卡片', data: { label: '任务描述', plain: true }, expect: ['任务描述', 'is-plain'] },
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
    { title: '自定义说明', data: { mode: 'more', total: 24, summary: '已显示 20／24 个商机', plain: true }, expect: ['已显示 20／24 个商机', 'is-plain'] },
  ],
  'sb-metric-tile': [{ title: '有值', data: { value: 24, label: '客户数' }, expect: ['24', '客户数'] }, { title: '缺失', data: { value: null, label: '毛利' }, expect: ['未登记'] }],
  'sb-page-header': [{ title: '默认', data: { title: '客户', scope: '本人负责 · 24 家' }, expect: ['客户', '24 家'] }],
  'sb-ai-badge': [{ title: '生成中', data: { state: 'generating' }, expect: ['AI'] }, { title: '待确认', data: { state: 'pending' }, expect: ['待确认'] }, { title: '已确认', data: { state: 'confirmed', confirmedBy: '李鹏程' }, expect: ['李鹏程'] }, { title: '建议', data: { state: 'advice' }, expect: ['AI 建议'] }],
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
  'sb-timeline': [
    { title: '默认四色带记录人', data: { items: [{ key: 1, time: '9 月 19 日', title: '拜访：见了 CIO', description: '预算在四季度审批', tone: 'good', actor: '王小明', tappable: true }, { key: 2, time: '9 月 15 日', title: '任务被拒绝', tone: 'bad' }, { key: 3, title: '转为需关注', tone: 'watch' }] }, expect: ['9 月 19 日', '拜访：见了 CIO', '预算在四季度审批', '王小明', 'sb-tl-good', 'sb-tl-bad', 'sb-tl-watch'], event: tapFirst('.sb-tl-item', 'tap') },
    { title: '进行中占位与倒序', data: { items: [{ key: 1, title: '甲', tone: 'neutral' }, { key: 2, title: '乙' }], pending: '等待下一次跟进', reverse: true }, expect: ['等待下一次跟进', 'sb-tl-dot-hollow', 'sb-tl-neutral'] },
    { title: '紧凑不显示说明', data: { items: [{ key: 1, time: '9 月 8 日', title: '进入验证', description: '不该出现' }], size: 'compact' }, expect: ['sb-tl-compact', '进入验证'] },
    { title: '空', data: { items: [] }, expect: ['还没有记录'] },
    { title: '加载中', data: { loading: true }, expect: ['sb-tl-skel'] },
  ],
  // t-upload 的列表项内容走 <template is>，模拟器不渲染模板，所以只查列表项节点与状态类，文件名要在开发者工具里看
  'sb-upload': [
    { title: '本地列表带说明', data: { accept: '.pdf,.jpg', maxSize: 20, maxCount: 5, value: [{ uid: 'a', name: '拜访纪要.pdf', size: 245760, status: 'done', url: 'a' }] }, expect: ['上传附件', '支持 pdf、jpg，单个不超过 20MB', 't-upload__list-item'], event: callMethod('onRemove', { index: 0, file: {} }, 'remove') },
    { title: '超限就地说明不弹 toast', data: { accept: '.pdf', maxSize: 2, maxCount: 1, value: [] }, expect: ['支持 pdf，单个不超过 2MB'], event: async (comp, simulate) => { let hit = false, changed = null; comp.addEventListener('change', (e) => { hit = true; changed = e.detail.files; }); comp.instance.onSuccess({ detail: { files: [{ name: '照片.jpg', size: 100, url: 'x1' }, { name: '大文件.pdf', size: 3 * 1048576, url: 'x2' }, { name: '合同.pdf', size: 100, url: 'x3' }, { name: '第二份.pdf', size: 100, url: 'x4' }] } }); await simulate.sleep(20); const html = comp.dom.innerHTML; return hit && changed.length === 1 && changed[0].name === '合同.pdf' && html.includes('类型不支持') && html.includes('超过 2MB') && html.includes('最多 1 个文件'); } },
    { title: '到上限与失败态', data: { maxCount: 1, value: [{ uid: 'b', name: '现场照片.jpg', size: 3145728, status: 'error', url: 'b' }] }, expect: ['t-upload__list-item--fail', '已到 1 个上限'] },
    { title: '禁用', data: { accept: '.pdf', disabled: true, hint: '归档后不能再改附件', value: [{ uid: 'a', name: '拜访纪要.pdf', size: 10, status: 'done', url: 'a' }] }, expect: ['归档后不能再改附件', 'sb-upload-disabled', 't-upload__list-item'] },
  ],
  'sb-result': [
    { title: '成功带主次按钮', data: { status: 'success', title: '拜访已归档', description: '几分钟后在客户详情里看。', primaryLabel: '查看客户', secondaryLabel: '再记一条' }, expect: ['拜访已归档', '几分钟后在客户详情里看', '查看客户', '再记一条', 'sb-result-success'], event: tapFirst('t-button', 'primary', '.t-button--t-button') },
    { title: '失败可重试', data: { status: 'error', title: '归档失败', description: '你的输入已保留。', primaryLabel: '重试', secondaryLabel: '存草稿' }, expect: ['归档失败', '重试', 'sb-result-error'], event: tapDomNth('.t-button--t-button', 'secondary', -1) },
    { title: '警示与未知状态回落 info', data: { status: 'nope', title: '草稿已保存' }, expect: ['sb-result-info', '草稿已保存'] },
    { title: '主按钮处理中不触发', data: { status: 'warning', title: '还有 3 项必填', primaryLabel: '回去补充', primaryLoading: true }, expect: ['sb-result-warning', '还有 3 项必填'] },
  ],
  'sb-avatar': [
    { title: '中文去姓取后两字', data: { name: '王小明' }, expect: ['小明', 'sb-avatar-primary', 'sb-avatar-md'], event: tapFirst('.sb-avatar', 'tap') },
    { title: '两字原样与英文', data: { name: '李雷', size: 'sm', tone: 'neutral' }, expect: ['李雷', 'sb-avatar-neutral', 'sb-avatar-sm'] },
    { title: '英文取前两个大写、方形大号', data: { name: 'zhangjt', size: 'lg', shape: 'square', tone: 'success' }, expect: ['ZH', 'sb-avatar-lg', 'sb-avatar-success'] },
    { title: '空名显示我', data: { name: '' }, expect: ['我'] },
  ],
  'sb-ai-progress': [
    { title: '进行中', data: { stages: ['转写语音', '提取字段'], current: 1, status: 'running' }, expect: ['提取字段', '取消'], event: tapFirst('t-button', 'cancel', '.t-button--t-button') },
    { title: '已取消', data: { stages: ['转写语音'], status: 'cancelled' }, expect: ['已取消'] },
    { title: '失败', data: { stages: ['转写语音'], status: 'failed' }, expect: ['失败', '重试'], event: tapFirst('t-button', 'retry', '.t-button--t-button') },
    { title: '完成', data: { stages: ['转写语音'], current: 1, status: 'done' }, expect: ['完成'] },
  ],
};
