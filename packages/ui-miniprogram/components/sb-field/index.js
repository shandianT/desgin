Component({
  options: { addGlobalClass: true },
  properties: { label: String, required: { type: Boolean, value: false }, error: String, help: String, readOnly: { type: Boolean, value: false }, value: String,
    plain: { type: Boolean, value: false } }, // plain：不带白底与页边距，放进表单白卡里用，避免框套框
});
