---
name: design-spec
description: 部门产品设计规范的使用方法。凡是改页面、组件、样式、颜色、主色、字号、间距、按钮、卡片、列表、详情页、空状态、加载失败、小程序页面（wxss、wxml、rpx、app.json）、网页 CSS／HTML、设计变量（tokens、--ui-*）、设计规范、验收单、页面模板、规则变更单，都先用本技能，即使用户没有提到「规范」两个字。Do NOT use for：数据库迁移、后端接口、赢单概率等业务口径（那些在产品仓库的 CLAUDE.md 里）。
paths:
  - "specs/**"
  - "**/*.{css,wxss,wxml,html,vue,jsx,tsx}"
  - "**/app.json"
  - "**/tokens.json"
metadata:
  spec-version: "规则 1.0.0；跨端草案 1.1.0-draft.1"
  entry: "README.md"
---

# 按部门设计规范做页面与样式

## 先读什么（按顺序，只读需要的）

1. `规范清单.json`：找到本次产品对应的规范目录（目前只有 `specs/salesbuddy`）。
2. `references/salesbuddy-规则索引.md`：全部规则一张表，每条有编号、要求、怎么检查、状态、相关变量、来源行号。要看原文按来源行号打开。
3. `references/salesbuddy-变量对照表.md`：全部 `--ui-*` 变量在电脑网页、手机网页、小程序的值与状态。
4. 涉及布局或跨端时读 `specs/salesbuddy/01-三端规则对照表.md`；涉及客户列表、详情、返回时打开样板 `specs/salesbuddy/03-跨端样板-客户列表到详情/index.html` 与 `规则映射表.md`。
5. 涉及业务字段口径（客户、商机、象限、缺失值、权限）时读 `specs/salesbuddy/03-跨端样板-客户列表到详情/业务约束清单.md`。

6. 要用组件时读 `packages/ui-react/src/meta.js`（Web，17 个组件的名字、属性、状态）或 `packages/ui-miniprogram/README.md`（小程序，15 个组件）。引入写法在 `packages/ui-react/src/usage.js`。

不要整章通读手册；规则原文只在 `specs/salesbuddy/1.0.0-使用包快照/` 里，那是原件，不改。

## 先用现成组件，不要重画

- 基础控件（按钮、输入框、选择器、日期、表格、弹窗、消息）直接用上游：Web 用 Ant Design 6，小程序用 tdesign-miniprogram 1.16。不自己画，不换别的库。
- 部门组合件与 AI 件用 `@shandiant/ui-react`（Web）或 `@shandiant/ui-miniprogram`（小程序）。对照表：

| 页面里要做的事 | Web | 小程序 |
|---|---|---|
| 红黄绿灰状态 | SbStatusTag | sb-status-tag |
| 加载中、空、失败、无权限 | SbStatePanel | sb-state-panel |
| 筛选栏 | SbFilterBar | sb-filter-bar |
| 搜索框 | SbSearch | sb-search |
| 列表行 | SbListRow | sb-list-row |
| 底部固定按钮 | SbBottomBar | sb-bottom-bar |
| 表单项（标签、必填、错误） | SbField | sb-field |
| 底部弹层 | SbSheet | sb-sheet |
| 分页或加载更多 | SbPagination | sb-pagination |
| 指标数字（缺失显示未登记） | SbMetricTile | sb-metric-tile |
| 页面标题加范围名 | SbPageHeader | sb-page-header |
| 手机页面顶部摘要卡（替代深色横幅：标题、范围、状态标签、一行指标、进度） | SbPageHeader 加 SbMetricStrip | sb-summary-card |
| 区块卡片（标题、说明、右侧一个链接） | antd Card（无阴影） | sb-section |
| 只读「标签：值」清单（空值未填写、必填空值待补充） | antd Descriptions | sb-desc-list |
| 单行输入（标签、清除、单位、错误） | antd Input | sb-input |
| 手机页面的视觉参照 | — | 规范 16 章：飞书参照与小程序体验（冲突时以小程序体验为准） |
| AI 生成标识 | SbAiBadge | sb-ai-badge |
| AI 待确认字段 | SbAiField | sb-ai-field |
| AI 依据列表 | SbAiSources | sb-ai-sources |
| AI 生成进度 | SbAiProgress | sb-ai-progress |
| 电脑三栏、手机整页 | SbDetailLayout | 用 navigateTo |
| 带标签的下拉筛选（选项多于 6） | SbLabeledSelect | sb-labeled-select |
| 指标横排加周期切换 | SbMetricStrip | sb-metric-strip |
| 带数量的标签页 | SbTabs | sb-tabs |
| 表格（操作列、四态、分页） | SbTable | 手机用 sb-list-row |
| 顶栏（面包屑、状态、日期、新建、帮助刷新） | SbTopBar | 无 |
| 侧导航（分组、折叠窄条） | SbSideNav | sb-tab-bar |
| 作战地图（四象限） | SbBattleMap | sb-battle-map |
| 日期（今天／本周／本季，出字符串） | SbDatePicker | sb-date-picker |
| 普通选择 | SbSelect | sb-select |
| 远程搜索选择（选客户、选人） | SbSearchSelect | sb-search 加 sb-list-row |
| 金额（万元、千分位、只收正数） | SbAmountInput | sb-amount-input |
| 长文本带字数 | SbTextarea | sb-textarea |
| 分段切换 | SbSegmented | sb-segmented |
| 图表卡片壳（标题、口径、四态、数据表） | SbChartCard | sb-chart-card |
| 指标卡（数字、单位、变化） | SbKpiCard | sb-kpi-card |
| 条形、柱状、折线（主题来自 tokens 的 bridge-echarts） | SbBarChart、SbLineChart | ec-canvas |
| 跟进历史、业务动态时间轴 | SbTimeline | sb-timeline |
| 附件上传（超限就地说明） | SbUpload | sb-upload |
| 操作结果整页（成功、失败、提示、警示） | SbResult | sb-result |
| 头像（姓名后两字、三档） | SbAvatar | sb-avatar |

- 图标：用 `SbIcon`（小程序 `sb-icon`），传含义名 name="customer" 不传库里的名字，size sm／md／lg，tone 只给业务状态，tile 带底方块。含义表在 `packages/ui-react/src/icons.js`。图标旁必须有字，见 `specs/salesbuddy/10-图标.md`。
- 视觉手感（14 章）：一个容器里不再描边，同一层只用边框、底色、留白之一；悬停才出底色；一屏最多两种圆角；汇总数字一行放下（说明左、数字右）；有面包屑的页面不要页头；表格每格一行；汇总页红黄灯只放「需关注」一格和红黄条目的标签，绿色不打。指标条用默认 flat，页面给白卡。
- Web 页面最外层包一次 `SbProvider`，主题就来自变量，不再手写颜色。
- 装法：工程根目录 `.npmrc` 写 `@shandiant:registry=https://npm.pkg.github.com`，然后 `npm i @shandiant/tokens@draft @shandiant/ui-react`；小程序 `npm i tdesign-miniprogram@1.16.1 @shandiant/ui-miniprogram` 后在开发者工具构建 npm。没有源就用仓库 `release/` 里的包文件。细节在 `specs/salesbuddy/09-npm包与发布.md`。
- 缺一个组件时，先在页面里用上游组件拼，并在交回说明里写「建议新增组件：名字、用途、用在几页」，不要在页面里造一个只用一次的。

## 怎么做

- 颜色、字号、间距、圆角、控件高度只写 `var(--ui-…)`，名字必须存在于变量对照表；不写裸色值，不发明新变量名。缺变量就提出「新增变量」并说明依据，不要就地写数值。
- 数值只改 `specs/salesbuddy/02-设计变量与同步链路/tokens.json`，改完运行检查（下一节），生成物一起提交。
- 小程序：颜色、字号、圆角、控件高度用 px（逻辑像素）；只有随屏宽缩放的量用 rpx；字号不低于 24rpx（说明）与 28rpx（正文）；原生 tabBar 与导航栏颜色写十六进制，值取 `dist/miniprogram-app.tokens.json`。
- 手机 ≤600px：列表页进详情页，返回后保留搜索、筛选、滚动位置、选中；底部主动作 ≥44px 并加安全区；正文 16px。
- 状态四态齐全：加载中、空数据（说原因并给下一步）、失败（可重试且不丢条件）、无权限（不显示对象名称）。
- 业务口径：客户与商机分开；缺失显示「未填写／未登记／待评估」不当 0；红黄绿灰带文字与依据；象限与风险不可手工改。
- 只把 26 条 P／V／C／T／B／G 规则称为「已确认」；X 规则和本轮新增变量是「建议」；样板验收是「已验证（本地）」；其他是「未验证」。

## 改完必跑

```
node tools/check.mjs            # 生成变量 → 兼容校验 → 规则索引 → 样式检查 → 技能引用文件
node tools/check.mjs --verify   # 改了样板时再跑 Playwright 验收（约 3 分钟）
```
在产品仓库里改样式时，用基线只报新增违规：
```
node ../desgin/tools/lint-styles.mjs <改动的文件> --spec ../desgin/specs/salesbuddy --baseline .design-lint-baseline.json
```

## 交回格式（固定）

- 采用规则：编号列表（如 T-02、C-04；X-03 为建议）。规范版本：见 `规范清单.json`。
- 改动文件：路径列表。新增变量：数量与名字（应为 0，除非已说明依据）。
- 检查结果：`check.mjs` 输出的通过／失败；样式检查新增违规数。
- 证据等级四栏：本地演示／真实接口／跨端读回／生产验证，未做的写「未验证」。
- 偏差与待整改：编号、影响、处理方式。
- 若改了规则或变量：同时更新的四样（规则条目、样例、代码说明、验收项），并在 `specs/salesbuddy/采用登记表.md` 登记。

## 禁止

- 不改 `1.0.0-使用包快照/` 原件；改规则走 `模板/02-规则变更单.md` 和 PR。
- 不把「建议」写成「已确认」，不把本地合成验证写成真机或生产通过。
- 不手工调整象限、风险、画像等由系统重算的结果。
- 不在页面里重新定义整套主题变量，不引入第二套颜色。
