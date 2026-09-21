import React from 'react';
import { Select } from 'antd';
/**
 * 带标签的下拉筛选（C-04）：标签在框内左侧，值在右侧；没选时显示「全部」，清空回到「全部」。
 * 选项少于 6 个优先用 SbFilterBar 的筛选片；多于 6 个或多组并排时用这个。
 */
export function SbLabeledSelect({ label, value, options = [], onChange, placeholder = '全部', allowClear = true, disabled = false, mode, width, className = '' }) {
  return (
    <label className={`sb-lselect ${disabled ? 'sb-lselect-disabled' : ''} ${className}`} style={width ? { width } : undefined}>
      <span className="sb-lselect-label">{label}</span>
      <Select className="sb-lselect-control" variant="borderless" value={value ?? undefined} onChange={(v) => onChange?.(v)} options={options.map((o) => ({ value: o.value, label: o.count != null ? `${o.label}（${o.count}）` : o.label, disabled: o.disabled }))} placeholder={placeholder} allowClear={allowClear} disabled={disabled} mode={mode} popupMatchSelectWidth={false} />
    </label>
  );
}
