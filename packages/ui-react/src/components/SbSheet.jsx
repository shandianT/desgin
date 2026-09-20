import React from 'react';
import { Drawer } from 'antd';
/** 底部弹层（C-07）：标题、关闭、取消；不替代页面级返回。 */
export function SbSheet({ open, title, onClose, children, footer, height = 'auto' }) {
  return <Drawer open={open} title={title} placement="bottom" height={height} onClose={onClose} footer={footer} destroyOnHidden>{children}</Drawer>;
}
