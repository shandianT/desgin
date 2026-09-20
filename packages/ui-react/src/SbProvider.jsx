import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { XProvider } from '@ant-design/x';
import bridge from '../../../specs/salesbuddy/02-设计变量与同步链路/dist/bridge-antd.theme.json';
import './styles.css';

/** 一次注入主题：antd 的 token 来自 bridge-antd.theme.json（由 tokens.json 生成），页面另需引入 dist/design-tokens.css。 */
export function SbProvider({ children, theme }) {
  const merged = { token: { ...bridge.token, ...(theme?.token || {}) }, cssVar: { prefix: bridge.cssVar?.prefix || 'ant' }, components: theme?.components };
  return (
    <ConfigProvider locale={zhCN} theme={merged}>
      <XProvider theme={merged}>{children}</XProvider>
    </ConfigProvider>
  );
}
