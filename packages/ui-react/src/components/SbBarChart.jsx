import React, { useMemo } from 'react';
import { Button } from 'antd';
import { CHART_THEME, defaultFormatter, missingMarks, seriesColors, tooltipFormatter, useEChart } from './chartCore.js';
/**
 * 柱状图（12 章 §3.2）：horizontal 横向条形用于排名与阶段 ACV（名字在左、第一条在上、最多 10 条，其余「查看全部」）；vertical 竖向柱状。
 * 从 0 开始不截断；最多五个系列按 chart-1～5，两个系列用 1 和 5；柱少于 8 根才默认标数字；null 不画成 0，柱位写「未登记」。只画图区，页面用 SbChartCard 包。
 */
export function SbBarChart({ categories = [], series = [], unit = '', valueFormatter, showLabel, maxItems, onShowAll, onClick, height = 240, orientation = 'horizontal', showLegend, className = '' }) {
  const horizontal = orientation === 'horizontal';
  const limit = maxItems ?? (horizontal ? 10 : undefined);
  const truncated = limit != null && categories.length > limit;
  const cats = truncated ? categories.slice(0, limit) : categories;
  const fmt = valueFormatter || defaultFormatter;
  const option = useMemo(() => {
    const list = series.slice(0, 5);
    const colors = seriesColors(list);
    const bars = cats.length * Math.max(list.length, 1);
    const label = showLabel ?? bars < 8;
    const category = { type: 'category', data: cats, inverse: horizontal, axisLabel: { interval: 0, overflow: 'truncate', width: horizontal ? 96 : 72 } };
    const value = { type: 'value', min: 0, name: unit || undefined, nameTextStyle: { color: CHART_THEME.textStyle.color, fontSize: CHART_THEME.textStyle.fontSize, align: horizontal ? 'right' : 'left' }, splitLine: { show: !horizontal }, axisLabel: { formatter: (v) => fmt(v) } };
    const legend = showLegend ?? list.length > 1;
    return {
      color: colors,
      legend: { show: legend, data: list.map((s) => s.name) },
      grid: { top: legend ? CHART_THEME.grid.top + 28 : CHART_THEME.grid.top + (unit && !horizontal ? 12 : 0) },
      tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'shadow' }, formatter: tooltipFormatter(unit, fmt) },
      xAxis: horizontal ? value : category,
      yAxis: horizontal ? category : value,
      series: list.map((s, i) => {
        const data = cats.map((_, j) => (s.data?.[j] == null ? null : Number(s.data[j])));
        return {
          type: 'bar', name: s.name, data, itemStyle: { color: colors[i], borderRadius: horizontal ? [0, CHART_THEME.bar.itemStyle.borderRadius, CHART_THEME.bar.itemStyle.borderRadius, 0] : [CHART_THEME.bar.itemStyle.borderRadius, CHART_THEME.bar.itemStyle.borderRadius, 0, 0] },
          label: { show: label, position: horizontal ? 'right' : 'top', color: CHART_THEME.textStyle.color, fontSize: CHART_THEME.textStyle.fontSize, formatter: (p) => (p.value == null ? '' : fmt(p.value)) },
          markPoint: missingMarks(data, { horizontal }),
        };
      }),
    };
  }, [cats, series, unit, fmt, showLabel, horizontal, showLegend]);
  const ref = useEChart(option, onClick);
  return (
    <div className={`sb-barchart ${className}`}>
      <div ref={ref} className="sb-chart-plot" style={{ height }} role="img" />
      {truncated && <div className="sb-chart-more">还有 {categories.length - limit} 项{onShowAll && <Button type="link" size="small" onClick={onShowAll}>查看全部</Button>}</div>}
    </div>
  );
}
