// 图表公共底座（12 章 §5）：echarts/core 按需引入，主题 shandiant 只注册一次，颜色、字号、网格线全部来自 @shandiant/tokens 的 bridge-echarts。
// 组件只画图区，不套卡片；ResizeObserver 自适应；动画只在首屏，切换数据不重放（12 章 §4）。
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, MarkPointComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import theme from '@shandiant/tokens/bridge-echarts';

export const THEME_NAME = 'shandiant';
export const CHART_THEME = theme;
let registered = false;
export function ensureTheme() {
  if (registered) return echarts;
  echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, MarkPointComponent, SVGRenderer]);
  echarts.registerTheme(THEME_NAME, theme);
  registered = true;
  return echarts;
}

/** 系列颜色：按 chart-1～5 顺序；只有两个系列时用 1 和 5（本期实色、上期灰）；series.tone 为 1～5 时指定档位 */
export function seriesColors(series) {
  const palette = theme.color;
  const base = series.length === 2 ? [palette[0], palette[4]] : palette.slice(0, Math.min(series.length, 5));
  return series.map((s, i) => (s.tone >= 1 && s.tone <= 5 ? palette[s.tone - 1] : base[i % base.length]));
}

export const defaultFormatter = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? '未登记' : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 }));

/** 悬停框：第一行对象名，后面每个系列一行「系列名：值 单位」；缺失写「未登记」，不写 0 */
export function tooltipFormatter(unit, fmt) {
  return (params) => {
    const list = Array.isArray(params) ? params : [params];
    if (!list.length) return '';
    const head = `<b>${list[0].name}</b>`;
    const lines = list.map((p) => {
      const v = Array.isArray(p.value) ? p.value[p.value.length - 1] : p.value;
      const text = v == null ? '未登记' : `${fmt(v)}${unit ? ` ${unit}` : ''}`;
      return `${p.marker || ''}${p.seriesName ? `${p.seriesName}：` : ''}${text}`;
    });
    return [head, ...lines].join('<br/>');
  };
}

/** 缺失的柱位或点位写「未登记」（12 章 §3.5）：用 markPoint 放一个不可见的点，只显示标签 */
export function missingMarks(data, { horizontal = false, base = 0 } = {}) {
  const points = [];
  data.forEach((v, i) => { if (v == null) points.push({ coord: horizontal ? [base, i] : [i, base], value: '未登记', symbol: 'circle', symbolSize: 0 }); });
  if (!points.length) return undefined;
  return { silent: true, animation: false, label: { show: true, position: horizontal ? 'right' : 'top', color: theme.textStyle.color, fontSize: theme.textStyle.fontSize, formatter: '未登记' }, data: points };
}

/**
 * 在容器上挂一个 ECharts 实例：init 一次（svg），ResizeObserver 自适应，setOption 不合并；
 * 首屏 animation 300ms，之后切换数据不重放；点击回调 onClick(dataIndex, seriesIndex)。
 */
export function useEChart(option, onClick) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const firstRef = useRef(true);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ec = ensureTheme();
    const chart = ec.init(el, THEME_NAME, { renderer: 'svg' });
    chartRef.current = chart;
    chart.on('click', (p) => clickRef.current?.(p.dataIndex, p.seriesIndex, p));
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { if (el.isConnected) chart.resize(); });
    ro?.observe(el);
    return () => { ro?.disconnect(); chart.dispose(); chartRef.current = null; firstRef.current = true; };
  }, []);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !option) return;
    chart.setOption({ ...option, animation: firstRef.current, animationDuration: 300, animationDurationUpdate: 0 }, { notMerge: true });
    firstRef.current = false;
  }, [option]);
  return ref;
}
