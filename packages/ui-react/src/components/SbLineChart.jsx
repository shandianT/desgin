import React, { useMemo } from 'react';
import { CHART_THEME, defaultFormatter, missingMarks, seriesColors, tooltipFormatter, useEChart } from './chartCore.js';
/**
 * 折线图（12 章 §3.2）：趋势。可以不从 0 开始，但轴上必标最小值（yMin）；线粗 2、点 6 来自主题；最多五个系列；null 断开不连线，点位写「未登记」。
 * 只画图区，页面用 SbChartCard 包；时间轴的字由页面按周期写（「7 月」而不是 2026-07）。
 */
export function SbLineChart({ categories = [], series = [], unit = '', valueFormatter, smooth = false, area = false, yMin, onClick, height = 240, showLegend, className = '' }) {
  const fmt = valueFormatter || defaultFormatter;
  const option = useMemo(() => {
    const list = series.slice(0, 5);
    const colors = seriesColors(list);
    const legend = showLegend ?? list.length > 1;
    const min = yMin == null ? 0 : yMin;
    return {
      color: colors,
      legend: { show: legend, data: list.map((s) => s.name) },
      grid: { top: legend ? CHART_THEME.grid.top + 28 : CHART_THEME.grid.top + (unit ? 12 : 0) },
      tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'line' }, formatter: tooltipFormatter(unit, fmt) },
      xAxis: { type: 'category', data: categories, boundaryGap: false, axisLabel: { interval: 'auto', hideOverlap: true } },
      yAxis: { type: 'value', min, name: unit || undefined, nameTextStyle: { color: CHART_THEME.textStyle.color, fontSize: CHART_THEME.textStyle.fontSize, align: 'left' }, axisLabel: { showMinLabel: true, formatter: (v) => fmt(v) } },
      series: list.map((s, i) => {
        const data = categories.map((_, j) => (s.data?.[j] == null ? null : Number(s.data[j])));
        return {
          type: 'line', name: s.name, data, smooth, connectNulls: false, showSymbol: true,
          itemStyle: { color: colors[i] }, lineStyle: { color: colors[i] },
          areaStyle: area ? { color: colors[i], opacity: 0.12 } : undefined,
          markPoint: missingMarks(data, { base: min }),
        };
      }),
    };
  }, [categories, series, unit, fmt, smooth, area, yMin, showLegend]);
  const ref = useEChart(option, onClick);
  return <div className={`sb-linechart ${className}`}><div ref={ref} className="sb-chart-plot" style={{ height }} role="img" /></div>;
}
