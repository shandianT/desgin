import React from 'react';
import { Sources } from '@ant-design/x';
/** AI 结论的依据（A-03）：每条可点开到原始记录；默认折叠。items: [{key,title,description,url}] */
export function SbAiSources({ items = [], title, onClick, defaultExpanded = false }) {
  if (!items.length) return <span className="sb-state-note">没有可展示的依据，此结论不应展示（A-03）</span>;
  return <Sources title={title || `依据 ${items.length} 条`} items={items} onClick={onClick} defaultExpanded={defaultExpanded} />;
}
