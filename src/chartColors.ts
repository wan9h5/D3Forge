import { schemeTableau10, schemeSet2, schemeDark2, schemePaired, schemeCategory10, interpolateViridis, interpolateCividis, interpolateBlues, interpolateMagma, interpolateRdBu, interpolateBrBG, interpolatePiYG } from 'd3';
export const categoricalSchemes:Record<string,readonly string[]>={tableau10:schemeTableau10,set2:schemeSet2,dark2:schemeDark2,paired:schemePaired,category10:schemeCategory10};
export const interpolators={viridis:interpolateViridis,cividis:interpolateCividis,blues:interpolateBlues,magma:interpolateMagma,rdBu:interpolateRdBu,brBG:interpolateBrBG,piYG:interpolatePiYG};
export const interpolatorNames:Record<string,string>={viridis:'interpolateViridis',cividis:'interpolateCividis',blues:'interpolateBlues',magma:'interpolateMagma',rdBu:'interpolateRdBu',brBG:'interpolateBrBG',piYG:'interpolatePiYG'};
export const isDivergingScheme=(scheme:string)=>['rdBu','brBG','piYG'].includes(scheme);
export function schemePreview(scheme:string):readonly string[]{
 if(categoricalSchemes[scheme])return categoricalSchemes[scheme];
 const fn=interpolators[scheme as keyof typeof interpolators];return fn?Array.from({length:9},(_,i)=>fn(i/8)):[];
}
// Chart colors are independent of the interface theme. Generators embed these
// arrays directly in exported source, so no app dependency is needed at runtime.
export const vividPalette = ['#3B6FF5', '#F59E0B', '#06B6D4', '#8B5CF6', '#10B981', '#F06464'];
export function categoricalColors(primary:string,secondary?:string,scheme?:string):string[] {
  if(scheme&&categoricalSchemes[scheme])return [...categoricalSchemes[scheme]];
  const selected=secondary?[primary,secondary]:[primary];
  return [...selected,...vividPalette.filter(color=>!selected.some(value=>value.toLowerCase()===color.toLowerCase()))];
}

export function continuousConstructor(scheme:string,diverging=false){
 const name=interpolatorNames[scheme];
 return name?`d3.${diverging?'scaleDiverging':'scaleSequential'}(d3.${name})`:'d3.scaleLinear()';
}
export function continuousRange(scheme:string,colors:readonly string[]){
 return interpolatorNames[scheme]?'':`\n    .range(${JSON.stringify(colors)})`;
}
