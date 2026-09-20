import React from 'react';
import { Button, Tooltip } from 'antd';
/** 底部固定操作条（C-01、X-05）：一个主操作，处理中防重复，禁用说原因，含安全区。 */
export function SbBottomBar({ primary, secondary, reason }) {
  const p = primary || {};
  const btn = <Button className="sb-primary" type="primary" size="large" loading={p.loading} disabled={p.disabled || p.loading} onClick={p.onClick}>{p.loading ? (p.loadingLabel || '处理中…') : p.label}</Button>;
  return (
    <div className="sb-bottombar">
      {secondary && <Button size="large" onClick={secondary.onClick} disabled={secondary.disabled}>{secondary.label}</Button>}
      {(reason || p.disabledReason) && <span className="sb-bottombar-reason">{reason || p.disabledReason}</span>}
      {p.disabled && p.disabledReason ? <Tooltip title={p.disabledReason}><span>{btn}</span></Tooltip> : btn}
    </div>
  );
}
