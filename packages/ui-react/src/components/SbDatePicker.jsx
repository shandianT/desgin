import React from 'react';
import { DatePicker } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
/**
 * 日期选择（C-02、V-03）：antd DatePicker 薄壳，中文文案，快捷项「今天、本周、本季」；range 为 true 时是区间选择，快捷项给区间。
 * 对外统一 'YYYY-MM-DD' 字符串：value 收字符串（区间收两元数组），onChange 回字符串，内部才用 dayjs。
 */
const FMT = 'YYYY-MM-DD';
const toDay = (s) => (s ? dayjs(s) : null);
const toStr = (d) => (d ? d.format(FMT) : null);
const weekStart = (d) => d.subtract((d.day() + 6) % 7, 'day').startOf('day');
const quarterStart = (d) => d.month(Math.floor(d.month() / 3) * 3).date(1).startOf('day');
export function sbDatePresets(range) {
  const now = dayjs();
  const list = [['今天', now, now], ['本周', weekStart(now), weekStart(now).add(6, 'day')], ['本季', quarterStart(now), quarterStart(now).add(3, 'month').subtract(1, 'day')]];
  return list.map(([label, a, b]) => ({ label, value: range ? [a, b] : a }));
}

export function SbDatePicker({ value, onChange, range = false, presets, allowClear = true, disabled = false, disabledDate, placeholder, locale = zhCN.DatePicker, width, className = '', ...rest }) {
  const ps = presets === false ? undefined : presets || sbDatePresets(range);
  const style = width ? { width } : undefined;
  if (range) {
    const v = Array.isArray(value) && (value[0] || value[1]) ? [toDay(value[0]), toDay(value[1])] : null;
    return <DatePicker.RangePicker className={`sb-datepicker ${className}`} style={style} value={v} onChange={(d) => onChange?.(d && (d[0] || d[1]) ? [toStr(d[0]), toStr(d[1])] : null)} format={FMT} presets={ps} allowClear={allowClear} disabled={disabled} disabledDate={disabledDate} placeholder={placeholder || ['开始日期', '结束日期']} locale={locale} {...rest} />;
  }
  return <DatePicker className={`sb-datepicker ${className}`} style={style} value={toDay(value)} onChange={(d) => onChange?.(toStr(d))} format={FMT} presets={ps} allowClear={allowClear} disabled={disabled} disabledDate={disabledDate} placeholder={placeholder || '选择日期'} locale={locale} {...rest} />;
}
