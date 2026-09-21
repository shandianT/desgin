import React from 'react';
import { Avatar } from 'antd';
/**
 * 头像（V-01、V-04）：antd Avatar 薄壳。没有图片就用姓名的后两个字（中文名去掉姓，英文名取前两个字母），
 * 底色只走语义变量的淡底档（默认主色淡底），三档尺寸 24 / 32 / 40 与小程序 48 / 64 / 80rpx 对应。
 * SbSideNav 的账号头像也用它，取字逻辑 avatarInitials 两处共用。
 */
const SIZE = { sm: 24, md: 32, lg: 40 };

/** 姓名取字：中文取后两字（王小明 → 小明），两字以内原样；拉丁字母取前两个大写；空名显示「我」。 */
export function avatarInitials(name = '') {
  const s = String(name ?? '').replace(/\s+/g, '');
  if (!s) return '我';
  if (/^[A-Za-z0-9._-]+$/.test(s)) return s.slice(0, 2).toUpperCase();
  return s.length <= 2 ? s : s.slice(-2);
}

export function SbAvatar({ name, src, size = 'md', tone = 'primary', shape = 'circle', alt, className = '', ...rest }) {
  const px = SIZE[size] || SIZE.md;
  const text = avatarInitials(name);
  return (
    <Avatar className={`sb-avatar sb-avatar-${tone} sb-avatar-${size} ${className}`} size={px} shape={shape} src={src || undefined} alt={alt || name || ''} title={name} {...rest}>
      {text}
    </Avatar>
  );
}
