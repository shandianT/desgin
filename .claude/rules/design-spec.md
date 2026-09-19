---
paths:
  - "specs/**"
  - "**/*.{css,wxss,wxml,html,vue,jsx,tsx}"
  - "**/app.json"
  - "**/tokens.json"
---
# 碰到样式、页面或规范文件时

- 先按 `.claude/skills/design-spec/SKILL.md` 做：读规则索引与变量对照表，只写 `var(--ui-*)`，改完跑 `node tools/check.mjs`，按固定格式交回。
- 数值只改 `specs/<规范>/02-设计变量与同步链路/tokens.json`；`dist/` 与 `rules.json`、`规则索引.md` 是生成物，勿手改。
- 状态词只用五个：已确认、建议、业务事实、已验证（本地）、未验证。
