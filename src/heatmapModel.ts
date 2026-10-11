import type { Config, Row } from './model';
export type HeatmapVariant = 'basic'|'cluster'|'circular'|'matrix'|'calendar'|'triangle'|'gene-labels'|'cut'|'clinical'|'annotation'|'trend'|'trend-annotation'|'marked'|'bar'|'split'|'dot'|'shape'|'sankey';
export interface HeatmapConfig {
 heatmapVariant:HeatmapVariant;
 heatmapNormalize:'none'|'row'|'column'; heatmapDistance:'euclidean'|'manhattan'|'correlation'; heatmapLinkage:'average'|'single'|'complete';
 heatmapRowCluster:boolean; heatmapColumnCluster:boolean; heatmapDendrogram:boolean; heatmapCut:number; heatmapCutEnabled:boolean;
 heatmapTriangle:'full'|'upper'|'lower'; heatmapDualTriangle:boolean; heatmapSecondField:string;
 heatmapRowAnnotations:boolean; heatmapColumnAnnotations:boolean; heatmapRowFields:string; heatmapColumnFields:string;
 heatmapGeneList:string; heatmapLabelLimit:number; heatmapPartialLabels:boolean;
 heatmapMarkField:string; heatmapMarks:boolean; heatmapShape:'rect'|'circle'|'triangle'|'diamond'; heatmapSize:boolean; heatmapSizeField:string;
 heatmapDateField:string; heatmapWeekStart:'monday'|'sunday'; heatmapCalendarYear:string;
 heatmapTrend:boolean; heatmapTrendMeans:boolean; heatmapTrendPoints:boolean;
 heatmapTerms:boolean; heatmapTermField:string; heatmapTermLimit:number; heatmapBar:boolean; heatmapSummary:'mean'|'sum';
 heatmapSplitField:string; heatmapSplitA:string; heatmapSplitB:string; heatmapSplitGap:number;
 heatmapSankeyWeight:string; heatmapInnerRadius:number; heatmapStartAngle:number; heatmapEndAngle:number;
 heatmapFontSize:number; heatmapLegendTitle:string; heatmapMissing:string;
}
export const heatmapDefaults:HeatmapConfig={
 heatmapVariant:'basic',heatmapNormalize:'none',heatmapDistance:'euclidean',heatmapLinkage:'average',heatmapRowCluster:false,heatmapColumnCluster:false,heatmapDendrogram:true,heatmapCut:3,heatmapCutEnabled:false,
 heatmapTriangle:'full',heatmapDualTriangle:false,heatmapSecondField:'value2',heatmapRowAnnotations:false,heatmapColumnAnnotations:false,heatmapRowFields:'pathway',heatmapColumnFields:'condition,age',
 heatmapGeneList:'TP53,EGFR,MYC',heatmapLabelLimit:10,heatmapPartialLabels:false,heatmapMarkField:'mark',heatmapMarks:false,heatmapShape:'rect',heatmapSize:false,heatmapSizeField:'size',
 heatmapDateField:'date',heatmapWeekStart:'monday',heatmapCalendarYear:'',heatmapTrend:false,heatmapTrendMeans:true,heatmapTrendPoints:false,
 heatmapTerms:false,heatmapTermField:'pathway',heatmapTermLimit:8,heatmapBar:false,heatmapSummary:'mean',heatmapSplitField:'cohort',heatmapSplitA:'',heatmapSplitB:'',heatmapSplitGap:24,
 heatmapSankeyWeight:'',heatmapInnerRadius:.3,heatmapStartAngle:0,heatmapEndAngle:330,heatmapFontSize:11,heatmapLegendTitle:'',heatmapMissing:'#f1f4f8',
};
export function heatmapRows(data:Row[],c:Config){
 const number=(v:unknown)=>v!=null&&String(v).trim()!==''&&Number.isFinite(Number(v));
 const date=(v:unknown)=>{const s=String(v??'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;};
 return data.filter(d=>number(d[c.valueField])&&(c.heatmapVariant==='calendar'?date(d[c.heatmapDateField]):[c.xField,c.yField].every(f=>d[f]!=null&&String(d[f]).trim()!==''))&&(c.heatmapVariant!=='split'||d[c.heatmapSplitField]!=null&&String(d[c.heatmapSplitField]).trim()!==''));
}
export function heatmapMock(mode:HeatmapVariant):Row[]{
 if(mode==='calendar')return Array.from({length:180},(_,i)=>({date:new Date(Date.UTC(2025,10,1+i)).toISOString().slice(0,10),value:Math.round((Math.sin(i*.21)+1.1)*8),condition:i%2?'A':'B'}));
 const names=['TP53','BRCA1','EGFR','MYC','KRAS','IL6','TNF','STAT3','CDK2','GATA3','AKT1','VEGFA'];
 const matrix=['matrix','triangle','dot','shape'].includes(mode), cols=matrix?names.slice(0,8):Array.from({length:8},(_,i)=>'T'+(i+1)),rows=matrix?cols:names;
 return rows.flatMap((gene,r)=>cols.map((sample,c)=>({gene,sample,value:+(matrix?Math.cos((r-c)*.7):Math.sin(c*.57+(r%3)*2.1)*1.7+(r%4)*.25+.18*Math.cos(r*.7+c*1.2)).toFixed(3),value2:+Math.sin((r+c)*.65).toFixed(3),size:1+(r*3+c)%9,mark:(r+c)%11===0?'**':(r+c)%7===0?'*':'',condition:c<4?'Control':'Treatment',age:30+c*4,pathway:['Immune response','Cell cycle','Metabolism'][r%3],tissue:r<6?'Liver':'Blood',cohort:c<4?'A':'B',weight:1+(r%3)})));
}
