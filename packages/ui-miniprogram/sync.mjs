// 把规范生成的两个 wxss 复制进包：components/style/ 随 npm 包发布（构建 npm 会复制 components/），包根一份给仓库内的演示工程用。
import { copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../specs/salesbuddy/02-设计变量与同步链路/dist');
for (const f of ['design-tokens.wxss', 'bridge-tdesign.wxss']) { copyFileSync(join(src, f), join(here, 'components', 'style', f)); copyFileSync(join(src, f), join(here, f)); }
console.error('小程序包：两个 wxss 已同步到 components/style/ 与包根');
