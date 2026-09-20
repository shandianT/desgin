const NOTE = { running: '取消后保留已生成的字段', cancelled: '已取消，已生成的字段已保留', failed: '生成失败，已识别的部分已保留', done: '完成' };
const BAR = { failed: 'var(--ui-danger)', cancelled: 'var(--ui-muted)' };
Component({
  options: { addGlobalClass: true },
  properties: { stages: { type: Array, value: [] }, current: { type: Number, value: 0 }, status: { type: String, value: 'running' }, detail: String },
  data: { percent: 0, note: '', bar: '', rows: [] },
  observers: {
    'stages, current, status, detail'(stages, current, status, detail) {
      const list = stages || []; const n = list.length; const done = status === 'done';
      const percent = n ? Math.round(((done ? n : current) / n) * 100) : 0;
      const rows = list.map((name, i) => ({ name, state: done || i < current ? 'done' : i === current ? 'current' : 'todo', detail: i === current && !done && detail ? detail : '' }));
      this.setData({ percent, rows, note: NOTE[status] || '', bar: BAR[status] || '' });
    },
  },
  methods: { onCancel() { this.triggerEvent('cancel'); }, onRetry() { this.triggerEvent('retry'); } },
});
