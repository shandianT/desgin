# @shandiant/tokens

部门设计变量的产物包。源头只有一个：规范仓库 `specs/salesbuddy/02-设计变量与同步链路/tokens.json`。改值改那里，跑 `node tools/check.mjs`，本包 `npm run sync` 后重新打包。

| 引入 | 给谁 | 内容 |
|---|---|---|
| `@shandiant/tokens/css` | 电脑网页、手机网页 | `--ui-*` 变量，≤600px 覆盖 |
| `@shandiant/tokens/wxss` | 小程序 | `page { --ui-* }`，px |
| `@shandiant/tokens/json` | 工具、脚本 | 已解析的扁平表 |
| `@shandiant/tokens/miniprogram-app` | 小程序 app.json | window 与 tabBar 五项颜色 |
| `@shandiant/tokens/bridge-antd` | Ant Design 6 | ConfigProvider 的 theme，JS 模块；要原始 JSON 用 `/bridge-antd.json` |
| `@shandiant/tokens/bridge-tdesign.wxss` | tdesign-miniprogram | `page { --td-* }` |
| `@shandiant/tokens/bridge-tdesign.css` | TDesign Web | `:root { --td-* }` |
| `@shandiant/tokens/bridge-semi.css` | Semi Design | 浅色 |

不想自己做，把 `模板/同事装包-给AI的提示词.md` 里那段贴给 AI 工具，它会一步步做。安装前在工程根目录建 `.npmrc`，写一行 `@shandiant:registry=https://npm.pkg.github.com`，再写一行 `//npm.pkg.github.com/:_authToken=<GitHub token>`；token 要有 read:packages 权限。没有 token 就用包文件 `npm i ./shandiant-tokens-<版本>.tgz`。

小程序不走 npm 的 exports，直接把 `dist/design-tokens.wxss` 与 `dist/bridge-tdesign.wxss` 复制到工程里 `@import`。
