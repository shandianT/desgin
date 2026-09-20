import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { XProvider } from '@ant-design/x';
import bridge from '@sensetime-dept/tokens/bridge-antd';
import './styles.css';

/** 一次注入主题：antd 的 token 来自 @sensetime-dept/tokens 的桥接文件（由 tokens.json 生成），页面另需引入 @sensetime-dept/tokens/css。 */
export function SbProvider({ children, theme }) {
  const merged = { token: { ...bridge.token, ...(theme?.token || {}) }, cssVar: { prefix: bridge.cssVar?.prefix || 'ant' }, components: theme?.components };
  return (
    <ConfigProvider locale={zhCN} theme={merged}>
      <XProvider theme={merged}>{children}</XProvider>
    </ConfigProvider>
  );
}
