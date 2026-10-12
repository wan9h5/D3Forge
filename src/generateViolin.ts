import { categoricalColors } from './chartColors';
import { codeComment } from './codeComments';
import { t, type Locale } from './i18n';
import { marginSource } from './generatePresentation';
import type { Config, Row } from './model';
import type { CodeParts } from './generate';
const js = (value: unknown) => JSON.stringify(value);

export function generateViolinCode(data: Row[], c: Config, locale: Locale): CodeParts {
  const horizontal = c.horizontal;
  const split = c.violinLayout === 'split';
  const cloud = c.violinLayout === 'raincloud';
  const half = c.violinLayout !== 'full';
  const grouped = !!c.violinGroupField;
  const importLine = 'import * as d3 from "d3";';
  const dataSource = `// ${codeComment("Replace this array with your own data. Keep the mapped field names.",locale)}\nconst data = ${JSON.stringify(data,null,2)};\n`;
  const logic = `${importLine}

// ${codeComment("Call renderChart(container, data) in any Web project with D3 v7 installed.",locale)}
function renderChart(container, data) {
  const root = d3.select(container)
    .style("position", "relative");
  root.selectAll("*")
    .remove();
  const width = ${c.width};
  const height = ${c.height};
  const margin = ${marginSource('violin',data,c,{top:c.legend?60:30,right:40,bottom:64,left:90})};
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(t('小提琴图',{},locale))})
    .style("width", "100%")
    .style("display", "block")
    .style("background", ${js(c.canvasStyle?c.background:'#ffffff')})
    .style("font", "12px system-ui");
  const numeric = value => value != null && String(value).trim() !== "" && Number.isFinite(+value);
  const processedData = data.filter(d => d[${js(c.xField)}] != null
      && String(d[${js(c.xField)}]).trim() !== "" && numeric(d[${js(c.yField)}])
      ${grouped?`&& d[${js(c.violinGroupField)}] != null && String(d[${js(c.violinGroupField)}]).trim() !== ""`:''}
      ${c.facetField?`&& d[${js(c.facetField)}] != null && String(d[${js(c.facetField)}]).trim() !== ""`:''}
    )
    .map((d, index) => ({ ...d, _group: String(d[${js(c.xField)}]), _y: +d[${js(c.yField)}],
      _series: ${grouped?`String(d[${js(c.violinGroupField)}])`:'""'},
      _facet: ${c.facetField?`String(d[${js(c.facetField)}])`:'""'}, _index: index }));
  const message = text => svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .text(text);
  if (!processedData.length) {
    message(${js(t('没有符合当前字段的有效数据。',{},locale))});
    return svg.node();
  }
  const groups = Array.from(new Set(processedData.map(d => d._group)));
  const series = Array.from(new Set(processedData.map(d => d._series)));
  ${split?`if (series.length !== 2) {
    message(${js(t('对半小提琴图需要恰好两个子组，请选择子组字段。',{},locale))});
    return svg.node();
  }`:''}
  const facets = Array.from(new Set(processedData.map(d => d._facet)));
  const colorNames = ${grouped?'series':'groups'};
  const color = d3.scaleOrdinal()
    .domain(colorNames)
    .range(${js(categoricalColors(c.color))});
  const colorOf = d => color(${grouped?'d.series':'d.group'});
  const summaries = [];
  // ${codeComment("Robust normal-reference bandwidth; fall back for singleton/constant groups.",locale)}
  for (const [facet, facetRows] of d3.group(processedData, d => d._facet)) {
    for (const [group, groupRows] of d3.group(facetRows, d => d._group)) {
      for (const [seriesName, rows] of d3.group(groupRows, d => d._series)) {
        const values = rows.map(d => d._y)
          .sort(d3.ascending);
        const q1 = d3.quantileSorted(values, .25);
        const median = d3.quantileSorted(values, .5);
        const q3 = d3.quantileSorted(values, .75);
        const iqr = q3 - q1;
        const deviation = d3.deviation(values) || 0;
        const spread = iqr > 0 && deviation > 0 ? Math.min(deviation, iqr / 1.34) : deviation;
        const bandwidth = (spread > 0 ? .9 * spread * Math.pow(values.length, -.2)
          : Math.max(Math.abs(median) * .05, 1)) * ${c.bandwidthFactor};
        const inside = values.filter(value => value >= q1 - 1.5 * iqr && value <= q3 + 1.5 * iqr);
        const low = values[0] - bandwidth;
        const high = values[values.length - 1] + bandwidth;
        const density = d3.range(${c.chartStyle?c.violinSamples:81}).map(i => {
          const value = low + (high - low) * i / ${c.chartStyle?c.violinSamples-1:80};
          return [value, d3.mean(values, observation => {
            const u = (value - observation) / bandwidth;
            return Math.abs(u) <= 1 ? .75 * (1 - u * u) / bandwidth : 0;
          })];
        });
        summaries.push({ facet, group, series: seriesName, rows, values, q1, median, q3, bandwidth,
          low: d3.min(inside), high: d3.max(inside), density, peak: d3.max(density, d => d[1]) || 1 });
      }
    }
  }
  const maximumDensity = d3.max(summaries, d => d.peak) || 1;
  const facetGap = ${c.facetField?44:0};
  const panelHeight = Math.max(1, (innerH - facetGap * (facets.length - 1)) / facets.length);
  const categoryLength = ${horizontal?'panelHeight':'innerW'};
  const valueLength = ${horizontal?'innerW':'panelHeight'};
  const category = d3.scaleBand()
    .domain(groups)
    .range([0, categoryLength])
    .padding(.25);
  const subcategory = d3.scaleBand()
    .domain(series)
    .range([0, category.bandwidth()])
    .padding(.08);
  const slotWidth = ${grouped&&!split?'subcategory.bandwidth()':'category.bandwidth()'};
  const halfWidth = slotWidth * ${cloud?.32:c.chartStyle?c.violinWidth:.45};
  const center = d => category(d.group) + ${grouped&&!split?'subcategory(d.series) + subcategory.bandwidth() / 2':'category.bandwidth() / 2'};
  const side = d => ${split?'series.indexOf(d.series) === 0 ? -1 : 1':'-1'};
  const densityWidth = (d, density) => density / (${c.violinScale==='width'?'d.peak':'maximumDensity'}) * halfWidth;
  const sharedDomain = [d3.min(summaries, d => d.values[0] - d.bandwidth),
    d3.max(summaries, d => d.values[d.values.length - 1] + d.bandwidth)];
  ${c.tooltip?`const tooltip = root.append("div")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("white-space", "pre-wrap")
    .style("background", "#172b3b")
    .style("color", "white")
    .style("padding", "9px 12px")
    .style("border-radius", "6px")
    .style("max-width", "calc(100% - 16px)")
    .style("overflow-wrap", "anywhere");
  const showTooltip = (event, text) => {
    tooltip.text(text)
      .style("display", "block");
    const [px, py] = d3.pointer(event, root.node());
    tooltip.style("left", Math.max(0, Math.min(px + 12, root.node().clientWidth - tooltip.node().offsetWidth)) + "px")
      .style("top", Math.max(0, py - tooltip.node().offsetHeight - 10) + "px");
  };`:''}
  facets.forEach((facet, facetIndex) => {
    const panel = svg.append("g")
      .attr("class", "facet")
      .attr("transform", "translate(" + margin.left + "," + (margin.top + facetIndex * (panelHeight + facetGap)) + ")");
    const local = summaries.filter(d => d.facet === facet);
    ${c.comparisonsEnabled?`const comparisons = ${js(c.comparisons)}.filter(comparison => comparison.label.trim()
      && comparison.from !== comparison.to && local.some(d => d.group === comparison.from)
      && local.some(d => d.group === comparison.to));`:''}
    const value = d3.scaleLinear()
      .domain(${c.facetField&&c.facetScale==='free'?'[d3.min(local, d => d.values[0] - d.bandwidth), d3.max(local, d => d.values[d.values.length - 1] + d.bandwidth)]':'sharedDomain'})
      .nice()
      .range(${horizontal?'[0, valueLength]':'[valueLength, 0]'});
    ${((horizontal&&c.xDomainEnabled)||(!horizontal&&c.yDomainEnabled))?`value.domain([${horizontal?c.xMin:c.yMin}, ${horizontal?c.xMax:c.yMax}]);`:''}
    ${c.comparisonsEnabled?`if (comparisons.length) {
      const domain = value.domain();
      const padding = (domain[1] - domain[0]) * .12 * comparisons.length;
      value.domain([domain[0], domain[1] + padding]);
    }`:''}
    ${c.facetField?`panel.append("text")
      .attr("class", "facet-title")
      .attr("y", -10)
      .attr("fill", "#465568")
      .text(facet);`:''}
    ${c.grid?`panel.append("g")
      .attr("class", "grid")
      ${horizontal?`.attr("transform", "translate(0," + panelHeight + ")")`:''}
      .call(d3.${horizontal?'axisBottom':'axisLeft'}(value)
        .ticks(${c.axisStyle?(horizontal?c.xTickCount:c.yTickCount):6})
        .tickSize(-categoryLength)
        .tickFormat(() => "")
      )
      .call(g => g.select(".domain")
        .remove()
      )
      .call(g => g.selectAll("line")
        .attr("stroke", ${js(c.gridStyle?c.gridColor:'#e8edf2')})
        .attr("stroke-width", ${c.gridStyle?c.gridWidth:1})
        .attr("opacity", ${c.gridStyle?c.gridOpacity:1})
        .attr("stroke-dasharray", ${js(c.gridStyle?c.gridDash:'')})
      );`:''}
    ${c.xAxis?`panel.append("g")
      .attr("class", "axis-x")
      .attr("transform", "translate(0," + panelHeight + ")")
      .call(d3.axisBottom(${horizontal?'value':'category'})${c.axisStyle?`.tickSize(${c.tickSize})`:''}${horizontal?`.ticks(${c.axisStyle?c.xTickCount:6})${c.axisStyle&&c.xTickFormat?`.tickFormat(d3.format(${js(c.xTickFormat)}))`:''}`:''});`:''}
    ${c.yAxis?`panel.append("g")
      .attr("class", "axis-y")
      .call(d3.axisLeft(${horizontal?'category':'value'})${c.axisStyle?`.tickSize(${c.tickSize})`:''}${!horizontal?`.ticks(${c.axisStyle?c.yTickCount:6})${c.axisStyle&&c.yTickFormat?`.tickFormat(d3.format(${js(c.yTickFormat)}))`:''}`:''});`:''}
    ${c.axisStyle?`panel.selectAll(".axis-x text, .axis-y text")
      .attr("font-size", ${c.tickFontSize})
      .attr("fill", ${js(c.axisColor)});
    panel.selectAll(".axis-x line, .axis-y line, .axis-x path, .axis-y path")
      .attr("stroke", ${js(c.axisColor)});`:''}
    ${c.axisStyle&&c.xTickAngle?`panel.selectAll(".axis-x text")
      .attr("transform", "rotate(${c.xTickAngle})")
      .attr("text-anchor", ${js(c.xTickAngle>0?'start':'end')});`:''}
    const clipId = "distribution-clip-" + facetIndex;
    panel.append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", innerW)
      .attr("height", panelHeight);
    const marks = panel.append("g")
      .attr("class", "marks")
      .attr("clip-path", "url(#" + clipId + ")");
    const item = marks.selectAll("g.distribution")
      .data(local)
      .join("g")
      .attr("class", "distribution");
    ${c.violinGeometry==='violin'?`const violins = item.append("path")
      .attr("class", "violin")
      .attr("d", summary => {
        const position = center(summary);
        const edgeA = d => position + ${half?'0':'-densityWidth(summary, d[1])'};
        const edgeB = d => position + ${half?'side(summary) * densityWidth(summary, d[1])':'densityWidth(summary, d[1])'};
        return d3.area()
          .${horizontal?'y0':'x0'}(edgeA)
          .${horizontal?'y1':'x1'}(edgeB)
          .${horizontal?'x':'y'}(d => value(d[0]))
          .curve(d3.curveLinear)(summary.density);
      })
      .attr("fill", colorOf)
      .attr("fill-opacity", ${c.opacity})
      .attr("stroke", colorOf)
      .attr("stroke-width", 1.3);`:''}
    ${c.violinInner!=='none'||c.violinGeometry==='box'?`const boxCenter = d => center(d) + ${cloud?'slotWidth * .12':split?'side(d) * slotWidth * .12':'0'};
    const summary = item.append("g")
      .attr("class", "summary");
    ${c.violinInner==='box'||c.violinGeometry==='box'?`summary.append("line")
      .attr("${horizontal?'y1':'x1'}", boxCenter)
      .attr("${horizontal?'y2':'x2'}", boxCenter)
      .attr("${horizontal?'x1':'y1'}", d => value(d.low))
      .attr("${horizontal?'x2':'y2'}", d => value(d.high))
      .attr("stroke", "#26394c");
    summary.append("rect")
      .attr("${horizontal?'y':'x'}", d => boxCenter(d) - ${c.violinGeometry==='box'?'Math.min(slotWidth * .2, 20)':'4'})
      .attr("${horizontal?'height':'width'}", ${c.violinGeometry==='box'?'Math.min(slotWidth * .4, 40)':'8'})
      .attr("${horizontal?'x':'y'}", d => Math.min(value(d.q1), value(d.q3)))
      .attr("${horizontal?'width':'height'}", d => Math.max(1, Math.abs(value(d.q1) - value(d.q3))))
      .attr("fill", ${c.violinGeometry==='box'?'colorOf':'"#26394c"'})
      .attr("fill-opacity", ${c.opacity})
      .attr("stroke", "#26394c");`:''}
    summary.append("line")
      .attr("${horizontal?'y1':'x1'}", d => boxCenter(d) - ${c.violinGeometry==='box'?'Math.min(slotWidth * .2, 20)':'6'})
      .attr("${horizontal?'y2':'x2'}", d => boxCenter(d) + ${c.violinGeometry==='box'?'Math.min(slotWidth * .2, 20)':'6'})
      .attr("${horizontal?'x1':'y1'}", d => value(d.median))
      .attr("${horizontal?'x2':'y2'}", d => value(d.median))
      .attr("stroke", ${js(c.chartStyle?c.medianColor:c.violinInner==='box'?'white':'#26394c')})
      .attr("stroke-width", ${c.chartStyle?c.medianWidth:2.5});`:''}
    ${c.showPoints?`// ${codeComment("Deterministic jitter keeps observations still when controls change.",locale)}
    const points = item.selectAll("circle.observation")
      .data(d => d.rows.map(row => ({ ...row, summary: d })))
      .join("circle")
      .attr("class", "observation")
      .attr("${horizontal?'cy':'cx'}", d => center(d.summary)
        + ${cloud?'slotWidth * .28 + ((d._index + 1) * .61803398875 % 1) * slotWidth * .16':half&&!split?'((d._index + 1) * .61803398875 % 1) * slotWidth * .3':split?'side(d.summary) * ((d._index + 1) * .61803398875 % 1) * slotWidth * .32':`(((d._index + 1) * .61803398875 % 1) - .5) * slotWidth * ${c.chartStyle?c.jitterWidth:.55}`}
      )
      .attr("${horizontal?'cx':'cy'}", d => value(d._y))
      .attr("r", ${c.radius})
      .attr("fill", d => colorOf(d.summary))
      .attr("opacity", ${c.opacity})
      ${c.markBorder?`.attr("stroke", ${js(c.borderColor)})
      .attr("stroke-width", ${c.borderWidth})`:''};
    ${c.tooltip?`points.on("pointermove", (event, d) => showTooltip(event,
      ${js(c.tooltipFields)}.map(field => field + ": " + String(d[field] ?? ""))
        .join("\\n")
    ))
      .on("pointerleave", () => tooltip.style("display", "none"));`:''}`:''}
    ${c.comparisonsEnabled?`// ${codeComment("Display supplied annotations only; no statistical test is performed.",locale)}
    comparisons.forEach((comparison, index) => {
      const a = category(comparison.from) + category.bandwidth() / 2;
      const b = category(comparison.to) + category.bandwidth() / 2;
      const edge = ${horizontal?'valueLength - 20 - index * 24':'20 + index * 24'};
      panel.append("path")
        .attr("class", "comparison-bracket")
        .attr("d", ${horizontal?'"M" + (edge - 5) + "," + a + "H" + edge + "V" + b + "H" + (edge - 5)':'"M" + a + "," + (edge + 5) + "V" + edge + "H" + b + "V" + (edge + 5)'})
        .attr("fill", "none")
        .attr("stroke", "#465568");
      panel.append("text")
        .attr("class", "comparison-label")
        .attr("x", ${horizontal?'edge - 5':'(a + b) / 2'})
        .attr("y", ${horizontal?'(a + b) / 2':'edge - 5'})
        ${horizontal?'.attr("transform", "rotate(-90," + (edge - 5) + "," + ((a + b) / 2) + ")")':''}
        .attr("text-anchor", "middle")
        .attr("font-size", ${c.labelStyle?c.labelFontSize:12})
        .attr("fill", ${js(c.labelStyle?c.labelColor:'#26394c')})
        .text(comparison.label);
    });`:''}
    ${c.annotationsEnabled?`// ${codeComment("Display supplied annotations only; no statistical test is performed.",locale)}
    panel.selectAll("text.annotation")
      .data(local)
      .join("text")
      .attr("class", "annotation")
      .attr("${horizontal?'y':'x'}", center)
      .attr("${horizontal?'x':'y'}", d => Math.max(8, Math.min(valueLength - 8, value(d3.max(d.values)) + ${horizontal?12:-12})))
      .attr("dx", ${c.labelStyle?c.labelOffsetX:0})
      .attr("dy", ${c.labelStyle?c.labelOffsetY:0})
      .attr("text-anchor", ${js(horizontal?'start':'middle')})
      .attr("fill", ${js(c.labelStyle?c.labelColor:'#26394c')})
      .attr("font-size", ${c.labelStyle?c.labelFontSize:14})
      .text(d => Array.from(new Set(d.rows.map(row => String(row[${js(c.annotationField)}] ?? "")).filter(Boolean)))
        .join(" / ")
      );`:''}
    ${c.tooltip?`${c.violinGeometry==='violin'?'violins':'summary'}.on("pointermove", (event, d) => showTooltip(event,
      [d.facet, d.group, d.series].filter(Boolean)
        .join(" / ") + "\\nN: " + d.values.length + "\\nQ1: " + d3.format(".4~g")(d.q1)
        + "\\n${t('中位数',{},locale)}: " + d3.format(".4~g")(d.median) + "\\nQ3: " + d3.format(".4~g")(d.q3)
    ))
      .on("pointerleave", () => tooltip.style("display", "none"));`:''}
    ${((horizontal&&c.referenceXEnabled)||(!horizontal&&c.referenceYEnabled))?`const reference = ${horizontal?c.referenceX:c.referenceY};
    if (reference >= value.domain()[0] && reference <= value.domain()[1]) {
      panel.append("line")
        .attr("${horizontal?'x1':'y1'}", value(reference))
        .attr("${horizontal?'x2':'y2'}", value(reference))
        .attr("${horizontal?'y2':'x2'}", categoryLength)
        .attr("stroke", ${js(c.referenceColor)})
        .attr("stroke-width", ${c.referenceWidth})
        .attr("stroke-dasharray", ${js(c.referenceDash)});
    }`:''}
  });
  ${c.xAxis?`svg.append("text")
    .attr("class", "axis-title-x")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .attr("font-size", ${c.axisStyle?c.titleFontSize:13})
    .text(${js(c.axisStyle&&c.xTitle?c.xTitle:horizontal?c.yField:c.xField)});`:''}
  ${c.yAxis?`svg.append("text")
    .attr("class", "axis-title-y")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerH / 2))
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", ${c.axisStyle?c.titleFontSize:13})
    .text(${js(c.axisStyle&&c.yTitle?c.yTitle:horizontal?c.xField:c.yField)});`:''}
  ${c.legend?`const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + margin.left + "," + ${c.legendStyle&&c.legendPosition==='bottom'?'(height - 35)':'18'} + ")");
  let legendX = 0, legendY = 0;
  for (const name of colorNames.slice(0, ${c.legendStyle?c.legendMaxItems:20})) {
    const label = String(name).slice(0, ${c.legendStyle?c.legendLabelLength:40});
    const estimated = Array.from(label).reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? ${c.legendStyle?c.legendFontSize:12} : ${c.legendStyle?c.legendFontSize*.6:7}), 24);
    if (legendX + estimated > innerW && legendX > 0) { legendX = 0; legendY += ${c.legendStyle?c.legendFontSize+c.legendGap:22}; }
    const entry = legend.append("g")
      .attr("transform", "translate(" + legendX + "," + legendY + ")");
    entry.append("circle")
      .attr("r", 4)
      .attr("fill", color(name));
    entry.append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("font-size", ${c.legendStyle?c.legendFontSize:12})
      .text(label);
    ${c.legendStyle&&c.legendDirection==='column'?`legendY += ${c.legendFontSize+c.legendGap};`:`legendX += estimated + ${c.legendStyle?c.legendGap:12};`}
  }`:''}
  return svg.node();
}
const container = document.querySelector("#chart")
  || d3.select("body")
    .append("div")
    .attr("id", "chart")
    .node();
renderChart(container, data);
`;
  return { logic, data:dataSource, source:importLine+'\n\n'+dataSource+logic.slice(importLine.length) };
}
