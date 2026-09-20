# @shandiant/tokens 更新记录

包的版本永远等于规范仓库 `tokens.json` 的 `$meta.version`。变量本身的增删改看 `dist/变量对照表.md`，这里只记包层面的变化。

## 1.1.0-draft.1（2026-09-20，第二次打包）

- 加类型文件：`bridge-antd`、`json`、`miniprogram-app` 三个入口在 TypeScript 里有类型。
- 包名从 `@sensetime-dept/tokens` 改为 `@shandiant/tokens`，源为 GitHub Packages。
- 加本文件。

## 1.1.0-draft.1（2026-09-20，第一次打包）

- 出 `bridge-antd` 的 JS 模块（ES 与 CommonJS），ui-react 的 SbProvider 从这里读主题。
- 入口：css、wxss、json、miniprogram-app、bridge-antd、bridge-antd.json、bridge-tdesign.css、bridge-tdesign.wxss、bridge-semi.css。
- 变量内容：基础层与语义层的值来自 SalesBuddy Web 1.0；主色 #2863CD；给 TDesign、Ant Design、Semi 的桥接。
