# SalesBuddy Web UI 1.2.2｜设计回流参考

本目录保存用户提供的 `SalesBuddy-Web-UI-1.2.2-c832847-20261020.zip` 中的 Web UI 源码快照。展示版在 [`../web/`](../web/)；它直接复制包内重新构建的 `frontend/web/dist/`，在 GitHub Pages 通过 `/web/?mode=preview#/pages/index/index` 使用合成数据预览。来源提交为 `c832847eb0b9c50a8c3f28137e4cc2464fec3c55`，版本和文件校验值见 [`../web-ui-1.2.2.json`](../web-ui-1.2.2.json)。

这里仅保留 `department-ui/` 的 227 个 UI 源文件和 3 个样式入口，供设计评审、页面复用与下一轮组件抽取参考。完整构建还依赖产品 Web 工程的业务模块、构建脚本、共享源码和 npm 依赖；本目录**不能单独构建成展示版**。完整可复用工程以来源包及其所属产品仓库为准。旧版 `../web-src/` 对应 2026-09-24 展示，已标为历史源码。

## 与部门现行规范的关系

- 当前展示是**产品 UI 实现参考**，不是 26 条已确认 Web 规则的自动修订，也不是部门组件库的新版本。
- 产品的 PC 视觉 2.0 覆盖层在 [`department-ui/pc/tokens.css`](department-ui/pc/tokens.css)：主色 `#3370FF`、浅色侧栏、14px 桌面正文、32px 控件。部门变量源仍是 `specs/salesbuddy/02-设计变量与同步链路/tokens.json`，主色 `#2863CD`；产品覆盖层只在这个展示中生效。是否提升为部门变量，需要设计负责人按规则变更单评审，不能因为页面已展示就视为已确认。
- 本次没有修改 `packages/ui-react/`、`packages/ui-miniprogram/`、公共 tokens 或已确认规则。各项目继续按已登记的规范版本接入；新 UI 模式先从真实使用频次、跨产品需求和状态完整性评审，再抽成共享组件。
- 包内说明生产 API 配置已清空；在线 `/web/` 仅用于合成预览。真实身份、数据权限、接口联调、移动端真机及业务验收均需独立验证。

## 核验和后续更新

在仓库根运行 `node tools/verify-web-snapshot.mjs` 可核对展示产物和 UI 源码的文件数与全树 SHA-256；`node tools/check.mjs` 也会执行它。包内 1158 个成员的 `CHECKSUMS.sha256` 在导入前已逐项核验。当前展示由产品包提供，`tools/build-web-demo.mjs` 只对应旧版源码，已防止误覆盖。下次更新产品 UI，应导入新的 `dist/`、相关 UI 源码，更新来源记录并验证页面，不直接修改构建后的 `demo/web/department-ui/app.js`。

2026-10-20 本地浏览器检查：工作台、客户经营、知识库方案与定价页可用合成数据打开；日报入口可进入，但当前合成预览没有实现 `GET /work-reports/overview/options`，显示可重试错误。此项属于预览数据覆盖缺口，不代表真实接口已验证。PC 视觉和页面渲染已检查；其他角色、手机宽度、真实接口和线上 GitHub Pages 结果待分别核对。


## 2026-10-22 对齐 1.2.4 候选

最新产品候选固定为 b9a32ef20bc76d15d1436440f4420f3e259360（PR #185；PR #184 的合并提交为 ee63ee9f11dffb29a71ae5eee3a322d8f56a6759）。对照结果和待导入快照清单见 [WEB_UI_1.2.4_ALIGNMENT.md](WEB_UI_1.2.4_ALIGNMENT.md)，版本登记见 [../web-ui-1.2.4.json](../web-ui-1.2.4.json)。本次保留合成预览边界：未伪造压缩包、dist 文件数或校验值；完整产品仍不能由本目录独立构建。跟进建议/待办、桌面 Modal/Drawer、最近跟进排序、协同人排除当前跟进人，以及加载失败后的数据恢复均已登记为需要更新的快照覆盖项。26 条既定规则、公共组件、部门色 #2863CD 和产品覆盖色 #3370FF 的独立关系保持不变。
