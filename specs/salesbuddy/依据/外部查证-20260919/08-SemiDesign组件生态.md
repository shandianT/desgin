# Semi Design（飞书／字节跳动）作为 Web 组件生态的可用性查证

> 查证日期 2026-09-19。官网（semi.design、tdesign.tencent.com、weui.io、vant、ant.design、arco.design、webawesome.com 等）与 GitHub 网页／API 在本会话均被代理拦截；本文全部事实来自 raw.githubusercontent.com 的官方仓库源文件、registry.npmjs.org 元数据与实际下载的 npm 发布包。「官方事实」= 官方仓库文档或元数据原文；「仓库证据」= 读源码得到；「推论」= 由前两者推出；「未能核实」= 只在官网或不可达资源上有。由 AI 查证，待有网络的同事按来源复核。

查证结论：结论：Semi Design 可以承担我们的 Web 端组件生态，但前提是 sales-web 必须接入 React（Semi 官方只有 React 实现，无 Vue／Web Components 组件／移动端／小程序版本，官方 FAQ 明确「暂无计划」）。主题机制对我们非常友好：全部颜色都走 CSS 变量（CSS 变量：浏览器原生支持的「--名字: 值」运行时变量，不用编译即可覆盖），主色 #2863CD 只需在 body 上覆盖 10 级 `--semi-blue-0～9`（浅色＋深色各一套）即可让 128 处 primary 引用、info／link／focus 边框全部跟着换；不必用 Sass 编译，也不必依赖被代理拦截的 DSM 站点。但主色派生 10 级色板的算法在开源仓库里不存在（仓库里只有静态色值表），要么自己按 tokens.json 生成 10 级，要么走 DSM 在线生成。组件级 Sass 变量（如 `$color-button_primary-bg-default`）编译后不保留，不能在运行时覆盖，只能通过 semi-webpack／vite 插件在构建期覆盖，或者用 CSS 类名覆盖；不过绝大多数组件级变量本身只是引用全局 CSS 变量，换主色不需要碰它们。UMD 构建存在（dist/umd/semi-ui.min.js，gzip 约 920KB；semi.min.css gzip 约 78KB），可 <script> 引入并依赖全局 React／ReactDOM ≥16，React 19 需改用 @douyinfe/semi-ui-19 或引入 react19-adapter。许可证 MIT。七类组件在 Semi 里全部有对应，且 loading／disabled／validateStatus／empty 等状态覆盖完整。官网 semi.design、unpkg、jsdelivr 均被代理拦截，本次全部依据 GitHub 仓库源码（shallow clone）、npm registry 元数据与实际下载的 2.103.0 tarball 核实；GitHub issues 311／56／discussions 287 的正文因会话权限限制未能读取。

## findings

- **[官方事实] 官方只提供 React 实现；Vue、Angular、Svelte、Web Components 版本均无官方计划**
  来源：仓库 content/ecosystem/faq/index.md 第 12～16 行；content/start/introduction/index.md 第 63、75、108 行（raw.githubusercontent.com/DouyinFE/semi-design/main/…）
  FAQ 原文：「Semi 目前提供了基于 React 版本的 ui library，是否有官方提供其他技术栈 lib 的计划？——暂无计划。具体原因：Issue 311，更多讨论 Issue 56」。介绍页说明其 F/A 分层（Foundation／Adapter：把组件逻辑与框架绑定层拆开，理论上可给 Vue 等写适配层）「目前，我们实现了 Adapter 的 React 版本」，并称「当前阶段重点会聚焦于 React 体系内，但 WebComponent 也是我们重点关注的方向之一。未来时机合适，我们会进行更多的尝试」。
- **[官方事实] 无移动端组件、无小程序版本；「Web components 适配」只是让 React 组件能在 shadow DOM 里运行，不是提供 Web Components 组件**
  来源：content/ecosystem/faq/index.md 第 15～16 行；content/ecosystem/web-components/index.md；README-zh_CN.md 第 57 行
  FAQ：「Semi 后续会提供移动端组件吗？——暂无计划，具体原因参考 discussions 287」。web-components 文档的内容是：Semi ≥ v2.59.0 通过 semi-webpack-plugin／semi-rspack-plugin 的 webComponentPath 参数把样式注入 shadow DOM（shadow DOM：浏览器插件等场景用的样式隔离容器），解决 CSS 变量挂在 body 上在 shadow DOM 内失效的问题；使用者仍然是 React 组件。整个仓库没有任何小程序（WXSS／rpx）产物，小程序端与 Semi 无关。
- **[未能核实] Issue 311、Issue 56、discussions 287 的正文未能读取**
  来源：github.com／api.github.com 对 DouyinFE/semi-design 返回 403「GitHub access to this repository is not enabled for this session」；GitHub MCP 工具同样报 Access denied（仅允许 shandiant/xiaoshouguanli、shandiant/desgin）
  只能引用 FAQ 中的结论性文字「暂无计划」，官方给出的具体理由无法转述。
- **[仓库证据] 全局 CSS 变量清单在 packages/semi-theme-default/scss/global.scss；色板在 _palette.scss，均以 body 选择器声明，编译后原样保留为 CSS 变量**
  来源：packages/semi-theme-default/scss/global.scss 第 3～15 行、第 146～157 行；packages/semi-theme-default/scss/_palette.scss 第 1～22 行、第 240 行、第 291～300 行；已下载 semi-ui-2.103.0.tgz 内 dist/css/semi.css 第 4 行、第 21 行、第 285 行
  浅色选择器：`body, body .semi-always-light, :host, :host .semi-always-light`；深色选择器：`body[theme-mode="dark"], body .semi-always-dark, :host([theme-mode="dark"]), :host .semi-always-dark`。色板变量是 RGB 三元组，如 `--semi-blue-5: 0,100,250`，语义变量再包一层：`--semi-color-primary: rgba(var(--semi-blue-5), 1)`。深色模式下 blue 色板反向（blue-0 最深，blue-9 最浅），且 `--semi-color-primary-light-*` 改为 `rgba(var(--semi-blue-5), .2/.3/.4)`。
- **[仓库证据] 主色相关语义变量共 19 个，全部指向 --semi-blue-0～7；换主色最省事的做法是覆盖 10 个 --semi-blue-N 三元组（浅色一套、深色一套），而不是只改 6～8 个 primary 变量**
  来源：global.scss 第 1～150 行内 grep「semi-blue」得 19 处；dist/css/semi.css 中 `var(--semi-color-primary*)` 共 271 处引用（primary 128、light-default 43、disabled 30、light-active 27、hover 22、active 20、light-hover 1）
  19 个语义变量：--semi-color-primary／-hover／-active／-disabled／-light-default／-light-hover／-light-active（7 个）、--semi-color-info 同样 7 个、--semi-color-focus-border、--semi-color-link／-hover／-active／-visited（4 个）。若只覆盖 7 个 primary 变量，Input 聚焦边框（focus-border）、链接色、info 色仍是 Semi 蓝 #0064FA，会出现两种蓝。覆盖 `--semi-blue-0～9` 后这 19 个自动跟随。此外编译后 CSS 中另有 68 处直接引用 `var(--semi-blue-N)`，分布在 .semi-carousel 29、.semi-json 6、.semi-tag 5（仅 color="blue" 的 Tag）、.semi-ai 4、.semi-avatar 1、.semi-audio 1，覆盖色板后同样跟随，无需单独处理。
- **[仓库证据] 主色派生 10 级色板的算法未开源；仓库内只有静态色值表**
  来源：content/advanced/customize-theme/index.md「选取主色后，我们的颜色算法会为你生成一套高可用的色盘」；content/basic/tokens/index.md 第 26、245 行；src/components/palette.js（522 行静态对象）；src/components/FullPalette/index.jsx 仅引入 chroma-js 与 wcag-color 做对比度评分展示
  生成算法只存在于 semi.design/dsm（DSM：Semi 的在线设计系统管理站，产出 npm 主题包，需公司网络可达）。DSM 站点本次被代理拦截未能访问。可行替代：a) 用部门 tokens.json 已有的 #2863CD 派生梯度（例如以 chroma-js／culori 在 OKLCH 空间做 10 级插值）后直接写 20 个 CSS 变量；b) 让能上网的同事在 DSM 生成主题包后仅摘取 _palette 部分。issue #2143 标题「semi.design/dsm 暗黑模式主题主色永远都是手动计算的」提示 DSM 深色色板需人工校核（正文未能读取）。
- **[仓库证据] 组件级 Sass 变量（$color-button_primary-bg-default 等）编译后不保留，不能在运行时覆盖；但它们的默认值几乎都是全局 CSS 变量的引用**
  来源：packages/semi-foundation/button/variables.scss 第 1～15 行；packages/semi-foundation/button/button.scss 第 192 行；dist/css/semi.css 第 3564～3569 行
  variables.scss：`$color-button_primary-bg-default: var(--semi-color-primary);`，编译产物：`.semi-button-primary { background-color: var(--semi-color-primary); color: rgba(var(--semi-white), 1); … }`。即 Sass 变量在编译期被内联，运行时只剩 CSS 变量。因此：换主色／换灰阶只覆盖 CSS 变量即可；要改「按钮高度、圆角、间距」这类组件级 token，则必须走 @douyinfe/semi-webpack-plugin 或 @douyinfe/semi-vite-plugin 的 include（本地 scss）／variables（键值对）／theme（DSM npm 包）三种构建期方式（文档 content/advanced/customize-theme/index.md「优先级由低到高」），或者直接用 CSS 类名覆盖 `.semi-button` 等选择器。foundation 内直接写死 `--semi-blue-*` 的组件 scss 只有 jsonViewer、aiChatDialogue、carousel、audioPlayer、aiChatInput 5 个，均与我们无关。
- **[仓库证据] @douyinfe/semi-scss-compile 可在本地把 semi-foundation + 自定义 theme 编译成完整 semi.css，是不依赖 DSM 站点的离线主题产出方案**
  来源：packages/semi-scss-compile/README.md；registry.npmjs.org/@douyinfe/semi-scss-compile/latest（2.103.0，依赖 sass）
  命令行：`semi-build-scss -f <foundation> -t <theme> -i <semi-icons> -o output.css -m`。README 说明它正是 DSM 服务端发布主题时使用的脚本。我们可以把 semi-theme-default 拷贝一份、改 _palette.scss 与 global.scss，编译出「部门版 semi.css」，以静态文件形式随 UMD 一起引入。
- **[仓库证据] UMD 构建存在：dist/umd/semi-ui.min.js（3.47MB，gzip 942KB）、dist/css/semi.min.css（683KB，gzip 78KB）、semi-icons UMD（gzip 67KB）；全局变量 SemiUI／SemiIcons，React 与 ReactDOM 为外部依赖**
  来源：已下载 registry.npmjs.org/@douyinfe/semi-ui/-/semi-ui-2.103.0.tgz 解包结果；packages/semi-ui/webpack.config.js 第 19～24 行（library: 'SemiUI', libraryTarget: 'umd'）；content/start/getting-started/index.md 第 143～181 行「5、UMD 方式使用组件」
  UMD 头部：`e.SemiUI=t(e.React,e.ReactDOM)`，即 <script> 引入前必须先引 react 与 react-dom 的 UMD。官方文档给出的 CDN 路径：`https://unpkg.com/@douyinfe/semi-ui@<版本>/dist/umd/semi-ui.min.js`、`/dist/css/semi.css`、`https://unpkg.com/@douyinfe/semi-icons@latest/dist/umd/semi-icons.min.js`、`/dist/css/semi-icons.css`；jsdelivr 同路径 `https://cdn.jsdelivr.net/npm/@douyinfe/semi-ui@2.103.0/dist/umd/semi-ui.min.js`（本次 unpkg 与 jsdelivr 均被代理拦截，未能实际下载，路径按 npm 包内结构推断）。注意 UMD 是全量包（84 个组件目录，含 tiptap 富文本、json viewer、AI 对话等），gzip 近 1MB，不做 tree shaking（按需打包）；若走 npm + 打包器则天然按需（FAQ 第 42～44 行）。package.json 未声明 unpkg／jsdelivr 字段，主入口 lib/cjs/index.js，ESM 入口 lib/es/index.js。
- **[官方事实] React 版本要求：peerDependencies react ≥16.0.0、react-dom ≥16.0.0；React 19 需引入 @douyinfe/semi-ui/react19-adapter 或改用 @douyinfe/semi-ui-19（peer ^19.0.0）**
  来源：registry.npmjs.org/@douyinfe/semi-ui/latest（2.103.0）；registry.npmjs.org/@douyinfe/semi-ui-19/latest（2.103.0）；packages/semi-ui/react19-adapter.ts；content/ecosystem/react19/index.md；content/start/getting-started/index.md 第 11、17 行
  React 19 移除了 ReactDOM.render 与 findDOMNode，影响 Modal.confirm／Toast／Notification 的命令式调用与 Tooltip 系弹层，adapter 通过注入 createRoot 解决，必须在入口最顶部 `import '@douyinfe/semi-ui/react19-adapter'`。浏览器要求：依赖 CSS variable，最低 Edge，不支持 IE11（introduction 第 118 行）。
- **[官方事实] 许可证 MIT（版权 2021 DouyinFE）**
  来源：仓库根 LICENSE；npm 元数据 license 字段（semi-ui、semi-theme-default、semi-foundation、semi-icons、semi-webpack-plugin 均为 MIT）
  可商用、可修改、可再分发，只需保留版权声明；企业内部二次封装成部门组件包无许可障碍。
- **[官方事实] C-01 按钮 → Button／IconButton：状态覆盖 type、theme、size、disabled、loading、block、icon、警示（type=warning／danger）**
  来源：content/basic/button/index.md（关键词计数：type 81、theme 65、icon 36、disabled 21、loading 14、size 10、block 4）
  type 有 primary／secondary／tertiary／warning／danger；theme 有 solid／light／borderless／outline；loading 内置 Spin 图标。
- **[官方事实] C-02 输入与校验 → Input／TextArea／InputNumber + Form：Input 有 disabled、showClear、size、prefix／suffix／addonBefore、validateStatus（default／error／warning，仅影响样式）；Form 有 rules、trigger、validate、helpText／extraText、labelPosition、validateStatus（success／error／warning／default）**
  来源：content/input/input/index.md 第 545～562 行；content/input/form/index.md 第 2184～2205、2244、2399、2517～2518 行
  Form 基于 async-validator 做规则校验（npm dependencies 中含 async-validator ^3.5.0），支持同步／异步校验，v2.94.0 后支持静默校验 `formApi.validate({ silent: true })`，可用于「拜访确认 16 项必填」这类归档前校验。
- **[官方事实] C-03 选择器 → Select／Cascader／DatePicker／TimePicker／TreeSelect：Select 有 loading、disabled、filter、multiple、remote、emptyContent、showClear、validateStatus（warning／error／default）；Cascader 有 loading、disabled、multiple、filterTreeNode、emptyContent、showClear、validateStatus；DatePicker 有 type、disabled、disabledDate、disabledTime、format、multiple、showClear、validateStatus**
  来源：content/input/select/index.md 第 1415～1458 行；content/input/cascader/index.md 第 2050～2093 行；content/input/datepicker/index.md 第 833～877 行
  可替换 sales-web 现用的 tom-select（Select）与 flatpickr（DatePicker），且带远程搜索（remote）与虚拟滚动。
- **[官方事实] C-04 筛选栏 → Tag／TagGroup + CheckboxGroup（type=card／pureCard）+ RadioGroup（button 型）：Tag 有 closable、color（16 色）、size、shape、avatarSrc、colorful；Checkbox 有 type=default／card／pureCard、disabled、direction**
  来源：content/show/tag/index.md 第 440～449 行；content/input/checkbox/index.md 第 367～383 行
  Semi 没有单独的「可选中 Tag」组件，筛选芯片需用 CheckboxGroup type="pureCard" 或 RadioGroup type="button"（可自行确认样式）；Tag 组件 color="blue" 直接引用 --semi-blue-*，覆盖色板后自动跟主色。
- **[官方事实] C-05 列表与表格 → Table／List：Table 有 loading、empty、pagination、rowSelection、resizable、virtualized、expandedRowRender、filters、sticky；List 有 loading、emptyContent、grid、layout、header／footer、dataSource／renderItem**
  来源：content/show/table/index.md 第 5903～5926 行；content/show/list/index.md 第 1199～1204 行（loading 关键词 14 处）
  Table 依赖 react-window 做虚拟化（npm dependencies）；List 文档含 Skeleton 组合示例（skeleton 关键词 6 处）。
- **[官方事实] C-06 数据与反馈状态 → Spin／Empty／Skeleton／Banner／Toast：Spin 有 spinning、size、delay、tip、indicator；Empty 有 image、darkModeImage、title、description、layout；Skeleton 有 loading、placeholder、active；Banner 有 type、icon、closeIcon、fullMode、bordered、description、onClose；Toast 有 type、content、duration、showClose、stack、theme、zIndex**
  来源：content/feedback/spin/index.md 第 129～135 行；content/show/empty/index.md 第 188～194 行；content/feedback/skeleton/index.md 第 369～372 行；content/feedback/banner/index.md 第 182～188 行；content/feedback/toast/index.md 第 389～409 行
  Empty 的插画来自 @douyinfe/semi-illustrations（另有 UMD）；Toast 为命令式 API（Toast.success 等），React 19 下必须先加载 adapter。
- **[官方事实] C-07 弹窗与展开 → Modal／SideSheet／Collapse：Modal 有 visible、confirmLoading、closable、maskClosable、closeOnEsc、footer、centered、size、fullScreen；SideSheet 有 visible、placement（top／bottom／left／right）、size、footer、maskClosable、closable、closeOnEsc、disableScroll；Collapse 有 accordion、activeKey／defaultActiveKey、expandIcon／expandIconPosition、keepDOM**
  来源：content/show/modal/index.md 第 570～578 行；content/show/sidesheet/index.md 第 308～321 行；content/show/collapse/index.md 第 175～183 行
  Collapse.Panel 支持 disabled（关键词 5 处）。
- **[仓库证据] sales-web 当前无 React、无打包器；产品仓库内没有任何 package.json**
  来源：/home/user/xiaoshouguanli/frontend（仅 miniprogram、legacy-wechat-cloud-sample、PRD）；find … -name package.json 无结果
  接入 Semi 意味着 Web 端必须引入 React 运行时（UMD 直引最轻，或新建 Vite/Rsbuild 工程），现有 tom-select／flatpickr 逐步替换；小程序端完全不受 Semi 影响，需另选原生小程序组件库。
- **[未能核实] 官网、DSM、unpkg、jsdelivr 均未能访问；主题商店与 DSM 的具体 token 数（文档称 2000+／3000+）未能核实**
  来源：semi.design、unpkg.com、cdn.jsdelivr.net 均返回 CONNECT 403（代理组织策略拦截）
  本报告所有版本号、文件路径、体积均取自 npm registry 与实际解包的 2.103.0 tarball，属一手数据；文档内容取自 GitHub main 分支 content/ 目录，与线上站点同源。

## recommendations

- Semi 可作为部门 Web 端组件生态，但必须先做「React 化」：sales-web 最小改造路径是 <script> 引入 react@18 + react-dom@18 UMD + semi-ui UMD + semi.css，用 React 岛（在现有页面局部挂载 React 组件）逐块替换 tom-select／flatpickr；中长期建议新建 Vite + React 18 工程并用 @douyinfe/semi-vite-plugin 做构建期主题。React 19 暂不建议（需 adapter 或 semi-ui-19，且命令式 Toast／Modal 有额外约束）。
- 换主色 #2863CD 的落地方式：不用 Sass、不依赖 DSM，直接在部门样式表里以 `body, body .semi-always-light, :host` 覆盖 `--semi-blue-0～9`（浅色 10 个）并以 `body[theme-mode="dark"], body .semi-always-dark` 覆盖深色 10 个；两套共 20 个 RGB 三元组。派生梯度由部门自己按 tokens.json 生成（建议 OKLCH 插值并做 WCAG 对比度校验），并把结果写回 desgin 仓库 specs/salesbuddy/tokens.json 作为唯一来源。
- 把「部门版主题」固化为可直接调用的产物：fork 一份 semi-theme-default 的 scss（改 _palette.scss 与 global.scss），用 @douyinfe/semi-scss-compile 编译出 salesbuddy-semi.css，与 semi-ui UMD 一起放到内网静态资源；如需改按钮高度／圆角等组件级 token，用 semi-webpack-plugin／vite-plugin 的 include 传本地 scss，不要直接改 Semi 源码。
- 七类组件映射直接采用：C-01 Button／IconButton；C-02 Input／TextArea／InputNumber + Form（Form.Input 等 Field 封装）；C-03 Select／Cascader／DatePicker／TimePicker／TreeSelect；C-04 Tag／TagGroup + CheckboxGroup(type=pureCard) + RadioGroup(type=button)；C-05 Table／List；C-06 Spin／Empty／Skeleton／Banner／Toast；C-07 Modal／SideSheet／Collapse。在 desgin 仓库 C-01～C-07 规则表里为每条规则加一列「Semi 对应组件与 prop」，形成部门自己的调用清单。
- 不要把 Semi 用在小程序端：Semi 无小程序版本，小程序需另选原生 WXSS 组件库（如 TDesign Miniprogram、Vant Weapp）并共用同一份 tokens.json，实现「同一变量、两套实现」。
- 采用 UMD 时锁定版本号（当前 2.103.0），不要用 @latest：FAQ 明确 minor 版本之间可能有样式调整；升级前用 changelog 的版本 Diff 检查。全量 UMD gzip 近 1MB，若性能敏感应尽早切到打包器按需引入。
- 待网络放开后补核三项：DSM 生成的 #2863CD 色板与我们自算结果的差异；Issue 311／56 与 discussions 287 的官方理由原文；unpkg／jsdelivr 实际可下载路径。
