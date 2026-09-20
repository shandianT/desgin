import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
/**
 * 导航、列表、详情三段响应式（T-03、X-02、X-03）：宽度 >900 三栏；601～900 图标导航加列表或详情二选一；≤600 底部导航，详情整页进入。
 * 档位按容器自身宽度判断。detailOpen 控制窄屏下显示列表还是详情；返回不清列表状态由使用方保证。
 */
export function SbDetailLayout({ nav, list, detail, detailOpen = false, onBack, tier: forced }) {
  const ref = useRef(null); const [tier, setTier] = useState(forced || 'desktop');
  useEffect(() => { if (forced) { setTier(forced); return; } const el = ref.current; if (!el || !window.ResizeObserver) return; const ro = new ResizeObserver(([e]) => { const w = e.contentRect.width; setTier(w > 900 ? 'desktop' : w > 600 ? 'rail' : 'mobile'); }); ro.observe(el); return () => ro.disconnect(); }, [forced]);
  const showDetail = tier === 'desktop' || detailOpen;
  const showList = tier === 'desktop' || !detailOpen;
  return (
    <div className="sb-layout" data-tier={tier} ref={ref}>
      <div className="sb-layout-nav">{nav}</div>
      {showList && <div className="sb-layout-list">{list}</div>}
      {showDetail && <div className="sb-layout-detail">{tier !== 'desktop' && <div className="sb-layout-back"><Button size="small" onClick={onBack}>‹ 返回</Button><span>返回后保留搜索、筛选与位置</span></div>}{detail}</div>}
    </div>
  );
}
