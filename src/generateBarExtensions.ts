import type { Config } from './model';
import type { Locale } from './i18n';
const js=JSON.stringify;
const text=(l:Locale,en:string,zh:string,ja:string)=>l==='zh'?zh:l==='ja'?ja:en;
export function extendedBarSource(c:Config,l:Locale){
 if(c.barVariant==='polar-group')return polar(c,l);
 const dual=['dual-line','dual-bar','go'].includes(c.barVariant),line=c.barVariant==='dual-line';
 return `  // ${text(l,'Aggregate mapped measures before applying any right-axis transform.','先按所选方式汇总指标，再执行右轴数值转换。','指標を選択した統計量で集計してから右軸の値を変換します。')}
${dual?`  const records = Array.from(d3.group(processedData,d=>d.category),([category,rows])=>{
    const value=d3.${c.barAggregate}(rows,d=>d.value), raw=d3.${c.barSecondAggregate}(rows,d=>+d.sourceRow[${js(c.barSecondField)}]);
    const secondary=${c.barRightTransform==='neglog10'?'-Math.log10(raw)':'raw'};
    return {category,value,secondary,series:rows[0].series,tip:[category,${js(c.yField)}+": "+value,${js(c.barSecondField)}+": "+raw,${js(text(l,'Right axis','右轴','右軸'))}+": "+secondary]};
  }).filter(d=>Number.isFinite(d.secondary)${c.barRightTransform==='neglog10'?' && d.secondary >= 0':''});
  if(!records.length){message(${js(text(l,'No valid aggregated secondary values.','汇总后的第二指标没有有效值。','集計後の第二指標に有効な値がありません。'))});return svg.node();}
  let segments=records.map(d=>({...d,start:0,end:d.value}));
`:`  const cohorts=Array.from(new Set(processedData.map(d=>String(d.sourceRow[${js(c.barCohortField)}]))));
  const groups=Array.from(d3.group(processedData,d=>d.category),([category,rows])=>Array.from(d3.group(rows,d=>String(d.sourceRow[${js(c.barCohortField)}])),([cohort,items])=>({category,cohort,values:d3.rollup(items,rows=>d3.${c.barAggregate}(rows,d=>d.value),d=>d.series)}))).flat();
  const segments=groups.flatMap(group=>{
    let positive=0,negative=0;
    return series.map(series=>{const value=group.values.get(series)??0;const start=value>=0?positive:negative,end=start+value;if(value>=0)positive=end;else negative=end;
      return {category:group.category,cohort:group.cohort,series,value,start,end,tip:[group.category,group.cohort,series,String(value)]};});
  });
`}
  const x=d3.scaleBand()
    .domain(categories)
    .range([0,innerW])
    .padding(${c.barPadding});
${dual?'':`  const cohortBand=d3.scaleBand()
    .domain(cohorts)
    .range([0,x.bandwidth()])
    .padding(.12);`}
  const y=d3.scaleLinear()
    .domain([Math.min(0,d3.min(segments,d=>d.start),d3.min(segments,d=>d.end)),Math.max(0,d3.max(segments,d=>d.start),d3.max(segments,d=>d.end))||1])
    .nice()
    .range([innerH,0]);
${dual?`  let rightExtent=[Math.min(0,d3.min(records,d=>d.secondary)),Math.max(0,d3.max(records,d=>d.secondary))];
  if(rightExtent[0]===rightExtent[1])rightExtent[1]=rightExtent[0]+1;
  const right=d3.scaleLinear()
    .domain(${c.barRightDomain?'['+c.barRightMin+','+c.barRightMax+']':'rightExtent'})${c.barRightDomain?'':'\n    .nice()'}
    .range([innerH,0])
    .clamp(false);
`:''}
${c.grid?`  g.append("g")
    .call(d3.axisLeft(y)
    .ticks(5)
    .tickSize(-innerW)
    .tickFormat(()=>""))
    .call(g=>g.select(".domain")
    .remove())
    .call(g=>g.selectAll("line")
    .attr("stroke","#e8edf2"));`:''}
${c.xAxis?`  g.append("g")
    .attr("transform","translate(0,"+innerH+")")
    .call(d3.axisBottom(x)
    .tickPadding(${dual?3:20}))
    .call(g=>g.selectAll("text")
    .attr("transform","rotate(${c.xTickAngle||-25})")
    .attr("text-anchor","end"));`:''}
${c.yAxis?`  g.append("g")
    .call(d3.axisLeft(y))
    .attr("color",${dual?js(c.color):'"#596b82"'});
${dual?`  g.append("g")
    .attr("transform","translate("+innerW+",0)")
    .call(d3.axisRight(right)${c.barRightFormat?'.tickFormat(d3.format('+js(c.barRightFormat)+'))':''})
    .attr("color",${js(c.secondaryColor)});`:''}`:''}
  g.selectAll(".tick text")
    .attr("font-size",${c.axisStyle?c.tickFontSize:11});
  g.append("defs")
    .append("clipPath")
    .attr("id","bar-extension-clip")
    .append("rect")
    .attr("width",innerW)
    .attr("height",innerH);
  const marks=g.append("g")
    .attr("clip-path","url(#bar-extension-clip)");
  const position=d=>x(d.category)${dual?'':'+cohortBand(d.cohort)'};
  const thickness=${dual?`x.bandwidth()*${line?1:.46}`:'cohortBand.bandwidth()'};
  marks.selectAll("rect.bar")
    .data(segments)
    .join("rect")
    .attr("class","bar")
    .attr("x",position)
    .attr("width",thickness)
    .attr("y",d=>Math.min(y(d.start),y(d.end)))
    .attr("height",d=>Math.abs(y(d.start)-y(d.end)))
    .attr("rx",${c.cornerRadius})
    .attr("fill",${dual?(c.barVariant==='go'?'d=>color(d.series)':js(c.color)):'fill'})
    .attr("opacity",${c.opacity})
    .call(tip);
${dual?line?`  marks.append("path")
    .datum(records.sort((a,b)=>categories.indexOf(a.category)-categories.indexOf(b.category)))
    .attr("class","secondary-line")
    .attr("d",d3.line()
    .x(d=>x(d.category)+x.bandwidth()/2)
    .y(d=>right(d.secondary)))
    .attr("fill","none")
    .attr("stroke",${js(c.secondaryColor)})
    .attr("stroke-width",${c.lineWidth});
  marks.selectAll("circle.secondary")
    .data(records)
    .join("circle")
    .attr("class","secondary")
    .attr("cx",d=>x(d.category)+x.bandwidth()/2)
    .attr("cy",d=>right(d.secondary))
    .attr("r",${c.radius})
    .attr("fill",${js(c.secondaryColor)})
    .call(tip);`:`  marks.selectAll("rect.secondary")
    .data(records)
    .join("rect")
    .attr("class","secondary")
    .attr("x",d=>x(d.category)+x.bandwidth()*.54)
    .attr("width",thickness)
    .attr("y",d=>Math.min(right(0),right(d.secondary)))
    .attr("height",d=>Math.abs(right(0)-right(d.secondary)))
    .attr("fill",${js(c.secondaryColor)})
    .attr("opacity",${c.opacity})
    .call(tip);`:''}
${c.labels?`  g.selectAll("text.value")
    .data(segments)
    .join("text")
    .attr("class","value")
    .attr("x",d=>position(d)+thickness/2)
    .attr("y",d=>y(d.end)-5)
    .attr("text-anchor","middle")
    .attr("fill",${js(c.labelColor)})
    .attr("font-size",${c.labelFontSize}).text(d=>d3.format(".3~g")(d.value));`:''}
${!dual?`  g.selectAll("text.cohort")
    .data(groups)
    .join("text")
    .attr("class","cohort")
    .attr("x",d=>position(d)+thickness/2)
    .attr("y",innerH+14)
    .attr("text-anchor","middle")
    .attr("font-size",9).text(d=>d.cohort);`:''}
  g.append("text")
    .attr("transform","rotate(-90)")
    .attr("x",-innerH/2)
    .attr("y",-50)
    .attr("text-anchor","middle")
    .attr("fill",${js(c.color)}).text(${js(c.yTitle||c.yField)});
${dual?`  g.append("text")
    .attr("transform","rotate(90)")
    .attr("x",innerH/2)
    .attr("y",-innerW-50)
    .attr("text-anchor","middle")
    .attr("fill",${js(c.secondaryColor)}).text(${js(c.barRightTitle||(c.barRightTransform==='neglog10'?'−log10('+c.barSecondField+')':c.barSecondField))});`:''}
  g.append("text")
    .attr("x",innerW/2)
    .attr("y",innerH+66)
    .attr("text-anchor","middle").text(${js(c.xTitle||c.xField)});
`;
}
function polar(c:Config,l:Locale){return `  // ${text(l,'All groups share one radial scale; area mode maps value to squared radius.','各系列共用径向尺度；面积模式将数值映射到半径平方。','全系列で径方向の尺度を共有し、面積モードでは半径の二乗に値を対応させます。')}
  const outer=Math.max(20,Math.min(innerW,innerH)/2-35),inner=outer*${c.radialInner};
  const angle=d3.scaleBand()
    .domain(categories)
    .range([0,${c.radialAngle}*Math.PI/180])
    .padding(${c.radialGap});
  const sub=d3.scaleBand()
    .domain(series)
    .range([0,angle.bandwidth()])
    .padding(.08);
  const radius=${c.radialArea?'d3.scaleRadial()':'d3.scaleLinear()'}.domain([0,d3.max(cells,d=>d.value)||1])
    .range([inner,outer]);
  const radial=g.append("g")
    .attr("transform","translate("+innerW/2+","+innerH/2+")");
${c.grid?`  for(const value of radius.ticks(4)){
    radial.append("path")
    .attr("d",d3.arc()
    .innerRadius(radius(value))
    .outerRadius(radius(value))
    .startAngle(0)
    .endAngle(${c.radialAngle}*Math.PI/180)())
      .attr("fill","none")
    .attr("stroke","#e5ebf2");
    radial.append("text")
    .attr("y",-radius(value))
    .attr("font-size",9).text(d3.format(".3~g")(value));
  }`:''}
  radial.selectAll("path.bar")
    .data(cells)
    .join("path")
    .attr("class","bar")
    .attr("d",d3.arc()
    .innerRadius(inner)
    .outerRadius(d=>radius(d.value))
      .startAngle(d=>angle(d.category)+sub(d.series))
    .endAngle(d=>angle(d.category)+sub(d.series)+sub.bandwidth()))
    .attr("fill",fill)
    .attr("opacity",${c.opacity})
    .call(tip);
  radial.selectAll("text.category")
    .data(categories)
    .join("text")
    .attr("class","category")
    .attr("x",d=>Math.sin(angle(d)+angle.bandwidth()/2)*(outer+15))
    .attr("y",d=>-Math.cos(angle(d)+angle.bandwidth()/2)*(outer+15))
    .attr("text-anchor","middle")
    .attr("font-size",11).text(d=>d);
${c.labels?`  radial.selectAll("text.value")
    .data(cells)
    .join("text")
    .attr("class","value")
    .attr("x",d=>Math.sin(angle(d.category)+sub(d.series)+sub.bandwidth()/2)*(radius(d.value)+6))
    .attr("y",d=>-Math.cos(angle(d.category)+sub(d.series)+sub.bandwidth()/2)*(radius(d.value)+6))
    .attr("text-anchor","middle")
    .attr("fill",${js(c.labelColor)})
    .attr("font-size",${c.labelFontSize}).text(d=>d3.format(".3~g")(d.value));`:''}
`;}
