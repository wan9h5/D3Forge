import { marginSource, axisOptions, scaleOverrides, appearanceSource } from './generatePresentation';
import { codeComment } from './codeComments';
import type { Locale } from './i18n';
import type { Config, Row } from './model';
import type { CodeParts } from './generate';
const js = (value: unknown) => JSON.stringify(value);

export function generateAdvancedCode(type: 'violin' | 'manhattan', data: Row[], c: Config, locale: Locale = 'en'): CodeParts {
  const violin = type === 'violin';
  const importLine = 'import * as d3 from "d3";';
  const dataSource = `// ${codeComment("Replace this array with your own data. Keep the mapped field names.", locale)}\nconst data = ${JSON.stringify(data, null, 2)};\n`;
  const logic = `${importLine}

// ${codeComment("Call renderChart(container, data) in any Web project with D3 v7 installed.", locale)}
function renderChart(container, data) {
  d3.select(container)
    .selectAll("*")
    .remove();
  const width = ${c.width};
  const height = ${c.height};
  const margin = ${marginSource(type,data,c,{top:c.legend?54:30,right:30,bottom:64,left:76})};
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const root = d3.select(container)
    .style("position", "relative");
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(violin ? 'Violin plot' : 'Manhattan plot')})
    .style("display", "block")
    .style("width", "100%")
    .style("background", ${js(c.canvasStyle?c.background:'white')})
    .style("font", "12px system-ui");
  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
  const numeric = value => value != null
    && String(value).trim() !== ""
    && Number.isFinite(Number(value));
${violin ? `  const processedData = data
    .filter(d => d[${js(c.xField)}] != null
      && String(d[${js(c.xField)}]).trim() !== ""
      && numeric(d[${js(c.yField)}])
    )
    .map((d, index) => ({
      ...d,
      _group: String(d[${js(c.xField)}]),
      _y: +d[${js(c.yField)}],
      _index: index
    }));`
: `  const chromosomeName = value => {
    const name = String(value).trim().replace(/^chr/i, "").trim().toUpperCase();
    if (name === "M") return "MT";
    return /^0*\\d+$/.test(name) ? String(Number(name)) : name;
  };
  const processedData = data
    .filter(d => numeric(d[${js(c.xField)}])
      && +d[${js(c.xField)}] >= 0
      && numeric(d[${js(c.yField)}])
      && +d[${js(c.yField)}] > 0
      && +d[${js(c.yField)}] <= 1
      && d[${js(c.chromosomeField)}] != null
      && chromosomeName(d[${js(c.chromosomeField)}]) !== ""
    )
    .map(d => ({
      ...d,
      _chromosome: chromosomeName(d[${js(c.chromosomeField)}]),
      _position: +d[${js(c.xField)}],
      _p: +d[${js(c.yField)}],
      _y: -Math.log10(+d[${js(c.yField)}])
    }));`}
  if (!processedData.length) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .text("No valid rows for the selected fields.");
    return svg.node();
  }

${violin ? `  // ${codeComment("Robust normal-reference bandwidth; fall back for singleton/constant groups.", locale)}
  const summaries = d3.groups(processedData, d => d._group)
    .map(([group, rows]) => {
      const values = rows.map(d => d._y)
        .sort(d3.ascending);
      const q1 = d3.quantileSorted(values, 0.25);
      const median = d3.quantileSorted(values, 0.5);
      const q3 = d3.quantileSorted(values, 0.75);
      const iqr = q3 - q1;
      const deviation = d3.deviation(values) || 0;
      const spread = iqr > 0 && deviation > 0
        ? Math.min(deviation, iqr / 1.34)
        : deviation;
      const automatic = spread > 0
        ? 0.9 * spread * Math.pow(values.length, -0.2)
        : Math.max(Math.abs(median) * 0.05, 1);
      const bandwidth = automatic * ${c.bandwidthFactor};
      const inside = values.filter(value => value >= q1 - 1.5 * iqr && value <= q3 + 1.5 * iqr);
      return {
        group, rows, values, q1, median, q3, bandwidth,
        low: d3.min(inside),
        high: d3.max(inside)
      };
    });
  const groups = summaries.map(d => d.group);
  const x = d3.scaleBand()
    .domain(groups)
    .range([0, innerW])
    .padding(0.25);
  const y = d3.scaleLinear()
    .domain([
      d3.min(summaries, d => d.values[0] - d.bandwidth),
      d3.max(summaries, d => d.values[d.values.length - 1] + d.bandwidth)
    ])
    .nice()
    .range([innerH, 0]);
  const color = d3.scaleOrdinal()
    .domain(groups)
    .range([${js(c.color)}, "#48a58a", "#e6ad43", "#8b79bd", "#d87867"]);
  // ${codeComment("Epanechnikov KDE: mean(0.75 * (1 - u\u00b2) / bandwidth), for |u| <= 1.", locale)}
  for (const summary of summaries) {
    // ${codeComment("Sample each group's own support so narrow groups cannot disappear.", locale)}
    const low = summary.values[0] - summary.bandwidth;
    const high = summary.values[summary.values.length - 1] + summary.bandwidth;
    const samples = d3.range(${c.chartStyle?c.violinSamples:81}).map(index => low + (high - low) * index / ${c.chartStyle?c.violinSamples-1:80});
    summary.density = samples.map(value => [value, d3.mean(summary.values, observation => {
      const u = (value - observation) / summary.bandwidth;
      return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) / summary.bandwidth : 0;
    })]);
    summary.peak = d3.max(summary.density, d => d[1]);
  }
  const maximumDensity = d3.max(summaries, d => d.peak) || 1;
  const halfWidth = x.bandwidth() * ${c.chartStyle?c.violinWidth:.45};
  const violinWidth = (summary, density) => density / (${c.violinScale === 'width' ? 'summary.peak || 1' : 'maximumDensity'}) * halfWidth;
  const legendItems = groups.map(name => ({ name, color: color(name) }));
` : `  // ${codeComment("Sort autosomes numerically, then X/Y/MT, then other contigs naturally.", locale)}
  const rank = name => /^\\d+$/.test(name)
    ? [0, Number(name)] : [1, ({ X: 0, Y: 1, MT: 2 }[name] ?? 3)];
  const names = Array.from(new Set(processedData.map(d => d._chromosome)))
    .sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      return ra[0] - rb[0] || ra[1] - rb[1]
        || a.localeCompare(b, undefined, { numeric: true });
    });
  const byChromosome = d3.group(processedData, d => d._chromosome);
  // ${codeComment("Observed maximum positions define lengths; no reference genome is assumed.", locale)}
  const lengths = names.map(name => Math.max(1, d3.max(byChromosome.get(name), d => d._position)));
  const gap = d3.mean(lengths) * ${c.chromosomeGap};
  let offset = 0;
  const chromosomes = names.map((name, index) => {
    const length = lengths[index];
    const chromosome = { name, index, offset, length, midpoint: offset + length / 2 };
    offset += length + gap;
    return chromosome;
  });
  const layout = new Map(chromosomes.map(d => [d.name, d]));
  for (const row of processedData) {
    row._x = layout.get(row._chromosome).offset + row._position;
  }
  const x = d3.scaleLinear()
    .domain([0, offset - gap])
    .range([0, innerW]);
  const significance = ${c.pThreshold};
  const thresholdY = -Math.log10(significance);
  const suggestiveY = -Math.log10(${c.suggestiveThreshold});
  const y = d3.scaleLinear()
    .domain([0, Math.max(1, d3.max(processedData, d => d._y)${c.showThreshold ? ', thresholdY' : ''}${c.showSuggestive ? ', suggestiveY' : ''})])
    .nice()
    .range([innerH, 0]);
  const color = d => d._p <= significance ? ${js(c.significantColor)}
    : layout.get(d._chromosome).index % 2 === 0 ? ${js(c.color)} : ${js(c.secondaryColor)};
  const legendItems = [
    { name: "Chromosome group A", color: ${js(c.color)} },
    { name: "Chromosome group B", color: ${js(c.secondaryColor)} },
    { name: "Significant", color: ${js(c.significantColor)} }
  ];
`}
${scaleOverrides(type,c,locale)}${c.grid ? `  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)${axisOptions(type,c,'y')}
      .ticks(${c.axisStyle?c.yTickCount:6})
      .tickSize(-innerW)
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
    .call(d3.axisBottom(x)${axisOptions(type,c,'x')}${violin ? '' : `
      .tickValues(chromosomes.map(d => d.midpoint))
      .tickFormat((value, index) => chromosomes[index].name)`}
    );
  svg.append("text")
    .attr("class", "axis-title axis-title-x")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .attr("fill", "#465568")
    .text(${js(violin ? c.xField : c.chromosomeField)});
` : ''}${c.yAxis ? `  const yAxis = g.append("g")
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
    .text(${js(violin ? c.yField : `−log10(${c.yField})`)});
` : ''}  const marks = g.append("g")
    .attr("class", "marks");
${violin ? `  const violins = marks.selectAll("path.violin")
    .data(summaries)
    .join("path")
    .attr("class", "violin")
    .attr("transform", d => "translate(" + (x(d.group) + x.bandwidth() / 2) + ", 0)")
    .attr("d", summary => d3.area()
      .x0(d => -violinWidth(summary, d[1]))
      .x1(d => violinWidth(summary, d[1]))
      .y(d => y(d[0]))
      .curve(d3.curveLinear)(summary.density)
    )
    .attr("fill", d => color(d.group))
    .attr("fill-opacity", ${c.opacity})
    .attr("stroke", d => color(d.group))
    .attr("stroke-width", 1.3);
${c.violinInner !== 'none' ? `  const summariesSelection = marks.selectAll("g.summary")
    .data(summaries)
    .join("g")
    .attr("class", "summary")
    .attr("transform", d => "translate(" + (x(d.group) + x.bandwidth() / 2) + ", 0)")
    .attr("pointer-events", "none");
${c.violinInner === 'box' ? `  summariesSelection.append("line")
    .attr("y1", d => y(d.low))
    .attr("y2", d => y(d.high))
    .attr("stroke", "#26394c")
    .attr("stroke-width", 1.5);
  summariesSelection.append("rect")
    .attr("x", -5)
    .attr("width", 10)
    .attr("y", d => y(d.q3))
    .attr("height", d => Math.max(1, y(d.q1) - y(d.q3)))
    .attr("rx", 2)
    .attr("fill", "#26394c");
` : ''}  summariesSelection.append("line")
    .attr("x1", -7)
    .attr("x2", 7)
    .attr("y1", d => y(d.median))
    .attr("y2", d => y(d.median))
    .attr("stroke", ${c.chartStyle?js(c.medianColor):c.violinInner === 'box' ? '"white"' : '"#26394c"'})
    .attr("stroke-width", ${c.chartStyle?c.medianWidth:2.5});
` : ''}${c.showPoints ? `  // ${codeComment("Deterministic jitter keeps observations still when controls change.", locale)}
  const points = marks.selectAll("circle.observation")
    .data(processedData)
    .join("circle")
    .attr("class", "observation")
    .attr("cx", d => x(d._group) + x.bandwidth() / 2
      + (((d._index + 1) * 0.61803398875 % 1) - 0.5) * x.bandwidth() * ${c.chartStyle?c.jitterWidth:.55}
    )
    .attr("cy", d => y(d._y))
    .attr("r", ${c.radius})
    .attr("fill", "#26394c")
    .attr("opacity", ${c.opacity});
` : ''}` : `  const points = marks.selectAll("circle")
    .data(processedData)
    .join("circle")
    .attr("cx", d => x(d._x))
    .attr("cy", d => y(d._y))
    .attr("r", ${c.radius})
    .attr("fill", color)
    .attr("opacity", ${c.opacity});
${c.showThreshold ? `  g.append("line")
    .attr("class", "significance-threshold")
    .attr("x2", innerW)
    .attr("y1", y(thresholdY))
    .attr("y2", y(thresholdY))
    .attr("stroke", ${js(c.chartStyle?c.thresholdColor:c.significantColor)})
    .attr("stroke-width", ${c.chartStyle?c.thresholdWidth:1})
    .attr("stroke-dasharray", ${js(c.chartStyle?c.thresholdDash:'6,4')})
    .attr("pointer-events", "none");
  g.append("text")
    .attr("x", innerW - 4)
    .attr("y", y(thresholdY) - 6)
    .attr("text-anchor", "end")
    .attr("fill", "#87661f")
    .attr("pointer-events", "none")
    .text("p = " + significance);
` : ''}${c.showSuggestive ? `  g.append("line")
    .attr("class", "suggestive-threshold")
    .attr("x2", innerW)
    .attr("y1", y(suggestiveY))
    .attr("y2", y(suggestiveY))
    .attr("stroke", ${js(c.chartStyle?c.thresholdColor:'#95a5bd')})
    .attr("stroke-width", ${c.chartStyle?c.thresholdWidth:1})
    .attr("stroke-dasharray", ${js(c.chartStyle?c.thresholdDash:'3,4')})
    .attr("pointer-events", "none");
` : ''}${c.labels ? `  // ${codeComment("Label the strongest significant associations, with a configurable limit.", locale)}
  const labelRows = processedData.filter(d => d._p <= significance)
    .slice()
    .sort((a, b) => d3.ascending(a._p, b._p))
    .slice(0, ${c.labelLimit});
  marks.selectAll("text.label")
    .data(labelRows)
    .join("text")
    .attr("class", "label")
    .attr("x", d => x(d._x) + ${c.radius + 4})
    .attr("y", d => y(d._y) - 6)
    .attr("fill", "#465568")
    .attr("pointer-events", "none")
    .text(d => String(d[${js(c.labelField)}] ?? ""));
` : ''}`}
${c.tooltip ? `  const tooltip = root.append("div")
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
  const showTooltip = (event, text) => {
    const [px, py] = d3.pointer(event, root.node());
    tooltip.text(text)
      .style("display", "block");
    tooltip.style("left", Math.max(0, Math.min(px + 12,
      root.node().clientWidth - tooltip.node().offsetWidth)) + "px")
      .style("top", Math.max(0, py - tooltip.node().offsetHeight - 10) + "px");
  };
${violin ? `  violins.on("pointermove", (event, d) => showTooltip(event,
    String(d.group) + "\\nN: " + d.values.length
      + "\\nQ1: " + d3.format(".4~g")(d.q1)
      + "\\nMedian: " + d3.format(".4~g")(d.median)
      + "\\nQ3: " + d3.format(".4~g")(d.q3)
      + "\\nBandwidth: " + d3.format(".4~g")(d.bandwidth)
  ))
    .on("pointerleave", () => tooltip.style("display", "none"));
` : ''}${!violin || c.showPoints ? `  const tooltipFields = ${js(c.tooltipFields)};
  points.on("pointermove", (event, d) => showTooltip(event,
    tooltipFields.map(field => field + ": " + String(d[field] ?? ""))
      .join("\\n")
  ))
    .on("pointerleave", () => tooltip.style("display", "none"));
` : ''}` : ''}
${c.legend ? `  const legend = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", 22)");
  let legendX = 0;
  for (const entry of legendItems) {
    const item = legend.append("g")
      .attr("transform", "translate(" + legendX + ", 0)");
    item.append("circle")
      .attr("r", 4)
      .attr("fill", entry.color);
    const text = item.append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("fill", "#465568")
      .text(entry.name);
    const estimatedWidth = Array.from(String(entry.name)).reduce((sum, character) =>
      sum + (character.charCodeAt(0) > 255 ? 12 : 7), 0
    );
    legendX += Math.max(text.node().getComputedTextLength(), estimatedWidth) + 30;
  }
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
