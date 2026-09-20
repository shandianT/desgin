# 给产品仓库的 AI 说明（复制到产品仓库根目录的 AGENTS.md，Claude Code 再加一行 CLAUDE.md 引用）

把下面这段原样放进产品仓库根目录的 `AGENTS.md`。Claude Code、Codex、Copilot、Cursor 都会读根目录的 AGENTS.md 或各自的规则文件；Claude Code 的 `CLAUDE.md` 里写一行 `@AGENTS.md` 即可。

---

## 设计规范与组件库（部门仓库 shandianT/desgin）

- 本仓库的页面、样式、组件都按部门设计规范做，规范站 https://shandiant.github.io/desgin/ 。规范仓库在 shandianT/desgin，与本仓库同级目录 `../desgin`；没有就先 `git clone https://github.com/shandianT/desgin.git ../desgin`。
- 改任何页面、组件、样式、小程序 wxss／wxml／app.json、网页 css／html 之前，先读 `../desgin/.claude/skills/design-spec/SKILL.md` 并照做，即使用户没提「规范」两个字。
- 颜色、字号、间距、圆角只写 `var(--ui-*)`，变量名以 `../desgin/specs/salesbuddy/02-设计变量与同步链路/dist/变量对照表.md` 为准。不写裸色值，不发明变量。
- 先用现成组件：基础控件用 Ant Design 6（Web）或 tdesign-miniprogram（小程序）；状态标签、四态面板、筛选栏、AI 标识这些用 `@shandiant/ui-react` 或 `@shandiant/ui-miniprogram`，对照表在技能文件里。不重画。
- 加载中、空、失败、无权限四种状态都要有；失败重试不丢条件；没填的数字显示「未登记」不显示 0；AI 生成的内容一直带标识。
- 改完运行 `node ../desgin/tools/lint-styles.mjs <改动的文件> --spec ../desgin/specs/salesbuddy --baseline .design-lint-baseline.json`，新增违规必须为 0，把输出贴进交回说明。
- 交回时列出采用的规则编号（如 T-02、C-04）和用到的组件名。规则不合适不要绕过，写「建议变更：编号、问题、改法」。
