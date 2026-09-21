const NAMES = require('./names.js');
const SIZE = { sm: '32rpx', md: '40rpx', lg: '48rpx' };
/**
 * 图标（10 章）：传含义名（customer、visit、risk…），两端同一张表；尺寸三档；颜色跟文字或语义色；tile 带底色方块。
 */
Component({
  options: { addGlobalClass: true },
  properties: { name: String, size: { type: String, value: 'sm' }, tone: { type: String, value: 'default' }, tile: { type: Boolean, value: false }, label: String },
  data: { icon: '', px: '32rpx' },
  observers: {
    'name, size'(name, size) {
      const icon = NAMES[name] || '';
      if (!icon && name) console.warn(`sb-icon：没有叫「${name}」的图标，见 components/sb-icon/names.js`);
      this.setData({ icon, px: SIZE[size] || SIZE.sm });
    },
  },
});
