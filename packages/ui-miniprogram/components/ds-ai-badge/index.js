Component({
  options: { addGlobalClass: true },
  properties: {
    state: { type: String },
    confirmedBy: { type: String },
    text: { type: String }
  },
  methods: {
    // 仅转发属性，不新增业务逻辑
  }
});
