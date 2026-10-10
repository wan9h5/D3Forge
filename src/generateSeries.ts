import type { Config, Row } from './model';
import type { CodeParts } from './generate';

const js = (value: unknown) => JSON.stringify(value);

export function generateSeriesCode(type: 'bar' | 'line', data: Row[], c: Config): CodeParts {
  const bar = type === 'bar';
  const horizontal = bar && c.horizontal;
  const stacked = bar && c.barLayout === 'stacked';
  const importLine = 'import * as d3 from "d3";';
  const dataSource = `// Replace this array with your own data. Keep the mapped field names.\nconst data = ${JSON.stringify(data, null, 2)};\n`;
  const logic = `${importLine}

// Call renderChart(container, data) in any Web project with D3 v7 installed.
function renderChart(container, data) {
  d3.select(container)
    .selectAll("*")
    .remove();

  const width = ${c.width};
  const height = ${c.height};
  const margin = { top: ${c.legend && c.groupField ? 56 : 28}, right: 32, bottom: 64, left: 80 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const root = d3.select(container)
    .style("position", "relative");
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(bar ? 'Bar chart' : 'Line chart')})
    .style("display", "block")
    .style("width", "100%")
    .style("background", "white")
    .style("font", "12px system-ui");
  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
  const numeric = value => value != null
    && String(value).trim() !== ""
    && Number.isFinite(Number(value));
  const processedData = data
    .filter(d => numeric(d[${js(c.yField)}])
      && ${bar ? `d[${js(c.xField)}] != null && String(d[${js(c.xField)}]).trim() !== ""` : `numeric(d[${js(c.xField)}])`}${!bar && c.xScale === 'log' ? `\n      && +d[${js(c.xField)}] > 0` : ''}${!bar && c.yScale === 'log' ? `\n      && +d[${js(c.yField)}] > 0` : ''}
    )
    .map(d => ({
      ...d,
      _x: ${bar ? 'String' : 'Number'}(d[${js(c.xField)}]),
      _y: +d[${js(c.yField)}],
      _series: ${c.groupField ? `String(d[${js(c.groupField)}] ?? "Ungrouped")` : '"All values"'}
    }));
  if (!processedData.length) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .text("No valid rows for the selected fields.");
    return svg.node();
  }

  const seriesNames = Array.from(new Set(processedData.map(d => d._series)));
  const color = d3.scaleOrdinal()
    .domain(seriesNames)
    .range([${js(c.color)}, "#e6ad43", "#48a58a", "#8b79bd", "#d87867"]);
${bar ? `
  // Sum repeated category/series pairs. Missing pairs contribute zero.
  const categories = Array.from(new Set(processedData.map(d => d._x)));
  const totals = d3.rollup(processedData,
    rows => d3.sum(rows, d => d._y),
    d => d._x,
    d => d._series
  );
  const rows = categories.map(category => ({
    category,
    values: totals.get(category)
  }));
${stacked ? `  // Diverging stacks support positive and negative values independently.
  const stacks = d3.stack()
    .keys(seriesNames)
    .value((row, series) => row.values.get(series) ?? 0)
    .offset(d3.stackOffsetDiverging)(rows);
  const bars = stacks.flatMap(series => series.map(segment => ({
    category: segment.data.category,
    series: series.key,
    low: segment[0],
    high: segment[1],
    value: segment.data.values.get(series.key) ?? 0
  }))).filter(d => totals.get(d.category).has(d.series));`
: `  const bars = rows.flatMap(row => seriesNames
    .filter(series => row.values.has(series))
    .map(series => ({
      category: row.category,
      series,
      value: row.values.get(series),
      low: Math.min(0, row.values.get(series)),
      high: Math.max(0, row.values.get(series))
    }))
  );`}
  const low = Math.min(0, d3.min(bars, d => d.low));
  const high = Math.max(0, d3.max(bars, d => d.high));
  const categoryScale = d3.scaleBand()
    .domain(categories)
    .range([0, ${horizontal ? 'innerH' : 'innerW'}])
    .padding(${c.barPadding});
  const seriesScale = d3.scaleBand()
    .domain(seriesNames)
    .range([0, categoryScale.bandwidth()])
    .padding(0.08);
  const valueScale = d3.scaleLinear()
    .domain(low === high ? [-1, 1] : [low, high])
    .nice()
    .range(${horizontal ? '[0, innerW]' : '[innerH, 0]'});
  const x = ${horizontal ? 'valueScale' : 'categoryScale'};
  const y = ${horizontal ? 'categoryScale' : 'valueScale'};
` : `
  const safeDomain = (values, log) => {
    let [low, high] = d3.extent(values);
    if (low === high) {
      low = log ? low / 2 : low - 1;
      high = log ? high * 2 : high + 1;
    }
    return [low, high];
  };
  const x = d3.${c.xScale === 'log' ? 'scaleLog' : 'scaleLinear'}()
    .domain(safeDomain(processedData.map(d => d._x), ${c.xScale === 'log'}))
    .nice()
    .range([0, innerW]);
  const yDomain = safeDomain(processedData.map(d => d._y), ${c.yScale === 'log'});
${c.area && c.yScale !== 'log' ? `  yDomain[0] = Math.min(0, yDomain[0]);
  yDomain[1] = Math.max(0, yDomain[1]);
` : ''}  const y = d3.${c.yScale === 'log' ? 'scaleLog' : 'scaleLinear'}()
    .domain(yDomain)
    .nice()
    .range([innerH, 0]);
  // Stable numeric sorting keeps each series in X order.
  const series = d3.groups(processedData, d => d._series)
    .map(([name, rows]) => ({
      name,
      rows: rows.slice().sort((a, b) => d3.ascending(a._x, b._x))
    }));
`}
${c.grid ? `  g.append("g")
    .attr("class", "grid")
    .attr("transform", ${horizontal ? '"translate(0, " + innerH + ")"' : '"translate(0, 0)"'})
    .call(d3.${horizontal ? 'axisBottom(x)' : 'axisLeft(y)'}
      .ticks(6)
      .tickSize(-${horizontal ? 'innerH' : 'innerW'})
      .tickFormat(() => "")
    )
    .call(grid => grid.select(".domain")
      .remove()
    )
    .call(grid => grid.selectAll("line")
      .attr("stroke", "#e8edf2")
    );
` : ''}${c.xAxis ? `  const xAxis = g.append("g")
    .attr("transform", "translate(0, " + innerH + ")")
    .call(d3.axisBottom(x));
  svg.append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 14)
    .attr("text-anchor", "middle")
    .attr("fill", "#465568")
    .text(${js(horizontal ? c.yField : c.xField)});
` : ''}${c.yAxis ? `  const yAxis = g.append("g")
    .call(d3.axisLeft(y));
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerH / 2))
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("fill", "#465568")
    .text(${js(horizontal ? c.xField : c.yField)});
` : ''}  g.selectAll(".domain, .tick line")
    .attr("stroke", "#b4bfcd");
  const marks = g.append("g")
    .attr("class", "marks");
${bar ? `  const categoryPosition = d => categoryScale(d.category)${stacked ? '' : ' + seriesScale(d.series)'};
  const barSize = ${stacked ? 'categoryScale' : 'seriesScale'}.bandwidth();
  const barsSelection = marks.selectAll("rect")
    .data(bars)
    .join("rect")
    .attr("x", d => ${horizontal ? 'Math.min(valueScale(d.low), valueScale(d.high))' : 'categoryPosition(d)'})
    .attr("y", d => ${horizontal ? 'categoryPosition(d)' : 'Math.min(valueScale(d.low), valueScale(d.high))'})
    .attr("width", ${horizontal ? 'd => Math.abs(valueScale(d.high) - valueScale(d.low))' : 'barSize'})
    .attr("height", ${horizontal ? 'barSize' : 'd => Math.abs(valueScale(d.high) - valueScale(d.low))'})
    .attr("opacity", ${c.opacity})
    .attr("fill", d => color(d.series));
${c.labels ? `  marks.selectAll("text")
    .data(bars)
    .join("text")
    .attr("x", d => ${horizontal ? '(valueScale(d.low) + valueScale(d.high)) / 2' : 'categoryPosition(d) + barSize / 2'})
    .attr("y", d => ${horizontal ? 'categoryPosition(d) + barSize / 2' : '(valueScale(d.low) + valueScale(d.high)) / 2'})
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "#172b3b")
    .attr("pointer-events", "none")
    .text(d => d3.format("~g")(d.value));
` : ''}` : `  const line = d3.line()
    .x(d => x(d._x))
    .y(d => y(d._y))
    .curve(d3.${c.smooth ? 'curveMonotoneX' : 'curveLinear'});
${c.area ? `  const area = d3.area()
    .x(d => x(d._x))
    .y0(y(${c.yScale === 'log' ? 'y.domain()[0]' : '0'}))
    .y1(d => y(d._y))
    .curve(d3.${c.smooth ? 'curveMonotoneX' : 'curveLinear'});
  marks.selectAll("path.area")
    .data(series)
    .join("path")
    .attr("class", "area")
    .attr("d", d => area(d.rows))
    .attr("fill", d => color(d.name))
    .attr("opacity", ${+(c.opacity * .2).toFixed(3)})
    .attr("pointer-events", "none");
` : ''}  const paths = marks.selectAll("path.line")
    .data(series)
    .join("path")
    .attr("class", "line")
    .attr("d", d => line(d.rows))
    .attr("fill", "none")
    .attr("stroke", d => color(d.name))
    .attr("stroke-width", ${c.lineWidth})
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("opacity", ${c.opacity});
${c.showPoints ? `  const points = marks.selectAll("circle")
    .data(processedData)
    .join("circle")
    .attr("cx", d => x(d._x))
    .attr("cy", d => y(d._y))
    .attr("r", ${c.radius})
    .attr("fill", d => color(d._series))
    .attr("opacity", ${c.opacity});
` : ''}${c.labels ? `  marks.selectAll("text.label")
    .data(processedData)
    .join("text")
    .attr("class", "label")
    .attr("x", d => x(d._x) + ${c.radius + 5})
    .attr("y", d => y(d._y) - 6)
    .attr("fill", "#465568")
    .attr("pointer-events", "none")
    .text(d => String(d[${js(c.labelField)}] ?? ""));
` : ''}`}
${c.tooltip ? `  // Use textContent through D3 .text() for imported strings.
  const tooltip = root.append("div")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("white-space", "pre-wrap")
    .style("background", "#172b3b")
    .style("color", "white")
    .style("padding", "9px 12px")
    .style("max-width", "calc(100% - 16px)")
    .style("box-sizing", "border-box")
    .style("overflow-wrap", "anywhere")
    .style("border-radius", "6px")
    .style("font", "12px/1.6 system-ui");
  const tooltipFields = ${js(bar ? c.tooltipFields.filter(field => [c.xField, c.yField, c.groupField].includes(field)) : c.tooltipFields)};
  const showTooltip = (event, row) => {
    const [px, py] = d3.pointer(event, root.node());
    tooltip.text(tooltipFields.map(field => field + ": " + String(row[field] ?? ""))
      .join("\\n")
    )
      .style("display", "block");
    tooltip.style("left", Math.max(0, Math.min(px + 12,
      root.node().clientWidth - tooltip.node().offsetWidth)) + "px")
      .style("top", Math.max(0, py - tooltip.node().offsetHeight - 10) + "px");
  };
${bar ? `  barsSelection.on("pointermove", (event, d) => {
    const row = { [${js(c.xField)}]: d.category, [${js(c.yField)}]: d.value${c.groupField ? `, [${js(c.groupField)}]: d.series` : ''} };
    showTooltip(event, row);
  })
    .on("pointerleave", () => tooltip.style("display", "none"));
` : `  paths.on("pointermove", (event, series) => {
    const [px, py] = d3.pointer(event, g.node());
    const closest = d3.least(series.rows, d => Math.hypot(x(d._x) - px, y(d._y) - py));
    showTooltip(event, closest);
  })
    .on("pointerleave", () => tooltip.style("display", "none"));
${c.showPoints ? `  points.on("pointermove", (event, d) => showTooltip(event, d))
    .on("pointerleave", () => tooltip.style("display", "none"));
` : ''}`}` : ''}
${c.legend && c.groupField ? `  const legend = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", 22)");
  let legendX = 0;
  for (const name of seriesNames) {
    const item = legend.append("g")
      .attr("transform", "translate(" + legendX + ", 0)");
    item.append("circle")
      .attr("r", 4)
      .attr("fill", color(name));
    const text = item.append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("fill", "#465568")
      .text(name);
    const estimatedWidth = Array.from(String(name)).reduce((sum, character) =>
      sum + (character.charCodeAt(0) > 255 ? 12 : 7), 0
    );
    legendX += Math.max(text.node().getComputedTextLength(), estimatedWidth) + 32;
  }
` : ''}  return svg.node();
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
