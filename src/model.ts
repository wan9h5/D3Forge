export type ChartType = 'scatter' | 'volcano' | 'box';
export type Row = Record<string, string | number | null>;
export interface Config {
  xField: string; yField: string; groupField: string; labelField: string;
  radius: number; opacity: number; color: string; width: number; height: number;
  xAxis: boolean; yAxis: boolean; grid: boolean; tooltip: boolean; legend: boolean;
  zoom: boolean; labels: boolean; xScale: 'linear' | 'log'; yScale: 'linear' | 'log';
  pThreshold: number; fcThreshold: number; tooltipFields: string[];
}
export const charts: {id: ChartType; name: string; zh: string; description: string}[] = [
  {id:'scatter',name:'Scatter Plot',zh:'散点图',description:'比较两个数值变量'},
  {id:'volcano',name:'Volcano Plot',zh:'火山图',description:'展示效应量与显著性'},
  {id:'box',name:'Box Plot',zh:'箱线图',description:'比较各组的数据分布'},
];
export function mockData(type: ChartType): Row[] {
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
export function defaults(type: ChartType): Config {
  return {xField:type==='volcano'?'log2FC':type==='box'?'group':'expressionA', yField:type==='volcano'?'pvalue':type==='box'?'expression':'expressionB',groupField:type==='volcano'?'':'group',labelField:type==='volcano'?'gene':'sample',radius:4,opacity:.8,color:'#197f8a',width:800,height:440,xAxis:true,yAxis:true,grid:true,tooltip:true,legend:true,zoom:false,labels:false,xScale:'linear',yScale:'linear',pThreshold:.05,fcThreshold:1,tooltipFields:type==='volcano'?['gene','log2FC','pvalue']:type==='box'?['group','expression']:['sample','expressionA','expressionB','group']};
}
export function validNumber(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
}
export function validateRows(type: ChartType, data: Row[], c: Config) {
  return data.filter(d => validNumber(d[c.yField]) && (type==='box' ? d[c.xField] !== null && d[c.xField] !== undefined && String(d[c.xField]).trim() !== '' : validNumber(d[c.xField])) && (type!=='volcano' || (+d[c.yField]!>0 && +d[c.yField]!<=1)) && (type==='box' || c.xScale!=='log' || +d[c.xField]!>0) && (type==='volcano' || c.yScale!=='log' || +d[c.yField]!>0));
}
