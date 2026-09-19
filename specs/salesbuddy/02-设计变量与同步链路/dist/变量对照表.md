# 设计变量对照表（自动生成）

版本 1.1.0-draft.1 · 2026-09-19。由 build-tokens.mjs 从 tokens.json 生成；改值请改 tokens.json。

状态说明：「已确认」= 值来自 SalesBuddy Web V1.0 已确认规则；「建议」= 本轮新增或跨端映射，尚未登记采用；端侧列中与电脑网页不同的值用 **加粗** 标出，**加粗的端侧值一律是建议，未登记采用**。

| 语义变量 | 用途 | 来源档位 | 电脑网页 | 手机网页（≤600px） | 微信小程序 | 状态 | 规则 |
|---|---|---|---|---|---|---|---|
| `--ui-background` | 工作区背景 | `color.gray.50` | #F3F5F9 | #F3F5F9 | #F3F5F9 | 已确认 | V-01 |
| `--ui-surface` | 内容面板 | `color.gray.0` | #FFFFFF | #FFFFFF | #FFFFFF | 已确认 | V-01 |
| `--ui-sidebar` | 深蓝导航 | `color.navy.900` | #142F54 | #142F54 | #142F54 | 已确认 | V-01 |
| `--ui-ink` | 正文文字 | `color.ink.900` | #192842 | #192842 | #192842 | 已确认 | V-01 |
| `--ui-secondary` | 次要文字 | `color.ink.600` | #5B6C82 | #5B6C82 | #5B6C82 | 已确认 | V-01 |
| `--ui-muted` | 辅助文字 | `color.ink.500` | #617188 | #617188 | #617188 | 已确认 | V-01 |
| `--ui-primary` | 主要操作、选中 | `color.blue.600` | #2863CD | #2863CD | #2863CD | 已确认 | V-01 |
| `--ui-primary-hover` | 主要操作悬停 | `color.blue.700` | #2055B5 | #2055B5 | #2055B5 | 已确认 | V-01 |
| `--ui-line` | 边线 | `color.gray.200` | #E2E8F0 | #E2E8F0 | #E2E8F0 | 已确认 | V-01 |
| `--ui-selected` | 选中底色 | `color.blue.50` | #EDF3FF | #EDF3FF | #EDF3FF | 已确认 | V-01 |
| `--ui-focus` | 键盘焦点轮廓 | `color.blue.400` | #5786DC | #5786DC | #5786DC | 已确认 | V-04 |
| `--ui-danger` | 红：转差／错误文字 | `color.red.700` | #A73F38 | #A73F38 | #A73F38 | 已确认 | B-01 |
| `--ui-danger-soft` | 红底 | `color.red.50` | #FBE4DF | #FBE4DF | #FBE4DF | 已确认 | B-01 |
| `--ui-warning` | 黄：需关注文字 | `color.yellow.700` | #805919 | #805919 | #805919 | 已确认 | B-01 |
| `--ui-warning-soft` | 黄底 | `color.yellow.50` | #FFF0CF | #FFF0CF | #FFF0CF | 已确认 | B-01 |
| `--ui-success` | 绿：向好文字 | `color.green.700` | #27694C | #27694C | #27694C | 已确认 | B-01 |
| `--ui-success-soft` | 绿底 | `color.green.50` | #E8F5EE | #E8F5EE | #E8F5EE | 已确认 | B-01 |
| `--ui-neutral` | 灰：待评估文字 | `color.ink.550` | #56677E | #56677E | #56677E | 已确认 | B-01 |
| `--ui-neutral-soft` | 灰底 | `color.gray.100` | #EEF2F7 | #EEF2F7 | #EEF2F7 | 已确认 | B-01 |
| `--ui-font` | 系统中文字体 | `font.family.system` | 系统字体 | 系统字体 | 系统字体 | 已确认 | V-02 |
| `--ui-text-small` | 辅助信息 | `font.size.12` | 12px | 12px | 12px | 已确认 | V-02 |
| `--ui-text-body` | 正文 | `font.size.14` | 14px | **16px** | **16px** | 已确认（电脑值）；端侧覆盖为建议 | V-02 |
| `--ui-text-section` | 分区标题 | `font.size.16` | 16px | 16px | 16px | 已确认 | V-02 |
| `--ui-text-page` | 页面标题 | `font.size.24` | 24px | 24px | 24px | 已确认 | V-02 |
| `--ui-text-metric` | 关键数字 | `font.size.32` | 32px | 32px | 32px | 已确认 | V-02 |
| `--ui-space-1` | 4：图标与文字 | `space.1` | 4px | 4px | 4px | 已确认 | V-03 |
| `--ui-space-2` | 8：同组控件 | `space.2` | 8px | 8px | 8px | 已确认 | V-03 |
| `--ui-space-3` | 12：行内区域 | `space.3` | 12px | 12px | 12px | 已确认 | V-03 |
| `--ui-space-4` | 16：内容块 | `space.4` | 16px | 16px | 16px | 已确认 | V-03 |
| `--ui-space-6` | 24：面板内边距 | `space.6` | 24px | 24px | 24px | 已确认 | V-03 |
| `--ui-space-8` | 32：大分区 | `space.8` | 32px | 32px | 32px | 已确认 | V-03 |
| `--ui-radius-control` | 控件圆角 | `radius.6` | 6px | 6px | 6px | 已确认 | V-03 |
| `--ui-radius-panel` | 面板圆角 | `radius.12` | 12px | 12px | 12px | 已确认 | V-03 |
| `--ui-control-height` | 普通控件高 | `size.36` | 36px | 36px | 36px | 已确认 | V-03 |
| `--ui-field-height` | 表单控件高 | `size.40` | 40px | 40px | 40px | 已确认 | V-03 |
| `--ui-shadow-popup` | 弹出层阴影（当前为 CSS 字符串形式，Style Dictionary 可直接输出；待工具链完整支持 2025.10 后迁移为对象形式） | 直接值 | 0 8px 28px #1928421a, 0 2px 6px #19284208 | 0 8px 28px #1928421a, 0 2px 6px #19284208 | 0 8px 28px #1928421a, 0 2px 6px #19284208 | 已确认 | C-07 |
| `--ui-page-gutter` | 页面左右留白（第 06 章间距映射示例：电脑 24，手机 16） | `space.6` | 24px | **16px** | **16px** | 建议（电脑值）；端侧覆盖为建议 | X-08 |
| `--ui-card-padding` | 普通卡片内边距（第 06 章示例：16） | `space.4` | 16px | 16px | 16px | 建议 | X-08 |
| `--ui-block-gap` | 独立区块间隔（第 06 章示例：24） | `space.6` | 24px | 24px | 24px | 建议 | X-08 |
| `--ui-touch-target` | 手机最小交互目标（X-06 建议 44×44 逻辑像素） | `size.44` | 44px | 44px | 44px | 建议 | X-06 |
| `--ui-nav-width` | 桌面导航栏宽度（三段布局样板） | `size.220` | 220px | 220px | 220px | 建议 | X-02 |
| `--ui-nav-rail-width` | 折叠后的图标导航宽度（601～900px） | `size.56` | 56px | 56px | 56px | 建议 | X-02 |
| `--ui-list-width` | 桌面对象列表栏宽度（三段布局样板） | `size.360` | 360px | 360px | 360px | 建议 | X-02 |
| `--ui-tabbar-height` | 手机底部导航高度（不含安全区） | `size.56` | 56px | 56px | 56px | 建议 | X-03 |
| `--ui-on-primary` | 主操作按钮上的文字 | `color.gray.0` | #FFFFFF | #FFFFFF | #FFFFFF | 建议 | V-01 |
| `--ui-sidebar-ink` | 深蓝导航主文字（theme.css 已有实现） | `color.sky.50` | #E7EFFA | #E7EFFA | #E7EFFA | 建议 | V-01 |
| `--ui-sidebar-nav` | 导航项文字 | `color.sky.200` | #C2D1E6 | #C2D1E6 | #C2D1E6 | 建议 | V-01 |
| `--ui-sidebar-muted` | 导航次要文字 | `color.sky.300` | #B4C7E1 | #B4C7E1 | #B4C7E1 | 建议 | V-01 |
| `--ui-sidebar-hover` | 导航悬停底 | `color.navy.700` | #23466F | #23466F | #23466F | 建议 | V-01 |
| `--ui-sidebar-active` | 导航当前项底 | `color.navy.800` | #2A568B | #2A568B | #2A568B | 建议 | V-01 |
| `--ui-sidebar-accent` | 导航当前项亮条 | `color.navy.200` | #91BAFF | #91BAFF | #91BAFF | 建议 | V-01 |
| `--ui-sidebar-focus` | 导航上的键盘焦点轮廓 | `color.navy.100` | #B9D2FF | #B9D2FF | #B9D2FF | 建议 | V-04 |

## 端侧说明

- **电脑网页**：电脑网页（>900px 与 601～900px）
- **手机网页（≤600px）**：手机网页：同一份 CSS，在 ≤600px 媒体查询内覆盖（建议）
- **微信小程序**：微信小程序：生成 WXSS，单位 px（逻辑像素）；宽度按比例缩放的部分由页面自行用 rpx（建议）
