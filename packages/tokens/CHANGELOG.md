# @shandiant/tokens 更新记录

包的版本永远等于规范仓库 `tokens.json` 的 `$meta.version`。变量本身的增删改看 `dist/变量对照表.md`，这里只记包层面的变化。

## 1.4.0-draft.1（2026-09-24）

- 新增 `--ui-warning-accent`（{color.orange.600} #C7741B，建议）：提醒色条与图形标记用，不作文字色。卡片顶部 3px 状态条（2026-09-24 用户选定）里，`--ui-warning` 深棕做细条发暗，飞书的警示色本来就取橙。旧变量名与值不变。

## 1.3.0-draft.1（2026-09-23）

- 小程序按飞书 Universe Design 对齐（2026-09-23 用户决定：视觉与交互以飞书为核心参考）。只改 `platforms.miniprogram`，Web 与手机网页的变量名和值不变（check-tokens 与 1.0.0 全部一致）。小程序端：`--ui-background` #F5F6F7（飞书 N50）、`--ui-ink` #1F2329（N900）、`--ui-secondary`／`--ui-muted`／`--ui-neutral` #646A73（N600）、`--ui-line` #DEE0E3（N300）、`--ui-neutral-soft` #F2F3F5（N100）、`--ui-radius-panel` 8px、`--ui-text-page` 20px、`--ui-overlay` 与 `--ui-shadow-popup` 用飞书值。
- 依据：npm `@semi-bot/semi-theme-feishu` 1.0.0（Semi DSM 生成的飞书主题）的 `_palette.scss`、`global.scss`、`variables.scss`。飞书官网在本环境打不开，只用了这份主题包里的数值。
- 主色保留 #2863CD：飞书蓝 #3370FF 白底对比度 4.28:1，低于 D-06 的 4.5:1；飞书 N500 #8F959E 白底 3.02:1，不作文字色，辅助文字同用 N600。
- 基础色板新增 `color.graphite.*`（飞书中性色六档）、`radius.8`、`font.size.20`。
- 小程序端 `--ui-field-height` 改 44px（Web 仍 40px）：小程序使用体验的点击底线优先于飞书桌面端的 40px 控件高（小程序 1.0.8 第三轮复核）。
- TDesign 桥接（bridge-tdesign.wxss／.css）：
  - 禁用按钮改中性浅灰底、弱化字（`--td-button-primary-disabled-*`、`--td-button-default-outline-disabled-color`、`--td-button-primary-outline-disabled-color`），以前是主色 40% 透明，白底上看不清。
  - 按钮高度 `--td-button-large／medium／small／extra-small-height` 改 px（48／44／32／28），`--td-search-height` 跟 `--ui-field-height`（默认 rpx，320 宽屏上主按钮只有 41px）。
  - TDesign 的组合字体变量 `--td-font-body-*`、`--td-font-title-*`、`--td-font-mark-*`、`--td-font-headline-*` 与 `--td-font-size-s／m／xl` 全部改写成 px（默认是 rpx，320 宽屏上输入框、按钮文字只有 13.7px，说明文字 10.2px）。

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
