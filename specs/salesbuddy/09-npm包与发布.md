---
type: packaging
status: 源定为 GitHub Packages（shandianT 账号下）。三个包已打成文件放在 release/，发布流程已写好，还没有真正发过一次
updated: 2026-09-20
---

# npm 包：有什么用，怎么装，怎么发

## 1｜npm 包有什么用

不打包的时候，产品工程要用组件库，只能把 `packages/` 里的文件复制过去。复制一次之后，规范这边改了，产品那边不知道；产品那边顺手改了一行，规范这边也不知道。三个产品各复制一份，三个月后就是三套。

打成 npm 包以后：

- 一行安装。`npm i @shandiant/ui-react`，装的是哪个版本写在 package.json 里，谁都能看见。
- 升级可控。规范改了发 0.3.0，产品想升就改一个数字重装，不想升就停在 0.2.0。改了什么看更新记录，不用比文件。
- 不能乱改。装进 node_modules 的东西没人会去改，要改就回规范仓库改，走变更单。
- 依赖说清楚。包里写明需要 react 18、antd 6、tdesign-miniprogram 1.16，装的时候版本不对会提醒。
- 可以复现。同事的电脑、构建机、半年后的自己，装出来都一样。

一句话：复制文件是「借一份」，装包是「订阅」。

## 2｜有哪三个包

| 包 | 给谁 | 里面是什么 |
|---|---|---|
| `@shandiant/tokens` | 所有端 | 设计变量的 CSS、WXSS、JSON，和给 Ant Design、TDesign、Semi 的桥接文件。版本号跟 `tokens.json` 走，现在是 1.1.0-draft.1 |
| `@shandiant/ui-react` | Web | 17 个组合件与 AI 件，构建成 ES 与 CommonJS 两种格式加一个 style.css 和类型文件 index.d.ts。React、antd、Ant Design X 不打进去，由使用方安装 |
| `@shandiant/ui-miniprogram` | 小程序 | 15 个组件的源文件，`miniprogram` 字段指向 `components/`，微信开发者工具构建 npm 时按这个字段复制 |

包名前缀 `@shandiant` 就是 GitHub 账号 shandianT 的小写，GitHub Packages 要求两者一致。包文件在仓库 `release/` 目录，`release/README.md` 列了文件名、大小和校验值。重新打包：`node tools/pack.mjs`。

## 3｜怎么装

源是 GitHub Packages，地址 `https://npm.pkg.github.com`。它不对外开放，装的人要有一个 GitHub token。

先做一次，每台电脑一次：

1. GitHub 右上角头像，Settings，Developer settings，Personal access tokens，Tokens (classic)，新建一个，勾 `read:packages`。这个人还要能看到 shandianT/desgin 仓库。
2. 在自己电脑的用户目录建或改 `~/.npmrc`，写一行 `//npm.pkg.github.com/:_authToken=<刚才的 token>`。token 只放这里，不进仓库。

然后每个工程根目录建 `.npmrc`，写一行 `@shandiant:registry=https://npm.pkg.github.com`。这一行可以进仓库。没有这一行 npm 会去公网找这个包名然后报 404。

```
# Web
npm i react@18 react-dom@18 antd@6 @ant-design/x@2
npm i @shandiant/tokens@draft @shandiant/ui-react

# 小程序（在 frontend/miniprogram 下）
npm i tdesign-miniprogram@1.16.1 @shandiant/ui-miniprogram
```

tokens 现在是草案号，装的时候写 `@draft`，定稿后去掉。小程序还要多做一步：构建 npm 只复制包里的 `components/`，变量和桥接两个 wxss 要从 `node_modules/@shandiant/ui-miniprogram/components/style/` 复制到小程序根目录再 `@import`。

没有 token、或者还没发布，用文件装：`npm i ./release/shandiant-tokens-1.1.0-draft.1.tgz ./release/shandiant-ui-react-0.3.0.tgz`，小程序是 `./release/shandiant-ui-miniprogram-0.3.0.tgz`。用法见各包的 README 和规范站「组件」章每张卡片的「用法」。

## 4｜怎么发

不用在自己电脑上登录，仓库里有一条发布流程 `.github/workflows/publish.yml`，用 GitHub 自带的权限往 GitHub Packages 推。

1. 打开 shandianT/desgin 的 Actions 页，左侧选 publish-npm，右侧「Run workflow」。
2. 要发哪几个包填在第一格，默认三个都发。第二格填 true 只演练不发布，第一次建议先演练一遍。
3. 点绿色按钮，两三分钟跑完。发好的包在仓库首页右侧 Packages 里能看到。

推一个 `v` 开头的标签也会触发，比如 `git tag v0.3.0 && git push origin v0.3.0`。

流程里做的事：装 ui-react 依赖，跑 `node tools/check.mjs`，依次发 tokens、ui-react、ui-miniprogram。版本号带 `-draft` 的自动发到 `draft` 标签，不占 latest；正式号发 latest。同一个版本号不能发第二次，改了东西先在 package.json 升号再发。

三个 package.json 的 publishConfig 已经写死 `https://npm.pkg.github.com`，在本地误敲 `npm publish` 也不会发到公网。

以后换到公司私有源（Nexus、Verdaccio 这类）只要改三处：`.npmrc` 的地址、publishConfig 的地址、发布流程的 registry-url 与 token。包名不用动。

发布顺序：先 tokens，再 ui-react 和 ui-miniprogram，因为 ui-react 的主题从 tokens 包读。每次发布前在包目录的 CHANGELOG.md 加一段，写改了什么、对使用方有什么影响；发布后在采用登记表登记版本。

版本号规则跟 04 章一致：只改值升修订号（0.2.1），加组件或加属性升次版本（0.3.0），改含义或删属性升主版本（1.0.0）。tokens 包的版本永远等于 `tokens.json` 的版本。

## 5｜还没做的

- 发布流程写好了，还没有真正跑过一次。第一次跑先勾演练。
- 装的人各自要申请一个 GitHub token，并且要能看到 desgin 仓库。仓库是私有的话，要先把人加进来。
- 小程序包没有在开发者工具里装过、构建过。
- 已验证：在干净的 React 18 加 antd 6 工程里装包、构建、渲染都正常，ES 与 CommonJS 两种引入都能用，TypeScript 工程有属性提示，传错枚举值会报错；小程序包结构符合微信 npm 规则，但没在开发者工具里装过。
