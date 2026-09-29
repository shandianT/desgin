// AMT-02: execute the generated Web business modules with synthetic API receipts.
// This suite does not load the supplied native package, use a network, or prove
// server validation, browser presentation, or a production save.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {posix} from 'node:path';
import {runInNewContext} from 'node:vm';

const bundle = JSON.parse(readFileSync(new URL('../demo/web/bundle.js', import.meta.url), 'utf8')
  .slice('window.SALES_BUNDLE='.length).trim().replace(/;$/, ''));
const preview = readFileSync(new URL('../demo/web/preview-api.js', import.meta.url), 'utf8');
const businessOptions = JSON.parse(preview.match(/const BUSINESS_OPTIONS = (\{[^\n]+\});/)[1]);
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
};
const policy = (threshold = 1000) => ({opportunity_amount: {
  source: 'synthetic-test', definition: {schema_version: 1, warning_threshold_wan: threshold},
}});
const clone = value => structuredClone(value);

function setData(values, callback) {
  for (const [key, value] of Object.entries(values)) {
    const parts = key.split('.');
    let target = this.data;
    while (parts.length > 1) {
      const part = parts.shift();
      target = target[part] || (target[part] = {});
    }
    target[parts[0]] = value;
  }
  callback?.();
}

function harness(pageName, overrides = {}) {
  const session = {workspaceId: 'synthetic-company', userId: 'synthetic-seller', userName: '合成销售',
    role: 'sales', permissionVersion: 'v1', loginAt: 'session-one',
    capabilities: {'opportunity.edit': true, 'visit.create': true}};
  const app = {globalData: {session, role: 'sales'}, ensureLogin: () => true, guardPage: () => true};
  const posts = [], quality = [], policyReads = [], modals = [], toasts = [], navigations = [];
  const storage = new Map(), cache = new Map(), definitions = new Map();
  const api = {
    request: async () => ({items: []}),
    listOpportunities: async () => ({items: [], has_more: false, next_offset: null}),
    checkOpportunityName: async () => ({available: true}),
    getCompanyPresentation: async () => { policyReads.push(clone(app.globalData.session)); return policy(); },
    submitVisitStage: async (stage, payload) => {
      quality.push({stage, payload: clone(payload)});
      return {run_id: 'synthetic-quality'};
    },
    waitVisitRun: async () => ({result: {visit_stage: 'quality',
      quality_review: {follow_up_score: 85, next_action: {passed: true}}}}),
    createOpportunity: async (customer, payload) => {
      posts.push({kind: 'opportunity', customer, payload: clone(payload)});
      return {id: payload.opportunity_id || 'synthetic-opportunity', changed: true,
        event_id: 'synthetic-event', version_no: (payload.version_no || 0) + 1};
    },
    createVisit: async (customer, fields) => {
      posts.push({kind: 'visit', customer, fields: clone(fields)});
      return {id: 'synthetic-visit', fields: {}};
    },
    queryBusinessAdvice: async () => ({id: 'synthetic-advice'}),
    ...overrides,
  };
  const wx = {
    getStorageSync: key => clone(storage.get(key)),
    setStorageSync: (key, value) => storage.set(key, clone(value)),
    removeStorageSync: key => storage.delete(key),
    showModal: modal => modals.push(modal),
    showToast: toast => toasts.push(toast),
    setNavigationBarTitle() {}, pageScrollTo() {},
    nextTick: callback => callback(),
    navigateBack: options => navigations.push(options),
  };
  function load(id) {
    if (id === 'utils/apiClient') return api;
    if (cache.has(id)) return cache.get(id).exports;
    assert.equal(typeof bundle.modules[id], 'string', `Generated bundle is missing ${id}`);
    const module = {exports: {}};
    cache.set(id, module);
    runInNewContext(bundle.modules[id], {
      module, exports: module.exports,
      require: path => load(posix.normalize(posix.join(posix.dirname(id), path))),
      Page: definition => definitions.set(id, definition),
      Component: definition => definitions.set(id, definition),
      getApp: () => app, wx, console,
      setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    }, {filename: `generated-web/${id}.js`});
    return module.exports;
  }
  load('utils/businessOptions').install(clone(businessOptions));
  const id = `pages/${pageName}/index`;
  load(id);
  const definition = definitions.get(id);
  assert(definition, `Generated page ${id} was not registered`);
  const page = {...definition, data: clone(definition.data), setData};
  function form(existing = null, draft = null, visit = false) {
    const id = 'components/opportunity-form/index';
    load(id);
    const definition = definitions.get(id);
    const component = {...definition.methods, data: clone(definition.data), setData,
      properties: {customerId: 'synthetic-customer', existing, savedDraft: draft, visitContext: visit},
      triggerEvent: (_, detail) => { if (visit) page.changeOpportunityForm({detail}); },
    };
    component.reset();
    page.selectComponent = () => component;
    return component;
  }
  return {page, form, load, app, session, api, posts, quality, policyReads, modals, storage, toasts, navigations};
}

function standalone(wan = '1000', overrides = {}, existing = null) {
  const h = harness('opportunity-create', overrides);
  h.page.setData({customerId: 'synthetic-customer', customerName: '合成测试客户', existing});
  h.page.opportunityId = existing?.id || '';
  h.component = h.form(existing);
  Object.assign(h.component.data.form, {name: '合成商机', amount: wan, stageIndex: 0,
    expected_close_date: '2026-12-31', partner_mode: 'direct'});
  return h;
}

async function visit(wan = '1000', overrides = {}, existing = null) {
  const h = harness('visit-confirm', overrides);
  const scope = h.load('utils/draftScope').draftScope(h.session);
  h.storage.set(`visitStructuredV2:${scope}`, {draftId: 'synthetic-entry', runId: 'synthetic-structure',
    customerHintId: 'synthetic-customer', customerHint: '合成测试客户', result: {fields: {
      follow_up_record: '合成测试：确认试点范围', next_action: '9月30日销售提交合成方案',
      contact_name: '合成联系人', interaction_at: '2026-09-29', created_date: '2026-09-29',
    }}});
  h.page.onLoad({});
  await tick();
  // Set an already human-reviewed draft explicitly. AI unit normalization is a
  // separate work item, and must not be accidentally claimed by AMT-02.
  const draft = {...h.load('utils/opportunity').formFor(existing), name: '合成商机', amount: wan, stageIndex: 0,
    expected_close_date: '2026-12-31', partner_mode: 'direct'};
  const opportunityId = existing?.id || '__new__';
  h.page.setData({opportunityId, opportunityEditing: true, selectedOpportunity: existing,
    opportunityDraft: draft, opportunityOptions: [{id: '', name: '不关联商机'},
      existing || {id: '__new__', name: '新建商机'}], opportunityIndex: 1});
  h.component = h.form(existing, draft, true);
  await h.page.review();
  assert.equal(h.page.data.canSubmit, true, h.page.data.errorText || h.page.data.blockReason);
  assert.equal(h.quality.length, 1);
  assert.equal(h.policyReads.length, 0, 'Quality review must not request final-save amount confirmation');
  assert.equal(h.modals.length, 0);
  return h;
}

async function confirm(h, index = h.modals.length - 1, yes = true) {
  assert(h.modals[index], 'Expected a human confirmation modal');
  await h.modals[index].success({confirm: yes, cancel: !yes});
  await tick();
}
const existingOpportunity = (amount = '10000000.00') => ({id: 'synthetic-existing', amount,
  name: '旧合成商机', probability: 10, status: 'open', version_no: 2,
  sales_channel: 'direct', expected_close_date: '2026-12-31', quarterly_forecasts: []});

test('AMT-02 module uses current company threshold below/equal/above and no guessed fallback', async () => {
  const amounts = standalone().load('utils/opportunityAmount');
  for (const [value, required] of [[9999999.99, false], [10000000, true], [10000000.01, true]]) {
    const assessment = await amounts.assess({getCompanyPresentation: async () => policy()}, {action: 'create', amount: value});
    assert.equal(assessment.required, required, String(value));
    assert.equal(amounts.acknowledged(assessment).amount_confirmed_value, required ? value : undefined);
  }
  assert.equal((await amounts.assess({getCompanyPresentation: async () => policy(2000)},
    {action: 'create', amount: 10000000})).required, false);
  for (const invalid of [null, {}, policy(0), policy(1.5), policy('1000'),
    {opportunity_amount: {definition: {schema_version: 2, warning_threshold_wan: 1000}}}]) {
    await assert.rejects(amounts.assess({getCompanyPresentation: async () => invalid},
      {action: 'create', amount: 10000000}), /规则加载失败/);
  }
});

test('AMT-02 unchanged exact historical amount skips policy and removes any old acknowledgment', async () => {
  const amounts = standalone().load('utils/opportunityAmount');
  const existing = existingOpportunity();
  const result = await amounts.assess({getCompanyPresentation: async () => assert.fail('Unchanged amount must skip policy')},
    {action: 'update', opportunity_id: existing.id, amount: 10000000, amount_confirmed_value: 10000000}, existing);
  assert.equal(result.required, false);
  assert(!('amount_confirmed_value' in amounts.acknowledged(result)));
  assert.equal((await amounts.assess({getCompanyPresentation: async () => policy()},
    {action: 'update', opportunity_id: existing.id, amount: 9007199254740991},
    {...existing, amount: '9007199254740991.01'})).required, true, 'Do not compare historical exact strings using rounded Number');
});

for (const [wan, expected] of [['999.999999', false], ['1000', true], ['1000.000001', true]]) {
  test(`AMT-02 generated new page threshold boundary ${wan} 万元`, async () => {
    const h = standalone(wan);
    const pending = h.page.submit(); await tick();
    assert.equal(h.modals.length, expected ? 1 : 0);
    if (expected) {
      assert.equal(h.posts.length, 0);
      await confirm(h);
    }
    await pending;
    assert.equal(h.posts.length, 1);
    const payload = h.posts[0].payload;
    assert.equal(payload.amount, h.load('utils/opportunity').amount(wan));
    assert.equal(payload.amount_confirmed_value, expected ? payload.amount : undefined);
    assert(!('amount_confirmed_value' in h.component.data.form));
  });
}

test('AMT-02 cancel then retry reads current company policy and cannot reuse an old acknowledgment', async () => {
  let reads = 0;
  const h = standalone('1000', {getCompanyPresentation: async () => {
    reads++;
    if (reads === 1) throw Error('synthetic offline');
    return policy(reads === 2 ? 1000 : 2000);
  }});
  h.component.data.form.amount_confirmed_value = 10000000;
  await h.page.submit();
  assert.equal(h.posts.length, 0); assert.equal(h.modals.length, 0);
  assert.equal(h.component.data.form.amount, '1000'); assert.equal(h.page.data.busy, false);
  assert.match(h.page.data.error, /规则加载失败/);
  const cancel = h.page.submit(); await tick(); await confirm(h, 0, false); await cancel;
  assert.equal(h.posts.length, 0); assert.equal(h.component.data.form.amount, '1000');
  await h.page.submit();
  assert.equal(reads, 3); assert.equal(h.modals.length, 1); assert.equal(h.posts.length, 1);
  assert(!('amount_confirmed_value' in h.posts[0].payload));
});

test('AMT-02 generated new page rejects repeat saves and repeated confirmation callbacks', async () => {
  const h = standalone('1000.000001');
  const pending = h.page.submit(); await tick();
  await h.page.submit();
  assert.equal(h.modals.length, 1); assert.equal(h.posts.length, 0);
  await Promise.all([confirm(h), confirm(h)]); await pending;
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].payload.amount_confirmed_value, 10000000.01);
});

for (const [name, change] of [
  ['amount', h => { h.component.data.form.amount = '1001'; }],
  ['customer', h => { h.page.data.customerId = 'different-customer'; }],
  ['opportunity', h => { h.page.opportunityId = 'different-opportunity'; }],
  ['record version', h => { h.page.data.existing = existingOpportunity(); }],
  ['account', h => { h.session.userId = 'different-user'; }],
  ['company', h => { h.session.workspaceId = 'different-company'; }],
  ['login', h => { h.session.loginAt = 'new-login'; }],
  ['permission version', h => { h.session.permissionVersion = 'v2'; }],
  ['hidden page', h => h.page.onHide()],
  ['unloaded page', h => h.page.onUnload()],
]) {
  test(`AMT-02 new-page confirmation becomes invalid after ${name} changes`, async () => {
    const h = standalone(); const pending = h.page.submit(); await tick();
    change(h); await confirm(h); await pending;
    assert.equal(h.posts.length, 0);
  });
}

test('AMT-02 late policy response cannot open a confirmation for changed amount', async () => {
  const delayed = deferred();
  const h = standalone('1000', {getCompanyPresentation: () => delayed.promise});
  const pending = h.page.submit(); await tick();
  h.component.data.form.amount = '1001'; delayed.resolve(policy()); await pending;
  assert.equal(h.modals.length, 0); assert.equal(h.posts.length, 0);
});

for (const value of ['10000000.00', '10000000.67']) {
  test(`AMT-02 edit name with unchanged historical ${value} 元 saves without policy/ack`, async () => {
    const old = existingOpportunity(value);
    const h = standalone(String(Number(value) / 10000), {
      getCompanyPresentation: async () => assert.fail('Unchanged amount must not read policy'),
    }, old);
    await h.page.submit();
    assert.equal(h.modals.length, 0); assert.equal(h.posts.length, 1);
    assert.equal(h.posts[0].payload.action, 'update');
    assert.equal(h.posts[0].payload.opportunity_id, old.id);
    assert.equal(h.posts[0].payload.amount, Number(value));
    assert(!('amount_confirmed_value' in h.posts[0].payload));
  });
}

test('AMT-02 editing ACV to a different large amount requires a new exact acknowledgment', async () => {
  const old = existingOpportunity('5000000');
  const h = standalone('1000.000001', {}, old);
  const pending = h.page.submit(); await tick(); await confirm(h); await pending;
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].payload.action, 'update');
  assert.equal(h.posts[0].payload.version_no, old.version_no);
  assert.equal(h.posts[0].payload.amount, 10000000.01);
  assert.equal(h.posts[0].payload.amount_confirmed_value, 10000000.01);
});

for (const [wan, expected] of [['999.999999', false], ['1000', true], ['1000.000001', true]]) {
  test(`AMT-02 visit archive ${wan} 万元 confirms only at final archive`, async () => {
    const h = await visit(wan);
    assert(!('amount_confirmed_value' in h.quality[0].payload.opportunity_mutation));
    await h.page.archive();
    assert.equal(h.modals.length, 1, 'Visit still needs its human archive confirmation below the amount threshold');
    assert.equal(h.posts.length, 0);
    if (expected) assert.match(h.modals[0].content, /本公司.*提醒值/);
    await confirm(h);
    assert.equal(h.posts.length, 1);
    const mutation = h.posts[0].fields._opportunity_mutation;
    assert.equal(mutation.amount, h.load('utils/opportunity').amount(wan));
    assert.equal(mutation.amount_confirmed_value, expected ? mutation.amount : undefined);
    assert.equal(h.posts[0].fields._quality_review_run_id, 'synthetic-quality');
    assert(!('amount_confirmed_value' in h.page.data.reviewPayload.opportunity_mutation));
  });
}

test('AMT-02 visit cancel keeps review and draft; a second final confirmation saves only once', async () => {
  const h = await visit();
  h.page.data.reviewPayload.opportunity_mutation.amount_confirmed_value = 1;
  await h.page.archive(); await confirm(h, 0, false);
  assert.equal(h.posts.length, 0); assert.equal(h.page.data.reviewRunId, 'synthetic-quality');
  assert.equal(h.page.data.opportunityDraft.amount, '1000');
  await h.page.archive(); await h.page.archive();
  assert.equal(h.modals.length, 2);
  await Promise.all([confirm(h, 1), confirm(h, 1)]);
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].fields._opportunity_mutation.amount_confirmed_value, 10000000);
  assert.equal(h.quality.length, 1);
});

test('AMT-02 direct visit submit without a real confirmation ticket cannot save', async () => {
  const h = await visit();
  const mutation = clone(h.page.data.reviewPayload.opportunity_mutation);
  mutation.amount_confirmed_value = mutation.amount;
  h.page.submitArchive(mutation);
  h.page.submitArchive(mutation, {started: true, visible: () => true});
  await tick();
  assert.equal(h.posts.length, 0, 'A caller-supplied acknowledgment is not a human archive confirmation');
  assert.equal(h.page.data.canSubmit, true);
  assert.equal(h.page.data.busy, false);
  assert.equal(h.page.data.archived, false);
  assert.equal(h.page.data.reviewRunId, 'synthetic-quality');
});

test('AMT-02 an open archive dialog does not authorize direct submit before confirmation', async () => {
  const h = await visit(); await h.page.archive();
  const ticket = h.page.pageWrites.archiveConfirm;
  assert(ticket && !ticket.started);
  const mutation = clone(h.page.data.reviewPayload.opportunity_mutation);
  mutation.amount_confirmed_value = mutation.amount;
  h.page.submitArchive(mutation, ticket);
  await tick();
  assert.equal(h.posts.length, 0);
  assert.equal(ticket.consumed, undefined, 'An unconfirmed ticket must remain available for the real dialog callback');
  await confirm(h);
  assert.equal(h.posts.length, 1);
  assert.equal(ticket.consumed, true);
});

test('AMT-02 a consumed archive ticket cannot retry a failed write or authorize a later dialog', async () => {
  let writes = 0;
  const h = await visit('1000', {createVisit: async () => {
    writes++; throw Error('synthetic archive failed');
  }});
  await h.page.archive();
  const consumedTicket = h.page.pageWrites.archiveConfirm;
  const mutation = clone(h.page.data.reviewPayload.opportunity_mutation);
  mutation.amount_confirmed_value = mutation.amount;
  await confirm(h);
  assert.equal(consumedTicket.consumed, true);
  assert.equal(h.page.data.busy, false);
  assert.equal(h.page.data.archived, false);
  h.page.submitArchive(mutation, consumedTicket);
  await tick();
  assert.equal(writes, 1, 'Write failure does not make the consumed ticket reusable');
  await h.page.archive();
  const currentTicket = h.page.pageWrites.archiveConfirm;
  assert.notEqual(currentTicket, consumedTicket);
  h.page.submitArchive(mutation, consumedTicket);
  await tick();
  assert.equal(writes, 1, 'A stale ticket cannot authorize the current pending dialog');
  assert.equal(currentTicket.consumed, undefined);
  await confirm(h, 1);
  assert.equal(writes, 2, 'Only the new human confirmation can authorize the retry');
});

for (const [name, leave] of [
  ['hidden', h => h.page.onHide()],
  ['unloaded', h => h.page.onUnload()],
]) {
  test(`AMT-02 direct archive submit rejects a started ticket after the page is ${name}`, async () => {
    const h = await visit(); await h.page.archive();
    const ticket = h.page.pageWrites.archiveConfirm;
    assert.equal(ticket.start(), true);
    const mutation = clone(h.page.data.reviewPayload.opportunity_mutation);
    mutation.amount_confirmed_value = mutation.amount;
    leave(h);
    h.page.submitArchive(mutation, ticket);
    await tick();
    assert.equal(h.posts.length, 0);
    assert.equal(h.page.data.archived, false);
    assert.equal(h.page.data.busy, false);
  });
}

test('AMT-02 visit policy failure preserves completed quality review and retries only policy', async () => {
  let reads = 0;
  const h = await visit('1000', {getCompanyPresentation: async () => {
    if (++reads === 1) throw Error('synthetic offline'); return policy();
  }});
  await h.page.archive();
  assert.match(h.page.data.errorText, /规则加载失败/);
  assert.equal(h.page.data.reviewRunId, 'synthetic-quality'); assert.equal(h.page.data.canSubmit, true);
  assert.equal(h.modals.length, 0); assert.equal(h.posts.length, 0);
  await h.page.archive(); await confirm(h);
  assert.equal(reads, 2); assert.equal(h.quality.length, 1); assert.equal(h.posts.length, 1);
});

for (const [name, change] of [
  ['amount', h => { h.page.data.opportunityDraft.amount = '1001'; }],
  ['customer', h => { h.page.data.customerId = 'different-customer'; }],
  ['opportunity', h => { h.page.data.opportunityId = 'different-opportunity'; }],
  ['quality run', h => { h.page.data.reviewRunId = 'different-review'; }],
  ['record version', h => { h.page.data.selectedOpportunity = existingOpportunity(); }],
  ['account', h => { h.session.userId = 'different-user'; }],
  ['company', h => { h.session.workspaceId = 'different-company'; }],
  ['permission version', h => { h.session.permissionVersion = 'v2'; }],
  ['hidden page', h => h.page.onHide()],
  ['unloaded page', h => h.page.onUnload()],
]) {
  test(`AMT-02 visit confirmation becomes invalid after ${name} changes`, async () => {
    const h = await visit(); await h.page.archive(); change(h); await confirm(h);
    assert.equal(h.posts.length, 0);
  });
}

test('AMT-02 visit with unchanged large existing opportunity skips amount policy but keeps archive confirmation', async () => {
  const old = existingOpportunity('10000000.67');
  const h = await visit('1000.000067', {
    getCompanyPresentation: async () => assert.fail('Unchanged visit amount must skip policy'),
  }, old);
  await h.page.archive(); assert.equal(h.modals.length, 1); await confirm(h);
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].fields._opportunity_mutation.amount, 10000000.67);
  assert(!('amount_confirmed_value' in h.posts[0].fields._opportunity_mutation));
});

test('AMT-02 a failed opportunity write keeps the form and requires confirmation again', async () => {
  let writes = 0;
  const h = standalone('1000.000001', {createOpportunity: async () => {
    writes++; throw Error('synthetic write failed');
  }});
  const first = h.page.submit(); await tick(); await confirm(h); await first;
  assert.equal(h.component.data.form.amount, '1000.000001'); assert.equal(h.page.data.busy, false);
  assert.match(h.page.data.error, /synthetic write failed/);
  const second = h.page.submit(); await tick();
  assert.equal(writes, 1); assert.equal(h.modals.length, 2);
  await confirm(h, 1, false); await second; assert.equal(writes, 1);
});

test('AMT-02 failed visit write retains its quality review; retry needs a new archive confirmation', async () => {
  let writes = 0;
  const h = await visit('1000', {createVisit: async () => {
    writes++; throw Error('synthetic archive failed');
  }});
  await h.page.archive(); await confirm(h);
  assert.equal(h.page.data.archived, false); assert.equal(h.page.data.reviewRunId, 'synthetic-quality');
  assert.equal(h.page.data.opportunityDraft.amount, '1000'); assert.equal(h.page.data.busy, false);
  assert.match(h.page.data.errorText, /synthetic archive failed/);
  await h.page.archive(); assert.equal(h.modals.length, 2); assert.equal(writes, 1);
  await confirm(h, 1, false); assert.equal(writes, 1); assert.equal(h.quality.length, 1);
});

test('AMT-02 late visit policy response cannot open confirmation after company changes', async () => {
  const delayed = deferred();
  const h = await visit('1000', {getCompanyPresentation: () => delayed.promise});
  const pending = h.page.archive(); await tick();
  h.session.workspaceId = 'different-company'; delayed.resolve(policy()); await pending;
  assert.equal(h.modals.length, 0); assert.equal(h.posts.length, 0);
});

// Unlike the page harness, this loader retains the actual generated apiClient
// and requestIdentity modules. wx.request is an observable transport boundary.
function transportRuntime() {
  const storage = new Map(), requests = [], cache = new Map();
  const wx = {
    getStorageSync: key => clone(storage.get(key)),
    setStorageSync: (key, value) => storage.set(key, clone(value)),
    removeStorageSync: key => storage.delete(key),
    request: options => requests.push(options),
  };
  function load(id) {
    if (cache.has(id)) return cache.get(id).exports;
    assert.equal(typeof bundle.modules[id], 'string', `Missing generated module ${id}`);
    const module = {exports: {}}; cache.set(id, module);
    runInNewContext(bundle.modules[id], {module, exports: module.exports, wx, console,
      require: path => load(posix.normalize(posix.join(posix.dirname(id), path))),
      setTimeout, clearTimeout,
    }, {filename: `generated-web/${id}.js`});
    return module.exports;
  }
  return {load, requests, storage};
}

test('AMT-02 company policy reads bypass shared in-flight GETs and reject stale-session responses', async () => {
  const {load, requests} = transportRuntime();
  const api = load('utils/apiClient');
  const first = api.getCompanyPresentation(), second = api.getCompanyPresentation();
  assert.equal(requests.length, 2, 'Each final save must read current policy independently');
  assert(requests.every(request => request.url.endsWith('/company-rules/presentation')));
  requests[0].success({statusCode: 200, data: policy(1000)});
  requests[1].success({statusCode: 200, data: policy(2000)});
  assert.equal((await first).opportunity_amount.definition.warning_threshold_wan, 1000);
  assert.equal((await second).opportunity_amount.definition.warning_threshold_wan, 2000);
  const sharedFirst = api.request({path: '/synthetic-read'}), sharedSecond = api.request({path: '/synthetic-read'});
  assert.equal(requests.length, 3, 'Unrelated ordinary GET sharing remains intact');
  requests[2].success({statusCode: 200, data: {value: 1}});
  await Promise.all([sharedFirst, sharedSecond]);
  const late = api.getCompanyPresentation();
  api.saveAuth({access_token: 'synthetic-token', actor: {workspace_id: 'other', user_id: 'other'}});
  requests[3].success({statusCode: 200, data: policy()});
  await assert.rejects(late, error => error.code === 'SESSION_CHANGED');
});

test('AMT-02 idempotency ignores only the transient acknowledgment on the two formal POST contracts', () => {
  const {load} = transportRuntime();
  const identity = load('utils/requestIdentity'), scope = ['/api/v1', 'synthetic-company', 'synthetic-user'];
  const begin = (path, data, method = 'POST', actorScope = scope) => identity.begin(actorScope, {path, method, data});
  const body = {action: 'create', amount: 10000000, name: '合成商机', amount_confirmed_value: 10000000};
  const without = {...body}; delete without.amount_confirmed_value;
  const first = begin('/customers/customer/opportunities', body);
  const retry = begin('/customers/customer/opportunities', without);
  assert.equal(first.key, retry.key); assert.equal(first.fingerprint, retry.fingerprint);
  assert.equal(body.amount_confirmed_value, 10000000, 'Fingerprint generation must not delete the transmitted acknowledgment');
  assert.notEqual(first.key, begin('/customers/customer/opportunities', {...body, amount: 10000001}).key);
  assert.notEqual(first.key, begin('/customers/customer/opportunities', body, 'POST', ['/api/v1', 'other-company', 'synthetic-user']).key);
  const visitBody = {customer_id: 'customer', fields: {_opportunity_mutation: body, follow_up_record: '合成跟进'}};
  const visitRetry = {customer_id: 'customer', fields: {_opportunity_mutation: without, follow_up_record: '合成跟进'}};
  assert.equal(begin('/visits', visitBody).key, begin('/visits', visitRetry).key);
  assert.equal(visitBody.fields._opportunity_mutation.amount_confirmed_value, 10000000);
  assert.notEqual(begin('/visits', visitBody).key, begin('/visits', {...visitRetry,
    fields: {...visitRetry.fields, follow_up_record: '另一次跟进'}}).key);
  assert.notEqual(begin('/tasks', body).key, begin('/tasks', without).key, 'Do not strip arbitrary fields on other writes');
  assert.notEqual(begin('/visits/existing', body, 'PATCH').key, begin('/visits/existing', without, 'PATCH').key);
  assert.notEqual(begin('/visits', {...visitRetry, amount_confirmed_value: 10}).key,
    begin('/visits', {...visitRetry, amount_confirmed_value: 20}).key, 'Only nested visit opportunity confirmation is transient');
});

function previewRuntime() {
  const storage = new Map();
  const window = {SALES_MODE: 'preview', localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  }, setTimeout: callback => { queueMicrotask(callback); return 1; }, clearTimeout() {},
  fetch() { assert.fail('Preview contract tests must never use a real network'); }};
  for (const name of ['preview-workflow.js', 'preview-api.js']) {
    runInNewContext(readFileSync(new URL(`../demo/web/${name}`, import.meta.url), 'utf8'),
      {window, URL, URLSearchParams, console}, {filename: name});
  }
  window.SalesPreview.reset();
  const request = (path, method = 'GET', data = undefined, key = '') => new Promise(resolve => {
    window.SalesPreview.request({url: '/api/v1' + path, method, data,
      header: {Authorization: 'Bearer preview-access-sales', ...(key ? {'Idempotency-Key': key} : {})},
      success: response => resolve(clone(response))});
  });
  const state = () => JSON.parse(storage.get('sales-web:preview-workspace:v1'));
  return {request, state};
}

test('AMT-02 real preview quality/archive contract ignores ack-only changes but rejects changed business amount', async () => {
  const {request, state} = previewRuntime();
  const customer = state().customers[0];
  const source = await request('/visit-flow/structure', 'POST', {customer_id: customer.id,
    text: '跟进记录：合成金额归档测试\n下一步计划：2026-10-01提交合成方案\n跟进日期：2026-09-29\n创建时间：2026-09-29\n对接人：合成联系人'});
  assert.equal(source.statusCode, 202, source.data.message);
  const run = await request(`/agent/runs/${source.data.run_id}`);
  assert.equal(run.statusCode, 200);
  const fields = {...run.data.result.fields, opportunity_name: '合成大额归档商机'};
  const mutation = {action: 'create', name: '合成大额归档商机', amount: 10000000.01, probability: 10,
    status: 'open', expected_close_date: '2026-12-31', sales_channel: 'direct', partner_name: '直销'};
  const quality = await request('/visit-flow/quality', 'POST', {customer_id: customer.id, opportunity_id: null,
    source_run_id: source.data.run_id, fields, summary: fields.follow_up_record,
    source_import_id: null, collaborator_ids: [], fde_participant_ids: [], opportunity_mutation: mutation});
  assert.equal(quality.statusCode, 202, quality.data.message);
  const body = {customer_id: customer.id, fde_participant_ids: [], fields: {...fields, opportunity_id: null,
    source_import_id: null, collaborator_ids: [], _quality_review_run_id: quality.data.run_id,
    _opportunity_mutation: {...mutation, amount_confirmed_value: mutation.amount}}};
  const mismatched = clone(body);
  mismatched.fields._opportunity_mutation.amount_confirmed_value = 1;
  const wrongAck = await request('/visits', 'POST', mismatched, 'synthetic-archive');
  assert.equal(wrongAck.statusCode, 422, 'Ack is excluded from quality comparison, but still checked by amount policy');
  const changed = clone(body);
  changed.fields._opportunity_mutation.amount++;
  changed.fields._opportunity_mutation.amount_confirmed_value++;
  const staleQuality = await request('/visits', 'POST', changed, 'synthetic-archive');
  assert.equal(staleQuality.statusCode, 409, 'Real amount changes must still invalidate the quality snapshot');
  const beforeVisits = state().visits.length;
  const saved = await request('/visits', 'POST', body, 'synthetic-archive');
  assert.equal(saved.statusCode, 200, saved.data.message);
  assert.equal(state().visits.length, beforeVisits + 1);
  assert.equal(state().opportunities.find(row => row.name === mutation.name).amount, mutation.amount);
  const retry = clone(body); delete retry.fields._opportunity_mutation.amount_confirmed_value;
  const recovered = await request('/visits', 'POST', retry, 'synthetic-archive');
  assert.equal(recovered.statusCode, 200, recovered.data.message);
  assert.equal(recovered.data.id, saved.data.id); assert.equal(state().visits.length, beforeVisits + 1);
  assert.equal((await request('/visits', 'POST', changed, 'synthetic-archive')).statusCode, 409);
});

test('AMT-02 real preview enforces exact large amount and preserves idempotent opportunity retries', async () => {
  const {request, state} = previewRuntime(), customer = state().customers[0];
  const config = await request('/company-rules/presentation');
  assert.equal(config.data.demo, true);
  assert.equal(config.data.opportunity_amount.definition.warning_threshold_wan, 1000);
  const path = `/customers/${customer.id}/opportunities`;
  const body = {action: 'create', name: '合成独立大额商机', amount: 10000000, probability: 10,
    status: 'open', expected_close_date: '2026-12-31', sales_channel: 'direct', partner_name: '直销'};
  assert.equal((await request(path, 'POST', body, 'synthetic-save')).statusCode, 422);
  assert.equal((await request(path, 'POST', {...body, amount_confirmed_value: 10000001}, 'synthetic-save')).statusCode, 422);
  const saved = await request(path, 'POST', {...body, amount_confirmed_value: body.amount}, 'synthetic-save');
  assert.equal(saved.statusCode, 200, saved.data.message);
  const retry = await request(path, 'POST', body, 'synthetic-save');
  assert.equal(retry.statusCode, 200); assert.equal(retry.data.id, saved.data.id);
  assert.equal(state().opportunities.filter(row => row.name === body.name).length, 1);
  assert.equal((await request(path, 'POST', {...body, amount: 10000001}, 'synthetic-save')).statusCode, 409);
});
