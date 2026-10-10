export type ChartType = 'scatter' | 'volcano' | 'box' | 'bar' | 'line' | 'violin' | 'manhattan';
export type Row = Record<string, string | number | null>;
export interface Config {
  xField: string; yField: string; groupField: string; labelField: string;
  radius: number; opacity: number; color: string; width: number; height: number;
  xAxis: boolean; yAxis: boolean; grid: boolean; tooltip: boolean; legend: boolean;
  zoom: boolean; labels: boolean; xScale: 'linear' | 'log'; yScale: 'linear' | 'log';
  barLayout: 'grouped' | 'stacked'; horizontal: boolean; barPadding: number; lineWidth: number; smooth: boolean; area: boolean; showPoints: boolean;
  bandwidthFactor: number; violinScale: 'width' | 'density'; violinInner: 'box' | 'median' | 'none';
  chromosomeField: string; chromosomeGap: number; secondaryColor: string; significantColor: string;
  showThreshold: boolean; showSuggestive: boolean; suggestiveThreshold: number; labelLimit: number;
  pThreshold: number; fcThreshold: number; tooltipFields: string[];
}
export const charts: {id: ChartType; name: string; zh: string; description: string}[] = [
  {id:'scatter',name:'Scatter Plot',zh:'散点图',description:'比较两个数值变量'},
  {id:'volcano',name:'Volcano Plot',zh:'火山图',description:'展示效应量与显著性'},
  {id:'box',name:'Box Plot',zh:'箱线图',description:'比较各组的数据分布'},
  {id:'bar',name:'Bar Chart',zh:'柱状图',description:'比较分类数值与各系列构成'},
  {id:'line',name:'Line Chart',zh:'折线图',description:'展示数值随时间或顺序的变化'},
  {id:'violin',name:'Violin Plot',zh:'小提琴图',description:'比较各组的分布密度与统计摘要'},
  {id:'manhattan',name:'Manhattan Plot',zh:'曼哈顿图',description:'展示染色体上的关联显著性'},
];
export function mockData(type: ChartType): Row[] {
  if (type === 'violin') return Array.from({ length: 144 }, (_, i) => ({
    sample: `S${String(i + 1).padStart(3, '0')}`,
    group: ['Control', 'Treatment', 'Recovery'][i % 3],
    value: +(12 + (i % 3) * 4 + Math.sin(i * 1.73) * (2 + i % 3) + Math.cos(i * .49) * 1.8).toFixed(3),
  }));
  if (type === 'manhattan') return Array.from({ length: 288 }, (_, i) => ({
    snp: `rs${100001 + i}`,
    chromosome: String(Math.floor(i / 36) + 1),
    position: (i % 36 + 1) * 1800000 + (i % 5) * 90000,
    pvalue: +Math.pow(10, -(1 + Math.abs(Math.sin(i * 1.93)) * 3.8 + (i % 47 === 0 ? 6 : i % 31 === 0 ? 3.6 : 0))).toPrecision(6),
  }));
  if (type === 'bar') return ['Q1', 'Q2', 'Q3', 'Q4'].flatMap((category, index) =>
    ['Product A', 'Product B', 'Product C'].map((series, group) => ({ category, series, value: 18 + index * 7 + group * 9 + (index % 2) * (group + 2) })));
  if (type === 'line') return Array.from({ length: 12 }, (_, index) =>
    ['Control', 'Treatment', 'Recovery'].map((series, group) => ({ time: index + 1, value: +(20 + index * 2 + group * 8 + Math.sin(index * .75 + group) * 5).toFixed(2), series }))).flat();
  return Array.from({length: type === 'volcano' ? 72 : 48}, (_, i): Row => {
    const group = ['Control','Treatment','Recovery'][i % 3];
    if (type === 'volcano') {
      const log2FC = +((Math.sin(i * 2.7) * 3.5) + Math.cos(i * 1.3) * .7).toFixed(3);
      const strength = Math.abs(log2FC) * 1.4 + (Math.sin(i * 4.1) + 1) * 1.3;
      return {gene: ['TP53','BRCA1','EGFR','MYC','KRAS','IL6','TNF','STAT3'][i] || `Gene_${String(i + 1).padStart(3,'0')}`, log2FC, pvalue: +Math.pow(10,-strength).toPrecision(5)};
    }
    const expressionA = +(8 + i * .75 + Math.sin(i * 2.1) * 5).toFixed(2);
    const expressionB = +(expressionA * .65 + (i % 3) * 7 + Math.cos(i * 1.5) * 6 + 4).toFixed(2);
    return type === 'scatter' ? {sample:`S${String(i+1).padStart(2,'0')}`,expressionA,expressionB,group}
      : {sample:`S${String(i+1).padStart(2,'0')}`,group,expression: +(7 + (i%3)*3 + Math.sin(i*1.7)*2.6 + (i===40?12:0)).toFixed(2)};
  });
}
export function thumbnailData(type: ChartType): Row[] {
  // Minimal deterministic rows for gallery cards: just enough marks to read the chart type at a glance.
  if (type === 'scatter') return [
    { sample: 'S1', expressionA: 10, expressionB: 14, group: 'Control' },
    { sample: 'S2', expressionA: 20, expressionB: 24, group: 'Treatment' },
    { sample: 'S3', expressionA: 30, expressionB: 38, group: 'Recovery' },
    { sample: 'S4', expressionA: 40, expressionB: 34, group: 'Control' },
    { sample: 'S5', expressionA: 52, expressionB: 56, group: 'Treatment' },
    { sample: 'S6', expressionA: 62, expressionB: 66, group: 'Recovery' },
  ];
  if (type === 'volcano') return [
    { gene: 'TP53', log2FC: -2.8, pvalue: 1e-6 },
    { gene: 'BRCA1', log2FC: -3.4, pvalue: 1e-8 },
    { gene: 'EGFR', log2FC: -2.1, pvalue: 1e-4 },
    { gene: 'MYC', log2FC: 2.6, pvalue: 1e-5 },
    { gene: 'KRAS', log2FC: 3.2, pvalue: 1e-9 },
    { gene: 'IL6', log2FC: 2.1, pvalue: 1e-3 },
    { gene: 'TNF', log2FC: .3, pvalue: .42 },
    { gene: 'STAT3', log2FC: -.4, pvalue: .66 },
    { gene: 'CDK4', log2FC: .6, pvalue: .21 },
    { gene: 'MDM2', log2FC: -.1, pvalue: .55 },
  ];
  if (type === 'bar') return ['Q1', 'Q2', 'Q3'].flatMap((category, index) =>
    ['Product A', 'Product B'].map((series, group) => ({ category, series, value: 14 + index * 8 + group * 10 + (index % 2) * 4 })));
  if (type === 'line') return ([['Control', 18], ['Treatment', 30], ['Recovery', 44]] as [string, number][]).flatMap(([series, base], group) =>
    [1, 2, 3, 4].map(time => ({ time, value: +(base + time * 3 + Math.sin(time * .9 + group) * 2).toFixed(2), series })));
  if (type === 'violin') return ['Control', 'Treatment', 'Recovery'].flatMap((group, g) =>
    Array.from({ length: 8 }, (_, i) => ({
      sample: `S${g * 8 + i + 1}`,
      group,
      value: +(12 + g * 7 + Math.sin(i * 2.1 + g * 1.3) * 3 + (i % 4 - 1.5) * 1.1).toFixed(3),
    })));
  if (type === 'manhattan') return Array.from({ length: 12 }, (_, i) => ({
    snp: `rs${100001 + i}`,
    chromosome: String(Math.floor(i / 6) + 1),
    position: (i % 6 + 1) * 2500000,
    pvalue: +Math.pow(10, -(i % 6 === 2 ? 8.5 : 1 + Math.abs(Math.sin(i * 2.3)) * 1.6)).toPrecision(6),
  }));
  // box: three compact groups, one box each.
  return ['Control', 'Treatment', 'Recovery'].flatMap((group, g) =>
    [9, 11, 12, 13, 10].map(v => ({ sample: `S${g + 1}`, group, expression: +(v + g * 8).toFixed(2) })));
}
export function thumbnailConfig(type: ChartType): Config {
  // Bigger, bolder marks so the chart type reads at a glance in a small card; legend off to keep it clean.
  const base = defaults(type);
  return {
    ...base,
    radius: Math.max(base.radius, 8),
    lineWidth: Math.max(base.lineWidth, 4),
    bandwidthFactor: Math.max(base.bandwidthFactor, 1.3),
    barPadding: Math.min(base.barPadding, 0.12),
    legend: false,
  };
}
export function defaults(type: ChartType): Config {
  if (type === 'violin') return {
    ...defaults('scatter'), xField: 'group', yField: 'value', groupField: 'group',
    color: '#356ae6', opacity: .65, showPoints: false, radius: 2.5,
    tooltipFields: ['sample', 'group', 'value'],
  };
  if (type === 'manhattan') return {
    ...defaults('scatter'), xField: 'position', yField: 'pvalue', groupField: '', labelField: 'snp',
    chromosomeField: 'chromosome', color: '#356ae6', radius: 3, pThreshold: 5e-8,
    tooltipFields: ['snp', 'chromosome', 'position', 'pvalue'],
  };
  if (type === 'bar' || type === 'line') return {
    ...defaults('scatter'), xField: type === 'bar' ? 'category' : 'time', yField: 'value',
    groupField: 'series', labelField: type === 'bar' ? 'category' : 'time', color: '#356ae6',
    tooltipFields: [type === 'bar' ? 'category' : 'time', 'value', 'series'],
  };
  return {bandwidthFactor:1,violinScale:'width',violinInner:'box',chromosomeField:'chromosome',chromosomeGap:.04,secondaryColor:'#95a5bd',significantColor:'#e2ad42',showThreshold:true,showSuggestive:false,suggestiveThreshold:1e-5,labelLimit:12,barLayout:'grouped',horizontal:false,barPadding:.22,lineWidth:2.5,smooth:false,area:false,showPoints:true,xField:type==='volcano'?'log2FC':type==='box'?'group':'expressionA', yField:type==='volcano'?'pvalue':type==='box'?'expression':'expressionB',groupField:type==='volcano'?'':'group',labelField:type==='volcano'?'gene':'sample',radius:4,opacity:.8,color:'#197f8a',width:800,height:440,xAxis:true,yAxis:true,grid:true,tooltip:true,legend:true,zoom:false,labels:false,xScale:'linear',yScale:'linear',pThreshold:.05,fcThreshold:1,tooltipFields:type==='volcano'?['gene','log2FC','pvalue']:type==='box'?['group','expression']:['sample','expressionA','expressionB','group']};
}
export function validNumber(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
}
export function validateRows(type: ChartType, data: Row[], c: Config) {
  const category = type === 'box' || type === 'bar' || type === 'violin';
  const pvalues = type === 'volcano' || type === 'manhattan';
  return data.filter(d => {
    if (!validNumber(d[c.yField])) return false;
    if (category ? d[c.xField] == null || String(d[c.xField]).trim() === '' : !validNumber(d[c.xField])) return false;
    if (pvalues && !(+d[c.yField]! > 0 && +d[c.yField]! <= 1)) return false;
    if (type === 'manhattan') return +d[c.xField]! >= 0
      && d[c.chromosomeField] != null && String(d[c.chromosomeField]).trim().replace(/^chr/i, '').trim() !== '';
    if (!category && c.xScale === 'log' && !(+d[c.xField]! > 0)) return false;
    return pvalues || type === 'bar' || type === 'violin' || c.yScale !== 'log' || +d[c.yField]! > 0;
  });
}
