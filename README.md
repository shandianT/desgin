---
type: department-design-spec-entry
status: 部门共同入口（2026-09-19 决定）；文件约定 + Git，无后端
updated: 2026-09-19
---

# 部门产品设计规范

**让用户看清信息、完成操作；让产品、设计、开发、测试和 AI 使用同一套规则。**

这个仓库是部门设计规范的家。一切都是文件：规则原文、设计变量、可交互样板、模板、验收记录、AI 技能。改动走 PR，版本打 tag，产品仓库拉取 `dist/` 产物。将来有第二套规范或第二套组件模板，在 `specs/` 下加一个目录、在 `规范清单.json` 加一行即可。

## 一份来源、四个入口、一道闸门

| | 是什么 | 在哪 |
|---|---|---|
| 一份来源 | 每套规范一个自包含目录：规则原文、`tokens.json`、样板、模板、验收 | `specs/salesbuddy/` |
| 四个入口 | 人看：`README.md` 与各章；开发用：`dist/` 产物与 `rules.json`；AI 用：`.claude/skills/design-spec/`（Codex 等读 `.agents/skills/`）；其他工具：`AGENTS.md`、`.cursor/rules/`、`.github/instructions/` | 仓库根 |
| 一道闸门 | `node tools/check.mjs`：生成变量 → 兼容校验 → 规则索引 → 样式检查（报规则编号）→ 技能引用文件；Claude Code 里还有钩子在每次写文件后自动跑 | `tools/`、`.claude/settings.json` |

## 目录

```
desgin/
├── README.md                 本页
├── 规范清单.json              多规范清单（目录、版本、状态、负责人、消费方）
├── AGENTS.md / CLAUDE.md     给 AI 工具的指路
├── .claude/                  skills/design-spec（技能）、rules（按路径自动加载）、hooks + settings.json（强制检查）
├── .agents/ .cursor/ .github/ 其他 AI 工具入口（只指路，不抄规则）
├── tools/                    check.mjs（唯一入口）、build-rules.mjs、lint-styles.mjs
└── specs/salesbuddy/         SalesBuddy 规范：README、00～04 章、02 变量与同步链路、03 跨端样板、站点（生成）、采用登记表、依据、1.0.0 原件、rules.json、规则索引.md
```

## 现在的状态

| 内容 | 状态 |
|---|---|
| SalesBuddy Web 26 条规则（P／V／C／T／B／G） | 已确认（1.0.0，2026-09-17） |
| 跨端建议 X-01～X-12、16 个新增变量、三端映射 | 建议，待登记采用 |
| 「客户列表→详情→返回」跨端样板 | 已验证（本地）：8 视口 252 项 |
| 变量同步链路（tokens.json → CSS／WXSS／JSON／app.json 片段） | 已跑通；产品未接入 |
| AI 技能与钩子 | 已建立；触发评测待做 |
| 可视化规范站 `specs/salesbuddy/站点/index.html` | 已生成（七章可交互：改变量全站变色、组件状态矩阵、拖宽看三档、状态机驱动样板、跨端筛选、流程图弹模板）；由 check.mjs 顺带生成 |
| 决定 | 主色沿用 #2863CD；本仓库为共同入口；原生 App 暂不在范围 |

## 怎么用

- **看规范**：`specs/salesbuddy/README.md`，或直接看 `specs/salesbuddy/规则索引.md`（全部规则一张表，含跨端结论）。
- **看站点**：浏览器打开 `specs/salesbuddy/站点/index.html`，七章按「原则 → 视觉基础 → 组件 → 布局 → 交互状态 → 跨端适配 → 团队怎么用」排，每章先有一个能动手的东西。汇报用它。
- **看样板**：`specs/salesbuddy/03-跨端样板-客户列表到详情/index.html`（拖窗口看三档）或 `对照.html`（三端并排）。
- **开发接入**：Web 引用 `specs/salesbuddy/02-设计变量与同步链路/dist/design-tokens.css`；小程序引用 `dist/design-tokens.wxss` 并按 `dist/miniprogram-app.tokens.json` 改 `app.json`；样式只写 `var(--ui-*)`。
- **改数值**：只改 `tokens.json`，然后 `node tools/check.mjs`，生成物一起提交。
- **改规则**：填 `specs/salesbuddy/1.0.0-使用包快照/模板/02-规则变更单.md`，开 PR，同时改规则、样例、代码说明、验收项；合并后打 tag `design-spec/vX.Y.Z`，在 `specs/salesbuddy/采用登记表.md` 登记。
- **AI**：在本仓库或产品仓库让 AI 改页面时，技能自动加载；手动输入 `/design-spec`。

## 命令

```
node tools/check.mjs             # 唯一入口
node tools/check.mjs --verify    # 加 Playwright 样板验收（首次：npm i -D playwright@1.56 && npx playwright install chromium）
node tools/check.mjs --ci        # 评审前：确认生成物与源一致（含未跟踪的新生成物）
node tools/sync-product.mjs      # 产品仓库 app.json 有变动时：刷新仓库内的产品现状快照，再跑 check.mjs
```
需要 Node 18+。

## 版本记录

- **2026-09-19（三）**：按四视角审查修正规范站与工具链：产品原则逐字引用 7 条；跨端表按 01 表结论归类（统一／适配／引用平台／不分端，划分标「建议」）并保留状态原文；变量三端表与小程序颜色表不再误用状态词；首页新增「给部门的五分钟」与六个词；状态机加箭头、标签不被遮挡、手机可横滑；生成器 CSS 自检无字面色值；站点只读仓库内的产品现状快照（`tools/sync-product.mjs`）；样式检查补 rgb／命名色／px 字号、缺产物报错、基线路径固定；钩子不再误触发 dist；check.mjs 用 cpSync 与 git status。
- **2026-09-19（二）**：新增可视化规范站生成器 `tools/build-site.mjs`（站点是生成物，`--portable` 可导出独立发布版）；样板增加接收外部指令的接口。
- **2026-09-19**：建立仓库；从 shandianT/xiaoshouguanli 迁入 docs/design-spec 全部内容（含 1.0.0 使用包原件与 1.1.0-draft.1 跨端草案）；新增规则索引、样式检查、统一检查入口、AI 技能与钩子、四个工具入口、规范清单。
