import type { Config, Row } from './model';
export const compositionTypes = ['pie','pie-matrix','nested-pie','waffle','pie-bar','bar-pie'] as const;
export type CompositionType = typeof compositionTypes[number];
export const isComposition = (type:string):type is CompositionType => (compositionTypes as readonly string[]).includes(type);
// A lighter default keeps large composition marks readable without making the gallery feel heavy.
export const softCompositionPalette = ['#6f9bd3','#f2a65a','#79b7b3','#df777f','#9986c7','#83b8d6','#e6c45c','#8fba73','#bc8cbd','#e39a63'];
export interface CompositionConfig {
  categoryField:string; parentField:string; matrixRowField:string; matrixColumnField:string; sampleField:string;
  pieMode:'pie'|'donut'|'fan'; holeRatio:number;
  arcStyle:boolean; startAngle:number; sweepAngle:number; arcGap:number; arcCorner:number;
  compositionOrder:'input'|'ascending'|'descending';
  categoryColorsEnabled:boolean; categoryColors:Record<string,string>;
  compositionPalette:'soft'|'tableau'|'category10'|'paired';
  compositionLabelStyle:boolean; labelPlacement:'inside'|'outside'; labelContent:'category'|'percent'|'both'; labelMinPercent:number; leaderLines:boolean;
  centerTextEnabled:boolean; centerText:string;
  waffleShape:'square'|'circle'|'person'; waffleRows:number; waffleColumns:number; waffleGap:number;
  matrixGap:number; ringGap:number; splitCategory:string; compositionBarGap:number;
}
export const compositionDefaults:CompositionConfig={
  categoryField:'category',parentField:'parent',matrixRowField:'condition',matrixColumnField:'sample',sampleField:'sample',
  pieMode:'pie',holeRatio:.55,arcStyle:false,startAngle:0,sweepAngle:360,arcGap:.012,arcCorner:0,
  categoryColorsEnabled:false,categoryColors:{},compositionOrder:'input',compositionPalette:'soft',compositionLabelStyle:false,labelPlacement:'inside',labelContent:'both',labelMinPercent:3,leaderLines:true,
  centerTextEnabled:false,centerText:'',waffleShape:'square',waffleRows:10,waffleColumns:10,waffleGap:3,matrixGap:24,ringGap:4,splitCategory:'',compositionBarGap:.25,
};
export function compositionMock(type:CompositionType):Row[] {
  const categories=['T cells','B cells','Myeloid','Other'];
  if(type==='nested-pie'||type==='pie-bar')return [
    {parent:'Lymphoid',category:'T cells',value:42},{parent:'Lymphoid',category:'B cells',value:23},
    {parent:'Myeloid',category:'Monocytes',value:18},{parent:'Myeloid',category:'Dendritic',value:7},
    {parent:'Other',category:'Stromal',value:6},{parent:'Other',category:'Endothelial',value:4},
  ];
  if(type==='pie-matrix')return ['Control','Treatment'].flatMap((condition,r)=>['S1','S2','S3'].flatMap((sample,c)=>categories.map((category,i)=>({condition,sample,category,value:[42,24,22,12][i]+r*(i+1)*4+c*3}))));
  if(type==='bar-pie')return ['Control','Treatment','Recovery'].flatMap((sample,j)=>categories.map((category,i)=>({sample,category,value:[42,24,22,12][i]+j*(i+2)*5})));
  return categories.map((category,i)=>({category,value:[42,24,22,12][i]}));
}
export function compositionRows(type:CompositionType,data:Row[],c:Config) {
  const required=[c.categoryField,...(type==='nested-pie'||type==='pie-bar'?[c.parentField]:[]),...(type==='pie-matrix'?[c.matrixRowField,c.matrixColumnField]:[]),...(type==='bar-pie'?[c.sampleField]:[])];
  return data.filter(row=>required.every(field=>row[field]!=null&&String(row[field]).trim()!=='')&&row[c.valueField]!=null&&String(row[c.valueField]).trim()!==''&&Number.isFinite(Number(row[c.valueField]))&&Number(row[c.valueField])>=0);
}
