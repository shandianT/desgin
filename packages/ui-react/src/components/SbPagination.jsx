import React from 'react';
import { Pagination } from 'antd';
/** 分页：显示总数，末页禁用下一页。 */
export function SbPagination({ current = 1, total = 0, pageSize = 20, onChange }) {
  return <Pagination current={current} total={total} pageSize={pageSize} onChange={onChange} showSizeChanger={false} showTotal={(t) => `共 ${t} 条`} />;
}
