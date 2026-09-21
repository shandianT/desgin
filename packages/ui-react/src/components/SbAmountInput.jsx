import React from 'react';
import { InputNumber } from 'antd';
/**
 * 金额输入（C-02、B-03）：antd InputNumber 薄壳，单位默认「万元」（unit 可配），千分位分隔，只收非负数，默认两位小数。
 * value 收数字或 null，onChange 回数字或 null；不把空当 0。
 */
const fmt = (v) => (v === undefined || v === null || v === '' ? '' : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
const parse = (s) => (s || '').replace(/[,\s，]/g, '');

export function SbAmountInput({ value, onChange, unit = '万元', min = 0, max, precision = 2, placeholder = '0.00', disabled = false, width = 180, className = '', ...rest }) {
  return <InputNumber className={`sb-amount ${className}`} style={{ width }} value={value ?? null} onChange={(v) => onChange?.(v === undefined || v === '' || Number.isNaN(v) ? null : v)} min={min} max={max} precision={precision} formatter={(v, info) => fmt(!info?.userTyping && v !== '' && v != null && precision != null && !Number.isNaN(Number(v)) ? Number(v).toFixed(precision) : v)} parser={parse} suffix={unit ? <span className="sb-amount-unit">{unit}</span> : undefined} placeholder={placeholder} disabled={disabled} controls={false} {...rest} />;
}
