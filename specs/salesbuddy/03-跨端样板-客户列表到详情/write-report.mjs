#!/usr/bin/env node
/** 把 验收结果.json 整理成 验收记录.md（中文表格）。用法：node write-report.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const r = JSON.parse(readFileSync(join(here, '验收结果.json'), 'utf8'));
const groups = [...new Set(r.results.map((x) => x.group))];
let md = `# 跨端样板验收记录（自动生成）\n\n`;
md += `检查时间：${r.checkedAt}。工具：${r.browser}。合计 ${r.total} 项，通过 ${r.passed}，失败 ${r.failed}。\n\n`;
md += `**证据等级：${r.scope}。** 按规范第 08 章的四种结论，本记录只能支持「所测本地交互可用」，不能证明真实接口联调或生产验收成立。\n\n`;
md += `再次生成：\`node verify.mjs && node write-report.mjs\`。截图在 \`截图/\` 目录，文件名为「视口-状态.png」。\n\n`;
md += `## 各视口结果\n\n`;
for (const g of groups) {
  const items = r.results.filter((x) => x.group === g);
  const failed = items.filter((x) => !x.pass).length;
  md += `### ${g}（${items.length} 项，${failed ? `失败 ${failed}` : '全部通过'}）\n\n| 检查项 | 结果 | 说明 |\n|---|---|---|\n`;
  for (const it of items) md += `| ${it.name} | ${it.pass ? '通过' : '**失败**'} | ${it.detail || ''} |\n`;
  md += '\n';
}
md += `## 检查项与规则的对应\n\n| 检查项 | 对应规则／建议 |\n|---|---|\n`;
md += `| 档位判定、整页无横向溢出 | X-05、T 章适配说明（>900／601～900／≤600） |\n| 搜索与筛选、结果数、清除条件 | T-02、C-04 |\n| 点击行后详情显示同一客户；地址含客户标识 | T-03、B-02；「唯一对象地址」为 Web 交互重构建议 |\n| 电脑三栏并排／收紧与手机的返回按钮 | X-02、X-03 |\n| 返回后条件、滚动位置、选中、焦点保留；浏览器返回；刷新保留 | X-03、C-07、P-03 |\n| 无匹配、加载中、加载失败重试不丢条件、无权限 | C-06、X-11、B-05 |\n| 手机正文 ≥16px、说明 ≥12px、目标 ≥44px、底部动作固定 | X-06、X-07、V-02 |\n| 键盘 ↑↓、Enter、Esc | V-04、C-07 |\n\n`;
md += `## 未验证范围（如实记录）\n\n- 真机（iOS／Android 浏览器、微信小程序）未测：安全区、输入法弹起、系统返回手势只在模拟视口中按 CSS 规则检查。\n- 真实接口、权限、AI 归档：样板为合成数据，「无权限」是演示状态，不是服务端返回。\n- 小程序与原生 App：本样板是 HTML，只证明布局与交互规则可行，不证明这两端已实现。\n`;
writeFileSync(join(here, '验收记录.md'), md);
console.log('已生成 验收记录.md');
