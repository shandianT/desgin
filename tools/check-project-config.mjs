#!/usr/bin/env node
/**
 * 校验 projects/<id>/project.config.json：
 * - 必须符合通用项目配置的最小结构
 * - 禁止把凭据、数据库连接或真实业务数据放进设计系统仓库
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projects = join(root, 'projects');
const required = ['id', 'name', 'version', 'theme', 'navigation', 'copy', 'features', 'routes', 'dataMode'];
const forbidden = /(^|_|-)(password|passwd|token|secret|apikey|api_key|connectionstring|databaseurl|dsn)($|_|-)/i;
let failed = 0;

if (!existsSync(projects)) {
  console.log('· 没有 projects/，跳过项目配置校验');
  process.exit(0);
}

for (const name of readdirSync(projects, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)) {
  const path = join(projects, name, 'project.config.json');
  if (!existsSync(path)) {
    console.error(`✗ ${name}: 缺少 project.config.json`);
    failed++;
    continue;
  }
  try {
    const config = JSON.parse(readFileSync(path, 'utf8'));
    const missing = required.filter((key) => !(key in config));
    const ids = JSON.stringify(config);
    const errors = [];
    if (missing.length) errors.push(`缺少 ${missing.join('、')}`);
    if (config.id !== name) errors.push(`id 应为 ${name}`);
    if (!/^#[0-9a-f]{6}$/i.test(config.theme?.primary || '')) errors.push('theme.primary 必须是六位十六进制颜色');
    if (!['synthetic', 'external'].includes(config.dataMode)) errors.push('dataMode 只能是 synthetic 或 external');
    if (forbidden.test(ids)) errors.push('不能包含密码、Token、数据库连接等凭据字段');
    if (errors.length) {
      console.error(`✗ ${name}: ${errors.join('；')}`);
      failed++;
    } else {
      console.log(`✓ 项目配置 ${name}`);
    }
  } catch (error) {
    console.error(`✗ ${name}: JSON 无法解析（${error.message}）`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
