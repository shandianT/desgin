# @sensetime-dept/tokens

部门设计变量的产物包。源头只有一个：规范仓库 `specs/salesbuddy/02-设计变量与同步链路/tokens.json`。改值改那里，跑 `node tools/check.mjs`，本包 `npm run sync` 后重新打包。

| 引入 | 给谁 | 内容 |
|---|---|---|
| `@sensetime-dept/tokens/css` | 电脑网页、手机网页 | `--ui-*` 变量，≤600px 覆盖 |
| `@sensetime-dept/tokens/wxss` | 小程序 | `page { --ui-* }`，px |
| `@sensetime-dept/tokens/json` | 工具、脚本 | 已解析的扁平表 |
| `@sensetime-dept/tokens/miniprogram-app` | 小程序 app.json | window 与 tabBar 五项颜色 |
| `@sensetime-dept/tokens/bridge-antd` | Ant Design 6 | ConfigProvider 的 theme，JS 模块；要原始 JSON 用 `/bridge-antd.json` |
| `@sensetime-dept/tokens/bridge-tdesign.wxss` | tdesign-miniprogram | `page { --td-* }` |
| `@sensetime-dept/tokens/bridge-tdesign.css` | TDesign Web | `:root { --td-* }` |
| `@sensetime-dept/tokens/bridge-semi.css` | Semi Design | 浅色 |

安装前在工程根目录建 `.npmrc`，写一行 `@sensetime-dept:registry=<部门私有源地址>`；没有源就用包文件 `npm i ./sensetime-dept-tokens-<版本>.tgz`。

小程序不走 npm 的 exports，直接把 `dist/design-tokens.wxss` 与 `dist/bridge-tdesign.wxss` 复制到工程里 `@import`。
