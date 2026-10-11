import type { Config, Row } from './model';
export type ScatterVariant = 'basic'|'joint'|'regression'|'fold'|'fit'|'marginal'|'bubble'|'rank'|'density'|'motif'|'paired'|'color'|'gsea'|'correlation'|'3d';
export interface ScatterConfig {
  scatterVariant: ScatterVariant; zAxis:boolean; scatterPalette:'viridis'|'turbo'|'blues';
  fitEnabled:boolean; fitModel:'linear'|'quadratic'; fitByGroup:boolean; confidenceBand:boolean; correlationMethod:'pearson'|'spearman';
  marginalType:'histogram'|'density'|'box'; densityBandwidth:number; densityLevels:number;
  foldRatio:number; foldLog:boolean; pairField:string; zField:string; colorField:string; continuousColor:boolean;
  rankDescending:boolean; rotationX:number; rotationY:number; perspective:number; rotationEnabled:boolean;
}
export const scatterDefaults:ScatterConfig={scatterVariant:'basic',zAxis:true,scatterPalette:'viridis',fitEnabled:false,fitModel:'linear',fitByGroup:false,confidenceBand:false,correlationMethod:'pearson',marginalType:'histogram',densityBandwidth:22,densityLevels:12,foldRatio:2,foldLog:false,pairField:'subject',zField:'z',colorField:'score',continuousColor:false,rankDescending:false,rotationX:-20,rotationY:30,perspective:3,rotationEnabled:true};
export function scatterMock(variant:ScatterVariant):Row[]{
  if(variant==='bubble')return ['Pathway A','Pathway B','Pathway C','Pathway D','Pathway E'].flatMap((pathway,j)=>['Control','Treatment','Recovery'].map((condition,i)=>({pathway,condition,count:4+(i*7+j*3)%24,significance:+(1+i*.8+j*.6).toFixed(2)})));
  if(variant==='paired')return ['A','B','C'].flatMap((cohort,g)=>Array.from({length:12},(_,i)=>({subject:`${cohort}${Math.floor(i/2)+1}`,cohort,condition:i%2?'After':'Before',value:+(4+g*3+Math.floor(i/2)*.8+(i%2)*(2+Math.sin(Math.floor(i/2)))).toFixed(2)})));
  if(variant==='gsea')return ['Cell cycle','DNA repair','Apoptosis','Immune response','Metabolism','Translation'].map((pathway,i)=>({pathway,NES:+(i<3?1.4+i*.3:-1.2-(i-3)*.4).toFixed(2),FDR:[.002,.012,.04,.07,.025,.006][i]}));
  return Array.from({length:36},(_,i)=>{
    const group=['Control','Treatment','Recovery'][i%3],x=+(2+i*.65+Math.sin(i*1.7)).toFixed(3);
    const y=+(x*.8+(i%3)*3+Math.cos(i*2.1)*3).toFixed(3);
    const row:Row = {sample:`S${String(i+1).padStart(2,'0')}`,group,x,y,z:+(4+Math.sin(i*.7)*6+i*.3).toFixed(3),score:+(1+(i*7%19)/3).toFixed(3),count:3+(i*11%22),expression:+(Math.sin(i*1.1)*3).toFixed(3),methylation:+(Math.sin(i*1.1)*1.8+Math.cos(i)*1.4).toFixed(3),motif:`Motif ${i+1}`,enrichment:+(1+(i%9)*.35).toFixed(3),logP:+(1+(i*13%31)*.4).toFixed(3)};
    const fields=variant==='joint'?['sample','group','expression','methylation','count','score']:variant==='motif'?['motif','logP','enrichment','count','score']:['sample','group','x','y',...(variant==='3d'?['z']:[]),'count','score'];
    return Object.fromEntries(fields.map(field=>[field,row[field]]));
  });
}
export function scatterRows(data:Row[],c:Config):Row[]{
  const num=(v:unknown)=>v!=null&&String(v).trim()!==''&&Number.isFinite(Number(v));
  const cat=(v:unknown)=>v!=null&&String(v).trim()!=='';
  const category=['bubble','paired','gsea'].includes(c.scatterVariant);
  return data.filter(d=>(c.scatterVariant==='rank'||(category?cat(d[c.xField]):num(d[c.xField])))&&(c.scatterVariant==='bubble'?cat(d[c.yField])&&num(d[c.sizeField])&&+d[c.sizeField]!>=0&&num(d[c.colorField]):num(d[c.yField]))&&(c.scatterVariant!=='fold'||c.foldLog||+d[c.xField]!>0&&+d[c.yField]!>0)&&(c.scatterVariant!=='3d'||num(d[c.zField]))&&(c.scatterVariant!=='paired'||cat(d[c.pairField]))&&(c.scatterVariant!=='gsea'||num(d[c.colorField])&&+d[c.colorField]!>=0&&+d[c.colorField]!<=1)&&(!c.continuousColor||num(d[c.colorField]))&&(category||c.scatterVariant==='rank'||c.xScale!=='log'||+d[c.xField]!>0)&&(category||c.yScale!=='log'||+d[c.yField]!>0));
}
