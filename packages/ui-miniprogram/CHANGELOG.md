# @shandiant/ui-miniprogram 更新记录

版本号规则与 ui-react 一致。每条写「改了什么、对使用方有什么影响」。

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
