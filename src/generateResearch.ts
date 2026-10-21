import type { Config } from './model';
import type { BioTranslate } from './generateBio';
const js=(value:unknown)=>JSON.stringify(value);

// Coordinates and confidence limits are supplied results, not fitted statistics.
export function researchSource(c:Config,tr:BioTranslate):string {
  const forest=c.bioVariant==='forest',funnel=c.bioVariant==='funnel',roc=c.bioVariant==='roc';
  const curve=roc||c.bioVariant==='pr';
  const logarithmic=!curve&&c.xScale==='log';
  const xTitle=forest||funnel?tr('Effect estimate','效应量','効果量'):roc?tr('False-positive rate','假阳性率','偽陽性率'):tr('Recall','召回率','再現率');
  const yTitle=funnel?tr('Standard error','标准误','標準誤差'):roc?tr('True-positive rate','真阳性率','真陽性率'):tr('Precision','精确率','適合率');
  return `
  // ${tr('Use precomputed results. Confidence limits and model performance are not estimated here.','使用已计算的结果；此处不估计置信区间或模型表现。','計算済み結果を使用し、信頼区間やモデル性能は推定しません。')}
  const records = data.filter(d => numeric(d[${js(c.xField)}])${forest?`
      && named(d[${js(c.labelField)}])
      && numeric(d[${js(c.bioLowerField)}])
      && numeric(d[${js(c.bioUpperField)}])
      && +d[${js(c.bioLowerField)}] <= +d[${js(c.xField)}]
      && +d[${js(c.xField)}] <= +d[${js(c.bioUpperField)}]${logarithmic?`
      && +d[${js(c.bioLowerField)}] > 0`:''}`:`
      && numeric(d[${js(c.yField)}])${curve?`
      && +d[${js(c.xField)}] >= 0 && +d[${js(c.xField)}] <= 1
      && +d[${js(c.yField)}] >= 0 && +d[${js(c.yField)}] <= 1`:`
      && +d[${js(c.yField)}] > 0${logarithmic?`
      && +d[${js(c.xField)}] > 0`:''}`}`})
    .map((row,index) => ({
      index, x: +row[${js(c.xField)}],${forest?`
      lower: +row[${js(c.bioLowerField)}], upper: +row[${js(c.bioUpperField)}],`:`
      y: +row[${js(c.yField)}],`}
      name: String(row[${js(c.labelField)}] ?? ""),
      group: ${c.groupField?`String(row[${js(c.groupField)}] ?? ${js(tr('Ungrouped','未分组','未分類'))})`:js(tr('All results','全部结果','全結果'))}
    }));
  if (!records.length) {message(${js(tr('No valid results. Check field mappings and numeric ranges.','没有有效结果，请检查字段映射及数值范围。','有効な結果がありません。フィールドと数値範囲を確認してください。'))});return svg.node();}
  ${forest&&c.bioResultSort!=='input'?`records.sort((a,b) => ${c.bioResultSort==='ascending'?'a.x-b.x':'b.x-a.x'} || a.index-b.index);`:''}
  const groups = Array.from(new Set(records.map(d => d.group)));
  color
    .domain(groups);
  ${c.groupField?'groupLegend(groups);':''}
  const margin = {top: ${c.legend&&c.groupField?'48 + Math.ceil(groups.length / 4) * 18':'36'}, right: ${forest&&c.bioValueLabels?'Math.min(190,width*.25)':'32'}, bottom: 66, left: ${forest?'Math.min(165,width*.23)':'72'}};
  const innerW = Math.max(30,width-margin.left-margin.right);
  const innerH = Math.max(30,height-margin.top-margin.bottom);
  const g = svg.append("g")
    .attr("transform", "translate("+margin.left+","+margin.top+")");
  ${curve?`const x = d3.scaleLinear()
    .domain([0,1])
    .range([0,innerW]);
  const y = d3.scaleLinear()
    .domain([0,1])
    .range([innerH,0]);`:`const reference = ${c.bioReferenceValue};
  const values = records.flatMap(d => ${forest?'[d.lower,d.upper]':'[d.x]'});
  ${c.bioShowReference?`${logarithmic?'if(reference>0) ':''}values.push(reference);`:''}
  let [low,high] = d3.extent(values);
  if (low === high) {${logarithmic?'low/=1.5;high*=1.5;':'const pad=Math.max(Math.abs(low)*.15,.1);low-=pad;high+=pad;'}}
  const x = d3.${logarithmic?'scaleLog':'scaleLinear'}()
    .domain(${logarithmic?'[low/1.08,high*1.08]':'[low,high]'})
    .range([0,innerW])
    ${logarithmic?';':'.nice();'}
  const y = ${forest?`d3.scaleBand()
    .domain(records.map(d=>d.index))
    .range([0,innerH])
    .padding(.45)`:`d3.scaleLinear()
    .domain([0,d3.max(records,d=>d.y)*1.08])
    .range([0,innerH])
    .nice()`};`}
  ${c.grid?`g.append("g")
    .attr("class", "research-grid")
    .call(d3.axisBottom(x)
    .ticks(5)
    .tickSize(innerH)
    .tickFormat(""))
    .call(grid=>grid.select(".domain")
      .remove())
    .call(grid=>grid.selectAll("line")
    .attr("stroke","#e8edf4")
    .attr("stroke-dasharray","3,4"));`:''}
  ${c.xAxis?`g.append("g")
    .attr("class", "research-x-axis")
    .attr("transform", "translate(0,"+innerH+")")
    .call(d3.axisBottom(x)
    .ticks(5${logarithmic?',"~g"':''}));
  svg.append("text")
    .attr("x",margin.left+innerW/2)
    .attr("y",height-20)
    .attr("text-anchor","middle")
    .text(${js(xTitle)});`:''}
  ${c.yAxis?`g.append("g")
    .attr("class", "research-y-axis")
    .call(d3.axisLeft(y)${forest?`
    .tickFormat(index=>records.find(d=>d.index===index).name)`:`
    .ticks(5)`});
  ${forest?'':`svg.append("text")
    .attr("transform","translate(20,"+(margin.top+innerH/2)+")rotate(-90)")
    .attr("text-anchor","middle")
    .text(${js(yTitle)});`}`:''}
  g.selectAll(".domain, .tick line")
    .attr("stroke","#a9b6c9");
  g.selectAll(".tick text")
    .attr("fill","#52647a")
    .attr("font-size",fontSize);
  ${c.bioShowReference&&(roc||!curve)?roc?`g.append("line")
    .attr("class","research-reference")
    .attr("x1",x(0))
    .attr("y1",y(0))
    .attr("x2",x(1))
    .attr("y2",y(1))
    .attr("stroke","#a4afc1")
    .attr("stroke-dasharray","5,5");`:`${logarithmic?'if(reference>0) ':''}g.append("line")
    .attr("class","research-reference")
    .attr("x1",x(reference))
    .attr("x2",x(reference))
    .attr("y1",0)
    .attr("y2",innerH)
    .attr("stroke","#a4afc1")
    .attr("stroke-dasharray","5,5");`:''}
  ${forest?`const rows = g.selectAll("g.result-row")
    .data(records)
    .join("g")
    .attr("class","result-row")
    .attr("transform",d=>"translate(0,"+(y(d.index)+y.bandwidth()/2)+")");
  rows.append("line")
    .attr("x1",d=>x(d.lower))
    .attr("x2",d=>x(d.upper))
    .attr("stroke",d=>color(d.group))
    .attr("stroke-width",${c.lineWidth});
  rows.selectAll("line.cap")
    .data(d=>[{value:d.lower,group:d.group},{value:d.upper,group:d.group}])
    .join("line")
    .attr("class","cap")
    .attr("x1",d=>x(d.value))
    .attr("x2",d=>x(d.value))
    .attr("y1",-5)
    .attr("y2",5)
    .attr("stroke",d=>color(d.group))
    .attr("stroke-width",${c.lineWidth});
  rows.append("circle")
    .attr("cx",d=>x(d.x))
    .attr("r",${c.radius})
    .attr("fill",d=>color(d.group))
    .attr("opacity",${c.opacity});
  ${c.bioValueLabels?`rows.append("text")
    .attr("class","result-value")
    .attr("x",innerW+12)
    .attr("dy",".35em")
    .attr("font-size",fontSize)
    .text(d=>d3.format(".3~g")(d.x)+" ["+d3.format(".3~g")(d.lower)+", "+d3.format(".3~g")(d.upper)+"]");`:''}
  rows.append("rect")
    .attr("x",0)
    .attr("y",-Math.max(8,y.step()/2))
    .attr("width",innerW)
    .attr("height",Math.max(16,y.step()))
    .attr("fill","transparent");
  tip(rows,d=>d.name+"\\n"+${js(xTitle)}+": "+d.x+"\\n"+${js(tr('Supplied interval','输入区间','入力区間'))}+": ["+d.lower+", "+d.upper+"]");`
    :curve?`const series = d3.groups(records,d=>d.group)
    .map(([name,rows])=>({name,rows:rows.slice().sort((a,b)=>a.x-b.x||a.index-b.index)}));
  const line = d3.line()
    .x(d=>x(d.x))
    .y(d=>y(d.y))
    .curve(d3.curveLinear);
  const paths = g.selectAll("path.performance-curve")
    .data(series)
    .join("path")
    .attr("class","performance-curve")
    .attr("d",d=>line(d.rows))
    .attr("fill","none")
    .attr("stroke",d=>color(d.name))
    .attr("stroke-width",${c.lineWidth})
    .attr("stroke-linejoin","round")
    .attr("stroke-linecap","round")
    .attr("opacity",${c.opacity});
  const points = g.selectAll("circle.performance-point")
    .data(records)
    .join("circle")
    .attr("class","performance-point")
    .attr("cx",d=>x(d.x))
    .attr("cy",d=>y(d.y))
    .attr("r",${c.showPoints?c.radius:5})
    .attr("fill",d=>color(d.group))
    .attr("fill-opacity",${c.showPoints?c.opacity:0});
  const pointText=d=>d.group+"\\n"+${js(xTitle)}+": "+d.x+"\\n"+${js(yTitle)}+": "+d.y;
  tip(points,pointText);
  ${c.tooltip?`paths.on("pointermove",function(event,series){
    const [px,py]=d3.pointer(event,g.node());
    const closest=d3.least(series.rows,d=>Math.hypot(x(d.x)-px,y(d.y)-py));
    showTip(event,pointText(closest));
  }).on("pointerleave",hideTip);`:''}`
    :`const points = g.selectAll("circle.study-point")
    .data(records)
    .join("circle")
    .attr("class","study-point")
    .attr("cx",d=>x(d.x))
    .attr("cy",d=>y(d.y))
    .attr("r",${c.radius})
    .attr("fill",d=>color(d.group))
    .attr("opacity",${c.opacity});
  tip(points,d=>d.name+"\\n"+${js(xTitle)}+": "+d.x+"\\n"+${js(yTitle)}+": "+d.y);
  ${c.labels?`g.selectAll("text.study-label")
    .data(records.slice(0,${c.bioLabelLimit}))
    .join("text")
    .attr("class","study-label")
    .attr("x",d=>x(d.x)+${c.radius+5})
    .attr("y",d=>y(d.y)-5)
    .attr("font-size",fontSize)
    .attr("pointer-events","none").text(d=>d.name);`:''}`}
`;
}
