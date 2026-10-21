import { chartEntries } from './chartEntries';
import { t } from './i18n';
import type { ChartType } from './model';
// Group by the visual chart family, independently of the generator an example reuses.
export const categories = [
  { id:'all',label:'全部图形' },
  { id:'scatter',label:'散点图' },
  { id:'pca',label:'PCA 图' },
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
  { id:'forest',label:'森林图' },
  { id:'roc',label:'ROC 曲线' },
  { id:'pr',label:'PR 曲线' },
  { id:'funnel',label:'漏斗图' },
  { id:'qq',label:'QQ 图' },
  { id:'regional',label:'区域关联图' },
  { id:'accumulation',label:'物种累积曲线' },
] as const;
export type Category = typeof categories[number]['id'];
const chartCategories: Record<ChartType, Exclude<Category,'all'>> = {
  scatter:'scatter',line:'line',bar:'bar',box:'box',violin:'violin',pie:'pie',
  'pie-matrix':'pie','nested-pie':'pie','pie-bar':'pie','bar-pie':'bar',
  waffle:'waffle',histogram:'histogram',heatmap:'heatmap',volcano:'volcano',manhattan:'manhattan',
};
const bioCategories:Record<string,Exclude<Category,'all'>>={
 forest:'forest',roc:'roc',pr:'pr',funnel:'funnel',qq:'qq',regional:'regional',accumulation:'accumulation',
 km:'survival',cutoff:'survival','circos-gene':'circos',fusion:'circos',ligand:'circos','circos-tracks':'circos',ld:'heatmap',
};
export const entryCategory = (chart:typeof chartEntries[number]):Exclude<Category,'all'> => {
 if(chart.patch.pcaAxes)return 'pca';
 if(chart.patch.bioVariant)return bioCategories[chart.patch.bioVariant]??'chromosome';
 if(chart.patch.scatterVariant==='gsea')return 'bar';
 if(chart.patch.violinGeometry==='box')return 'box';
 return chartCategories[chart.type];
};

const normalizeSearch = (value:string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const searchAliases:Record<string,string[]>={
 'pca':['主成分分析','principal components analysis'],
 'pca-biplot':['PCA因子图','PCA factor','biplot'],
 'pca-hull':['PCA分析三重复','PCA convex hull'],
 'pca-3d':['三维PCA','3d pca'],
 'bio-chromosome':['染色体分布图','SNP 染色体分布','chromosome locus map'],
 'bio-ideogram':['峰染色体分布图','染色体分布峰值','chromosome peak distribution'],
 'bio-segments':['片段染色体分布','chromosome segment distribution'],
 'bio-centromere':['分裂染色体分布图','着丝粒染色体分布','centromere chromosome distribution'],
 'bio-accumulation':['物种累积曲线','species accumulation','SAC'],
 'bio-circos-tracks':['双通道circos柱状图','基因组双轨道','genomic circular histogram'],
 'bio-qq':['QQ 图','GWAS QQ plot','quantile quantile'],
 'bio-regional':['局部关联图','区域关联分析图','regional GWAS','locus association'],
};
const searchIndex=chartEntries.map(chart=>{
 const family=categories.find(item=>item.id===entryCategory(chart))!.label;
 return {chart,names:[chart.id,chart.name,...(searchAliases[chart.id]??[]),...(['zh','en','ja'] as const).flatMap(locale=>[t(chart.zh,{},locale),t(family,{},locale)])].map(normalizeSearch)};
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
