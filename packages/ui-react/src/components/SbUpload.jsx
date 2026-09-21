import React, { useRef, useState } from 'react';
import { Upload, Button } from 'antd';
import { SbIcon } from './SbIcon.jsx';
/**
 * 附件上传（C-02、C-06）：antd Upload 薄壳，列表型；drag 为 true 用拖拽区。
 * 文件对象统一 { uid, name, size, status: uploading | done | error, url }。
 * 超类型、超大小、超数量都不弹 toast，就地一行红字说明并保留已选的其余文件；
 * request(file) 返回 Promise<{ url }> 时走真实上传，不传就只维护本地列表（页面自己在提交时上传）。
 * hint 默认按 accept 与 maxSize 生成「支持 pdf、jpg，单个不超过 20MB」。
 */
const fmtSize = (bytes = 0) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`);
const extsOf = (accept = '') => accept.split(',').map((s) => s.trim().replace(/^\./, '').toLowerCase()).filter(Boolean);
const defaultHint = (accept, maxSize) => {
  const parts = [];
  const exts = extsOf(accept).filter((e) => !e.includes('/'));
  if (exts.length) parts.push(`支持 ${exts.join('、')}`);
  if (maxSize) parts.push(`单个不超过 ${maxSize}MB`);
  return parts.join('，');
};
const matchAccept = (file, accept) => {
  if (!accept) return true;
  const name = (file.name || '').toLowerCase(), type = file.type || '';
  return accept.split(',').some((raw) => {
    const a = raw.trim().toLowerCase();
    if (!a) return false;
    if (a.startsWith('.')) return name.endsWith(a);
    if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1));
    if (a.includes('/')) return type === a;
    return name.endsWith(`.${a}`);
  });
};

export function SbUpload({ accept, maxSize, maxCount, multiple = false, value, fileList, onChange, onRemove, request, disabled = false, hint, drag = false, label = '上传附件', className = '' }) {
  const [inner, setInner] = useState([]);
  const [error, setError] = useState('');
  const controlled = value !== undefined || fileList !== undefined;
  const list = (controlled ? (value ?? fileList) : inner) || [];
  const emit = (next) => { if (!controlled) setInner(next); onChange?.(next); };
  const normalize = (f) => ({ uid: f.uid, name: f.name, size: f.size, status: f.status === 'removed' ? 'done' : (f.status || 'done'), url: f.url ?? f.response?.url });

  // 同一批文件逐个进来：第一个先清上一批的说明，之后的问题追加成一行
  const batchRef = useRef({ problems: [], accepted: 0 });
  const beforeUpload = (file, batch) => {
    const b = batchRef.current;
    if (batch.indexOf(file) === 0) { b.problems = []; b.accepted = 0; }
    let problem = '';
    if (!matchAccept(file, accept)) problem = `「${file.name}」类型不支持`;
    else if (maxSize && file.size > maxSize * 1024 * 1024) problem = `「${file.name}」${fmtSize(file.size)}，超过 ${maxSize}MB`;
    else if (maxCount && list.length + b.accepted + 1 > maxCount) problem = `最多 ${maxCount} 个文件，「${file.name}」没有加入`;
    if (problem) b.problems.push(problem); else b.accepted += 1;
    setError(b.problems.join('；'));
    if (problem) return Upload.LIST_IGNORE;
    return request ? true : false;
  };
  const customRequest = ({ file, onSuccess, onError }) => {
    Promise.resolve(request(file)).then((res) => onSuccess(res || {}), (err) => onError(err || new Error('上传失败')));
  };
  const handleChange = ({ fileList: fl }) => {
    const next = fl.map(normalize);
    if (!request) next.forEach((f) => { if (f.status === 'uploading') f.status = 'done'; });
    emit(next);
  };
  const handleRemove = (file) => { onRemove?.(normalize(file)); return true; };
  const full = !!maxCount && list.length >= maxCount;
  const common = { accept, multiple, disabled: disabled || full, fileList: list, beforeUpload, onChange: handleChange, onRemove: handleRemove, customRequest: request ? customRequest : undefined, className: 'sb-upload-inner', showUploadList: { showRemoveIcon: !disabled } };
  const hintText = hint ?? defaultHint(accept, maxSize);
  return (
    <div className={`sb-upload ${drag ? 'sb-upload-drag' : ''} ${className}`}>
      {drag
        ? <Upload.Dragger {...common}><p className="sb-upload-drag-title"><SbIcon name="export" size="lg" tone="muted" /> 拖到这里，或点击选择文件</p>{hintText && <p className="sb-upload-hint">{hintText}</p>}</Upload.Dragger>
        : <Upload {...common}><Button icon={<SbIcon name="add" />} disabled={disabled || full}>{label}</Button>{hintText && <span className="sb-upload-hint">{hintText}</span>}</Upload>}
      {error && <p className="sb-upload-error" role="alert">{error}</p>}
      {full && !error && <p className="sb-upload-hint">已到 {maxCount} 个上限，删除后才能再加</p>}
    </div>
  );
}
