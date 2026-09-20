import React from 'react';
import { Tooltip } from 'antd';
const TONES = { good: '向好', watch: '需关注', bad: '转差', pending: '待评估', unset: '未登记' };
/** 红黄绿灰状态标签。必带文字，可带依据（B-01）。tone: good | watch | bad | pending | unset */
export function SbStatusTag({ tone = 'pending', label, reason, showReason = false }) {
  const text = label || TONES[tone] || tone;
  const node = <span className={`sb-tag sb-tag-${tone}`}>{tone !== 'unset' && '● '}{text}{showReason && reason ? <span className="sb-tag-reason">· {reason}</span> : null}</span>;
  return reason && !showReason ? <Tooltip title={reason}>{node}</Tooltip> : node;
}
