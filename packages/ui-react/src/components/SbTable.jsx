import React from 'react';
import { Table } from 'antd';
import { SbStatePanel } from './SbStatePanel.jsx';
import { SbPagination } from './SbPagination.jsx';
/**
 * 表格（C-05、C-06）：封装 antd Table。操作列固定在右，空态、失败、无权限用 SbStatePanel，分页用 SbPagination。
 * state: normal | loading | empty | error | forbidden；缺失值由列自己写「未登记」，不写 0。
 */
export function SbTable({ columns = [], rows = [], rowKey = 'id', state = 'normal', emptyTitle, emptyDescription, onRetry, onClear, actions, actionsWidth = 120, pagination, expandable, density = 'default', onRowClick, scrollX, showHeader = true, className = '' }) {
  const cols = actions ? [...columns, { title: '操作', key: 'sb-actions', fixed: 'right', width: actionsWidth, render: (_, row) => actions(row) }] : columns;
  const empty = state === 'normal' && rows.length === 0 ? 'empty' : state;
  const panel = empty !== 'normal' && empty !== 'loading' ? <SbStatePanel state={empty} title={emptyTitle} description={emptyDescription} onRetry={onRetry} onClear={onClear} /> : null;
  return (
    <div className={`sb-table sb-table-${density} ${onRowClick ? 'sb-table-clickable' : ''} ${className}`}>
      <Table columns={cols} dataSource={panel ? [] : rows} rowKey={rowKey} loading={state === 'loading'} pagination={false} size={density === 'compact' ? 'small' : 'middle'} expandable={expandable} showHeader={showHeader} scroll={scrollX ? { x: scrollX } : undefined} locale={{ emptyText: panel || ' ' }} onRow={onRowClick ? (row) => ({ onClick: () => onRowClick(row) }) : undefined} />
      {pagination && rows.length > 0 && <div className="sb-table-foot"><SbPagination {...pagination} /></div>}
    </div>
  );
}
