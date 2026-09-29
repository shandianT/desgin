// Exercise the actual offline Web task transport. All records are synthetic.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require = createRequire(import.meta.url);
const {taskTransferSummary} = require('../demo/web-src/business/utils/taskPresentation.js');
const key = 'sales-web:preview-workspace:v1';
function previewRuntime(initialState) {
  const storage = new Map(initialState ? [[key, JSON.stringify(initialState)]] : []);
  const window = {SALES_MODE: 'preview', localStorage: {
    getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key),
  }, setTimeout: callback => {queueMicrotask(callback); return 1;}, clearTimeout() {},
  fetch() {assert.fail('Task preview tests must never use a network');}};
  for (const name of ['preview-workflow.js', 'preview-api.js']) runInNewContext(readFileSync(new URL(`../demo/web/${name}`, import.meta.url), 'utf8'), {window, URL, URLSearchParams, console}, {filename: name});
  if (!initialState) window.SalesPreview.reset();
  const request = (path, method = 'GET', data, idempotency = '', role = 'sales') => new Promise(resolve => window.SalesPreview.request({
    url: '/api/v1' + path, method, data, header: {Authorization: 'Bearer preview-access-' + role, ...(idempotency ? {'Idempotency-Key': idempotency} : {})}, success: response => resolve(structuredClone(response)),
  }));
  return {request, state: () => JSON.parse(storage.get(key))};
}
const input = (account = 'PREVIEW_SALES', extra = {}) => ({description: '合成任务：确认测试方案与验收标准', association_kind: 'daily', assignee_account_code: account, target_position: null, due_at: new Date(Date.now() + 86400000).toISOString(), priority_code: 'medium', ...extra});
async function success(promise) {const r = await promise; assert(r.statusCode >= 200 && r.statusCode < 300, r.data.message); return r.data;}
async function create(h, account = 'PREVIEW_SALES', creator = 'supervisor') {return success(h.request('/tasks', 'POST', input(account), 'create-' + account, creator));}
async function event(h, task, event_type, role = 'sales', note = '合成测试处理依据') {return success(h.request(`/tasks/${task.id}/events`, 'POST', {event_type, note, version_no: task.version_no}, `${task.id}-${task.version_no}-${event_type}`, role));}

test('actual preview task recipients provide complete stable paginated team metadata', async () => {
  const h = previewRuntime(); const all = [], pages = [];
  let offset = 0;
  do {
    const page = await success(h.request(`/tasks/recipients?page_size=2&offset=${offset}`));
    pages.push(page); all.push(...page.items);
    assert(page.items.every(person => person.account_code && person.team_ids.every(id => page.teams.some(team => team.id === id))));
    if (!page.has_more) break;
    assert(page.next_offset > offset); offset = page.next_offset;
  } while (true);
  assert.equal(pages.length, 3); assert.equal(all.length, 5); assert.equal(new Set(all.map(person => person.id)).size, all.length);
  assert(pages.every(page => JSON.stringify(page.teams) === JSON.stringify(pages[0].teams) && page.defaults.team_id === pages[0].defaults.team_id));
  const search = await success(h.request('/tasks/recipients?q=preview_fde'));
  assert.deepEqual(search.items.map(person => person.account_code), ['PREVIEW_FDE', 'PREVIEW_FDE_LEAD']);
});

test('actual preview batch returns items, independent owners and replayed IDs without duplicate side effects', async () => {
  const h = previewRuntime(), before = h.state();
  const body = {tasks: [input(), input('PREVIEW_FDE')]};
  const saved = await success(h.request('/tasks/batch', 'POST', body, 'batch-one'));
  assert.equal(saved.items.length, 2); assert.equal(new Set(saved.items.map(task => task.id)).size, 2);
  assert.equal(h.state().tasks.length, before.tasks.length + 2);
  const stored = h.state();
  const again = await success(h.request('/tasks/batch', 'POST', body, 'batch-one'));
  assert.deepEqual(again.items.map(task => task.id), saved.items.map(task => task.id)); assert.deepEqual(h.state(), stored);
  const accepted = await event(h, saved.items[0], 'accept');
  assert.equal(accepted.status, 'pending_execution'); assert.equal(accepted.action_permissions['task.complete'], true);
  const independent = await success(h.request(`/tasks/${saved.items[1].id}`, 'GET', undefined, '', 'fde'));
  assert.equal(independent.status, 'pending_confirm'); assert.equal(independent.action_permissions['task.accept'], true);
  assert.equal((await h.request('/tasks/batch', 'POST', {tasks: [input('PREVIEW_MANAGER')]}, 'batch-one')).statusCode, 409);
});

test('actual preview batch failure rolls back tasks, events, notifications and counters before retry', async () => {
  const h = previewRuntime(), before = h.state();
  const rejected = await h.request('/tasks/batch', 'POST', {tasks: [input(), input('OUTSIDE_COMPANY')]}, 'atomic-batch');
  assert.equal(rejected.statusCode, 422); assert.deepEqual(h.state(), before);
  const rows = await success(h.request('/tasks?tab=all&page_size=100'));
  assert.equal(rows.items.length, before.tasks.filter(task => task.assignees.some(person => person.user_id === '00000001-0000-4000-8000-000000000001')).length);
  const saved = await success(h.request('/tasks/batch', 'POST', {tasks: [input(), input('PREVIEW_FDE')]}, 'atomic-batch'));
  assert.equal(saved.items.length, 2); assert.equal(h.state().tasks.length, before.tasks.length + 2);
  assert.equal(h.state().notifications.length, before.notifications.length + 2);
});

test('actual preview current owner can accept and submit; pending review must be rejected before cancellation', async () => {
  const h = previewRuntime(); let task = await create(h);
  task = await success(h.request(`/tasks/${task.id}`));
  assert.equal(task.action_permissions['task.accept'], true); assert.equal(task.action_permissions['task.decline'], true);
  task = await event(h, task, 'accept'); task = await event(h, task, 'complete');
  assert.equal(task.status, 'pending_review'); assert.equal(task.can_cancel, false); assert.equal(task.can_coordinate, false);
  assert.equal((await h.request(`/tasks/${task.id}/events`, 'POST', {event_type: 'cancel', note: '合成取消', version_no: task.version_no}, '', 'supervisor')).statusCode, 403);
  assert.equal((await h.request(`/tasks/${task.id}/reassignment-options`, 'GET', undefined, '', 'supervisor')).statusCode, 403);
  const review = await success(h.request(`/tasks/${task.id}`, 'GET', undefined, '', 'supervisor'));
  assert.equal(review.action_permissions['task.review'], true);
  assert.equal((await h.request(`/tasks/${task.id}/events`, 'POST', {event_type: 'reject_completion', note: ' ', version_no: task.version_no}, '', 'supervisor')).statusCode, 422);
  task = await event(h, task, 'reject_completion', 'supervisor', '验收材料不完整，请补充');
  assert.equal(task.status, 'in_progress'); assert.equal(task.can_cancel, true);
  const before = await success(h.request('/tasks?tab=all', 'GET', undefined, '', 'supervisor'));
  task = await event(h, task, 'cancel', 'supervisor', '范围调整，保留历史依据');
  assert.equal(task.last_event_type, 'cancel'); assert.equal(task.last_event_note, '范围调整，保留历史依据'); assert.equal(task.completed_at, null);
  const pending = await success(h.request('/tasks?tab=pending&page_size=100', 'GET', undefined, '', 'supervisor'));
  const ended = await success(h.request('/tasks?tab=rejected&page_size=100', 'GET', undefined, '', 'supervisor'));
  assert(!pending.items.some(row => row.id === task.id)); assert(ended.items.some(row => row.id === task.id));
  assert.equal(ended.summary.completed_count, before.summary.completed_count); assert.equal(ended.summary.total, before.summary.total);
});

test('actual preview completed tasks are retained and cancellation cannot write blank reason or old version', async () => {
  const h = previewRuntime(); let task = await create(h, 'PREVIEW_SALES', 'sales');
  for (const [body, status] of [[{note: ' ', version_no: task.version_no}, 422], [{note: '字'.repeat(501), version_no: task.version_no}, 422], [{note: '旧版本', version_no: 99}, 409]]) {
    assert.equal((await h.request(`/tasks/${task.id}/events`, 'POST', {event_type: 'cancel', ...body})).statusCode, status);
  }
  task = await event(h, task, 'accept'); task = await event(h, task, 'complete');
  assert.equal(task.status, 'completed'); assert.equal(task.can_cancel, false);
  assert.equal((await h.request(`/tasks/${task.id}/events`, 'POST', {event_type: 'cancel', note: '不可取消完成任务', version_no: task.version_no})).statusCode, 403);
  const reread = await success(h.request(`/tasks/${task.id}`)); assert.equal(reread.status, 'completed'); assert(reread.completed_at);
});

test('actual preview reassignment changes action ownership and preserves recorded historical names', async () => {
  const h = previewRuntime(); let task = await create(h);
  const directory = await success(h.request(`/tasks/${task.id}/reassignment-options?page_size=2`, 'GET', undefined, '', 'supervisor'));
  assert.equal(directory.has_more, true); assert(directory.items.every(person => person.team_ids.every(id => directory.teams.some(team => team.id === id))));
  assert.equal((await h.request(`/tasks/${task.id}/reassignment-options`)).statusCode, 403);
  task = await success(h.request(`/tasks/${task.id}/events`, 'POST', {event_type: 'reassign', assignee_account_code: 'PREVIEW_FDE', note: '移交合成测试工作', version_no: task.version_no}, 'reassign-one', 'supervisor'));
  const firstHistory = structuredClone(task.events.at(-1));
  assert.equal(taskTransferSummary(firstHistory.payload), '王新源 → 周思远');
  assert.equal((await h.request(`/tasks/${task.id}/events`, 'POST', {event_type: 'accept', version_no: task.version_no})).statusCode, 404);
  const newOwner = await success(h.request(`/tasks/${task.id}`, 'GET', undefined, '', 'fde'));
  assert.equal(newOwner.action_permissions['task.accept'], true); assert.equal(newOwner.owner_name, '周思远');
  task = await event(h, newOwner, 'accept', 'fde');
  task = await success(h.request(`/tasks/${task.id}/events`, 'POST', {event_type: 'reassign', assignee_account_code: 'PREVIEW_SALES', note: '再次转交合成测试', version_no: task.version_no}, 'reassign-two', 'supervisor'));
  assert.deepEqual(task.events[0], firstHistory); assert.equal(taskTransferSummary(task.events.at(-1).payload), '周思远 → 王新源');
});

test('actual preview historical import metadata does not restore an old owner permission', async () => {
  const base = previewRuntime().state(); const row = base.tasks[0];
  row.task_type = 'weekly_import'; row.attributes = {import_assignee_account_code: 'PREVIEW_SALES'};
  row.assignees = [{user_id: '00000001-0000-4000-8000-000000000004', name: '周思远', responsibility: 'owner'}]; row.status = 'pending_execution';
  const h = previewRuntime(base);
  const current = await success(h.request(`/tasks/${row.id}`, 'GET', undefined, '', 'fde'));
  assert.equal(current.action_permissions['task.complete'], true); assert.equal(current.owner_name, '周思远');
  assert.equal((await h.request(`/tasks/${row.id}`)).statusCode, 404);
});
