import React from 'react';
import { Segmented, Tooltip } from 'antd';
import { SbMetricTile } from './SbMetricTile.jsx';
import { SbIcon } from './SbIcon.jsx';
/**
 * 指标条（T-05、B-03）：几张指标卡横排，右侧周期切换与口径说明。缺失显示「未登记」，加载中显示「正在读取」而不是 0。
 * items: [{ key, label, value, note, missingText, onClick }]；带 onClick 的卡可点进明细；periods: [{ value, label }]。
 * 一个容器里不再套框（14 章）：默认 flat，卡片不描边。
 */
/** extra：放在周期切换左边的额外控件，比如年份下拉。
/** variant：flat 默认，一行放下：说明在左、数字在右，指标之间一条竖线，周期与口径在同一行右侧，整条只占一行高；card 每张卡描边、数字在上，单独摆放时用。 */
export function SbMetricStrip({ items = [], periods, period, onPeriodChange, caliber, extra, loading = false, columns, variant = 'flat', className = '' }) {
  return (
    <div className={`sb-mstrip sb-mstrip-${variant} ${className}`} style={columns ? { '--sb-mstrip-cols': columns } : undefined}>
      {(periods?.length || caliber || extra) && (
        <div className="sb-mstrip-side">{extra}
          {periods?.length ? <Segmented size="small" options={periods} value={period} onChange={(v) => onPeriodChange?.(v)} /> : null}
          {caliber && <Tooltip title={caliber}><button type="button" className="sb-mstrip-help" aria-label="统计口径"><SbIcon name="info" tone="muted" size="md" /></button></Tooltip>}
        </div>
      )}
      <div className="sb-mstrip-items">
        {items.map((m) => {
          const suffix = m.onClick && variant === 'flat' ? <span className="sb-mstrip-link-hint"><SbIcon name="forward" size="sm" /></span> : null;
          const tile = <SbMetricTile label={m.label} value={loading ? '…' : m.value} note={loading ? '正在读取' : m.note} missingText={m.missingText} labelSuffix={suffix} />;
          return m.onClick
            ? <button key={m.key ?? m.label} type="button" className="sb-mstrip-link" onClick={m.onClick} aria-label={m.ariaLabel || `${typeof m.label === 'string' ? m.label : ''}，查看明细`}>{tile}{variant !== 'flat' && <span className="sb-mstrip-link-hint"><SbIcon name="forward" size="sm" /></span>}</button>
            : <div key={m.key ?? m.label}>{tile}</div>;
        })}
      </div>
    </div>
  );
}
