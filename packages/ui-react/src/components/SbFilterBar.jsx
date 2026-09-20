import React from 'react';
import { Button } from 'antd';
/** 筛选栏（C-04）：标题带范围、筛选片、已选数、结果数、清除。options: [{value,label,count}]；value: 已选 value 数组。 */
export function SbFilterBar({ title, scope, options = [], value = [], onChange, resultCount, resultLabel = '条', disabled = false, extra }) {
  const toggle = (v) => onChange?.(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="sb-filter" role="group" aria-label={title}>
      <div className="sb-filter-head">
        <span className="sb-filter-title">{title}{scope && <small>范围：{scope}</small>}</span>
        <span className="sb-filter-meta">{value.length > 0 && <span>已选 {value.length} 项</span>}{resultCount != null && <span>共 {resultCount} {resultLabel}</span>}{value.length > 0 && <Button size="small" type="link" onClick={() => onChange?.([])}>清除</Button>}</span>
      </div>
      <div className="sb-filter-chips">
        {options.map((o) => <button key={o.value} type="button" className="sb-chip" aria-pressed={value.includes(o.value)} disabled={disabled || o.disabled} onClick={() => toggle(o.value)}>{o.label}{o.count != null && <small>{o.count}</small>}</button>)}
        {extra}
      </div>
    </div>
  );
}
