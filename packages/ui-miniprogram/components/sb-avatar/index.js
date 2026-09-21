// 头像（V-01、V-04）：t-avatar 薄壳。没有图片就用姓名后两字（中文去姓，英文取前两个字母，空显示「我」），与 Web 端 SbAvatar 的 avatarInitials 同一规则。
// 三档 48 / 64 / 80rpx 对应 Web 的 24 / 32 / 40；底色档默认主色淡底，颜色只走变量。
const SIZE = { sm: '48rpx', md: '64rpx', lg: '80rpx' };
function initials(name) {
  const s = String(name == null ? '' : name).replace(/\s+/g, '');
  if (!s) return '我';
  if (/^[A-Za-z0-9._-]+$/.test(s)) return s.slice(0, 2).toUpperCase();
  return s.length <= 2 ? s : s.slice(-2);
}
Component({
  options: { addGlobalClass: true },
  properties: { name: String, src: String, size: { type: String, value: 'md' }, tone: { type: String, value: 'primary' }, shape: { type: String, value: 'circle' } },
  data: { text: '我', px: '64rpx' },
  observers: { 'name, size'(name, size) { this.setData({ text: initials(name), px: SIZE[size] || SIZE.md }); } },
  methods: { onTap() { this.triggerEvent('tap', { name: this.data.name }); } },
});
