import React, { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Input, Popover, Select } from 'antd';
import { SbIcon } from './SbIcon.jsx';

function ConfirmedMultiple({ label, value, options, onChange, placeholder, disabled, width, className }) {
  const selected = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);
  const [query, setQuery] = useState('');
  const trigger = useRef(null);
  const search = useRef(null);
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => trigger.current?.focus());
  };
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    if (!open) return undefined;
    const escape = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); } };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [open]);
  const summary = !selected.length ? placeholder : selected.length === 1
    ? options.find(o => o.value === selected[0])?.label ?? selected[0] : `已选 ${selected.length} 项`;
  const content = <div className="sb-multifilter" role="dialog" aria-label={`${label}筛选`} onKeyDown={e => {
    if (e.key !== 'Tab') return;
    const controls = [...e.currentTarget.querySelectorAll('input:not(:disabled), button:not(:disabled)')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }}>
    <Input ref={search} aria-label={`搜索${label}`} placeholder="搜索选项" value={query} allowClear onChange={e => setQuery(e.target.value)} />
    <div className="sb-multifilter-options" role="group" aria-label={`${label}选项`} onKeyDown={e => {
      if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const inputs = [...e.currentTarget.querySelectorAll('input[type=checkbox]:not(:disabled)')];
      const index = inputs.indexOf(document.activeElement);
      if (inputs.length) { e.preventDefault(); inputs[(index + (e.key === 'ArrowDown' ? 1 : -1) + inputs.length) % inputs.length].focus(); }
    }}>
      {options.filter(o => String(o.label).toLowerCase().includes(query.trim().toLowerCase())).map(o =>
        <Checkbox key={o.value} checked={draft.includes(o.value)} disabled={o.disabled} onChange={e => setDraft(current => e.target.checked ? [...current, o.value] : current.filter(v => v !== o.value))}>
          {o.label}{o.count != null ? `（${o.count}）` : ''}
        </Checkbox>)}
      {!options.some(o => String(o.label).toLowerCase().includes(query.trim().toLowerCase())) && <span className="sb-multifilter-empty">没有匹配选项</span>}
    </div>
    <div className="sb-multifilter-footer">
      <Button type="text" onClick={() => setDraft([])}>清空</Button>
      <Button onClick={() => close(true)}>取消</Button>
      <Button type="primary" onClick={() => { onChange?.(draft); close(true); }}>应用</Button>
    </div>
  </div>;
  return <Popover trigger="click" placement="bottomLeft" open={open} content={content}
    onOpenChange={next => { if (next && !disabled) { setDraft([...selected]); setQuery(''); setOpen(true); } else close(); }}
    afterOpenChange={next => { if (next) search.current?.focus(); }}>
    <Button ref={trigger} className={`sb-lselect sb-lselect-confirm ${className}`} style={width ? { width } : undefined}
      disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-label={`${label}：${summary}`}>
      <span className="sb-lselect-label">{label}</span><span className="sb-multifilter-summary">{summary}</span><SbIcon name="expand" />
    </Button>
  </Popover>;
}
/**
 * 带标签的下拉筛选（C-04）：标签在框内左侧，值在右侧；没选时显示「全部」，清空回到「全部」。
 * 选项少于 6 个优先用 SbFilterBar 的筛选片；多于 6 个或多组并排时用这个。
 */
export function SbLabeledSelect({ label, value, options = [], onChange, placeholder = '全部', allowClear = true, disabled = false, mode, confirmMultiple = true, width, className = '' }) {
  if (mode === 'multiple' && confirmMultiple) return <ConfirmedMultiple {...{ label, value, options, onChange, placeholder, disabled, width, className }} />;
  return (
    <label className={`sb-lselect ${disabled ? 'sb-lselect-disabled' : ''} ${className}`} style={width ? { width } : undefined}>
      <span className="sb-lselect-label">{label}</span>
      <Select className="sb-lselect-control" variant="borderless" value={value ?? undefined} onChange={(v) => onChange?.(v)} options={options.map((o) => ({ value: o.value, label: o.count != null ? `${o.label}（${o.count}）` : o.label, disabled: o.disabled }))} placeholder={placeholder} allowClear={allowClear} disabled={disabled} mode={mode} popupMatchSelectWidth={false} />
    </label>
  );
}
