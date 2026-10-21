import type { Config, Row } from './model';
export type BioVariant='none'|'km'|'cutoff'|'circos-gene'|'fusion'|'ligand'|'ld'|'density'|'chromosome'|'ideogram'|'segments'|'centromere'|'forest'|'roc'|'pr'|'funnel'|'qq'|'regional'|'accumulation'|'circos-tracks';
export interface BioConfig {
 bioVariant:BioVariant; bioTimeField:string; bioEventField:string; bioSubjectField:string; bioScoreField:string;
 bioConfidence:boolean; bioConfidenceLevel:'90'|'95'|'99'; bioCensor:boolean; bioRiskTable:boolean; bioLogRank:boolean;
 bioTimeUnit:string; bioCutMode:'manual'|'median'|'auto'; bioCutValue:number; bioMinProp:number;
 bioLengthField:string; bioEndField:string; bioTargetChrField:string; bioTargetPosField:string; bioTargetLengthField:string;
 bioCenterStartField:string; bioCenterEndField:string; bioSourceField:string; bioTargetField:string;
 bioLigandField:string; bioReceptorField:string; bioWeightField:string; bioWeightEnabled:boolean; bioMinWeight:number;
 bioLDField:string; bioSnpAField:string; bioSnpBField:string; bioLDChromosome:string;
 bioWindowSize:number; bioDensityUnit:'count'|'perMb'; bioOrientation:'horizontal'|'vertical';
 bioAssemblyLabel:string; bioGap:number; bioInnerRadius:number; bioArrow:boolean; bioLinks:boolean;
 bioLinkWidth:number; bioLabelLimit:number; bioFontSize:number; bioTrackSize:number; bioValueLabels:boolean;
 bioLowerField:string; bioUpperField:string; bioReferenceValue:number; bioShowReference:boolean; bioResultSort:'input'|'ascending'|'descending';
 bioRegionChromosome:string; bioRegionEnabled:boolean; bioRegionStart:number; bioRegionEnd:number; bioLDColor:boolean;
 bioTrackOneField:string; bioTrackTwoField:string; bioSharedTrackScale:boolean; bioBandOpacity:number;
}
export const bioDefaults:BioConfig={
 bioVariant:'none',bioTimeField:'time',bioEventField:'event',bioSubjectField:'subject',bioScoreField:'score',bioConfidence:true,bioConfidenceLevel:'95',bioCensor:true,bioRiskTable:false,bioLogRank:false,bioTimeUnit:'Days',bioCutMode:'auto',bioCutValue:5,bioMinProp:.2,
 bioLengthField:'length',bioEndField:'end',bioTargetChrField:'targetChr',bioTargetPosField:'targetPos',bioTargetLengthField:'targetLength',bioCenterStartField:'centStart',bioCenterEndField:'centEnd',
 bioSourceField:'source',bioTargetField:'target',bioLigandField:'ligand',bioReceptorField:'receptor',bioWeightField:'weight',bioWeightEnabled:true,bioMinWeight:0,
 bioLDField:'r2',bioSnpAField:'snpA',bioSnpBField:'snpB',bioLDChromosome:'',bioWindowSize:10000000,bioDensityUnit:'count',bioOrientation:'horizontal',bioAssemblyLabel:'',bioGap:.035,bioInnerRadius:.76,bioArrow:true,bioLinks:true,bioLinkWidth:1.5,bioLabelLimit:18,bioFontSize:11,bioTrackSize:10,bioValueLabels:false,
 bioLowerField:'lower',bioUpperField:'upper',bioReferenceValue:1,bioShowReference:true,bioResultSort:'input',
 bioRegionChromosome:'',bioRegionEnabled:false,bioRegionStart:52000000,bioRegionEnd:53000000,bioLDColor:true,
 bioTrackOneField:'track1',bioTrackTwoField:'track2',bioSharedTrackScale:false,bioBandOpacity:.18,
};
export const isSurvival=(mode:BioVariant)=>mode==='km'||mode==='cutoff';
export const isCircos=(mode:BioVariant)=>['circos-gene','fusion','ligand','circos-tracks'].includes(mode);
export const isResearchPlot=(mode:BioVariant)=>['forest','roc','pr','funnel'].includes(mode);
export const isAssociationPlot=(mode:BioVariant)=>mode==='qq'||mode==='regional';
export function bioRows(data:Row[],c:Config):Row[]{
 const num=(v:unknown)=>v!=null&&String(v).trim()!==''&&Number.isFinite(Number(v));
 const name=(v:unknown)=>v!=null&&String(v).trim()!=='';
 const mode=c.bioVariant;
 if(mode==='accumulation')return data.filter(d=>num(d[c.xField])&&Number.isInteger(Number(d[c.xField]))&&Number(d[c.xField])>=1&&num(d[c.yField])&&Number(d[c.yField])>=0);
 if(isAssociationPlot(mode)){
  const valid=data.filter(d=>num(d[c.yField])&&Number(d[c.yField])>0&&Number(d[c.yField])<=1&&(mode==='qq'||name(d[c.chromosomeField])&&num(d[c.xField])&&Number(d[c.xField])>=0));
  if(mode==='qq')return valid;
  if(c.bioRegionEnabled&&c.bioRegionEnd<=c.bioRegionStart)return [];
  const chromosome=c.bioRegionChromosome||String(valid[0]?.[c.chromosomeField]??'');
  return valid.filter(d=>String(d[c.chromosomeField])===chromosome&&(!c.bioRegionEnabled||Number(d[c.xField])>=c.bioRegionStart&&Number(d[c.xField])<=c.bioRegionEnd));
 }
 if(isResearchPlot(mode))return data.filter(d=>{
  if(!num(d[c.xField])||!num(d[c.yField])&&mode!=='forest')return false;
  const x=Number(d[c.xField]),y=Number(d[c.yField]);
  if(mode==='roc'||mode==='pr')return x>=0&&x<=1&&y>=0&&y<=1;
  if(mode==='funnel')return y>0&&(c.xScale!=='log'||x>0);
  return name(d[c.labelField])&&num(d[c.bioLowerField])&&num(d[c.bioUpperField])&&Number(d[c.bioLowerField])<=x&&x<=Number(d[c.bioUpperField])&&(c.xScale!=='log'||Number(d[c.bioLowerField])>0);
 });
 if(isSurvival(mode)){
  const ids=new Map<string,number>();if(c.bioSubjectField)data.forEach(d=>{const id=String(d[c.bioSubjectField]??'');ids.set(id,(ids.get(id)||0)+1);});
  return data.filter(d=>num(d[c.bioTimeField])&&+d[c.bioTimeField]!>=0&&num(d[c.bioEventField])&&[0,1].includes(+d[c.bioEventField]!)&&(!c.bioSubjectField||name(d[c.bioSubjectField])&&ids.get(String(d[c.bioSubjectField]))===1)&&(mode==='cutoff'?num(d[c.bioScoreField]):!c.groupField||name(d[c.groupField])));
 }
 if(mode==='ligand')return data.filter(d=>name(d[c.bioSourceField])&&name(d[c.bioTargetField])&&num(d[c.bioWeightField])&&+d[c.bioWeightField]!>0&&+d[c.bioWeightField]!>=c.bioMinWeight);
 if(mode==='ld'){
  const valid=data.filter(d=>name(d[c.chromosomeField])&&name(d[c.bioSnpAField])&&name(d[c.bioSnpBField])&&num(d[c.xField])&&+d[c.xField]!>=0&&num(d[c.bioTargetPosField])&&+d[c.bioTargetPosField]!>=0&&num(d[c.bioLDField])&&+d[c.bioLDField]!>=0&&+d[c.bioLDField]!<=1);
  const selected=valid.filter(d=>String(d[c.chromosomeField])===(c.bioLDChromosome||String(valid[0]?.[c.chromosomeField]??'')));
  const positions=new Map<string,Set<number>>();selected.forEach(d=>[[d[c.bioSnpAField],d[c.xField]],[d[c.bioSnpBField],d[c.bioTargetPosField]]].forEach(([id,pos])=>{const key=String(id);if(!positions.has(key))positions.set(key,new Set());positions.get(key)!.add(Number(pos));}));
  return selected.filter(d=>positions.get(String(d[c.bioSnpAField]))?.size===1&&positions.get(String(d[c.bioSnpBField]))?.size===1);
 }
 const refs=new Map<string,Set<number>>();
 const add=(chr:unknown,len:unknown)=>{if(!name(chr)||!num(len)||+len!<=0)return;const key=String(chr);if(!refs.has(key))refs.set(key,new Set());refs.get(key)!.add(+len!);};
 data.forEach(d=>{add(d[c.chromosomeField],d[c.bioLengthField]);if(mode==='fusion')add(d[c.bioTargetChrField],d[c.bioTargetLengthField]);});
 const validRef=(chr:unknown,len:unknown,pos:unknown)=>name(chr)&&num(len)&&+len!>0&&refs.get(String(chr))?.size===1&&num(pos)&&+pos!>=0&&+pos!<=+len!;
 const centers=new Map<string,Set<string>>();
 if(mode==='centromere')data.forEach(d=>{const key=String(d[c.chromosomeField]);if(!centers.has(key))centers.set(key,new Set());centers.get(key)!.add(String(d[c.bioCenterStartField])+':'+String(d[c.bioCenterEndField]));});
 return data.filter(d=>validRef(d[c.chromosomeField],d[c.bioLengthField],d[c.xField])
  &&(!['circos-gene','ideogram','segments','centromere','circos-tracks'].includes(mode)||num(d[c.bioEndField])&&+d[c.bioEndField]!>+d[c.xField]!&&+d[c.bioEndField]!<=+d[c.bioLengthField]!)
  &&(mode!=='circos-tracks'||num(d[c.bioTrackOneField])&&Number(d[c.bioTrackOneField])>=0&&num(d[c.bioTrackTwoField])&&Number(d[c.bioTrackTwoField])>=0)
  &&(mode!=='fusion'||validRef(d[c.bioTargetChrField],d[c.bioTargetLengthField],d[c.bioTargetPosField])&&(!c.bioWeightEnabled||num(d[c.bioWeightField])&&+d[c.bioWeightField]!>0&&+d[c.bioWeightField]!>=c.bioMinWeight))
  &&(mode!=='centromere'||centers.get(String(d[c.chromosomeField]))?.size===1&&num(d[c.bioCenterStartField])&&num(d[c.bioCenterEndField])&&+d[c.bioCenterStartField]!>=0&&+d[c.bioCenterEndField]!>+d[c.bioCenterStartField]!&&+d[c.bioCenterEndField]!<=+d[c.bioLengthField]!));
}
export function bioMock(mode:BioVariant):Row[]{
 if(mode==='accumulation')return ['Forest','Grassland','Wetland'].flatMap((group,j)=>Array.from({length:30},(_,i)=>{const samples=i+1;const richness=+( (85+j*22)*(1-Math.exp(-samples/(6+j*2))) ).toFixed(2);const spread=+(3+6*Math.exp(-samples/8)).toFixed(2);return {samples,richness,lower:+Math.max(0,richness-spread).toFixed(2),upper:+(richness+spread).toFixed(2),group};}));
 if(mode==='circos-tracks')return [120000000,100000000,85000000,72000000,60000000,48000000].flatMap((length,j)=>Array.from({length:12},(_,i)=>({chromosome:String(j+1),length,position:Math.floor(i*length/12),end:Math.floor((i+1)*length/12),track1:5+(i*17+j*11)%70,track2:2+(i*9+j*7)%45})));
 if(mode==='qq')return ['Discovery','Replication'].flatMap((group,j)=>Array.from({length:100},(_,i)=>({snp:`rs${10000+j*100+i}`,pvalue:+Math.pow((i+.5)/100,i<8?(j?1.55:2.25):1).toPrecision(7),group})));
 if(mode==='regional')return ['1','2'].flatMap((chromosome,j)=>Array.from({length:90},(_,i)=>{const position=52000000+i*11000;const distance=Math.abs(i-(j?35:47));const strength=1.1+9*Math.exp(-distance*distance/120)+(i*13%17)/20;return {chromosome,position,pvalue:+Math.pow(10,-strength).toPrecision(5),snp:`rs${20000+j*100+i}`,r2:i%13===0?null:+Math.exp(-distance/15).toFixed(3)};}));
 if(mode==='forest')return [
  {study:'Cohort A',estimate:.72,lower:.51,upper:1.02,group:'Discovery'},
  {study:'Cohort B',estimate:.84,lower:.67,upper:1.05,group:'Discovery'},
  {study:'Cohort C',estimate:1.25,lower:1.01,upper:1.55,group:'Discovery'},
  {study:'Cohort D',estimate:.63,lower:.42,upper:.94,group:'Validation'},
  {study:'Cohort E',estimate:1.08,lower:.81,upper:1.44,group:'Validation'},
  {study:'Cohort F',estimate:.91,lower:.74,upper:1.12,group:'Validation'},
 ];
 if(mode==='roc')return ['Model A','Model B'].flatMap((model,j)=>[0,.025,.06,.12,.2,.32,.48,.65,.82,1].map((fpr,i)=>({model,fpr,tpr:[0,.28,.45,.6,.73,.82,.9,.95,.98,1][i]-(i>0&&i<9?j*.12:0)})));
 if(mode==='pr')return ['Model A','Model B'].flatMap((model,j)=>[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1].map((recall,i)=>({model,recall,precision:+Math.max(.24,[1,.97,.94,.9,.85,.79,.72,.64,.54,.4,.24][i]-(i>0&&i<10?j*.09:0)).toFixed(2)})));
 if(mode==='funnel')return Array.from({length:24},(_,i)=>{const se=+(.04+(i%8)*.035).toFixed(3);return {study:`Study ${String(i+1).padStart(2,'0')}`,estimate:+(.18+((i*7%13)-6)*se*.3).toFixed(3),se,group:i%2?'Cohort':'Trial'};});
 if(isSurvival(mode))return Array.from({length:64},(_,i)=>{const score=+(1+(i*17%61)/7).toFixed(2);return {subject:'P'+String(i+1).padStart(3,'0'),time:Math.round(100+(i*137%1100)+(score<5?500:0)),event:i%5===0?0:1,group:i%2?'Treatment':'Control',score};});
 if(mode==='ligand')return Array.from({length:12},(_,i)=>({source:['T cell','Macrophage','Stromal','Epithelial'][i%4],target:['Macrophage','Stromal','T cell','Epithelial'][(i*3+1)%4],ligand:['CXCL12','TGFB1','IL6'][i%3],receptor:['CXCR4','TGFBR1','IL6R'][i%3],weight:1+(i*7%13)}));
 if(mode==='ld')return Array.from({length:12},(_,i)=>Array.from({length:12-i},(_,j)=>{const k=i+j;return {chromosome:'1',snpA:'rs'+(101+i),snpB:'rs'+(101+k),position:100000+i*18000+(i%3)*3200,targetPos:100000+k*18000+(k%3)*3200,r2:+Math.exp(-Math.abs(k-i)*.25).toFixed(3)};})).flat();
 const lengths=[120000000,100000000,85000000,72000000,60000000,48000000];
 return Array.from({length:mode==='density'?144:48},(_,i)=>{const chr=i%6,len=lengths[chr],position=Math.round(len*(.03+((i*29%91)/100))),target=(chr+2+i%3)%6;return {chromosome:String(chr+1),length:len,position,end:Math.min(len,position+Math.round(len*.035)),gene:['TP53','EGFR','BRCA1','MYC','KRAS','STAT3'][i%6]+'_'+(1+Math.floor(i/6)),group:i%2?'A':'B',centStart:len*.42,centEnd:len*.47,targetChr:String(target+1),targetLength:lengths[target],targetPos:Math.round(lengths[target]*(.05+(i*13%85)/100)),weight:1+i%9};});
}
