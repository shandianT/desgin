# 无框架 Web 引入成熟组件库的三条路线查证与建议（Web Components ／ 岛屿式 React＋Semi ／ 整站 React）

> 查证日期 2026-09-19。官网（semi.design、tdesign.tencent.com、weui.io、vant、ant.design、arco.design、webawesome.com 等）与 GitHub 网页／API 在本会话均被代理拦截；本文全部事实来自 raw.githubusercontent.com 的官方仓库源文件、registry.npmjs.org 元数据与实际下载的 npm 发布包。「官方事实」= 官方仓库文档或元数据原文；「仓库证据」= 读源码得到；「推论」= 由前两者推出；「未能核实」= 只在官网或不可达资源上有。由 AI 查证，待有网络的同事按来源复核。

查证结论：## 一页对比（给决策者）

**先说结论：** 在「Web 是从小程序源码生成、没有任何前端框架」的现实下，**最省事又能立刻见效的是路线 A：保持无框架，引入 Web Awesome（Shoelace 的正式继任者，MIT 开源）做按钮、输入、选择、弹窗、抽屉、提示，主题只需把我们的 `--ui-primary`（#2863CD）映射到它的 `--wa-color-brand-*` 变量。** 「飞书的组件」在开源世界里只有 Semi Design（字节跳动开源、React 专用），它**没有 Web Components 版本**，要用它就必须引入 React；但「岛屿式」局部挂载是 React 官方支持的做法，Semi 的全局样式侵入很小，所以路线 B 可以作为**第二阶段样板**验证，而不是现在整站重写（路线 C）。

名词一句话：**Web Components** = 浏览器原生的自定义标签（如 `<wa-button>`），不依赖 React/Vue；**岛屿式挂载** = 在现有页面的某个 `<div>` 里单独启动 React 渲染一块组件，页面其他部分不动；**设计变量（token）** = 把颜色、间距起名字集中维护，如 `--ui-primary`；**Shadow DOM** = 组件自带的隔离样式盒子，外部 CSS 进不去，但 CSS 变量能穿透。

| 维度 | A 无框架＋Web Components（推荐首选 Web Awesome，备选 TDesign WC） | B 岛屿式 React＋Semi | C 整站 React 重写 |
|---|---|---|---|
| 与现状匹配 | 完全匹配：现有页面就是 `<script defer>` 引 vendor 的无构建方式，加两行 `<link>`+`<script type="module">` 即可用 | 需新增构建工具（Vite）；React 19 已取消 UMD，无构建只能退回 React 18 UMD 或 ESM CDN，而 Semi 官方「不推荐直接使用已构建文件」 | 推翻「从小程序源码生成 Web」的构建方式，等于重建 Web 工程 |
| 组件覆盖（对照规则 C-01～C-07） | Web Awesome 免费版覆盖按钮、输入、选择、弹窗、抽屉、提示、分页、树；**无表格、无日期选择器（属付费 Pro）**→ 表格用原生 table＋规范 CSS，日期继续用现有 flatpickr。TDesign WC 有日期选择器、无表格、无表单、无抽屉 | Semi 70+ 组件全覆盖，含表格、表单校验、日期、抽屉（SideSheet） | 同 B |
| 主题微调难度 | 低：覆盖 `--wa-color-brand-*`（或 `--td-brand-color*`）一组 CSS 变量；字体、圆角、间距同为 CSS 变量 | 中：一次性用 Semi DSM 生成主色 #2863CD 的 npm 主题包；prefixCls／CSS Layer 等编译期能力需 webpack/rspack/vite 插件 | 同 B |
| 全局样式侵入 | Web Awesome 的 native.css（重置 html/body/h1～h6 等）是**可选**文件，不引就不侵入；TDesign 只在 `:root` 放变量 | 小：semi.min.css 对页面只加 body 字体栈＋抗锯齿＋CSS 变量，以及 `img[src=""]{opacity:0}`；无 reset | 同 B |
| 体积／性能 | 按需自动加载单个组件 | Semi UMD 压缩后 3.47 MB JS＋683 KB CSS，再加 React；用 Vite 按需打包可显著减小 | 同 B，但可全量按需 |
| 「飞书感」 | 无（通用中性风格，靠我们的变量和规则实现） | 最接近：Semi 与飞书同源，npm 上有 DSM 生成的 `@semi-bot/semi-theme-feishu` 主题包（是否飞书官方发布未能核实） | 同 B |
| 与小程序共享 | 变量层可共享；TDesign 的 `--td-brand-color` 与 tdesign-miniprogram **同名**，是唯一一套 Web＋小程序同名变量的大厂生态 | Semi 官方明确无移动端、无小程序版；只能共享变量与规则 | 同 B |
| 团队技能要求 | 会 HTML/CSS 即可，无需 Node 构建 | 需要 React＋Vite；两套组件并存期需管理 | 需要完整 React 工程能力与人力 |
| 风险 | Shoelace 本体已停更（sunset），**必须选 Web Awesome 而非 Shoelace**；TDesign WC 最近正式版 2025-12-30，仍在 1.x | 弹层默认挂到 body（可配 getPopupContainer）；React 版本要与 semi-ui／semi-ui-19 对应 | 一次性投入最大；Web 工程当前不在本仓库，无法评估存量 |
| 落地周期（推论） | 1～2 周可出「客户列表→详情」样板 | 3～4 周（含构建链搭建） | 数月 |

**建议的决策：** 现在拍板 A（Web Awesome 主、TDesign WC 备），同时授权用 B 在「任务工作台」一页做岛屿式样板测 Semi 主题包与体积；C 不做，直到 Web 工程进仓库、第一批模块用 A 验收后再评估。「部门自己的一套」= 一个内部 npm 包，里面只放 tokens.json 生成的 `--ui-*` 变量及其到 `--wa-*`／`--td-*`／`--semi-*` 的映射文件，组件本身全部来自上游、不自研。

**证据边界：** 所有官网（shoelace.style、webawesome.com、semi.design、tdesign.tencent.com、ant.design、arco.design、vant）本次均被代理拦截（403）；GitHub API 也被限制。结论来自 raw.githubusercontent.com 官方仓库源文件与 registry.npmjs.org 官方 npm 包内容（含随包发布的 README、LICENSE、CSS、文档），能核实的标「官方事实」，不能的标「未能核实」。

## findings

- **[仓库证据] 现有 sales-web 是「由小程序页面树生成 Web」、无前端框架、用 <script defer> 直接引入 Tom Select／Flatpickr／ECharts 的无构建站点；Web 工程本体不在任何仓库中**
  来源：/home/user/desgin/specs/salesbuddy/1.0.0-使用包快照/依据/Web交互重构建议.md（「仍由小程序页面树生成Web」「本轮尚未决定更换技术栈」「原工程参考：sales-web/scripts/build.py:98」「sales-web/source/miniprogram/pages/…」）；/home/user/desgin/specs/salesbuddy/1.0.0-使用包快照/手册正文.md 第 07 章可复用资产表；/home/user/desgin/specs/salesbuddy/1.0.0-使用包快照/依据/Web历史验证.md（「未引入新依赖或改写第三方库」）；/home/user/desgin/specs/salesbuddy/1.0.0-使用包快照/示例册/design-system/index.html 第 7～19 行；/home/user/desgin/specs/salesbuddy/00-本轮工作说明-20260919.md 第 2 节（「Web 工程 sales-web 不在本仓库」）
  示例册 index.html 只有 <link rel=stylesheet> 与 <script defer src=…> 引入 vendor，没有任何打包器或模块系统；select-components.js 首行注释「Tom Select owns its portal DOM; the imported page keeps every business callback」并引用 global.SalesRuntime?.current，说明 Web 有一套自建的「页面运行时」承接小程序页面回调。build.py 的具体逻辑因工程不在仓库而未能核实。含义：引入任何组件库都不是「装个包」，而是要么加两行标签（Web Components），要么先建 Node 构建链（React）。
- **[仓库证据] 小程序端目前未使用任何 npm 组件库，也未开启 npm 构建**
  来源：/home/user/xiaoshouguanli/frontend/project.config.json（nodeModules:false、packNpmManually:false）；/home/user/xiaoshouguanli/frontend/miniprogram/app.json（无 usingComponents）；/home/user/xiaoshouguanli/frontend/miniprogram/components/ 仅有 cloudTipModal；无 miniprogram_npm 目录
  这意味着「部门自己的一套」若要覆盖小程序，小程序侧也是从零接入；TDesign 小程序版是唯一与 Web 版同名变量的选项（见 tdesign-miniprogram 条目）。
- **[官方事实] Shoelace 已正式停止开发（sunset），最后版本 2.20.1 发布于 2025-03-11，MIT 许可；官方要求转向继任者 Web Awesome**
  来源：https://raw.githubusercontent.com/shoelace-style/shoelace/next/README.md（「Shoelace is sunset. There is no active development on this codebase」）；https://raw.githubusercontent.com/shoelace-style/shoelace/next/package.json（description: 「Sunset — Web Component Library. Successor: Web Awesome」）；https://registry.npmjs.org/@shoelace-style/shoelace（latest 2.20.1，time 2025-03-11，license MIT）
  Shoelace 的 CDN 用法是 <link href=cdn.jsdelivr.net/npm/@shoelace-style/shoelace@版本/cdn/themes/light.css> + <script type=module src=…/cdn/shoelace-autoloader.js>（docs/pages/getting-started/installation.md）；主题变量前缀 --sl-，light.css 共 390 个变量，主色为 --sl-color-primary-50～950 共 11 档，在 :root 覆盖即可（docs/pages/getting-started/customizing.md）。结论：可以作为理解 Web Components 主题机制的参考，但**不应选型**。
- **[官方事实] Web Awesome（@awesome.me/webawesome）是 Shoelace 的继任者，3.13.0 发布于 2026-09-16，npm 包与仓库均为 MIT 许可（版权 Fonticons，即 Font Awesome 公司）；免费版 70 余个组件，付费 Pro 才有 Data Grid、Date Picker、富文本编辑器**
  来源：https://registry.npmjs.org/@awesome.me/webawesome（latest 3.13.0，license MIT，time 2026-09-16）；npm 包内 LICENSE.md（Copyright (c) 2025 Fonticons, Inc.，MIT）；https://raw.githubusercontent.com/shoelace-style/webawesome/next/package.json（monorepo，含 webawesome 与 webawesome-pro 两个 workspace）；npm 包内 dist/skills/webawesome/SKILL.md 第 4、16～18、456～461 行（「license: MIT / Commercial (for Web Awesome Pro)」「Pro Components (Data Grid, Date Picker, Rich Text Editor, etc.)」）；包内 dist/llms.txt 组件清单
  免费组件清单（dist/components 目录）：button、button-group、input、number-input、textarea、select、option、checkbox、radio、switch、slider、tag-input、dialog、drawer、popover、dropdown、tooltip、toast、callout、pagination、tab-group、tree、card、skeleton、spinner、page 等；**没有 table／data-grid，没有 date-picker**（有 time-input）。对照本部门 C-01～C-07：按钮、输入与校验（表单控件为 form-associated custom elements，走浏览器原生校验 API）、选择器、弹窗与展开、反馈状态可覆盖；筛选栏与列表表格需用原生元素＋规范 CSS，日期继续用现有 flatpickr。仓库 main 分支不存在，源码在 next 分支；GitHub API 被本会话限制，未能列目录。
- **[官方事实] Web Awesome 的主题机制：231 个 --wa-* CSS 变量；品牌色为 --wa-color-brand-{95…10} 十档色阶加 fill／border／on × loud／normal／quiet 语义变量；改品牌色可在 <html> 加 class（wa-brand-{hue}）或直接覆盖变量；全局重置样式 native.css 是可选文件且包在 @layer wa-native 内**
  来源：npm 包内 dist/styles/themes/default.css（统计 231 个 --wa- 变量；第 41 行 --wa-color-brand-fill-loud: var(--wa-color-brand-50)）；dist/skills/webawesome/references/tokens/color.md 第 316～470 行（「--wa-color-{variant}-{tint}」「apply the wa-{variant}-{hue} class to the <html> element」）；dist/skills/webawesome/references/installation.md 第 11～27、74～105 行；dist/styles/webawesome.css（依次 @import layers.css、native.css、utilities.css、themes/default.css）；dist/styles/native.css 首段（@layer wa-native { html {…} body {…} h1…}）
  CDN 官方写法：<link rel=stylesheet href=https://ka-f.webawesome.com/webawesome@3.12.0/styles/themes/default.css> + <script type=module src=https://ka-f.webawesome.com/webawesome@3.12.0/webawesome.loader.js>（官方自有 CDN）；自托管用包内 dist-cdn/（已把依赖打包在一起，无需构建工具）。对本部门的含义：只需写一份「--ui-* → --wa-color-brand-*」映射 CSS（把 #2863CD 及其色阶填进 brand 十档），不引 native.css 就不会影响现有页面全局样式。官方内置 palette 是十种色相，自定义色阶需自己给出十档值（可由 tokens.json 生成）。
- **[官方事实] TDesign Web Components（tdesign-web-components）是腾讯 TDesign 的 Web Components 版本，MIT 许可，基于 Omi 7；正式版 1.2.10 发布于 2025-12-30（另有 1.3.1-alpha 持续发布）；提供 UMD 全量包与 CSS 变量主题（--td-brand-color 等 435 个 --td-* 变量，:root 与 :root[theme-mode=dark] 两套）**
  来源：https://registry.npmjs.org/tdesign-web-components（latest 1.2.10，time 2025-12-30，license MIT，deps 含 omi）；npm 包内 README.md（「based on omi」「Dark mode and customizable theme」；用法 import 'tdesign-web-components/lib/style/index.css' + import 'tdesign-web-components/lib/button'；浏览器支持 Edge≥84、Chrome≥84、Safari≥14.1）；包内 dist/tdesign.css（435 个 --td- 变量、[theme-mode="light"]／[theme-mode="dark"]）；包内 dist/「TDesign Web Components.min.js」（7.4 MB，UMD 全局名 TDesign）；包内 CHANGELOG.md（1.2.9 于 2025-12-24 新增 DatePicker、DateRangePicker、Select）；包内 lib/ 目录清单
  组件覆盖（lib/ 目录）：button、input、textarea、input-number、select、select-input、date-picker、range-input、checkbox、radio、switch、slider、dialog、popup、popconfirm、tooltip、message、notification、pagination、tabs、tag、upload、menu、list、grid、skeleton、loading，以及一整套 chat/chatbot 组件；**没有 table、form、drawer、tree、cascader**。默认使用 Shadow DOM（Omi 运行时在 lib/_chunks/dep-31fb67ae.js 调用 attachShadow；lib/_util/lightDom.js 提供 isLightDOM 可选退出）。tdesign.tencent.com 被拦截；Tencent/tdesign-web-components 的 raw main／develop 分支返回 404，README 指向 github.com/TDesignOteam/tdesign-web-components，因此仓库实际位置与官网文档未能核实。
- **[官方事实] tdesign-miniprogram 1.16.1（MIT，2026-09-09 发布）与 tdesign-web-components 使用同名的 --td-brand-color 等 CSS 变量，是查到的唯一一套「Web 与微信小程序变量同名」的大厂组件生态；Vant Weapp 最近发布为 2024-10-14**
  来源：https://registry.npmjs.org/tdesign-miniprogram（latest 1.16.1，license MIT，time 2026-09-09）；npm 包内 miniprogram_dist/*/…wxss（如 check-tag.wxss、dropdown-menu.wxss 使用 --td-brand-color、--td-brand-color-1～10）；https://registry.npmjs.org/@vant/weapp（latest 1.11.7，time 2024-10-14）
  含义：如果部门未来要「一份 tokens.json 同时喂 Web 与小程序」，TDesign 体系天然是同一套变量名（--td-*），只需生成一份 CSS 与一份 WXSS。但 TDesign Web Components 当前组件缺口（无表格、无表单、无抽屉）使它更适合做备选或与 Web Awesome 混用于小程序侧。
- **[官方事实] Semi Design 没有 Web Components 版本：npm 上不存在 @douyinfe/semi-webcomponents；官方「Web components 适配」文档讲的是「把 Semi 的 React 组件放进别人的 Shadow DOM 里用」，需要 Semi ≥ 2.59.0 并配合 webpack／rspack 插件把样式注入 shadow root，仍然是 React 组件**
  来源：https://registry.npmjs.org/@douyinfe/semi-webcomponents（Not found）；https://raw.githubusercontent.com/DouyinFE/semi-design/main/content/ecosystem/web-components/index.md（「Semi UI 已经做了适配改造……建议你升级到 v2.59.0 版本及以上」，示例用 @douyinfe/semi-webpack-plugin 的 webComponentPath 与 importSemiComponentStyle 后 ReactDOM.render）；上一轮记录 /home/user/desgin/specs/salesbuddy/依据/外部查证-20260919/02-SemiDesign与飞书.md（FAQ：「是否有官方提供其他技术栈 lib 的计划？暂无计划」「目前，我们实现了 Adapter 的 React 版本」）
  结论：想用 Semi 就必须引入 React；「无框架＋Semi」不存在。semi.design 官网本次被拦截，GitHub API 列 packages 目录被限制，但上述文档均来自官方仓库源文件。
- **[官方事实] Semi UI 2.103.0（2026-09-01 发布，MIT）可通过 UMD 直接在浏览器用（全局变量 SemiUI，须先引入 react 与 react-dom），但官方明确「并不推荐直接使用已构建文件」；UMD 压缩包 3.47 MB，全量 CSS 683 KB；React 19 需改用 @douyinfe/semi-ui-19**
  来源：https://registry.npmjs.org/@douyinfe/semi-ui（latest 2.103.0，license MIT，peer react ≥16）；npm 包内 dist/umd/semi-ui.min.js（3,466,671 字节，UMD 头部 exports.SemiUI）与 dist/css/semi.min.css（683,477 字节）；https://raw.githubusercontent.com/DouyinFE/semi-design/main/content/start/getting-started/index.md 第 143～165 行（「5、UMD 方式使用组件……我们并不推荐直接使用已构建文件」「请确保你已提前引入 react 以及 react-dom」）与第 16～18 行（React v19 请使用 @douyinfe/semi-ui-19）；https://registry.npmjs.org/@douyinfe/semi-ui-19（latest 2.103.0，peer react ^19）；https://raw.githubusercontent.com/DouyinFE/semi-design/main/LICENSE（MIT）
  含义：路线 B 有两种成本形态——（1）无构建：React 18 UMD＋Semi UMD，两行 script，但包体大且官方不推荐；（2）有构建：Vite＋按需引入，包体小、可用主题插件，但要给现有无框架站点新增 Node 构建链。
- **[官方事实] Semi 的全局样式侵入很小：semi.min.css 里针对裸元素的规则只有 body／:host 的字体栈、-webkit-font-smoothing 与 CSS 变量声明，以及 img[src=""],img:not([src]){opacity:0}；没有全局 reset（官方另行建议自行引入 reset-css）**
  来源：npm 包 @douyinfe/semi-ui@2.103.0 内 dist/css/semi.min.css（脚本扫描：裸选择器仅 6 条，全部为 body/:host 变体与 img 规则，无 body{color…} 之类布局规则）；https://raw.githubusercontent.com/DouyinFE/semi-design/main/content/start/getting-started/index.md 第 51 行（「推荐在项目中引入 reset.css」）；https://raw.githubusercontent.com/DouyinFE/semi-design/main/packages/semi-theme-default/scss/global.scss 第 3～4、146～147 行
  对岛屿式的含义：把 semi.min.css 挂到现有页面，除了 body 字体会变成 Semi 的字体栈（Inter → PingFang SC → Microsoft YaHei，与本部门 --ui-font 基本重合）和空 src 图片被隐藏外，不会改动现有页面外观；Semi 的 CSS 变量挂在 body 上（暗色用 body[theme-mode=dark]），岛屿内组件自然能读到。
- **[官方事实] Semi 弹层（Select、Tooltip、Modal 等）默认渲染到 document.body，可用 getPopupContainer 指定容器；主题 prefixCls／cssLayer／omitCss 等属于编译期能力，必须用 Semi 的 webpack／rspack／vite 插件**
  来源：https://raw.githubusercontent.com/DouyinFE/semi-design/main/content/other/configprovider/index.md 第 515 行（getPopupContainer 默认 () => document.body）；https://raw.githubusercontent.com/DouyinFE/semi-design/main/content/input/select/index.md 第 1425 行；https://raw.githubusercontent.com/DouyinFE/semi-design/main/content/advanced/customize-theme/index.md 第 107～116、204 行（prefixCls、cssLayer: true、omitCss: true）；https://raw.githubusercontent.com/DouyinFE/semi-design/main/content/advanced/dark-mode/index.md 第 22～40 行
  对岛屿式的含义：岛屿里打开的下拉、弹窗会挂到 body，不受岛屿容器的 overflow／z-index 限制，这是好事；但现有页面若有自建的 popover 层（select-components.js 用了 popover=manual 的对话框），需要核对 z-index（Semi 的 $z-modal 1000、$z-dropdown 1050、$z-tooltip 1060，见上一轮记录）。UMD 方式下无法改 .semi- 类名前缀，只要现有 CSS 不用 .semi- 前缀就不会冲突。
- **[官方事实] 「岛屿式」局部挂载 React 是 React 官方文档明确支持并推荐的做法：可对同一页面多次调用 createRoot，每个顶层 UI 块一个 root；官方称这是「最常见的集成方式，Meta 多年来就是这样用 React 的」**
  来源：https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/reference/react-dom/client/createRoot.md 第 224～226 行（「Rendering a page partially built with React … you can call createRoot multiple times to create a root for each top-level piece of UI managed by React」）；https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/learn/add-react-to-an-existing-project.md「Using React for a part of your existing page」一节（「That's a common way to integrate React--in fact, it's how most React usage looked at Meta for many years!」；Step 1 要求建立模块化 JS 环境，无现成构建时建议用 Vite）
  官方同时提示：多个 root 共存时可用 identifierPrefix 避免 useId 冲突；并建议「从小的交互组件开始，逐步向上迁移，若最终整页都是 React 再换框架」——这正是 A→B→C 的渐进路径依据。
- **[官方事实] React 19 起官方不再提供 UMD 构建，无构建场景官方建议改用 esm.sh 之类 ESM CDN；React 18.3.1 仍带 umd/ 目录**
  来源：https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/blog/2024/04/25/react-19-upgrade-guide.md 第 552～564 行（「UMD builds removed … Starting with React 19, React will no longer produce UMD builds」）；npm 包 react-dom@18.3.1 内 umd/react-dom.production.min.js 存在；npm 包 react-dom@19.3.0 内无 umd/ 目录（https://registry.npmjs.org/react-dom）
  对路线 B 的含义：若坚持不建构建链，只能用 React 18 UMD＋@douyinfe/semi-ui（peer react ≥16）；若用 React 19 则必须有构建或 ESM CDN，且要换 @douyinfe/semi-ui-19。本会话 esm.sh、unpkg、jsdelivr 均被拦截，生产环境是否可达需另行确认。
- **[推论] 「飞书主题」在开源世界的真实形态：Semi DSM（Semi 的可视化主题工具）生成并由 semi-bot 自动发布到 npm 的主题包，例如 @semi-bot/semi-theme-feishu 1.0.0（2022-11-15）主色 --semi-blue-5: 51,112,255（#3370FF）、@semi-bot/semi-theme-feishu-dashboard 1.0.4（2024-05-21）；它们是否由飞书官方团队发布未能核实**
  来源：https://registry.npmjs.org/-/v1/search?text=semi-theme%20feishu；https://registry.npmjs.org/@semi-bot/semi-theme-feishu（maintainers: semi-bot，description「Semi theme generated by dsm」）；npm 包 @semi-bot/semi-theme-feishu@1.0.0 内 scss/_palette.scss 与 semi.min.css（--semi-blue-5: 51,112,255）；上一轮记录 02-SemiDesign与飞书.md（DSM 主题商店「查看 Semi 在抖音、剪映、飞书、火山引擎……官方示例主题」——DSM 站点被拦截未能打开）
  这说明「要飞书感」的可操作路径就是「Semi 组件＋一份 DSM 主题包」；部门只需在 DSM 里把主色改成 #2863CD 生成自己的主题包，即满足「最多微调」。飞书本身没有开源组件库（open.feishu.cn、feishu.cn 均被拦截，npm 搜索 feishu design／lark design／universe-design 无官方组件包）。
- **[官方事实] Semi 官方明确没有移动端与小程序版本，且暂无其他技术栈（Vue／Web Components）计划；Semi 的字号、间距只有 Sass 变量、不输出 CSS 变量**
  来源：上一轮官方仓库查证记录 /home/user/desgin/specs/salesbuddy/依据/外部查证-20260919/02-SemiDesign与飞书.md（引用 content/ecosystem/faq/index.md 第 15～16、23～26 行、discussions #287、packages/semi-theme-default/README.md 第 27～30 行、variables.scss）
  对「形成自己的一套、未来直接调用」的含义：Semi 只能覆盖桌面 Web；小程序侧必须另选（TDesign 小程序版或原生），共享的只能是 tokens.json 生成的变量与规则，不是组件代码。
- **[仓库证据] 现有 vendor 依赖许可均为宽松开源：tom-select 2.6.2（Apache-2.0）、flatpickr 4.6.13（MIT）、echarts 6.1.0（Apache-2.0）；候选库 Web Awesome、TDesign WC、Semi、React 均为 MIT，无许可障碍**
  来源：/home/user/desgin/specs/salesbuddy/1.0.0-使用包快照/示例册/assets/vendor/*/SOURCE.json 与 LICENSE；https://registry.npmjs.org/{@awesome.me/webawesome,tdesign-web-components,@douyinfe/semi-ui,react,react-dom} 的 license 字段
  唯一需注意：Web Awesome 的 Data Grid、Date Picker 属于商业 Pro 包，若将来要用需采购；免费版 MIT 部分可自由用于内部产品。
- **[推论] 路线 A（无框架＋Web Components）的代价最低：在现有页面加两行标签即可，主题只写一份变量映射；缺口（表格、日期）用现有原生 table 规则与 flatpickr 补**
  来源：综合上述 Web Awesome installation.md／tokens/color.md、TDesign README、示例册 index.html 引入方式、规则 C-01～C-07（/home/user/desgin/specs/salesbuddy/1.0.0-使用包快照/依据/Web设计规范.md 第 68～74 行）
  预估（未实测）：改 1 个页面 1～2 天，出「客户列表→详情」样板 1～2 周；不需要新增人力技能；风险是 Web Components 的 ::part 定制方式团队要学一次，以及 Web Awesome 文档只有英文。
- **[推论] 路线 B（岛屿式 React＋Semi）可行但要付「构建链＋两套组件并存」的代价：需引入 Vite（或退回 React 18 UMD），Semi 包体大，岛屿内外组件风格需靠同一份 tokens 对齐**
  来源：综合 React createRoot／add-react-to-an-existing-project 文档、React 19 UMD 移除、Semi getting-started UMD 段、semi.min.css 全局规则扫描、Web交互重构建议.md「实现上为这两个模块建立独立 Web 页面与组件」
  预估（未实测）：搭建 Vite＋React＋Semi＋DSM 主题包 1 周，首个岛屿（任务工作台右侧详情面板）1～2 周；需要 1 名会 React 的开发；收益是拿到表格、表单校验、SideSheet 等 Semi 成熟组件与「飞书感」。
- **[推论] 路线 C（整站 React 重写）等价于放弃「从小程序源码生成 Web」的现有工程，是 Web交互重构建议已经指出的最终方向之一，但当前 Web 工程不在仓库、无法评估存量，投入数月且期间无可交付物**
  来源：/home/user/desgin/specs/salesbuddy/1.0.0-使用包快照/依据/Web交互重构建议.md（「避免继续依赖把小程序长页面缩小、加宽或不断叠 CSS 来承载桌面工作流」「本轮尚未决定更换技术栈」）；/home/user/desgin/specs/salesbuddy/采用登记表.md（sales-web「工程不在本仓库」）
  React 官方也建议「从局部开始向上迁移，整页都是 React 时再换框架」，因此 C 应作为 B 验证成功后的自然结果，而不是现在的决策。
- **[未能核实] 各官网与主流 CDN 本次均被代理拦截（403）：shoelace.style、webawesome.com、semi.design、tdesign.tencent.com、ant.design、arco.design、vant-ui.github.io、cdn.jsdelivr.net、unpkg.com、esm.sh、github.com 页面、api.github.com（会话未授权）；可用的只有 raw.githubusercontent.com 与 registry.npmjs.org**
  来源：curl 探测结果（curl -sS -o /dev/null -w %{http_code}）与 /root/.ccr/README.md 的「403/407 不得绕过」要求；$HTTPS_PROXY/__agentproxy/status 记录 tdesign.tencent.com、weui.io、developers.weixin.qq.com 的 connect_rejected
  因此：Web Awesome 官网文档以随 npm 包发布的 dist/skills 与 dist/llms.txt 为准；TDesign Web Components 官网「getting-started」与 CDN 用法未能核实；Semi DSM 站点与「飞书 Universe Design 主题」是否官方未能核实；生产环境能否访问 jsdelivr／ka-f.webawesome.com／esm.sh 需由能上网的同事复核后再定 CDN 还是自托管。

## recommendations

- 现在拍板路线 A：Web 端保持无框架，引入 Web Awesome（@awesome.me/webawesome 3.x，MIT），不要选已停更的 Shoelace；先用它替换 C-01 按钮、C-02 输入与校验、C-03 单选／多选选择器、C-06 反馈（toast／callout／skeleton）、C-07 弹窗与抽屉；C-04 筛选栏与 C-05 列表表格继续用原生元素＋现行规范 CSS，日期继续用 flatpickr（Web Awesome 免费版无表格与日期选择器）。
- 把「部门自己的一套」定义为一个内部 npm 包（例如 @dept/ui-tokens）：只放 tokens.json 生成的 --ui-* 变量，以及三份映射文件 ui-to-wa.css（--wa-color-brand-* 十档色阶由 #2863CD 派生）、ui-to-td.css／.wxss（--td-brand-color*）、ui-to-semi（DSM 主题包）。组件全部来自上游，不自研；升级只改映射，不碰组件源码。
- 不引入 Web Awesome 的 native.css（全局重置），只引 themes/default.css＋loader，必要时加 utilities.css；这样现有 26 个业务页面的外观不受影响，可逐页替换控件。
- 生产环境 CDN 可达性先复核：jsdelivr、ka-f.webawesome.com、esm.sh 在本会话均被拦截；若公司网络同样受限，直接用 npm 包内 dist-cdn/ 自托管到现有静态目录（assets/vendor/webawesome-3.x），与现有 tom-select／flatpickr 同一管理方式并写 SOURCE.json。
- 授权一个路线 B 样板（不整站）：在「任务工作台」右侧详情面板用 Vite＋React 18（或 19＋semi-ui-19）＋Semi，通过 createRoot 挂到现有页面的一个容器；用 Semi DSM 以主色 #2863CD 生成部门主题包；样板要测量：首屏 JS 体积、与现有 popover／z-index 的冲突、返回列表是否保留筛选与位置。样板通过再决定是否扩大 B 的范围。
- 不做路线 C，直到满足两个条件：sales-web 工程进入部门仓库可评估存量；第一批模块（客户列表→详情、任务工作台）按 A 或 B 完成验收。届时若岛屿已覆盖多数页面，再按 React 官方建议整体迁移到 React 框架。
- 小程序侧另行决策：若要与 Web 共享变量名，优先评估 tdesign-miniprogram（MIT，2026-09 仍在更新，--td-brand-color 与 Web 版同名）；Semi 与 Web Awesome 都没有小程序版本。小程序当前未启用 npm 构建，需先在 project.config.json 打开 npm 支持，这属于改真实业务工程，需单独授权。
- 由能上网的同事复核并登记日期：webawesome.com/docs/theming 的品牌色自定义说明、tdesign.tencent.com/webcomponents 的 getting-started 与 CDN 写法、semi.design/dsm 主题商店里飞书主题是否为官方发布；复核前本报告中相关条目保持「未能核实」。
