import React from 'react';
import { Result, Button } from 'antd';
/**
 * 操作结果整页（C-01、C-06、B-01）：antd Result 薄壳。归档成功、提交失败、需要补充这类整页反馈。
 * status: success | error | info | warning；图标色只走 --ui-success / danger / primary / warning。
 * primary 一个主按钮，secondary 一个次按钮，extra 放补充内容（比如 SbMetricStrip 三个数字）。
 * 拜访归档成功页以后可以直接换成它：status=success，primary「查看客户」，secondary「再记一条」。
 */
export function SbResult({ status = 'info', title, description, primary, secondary, extra, className = '' }) {
  const s = ['success', 'error', 'info', 'warning'].includes(status) ? status : 'info';
  const actions = (primary || secondary) && (
    <div className="sb-result-actions">
      {primary && <Button type="primary" size="large" loading={primary.loading} disabled={primary.disabled} onClick={primary.onClick}>{primary.label}</Button>}
      {secondary && <Button size="large" disabled={secondary.disabled} onClick={secondary.onClick}>{secondary.label}</Button>}
    </div>
  );
  return (
    <Result className={`sb-result sb-result-${s} ${className}`} status={s} title={title} subTitle={description} extra={actions || undefined}>
      {extra ? <div className="sb-result-extra">{extra}</div> : null}
    </Result>
  );
}
