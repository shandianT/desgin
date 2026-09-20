import React from 'react';
import { SbStatusTag } from './SbStatusTag.jsx';
/** 列表行（C-05）：名称、摘要、状态、时间位置固定。selected、disabled（带 disabledReason）。 */
export function SbListRow({ name, summary, status, time, selected = false, disabled = false, disabledReason, onClick }) {
  return (
    <button type="button" className="sb-row" aria-selected={selected} aria-disabled={disabled} disabled={disabled} onClick={onClick} title={disabled ? disabledReason : undefined}>
      <span className="sb-row-name">{name}</span>
      <span className="sb-row-summary">{disabled && disabledReason ? disabledReason : summary}</span>
      <span className="sb-row-side">{status && !disabled ? <SbStatusTag {...status} /> : disabled ? <span>无权限</span> : null}{time && <span>{time}</span>}</span>
    </button>
  );
}
