import { entryConfig, entryData } from './chartEntries';
import { isComposition } from './compositionModel';
import { create } from 'zustand';
import { defaults, mockData, type ChartType, type Config, type Row } from './model';
interface State { type: ChartType; entryId: string; config: Config; data: Row[]; dataName: string; revision: number; setConfig: (patch: Partial<Config>)=>void; selectChart:(type:ChartType,entryId?:string)=>void; loadData:(rows:Row[],name:string)=>void; reset:()=>void; }
export const useBuilder = create<State>((set,get)=>({
  type:'scatter',entryId:'scatter',config:defaults('scatter'),data:mockData('scatter'),dataName:'Mock data',revision:0,
  setConfig:patch=>set(s=>{
    const config={...s.config,...patch};
    for(const axis of ['x','y'] as const) {
      if(config[`${axis}Scale`]==='log' && config[`${axis}DomainEnabled`] && config[`${axis}Min`]<=0) {
        config[`${axis}Min`]=Math.min(1,config[`${axis}Max`]/10);
        if(config[`${axis}Min`]<=0)config[`${axis}DomainEnabled`]=false;
      }
    }
    return {config,revision:s.revision+1};
  }),
  selectChart:(type,entryId=type)=>set(s=>({type,entryId,config:entryConfig(type,entryId),data:entryData(type,entryId)??mockData(type),dataName:'Mock data',revision:s.revision+1})),
  loadData:(data,dataName)=> {
    const fields=Object.keys(data[0]);
    const numbers=fields.filter(k=>data.some(d=>d[k]!==null && String(d[k]).trim()!=='' && Number.isFinite(Number(d[k]))));
    const categories=fields.filter(k=>!numbers.includes(k));
    const current = get();
    const c = current.config;
    const heatmap = current.type === 'heatmap';
    const histogram = current.type === 'histogram';
    const categoricalX = (current.type==='scatter'&&['bubble','paired','gsea'].includes(c.scatterVariant)) || ['box', 'bar', 'violin', 'heatmap'].includes(current.type);
    const manhattan = current.type === 'manhattan';
    const chromosomeField = fields.includes(c.chromosomeField) ? c.chromosomeField
      : fields.find(field => /^(chr|chrom|chromosome)$/i.test(field))
        || categories.find(field => field !== c.labelField) || fields[0];
    const pField = fields.find(field => /^(p|pvalue|p_value|pval|p\.value)$/i.test(field));
    const positionField = fields.find(field => /^(bp|pos|position|base_?pair|base_?position)$/i.test(field));
    const xField = fields.includes(c.xField) ? c.xField
      : categoricalX ? categories[0] || fields[0] : (manhattan ? positionField || numbers.find(field => field !== chromosomeField && field !== pField) : numbers[0]) || fields[0];
    const yField = fields.includes(c.yField) ? c.yField
      : (current.type==='scatter'&&c.scatterVariant==='bubble') ? categories.find(field=>field!==xField)||fields[0]
      : heatmap ? categories.find(field => field !== xField) || fields.find(field => field !== xField) || xField
      : histogram ? xField
      : manhattan ? pField
        || numbers.find(field => field !== xField && field !== chromosomeField) || numbers[0] || fields[0]
      : (current.type === 'scatter' || current.type === 'line')
        ? numbers.find(field => field !== xField) || numbers[0] || fields[0]
        : numbers[0] || fields[0];
    const groupField = c.groupField === '' || fields.includes(c.groupField) ? c.groupField
      : ['scatter', 'bar', 'line'].includes(current.type)
        ? categories.find(field => field !== xField) || '' : '';
    if(isComposition(current.type)) {
      const mapField=(existing:string,pattern:RegExp,fallback:string)=>fields.includes(existing)?existing:fields.find(field=>pattern.test(field))||fallback;
      const categoryField=mapField(c.categoryField,/^(category|cell.?type|taxon|type|分类|细胞类型)$/i,categories[0]||fields[0]);
      const parentField=mapField(c.parentField,/^(parent|level.?1|父分类)$/i,categories.find(field=>field!==categoryField)||fields[0]);
      const sampleField=mapField(c.sampleField,/^(sample|sample.?id|样本)$/i,categories.find(field=>field!==categoryField)||fields[0]);
      const matrixRowField=mapField(c.matrixRowField,/^(condition|row|group|行|条件)$/i,categories.find(field=>field!==categoryField&&field!==sampleField)||fields[0]);
      const matrixColumnField=mapField(c.matrixColumnField,/^(column|sample|列|样本)$/i,sampleField);
      const valueField=mapField(c.valueField,/^(value|count|abundance|数值|丰度)$/i,numbers[0]||fields[0]);
      set({data,dataName,config:{...c,categoryField,parentField,sampleField,matrixRowField,matrixColumnField,valueField,splitCategory:data.some(row=>String(row[parentField])===c.splitCategory)?c.splitCategory:''},revision:current.revision+1});
      return;
    }
    set({ data, dataName, config: {
      ...c, xField, yField, groupField, chromosomeField,
      barSecondField:fields.includes(c.barSecondField)?c.barSecondField:numbers.find(k=>k!==yField)||yField,
      barCohortField:fields.includes(c.barCohortField)?c.barCohortField:categories.find(k=>k!==xField&&k!==groupField)||categories[0]||'',
      errorLowField:fields.includes(c.errorLowField)?c.errorLowField:numbers.find(k=>/low|lower|下界/i.test(k))||numbers[0]||'',
      errorHighField:fields.includes(c.errorHighField)?c.errorHighField:numbers.find(k=>/high|upper|上界/i.test(k))||numbers[numbers.length-1]||'',
      barOverlayField:fields.includes(c.barOverlayField)?c.barOverlayField:numbers.find(k=>k!==yField)||yField,
      zField:fields.includes(c.zField)?c.zField:numbers.find(k=>k!==xField&&k!==yField)||numbers[0]||'',
      colorField:fields.includes(c.colorField)?c.colorField:numbers.find(k=>k!==xField&&k!==yField)||numbers[0]||'',
      pairField:fields.includes(c.pairField)?c.pairField:categories.find(k=>k!==xField&&k!==groupField)||categories[0]||'',
      violinGroupField:fields.includes(c.violinGroupField)?c.violinGroupField:'',
      facetField:fields.includes(c.facetField)?c.facetField:'',
      annotationField:fields.includes(c.annotationField)?c.annotationField:'',
      annotationsEnabled:c.annotationsEnabled&&fields.includes(c.annotationField),
      sizeField: numbers.includes(c.sizeField) ? c.sizeField : numbers[0] || '',
      scatterSizeEnabled: c.scatterSizeEnabled && numbers.length > 0,
      valueField: fields.includes(c.valueField) ? c.valueField : numbers.find(field => field !== xField && field !== yField) || numbers[0] || fields[0],
      labelField: fields.includes(c.labelField) ? c.labelField : (manhattan ? categories.find(field => field !== chromosomeField) : categories[0]) || fields[0],
      tooltipFields: current.type === 'bar' ? [...new Set([xField, yField, groupField].filter(Boolean))] : fields.slice(0, 4),
    }, revision: current.revision + 1 });
  },
  reset:()=>{const s=get();set({data:entryData(s.type,s.entryId)??mockData(s.type),config:entryConfig(s.type,s.entryId),dataName:'Mock data',revision:s.revision+1});}
}));
