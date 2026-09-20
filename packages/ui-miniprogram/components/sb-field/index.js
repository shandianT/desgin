Component({
  options: { addGlobalClass: true },
  properties: { label: String, required: { type: Boolean, value: false }, error: String, help: String, readOnly: { type: Boolean, value: false }, value: String },
});
