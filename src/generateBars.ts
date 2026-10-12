import { categoricalColors } from './chartColors';
import { extendedBarSource } from './generateBarExtensions';
import type { Config, Row } from './model';
import type { Locale } from './i18n';
import type { CodeParts } from './generate';
import { codeComment } from './codeComments';
import { barStatistics } from './barModel';
const js=(value:unknown)=>JSON.stringify(value);
const local=(locale:Locale,en:string,zh:string,ja:string)=>locale==='zh'?zh:locale==='ja'?ja:en;
export function generateBarsCode(data:Row[],c:Config,locale:Locale):CodeParts{
 const mode=c.barVariant,hist=mode==='histfit',radial=['polar','circos','polar-group'].includes(mode),three=mode==='3d';
 const comment=(en:string,zh:string,ja:string)=>local(locale,en,zh,ja);
 const dataSource=`// ${codeComment('Replace this array with your own data. Keep the mapped field names.',locale)}
const data = ${JSON.stringify(data,null,2)};
`;
 const logic=`import * as d3 from "d3";

// ${codeComment('Call renderChart(container, data) in any Web project with D3 v7 installed.',locale)}
function renderChart(container, data) {
  const root = d3.select(container)
    .style("position", "relative");
  root.selectAll("*")
    .remove();
  const width = ${c.width}, height = ${c.height};
  const margin = {top: 56, right: ${['dual-line','dual-bar','go'].includes(mode)?85:40}, bottom: ${['aggregate','ice','platform'].includes(mode)?110:85}, left: ${c.horizontal?110:72}};
  const innerW = Math.max(40, width - margin.left - margin.right);
  const innerH = Math.max(40, height - margin.top - margin.bottom);
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(comment('Bar visualization','柱状可视化','棒グラフ'))})
    .style("width", "100%")
    .style("display", "block")
    .style("font", "12px system-ui")
    .style("background", ${js(c.background)});
  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // ${codeComment('CSV values may be strings. Skip blank, missing and non-finite values.',locale)}
  const numeric = v => v != null && String(v).trim() !== "" && Number.isFinite(Number(v));
  const processedData = data.filter(d => ${hist?`numeric(d[${js(c.xField)}])`:`d[${js(c.xField)}] != null && String(d[${js(c.xField)}]).trim() !== ""
    && numeric(d[${js(c.yField)}])${['percent','butterfly','dot','polar','circos','3d','aggregate','extruded','triangle','broken','ice','pencil','stem','updown','polar-group','platform','group-stack'].includes(mode)?` && +d[${js(c.yField)}] >= 0`:''}${mode==='error'&&c.errorMode==='bounds'?`
    && numeric(d[${js(c.errorLowField)}]) && numeric(d[${js(c.errorHighField)}])
    && +d[${js(c.errorLowField)}] <= +d[${js(c.yField)}] && +d[${js(c.errorHighField)}] >= +d[${js(c.yField)}]`:''}`}
${['dual-line','dual-bar','go'].includes(mode)?`    && numeric(d[${js(c.barSecondField)}])${c.barRightTransform==='neglog10'?` && +d[${js(c.barSecondField)}] > 0 && +d[${js(c.barSecondField)}] <= 1`:''}`:''}${mode==='group-stack'?`    && d[${js(c.barCohortField)}] != null && String(d[${js(c.barCohortField)}]).trim() !== ""`:''}
  ).map((d, index) => ({...d,
    category: ${hist?'"All"':`String(d[${js(c.xField)}])`},
    series: ${c.groupField?`String(d[${js(c.groupField)}] ?? "")`:'"All"'},
    value: +d[${js(hist?c.xField:c.yField)}], index, sourceRow:d
  }));
  const message = text => g.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH / 2)
    .attr("text-anchor", "middle")
    .text(text);
  if (!processedData.length) {
    message(${js(comment('No valid rows for the mapped fields.','映射字段没有有效数据','割り当てた項目に有効なデータがありません'))});
    return svg.node();
  }
  const color = d3.scaleOrdinal()
    .range(${js(categoricalColors(c.color,c.secondaryColor))});
  const tooltip = ${c.tooltip?`root.append("div")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("padding", "8px 12px")
    .style("border", "1px solid #dbe3ee")
    .style("border-radius", "8px")
    .style("background", "white")
    .style("font", "12px system-ui")`:'null'};
  const tip = selection => {
    if (!tooltip) return;
    selection.on("pointermove.tooltip", (event, d) => {
      tooltip.selectAll("*")
      .remove();
      const values = d.tip ?? [d.category, d.series, ${js(c.yField)} + ": " + d3.format(".5~g")(d.value)];
      values.forEach(value => tooltip.append("div")
      .text(value));
      const [px, py] = d3.pointer(event, container);
      tooltip.style("display", "block")
        .style("left", Math.max(0, Math.min(px + 12, container.clientWidth - 180)) + "px")
        .style("top", Math.max(0, py - 20) + "px");
    })
      .on("pointerleave.tooltip", () => tooltip.style("display", "none"));
  };
${hist?histogramSource(c,locale):`  // ${comment('Aggregate repeated categories and series using the selected statistic.','按所选统计量汇总重复分类与系列。','選択した統計量でカテゴリと系列の重複を集計します。')}
${mode==='error'?barStatistics.replace('Invert the Student t CDF at 0.975 using the regularized incomplete beta function.',comment('Invert the Student t CDF at 0.975 using the regularized incomplete beta function.','利用正则化不完全贝塔函数计算 Student t 分布的 0.975 分位数。','正則化不完全ベータ関数で Student t 分布の 0.975 分位点を求めます。')):''}
  const cells = Array.from(d3.group(processedData, d => d.category), ([category, groups]) =>
    Array.from(d3.group(groups, d => d.series), ([series, rows]) => {
${mode==='error'?`      ${c.errorMode==='bounds'?`if (rows.length !== 1) return null;
      const value = rows[0].value, low = +rows[0].sourceRow[${js(c.errorLowField)}], high = +rows[0].sourceRow[${js(c.errorHighField)}];`:`const summary = summarize(rows.map(d => d.value));
      const value = summary.mean, error = summary.${c.errorMode};
      const low = error == null ? null : value - error, high = error == null ? null : value + error;`}
      return {category, series, value, low, high, rows, tip: [category, series, "n = " + rows.length, ${js(c.errorMode==='bounds'?'value = ':'mean = ')} + d3.format(".5~g")(value), low == null ? ${js(comment('Interval unavailable for n < 2','n < 2，无法估计误差','n < 2 のため誤差を推定できません'))} : "${c.errorMode.toUpperCase()} [" + d3.format(".5~g")(low) + ", " + d3.format(".5~g")(high) + "]"]};`:`      const value = d3.${c.barAggregate==='mean'?'mean':'sum'}(rows, d => d.value);
      return {category, series, value, rows};`}
    }).filter(Boolean)
  ).flat();
  if (!cells.length) {
    message(${js(comment('Provide one summary row per category and series.','每个分类与系列组合须提供一行汇总数据','各カテゴリ・系列の組合せに集計済みの一行を指定してください'))});
    return svg.node();
  }
${mode==='error'&&c.errorMode==='bounds'?`  if (cells.length < d3.group(processedData, d => JSON.stringify([d.category,d.series])).size) svg.append("text")
    .attr("x", margin.left)
    .attr("y", height - 8)
    .text(${js(comment('Duplicate summary combinations were skipped.','已跳过重复的分类与系列汇总组合。','カテゴリと系列が重複する集計行を除外しました。'))});
`:''}  let categories = Array.from(new Set(cells.map(d => d.category)));
  const series = Array.from(new Set(cells.map(d => d.series)));
  color.domain(${c.groupField?'series':'categories'});
  const fill = d => ${mode==='gene'?`d.value >= 0 ? ${js(c.color)} : ${js(c.secondaryColor)}`:`color(${c.groupField?'d.series':'d.category'})`};
${c.barSort!=='input'?`  const sortTotals = d3.rollup(cells, rows => d3.sum(rows, d => d.value), d => d.category);
  categories.sort((a, b) => ${c.barSort==='descending'?'sortTotals.get(b) - sortTotals.get(a)':'sortTotals.get(a) - sortTotals.get(b)'});
`:''}${['dual-line','dual-bar','go','group-stack','polar-group'].includes(mode)?extendedBarSource(c,locale):radial?radialSource(c,locale):three?threeSource(c,locale):cartesianSource(c,locale)}
${c.legend&&c.groupField?`  const legend = svg.append("g")
    .attr("transform", "translate(" + margin.left + ",20)");
  legend.selectAll("g")
    .data(${mode==='circos'?'tracks':'series'})
    .join("g")
    .attr("transform", (_, i) => "translate(" + i % 5 * Math.min(120, innerW / 5) + "," + Math.floor(i / 5) * 16 + ")")
    .each(function(value) {
      d3.select(this)
      .append("rect")
      .attr("width", 9)
      .attr("height", 9)
      .attr("fill", color(value));
      d3.select(this)
      .append("text")
      .attr("x", 14)
      .attr("y", 8)
      .text(value);
    });
`:''}`}
  return svg.node();
}

// ${codeComment('This creates a container if your page does not already have #chart.',locale)}
const container = document.querySelector("#chart")
  || d3.select("body")
    .append("div")
    .attr("id", "chart")
    .node();
renderChart(container, data);
`;
 return {logic,data:dataSource,source:logic.replace('import * as d3 from "d3";','import * as d3 from "d3";\n\n'+dataSource)};
}

function cartesianSource(c:Config,locale:Locale){
 const mode=c.barVariant,stacked=['stacked','hstacked','percent'].includes(mode),horizontal=c.horizontal||['horizontal','hstacked','butterfly','diverging'].includes(mode),broken=mode==='broken';
 const ct=(en:string,zh:string,ja:string)=>local(locale,en,zh,ja);
 return `  let segments = cells.map(d => ({...d, start: 0, end: d.value}));
${stacked?`  const lookup = new Map(cells.map(d => [JSON.stringify([d.category, d.series]), d]));
  const totals = d3.rollup(cells, rows => d3.sum(rows, d => d.value), d => d.category);
  const stacks = d3.stack()
      .keys(series)
    .value((category, key) => {
      const value = lookup.get(JSON.stringify([category, key]))?.value ?? 0;
      return ${mode==='percent'?'totals.get(category) > 0 ? value / totals.get(category) : 0':'value'};
    })
    .offset(d3.stackOffsetDiverging)(categories);
  segments = stacks.flatMap(stack => stack.map((pair, i) => ({category: categories[i], series: stack.key,
    value: lookup.get(JSON.stringify([categories[i], stack.key]))?.value ?? 0, start: pair[0], end: pair[1]
  })));
`:''}${['butterfly','updown'].includes(mode)?`  const left = series.includes(${js(c.leftSeries)}) ? ${js(c.leftSeries)} : series[0];
  const right = series.includes(${js(c.rightSeries)}) && ${js(c.rightSeries)} !== left ? ${js(c.rightSeries)} : series.find(value => value !== left);
  segments = cells.filter(d => d.series === left || d.series === right)
    .map(d => ({...d, start: 0, end: d.series === ${mode==='updown'?'right':'left'} ? -d.value : d.value}));
`:''}
  const band = d3.scaleBand()
    .domain(categories)
    .range(${horizontal?'[0, innerH]':'[0, innerW]'})
    .padding(${c.barPadding});
  const subgroup = d3.scaleBand()
    .domain(series)
    .range([0, band.bandwidth()])
    .padding(.12);
  const position = d => band(d.category) + ${stacked||['butterfly','updown'].includes(mode)?'0':'subgroup(d.series)'};
  const thickness = ${stacked||['butterfly','updown'].includes(mode)?'band.bandwidth()':'subgroup.bandwidth()'};
  let minimum = Math.min(0, d3.min(segments, d => d.start), d3.min(segments, d => d.end));
  let maximum = Math.max(0, d3.max(segments, d => d.start), d3.max(segments, d => d.end));
${mode==='error'?`  minimum = Math.min(minimum, d3.min(cells, d => d.low ?? d.value));
  maximum = Math.max(maximum, d3.max(cells, d => d.high ?? d.value));
`:''}${['butterfly','updown'].includes(mode)?`  maximum = Math.max(Math.abs(minimum), maximum); minimum = -maximum;\n`:''}
${mode==='error'&&c.errorPoints&&c.errorMode!=='bounds'?`  minimum = Math.min(minimum, d3.min(processedData, d => d.value));
  maximum = Math.max(maximum, d3.max(processedData, d => d.value));
`:''}${c.barOverlay?`  const overlayValues = processedData.filter(d => numeric(d.sourceRow[${js(c.barOverlayField)}])).map(d => +d.sourceRow[${js(c.barOverlayField)}]);
  minimum = Math.min(minimum, d3.min(overlayValues) ?? minimum);
  maximum = Math.max(maximum, d3.max(overlayValues) ?? maximum);
`:''}${mode==='dot'?`  maximum = Math.ceil(maximum / (${c.dotUnit} * ${c.dotColumns})) * ${c.dotUnit} * ${c.dotColumns};
`:''}${mode==='stem'?`  maximum = Math.max(maximum, ${c.barBackgroundValue});
`:''}  if (minimum === maximum) maximum = minimum + 1;
  const value = d3.scaleLinear()
    .domain([minimum, maximum])
    .nice()
    .range(${horizontal?'[0, innerW]':'[innerH, 0]'});
${broken?`  const cutLow = ${c.breakLow}, cutHigh = ${c.breakHigh};
  if (!(cutLow > 0 && cutHigh > cutLow && maximum > cutHigh)) {
    message(${js(ct('Choose 0 < lower break < upper break < data maximum.','请设置 0 < 断轴下界 < 断轴上界 < 数据最大值','0 < 切断下限 < 切断上限 < データ最大値を指定してください'))});
    return svg.node();
  }
  const gap = 18, split = innerH * ${c.breakRatio};
  const lower = d3.scaleLinear()
      .domain([0, cutLow])
      .range([innerH, split + gap / 2]);
  const upper = d3.scaleLinear()
      .domain([cutHigh, maximum])
      .range([split - gap / 2, 0]);
  const project = v => v <= cutLow ? lower(v) : v >= cutHigh ? upper(v) : split;
`:''}
  const xAxis = g.append("g")
    .attr("transform", "translate(0," + innerH + ")");
  const yAxis = g.append("g");
${c.xAxis?`  xAxis.call(d3.axisBottom(${horizontal?'value':'band'})${mode==='percent'&&horizontal?'.tickFormat(d3.format(".0%"))':mode==='butterfly'?'.tickFormat(v => d3.format("~g")(Math.abs(v)))':''});
`:''}${c.yAxis?broken?`  yAxis.call(d3.axisLeft(lower)
      .ticks(4));
  g.append("g")
      .call(d3.axisLeft(upper)
      .ticks(4));
`:`  yAxis.call(d3.axisLeft(${horizontal?'band':'value'})${mode==='updown'?'.tickFormat(v => d3.format("~g")(Math.abs(v)))':mode==='percent'?'.tickFormat(d3.format(".0%"))':''});
`:''}${c.grid&&!broken?`  g.insert("g", ":first-child")
    .call(${horizontal?'d3.axisBottom(value)':'d3.axisLeft(value)'}.ticks(5)
      .tickSize(${horizontal?'innerH':'-innerW'})
      .tickFormat(() => ""))
    .call(layer => layer.select(".domain")
      .remove())
    .call(layer => layer.selectAll("line")
      .attr("stroke", ${js(c.gridStyle?c.gridColor:'#e8edf2')}));
`:''}
  xAxis.selectAll("text")
    .attr("transform", "rotate(${horizontal?0:c.xTickAngle||-20})")
    .attr("text-anchor", ${js(horizontal?'middle':'end')});
  g.selectAll(".tick text")
      .attr("font-size", ${c.axisStyle?c.tickFontSize:11});
  g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 64)
      .attr("text-anchor", "middle")
    .text(${js(horizontal?c.xTitle||c.yField:c.xTitle||c.xField)});
  g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", ${horizontal?-85:-52})
      .attr("text-anchor", "middle")
    .text(${js(horizontal?c.yTitle||c.xField:c.yTitle||(mode==='percent'?'%':c.yField))});
${['updown','gene'].includes(mode)?`  g.append("line")
    .attr("x2",innerW)
    .attr("y1",value(0))
    .attr("y2",value(0))
    .attr("stroke","#687a90");
`:''}  const marks = g.append("g");
${stacked&&c.barLinks?`  // ${ct('Bands connect compositions; they do not represent individual flows.','连接带表示组成变化，不代表个体流转。','帯は構成の変化を結び、個体の流れは表しません。')}
  for (const name of series) {
    const rows = segments.filter(d => d.series === name);
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1], b = rows[i];
      const x0=band(a.category)+band.bandwidth(), x1=band(b.category), mid=(x0+x1)/2;
      const edge=(v0,v1)=>${c.barLinkCurve?'"C"+mid+","+value(v0)+" "+mid+","+value(v1)+" "+x1+","+value(v1)':'"L"+x1+","+value(v1)'};
      const reverse=(v0,v1)=>${c.barLinkCurve?'"C"+mid+","+value(v0)+" "+mid+","+value(v1)+" "+x0+","+value(v1)':'"L"+x0+","+value(v1)'};
      marks.append("path")
        .attr("class","composition-link")
        .attr("d", "M"+x0+","+value(a.end)+edge(a.end,b.end)${c.barLinkStyle==='band'?'+"L"+x1+","+value(b.start)+reverse(b.start,a.start)+"Z"':''})
        .attr("fill",${c.barLinkStyle==='band'?'color(name)':'"none"'})
        .attr("stroke",${c.barLinkStyle==='boundary'?'color(name)':'"none"'})
        .attr("stroke-width",${c.lineWidth})
        .attr("opacity",${c.barLinkStyle==='band'?'.2':'.7'});
    }
  }
`:''}${['ice','pencil','stem','platform'].includes(mode)?glyphSource(c,locale):mode==='dot'?dotSource(c,locale):mode==='triangle'?`  marks.selectAll("path.bar")
    .data(segments)
      .join("path")
      .attr("class", "bar")
    .attr("d", d => "M" + position(d) + "," + value(0) + "L" + (position(d) + thickness / 2) + "," + value(d.value) + "L" + (position(d) + thickness) + "," + value(0) + "Z")
    .attr("fill", fill)
      .attr("opacity", ${c.opacity})
      .call(tip);
`:broken?`  // ${ct('Draw separate visible ranges; never compress values inside the omitted interval into endpoints.','分段绘制可见范围；省略区间内的值不伪装成区间端点。','表示範囲を分けて描画し、省略区間の値を端点に置き換えません。')}
  for (const d of segments) {
    const parts = [{low:0, high:Math.min(d.value, cutLow), scale:lower}];
    if (d.value >= cutHigh) parts.push({low:cutHigh, high:d.value, scale:upper});
    for (const part of parts) marks.append("rect")
    .datum(d)
      .attr("class", "bar")
      .attr("x", position(d))
      .attr("width", thickness)
      .attr("y", part.scale(part.high))
      .attr("height", Math.max(0, part.scale(part.low) - part.scale(part.high)))
      .attr("fill", fill(d))
      .attr("opacity", ${c.opacity})
      .call(tip);
    if (d.value > cutLow) marks.append("text")
      .attr("x", position(d) + thickness / 2)
      .attr("y", split + 4)
      .attr("text-anchor", "middle")
      .text("//");
    if (d.value > cutLow && d.value < cutHigh) marks.append("circle")
    .datum(d)
      .attr("cx", position(d) + thickness / 2)
      .attr("cy", split)
      .attr("r", 4)
      .attr("fill", "white")
      .attr("stroke", fill(d))
      .call(tip);
  }
  g.append("path")
      .attr("d", "M-8," + (split-5) + "l16,-6m-16,14l16,-6")
      .attr("stroke", "#4e6079");
  g.append("text")
      .attr("x", innerW)
      .attr("y", split + 4)
      .attr("text-anchor", "end")
      .attr("fill", "#7e8ba0")
    .text(${js(ct('Omitted','省略','省略'))} + ": " + cutLow + "–" + cutHigh);
`:`  marks.selectAll("rect.bar")
    .data(segments)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => ${horizontal?'Math.min(value(d.start), value(d.end))':'position(d)'})
    .attr("y", d => ${horizontal?'position(d)':'Math.min(value(d.start), value(d.end))'})
    .attr("width", d => ${horizontal?'Math.abs(value(d.end) - value(d.start))':'thickness'})
    .attr("height", d => ${horizontal?'thickness':'Math.abs(value(d.end) - value(d.start))'})
    .attr("rx", ${mode==='ice'?'thickness / 2':c.cornerRadius})
    .attr("fill", fill)
    .attr("opacity", ${c.opacity})
    .attr("stroke", ${js(c.markBorder?c.borderColor:'none')})
    .attr("stroke-width", ${c.borderWidth})
    .call(tip);
`}${mode==='error'?errorSource(c):''}${mode==='extruded'?extrudedSource(c):''}${mode==='aggregate'?`  const anchor = [innerW / 2, innerH + 45];
  marks.selectAll("path.converge")
    .data(segments)
      .join("path")
      .attr("class", "converge")
    .attr("d", d => "M" + position(d) + "," + innerH + "L" + (position(d) + thickness) + "," + innerH + "L" + anchor.join(",") + "Z")
    .attr("fill", fill)
      .attr("opacity", .25);
`:''}${c.barOverlay&&!horizontal&&!broken?`${stacked?`  const trend = Array.from(d3.group(processedData,d=>d.category),([category,rows])=>({category,series:"All",trend:d3.mean(rows,row=>numeric(row.sourceRow[${js(c.barOverlayField)}])?+row.sourceRow[${js(c.barOverlayField)}]:undefined)}));`:`  const trend = cells.map(d => ({...d, trend:d3.mean(d.rows, row => numeric(row.sourceRow[${js(c.barOverlayField)}]) ? +row.sourceRow[${js(c.barOverlayField)}] : undefined)}));`}
  marks.selectAll("path.trend")
    .data(Array.from(d3.group(trend, d => d.series).values(), rows => rows.sort((a,b) => categories.indexOf(a.category)-categories.indexOf(b.category))))
    .join("path")
    .attr("class", "trend")
    .attr("d", rows => d3.line()
      .defined(d => Number.isFinite(d.trend))
      .x(d => ${stacked?'band(d.category)+band.bandwidth()/2':'position(d) + thickness / 2'})
      .y(d => value(d.trend))(rows))
    .attr("fill", "none")
      .attr("stroke", ${js(c.significantColor)})
      .attr("stroke-width", ${c.lineWidth});
`:''}${c.labels?`  marks.selectAll("text.value")
    .data(segments)
      .join("text")
      .attr("class", "value")
    .attr("x", d => ${horizontal?'value(d.end) + (d.end >= 0 ? 5 : -5)':'position(d) + thickness / 2'})
    .attr("y", d => ${horizontal?'position(d) + thickness / 2':broken?'project(d.value) - 5':'value(d.end) - 5'})
    .attr("dy", ${js(horizontal?'.35em':'0')})
    .attr("text-anchor", ${horizontal?'d => d.end >= 0 ? "start" : "end"':'"middle"'})
    .attr("fill", ${js(c.labelColor)})
      .attr("font-size", ${c.labelFontSize})
    .text(d => d3.format(".4~g")(d.value));
`:''}`;
}
function dotSource(c:Config,locale:Locale){return `  // ${local(locale,'Fractional final dots preserve the exact value through proportional area.','末尾圆点以面积比例保留不足一个单位的数值。','最後の点は面積の比率で端数を表します。')}
  const unit = ${c.dotUnit}, columns = ${c.dotColumns};
  const dots = segments.flatMap(d => d3.range(Math.ceil(d.value / unit)).map(i => ({...d, fraction:Math.min(1, d.value / unit - i), dot:i})));
  const step = thickness / columns;
  const rowHeight = Math.abs(value(unit * columns) - value(0));
  marks.selectAll("circle.bar")
    .data(dots)
      .join("circle")
      .attr("class", "bar")
    .attr("cx", d => position(d) + thickness / 2 + ((d.dot % columns) - (columns - 1) / 2) * step)
    .attr("cy", d => value((Math.floor(d.dot / columns) + .5) * unit * columns))
    .attr("r", d => Math.min(${c.radius}, step * .42, rowHeight * .42) * Math.sqrt(d.fraction))
    .attr("fill", fill)
      .attr("opacity", ${c.opacity})
      .call(tip);
`;}
function errorSource(c:Config){return `  marks.selectAll("g.error")
    .data(cells.filter(d => d.low != null && d.high != null))
    .join("g")
      .attr("class", "error")
    .each(function(d) {
      const layer = d3.select(this), center = position(d) + thickness / 2;
      layer.append("line")
      .attr("x1", center)
      .attr("x2", center)
      .attr("y1", value(d.low))
      .attr("y2", value(d.high));
      for (const endpoint of [d.low, d.high]) layer.append("line")
        .attr("x1", center - ${c.errorCaps}/2)
      .attr("x2", center + ${c.errorCaps}/2)
        .attr("y1", value(endpoint))
      .attr("y2", value(endpoint));
    })
    .attr("stroke", ${js(c.borderColor)})
      .attr("stroke-width", ${c.borderWidth});
${c.errorPoints&&c.errorMode!=='bounds'?`  marks.selectAll("circle.observation")
    .data(processedData)
      .join("circle")
      .attr("class", "observation")
    .attr("cx", d => position(d) + thickness / 2 + Math.sin((d.index + 1) * 2.399) * thickness * .3)
    .attr("cy", d => value(d.value))
      .attr("r", ${c.radius})
    .attr("fill", ${js(c.borderColor)})
      .attr("opacity", .7)
      .call(tip);
`:''}`;}
function extrudedSource(c:Config){return `  marks.selectAll("path.depth")
    .data(segments)
      .join("path")
      .attr("class", "depth")
    .attr("d", d => {
      const a = position(d), b = a + thickness, top = value(d.value), bottom = value(0), depth = ${c.barDepth};
      return "M" + a + "," + top + "l" + depth + ",-" + depth + "h" + thickness + "l-" + depth + "," + depth + "Z M" + b + "," + top + "l" + depth + ",-" + depth + "V" + (bottom-depth) + "l-" + depth + "," + depth + "Z";
    })
      .attr("fill", d => d3.color(fill(d)).darker(.5))
      .attr("opacity", ${c.opacity})
      .call(tip);
`;}

function radialSource(c:Config,locale:Locale){const circos=c.barVariant==='circos';return `  const cx = innerW / 2, cy = innerH / 2;
  const outer = Math.max(20, Math.min(innerW, innerH) / 2 - 30), inner = outer * ${c.radialInner};
  const angle = d3.scaleBand()
      .domain(categories)
      .range([0, ${c.radialAngle} * Math.PI / 180])
      .padding(${c.radialGap});
${circos?`  const firstTrack = series.includes(${js(c.leftSeries)}) ? ${js(c.leftSeries)} : series[0];
  const secondTrack = series.includes(${js(c.rightSeries)}) && ${js(c.rightSeries)} !== firstTrack ? ${js(c.rightSeries)} : series.find(value => value !== firstTrack);
  const tracks = [firstTrack,secondTrack].filter(value => value != null);`:'  const tracks = ["All"];'}
  const radial = g.append("g")
      .attr("transform", "translate(" + cx + "," + cy + ")");
  const trackWidth = Math.max(1, (outer - inner - (tracks.length - 1) * ${c.trackGap}) / tracks.length);
  const allMax = d3.max(cells.filter(d => tracks.includes(d.series)), d => d.value) || 1;
  tracks.forEach((name, track) => {
    const rows = ${circos?'cells.filter(d => d.series === name)':'Array.from(d3.rollup(cells, rows => d3.sum(rows, d => d.value), d => d.category), ([category,value]) => ({category,series:"All",value}))'};
    const start = inner + track * (trackWidth + ${c.trackGap});
    const radius = ${c.radialArea?'d3.scaleRadial()':'d3.scaleLinear()'}
      .domain([0, ${circos&&c.trackScale==='shared'?'allMax':'d3.max(rows, d => d.value) || 1'}])
      .range([start, start + trackWidth]);
${c.grid?`    for (const tick of radius.ticks(3)) radial.append("path")
      .attr("d", d3.arc()
      .innerRadius(radius(tick))
      .outerRadius(radius(tick))
      .startAngle(0)
      .endAngle(${c.radialAngle} * Math.PI / 180)())
      .attr("fill", "none")
      .attr("stroke", "#e3e9f2");
`:''}
    radial.append("g")
      .selectAll("path.bar")
      .data(rows)
      .join("path")
      .attr("class", "bar")
      .attr("d", d3.arc()
      .innerRadius(start)
      .outerRadius(d => radius(d.value))
        .startAngle(d => angle(d.category))
      .endAngle(d => angle(d.category) + angle.bandwidth()))
      .attr("fill", ${circos?'d => color(d.series)':'d => color(d.category)'})
      .attr("opacity", ${c.opacity})
      .call(tip);
${c.labels?`    radial.selectAll("text.value-track-" + track)
      .data(rows)
      .join("text")
      .attr("class", "value-track-" + track)
      .attr("x", d => Math.sin(angle(d.category)+angle.bandwidth()/2)*(radius(d.value)+6))
      .attr("y", d => -Math.cos(angle(d.category)+angle.bandwidth()/2)*(radius(d.value)+6))
      .attr("text-anchor", "middle")
      .attr("font-size", ${c.labelFontSize})
      .attr("fill", ${js(c.labelColor)})
      .text(d => d3.format(".3~g")(d.value));
`:''}    radial.append("text")
      .attr("y", -start - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text(${circos?'name + " · " + d3.format(".3~g")(radius.domain()[1])':'d3.format(".3~g")(radius.domain()[1])'});
  });
  radial.selectAll("text.category")
      .data(categories)
      .join("text")
      .attr("class", "category")
    .attr("transform", d => {
      const degrees = (angle(d) + angle.bandwidth() / 2) * 180 / Math.PI - 90;
      return "rotate(" + degrees + ") translate(" + (outer + 10) + ",0) rotate(" + (degrees > 90 ? 180 : 0) + ")";
    })
      .attr("text-anchor", d => angle(d) + angle.bandwidth() / 2 > Math.PI ? "end" : "start")
    .attr("dy", ".35em")
      .attr("font-size", 10)
      .text(d => d);
${circos?`  if (series.length > 2) svg.append("text")
      .attr("x", margin.left)
      .attr("y", height - 8)
    .text(${js(local(locale,'Only the two selected series are shown.','仅显示所选两个系列，可在环形布局中调整。','選択した二系列のみ表示します。円形レイアウトで変更できます。'))});
`:''}`;}

function threeSource(c:Config,locale:Locale){return `  // ${local(locale,'Project cuboid faces to SVG and sort by depth.','将柱体各面投影到 SVG，并按深度绘制。','直方体の面を SVG に投影し、深度順に描画します。')}
  const bx = d3.scaleBand()
      .domain(categories)
      .range([-1,1])
      .padding(${c.barPadding});
  const bz = d3.scaleBand()
      .domain(series)
      .range([-1,1])
      .padding(.2);
  const by = d3.scaleLinear()
      .domain([0, d3.max(cells, d => d.value) || 1])
      .nice()
      .range([-1,1]);
  let pitch = ${c.rotationX} * Math.PI / 180, yaw = ${c.rotationY} * Math.PI / 180, zoom = 1;
  const project = ([x,y,z]) => {
    const xx = x * Math.cos(yaw) + z * Math.sin(yaw), zz = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const yy = y * Math.cos(pitch) - zz * Math.sin(pitch), depth = y * Math.sin(pitch) + zz * Math.cos(pitch);
    const unit = Math.min(innerW, innerH) * .27 * zoom * ${c.perspective} / (${c.perspective} + depth);
    return {x:innerW / 2 + xx * unit, y:innerH / 2 - yy * unit, depth};
  };
  const axes = g.append("g"), faces = g.append("g"), labels = g.append("g");
  const draw = () => {
    axes.selectAll("*")
      .remove();
    const edges = [];
    for (const axis of [0,1,2]) for (const a of [-1,1]) for (const b of [-1,1]) {
      const p = [-1,-1,-1], q = [-1,-1,-1];
      p[(axis+1)%3] = q[(axis+1)%3] = a; p[(axis+2)%3] = q[(axis+2)%3] = b; q[axis] = 1; edges.push([p,q]);
    }
${c.grid?`    for (const tick of by.ticks(4)) edges.push([[-1,by(tick),-1],[1,by(tick),-1]], [[-1,by(tick),-1],[-1,by(tick),1]]);
`:''}    axes.selectAll("line")
      .data(edges)
      .join("line")
      .attr("x1", d => project(d[0]).x)
      .attr("y1", d => project(d[0]).y)
      .attr("x2", d => project(d[1]).x)
      .attr("y2", d => project(d[1]).y)
      .attr("stroke", "#dce4ef");
    const axisLabels = [...categories.map(d => ({text:d,point:[bx(d)+bx.bandwidth()/2,-1,-1.15]})), ...series.map(d => ({text:d,point:[-1.15,-1,bz(d)+bz.bandwidth()/2]})), ...by.ticks(4).map(d => ({text:d3.format(".3~g")(d),point:[-1.1,by(d),-1]}))];
    axes.selectAll("text")
      .data(axisLabels)
      .join("text")
      .attr("x", d => project(d.point).x)
      .attr("y", d => project(d.point).y)
      .attr("font-size", 10)
      .text(d => d.text);
    const polygons = cells.flatMap(d => {
      const x0=bx(d.category), x1=x0+bx.bandwidth(), z0=bz(d.series), z1=z0+bz.bandwidth(), y0=by(0), y1=by(d.value);
      const vertices=[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
      return [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].map((indices,i) => {
        const points=indices.map(index => project(vertices[index]));
        return {...d, points, depth:d3.mean(points,p => p.depth), shade:i};
      });
    }).sort((a,b) => b.depth-a.depth);
    faces.selectAll("path.bar")
      .data(polygons)
      .join("path")
      .attr("class", "bar")
      .attr("d", d => "M" + d.points.map(p => p.x + "," + p.y)
      .join("L") + "Z")
      .attr("fill", d => d3.color(fill(d)).brighter((d.shade-2)*.18))
      .attr("stroke", "#ffffff55")
      .attr("opacity", ${c.opacity})
      .call(tip);
    labels.selectAll("text")
      .data(${c.labels?'cells':'[]'})
      .join("text")
      .attr("x", d => project([bx(d.category)+bx.bandwidth()/2,by(d.value),bz(d.series)+bz.bandwidth()/2]).x)
      .attr("y", d => project([bx(d.category)+bx.bandwidth()/2,by(d.value),bz(d.series)+bz.bandwidth()/2]).y-4)
      .attr("text-anchor", "middle")
      .text(d => d3.format(".3~g")(d.value));
  };
  draw();
${c.rotationEnabled?`  svg.style("touch-action", "none")
      .style("cursor", "grab")
    .call(d3.drag()
      .on("drag", event => {yaw += event.dx*.008; pitch -= event.dy*.008; draw();}));
`:''}${c.zoom?`  svg.on("wheel", event => {event.preventDefault(); zoom=Math.max(.4,Math.min(3,zoom*Math.exp(-event.deltaY*.001))); draw();}, {passive:false});
`:''}  svg.on("dblclick", () => {pitch=${c.rotationX}*Math.PI/180; yaw=${c.rotationY}*Math.PI/180; zoom=1; draw();});
`;}

function histogramSource(c:Config,locale:Locale){return `  const values = processedData.map(d => d.value);
  let [low, high] = d3.extent(values);
  if (low === high) {low -= Math.abs(low)*.1 || 1; high += Math.abs(high)*.1 || 1;}
  const count = ${c.binCount}, binWidth = (high-low)/count;
  const bins = d3.range(count).map(i => ({low:low+i*binWidth, high:low+(i+1)*binWidth, count:0}));
  values.forEach(v => bins[Math.min(count-1,Math.max(0,Math.floor((v-low)/binWidth)))].count++);
  bins.forEach(d => {d.value=${c.histogramMode==='density'?'d.count/(values.length*binWidth)':'d.count'}; d.tip=[d3.format(".4~g")(d.low)+"–"+d3.format(".4~g")(d.high), "n = "+d.count];});
  const mean=d3.mean(values), sd=d3.deviation(values) || 0;
  const bandwidth = Math.max(1e-9, (sd || binWidth) * ${c.bandwidthFactor} * Math.pow(values.length,-.2));
  const density = value => ${c.histogramFit==='normal'?'sd>0 ? Math.exp(-.5*((value-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI)) : 0':`d3.mean(values, v => Math.exp(-.5*((value-v)/bandwidth)**2)/(bandwidth*Math.sqrt(2*Math.PI)))`};
  const curve=d3.range(161).map(i => {const x=low+(high-low)*i/160; return {x,y:density(x)*${c.histogramMode==='density'?'1':'values.length*binWidth'}};});
  const x=d3.scaleLinear()
      .domain([low,high])
      .range([0,innerW]);
  const y=d3.scaleLinear()
      .domain([0,Math.max(d3.max(bins,d=>d.value), ${c.histogramFit==='none'?'0':'d3.max(curve,d=>d.y)'}) || 1])
      .nice()
      .range([innerH,0]);
${c.grid?`  g.append("g")
      .call(d3.axisLeft(y)
      .ticks(5)
      .tickSize(-innerW)
      .tickFormat(()=>""))
    .call(layer=>layer.select(".domain")
      .remove())
      .call(layer=>layer.selectAll("line")
      .attr("stroke","#e8edf2"));
`:''}${c.xAxis?`  g.append("g")
      .attr("transform","translate(0,"+innerH+")")
      .call(d3.axisBottom(x));\n`:''}${c.yAxis?`  g.append("g")
      .call(d3.axisLeft(y)
      .ticks(5));\n`:''}
  g.selectAll("rect.bar")
      .data(bins)
      .join("rect")
      .attr("class","bar")
    .attr("x",d=>x(d.low)+.5)
      .attr("y",d=>y(d.value))
      .attr("width",d=>Math.max(0,x(d.high)-x(d.low)-1))
    .attr("height",d=>innerH-y(d.value))
      .attr("fill",${js(c.color)})
      .attr("opacity",${c.opacity})
      .call(tip);
${c.histogramFit!=='none'?`  // ${local(locale,'Scale the fitted density to the same units as the histogram.','拟合密度按直方图单位缩放，频数模式乘以样本数与箱宽。','フィット密度をヒストグラムと同じ単位に変換し、度数では標本数と階級幅を掛けます。')}
${c.histogramFit==='normal'?`  if (!(sd > 0)) svg.append("text")
    .attr("x", margin.left)
    .attr("y", height - 8)
    .text(${js(local(locale,'Normal fit requires nonzero sample deviation.','正态拟合需要非零样本标准差。','正規分布の近似にはゼロ以外の標本標準偏差が必要です。'))});
  if (sd > 0)
`:''}  g.append("path")
    .datum(curve)
      .attr("class","fit")
    .attr("d",d3.line()
      .x(d=>x(d.x))
      .y(d=>y(d.y)))
    .attr("fill","none")
      .attr("stroke",${js(c.significantColor)})
      .attr("stroke-width",${c.lineWidth});
`:''}  g.append("text")
      .attr("x",innerW/2)
      .attr("y",innerH+48)
      .attr("text-anchor","middle")
      .text(${js(c.xField)});
  g.append("text")
      .attr("transform","rotate(-90)")
      .attr("x",-innerH/2)
      .attr("y",-50)
      .attr("text-anchor","middle")
      .text(${js(local(locale,c.histogramMode==='density'?'Density':'Count',c.histogramMode==='density'?'概率密度':'频数',c.histogramMode==='density'?'確率密度':'度数'))});
`;}
function glyphSource(c:Config,locale:Locale){const mode=c.barVariant;return `  // ${local(locale,'Decorative geometry does not change the height of the encoded value.','装饰形状不改变数值对应的顶点高度。','装飾の形状を変えても、値を表す頂点の高さは変わりません。')}
${mode==='stem'?`  marks.selectAll("rect.background")
    .data(segments)
    .join("rect")
    .attr("class","background")
    .attr("x",position)
    .attr("width",thickness)
    .attr("y",value(${c.barBackgroundValue}))
    .attr("height",Math.max(0,value(0)-value(${c.barBackgroundValue})))
    .attr("fill",${js(c.barBackgroundColor)});
  marks.selectAll("line.bar")
    .data(segments)
    .join("line")
    .attr("class","bar")
    .attr("x1",d=>position(d)+thickness/2)
    .attr("x2",d=>position(d)+thickness/2)
    .attr("y1",value(0))
    .attr("y2",d=>value(d.value))
    .attr("stroke",fill)
    .attr("opacity",${c.opacity})
    .attr("stroke-width",${c.lineWidth})
    .call(tip);
  marks.selectAll("circle.stem-tip")
    .data(segments)
    .join("circle")
    .attr("class","stem-tip")
    .attr("cx",d=>position(d)+thickness/2)
    .attr("cy",d=>value(d.value))
    .attr("r",${c.radius})
    .attr("fill","white")
    .attr("stroke",fill)
    .attr("opacity",${c.opacity})
    .attr("stroke-width",${c.lineWidth})
    .call(tip);`
:mode==='pencil'?`  marks.selectAll("path.bar")
    .data(segments)
    .join("path")
    .attr("class","bar")
    .attr("d",d=>{const x=position(d),top=value(d.value),bottom=value(0),cap=Math.min((bottom-top)*${c.barGlyphRatio},thickness*.8);
      return "M"+x+","+bottom+"V"+(top+cap)+"L"+(x+thickness/2)+","+top+"L"+(x+thickness)+","+(top+cap)+"V"+bottom+"Z";})
    .attr("fill",fill)
    .attr("opacity",${c.opacity})
    .call(tip);
  marks.selectAll("path.pencil-tip")
    .data(segments)
    .join("path")
    .attr("class","pencil-tip")
    .attr("d",d=>{const x=position(d),top=value(d.value),cap=Math.min((value(0)-top)*${c.barGlyphRatio},thickness*.8);
      return "M"+x+","+(top+cap)+"L"+(x+thickness/2)+","+top+"L"+(x+thickness)+","+(top+cap)+"Z";})
    .attr("fill",d=>d3.color(fill(d)).darker(.5))
    .attr("pointer-events","none");`
:`${mode==='ice'?`  marks.selectAll("rect.stick")
    .data(segments)
    .join("rect")
    .attr("class","stick")
    .attr("x",d=>position(d)+thickness*.4)
    .attr("width",thickness*.2)
    .attr("y",value(0)-1)
    .attr("height",${c.barGlyphRatio}*80)
    .attr("rx",3)
    .attr("fill","#d9b88c");`:''}
  marks.selectAll("rect.bar")
    .data(segments)
    .join("rect")
    .attr("class","bar")
    .attr("x",position)
    .attr("width",thickness)
    .attr("y",d=>value(d.value))
    .attr("height",d=>Math.max(0,value(0)-value(d.value)))
    .attr("rx",${mode==='ice'?'thickness/2':c.cornerRadius})
    .attr("fill",fill)
    .attr("opacity",${c.opacity})
    .call(tip);
${mode==='platform'?`  marks.selectAll("path.platform")
    .data(segments)
    .join("path")
    .attr("class","platform")
    .attr("d",d=>{const x=position(d),y=value(0),depth=${c.barDepth};return "M"+x+","+y+"h"+thickness+"l"+depth+","+depth+"v16h-"+thickness+"v-16Z";})
    .attr("fill",d=>d3.color(fill(d)).brighter(.7))
    .attr("stroke","white");`:''}`}
`;}
