# @shandiant/ui-miniprogram 更新记录

版本号规则与 ui-react 一致。每条写「改了什么、对使用方有什么影响」。

## 0.9.0（2026-09-23）

两件事：小程序以飞书为核心参考（2026-09-23 用户决定），以及小程序 1.0.8 第三轮「原生、手绘控件换成熟组件」需要的表单能力。

- 飞书样式：sb-summary-card、sb-section、sb-kpi-card、sb-metric-tile 默认无边框（白卡靠灰底区分），新增 `bordered` 在白底上用；sb-status-tag 与摘要卡范围标签改 4px 小圆角；sb-filter-bar、sb-date-picker 的快捷片改灰底无边框、选中浅蓝底主色字；sb-tabs 未选中用正文色、下划线 2px。颜色、圆角、遮罩随 tokens 1.3.0-draft.1 的小程序飞书值走。依据与取舍见规范 16 章（飞书参照与小程序体验）。
- 表单件新增 `layout="stacked"`（标签在上 14px 常规字重，下面一个白底细线 6px 圆角的控件框，版式和飞书表单一致；框高取 --ui-field-height，小程序端 44px）与 `plain`（不带自己的白底和页边距，放进表单白卡）：sb-select、sb-date-picker、sb-amount-input、sb-textarea。sb-textarea 新增 minRows、maxRows。
- sb-date-picker 新增 `mode="datetime"`：值为 'YYYY-MM-DD HH:mm'，底层 t-date-time-picker 精确到分钟；快捷片补 `defaultTime`（默认 18:00）。任务截止时间这类场景不必再直接写 t-date-time-picker。
- sb-sheet：取消、确定两个按钮等分（以前按内容宽度靠右），底部补安全区。
- 小程序体验：sb-bottom-bar、sb-sheet 底部安全区按 WeUI 两行写（constant() 在前、env() 在后）；摘要卡可点指标、描述列表可点单元、区块卡片右侧链接加按下态（小程序没有悬停），区块卡片链接点击区域补足 44px。
- 新增 sb-input：t-input 薄壳，和 sb-textarea 同一套版式（stacked／plain），清除、单位、错误与说明、密码切换明文；数字用 type=digit／number。页面原生 input 换它。
- sb-sheet：新增 header slot（搜索框、已选胶囊固定在正文上方）、description、confirmDisabled、secondaryLabel 与 secondary 事件（左键不是「取消」时）、scrolltolower；cancelLabel 传空只留确定键。
- sb-labeled-select：新增 size=small（飞书筛选片：灰底无边框、选中浅蓝底主色字，未选只显示标签、选中只显示值，撑满宿主）、allOption（传 false 不插「全部」）、title；滚轮放进 root-portal。
- sb-select、sb-date-picker：新增 title、error、help；滚轮放进 root-portal（放在 fixed 或 overflow 容器里不被裁切）。sb-date-picker 新增 clearable、快捷片 yesterday，并按 start、end 过滤快捷片。
- sb-textarea：每次输入都发 change（以前和 value 比较去重，页面不回写 value 时会漏发）；新增 error、help。
- sb-amount-input：新增 valueType="string"（全程字符串、不经 Number，小数位不超过 precision，precision 可到 6）与 maxlength；确收、回款、季度目标这类要精确到分以下的金额用它。
- sb-pagination 新增 error 与 retry 事件；sb-state-panel 新增 size=compact（一行）；sb-tabs 新增 size=small 与 plain；sb-segmented 新增整组 disabled。
- 第三轮页面评审回流（改在同一版里）：
  - sb-input：控件框高度只由 --ui-field-height 决定（t-input 自带的上下内边距清零，变量挂在真实节点上，以前登录页输入框约 56px）；maxlength 默认 140（和 t-input 一致）；新增 cursorSpacing（键盘与光标间距，表单在页面下方时用）；新增受控的 showPassword，切换明文时发 visibility 事件（detail.visible），页面可记住状态。
  - sb-textarea：新增 cursorSpacing、fixed（放在 position:fixed 的容器或弹层里必须传）；maxRows 传 0 表示不限行数，只按 minRows 定最小高度。
  - sb-segmented：项高 36px，加轨道上下各 4px，整体点击高度 44px；small 只缩字号与左右内边距，不再缩高度。新增 emitSame（点已选中项也发 change，页面要借此复位二级筛选时用）。
  - sb-labeled-select：allOption=false 时默认值（第一项）不算「已选」，不再显示成浅蓝选中态，但 small 下照样显示值文字（「按今日优先排序」），用灰底；新增 useLabelSlot 与 label slot（标签里要放图标时用）；small 与 sb-filter-bar、sb-date-picker 的快捷片用伪元素把点击区扩到 44px，视觉尺寸不变。
  - sb-sheet：没有按钮时底部也留安全区；关闭动画期间（visible 已为 false）点确定不再发 confirm，避免重复保存。
  - sb-tabs：新增 fit，各页签等分一行（五个页签在 320 宽屏也不溢出）。
  - sb-select：新增 defaultValue，value 为空时滚轮初始停在这一项（年份选择默认停在今年，而不是列表第一年）。
  - 桥接：主按钮与描边按钮的禁用态改用中性浅灰底、弱化字（以前是主色 40% 透明，在白底上对比度不够），见 tokens 1.3.0-draft.1 的 bridges。
- 第三轮 320 宽复核回流（375、360、320 三种宽度实测）：
  - 点击高度一律写 px：sb-segmented 项 36px（以前 72rpx，320 宽只有 30.7px），轨道上下 4px 也并进点击区；sb-labeled-select small 32px、sb-date-picker 快捷片 32px（以前 64rpx／56rpx）；所有扩区伪元素改成以中线为准上下各 22px（`calc(50% - 22px)`），任何屏宽都是 44px。
  - sb-tabs：页签行高 42px 加 2px 下划线，点击高度 44px（以前约 37px），加按下态；fit 改成按文字宽度分满一行（长页签不被压扁），5 个及以上页签在窄于 360px 的屏上退回横滑。
  - sb-state-panel：小号「重试」「清除条件」按钮外包一层扩到 44px，按钮本体与外层都绑同一方法（t-button 内部 catch 了原生 tap）。
  - sb-date-picker 清除图标、sb-metric-strip 周期片、sb-input 密码眼睛扩到 44px；眼睛高度减去描边，不再把框撑高 2px。
  - sb-textarea stacked、sb-amount-input 把 TDesign 自带的 32rpx 内边距清掉（变量挂在真实节点上，t-input／t-textarea 是虚拟宿主），框高不再撑到 56px。
  - sb-labeled-select 新增 defaultValue：allOption=false 时哪个值算默认（灰底），不传取第一项；季度片这类默认不是第一项的用它。
  - sb-bottom-bar inactive：以前整体 45% 透明（白字落浅蓝底，看不清），改成和桥接禁用态一样的中性浅灰底、弱化字，仍可点。
  - 字重只用 400 与 600：sb-summary-card 标题与指标、sb-kpi-card compact 指标、sb-ai-badge 标记 700→600；sb-ai-badge 文字、sb-status-tag、sb-timeline 标题 500→400。
  - 表单控件高随 tokens 1.3.0-draft.1 的小程序端 --ui-field-height 变成 44px；TDesign 字体变量由桥接改成 px。
- 终审回流（交付前最后一遍，五个角色、320 宽）：
  - TDesign 按钮与搜索框高度改 px（桥接）：大 48、中 44、小 32、超小 28，t-search 与表单控件同高；以前底部条主按钮在 320 宽只有 41px。
  - sb-pagination：「加载更多」「重试」「上一页」「下一页」小号按钮外包一层扩到 44px 点击区，两层绑同一方法。
  - sb-desc-list：值不再 break-all（「09:00」不会断成两行）；可点格子高 44px。
  - sb-summary-card：进度条至少留 64px，长说明换行，不再把进度条挤成一个点。
  - sb-textarea：新增 focus（打开编辑弹层即弹键盘）；stacked 的框画在自己的 view 上，不再靠 t-textarea 宿主的外部样式类。
  - sb-kpi-card：新增 tappable，只有可点时才有按下态和读屏「按钮」（以前不可点的指标卡一按就闪蓝）；compact 下超过 11 个字符的数值自动降到 16px（1 亿以上金额不截断）。
  - sb-segmented：未选中项加按下态。
  - 剩下的 650 字重（指标卡、指标块、页头、作战地图计数）改 600。
- 测试：36 个组件、144 个状态、47 次交互；用例可写 absent（不该出现的片段），用来断言「默认值不画选中态」「不可点无按下态」。

## 0.8.0（2026-09-23）

从小程序 1.0.8 按部门规范改版（26 页、14 个页面组件）回流：七组页面各自手写了同样几种结构，收进组件库；页面改版中发现的组件问题一并修掉。

- 新增 sb-summary-card 页面摘要卡：页面顶部白卡，替代深色渐变横幅。标题 20px、副标题 14px、右上范围小标签或 side slot（放切换）；可带首字方块、状态标签（sb-status-tag，中性标签自绘）、一行指标（竖线分隔、缺失写未登记、loading 时写「…」）、进度条；size=small 标题 16px、指标 20px（页面上方已有问候语时用）。首字方块与进度条自绘两三层 view，不引 t-avatar、t-progress（前者连带 t-badge、t-image）。十一个页面的顶部都是这个结构。
- 新增 sb-desc-list 描述列表：只读「标签：值」清单。行式用 t-cell，两列式自绘；空值写「未填写」，必填空值写「待补充」（提醒色），值可按 danger／warning／primary 上色，行可点。任务详情、拜访详情、建档核对、指派确认都用得上。
- 新增 sb-section 区块卡片：白底一圈细线，标题 16px、说明 14px、右侧一个链接；plain 时只要标题行。
- sb-bottom-bar：按钮改为等分，只有主按钮时撑满（0.7.0 是主按钮靠右、最小 120 宽，页面反馈「按钮不铺满」）；新增 note（按钮上方一行说明，如「提交后由李明哲验收」）；新增 inactive（看似禁用但仍发 primary，detail.inactive 为 true，页面借此弹出「还缺什么」；以前只能二选一：禁用就没了提示，不禁用就看不出条件没满足）；原因行从两个按钮之间挪到按钮上方，长提示不再挤按钮。按钮外包一层 view 定宽，不依赖 t-button 宿主上的 class。
- sb-state-panel：失败态那行「重试不会清除已选条件」改为 retryNote 属性，默认不变，没有筛选条件的页面（报告详情、拜访详情）传空字符串隐藏。
- sb-ai-badge：新增 state=advice「AI 建议，仅供参考」，主色淡底。Agent 经营建议不是待确认的草稿，以前只能借用 pending 的「待确认」黄色。
- sb-search：新增 maxlength（原生搜索框常见 100 字上限，换组件不丢）与 plain（不带外层白底和页边距，搜索框本身白底一圈细线，放在页面底色或卡片里用；两组页面都手写过这一圈）。
- sb-field：新增 plain，放进表单白卡时不再自带白底与页边距（以前放进卡里是框套框，页面只好不用它）。
- sb-pagination：新增 summary（自定义左侧说明，如「已显示 20／24 个商机」，不传仍是「共 N 条」）与 plain。
- sb-kpi-card：新增 size=compact，数字 20px、说明 14px，两列半宽卡和长金额不再截断（看板八张卡原来只能照规格手写）。
- sb-segmented：新增 block，撑满一行、各项等宽（我的页三页签）。
- 测试：35 个组件、121 个状态、42 次交互。

## 0.7.0（2026-09-21）

- 新增四个组件：sb-timeline 时间轴（自绘竖线加圆点，圆点色只由 tone 决定，pending 占位、倒序、紧凑、加载、空）、sb-upload 附件上传（t-upload 列表型壳，超类型／大小／数量就地红字不弹 toast，不传 requestMethod 只维护本地列表）、sb-result 结果页（t-result 壳，主次按钮加 extra slot）、sb-avatar 头像（t-avatar 壳，姓名后两字、三档 48／64／80rpx、底色档）。与 Web 端 SbTimeline、SbUpload、SbResult、SbAvatar 同一套属性。
- 测试：`test/run.cjs` 再把 t-grid-item 读屏文字里的对象展开去掉（t-upload 会引到它），只影响测试；t-upload 列表项内容走 `<template is>`，模拟器不渲染模板，用例只查列表项节点与状态类。
- 演示页加四段（时间轴、附件上传、结果页、头像）。

## 0.6.0（2026-09-21）

- 新增九个组件：sb-tab-bar（t-tab-bar 壳）、sb-date-picker（t-date-time-picker 壳）、sb-select（t-picker 壳）、sb-amount-input（t-input 壳）、sb-textarea（t-textarea 壳）、sb-segmented（自绘）、sb-battle-map（自绘四象限，view 绝对定位不用 canvas）、sb-kpi-card（自绘指标卡）、sb-chart-card（图表卡片壳，图区留给 ec-canvas）。
- sb-battle-map 用到四个象限底色变量 `--ui-quadrant-asset/attack/resource/spot`（tokens 1.1.0-draft.2 起有）。
- 测试：28 个组件、84 个状态、32 次交互；`test/run.cjs` 在临时目录里把 t-badge 模板换成空壳并去掉 t-tab-bar-item 读屏文字里的对象展开（模拟器的表达式解析器不认），只影响测试。
- 演示页加九段。

## 0.5.0（2026-09-21）

- 新增三个组件：sb-labeled-select、sb-metric-strip、sb-tabs。表格在手机上用列表，不做 sb-table。

## 0.4.0（2026-09-21）

- 新增 sb-icon：和 Web 同一张含义对照表，三档尺寸、语义色、带底方块。

## 0.3.0（2026-09-20）

- 加 `npm test`：用 miniprogram-simulate 渲染全部组件的 46 个状态并触发 14 次交互，进自检与发布流程。
- 包名从 `@sensetime-dept/ui-miniprogram` 改为 `@shandiant/ui-miniprogram`，源为 GitHub Packages。
- 加本文件。

## 0.2.1（2026-09-20）

- 变量与桥接两个 wxss 放进 `components/style/`，构建 npm 后随包复制；使用方从那里复制到小程序根目录再 `@import`。
- 包根即小程序根，演示工程可直接用开发者工具导入。

## 0.2.0（2026-09-20）

- 补到 15 个组件：新增 sb-search、sb-field、sb-sheet、sb-pagination、sb-metric-tile、sb-page-header、sb-ai-sources、sb-ai-progress。
- 演示页补全每个组件的每个状态。

## 0.1.0（2026-09-19）

- 第一版 7 个组件：sb-status-tag、sb-state-panel、sb-filter-bar、sb-list-row、sb-bottom-bar、sb-ai-badge、sb-ai-field，基于 tdesign-miniprogram 1.16.1。
