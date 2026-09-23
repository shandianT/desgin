# 演示

`web/` 是 SalesBuddy Web 候选版的构建产物（基于 v10，采用本仓库部门组件库源码重建展示层），随规范站发布到 https://shandiant.github.io/desgin/web/?mode=preview#/pages/index/index 。

- 只有示例模式，数据在浏览器里合成，不连任何后端，右上角能切角色。
- 展示层源码已从与线上产物一致的 v10 包恢复至 `web-src/department-ui/`，来源校验见 `web-src/source-provenance.json`。修改源文件后运行 `node tools/build-web-demo.mjs`，勿直接改 `web/department-ui/app.*`；业务运行时仍沿用原 Web 工程。
- 展示层覆盖总览、客户、商机、拜访、任务等页面。三项交互修改及验证说明见 `web-src/README.md`。
