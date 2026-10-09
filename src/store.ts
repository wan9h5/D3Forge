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
    const current=get(); const c=current.config;
    set({data,dataName,config:{...c,xField:fields.includes(c.xField)?c.xField:current.type==='box'?(categories[0]||fields[0]):(numbers[0]||fields[0]),yField:fields.includes(c.yField)?c.yField:(numbers[current.type==='scatter'?1:0]||numbers[0]||fields[0]),groupField:fields.includes(c.groupField)?c.groupField:(current.type==='scatter'?categories[1]||'':''),labelField:categories[0]||fields[0],tooltipFields:fields.slice(0,4)},revision:current.revision+1});
  },
  reset:()=>{const s=get();set({data:mockData(s.type),config:defaults(s.type),dataName:'Mock data',revision:s.revision+1});}
}));
