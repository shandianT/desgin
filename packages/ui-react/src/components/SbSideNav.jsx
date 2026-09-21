import React from 'react';
import { Layout, Menu, Tooltip } from 'antd';
import { SbIcon } from './SbIcon.jsx';
/**
 * 侧导航（T-01、T-03、V-01）：深蓝侧栏，从上到下是品牌、工作区切换块、分组导航、底部「运营管理后台」链接与账号块。
 * 用 antd Layout.Sider 加 Menu 包一层，颜色只走 --ui-sidebar* 一组变量（CSS 覆盖，不用 antd 的 theme="dark"）。
 * 宽 232，折叠成 64 的窄条时只留图标，悬停出 antd Menu 自带的提示。
 * groups: [{ title, items: [{ key, label, icon（ReactNode 或 SbIcon 的含义名）, path, hidden }] }]
 */
const WIDTH = 232, RAIL = 64;
const renderIcon = (icon) => (typeof icon === 'string' ? <SbIcon name={icon} size="md" /> : icon ?? null);
const initials = (name = '') => String(name).trim().slice(0, 2) || '我';

export function SbSideNav({ brand, workspace, groups = [], activeKey, onSelect, collapsed = false, onCollapse, footer, account, adminLink, className = '' }) {
  const flat = [];
  const items = groups.map((g, gi) => ({
    type: 'group', key: g.key ?? `g${gi}`, label: g.title,
    children: (g.items || []).filter((it) => !it.hidden).map((it) => { flat.push(it); return { key: it.key, label: it.label, icon: renderIcon(it.icon), title: typeof it.label === 'string' ? it.label : undefined }; }),
  }));
  const brandNode = brand && typeof brand === 'object' && !React.isValidElement(brand)
    ? <a className="sb-sidenav-brand" href={brand.href || '#'} aria-label={brand.alt}>{collapsed && brand.markSrc ? <img src={brand.markSrc} alt={brand.alt || ''} /> : !collapsed && brand.logoSrc ? <img src={brand.logoSrc} alt={brand.alt || ''} /> : <span className="sb-sidenav-brand-text">{collapsed ? initials(brand.alt) : brand.alt}</span>}</a>
    : brand ? <div className="sb-sidenav-brand">{brand}</div> : null;
  const wsBtn = workspace && (
    <button type="button" className="sb-sidenav-ws" onClick={workspace.onClick} aria-label={collapsed ? `工作区：${workspace.name}` : undefined}>
      <SbIcon name="dashboard" size="md" tone="primary" tile className="sb-sidenav-ws-icon" />
      {!collapsed && <span className="sb-sidenav-ws-text"><b>{workspace.name}</b>{workspace.scope && <small>{workspace.scope}</small>}</span>}
      {!collapsed && <SbIcon name="expand" size="sm" tone="muted" />}
    </button>
  );
  const accBtn = account && (
    <button type="button" className={`sb-sidenav-account ${account.active ? 'sb-sidenav-account-active' : ''}`} onClick={account.onClick} aria-label={collapsed ? `账号：${account.name}` : undefined}>
      <span className="sb-sidenav-avatar">{account.avatar && /^(https?:|data:|\/)/.test(account.avatar) ? <img src={account.avatar} alt="" /> : account.avatar || initials(account.name)}</span>
      {!collapsed && <span className="sb-sidenav-account-text"><b>{account.name}</b><small>{[account.role, account.team].filter(Boolean).join(' · ')}</small></span>}
      {!collapsed && <SbIcon name="expand" size="sm" tone="muted" />}
    </button>
  );
  return (
    <Layout.Sider className={`sb-sidenav ${collapsed ? 'sb-sidenav-collapsed' : ''} ${className}`} width={WIDTH} collapsedWidth={RAIL} collapsed={collapsed} trigger={null} theme="light" aria-label="工作空间导航">
      {brandNode}
      {collapsed && workspace ? <Tooltip placement="right" title={workspace.name}>{wsBtn}</Tooltip> : wsBtn}
      <nav className="sb-sidenav-nav" aria-label="业务导航">
        <Menu mode="inline" inlineCollapsed={collapsed} inlineIndent={12} items={items} selectedKeys={activeKey != null ? [String(activeKey)] : []} onClick={({ key }) => onSelect?.(key, flat.find((it) => String(it.key) === key))} />
      </nav>
      <div className="sb-sidenav-bottom">
        {footer}
        {adminLink && (collapsed
          ? <Tooltip placement="right" title={adminLink.label || '运营管理后台'}><a className="sb-sidenav-admin" href={adminLink.href} target="_blank" rel="noopener noreferrer" aria-label={adminLink.label || '运营管理后台'}><SbIcon name="more" size="md" /></a></Tooltip>
          : <a className="sb-sidenav-admin" href={adminLink.href} target="_blank" rel="noopener noreferrer">{adminLink.label || '运营管理后台'} <span aria-hidden="true">↗</span></a>)}
        {collapsed && account ? <Tooltip placement="right" title={account.name}>{accBtn}</Tooltip> : accBtn}
        {onCollapse && <button type="button" className="sb-sidenav-toggle" onClick={() => onCollapse(!collapsed)} aria-label={collapsed ? '展开导航' : '收起导航'}><SbIcon name={collapsed ? 'forward' : 'back'} size="sm" />{!collapsed && <span>收起</span>}</button>}
      </div>
    </Layout.Sider>
  );
}
