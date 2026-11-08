# 项目配置目录

每个项目在这里维护一份展示配置：

```
projects/<project-id>/project.config.json
```

配置只描述设计系统需要的产品信息：名称、主题继承、导航、通用文案、功能开关、路由和演示数据模式。

不要写入：

- PostgreSQL 地址、用户名、密码或连接串；
- API Token、密钥和 Cookie；
- 真实客户、员工、商机或生产数据；
- 后端权限和正式状态规则。

新增项目时复制 SalesBuddy 的结构，按 [配置 Schema](../specs/通用化设计系统/project.config.schema.json) 填写，然后运行：

```bash
node tools/check-project-config.mjs
node tools/check.mjs --ci
```

真实产品工程仍需自己实现数据适配器，并为开发、测试、生产使用独立数据库连接。设计系统仓库中的 `dataMode: synthetic` 只表示规范站使用合成数据。


## Web 演示

规范站 Web 演示右上角提供“当前项目”下拉框。默认是 SalesBuddy；选择 ProjectBuddy 后会切换项目名称、浏览器标题和主色，地址会带上 `?project=projectbuddy`。这用于验证配置链路，页面数据仍是合成数据，不代表真实业务接入。
