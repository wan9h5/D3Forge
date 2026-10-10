import type { ChartType, Config, Row } from './model';

export interface AdvancedConfig {
  axisStyle: boolean; xTitle: string; yTitle: string; tickFontSize: number; titleFontSize: number; axisColor: string;
  xTickCount: number; yTickCount: number; tickSize: number; xTickAngle: number; xTickFormat: string; yTickFormat: string;
  xDomainEnabled: boolean; xMin: number; xMax: number; yDomainEnabled: boolean; yMin: number; yMax: number;
  canvasStyle: boolean; background: string; marginTop: number; marginRight: number; marginBottom: number; marginLeft: number;
  gridStyle: boolean; gridColor: string; gridWidth: number; gridOpacity: number; gridDash: string;
  labelStyle: boolean; labelFontSize: number; labelColor: string; labelOffsetX: number; labelOffsetY: number; valueFormat: string;
  legendStyle: boolean; legendPosition: 'top' | 'bottom'; legendDirection: 'row' | 'column'; legendFontSize: number; legendGap: number; legendMaxItems: number; legendLabelLength: number;
  markBorder: boolean; borderColor: string; borderWidth: number;
  referenceXEnabled: boolean; referenceYEnabled: boolean; referenceX: number; referenceY: number; referenceColor: string; referenceWidth: number; referenceDash: string;
  chartStyle: boolean; pointShape: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'cross';
  scatterSizeEnabled: boolean; sizeField: string; sizeMin: number; sizeMax: number;
  upColor: string; downColor: string; neutralColor: string; thresholdColor: string; thresholdWidth: number; thresholdDash: string;
  boxWidth: number; showOutliers: boolean; outlierFill: string; medianColor: string; medianWidth: number;
  cornerRadius: number; seriesPadding: number; curveType: 'linear' | 'monotone' | 'step' | 'basis'; lineDash: string; areaOpacity: number;
  violinWidth: number; jitterWidth: number; violinSamples: number;
  rowOrder: 'input' | 'ascending' | 'descending'; columnOrder: 'input' | 'ascending' | 'descending';
  colorDomainEnabled: boolean; colorMin: number; colorMax: number; missingColorEnabled: boolean; missingColor: string;
  histogramRangeEnabled: boolean; histogramMin: number; histogramMax: number; binGap: number;
}
export const advancedDefaults: AdvancedConfig = {
  axisStyle:false,xTitle:'',yTitle:'',tickFontSize:12,titleFontSize:13,axisColor:'#687789',xTickCount:7,yTickCount:6,tickSize:6,xTickAngle:0,xTickFormat:'',yTickFormat:'',
  xDomainEnabled:false,xMin:0,xMax:100,yDomainEnabled:false,yMin:0,yMax:100,
  canvasStyle:false,background:'#ffffff',marginTop:56,marginRight:28,marginBottom:76,marginLeft:80,
  gridStyle:false,gridColor:'#e8edf2',gridWidth:1,gridOpacity:1,gridDash:'',
  labelStyle:false,labelFontSize:12,labelColor:'#39495b',labelOffsetX:0,labelOffsetY:0,valueFormat:'.3~g',
  legendStyle:false,legendPosition:'top',legendDirection:'row',legendFontSize:12,legendGap:14,legendMaxItems:10,legendLabelLength:18,
  markBorder:false,borderColor:'#26394c',borderWidth:1,
  referenceXEnabled:false,referenceYEnabled:false,referenceX:0,referenceY:0,referenceColor:'#d87867',referenceWidth:1.5,referenceDash:'6,4',
  chartStyle:false,pointShape:'circle',scatterSizeEnabled:false,sizeField:'',sizeMin:2,sizeMax:12,
  upColor:'#c45542',downColor:'#3875b5',neutralColor:'#a6b0bd',thresholdColor:'#b5bfca',thresholdWidth:1.5,thresholdDash:'6,4',
  boxWidth:80,showOutliers:true,outlierFill:'#ffffff',medianColor:'#162b3b',medianWidth:2,
  cornerRadius:0,seriesPadding:.08,curveType:'monotone',lineDash:'',areaOpacity:.2,
  violinWidth:.45,jitterWidth:.55,violinSamples:81,rowOrder:'input',columnOrder:'input',
  colorDomainEnabled:false,colorMin:-3,colorMax:3,missingColorEnabled:false,missingColor:'#edf1f5',
  histogramRangeEnabled:false,histogramMin:0,histogramMax:100,binGap:1,
};

export function numericAxes(type: ChartType, c: Config) {
  return {
    x: ['scatter','volcano','line'].includes(type) || type==='bar' && c.horizontal,
    y: type!=='heatmap' && !(type==='bar' && c.horizontal),
  };
}
export function hasChartLegend(type: ChartType,c: Config) {
  return c.legend && type!=='histogram' && (!['scatter','bar','line'].includes(type) || !!c.groupField);
}
export function legendNames(type: ChartType,data: Row[],c: Config): string[] {
  if(type==='volcano')return ['up','down','ns'];
  if(type==='manhattan')return ['Chromosome group A','Chromosome group B','Significant'];
  const field=type==='box'||type==='violin'?c.xField:c.groupField;
  return [...new Set(data.map(row=>String(row[field]??'')).filter(Boolean))];
}
export const legendTextWidth = (text: string, size: number) => Array.from(text).reduce((sum,char)=>sum+(char.charCodeAt(0)>255?size:size*.6),0);
export function legendBand(type: ChartType,data: Row[],c:Config,innerW:number) {
  if(type==='heatmap')return 38;
  let x=0,y=0;const step=c.legendFontSize+c.legendGap;
  for(const name of legendNames(type,data,c).slice(0,c.legendMaxItems)) {
    const width=legendTextWidth(name.slice(0,c.legendLabelLength),c.legendFontSize)+24+c.legendGap;
    if(c.legendDirection==='column' || x && x+width>innerW){y+=step;x=0;}
    x+=width;
  }
  return Math.min(y+step*2,Math.max(40,c.height*.4));
}
