Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array },
    activeKey: { type: String },
    size: { type: String },
    plain: { type: Boolean },
    fit: { type: Boolean }
  },
  methods: {
    onChange(event) { this.triggerEvent('change', event.detail); }
  }
});
