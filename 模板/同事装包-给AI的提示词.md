# 同事装包：直接贴给 AI 的提示词

把下面这段整个复制，贴进 Claude Code、Cursor、Codex 任意一个，在自己的工程目录里运行。AI 会一步步做，做不了的会停下来告诉你。仓库 shandianT/desgin 是公开的，不需要任何权限和 token。

## 网页工程（React）

```
帮我把部门的设计规范包装进当前这个工程。按下面的步骤做，每一步做完告诉我结果，卡住就停下来问我。

背景：部门的设计规范仓库 https://github.com/shandianT/desgin 是公开的，打好的 npm 包文件放在仓库的 release/ 目录，直接从网址装，不需要 token。两个包：
- @shandiant/tokens：颜色、字号、间距的变量
- @shandiant/ui-react：Web 组件库，17 个组件，需要 react 18、antd 6、@ant-design/x 2

步骤：
1. 装基础库：npm i react@18 react-dom@18 antd@6 @ant-design/x@2
2. 装部门的包：
   npm i https://github.com/shandianT/desgin/raw/main/release/shandiant-tokens-1.1.0-draft.1.tgz https://github.com/shandianT/desgin/raw/main/release/shandiant-ui-react-0.5.0.tgz
   如果公司网络访问不了 github.com，让我手动下载这两个文件放到工程里，再 npm i ./文件名.tgz。
3. 验证：写一个最小页面，import '@shandiant/tokens/css' 和 '@shandiant/ui-react/style.css'，最外层用 SbProvider 包一下，里面放一个 <SbStatusTag tone="watch" reason="一周无跟进" showReason />。能渲染出一个黄色的「需关注 · 一周无跟进」标签就算成功。
4. 以后写样式，颜色字号间距只写 var(--ui-…)，变量名从 node_modules/@shandiant/tokens/dist/design-tokens.css 里查；组件优先用 @shandiant/ui-react 里现成的，属性看包里的 index.d.ts；每个组件的用法和效果在规范站 https://shandiant.github.io/desgin/ 的「组件」章。
```

## 小程序工程

```
帮我把部门的设计规范包装进当前这个微信小程序工程。按下面的步骤做，每一步做完告诉我结果，卡住就停下来问我。

背景：部门的设计规范仓库 https://github.com/shandianT/desgin 是公开的，小程序组件库的包文件在仓库 release/ 目录，直接从网址装，不需要 token。它基于 tdesign-miniprogram 1.16.1。

步骤：
1. 在小程序根目录（有 app.json 的那层）执行，没有 package.json 就先 npm init -y：
   npm i tdesign-miniprogram@1.16.1 https://github.com/shandianT/desgin/raw/main/release/shandiant-ui-miniprogram-0.5.0.tgz
2. 把 node_modules/@shandiant/ui-miniprogram/components/style/ 里的 design-tokens.wxss 和 bridge-tdesign.wxss 复制到小程序根目录，在 app.wxss 最前面加两行：@import "./design-tokens.wxss"; @import "./bridge-tdesign.wxss";
3. 告诉我接下来要我在微信开发者工具里做两件事：project.config.json 里把 nodeModules 设成 true；菜单「工具」→「构建 npm」。
4. 验证：随便一个页面的 json 里 usingComponents 加 "sb-status-tag": "@shandiant/ui-miniprogram/sb-status-tag/index"，wxml 里放 <sb-status-tag tone="watch" reason="一周无跟进" show-reason />。模拟器里出现黄色的「需关注 · 一周无跟进」就算成功。
5. 以后写样式只写 var(--ui-…)，字号不小于 28rpx；组件优先用 @shandiant/ui-miniprogram 里现成的，属性看 node_modules/@shandiant/ui-miniprogram/README.md。
```

## 以后升级

规范那边发了新版本，同事把网址里的版本号换成新的重新执行第 2 步（小程序是第 1 步）就行。最新版本号看仓库 release/README.md。

## 走 GitHub Packages 装（可选）

包也发在 GitHub Packages 上（仓库首页右侧 Packages）。这条路要每人申请一个勾了 read:packages 的 GitHub token 写进 ~/.npmrc，再在工程 .npmrc 写 @shandiant:registry=https://npm.pkg.github.com，然后 npm i @shandiant/tokens@draft @shandiant/ui-react。适合以后包多了、版本更新频繁时用。现在用上面的网址装法就够。
