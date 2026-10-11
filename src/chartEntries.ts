import { barEntries } from './barEntries';
import { barMock } from './barModel';
import { scatterEntries } from './scatterEntries';
import { scatterMock } from './scatterModel';
import { chartDescriptions } from './chartDescriptions';
import { charts, defaults, type ChartType, type Config } from './model';

export interface ChartEntry { id: string; type: ChartType; name: string; zh: string; description: string; patch: Partial<Config> }
// Gallery examples share generators, but each link carries a reproducible starting configuration.
const entries: ChartEntry[] = [
  ...charts.map(chart => ({ ...chart, type: chart.id, patch: {},
    ...(chart.id === 'pie' ? { name: 'Pie Chart', zh: '饼图' } : {}),
    ...(chart.id === 'nested-pie' ? { name: 'Nested Donut', zh: '双层环图' } : {}),
  })),
  ...scatterEntries,
  ...barEntries,
  { id:'bar-letters',type:'bar',name:'Bar with Letters',zh:'字母标注柱状图',description:'展示用户提供的分组字母标注',patch:{annotationsEnabled:true,annotationField:'letter'} },
  { id:'box-letters',type:'box',name:'Box with Letters',zh:'字母标注箱线图',description:'展示用户提供的分组字母标注',patch:{annotationsEnabled:true,annotationField:'letter'} },
  { id:'violin-comparisons',type:'violin',name:'Violin with Comparisons',zh:'比较标注小提琴图',description:'手动标注组间比较结果',patch:{comparisonsEnabled:true,comparisons:[{from:'Control',to:'Treatment',label:'Demo comparison'},{from:'Treatment',to:'Recovery',label:'Demo comparison'}]} },
  { id:'violin-horizontal', type:'violin', name:'Horizontal Violin', zh:'水平小提琴图', description:'横向比较各组的分布密度', patch:{horizontal:true} },
  { id:'violin-split', type:'violin', name:'Split Violin', zh:'分组对半小提琴图', description:'在同一分类内对比两个子组', patch:{violinLayout:'split',violinGroupField:'sex'} },
  { id:'violin-half', type:'violin', name:'Half Violin', zh:'半小提琴图', description:'用单侧轮廓呈现密度与观测点', patch:{violinLayout:'half',showPoints:true} },
  { id:'raincloud', type:'violin', name:'Raincloud Plot', zh:'雨云图', description:'结合密度、箱线摘要与原始观测点', patch:{violinLayout:'raincloud',horizontal:true,showPoints:true,radius:2} },
  { id:'violin-letters', type:'violin', name:'Violin with Letters', zh:'字母标注小提琴图', description:'展示用户提供的分组字母标注', patch:{annotationsEnabled:true,annotationField:'letter'} },
  { id:'violin-facet', type:'violin', name:'Faceted Violin', zh:'分面小提琴图', description:'按组织或条件分面比较分布', patch:{facetField:'tissue',height:680} },
  { id:'box-facet', type:'violin', name:'Faceted Box Plot', zh:'分面箱线图', description:'按分面比较四分位数与离群点', patch:{facetField:'tissue',violinGeometry:'box',showPoints:true,height:680} },
  { id:'donut', type:'pie', name:'Donut Chart', zh:'甜甜圈图', description:'用环形展示分类占比', patch:{pieMode:'donut'} },
  { id:'fan', type:'pie', name:'Fan Chart', zh:'扇形图', description:'以半圆扇形展示分类组成', patch:{pieMode:'fan'} },
  { id:'donut-leaders', type:'pie', name:'Donut with Leader Lines', zh:'引线环图', description:'在环外标注分类与占比', patch:{pieMode:'donut',labels:true,compositionLabelStyle:true,labelPlacement:'outside',leaderLines:true} },
  { id:'nested-pie-solid', type:'nested-pie', name:'Nested Pie', zh:'双层饼图', description:'用两层扇区展示父子分类', patch:{pieMode:'pie'} },
  { id:'waffle-dots', type:'waffle', name:'Dot Waffle', zh:'圆点比例图', description:'用圆点数量展示分类比例', patch:{waffleShape:'circle'} },
  { id:'waffle-icons', type:'waffle', name:'Icon Waffle', zh:'图标华夫饼图', description:'用人物图标展示分类比例', patch:{waffleShape:'person'} },
];
export const chartEntries: ChartEntry[] = entries.map(entry=>({...entry,description:chartDescriptions[entry.id]?.[0] ?? entry.description}));
export const entryById = (id: string) => chartEntries.find(entry => entry.id === id);
export function entryConfig(type: ChartType, entryId: string): Config {
  const entry = entryById(entryId);
  return { ...defaults(type), ...(entry?.type === type ? entry.patch : {}) };
}

export function entryData(type:ChartType,id:string) {
 const entry=entryById(id);
 if(entry?.patch.barVariant)return barMock(entry.patch.barVariant);
 return type==='scatter'&&entry?.patch.scatterVariant?scatterMock(entry.patch.scatterVariant):undefined;
}
