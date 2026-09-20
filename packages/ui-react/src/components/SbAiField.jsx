import React from 'react';
import { Button, Input } from 'antd';
import { SbAiBadge } from './SbAiBadge.jsx';
/**
 * 待确认字段（A-04）：三态 ai（AI 原值，待确认）、edited（人已修改，可恢复 AI 建议）、confirmed（已确认）。
 * 低把握（confidence 'low'）时留空给候选（A-03）。
 */
export function SbAiField({ label, required = false, value, aiValue, state = 'ai', confidence = 'high', candidates = [], onChange, onConfirm, onRestore, error }) {
  const low = confidence === 'low' && state === 'ai';
  return (
    <div className={`sb-aifield ${state === 'edited' ? 'sb-aifield-edited' : ''}`}>
      <div className="sb-aifield-head"><span>{label}{required && <span className="sb-req"> *</span>}</span>{state === 'ai' && !low && <SbAiBadge state="pending" />}{state === 'edited' && <span>已由你修改</span>}{state === 'confirmed' && <SbAiBadge state="confirmed" />}{low && <span>AI 不确定，请核对</span>}</div>
      <Input value={low ? '' : value} status={error ? 'error' : undefined} readOnly={state === 'confirmed'} placeholder={low ? '请从候选里选或直接填写' : undefined} onChange={(e) => onChange?.(e.target.value)} />
      {low && candidates.length > 0 && <div className="sb-filter-chips">{candidates.map((c) => <button key={c} type="button" className="sb-chip" onClick={() => onChange?.(c)}>{c}</button>)}</div>}
      <div className="sb-aifield-foot">
        {error && <span style={{ color: 'var(--ui-danger)' }}>{error}</span>}
        {state === 'ai' && !low && onConfirm && <Button size="small" type="link" onClick={onConfirm}>确认</Button>}
        {state === 'edited' && aiValue != null && <span>AI 建议：{aiValue}<Button size="small" type="link" onClick={onRestore}>恢复</Button></span>}
      </div>
    </div>
  );
}
