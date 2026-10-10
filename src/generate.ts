import { marginSource, axisOptions, scaleOverrides, appearanceSource } from './generatePresentation';
import { generateDistributionCode } from './generateDistribution';
import { codeComment } from './codeComments';
import type { Locale } from './i18n';
import { generateAdvancedCode } from './generateAdvanced';
import { generateSeriesCode } from './generateSeries';
import type { ChartType, Config, Row } from './model';
const js = (value: unknown) => JSON.stringify(value);
const field = (key: string) => `d[${js(key)}]`;
const importLine = 'import * as d3 from "d3";';

export interface CodeParts { logic: string; data: string; source: string; }

export function generateCodeParts(type: ChartType, data: Row[], c: Config, locale: Locale = 'en'): CodeParts {
  if (type === 'heatmap' || type === 'histogram') return generateDistributionCode(type, data, c, locale);
  if (type === 'violin' || type === 'manhattan') return generateAdvancedCode(type, data, c, locale);
  if (type === 'bar' || type === 'line') return generateSeriesCode(type, data, c, locale);
  const x = field(c.xField), y = field(c.yField);
  const group = type==='volcano'?'d.status':c.groupField?`String(${field(c.groupField)})`:'"All samples"';
  const symbol = c.chartStyle && c.pointShape !== 'circle';
  const shape = ({circle:'symbolCircle',square:'symbolSquare',triangle:'symbolTriangle',diamond:'symbolDiamond',star:'symbolStar',cross:'symbolCross'})[c.pointShape];
  const pointSize = type==='scatter' && c.scatterSizeEnabled ? 'pointRadius(d)' : String(c.radius);
  const point = type!=='box';
  const colorRange = type==='volcano'?(c.chartStyle?js([c.upColor,c.downColor,c.neutralColor]):'["#c45542", "#3875b5", "#a6b0bd"]'):`[${js(c.color)}, "#dc9b41", "#7363a8", "#3875b5", "#c45542"]`;
  const hasColor = type==='volcano' || type==='box' || !!c.groupField;
  const dataSource = `// ${codeComment("Replace this array with your own data. Keep the mapped field names.", locale)}\nconst data = ${JSON.stringify(data,null,2)};\n`;
  const logic = `${importLine}

// ${codeComment("Call renderChart(container, data) in any Web project with D3 v7 installed.", locale)}
function renderChart(container, data) {
  d3.select(container)
    .selectAll("*")
    .remove();

  // ${codeComment("Canvas and plotting area.", locale)}
  const width = ${c.width};
  const height = ${c.height};
  const margin = ${marginSource(type,data,c,{top:c.legend&&hasColor?48:26,right:28,bottom:64,left:70})};
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const root = d3.select(container)
    .style("position", "relative");
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(type==='box'?'Box plot':type==='volcano'?'Volcano plot':'Scatter plot')})
    .style("display", "block")
    .style("width", "100%")
    .style("background", ${js(c.canvasStyle?c.background:'white')})
    .style("font", "12px system-ui");
  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  // ${codeComment("CSV values may be strings. Skip blank, missing and non-finite values.", locale)}
  const numeric = value =>
    value != null
    && String(value).trim() !== ""
    && Number.isFinite(Number(value));
  const processedData = data
    .filter(d =>
      numeric(${y})
      && ${type==='box'?`${x} != null\n      && ${x} !== undefined\n      && String(${x}).trim() !== ""`:`numeric(${x})`}${type==='volcano'?`\n      && +${y} > 0\n      && +${y} <= 1`:''}${point&&c.xScale==='log'?`\n      && +${x} > 0`:''}${type!=='volcano'&&c.yScale==='log'?`\n      && +${y} > 0`:''}
    )
    .map(d => ({
      ...d,
      ${type==='box'?`_group: String(${x}),\n      _y: +${y}`:`_x: +${x},\n      _y: ${type==='volcano'?`-Math.log10(+${y})`:`+${y}`}`}${type==='volcano'?`,
      status: +${y} < ${c.pThreshold} && +${x} > ${c.fcThreshold} ? "up"
        : +${y} < ${c.pThreshold} && +${x} < -${c.fcThreshold} ? "down"
        : "ns"`:''}
    }));
  if (!processedData.length) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .text("No valid rows for the selected fields.");
    return;
  }

  // ${codeComment("Color and scales.", locale)}
  const color = d3.scaleOrdinal()
    .domain(${type==='volcano'?'["up", "down", "ns"]':type==='box'?'Array.from(new Set(processedData.map(d => d._group)))':`Array.from(new Set(processedData.map(d => ${group})))`})
    .range(${colorRange});
  const safeDomain = (values, log = false) => {
    let [min, max] = d3.extent(values);
    if (min === max) {
      if (log) {
        min /= 2;
        max *= 2;
      } else {
        min -= 1;
        max += 1;
      }
    }
    return [min, max];
  };
${type==='box'?`  // ${codeComment("Tukey box plot: quartiles, 1.5 \u00d7 IQR fences, observed whiskers.", locale)}
  const summaries = d3.groups(processedData, d => d._group)
    .map(([group, rows]) => {
      const values = rows.map(d => d._y)
        .sort(d3.ascending);
      const q1 = d3.quantileSorted(values, 0.25);
      const median = d3.quantileSorted(values, 0.5);
      const q3 = d3.quantileSorted(values, 0.75);
      const iqr = q3 - q1;
      const inside = values.filter(v =>
        v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr
      );
      return {
        group, q1, median, q3,
        low: d3.min(inside),
        high: d3.max(inside),
        outliers: rows.filter(d =>
          d._y < q1 - 1.5 * iqr || d._y > q3 + 1.5 * iqr
        )
      };
    });
  const x = d3.scaleBand()
    .domain(summaries.map(d => d.group))
    .range([0, innerW])
    .padding(0.45);`
:`  const x = d3.${c.xScale==='log'?'scaleLog':'scaleLinear'}()
    .domain(safeDomain(processedData.map(d => d._x), ${c.xScale==='log'}))
    .nice()
    .range([0, innerW]);`}
  const y = d3.${type!=='volcano'&&c.yScale==='log'?'scaleLog':'scaleLinear'}()
    .domain(${type==='volcano'?'[0, Math.max(1, d3.max(processedData, d => d._y), -Math.log10('+c.pThreshold+'))]':`safeDomain(processedData.map(d => d._y), ${c.yScale==='log'})`})
    .nice()
    .range([innerH, 0]);

${scaleOverrides(type,c,locale)}${c.grid?`  // ${codeComment("Horizontal reference grid.", locale)}
  g.append("g")
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
`:''}${c.xAxis?`  const xAxis = g.append("g")
    .attr("transform", "translate(0, " + innerH + ")")
    .call(d3.axisBottom(x)${axisOptions(type,c,'x')}${type!=='box'?`\n      .ticks(${c.axisStyle?c.xTickCount:7})`:''}
    );
  svg.append("text")
    .attr("class", "axis-title axis-title-x")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .attr("fill", "#465568")
    .text(${js(c.xField)});
`:''}${c.yAxis?`  const yAxis = g.append("g")
    .call(d3.axisLeft(y)${axisOptions(type,c,'y')}
      .ticks(${c.axisStyle?c.yTickCount:6})
    );
  svg.append("text")
    .attr("class", "axis-title axis-title-y")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerH / 2))
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("fill", "#465568")
    .text(${js(type==='volcano'?`−log10(${c.yField})`:c.yField)});
`:''}  g.selectAll(".domain")
    .attr("stroke", "#9aa8b5");
  g.selectAll(".tick text")
    .attr("fill", "#687789");

  // ${codeComment("Unique clip id allows several independent charts on the same page.", locale)}
  const clipId = "d3forge-clip-" + Math.random().toString(36).slice(2);
  g.append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("width", innerW)
    .attr("height", innerH);
  const marks = g.append("g")
    .attr("clip-path", "url(#" + clipId + ")");
${type==='volcano'?`  const thresholdLines = marks.append("g")
    .attr("stroke", ${js(c.chartStyle?c.thresholdColor:'#99a5b3')})
    .attr("stroke-width", ${c.chartStyle?c.thresholdWidth:1})
    .attr("stroke-dasharray", ${js(c.chartStyle?c.thresholdDash:'4 4')});
  thresholdLines.selectAll("line.fc")
    .data([-${c.fcThreshold}, ${c.fcThreshold}])
    .join("line")
    .attr("class", "fc")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", innerH);
  thresholdLines.append("line")
    .attr("class", "p")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", y(-Math.log10(${c.pThreshold})))
    .attr("y2", y(-Math.log10(${c.pThreshold})));
`:''}${point?`${type==='scatter'&&c.scatterSizeEnabled?`  const sizeValues = processedData.filter(d => numeric(d[${js(c.sizeField)}]) && +d[${js(c.sizeField)}] >= 0)
    .map(d => +d[${js(c.sizeField)}]);
  const sizeScale = d3.scaleSqrt()
    .domain(sizeValues.length ? d3.extent(sizeValues) : [0, 1])
    .range([${c.sizeMin}, ${c.sizeMax}])
    .clamp(true);
  const pointRadius = d => numeric(d[${js(c.sizeField)}]) && +d[${js(c.sizeField)}] >= 0 ? sizeScale(+d[${js(c.sizeField)}]) : ${c.radius};
`:''}${symbol?`  const pointSymbol = d3.symbol()
    .type(d3.${shape});
`:''}  const points = marks.selectAll(${js(symbol?'path.point':'circle')})
    .data(processedData)
    .join(${js(symbol?'path':'circle')})${symbol?`
    .attr("class", "point")
    .attr("transform", d => "translate(" + x(d._x) + ", " + y(d._y) + ")")
    .attr("d", d => pointSymbol.size(Math.PI * Math.pow(${pointSize}, 2))())`:`
    .attr("cx", d => x(d._x))
    .attr("cy", d => y(d._y))
    .attr("r", ${type==='scatter'&&c.scatterSizeEnabled?'d => pointRadius(d)':c.radius})`}
    .attr("opacity", ${c.opacity})
    .attr("fill", ${hasColor?`d => color(${group})`:js(c.color)});
${c.labels?`  const labels = marks.selectAll("text.label")
    .data(${type==='volcano'?'processedData.filter(d => d.status !== "ns")':'processedData'})
    .join("text")
    .attr("class", "label")
    .attr("x", d => x(d._x) + ${c.radius+5})
    .attr("y", d => y(d._y) - 5)
    .attr("fill", "#39495b")
    .style("pointer-events", "none")
    .text(d => ${field(c.labelField)} ?? "");
`:''}`:`  const boxes = marks.selectAll("g.box")
    .data(summaries)
    .join("g")
    .attr("class", "box")
    .attr("transform", d =>
      "translate(" + (x(d.group) + x.bandwidth() / 2) + ", 0)"
    );
  const boxWidth = Math.min(${c.chartStyle?c.boxWidth:80}, x.bandwidth());
  boxes.append("line")
    .attr("y1", d => y(d.low))
    .attr("y2", d => y(d.high))
    .attr("stroke", "#596b7d");
  boxes.selectAll("line.cap")
    .data(d => [d.low, d.high])
    .join("line")
    .attr("class", "cap")
    .attr("x1", -boxWidth / 4)
    .attr("x2", boxWidth / 4)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#596b7d");
  const boxRects = boxes.append("rect")
    .attr("x", -boxWidth / 2)
    .attr("width", boxWidth)
    .attr("y", d => y(d.q3))
    .attr("height", d => Math.max(1, y(d.q1) - y(d.q3)))
    .attr("fill", d => color(d.group))
    .attr("opacity", ${c.opacity})
    .attr("stroke", d => color(d.group));
  boxes.append("line")
    .attr("x1", -boxWidth / 2)
    .attr("x2", boxWidth / 2)
    .attr("y1", d => y(d.median))
    .attr("y2", d => y(d.median))
    .attr("stroke", ${js(c.chartStyle?c.medianColor:'#162b3b')})
    .attr("stroke-width", ${c.chartStyle?c.medianWidth:2});
  const outliers = boxes.selectAll("circle")
    .data(d => ${c.chartStyle&&!c.showOutliers?'[]':'d.outliers'})
    .join("circle")
    .attr("cy", d => y(d._y))
    .attr("r", ${c.radius})
    .attr("fill", ${js(c.chartStyle?c.outlierFill:'white')})
    .attr("stroke", d => color(d._group));
`}${c.tooltip?`
  // ${codeComment("Text-only tooltip: imported field values never become HTML.", locale)}
  const tooltip = root.append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("white-space", "pre-line")
    .style("background", "#162b3b")
    .style("color", "white")
    .style("padding", "10px 12px")
    .style("max-width", "calc(100% - 16px)")
    .style("box-sizing", "border-box")
    .style("overflow-wrap", "anywhere")
    .style("border-radius", "6px")
    .style("font", "12px/1.6 system-ui");
  const showTooltip = (event, text) => {
    const [px, py] = d3.pointer(event, container);
    tooltip.text(text)
      .style("display", "block");
    tooltip.style("left",
      Math.max(0, Math.min(px + 14,
        container.clientWidth - tooltip.node().offsetWidth)) + "px"
    )
      .style("top",
        Math.max(0, py - tooltip.node().offsetHeight - 10) + "px"
      );
  };
  const tooltipFields = ${js(c.tooltipFields)};
  const attachTooltip = selection => selection
    .on("pointermove", (event, d) => showTooltip(event,
      tooltipFields.map(key => key + ": " + (d[key] ?? "—"))
        .join("\\n")
    ))
    .on("pointerleave", () => tooltip.style("display", "none"));
${point?'  attachTooltip(points);':`  attachTooltip(outliers);
  boxRects.on("pointermove", (event, d) => showTooltip(event,
    d.group
      + "\\nQ1: " + d.q1
      + "\\nMedian: " + d.median
      + "\\nQ3: " + d.q3
      + "\\nWhiskers: " + d.low + " – " + d.high
  ))
    .on("pointerleave", () => tooltip.style("display", "none"));`}
`:''}${c.legend&&hasColor?`
  // ${codeComment("Legend.", locale)}
  const legend = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", 18)");
  let legendX = 0;
  for (const name of color.domain()) {
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
    legendX += Math.max(text.node().getComputedTextLength(), estimatedWidth) + 34;
  }
`:''}${point&&c.zoom?`
  // ${codeComment("Zoom changes scale domains; points keep a constant radius.", locale)}
  const baseX = x.copy();
  const baseY = y.copy();
  svg.call(d3.zoom()
    .scaleExtent([1, 16])
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .translateExtent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("zoom", event => {
      const t = event.transform;
      // ${codeComment("Convert SVG coordinates into the translated plot's coordinate system.", locale)}
      const local = d3.zoomIdentity
        .translate(t.x + margin.left * (t.k - 1), t.y + margin.top * (t.k - 1))
        .scale(t.k);
      const zx = local.rescaleX(baseX);
      const zy = local.rescaleY(baseY);
${symbol?`      points.attr("transform", d => "translate(" + zx(d._x) + ", " + zy(d._y) + ")");`:`      points.attr("cx", d => zx(d._x))
        .attr("cy", d => zy(d._y));`}
${c.xAxis?`      xAxis.call(d3.axisBottom(zx)
        .ticks(${c.axisStyle?c.xTickCount:7})${axisOptions(type,c,'x')}
      );
`:''}${c.yAxis?`      yAxis.call(d3.axisLeft(zy)
        .ticks(${c.axisStyle?c.yTickCount:6})${axisOptions(type,c,'y')}
      );
`:''}${c.grid?`      g.select(".grid")
        .call(d3.axisLeft(zy)
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
`:''}${c.labels?`      labels.attr("x", d => zx(d._x) + ${c.radius+5})
        .attr("y", d => zy(d._y) - 5);
`:''}${type==='volcano'?`      thresholdLines.selectAll("line.fc")
        .attr("x1", d => zx(d))
        .attr("x2", d => zx(d));
      thresholdLines.select("line.p")
        .attr("y1", zy(-Math.log10(${c.pThreshold})))
        .attr("y2", zy(-Math.log10(${c.pThreshold})));
`:''}${c.axisStyle?`      g.selectAll(".tick text")
        .attr("font-size", ${c.tickFontSize})
        .attr("fill", ${js(c.axisColor)});
${c.xAxis?`      xAxis.selectAll(".tick text")
        .attr("transform", "rotate(${c.xTickAngle})")
        .attr("text-anchor", ${js(c.xTickAngle<0?'end':c.xTickAngle>0?'start':'middle')});
`:''}      g.selectAll(".domain, .tick line")
        .attr("stroke", ${js(c.axisColor)});
`:''}${c.grid&&c.gridStyle?`      g.selectAll(".grid line")
        .attr("stroke", ${js(c.gridColor)})
        .attr("stroke-width", ${c.gridWidth})
        .attr("stroke-opacity", ${c.gridOpacity})
        .attr("stroke-dasharray", ${js(c.gridDash)});
`:''}${c.referenceXEnabled?`      g.select(".reference-x")
        .attr("x1", zx(${c.referenceX}))
        .attr("x2", zx(${c.referenceX}))
        .attr("display", zx(${c.referenceX}) >= 0 && zx(${c.referenceX}) <= innerW ? null : "none");
`:''}${c.referenceYEnabled?`      g.select(".reference-y")
        .attr("y1", zy(${c.referenceY}))
        .attr("y2", zy(${c.referenceY}))
        .attr("display", zy(${c.referenceY}) >= 0 && zy(${c.referenceY}) <= innerH ? null : "none");
`:''}    })
  );
`:''}${appearanceSource(type,c,locale)}  return svg.node();
}

// ${codeComment("This creates a container if your page does not already have #chart.", locale)}
const container = document.querySelector("#chart")
  || d3.select("body")
    .append("div")
    .attr("id", "chart")
    .node();
renderChart(container, data);
`;
  const source = importLine + '\n\n' + dataSource + logic.slice(importLine.length);
  return { logic, data: dataSource, source };
}

export function generateCode(type: ChartType, data: Row[], c: Config, locale: Locale = 'en'): string {
  return generateCodeParts(type, data, c, locale).source;
}

// The preview runs the exact exported source, only replacing its D3 import.
export function executableSource(source: string): string {
  return source.replace(importLine, '');
}
