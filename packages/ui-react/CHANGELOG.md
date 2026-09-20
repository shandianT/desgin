# @shandiant/ui-react 更新记录

版本号规则：只改值升修订号，加组件或属性升次版本，改含义或删属性升主版本。每条写「改了什么、对使用方有什么影响」。

## 0.3.0（2026-09-20）

- 加类型文件 `dist/index.d.ts`，TypeScript 工程引入有属性提示。17 个组件的属性、`META` 与 `USAGE` 都有声明。
- 包名从 `@sensetime-dept/ui-react` 改为 `@shandiant/ui-react`，源为 GitHub Packages。旧包名没有发布过，没有迁移成本。
- 加本文件。

## 0.2.1（2026-09-20）

- `SbProvider` 的主题改从 `@shandiant/tokens/bridge-antd` 读，不再内联一份。使用方必须同时安装 tokens 包。
- `USAGE` 里的变量引入路径改为 `@shandiant/tokens/css`。

## 0.2.0（2026-09-20）

- 补到 17 个组件：新增 SbSearch、SbField、SbSheet、SbPagination、SbMetricTile、SbPageHeader、SbDetailLayout、SbAiSources、SbAiProgress。
- 目录页加基础控件一节，Ant Design 的 Select、DatePicker 等配中文名；加筛选、搜索与换主色工具条。
- 规范站「组件」章直接嵌入目录页。

## 0.1.0（2026-09-19）

- 第一版 8 个组件：SbProvider、SbStatusTag、SbStatePanel、SbFilterBar、SbListRow、SbBottomBar、SbAiBadge、SbAiField。
