import React, { useEffect, useRef, useState } from 'react';
import { Select, Spin } from 'antd';
import { sbSelectOptions } from './SbSelect.jsx';
/**
 * 搜索选择（C-02、C-06）：选客户、选人用。antd Select showSearch 加远程搜索：search(keyword) 返回 Promise<options>，防抖 300ms；
 * 也可传静态 options 本地过滤。下拉里的三种提示文字：「输入关键词搜索」「正在搜索」「没有匹配」。
 */
export function SbSearchSelect({ value, onChange, search, options: staticOptions, debounce = 300, placeholder = '输入关键词搜索', allowClear = true, disabled = false, width, mode, minLength = 1, className = '', ...rest }) {
  const [options, setOptions] = useState(staticOptions || []);
  const [state, setState] = useState('idle');
  const timer = useRef(null), seq = useRef(0);
  useEffect(() => { if (!search) setOptions(staticOptions || []); }, [staticOptions, search]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = (kw) => {
    const id = ++seq.current;
    setState('loading');
    Promise.resolve(search(kw)).then((list) => { if (id !== seq.current) return; setOptions(list || []); setState(list?.length ? 'done' : 'empty'); }).catch(() => { if (id === seq.current) { setOptions([]); setState('empty'); } });
  };
  const onSearch = (kw) => {
    if (!search) return;
    clearTimeout(timer.current);
    const k = (kw || '').trim();
    if (k.length < minLength) { seq.current++; setOptions([]); setState('idle'); return; }
    timer.current = setTimeout(() => run(k), debounce);
  };
  const hint = state === 'loading' ? <span className="sb-sselect-hint"><Spin size="small" /> 正在搜索</span> : state === 'empty' ? <span className="sb-sselect-hint">没有匹配</span> : <span className="sb-sselect-hint">输入关键词搜索</span>;
  return (
    <Select className={`sb-sselect ${className}`} style={width ? { width } : undefined} showSearch value={value ?? undefined} onChange={(v, o) => onChange?.(v, o)} onSearch={onSearch}
      filterOption={search ? false : 'title'} optionFilterProp="title" options={sbSelectOptions(options)} notFoundContent={search ? hint : <span className="sb-sselect-hint">没有匹配</span>}
      loading={state === 'loading'} placeholder={placeholder} allowClear={allowClear} disabled={disabled} mode={mode} popupMatchSelectWidth={false} {...rest} />
  );
}
