Component({
  options: { addGlobalClass: true },
  properties: {
    title: { type: String },
    scope: { type: String },
    options: { type: Array },
    value: { type: Array },
    resultCount: { type: Number },
    resultLabel: { type: String },
    disabled: { type: Boolean }
  },
  methods: {
    onChange(event) { this.triggerEvent('change', event.detail); }
  }
});
