// @shandiant/tokens/bridge-echarts 的类型：给 echarts.registerTheme('shandiant', theme) 的主题对象，由 bridges.json 生成。
// 不依赖 echarts 的类型包，避免把 echarts 变成本包的必装依赖；字段与 ECharts 6 主题（theme）的同名项一致。
export interface ShandiantEchartsTheme {
  /** 顺序色五个：--ui-chart-1 ～ --ui-chart-5，第一个是主色 */
  color: string[];
  backgroundColor: string;
  textStyle: { fontFamily: string; fontSize: number; color: string };
  categoryAxis: Record<string, unknown>;
  valueAxis: Record<string, unknown>;
  legend: Record<string, unknown>;
  tooltip: Record<string, unknown>;
  bar: Record<string, unknown>;
  line: Record<string, unknown>;
  grid: { left: number; right: number; top: number; bottom: number; containLabel: boolean };
  $comment?: string;
}
declare const theme: ShandiantEchartsTheme;
export default theme;
