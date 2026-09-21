# 部门小程序组件库

放在 tdesign-miniprogram 1.16.1 之上的组合件与 AI 件，与 Web 端 `packages/ui-react` 一一对应。基础控件（按钮、输入、选择器、日期、弹层、提示）直接用 `t-*`，主题只靠两个文件：

```
app.wxss 头两行：
@import "./design-tokens.wxss";      来自规范仓库 specs/salesbuddy/02-设计变量与同步链路/dist/
@import "./bridge-tdesign.wxss";     同上
```

## 组件

| 组件 | 做什么 | 属性与事件 | 规则 |
|---|---|---|---|
| sb-status-tag | 红黄绿灰状态标签，必带文字，可带依据 | tone、label、reason、showReason | B-01 |
| sb-state-panel | 加载中、空、失败可重试、无权限四态 | state、title、description、skeleton、showClear、retryLabel、clearLabel；事件 retry、clear | C-06 |
| sb-filter-bar | 筛选栏：标题带范围、筛选片、已选数、结果数、清除 | title、scope、options、value、resultCount、resultLabel、disabled；事件 change | C-04 |
| sb-search | 搜索框，带清除、占位、加载中、禁用；无结果由四态面板表达 | value、placeholder、clearable、loading、disabled；事件 change、search、clear | C-02、C-04 |
| sb-list-row | 列表行：名称、摘要、状态、时间位置固定 | name、summary、tone、statusLabel、reason、time、selected、disabled、disabledReason；事件 tap | C-05 |
| sb-bottom-bar | 底部固定操作条，主次按钮，含安全区 | primaryLabel、loading、loadingLabel、disabled、disabledReason、secondaryLabel、secondaryDisabled；事件 primary、secondary | C-01、X-05 |
| sb-field | 表单项：标签常显、必填星号、错误就地、只读态；控件放 slot | label、required、error、help、readOnly、value（只读时显示） | C-02 |
| sb-sheet | 底部弹层：标题、关闭、可选取消确定；不替代页面级返回 | visible、title、closeOnOverlay、cancelLabel、confirmLabel、confirmLoading；slot 默认与 footer；事件 close、confirm | C-07、X-03 |
| sb-pagination | 分页或加载更多，显示共 N 条，末页禁用 | current、total、pageSize、mode（page 或 more）、loading、end；事件 change、more | C-05 |
| sb-metric-tile | 指标卡：数字、说明、变化；缺失显示未登记，不显示 0 | value、label、note、missingText | B-03 |
| sb-page-header | 页面标题、范围名紧邻、主操作放 slot | title、scope | T-02、B-05 |
| sb-ai-badge | AI 标识，持续显示，含文字 | state、confirmedBy、text | A-02 |
| sb-ai-field | 待确认字段三态，低把握给候选，可恢复 AI 建议 | label、required、value、aiValue、state、confidence、candidates、error；事件 change、confirm、restore | A-01、A-03、A-04 |
| sb-ai-sources | AI 依据列表，默认折叠，每条可点；没有依据就不展示结论 | items、title、defaultExpanded；事件 tap（带 item） | A-03 |
| sb-ai-progress | 生成过程：阶段、百分比、可取消并保留已生成部分，失败可重试 | stages、current、status（running、cancelled、failed、done）、detail；事件 cancel、retry | A-09、A-07 |

几处和 Web 端不同的地方：

- sb-field 只读态靠 `value` 属性显示文字，没有值时写「未填写」。小程序读不到 slot 里控件的值，Web 端可以。
- sb-sheet 传了 `confirmLabel` 才出现取消与确定两个按钮，`footer` slot 放在同一行左侧。关闭按钮与遮罩点击都发 close 事件，detail.trigger 说明来源。
- sb-pagination 多了 `mode="more"`，小程序列表更常用加载更多。
- sb-ai-progress 的百分比由 t-progress 自带的标签显示。失败时进度条变红，已取消变灰，完成时 t-progress 自己变绿。

## 用了哪些 t-* 组件

| 组件 | 用到的 t-* 与属性 | 监听的事件 |
|---|---|---|
| sb-search | t-search：value、placeholder、clearable、disabled；t-loading 放 action slot | change、submit、clear |
| sb-sheet | t-popup：visible、placement=bottom、close-btn、close-on-overlay-click；t-button | visible-change |
| sb-pagination | t-button：size、variant、disabled、loading | tap |
| sb-icon | t-icon：name 按 names.js 对照，size 按三档 | — |
| sb-ai-sources | t-icon：name=chevron-down 或 chevron-up | — |
| sb-ai-progress | t-progress：theme=line、percentage、color；t-button | tap |
| sb-state-panel、sb-bottom-bar、sb-ai-field | t-loading、t-skeleton、t-button、t-input | tap、change |

属性名与事件名对照 1.16.1 包里各组件的 props.js 与编译后的 js 核过。t-progress 的 status 属性没有用：传了 status 会把百分比换成图标。

## 怎么用

装成 npm 包：

1. 工程根目录建 `.npmrc`，写一行 `@shandiant:registry=https://npm.pkg.github.com`，再写一行 `//npm.pkg.github.com/:_authToken=<GitHub token>`；token 要有 read:packages 权限。没有 token 就用包文件。产品工程执行 `npm i tdesign-miniprogram@1.16.1 @shandiant/ui-miniprogram`（或 `npm i ./shandiant-ui-miniprogram-<版本>.tgz`），开发者工具「构建 npm」，`app.json` 删掉 `"style": "v2"`。
2. 变量与桥接两个 wxss 要放到小程序根目录再引。构建 npm 只复制包里的 `components/`，不复制 node_modules，所以从 `node_modules/@shandiant/ui-miniprogram/components/style/` 把 `design-tokens.wxss`、`bridge-tdesign.wxss` 复制到与 `app.wxss` 同级，然后 `app.wxss` 头两行写 `@import "./design-tokens.wxss"; @import "./bridge-tdesign.wxss";`。构建后它们也在 `miniprogram_npm/@shandiant/ui-miniprogram/style/` 里，能不能直接 `@import` 那个绝对路径还没在开发者工具里验过，先按复制做。
3. 页面 json 的 `usingComponents` 写 `"sb-state-panel": "@shandiant/ui-miniprogram/sb-state-panel/index"`。包的 `miniprogram` 字段指向 `components/`，所以路径从组件名开始。
4. 样式只写 `var(--ui-*)`，改完跑规范仓库的 `node tools/check.mjs`。

不装包也行：把 `components/` 复制到产品工程的 `components/sb/`，路径改成 `/components/sb/sb-state-panel/index`。

## 怎么测（不用开发者工具）

在本目录 `npm i` 然后 `npm test`。用微信官方的 miniprogram-simulate 在 Node 里渲染 15 个组件的每个状态，检查文字在不在、点了会不会对外发事件，用例在 `test/cases.cjs`。它和真机走同一套组件框架，但不是真机：布局、滚动、键盘、安全区这些还是要在开发者工具和真机看。

## 怎么看（仓库内演示工程，不随 npm 包发布）

浏览器渲染不了小程序组件，规范站的「组件」章只能放 Web 端的实时目录页。要看真实效果并且能操作，用仓库里的演示工程：

1. 在仓库目录 packages/ui-miniprogram 执行 `npm i`，装 tdesign-miniprogram 1.16.1。
2. 微信开发者工具导入这个目录，AppID 选测试号，菜单里「工具」「构建 npm」。小程序根目录就是这个目录，组件在 `components/`，演示页在 `demo/pages/index/`。
3. 打开首页。每个组件的每个状态从上到下排开，每段前面有一行灰字写这是什么状态。
4. 可以直接操作：搜索框打字并回车、筛选片点选、分页上一页下一页、加载更多、表单项输入、点「季度」或「打开底部弹层」打开弹层再点应用、AI 依据点开每一条、生成过程点取消看已取消态、失败态点重试、底部操作条点「切换禁用」看禁用说原因、待确认字段改值与恢复。
5. 真机预览用工具的「预览」二维码。截图放回规范仓库 `specs/salesbuddy/站点/组件库/miniprogram/`。

## 状态

15 个组件代码写好，与 Web 端 `packages/ui-react/src/meta.js` 的清单一致。t-* 的属性与事件名已对照 1.16.1 包核过；组件本身未在开发者工具与真机跑过。
