Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String },
    placeholder: { type: String },
    clearable: { type: Boolean },
    loading: { type: Boolean },
    disabled: { type: Boolean },
    maxlength: { type: Number },
    plain: { type: Boolean }
  },
  methods: {
    onChange(event) { this.triggerEvent('change', event.detail); },
    onSearch(event) { this.triggerEvent('search', event.detail); },
    onClear(event) { this.triggerEvent('clear', event.detail); }
  }
});
