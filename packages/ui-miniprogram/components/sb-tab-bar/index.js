/** 底部标签栏（T-01）：t-tab-bar 薄壳，默认五个 Tab（总览、客户、商机、拜访、我的），选中主色由桥接文件给。不做 wx.switchTab，页面接 change 自己跳。事件 change：{ value, item } */
const NAMES = require('../sb-icon/names.js');
const DEFAULT_ITEMS = [
  { key: 'home', label: '总览', icon: 'dashboard', pagePath: 'pages/index/index' },
  { key: 'customers', label: '客户', icon: 'customer', pagePath: 'pages/customers/index' },
  { key: 'opportunities', label: '商机', icon: 'opportunity', pagePath: 'pages/workbench/index' },
  { key: 'visits', label: '拜访', icon: 'visit', pagePath: 'pages/visit-entry/index' },
  { key: 'me', label: '我的', icon: 'user', pagePath: 'pages/profile/index' },
];
Component({
  options: { addGlobalClass: true },
  properties: { items: { type: Array, value: [] }, value: { type: null, value: null }, fixed: { type: Boolean, value: true }, safeArea: { type: Boolean, value: true } },
  data: { list: [] },
  lifetimes: { attached() { this.build(this.data.items); } },
  observers: { items(items) { this.build(items); } },
  methods: {
    build(items) { const src = items && items.length ? items : DEFAULT_ITEMS; this.setData({ list: src.map((t) => ({ ...t, iconName: NAMES[t.icon] || t.icon || '' })) }); },
    onChange(e) { const value = e.detail.value; const item = this.data.list.find((t) => t.key === value) || null; if (value !== this.data.value) this.triggerEvent('change', { value, item }); },
  },
});
