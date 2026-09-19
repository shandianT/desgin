# 给所有 AI 工具的指路（Claude Code、Codex、Copilot、Cursor 通用）

这是「部门产品设计规范」仓库（shandianT/desgin）：让产品、设计、开发、测试和 AI 用同一套规则做页面。规范以文件约定 + Git 维护，没有后端。

- 入口：`README.md`；规范清单：`规范清单.json`；当前唯一规范：`specs/salesbuddy/`。
- 改任何页面、组件、样式、小程序页面、设计变量之前，先读并遵守 `.claude/skills/design-spec/SKILL.md`（Codex 等工具读 `.agents/skills/design-spec/SKILL.md`，两份由脚本同步，内容相同）。
- 颜色、字号、间距只写 `var(--ui-*)`，数值只在 `specs/<规范>/02-设计变量与同步链路/tokens.json` 改；`dist/`、`rules.json`、`规则索引.md` 是生成物，勿手改。
- 改完运行 `node tools/check.mjs`（改了样板再加 `--verify`），把输出写进交回说明。
- 交回格式、禁止事项见技能文件；状态词只用五个：已确认、建议、业务事实、已验证（本地）、未验证。
- `specs/*/1.0.0-使用包快照/` 是原件，不改；改规则填 `模板/02-规则变更单.md` 并开 PR。
