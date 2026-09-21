// 附件上传（C-02、C-06）：t-upload 薄壳，列表型。文件对象与 Web 端一致 { uid, name, size, status: uploading | done | error, url }，
// 内部再换成 t-upload 认的 loading | done | failed。超类型、超大小、超数量不弹 toast，就地一行红字说明并保留其余文件；
// 不传 requestMethod 时只维护本地列表（页面提交时再 wx.uploadFile），事件 change（files）、remove（file）。
// hint 默认按 accept 与 maxSize 生成「支持 pdf、jpg，单个不超过 20MB」；accept 里有非图片类型就从聊天文件选（messageFile），否则从相册选。
const TO_T = { uploading: 'loading', done: 'done', error: 'failed' };
const FROM_T = { loading: 'uploading', done: 'done', failed: 'error', reload: 'error' };
const IMG = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'];
const exts = (accept) => String(accept || '').split(',').map((s) => s.trim().replace(/^\./, '').toLowerCase()).filter(Boolean);
const extOf = (name) => { const s = String(name || ''); const i = s.lastIndexOf('.'); return i < 0 ? '' : s.slice(i + 1).toLowerCase(); };
const fmt = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: { accept: String, maxSize: { type: Number, value: 0 }, maxCount: { type: Number, value: 0 }, multiple: { type: Boolean, value: false }, value: { type: Array, value: [] }, disabled: { type: Boolean, value: false }, hint: String, label: { type: String, value: '上传附件' }, requestMethod: { type: null } },
  data: { tFiles: [], hintText: '', error: '', source: 'media', mediaType: ['image'], full: false },
  observers: {
    'value, maxCount'(value, maxCount) { const list = value || []; this.setData({ tFiles: list.map((f) => Object.assign({}, f, { status: TO_T[f.status] || 'done', url: f.url || f.uid })), full: !!maxCount && list.length >= maxCount }); },
    'accept, maxSize, hint'(accept, maxSize, hint) {
      const es = exts(accept); const parts = [];
      if (es.length) parts.push(`支持 ${es.join('、')}`);
      if (maxSize) parts.push(`单个不超过 ${maxSize}MB`);
      this.setData({ hintText: hint || parts.join('，'), source: es.some((e) => !IMG.includes(e)) ? 'messageFile' : 'media' });
    },
  },
  methods: {
    // 选完文件（t-upload 已按 max 截断数量）：这里再按类型与大小过滤，超限的写进 error，其余照常加入
    onSuccess(e) {
      const { accept, maxSize, maxCount, value } = this.data; const es = exts(accept); const cur = value || [];
      const known = new Set(cur.map((f) => f.uid));
      const problems = []; const added = [];
      (e.detail.files || []).forEach((f) => {
        if (known.has(f.url) || known.has(f.uid)) return;
        if (es.length && !es.includes(extOf(f.name))) { problems.push(`「${f.name}」类型不支持`); return; }
        if (maxSize && f.size > maxSize * 1048576) { problems.push(`「${f.name}」${fmt(f.size)}，超过 ${maxSize}MB`); return; }
        if (maxCount && cur.length + added.length >= maxCount) { problems.push(`最多 ${maxCount} 个文件，「${f.name}」没有加入`); return; }
        added.push({ uid: f.url, name: f.name, size: f.size, status: this.data.requestMethod ? 'done' : 'done', url: f.url, type: f.type });
      });
      this.setData({ error: problems.join('；') });
      if (added.length) this.triggerEvent('change', { files: cur.concat(added), added });
    },
    onFail() { this.setData({ error: '选取文件失败，请再试一次' }); },
    onRemove(e) {
      const cur = this.data.value || []; const idx = e.detail.index; const file = cur[idx];
      this.setData({ error: '' });
      this.triggerEvent('remove', { file, index: idx });
      this.triggerEvent('change', { files: cur.filter((_, i) => i !== idx) });
    },
  },
});
