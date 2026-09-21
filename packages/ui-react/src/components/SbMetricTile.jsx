import React from 'react';
/** 指标卡：数字、说明、变化。缺失显示「未登记」，不显示 0（B-03）。labelSuffix 放在说明后面，比如「可点进」的箭头。 */
export function SbMetricTile({ value, label, note, missingText = '未登记', labelSuffix }) {
  const missing = value == null || value === '';
  return (
    <div className="sb-metric">
      <b className={missing ? 'sb-metric-missing' : ''}>{missing ? missingText : value}</b>
      <div className="sb-metric-text"><span>{label}{labelSuffix}</span>{note && <small>{note}</small>}</div>
    </div>
  );
}
