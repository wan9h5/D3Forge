import type { Config, Row } from './model';
import type { CompositionType } from './compositionModel';
import type { Locale } from './i18n';
import { t } from './i18n';
import { codeComment } from './codeComments';
import { marginSource, appearanceSource } from './generatePresentation';
import type { CodeParts } from './generate';
const js=(value:unknown)=>JSON.stringify(value);
export function generateCompositionCode(type:CompositionType,data:Row[],c:Config,locale:Locale='en'):CodeParts {
  const text=(key:string)=>js(t(key,{},locale));
  const hierarchical=type==='nested-pie'||type==='pie-bar';
  const required=[c.categoryField,...(hierarchical?[c.parentField]:[]),...(type==='pie-matrix'?[c.matrixRowField,c.matrixColumnField]:[]),...(type==='bar-pie'?[c.sampleField]:[])];
  const importLine='import * as d3 from "d3";';
  const dataSource=`// ${codeComment('Replace this array with your own data. Keep the mapped field names.',locale)}\nconst data = ${JSON.stringify(data,null,2)};\n`;
  const start=c.arcStyle?c.startAngle:c.pieMode==='fan'?-90:0;
  const sweep=c.arcStyle?c.sweepAngle:c.pieMode==='fan'?180:360;
  const labelSize=c.labelStyle?c.labelFontSize:12;
  const scheme=c.compositionPalette==='category10'?'schemeCategory10':c.compositionPalette==='paired'?'schemePaired':'schemeTableau10';
  const colors=c.categoryColorsEnabled?`names.map((name, index) => customColors.has(name) ? customColors.get(name) : d3.${scheme}[index % ${c.compositionPalette==='paired'?12:10}])`:`d3.${scheme}`;
  const logic=`${importLine}

// ${codeComment('Call renderChart(container, data) in any Web project with D3 v7 installed.',locale)}
function renderChart(container, data) {
  d3.select(container)
    .selectAll("*")
    .remove();
  const width = ${c.width};
  const height = ${c.height};
  const margin = ${marginSource(type,data,c,{top:c.legend?64:28,right:36,bottom:44,left:36})};
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const root = d3.select(container)
    .style("position", "relative");
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(type)})
    .style("display", "block")
    .style("width", "100%")
    .style("background", ${js(c.canvasStyle?c.background:'white')})
    .style("font", "12px system-ui");
  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
  const marks = g.append("g")
    .attr("class", "marks");
  // ${codeComment('Nonnegative values are summed within each category; zero totals have no proportions.',locale)}
  const requiredFields = ${js(required)};
  const processedData = data.filter(d =>
    requiredFields.every(field => d[field] != null && String(d[field]).trim() !== "")
    && d[${js(c.valueField)}] != null
    && String(d[${js(c.valueField)}]).trim() !== ""
    && Number.isFinite(Number(d[${js(c.valueField)}]))
    && +d[${js(c.valueField)}] >= 0
  ).map(d => ({
    category: String(d[${js(c.categoryField)}]),
    parent: ${hierarchical?`String(d[${js(c.parentField)}])`:'""'},
    row: ${type==='pie-matrix'?`String(d[${js(c.matrixRowField)}])`:'""'},
    column: ${type==='pie-matrix'?`String(d[${js(c.matrixColumnField)}])`:'""'},
    sample: ${type==='bar-pie'?`String(d[${js(c.sampleField)}])`:'""'},
    value: +d[${js(c.valueField)}]
  }));
  if (!processedData.length) {
    marks.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .text("No valid rows for the selected fields.");
    return svg.node();
  }
  const total = d3.sum(processedData, d => d.value);
  if (!(total > 0) || !Number.isFinite(total)) {
    marks.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .text(${text('没有可计算占比的正数总量')});
    return svg.node();
  }
  const names = Array.from(new Set(processedData.map(d => ${hierarchical?'d.parent':'d.category'})));
${c.categoryColorsEnabled?`  const customColors = new Map(${js(Object.entries(c.categoryColors))});
`:''}  const color = d3.scaleOrdinal()
    .domain(names)
    .range(${colors});
  const number = d3.format(${js(c.labelStyle?c.valueFormat:'.3~g')});
  const percent = d3.format(".1%");
  function aggregate(rows) {
    const items = d3.rollups(rows, values => d3.sum(values, d => d.value), d => d.category)
      .map(([name, value]) => ({ name, category: name, value }));
${c.compositionOrder!=='input'?`    items.sort((a, b) => d3.${c.compositionOrder==='ascending'?'ascending':'descending'}(a.value, b.value));\n`:''}    return items;
  }
  function labelText(d) {
    return ${c.compositionLabelStyle&&c.labelContent==='category'?'d.name':c.compositionLabelStyle&&c.labelContent==='percent'?'percent(d.share)':'d.name + " " + percent(d.share)'};
  }
${type!=='waffle'?`  function drawPie(items, cx, cy, radius, innerRatio, context = "", from = ${start} * Math.PI / 180, to = ${(start+sweep)} * Math.PI / 180, fill = d => color(d.name), showLabels = true) {
    const sum = d3.sum(items, d => d.value);
    const pie = d3.pie()
      .sort(null)
      .value(d => d.value)
      .startAngle(from)
      .endAngle(to);
    const arcs = pie(items).map(d => ({ ...d, data: { ...d.data, share: sum ? d.data.value / sum : 0, context } }));
    const arc = d3.arc()
      .innerRadius(radius * innerRatio)
      .outerRadius(radius)
      .padAngle(${c.arcStyle?c.arcGap:.012})
      .cornerRadius(${c.arcStyle?c.arcCorner:0});
    const cell = marks.append("g")
      .attr("class", "pie-cell")
      .attr("transform", "translate(" + cx + ", " + cy + ")");
    if (!(sum > 0)) {
      cell.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("fill", "#687789")
        .text(${text('总量为零')});
      return [];
    }
    cell.selectAll("path.segment")
      .data(arcs)
      .join("path")
      .attr("class", "segment")
      .attr("d", arc)
      .attr("fill", d => fill(d.data))
      .attr("opacity", ${c.opacity})
      .attr("stroke", ${js(c.markBorder?c.borderColor:'#fff')})
      .attr("stroke-width", ${c.markBorder?c.borderWidth:1});
${c.labels?`    if (showLabels) {
      const visible = arcs.filter(d => d.data.value > 0 && d.data.share * 100 >= ${c.compositionLabelStyle?c.labelMinPercent:3});
${c.compositionLabelStyle&&c.labelPlacement==='outside'?`      const labelRadius = radius + 16;
      const side = d => Math.sin((d.startAngle + d.endAngle) / 2) >= 0 ? 1 : -1;
      const positions = new Map();
      for (const direction of [-1, 1]) {
        const ordered = visible.filter(d => side(d) === direction)
          .sort((a, b) => -Math.cos((a.startAngle + a.endAngle) / 2) + Math.cos((b.startAngle + b.endAngle) / 2));
        const step = Math.min(${labelSize+5}, 2 * radius / Math.max(1, ordered.length));
        let previousY = -radius - step;
        for (let index = 0; index < ordered.length; index++) {
          const d = ordered[index];
          const ideal = -Math.cos((d.startAngle + d.endAngle) / 2) * labelRadius;
          const y = Math.max(previousY + step, Math.min(radius - (ordered.length - 1 - index) * step, ideal));
          positions.set(d, [direction * labelRadius, y]);
          previousY = y;
        }
      }
${c.leaderLines?`      const leaderArc = d3.arc()
        .innerRadius(radius)
        .outerRadius(radius);
      cell.selectAll("polyline.label-leader")
        .data(visible)
        .join("polyline")
        .attr("class", "label-leader")
        .attr("points", d => [leaderArc.centroid(d), positions.get(d)].map(point => point.join(","))
        .join(" "))
        .attr("fill", "none")
        .attr("stroke", ${js(c.labelColor)})
        .attr("stroke-width", 1);
`:''}      cell.selectAll("text.pie-label")
        .data(visible)
        .join("text")
        .attr("class", "pie-label")
        .attr("x", d => positions.get(d)[0] + side(d) * 4)
        .attr("y", d => positions.get(d)[1])
        .attr("text-anchor", d => side(d) > 0 ? "start" : "end")
        .attr("fill", ${js(c.labelStyle?c.labelColor:'#39495b')})`:`      const labelArc = d3.arc()
        .innerRadius(radius * (innerRatio + 1) / 2)
        .outerRadius(radius * (innerRatio + 1) / 2);
      cell.selectAll("text.pie-label")
        .data(visible)
        .join("text")
        .attr("class", "pie-label")
        .attr("transform", d => "translate(" + labelArc.centroid(d) + ")")
        .attr("text-anchor", "middle")
        .attr("fill", ${js(c.labelStyle?c.labelColor:'#ffffff')})`}
        .attr("dominant-baseline", "middle")
        .attr("font-size", ${labelSize})
        .attr("dx", ${c.labelStyle?c.labelOffsetX:0})
        .attr("dy", ${c.labelStyle?c.labelOffsetY:0})
        .text(d => labelText(d.data));
    }
`:''}    return arcs;
  }
`:''}${renderSource(type,c,text)}
${c.centerTextEnabled&&type==='pie'&&c.pieMode!=='pie'?`  marks.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", ${c.labelStyle?c.labelFontSize:18})
    .attr("fill", ${js(c.labelColor)})
    .text(${c.centerText?js(c.centerText):'number(total)'});
`:''}${c.legend?`  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + margin.left + ", 22)");
  let legendX = 0, legendY = 0;
  const entries = legend.selectAll("g")
    .data(names)
    .join("g")
    .attr("transform", name => {
      const size = Array.from(name).reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 12 : 7.2), 0) + 34;
      if (legendX && legendX + size > innerW) { legendX = 0; legendY += 24; }
      const transform = "translate(" + legendX + ", " + legendY + ")";
      legendX += size;
      return transform;
    });
  entries.append("circle")
    .attr("r", 4)
    .attr("fill", color);
  entries.append("text")
    .attr("x", 10)
    .attr("y", 4)
    .attr("fill", "#52627b")
    .text(d => d);
`:''}${c.tooltip?`  const tooltip = root.append("div")
    .style("display", "none")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("white-space", "pre-line")
    .style("max-width", "calc(100% - 16px)")
    .style("overflow-wrap", "anywhere")
    .style("padding", "9px 12px")
    .style("background", "#162b3b")
    .style("color", "white")
    .style("border-radius", "6px")
    .style("font", "12px/1.6 system-ui");
  marks.selectAll(".segment, .unit, .total-bar, .detail-bar")
    .on("pointermove", function(event, datum) {
      const d = datum.data || datum;
      const lines = [d.context, d.name, ${text('数值')} + ": " + number(d.value)];
      if (d.share != null) lines.push(${text('占比')} + ": " + percent(d.share));
      if (d.units != null) lines.push(${text('显示单元')} + ": " + d.units);
      tooltip.style("display", "block")
        .text(lines.filter(Boolean)
        .join("\\n"));
      const [px, py] = d3.pointer(event, container);
      const node = tooltip.node();
      tooltip.style("left", Math.max(8, Math.min(px + 14, container.clientWidth - node.offsetWidth - 8)) + "px")
        .style("top", Math.max(8, Math.min(py - node.offsetHeight - 10, container.clientHeight - node.offsetHeight - 8)) + "px");
    })
    .on("pointerleave", () => tooltip.style("display", "none"));
`:''}${c.labelStyle?`  marks.selectAll("text")
    .attr("font-size", ${c.labelFontSize})
    .attr("fill", ${js(c.labelColor)})
    .attr("dx", ${c.labelOffsetX})
    .attr("dy", ${c.labelOffsetY});
`:''}${appearanceSource(type,{...c,xAxis:false,yAxis:false,axisStyle:false,grid:false,labels:false,markBorder:false,xDomainEnabled:false,yDomainEnabled:false,referenceXEnabled:false,referenceYEnabled:false},locale)}  return svg.node();
}

const container = document.querySelector("#chart")
  || d3.select("body")
    .append("div")
    .attr("id", "chart")
    .node();
renderChart(container, data);
`;
  return {logic,data:dataSource,source:importLine+'\n\n'+dataSource+logic.slice(importLine.length)};
}
function renderSource(type:CompositionType,c:Config,text:(key:string)=>string) {
  const inner=c.pieMode==='pie'?0:c.holeRatio;
  const outside=c.labels&&c.compositionLabelStyle&&c.labelPlacement==='outside';
  const radius=`Math.max(1, Math.min(innerW${outside?' * 0.65':''}, innerH) / 2 - ${outside?32:12})`;
  if(type==='pie')return `  drawPie(aggregate(processedData), innerW / 2, innerH / 2, ${radius}, ${inner});`;
  if(type==='pie-matrix')return `  const rows = Array.from(new Set(processedData.map(d => d.row)));
  const columns = Array.from(new Set(processedData.map(d => d.column)));
  const cellW = innerW / columns.length;
  const cellH = innerH / rows.length;
  const radius = Math.max(1, Math.min(cellW, cellH) / 2 - ${c.matrixGap});
  const grouped = d3.group(processedData, d => d.row, d => d.column);
  for (let row = 0; row < rows.length; row++) {
    for (let column = 0; column < columns.length; column++) {
      const values = grouped.get(rows[row])?.get(columns[column]);
      if (!values) continue;
      const cx = (column + 0.5) * cellW;
      const cy = (row + 0.5) * cellH;
      const context = rows[row] + " / " + columns[column];
      drawPie(aggregate(values), cx, cy, radius, ${inner}, context);
      marks.append("text")
        .attr("class", "cell-title")
        .attr("x", cx)
        .attr("y", cy + radius + 16)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("fill", "#687789")
        .text(context);
    }
  }`;
  if(type==='nested-pie'||type==='pie-bar')return `  const groups = d3.rollups(processedData, rows => ({value: d3.sum(rows, d => d.value), children: aggregate(rows)}), d => d.parent)
    .map(([name, summary]) => ({name, ...summary}));
${c.compositionOrder!=='input'?`  groups.sort((a, b) => d3.${c.compositionOrder==='ascending'?'ascending':'descending'}(a.value, b.value));\n`:''}${type==='nested-pie'?`  const radius = ${radius};
  const split = (${inner} + 1) / 2;
  const gapRatio = Math.min(${c.ringGap} / radius, 0.1);
  const parents = drawPie(groups, innerW / 2, innerH / 2, radius * (split - gapRatio), ${inner} / (split - gapRatio), "", undefined, undefined, d => color(d.name), false);
  for (const parent of parents) {
    const children = parent.data.children.map(d => ({...d, parent:parent.data.name}));
    drawPie(children, innerW / 2, innerH / 2, radius, split + gapRatio, parent.data.name, parent.startAngle, parent.endAngle,
      d => d3.interpolateRgb(color(parent.data.name), "#ffffff")(0.12 + children.findIndex(child => child.name === d.name) / Math.max(1, children.length) * 0.45));
  }`:`  const radius = Math.max(1, Math.min(innerW * 0.23, innerH / 2 - 20));
  const parents = drawPie(groups, innerW * 0.26, innerH / 2, radius, ${inner});
  const selected = groups.find(d => d.name === ${js(c.splitCategory)}) || groups[0];
  const children = selected.children;
  const bx = innerW * 0.62, bw = innerW * 0.32;
  const band = d3.scaleBand()
    .domain(children.map(d => d.name))
    .range([32, innerH - 24])
    .padding(${c.compositionBarGap});
  const value = d3.scaleLinear()
    .domain([0, d3.max(children, d => d.value) || 1])
    .range([0, bw]);
  marks.selectAll("rect.detail-bar")
    .data(children.map(d => ({...d, share: selected.value ? d.value / selected.value : 0, context: selected.name})))
    .join("rect")
    .attr("class", "detail-bar")
    .attr("x", bx)
    .attr("y", d => band(d.name))
    .attr("height", band.bandwidth())
    .attr("width", d => value(d.value))
    .attr("fill", color(selected.name))
    .attr("opacity", ${c.opacity})
    .attr("stroke", ${js(c.markBorder?c.borderColor:'none')})
    .attr("stroke-width", ${c.markBorder?c.borderWidth:0});
  marks.selectAll("text.detail-label")
    .data(children)
    .join("text")
    .attr("class", "detail-label")
    .attr("x", bx)
    .attr("y", d => band(d.name) - 3)
    .attr("fill", "#52627b")
    .text(d => d.name + " · " + number(d.value));
  marks.append("text")
    .attr("x", bx)
    .attr("y", 14)
    .attr("fill", "#39495b")
    .text(selected.name);
  const selectedArc = parents.find(d => d.data.name === selected.name);
  if (selectedArc) {
    const anchorArc = d3.arc()
      .innerRadius(radius)
      .outerRadius(radius);
    const anchor = anchorArc.centroid(selectedArc);
    marks.append("polyline")
      .attr("points", [[innerW * 0.26 + anchor[0], innerH / 2 + anchor[1]], [innerW * 0.55, innerH / 2], [bx - 8, innerH / 2]].map(d => d.join(","))
        .join(" "))
      .attr("fill", "none")
      .attr("stroke", color(selected.name))
      .attr("stroke-dasharray", "4,3");
  }`}`;
  if(type==='bar-pie')return `  const samples = d3.rollups(processedData, rows => ({value: d3.sum(rows, d => d.value), children: aggregate(rows)}), d => d.sample)
    .map(([name, summary]) => ({name, context: name, ...summary}));
  const x = d3.scaleBand()
    .domain(samples.map(d => d.name))
    .range([20, innerW - 20])
    .padding(${c.compositionBarGap});
  const pieRadius = Math.max(1, Math.min(x.bandwidth() * 0.42, innerH * 0.14));
  const baseline = innerH - 28;
  const y = d3.scaleLinear()
    .domain([0, d3.max(samples, d => d.value) || 1])
    .range([baseline, pieRadius * 2 + 32]);
  marks.selectAll("rect.total-bar")
    .data(samples)
    .join("rect")
    .attr("class", "total-bar")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => baseline - y(d.value))
    .attr("fill", ${js(c.color)})
    .attr("opacity", ${c.opacity})
    .attr("stroke", ${js(c.markBorder?c.borderColor:'none')})
    .attr("stroke-width", ${c.markBorder?c.borderWidth:0});
  for (const sample of samples) {
    const cx = x(sample.name) + x.bandwidth() / 2;
    drawPie(sample.children, cx, y(sample.value) - pieRadius - 8, pieRadius, ${inner}, sample.name);
    marks.append("text")
      .attr("x", cx)
      .attr("y", baseline + 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#52627b")
      .text(sample.name);
    marks.append("text")
      .attr("x", cx)
      .attr("y", y(sample.value) + 16)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(number(sample.value));
  }`;
  return `  // ${text('占比用最大余数法分配为固定数量单元，显示单元是近似值').slice(1,-1)}
  const items = aggregate(processedData);
  const unitCount = ${c.waffleRows*c.waffleColumns};
  const allocations = items.map((d, index) => {
    const exact = d.value / total * unitCount;
    return {...d, index, share: d.value / total, units: Math.floor(exact), remainder: exact - Math.floor(exact)};
  });
  const remaining = unitCount - d3.sum(allocations, d => d.units);
  const priority = [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < remaining; i++) priority[i].units++;
  const units = allocations.flatMap(d => Array.from({length:d.units}, () => d));
  const cell = Math.max(1, Math.min(innerW / ${c.waffleColumns}, innerH / ${c.waffleRows}));
  const size = Math.max(0.5, cell - ${c.waffleGap});
  const offsetX = (innerW - cell * ${c.waffleColumns}) / 2;
  const offsetY = (innerH - cell * ${c.waffleRows}) / 2;
  const tiles = marks.selectAll("g.unit")
    .data(units)
    .join("g")
    .attr("class", "unit")
    .attr("transform", (d, i) => "translate(" + (offsetX + i % ${c.waffleColumns} * cell + cell / 2) + ", " + (offsetY + Math.floor(i / ${c.waffleColumns}) * cell + cell / 2) + ")")
    .attr("fill", d => color(d.name))
    .attr("opacity", ${c.opacity})
    .attr("stroke", ${js(c.markBorder?c.borderColor:'none')})
    .attr("stroke-width", ${c.markBorder?c.borderWidth:0});
${c.waffleShape==='circle'?`  tiles.append("circle")
    .attr("r", size / 2);`:c.waffleShape==='person'?`  tiles.append("path")
    .attr("transform", "scale(" + size / 24 + ")")
    .attr("d", "M0,-12a3,3 0 1,1 0,6a3,3 0 1,1 0,-6M-3,-5L3,-5L7,3L4,4L2,0L2,12L0,12L0,5L-1,5L-1,12L-3,12L-3,0L-5,4L-7,3Z");`:`  tiles.append("rect")
    .attr("x", -size / 2)
    .attr("y", -size / 2)
    .attr("width", size)
    .attr("height", size)
    .attr("rx", ${c.arcStyle?c.arcCorner:1});`}
${c.labels?`  marks.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH + 24)
    .attr("text-anchor", "middle")
    .attr("font-size", ${c.labelStyle?c.labelFontSize:12})
    .attr("fill", ${js(c.labelColor)})
    .text(allocations.map(d => labelText(d))
        .join(" · "));`:''}`;
}
