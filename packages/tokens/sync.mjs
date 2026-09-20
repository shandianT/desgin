// 把规范仓库生成的变量产物复制进本包的 dist/。版本号跟 tokens.json 的 $meta.version 走。
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../specs/salesbuddy/02-设计变量与同步链路');
mkdirSync(join(here, 'dist'), { recursive: true });
cpSync(join(src, 'dist'), join(here, 'dist'), { recursive: true });
const meta = JSON.parse(readFileSync(join(src, 'tokens.json'), 'utf8')).$meta;
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'));
if (pkg.version !== meta.version) { pkg.version = meta.version; writeFileSync(join(here, 'package.json'), JSON.stringify(pkg, null, 2) + '\n'); }
// 桥接主题再出一份 JS 模块，让不经打包器的 Node 也能 import／require
const bridge = readFileSync(join(here, 'dist', 'bridge-antd.theme.json'), 'utf8');
writeFileSync(join(here, 'dist', 'bridge-antd.theme.mjs'), `export default ${bridge.trim()};\n`);
writeFileSync(join(here, 'dist', 'bridge-antd.theme.cjs'), `module.exports = ${bridge.trim()};\n`);
console.error(`tokens 包 dist 已同步，版本 ${meta.version}`);
