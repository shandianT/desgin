import React from 'react';
import { Button, Pagination } from 'antd';
/**
 * 分页：显示总数，末页禁用下一页。传了 onPageSizeChange 才显示每页条数选择器（默认 10／20／50 三档）。
 * mode="more" 是加载更多模式：一个按钮，loading 时防重复，end 为 true 写「没有更多了」；这个模式不显示每页条数。
 */
export function SbPagination({ current = 1, total = 0, pageSize = 20, onChange, pageSizeOptions = [10, 20, 50], onPageSizeChange, mode = 'page', loading = false, end = false, onLoadMore, className = '' }) {
  if (mode === 'more') {
    return <div className={`sb-pagination sb-pagination-more ${className}`}><Button onClick={onLoadMore} loading={loading} disabled={end || loading}>{end ? '没有更多了' : loading ? '正在加载…' : '加载更多'}</Button></div>;
  }
  const sizer = typeof onPageSizeChange === 'function';
  return <Pagination className={`sb-pagination ${className}`} current={current} total={total} pageSize={pageSize} onChange={onChange} showSizeChanger={sizer} pageSizeOptions={sizer ? pageSizeOptions.map(String) : undefined} onShowSizeChange={sizer ? (page, size) => onPageSizeChange(size, page) : undefined} showLessItems showTotal={(t) => `共 ${t} 条`} />;
}
