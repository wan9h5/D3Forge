import { hasChartLegend, legendBand, numericAxes } from './advancedModel';
import { codeComment } from './codeComments';
import type { Locale } from './i18n';
import type { ChartType, Config, Row } from './model';
const js=(value:unknown)=>JSON.stringify(value);

export function marginSource(type:ChartType,data:Row[],c:Config,fallback:{top:number;right:number;bottom:number;left:number}) {
  const m=c.canvasStyle?{top:c.marginTop,right:c.marginRight,bottom:c.marginBottom,left:c.marginLeft}:{...fallback};
  if(c.legendStyle&&hasChartLegend(type,c)) {
    const band=legendBand(type,data,c,Math.max(40,c.width-m.left-m.right));
    if(c.legendPosition==='bottom')m.bottom+=band+16;
    else m.top=Math.max(m.top,band+20);
  }
  const horizontal=Math.max(0,(c.width-40)/2),vertical=Math.max(0,(c.height-40)/2);
  return js({top:Math.min(m.top,vertical),right:Math.min(m.right,horizontal),bottom:Math.min(m.bottom,vertical),left:Math.min(m.left,horizontal)});
}
export function axisOptions(type:ChartType,c:Config,axis:'x'|'y') {
  if(!c.axisStyle)return '';
  const numeric=numericAxes(type,c)[axis] || type==='histogram'&&axis==='x';
  const count=axis==='x'?c.xTickCount:c.yTickCount;
  const format=axis==='x'?c.xTickFormat:c.yTickFormat;
  return `\n      .tickSize(${c.tickSize})${numeric?`\n      .ticks(${type==='histogram'&&axis==='y'&&c.histogramMode==='count'?`Math.min(${count}, d3.max(bins, d => d.count))`:count})`:''}${numeric&&format?`\n      .tickFormat(d3.format(${js(format)}))`:''}`;
}
export function scaleOverrides(type:ChartType,c:Config,locale:Locale) {
  const axes=numericAxes(type,c);let result='';
  for(const axis of ['x','y'] as const) {
    const enabled=axis==='x'?c.xDomainEnabled:c.yDomainEnabled;
    const min=axis==='x'?c.xMin:c.yMin,max=axis==='x'?c.xMax:c.yMax;
    const log=(axis==='x'?c.xScale:c.yScale)==='log'&&['scatter','box','line'].includes(type);
    if(enabled&&axes[axis]&&Number.isFinite(min)&&Number.isFinite(max)&&min<max&&(!log||min>0)) result+=`  ${axis}.domain([${min}, ${max}]);\n`;
  }
  return result?`  // ${codeComment('Explicit axis limits override automatic domains without changing the data.',locale)}\n${result}`:'';
}
export function appearanceSource(type:ChartType,c:Config,locale:Locale) {
  const out:string[]=[];const axes=numericAxes(type,c);
  if(c.canvasStyle)out.push(`  svg.style("background", ${js(c.background)});`);
  if(c.axisStyle) {
    for(const axis of ['x','y'] as const)if(axis==='x'?c.xAxis:c.yAxis)out.push(`  ${axis}Axis.selectAll(".tick text")
    .attr("font-size", ${c.tickFontSize})
    .attr("fill", ${js(c.axisColor)})${axis==='x'?`
    .attr("transform", "rotate(${c.xTickAngle})")
    .attr("text-anchor", ${js(c.xTickAngle<0?'end':c.xTickAngle>0?'start':'middle')})`:''};
  ${axis}Axis.selectAll(".domain, .tick line")
    .attr("stroke", ${js(c.axisColor)});`);
    out.push(`  svg.selectAll(".axis-title")
    .attr("font-size", ${c.titleFontSize})
    .attr("fill", ${js(c.axisColor)});`);
    if(c.xTitle)out.push(`  svg.selectAll(".axis-title-x")
    .text(${js(c.xTitle)});`);
    if(c.yTitle)out.push(`  svg.selectAll(".axis-title-y")
    .text(${js(c.yTitle)});`);
  }
  if(c.grid&&c.gridStyle)out.push(`  g.selectAll(${js(type==='heatmap'?'.marks rect.cell':'.grid line')})
    .attr("stroke", ${js(c.gridColor)})
    .attr("stroke-width", ${c.gridWidth})
    .attr("stroke-opacity", ${c.gridOpacity})
    .attr("stroke-dasharray", ${js(c.gridDash)});`);
  if(c.labels&&c.labelStyle)out.push(`  g.selectAll(".marks text, g[clip-path] text")
    .attr("font-size", ${c.labelFontSize})
    .attr("fill", ${js(c.labelColor)})
    .attr("dx", ${c.labelOffsetX})
    .attr("dy", ${c.labelOffsetY});`);
  if(c.markBorder&&type!=='heatmap')out.push(`  g.selectAll(${js(type==='box'?'.box rect, .box circle':type==='bar'||type==='histogram'?'.marks rect':type==='scatter'||type==='volcano'?'g[clip-path] circle, g[clip-path] path.point':'.marks circle')})
    .attr("stroke", ${js(c.borderColor)})
    .attr("stroke-width", ${c.borderWidth});`);
  if(scaleOverrides(type,c,locale))out.push(`  const rangeClipId = "d3forge-range-" + Math.random().toString(36).slice(2);
  g.append("clipPath")
    .attr("id", rangeClipId)
    .append("rect")
    .attr("width", innerW)
    .attr("height", innerH);
  g.selectAll(".marks, g[clip-path]")
    .attr("clip-path", "url(#" + rangeClipId + ")");${type==='box'?`
  g.append("clipPath")
    .attr("id", rangeClipId + "-boxes")
    .append("rect")
    .attr("x", -innerW)
    .attr("width", innerW * 3)
    .attr("height", innerH);
  g.selectAll(".box")
    .attr("clip-path", "url(#" + rangeClipId + "-boxes)");`:''}`);
  for(const axis of ['x','y'] as const) {
    const enabled=axis==='x'?c.referenceXEnabled:c.referenceYEnabled;
    if(!enabled||!axes[axis])continue;
    const value=axis==='x'?c.referenceX:c.referenceY;
    out.push(`  if (Number.isFinite(${axis}(${value})) && ${axis}(${value}) >= 0 && ${axis}(${value}) <= ${axis==='x'?'innerW':'innerH'}) {
    g.append("line")
      .attr("class", "reference-${axis}")
      .attr("x1", ${axis==='x'?`x(${value})`:'0'})
      .attr("x2", ${axis==='x'?`x(${value})`:'innerW'})
      .attr("y1", ${axis==='y'?`y(${value})`:'0'})
      .attr("y2", ${axis==='y'?`y(${value})`:'innerH'})
      .attr("stroke", ${js(c.referenceColor)})
      .attr("stroke-width", ${c.referenceWidth})
      .attr("stroke-dasharray", ${js(c.referenceDash)})
      .attr("pointer-events", "none");
  }`);
  }
  if(c.legendStyle&&hasChartLegend(type,c)) {
    out.push(`  legend.attr("class", "chart-legend")
    .attr("transform", "translate(" + margin.left + ", " + ${c.legendPosition==='top'?'18':'(height - margin.bottom + '+(type==='heatmap'?'84':'64')+')'} + ")");
  legend.selectAll("text")
    .attr("font-size", ${c.legendFontSize});`);
    // Heatmap legend is inside translated g, unlike the ordinal legends.
    if(c.legendPosition==='bottom'&&type!=='heatmap')out.push(`  svg.selectAll(".axis-title-x")
    .attr("y", height - margin.bottom + 48);`);
    if(type==='heatmap')out.push(`  legend.attr("transform", "translate(0, " + ${c.legendPosition==='top'?'-48':'(innerH + 88)'} + ")");`);
    else out.push(`  let layoutX = 0, layoutY = 0, hiddenLegendItems = 0;
  legend.selectAll("g").each(function(d, index) {
    const item = d3.select(this);
    const text = item.select("text");
    const name = text.text();
    const shortName = name.length > ${c.legendLabelLength} ? name.slice(0, ${c.legendLabelLength}) + "…" : name;
    const itemWidth = Array.from(shortName).reduce((sum, char) =>
      sum + (char.charCodeAt(0) > 255 ? ${c.legendFontSize} : ${c.legendFontSize*.6}), 0
    ) + ${24+c.legendGap};
    if (${js(c.legendDirection)} === "column" && index > 0 || layoutX > 0 && layoutX + itemWidth > innerW) {
      layoutX = 0;
      layoutY += ${c.legendFontSize+c.legendGap};
    }
    if (index >= ${c.legendMaxItems} || layoutY > ${Math.max(20,c.height*.4)-2*(c.legendFontSize+c.legendGap)}) {
      item.remove();
      hiddenLegendItems++;
      return;
    }
    item.attr("transform", "translate(" + layoutX + ", " + layoutY + ")");
    text.text(shortName);
    item.append("title")
      .text(name);
    layoutX += itemWidth;
  });
  if (hiddenLegendItems) legend.append("text")
    .attr("x", innerW - 4)
    .attr("y", layoutY + ${c.legendFontSize+c.legendGap})
    .attr("text-anchor", "end")
    .attr("fill", "#687789")
    .text("+ " + hiddenLegendItems);`);
  }
  return out.length?`  // ${codeComment('Optional presentation settings; chart values remain unchanged.',locale)}\n${out.join('\n')}\n`:'';
}
