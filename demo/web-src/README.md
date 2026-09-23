# GitHub Pages Web 样板的可编辑展示源码

本目录恢复自 `SalesBuddy-Web-v10.zip`。其 `bundle.js`、`department-ui/app.js`、`department-ui/app.css` 与仓库基线 `f6fbd4b` 的 `demo/web/` 文件逐字节一致，来源哈希见 `source-provenance.json`。只恢复展示层 JSX/CSS，既有业务运行时与 API 处理仍在原 Web 工程维护。

三项调整已实现并完成本地验证，效果图、检查结果和未验证范围见 [交付与验证](VERIFICATION.md)。下文保留实施前的计划，便于核对范围。

## 本次实施计划（2026-09-23）

目标：阶段筛选能连续勾选并一次应用，作战地图四区等大，拜访录入能直接录音或拖入文件。

1. `packages/ui-react/src/components/SbLabeledSelect.jsx`：增加可选的复选框确认模式，临时选择与生效条件分离；单选和其他调用保持原行为。更新类型、目录示例及用法。
2. `department-ui/Opportunities.jsx`：阶段启用确认模式，一次写入完整筛选数组后调用原 `applyOpportunityFilters`。其他筛选、统计、分页沿用原流程。
3. `packages/ui-react/src/components/SbBattleMap.jsx`：增加可选的等分布局，按业务阈值分段映射点位；`department-ui/Customers.jsx` 启用。阈值、象限计数、金额档与客户归属不改。
4. `department-ui/VisitEntry.jsx`：并列录音操作与 Ant Design 拖拽上传区域；保留原计时、录音、上传、提取、重试及草稿逻辑，上传文件通过现有 `SalesPlatform.registerLocalFile` 和 `page.uploadFile` 处理。
5. `tools/build-web-demo.mjs`：从展示源码与本仓库组件源码生成 `demo/web/department-ui/app.*`；构建只使用本地依赖。Pages 工作流在发布前重新构建。

风险与检查：既有页面是运行时数据驱动，避免勾一次就发一次筛选；上传不能另开请求绕过保存草稿；原录音接口不支持的操作不新增。保留分数原值，等分地图注明以阈值分区。源码恢复量较大，由来源哈希与前后页面回归核对。

验证：运行 `node tools/check.mjs --verify`；运行针对三项交互的浏览器检查，覆盖勾选／取消／应用／清空／分页、等分尺寸与象限归属、文件校验／上传进度／失败重试／录音状态、窄屏和未改页面冒烟。示例模式不调用真实转写接口；真实麦克风、服务端提取、跨端与生产结果单独标为未验证。

## 构建

```sh
cd packages/ui-react && npm ci --legacy-peer-deps && cd ../..
node packages/tokens/sync.mjs
node tools/build-web-demo.mjs
```

`demo/web/` 保留可直接托管的构建产物，勿直接编辑其中的 `department-ui/app.*`。本目录不包含真实客户数据或登录凭据。规范、变量、组件由仓库统一维护。
