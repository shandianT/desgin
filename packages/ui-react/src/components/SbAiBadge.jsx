import React from 'react';
const TEXT = { generating: 'AI 生成中…', pending: 'AI 生成，待确认', confirmed: '由 AI 起草，已确认' };
/** AI 标识（A-02）：持续显示、含「AI」与「生成」字样、不只靠图标或颜色。state: generating | pending | confirmed；confirmedBy 归档后写谁确认。 */
export function SbAiBadge({ state = 'pending', confirmedBy, text }) {
  const label = text || (state === 'confirmed' && confirmedBy ? `由 AI 起草，${confirmedBy}确认` : TEXT[state]);
  return <span className={`sb-ai sb-ai-${state}`} role="status"><i aria-hidden="true">AI</i>{label}</span>;
}
