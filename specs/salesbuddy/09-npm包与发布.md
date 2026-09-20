---
type: packaging
status: 三个包已打成文件放在仓库 release/，没有发布到任何源。发布要先定私有源地址与账号
updated: 2026-09-20
---

# npm 包：有什么用，怎么装，怎么发

## 1｜npm 包有什么用

不打包的时候，产品工程要用组件库，只能把 `packages/` 里的文件复制过去。复制一次之后，规范这边改了，产品那边不知道；产品那边顺手改了一行，规范这边也不知道。三个产品各复制一份，三个月后就是三套。

打成 npm 包以后：

- 一行安装。`npm i @sensetime-dept/ui-react`，装的是哪个版本写在 package.json 里，谁都能看见。
- 升级可控。规范改了发 0.3.0，产品想升就改一个数字重装，不想升就停在 0.2.0。改了什么看更新记录，不用比文件。
- 不能乱改。装进 node_modules 的东西没人会去改，要改就回规范仓库改，走变更单。
- 依赖说清楚。包里写明需要 react 18、antd 6、tdesign-miniprogram 1.16，装的时候版本不对会提醒。
- 可以复现。同事的电脑、构建机、半年后的自己，装出来都一样。

一句话：复制文件是「借一份」，装包是「订阅」。

## 2｜有哪三个包

| 包 | 给谁 | 里面是什么 |
|---|---|---|
| `@sensetime-dept/tokens` | 所有端 | 设计变量的 CSS、WXSS、JSON，和给 Ant Design、TDesign、Semi 的桥接文件。版本号跟 `tokens.json` 走，现在是 1.1.0-draft.1 |
| `@sensetime-dept/ui-react` | Web | 17 个组合件与 AI 件，构建成 ES 与 CommonJS 两种格式加一个 style.css。React、antd、Ant Design X 不打进去，由使用方安装 |
| `@sensetime-dept/ui-miniprogram` | 小程序 | 15 个组件的源文件，`miniprogram` 字段指向 `components/`，微信开发者工具构建 npm 时按这个字段复制 |

包文件在仓库 `release/` 目录，`release/README.md` 列了文件名、大小和校验值。重新打包：`node tools/pack.mjs`。

## 3｜怎么装

无论从源装还是用文件装，先在工程根目录建一个 `.npmrc`，写一行 `@sensetime-dept:registry=<部门私有源地址>`，没有这一行 npm 会去公网找这个包名然后报 404。现在没有发布到源，用文件装：

小程序还要多做一步：构建 npm 只复制包里的 `components/`，变量和桥接两个 wxss 要从 `node_modules/@sensetime-dept/ui-miniprogram/components/style/` 复制到小程序根目录再 `@import`。

```
# Web
npm i react@18 react-dom@18 antd@6 @ant-design/x@2
npm i ./release/sensetime-dept-tokens-1.1.0-draft.1.tgz ./release/sensetime-dept-ui-react-0.2.1.tgz

# 小程序（在 frontend/miniprogram 下）
npm i tdesign-miniprogram@1.16.1 ./release/sensetime-dept-ui-miniprogram-0.2.1.tgz
```

发布到源之后，去掉 `./release/…tgz`，直接写包名。用法见各包的 README 和规范站「组件」章每张卡片的「用法」。

## 4｜怎么发

发布要两样东西：一个源的地址，一个能往里推的账号。三种选法：

| 选法 | 适合 | 要做的事 |
|---|---|---|
| 公司私有 npm 源（Nexus、Verdaccio、JFrog 这类，IT 一般有） | 首选 | 向 IT 要地址和账号；仓库根加 `.npmrc` 写 `@sensetime-dept:registry=<地址>`；`npm login --registry=<地址>`；`npm publish` |
| GitHub Packages | 代码已在 GitHub、不想再申请 | 用 GitHub token 登录 `npm.pkg.github.com`；包名 scope 要等于 GitHub 组织名 |
| 公网 npmjs.org | 不建议 | 代码会公开，部门内部包不该走这里 |

发布顺序：先 tokens，再 ui-react 和 ui-miniprogram，因为 ui-react 的主题从 tokens 包读。每次发布前跑 `node tools/check.mjs` 和 `node tools/pack.mjs`，在采用登记表登记版本。tokens 现在是草案号 1.1.0-draft.1，发布时加 `--tag draft`，别占 latest；定稿到 1.1.0 再走 latest。源地址定下后，三个 package.json 的 publishConfig 里加 registry 地址，防止误发到公网。

版本号规则跟 04 章一致：只改值升修订号（0.2.1），加组件或加属性升次版本（0.3.0），改含义或删属性升主版本（1.0.0）。tokens 包的版本永远等于 `tokens.json` 的版本。

## 5｜还没做的

- 没有发布到任何源。要发得先定源地址和账号，这是 IT 或部门负责人的事。
- 包名前缀 `@sensetime-dept` 是占位，发布到 GitHub Packages 时要改成组织名。
- 小程序包没有在开发者工具里装过、构建过。
- 没有更新记录文件，第一次正式发布时建 CHANGELOG。
- Web 包没有 TypeScript 类型文件，TS 工程引入没有属性提示。
- 已验证：在干净的 React 18 加 antd 6 工程里装包、构建、渲染都正常，ES 与 CommonJS 两种引入都能用；小程序包结构符合微信 npm 规则，但没在开发者工具里装过。
