import { continuousConstructor, continuousRange } from './chartColors';
import type { Config } from './model';
import type { BioTranslate } from './generateBio';
const js=JSON.stringify;
export function chromosomeSource(c:Config,translate:BioTranslate){
 const tr=(zh:string,en:string,ja:string)=>translate(en,zh,ja);
 const density=c.bioVariant==='density',vertical=c.bioOrientation==='vertical',points=c.bioVariant==='chromosome';
 return `
// ${tr('所有染色体共用参考长度尺度；区间采用半开坐标。','All chromosomes share a reference-length scale; intervals are half-open.','全染色体で参照長の尺度を共有し、区間は半開座標を使います。')}
const vertical=${vertical}, top=${density?45:70}+${c.legend&&!density?'Math.ceil(groups.length/4)*18':'0'}, bottom=height-65;
const span=vertical?bottom-top:width-150, cross=vertical?width-140:bottom-top;
const coordinate=d3.scaleLinear().domain([0,d3.max(chromosomes,d=>d.length)])
    .range([0,span]);
const lanes=d3.scaleBand().domain(chromosomeNames)
    .range([0,cross])
    .padding(.35);
const thickness=Math.max(2,Math.min(${c.bioTrackSize},lanes.bandwidth()));
const plot=svg.append("g")
  .attr("transform","translate(90,"+top+")");
const xy=(position,lane)=>vertical?[lane,position]:[position,lane];
${c.xAxis?`plot.append("g")
  .attr("transform",vertical?"translate(-20,0)":"translate(0,"+(cross+12)+")")
  .call((vertical?d3.axisLeft: d3.axisBottom)(coordinate).ticks(6).tickFormat(d=>d/1e6+" Mb"));`:''}
const outline=(length,center)=>{
 const end=coordinate(length),r=thickness/2;
 if(!center)return "M0,"+(-r)+"H"+end+"Q"+(end+r)+","+(-r)+" "+(end+r)+",0Q"+(end+r)+","+r+" "+end+","+r+"H0Q"+(-r)+","+r+" "+(-r)+",0Q"+(-r)+","+(-r)+" 0,"+(-r)+"Z";
 const a=coordinate(center[0]),b=coordinate(center[1]),m=(a+b)/2;
 return "M0,"+(-r)+"H"+a+"L"+m+","+(-r*.25)+"L"+b+","+(-r)+"H"+end+"Q"+(end+r)+","+(-r)+" "+(end+r)+",0Q"+(end+r)+","+r+" "+end+","+r+"H"+b+"L"+m+","+(r*.25)+"L"+a+","+r+"H0Q"+(-r)+","+r+" "+(-r)+",0Q"+(-r)+","+(-r)+" 0,"+(-r)+"Z";
};
const rows=plot.selectAll(".chromosome")
  .data(chromosomes)
  .join("g")
  .attr("class","chromosome")
  .attr("transform",d=>{const lane=lanes(d.chr)+lanes.bandwidth()/2;return vertical?"translate("+lane+",0) rotate(90)":"translate(0,"+lane+")";});
rows.append("path")
  .attr("d",d=>outline(d.length,${c.bioVariant==='centromere'?'[d.centStart,d.centEnd]':'null'}))
  .attr("fill","#f0f3f7")
  .attr("stroke","#a8b3c3");
rows.append("clipPath")
  .attr("id",(d,i)=>"chromosome-clip-"+i)
  .append("path")
  .attr("d",d=>outline(d.length,${c.bioVariant==='centromere'?'[d.centStart,d.centEnd]':'null'}));
${c.yAxis?`plot.selectAll(".chromosome-name")
  .data(chromosomes)
  .join("text")
  .attr("x",d=>vertical?lanes(d.chr)+lanes.bandwidth()/2:-18)
  .attr("y",vertical?-15: d=>lanes(d.chr)+lanes.bandwidth()/2+4)
  .attr("text-anchor",vertical?"middle":"end")
  .text(d=>d.chr);`:''}
${density?`
// ${tr('每行计一个位点；末端窗口用实际宽度换算密度。','Count one locus per row; normalize terminal windows by their actual width.','1行を1座位とし、末端窓は実際の幅で密度を換算します。')}
const windowSize=${c.bioWindowSize};
const bins=chromosomes.flatMap(chr=>d3.range(Math.ceil(chr.length/windowSize)).map(i=>({chr:chr.chr,start:i*windowSize,end:Math.min(chr.length,(i+1)*windowSize),count:0})));
const binLookup=d3.group(bins,d=>d.chr);
for(const row of records){const items=binLookup.get(row.chr);items[Math.min(items.length-1,Math.floor(row.start/windowSize))].count++;}
for(const bin of bins)bin.value=${c.bioDensityUnit==='count'?'bin.count':'bin.count/((bin.end-bin.start)/1e6)'};
const fill=${continuousConstructor(c.chartScheme)}.domain(${c.colorDomainEnabled?`[${c.colorMin},${c.colorMax}]`:'[0,d3.max(bins,d=>d.value)||1]'})
    ${continuousRange(c.chartScheme,[c.secondaryColor,c.color])}.clamp(true);
rows.each(function(chr,i){d3.select(this).append("g")
  .attr("clip-path","url(#chromosome-clip-"+i+")")
  .selectAll(".segment")
  .data(binLookup.get(chr.chr))
  .join("rect")
  .attr("class","segment")
  .attr("x",d=>coordinate(d.start))
  .attr("y",-thickness/2)
  .attr("width",d=>coordinate(d.end)-coordinate(d.start))
  .attr("height",thickness)
  .attr("fill",d=>fill(d.value))
  .attr("opacity",${c.opacity})
  .on("pointerenter pointermove",(event,d)=>showTip(event,d.chr+": "+d.start+"–"+d.end+" · n="+d.count+" · "+d.value.toFixed(3)+" ${c.bioDensityUnit==='count'?'count':'/ Mb'}"))
  .on("pointerleave",hideTip);});
${c.legend?`const key=svg.append("g")
  .attr("transform","translate("+(width-220)+","+(height-28)+")");
key.selectAll("rect")
  .data(d3.range(60))
  .join("rect")
  .attr("x",d=>d*3)
  .attr("width",3.1)
  .attr("height",8)
  .attr("fill",d=>fill(fill.domain()[0]+d/59*(fill.domain()[1]-fill.domain()[0])));
key.append("text")
  .attr("y",-6)
  .text(${js(c.bioDensityUnit==='count'?tr('每窗口计数','Count / window','窓ごとの件数'):tr('每 Mb 位点数','Loci / Mb','Mb あたり座位数'))}+" · "+fill.domain().map(d=>+d.toFixed(2))
    .join(" → "));`:''}
`: `
rows.each(function(chr,i){const marks=d3.select(this).append("g")
  .attr("clip-path","url(#chromosome-clip-"+i+")")
  .selectAll(".${points?'point':'segment'}")
  .data(records.filter(d=>d.chr===chr.chr))
  .join("${points?'circle':'rect'}")
  .attr("class","${points?'point':'segment'}")
  ${points?`.attr("cx",d=>coordinate(d.start))
  .attr("cy",0)
  .attr("r",${c.radius})`:`.attr("x",d=>coordinate(d.start))
  .attr("y",-thickness/2)
  .attr("width",d=>Math.max(.5,coordinate(d.end)-coordinate(d.start)))
  .attr("height",thickness)`}
  .attr("fill",d=>color(d.group))
  .attr("opacity",${c.opacity})
  .on("pointerenter pointermove",(event,d)=>showTip(event,d.name+" · "+d.chr+": "+d.start+${points?'""':'"–"+d.end'}+" · "+d.group))
  .on("pointerleave",hideTip);
});
${c.labels?`plot.selectAll(".locus-label")
  .data(records.filter(d=>d.name).slice(0,${c.bioLabelLimit}))
  .join("text")
  .attr("class","locus-label")
  .attr("x",d=>xy(coordinate(d.start),lanes(d.chr)+lanes.bandwidth()/2)[0]+(vertical?thickness/2+4:0))
  .attr("y",d=>xy(coordinate(d.start),lanes(d.chr)+lanes.bandwidth()/2)[1]-(vertical?0:thickness/2+5))
  .attr("font-size",${c.bioFontSize})
  .text(d=>d.name.length>16?d.name.slice(0,15)+"…":d.name)
  .on("pointerenter pointermove",(event,d)=>showTip(event,d.name))
  .on("pointerleave",hideTip);`:''}
`}
`;
}
