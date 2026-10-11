import type { Config, Row } from './model';
export type BarVariant='basic'|'vertical'|'grouped'|'horizontal'|'stacked'|'hstacked'|'error'|'percent'|'butterfly'|'diverging'|'dot'|'polar'|'circos'|'3d'|'aggregate'|'extruded'|'triangle'|'broken'|'histfit'|'ice'|'pencil'|'stem'|'updown'|'dual-line'|'dual-bar'|'go'|'group-stack'|'polar-group'|'platform'|'gene';
export interface BarConfig {
 barVariant:BarVariant; barAggregate:'sum'|'mean'; barSort:'input'|'ascending'|'descending';
 errorMode:'sd'|'sem'|'ci95'|'bounds'; errorLowField:string; errorHighField:string; errorCaps:number; errorPoints:boolean;
 barLinks:boolean; dotUnit:number; dotColumns:number; radialInner:number; radialGap:number; radialAngle:number; radialArea:boolean;
 trackScale:'shared'|'independent'; trackGap:number; leftSeries:string; rightSeries:string;
 barDepth:number; breakLow:number; breakHigh:number; breakRatio:number; histogramFit:'none'|'normal'|'kde';
 barSecondField:string; barSecondAggregate:'sum'|'mean'|'min'|'max'; barCohortField:string; barRightTitle:string; barRightFormat:string; barRightTransform:'identity'|'neglog10'; barRightDomain:boolean; barRightMin:number; barRightMax:number; barLinkCurve:boolean; barLinkStyle:'band'|'boundary'; barGlyphRatio:number; barBackgroundValue:number; barBackgroundColor:string;
 barOverlay:boolean; barOverlayField:string;
}
export const barDefaults:BarConfig={barSecondField:'secondary',barSecondAggregate:'mean',barCohortField:'cohort',barRightTitle:'',barRightFormat:'',barRightTransform:'identity',barRightDomain:false,barRightMin:0,barRightMax:100,barLinkCurve:false,barLinkStyle:'band',barGlyphRatio:.18,barBackgroundValue:100,barBackgroundColor:'#e9edf3',barVariant:'basic',barAggregate:'sum',barSort:'input',errorMode:'sd',errorLowField:'lower',errorHighField:'upper',errorCaps:8,errorPoints:false,barLinks:false,dotUnit:5,dotColumns:3,radialInner:.25,radialGap:.08,radialAngle:360,radialArea:true,trackScale:'independent',trackGap:10,leftSeries:'Control',rightSeries:'Treatment',barDepth:12,breakLow:70,breakHigh:650,breakRatio:.4,histogramFit:'normal',barOverlay:false,barOverlayField:'trend'};
export function barMock(mode:BarVariant):Row[]{
 if(mode==='gene')return ['miR-1','miR-2','miR-3','miR-4','miR-5','miR-6'].map((category,i)=>({category,value:+((i<3?1:-1)*(.8+i*.4)).toFixed(2)}));
 if(mode==='group-stack')return ['S1','S2','S3'].flatMap((category,i)=>['Control','Treatment'].flatMap((cohort,j)=>['A','B','C'].map((series,k)=>({category,cohort,series,value:5+i*3+j*4+k*2,trend:45+i*12}))));
 if(mode==='go')return ['Cell cycle','Immune response','Transport','Metabolism','Signaling','Development'].map((category,i)=>({category,series:['BP','CC','MF'][Math.floor(i/2)],value:8+i*4,secondary:10**(-1.5-i*.5)}));
 if(mode==='histfit')return Array.from({length:48},(_,i)=>({sample:`S${i+1}`,value:+(4+Math.sin(i*1.3)*1.1+Math.cos(i*.7)*.8+Math.sin(i*.37)*.5).toFixed(3)}));
 if(mode==='error')return ['Control','4h','24h'].flatMap((category,g)=>Array.from({length:6},(_,i)=>({category,series:'Expression',sample:`${g}-${i}`,value:+(8+g*8+Math.sin(i*1.7+g)*3).toFixed(2),lower:6+g*8,upper:11+g*8})));
 return ['Mon','Tue','Wed','Thu','Fri','Sat'].flatMap((category,i)=>['Control','Treatment'].map((series,g)=>({category,series,value:mode==='broken'?(i===0?950+g*120:18+i*5+g*10):['diverging','gene'].includes(mode)?(g?1:-1)*(12+i*5):12+i*6+g*9+(i%2)*4,trend:22+i*7,secondary:+(.15+i*.12+g*.02).toFixed(2)})));
}
export function barRows(rows:Row[],c:Config):Row[]{
 const numeric=(v:unknown)=>v!=null&&String(v).trim()!==''&&Number.isFinite(Number(v));
 const positive=['percent','butterfly','dot','polar','circos','3d','aggregate','extruded','triangle','broken','ice','pencil','stem','updown','polar-group','platform','group-stack'].includes(c.barVariant);
 const dual=['dual-line','dual-bar','go'].includes(c.barVariant);
 return rows.filter(d=>(!dual||numeric(d[c.barSecondField])&&(c.barRightTransform!=='neglog10'||+d[c.barSecondField]!>0&&+d[c.barSecondField]!<=1))&&(c.barVariant!=='group-stack'||d[c.barCohortField]!=null&&String(d[c.barCohortField]).trim()!=='')&&(c.barVariant==='histfit'?numeric(d[c.xField]):d[c.xField]!=null&&String(d[c.xField]).trim()!==''&&numeric(d[c.yField])&&(!positive||+d[c.yField]!>=0)&&(c.barVariant!=='error'||c.errorMode!=='bounds'||numeric(d[c.errorLowField])&&numeric(d[c.errorHighField])&&+d[c.errorLowField]!<=+d[c.yField]!&&+d[c.errorHighField]!>=+d[c.yField]!)));
}
export const barStatistics=`
  // Invert the Student t CDF at 0.975 using the regularized incomplete beta function.
  const logGamma = z => {
    const coefficients = [676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
    z -= 1;
    let x = .99999999999980993;
    coefficients.forEach((c,i) => { x += c / (z + i + 1); });
    const t = z + 7.5;
    return .9189385332046727 + (z + .5) * Math.log(t) - t + Math.log(x);
  };
  const betaFraction = (a,b,x) => {
    const tiny = 1e-30;
    let c = 1, d = 1 - (a+b)*x/(a+1);
    if (Math.abs(d) < tiny) d = tiny;
    d = 1/d;
    let h = d;
    for (let m=1;m<=250;m++) {
      let aa = m*(b-m)*x/((a+2*m-1)*(a+2*m));
      d = 1+aa*d; if(Math.abs(d)<tiny)d=tiny;
      c = 1+aa/c; if(Math.abs(c)<tiny)c=tiny;
      d = 1/d; h *= d*c;
      aa = -(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));
      d = 1+aa*d; if(Math.abs(d)<tiny)d=tiny;
      c = 1+aa/c; if(Math.abs(c)<tiny)c=tiny;
      d = 1/d;
      const change=d*c; h*=change;
      if(Math.abs(change-1)<1e-13)break;
    }
    return h;
  };
  const betaCDF = (x,a,b) => {
    if(x<=0)return 0; if(x>=1)return 1;
    const factor=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));
    return x<(a+1)/(a+b+2) ? factor*betaFraction(a,b,x)/a : 1-factor*betaFraction(b,a,1-x)/b;
  };
  const criticalCache = new Map();
  const studentCritical = df => {
    if(criticalCache.has(df))return criticalCache.get(df);
    const cdf = t => 1-.5*betaCDF(df/(df+t*t),df/2,.5);
    let low=0,high=1;
    while(cdf(high)<.975)high*=2;
    for(let i=0;i<70;i++){const middle=(low+high)/2;if(cdf(middle)<.975)low=middle;else high=middle;}
    const result=(low+high)/2;criticalCache.set(df,result);return result;
  };
  const summarize = values => {
    const n = values.length, mean = d3.mean(values), sd = n > 1 ? d3.deviation(values) : null;
    const sem = sd == null ? null : sd / Math.sqrt(n);
    const df = n - 1;
    const t = n > 1 ? studentCritical(df) : null;
    return {n, mean, sd, sem, ci95: sem == null ? null : t * sem};
  };
`;
