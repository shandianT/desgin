import React from 'react';
import * as AntIcons from '@ant-design/icons';
import { ICONS } from '../icons.js';
const BY_KEY = Object.fromEntries(ICONS.map((i) => [i.key, i]));
/**
 * 图标（10 章）：传含义名（customer、visit、risk…）而不是图标库的名字，尺寸三档 sm 16／md 20／lg 24，颜色跟文字或指定语义色。
 * tile 为 true 时套一个带底色的圆角方块，用于导航、空态、指标卡。只有图标没有文字时必须给 label。
 */
export function SbIcon({ name, size = 'sm', tone = 'default', tile = false, label, className = '', style }) {
  const def = BY_KEY[name];
  const Comp = def && AntIcons[def.antd];
  if (!Comp) { if (typeof console !== 'undefined') console.warn(`SbIcon：没有叫「${name}」的图标，见 packages/ui-react/src/icons.js`); return null; }
  const icon = <Comp className={`sb-icon sb-icon-${size} sb-icon-${tone} ${tile ? '' : className}`} style={tile ? undefined : style} aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined} />;
  return tile ? <span className={`sb-icon-tile sb-icon-tile-${size} sb-icon-tile-${tone} ${className}`} style={style}>{icon}</span> : icon;
}
