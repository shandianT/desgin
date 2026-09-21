import React from 'react';
import { Input } from 'antd';
/** 多行文本（C-02）：antd Input.TextArea 薄壳，带字数（默认上限 500），高度随内容 3～8 行。拜访口述、任务说明、拒绝意见都用它。 */
export function SbTextarea({ value, onChange, maxLength = 500, showCount = true, autoSize = { minRows: 3, maxRows: 8 }, placeholder, disabled = false, readOnly = false, className = '', ...rest }) {
  return <Input.TextArea className={`sb-textarea ${className}`} value={value} onChange={(e) => onChange?.(e.target.value, e)} maxLength={maxLength} showCount={showCount} autoSize={autoSize} placeholder={placeholder} disabled={disabled} readOnly={readOnly} {...rest} />;
}
