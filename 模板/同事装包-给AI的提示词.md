# 同事装包：直接贴给 AI 的提示词

把下面这段整个复制，贴进 Claude Code、Cursor、Codex 任意一个，在自己的工程目录里运行。AI 会一步步做，做不了的会停下来告诉你。前提：你已经被加进 shandianT/desgin 仓库的协作者。

## 网页工程（React）

```
帮我把部门的设计规范包装进当前这个工程。按下面的步骤做，每一步做完告诉我结果，卡住就停下来问我。

背景：部门有三个 npm 包，放在 GitHub Packages 上，前缀 @shandiant，源地址 https://npm.pkg.github.com。
- @shandiant/tokens：颜色、字号、间距的变量，版本 1.1.0-draft.1，装的时候要写 @draft
- @shandiant/ui-react：Web 组件库，17 个组件，需要 react 18、antd 6、@ant-design/x 2

步骤：
1. 检查我电脑的 ~/.npmrc 里有没有一行 //npm.pkg.github.com/:_authToken=。没有的话告诉我去 GitHub 的 Settings → Developer settings → Personal access tokens → Tokens (classic) 新建一个，勾 read:packages，然后把 token 给你，你帮我写进 ~/.npmrc。这个 token 只能放在 ~/.npmrc，不能进仓库。
2. 在工程根目录建或改 .npmrc，加一行 @shandiant:registry=https://npm.pkg.github.com。这个文件可以进仓库。
3. 装依赖：npm i react@18 react-dom@18 antd@6 @ant-design/x@2，然后 npm i @shandiant/tokens@draft @shandiant/ui-react。报 404 或 401 就是第 1 步的 token 没生效，回去检查。
4. 验证：写一个最小页面，import '@shandiant/tokens/css' 和 '@shandiant/ui-react/style.css'，最外层用 SbProvider 包一下，里面放一个 <SbStatusTag tone="watch" reason="一周无跟进" showReason />。能渲染出一个黄色的「需关注 · 一周无跟进」标签就算成功。
5. 以后写样式，颜色字号间距只写 var(--ui-…)，变量名从 node_modules/@shandiant/tokens/dist/design-tokens.css 里查；组件优先用 @shandiant/ui-react 里现成的，属性看包里的 index.d.ts。
```

## 小程序工程

```
帮我把部门的设计规范包装进当前这个微信小程序工程。按下面的步骤做，每一步做完告诉我结果，卡住就停下来问我。

背景：部门的小程序组件库是 @shandiant/ui-miniprogram 0.3.0，放在 GitHub Packages 上，源地址 https://npm.pkg.github.com。它基于 tdesign-miniprogram 1.16.1。

步骤：
1. 检查我电脑的 ~/.npmrc 里有没有一行 //npm.pkg.github.com/:_authToken=。没有的话告诉我去 GitHub 的 Settings → Developer settings → Personal access tokens → Tokens (classic) 新建一个，勾 read:packages，然后把 token 给你，你帮我写进 ~/.npmrc。token 不能进仓库。
2. 在小程序根目录（有 app.json 的那层）建或改 .npmrc，加一行 @shandiant:registry=https://npm.pkg.github.com。没有 package.json 就 npm init -y 建一个。
3. npm i tdesign-miniprogram@1.16.1 @shandiant/ui-miniprogram
4. 把 node_modules/@shandiant/ui-miniprogram/components/style/ 里的 design-tokens.wxss 和 bridge-tdesign.wxss 复制到小程序根目录，在 app.wxss 最前面加两行：@import "./design-tokens.wxss"; @import "./bridge-tdesign.wxss";
5. 告诉我接下来要我在微信开发者工具里做两件事：project.config.json 里把 nodeModules 设成 true；菜单「工具」→「构建 npm」。
6. 验证：随便一个页面的 json 里 usingComponents 加 "sb-status-tag": "@shandiant/ui-miniprogram/sb-status-tag/index"，wxml 里放 <sb-status-tag tone="watch" reason="一周无跟进" show-reason />。模拟器里出现黄色的「需关注 · 一周无跟进」就算成功。
7. 以后写样式只写 var(--ui-…)，字号不小于 28rpx；组件优先用 @shandiant/ui-miniprogram 里现成的，属性看 node_modules/@shandiant/ui-miniprogram/README.md。
```

## 常见报错

| 报错 | 原因 | 怎么办 |
|---|---|---|
| 404 Not Found @shandiant/… | 工程里没有 .npmrc 那一行，npm 去公网找了 | 做第 2 步 |
| 401 Unauthorized | token 没写对，或没勾 read:packages | 重做第 1 步 |
| 403 Forbidden | 这个人不在 desgin 仓库的协作者里 | 找仓库负责人加 |
| No matching version for @shandiant/tokens | 忘了写 @draft | 加上 |
