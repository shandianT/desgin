# 部门小程序组件库

放在 tdesign-miniprogram 1.16.1 之上的组合件（0.9.0 起视觉以飞书为核心参考，见规范 16 章（飞书参照与小程序体验））、表单件、图表件与 AI 件（0.8.0 起含从小程序 1.0.8 改版回流的摘要卡、描述列表、区块卡片），与 Web 端 `packages/ui-react` 一一对应。基础控件（按钮、输入、选择器、日期、弹层、提示）直接用 `t-*`，主题只靠两个文件：

```
app.wxss 头两行：
@import "./design-tokens.wxss";      来自规范仓库 specs/salesbuddy/02-设计变量与同步链路/dist/
@import "./bridge-tdesign.wxss";     同上
```

## 组件

| 组件 | 做什么 | 属性与事件 | 规则 |
|---|---|---|---|
| sb-status-tag | 红黄绿灰状态标签，必带文字，可带依据 | tone、label、reason、showReason | B-01 |
| sb-state-panel | 加载中、空、失败可重试、无权限四态 | state、title、description、skeleton、showClear、retryLabel、clearLabel、retryNote（失败态按钮下的小字，默认「重试不会清除已选条件」，页面没有筛选条件时传空字符串）、size（default 或 compact 一行）；事件 retry、clear | C-06 |
| sb-filter-bar | 筛选栏：标题带范围、筛选片、已选数、结果数、清除 | title、scope、options、value、resultCount、resultLabel、disabled；事件 change | C-04 |
| sb-search | 搜索框，带清除、占位、加载中、禁用；无结果由四态面板表达 | value、placeholder、clearable、loading、disabled、maxlength、plain（不带白底与页边距）；事件 change、search、clear | C-02、C-04 |
| sb-list-row | 列表行：名称、摘要、状态、时间位置固定 | name、summary、tone、statusLabel、reason、time、selected、disabled、disabledReason；事件 tap | C-05 |
| sb-bottom-bar | 底部固定操作条，主次按钮等分（只有主按钮时撑满），含安全区；按钮上方一行说明或原因 | primaryLabel、loading、loadingLabel、disabled、disabledReason、inactive（看似禁用仍可点，primary 事件带 inactive:true，页面借此提示缺什么）、note、secondaryLabel、secondaryDisabled；事件 primary、secondary | C-01、X-05 |
| sb-field | 表单项：标签常显、必填星号、错误就地、只读态；控件放 slot | label、required、error、help、readOnly、value（只读时显示）、plain（放进表单白卡时用） | C-02 |
| sb-sheet | 底部弹层：标题、关闭、可选取消确定（两个按钮等分、底部安全区）；不替代页面级返回 | visible、title、closeOnOverlay、cancelLabel、confirmLabel、confirmLoading；slot 默认与 footer、description、secondaryLabel、confirmDisabled；slot header（固定在正文上方）；事件 secondary、scrolltolower；事件 close、confirm（关闭动画期间不发）；无按钮也留底部安全区 | C-07、X-03 |
| sb-pagination | 分页或加载更多，显示共 N 条，末页禁用 | current、total、pageSize、mode（page 或 more）、loading、end、summary（自定义左侧说明）、plain、error（显示失败与重试，发 retry）；事件 change、more | C-05 |
| sb-metric-tile | 指标卡：数字、说明、变化；缺失显示未登记，不显示 0 | value、label、note、missingText、bordered | B-03 |
| sb-page-header | 页面标题、范围名紧邻、主操作放 slot | title、scope | T-02、B-05 |
| sb-ai-badge | AI 标识，持续显示，含文字 | state（generating、pending、confirmed、advice：Agent 建议，仅供参考、不需逐条确认）、confirmedBy、text | A-02 |
| sb-ai-field | 待确认字段三态，低把握给候选，可恢复 AI 建议 | label、required、value、aiValue、state、confidence、candidates、error；事件 change、confirm、restore | A-01、A-03、A-04 |
| sb-ai-sources | AI 依据列表，默认折叠，每条可点；没有依据就不展示结论 | items、title、defaultExpanded；事件 tap（带 item） | A-03 |
| sb-ai-progress | 生成过程：阶段、百分比、可取消并保留已生成部分，失败可重试 | stages、current、status（running、cancelled、failed、done）、detail；事件 cancel、retry | A-09、A-07 |
| sb-tab-bar | 底部标签栏：t-tab-bar 薄壳，默认五个 Tab（总览、客户、商机、拜访、我的），不做跳转 | items、value、fixed、safeArea；事件 change（value、item） | T-01 |
| sb-date-picker | 日期选择：一行触发器加滚轮，值统一 'YYYY-MM-DD'，快捷片今天、本周、本季 | label、value、placeholder、start、end、disabled、required、shortcuts、mode（date 或 datetime，datetime 出 YYYY-MM-DD HH:mm）、defaultTime、layout、plain、title、error、help、clearable（shortcuts 可含 yesterday，按 start、end 过滤）；事件 change | C-02、C-03 |
| sb-select | 表单单选：一行触发器加单列滚轮；筛选栏用 sb-labeled-select | label、value、options、placeholder、disabled、required、layout（inline 或 stacked）、plain、title、error、help、defaultValue（未选时滚轮初始项）；事件 change（value、option） | C-02、C-03 |
| sb-amount-input | 金额输入：单位在右（默认万元），只收正数，失焦千分位、聚焦纯数字 | label、value、placeholder、unit、disabled、required、precision、layout、plain、valueType（number 或 string，string 全程字符串精确到 precision≤6）、maxlength；事件 change（number 或 null） | C-02、B-03 |
| sb-textarea | 多行文本：字数（默认 500）、自动增高 | label、value、placeholder、maxlength、disabled、required、layout、plain、minRows、maxRows（0 不限）、cursorSpacing、fixed（在 fixed 容器或弹层里必传）、focus、error、help；事件 change（每次输入） | C-02 |
| sb-input | 单行输入：t-input 壳，和 sb-textarea 同一套版式；stacked 标签在上加带框控件，清除、单位、错误与说明一行、密码可切换明文 | label、value、placeholder、type（text、number、digit、idcard、password）、maxlength、clearable、disabled、required、error、help、suffix、focus、confirmType、passwordVisible、showPassword（受控明文）、cursorSpacing、layout、plain；控件框 40px；事件 change（每次输入与清除）、confirm、focus、blur、visibility（visible） | C-02 |
| sb-segmented | 分段切换：自绘胶囊，选中白底加阴影与主色字；block 撑满等宽；点击高度 44px | options、value、size（small 只缩字号）、block、disabled（整组）、emitSame（点已选项也发）；事件 change | C-04、T-05 |
| sb-labeled-select | 带标签的下拉筛选：t-picker 选；size=small 为飞书筛选片（灰底无边框、选中浅蓝底主色字，未选只显示标签、选中只显示值；allOption=false 时默认第一项显示值但不算选中；点击区扩到 44px） | label、value、options[{value,label,count}]、placeholder、allowClear、disabled、size（default 或 small）、allOption、title、defaultValue（allOption=false 时的默认值，灰底）、useLabelSlot（slot label）；事件 change（value、option） | C-04 |
| sb-tabs | 带数量的下划线页签，超过 99 显示 99+，选中主色 2px 下划线；一页只一组 | items[{key,label,count,disabled}]、activeKey、size（small 14px）、plain（不画整行底线）、fit（按文字宽度分满一行，5 个及以上在窄于 360px 的屏上退回横滑）；页签点击高度 44px；事件 change（key） | C-05 |
| sb-battle-map | 作战地图：自绘四象限，点一律主色、只用大小表金额档（状态点开再看），重叠聚合，缺潜力的不画进格子，空态给下一步 | points、thresholds、zoom、selectedId、unrated、loading；事件 pointtap、clustertap、zoomchange、unratedtap、emptyaction | 12 章 §2 |
| sb-kpi-card | 指标卡：数字 32、单位小一号、变化只在有好坏时着色，缺失显示未登记；compact 为数字 20（超过 11 个字符自动 16） | label、value、unit、note、change、loading、missingText、size（default 或 compact）、bordered、tappable（可点时才有按下态）；事件 tap | 12 章 §3.1、B-03 |
| sb-chart-card | 图表卡片壳：标题、范围、口径 ⓘ，四态；图放默认 slot，图例放 legend slot | title、scope、caliber、state、emptyTitle、emptyDescription、summary；事件 retry、caliber | 12 章 §3.5、§4 |
| sb-timeline | 时间轴：跟进历史与业务动态，自绘竖线加圆点，圆点色只由 tone 决定；末尾可放「进行中」占位；空列表不画空轴 | items[{key,time,title,description,tone,actor,tappable}]、pending、reverse、size（default 或 compact）、loading、emptyText；事件 tap（item） | C-05、B-01 |
| sb-upload | 附件上传：t-upload 列表型薄壳，文件统一 {uid,name,size,status,url}；超类型、超大小、超数量就地红字说明不弹 toast | accept、maxSize（MB）、maxCount、multiple、value、disabled、hint、label、requestMethod；slot 无；事件 change（files、added）、remove（file、index） | C-02、C-06 |
| sb-result | 结果页：t-result 薄壳，整页反馈；图标色走语义变量；一个主按钮一个次按钮，extra slot 放补充内容 | status（success、error、info、warning）、title、description、primaryLabel、primaryLoading、primaryDisabled、secondaryLabel、secondaryDisabled；slot extra；事件 primary、secondary | C-01、C-06、B-01 |
| sb-avatar | 头像：t-avatar 薄壳，没有图片用姓名后两字（中文去姓、英文取前两个字母）；三档 48／64／80rpx；底色档默认主色淡底 | name、src、size（sm、md、lg）、tone（primary、neutral、success、warning、danger、sidebar）、shape（circle、square）；事件 tap | V-01、V-04 |
| sb-summary-card | 页面摘要卡：页面顶部白卡，替代深色横幅；标题、副标题、范围小标签、首字方块、状态标签、一行指标（竖线分隔，缺失写未登记）、进度条 | title、subtitle、meta、scope、mark、tags[{label,tone}]、metrics[{label,value,unit,missingText}]、metricsTappable、progress、progressLabel、size（default 或 small）、loading；slot 默认与 side、bordered（飞书样式默认无边框）；事件 metrictap（index、item） | T-02、B-03、14 章 |
| sb-desc-list | 描述列表：只读的「标签：值」清单；行式用 t-cell，两列式自绘；空值写未填写，必填空值写待补充（提醒色） | items[{key,label,value,required,missingText,tone,tappable}]、layout（row 或 grid）、title；事件 tap（key、index、item） | C-05、B-03 |
| sb-section | 区块卡片：白底一圈细线，标题 16px、说明 14px、右侧一个链接；plain 时只要标题行 | title、description、extraLabel、plain；slot 默认与 extra、bordered；事件 extra | 14 章 |

几处和 Web 端不同的地方：

- sb-field 只读态靠 `value` 属性显示文字，没有值时写「未填写」。小程序读不到 slot 里控件的值，Web 端可以。
- sb-sheet 传了 `confirmLabel` 才出现取消与确定两个按钮，`footer` slot 放在同一行左侧。关闭按钮与遮罩点击都发 close 事件，detail.trigger 说明来源。
- sb-pagination 多了 `mode="more"`，小程序列表更常用加载更多。
- sb-ai-progress 的百分比由 t-progress 自带的标签显示。失败时进度条变红，已取消变灰，完成时 t-progress 自己变绿。
- sb-tab-bar 只发 change，不调 wx.switchTab，页面拿 item.pagePath 自己跳。默认五个 Tab 的 pagePath 对照交付包 app.json：总览 pages/index/index、客户 pages/customers/index、商机 pages/workbench/index、我的 pages/profile/index；「拜访」在交付包里不是 Tab，先指到 pages/visit-entry/index。图标名先按 sb-icon 的含义名查，查不到当 t-icon 名。
- sb-date-picker 的快捷片：今天、本周指本周日、本季指本季最后一天；传 `shortcuts` 可换成 `[{ label, value }]`。t-date-time-picker 收到的 value 与发出的 value 都转成 'YYYY-MM-DD' 字符串。
- sb-select 的禁用项在滚轮里标「不可选」，确定时拒绝并 toast。
- 点击高度写 px 或 `var(--ui-touch-target)`，不写 88rpx（320 宽屏上只有 37.5px）。视觉小于 44px 的元素用 `::after` 以中线为准上下各 22px 扩区。
- t-button 内部 `catch:tap` 会吞掉原生点击：页面在按钮外包一层 view 扩点击区时，按钮本体与外层都绑同一方法（不会重复触发）。
- 工程 app.wxss 若写了 `button::after { border: 0; }`，会经 TDesign 的 apply-shared 清掉描边按钮的线型，补一行 `.t-button--outline::after { border-style: solid; }`。
- sb-amount-input 的 change 在输入中就发（值已解析为数字），失焦时再格式化一次；输入非法字符直接过滤。
- sb-battle-map 的聚合半径按 700rpx 宽的图折算成百分比：点之间距离小于约一个点直径聚成一个，超过 30 个点放宽半径默认聚合。点格子名用 wx.showToast 显示全称。象限底色用 `--ui-quadrant-asset/attack/resource/spot`，后面带同义回退值。
- sb-chart-card 只做壳：图区用 ec-canvas（echarts-for-weixin），主题文件用 tokens 包的 `bridge-echarts.theme.json`。
- sb-timeline 的条目要能点时传 `tappable: true`（Web 端是 onClick），tap 事件带 item。tdesign 小程序没有时间轴，这个是自绘。
- sb-upload 的 `status` 用 Web 端的 uploading／done／error，内部换成 t-upload 认的 loading／done／failed。accept 里有非图片类型时从聊天文件选（`source=messageFile`），只有图片时从相册选。不传 requestMethod 只维护本地列表，页面提交时再 wx.uploadFile；传了就是 t-upload 的 requestMethod。超限文件不进列表，说明写在列表下方，不弹 toast（所以不传 t-upload 的 sizeLimit）。
- sb-result 的按钮竖排撑满，Web 端是横排居中。extra 用具名 slot。
- sb-avatar 的方形对应 t-avatar 的 `shape=round`（圆角方形），圆角取 `--ui-radius-control`。取字规则和 Web 端 `avatarInitials` 一样：王小明 → 小明，李雷 → 李雷，zhangjt → ZH，空 → 我。

## 用了哪些 t-* 组件

| 组件 | 用到的 t-* 与属性 | 监听的事件 |
|---|---|---|
| sb-search | t-search：value、placeholder、clearable、disabled；t-loading 放 action slot | change、submit、clear |
| sb-sheet | t-popup：visible、placement=bottom、close-btn、close-on-overlay-click；t-button | visible-change |
| sb-pagination | t-button：size、variant、disabled、loading | tap |
| sb-icon | t-icon：name 按 names.js 对照，size 按三档 | — |
| sb-ai-sources | t-icon：name=chevron-down 或 chevron-up | — |
| sb-ai-progress | t-progress：theme=line、percentage、color；t-button | tap |
| sb-state-panel、sb-bottom-bar、sb-ai-field | t-loading、t-skeleton、t-button、t-input | tap、change |
| sb-tab-bar | t-tab-bar：value、fixed、safe-area-inset-bottom、split=false；t-tab-bar-item：value、icon | change |
| sb-date-picker | t-date-time-picker：visible、mode=date、format=YYYY-MM-DD、value、start、end、title、cancel-btn、confirm-btn；t-icon | confirm、cancel、close |
| sb-select | t-picker：visible、title、value、cancel-btn、confirm-btn、auto-close=false；t-picker-item：options；t-icon | confirm、cancel |
| sb-amount-input | t-input：type=digit、value、placeholder、disabled、align=right、borderless | focus、blur、change |
| sb-textarea | t-textarea：value、placeholder、maxlength、indicator、autosize、disabled、bordered=false | change |
| sb-battle-map、sb-chart-card | t-loading、t-button、t-icon | tap |
| sb-timeline | t-skeleton：theme=paragraph（加载中） | — |
| sb-upload | t-upload：theme=list、files、max、source、media-type、disabled、add-btn、add-content=slot、remove-btn、request-method；t-button | success、fail、remove |
| sb-result | t-result：theme（default、success、warning、error）、title、description；t-button | tap |
| sb-avatar | t-avatar：image、alt、shape（circle、round）、size（rpx 值） | — |

属性名与事件名对照 1.16.1 包里各组件的 props.js 与编译后的 js 核过。t-progress 的 status 属性没有用：传了 status 会把百分比换成图标。

## 怎么用

装成 npm 包：

1. 工程根目录建 `.npmrc`，写一行 `@shandiant:registry=https://npm.pkg.github.com`，再写一行 `//npm.pkg.github.com/:_authToken=<GitHub token>`；token 要有 read:packages 权限。没有 token 就用包文件。产品工程执行 `npm i tdesign-miniprogram@1.16.1 @shandiant/ui-miniprogram`（或 `npm i ./shandiant-ui-miniprogram-<版本>.tgz`），开发者工具「构建 npm」，`app.json` 删掉 `"style": "v2"`。
2. 变量与桥接两个 wxss 要放到小程序根目录再引。构建 npm 只复制包里的 `components/`，不复制 node_modules，所以从 `node_modules/@shandiant/ui-miniprogram/components/style/` 把 `design-tokens.wxss`、`bridge-tdesign.wxss` 复制到与 `app.wxss` 同级，然后 `app.wxss` 头两行写 `@import "./design-tokens.wxss"; @import "./bridge-tdesign.wxss";`。构建后它们也在 `miniprogram_npm/@shandiant/ui-miniprogram/style/` 里，能不能直接 `@import` 那个绝对路径还没在开发者工具里验过，先按复制做。
3. 页面 json 的 `usingComponents` 写 `"sb-state-panel": "@shandiant/ui-miniprogram/sb-state-panel/index"`。包的 `miniprogram` 字段指向 `components/`，所以路径从组件名开始。
4. 样式只写 `var(--ui-*)`，改完跑规范仓库的 `node tools/check.mjs`。

不装包也行：把 `components/` 复制到产品工程的 `components/sb/`，路径改成 `/components/sb/sb-state-panel/index`。

## 怎么测（不用开发者工具）

在本目录 `npm i` 然后 `npm test`。用微信官方的 miniprogram-simulate 在 Node 里渲染 32 个组件的每个状态，检查文字在不在、点了会不会对外发事件，用例在 `test/cases.cjs`。它和真机走同一套组件框架，但不是真机：布局、滚动、键盘、安全区这些还是要在开发者工具和真机看。

## 怎么看（仓库内演示工程，不随 npm 包发布）

浏览器渲染不了小程序组件，规范站的「组件」章只能放 Web 端的实时目录页。要看真实效果并且能操作，用仓库里的演示工程：

1. 在仓库目录 packages/ui-miniprogram 执行 `npm i`，装 tdesign-miniprogram 1.16.1。
2. 微信开发者工具导入这个目录，AppID 选测试号，菜单里「工具」「构建 npm」。小程序根目录就是这个目录，组件在 `components/`，演示页在 `demo/pages/index/`。
3. 打开首页。每个组件的每个状态从上到下排开，每段前面有一行灰字写这是什么状态。
4. 可以直接操作：搜索框打字并回车、筛选片点选、分页上一页下一页、加载更多、表单项输入、点「季度」或「打开底部弹层」打开弹层再点应用、AI 依据点开每一条、生成过程点取消看已取消态、失败态点重试、底部操作条点「切换禁用」看禁用说原因、待确认字段改值与恢复。
5. 真机预览用工具的「预览」二维码。截图放回规范仓库 `specs/salesbuddy/站点/组件库/miniprogram/`。

## 状态

32 个组件代码写好（0.6.0 加了 13 个），与 Web 端 `packages/ui-react/src/meta.js` 的清单一致。t-* 的属性与事件名已对照 1.16.1 包核过；组件本身未在开发者工具与真机跑过。
