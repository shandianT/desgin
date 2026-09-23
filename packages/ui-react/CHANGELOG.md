# @shandiant/ui-react 更新记录

版本号规则：只改值升修订号，加组件或属性升次版本，改含义或删属性升主版本。每条写「改了什么、对使用方有什么影响」。

## 未发布（2026-09-23）

- `SbLabeledSelect` 新增可选 `confirmMultiple`：连续勾选后点击应用才调用 `onChange`；取消、Esc 和外部点击保留原条件，支持搜索与键盘。默认行为不变。
- `SbBattleMap` 新增可选 `layout="equal"`：按阈值分段映射为四个等大区域，保持原始评分和分类；默认仍为线性布局。
- GitHub Pages Web 样板直接从组件源码构建采用上述变化。npm 版本仍为 0.7.0，本轮未发布新包。

## 0.7.0（2026-09-21）

- 新增四个薄壳组件 SbTimeline、SbUpload、SbResult、SbAvatar；SbTable 透传排序与勾选；SbPagination 每页条数与加载更多；SbSideNav 节奏对齐；目录页加「基础控件怎么用」「备用控件」两节、图标搜索、Tag 去混淆；配套 15 章组件选型指南。
- SbSideNav 节奏按运营后台侧栏对齐：顶部留白 28、品牌靠左、分组间距 28、条目高 44、图标 18、当前项左侧加强调色竖条；底部链接与收起按钮也左对齐，所有块左右各留 16；收起时全部居中。
- SbTable 透传 antd 原生排序与勾选：columns 里的 sorter 照常生效，没写 sortDirections 时默认升、降两档；新增 rowSelection（onChange 回选中 keys 与行）与 onChange（拿 sorter）。四态、分页、操作列固定不受影响。
- SbPagination 新增每页条数选择：pageSizeOptions 默认 [10, 20, 50]，传了 onPageSizeChange 才显示选择器；新增 mode="more" 加载更多模式（loading、end、onLoadMore），这个模式不显示每页条数。
- SbStatusTag 的说明补了和 antd Tag 的分工：业务状态用 SbStatusTag，Tag 只做分类标识。目录页 Tag 卡片去掉状态色示例。
- 新增四个薄壳：SbTimeline 时间轴（antd Timeline，节点色只由 tone 决定，pending 占位、倒序、紧凑、加载、空）、SbUpload 附件上传（antd Upload，列表型或拖拽区，超类型／大小／数量就地红字不弹 toast，request 不传只维护本地列表）、SbResult 结果页（antd Result，图标色走语义变量，主次按钮加 extra）、SbAvatar 头像（antd Avatar，姓名后两字、三档 24／32／40、底色档、方形）。导出 avatarInitials 取字函数。
- SbSideNav 的账号头像改用 SbAvatar（tone=sidebar）：取字从「前两字」改为「后两字」（王小明 → 小明），传图片地址仍显示图片。品牌名折叠时仍取前两字。
- 目录页：基础控件加「备用控件：暂无场景，先接好主题」一节，16 个还没有业务场景的 antd 控件（Slider、Upload、Transfer、Tree、Mentions、Image、Popover、Dropdown、Collapse 手风琴、Typography、Space、Grid、Affix、BackTop、QRCode、Carousel）各一张卡，写了可能用在哪。
- 目录页：基础控件加「基础控件怎么用」一节（Switch、Radio、Checkbox、Steps、Progress、Avatar、Badge、Skeleton、Spin、Divider，各写用在哪）；图标一节加搜索框，按含义名、中文说明、两端图标名过滤，点图标复制 `<SbIcon name="…" />`；顶部说明链接到 15 章组件选型指南。

## 0.6.0（2026-09-21）

- 新增八个组件：SbSideNav 侧导航、SbTopBar 顶栏、SbDatePicker 日期选择、SbSelect 下拉选择、SbSearchSelect 搜索选择、SbAmountInput 金额输入、SbTextarea 多行文本、SbSegmented 分段切换。侧栏与顶栏从 Web 样板（设计评审交付 v2）抽出，颜色只走 --ui-sidebar* 与语义变量；表单壳都是 antd 薄壳，统一 options 结构与「YYYY-MM-DD」「万元」「number | null」这些口径。
- SbDatePicker 引 dayjs（antd 自带的那份），库构建把 dayjs 设为外部依赖，使用方无需额外安装。
- 新增 SbBattleMap 作战地图：SVG 画的关系 × 潜力四象限（12 章 2.1～2.6），横轴潜力、纵轴关系，分界线 5.5 虚线；格子底色用 --ui-quadrant-*；点色是状态、点径是金额档；重叠聚成数字圆（onClusterClick），点象限放大（zoomQuadrant 受控）、点客户进详情（onPointClick）；空态、加载中、待评估计数、手机宽度底部四个数字。
- 新增四个图表组件（12 章）：SbChartCard 图表卡片壳、SbKpiCard 看板指标卡、SbBarChart 柱状图（横向排名与竖向对比）、SbLineChart 折线图。图表用 echarts/core 按需引入、SVG 渲染，主题 shandiant 来自 `@shandiant/tokens/bridge-echarts`，颜色、字号、网格线、悬停框都从变量取；缺失写「未登记」不画 0，动画只在首屏。
- 使用方要装 `echarts@^6`（新增 peerDependency）；tokens 包升到 1.2.0-draft.1 才有 bridge-echarts 与 `--ui-chart-*`、`--ui-quadrant-*`。

## 0.5.5（2026-09-21）

- SbMetricStrip 的 flat 行高从 46 提到 64，卡片整体高一档，数字与经营分析卡片同一档 32px，看起来不再局促。

## 0.5.4（2026-09-21）

- SbStatusTag 带原因时，列太窄不再折成两行，超出用省略号。

## 0.5.3（2026-09-21）

- SbMetricStrip 的 flat 改成一行：说明在左、数字在右，指标之间一条竖线，周期切换与口径在同一行最右。整条只占一行高，不再把下面的列表挤出首屏。可点进的指标，箭头跟在说明后面。
- SbMetricTile 的说明与备注包在一层里，新增 labelSuffix。
- SbMetricStrip 新增 extra，放年份下拉这类额外控件。SbTable 新增 showHeader，分组表格只保留第一组的表头；传了 onRowClick 的行显示手型。

## 0.5.2（2026-09-21）

- SbMetricStrip 加 variant：flat 默认，不描边靠留白分组，悬停才出底色；card 是原来的描边样式。依据 14 章。

## 0.5.1（2026-09-21）

- SbMetricStrip 的卡片支持 onClick，可点进明细。

## 0.5.0（2026-09-21）

- 新增四个组件：SbLabeledSelect 带标签下拉、SbMetricStrip 指标条、SbTabs 带数量标签页、SbTable 表格。来自 13 章真实项目回流。

## 0.4.0（2026-09-21）

- 新增 SbIcon：传含义名不传库名，三档尺寸、语义色、带底方块；peer 加 @ant-design/icons。

## 0.3.0（2026-09-20）

- 目录页换主色时，悬停、选中底、焦点三个派生色按主色十档一起变。
- 加类型文件 `dist/index.d.ts`，TypeScript 工程引入有属性提示。17 个组件的属性、`META` 与 `USAGE` 都有声明。
- 包名从 `@sensetime-dept/ui-react` 改为 `@shandiant/ui-react`，源为 GitHub Packages。旧包名没有发布过，没有迁移成本。
- 加本文件。

## 0.2.1（2026-09-20）

- `SbProvider` 的主题改从 `@shandiant/tokens/bridge-antd` 读，不再内联一份。使用方必须同时安装 tokens 包。
- `USAGE` 里的变量引入路径改为 `@shandiant/tokens/css`。

## 0.2.0（2026-09-20）

- 补到 17 个组件：新增 SbSearch、SbField、SbSheet、SbPagination、SbMetricTile、SbPageHeader、SbDetailLayout、SbAiSources、SbAiProgress。
- 目录页加基础控件一节，Ant Design 的 Select、DatePicker 等配中文名；加筛选、搜索与换主色工具条。
- 规范站「组件」章直接嵌入目录页。

## 0.1.0（2026-09-19）

- 第一版 8 个组件：SbProvider、SbStatusTag、SbStatePanel、SbFilterBar、SbListRow、SbBottomBar、SbAiBadge、SbAiField。
