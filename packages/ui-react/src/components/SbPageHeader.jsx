import React from 'react';
/** 页面标题、范围名、主操作（T-02、B-05）。 */
export function SbPageHeader({ title, scope, actions }) {
  return <div className="sb-pagehead"><h1>{title}{scope && <small>范围：{scope}</small>}</h1>{actions && <div className="sb-pagehead-actions">{actions}</div>}</div>;
}
