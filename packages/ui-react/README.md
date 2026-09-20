# @shandiant/ui-react

部门 Web 组件库。基础控件直接用 Ant Design 6，这里只放规范要求的组合件与 AI 件，17 个，主题只来自设计变量的桥接文件。

## 安装

```
# 工程根目录 .npmrc 写两行：@shandiant:registry=https://npm.pkg.github.com 与 //npm.pkg.github.com/:_authToken=<GitHub token>（没有 token 就用包文件）
npm i react@18 react-dom@18 antd@6 @ant-design/x@^2.3
npm i @shandiant/tokens @shandiant/ui-react   # 或 npm i ./shandiant-tokens-<版本>.tgz ./shandiant-ui-react-<版本>.tgz
```

## 用

```jsx
import '@shandiant/tokens/css';          // 设计变量 --ui-*
import '@shandiant/ui-react/style.css';  // 组件样式
import { SbProvider, SbStatePanel, SbStatusTag } from '@shandiant/ui-react';

export default function App() {
  return (
    <SbProvider>
      <SbStatePanel state="empty" title="没有匹配的客户" description="换一个条件试试。" />
      <SbStatusTag tone="watch" reason="一周无跟进" showReason />
    </SbProvider>
  );
}
```

`SbProvider` 里已经带了 antd 的中文语言包和桥接主题（主色、圆角、控件高度）。每个组件的属性、状态、用法见规范站「组件」章，或包里的 `META` 与 `USAGE` 导出。包里带类型文件，TypeScript 工程引入有属性提示，改动看 CHANGELOG.md。

## 版本

跟规范一起走：只改值升修订号，加组件或属性升次版本，改含义或删属性升主版本，见规范仓库 `specs/salesbuddy/04-团队协作与版本流程.md`。
