/**
 * 主色十档色阶派生（建议）：移植 Ant Design 开源色板算法（@ant-design/colors 的 generate：HSV 空间分步调整色相、饱和度、明度）。
 * 用途：各上游组件库（TDesign、Semi、Ant Design、Web Awesome）都要主色的 10 档梯度，部门 tokens.json 只定义了少数几档；
 *      由本函数从 --ui-primary 派生，写进桥接文件。状态：建议，待用各库官方生成器复核后再登记。
 * 返回 10 个 #rrggbb：下标 0～4 由浅到深的浅色，5 为主色本身，6～9 逐级加深。
 */
const hueStep = 2, saturationStep = 0.16, saturationStep2 = 0.05, brightnessStep1 = 0.05, brightnessStep2 = 0.15, lightColorCount = 5, darkColorCount = 4;
export function hexToRgb(hex) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
export function rgbToHex({ r, g, b }) { return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
function rgbToHsv({ r, g, b }) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0; if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return { h, s: max ? d / max : 0, v: max }; }
function hsvToRgb({ h, s, v }) { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }; }
function getHue(hsv, i, light) { const H = Math.round(hsv.h); let hue = H >= 60 && H <= 240 ? (light ? H - hueStep * i : H + hueStep * i) : (light ? H + hueStep * i : H - hueStep * i); if (hue < 0) hue += 360; else if (hue >= 360) hue -= 360; return hue; }
function getSaturation(hsv, i, light) { if (hsv.h === 0 && hsv.s === 0) return hsv.s; let s = light ? hsv.s - saturationStep * i : i === darkColorCount ? hsv.s + saturationStep : hsv.s + saturationStep2 * i; if (s > 1) s = 1; if (light && i === lightColorCount && s > 0.1) s = 0.1; if (s < 0.06) s = 0.06; return Number(s.toFixed(2)); }
function getValue(hsv, i, light) { let v = light ? hsv.v + brightnessStep1 * i : hsv.v - brightnessStep2 * i; if (v > 1) v = 1; return Number(v.toFixed(2)); }
export function palette(hex) {
  const base = hexToRgb(hex), hsv = rgbToHsv(base), out = [];
  for (let i = lightColorCount; i > 0; i--) out.push(rgbToHex(hsvToRgb({ h: getHue(hsv, i, true), s: getSaturation(hsv, i, true), v: getValue(hsv, i, true) })));
  out.push(rgbToHex(base));
  for (let i = 1; i <= darkColorCount; i++) out.push(rgbToHex(hsvToRgb({ h: getHue(hsv, i, false), s: getSaturation(hsv, i, false), v: getValue(hsv, i, false) })));
  return out;
}
