Component({
  options: { addGlobalClass: true },
  properties: {
    tone: { type: String },
    label: { type: String },
    reason: { type: String },
    showReason: { type: Boolean }
  },
  methods: {
    // 仅转发属性，不新增业务逻辑
  }
});
