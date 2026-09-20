# 部门小程序组件库

放在 tdesign-miniprogram 1.16.1 之上的组合件与 AI 件。基础控件（按钮、输入、选择器、日期、弹层、提示）直接用 `t-*`，主题只靠两个文件：

```
app.wxss 头两行：
@import "./design-tokens.wxss";      来自规范仓库 specs/salesbuddy/02-设计变量与同步链路/dist/
@import "./bridge-tdesign.wxss";     同上
```

## 组件

| 组件 | 做什么 | 规则 |
|---|---|---|
| sb-status-tag | 红黄绿灰状态标签，必带文字，可带依据 | B-01 |
| sb-state-panel | 加载中、空、失败可重试、无权限四态 | C-06 |
| sb-filter-bar | 筛选栏：标题带范围、筛选片、已选数、结果数、清除 | C-04 |
| sb-list-row | 列表行：名称、摘要、状态、时间位置固定 | C-05 |
| sb-bottom-bar | 底部固定操作条，主次按钮，含安全区 | C-01、X-05 |
| sb-ai-badge | AI 标识，持续显示，含文字 | A-02 |
| sb-ai-field | 待确认字段三态，低把握给候选，可恢复 AI 建议 | A-01、A-03、A-04 |

## 怎么用

1. 产品工程装 `tdesign-miniprogram`，开发者工具构建 npm，`app.json` 删掉 `"style": "v2"`。
2. 把 `components/` 复制到产品工程的 `components/sb/`。
3. 页面 json 的 `usingComponents` 写 `"sb-state-panel": "/components/sb/sb-state-panel/index"`。
4. 样式只写 `var(--ui-*)`，改完跑规范仓库的 `node tools/check.mjs`。

## 怎么看

浏览器看不到小程序组件。用微信开发者工具导入 `demo/`，首页把每个组件的每个状态都摆出来。真机截图放回规范仓库 `specs/salesbuddy/站点/组件库/miniprogram/`。

## 状态

代码写好，未在开发者工具与真机验证。
