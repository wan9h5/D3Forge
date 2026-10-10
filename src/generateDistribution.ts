import { marginSource, axisOptions, scaleOverrides, appearanceSource } from './generatePresentation';
import { codeComment } from './codeComments';
import { t, type Locale } from './i18n';
import type { CodeParts } from './generate';
import type { Config, Row } from './model';

const js = (value: unknown) => JSON.stringify(value);

export function generateDistributionCode(type: 'heatmap' | 'histogram', data: Row[], c: Config, locale: Locale = 'en'): CodeParts {
  const heatmap = type === 'heatmap';
  const text = (key: string) => js(t(key, {}, locale));
  const importLine = 'import * as d3 from "d3";';
  const dataSource = `// ${codeComment('Replace this array with your own data. Keep the mapped field names.', locale)}\nconst data = ${JSON.stringify(data, null, 2)};\n`;
  const logic = `${importLine}

// ${codeComment('Call renderChart(container, data) in any Web project with D3 v7 installed.', locale)}
function renderChart(container, data) {
  d3.select(container)
    .selectAll("*")
    .remove();
  const width = ${c.width};
  const height = ${c.height};
  const margin = ${marginSource(type,data,c,{top:heatmap&&c.legend?70:28,right:28,bottom:heatmap?88:64,left:80})};
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const root = d3.select(container)
    .style("position", "relative");
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(heatmap ? 'Heatmap' : 'Histogram')})
    .style("display", "block")
    .style("width", "100%")
    .style("background", ${js(c.canvasStyle?c.background:'white')})
    .style("font", "12px system-ui");
  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
  const numeric = value => value != null
    && String(value).trim() !== ""
    && Number.isFinite(Number(value));
${heatmap ? `  const processedData = data.filter(d =>
    d[${js(c.xField)}] != null
    && String(d[${js(c.xField)}]).trim() !== ""
    && d[${js(c.yField)}] != null
    && String(d[${js(c.yField)}]).trim() !== ""
    && numeric(d[${js(c.valueField)}])
  );` : `  const processedData = data.filter(d => numeric(d[${js(c.xField)}])${c.histogramRangeEnabled?` && +d[${js(c.xField)}] >= ${c.histogramMin} && +d[${js(c.xField)}] <= ${c.histogramMax}`:''});`}
  if (!processedData.length) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .text("No valid rows for the selected fields.");
    return svg.node();
  }

${heatmap ? `  // ${codeComment('Aggregate repeated matrix coordinates; missing cells remain blank.', locale)}
  const columns = Array.from(new Set(processedData.map(d => String(d[${js(c.xField)}]))));
  const rows = Array.from(new Set(processedData.map(d => String(d[${js(c.yField)}]))));
${c.chartStyle&&c.columnOrder!=='input'?`  columns.sort(${c.columnOrder==='ascending'?'d3.ascending':'d3.descending'});
`:''}${c.chartStyle&&c.rowOrder!=='input'?`  rows.sort(${c.rowOrder==='ascending'?'d3.ascending':'d3.descending'});
`:''}  const cells = d3.flatRollup(processedData,
    values => ({
      value: d3.${c.heatmapAggregate === 'sum' ? 'sum' : 'mean'}(values, d => +d[${js(c.valueField)}]),
      count: values.length
    }),
    d => String(d[${js(c.xField)}]),
    d => String(d[${js(c.yField)}])
  ).map(([column, row, summary]) => ({ column, row, ...summary }));
  const x = d3.scaleBand()
    .domain(columns)
    .range([0, innerW]);
  const y = d3.scaleBand()
    .domain(rows)
    .range([0, innerH]);
  let [minimum, maximum] = ${c.colorDomainEnabled?js([c.colorMin,c.colorMax]):'d3.extent(cells, d => d.value)'};
  if (minimum === maximum) {
    const padding = Math.abs(minimum) * 0.05 || 1;
    minimum -= padding;
    maximum += padding;
  }
${c.heatmapPalette === 'diverging' ? `  // ${codeComment('A diverging palette uses symmetric limits around zero.', locale)}` : ''}
${c.heatmapPalette === 'diverging' ? `  const limit = Math.max(Math.abs(minimum), Math.abs(maximum));
  minimum = -limit;
  maximum = limit;
  const color = d3.scaleLinear()
    .domain([minimum, 0, maximum])
    .range([${js(c.secondaryColor)}, "#f7f9fc", ${js(c.color)}])
    .clamp(true);` : `  const color = d3.scaleLinear()
    .domain([minimum, maximum])
    .range([${js(c.secondaryColor)}, ${js(c.color)}])
    .clamp(true);`}
  const gap = Math.min(${c.cellGap}, x.bandwidth() * 0.8, y.bandwidth() * 0.8);
  const marks = g.append("g")
    .attr("class", "marks");
${c.missingColorEnabled?`  marks.append("rect")
    .attr("class", "missing-background")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", ${js(c.missingColor)})
    .attr("pointer-events", "none");
`:''}  const targets = marks.selectAll("rect.cell")
    .data(cells)
    .join("rect")
    .attr("class", "cell")
    .attr("x", d => x(d.column) + gap / 2)
    .attr("y", d => y(d.row) + gap / 2)
    .attr("width", Math.max(0, x.bandwidth() - gap))
    .attr("height", Math.max(0, y.bandwidth() - gap))
    .attr("rx", ${c.cellRadius})
    .attr("opacity", ${c.opacity})
    .attr("fill", d => color(d.value))${c.grid ? `
    .attr("stroke", "white")
    .attr("stroke-width", 1)` : ''};
${c.labels ? `  marks.selectAll("text.cell-label")
    .data(cells)
    .join("text")
    .attr("class", "cell-label")
    .attr("x", d => x(d.column) + x.bandwidth() / 2)
    .attr("y", d => y(d.row) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("pointer-events", "none")
    .attr("fill", d => d3.lab(color(d.value)).l < 55 ? "white" : "#26394c")
    .text(d => d3.format(${js(c.labelStyle?c.valueFormat:'.3~g')})(d.value));
` : ''}${c.legend ? `  const legend = g.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(0, -48)");
  const legendWidth = Math.min(200, innerW * 0.6);
  const legendScale = d3.scaleLinear()
    .domain([minimum, maximum])
    .range([0, legendWidth]);
  legend.selectAll("rect")
    .data(d3.range(60))
    .join("rect")
    .attr("x", d => d * legendWidth / 60)
    .attr("width", legendWidth / 60 + 0.5)
    .attr("height", 10)
    .attr("fill", d => color(minimum + (maximum - minimum) * d / 59));
  legend.append("g")
    .attr("transform", "translate(0, 10)")
    .call(d3.axisBottom(legendScale)
      .ticks(4)
      .tickSize(3)
    );
  legend.append("text")
    .attr("x", legendWidth + 12)
    .attr("y", 9)
    .attr("fill", "#687789")
    .text(${js(c.valueField)});
` : ''}` : `  // ${codeComment('Use equal-width bins; include the maximum value in the final bin.', locale)}
  const values = processedData.map(d => +d[${js(c.xField)}]);
  let [minimum, maximum] = ${c.histogramRangeEnabled?js([c.histogramMin,c.histogramMax]):'d3.extent(values)'};
  if (minimum === maximum) {
    const padding = Math.abs(minimum) * 0.05 || 0.5;
    minimum -= padding;
    maximum += padding;
  }
  const binCount = ${Math.max(1, Math.min(60, Math.round(c.binCount)))};
  const binWidth = (maximum - minimum) / binCount;
  const thresholds = d3.range(1, binCount).map(index => minimum + index * binWidth);
  const bins = d3.bin()
    .domain([minimum, maximum])
    .thresholds(thresholds)(values);
  // ${codeComment('Density is count divided by sample size and bin width; total area is one.', locale)}
  for (const bin of bins) {
    bin.count = bin.length;
    bin.density = bin.length / values.length / (bin.x1 - bin.x0);
    bin.value = bin.${c.histogramMode === 'density' ? 'density' : 'count'};
  }
  const x = d3.scaleLinear()
    .domain([minimum, maximum])
    .range([0, innerW]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.value) || 1])
    .nice()
    .range([innerH, 0]);
${scaleOverrides(type,c,locale)}${c.grid ? `  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)${axisOptions(type,c,'y')}
      .ticks(${c.axisStyle?c.yTickCount:6})
      .tickSize(-innerW)
      .tickFormat(() => "")
    )
    .call(g => g.select(".domain")
      .remove()
    )
    .call(g => g.selectAll("line")
      .attr("stroke", "#e8edf2")
    );
` : ''}  const marks = g.append("g")
    .attr("class", "marks");
  const targets = marks.selectAll("rect.bin")
    .data(bins)
    .join("rect")
    .attr("class", "bin")
    .attr("x", d => x(d.x0) + Math.min(${c.chartStyle?c.binGap:1}, x(d.x1) - x(d.x0)) / 2)
    .attr("y", d => y(d.value))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - ${c.chartStyle?c.binGap:1}))
    .attr("height", d => innerH - y(d.value))
    .attr("opacity", ${c.opacity})
    .attr("fill", ${js(c.color)})${c.chartStyle?`
    .attr("rx", ${c.cornerRadius})`:''};
${c.labels ? `  marks.selectAll("text.bin-label")
    .data(bins.filter(d => d.count > 0))
    .join("text")
    .attr("class", "bin-label")
    .attr("x", d => (x(d.x0) + x(d.x1)) / 2)
    .attr("y", d => y(d.value) - 6)
    .attr("text-anchor", "middle")
    .attr("fill", "#465568")
    .attr("pointer-events", "none")
    .text(d => d3.format(${js(c.labelStyle?c.valueFormat:c.histogramMode === 'density' ? '.3~g' : 'd')})(d.value));
` : ''}`}
${c.xAxis ? `  const xAxis = g.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0, " + innerH + ")")
    .call(d3.axisBottom(x)${axisOptions(type,c,'x')}${heatmap ? '' : `\n      .ticks(${c.axisStyle?c.xTickCount:7})`}
    );
${heatmap ? `  xAxis.selectAll(".tick text")
    .attr("transform", "rotate(-25)")
    .attr("text-anchor", "end");
` : ''}  g.append("text")
    .attr("class", "axis-title axis-title-x")
    .attr("x", innerW / 2)
    .attr("y", innerH + ${heatmap ? 76 : 50})
    .attr("text-anchor", "middle")
    .attr("fill", "#687789")
    .text(${js(c.xField)});
` : ''}${c.yAxis ? `  const yAxis = g.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y)${axisOptions(type,c,'y')}${heatmap ? '' : c.histogramMode === 'count' ? `\n      .ticks(Math.min(${c.axisStyle?c.yTickCount:6}, d3.max(bins, d => d.count)))\n      .tickFormat(d3.format(${js(c.axisStyle&&c.yTickFormat?c.yTickFormat:'d')}))` : `\n      .ticks(${c.axisStyle?c.yTickCount:6})`}
    );
  g.append("text")
    .attr("class", "axis-title axis-title-y")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -62)
    .attr("text-anchor", "middle")
    .attr("fill", "#687789")
    .text(${heatmap ? js(c.yField) : text(c.histogramMode === 'density' ? '概率密度' : '频数')});
` : ''}  g.selectAll(".domain")
    .attr("stroke", "#9aa8b5");
  g.selectAll(".tick text")
    .attr("fill", "#687789");
${c.tooltip ? `  // ${codeComment('Use textContent through D3 .text() for imported strings.', locale)}
  const tooltip = root.append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("white-space", "pre-wrap")
    .style("max-width", "calc(100% - 16px)")
    .style("box-sizing", "border-box")
    .style("overflow-wrap", "anywhere")
    .style("background", "#172c3b")
    .style("color", "white")
    .style("padding", "9px 12px")
    .style("border-radius", "5px")
    .style("font", "12px system-ui");
  targets.on("pointermove", (event, d) => {
    const [px, py] = d3.pointer(event, container);
    const lines = ${heatmap ? `[
      ${js(c.xField + ': ')} + d.column,
      ${js(c.yField + ': ')} + d.row,
      ${js(c.valueField + ': ')} + d3.format(".5~g")(d.value),
      ${text('观测数量')} + ": " + d.count
    ]` : `[
      ${text('区间')} + ": " + d3.format(".5~g")(d.x0) + " – " + d3.format(".5~g")(d.x1),
      ${text('频数')} + ": " + d.count,
      ${text('概率密度')} + ": " + d3.format(".5~g")(d.density)
    ]`};
    tooltip.style("display", "block")
      .text(lines.join("\\n"));
    const tip = tooltip.node();
    const left = Math.max(8, Math.min(px + 14, container.clientWidth - tip.offsetWidth - 8));
    tooltip.style("left", left + "px")
      .style("top", Math.max(8, py - tip.offsetHeight - 10) + "px");
  })
    .on("pointerleave", () => tooltip.style("display", "none"));
` : ''}${appearanceSource(type,c,locale)}  return svg.node();
}

const container = document.querySelector("#chart")
  || d3.select("body")
    .append("div")
    .attr("id", "chart")
    .node();
renderChart(container, data);
`;
  return { logic, data: dataSource, source: importLine + '\n\n' + dataSource + logic.slice(importLine.length) };
}
