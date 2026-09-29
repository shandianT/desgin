const apiClient = require("../../utils/apiClient");
const rememberedLogin = require("../../utils/rememberedLogin");
const companyEntry = require("../../utils/companyEntry");
Page({
  data: {
    heroTop: 0,
    account: "",
    workspace: "",
    companyName: "",
    companyState: "legacy",
    companyError: "",
    editingCompany: false,
    companySwitchRequired: false,
    currentCompanyLabel: "",
    password: "",
    newPassword: "",
    mustChangePassword: false,
    passwordVisible: false,
    rememberAccount: false,
    agreed: false,
    loading: false,
    accountFocused: false,
    accountSuggestions: [],
  },

  onLoad(options = {}) {
    this._closed = false;
    this._visible = true;
    try { rememberedLogin.cleanup(); } catch (_) { wx.showToast({title:"无法清理旧凭据，请清除此网站的本地数据后重新登录",icon:"none"}); }
    const saved = rememberedLogin.read(apiClient.getBaseUrl());
    if (saved) this.setData({...saved, rememberAccount:true, passwordVisible:false});
    const app = getApp();
    const entry = app._pendingCompanyEntry || companyEntry.parse(options);
    app._pendingCompanyEntry = null;
    if (entry) this.applyCompanyEntry(entry);
    else {
      const session = app.globalData.session;
      if (session && companyEntry.validCode(session.companyCode)) this.adoptSessionCompany(session);
      else if (this.data.workspace) this.loadCompany();
    }
    if (typeof wx.getMenuButtonBoundingClientRect === "function") {
      const menu = wx.getMenuButtonBoundingClientRect();
      if (menu && menu.bottom > 0) this.setData({heroTop: menu.bottom + 26});
    }
  },

  onShow(options = {}) {
    this._visible = true;
    const app = getApp();
    const entry = app._pendingCompanyEntry || companyEntry.parse(options);
    app._pendingCompanyEntry = null;
    if (entry) { this.applyCompanyEntry(entry); return; }
    this.resumeSession();
  },

  adoptSessionCompany(session) {
    if (!companyEntry.validCode(session.companyCode)) return;
    this.setData({workspace:session.companyCode,companyName:session.companyName || "",
      companyState:"ready",companyError:"",editingCompany:false});
  },

  applyCompanyEntry(entry) {
    if (this.data.loading && !getApp().globalData.session) apiClient.cancelPendingLogin();
    this._entryExplicit = true;
    this._loginAttempt = (this._loginAttempt || 0) + 1;
    this._companySerial = (this._companySerial || 0) + 1;
    this.setData({workspace:entry.code || "",companyName:"",companyState:entry.error ? "error" : "loading",
      companyError:entry.error || "",password:"",newPassword:"",mustChangePassword:false,
      loading:false,rememberAccount:false,account:"",accountSuggestions:[],editingCompany:false});
    this.syncCompanySwitch();
    if (!entry.error) return this.loadCompany();
  },

  syncCompanySwitch() {
    const session = getApp().globalData.session;
    const required = !!session && !!this._entryExplicit &&
      (this.data.companyState !== "ready" || session.companyCode !== this.data.workspace);
    this.setData({companySwitchRequired:required,
      currentCompanyLabel:session ? session.companyName || session.companyCode || "当前已登录公司" : ""});
    return required;
  },

  loadCompany() {
    const code = this.data.workspace;
    if (!code) {
      this.setData({companyName:"",companyState:"legacy",companyError:""});
      this.syncCompanySwitch();
      return Promise.resolve(true);
    }
    if (!companyEntry.validCode(code)) {
      this.setData({companyName:"",companyState:"error",companyError:"公司码格式不正确，请核对管理员提供的入口"});
      return Promise.resolve(false);
    }
    const serial = this._companySerial = (this._companySerial || 0) + 1;
    const baseUrl = apiClient.getBaseUrl();
    const current = () => !this._closed && serial === this._companySerial && code === this.data.workspace && baseUrl === apiClient.getBaseUrl();
    this.setData({companyName:"",companyState:"loading",companyError:""});
    return apiClient.getCompanyEntry(code).then(result => {
      if (!current()) return false;
      if (!result || companyEntry.normalizeCode(result.company_code) !== companyEntry.normalizeCode(code) || typeof result.company_name !== "string" || !result.company_name.trim()) {
        throw new Error("公司信息未能确认，请重试");
      }
      this.setData({companyName:result.company_name.trim(),companyState:"ready",companyError:"",editingCompany:false});
      this.syncCompanySwitch();
      if (this._visible) this.resumeSession();
      return true;
    }).catch(error => {
      if (!current()) return false;
      this.setData({companyState:"error",companyError:error.statusCode === 404 ? "未找到可用公司，请核对公司码" : error.statusCode === 429 ? "公司查询过于频繁，请稍后重试" : "公司信息暂时无法确认，请重试"});
      this.syncCompanySwitch();
      return false;
    });
  },

  resumeSession() {
    if (this._closed || this._visible === false) return;
    const session = getApp().globalData.session;
    if (this.syncCompanySwitch()) return;
    if (session && session.mustChangePassword) {
      this.adoptSessionCompany(session);
      this.setData({mustChangePassword:true,account:session.account || this.data.account});
      return;
    }
    if (this.data.mustChangePassword) this.setData({mustChangePassword:false,password:"",newPassword:"",passwordVisible:false,loading:false});
    if (session) this.enterWorkspace(session);
  },

  enterWorkspace(session) {
    const attempt = this._loginAttempt;
    wx.nextTick(() => {
      if (this._closed || this._visible === false || attempt !== this._loginAttempt || companyEntry.sessionKey(getApp().globalData.session) !== companyEntry.sessionKey(session) || this.data.companySwitchRequired) return;
      wx.switchTab({url:"/pages/index/index",fail:() => {
        // Navigation failure does not invalidate a valid server session.
        if (!this._closed && companyEntry.sessionKey(getApp().globalData.session) === companyEntry.sessionKey(session)) {
          this.setData({loading:false});
          wx.showToast({title:"页面暂未打开，请重试进入",icon:"none"});
        }
      }});
    });
  },

  editCompany() {
    if (this.data.loading || this.data.mustChangePassword) return;
    this.setData({editingCompany:true});
  },

  inputWorkspace(e) {
    if (this.data.loading || this.data.mustChangePassword) return;
    this._entryExplicit = true;
    this._companySerial = (this._companySerial || 0) + 1;
    this.setData({workspace:e.detail.value.trim().toLowerCase(),companyName:"",companyState:"unconfirmed",companyError:"",
      password:"",newPassword:"",rememberAccount:false,accountSuggestions:[]});
    this.syncCompanySwitch();
  },

  confirmCompany() {
    if (this.data.loading) return;
    if (!this.data.workspace) this._entryExplicit = false;
    return this.loadCompany().then(ok => { if (ok && !this._closed) this.setData({editingCompany:false}); });
  },

  confirmCompanySwitch() {
    if (!this.data.companySwitchRequired || this.data.companyState !== "ready") return;
    const session = getApp().globalData.session, code = this.data.workspace, serial = this._companySerial;
    wx.showModal({title:"切换公司并重新登录",content:`当前登录：${this.data.currentCompanyLabel}。将退出当前账号，进入 ${this.data.companyName}（${code}）登录。`,
      confirmText:"确认切换",success:result => {
        if (!result.confirm || this._closed || this._visible === false || serial !== this._companySerial || code !== this.data.workspace || companyEntry.sessionKey(getApp().globalData.session) !== companyEntry.sessionKey(session)) return;
        this.switchAccount();
        // Clear native cached business pages along with the API/session generation.
        wx.reLaunch({url:"/pages/login/index?company="+encodeURIComponent(code)});
      }});
  },

  continueCurrentCompany() {
    const session = getApp().globalData.session;
    if (!session) return;
    this._entryExplicit = false;
    this._companySerial = (this._companySerial || 0) + 1;
    this.setData({companySwitchRequired:false,companyError:"",companyState:"legacy",workspace:"",companyName:""});
    this.adoptSessionCompany(session);
    this.resumeSession();
  },

  inputAccount(e) {
    if (this.data.loading || this.data.mustChangePassword) return;
    const changed = rememberedLogin.normalizeAccount(e.detail.value) !== rememberedLogin.normalizeAccount(this.data.account);
    if (changed) {
      const saved = rememberedLogin.read(apiClient.getBaseUrl(),e.detail.value,this.data.workspace);
      this.setData({password:"",newPassword:"",
        passwordVisible:false,rememberAccount:!!saved});
    }
    this.setData({ account: e.detail.value,
      accountSuggestions:rememberedLogin.suggest(apiClient.getBaseUrl(),e.detail.value,this.data.workspace) });
  },

  selectAccountSuggestion(e) {
    if (this.data.loading || this.data.mustChangePassword) return;
    const account = e.currentTarget.dataset.account;
    if (!this.data.accountSuggestions.includes(account)) return;
    this.inputAccount({detail:{value:account}});
    this.setData({accountSuggestions:[],accountFocused:false});
  },

  hideAccountSuggestions() { this.setData({accountSuggestions:[]}); },

  clearRememberedLogin(account=this.data.account, baseUrl=apiClient.getBaseUrl(), workspace=this.data.workspace) {
    try { rememberedLogin.clear(baseUrl,account,workspace); return true; }
    catch (_) {
      wx.showToast({title:"未能清除已保存的账号，请重试",icon:"none"});
      return false;
    }
  },

  toggleRememberAccount() {
    if (this.data.rememberAccount && !this.clearRememberedLogin()) return;
    this.setData({rememberAccount:!this.data.rememberAccount});
  },

  saveRememberedLogin(account, selected, baseUrl, session) {
    if (!selected || !this.data.rememberAccount || baseUrl !== apiClient.getBaseUrl()) return;
    const workspace = companyEntry.validCode(session.companyCode) ? session.companyCode : "";
    try { rememberedLogin.save(baseUrl,account,workspace); }
    catch (_) {
      this.setData({rememberAccount:false});
      wx.showToast({title:"已登录，但未能记住账号",icon:"none"});
    }
  },

  onHide() { this._visible = false; this.setData({passwordVisible:false,accountSuggestions:[]}); },
  onUnload() {
    if (this.data.loading && !getApp().globalData.session) apiClient.cancelPendingLogin();
    this._closed = true;
    this._companySerial = (this._companySerial || 0) + 1;
    this._loginAttempt = (this._loginAttempt || 0) + 1;
  },

  switchAccount() {
    // Invalidate page callbacks as well as the app/API session generation.
    this._loginAttempt = (this._loginAttempt || 0) + 1;
    getApp().logout();
    this.setData({companySwitchRequired:false,account:"",password:"",newPassword:"",mustChangePassword:false,
      passwordVisible:false,rememberAccount:false,agreed:false,loading:false,accountFocused:true,accountSuggestions:[]});
  },

  blurAccount() { this.setData({accountFocused:false}); },

  inputPassword(e) {
    if (!this.data.loading) this.setData({ password: e.detail.value });
  },

  togglePassword() {
    this.setData({ passwordVisible: !this.data.passwordVisible });
  },

  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed });
  },

  openPrivacy() {
    const unavailable = () => wx.showToast({title: "隐私指引暂不可用，请联系运营", icon: "none"});
    if (typeof wx.openPrivacyContract !== "function") return unavailable();
    wx.openPrivacyContract({fail: unavailable});
  },

  inputNewPassword(e) { if (!this.data.loading) this.setData({newPassword:e.detail.value}); },

  async submitLogin() {
    if (this.data.loading) return;
    if (this.data.companySwitchRequired) return;
    if (this.data.mustChangePassword) return this.submitPasswordChange();
    const account = this.data.account.trim();
    if (!account || !this.data.password) {
      wx.showToast({ title: "请输入账号和密码", icon: "none" });
      return;
    }
    const normalizedAccount = account.toUpperCase();
    const password = this.data.password;
    const remember = this.data.rememberAccount;
    const baseUrl = apiClient.getBaseUrl();
    const workspace = this.data.workspace;
    if (!this.data.agreed) {
      wx.showToast({ title: "请先同意隐私与数据使用说明", icon: "none" });
      return;
    }
    this.setData({ loading: true, accountSuggestions:[] });
    const attempt = this._loginAttempt = (this._loginAttempt || 0) + 1;
    if (this.data.companyState === "error" && !workspace) { this.setData({loading:false}); return; }
    if (workspace && this.data.companyState !== "ready") {
      const confirmed = await this.loadCompany();
      if (attempt !== this._loginAttempt || this._closed) return;
      if (!confirmed || this._visible === false) { this.setData({loading:false}); return; }
    }
    return getApp().loginWithApi(null, normalizedAccount, password, ...(workspace ? [workspace] : [])).then((session) => {
      if (attempt !== this._loginAttempt) return;
      if (!session) throw new Error("登录账号无效");
      this.adoptSessionCompany(session);
      if (session.mustChangePassword) {
        this.setData({loading:false,mustChangePassword:true});
        return;
      }
      this.saveRememberedLogin(account,remember,baseUrl,session);
      this.setData({ loading: false, password:"",passwordVisible:false });
      this.enterWorkspace(session);
    }).catch((error) => {
      if (attempt !== this._loginAttempt) return;
      if (error.statusCode === 401) this.clearRememberedLogin(account,baseUrl,workspace);
      this.setData({ loading: false });
      if (this._visible !== false) wx.showToast({ title: error.message || "登录失败，请重试", icon: "none" });
    });
  },
  submitPasswordChange() {
    if (this.data.loading) return;
    if (!this.data.password || !this.data.newPassword) {
      wx.showToast({title:"请输入当前密码和新密码",icon:"none"});return;
    }
    const account = this.data.account;
    const newPassword = this.data.newPassword;
    const remember = this.data.rememberAccount;
    const baseUrl = apiClient.getBaseUrl();
    const session = getApp().globalData.session;
    this.setData({loading:true});
    const attempt = this._loginAttempt = (this._loginAttempt || 0) + 1;
    return apiClient.changePassword(this.data.password,newPassword).then(()=>{
      if (attempt !== this._loginAttempt || companyEntry.sessionKey(getApp().globalData.session) !== companyEntry.sessionKey(session)) return;
      const app=getApp();
      app.globalData.session={...app.globalData.session,mustChangePassword:false};
      wx.setStorageSync("salesSession",app.globalData.session);
      this.saveRememberedLogin(account,remember,baseUrl,app.globalData.session);
      this.setData({mustChangePassword:false,password:"",newPassword:"",passwordVisible:false});
      this.enterWorkspace(app.globalData.session);
    }).catch(error=>{
      if (attempt === this._loginAttempt) wx.showToast({title:error.message || "密码修改失败",icon:"none"});
    }).finally(()=>{
      if (attempt === this._loginAttempt) this.setData({loading:false});
    });
  },
});
