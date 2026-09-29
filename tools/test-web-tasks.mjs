// Synthetic regression scenarios from 1.1.0, run against migrated Web modules.
// TASK_TEST_GENERATED=1 runs the same suite against the built business bundle.
// No network, real account, server mutation or production acceptance is involved.
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname, join, posix} from 'node:path';
import {runInNewContext} from 'node:vm';
import test from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requireNode = createRequire(import.meta.url);
const business = join(root, 'demo/web-src/business');
const bundle = JSON.parse(readFileSync(join(root, 'demo/web/bundle.js'), 'utf8').slice('window.SALES_BUNDLE='.length).trim().replace(/;$/, ''));
const generated = process.env.TASK_TEST_GENERATED === '1';
function readBusiness(filename) {
  const id = filename.replace(/^.*\/miniprogram\//, '');
  if (!generated || !id.endsWith('.js')) {
    const path = join(business, id);
    if (existsSync(path)) return readFileSync(path, 'utf8');
  }
  if (id.endsWith('.js') && typeof bundle.modules[id.slice(0, -3)] === 'string') return bundle.modules[id.slice(0, -3)];
  throw Error(`Missing Web business module or template: ${id}`);
}
function moduleLoader() {
  const cache = new Map();
  function load(filename) {
    const path = filename.endsWith('.js') ? filename : filename + '.js';
    if (cache.has(path)) return cache.get(path).exports;
    const module = {exports: {}}; cache.set(path, module);
    runInNewContext(readBusiness(path), {module, exports: module.exports,
      require: name => load(posix.resolve(posix.dirname(path), name)), console,
    }, {filename: path});
    return module.exports;
  }
  return load;
}
for (const suite of readdirSync(join(root, 'tools/task-v110-tests')).filter(name => name.endsWith('.test.cjs')).sort()) {
  const load = moduleLoader();
  const require = spec => spec === 'node:fs' ? {readFileSync: path => readBusiness(String(path))}
    : spec.startsWith('node:') ? requireNode(spec)
      : load(posix.resolve('/web/tests', spec));
  runInNewContext(readFileSync(join(root, 'tools/task-v110-tests', suite), 'utf8'), {
    require, __dirname: '/web/tests', console, setImmediate, setTimeout, clearTimeout,
  }, {filename: suite});
}

test('Web picker filters candidates without losing cross-team selections and rejects vanished IDs', () => {
  const load = moduleLoader();
  const picker = load('/web/miniprogram/utils/personPicker.js');
  const teams = [{id: 'one', name: '一队'}, {id: 'two', name: '二队'}];
  const members = picker.normalizeMembers([{id: 'a', name: '同名', account_code: 'SALE-A', team_ids: ['one']}, {id: 'b', name: '同名', account_code: 'FDE-B', team_ids: ['two']}], teams);
  assert.deepEqual(Array.from(picker.filterMembers(members, '', 'fde-b'), row => row.id), ['b']);
  assert.deepEqual(Array.from(picker.filterMembers(members, 'one', '同名'), row => row.id), ['a']);
  assert.deepEqual(Array.from(picker.validSelection(['a', 'b'], members, true)), ['a', 'b']);
  assert.deepEqual(Array.from(picker.validSelection(['a', 'b'], members.slice(1), true)), ['b']);
  assert.equal(picker.candidateTeam(teams, 'old-team'), '');
});

test('Web cancellation and picker templates have stable component IDs for React adapters', () => {
  for (const id of ['pages/tasks/index', 'pages/task-detail/index']) assert.match(readBusiness(`/web/miniprogram/${id}.wxml`), /task-cancel-dialog id="taskCancellation"/);
  for (const id of ['pages/task-detail/index', 'pages/management-task-create/index']) assert.match(readBusiness(`/web/miniprogram/${id}.wxml`), /person-picker id="personPicker"/);
});
