import type { Config, Row } from './model';
export type BioVariant='none'|'km'|'cutoff'|'circos-gene'|'fusion'|'ligand'|'ld'|'density'|'chromosome'|'ideogram'|'segments'|'centromere';
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
}
export const bioDefaults:BioConfig={
 bioVariant:'none',bioTimeField:'time',bioEventField:'event',bioSubjectField:'subject',bioScoreField:'score',bioConfidence:true,bioConfidenceLevel:'95',bioCensor:true,bioRiskTable:false,bioLogRank:false,bioTimeUnit:'Days',bioCutMode:'auto',bioCutValue:5,bioMinProp:.2,
 bioLengthField:'length',bioEndField:'end',bioTargetChrField:'targetChr',bioTargetPosField:'targetPos',bioTargetLengthField:'targetLength',bioCenterStartField:'centStart',bioCenterEndField:'centEnd',
 bioSourceField:'source',bioTargetField:'target',bioLigandField:'ligand',bioReceptorField:'receptor',bioWeightField:'weight',bioWeightEnabled:true,bioMinWeight:0,
 bioLDField:'r2',bioSnpAField:'snpA',bioSnpBField:'snpB',bioLDChromosome:'',bioWindowSize:10000000,bioDensityUnit:'count',bioOrientation:'horizontal',bioAssemblyLabel:'',bioGap:.035,bioInnerRadius:.76,bioArrow:true,bioLinks:true,bioLinkWidth:1.5,bioLabelLimit:18,bioFontSize:11,bioTrackSize:10,bioValueLabels:false,
};
export const isSurvival=(mode:BioVariant)=>mode==='km'||mode==='cutoff';
export const isCircos=(mode:BioVariant)=>['circos-gene','fusion','ligand'].includes(mode);
export function bioRows(data:Row[],c:Config):Row[]{
 const num=(v:unknown)=>v!=null&&String(v).trim()!==''&&Number.isFinite(Number(v));
 const name=(v:unknown)=>v!=null&&String(v).trim()!=='';
 const mode=c.bioVariant;
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
  &&(!['circos-gene','ideogram','segments','centromere'].includes(mode)||num(d[c.bioEndField])&&+d[c.bioEndField]!>+d[c.xField]!&&+d[c.bioEndField]!<=+d[c.bioLengthField]!)
  &&(mode!=='fusion'||validRef(d[c.bioTargetChrField],d[c.bioTargetLengthField],d[c.bioTargetPosField])&&(!c.bioWeightEnabled||num(d[c.bioWeightField])&&+d[c.bioWeightField]!>0&&+d[c.bioWeightField]!>=c.bioMinWeight))
  &&(mode!=='centromere'||centers.get(String(d[c.chromosomeField]))?.size===1&&num(d[c.bioCenterStartField])&&num(d[c.bioCenterEndField])&&+d[c.bioCenterStartField]!>=0&&+d[c.bioCenterEndField]!>+d[c.bioCenterStartField]!&&+d[c.bioCenterEndField]!<=+d[c.bioLengthField]!));
}
export function bioMock(mode:BioVariant):Row[]{
 if(isSurvival(mode))return Array.from({length:64},(_,i)=>{const score=+(1+(i*17%61)/7).toFixed(2);return {subject:'P'+String(i+1).padStart(3,'0'),time:Math.round(100+(i*137%1100)+(score<5?500:0)),event:i%5===0?0:1,group:i%2?'Treatment':'Control',score};});
 if(mode==='ligand')return Array.from({length:12},(_,i)=>({source:['T cell','Macrophage','Stromal','Epithelial'][i%4],target:['Macrophage','Stromal','T cell','Epithelial'][(i*3+1)%4],ligand:['CXCL12','TGFB1','IL6'][i%3],receptor:['CXCR4','TGFBR1','IL6R'][i%3],weight:1+(i*7%13)}));
 if(mode==='ld')return Array.from({length:12},(_,i)=>Array.from({length:12-i},(_,j)=>{const k=i+j;return {chromosome:'1',snpA:'rs'+(101+i),snpB:'rs'+(101+k),position:100000+i*18000+(i%3)*3200,targetPos:100000+k*18000+(k%3)*3200,r2:+Math.exp(-Math.abs(k-i)*.25).toFixed(3)};})).flat();
 const lengths=[120000000,100000000,85000000,72000000,60000000,48000000];
 return Array.from({length:mode==='density'?144:48},(_,i)=>{const chr=i%6,len=lengths[chr],position=Math.round(len*(.03+((i*29%91)/100))),target=(chr+2+i%3)%6;return {chromosome:String(chr+1),length:len,position,end:Math.min(len,position+Math.round(len*.035)),gene:['TP53','EGFR','BRCA1','MYC','KRAS','STAT3'][i%6]+'_'+(1+Math.floor(i/6)),group:i%2?'A':'B',centStart:len*.42,centEnd:len*.47,targetChr:String(target+1),targetLength:lengths[target],targetPos:Math.round(lengths[target]*(.05+(i*13%85)/100)),weight:1+i%9};});
}
