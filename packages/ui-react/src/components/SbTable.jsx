import React from 'react';
import { Table } from 'antd';
import { SbStatePanel } from './SbStatePanel.jsx';
import { SbPagination } from './SbPagination.jsx';
/**
 * 表格（C-05、C-06）：封装 antd Table。操作列固定在右，空态、失败、无权限用 SbStatePanel，分页用 SbPagination。
 * state: normal | loading | empty | error | forbidden；缺失值由列自己写「未登记」，不写 0。
 * columns 里的 sorter 原样透传（antd 原生排序，没写 sortDirections 时默认升、降两档，不回到无序）；
 * rowSelection 原样透传（勾选行，onChange 回选中 keys 与行），有操作列时勾选列仍在最左。
 */
const SORT_DIRECTIONS = ['ascend', 'descend'];
export function SbTable({ columns = [], rows = [], rowKey = 'id', state = 'normal', emptyTitle, emptyDescription, onRetry, onClear, actions, actionsWidth = 120, pagination, expandable, density = 'default', onRowClick, scrollX, showHeader = true, rowSelection, onChange, className = '' }) {
  const sortable = columns.map((c) => (c && c.sorter && !c.sortDirections ? { ...c, sortDirections: SORT_DIRECTIONS } : c));
  const cols = actions ? [...sortable, { title: '操作', key: 'sb-actions', fixed: 'right', width: actionsWidth, render: (_, row) => actions(row) }] : sortable;
  const empty = state === 'normal' && rows.length === 0 ? 'empty' : state;
  const panel = empty !== 'normal' && empty !== 'loading' ? <SbStatePanel state={empty} title={emptyTitle} description={emptyDescription} onRetry={onRetry} onClear={onClear} /> : null;
  return (
    <div className={`sb-table sb-table-${density} ${onRowClick ? 'sb-table-clickable' : ''} ${className}`}>
      <Table columns={cols} dataSource={panel ? [] : rows} rowKey={rowKey} loading={state === 'loading'} pagination={false} size={density === 'compact' ? 'small' : 'middle'} expandable={expandable} showHeader={showHeader} scroll={scrollX ? { x: scrollX } : undefined} locale={{ emptyText: panel || ' ' }} rowSelection={rowSelection} onChange={onChange} onRow={onRowClick ? (row) => ({ onClick: () => onRowClick(row) }) : undefined} />
      {pagination && rows.length > 0 && <div className="sb-table-foot"><SbPagination {...pagination} /></div>}
    </div>
  );
}
