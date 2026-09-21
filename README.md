---
type: department-design-spec-entry
status: 部门共同入口，2026-09-19 决定；只用文件约定和 Git，没有后端
updated: 2026-09-20
---

# 部门产品设计规范

我们的产品在电脑网页、手机网页和微信小程序上应该长什么样、怎么反应，这里说了算。产品、设计、开发、测试和 AI 看的是同一份。

## 先看这三个

| 你要 | 去哪 |
|---|---|
| 看规范、看组件长什么样 | 规范站 https://shandiant.github.io/desgin/ ，能直接点。先看首页和「组件」章 |
| 评审文案规范和图表规范 | 评审稿 https://shandiant.github.io/desgin/评审稿-文案与图表.html ，草稿，对完转正 |
| 在自己的工程里用起来 | 把 [模板/同事装包-给AI的提示词.md](模板/同事装包-给AI的提示词.md) 贴给 AI，它会装好并验证 |

## 你是谁，从哪开始

| 你是 | 做什么 |
|---|---|
| 产品经理 | 读规范站「原则」章前三条；写空态、出错、无权限的文案按「交互状态」章；验收时对着首页「常见问题」表逐条问 |
| 设计师 | 颜色、字号、间距只从「视觉基础」章取；先在「组件」章找现成的；新画的组件标出用了哪些变量 |
| 前端开发 | 装包（上面第三行）；样式只写 `var(--ui-*)`；组件先用包里现成的；改完跑样式检查，新增违规为 0 |
| 测试 | 每个列表页试加载中、空、出错、无权限四种情况；出错点重试看筛选条件丢没丢；AI 生成的内容看标识在不在 |
| 要改规范的人 | 看下面「怎么改」 |

## 里面有什么

| 东西 | 在哪 | 说明 |
|---|---|---|
| 规则 | `specs/salesbuddy/` 各章，`规则索引.md` 一张表看全 | 26 条正式规则，每条有白话、例子、原文、怎么检查；22 条候选原则 |
| 设计变量 | `specs/salesbuddy/02-设计变量与同步链路/` | `tokens.json` 一份源，生成 css、wxss、json 和给 Ant Design、TDesign 的桥接文件。改一处，三端一起变 |
| 组件库 | `packages/ui-react/`（网页 17 个）、`packages/ui-miniprogram/`（小程序 15 个） | 基础控件用 Ant Design 6 和 tdesign-miniprogram，部门只做组合件和 AI 件 |
| npm 包 | `release/` 里的 .tgz，也发在仓库右侧 Packages | tokens 1.1.0-draft.1、ui-react 0.5.1、ui-miniprogram 0.5.0 |
| 图标、文案、图表 | `specs/salesbuddy/10、11、12 章` | 图标已定；文案与图表是草稿 |
| 模板 | `模板/`、`specs/salesbuddy/1.0.0-使用包快照/模板/` | 任务单、变更单、验收单、采用登记表、装包提示词、产品仓库 AI 说明 |
| AI 说明 | `AGENTS.md`、`CLAUDE.md`、`.claude/skills/design-spec/` | Claude Code、Codex、Copilot、Cursor 打开仓库自动按规范做 |
| 检查工具 | `tools/check.mjs` | 一条命令：生成变量、校验、生成站点、样式检查、组件渲染、类型核对 |

## 怎么改

1. 拿仓库：`git clone https://github.com/shandianT/desgin.git`，`node tools/check.mjs`。
2. 开分支，不直接改 main。规则改 md，变量只改 `tokens.json`，组件改 `packages/`。
3. `node tools/check.mjs` 全部通过，生成物一起提交。
4. 开 PR，描述里写变更单四项：现在的规则、问题、改法、影响页面，引用规则编号。一人评审通过后合并。
5. 要发包：升 `package.json` 版本号，推到 main，Actions 页点 publish-npm 的 Run workflow，或打 `v` 开头的标签。
6. 哪个产品用了哪个版本，在 `specs/salesbuddy/采用登记表.md` 加一行。

规范站在 main 有推送后自动重新发布。`specs/salesbuddy/1.0.0-使用包快照/` 是原件，不改。改真实业务工程要先授权，清单在 07 章。

## 现在的状态

| 内容 | 状态 |
|---|---|
| 26 条 Web 规则 | 已确认，1.0.0 |
| 跨端建议 X-01～X-12、候选原则 D 与 A、新增变量 | 建议，待登记采用 |
| 组件库与 npm 包 | 已建成、已发布（2026-09-20）。小程序组件在官方模拟器里过了 46 个状态，真机没跑 |
| 图标 | 已定：网页用 Ant Design 自带，小程序用 TDesign 自带 |
| 文案规范、图表规范 | 第一版草稿，待评审 |
| 产品接入 | Web 候选版四页已装包接入（2026-09-21 评审并修改），暴露的规范空白在 13 章；小程序未接入，清单在 07 章 |
| 已决定 | 主色 #2863CD；这个仓库是共同入口；原生 App 暂不在范围；Web 引入 React，主库 Ant Design 6 加 Ant Design X；小程序主库 tdesign-miniprogram |

## 命令

```
node tools/check.mjs             # 唯一入口
node tools/check.mjs --verify    # 加 Playwright 样板验收
node tools/pack.mjs              # 打 npm 包文件到 release/
node tools/build-review.mjs      # 生成文案与图表评审稿
```
需要 Node 22。

## 版本记录

- 2026-09-20（六）：组件库建成并发包；规范站首页改给使用者看，每条规则配白话与例子；定图标；文案与图表规范草稿；同事装包提示词。
- 2026-09-19（三）：按四个视角审查规范站与工具链，修了下面这些。
  - 产品原则逐字引用 7 条。
  - 跨端表按 01 表结论归类为统一、适配、引用平台、不分端，划分标「建议」，状态原文保留。
  - 变量三端表与小程序颜色表不再误用状态词。
  - 首页新增「给部门的五分钟」与六个词。
  - 状态机加箭头，标签不被遮挡，手机可横滑。
  - 生成器 CSS 自检无字面色值。
  - 站点只读仓库内的产品现状快照，快照由 `tools/sync-product.mjs` 刷新。
  - 样式检查补 rgb、命名色、px 字号三类。缺产物报错。基线路径固定。
  - 钩子不再误触发 dist。check.mjs 改用 cpSync 与 git status。
- 2026-09-19（二）：新增可视化规范站生成器 `tools/build-site.mjs`。站点是生成物，加 `--portable` 可导出独立发布版。样板增加接收外部指令的接口。
- 2026-09-19：建立仓库。从 shandianT/xiaoshouguanli 迁入 docs/design-spec 全部内容，含 1.0.0 使用包原件与 1.1.0-draft.1 跨端草案。新增规则索引、样式检查、统一检查入口、AI 技能与钩子、四个工具入口、规范清单。
