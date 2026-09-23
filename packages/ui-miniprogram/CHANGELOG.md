# @shandiant/ui-miniprogram 更新记录

版本号规则与 ui-react 一致。每条写「改了什么、对使用方有什么影响」。

## 0.8.0（2026-09-23）

从小程序 1.0.8 按部门规范改版（26 页、14 个页面组件）回流：七组页面各自手写了同样几种结构，收进组件库；页面改版中发现的组件问题一并修掉。

- 新增 sb-summary-card 页面摘要卡：页面顶部白卡，替代深色渐变横幅。标题 20px、副标题 14px、右上范围小标签或 side slot（放切换）；可带首字方块、状态标签（sb-status-tag，中性标签自绘）、一行指标（竖线分隔、缺失写未登记、loading 时写「…」）、进度条；size=small 标题 16px、指标 20px（页面上方已有问候语时用）。首字方块与进度条自绘两三层 view，不引 t-avatar、t-progress（前者连带 t-badge、t-image）。十一个页面的顶部都是这个结构。
- 新增 sb-desc-list 描述列表：只读「标签：值」清单。行式用 t-cell，两列式自绘；空值写「未填写」，必填空值写「待补充」（提醒色），值可按 danger／warning／primary 上色，行可点。任务详情、拜访详情、建档核对、指派确认都用得上。
- 新增 sb-section 区块卡片：白底一圈细线，标题 16px、说明 14px、右侧一个链接；plain 时只要标题行。
- sb-bottom-bar：按钮改为等分，只有主按钮时撑满（0.7.0 是主按钮靠右、最小 120 宽，页面反馈「按钮不铺满」）；新增 note（按钮上方一行说明，如「提交后由李明哲验收」）；新增 inactive（看似禁用但仍发 primary，detail.inactive 为 true，页面借此弹出「还缺什么」；以前只能二选一：禁用就没了提示，不禁用就看不出条件没满足）；原因行从两个按钮之间挪到按钮上方，长提示不再挤按钮。按钮外包一层 view 定宽，不依赖 t-button 宿主上的 class。
- sb-state-panel：失败态那行「重试不会清除已选条件」改为 retryNote 属性，默认不变，没有筛选条件的页面（报告详情、拜访详情）传空字符串隐藏。
- sb-ai-badge：新增 state=advice「AI 建议，仅供参考」，主色淡底。Agent 经营建议不是待确认的草稿，以前只能借用 pending 的「待确认」黄色。
- sb-search：新增 maxlength（原生搜索框常见 100 字上限，换组件不丢）与 plain（不带外层白底和页边距，搜索框本身白底一圈细线，放在页面底色或卡片里用；两组页面都手写过这一圈）。
- sb-field：新增 plain，放进表单白卡时不再自带白底与页边距（以前放进卡里是框套框，页面只好不用它）。
- sb-pagination：新增 summary（自定义左侧说明，如「已显示 20／24 个商机」，不传仍是「共 N 条」）与 plain。
- sb-kpi-card：新增 size=compact，数字 20px、说明 14px，两列半宽卡和长金额不再截断（看板八张卡原来只能照规格手写）。
- sb-segmented：新增 block，撑满一行、各项等宽（我的页三页签）。
- 测试：35 个组件、121 个状态、42 次交互。

## 0.7.0（2026-09-21）

- 新增四个组件：sb-timeline 时间轴（自绘竖线加圆点，圆点色只由 tone 决定，pending 占位、倒序、紧凑、加载、空）、sb-upload 附件上传（t-upload 列表型壳，超类型／大小／数量就地红字不弹 toast，不传 requestMethod 只维护本地列表）、sb-result 结果页（t-result 壳，主次按钮加 extra slot）、sb-avatar 头像（t-avatar 壳，姓名后两字、三档 48／64／80rpx、底色档）。与 Web 端 SbTimeline、SbUpload、SbResult、SbAvatar 同一套属性。
- 测试：`test/run.cjs` 再把 t-grid-item 读屏文字里的对象展开去掉（t-upload 会引到它），只影响测试；t-upload 列表项内容走 `<template is>`，模拟器不渲染模板，用例只查列表项节点与状态类。
- 演示页加四段（时间轴、附件上传、结果页、头像）。

## 0.6.0（2026-09-21）

- 新增九个组件：sb-tab-bar（t-tab-bar 壳）、sb-date-picker（t-date-time-picker 壳）、sb-select（t-picker 壳）、sb-amount-input（t-input 壳）、sb-textarea（t-textarea 壳）、sb-segmented（自绘）、sb-battle-map（自绘四象限，view 绝对定位不用 canvas）、sb-kpi-card（自绘指标卡）、sb-chart-card（图表卡片壳，图区留给 ec-canvas）。
- sb-battle-map 用到四个象限底色变量 `--ui-quadrant-asset/attack/resource/spot`（tokens 1.1.0-draft.2 起有）。
- 测试：28 个组件、84 个状态、32 次交互；`test/run.cjs` 在临时目录里把 t-badge 模板换成空壳并去掉 t-tab-bar-item 读屏文字里的对象展开（模拟器的表达式解析器不认），只影响测试。
- 演示页加九段。

## 0.5.0（2026-09-21）

- 新增三个组件：sb-labeled-select、sb-metric-strip、sb-tabs。表格在手机上用列表，不做 sb-table。

## 0.4.0（2026-09-21）

- 新增 sb-icon：和 Web 同一张含义对照表，三档尺寸、语义色、带底方块。

## 0.3.0（2026-09-20）

- 加 `npm test`：用 miniprogram-simulate 渲染全部组件的 46 个状态并触发 14 次交互，进自检与发布流程。
- 包名从 `@sensetime-dept/ui-miniprogram` 改为 `@shandiant/ui-miniprogram`，源为 GitHub Packages。
- 加本文件。

## 0.2.1（2026-09-20）

- 变量与桥接两个 wxss 放进 `components/style/`，构建 npm 后随包复制；使用方从那里复制到小程序根目录再 `@import`。
- 包根即小程序根，演示工程可直接用开发者工具导入。

## 0.2.0（2026-09-20）

- 补到 15 个组件：新增 sb-search、sb-field、sb-sheet、sb-pagination、sb-metric-tile、sb-page-header、sb-ai-sources、sb-ai-progress。
- 演示页补全每个组件的每个状态。

## 0.1.0（2026-09-19）

- 第一版 7 个组件：sb-status-tag、sb-state-panel、sb-filter-bar、sb-list-row、sb-bottom-bar、sb-ai-badge、sb-ai-field，基于 tdesign-miniprogram 1.16.1。
