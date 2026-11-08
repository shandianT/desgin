#!/usr/bin/env node
/**
 * 校验小程序 ds-* 通用入口只做兼容转发，并且引用的 sb-* 组件存在。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = join(root, 'packages', 'ui-miniprogram', 'components');
let failed = 0;
if (!existsSync(components)) process.exit(0);

for (const name of readdirSync(components).filter((entry) => entry.startsWith('ds-'))) {
  const dir = join(components, name);
  const files = ['index.json', 'index.js', 'index.wxml', 'index.wxss'];
  const missing = files.filter((file) => !existsSync(join(dir, file)));
  if (missing.length) {
    console.error(`✗ ${name}: 缺少 ${missing.join('、')}`);
    failed++;
    continue;
  }
  try {
    const metadata = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
    const child = Object.keys(metadata.usingComponents || {})[0];
    const childPath = metadata.usingComponents?.[child];
    const childFile = childPath ? join(dir, childPath.endsWith('/index') ? childPath + '.json' : join(childPath, 'index.json')) : '';
    const script = readFileSync(join(dir, 'index.js'), 'utf8');
    const template = readFileSync(join(dir, 'index.wxml'), 'utf8');
    if (!child || !childPath || !existsSync(childFile) || !script.includes('Component({') || !template.includes('<' + child)) {
      throw new Error('必须声明存在的 sb-* 子组件，并由 Component/WXML 转发');
    }
    console.log(`✓ 通用小程序入口 ${name}`);
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
