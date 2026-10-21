import type { Config } from './model';
import type { BioTranslate } from './generateBio';
const js=(value:unknown)=>JSON.stringify(value);

export function bioExtrasSource(c:Config,tr:BioTranslate):string {
  return c.bioVariant==='accumulation'?accumulationSource(c,tr):trackSource(c,tr);
}

function accumulationSource(c:Config,tr:BioTranslate):string {
  return `
  // ${tr('Plot supplied accumulation summaries and optional interval bounds; no resampling or richness estimation.','绘制输入的累积汇总及可选范围，不重采样或估计物种丰富度。','入力済み累積結果と任意の区間を表示し、再標本化・種数推定は行いません。')}
  const records=data.filter(d=>numeric(d[${js(c.xField)}])
      && Number.isInteger(+d[${js(c.xField)}]) && +d[${js(c.xField)}]>=1
      && numeric(d[${js(c.yField)}]) && +d[${js(c.yField)}]>=0)
    .map(d=>({
      samples:+d[${js(c.xField)}], richness:+d[${js(c.yField)}],
      lower:numeric(d[${js(c.bioLowerField)}])?+d[${js(c.bioLowerField)}]:null,
      upper:numeric(d[${js(c.bioUpperField)}])?+d[${js(c.bioUpperField)}]:null,
      group:${c.groupField?`String(d[${js(c.groupField)}]??${js(tr('Ungrouped','未分组','未分類'))})`:js(tr('All samples','全部样本','全サンプル'))}
    }));
  if(!records.length){message(${js(tr('No valid accumulation summaries.','没有有效的累积汇总数据。','有効な累積集計データがありません。'))});return svg.node();}
  const hasInterval=d=>d.lower!=null&&d.upper!=null&&d.lower>=0&&d.lower<=d.richness&&d.richness<=d.upper;
  const series=d3.groups(records,d=>d.group)
    .map(([name,rows])=>({name,rows:rows.slice().sort((a,b)=>a.samples-b.samples)}));
  color.domain(series.map(d=>d.name));
  ${c.legend?'groupLegend(series.map(d=>d.name));':''}
  const margin={top:${c.legend?'48+Math.ceil(series.length/4)*18':'36'},right:30,bottom:64,left:76};
  const innerW=Math.max(30,width-margin.left-margin.right),innerH=Math.max(30,height-margin.top-margin.bottom);
  const x=d3.scaleLinear()
    .domain([0,d3.max(records,d=>d.samples)])
    .range([0,innerW]);
  const y=d3.scaleLinear()
    .domain([0,Math.max(1,d3.max(records,d=>${c.bioConfidence?'hasInterval(d)?d.upper:d.richness':'d.richness'}))*1.05])
    .range([innerH,0])
    .nice();
  const g=svg.append("g")
    .attr("transform","translate("+margin.left+","+margin.top+")");
  ${c.grid?`g.append("g")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""))
    .call(grid=>grid.select(".domain")
      .remove())
    .call(grid=>grid.selectAll("line")
    .attr("stroke","#e7edf5")
    .attr("stroke-dasharray","3,4"));`:''}
  ${c.xAxis?`g.append("g")
    .attr("transform","translate(0,"+innerH+")")
    .call(d3.axisBottom(x).ticks(Math.min(8,d3.max(records,d=>d.samples))).tickFormat(d3.format("d")));
  svg.append("text")
    .attr("x",margin.left+innerW/2)
    .attr("y",height-18)
    .attr("text-anchor","middle")
    .text(${js(tr('Samples','样本数量','サンプル数'))});`:''}
  ${c.yAxis?`g.append("g")
    .call(d3.axisLeft(y).ticks(6));
  svg.append("text")
    .attr("transform","translate(20,"+(margin.top+innerH/2)+")rotate(-90)")
    .attr("text-anchor","middle")
    .text(${js(tr('Species richness','物种丰富度','種数'))});`:''}
  g.selectAll(".domain, .tick line")
    .attr("stroke","#a9b6c9");
  g.selectAll(".tick text")
    .attr("fill","#52647a")
    .attr("font-size",fontSize);
  ${c.bioConfidence?`const area=d3.area()
    .defined(hasInterval)
    .x(d=>x(d.samples))
    .y0(d=>y(d.lower))
    .y1(d=>y(d.upper))
    .curve(d3.curveLinear);
  g.selectAll("path.accumulation-range")
    .data(series)
    .join("path")
    .attr("class","accumulation-range")
    .attr("d",d=>area(d.rows))
    .attr("fill",d=>color(d.name))
    .attr("opacity",${c.bioBandOpacity})
    .attr("pointer-events","none");`:''}
  const line=d3.line()
    .x(d=>x(d.samples))
    .y(d=>y(d.richness))
    .curve(d3.curveLinear);
  const curves=g.selectAll("path.accumulation-line")
    .data(series)
    .join("path")
    .attr("class","accumulation-line")
    .attr("d",d=>line(d.rows))
    .attr("fill","none")
    .attr("stroke",d=>color(d.name))
    .attr("stroke-width",${c.lineWidth})
    .attr("opacity",${c.opacity});
  const points=g.selectAll("circle.accumulation-point")
    .data(records)
    .join("circle")
    .attr("class","accumulation-point")
    .attr("cx",d=>x(d.samples))
    .attr("cy",d=>y(d.richness))
    .attr("r",${c.showPoints?c.radius:5})
    .attr("fill",d=>color(d.group))
    .attr("fill-opacity",${c.showPoints?c.opacity:0});
  const summary=d=>d.group+"\\n"+${js(tr('Samples','样本数量','サンプル数'))}+": "+d.samples+"\\n"+${js(tr('Richness','丰富度','種数'))}+": "+d.richness+(hasInterval(d)?"\\n"+${js(tr('Supplied range','输入范围','入力区間'))}+": ["+d.lower+", "+d.upper+"]":"");
  tip(points,summary);
  ${c.tooltip?`curves.on("pointermove",(event,series)=>{
    const [px,py]=d3.pointer(event,g.node());
    const closest=d3.least(series.rows,d=>Math.hypot(x(d.samples)-px,y(d.richness)-py));
    showTip(event,summary(closest));
  }).on("pointerleave",hideTip);`:''}
`;
}

function trackSource(c:Config,tr:BioTranslate):string {
  return `
  // ${tr('Supplied chromosome lengths set sector spans; input intervals set bar angles. No binning or aggregation.','输入染色体长度决定扇区跨度，区间决定柱形角度；不自动分箱或汇总。','入力染色体長で扇区幅、区間で棒の角度を決め、自動集計・分割は行いません。')}
  const references=new Map();
  for(const row of data){
    if(!named(row[${js(c.chromosomeField)}])||!numeric(row[${js(c.bioLengthField)}])||+row[${js(c.bioLengthField)}]<=0)continue;
    const chromosome=String(row[${js(c.chromosomeField)}]);
    if(!references.has(chromosome))references.set(chromosome,new Set());
    references.get(chromosome).add(+row[${js(c.bioLengthField)}]);
  }
  const records=data.filter(d=>named(d[${js(c.chromosomeField)}])
      && numeric(d[${js(c.bioLengthField)}]) && +d[${js(c.bioLengthField)}]>0
      && references.get(String(d[${js(c.chromosomeField)}]))?.size===1
      && numeric(d[${js(c.xField)}]) && +d[${js(c.xField)}]>=0
      && numeric(d[${js(c.bioEndField)}]) && +d[${js(c.bioEndField)}]>+d[${js(c.xField)}]
      && +d[${js(c.bioEndField)}]<=+d[${js(c.bioLengthField)}]
      && numeric(d[${js(c.bioTrackOneField)}]) && +d[${js(c.bioTrackOneField)}]>=0
      && numeric(d[${js(c.bioTrackTwoField)}]) && +d[${js(c.bioTrackTwoField)}]>=0)
    .map(d=>({chromosome:String(d[${js(c.chromosomeField)}]),length:+d[${js(c.bioLengthField)}],start:+d[${js(c.xField)}],end:+d[${js(c.bioEndField)}],one:+d[${js(c.bioTrackOneField)}],two:+d[${js(c.bioTrackTwoField)}]}));
  if(!records.length){message(${js(tr('No valid genomic tracks. Check lengths, intervals and both track values.','没有有效轨道数据，请检查参考长度、区间及两个轨道数值。','有効なトラックがありません。参照長・区間・両トラック値を確認してください。'))});return svg.node();}
  const chromosomes=Array.from(new Set(records.map(d=>d.chromosome)))
    .sort((a,b)=>a.replace(/^chr/i,"").localeCompare(b.replace(/^chr/i,""),undefined,{numeric:true}))
    .map(name=>({name,length:Array.from(references.get(name))[0]}));
  const outer=Math.max(35,Math.min(width-160,height-150)/2);
  const inner=outer*${c.bioInnerRadius};
  const thickness=(outer*.86-inner)/2.2;
  const cx=width/2,cy=height/2+16;
  const g=svg.append("g")
    .attr("transform","translate("+cx+","+cy+")");
  const total=d3.sum(chromosomes,d=>d.length),gap=Math.min(${c.bioGap},Math.PI/chromosomes.length);
  let angle=0;
  const sectors=chromosomes.map(chr=>{
    const span=(2*Math.PI-gap*chromosomes.length)*chr.length/total;
    const sector={...chr,startAngle:angle,endAngle:angle+span};angle+=span+gap;return sector;
  });
  const lookup=new Map(sectors.map(d=>[d.name,d]));
  const angleAt=(chromosome,position)=>{const sector=lookup.get(chromosome);return sector.startAngle+position/sector.length*(sector.endAngle-sector.startAngle);};
  const maximumOne=Math.max(1,d3.max(records,d=>d.one)),maximumTwo=Math.max(1,d3.max(records,d=>d.two));
  const maximum=Math.max(maximumOne,maximumTwo);
  const tracks=[
    {field:"one",name:${js(c.bioTrackOneField)},base:inner+thickness*1.2,maximum:${c.bioSharedTrackScale?'maximum':'maximumOne'},color:${js(c.color)}},
    {field:"two",name:${js(c.bioTrackTwoField)},base:inner,maximum:${c.bioSharedTrackScale?'maximum':'maximumTwo'},color:${js(c.secondaryColor)}}
  ];
  g.selectAll("path.chromosome-sector")
    .data(sectors)
    .join("path")
    .attr("class","chromosome-sector")
    .attr("d",d3.arc().innerRadius(outer*.92).outerRadius(outer))
    .attr("fill",(d,i)=>i%2?"#dfe7f1":"#bccbdc")
    .attr("stroke","white");
  ${c.yAxis?`g.selectAll("text.chromosome-label")
    .data(sectors)
    .join("text")
    .attr("class","chromosome-label")
    .attr("transform",d=>{const a=(d.startAngle+d.endAngle)/2;return "translate("+Math.sin(a)*(outer+20)+","+(-Math.cos(a)*(outer+20))+")";})
    .attr("text-anchor","middle")
    .attr("dy",".35em")
    .text(d=>d.name);`:''}
  for(const track of tracks){
    const radius=d3.scaleLinear()
    .domain([0,track.maximum])
    .range([track.base,track.base+thickness]);
    ${c.grid?`g.selectAll(null)
      .data([0,.5,1])
      .join("circle")
      .attr("r",fraction=>radius(track.maximum*fraction))
      .attr("fill","none")
      .attr("stroke","#dce4ee")
      .attr("stroke-dasharray","2,4");`:''}
    const marks=g.selectAll(null)
      .data(records)
      .join("path")
      .attr("class","genomic-track-bar")
      .attr("d",d3.arc()
        .innerRadius(track.base)
        .outerRadius(d=>radius(d[track.field]))
        .startAngle(d=>angleAt(d.chromosome,d.start))
        .endAngle(d=>angleAt(d.chromosome,d.end))
        .padAngle(.002))
      .attr("fill",track.color)
      .attr("opacity",${c.opacity});
    tip(marks,d=>d.chromosome+": "+d.start+"–"+d.end+"\\n"+track.name+": "+d[track.field]);
  }
  ${c.xAxis?`for(const sector of sectors){
    const ticks=g.selectAll(null)
      .data(d3.ticks(0,sector.length,3))
      .join("g")
      .attr("transform",position=>"rotate("+(angleAt(sector.name,position)*180/Math.PI-90)+")translate("+outer+",0)");
    ticks.append("line")
    .attr("x2",4)
    .attr("stroke","#8fa0b6");
    ticks.append("text")
    .attr("x",6)
    .attr("dy",".3em")
    .attr("font-size",Math.max(7,fontSize-3))
    .text(position=>d3.format(".2~s")(position));
  }`:''}
  ${c.legend?`const key=svg.append("g")
    .attr("transform","translate("+(width/2-170)+",22)");
  tracks.forEach((track,index)=>{
    const item=key.append("g")
    .attr("transform","translate("+index*175+",0)");
    item.append("rect")
    .attr("width",9)
    .attr("height",9)
    .attr("fill",track.color);
    item.append("text")
    .attr("x",15)
    .attr("y",8)
    .attr("font-size",fontSize)
      .text(track.name+" · 0–"+d3.format(".3~g")(track.maximum));
  });`:''}
  ${c.bioAssemblyLabel?`svg.append("text")
    .attr("x",width/2)
    .attr("y",height-14)
    .attr("text-anchor","middle")
    .attr("font-size",10)
    .text(${js(c.bioAssemblyLabel)});`:''}
`;
}
