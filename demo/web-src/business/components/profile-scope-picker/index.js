const access = require('../../utils/access');
Component({
  properties: { modes: Array, members: Array, teams: Array, mode: String, memberId: String, teamId: String, defaultTeamId: String, label: String, loading: Boolean, error: String },
  data: { open: false, selecting: 'person', personSelected: [] },
  observers: { 'members,teams,memberId,teamId,mode': function () { this.close(); this.setData({personSelected: this.properties.memberId ? [this.properties.memberId] : []}); } },
  pageLifetimes: { hide() { this.close(); } },
  methods: {
    noop() {},
    switchMode(event) {
      const mode = event.currentTarget.dataset.mode;
      if (!(this.properties.modes || []).some(row => row.value === mode)) return;
      this.close(); this.triggerEvent('modechange', {mode});
    },
    show() {
      this._pickerIdentity=access.identity(getApp().globalData.session);
      this.triggerEvent('visibilitychange', {open: true});
      this.setData({open: true, selecting: this.properties.mode === 'team' ? 'team' : 'person', personSelected: this.properties.memberId ? [this.properties.memberId] : []});
    },
    close() { if (!this.data.open) return; this.setData({open: false}); this.triggerEvent('visibilitychange', {open: false}); },
    select(event) {
      if(!this.data.open || this._pickerIdentity!==access.identity(getApp().globalData.session) || this.properties.loading || this.properties.error)return;
      const id = event.currentTarget.dataset.id, kind = this.data.selecting;
      const rows = kind === 'team' ? this.properties.teams : this.properties.members;
      if (!(rows || []).some(row => row.id === id)) return;
      this.close(); this.triggerEvent('subjectchange', {kind, id});
    },
    confirmPerson(event) {
      if(!this.data.open || this.data.selecting!=='person' || this._pickerIdentity!==access.identity(getApp().globalData.session))return;
      const ids = event.detail.ids;
      if (!Array.isArray(ids) || ids.length !== 1 || this.properties.loading || this.properties.error) return;
      this.select({currentTarget: {dataset: {id: ids[0]}}});
    },
    retry() { this.triggerEvent('retry'); },
  },
});
