/**
 * BACKEND-CONTRACT GET /risks/:id，POST /risks/:id/resolve {resolution_note}；前端要求 trim 后至少 5 字，返回更新完整风险。
 * 页面未按处理人 ID 限制解除按钮，后端必须按登录身份裁决；无 version_no，且 /risks/:id/resolve 不在现有幂等键白名单。
 * accepted 在页面归入已处理并隐藏解除操作，但 riskLight 仍为黄色。缺失 evidence/next_action 使用解释占位，不是模型生成事实。
 */
const { riskLight } = require('../../utils/statusLight');
const apiClient = require("../../utils/apiClient");
const access = require('../../utils/access');
const writes = require('../../utils/pageWriteContext').createPageWriteContext(() => getApp().globalData.session);

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(typeof value === "number" ? value : String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function normalizeRisk(item) {
  const status = ["resolved", "accepted"].includes(item.status) ? "resolved" : "open";
  const severityMap = { critical: "严重", high: "高", medium: "中", low: "低" };
  const evidence = Array.isArray(item.evidence) ? item.evidence.map((entry) => typeof entry === "string" ? entry : (entry.label || entry.detail || JSON.stringify(entry))) : [];
  return {
    ...item,
    signal:riskLight(item),
    customerName: item.customer_name || item.customerName || "关联客户待确认",
    owner: item.owner_name || item.owner || "待确认",
    team: item.team_name || item.team || "",
    status,
    statusLabel: item.status === "accepted" ? "已接受" : status === "resolved" ? "已解除" : "待解除",
    severity: severityMap[item.severity_code] || item.severity || "未评级",
    openedLabel: formatDate(item.opened_at || item.openedAt),
    resolvedLabel: formatDate(item.resolved_at || item.resolvedAt),
    resolvedBy: item.resolved_by_name || item.resolvedBy || "负责人",
    resolutionNote: item.resolution_note || item.resolutionNote || "未填写解除依据",
    evidence: evidence.length ? evidence : ["未登记风险依据"],
    nextAction: item.next_action || item.nextAction || "持续关注客户后续进展，必要时重新打开风险。",
    remote: Boolean(item.opened_at || item.risk_type_code),
  };
}

Page({
  data: { riskId: "", risk: null, resolutionNote: "", noteCount: 0, submitting: false, loading: false },

  onLoad(options = {}) {
    if (typeof getApp === "function" && getApp().guardPage && !getApp().guardPage(this, 'risk-detail', options)) return;
    this.setData({ riskId: decodeURIComponent(options.id || "") });
  },

  onShow() {
    this._hidden = false; this.writeHidden = false;
    if (typeof getApp === "function" && getApp().guardPage && !getApp().guardPage(this, 'risk-detail')) return;
    if (!getApp().ensureLogin()) return;
    return this.loadRisk();
  },

  loadRisk() {
    clearTimeout(this._backTimer);
    const serial = this._loadSerial = (this._loadSerial || 0) + 1;
    const id = this.data.riskId, identity = access.identity(getApp().globalData.session);
    const current = () => !this._hidden && serial === this._loadSerial && id === this.data.riskId && identity === access.identity(getApp().globalData.session);
    if (!/^[0-9a-f-]{36}$/i.test(this.data.riskId)) { this.showMissing(); return; }
    this.setData({ loading: true, risk: null, submitting: Boolean(this.pageWrites && this.pageWrites.resolve && this.pageWrites.resolve.current()) });
    return apiClient.getRisk(id).then((risk) => { if (current()) this.setData({ risk: normalizeRisk(risk) }); }).catch(() => {
      if (current()) this.showMissing();
    }).finally(() => { if (current()) this.setData({ loading: false }); });
  },

  onHide() { this._hidden = true; this.writeHidden = true; this._loadSerial = (this._loadSerial || 0) + 1; clearTimeout(this._backTimer); },
  onUnload() { this.unloaded = true; this.onHide(); },

  backSoon() {
    clearTimeout(this._backTimer);
    const serial = this._loadSerial, id = this.data.riskId, identity = access.identity(getApp().globalData.session);
    this._backTimer = setTimeout(() => {
      if (!this._hidden && serial === this._loadSerial && id === this.data.riskId && identity === access.identity(getApp().globalData.session)) wx.navigateBack();
    }, 700);
  },

  showMissing() {
    wx.showToast({ title: "风险不存在或已不可见", icon: "none" });
    this.backSoon();
  },

  inputResolutionNote(e) {
    const resolutionNote = e.detail.value;
    this.setData({ resolutionNote, noteCount: resolutionNote.length });
  },

  confirmResolve() {
    const risk = this.data.risk;
    const note = String(this.data.resolutionNote || "").trim();
    if (!risk || risk.status === "resolved" || this.data.submitting) return;
    if (note.length < 5) {
      wx.showToast({ title: "请填写风险解除依据", icon: "none" });
      return;
    }
    const serial = this._loadSerial, identity = access.identity(getApp().globalData.session);
    const current = () => !this._hidden && serial === this._loadSerial && risk === this.data.risk && identity === access.identity(getApp().globalData.session);
    wx.showModal({
      title: "确认解除该风险？",
      content: "解除后将保留处理人、处理时间和解除依据，经营摘要会同步更新。",
      confirmText: "确认解除",
      confirmColor: "#2B9A70",
      success: (result) => {
        if (!result.confirm || !current() || this.data.submitting) return;
        const write = writes.begin(this, 'resolve', () => this.data.riskId); if (!write) return;
        let applied = false;
        this.setData({ submitting: true });
        apiClient.resolveRisk(risk.id, note).then((resolved) => {
          if (!current()) return;
          applied = true;
          this.setData({ risk: normalizeRisk(resolved), submitting: false });
          wx.setStorageSync("lastResolvedRiskId", risk.id);
          wx.showToast({ title: "风险已解除", icon: "success" });
          wx.vibrateShort({ type: "light" });
          this.backSoon();
        }).catch((error) => {
          if (!current()) return;
          this.setData({ submitting: false });
          wx.showToast({ title: error.message || "解除失败，请稍后重试", icon: "none" });
        }).finally(() => {
          write.finish('submitting');
          if (!applied && write.settledVisible()) this.loadRisk();
        });
      },
    });
  },
});
