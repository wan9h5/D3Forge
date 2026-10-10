import { create } from 'zustand';
import { defaults, mockData, type ChartType, type Config, type Row } from './model';
interface State { type: ChartType; config: Config; data: Row[]; dataName: string; revision: number; setConfig: (patch: Partial<Config>)=>void; selectChart:(type:ChartType)=>void; loadData:(rows:Row[],name:string)=>void; reset:()=>void; }
export const useBuilder = create<State>((set,get)=>({
  type:'scatter',config:defaults('scatter'),data:mockData('scatter'),dataName:'Mock data',revision:0,
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
  selectChart:type=>set(s=>({type,config:defaults(type),data:mockData(type),dataName:'Mock data',revision:s.revision+1})),
  loadData:(data,dataName)=> {
    const fields=Object.keys(data[0]);
    const numbers=fields.filter(k=>data.some(d=>d[k]!==null && String(d[k]).trim()!=='' && Number.isFinite(Number(d[k]))));
    const categories=fields.filter(k=>!numbers.includes(k));
    const current = get();
    const c = current.config;
    const heatmap = current.type === 'heatmap';
    const histogram = current.type === 'histogram';
    const categoricalX = ['box', 'bar', 'violin', 'heatmap'].includes(current.type);
    const manhattan = current.type === 'manhattan';
    const chromosomeField = fields.includes(c.chromosomeField) ? c.chromosomeField
      : fields.find(field => /^(chr|chrom|chromosome)$/i.test(field))
        || categories.find(field => field !== c.labelField) || fields[0];
    const pField = fields.find(field => /^(p|pvalue|p_value|pval|p\.value)$/i.test(field));
    const positionField = fields.find(field => /^(bp|pos|position|base_?pair|base_?position)$/i.test(field));
    const xField = fields.includes(c.xField) ? c.xField
      : categoricalX ? categories[0] || fields[0] : (manhattan ? positionField || numbers.find(field => field !== chromosomeField && field !== pField) : numbers[0]) || fields[0];
    const yField = fields.includes(c.yField) ? c.yField
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
    set({ data, dataName, config: {
      ...c, xField, yField, groupField, chromosomeField,
      sizeField: numbers.includes(c.sizeField) ? c.sizeField : numbers[0] || '',
      scatterSizeEnabled: c.scatterSizeEnabled && numbers.length > 0,
      valueField: fields.includes(c.valueField) ? c.valueField : numbers.find(field => field !== xField && field !== yField) || numbers[0] || fields[0],
      labelField: fields.includes(c.labelField) ? c.labelField : (manhattan ? categories.find(field => field !== chromosomeField) : categories[0]) || fields[0],
      tooltipFields: current.type === 'bar' ? [...new Set([xField, yField, groupField].filter(Boolean))] : fields.slice(0, 4),
    }, revision: current.revision + 1 });
  },
  reset:()=>{const s=get();set({data:mockData(s.type),config:defaults(s.type),dataName:'Mock data',revision:s.revision+1});}
}));
