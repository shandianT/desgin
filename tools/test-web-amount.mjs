import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {posix} from 'node:path';
import {formatWanInput} from '../demo/web-src/department-ui/amount-input.mjs';

const bundle = JSON.parse(readFileSync(new URL('../demo/web/bundle.js', import.meta.url), 'utf8').slice('window.SALES_BUNDLE='.length).trim().replace(/;$/, ''));
function loadRuntime() {
  const cache = new Map();
  function load(id) {
    if (cache.has(id)) return cache.get(id).exports;
    assert.equal(typeof bundle.modules[id], 'string', `Missing runtime module ${id}`);
    const module = {exports: {}};
    cache.set(id, module);
    runInNewContext(bundle.modules[id], {
      module, exports: module.exports,
      require: path => load(posix.normalize(posix.join(posix.dirname(id), path))),
      console,
    }, {filename: id});
    return module.exports;
  }
  return load;
}

test('ACV input keeps yuan cents in edit round trips', () => {
  const opportunity = loadRuntime()('utils/opportunity');
  for (const yuan of ['12345.67', '10000000.67', '0.01', '100000000']) {
    assert.equal(opportunity.amount(opportunity.wan(yuan)), Number(yuan));
  }
  assert.equal(opportunity.amount('1.234567'), 12345.67);
  assert.equal(opportunity.wan('12345.67'), '1.234567');
});

test('ACV display never groups the fractional digits or rounds exact input text', () => {
  assert.equal(formatWanInput('1234.567891'), '1,234.567891');
  assert.equal(formatWanInput('1.234567'), '1.234567');
  assert.equal(formatWanInput('0.000001'), '0.000001');
  assert.equal(formatWanInput('900719925474.099199'), '900,719,925,474.099199');
  for (const invalid of ['1.2.3', '1000..25', '-1', '1e3']) assert.equal(formatWanInput(invalid), invalid);
  assert.equal(formatWanInput(null), '');
  assert.equal(formatWanInput('0', {userTyping: true, input: '0.'}), '0.');
});

test('input conversion distinguishes missing, zero, invalid and unsafe amounts', () => {
  const opportunity = loadRuntime()('utils/opportunity');
  assert.equal(opportunity.amount(''), null);
  assert.equal(opportunity.amount('0'), 0);
  assert.throws(() => opportunity.amount('', true));
  assert.throws(() => opportunity.amount('0', true));
  for (const input of ['-1', 'abc', '1.1234567', '1e3', '900719925474.0992']) {
    assert.throws(() => opportunity.amount(input), input);
  }
});

test('full yuan preview uses readable amounts and magnitude', () => {
  const amount = loadRuntime()('utils/opportunityAmount');
  assert.equal(amount.previewWan('1000'), '折合 10,000,000 元（1,000 万元）');
  assert.equal(amount.previewWan('10000'), '折合 100,000,000 元（1 亿元）');
  assert.equal(amount.previewWan('1.234567'), '折合 12,345.67 元（1.234567 万元）');
  assert.equal(amount.previewWan('0.000001'), '折合 0.01 元（0.000001 万元）');
  for (const input of ['', null, undefined, '-1', 'bad', '1.1234567']) {
    assert.equal(amount.previewWan(input), '', String(input));
  }
});

test('shared form refreshes the amount hint on new, edit, visit draft and clear', () => {
  const load = loadRuntime();
  let definition;
  runInNewContext(bundle.modules['components/opportunity-form/index'], {
    Component: value => { definition = value; },
    require: path => path.endsWith('/apiClient') ? {} : path.endsWith('/businessOptions') ? {isReady: () => true} : load(posix.normalize(posix.join('components/opportunity-form', path))),
    clearTimeout, setTimeout,
  });
  function form(properties) {
    return {
      ...definition.methods,
      properties: {customerId: 'synthetic-customer', existing: null, ...properties},
      data: structuredClone(definition.data),
      setData(values) {
        for (const [key, value] of Object.entries(values)) {
          const parts = key.split('.'); let target = this.data;
          while (parts.length > 1) target = target[parts.shift()];
          target[parts[0]] = value;
        }
      },
      triggerEvent() {},
    };
  }
  const instance = form({}); instance.reset();
  instance.input({currentTarget: {dataset: {key: 'amount'}}, detail: {value: '1000'}});
  assert.equal(instance.data.amountPreview, '折合 10,000,000 元（1,000 万元）');
  instance.input({currentTarget: {dataset: {key: 'amount'}}, detail: {value: ''}});
  assert.equal(instance.data.amountPreview, '');
  instance.input({currentTarget: {dataset: {key: 'amount'}}, detail: {value: '1.2345678'}});
  assert.match(instance.data.amountError, /六位小数/);
  assert.equal(instance.data.form.amount, '1.2345678');
  assert.equal(instance.data.amountPreview, '');
  instance.input({currentTarget: {dataset: {key: 'amount'}}, detail: {value: '1.234567'}});
  assert.equal(instance.data.amountError, '');
  const edit = form({existing: {id: 'synthetic-opportunity', name: '合成金额核对', amount: '12345.67', quarterly_forecasts: [], sales_channel: 'direct'}});
  edit.reset();
  assert.equal(edit.data.form.amount, '1.234567');
  assert.equal(edit.data.amountPreview, '折合 12,345.67 元（1.234567 万元）');
  const visit = form({visitContext: true, savedDraft: {...load('utils/opportunity').formFor(null), amount: '10000'}});
  visit.reset();
  assert.equal(visit.data.amountPreview, '折合 100,000,000 元（1 亿元）');
});
