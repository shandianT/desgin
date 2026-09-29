// Synthetic regression checks against the editable customer controllers and Web presentation.
// Missing modules resolve from the checked-in bundle; no API or browser is contacted.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundled = JSON.parse(readFileSync(path.join(root, 'demo/web/bundle.js'), 'utf8').replace(/^window\.SALES_BUNDLE\s*=\s*/, '').replace(/;\s*$/, '')).modules;
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return {promise, resolve, reject}; };
const event = (key, value) => ({currentTarget: {dataset: {[key]: value}}, detail: {value}});
const ids = rows => Array.from(rows, row => String(row.id));
const directory = {items: [], teams: [], defaults: {team_id: null}};
const mapResult = items => ({items, activity_since: '2026-01-01', as_of: '2026-09-29'});
const row = (id, scores = {}) => ({id, name: `合成客户${id}`, potential_score: 70, relationship_score: 40, ...scores});
const assetResult = (amount = 9000000, count = 200) => ({as_of: '2026-09-29', summary: {acv_amount: amount, portfolio_customer_count: count, unknown_acv_count: 0, recognized_amount: 500000, collection_amount: 0}});
function clock() {
  let serial = 0; const timers = new Map();
  return {setTimeout(fn) {timers.set(++serial, fn); return serial;}, clearTimeout(id) {timers.delete(id);},
    get size() {return timers.size;}, async next() {const item = timers.entries().next().value; assert.ok(item, 'a bounded poll is queued'); timers.delete(item[0]); await item[1]();}};
}
function environment(apiOverrides = {}, timers = clock()) {
  const app = {ensureLogin: () => true, globalData: {role: 'sales', roles: {sales: {name: '销售', scope: '本人'}}, session: {role: 'sales', userId: 'u1', workspaceId: 'w1', teamIds: ['t1'], loginAt: 1, permissionVersion: 'v1', scope: 'self'}}};
  const api = {getDirectoryMembers: async () => directory, getCustomerAssets: async () => assetResult(), ...apiOverrides};
  const storage = new Map(), notices = [], modals = [], navigations = [], cache = new Map();
  const wx = {showToast: message => notices.push(message.title), showModal: value => modals.push(value),
    showNavigationBarLoading() {}, hideNavigationBarLoading() {}, hideLoading() {}, showTabBar() {}, hideTabBar() {},
    getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, value), removeStorageSync: key => storage.delete(key),
    navigateTo: value => navigations.push(value.url), navigateBack: value => navigations.push(value), setNavigationBarTitle() {}};
  function load(id) {
    if (id === 'utils/apiClient') return api;
    if (cache.has(id)) return cache.get(id).exports;
    const module = {exports: {}}; cache.set(id, module);
    const filename = path.join(root, 'demo/web-src/business', `${id}.js`);
    const source = existsSync(filename) ? readFileSync(filename, 'utf8') : bundled[id];
    assert.equal(typeof source, 'string', `module ${id} exists in Web source or bundle`);
    vm.runInNewContext(source, {module, exports: module.exports, Page: page => {module.exports = page;},
      require: name => load(path.posix.normalize(path.posix.join(path.posix.dirname(id), name)).replace(/\.js$/, '')),
      getApp: () => app, wx, Date, Map, Set, Promise, Math, console, ...timers}, {filename});
    return module.exports;
  }
  function page(id) {
    const definition = load(`pages/${id}/index`);
    const instance = {...definition, data: JSON.parse(JSON.stringify(definition.data))};
    instance.setData = function(values, callback) { for (const [key, value] of Object.entries(values)) { const parts = key.split('.'); let object = this.data; for (const part of parts.slice(0, -1)) object = object[part] ||= {}; object[parts.at(-1)] = value; } callback?.(); };
    return instance;
  }
  return {app, api, wx, page, load, timers, notices, modals, navigations};
}

test('zero is a real score; absent, blank and out-of-range scores never become map coordinates', () => {
  const env = environment(), {normalizeCustomerSummary, normalizeCustomerDetail} = env.load('utils/customerDetail');
  const {hasMapScores, filterCustomers} = env.load('utils/customerMap');
  const rows = [row('zero', {potential_score: 0, relationship_score: 0}), row('null', {potential_score: null}), row('blank', {relationship_score: ' '}), row('range', {potential_score: 101})].map(normalizeCustomerSummary);
  assert.equal(hasMapScores(rows[0]), true);
  for (const item of rows.slice(1)) {assert.equal(hasMapScores(item), false); assert.equal(item.quadrant, '待评估');}
  const detail = normalizeCustomerDetail(row('missing', {potential_score: null, relationship_score: null}));
  assert.equal(detail.relationshipLevel, '待评估'); assert.equal(detail.potential, null);
  const money = [null, 0].map((opportunity_amount, i) => normalizeCustomerSummary(row(String(i), {opportunity_amount})));
  assert.deepEqual(ids(filterCustomers(money, {amount: {value: 'low', min: 0, max: 499999}})), ['1']);
});

test('more than 100 active customers share the same count/list/point set under intersecting filters', () => {
  const env = environment(), p = env.page('customers');
  p.visibleCustomers = Array.from({length: 130}, (_, i) => ({id: String(i), name: `客户${i}`, owner: '同名销售', potential: 70, relationship: 40, level: i % 2 ? 'Tier-2' : 'Tier-1', mapAmount: 600000, agentPlanSegment: 'current_year'}));
  p.applyFilters(); assert.equal(p.data.activeCustomerCount, 130);
  p.data.keyword = '客户1'; p.data.mapSelectedLevels = ['Tier-2']; p.applyFilters();
  assert.equal(p.data.activeCustomerCount, p.data.customers.length);
  assert.deepEqual(ids(p.data.customers), ids(p.data.plotCustomers));
  assert.ok(p.data.customers.length > 0 && p.data.customers.every(item => item.level === 'Tier-2'));
});

test('incomplete team blocks the whole scoped plot before keyword/quadrant filters, with a truthful active count', () => {
  const env = environment(), p = env.page('customers'), normalize = env.load('utils/customerDetail').normalizeCustomerSummary;
  p.visibleCustomers = [row('ready', {owner_team_id: 't1'}), row('missing', {owner_team_id: 't2', potential_score: null})].map(normalize);
  p.data.keyword = 'ready'; p.applyFilters();
  assert.equal(p.data.activeCustomerCount, 2); assert.equal(p.data.mapUpdating, true);
  assert.deepEqual(ids(p.data.customers), []); assert.deepEqual(ids(p.data.plotCustomers), []);
  p.data.selectedTeam = 't1'; p.applyFilters();
  assert.equal(p.data.mapUpdating, false); assert.equal(p.data.activeCustomerCount, 1); assert.deepEqual(ids(p.data.plotCustomers), ['ready']);
});

test('same-named colleagues and shared customers are scoped by immutable IDs without duplicate points', () => {
  const {scopedCustomers} = environment().load('utils/customerMap');
  const rows = [{id: 'c1', sales_members: [{id: 'u1'}, {id: 'u2'}]}, {id: 'c2', owner_user_ref_id: 'u3'}];
  const members = [{id: 'u1', name: '同名', team_ids: ['t1']}, {id: 'u2', name: '同名', team_ids: ['t2']}, {id: 'u3', name: '同名', team_ids: ['t2']}];
  assert.deepEqual(ids(scopedCustomers(rows, 't2', 'u2', members)), ['c1']);
  assert.deepEqual(ids(scopedCustomers(rows, 't1', 'u3', members)), []);
});

test('a rolling half-year or missing active window cannot be displayed as current-year activity', async () => {
  for (const payload of [{items: []}, {...mapResult([]), activity_since: '2026-03-29'}, {...mapResult([]), activity_since: '2025-01-01'}]) {
    const env = environment({getCustomerMap: async () => payload}), p = env.page('customers');
    await p.loadData(); assert.match(p.data.mapError, /当年活跃客户范围/); assert.equal(p.data.customers.length, 0);
  }
});

test('score repair posts once and a successful poll atomically makes count/list/points available', async () => {
  let reads = 0, posts = 0;
  const env = environment({getCustomerMap: async () => mapResult([row('c', ++reads === 1 ? {potential_score: null} : {})]), refreshCustomerMap: async () => {posts++; return {status: 'updating'};}}), p = env.page('customers');
  await p.loadData(); assert.equal(posts, 1); assert.equal(p.data.mapUpdating, true); assert.equal(p.data.activeCustomerCount, 1); assert.equal(p.data.plotCustomers.length, 0);
  await env.timers.next(); assert.equal(posts, 1); assert.equal(reads, 2); assert.equal(env.timers.size, 0);
  assert.equal(p.data.mapUpdating, false); assert.equal(p.data.activeCustomerCount, 1); assert.deepEqual(ids(p.data.customers), ids(p.data.plotCustomers));
});

test('repair polling stops after ten GETs, preserves the count and supports a new explicit retry', async () => {
  let reads = 0, posts = 0;
  const env = environment({getCustomerMap: async () => {reads++; return mapResult([row('c', {potential_score: null})]);}, refreshCustomerMap: async () => {posts++; return {status: 'ready'};}}), p = env.page('customers');
  await p.loadData(); for (let i = 0; i < 10; i++) await env.timers.next();
  assert.equal(posts, 1); assert.equal(reads, 11); assert.equal(env.timers.size, 0); assert.equal(p.data.activeCustomerCount, 1); assert.match(p.data.mapError, /稍后重试/);
  await p.loadData(); assert.equal(posts, 2); assert.equal(env.timers.size, 1); p.onHide(); assert.equal(env.timers.size, 0);
});

test('hidden page or changed identity rejects late map data and does not restart polling', async () => {
  for (const mode of ['hide', 'identity']) {
    const wait = deferred(), env = environment({getCustomerMap: () => wait.promise}), p = env.page('customers');
    const loading = p.loadData();
    if (mode === 'hide') p.onHide(); else env.app.globalData.session.userId = 'different-user';
    wait.resolve(mapResult([row('late')])); await loading;
    assert.equal(p.data.customers.length, 0); assert.equal(env.timers.size, 0);
  }
  const wait = deferred(), env = environment({getCustomerMap: async () => mapResult([row('c', {potential_score: null})]), refreshCustomerMap: () => wait.promise}), p = env.page('customers');
  const loading = p.loadData(); await tick(); p.onHide(); wait.resolve({status: 'updating'}); await loading; assert.equal(env.timers.size, 0);
});

test('all-customer asset totals are independent of active filters; late periods do not overwrite current totals', async () => {
  const waits = [], env = environment({getCustomerAssets: () => {const next = deferred(); waits.push(next); return next.promise;}}), p = env.page('customers');
  const first = p.loadAssets(); p.data.assetPeriod = 'all'; const second = p.loadAssets();
  waits[1].resolve(assetResult(20000000, 500)); await second; waits[0].resolve(assetResult(1, 1)); await first;
  p.visibleCustomers = []; p.data.keyword = '不存在'; p.applyFilters();
  assert.equal(p.data.acvText, '2,000'); assert.equal(p.data.scopeCustomerCount, 500); assert.equal(p.data.activeCustomerCount, 0);
});

const claimOptions = () => ({industries: [{value: '', label: '全部行业'}, {value: '软件', label: '软件'}], claim_statuses: [{value: '', label: '全部认领状态'}, {value: 'pending', label: '我的申请待审批'}]});
const claims = (items, total = items.length, offset = 0) => ({items, total, has_more: offset + items.length < total, next_offset: offset + items.length < total ? offset + items.length : null});
test('claim search, industry, status and paging retain a single server-filtered query', async () => {
  const calls = [], env = environment({listCustomerClaimOptions: async () => claimOptions(), listCustomerClaimPool: async options => {calls.push({...options}); return claims(Array.from({length: options.offset ? 1 : 50}, (_, i) => ({...row(String(i + options.offset)), can_claim: true})), 51, options.offset);}}), p = env.page('customer-claim');
  await p.loadCustomers('ST'); await p.changeIndustry({detail: {value: 1}}); await p.changeClaimStatus({detail: {value: 1}}); await p.loadMore();
  assert.equal(calls.at(-1).q, 'ST'); assert.equal(calls.at(-1).industry, '软件'); assert.equal(calls.at(-1).claimStatus, 'pending'); assert.equal(calls.at(-1).offset, 50);
  assert.equal(p.data.customers.length, 51); assert.equal(p.data.total, 51);
  await p.clearFilters(); assert.equal(calls.at(-1).q, ''); assert.equal(calls.at(-1).industry, undefined); assert.equal(p.data.hasFilters, false);
});

test('removed claim filter options clear hidden criteria; malformed options surface a retryable error', async () => {
  let options = claimOptions(); const calls = [];
  const env = environment({listCustomerClaimOptions: async () => options, listCustomerClaimPool: async query => {calls.push(query); return claims([]);}}), p = env.page('customer-claim');
  await p.loadCustomers(); await p.changeIndustry({detail: {value: 1}});
  options = {industries: [{value: '', label: '全部行业'}], claim_statuses: claimOptions().claim_statuses}; await p.refreshCustomers();
  assert.equal(p.data.industry, ''); assert.equal(p.data.industryIndex, 0); assert.equal(calls.at(-1).industry, undefined);
  options = {industries: [{value: 'bad', label: '没有全部项'}], claim_statuses: []}; await p.refreshCustomers();
  assert.match(p.data.optionsError, /筛选选项数据不完整/); assert.equal(p.data.optionsLoading, false);
});

test('claim confirmation locks duplicate submits; cancellation and stale replies do not change current facts', async () => {
  const wait = deferred(); let writes = 0;
  const env = environment({listCustomerClaimOptions: async () => claimOptions(), listCustomerClaimPool: async () => claims([{...row('c'), can_claim: true}]), claimCustomer: () => {writes++; return wait.promise;}}), p = env.page('customer-claim');
  await p.loadCustomers(); p.selectCustomer(event('id', 'c')); p.confirmClaim(); p.confirmClaim();
  assert.equal(env.modals.length, 1); env.modals[0].success({confirm: false}); assert.equal(writes, 0); assert.equal(p.data.submitting, false);
  p.confirmClaim(); env.modals[1].success({confirm: true}); await tick(); assert.equal(writes, 1);
  p.onHide(); await p.onShow(); wait.resolve({status: 'pending'}); await tick();
  assert.equal(p.data.resultMessage, ''); assert.equal(p.data.selectedCustomerId, ''); assert.equal(env.notices.length, 0);
});

test('customer detail preserves quarter plans, historical units and explicit partner/visit links', () => {
  const env = environment(), normalize = env.load('utils/customerDetail').normalizeCustomerDetail;
  const detail = normalize({id: 'c', name: '当前客户', opportunities: [{id: 'o', name: '季度商机', status: 'open', stage_code: 'identified', probability: 10, amount: 10000, expected_close_year: 2026, expected_close_quarter: 4, associated_partners: [{name: '关联伙伴'}], sales_channel: 'partner', partner_name: '转售伙伴', historical_period_actuals: [{year: 2024, quarter: 1, raw_amount: '1.234', source_unit: 'wan_cny', tax_basis: 'unknown', kind: 'recognized'}]}], visits: [{id: 'v', partner_id: 'p', partner_name: '拜访伙伴', original_recorder_name: '原记录人', recorder_name: '现录入人', manager_name: '业务经理', linked_opportunities: [{id: 'o', name: '季度商机'}]}]});
  assert.equal(detail.opportunities[0].expectedDate, '2026 Q4'); assert.equal(detail.opportunities[0].associatedPartnersText, '关联伙伴'); assert.equal(detail.opportunities[0].resalePartnerText, '转售伙伴');
  assert.equal(detail.opportunities[0].historicalPeriodRecords[0].amountText, '1.234万元');
  assert.equal(detail.visits[0].customerId, ''); assert.equal(detail.visits[0].partnerId, 'p'); assert.equal(detail.visits[0].owner, '原记录人'); assert.equal(detail.visits[0].managerName, '业务经理');
  assert.deepEqual(ids(detail.opportunities[0].relatedVisits), ['v']);
});

test('Web map binds its own lifecycle state, truthful active/portfolio labels and the shared person picker', () => {
  const ui = readFileSync(path.join(root, 'demo/web-src/department-ui/Customers.jsx'), 'utf8');
  assert.match(ui, /活跃客户列表/); assert.match(ui, /全部客户资产/); assert.match(ui, /客户 ACV · 万元/); assert.doesNotMatch(ui, /年度合同额/); assert.match(ui, /ControlledPersonPicker/);
  assert.match(ui, /loading=\{d\.mapLoading\}/); assert.match(ui, /d\.mapError \|\| d\.mapUpdating/);
  assert.doesNotMatch(ui, /先在客户列表登记关系和潜力|unrated=|loading=\{d\.acvLoading\}/);
  const detail = readFileSync(path.join(root, 'demo/web-src/department-ui/CustomerDetail.jsx'), 'utf8');
  assert.match(detail, /score \?\? '待评估'/); assert.match(detail, /associatedPartnersText/);
  const fallback = readFileSync(path.join(root, 'demo/web-src/business/pages/customers/index.wxml'), 'utf8');
  assert.match(fallback, /web-customer-detail-frame/); assert.match(fallback, /web-customer-workspace/);
});

function preview(seedState) {
  const storage = new Map(seedState ? [['sales-web:preview-workspace:v1', JSON.stringify(seedState)]] : []);
  const FixedDate = class extends Date {constructor(...args) {super(...(args.length ? args : ['2026-09-29T04:00:00Z']));} static now() {return Date.parse('2026-09-29T04:00:00Z');}};
  const window = {SALES_MODE: 'preview', localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)},
    setTimeout: fn => setTimeout(fn, 0), clearTimeout, fetch() {throw Error('Network use forbidden in this synthetic test');}};
  vm.runInNewContext(readFileSync(path.join(root, 'demo/web/preview-api.js'), 'utf8'), {window, Date: FixedDate, URL, URLSearchParams, console, Map, Set}, {filename: 'preview-api.js'});
  if (!seedState) window.SalesPreview.reset();
  const request = (url, role = 'sales', method = 'GET', data) => new Promise(resolve => window.SalesPreview.request({url: '/api/v1' + url, method, data, header: {Authorization: `Bearer preview-access-${role}`}, success: resolve}));
  return {request, seed: () => JSON.parse(storage.get('sales-web:preview-workspace:v1'))};
}
async function previewFixture() {
  const base = preview(), s = base.seed();
  const sales = (await base.request('/auth/me')).data.actor;
  const supervisor = (await base.request('/auth/me', 'supervisor')).data.actor;
  const fde = (await base.request('/auth/me', 'fde')).data.actor;
  const customerRow = (id, extra = {}) => ({...s.customers[0], ...row(id), owner_id: sales.user_id, owner_user_ref_id: sales.user_id, owner_team_id: sales.team_ids[0], sales_members: [{id: sales.user_id}], ...extra});
  s.customers = ['jan', 'last-year', 'draft', 'future', 'missing', 'silent'].map(id => customerRow(id));
  s.customers.push(customerRow('foreign', {owner_id: supervisor.user_id, owner_user_ref_id: supervisor.user_id, owner_team_id: 'foreign-team', sales_members: [{id: supervisor.user_id}]}));
  s.customers.find(c => c.id === 'missing').potential_score = null;
  const visit = (id, customer_id, visit_date, status = 'archived') => ({id, customer_id, visit_date, status, recorder_id: sales.user_id});
  s.visits = [visit('j1','jan','2026-01-01'), visit('j2','jan','2026-09-29'), visit('l','last-year','2025-12-31'), visit('d','draft','2026-09-01','draft'), visit('f','future','2026-09-30'), visit('m','missing','2026-05-01'), visit('x','foreign','2026-09-01'), {...visit('linked',null,'2026-09-01'), linked_opportunities:[{id:'silent-op'}]}];
  const opportunity = (id, customer_id, amount, status = 'open') => ({id, customer_id, name: id, amount, status, owner_id: sales.user_id, team_id: sales.team_ids[0], fde_member_ids: customer_id === 'jan' ? [fde.user_id] : [], expected_close_year: 2026, expected_close_quarter: 4});
  s.opportunities = [opportunity('jan-op','jan',10000), opportunity('silent-op','silent',20000), opportunity('unknown','missing',null), opportunity('closed','jan',999999,'won'), {...opportunity('foreign-op','foreign',50000), owner_id: supervisor.user_id, team_id:'foreign-team'}];
  s.actuals = []; s.claims = []; s.tasks = []; s.notifications = [];
  return {s, sales, supervisor, fde, customerRow, env: preview(s)};
}

test('actual preview: January-to-today archived visits, authorization and client count/list/points share one set', async () => {
  const {env, sales} = await previewFixture();
  const response = await env.request('/customer-assets/map?page_size=1');
  assert.equal(response.statusCode, 200); assert.equal(response.data.demo, true);
  assert.equal(response.data.activity_since, '2026-01-01'); assert.equal(response.data.as_of, '2026-09-29');
  assert.deepEqual(ids(response.data.items), ['jan', 'missing']); assert.equal(response.data.total, 2);
  const controller = environment(), p = controller.page('customers'); p.data.currentPlanYear = 2026;
  p.receiveMapPage(response.data); p.applyFilters(); assert.equal(p.data.mapUpdating, true); assert.equal(p.data.activeCustomerCount, 2); assert.equal(p.data.plotCustomers.length, 0);
  const manager = await env.request('/customer-assets/map', 'manager'); assert.deepEqual(ids(manager.data.items), ['jan', 'missing', 'foreign']);
  const own = await env.request('/customer-assets/map?owner_id=' + sales.user_id, 'manager'); assert.deepEqual(ids(own.data.items), ['jan', 'missing']);
  const fde = await env.request('/customer-assets/map?scope=self', 'fde'); assert.deepEqual(ids(fde.data.items), ['jan']);
  p.receiveMapPage(fde.data); p.applyFilters(); assert.equal(p.data.activeCustomerCount, 1); assert.deepEqual(ids(p.data.customers), ids(p.data.plotCustomers)); assert.equal(p.visibleCustomers[0].agentPlanSegment, 'current_year');
  assert.equal((await env.request('/customer-assets/map?member_ids=forbidden')).statusCode, 403);
});

test('actual preview: full portfolio ACV excludes closed opportunities and retains unknown-source metadata', async () => {
  const {env, sales} = await previewFixture();
  for (const period of ['year','all']) {
    const response = await env.request('/customer-assets?period=' + period);
    assert.equal(response.statusCode, 200); assert.equal(response.data.summary.portfolio_customer_count, 6);
    assert.equal(response.data.summary.acv_amount, 30000); assert.equal(response.data.summary.unknown_acv_count, 1);
  }
  const selected = await env.request('/customer-assets?owner_id=' + sales.user_id, 'manager');
  assert.equal(selected.data.summary.portfolio_customer_count, 6); assert.equal(selected.data.summary.acv_amount, 30000);
  const map = (await env.request('/customer-assets/map')).data;
  assert.equal(map.items.find(c => c.id === 'missing').acv_amount, null);
});

test('actual preview: score refresh remains synthetic and never invents missing or blank coordinates', async () => {
  const {s, fde} = await previewFixture(); s.customers.find(c=>c.id==='missing').potential_score = '';
  const env = preview(s), before = (await env.request('/customer-assets/map')).data;
  const response = await env.request('/customer-assets/map/refresh', 'sales', 'POST');
  assert.equal(response.data.status, 'updating');
  const after = (await env.request('/customer-assets/map')).data;
  assert.equal(after.items.find(c=>c.id==='missing').potential_score, ''); assert.deepEqual(ids(before.items), ids(after.items));
  assert.equal((await env.request('/customer-assets/map/refresh?scope=self&member_ids=' + fde.user_id, 'fde', 'POST')).data.status, 'ready');
});

test('actual preview: claim options/filter/status/pagination and Chinese/pinyin/initials use the same directory', async () => {
  const {s, sales, customerRow} = await previewFixture();
  s.customers = Array.from({length: 61}, (_, i) => customerRow(String(i), {name: i === 0 ? '南海精工机械有限公司' : `合成软件客户${i}`, industry_code: i < 55 ? '软件' : '金融', owner_id:null, owner_user_ref_id:null, sales_members:[]}));
  s.claims = [{id:'pending',customer_id:'1',applicant_user_id:sales.user_id,status:'pending'},{id:'rejected',customer_id:'2',applicant_user_id:sales.user_id,status:'rejected'}]; s.opportunities = []; s.visits = [];
  const env = preview(s), options = await env.request('/customers/claim-pool/options');
  assert.equal(options.statusCode, 200); assert.equal(options.data.industries[0].value, '');
  const pending = await env.request('/customers/claim-pool?industry=' + encodeURIComponent('软件') + '&claim_status=pending');
  assert.deepEqual(ids(pending.data.items), ['1']); assert.equal(pending.data.items[0].can_claim, false);
  const unclaimed = await env.request('/customers/claim-pool?industry=' + encodeURIComponent('软件') + '&claim_status=unclaimed&page_size=50&offset=50');
  assert.equal(unclaimed.data.total, 53); assert.equal(unclaimed.data.items.length, 3); assert.equal(unclaimed.data.has_more, false);
  for (const q of ['南海','nanhai','NHJG']) assert.deepEqual(ids((await env.request('/customers/claim-pool?q=' + encodeURIComponent(q))).data.items), ['0']);
  assert.equal((await env.request('/customers/claim-pool','fde')).statusCode, 403);
  assert.equal((await env.request('/customers/claim-pool/options','fde')).statusCode, 403);
});

test('customer creation/assignment options failures stop loading and expose retryable state', async () => {
  for (const route of ['customer-create','customer-assign-confirm']) {
    const env = environment({getBusinessOptions: async () => {throw Error('合成选项服务失败');}}), p = env.page(route);
    env.app.globalData.session.permissions = {'customer.create': true};
    await p.onLoad(); assert.equal(p.data.loading, false); assert.equal(p.data.loadError, '合成选项服务失败');
  }
});

test('historical assets remain read-only and preserve original quarter/tax metadata', async () => {
  const env = environment({getCustomerAssets: async () => ({basis:'historical',historical_count:1,items:[{id:'h',customer_id:'c',customer_name:'合成客户',amount:540000,occurred_on:null,period_label:'2026 Q2',tax_basis:'unknown',source_ref:'Q2原始确收'}],summary:{recognized_amount:540000,collection_amount:null,entry_count:1},has_more:false,can_manage:true,as_of:'2026-09-29'})}), p = env.page('customer-assets');
  p.onLoad({basis:'historical',customer_id:'c',customer_name:'合成客户'}); await p.load();
  assert.equal(p.data.items[0].occurred_on, null); assert.equal(p.data.items[0].period_label, '2026 Q2'); assert.equal(p.data.items[0].taxBasisText, '税口径未确认');
  await p.openForm(); p.voidEntry(event('id','h')); assert.equal(p.data.formOpen,false); assert.equal(env.modals.length,0);
  const ui = readFileSync(path.join(root,'demo/web-src/department-ui/CustomerAssets.jsx'),'utf8');
  assert.match(ui,/period_label/); assert.match(ui,/!historical/); assert.match(ui,/历史季度原值 · 只读/);
});
