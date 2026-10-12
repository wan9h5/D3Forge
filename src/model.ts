import { bioDefaults, bioRows, type BioConfig } from './bioModel';
import { heatmapDefaults, heatmapRows, type HeatmapConfig } from './heatmapModel';
import { volcanoDefaults, volcanoRows, type VolcanoConfig } from './volcanoModel';
import { barDefaults, barRows, type BarConfig } from './barModel';
import { scatterDefaults, scatterRows, type ScatterConfig } from './scatterModel';
import { compositionDefaults, compositionMock, compositionRows, isComposition, type CompositionConfig, type CompositionType } from './compositionModel';
import { advancedDefaults, type AdvancedConfig } from './advancedModel';
export type ChartType = CompositionType | 'scatter' | 'volcano' | 'box' | 'bar' | 'line' | 'violin' | 'manhattan' | 'heatmap' | 'histogram';
export type Row = Record<string, string | number | null>;
export interface Config extends BioConfig, AdvancedConfig, CompositionConfig, ScatterConfig, BarConfig, VolcanoConfig, HeatmapConfig {
  xField: string; yField: string; groupField: string; labelField: string;
  radius: number; opacity: number; color: string; width: number; height: number;
  xAxis: boolean; yAxis: boolean; grid: boolean; tooltip: boolean; legend: boolean;
  zoom: boolean; labels: boolean; xScale: 'linear' | 'log'; yScale: 'linear' | 'log';
  barLayout: 'grouped' | 'stacked'; horizontal: boolean; barPadding: number; lineWidth: number; smooth: boolean; area: boolean; showPoints: boolean;
  comparisonsEnabled: boolean; comparisons: {from:string;to:string;label:string}[];
  violinLayout: 'full' | 'half' | 'split' | 'raincloud'; violinGroupField: string; facetField: string; facetScale: 'shared' | 'free'; violinGeometry: 'violin' | 'box'; annotationsEnabled: boolean; annotationField: string;
  bandwidthFactor: number; violinScale: 'width' | 'density'; violinInner: 'box' | 'median' | 'none';
  chromosomeField: string; chromosomeGap: number; secondaryColor: string; significantColor: string;
  showThreshold: boolean; showSuggestive: boolean; suggestiveThreshold: number; labelLimit: number;
  valueField: string; heatmapAggregate: 'mean' | 'sum'; heatmapPalette: 'sequential' | 'diverging'; cellGap: number; cellRadius: number;
  binCount: number; histogramMode: 'count' | 'density';
  pThreshold: number; fcThreshold: number; tooltipFields: string[];
}
export const charts: {id: ChartType; name: string; zh: string; description: string}[] = [
  {id:'scatter',name:'Scatter Plot',zh:'散点图',description:'比较两个数值变量'},
  {id:'volcano',name:'Volcano Plot',zh:'火山图',description:'展示效应量与显著性'},
  {id:'box',name:'Box Plot',zh:'箱线图',description:'比较各组的数据分布'},
  {id:'bar',name:'Bar Chart',zh:'柱状图',description:'比较分类数值与各系列构成'},
  {id:'line',name:'Line Chart',zh:'折线图',description:'展示数值随时间或顺序的变化'},
  {id:'violin',name:'Violin Plot',zh:'小提琴图',description:'比较各组的分布密度与统计摘要'},
  {id:'heatmap',name:'Heatmap',zh:'热力图',description:'用颜色比较矩阵中的数值'},
  {id:'histogram',name:'Histogram',zh:'直方图',description:'查看单个数值变量的频数与密度'},
  {id:'manhattan',name:'Manhattan Plot',zh:'曼哈顿图',description:'展示染色体上的关联显著性'},
  {id:'pie',name:'Pie / Donut',zh:'饼图与环图',description:'展示分类组成，支持环形与扇形'},
  {id:'pie-matrix',name:'Pie Matrix',zh:'矩阵饼图',description:'比较行列分组中的分类占比'},
  {id:'nested-pie',name:'Nested Pie',zh:'双层分类饼图',description:'展示父分类与子分类的组成关系'},
  {id:'waffle',name:'Waffle Chart',zh:'华夫饼图',description:'用方格、圆点或图标表示分类比例'},
  {id:'pie-bar',name:'Bar of Pie',zh:'饼图与条形细分',description:'展开一个父分类的内部组成'},
  {id:'bar-pie',name:'Bar with Pies',zh:'柱状图与饼图',description:'同时比较样本总量与分类占比'},
];
export function mockData(type: ChartType): Row[] {
  if(isComposition(type))return compositionMock(type);
  if (type === 'heatmap') return ['TP53', 'BRCA1', 'EGFR', 'MYC', 'KRAS', 'STAT3'].flatMap((gene, row) =>
    ['Control 1', 'Control 2', 'Treatment 1', 'Treatment 2', 'Recovery 1'].map((sample, column) => ({
      gene, sample, value: +(Math.sin(row * 1.4 + column * .8) * 2.4 + (column > 1 && column < 4 ? row * .45 : 0)).toFixed(2),
    })));
  if (type === 'histogram') return Array.from({ length: 180 }, (_, i) => ({
    sample: `S${String(i + 1).padStart(3, '0')}`,
    value: +(50 + Math.sin(i * 1.73) * 9 + Math.cos(i * .67) * 7 + Math.sin(i * .31) * 5).toFixed(3),
  }));
  if (type === 'violin') return Array.from({ length: 144 }, (_, i) => ({
    sample: `S${String(i + 1).padStart(3, '0')}`,
    sex: i % 2 ? 'Female' : 'Male', tissue: Math.floor(i / 6) % 2 ? 'Liver' : 'Blood', letter: ['a', 'b', 'ab'][i % 3],
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
    ['Product A', 'Product B', 'Product C'].map((series, group) => ({ category, series, letter: ['a','b','ab'][group], value: 18 + index * 7 + group * 9 + (index % 2) * (group + 2) })));
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
      : {sample:`S${String(i+1).padStart(2,'0')}`,group,letter:['a','b','ab'][i%3],expression: +(7 + (i%3)*3 + Math.sin(i*1.7)*2.6 + (i===40?12:0)).toFixed(2)};
  });
}
export function thumbnailData(type: ChartType): Row[] {
  if(isComposition(type))return mockData(type);
  if (type === 'heatmap') return mockData(type).filter(row => row.gene !== 'STAT3');
  if (type === 'histogram') return mockData(type);
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
    radius: Math.max(base.radius, 15),
    lineWidth: Math.max(base.lineWidth, 6),
    bandwidthFactor: Math.max(base.bandwidthFactor, 1.7),
    barPadding: Math.min(base.barPadding, 0.08),
    binCount: type === 'histogram' ? 9 : base.binCount,
    legend: false,
  };
}
export function defaults(type: ChartType): Config {
  if(isComposition(type))return {...defaults('scatter'),xField:'category',yField:'value',groupField:'category',valueField:'value',labelField:'category',xAxis:false,yAxis:false,grid:false,opacity:1,color:'#3B6FF5',showPoints:false,pieMode:type==='nested-pie'?'donut':'pie',holeRatio:type==='nested-pie'?.25:.55,tooltipFields:['category','value']};
  if (type === 'heatmap') return {
    ...defaults('scatter'), xField: 'sample', yField: 'gene', valueField: 'value', groupField: '',
    color: '#F06464', secondaryColor: '#3B6FF5', opacity: 1, heatmapPalette: 'diverging',
    tooltipFields: ['sample', 'gene', 'value'],
  };
  if (type === 'histogram') return {
    ...defaults('scatter'), xField: 'value', yField: 'value', groupField: '', color: '#3B6FF5',
    legend: false, opacity: 1, tooltipFields: ['value'],
  };
  if (type === 'violin') return {
    ...defaults('scatter'), xField: 'group', yField: 'value', groupField: 'group',
    color: '#3B6FF5', opacity: .85, showPoints: false, radius: 2.5,
    tooltipFields: ['sample', 'group', 'value'],
  };
  if (type === 'manhattan') return {
    ...defaults('scatter'), xField: 'position', yField: 'pvalue', groupField: '', labelField: 'snp',
    chromosomeField: 'chromosome', color: '#3B6FF5', radius: 3, pThreshold: 5e-8,
    tooltipFields: ['snp', 'chromosome', 'position', 'pvalue'],
  };
  if (type === 'bar' || type === 'line') return {
    ...defaults('scatter'), xField: type === 'bar' ? 'category' : 'time', yField: 'value',
    groupField: 'series', labelField: type === 'bar' ? 'category' : 'time', color: '#3B6FF5', opacity: 1,
    tooltipFields: [type === 'bar' ? 'category' : 'time', 'value', 'series'],
  };
  return {...advancedDefaults,...compositionDefaults,...scatterDefaults,...barDefaults,...volcanoDefaults,...heatmapDefaults,...bioDefaults,
    comparisonsEnabled:false,comparisons:[],violinLayout:'full',violinGroupField:'',facetField:'',facetScale:'shared',violinGeometry:'violin',annotationsEnabled:false,annotationField:'letter',valueField:'value',heatmapAggregate:'mean',heatmapPalette:'sequential',cellGap:2,cellRadius:2,binCount:14,histogramMode:'count',bandwidthFactor:1,violinScale:'width',violinInner:'box',chromosomeField:'chromosome',chromosomeGap:.04,secondaryColor:'#06B6D4',significantColor:'#F59E0B',showThreshold:true,showSuggestive:false,suggestiveThreshold:1e-5,labelLimit:12,barLayout:'grouped',horizontal:false,barPadding:.22,lineWidth:2.5,smooth:false,area:false,showPoints:true,xField:type==='volcano'?'log2FC':type==='box'?'group':'expressionA', yField:type==='volcano'?'pvalue':type==='box'?'expression':'expressionB',groupField:type==='volcano'?'':'group',labelField:type==='volcano'?'gene':'sample',radius:4,opacity:.95,color:'#3B6FF5',width:800,height:440,xAxis:true,yAxis:true,grid:true,tooltip:true,legend:true,zoom:false,labels:false,xScale:'linear',yScale:'linear',pThreshold:.05,fcThreshold:1,tooltipFields:type==='volcano'?['gene','log2FC','pvalue']:type==='box'?['group','expression']:['sample','expressionA','expressionB','group']};
}
export function validNumber(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
}
export function validateRows(type: ChartType, data: Row[], c: Config) {
  if(c.bioVariant!=='none')return bioRows(data,c);
  if(type==='heatmap'&&c.heatmapVariant!=='basic')return heatmapRows(data,c);
  if(type==='volcano'&&c.volcanoVariant!=='basic')return volcanoRows(data,c);
  if((type==='bar'||type==='histogram')&&c.barVariant!=='basic')return barRows(data,c);
  if(type==='scatter'&&c.scatterVariant!=='basic')return scatterRows(data,c);
  if(isComposition(type))return compositionRows(type,data,c);
  if (type === 'histogram') return data.filter(row => validNumber(row[c.xField]) && (!c.histogramRangeEnabled || +row[c.xField]! >= c.histogramMin && +row[c.xField]! <= c.histogramMax));
  if (type === 'heatmap') return data.filter(row =>
    row[c.xField] != null && String(row[c.xField]).trim() !== ''
    && row[c.yField] != null && String(row[c.yField]).trim() !== ''
    && validNumber(row[c.valueField])
  );
  const category = type === 'box' || type === 'bar' || type === 'violin';
  const pvalues = type === 'volcano' || type === 'manhattan';
  return data.filter(d => {
    if (!validNumber(d[c.yField])) return false;
    if (type === 'violin' && [c.violinGroupField,c.facetField].filter(Boolean).some(field => d[field] == null || String(d[field]).trim() === '')) return false;
    if (category ? d[c.xField] == null || String(d[c.xField]).trim() === '' : !validNumber(d[c.xField])) return false;
    if (pvalues && !(+d[c.yField]! > 0 && +d[c.yField]! <= 1)) return false;
    if (type === 'manhattan') return +d[c.xField]! >= 0
      && d[c.chromosomeField] != null && String(d[c.chromosomeField]).trim().replace(/^chr/i, '').trim() !== '';
    if (!category && c.xScale === 'log' && !(+d[c.xField]! > 0)) return false;
    return pvalues || type === 'bar' || type === 'violin' || c.yScale !== 'log' || +d[c.yField]! > 0;
  });
}
