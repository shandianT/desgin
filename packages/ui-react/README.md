# @sensetime-dept/ui-react

部门 Web 组件库。基础控件直接用 Ant Design 6，这里只放规范要求的组合件与 AI 件，17 个，主题只来自设计变量的桥接文件。

## 安装

```
npm i react@18 react-dom@18 antd@6 @ant-design/x@2
npm i @sensetime-dept/ui-react        # 从部门私有源；或 npm i ./sensetime-dept-ui-react-0.2.0.tgz
```

## 用

```jsx
import '@sensetime-dept/tokens/css';          // 设计变量 --ui-*
import '@sensetime-dept/ui-react/style.css';  // 组件样式
import { SbProvider, SbStatePanel, SbStatusTag } from '@sensetime-dept/ui-react';

export default function App() {
  return (
    <SbProvider>
      <SbStatePanel state="empty" title="没有匹配的客户" description="换一个条件试试。" />
      <SbStatusTag tone="watch" reason="一周无跟进" showReason />
    </SbProvider>
  );
}
```

`SbProvider` 里已经带了 antd 的中文语言包和桥接主题（主色、圆角、控件高度）。每个组件的属性、状态、用法见规范站「组件」章，或包里的 `META` 与 `USAGE` 导出。

## 版本

跟规范一起走：只改值升修订号，加组件或属性升次版本，改含义或删属性升主版本，见规范仓库 `specs/salesbuddy/04-团队协作与版本流程.md`。
