// advice：Agent 给的建议，只供参考、不需要逐条确认（经营建议、下一步提示）
const TEXT = { generating: 'AI 生成中…', pending: 'AI 生成，待确认', confirmed: '由 AI 起草，已确认', advice: 'AI 建议，仅供参考' };
Component({
  options: { addGlobalClass: true },
  properties: { state: { type: String, value: 'pending' }, confirmedBy: String, text: String },
  data: { label: '' },
  observers: { 'state, confirmedBy, text'(state, by, text) { this.setData({ label: text || (state === 'confirmed' && by ? `由 AI 起草，${by}确认` : TEXT[state] || '') }); } },
});
