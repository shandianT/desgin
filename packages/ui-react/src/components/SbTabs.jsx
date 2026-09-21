import React from 'react';
import { Tabs } from 'antd';
/** 带数量的标签页（C-05）：数量小号灰字，超过 99 显示 99+，当前页签主色。items: [{ key, label, count, children, disabled }] */
export function SbTabs({ items = [], activeKey, defaultActiveKey, onChange, size = 'middle', className = '' }) {
  const fmt = (n) => (n == null ? null : n > 99 ? '99+' : String(n));
  return <Tabs className={`sb-tabs ${className}`} activeKey={activeKey} defaultActiveKey={defaultActiveKey} onChange={onChange} size={size} items={items.map((t) => ({ key: t.key, disabled: t.disabled, children: t.children, label: <span className="sb-tabs-label">{t.label}{fmt(t.count) != null && <small>{fmt(t.count)}</small>}</span> }))} />;
}
