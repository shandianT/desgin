@AGENTS.md

# Claude Code 专属说明

- 本仓库的技能 `design-spec` 会在处理 `specs/**`、样式文件、`app.json`、`tokens.json` 时自动加载；也可手动输入 `/design-spec`。
- `.claude/settings.json` 里的 PostToolUse 钩子会在每次 Edit／Write 后跑样式检查与变量校验；被拦下时按输出里的规则编号修正，不要绕过。
- 产品仓库（例如 shandianT/xiaoshouguanli）消费本仓库的 `dist/` 产物；在产品仓库改样式时用基线只报新增违规：`node ../desgin/tools/lint-styles.mjs <文件> --spec ../desgin/specs/salesbuddy --baseline .design-lint-baseline.json`。
- 对客文案用中文全角标点；正文不小于 14px，说明不小于 12px。
