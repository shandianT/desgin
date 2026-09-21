# @shandiant/tokens 更新记录

包的版本永远等于规范仓库 `tokens.json` 的 `$meta.version`。变量本身的增删改看 `dist/变量对照表.md`，这里只记包层面的变化。

## 1.2.0-draft.1（2026-09-21）

- 变量新增九个，都是建议：作战地图四个象限底色 `--ui-quadrant-asset`／`-attack`／`-resource`／`-spot`，图表顺序色 `--ui-chart-1`～`--ui-chart-5`（12 章 §2.2、§3.4）。旧变量名与值不变。
- 新入口 `bridge-echarts`（ES／CommonJS／JSON 三种）：ECharts 6 `registerTheme` 用的主题对象，由 bridges.json 生成；ui-react 的 SbBarChart、SbLineChart 从这里读主题。加类型文件 `types/bridge-echarts.d.ts`。

## 1.1.0-draft.1（2026-09-20，第二次打包）

- 加类型文件：`bridge-antd`、`json`、`miniprogram-app` 三个入口在 TypeScript 里有类型。
- 包名从 `@sensetime-dept/tokens` 改为 `@shandiant/tokens`，源为 GitHub Packages。
- 加本文件。

## 1.1.0-draft.1（2026-09-20，第一次打包）

- 出 `bridge-antd` 的 JS 模块（ES 与 CommonJS），ui-react 的 SbProvider 从这里读主题。
- 入口：css、wxss、json、miniprogram-app、bridge-antd、bridge-antd.json、bridge-tdesign.css、bridge-tdesign.wxss、bridge-semi.css。
- 变量内容：基础层与语义层的值来自 SalesBuddy Web 1.0；主色 #2863CD；给 TDesign、Ant Design、Semi 的桥接。
