---
type: design-tokens-guide
version: 1.1.0-draft.1
status: 草案（链路已在仓库跑通，各端接入还没完成）
updated: 2026-09-19
---

# 设计变量与同步链路：颜色、字体、间距怎么集中维护，怎么同步到各端

> 只改一个文件 tokens.json，跑一个命令，Web、手机网页、小程序的样式文件和 App 用的 JSON 同时更新。但文件更新不等于产品变了，后面还有四步必须有人做。下面把这条链路讲清楚，也说明仓库现在做到了哪一步。

## 0｜名词解释

| 词 | 一句话解释 | 在本仓库里对应什么 |
|---|---|---|
| 设计变量（Design Token） | 把「主色是 #2863CD」「卡片内边距 16px」这种设计决定起个名字，集中放在一个文件里，页面只引用名字不抄数值 | `tokens.json` 里的每一条 |
| 基础档位 → 用途命名 → 端侧映射 | 三层结构：先有「蓝 600 = #2863CD」这样的裸数值；再有「主操作色 = 蓝 600」这样的用途名；最后某个端需要不同档位时只改映射，不动前两层 | `color/space/font` 分组 → `ui` 分组 → `platforms` 分组 |
| 生成（构建） | 用脚本把 tokens.json 翻译成各端能直接用的文件 | `node build-tokens.mjs` → `dist/` 五份文件（四端产物＋中文对照表） |
| DTCG | W3C 设计变量社区组（Design Tokens Community Group）定的变量文件格式，让不同工具都能读同一份文件 | `tokens.json` 的写法 |
| Style Dictionary | 把变量文件翻译成 CSS、小程序样式、Swift、Kotlin 等各端代码的开源工具 | 将来可替换 `build-tokens.mjs` |
| 媒体查询 | CSS 里「窗口宽度小于多少时用另一套值」的写法 | `design-tokens.css` 里 ≤600px 的覆盖 |
| 反域名 | 像 `cn.sensetime.xxx` 这样倒着写的公司域名，用作键名保证不撞车 | `$extensions` 的键 |
| rpx | 小程序按屏幕宽度等比缩放的单位，屏宽恒为 750rpx | 小程序页面里随屏宽缩放的量 |

## 1｜这条链路长什么样

```
tokens.json（唯一维护源，人改）
   │  node build-tokens.mjs
   ├─ dist/design-tokens.css               电脑网页 + 手机网页（≤600px 用媒体查询覆盖）
   ├─ dist/design-tokens.wxss              微信小程序（page{} 根节点，px 逻辑像素）
   ├─ dist/miniprogram-app.tokens.json     小程序 app.json 的 tabBar／window 颜色片段（原生组件不认 CSS 变量）
   ├─ dist/bridge-tdesign.wxss／.css、bridge-semi.css、bridge-antd.theme.json、bridge-echarts.theme.json、桥接说明.md
   │                                        上游组件库主题桥接（由 bridges.json 生成；建议，见 ../05-组件生态选型.md）
   ├─ dist/design-tokens.json              原生 App 或其他工具读取的扁平表
   └─ dist/变量对照表.md                    给人看的中文表：每个变量在四端的值、状态、规则编号
   │  node check-tokens.mjs
   └─ 校验：与 1.0.0 的 design-tokens.css 名字与值完全一致；比对小程序 app.json 是否已接入
```

2026-09-19 在仓库里跑过一遍，结果如下。36 个 1.0.0 变量生成后全部一致。新增 17 个变量，含导航色系、遮罩 `--ui-overlay` 与布局尺寸，状态是建议。小程序 app.json 有 5 项原生颜色与规范不一致，含主色 #1677FF 对 #2863CD，脚本把它们列为待接入。

打开 `tokens.json` 会看到这样的片段，说明字段已去掉：

```json
"color": { "blue": { "600": { "$type": "color", "$value": "#2863CD" } } },      ← 基础档位：改这里，所有引用它的地方都变
"ui":    { "primary": { "$type": "color", "$value": "{color.blue.600}" } },     ← 用途名：引用而不是抄数值，生成后就是 --ui-primary
"platforms": { "miniprogram": { "ui": { "page-gutter": { "$type": "dimension", "$value": "{space.4}" } } } }   ← 只影响小程序
```

改完保存，跑 `node build-tokens.mjs`，再看 `dist/变量对照表.md` 对应那一行是否变了。

## 2｜三层结构长什么样（用主色和卡片内边距举例）

| 层 | 例子 | 谁会改它 | 改了影响什么 |
|---|---|---|---|
| 基础档位 | `color.blue.600 = #2863CD`；`space.4 = 16px` | 设计负责人，极少改 | 所有引用它的用途名同时变 |
| 用途命名（语义） | `ui.primary = {color.blue.600}`；`ui.card-padding = {space.4}` | 设计＋开发商定，偶尔改 | 生成后就是 `--ui-primary`、`--ui-card-padding`，页面只写 `var(--ui-primary)` |
| 端侧映射 | `platforms.miniprogram.ui.page-gutter = {space.4}`（电脑是 24，小程序是 16） | 各端开发登记 | 只影响那一个端 |

已确认的 26 条 Web 规则里的全部数值都在前两层。变量名与 1.0.0 的 `--ui-*` 完全兼容，这是 V 章的要求：「现有 --ui-* 变量名与生效色值保持兼容」。第三层与 8 个新增变量的状态是建议，见对照表里的状态列。

## 3｜改一处怎么同步到各端：七步，三步自动、四步靠人

这是行业通行的做法：W3C 设计变量格式，加 Style Dictionary 一类的翻译器，加语义化版本。部门可以照做。工具能做的只有三步，其余靠人。

| 步 | 做什么 | 谁／什么来做 | 本仓库现状 |
|---|---|---|---|
| ① 提出改动 | 设计在 Figma 变量或直接在 tokens.json 改值，说明理由 | 人 | 可以直接改 tokens.json |
| ② 评审 | 一个 PR：改 tokens.json ＋ 写更新日志一行 ＋ 判断版本级别 | 人（设计＋开发各一） | 流程见 `../04-团队协作与版本流程.md` |
| ③ 生成 | 跑 build-tokens.mjs，产出三端文件、通用 JSON 与对照表 | 自动 | 已跑通 |
| ④ 校验 | check-tokens.mjs：名字与值不丢；小程序 app.json 是否一致 | 自动 | 已跑通 |
| ⑤ 组件接入 | 各端代码只允许写 `var(--ui-…)`，不允许写裸色值和裸 px | 人，一次性重构，之后靠检查 | Web 示例册已用变量；小程序 0 处使用变量（见下文核查） |
| ⑥ 构建发布 | 各端重新构建、发版；已安装客户端按各自机制升级 | 自动构建＋人批准 | 未做 |
| ⑦ 验收 | 三端同一页面截图对照，填页面验收单 | 人 | 只做了 Web 样板的自动验收 |

所以文档改了颜色、手机上没变，是正常的，因为第 ⑤⑥⑦ 步没做。规范第 06 章 X-10 说的「配置变化经生成、组件接入、回归检查和各端构建发布后生效」，指的就是这七步。

## 4｜各端分别怎么接

### 电脑网页与手机网页（同一份 CSS）

在组件样式之前加载 `dist/design-tokens.css`。手机网页就是同一个站点的响应式版本，窗口不超过 600px 时，媒体查询覆盖 `--ui-text-body: 16px` 与 `--ui-page-gutter: 16px`。这两个值来自 X-06、X-08，状态是建议。样板 `../03-跨端样板-客户列表到详情/index.html` 就是这样接的。

sales-web 工程里已经有一份自己的 `design-tokens.css`，1.0.0 示例册快照就是它的副本。它与 `dist/design-tokens.css` 的 36 个变量同名同值，check 脚本验过。接入动作就是用 dist 文件整体替换工程里那一份，之后工程不再手改这个文件。工程不在这个仓库，由 Web 开发在采用登记表登记替换日期与代码版本，避免出现两个维护源。

### 微信小程序（WXSS）

1. 把 `dist/design-tokens.wxss` 复制到 `frontend/miniprogram/`，在 `app.wxss` 第一行写 `@import "./design-tokens.wxss";`。
2. 页面样式只写 `var(--ui-primary)` 等，不再写 `#1677ff`。
3. 原生 tabBar 与导航栏颜色不能用 CSS 变量，只能写十六进制。把 `dist/miniprogram-app.tokens.json` 里的值抄进 `app.json`，以后也可以由脚本写入。

单位规则来自 X-09，状态是建议。颜色、字号、圆角、边线、控件高度、44px 触控目标这类不随屏幕宽度缩放的量，在小程序里原样用 px。只有页面留白、列宽、栅格这类要随屏幕等比缩放的量才用 rpx。1px 细线不用 rpx，避免部分机型出现半像素毛刺。

来源等级要分清。rpx 的定义、小程序 px 即逻辑像素、小屏毛刺提示，都取自微信文档镜像，官网原文没有打开过，核实情况见第 7 节。rpx 的定义是屏宽恒为 750rpx，375 宽手机上 2rpx 等于 1px。微信官方样式库 WeUI 在 `.wx-root,body,page{--weui-…}` 上定义 CSS 变量并用 px 单位，这一点已从官方仓库 Tencent/weui-wxss 源码核实。所以 `design-tokens.wxss` 的写法与官方实践一致。

### 原生 App

2026-09-19 决定暂不在范围，变量源与对照表已去掉这一端。将来纳入时，用 Style Dictionary 加一个输出格式就行，iOS 的 `ios-swift/enum.swift` 与 Android 的 `android/resources` 都是它内置的格式，`dist/design-tokens.json` 可以直接作为输入。

## 5｜文件格式与行业标准的关系

- `tokens.json` 采用 W3C 设计变量社区组格式，也就是 DTCG 2025.10 的写法。每个变量有 `$value`、`$type`、`$description`，用 `{color.blue.600}` 引用另一个变量。Tokens Studio 插件、Style Dictionary 等工具都认这种格式，以后经 Tokens Studio 插件接 Figma 不用重写。
- 尺寸写成 `"16px"` 字符串、颜色写 `#RRGGBB`。这是 Style Dictionary v5 目前完整支持的子集。DTCG 2025.10 的对象写法 `{"value":16,"unit":"px"}` 工具链还没完全支持，等支持了再一次性迁移。
- 端侧差异放在 `platforms.<端>.ui` 分组里，每条仍是含 `$value` 的合法变量。这样整份文件 Style Dictionary v5、Tokens Studio 都能读取。按 DTCG 2025.10 严格校验，尺寸与阴影的字符串写法会不通过，迁移时机见上一条。
- 扩展信息只用一个键 `cn.sensetime.sales-design`，规范要求扩展键用反域名。里面记两个字段：`status`，值是已确认或建议；`rule`，值是规则编号。
- 生成器 `build-tokens.mjs` 是零依赖的过渡脚本，以后可以换成 Style Dictionary，输出不变。中文对照表和 check 脚本保留。
- 对照两家的做法。Ant Design 5 官方是 Seed、Map、Alias 三层派生，对应基础、梯度、用途。Semi Design 是原始色盘、语义功能色、组件变量三层。两家都证明用途命名层要独立于色值。但两家在 Web、H5、小程序之间都没有统一的变量源，跨端这座桥要部门自己搭，也就是这个目录。

### 第二个产品怎么接

这一段是建议，等有第二个产品时再定。部门以后有多个产品时，基础档位与变量名各产品共用。用途映射层允许产品级覆盖，例如 `platforms.<产品>.ui.primary`，或者每个产品一份只放差异的 `<产品>.tokens.json`。扩展键从 `cn.sensetime.sales-design` 改为部门级 `cn.sensetime.dept-design`，`rule` 字段带产品前缀。采用登记表按产品和终端的组合各占一行。

## 6｜怎么验收这条链路

| 检查 | 方法 | 结果 |
|---|---|---|
| 与 1.0.0 兼容 | `node check-tokens.mjs`，36 个变量名与值必须一致 | 通过 |
| 改一处同步 | 把 `ui.card-padding` 从 `{space.4}` 改为 `{space.6}`，重新生成，css／wxss／json 与对照表随之变化（app.json 片段不含卡片内边距，不变）；样板页卡片内边距随之变化；改回 | 做过一次并已改回（见 `../03-跨端样板-客户列表到详情/README.md` 的「同步实验」） |
| 小程序接入 | check 脚本比对 app.json；页面 wxss 里 `grep -c 'var(--'` 大于 0 且 `#[0-9a-f]{6}` 为 0 | 未接入（5 项不一致，变量 0 处） |
| 真机 | 小程序真机看 `page{--ui-…}` 生效 | 未做 |

## 7｜核实情况与待决定

- 微信官方文档里的 rpx 定义、WXSS 对 CSS 变量的支持范围、小屏毛刺提示，查证时被网络环境拦截，结论来自官方 WeUI 源码与文档镜像。请能上官网的同事按 `../依据/外部查证-20260919/04-微信小程序平台事实.md` 各条给出的官方链接复核一次并登记日期。变量格式与工具的依据见同目录 `03-W3C变量格式与StyleDictionary.md`。
- Figma 官方是否直接支持 DTCG 格式，没有核实。
- 主色已决定沿用 #2863CD，日期 2026-09-19。小程序改色成为第一张待办变更，见 `../采用登记表.md`。
- 8 个建议变量与两条端侧覆盖，即手机正文 16px 与留白 16px，要登记采用后才从建议改为已确认。

## 8｜常用命令

```
cd specs/salesbuddy/02-设计变量与同步链路
node build-tokens.mjs        # 生成 dist/（含 bridges.json 定义的上游组件库桥接文件与主色十档派生）
node check-tokens.mjs        # 校验兼容与小程序接入情况（比对产品仓库的 app.json，位置由 MINIPROGRAM_DIR 指定）
cd ../../.. && node tools/sync-product.mjs   # 把产品 app.json 的 window／tabBar 复制成仓库内快照 产品现状/miniprogram-app.json，规范站只读这份快照
```
