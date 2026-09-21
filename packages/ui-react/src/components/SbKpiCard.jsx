import React from 'react';
import { SbMetricTile } from './SbMetricTile.jsx';
import { SbIcon } from './SbIcon.jsx';
/**
 * 看板指标卡（12 章 §3.1、B-03）：数字 32、说明 14、变化 12；单位小一号跟在数字后；缺失显示「未登记」不显示 0；加载中显示「正在读取」。
 * change：{ text, tone: up | down | flat, good }。颜色只看 good：true 绿、false 红、不传灰（客户数这类无好坏的用灰）；tone 只决定箭头。
 */
const ARROW = { up: '↑', down: '↓', flat: '→' };
export function SbKpiCard({ value, unit, label, note, change, missingText = '未登记', loading = false, onClick, ariaLabel, className = '' }) {
  const missing = value == null || value === '';
  const shown = loading ? null : missing ? null : <>{value}{unit && <small className="sb-kpi-unit">{unit}</small>}</>;
  const toneClass = change ? (change.good === true ? 'sb-kpi-change-good' : change.good === false ? 'sb-kpi-change-bad' : 'sb-kpi-change-flat') : '';
  const tail = (note || change) ? <>{note}{change && <span className={`sb-kpi-change ${toneClass}`}>{ARROW[change.tone] ? <i aria-hidden="true">{ARROW[change.tone]}</i> : null}{change.text}</span>}</> : undefined;
  const tile = <SbMetricTile value={shown} label={label} note={tail} missingText={loading ? '正在读取' : missingText} labelSuffix={onClick ? <span className="sb-kpi-link-hint"><SbIcon name="forward" size="sm" /></span> : null} />;
  if (onClick) return <button type="button" className={`sb-kpi sb-kpi-link ${className}`} onClick={onClick} aria-label={ariaLabel || `${typeof label === 'string' ? label : ''}，查看明细`} aria-busy={loading || undefined}>{tile}</button>;
  return <div className={`sb-kpi ${className}`} aria-busy={loading || undefined}>{tile}</div>;
}
