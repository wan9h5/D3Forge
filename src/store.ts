import { create } from 'zustand';
import { defaults, mockData, type ChartType, type Config, type Row } from './model';
interface State { type: ChartType; config: Config; data: Row[]; dataName: string; revision: number; setConfig: (patch: Partial<Config>)=>void; selectChart:(type:ChartType)=>void; loadData:(rows:Row[],name:string)=>void; reset:()=>void; }
export const useBuilder = create<State>((set,get)=>({
  type:'scatter',config:defaults('scatter'),data:mockData('scatter'),dataName:'Mock data',revision:0,
  setConfig:patch=>set(s=>({config:{...s.config,...patch},revision:s.revision+1})),
  selectChart:type=>set(s=>({type,config:defaults(type),data:mockData(type),dataName:'Mock data',revision:s.revision+1})),
  loadData:(data,dataName)=> {
    const fields=Object.keys(data[0]);
    const numbers=fields.filter(k=>data.some(d=>d[k]!==null && String(d[k]).trim()!=='' && Number.isFinite(Number(d[k]))));
    const categories=fields.filter(k=>!numbers.includes(k));
    const current = get();
    const c = current.config;
    const categoricalX = ['box', 'bar', 'violin'].includes(current.type);
    const manhattan = current.type === 'manhattan';
    const chromosomeField = fields.includes(c.chromosomeField) ? c.chromosomeField
      : fields.find(field => /^(chr|chrom|chromosome)$/i.test(field))
        || categories.find(field => field !== c.labelField) || fields[0];
    const xField = fields.includes(c.xField) ? c.xField
      : categoricalX ? categories[0] || fields[0] : (manhattan ? numbers.find(field => field !== chromosomeField) : numbers[0]) || fields[0];
    const yField = fields.includes(c.yField) ? c.yField
      : manhattan ? fields.find(field => /^(p|pvalue|p_value|pval|p\.value)$/i.test(field))
        || numbers.find(field => field !== xField && field !== chromosomeField) || numbers[0] || fields[0]
      : (current.type === 'scatter' || current.type === 'line')
        ? numbers.find(field => field !== xField) || numbers[0] || fields[0]
        : numbers[0] || fields[0];
    const groupField = c.groupField === '' || fields.includes(c.groupField) ? c.groupField
      : ['scatter', 'bar', 'line'].includes(current.type)
        ? categories.find(field => field !== xField) || '' : '';
    set({ data, dataName, config: {
      ...c, xField, yField, groupField, chromosomeField,
      labelField: fields.includes(c.labelField) ? c.labelField : (manhattan ? categories.find(field => field !== chromosomeField) : categories[0]) || fields[0],
      tooltipFields: current.type === 'bar' ? [...new Set([xField, yField, groupField].filter(Boolean))] : fields.slice(0, 4),
    }, revision: current.revision + 1 });
  },
  reset:()=>{const s=get();set({data:mockData(s.type),config:defaults(s.type),dataName:'Mock data',revision:s.revision+1});}
}));
