import React from 'react';
import { Input } from 'antd';
/** 搜索框：带清除；无结果由 SbStatePanel empty 表达。 */
export function SbSearch({ value, onChange, placeholder = '搜索名称或负责人', loading = false, disabled = false, onSearch }) {
  return <Input.Search allowClear value={value} onChange={(e) => onChange?.(e.target.value)} onSearch={onSearch} placeholder={placeholder} loading={loading} disabled={disabled} />;
}
