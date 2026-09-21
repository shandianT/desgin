import React from 'react';
import { Select } from 'antd';
/**
 * 下拉选择（C-02、C-04）：antd Select 薄壳，统一 options [{ value, label, count, disabled }]，count 显示成灰小字；缺省不带清除。
 * 筛选场景请用 SbLabeledSelect（标签在框内）；这里是表单与普通选择。
 */
export const sbSelectOptions = (options = []) => options.map((o) => ({ value: o.value, disabled: o.disabled, title: typeof o.label === 'string' ? o.label : undefined, label: o.count != null ? <span className="sb-select-opt">{o.label}<small className="sb-select-count">{o.count}</small></span> : o.label }));

export function SbSelect({ value, onChange, options = [], placeholder = '请选择', allowClear = false, disabled = false, width, mode, showSearch = false, className = '', ...rest }) {
  return <Select className={`sb-select ${className}`} style={width ? { width } : undefined} value={value ?? undefined} onChange={(v, o) => onChange?.(v, o)} options={sbSelectOptions(options)} placeholder={placeholder} allowClear={allowClear} disabled={disabled} mode={mode} showSearch={showSearch} optionFilterProp="title" popupMatchSelectWidth={false} {...rest} />;
}
