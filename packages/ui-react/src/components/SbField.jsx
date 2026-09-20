import React from 'react';
import { Form } from 'antd';
/** 表单项（C-02）：标签常显、必填标记、错误就地、只读态。children 是 antd 的 Input、Select、DatePicker 等。 */
export function SbField({ label, name, required = false, error, help, readOnly = false, children, rules }) {
  const status = error ? 'error' : undefined;
  return (
    <Form.Item label={label} name={name} required={required} rules={rules} validateStatus={status} help={error || help} layout="vertical">
      {readOnly ? <div style={{ minHeight: 'var(--ui-field-height)', display: 'flex', alignItems: 'center', color: 'var(--ui-secondary)' }}>{children?.props?.value ?? '—'}</div> : children}
    </Form.Item>
  );
}
