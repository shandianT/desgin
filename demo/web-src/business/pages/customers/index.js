const access = require('../../utils/access');
const {assertPersonDirectory}=require('../../utils/personPicker');
const {DetailReadSession,customerLoaders,activeSections,detailWithPages,pageStates} = require('../../utils/detailReadSession');
const { ADVICE_TABS, adviceResult } = require('../../utils/customerAdvice');
const apiClient = require("../../utils/apiClient");
const { normalizeCustomerDetail, normalizeCustomerSummary } = require("../../utils/customerDetail");
const { scopedCustomers, filterCustomers, hasMapScores, amountWan, overlappingPlotIds } = require("../../utils/customerMap");
const { QUADRANT_THRESHOLDS, QUADRANTS, plotAxis } = require("../../utils/quadrant");
const { visitDetailUrl } = require('../../utils/visitNavigation');
const { beijingDateParts } = require('../../utils/opportunityQuarter');
const MAP_REVIEW_POLL_MS = 3000;
const MAP_REVIEW_MAX_POLLS = 10;

function buildTeamOptions(teams) {
  if (!Array.isArray(teams)) throw Error('团队目录不可用，请确认后端版本并重试');
  return [{value:'all',label:'全部团队'},...teams.map(team=>({value:team.id,label:team.name}))];
}
function buildMemberOptions(members, teamId) {
  return [{value:'all',label:'全部成员'},...members.filter(m=>teamId==='all'||(m.team_ids||[m.team_id]).includes(teamId)).map(m=>({value:m.id,label:m.name}))];
}

function findOptionIndex(options, value) {
  const index = options.findIndex((item) => item.value === value);
  return index < 0 ? 0 : index;
}

function buildCustomerOptions(customers) {
  return [{ value: "all", label: "全部客户" }, ...customers.map((item) => ({ value: item.id, label: item.name }))];
}

function planPeriod(value = {}) {
  const date = beijingDateParts(value.date);
  if(date)return {year:date.year,quarter:date.quarter,label:String(value.date).slice(0,10)};
  const year=Number(value.year),quarter=Number(value.quarter);
  if(!Number.isInteger(year)||year<1000||year>9999)return {year:null,quarter:null,label:''};
  return {year,quarter:Number.isInteger(quarter)&&quarter>=1&&quarter<=4?quarter:null,
    label:Number.isInteger(quarter)&&quarter>=1&&quarter<=4?`${year} Q${quarter}`:`${year} 年`};
}

function classifyCustomerPlans(customers, planYear) {
  return (customers || []).map((customer) => {
    const openOpportunities = (customer.plan_close_periods || []).map(planPeriod);
    const currentYearOpportunities = openOpportunities.filter((item) => item.year === planYear);
    const segment = currentYearOpportunities.length ? "current_year" : "long_term";
    let reason = "暂无活跃商机，归入长期经营与持续培育。";
    if (currentYearOpportunities.length) {
      const first = currentYearOpportunities.slice().sort((a,b)=>(a.quarter||5)-(b.quarter||5)||a.label.localeCompare(b.label))[0];
      reason = `存在 ${currentYearOpportunities.length} 个计划于 ${planYear} 年成单的活跃商机${first.label ? `，计划时间 ${first.label}` : ""}。`;
    } else if (openOpportunities.some((item) => item.year > planYear)) {
      reason = `当前无 ${planYear} 年成单计划，已有跨年度活跃商机，按长期经营推进。`;
    } else if (openOpportunities.length) {
      reason = `当前活跃商机尚未形成 ${planYear} 年明确成单计划，按长期经营推进。`;
    }
    return {
      ...customer,
      agentPlanSegment: segment,
      agentPlanSegmentLabel: segment === "current_year" ? "当年计划成单" : "计划长期运作",
      agentPlanReason: reason,
    };
  });
}

const businessOptions = require('../../utils/businessOptions');
const mapLevelOptions = () => businessOptions.customer.level_code.map(value=>({value,label:value}));
const mapAmountOptions = () => [{value:'all',label:'金额：全部'},...businessOptions.mapAmountRanges];

function buildPlotCustomers(customers, zoom = false) {
  const collisions = new Map();
  const offsets = [[0, 0], [3, -3], [-3, 3], [4, 4], [-4, -4], [5, -1], [-1, 5]];
  return customers.map((item) => {
    const baseX = plotAxis(item, "relationship", 0, zoom);
    const baseY = plotAxis(item, "potential", 0, zoom);
    const bucket = `${Math.round(baseX / 5)}:${Math.round(baseY / 5)}`;
    const collisionIndex = collisions.get(bucket) || 0;
    collisions.set(bucket, collisionIndex + 1);
    const offset = offsets[collisionIndex % offsets.length];
    const x = plotAxis(item, "relationship", offset[0], zoom);
    const y = plotAxis(item, "potential", offset[1], zoom);
    return {
      ...item,
      plotStyle: `left:${x.toFixed(1)}%;bottom:${y.toFixed(1)}%;`,
      plotLabel: `${item.name}｜潜力 ${item.potential}｜关系 ${item.relationship}`,
      hasOpenRisk: item.risk && item.risk !== "暂无重大风险",
    };
  });
}

Page({
  data: {
    role: "sales",
    roleName: "一线销售",
    scope: "仅本人",
    acvText:"—", acvLoading:false, acvError:'',
    filterRole: "",
    customers: [], activeCustomerCount: 0, mapError: '', mapLoading: true, mapUpdating: false,
    assetResolvedBasis: "entries", historicalAssetCount: 0, assetPeriod: "year", assetSummary: null, assetLoading: true, assetError: "",
    recognizedText: "—", collectionText: "—", scopeCustomerCount: '—',
    planOptions: [{value:"all",label:"全部计划"},{value:"current_year",label:"当年计划成单"},{value:"long_term",label:"计划长期运作"}],
    planIndex: 0,
    plotCustomers: [],
    mapCustomerOptions: [{ value: "all", label: "全部客户" }],
    mapCustomerId: "all",
    mapCustomerIndex: 0,
    mapCustomerLabel: "全部客户",
    mapLevelOptions: mapLevelOptions(),
    mapSelectedLevels: [],
    mapLevelLabel: "全部优先级",
    showMapLevelFilter: false,
    mapAmountOptions: mapAmountOptions(),
    mapAmountIndex: 0,
    mapAmountLabel: mapAmountOptions()[0].label,
    mapFilterActive: false,
    mapFilterCount: 0,
    mapPlanSegment: "all",
    currentPlanYear: new Date().getFullYear(),
    currentYearPlanCount: 0,
    longTermPlanCount: 0,
    quadrantOptions: [{value:"all",label:"全部象限"}, ...QUADRANTS.map(q=>({value:q.name,label:q.name,definition:q.definition}))],
    quadrantIndex: 0, mapQuadrant: "all",
    quadrantThresholds: QUADRANT_THRESHOLDS,
    keyword: "",
    teamOptions: [{ value: "all", label: "全部团队" }],
    memberOptions: [{ value: "all", label: "全部销售" }],
    directoryLoading: false, directoryError: "",
    selectedTeam: "all",
    selectedMember: "all",
    teamIndex: 0,
    memberIndex: 0,
    teamLabel: "全部团队",
    memberLabel: "全部销售",
    memberPickerOpen:false, memberPickerMembers:[], memberPickerTeams:[], memberPickerDefaultTeamId:'', memberPickerSelected:[],
    fdeMapMemberIds: [],
    fdeMapMembers: [],
    selectedCustomer: null,
    selectedBattleCustomer: null,
    plotCandidates: [],
    detailTab: "overview",
    detailScrollTarget: "",
    detailAdvice: {},
    detailTabs: [
      { key: "overview", label: "客户概览" },
      { key: "tasks", label: "待办事项" },
      { key: "visits", label: "跟进记录" },
      { key: "opportunity", label: "商机进展" },
    ],
  },
  onShow() {
    if (typeof getApp === "function" && getApp().guardPage && !getApp().guardPage(this, 'customers')) return;
    if (!getApp().ensureLogin()) return;
    this._mapPageVisible = true;
    this.syncTabBar();
    this.loadData();
  },
  syncTabBar() {
    if (this._mapPageVisible === false) return;
    // Derive visibility from current overlays; a failed transition may leave none open.
    const hasOverlay = this.data.selectedCustomer || this.data.selectedBattleCustomer || this.data.plotCandidates.length || this.data.memberPickerOpen;
    if (hasOverlay) { if (wx.hideTabBar) wx.hideTabBar({ animation: false }); }
    else if (wx.showTabBar) wx.showTabBar({ animation: false });
  },
  onHide() { this._mapPageVisible=false;this.stopMapPolling();this._plotTapSerial=(this._plotTapSerial||0)+1;this.mapLoadSerial=(this.mapLoadSerial||0)+1;this.assetSerial=(this.assetSerial||0)+1;if(wx.hideNavigationBarLoading)wx.hideNavigationBarLoading();if(this._detailReader)this._detailReader.close();if(this._battleReader)this._battleReader.close();this._adviceGeneration=(this._adviceGeneration||0)+1;this.setData({selectedCustomer:null,selectedBattleCustomer:null,plotCandidates:[],memberPickerOpen:false});if(wx.hideLoading)wx.hideLoading();if(wx.showTabBar)wx.showTabBar({animation:false}); },
  onUnload() {
    this.onHide();
    this.mapLoadSerial = (this.mapLoadSerial || 0) + 1;
    this.assetSerial = (this.assetSerial || 0) + 1;
  },
  openCustomerClaim() {
    wx.navigateTo({ url: "/pages/customer-claim/index" });
  },
  // BACKEND-CONTRACT 客户地图：GET /api/v1/customer-assets/map + /directory/members。
  // 后端先按身份裁剪 items；本地团队/成员筛选只收窄可见集合，不授予权限。
  // map.items 仅含当年1月1日至今有正式跟进的活跃客户；完整经营资产由 /customer-assets.summary 提供。
  // 评分不完整时整图更新，不删客户或补造坐标；POST补评仅一次，随后有限轮询只读GET。
  // activity_since/as_of 是后端窗口日期；前端不依据客户端时间重新判活跃。
  // 详见 docs/backend-handoff/客户与商机详解.md「作战地图」。
  fdeMapParams(){
    const session=(getApp().globalData||{}).session||{};
    if(!access.isFde(session.role))return {};
    const team=access.canViewTeam(session,'battle_map.read');
    return {scope:team?'team':'self',member_ids:team?this.data.fdeMapMemberIds:[]};
  },
  changeFdeMapMember(e){if(this.data.directoryLoading||this.data.directoryError)return;this.setData({fdeMapMemberIds:e.detail.ids});return this.loadData();},
  loadData() {
    this.stopMapPolling();
    this._mapReviewError = '';
    const app = getApp(); const role = app.globalData.role; const roleInfo = app.globalData.roles[role];
    const identity=access.identity(app.globalData.session);
    const identityChanged=this.mapIdentity!==undefined&&this.mapIdentity!==identity;
    this.mapIdentity=identity;
    const serial = this.mapLoadSerial = (this.mapLoadSerial || 0) + 1;
    this.visibleCustomers = null;
    const roleChanged = this.data.filterRole !== role;
    if (roleChanged || identityChanged) {
      this.filterMembers = [];
      this.setData({memberPickerOpen:false, memberPickerMembers:[], memberPickerTeams:[], memberPickerDefaultTeamId:'',memberPickerSelected:[],selectedTeam: "all", selectedMember: "all", teamIndex: 0, memberIndex: 0,
        teamOptions: [{value: "all", label: "全部团队"}], memberOptions: [{value: "all", label: "全部成员"}],
        teamLabel: "全部团队", memberLabel: "全部成员",fdeMapMemberIds:[],fdeMapMembers:[]});
      this.syncTabBar();
    }
    this.setData({...access.flags(app.globalData.session,'customers'),role, roleName: roleInfo.name, scope: roleInfo.scope, filterRole: role});
    this.setData({mapLoading:true,mapError:'',mapUpdating:false,activitySince:'',mapAsOf:'',customers:[],plotCustomers:[],activeCustomerCount:0});
    this.loadAssets();
    wx.showNavigationBarLoading();
    // Filters are secondary: a slow directory must not hold back the customer map.
    // The same lightweight directory also serves FDE; no dashboard totals are needed here.
    let directory = null;
    this.setData({directoryLoading:true,directoryError:""});
    apiClient.getDirectoryMembers().then(result => {
      if (!this.mapRequestCurrent(serial)) return;
      assertPersonDirectory(result.items,result.teams,result.defaults);
      directory = result;
      this.setData({directoryLoading:false,directoryError:""});
      if (this.visibleCustomers) this.applyMapDirectory(directory);
    }).catch(() => {
      if (!this.mapRequestCurrent(serial)) return;
      this.setData({directoryLoading:false,directoryError:"团队与成员筛选暂不可用，点击重试"});
      wx.showToast({title: "团队与成员筛选暂不可用，请稍后刷新", icon: "none"});
    });
    const params = this.fdeMapParams();
    return apiClient.getCustomerMap(params).then(customerPage => {
      if (!this.mapRequestCurrent(serial)) return;
      this.receiveMapPage(customerPage);
      if (directory) this.applyMapDirectory(directory, false);
      this.applyFilters();
      this.consumePendingCustomer();
      if (this.data.selectedCustomer) this.showCustomerDetail(this.data.selectedCustomer.id, "", this.data.detailTab);
      if (this.visibleCustomers.some(customer => !hasMapScores(customer))) return this.refreshMapScores(serial, params);
    }).catch(error => {
      if (!this.mapRequestCurrent(serial)) return;
      this.visibleCustomers = null;
      this.setData({customers: [],plotCustomers: [],activeCustomerCount:0,mapUpdating:false,
        mapError: error.message || "客户加载失败，请重试"});
      wx.showToast({title: error.message || "客户数据加载失败", icon: "none"});
    }).finally(() => {if (this.mapRequestCurrent(serial)) {this.setData({mapLoading:false});wx.hideNavigationBarLoading();}});
  },
  mapRequestCurrent(serial) {
    return serial===this.mapLoadSerial && this._mapPageVisible!==false && this.mapIdentity===access.identity(getApp().globalData.session);
  },
  receiveMapPage(customerPage) {
    if (!customerPage || !Array.isArray(customerPage.items) || !/^\d{4}-01-01$/.test(customerPage.activity_since || '') ||
        !/^\d{4}-\d{2}-\d{2}/.test(customerPage.as_of || '') ||
        customerPage.activity_since.slice(0,4) !== customerPage.as_of.slice(0,4)) {
      throw Error('当年活跃客户范围暂不可用，请确认后端版本后重试');
    }
    this.visibleCustomers = classifyCustomerPlans(customerPage.items.map(normalizeCustomerSummary), this.data.currentPlanYear);
    this.setData({mapLoading:false,activitySince:customerPage.activity_since,mapAsOf:customerPage.as_of,
      mapLevelOptions:mapLevelOptions().map(r=>({...r,selected:this.data.mapSelectedLevels.includes(r.value)})),mapAmountOptions:mapAmountOptions()});
  },
  stopMapPolling() {
    if (this._mapPollTimer != null) clearTimeout(this._mapPollTimer);
    this._mapPollTimer = null;
  },
  failMapReview(error) {
    this.stopMapPolling();
    this._mapReviewError = error.message || '活跃客户地图暂未完整生成，请稍后重试';
    this.applyFilters();
  },
  async refreshMapScores(serial, params) {
    try {
      const result = await apiClient.refreshCustomerMap(params);
      if (!this.mapRequestCurrent(serial)) return;
      if (!result || !['ready','updating'].includes(result.status)) {
        throw Error(result && result.reason || '活跃客户地图暂无法更新，请稍后重试');
      }
      this.scheduleMapPoll(serial, params, 0);
    } catch (error) {
      if (this.mapRequestCurrent(serial)) this.failMapReview(error);
    }
  },
  scheduleMapPoll(serial, params, completed) {
    this.stopMapPolling();
    this._mapPollTimer = setTimeout(async () => {
      this._mapPollTimer = null;
      if (!this.mapRequestCurrent(serial)) return;
      try {
        const result = await apiClient.getCustomerMap(params);
        if (!this.mapRequestCurrent(serial)) return;
        this.receiveMapPage(result);
        this.applyFilters();
        if (!this.visibleCustomers.some(customer => !hasMapScores(customer))) return;
        if (completed + 1 >= MAP_REVIEW_MAX_POLLS) throw Error('活跃客户地图仍在更新，请稍后重试');
        this.scheduleMapPoll(serial, params, completed + 1);
      } catch (error) {
        if (this.mapRequestCurrent(serial)) this.failMapReview(error);
      }
    }, MAP_REVIEW_POLL_MS);
  },
  applyMapDirectory(directory, refresh = true) {
    const members = (directory.items || []).map(item => ({...item}));
    const teamOptions = buildTeamOptions(directory.teams);
    let selectedTeam = this.data.selectedTeam;
    if (!teamOptions.some(item => item.value === selectedTeam)) selectedTeam = "all";
    const memberOptions = buildMemberOptions(members, selectedTeam);
    let selectedMember = this.data.selectedMember;
    if (!memberOptions.some(item => item.value === selectedMember)) selectedMember = "all";
    const scopeChanged = selectedTeam !== this.data.selectedTeam || selectedMember !== this.data.selectedMember;
    const teamIndex = findOptionIndex(teamOptions, selectedTeam);
    const memberIndex = findOptionIndex(memberOptions, selectedMember);
    this.filterMembers = members;
    this.setData({memberPickerMembers:members,memberPickerTeams:directory.teams,memberPickerDefaultTeamId:(directory.defaults||{}).team_id||'',
      teamOptions, memberOptions, selectedTeam, selectedMember, teamIndex, memberIndex,
      teamLabel: teamOptions[teamIndex].label, memberLabel: memberOptions[memberIndex].label,
      ...(this.data.isFde ? {fdeMapMembers: [{id: '', name: '全部成员'}, ...(directory.items || [])]} : {})});
    if (refresh) this.applyFilters();
    if (scopeChanged) this.loadAssets();
  },
  search(e) {
    this.setData({ keyword: e.detail.value.trim() });
    this.applyFilters();
  },
  tapPlanSegment(e) {
    const segment = e.currentTarget.dataset.segment;
    const mapPlanSegment = this.data.mapPlanSegment === segment ? "all" : segment;
    this.setData({ mapPlanSegment }, () => this.applyFilters());
  },
  changeTeam(e) {
    if(this.data.directoryLoading||this.data.directoryError)return;
    const teamIndex = Number(e.detail.value);
    const team = this.data.teamOptions[teamIndex];
    if(!team)return;
    const memberOptions = buildMemberOptions(this.filterMembers || [], team.value);
    this.setData({
      selectedTeam: team.value,
      teamIndex,
      teamLabel: team.label,
      memberOptions,
      selectedMember: "all",
      memberIndex: 0,
      memberLabel: memberOptions[0].label,
    }, () => {this.applyFilters();this.loadAssets();});
  },
  openMemberPicker() {
    if (!this.data.canViewTeam || this.data.directoryLoading || this.data.directoryError) return;
    this._memberPickerIdentity = access.identity(getApp().globalData.session);
    this.setData({memberPickerOpen:true,memberPickerSelected:this.data.isFde?this.data.fdeMapMemberIds.slice():this.data.selectedMember==='all'?[]:[this.data.selectedMember]});
    this.syncTabBar();
  },
  closeMemberPicker() { this.setData({memberPickerOpen:false});this.syncTabBar(); },
  confirmMemberPicker(e) {
    if (!this.data.memberPickerOpen || this._memberPickerIdentity !== access.identity(getApp().globalData.session) || this.data.directoryLoading || this.data.directoryError) return;
    const ids = [...new Set(e.detail.ids||[])];
    if (ids.some(id=>!this.data.memberPickerMembers.some(row=>row.id===id)) || (!this.data.isFde && ids.length>1)) return;
    this.closeMemberPicker();
    // Team choice within the sheet only narrows candidates. If a confirmed person is
    // outside the page team, clear that incompatible page filter rather than hide them.
    let team = this.data.selectedTeam;
    if (ids.some(id=>{const row=this.data.memberPickerMembers.find(row=>row.id===id);return team!=='all'&&!(row.team_ids||[row.team_id]).includes(team);})) team='all';
    const memberOptions = buildMemberOptions(this.filterMembers||[],team);
    const selectedMember = this.data.isFde?'all':ids[0]||'all';
    const teamIndex=findOptionIndex(this.data.teamOptions,team),memberIndex=findOptionIndex(memberOptions,selectedMember);
    this.setData({selectedTeam:team,teamIndex,teamLabel:this.data.teamOptions[teamIndex].label,memberOptions,selectedMember,memberIndex,memberLabel:memberOptions[memberIndex].label});
    if(this.data.isFde)return this.changeFdeMapMember({detail:{ids}});
    this.applyFilters();this.loadAssets();
  },
  changeMember(e) {
    if(this.data.directoryLoading||this.data.directoryError)return;
    const memberIndex = Number(e.detail.value);
    const member = this.data.memberOptions[memberIndex];
    if(!member)return;
    this.setData({ selectedMember: member.value, memberIndex, memberLabel: member.label }, () => {this.applyFilters();this.loadAssets();});
  },
  resetScopeFilters() {
    const selectedTeam = "all";
    const teamIndex = findOptionIndex(this.data.teamOptions, selectedTeam);
    const memberOptions = buildMemberOptions(this.filterMembers || [], selectedTeam);
    this.setData({ selectedTeam, teamIndex, teamLabel: this.data.teamOptions[teamIndex].label, memberOptions, selectedMember: "all", memberIndex: 0, memberLabel: memberOptions[0].label }, () => {this.applyFilters();this.loadAssets();});
  },
  applyFilters() {
    if (!this.visibleCustomers) return;
    const scoped = this.data.isFde ? this.visibleCustomers || [] : scopedCustomers(this.visibleCustomers || [], this.data.selectedTeam, this.data.selectedMember, this.filterMembers || []);
    const customerOptions = buildCustomerOptions(scoped);
    const customerId = customerOptions.some(c=>c.value===this.data.mapCustomerId) ? this.data.mapCustomerId : 'all';
    // Check the complete selected team/person BEFORE search, quadrant or plan filters:
    // these filters must not hide customers whose position is still being generated.
    const incomplete = scoped.some(customer => !hasMapScores(customer));
    const mapCustomers = incomplete ? [] : filterCustomers(scoped, {
      quadrant:this.data.mapQuadrant,keyword:this.data.keyword,plan:this.data.mapPlanSegment,customerId,
      levels:this.data.mapSelectedLevels,amount:mapAmountOptions()[this.data.mapAmountIndex],
    });
    const count = [
      this.data.role === 'manager' && this.data.selectedTeam !== 'all',
      this.data.role !== 'sales' && this.data.selectedMember !== 'all',
      this.data.isFdeLead && this.data.fdeMapMemberIds.length > 0,
      this.data.mapQuadrant !== 'all', this.data.mapPlanSegment !== 'all', customerId !== 'all',
      this.data.mapSelectedLevels.length > 0, this.data.mapAmountIndex > 0,
    ].filter(Boolean).length;
    this.setData({
      customers:mapCustomers.map(c=>({...c,initial:String(c.name||'').substring(0,1)})),
      activeCustomerCount:incomplete ? scoped.length : mapCustomers.length,
      mapUpdating:incomplete && !this._mapReviewError,mapError:incomplete ? this._mapReviewError || '' : '',
      plotCustomers:buildPlotCustomers(mapCustomers, this.data.mapQuadrant !== "all"),
      mapCustomerOptions:customerOptions,mapCustomerId:customerId,
      mapCustomerIndex:findOptionIndex(customerOptions,customerId),mapFilterCount:count,mapFilterActive:count>0,
      currentYearPlanCount:scoped.filter(c=>c.agentPlanSegment==='current_year').length,
      longTermPlanCount:scoped.filter(c=>c.agentPlanSegment==='long_term').length,
    });
  },
  // BACKEND-CONTRACT GET /api/v1/customer-assets：summary.recognized_amount/collection_amount/acv_amount 为元。
  // portfolio_customer_count/acv_amount/unknown_acv_count 覆盖当前完整授权范围，不受 period 或活跃筛选影响。
  // period/team_id/owner_id 控制实绩范围；搜索、计划、Tier 和地图金额筛选不改变顶部实绩汇总。
  loadAssets() {
    const serial = this.assetSerial = (this.assetSerial || 0) + 1;
    this.setData({assetLoading:true,assetError:'',acvLoading:true,acvError:'',acvText:'—',scopeCustomerCount:'—',unknownAcvCount:0});
    return apiClient.getCustomerAssets(this.assetParams()).then(result=>{
      if(serial!==this.assetSerial) return;
      const summary = result.summary || {};
      const complete = Number.isInteger(summary.portfolio_customer_count) && summary.portfolio_customer_count >= 0 &&
        Number.isInteger(summary.unknown_acv_count) && summary.unknown_acv_count >= 0 &&
        (summary.acv_amount === null || (typeof summary.acv_amount === 'number' && Number.isFinite(summary.acv_amount) && summary.acv_amount >= 0));
      this.setData({assetSummary:summary,assetResolvedBasis:result.basis || "entries",historicalAssetCount:result.historical_count || 0,recognizedText:amountWan(summary.recognized_amount === null ? 0 : summary.recognized_amount),collectionText:amountWan(summary.collection_amount === null ? 0 : summary.collection_amount),assetAsOf:result.as_of,
        acvText:complete ? amountWan(summary.acv_amount,2) : '—',scopeCustomerCount:complete ? summary.portfolio_customer_count : '—',
        acvError:complete ? '' : '客户资产汇总暂不可用',unknownAcvCount:complete ? summary.unknown_acv_count : 0});
    }).catch(error=>{if(serial===this.assetSerial)this.setData({assetError:error.message || '资产加载失败',assetSummary:null,recognizedText:'—',collectionText:'—',acvText:'—',scopeCustomerCount:'—'});})
      .finally(()=>{if(serial===this.assetSerial)this.setData({assetLoading:false,acvLoading:false});});
  },
  assetParams() { return {...this.fdeMapParams(),basis:"auto",period:this.data.assetPeriod,team_id:this.data.selectedTeam==='all'?'':this.data.selectedTeam,owner_id:this.data.selectedMember==='all'?'':this.data.selectedMember}; },
  changeAssetPeriod(e) {this.setData({assetPeriod:e.currentTarget.dataset.period},()=>this.loadAssets());},
  openAssets(e) {
    const params=this.assetParams(); params.kind=e.currentTarget.dataset.kind || 'recognized'; params.basis=this.data.assetResolvedBasis;
    wx.navigateTo({url:'/pages/customer-assets/index?'+Object.keys(params).filter(k=>params[k]).map(k=>k+'='+encodeURIComponent(params[k])).join('&')});
  },
  assetHelp() {wx.showModal({title:'客户资产口径',content:'按当前个人或团队管理的客户汇总。确收、回款按已登记金额展示，保留原始来源和税口径，不含预测。本年为今年1月1日至今天；历年累计包含本年。数据起始日期以明细为准。客户ACV按当前范围内客户的在推商机金额汇总，空金额按0参与汇总，按万元显示，不随实绩期间切换，也不计入确收、回款。下方客户筛选只影响地图和列表。加载成功但没有记录时显示0。',showCancel:false});},
  changeQuadrant(e) {
    const quadrantIndex = Number(e.detail.value);
    const option = this.data.quadrantOptions[quadrantIndex];
    if (!option) return;
    this.setData({quadrantIndex, mapQuadrant:option.value},()=>this.applyFilters());
  },
  startMapTouch(e) {
    const touches = e.touches || [];
    const touch = touches[0] || {};
    this._mapGesture = {x:touch.clientX, y:touch.clientY,
      blocked:touches.length !== 1 || !Number.isFinite(touch.clientX) || !Number.isFinite(touch.clientY)};
  },
  moveMapTouch(e) {
    const gesture = this._mapGesture;
    if (!gesture) return;
    const touches = e.touches || [];
    const touch = touches[0] || {};
    // Keep a drag blocked even when the finger returns to its starting point.
    if (touches.length !== 1 || !Number.isFinite(touch.clientX) || !Number.isFinite(touch.clientY) ||
        Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 10) gesture.blocked = true;
  },
  cancelMapTouch() { this._mapGesture = {blocked:true}; },
  tapMapQuadrant(e) {
    if (this._mapGesture && this._mapGesture.blocked) return;
    const quadrantIndex = this.data.quadrantOptions.findIndex(option => option.value === e.currentTarget.dataset.quadrant);
    if (quadrantIndex < 0 || (this.data.mapQuadrant === 'all' ? quadrantIndex === 0 : quadrantIndex !== 0)) return;
    this.changeQuadrant({detail:{value:quadrantIndex}});
  },
  changePlan(e) {const planIndex=Number(e.detail.value);this.setData({planIndex,mapPlanSegment:this.data.planOptions[planIndex].value},()=>this.applyFilters());},
  clearOperatingFilters() {this.setData({keyword:'',quadrantIndex:0,mapQuadrant:'all',planIndex:0,mapPlanSegment:'all',mapSelectedLevels:[],mapLevelLabel:'全部优先级',showMapLevelFilter:false,mapAmountIndex:0,mapCustomerId:'all'},()=>this.applyFilters());},
  changeMapCustomer(e) {
    const mapCustomerIndex = Number(e.detail.value);
    const option = this.data.mapCustomerOptions[mapCustomerIndex];
    this.setData({ mapCustomerIndex, mapCustomerId: option.value, mapCustomerLabel: option.label }, () => this.applyFilters());
  },
  toggleMapLevelFilter() {
    this.setData({ showMapLevelFilter: !this.data.showMapLevelFilter });
  },
  toggleMapLevel(e) {
    const value = e.currentTarget.dataset.value;
    const selected = value === "all" ? [] : this.data.mapSelectedLevels.includes(value)
      ? this.data.mapSelectedLevels.filter((item) => item !== value)
      : [...this.data.mapSelectedLevels, value];
    const options = mapLevelOptions().map((item) => ({ ...item, selected: selected.includes(item.value) }));
    this.setData({ mapSelectedLevels: selected, mapLevelOptions:options, mapLevelLabel: selected.length ? selected.join("/") : "全部优先级" }, () => this.applyFilters());
  },
  changeMapAmount(e) {
    const mapAmountIndex = Number(e.detail.value);
    this.setData({ mapAmountIndex, mapAmountLabel: mapAmountOptions()[mapAmountIndex].label }, () => this.applyFilters());
  },
  resetMapFilters() {
    this.setData({
      mapCustomerId: "all", mapCustomerIndex: 0, mapCustomerLabel: "全部客户",
      mapSelectedLevels: [], mapLevelOptions: mapLevelOptions(), mapLevelLabel: "全部优先级", showMapLevelFilter: false,
      mapAmountIndex: 0, mapAmountLabel: mapAmountOptions()[0].label,
      mapPlanSegment: "all", planIndex:0, quadrantIndex:0, mapQuadrant:"all",
    }, () => this.applyFilters());
  },
  resetAllFilters() {
    const role = this.data.role;
    const resetFdeMembers=this.data.isFdeLead&&this.data.fdeMapMemberIds.length>0;
    const selectedTeam = "all";
    const teamIndex = findOptionIndex(this.data.teamOptions, selectedTeam);
    const memberOptions = role === "sales"
      ? this.data.memberOptions
      : buildMemberOptions(this.filterMembers || [], selectedTeam);
    this.setData({
      selectedTeam, teamIndex, teamLabel: this.data.teamOptions[teamIndex].label,fdeMapMemberIds:[],
      memberOptions, selectedMember: "all", memberIndex: 0, memberLabel: memberOptions[0].label,
      mapCustomerId: "all", mapCustomerIndex: 0, mapCustomerLabel: "全部客户",
      mapSelectedLevels: [], mapLevelOptions: mapLevelOptions(), mapLevelLabel: "全部优先级", showMapLevelFilter: false,
      mapAmountIndex: 0, mapAmountLabel: mapAmountOptions()[0].label,
      mapPlanSegment: "all", planIndex:0, quadrantIndex:0, mapQuadrant:"all",
    }, () => {if(resetFdeMembers)this.loadData();else {this.applyFilters();this.loadAssets();}});
  },
  openCustomer(e) {
    this.showCustomerDetail(e.currentTarget.dataset.id);
  },
  consumePendingCustomer() {
    const battleCustomerId = wx.getStorageSync("pendingBattleCustomerId");
    if (battleCustomerId) {
      wx.removeStorageSync("pendingBattleCustomerId");
      this.showBattleCustomer(battleCustomerId);
      return;
    }
    const customerId = wx.getStorageSync("pendingOpenCustomerId");
    if (!customerId) return;
    const opportunityId = wx.getStorageSync("pendingOpenOpportunityId") || "";
    wx.removeStorageSync("pendingOpenCustomerId");
    wx.removeStorageSync("pendingOpenOpportunityId");
    this.showCustomerDetail(customerId, opportunityId, opportunityId ? "opportunity" : "overview");
  },
  openBattleCustomer(e) {
    const id = e.currentTarget.dataset.id;
    const points = this.data.plotCustomers;
    const serial = this._plotTapSerial = (this._plotTapSerial || 0) + 1;
    wx.createSelectorQuery().in(this).selectAll('.plot-hit-area')
      .fields({dataset:true, rect:true, size:true}, rects => {
        if (serial !== this._plotTapSerial || points !== this.data.plotCustomers) return;
        const ids = overlappingPlotIds(rects || [], id);
        const candidates = points.filter(p => ids.includes(String(p.id)));
        if (candidates.length > 1) {
          this.setData({plotCandidates:candidates});
          this.syncTabBar();
        } else if (candidates.length === 1) this.showBattleCustomer(candidates[0].id);
      }).exec();
  },
  closePlotCandidates() {
    this.setData({plotCandidates:[]});
    this.syncTabBar();
  },
  choosePlotCustomer(e) {
    const id = e.currentTarget.dataset.id;
    if (!this.data.plotCandidates.some(p => String(p.id) === String(id))) return;
    this.closePlotCandidates();
    this.showBattleCustomer(id);
  },
  async showBattleCustomer(customerId) {
    if (!customerId) return;
    if(this._detailReader)this._detailReader.close();this._adviceGeneration=(this._adviceGeneration||0)+1;
    this.setData({selectedCustomer:null});
    if(!this._battleReader)this._battleReader=new DetailReadSession(undefined,()=>access.identity(getApp().globalData.session));
    const reader=this._battleReader,token=reader.reset(customerId);
    this.setData({selectedBattleCustomer:null});
    this.syncTabBar();
    wx.showLoading({ title: "加载客户数据" });
    try {
      const raw=await apiClient.getCustomerOverview(customerId);
      if(!reader.current(token))return;
      const customer=normalizeCustomerDetail(raw);
      const summary=(this.visibleCustomers||[]).find(item=>String(item.id)===String(customerId));
      const toneMap={"客户资产":"asset","主攻区":"attack","见单打单":"order","客户资源":"resource"};
      const planRow=summary?[{label:"经营计划",value:summary.agentPlanSegmentLabel,note:summary.agentPlanReason,emphasis:true}]:[];
      this.setData({selectedBattleCustomer:{...customer,mapDetailRows:[...planRow,...(customer.mapDetailRows||[])],quadrantTone:toneMap[customer.quadrant]||"asset",hasRisk:customer.risk!=="暂无重大风险"}});
      this.syncTabBar();
    } catch(error) {if(reader.current(token))wx.showToast({title:error.message||"客户数据加载失败",icon:"none"});}
    finally {if(reader.current(token)){wx.hideLoading();this.syncTabBar();}}
  },
  closeBattleCustomer() {
    if(this._battleReader)this._battleReader.close();
    wx.hideLoading();
    this.setData({ selectedBattleCustomer: null });
    this.syncTabBar();
  },
  viewFullCustomer() {
    const customer = this.data.selectedBattleCustomer;
    if (!customer) return;
    if(this._battleReader)this._battleReader.close();
    this.setData({ selectedBattleCustomer: null });
    this.showCustomerDetail(customer.id);
  },
  stopPropagation() {},
  async showCustomerDetail(customerId, opportunityId = "", targetTab = "overview") {
    if(this._battleReader)this._battleReader.close();this.setData({selectedBattleCustomer:null});
    if(!this._detailReader)this._detailReader=new DetailReadSession(()=>this.renderCustomerDetail(),()=>access.identity(getApp().globalData.session));
    const reader=this._detailReader,token=reader.reset(customerId);
    this._detailRaw=null;this._focusedOpportunity=null;this._focusedId=opportunityId;
    this._adviceGeneration=(this._adviceGeneration||0)+1;this._adviceCustomer=null;
    this.setData({selectedCustomer:null,detailPages:{},detailTab:targetTab,detailFocusError:'',detailScrollTarget:''});
    this.syncTabBar();
    wx.showLoading({title:"加载客户"});
    try {
      const raw=await apiClient.getCustomerHeader(customerId);
      if(!reader.current(token))return;
      this._detailRaw=raw;this._adviceCustomer=raw;
      this._detailLoaders=customerLoaders(apiClient,customerId,{visitSort:'created_desc'});
      const detailAdvice=Object.fromEntries(Object.entries(ADVICE_TABS).map(([key,title])=>[key,{title,status:'idle',summary:'',rows:[]} ]));
      this.setData({detailAdvice});this.renderCustomerDetail();
      wx.hideLoading();this.syncTabBar();this.loadCustomerAdvice();this.loadDetailSections();
      if(opportunityId){
        const target=await apiClient.getCustomerOpportunityHeader(customerId,opportunityId);
        if(!reader.current(token))return;
        if(String(target.id)!==String(customerId))throw Error('商机客户不匹配');
        const focused=(target.opportunities||[]).find(item=>String(item.id)===String(opportunityId));
        if(!focused)throw Error('商机不存在或无权查看');
        this._focusedOpportunity=focused;this.renderCustomerDetail();
        const card=this.data.selectedCustomer.opportunities.find(item=>item.isFocused);
        if(card&&targetTab==='opportunity')this.setData({detailScrollTarget:card.anchorId});
      }
    } catch(error) {if(reader.current(token)){if(this._detailRaw)this.setData({detailFocusError:error.message});else wx.showToast({title:error.message||"客户详情加载失败",icon:"none"});}}
    finally {if(reader.current(token)){wx.hideLoading();this.syncTabBar();}}
  },
  renderCustomerDetail(){
    const reader=this._detailReader;if(!reader||!reader.current()||!this._detailRaw)return;
    const summary=reader.resource('overview');
    const customer=normalizeCustomerDetail(detailWithPages(summary.data||this._detailRaw,reader.pages,this._focusedOpportunity),this._focusedId,{preserveVisitOrder:true});
    const stages=require('../../utils/opportunity').STAGES.slice(0,6).map(s=>s.label),current=Math.max(0,stages.indexOf(customer.opportunity.stage));
    this.setData({detailSummary:{loading:summary.loading,loaded:summary.loaded,error:summary.error},detailPages:pageStates(reader.pages),selectedCustomer:{...customer,initial:customer.name.substring(0,1),contacts:customer.contacts.map(item=>({...item,initial:item.name?item.name.substring(0,1):'?'})),stageSteps:stages.map((label,index)=>({label,status:index<current?'done':index===current?'current':'upcoming'}))}});
  },
  loadCustomerSummary(options={}){
    if(!this._detailReader||!this._detailRaw)return;
    const id=this._detailRaw.id;
    return this._detailReader.loadResource('overview',async()=>{
      const raw=await apiClient.getCustomerOverview(id);
      if(String(raw.id)!==String(id)||!raw.summary||!raw.profile)throw Error('客户经营汇总响应不完整');return raw;
    },options);
  },
  retryCustomerSummary(){return this.loadCustomerSummary({retry:true});},
  loadDetailSections(){if(this._detailReader&&this._detailLoaders){activeSections(this.data.detailTab).forEach(key=>this._detailReader.load(key,this._detailLoaders[key]));if(this.data.detailTab==='overview')this.loadCustomerSummary();}},
  moreDetailSection(e){const key=e.currentTarget.dataset.section;return this._detailReader.load(key,this._detailLoaders[key],{more:true});},
  retryDetailSection(e){const key=e.currentTarget.dataset.section;return this._detailReader.load(key,this._detailLoaders[key],{retry:true});},
  closeCustomer() {
    if(this._detailReader)this._detailReader.close();
    wx.hideLoading();
    this._adviceGeneration=(this._adviceGeneration||0)+1;
    this._adviceCustomer=null;
    this.setData({ selectedCustomer: null, detailScrollTarget: "" });
    this.syncTabBar();
  },
  selectDetailTab(e) {
    this.setData({ detailTab: e.currentTarget.dataset.tab },()=>{this.loadCustomerAdvice();this.loadDetailSections();});
  },
  async loadCustomerAdvice(event) {
    const session=getApp().globalData.session||{};
    if(session.permissions?!(access.can(session,'advice.request')&&access.can(session,'advice.customer')):access.isFde(session.role))return;
    const tab=this.data.detailTab,raw=this._adviceCustomer;
    if(!raw||!ADVICE_TABS[tab])return;
    const previous=this.data.detailAdvice[tab];
    const refresh=Boolean(event&&event.currentTarget);
    if(previous&&(previous.status==='loading'||(!refresh&&previous.status==='ready')))return;
    const generation=this._adviceGeneration;
    const identity=access.identity(session);
    const update=values=>this.setData({detailAdvice:{...this.data.detailAdvice,[tab]:{title:ADVICE_TABS[tab],...values}}});
    update({status:'loading',summary:'',rows:[]});
    const stillCurrent=()=>{const current=getApp().globalData.session||{};return generation===this._adviceGeneration&&identity===access.identity(current)&&this.data.selectedCustomer&&String(this.data.selectedCustomer.id)===String(raw.id);};
    try{
      const run=await apiClient.queryBusinessAdvice('customer',raw.id,tab,refresh);
      if(stillCurrent())update(adviceResult(run));
    }catch(error){if(stillCurrent())update({status:'error',error:error.message||'AI建议暂不可用，请重试',rows:[]});}
  },
  openVisitDetail(e) {
    const customer = this.data.selectedCustomer;
    const visitId = e.currentTarget.dataset.id;
    const visit = customer && (customer.visits || []).find(item=>String(item.id)===String(visitId));
    if (!visit) return;
    wx.navigateTo({ url: visitDetailUrl(visit) });
  },
  createTask(e) {
    const customer = this.data.selectedCustomer;
    const opportunityId = e && e.currentTarget.dataset.id || "";
    wx.navigateTo({ url: `/pages/management-task-create/index?customerId=${encodeURIComponent(customer.id)}&opportunityId=${encodeURIComponent(opportunityId)}` });
  },
  openCustomerTask(e) {
    const taskId = e.currentTarget.dataset.id;
    if (!taskId) return;
    wx.navigateTo({ url: `/pages/task-detail/index?id=${encodeURIComponent(taskId)}` });
  },
  openTaskOpportunity(e) {
    const customer = this.data.selectedCustomer;
    const opportunityId = e.currentTarget.dataset.id;
    if (!customer || !opportunityId) return;
    this.showCustomerDetail(customer.id, opportunityId, "opportunity");
  },
  editCustomer() {
    const customer = this.data.selectedCustomer;
    if (!customer) return;
    wx.navigateTo({ url: `/pages/customer-edit/index?customerId=${encodeURIComponent(customer.id)}` });
  },
  createOpportunity() { wx.navigateTo({ url: `/pages/opportunity-create/index?customerId=${this.data.selectedCustomer.id}` }); },
  editOpportunity(e) {
    const customer = this.data.selectedCustomer;
    const opportunityId = e.currentTarget.dataset.id;
    if (!customer || !opportunityId) return;
    wx.navigateTo({ url: `/pages/opportunity-create/index?mode=manual&customerId=${encodeURIComponent(customer.id)}&opportunityId=${encodeURIComponent(opportunityId)}` });
  },
  viewOpportunityActuals(e) {
    const customer = this.data.selectedCustomer;
    const opportunityId = e.currentTarget.dataset.id;
    if (!customer || !opportunityId) return;
    wx.navigateTo({ url: `/pages/customer-assets/index?customer_id=${encodeURIComponent(customer.id)}&customer_name=${encodeURIComponent(customer.name)}&opportunity_id=${encodeURIComponent(opportunityId)}&period=all&readonly=1` });
  },
});
