import type { Config } from './model';
import type { BioTranslate } from './generateBio';
const js=(value:unknown)=>JSON.stringify(value);

export function associationSource(c:Config,tr:BioTranslate):string {
  const qq=c.bioVariant==='qq';
  return `
  const observations = data.filter(d => numeric(d[${js(c.yField)}])
      && +d[${js(c.yField)}] > 0 && +d[${js(c.yField)}] <= 1${qq?'':`
      && named(d[${js(c.chromosomeField)}])
      && numeric(d[${js(c.xField)}]) && +d[${js(c.xField)}] >= 0`})
    .map(d => ({
      p: +d[${js(c.yField)}],
      name: String(d[${js(c.labelField)}] ?? ""),
      group: ${c.groupField?`String(d[${js(c.groupField)}] ?? ${js(tr('Ungrouped','未分组','未分類'))})`:js(tr('All variants','全部位点','全変異'))}${qq?'':`,
      chromosome: String(d[${js(c.chromosomeField)}]),
      position: +d[${js(c.xField)}],
      ld: numeric(d[${js(c.bioLDField)}]) && +d[${js(c.bioLDField)}] >= 0 && +d[${js(c.bioLDField)}] <= 1 ? +d[${js(c.bioLDField)}] : null`}
    }));
  ${qq?`const groups = Array.from(new Set(observations.map(d=>d.group)));
  color.domain(groups);
  ${c.groupField?'groupLegend(groups);':''}
  // ${tr('For sorted rank i = 1..n, use (i - 0.5) / n as the expected uniform probability.','排序后 i = 1..n，期望均匀概率为 (i - 0.5) / n。','昇順の順位 i = 1..n に対し、期待一様確率は (i - 0.5) / n。')}
  const records = d3.groups(observations,d=>d.group).flatMap(([group,rows]) =>
    rows.slice().sort((a,b)=>a.p-b.p).map((d,index)=>({
      ...d, expected: -Math.log10((index+0.5)/rows.length), observed: -Math.log10(d.p)
    }))
  );`:`const selectedChromosome = ${js(c.bioRegionChromosome)} || observations[0]?.chromosome;
  ${c.bioRegionEnabled?`if (${c.bioRegionEnd} <= ${c.bioRegionStart}) {message(${js(tr('Region end must be greater than start.','区域终点必须大于起点。','領域の終了は開始より大きい値にしてください。'))});return svg.node();}`:''}
  const records = observations.filter(d=>d.chromosome===selectedChromosome${c.bioRegionEnabled?` && d.position >= ${c.bioRegionStart} && d.position <= ${c.bioRegionEnd}`:''})
    .map(d=>({...d,observed:-Math.log10(d.p)}));`}
  if (!records.length) {message(${js(tr('No valid variants in the current selection.','当前选择没有有效位点。','現在の選択に有効な変異がありません。'))});return svg.node();}
  const margin = {top:${qq&&c.groupField&&c.legend?'48+Math.ceil(groups.length/4)*18':!qq&&c.legend&&c.bioLDColor?'74':'40'},right:32,bottom:68,left:76};
  const innerW=Math.max(40,width-margin.left-margin.right), innerH=Math.max(40,height-margin.top-margin.bottom);
  const g=svg.append("g")
    .attr("transform","translate("+margin.left+","+margin.top+")");
  ${qq?`const maximum=Math.max(1,d3.max(records,d=>Math.max(d.expected,d.observed)))*1.05;
  const x=d3.scaleLinear()
    .domain([0,maximum])
    .range([0,innerW])
    .nice();
  const y=d3.scaleLinear()
    .domain(x.domain())
    .range([innerH,0]);`:`let [start,end]=${c.bioRegionEnabled?`[${c.bioRegionStart},${c.bioRegionEnd}]`:'d3.extent(records,d=>d.position)'};
  if(start===end){const pad=Math.max(1,Math.abs(start)*.001);start=Math.max(0,start-pad);end+=pad;}
  const x=d3.scaleLinear()
    .domain([start,end])
    .range([0,innerW]);
  const y=d3.scaleLinear()
    .domain([0,Math.max(1,d3.max(records,d=>d.observed)${c.showThreshold?`,-Math.log10(${c.pThreshold})`:''})*1.08])
    .range([innerH,0])
    .nice();
  const ldColor=d3.scaleLinear()
    .domain([0,1])
    .range([${js(c.secondaryColor)},${js(c.color)}])
    .clamp(true);`}
  ${c.grid?`g.append("g")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""))
    .call(grid=>grid.select(".domain")
      .remove())
    .call(grid=>grid.selectAll("line")
    .attr("stroke","#e8edf4")
    .attr("stroke-dasharray","3,4"));`:''}
  ${c.xAxis?`g.append("g")
    .attr("class","association-x-axis")
    .attr("transform","translate(0,"+innerH+")")
    .call(d3.axisBottom(x).ticks(6)${qq?'':'.tickFormat(value=>d3.format(".3~f")(value/1e6))'});
  svg.append("text")
    .attr("x",margin.left+innerW/2)
    .attr("y",height-22)
    .attr("text-anchor","middle")
    .text(${qq?js(tr('Expected −log10(P)','期望 −log10(P)','期待 −log10(P)')):js(tr('Position (Mb)','位置（Mb）','位置（Mb）'))+' + " · " + selectedChromosome'});`:''}
  ${c.yAxis?`g.append("g")
    .attr("class","association-y-axis")
    .call(d3.axisLeft(y).ticks(6));
  svg.append("text")
    .attr("transform","translate(20,"+(margin.top+innerH/2)+")rotate(-90)")
    .attr("text-anchor","middle")
    .text(${js(qq?tr('Observed −log10(P)','观测 −log10(P)','観測 −log10(P)'):'−log10(P)')});`:''}
  g.selectAll(".domain, .tick line")
    .attr("stroke","#a9b6c9");
  g.selectAll(".tick text")
    .attr("font-size",fontSize)
    .attr("fill","#52647a");
  ${qq&&c.bioShowReference?`g.append("line")
    .attr("class","qq-reference")
    .attr("x1",x(0))
    .attr("y1",y(0))
    .attr("x2",x(x.domain()[1]))
    .attr("y2",y(x.domain()[1]))
    .attr("stroke","#9ca8ba")
    .attr("stroke-dasharray","5,5");`:''}
  ${!qq&&c.showThreshold?`g.append("line")
    .attr("class","association-threshold")
    .attr("x1",0)
    .attr("x2",innerW)
    .attr("y1",y(-Math.log10(${c.pThreshold})))
    .attr("y2",y(-Math.log10(${c.pThreshold})))
    .attr("stroke",${js(c.significantColor)})
    .attr("stroke-dasharray","5,5");`:''}
  const points=g.selectAll("circle.variant-point")
    .data(records)
    .join("circle")
    .attr("class","variant-point")
    .attr("cx",d=>x(d.${qq?'expected':'position'}))
    .attr("cy",d=>y(d.observed))
    .attr("r",${c.radius})
    .attr("fill",d=>${qq?'color(d.group)':c.bioLDColor?'d.ld==null?"#b2bccb":ldColor(d.ld)':js(c.color)})
    .attr("opacity",${c.opacity});
  tip(points,d=>d.name+"\\nP: "+d.p+${qq?'"\\n"+d.group+"\\nExpected: "+d.expected+"\\nObserved: "+d.observed':'"\\n"+d.chromosome+":"+d.position+"\\nr²: "+(d.ld==null?"NA":d.ld)'});
  ${c.labels?`const labelRecords=[];
  for(const row of records.filter(d=>d.name).slice().sort((a,b)=>a.p-b.p)) {
    if(labelRecords.length>=${c.bioLabelLimit})break;
    const overlaps=labelRecords.some(other=>
      Math.abs(x(row.${qq?'expected':'position'})-x(other.${qq?'expected':'position'})) < Math.max(row.name.length,other.name.length)*fontSize*.65+12
      && Math.abs(y(row.observed)-y(other.observed)) < fontSize+8
    );
    if(!overlaps)labelRecords.push(row);
  }
  g.selectAll("text.variant-label")
    .data(labelRecords)
    .join("text")
    .attr("class","variant-label")
    .attr("x",d=>x(d.${qq?'expected':'position'}))
    .attr("y",d=>Math.max(10,y(d.observed)-${c.radius+6}))
    .attr("text-anchor",d=>x(d.${qq?'expected':'position'})>innerW*.8?"end":"start")
    .attr("font-size",fontSize)
    .attr("pointer-events","none")
    .text(d=>d.name);`:''}
  ${!qq&&c.bioLDColor&&c.legend?`const key=svg.append("g")
    .attr("transform","translate("+margin.left+",20)");
  key.append("text")
    .attr("y",0)
    .text(${js(tr('Supplied LD r²','输入 LD r²','入力 LD r²'))});
  key.selectAll("rect.ld-key")
    .data(d3.range(40))
    .join("rect")
    .attr("class","ld-key")
    .attr("x",d=>d*3)
    .attr("y",8)
    .attr("width",3.1)
    .attr("height",8)
    .attr("fill",d=>ldColor(d/39));
  key.append("text")
    .attr("x",0)
    .attr("y",30)
    .attr("font-size",9)
    .text("0");
  key.append("text")
    .attr("x",120)
    .attr("y",30)
    .attr("text-anchor","end")
    .attr("font-size",9)
    .text("1");
  key.append("rect")
    .attr("x",150)
    .attr("y",8)
    .attr("width",8)
    .attr("height",8)
    .attr("fill","#b2bccb");
  key.append("text")
    .attr("x",164)
    .attr("y",16)
    .attr("font-size",10)
    .text(${js(tr('LD unavailable','LD 缺失','LD 不明'))});`:''}
`;
}
