import { vividPalette } from './chartColors';
import type { Config, Row } from './model';
import type { Locale } from './i18n';
import type { CodeParts } from './generate';
import { heatmapMathSource } from './heatmapMath';
import { codeComment } from './codeComments';
const js=(v:unknown)=>JSON.stringify(v);
export function generateHeatmapCode(data:Row[],c:Config,locale:Locale):CodeParts {
 const mode=c.heatmapVariant,calendar=mode==='calendar',circular=mode==='circular',split=mode==='split',sankey=mode==='sankey';
 const tr=(en:string,zh:string,ja:string)=>locale==='zh'?zh:locale==='ja'?ja:en;
 const dataSource=`// ${codeComment('Replace this array with your own data. Keep the mapped field names.',locale)}
const data = ${JSON.stringify(data,null,2)};
`;
 const logic=`import * as d3 from "d3";

// ${tr('Population z-scores ignore missing values. Constant observed vectors become zero.','总体标准差 Z-score 忽略缺失值，常量观测向量转换为零。','母標準偏差による Z スコアは欠損を除外し、定数ベクトルをゼロにします。')}
// ${tr('Agglomeration uses original pairwise distances; no overlapping observations join last.','凝聚聚类使用原始两两距离，无共同观测的分支最后连接。','凝集は元のペア距離を使用し、共通観測のない枝は最後に連結します。')}
${heatmapMathSource}
// ${codeComment('Call renderChart(container, data) in any Web project with D3 v7 installed.',locale)}
function renderChart(container, data) {
  const root = d3.select(container)
    .style("position", "relative");
  root.selectAll("*")
    .remove();
  const width = ${c.width}, height = ${c.height};
  const fontSize = ${c.heatmapFontSize};
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(tr('Heatmap','热图','ヒートマップ'))})
    .style("display", "block")
    .style("width", "100%")
    .style("font", fontSize + "px system-ui")
    .style("background", ${js(c.canvasStyle?c.background:'white')});
  const numeric = value => value != null && String(value).trim() !== "" && Number.isFinite(Number(value));
  const validDate = value => {
    const s = String(value ?? "");
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) return false;
    const date = new Date(s + "T00:00:00Z");
    return Number.isFinite(+date) && date.toISOString().slice(0, 10) === s;
  };
  const input = data.filter(d => numeric(d[${js(c.valueField)}]) && ${calendar?`validDate(d[${js(c.heatmapDateField)}])`:`[${js(c.xField)}, ${js(c.yField)}].every(f => d[f] != null && String(d[f]).trim() !== "")`}${split?` && d[${js(c.heatmapSplitField)}] != null && String(d[${js(c.heatmapSplitField)}]).trim() !== ""`:''});
  function message(text) { svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .text(text); }
  if (!input.length) { message(${js(tr('No valid observations for these fields.','所选字段没有有效观测。','選択列に有効な観測がありません。'))}); return svg.node(); }
  const aggregate = values => d3.${c.heatmapAggregate}(values);
  const missingColor = ${js(c.heatmapMissing)};
  const tooltip = root.append("div")
    .style("display", "none")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("white-space", "pre-line")
    .style("overflow-wrap", "anywhere")
    .style("max-width", "calc(100% - 16px)")
    .style("background", "#172b41")
    .style("color", "white")
    .style("padding", "8px 10px")
    .style("border-radius", "6px");
  function tip(selection, content) {
    ${c.tooltip?`selection.on("pointermove", function(event, d) {
      const p = d3.pointer(event, root.node());
      tooltip.style("display", "block")
        .text(content(d));
      const box = tooltip.node().getBoundingClientRect();
      tooltip.style("left", Math.max(0, Math.min(p[0] + 12, root.node().clientWidth - box.width)) + "px")
        .style("top", Math.max(0, p[1] - box.height - 8) + "px");
    }).on("pointerleave", () => tooltip.style("display", "none"));`:''}
  }
  function makeColor(values) {
    let [lo, hi] = ${c.colorDomainEnabled?js([c.colorMin,c.colorMax]):'d3.extent(values)'};
    if (lo == null || hi == null) { lo = 0; hi = 1; }
    if (lo === hi) { const pad = Math.abs(lo) * .05 || 1; lo -= pad; hi += pad; }
    ${c.heatmapPalette==='diverging'?`const limit = Math.max(Math.abs(lo), Math.abs(hi)); lo = -limit; hi = limit;`:''}
    return d3.scaleLinear()
      .domain(${c.heatmapPalette==='diverging'?'[lo, 0, hi]':'[lo, hi]'})
      .range(${c.heatmapPalette==='diverging'?js([c.secondaryColor,'#f7f9fc',c.color]):js([c.secondaryColor,c.color])})
      .clamp(true);
  }
  function legend(color) {
    ${c.legend?`const domain = color.domain(), lo = domain[0], hi = domain[domain.length - 1];
    const w = Math.min(200, width * .28), x = width - w - 20;
    const swatches = svg.append("g")
      .attr("class", "color-legend")
      .attr("transform", "translate(" + x + ",20)");
    swatches.selectAll("rect")
      .data(d3.range(60))
      .join("rect")
      .attr("x", d => d * w / 60)
      .attr("width", w / 60 + .2)
      .attr("height", 9)
      .attr("fill", d => color(lo + (hi - lo) * d / 59));
    swatches.append("text")
      .attr("y", -5)
      .text(${js(c.heatmapLegendTitle||c.valueField+(c.heatmapNormalize!=='none'&&!calendar?' · Z-score':''))});
    swatches.append("text")
      .attr("y", 24)
      .text(d3.format(".3~g")(lo));
    swatches.append("text")
      .attr("x", w)
      .attr("y", 24)
      .attr("text-anchor", "end")
      .text(d3.format(".3~g")(hi));`:''}
  }
${calendar?calendarSource(c,tr):matrixSource(c,tr,circular,split,sankey)}
  return svg.node();
}
const container = document.querySelector("#chart") || d3.select("body")
  .append("div")
  .attr("id", "chart")
  .node();
renderChart(container, data);
`;
 return {logic,data:dataSource,source:'import * as d3 from "d3";\n\n'+dataSource+logic.slice('import * as d3 from "d3";'.length)};
}
type Translate=(en:string,zh:string,ja:string)=>string;
function calendarSource(c:Config,tr:Translate){return `
  // ${tr('UTC calendar dates avoid daylight-saving shifts; missing days are not zero.','UTC 日历日期避免夏令时偏移，缺失日期不是零。','UTC 日付で夏時間のずれを避け、欠損日をゼロにしません。')}
  const cells = d3.rollups(input, rows => aggregate(rows.map(d => +d[${js(c.valueField)}])), d => String(d[${js(c.heatmapDateField)}]))
    .map(([date, value]) => ({date:new Date(date + "T00:00:00Z"), value}));
  const allYears = Array.from(new Set(cells.map(d => d.date.getUTCFullYear()))).sort(d3.ascending);
  const years = ${js(c.heatmapCalendarYear)} ? allYears.filter(y => String(y) === ${js(c.heatmapCalendarYear)}) : allYears;
  if (!years.length) { message(${js(tr('No observations in the selected year.','所选年份没有观测。','選択年に観測がありません。'))}); return svg.node(); }
  const color = makeColor(cells.map(d => d.value));
  legend(color);
  const interval = d3.${c.heatmapWeekStart==='monday'?'utcMonday':'utcSunday'};
  const panelH = (height - 75) / years.length;
  const size = Math.max(1, Math.min((width - 90) / 54, (panelH - 35) / 7));
  years.forEach((year, index) => {
    const start = new Date(0);
    start.setUTCFullYear(year, 0, 1);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCFullYear(year + 1);
    const firstWeek = interval.floor(start);
    const g = svg.append("g")
      .attr("transform", "translate(65," + (75 + index * panelH) + ")");
    const week = date => interval.count(firstWeek, date);
    const day = date => (date.getUTCDay() + ${c.heatmapWeekStart==='monday'?6:0}) % 7;
    g.append("text")
      .attr("x", -45)
      .attr("y", size * 3.5)
      .text(year);
    g.selectAll("rect.day-background")
      .data(d3.utcDay.range(start, end))
      .join("rect")
      .attr("class", "day-background")
      .attr("x", d => week(d) * size)
      .attr("y", d => day(d) * size)
      .attr("width", Math.max(.5, size - 1))
      .attr("height", Math.max(.5, size - 1))
      .attr("fill", missingColor);
    const marks = g.selectAll("rect.cell")
      .data(cells.filter(d => d.date.getUTCFullYear() === year))
      .join("rect")
      .attr("class", "cell point")
      .attr("x", d => week(d.date) * size)
      .attr("y", d => day(d.date) * size)
      .attr("width", Math.max(.5, size - 1))
      .attr("height", Math.max(.5, size - 1))
      .attr("rx", ${c.cellRadius})
      .attr("opacity", ${c.opacity})
      .attr("fill", d => color(d.value));
    tip(marks, d => d.date.toISOString().slice(0, 10) + "\\n" + d.value);
    ${c.xAxis?`g.selectAll("text.month")
      .data(d3.utcMonth.range(start, end))
      .join("text")
      .attr("class", "month")
      .attr("x", d => week(d) * size)
      .attr("y", -8)
      .text(d => d.getUTCMonth() + 1);`:''}
    ${c.yAxis?`g.selectAll("text.weekday")
      .data(${js((c.heatmapWeekStart==='monday'?[1,2,3,4,5,6,0]:[0,1,2,3,4,5,6]).map(i=>[tr('Sun','日','日'),tr('Mon','一','月'),tr('Tue','二','火'),tr('Wed','三','水'),tr('Thu','四','木'),tr('Fri','五','金'),tr('Sat','六','土')][i]))})
      .join("text")
      .attr("class", "weekday")
      .attr("x", -6)
      .attr("y", (_, i) => (i + .7) * size)
      .attr("text-anchor", "end")
      .text(d => d);`:''}
  });
`;}
function matrixSource(c:Config,tr:Translate,circular:boolean,split:boolean,sankey:boolean){return `
  // ${tr('Aggregate within a panel and coordinate. Original records supply annotations only.','按面板与坐标汇总，原始记录独立提供注释。','面板と座標ごとに集計し、元の記録から注釈を読みます。')}
  const cohorts = ${split?`Array.from(new Set(input.map(d => String(d[${js(c.heatmapSplitField)}]))))`:'["All"]'};
  const selected = ${split?`Array.from(new Set([${js(c.heatmapSplitA)} || cohorts[0], ${js(c.heatmapSplitB)} || cohorts.find(d => d !== (${js(c.heatmapSplitA)} || cohorts[0]))].filter(Boolean)))`:'cohorts'};
  const observed = input.filter(d => selected.includes(${split?`String(d[${js(c.heatmapSplitField)}])`:'"All"'}));
  if (!observed.length) { message(${js(tr('No observations in the selected groups.','所选分组没有观测。','選択群に観測がありません。'))}); return svg.node(); }
  let rowNames = Array.from(new Set(observed.map(d => String(d[${js(c.yField)}]))));
  const columnKeys = [];
  selected.forEach(panel => Array.from(new Set(observed.filter(d => ${split?`String(d[${js(c.heatmapSplitField)}]) === panel`:'true'}).map(d => String(d[${js(c.xField)}])))).forEach(name => columnKeys.push({panel,name})));
  const records = d3.rollup(observed, rows => rows, d => ${split?`String(d[${js(c.heatmapSplitField)}])`:'"All"'}, d => String(d[${js(c.yField)}]), d => String(d[${js(c.xField)}]));
  const getRows = (row, column) => records.get(column.panel)?.get(row)?.get(column.name) || [];
  const rawMatrix = rowNames.map(row => columnKeys.map(column => { const rows = getRows(row, column); return rows.length ? aggregate(rows.map(d => +d[${js(c.valueField)}])) : null; }));
  const matrix = normalizeMatrix(rawMatrix, ${js(c.heatmapNormalize)});
  const rowTree = clusterMatrix(rowNames, matrix, ${js(c.heatmapDistance)}, ${js(c.heatmapLinkage)});
  const transpose = columnKeys.map((_,i) => matrix.map(row => row[i]));
  const columnTree = clusterMatrix(columnKeys.map(d => d.name), transpose, ${js(c.heatmapDistance)}, ${js(c.heatmapLinkage)});
  let rowOrder = ${c.heatmapRowCluster||c.heatmapCutEnabled||c.heatmapTrend?'rowTree.leaves.slice()':'d3.range(rowNames.length)'};
  let columnOrder = ${c.heatmapColumnCluster&&!split?'columnTree.leaves.slice()':'d3.range(columnKeys.length)'};
  ${c.rowOrder!=='input'&&!c.heatmapRowCluster&&!c.heatmapCutEnabled&&!c.heatmapTrend?`rowOrder.sort((a,b) => d3.${c.rowOrder==='ascending'?'ascending':'descending'}(rowNames[a], rowNames[b]));`:''}
  ${c.columnOrder!=='input'&&!c.heatmapColumnCluster?`columnOrder.sort((a,b) => selected.indexOf(columnKeys[a].panel) - selected.indexOf(columnKeys[b].panel) || d3.${c.columnOrder==='ascending'?'ascending':'descending'}(columnKeys[a].name, columnKeys[b].name));`:''}
  ${split&&c.heatmapColumnCluster?`columnOrder = selected.flatMap(panel => {const ids = d3.range(columnKeys.length).filter(i => columnKeys[i].panel === panel); const tree = clusterMatrix(ids, ids.map(i => transpose[i]), ${js(c.heatmapDistance)}, ${js(c.heatmapLinkage)});return tree ? tree.leaves.map(i => ids[i]) : [];});`:''}
  const clusters = cutTree(rowTree, ${c.heatmapCutEnabled||c.heatmapTrend?c.heatmapCut:1});
  const membership = new Map(clusters.flatMap((part,i) => part.leaves.map(r => [r,i])));
  const clusterColor = d3.scaleOrdinal(${js(vividPalette)});
  const extras = rows => {
    const fields = Object.keys(rows[0] || {}), result = {};
    fields.forEach(field => { const values = Array.from(new Set(rows.map(d => d[field]).filter(v => v != null && String(v).trim() !== "")));result[field] = values.length > 1 ? "mixed" : values[0]; });
    return result;
  };
  const secondMatrix = normalizeMatrix(rowNames.map(row => columnKeys.map(column => {const values = getRows(row,column).map(d => d[${js(c.heatmapSecondField)}]).filter(numeric).map(Number);return values.length ? aggregate(values) : null;})), ${js(c.heatmapNormalize)});
  const cells = rowOrder.flatMap(r => columnOrder.map(col => {
    const rows = getRows(rowNames[r], columnKeys[col]);
    const sizes = rows.map(d => d[${js(c.heatmapSizeField)}]).filter(numeric).map(Number);
    return {r, col, row:rowNames[r], column:columnKeys[col].name, panel:columnKeys[col].panel, value:matrix[r][col], raw:rawMatrix[r][col], second:secondMatrix[r][col], size:sizes.length && sizes.every(v => v >= 0) ? d3.mean(sizes) : null, mark:Array.from(new Set(rows.map(d => String(d[${js(c.heatmapMarkField)}] ?? "")).filter(Boolean)))
      .join(" "), records:rows};
  }));
  const color = makeColor(cells.flatMap(d => [d.value${c.heatmapDualTriangle?',d.second':''}]).filter(v => v != null));
  ${c.heatmapTriangle!=='full'?`if (rowNames.length !== columnKeys.length || rowNames.some(row => !columnKeys.some(col => col.name === row))) {message(${js(tr('Triangular views require matching row and column categories.','上下三角显示要求行列分类名称一致。','上下三角表示には行と列のカテゴリ名一致が必要です。'))});return svg.node();}`:''}
  legend(color);
  const wanted = new Set(${js(c.heatmapGeneList)}.split(/[,;\\n]+/).map(d => d.trim()).filter(Boolean));
  const variance = r => { const values = rawMatrix[r].filter(v => v != null), mean = d3.mean(values); return d3.mean(values, v => (v - mean) ** 2) || 0; };
  const labelRows = ${c.heatmapPartialLabels?`new Set(rowOrder.filter(r => !wanted.size || wanted.has(rowNames[r])).sort((a,b) => wanted.size ? 0 : variance(b) - variance(a)).slice(0, ${c.heatmapLabelLimit}))`:'new Set(rowOrder)'};
${circular?circularSource(c):rectangularSource(c,tr,split,sankey)}
`;}
function circularSource(c:Config){return `
  const cx = width / 2, cy = (height + 50) / 2, outer = Math.max(10, Math.min(width - 150, height - 145) / 2);
  const inner = outer * ${c.heatmapInnerRadius};
  const angle = d3.scaleBand()
    .domain(rowOrder)
    .range([${c.heatmapStartAngle} * Math.PI / 180, ${c.heatmapEndAngle} * Math.PI / 180]);
  const radius = d3.scaleBand()
    .domain(columnOrder)
    .range([inner, outer]);
  const g = svg.append("g")
    .attr("transform", "translate(" + cx + "," + cy + ")");
  const arc = d3.arc()
    .innerRadius(d => radius(d.col))
    .outerRadius(d => radius(d.col) + radius.bandwidth() - Math.min(${c.cellGap}, radius.bandwidth() * .5))
    .startAngle(d => angle(d.r))
    .endAngle(d => angle(d.r) + angle.bandwidth() * .96);
  const marks = g.selectAll("path.cell")
    .data(cells)
    .join("path")
    .attr("class", "cell point")
    .attr("d", arc)
    .attr("fill", d => d.value == null ? missingColor : color(d.value))
    .attr("opacity", ${c.opacity});
  tip(marks, d => d.row + " / " + d.column + "\\n" + (d.value == null ? "—" : d3.format(".3~g")(d.value)));
  ${c.yAxis?`g.selectAll("text.gene")
    .data(rowOrder.filter(r => labelRows.has(r)))
    .join("text")
    .attr("class", "gene")
    .attr("transform", r => {const a = angle(r) + angle.bandwidth() / 2; return "rotate(" + (a * 180 / Math.PI - 90) + ")translate(" + (outer + 7) + ",0)rotate(" + (Math.sin(a) < 0 ? 180 : 0) + ")";})
    .attr("text-anchor", r => Math.sin(angle(r) + angle.bandwidth() / 2) < 0 ? "end" : "start")
    .attr("dy", ".32em")
    .text(r => rowNames[r]);`:''}
  ${c.xAxis?`g.selectAll("text.sample")
    .data(columnOrder)
    .join("text")
    .attr("class", "sample")
    .attr("x", col => Math.sin(${c.heatmapEndAngle} * Math.PI / 180 + .04) * (radius(col) + radius.bandwidth() / 2))
    .attr("y", col => -Math.cos(${c.heatmapEndAngle} * Math.PI / 180 + .04) * (radius(col) + radius.bandwidth() / 2))
    .attr("font-size", Math.min(fontSize, Math.max(7,radius.bandwidth() * .7)))
    .text(col => columnKeys[col].name);`:''}
  ${c.heatmapDendrogram&&c.heatmapRowCluster?`function radialNode(node) {
    const a = d3.mean(node.leaves, r => angle(r) + angle.bandwidth() / 2);
    const r = inner * .92 * (1 - node.height / (rowTree.height || 1));
    return [Math.sin(a) * r, -Math.cos(a) * r];
  }
  function drawRadial(node) {
    if (!node.children) return;
    const p = radialNode(node);
    node.children.forEach(child => {const q = radialNode(child);g.append("path")
      .attr("class", "dendrogram")
      .attr("d", "M" + p + "L" + q)
      .attr("fill", "none")
      .attr("stroke", "#7b8796")
      .attr("stroke-width", 1); drawRadial(child);});
  }
  drawRadial(rowTree);`:''}
`;}
function rectangularSource(c:Config,tr:Translate,split:boolean,sankey:boolean){return `
  const rowFields = ${c.heatmapRowAnnotations?js(c.heatmapRowFields):'""'}.split(",").map(d => d.trim()).filter(Boolean);
  const columnFields = ${c.heatmapColumnAnnotations?js(c.heatmapColumnFields):'""'}.split(",").map(d => d.trim()).filter(Boolean);
  const treeW = ${c.heatmapRowCluster&&c.heatmapDendrogram?54:0}, treeH = ${c.heatmapColumnCluster&&c.heatmapDendrogram?46:0};
  const track = 11, cutW = ${c.heatmapCutEnabled?10:0};
  const left = 88 + treeW + rowFields.length * track + cutW;
  const top = 75 + treeH + columnFields.length * track + (rowFields.length + columnFields.length) * 17;
  const sideW = ${sankey?'Math.min(260, width * .36)':c.heatmapTrend?'Math.min(330, width * '+(c.heatmapTerms?'.42':'.28')+')':c.heatmapBar?'Math.min(130, width * .2)':'0'};
  const plotW = Math.max(20, width - left - sideW - 30), plotH = Math.max(30, height - top - 78);
  const gap = ${split?c.heatmapSplitGap:0};
  const bandW = Math.max(1, (plotW - gap * (selected.length - 1)) / columnOrder.length), bandH = plotH / rowOrder.length;
  const xPositions = new Map(); let cursor = 0, lastPanel;
  columnOrder.forEach(col => {if (lastPanel != null && columnKeys[col].panel !== lastPanel) cursor += gap; xPositions.set(col, cursor);cursor += bandW;lastPanel = columnKeys[col].panel;});
  const x = col => xPositions.get(col), y = r => rowOrder.indexOf(r) * bandH;
  const g = svg.append("g")
    .attr("transform", "translate(" + left + "," + top + ")");
  const cellGap = Math.min(${c.cellGap}, bandW * .7, bandH * .7);
  const shown = cells.filter(d => ${c.heatmapTriangle==='upper'?'rowNames.indexOf(d.row) <= columnKeys.findIndex(col => col.name === d.column)':c.heatmapTriangle==='lower'?'rowNames.indexOf(d.row) >= columnKeys.findIndex(col => col.name === d.column)':'true'});
  const cellGroups = g.selectAll("g.cell")
    .data(shown)
    .join("g")
    .attr("class", "cell point")
    .attr("transform", d => "translate(" + x(d.col) + "," + y(d.r) + ")");
  const cellW = Math.max(.5, bandW - cellGap), cellH = Math.max(.5, bandH - cellGap);
  cellGroups.append("rect")
    .attr("x", cellGap / 2)
    .attr("y", cellGap / 2)
    .attr("width", cellW)
    .attr("height", cellH)
    .attr("rx", ${c.cellRadius})
    .attr("fill", missingColor);
  ${c.heatmapVariant==='dot'?`cellGroups.append("line")
    .attr("x1", bandW / 2)
    .attr("x2", bandW / 2)
    .attr("y1", cellGap / 2)
    .attr("y2", bandH - cellGap / 2)
    .attr("stroke", ${js(c.gridStyle?c.gridColor:'#d8e0e8')});`:''}
  const maxSize = d3.max(cells, d => d.size) || 1;
  ${c.heatmapDualTriangle?`cellGroups.selectAll("path.half")
    .data(d => [{cell:d,value:d.value,half:0},{cell:d,value:d.second,half:1}])
    .join("path")
    .attr("class", "half")
    .attr("transform", "translate(" + cellGap / 2 + "," + cellGap / 2 + ")")
    .attr("d", d => d.half ? "M0," + cellH + "L" + cellW + ",0L" + cellW + "," + cellH + "Z" : "M0,0L" + cellW + ",0L0," + cellH + "Z")
    .attr("fill", d => d.value == null ? missingColor : color(d.value))
    .attr("opacity", ${c.opacity});`:c.heatmapShape==='rect'&&c.heatmapVariant!=='dot'?`cellGroups.append("rect")
    .attr("class", "value-mark")
    .attr("x", cellGap / 2)
    .attr("y", cellGap / 2)
    .attr("width", cellW)
    .attr("height", cellH)
    .attr("rx", ${c.cellRadius})
    .attr("fill", d => d.value == null ? missingColor : color(d.value))
    .attr("opacity", ${c.opacity});`:`cellGroups.filter(d => d.value != null${c.heatmapSize?' && d.size != null':''})
    .append("path")
    .attr("class", "value-mark")
    .attr("transform", "translate(" + bandW / 2 + "," + bandH / 2 + ")")
    .attr("d", d3.symbol()
      .type(d3.${c.heatmapVariant==='dot'||c.heatmapShape==='circle'?'symbolCircle':c.heatmapShape==='triangle'?'symbolTriangle':'symbolDiamond'})
      .size(d => Math.min(cellW, cellH) ** 2 * .5 * ${c.heatmapSize?'d.size / maxSize':'1'}))
    .attr("fill", d => color(d.value))
    .attr("opacity", ${c.opacity});`}
  ${c.grid?`cellGroups.selectAll(".value-mark, .half")
    .attr("stroke", ${js(c.gridStyle?c.gridColor:'white')})
    .attr("stroke-width", ${c.gridStyle?c.gridWidth:1})
    .attr("stroke-opacity", ${c.gridStyle?c.gridOpacity:1});`:''}
  tip(cellGroups, d => d.row + " / " + d.column + (${split?'true':'false'} ? " / " + d.panel : "") + "\\n" + ${js(c.valueField)} + ": " + (d.value == null ? "—" : d3.format(".4~g")(d.value)) + "\\n${tr('Original','原值','元の値')}: " + (d.raw ?? "—")${c.heatmapDualTriangle?` + "\\n" + ${js(c.heatmapSecondField)} + ": " + (d.second ?? "—")`:''}${c.heatmapSize?` + "\\n" + ${js(c.heatmapSizeField)} + ": " + (d.size ?? "—")`:''}${c.heatmapMarks?' + "\\n" + d.mark':''});
  ${c.labels||c.heatmapMarks?`cellGroups.append("text")
    .attr("class", "cell-label")
    .attr("x", bandW / 2)
    .attr("y", bandH / 2)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("pointer-events", "none")
    .attr("font-size", Math.min(${c.labelStyle?c.labelFontSize:c.heatmapFontSize}, cellH * .65))
    .attr("fill", ${js(c.labelStyle?c.labelColor:'#182431')})
    .text(d => ${c.heatmapMarks?'d.mark':'d.value == null ? "" : d3.format(".2~g")(d.value)'});`:''}
  ${c.yAxis?`g.selectAll("text.row-label")
    .data(rowOrder.filter(r => labelRows.has(r)))
    .join("text")
    .attr("class", "row-label")
    .attr("x", -rowFields.length * track - cutW - treeW - 7)
    .attr("y", r => y(r) + bandH / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "end")
    .attr("font-size", Math.min(fontSize, Math.max(7, bandH * .7)))
    .text(r => rowNames[r]);`:''}
  ${c.xAxis?`g.selectAll("text.column-label")
    .data(columnOrder)
    .join("text")
    .attr("class", "column-label")
    .attr("transform", col => "translate(" + (x(col) + bandW / 2) + "," + (plotH + 8) + ")rotate(50)")
    .attr("text-anchor", "start")
    .text(col => columnKeys[col].name);`:''}
  ${split?`selected.forEach(panel => { const ids = columnOrder.filter(col => columnKeys[col].panel === panel); if (!ids.length) return;g.append("text")
    .attr("x", d3.mean(ids, col => x(col) + bandW / 2))
    .attr("y", -treeH - columnFields.length * track - 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", 600)
    .text(panel); });`:''}
  ${c.heatmapCutEnabled?`g.selectAll("rect.cluster-strip")
    .data(rowOrder)
    .join("rect")
    .attr("class", "cluster-strip")
    .attr("x", -cutW)
    .attr("y", y)
    .attr("width", cutW - 2)
    .attr("height", bandH)
    .attr("fill", r => clusterColor(membership.get(r)));
  g.selectAll("line.cut-line")
    .data(rowOrder.filter((r,i) => i > 0 && membership.get(r) !== membership.get(rowOrder[i-1])))
    .join("line")
    .attr("class", "cut-line")
    .attr("x1", 0)
    .attr("x2", plotW)
    .attr("y1", y)
    .attr("y2", y)
    .attr("stroke", "white")
    .attr("stroke-width", 3);`:''}
  function drawTree(node, horizontal, offset) {
    const rootHeight = node.height || 1;
    function position(part) {
      const location = d3.mean(part.leaves, i => horizontal ? y(i) + bandH / 2 : x(i) + bandW / 2);
      const distance = part.height / rootHeight * (horizontal ? treeW : treeH);
      return horizontal ? [-offset-distance, location] : [location, -offset-distance];
    }
    function walk(part) {
      if (!part.children) return;
      const p = position(part), a = position(part.children[0]), b = position(part.children[1]);
      g.append("path")
        .attr("class", "dendrogram")
        .attr("d", horizontal ? "M"+a+"H"+p[0]+"V"+b[1]+"H"+b[0] : "M"+a+"V"+p[1]+"H"+b[0]+"V"+b[1])
        .attr("fill", "none")
        .attr("stroke", "#7b8796")
        .attr("stroke-width", 1);
      part.children.forEach(walk);
    }
    walk(node);
  }
  ${c.heatmapDendrogram&&c.heatmapRowCluster?'drawTree(rowTree, true, rowFields.length * track + cutW + 4);':''}
  ${c.heatmapDendrogram&&c.heatmapColumnCluster&&!split?'drawTree(columnTree, false, columnFields.length * track + 4);':''}
  ${c.heatmapDendrogram&&c.heatmapColumnCluster&&split?`selected.forEach(panel => {
    const ids = columnOrder.filter(col => columnKeys[col].panel === panel);
    const tree = clusterMatrix(ids, ids.map(col => transpose[col]), ${js(c.heatmapDistance)}, ${js(c.heatmapLinkage)});
    if (!tree) return;
    function reindex(node) {node.leaves = node.leaves.map(i => ids[i]); if (node.children) node.children.forEach(reindex);}
    reindex(tree);drawTree(tree, false, columnFields.length * track + 4);
  });`:''}
${annotationSource(c,tr)}
${c.heatmapBar?barSource(c):''}
${c.heatmapTrend?trendSource(c,tr):''}
${sankey?sankeySource(c,tr):''}
`;}
function annotationSource(_c:Config,tr:Translate){return `
  // ${tr('Conflicting metadata is marked mixed instead of silently picking the first record.','注释冲突标记为 mixed，不默取首条记录。','矛盾する注釈は先頭値を採用せず mixed と表示します。')}
  function annotation(axis, field, index) {
    const ids = axis === "row" ? rowOrder : columnOrder;
    const items = ids.map(id => {
      const rows = observed.filter(d => axis === "row" ? String(d[${js(_c.yField)}]) === rowNames[id] : String(d[${js(_c.xField)}]) === columnKeys[id].name${_c.heatmapVariant==='split'?` && String(d[${js(_c.heatmapSplitField)}]) === columnKeys[id].panel`:''});
      return {id, value:extras(rows)[field]};
    });
    const values = Array.from(new Set(items.map(d => d.value).filter(v => v != null)));
    const numbers = values.filter(v => v !== "mixed");
    const continuous = numbers.length > 0 && numbers.every(numeric);
    let extent = d3.extent(numbers, Number);
    if (extent[0] === extent[1]) extent = [extent[0] - 1, extent[1] + 1];
    const scale = continuous ? d3.scaleSequential(d3.interpolateViridis)
      .domain(extent) : d3.scaleOrdinal(${js(vividPalette)})
      .domain(values);
    const fill = v => v == null ? missingColor : v === "mixed" ? "#343e50" : scale(continuous ? +v : v);
    const marks = g.append("g")
      .attr("class", "annotation-track")
      .selectAll("rect")
      .data(items)
      .join("rect")
      .attr("x", d => axis === "row" ? -(index + 1) * track - cutW : x(d.id))
      .attr("y", d => axis === "row" ? y(d.id) : -(index + 1) * track)
      .attr("width", axis === "row" ? track - 1 : bandW - 1)
      .attr("height", axis === "row" ? bandH - 1 : track - 1)
      .attr("fill", d => fill(d.value));
    tip(marks, d => field + "\\n" + (axis === "row" ? rowNames[d.id] : columnKeys[d.id].name) + ": " + (d.value ?? "—"));
    const text = field + ": " + (continuous ? extent.map(v => d3.format(".3~g")(v))
      .join(" → ") : values.join(" · "));
    const legend = svg.append("g")
      .attr("class", "annotation-legend")
      .attr("transform", "translate(20," + (65 + (axis === "row" ? index : rowFields.length + index) * 17) + ")");
    legend.append("text")
      .text(field + (axis === "row" ? " [${tr('row','行','行')}]" : " [${tr('column','列','列')}]") + ":");
    const keyValues = continuous ? [extent[0],extent[1],...(values.includes("mixed") ? ["mixed"] : [])] : values;
    const entries = legend.selectAll("g.key")
      .data(keyValues.slice(0,6))
      .join("g")
      .attr("class", "key")
      .attr("transform", (_, i) => "translate(" + (130 + i * Math.min(100,(width - 160) / Math.min(6,keyValues.length))) + ",0)");
    entries.append("rect")
      .attr("y", -8)
      .attr("width", 8)
      .attr("height", 8)
      .attr("fill", fill);
    entries.append("text")
      .attr("x", 11)
      .attr("font-size", 9)
      .text(v => String(v).length > 12 ? String(v).slice(0,10) + "…" : String(v));
    tip(legend, () => text);
  }
  rowFields.forEach((field,i) => annotation("row", field, i));
  columnFields.forEach((field,i) => annotation("column", field, i));
`;}
function barSource(c:Config){return `
  const summaries = rowOrder.map(r => ({r, value:d3.${c.heatmapSummary}(matrix[r].filter(v => v != null))}));
  const extent = d3.extent(summaries, d => d.value);
  const bx = d3.scaleLinear()
    .domain([Math.min(0,extent[0]), Math.max(0,extent[1]) || 1])
    .range([0, sideW - 32]);
  const bars = g.append("g")
    .attr("class", "row-summary")
    .attr("transform", "translate(" + (plotW + 16) + ",0)");
  const marks = bars.selectAll("rect")
    .data(summaries)
    .join("rect")
    .attr("x", d => Math.min(bx(0),bx(d.value)))
    .attr("y", d => y(d.r) + bandH * .12)
    .attr("width", d => Math.abs(bx(d.value) - bx(0)))
    .attr("height", bandH * .76)
    .attr("fill", d => color(d.value));
  tip(marks, d => rowNames[d.r] + " / ${c.heatmapSummary}\\n" + d3.format(".4~g")(d.value));
  bars.append("g")
    .attr("transform", "translate(0," + plotH + ")")
    .call(d3.axisBottom(bx).ticks(3));
  bars.append("line")
    .attr("x1", bx(0))
    .attr("x2", bx(0))
    .attr("y2", plotH)
    .attr("stroke", "#8492a1");
`;}
function trendSource(c:Config,tr:Translate){return `
  // ${tr('Column order is the sequence; no interpolation across missing values.','列顺序作为趋势顺序，缺失位置不插值连接。','列順を推移順として使用し、欠損位置を補間して結びません。')}
  clusters.forEach((part, index) => {
    const ids = rowOrder.filter(r => part.leaves.includes(r));
    const y0 = d3.min(ids,y), h = ids.length * bandH;
    const w = ${c.heatmapTerms?'sideW * .5':'sideW - 24'};
    const trend = g.append("g")
      .attr("class", "trend-panel")
      .attr("transform", "translate(" + (plotW + 20) + "," + y0 + ")");
    const tx = d3.scalePoint()
      .domain(columnOrder)
      .range([8, w - 8]);
    let [lo,hi] = d3.extent(ids.flatMap(r => matrix[r]).filter(v => v != null));
    if (lo == null) {lo = 0; hi = 1;}
    if (lo === hi) {lo -= 1; hi += 1;}
    const ty = d3.scaleLinear()
      .domain([lo,hi])
      .range([Math.max(14,h - 17), 13]);
    trend.append("rect")
      .attr("width", w)
      .attr("height", Math.max(2,h - 2))
      .attr("fill", "none")
      .attr("stroke", "#dbe3ed");
    const line = d3.line()
      .defined(d => d.value != null)
      .x(d => tx(d.col))
      .y(d => ty(d.value));
    const lines = trend.selectAll("path.individual")
      .data(ids)
      .join("path")
      .attr("class", "individual")
      .attr("d", r => line(columnOrder.map(col => ({col,value:matrix[r][col]}))))
      .attr("fill", "none")
      .attr("stroke", clusterColor(index))
      .attr("stroke-opacity", .25)
      .attr("stroke-width", 1);
    tip(lines, r => rowNames[r]);
    const means = columnOrder.map(col => ({col,value:d3.mean(ids.map(r => matrix[r][col]).filter(v => v != null)) ?? null}));
    ${c.heatmapTrendMeans?`trend.append("path")
      .datum(means)
      .attr("class", "trend-mean")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", clusterColor(index))
      .attr("stroke-width", ${c.lineWidth});`:''}
    ${c.heatmapTrendPoints?`const points = trend.selectAll("circle.mean-point")
      .data(means.filter(d => d.value != null))
      .join("circle")
      .attr("class", "mean-point")
      .attr("cx", d => tx(d.col))
      .attr("cy", d => ty(d.value))
      .attr("r", 2.5)
      .attr("fill", clusterColor(index));
    tip(points, d => columnKeys[d.col].name + ": " + d3.format(".3~g")(d.value));`:''}
    trend.append("text")
      .attr("x", 5)
      .attr("y", 10)
      .attr("font-size", 9)
      .text("C" + (index + 1) + " · n=" + ids.length + " · " + d3.format(".2~g")(lo) + "…" + d3.format(".2~g")(hi));
    ${c.heatmapTerms?`const terms = d3.rollups(ids.flatMap(r => {
      const names = new Set(observed.filter(d => String(d[${js(c.yField)}]) === rowNames[r]).flatMap(d => String(d[${js(c.heatmapTermField)}] ?? "").split(";").map(t => t.trim()).filter(Boolean)));
      return Array.from(names).map(term => ({r,term}));
    }), values => new Set(values.map(d => d.r)).size, d => d.term).sort((a,b) => b[1]-a[1]).slice(0, ${c.heatmapTermLimit});
    const labels = trend.selectAll("text.term")
      .data(terms.slice(0,Math.max(1,Math.floor((h - 10) / 13))))
      .join("text")
      .attr("class", "term")
      .attr("x", w + 10)
      .attr("y", (_,i) => 13 + i * 13)
      .attr("fill", clusterColor(index))
      .attr("font-size", 9)
      .text(d => d[0].slice(0,22) + (d[0].length > 22 ? "…" : "") + " (" + d[1] + ")");
    tip(labels, d => d[0] + "\\n${tr('Associated genes','关联基因数','関連遺伝子数')}: " + d[1]);`:''}
  });
`;}
function sankeySource(c:Config,tr:Translate){return `
  // ${tr('Deduplicate memberships per gene; use the mean supplied weight per membership.','每个基因的分类关联去重，每条关联使用输入权重的均值。','遺伝子ごとに所属を重複除去し、所属別の入力重み平均を使用します。')}
  const links = rowOrder.flatMap(r => {
    const map = new Map();
    observed.filter(d => String(d[${js(c.yField)}]) === rowNames[r]).forEach(d => {
      const weight = ${c.heatmapSankeyWeight?`numeric(d[${js(c.heatmapSankeyWeight)}]) && +d[${js(c.heatmapSankeyWeight)}] >= 0 ? +d[${js(c.heatmapSankeyWeight)}] : null`:'1'};
      if (weight == null) return;
      new Set(String(d[${js(c.heatmapTermField)}] ?? "").split(";").map(s => s.trim()).filter(Boolean)).forEach(term => { if (!map.has(term)) map.set(term, []);map.get(term).push(weight); });
    });
    return Array.from(map, ([term,values]) => ({r,term,value:d3.mean(values)})).filter(d => d.value > 0);
  });
  const totals = d3.rollup(links, rows => d3.sum(rows,d => d.value), d => d.term);
  const terms = Array.from(totals.keys());
  const byRow = d3.rollup(links, rows => d3.sum(rows,d => d.value), d => d.r);
  const padding = Math.min(8, plotH / Math.max(1,terms.length * 3));
  const scale = Math.max(0,Math.min(bandH * .75 / (d3.max(byRow.values()) || 1), (plotH - padding * Math.max(0,terms.length-1)) / (d3.sum(links,d => d.value) || 1)));
  const category = d3.scaleOrdinal(${js(vividPalette)})
    .domain(terms);
  const endX = plotW + sideW * .65;
  const starts = new Map(rowOrder.map(r => [r, y(r) + bandH / 2 - (byRow.get(r) || 0) * scale / 2]));
  const ends = new Map(); let offset = 0;
  const nodes = terms.map(term => {const node = {term,y:offset,height:totals.get(term)*scale}; ends.set(term,offset);offset += node.height + padding;return node;});
  const ribbons = g.append("g")
    .attr("class", "sankey-links")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", d => {
      const h = d.value * scale, a = starts.get(d.r), b = ends.get(d.term), x0 = plotW + 8, x1 = endX, mid = (x0 + x1) / 2;
      starts.set(d.r,a+h);ends.set(d.term,b+h);
      return "M"+x0+","+a+"C"+mid+","+a+" "+mid+","+b+" "+x1+","+b+"L"+x1+","+(b+h)+"C"+mid+","+(b+h)+" "+mid+","+(a+h)+" "+x0+","+(a+h)+"Z";
    })
    .attr("fill", d => category(d.term))
    .attr("fill-opacity", .4);
  tip(ribbons, d => rowNames[d.r] + " → " + d.term + "\\n${tr('Weight','权重','重み')}: " + d.value);
  const targets = g.selectAll("rect.sankey-node")
    .data(nodes)
    .join("rect")
    .attr("class", "sankey-node")
    .attr("x", endX)
    .attr("y", d => d.y)
    .attr("width", 8)
    .attr("height", d => d.height)
    .attr("fill", d => category(d.term));
  tip(targets, d => d.term + "\\n" + totals.get(d.term));
  g.selectAll("text.sankey-label")
    .data(nodes)
    .join("text")
    .attr("class", "sankey-label")
    .attr("x", endX + 12)
    .attr("y", d => d.y + d.height / 2)
    .attr("dy", ".32em")
    .attr("font-size", 9)
    .text(d => d.term.length > 15 ? d.term.slice(0,13) + "…" : d.term);
`;}
