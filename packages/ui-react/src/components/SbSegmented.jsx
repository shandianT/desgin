import React from 'react';
import { Segmented } from 'antd';
/** 分段切换（C-04、T-05）：antd Segmented 薄壳，options [{ value, label, disabled }]，默认 small。周期切换、视图切换用；多于 5 项改用 SbTabs 或下拉。 */
export function SbSegmented({ value, onChange, options = [], size = 'small', disabled = false, block = false, className = '', ...rest }) {
  return <Segmented className={`sb-segmented ${className}`} options={options.map((o) => ({ value: o.value, label: o.label, disabled: o.disabled }))} value={value} onChange={(v) => onChange?.(v)} size={size} disabled={disabled} block={block} {...rest} />;
}
