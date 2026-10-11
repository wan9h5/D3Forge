import type { Config, Row } from './model';

export type VolcanoVariant = 'basic' | 'annotated' | 'gradient' | 'linked' | 'vip' | 'curve' | 'cluster' | 'four' | 'marker' | 'radial' | 'category' | 'interactive' | 'three';
export interface VolcanoConfig {
  volcanoVariant: VolcanoVariant;
  volcanoColor: 'status' | 'direction' | 'four' | 'gradient' | 'category';
  volcanoCategoryField: string; volcanoPanelField: string; volcanoVipField: string;
  volcanoPanelA: string; volcanoPanelB: string; volcanoSharedScale: boolean;
  volcanoLinks: boolean; volcanoLinkLimit: number;
  volcanoCurve: boolean; volcanoCurveStrength: number;
  volcanoGradientBy: 'significance' | 'field'; volcanoColorField: string;
  volcanoPalette: 'viridis' | 'turbo' | 'blues'; volcanoFourthColor: string;
  volcanoVip: boolean; volcanoMinRadius: number; volcanoMaxRadius: number;
  volcanoLabelGenes: string; volcanoLabelAvoid: boolean; volcanoLeaders: boolean;
  volcanoSearch: boolean; volcanoBrush: boolean; volcanoPin: boolean;
  volcanoGroupGap: number; volcanoInnerRadius: number;
}
export const volcanoDefaults:VolcanoConfig = {
  volcanoVariant:'basic',volcanoColor:'status',volcanoCategoryField:'category',volcanoPanelField:'cluster',volcanoVipField:'VIP',
  volcanoPanelA:'',volcanoPanelB:'',volcanoSharedScale:true,volcanoLinks:false,volcanoLinkLimit:12,
  volcanoCurve:false,volcanoCurveStrength:1,volcanoGradientBy:'significance',volcanoColorField:'score',volcanoPalette:'viridis',volcanoFourthColor:'#e7b747',
  volcanoVip:false,volcanoMinRadius:2,volcanoMaxRadius:9,volcanoLabelGenes:'',volcanoLabelAvoid:true,volcanoLeaders:true,
  volcanoSearch:false,volcanoBrush:false,volcanoPin:false,volcanoGroupGap:.18,volcanoInnerRadius:.55,
};
export const volcanoFaceted = (c:Pick<VolcanoConfig,'volcanoVariant'>) => ['linked','cluster','marker','radial'].includes(c.volcanoVariant);
export function volcanoRows(data:Row[],c:Config) {
  const numeric=(v:unknown)=>v!=null&&String(v).trim()!==''&&Number.isFinite(Number(v));
  return data.filter(d=>numeric(d[c.xField])&&numeric(d[c.yField])&&+d[c.yField]!>0&&+d[c.yField]!<=1
    &&(!volcanoFaceted(c)||(d[c.volcanoPanelField]!=null&&String(d[c.volcanoPanelField]).trim()!==''))
    &&(!c.volcanoVip||(numeric(d[c.volcanoVipField])&&+d[c.volcanoVipField]!>=0))
    &&(c.volcanoColor!=='gradient'||c.volcanoGradientBy!=='field'||numeric(d[c.volcanoColorField])));
}
export function volcanoMock(variant:VolcanoVariant):Row[] {
  const faceted=['linked','cluster','marker','radial'].includes(variant);
  const panels=variant==='linked'?['Treatment A','Treatment B']:['C1','C2','C3','C4'];
  return Array.from({length:faceted?panels.length*24:72},(_,i)=>{
    const j=faceted?i%24:i,panel=faceted?Math.floor(i/24):0;
    const log2FC=+(Math.sin(j*2.7+panel*.65)*3.3+Math.cos(j*.83)*.55).toFixed(3);
    const strength=Math.max(.02,Math.abs(log2FC)*1.15+(Math.sin(j*1.3+panel)+1)*1.5-(j%7===0?2:0));
    return {gene:['TP53','BRCA1','EGFR','MYC','KRAS','IL6','TNF','STAT3'][j]??`Gene_${String(j+1).padStart(3,'0')}`,
      log2FC,pvalue:+(10**-strength).toPrecision(6),VIP:+(.4+(Math.cos(j*.9)+1)*1.6).toFixed(3),
      category:['Immune response','Cell cycle','Metabolism'][j%3],cluster:faceted?panels[panel]:'C1',score:+(Math.sin(j*.6)*2).toFixed(3)};
  });
}
