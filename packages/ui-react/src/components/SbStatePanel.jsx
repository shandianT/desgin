import React from 'react';
import { Button, Skeleton, Spin } from 'antd';
/**
 * 四态一个组件（C-06）：loading、empty、error、forbidden；state 为 normal 时渲染 children。
 * error 的重试不清筛选；forbidden 不显示对象名称。
 */
export function SbStatePanel({ state = 'normal', title, description, onRetry, onClear, skeleton = false, children }) {
  if (state === 'normal') return children ?? null;
  if (state === 'loading') return skeleton ? <Skeleton active paragraph={{ rows: 4 }} /> : <div className="sb-state" role="status"><Spin /><p>{title || '正在加载…'}</p>{description && <p className="sb-state-note">{description}</p>}</div>;
  if (state === 'empty') return <div className="sb-state"><h4>{title || '没有匹配的记录'}</h4><p>{description || '换一个条件试试，或清除全部条件。'}</p>{onClear && <Button onClick={onClear}>清除条件</Button>}</div>;
  if (state === 'error') return <div className="sb-state" role="alert"><h4>{title || '加载失败'}</h4><p>{description || '网络或服务暂时不可用。'}</p>{onRetry && <Button type="primary" onClick={onRetry}>重试</Button>}<p className="sb-state-note">重试不会清除已选条件</p></div>;
  if (state === 'forbidden') return <div className="sb-state"><h4>{title || '暂无查看权限'}</h4><p>{description || '不在你的授权范围内，或权限已变化。这里不显示对象信息。'}</p></div>;
  return null;
}
