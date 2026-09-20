// @shandiant/tokens/bridge-antd 的类型：给 antd ConfigProvider 的 theme，由 tokens.json 生成。
import type { ThemeConfig } from 'antd';
declare const bridge: Pick<ThemeConfig, 'token' | 'cssVar'> & { token: NonNullable<ThemeConfig['token']> };
export default bridge;
