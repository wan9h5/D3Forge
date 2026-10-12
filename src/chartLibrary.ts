import { chartEntries } from './chartEntries';
import { t } from './i18n';
import type { ChartType } from './model';
// Group by the visual chart family, independently of the generator an example reuses.
export const categories = [
  { id:'all',label:'全部图形' },
  { id:'scatter',label:'散点图' },
  { id:'line',label:'折线图' },
  { id:'bar',label:'柱状图' },
  { id:'box',label:'箱线图' },
  { id:'violin',label:'小提琴图' },
  { id:'pie',label:'饼图' },
  { id:'waffle',label:'华夫饼图' },
  { id:'histogram',label:'直方图' },
  { id:'heatmap',label:'热力图' },
  { id:'volcano',label:'火山图' },
  { id:'manhattan',label:'曼哈顿图' },
  { id:'survival',label:'生存曲线' },
  { id:'circos',label:'Circos 图' },
  { id:'chromosome',label:'染色体图' },
] as const;
export type Category = typeof categories[number]['id'];
const chartCategories: Record<ChartType, Exclude<Category,'all'>> = {
  scatter:'scatter',line:'line',bar:'bar',box:'box',violin:'violin',pie:'pie',
  'pie-matrix':'pie','nested-pie':'pie','pie-bar':'pie','bar-pie':'bar',
  waffle:'waffle',histogram:'histogram',heatmap:'heatmap',volcano:'volcano',manhattan:'manhattan',
};
export const entryCategory = (chart:typeof chartEntries[number]) => chart.patch.bioVariant ? (['km','cutoff'].includes(chart.patch.bioVariant)?'survival':['circos-gene','fusion','ligand'].includes(chart.patch.bioVariant)?'circos':chart.patch.bioVariant==='ld'?'heatmap':'chromosome') : chart.patch.scatterVariant==='gsea' ? 'bar' : chart.patch.violinGeometry==='box' ? 'box' : chartCategories[chart.type];

const normalizeSearch = (value:string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const searchIndex=chartEntries.map(chart=>{
 const family=categories.find(item=>item.id===entryCategory(chart))!.label;
 return {chart,names:[chart.id,chart.name,...(['zh','en','ja'] as const).flatMap(locale=>[t(chart.zh,{},locale),t(family,{},locale)])].map(normalizeSearch)};
});
export function searchCharts(query:string){
 const terms=query.trim().split(/\s+/).filter(Boolean).map(normalizeSearch);
 if(!terms.length)return chartEntries;
 return searchIndex.filter(({names})=>terms.every(term=>names.some(name=>{
  if(name.includes(term))return true;
  let index=0;for(const character of name)if(character===term[index])index++;
  return index===term.length;
 }))).map(item=>item.chart);
}
