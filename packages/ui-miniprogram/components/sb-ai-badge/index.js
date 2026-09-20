const TEXT = { generating: 'AI 生成中…', pending: 'AI 生成，待确认', confirmed: '由 AI 起草，已确认' };
Component({
  options: { addGlobalClass: true },
  properties: { state: { type: String, value: 'pending' }, confirmedBy: String, text: String },
  data: { label: '' },
  observers: { 'state, confirmedBy, text'(state, by, text) { this.setData({ label: text || (state === 'confirmed' && by ? `由 AI 起草，${by}确认` : TEXT[state] || '') }); } },
});
