import React from 'react';
import { Segmented, Tooltip } from 'antd';
import { SbMetricTile } from './SbMetricTile.jsx';
import { SbIcon } from './SbIcon.jsx';
/**
 * 指标条（T-05、B-03）：几张指标卡横排，右侧周期切换与口径说明。缺失显示「未登记」，加载中显示「正在读取」而不是 0。
 * items: [{ key, label, value, note, missingText }]；periods: [{ value, label }]。
 */
export function SbMetricStrip({ items = [], periods, period, onPeriodChange, caliber, loading = false, columns, className = '' }) {
  return (
    <div className={`sb-mstrip ${className}`} style={columns ? { '--sb-mstrip-cols': columns } : undefined}>
      {(periods?.length || caliber) && (
        <div className="sb-mstrip-side">
          {periods?.length ? <Segmented size="small" options={periods} value={period} onChange={(v) => onPeriodChange?.(v)} /> : null}
          {caliber && <Tooltip title={caliber}><button type="button" className="sb-mstrip-help" aria-label="统计口径"><SbIcon name="info" tone="muted" size="md" /></button></Tooltip>}
        </div>
      )}
      <div className="sb-mstrip-items">
        {items.map((m) => <SbMetricTile key={m.key ?? m.label} label={m.label} value={loading ? '…' : m.value} note={loading ? '正在读取' : m.note} missingText={m.missingText} />)}
      </div>
    </div>
  );
}
