# @shandiant/ui-miniprogram 更新记录

版本号规则与 ui-react 一致。每条写「改了什么、对使用方有什么影响」。

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
