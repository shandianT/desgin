import React from 'react';
import { Breadcrumb, Button, Tooltip } from 'antd';
import { SbIcon } from './SbIcon.jsx';
/**
 * 顶栏（T-02、X-03、C-06）：白底 64 高、下边线。左侧返回按钮加面包屑（分组 / 当前页），右侧连接状态点与日期、「新建」主按钮、帮助、刷新。
 * 有顶栏面包屑的页面不再放 SbPageHeader（14 章）。status 四态文字与状态点用 success / warning / danger / neutral 变量。
 */
const STATUS = { ready: { tone: 'success', text: '已连接' }, preview: { tone: 'warning', text: '演示数据' }, unavailable: { tone: 'danger', text: '服务不可用' }, checking: { tone: 'neutral', text: '正在检查服务' } };
const todayText = () => { const d = new Date(); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`; };

export function SbTopBar({ items = [], onBack, status = 'ready', statusText, date, onCreate, createLabel = '新建', createHidden = false, onHelp, onRefresh, refreshing = false, extra, className = '' }) {
  const st = STATUS[status] || STATUS.checking;
  const crumbs = items.map((it, i) => ({ title: i === items.length - 1 ? <strong>{it.label}</strong> : it.onClick ? <a onClick={(e) => { e.preventDefault(); it.onClick(); }} href="#">{it.label}</a> : it.label }));
  return (
    <header className={`sb-topbar ${className}`}>
      <div className="sb-topbar-crumb">
        {onBack && <Tooltip title="返回上一页"><Button type="text" size="small" className="sb-topbar-back" onClick={onBack} aria-label="返回上一页" icon={<SbIcon name="back" size="md" />} /></Tooltip>}
        <Breadcrumb items={crumbs} separator="/" />
      </div>
      <div className="sb-topbar-actions">
        {extra}
        <span className={`sb-topbar-status sb-topbar-status-${st.tone}`} role="status"><i aria-hidden="true" />{statusText ?? st.text}</span>
        <span className="sb-topbar-date">{date ?? todayText()}</span>
        {onCreate && !createHidden && <Button type="primary" className="sb-topbar-create" icon={<SbIcon name="add" size="sm" />} onClick={onCreate}>{createLabel}</Button>}
        {onHelp && <Tooltip title="帮助"><Button className="sb-topbar-iconbtn" onClick={onHelp} aria-label="帮助" icon={<SbIcon name="help" size="md" />} /></Tooltip>}
        {onRefresh && <Tooltip title="刷新"><Button className="sb-topbar-iconbtn" onClick={onRefresh} loading={refreshing} aria-label="刷新" icon={<SbIcon name="retry" size="md" />} /></Tooltip>}
      </div>
    </header>
  );
}
