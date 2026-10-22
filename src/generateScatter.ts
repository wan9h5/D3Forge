import { interpolatorNames } from './chartColors';
import { categoricalColors } from './chartColors';
import type { Config, Row } from './model';
import type { Locale } from './i18n';
import type { CodeParts } from './generate';
import { codeComment } from './codeComments';
import { scatterStatistics } from './scatterStatistics';
import { isPca2D, pcaAxisTitle } from './scatterModel';
import { generatePcaCode } from './generatePca';
const js=(v:unknown)=>JSON.stringify(v);
export function generateScatterCode(data:Row[],c:Config,locale:Locale):CodeParts {
 if(isPca2D(c.scatterVariant))return generatePcaCode(data,c,locale);
 const mode=c.scatterVariant,three=mode==='3d',bubble=mode==='bubble',paired=mode==='paired',gsea=mode==='gsea';
 const categorical=bubble||paired||gsea,margin=mode==='marginal';
 const comment=(en:string,zh:string,ja:string)=>locale==='zh'?zh:locale==='ja'?ja:en;
 const xLabel=mode==='rank'?comment('Rank','排名','順位'):c.xField;
 const dataSource=`// ${codeComment('Replace this array with your own data. Keep the mapped field names.',locale)}
const data = ${JSON.stringify(data,null,2)};
`;
 const numericColor=c.continuousColor||bubble;
 const logic=`import * as d3 from "d3";

// ${codeComment('Call renderChart(container, data) in any Web project with D3 v7 installed.',locale)}
function renderChart(container, data) {
  const root = d3.select(container)
    .style("position", "relative");
  root.selectAll("*")
    .remove();
  const width = ${c.width}, height = ${c.height};
  const margin = {top: ${margin?100:54}, right: ${margin?120:gsea?90:38}, bottom: ${categorical?100:62}, left: ${bubble?110:70}};
  const innerW = Math.max(40, width - margin.left - margin.right);
  const innerH = Math.max(40, height - margin.top - margin.bottom);
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", ${js(comment('Scatter visualization','散点可视化','散布図'))})
    .style("display", "block")
    .style("width", "100%")
    .style("background", ${js(c.background)})
    .style("font", "12px system-ui");
  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // ${codeComment('CSV values may be strings. Skip blank, missing and non-finite values.',locale)}
  const numeric = v => v != null && String(v).trim() !== "" && Number.isFinite(Number(v));
  const present = v => v != null && String(v).trim() !== "";
  let processedData = data.filter(d =>
    ${mode==='rank'?'true':`${categorical?'present':'numeric'}(d[${js(c.xField)}])`}
    && ${bubble?'present':'numeric'}(d[${js(c.yField)}])${bubble?`
    && numeric(d[${js(c.sizeField)}]) && +d[${js(c.sizeField)}] >= 0 && numeric(d[${js(c.colorField)}])`:''}${three?`
    && numeric(d[${js(c.zField)}])`:''}${paired?`
    && present(d[${js(c.pairField)}])`:''}${gsea?`
    && numeric(d[${js(c.colorField)}]) && +d[${js(c.colorField)}] >= 0 && +d[${js(c.colorField)}] <= 1`:''}${numericColor?`
    && numeric(d[${js(c.colorField)}])`:''}${!categorical&&mode!=='rank'&&c.xScale==='log'?`
    && +d[${js(c.xField)}] > 0`:''}${!categorical&&c.yScale==='log'?`
    && +d[${js(c.yField)}] > 0`:''}
  ).map((d, index) => ({...d,
    _x: ${mode==='rank'?'index + 1':categorical?`String(d[${js(c.xField)}])`:`+d[${js(c.xField)}]`},
    _y: ${bubble?`String(d[${js(c.yField)}])`:`+d[${js(c.yField)}]`},
    _z: ${three?`+d[${js(c.zField)}]`:'0'},
    _group: ${c.groupField?`String(d[${js(c.groupField)}] ?? "")`:'"All"'},
    _value: numeric(d[${js(c.colorField)}]) ? +d[${js(c.colorField)}] : 0,
    _size: numeric(d[${js(c.sizeField)}]) ? Math.max(0, +d[${js(c.sizeField)}]) : 1,
    _index: index
  }));
  if (!processedData.length) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .text(${js(comment('No valid rows for the selected fields.','所选字段没有有效数据','選択した項目に有効なデータがありません'))});
    return svg.node();
  }
${mode==='rank'?`  processedData.sort((a, b) => ${c.rankDescending?'b._y - a._y':'a._y - b._y'} || a._index - b._index);
  processedData.forEach((d, i) => { d._x = i + 1; });
`:''}${paired?`  // ${comment('Average duplicate subject / condition observations; never join different cohorts.','同一队列内，对象与条件重复观测取均值；不同队列不连线。','同じコホート内の対象と条件の重複観測を平均し、異なるコホートは結びません。')}
  processedData = Array.from(d3.group(processedData, d => d._group, d => String(d[${js(c.pairField)}])), ([cohort, subjects]) =>
    Array.from(subjects, ([subject, rows]) => Array.from(d3.group(rows, d => d._x), ([condition, duplicates]) => ({...duplicates[0], _y: d3.mean(duplicates, d => d._y)}))).flat()
  ).flat();
  processedData.forEach(d => { d._x = d._group + " / " + d._x; });
`:''}
  const domain = values => {
    let [lo, hi] = d3.extent(values);
    if (lo === hi) { const pad = Math.abs(lo) * .1 || 1; lo -= pad; hi += pad; }
    return [lo, hi];
  };
  const groups = Array.from(new Set(processedData.map(d => d._group)));
  const color = ${numericColor?`d3.scaleSequential(d3.${(interpolatorNames[c.chartScheme]||({viridis:'interpolateViridis',turbo:'interpolateTurbo',blues:'interpolateBlues'})[c.scatterPalette])})`:'d3.scaleOrdinal()'}
    .domain(${numericColor?(c.colorDomainEnabled?`[${c.colorMin}, ${c.colorMax}]`:'domain(processedData.map(d => d._value))'):'groups'})${numericColor?'':`
    .range(${js(categoricalColors(c.color,c.secondaryColor,c.chartScheme))})`};
  const pointColor = d => ${mode==='fold'?`{
    const delta = ${c.foldLog?'d._y - d._x':'d._x > 0 && d._y > 0 ? Math.log2(d._y / d._x) : 0'};
    return delta > Math.log2(${c.foldRatio}) ? ${js(c.upColor)} : delta < -Math.log2(${c.foldRatio}) ? ${js(c.downColor)} : ${js(c.neutralColor)};
  }`:numericColor?'color(d._value)':'color(d._group)'};
  const pointRadius = ${bubble||c.scatterSizeEnabled?`d3.scaleSqrt()
    .domain([0, d3.max(processedData, d => d._size) || 1])
    .range([${bubble?0:c.sizeMin}, ${bubble?c.radius:c.sizeMax}])`:`() => ${c.radius}`};
  const markRadius = d => pointRadius(${bubble||c.scatterSizeEnabled?'d._size':'d'});
  const tooltip = ${c.tooltip?`root.append("div")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("background", "white")
    .style("border", "1px solid #dae2ed")
    .style("border-radius", "7px")
    .style("padding", "8px 12px")
    .style("box-shadow", "0 5px 20px #20304a18")
    .style("font", "12px system-ui")`:'null'};
  const attachTooltip = selection => {
    if (!tooltip) return;
    selection.on("pointermove.tooltip", (event, d) => {
      tooltip.selectAll("*")
      .remove();
      ${js(c.tooltipFields)}.forEach(field => tooltip.append("div")
      .text(field + ": " + (d[field] ?? "—")));
      const [px, py] = d3.pointer(event, container);
      tooltip.style("display", "block")
        .style("left", Math.max(0, Math.min(px + 12, container.clientWidth - 180)) + "px")
        .style("top", Math.max(0, py - 20) + "px");
    })
      .on("pointerleave.tooltip", () => tooltip.style("display", "none"));
  };
${three?threeSource(c,locale):twoSource(c,locale,xLabel)}
${c.legend&&!gsea?`  const legend = svg.append("g")
    .attr("transform", "translate(" + margin.left + ",20)");
${numericColor?`  const limits = color.domain();
  legend.selectAll("rect")
    .data(d3.range(60))
    .join("rect")
    .attr("x", d => d * 2)
    .attr("width", 2.1)
    .attr("height", 8)
    .attr("fill", d => color(limits[0] + d / 59 * (limits[1] - limits[0])));
  legend.append("text")
      .attr("y", 22)
      .text(${js(c.colorField)} + "  " + limits.map(d3.format(".3~g"))
      .join(" → "));
`:`  legend.selectAll("g")
    .data(${mode==='fold'?'["Up", "Down", "Stable"]':'groups'})
    .join("g")
    .attr("transform", (_, i) => "translate(" + i % 5 * Math.min(120, innerW / 5) + "," + Math.floor(i / 5) * 16 + ")")
    .each(function(value, i) {
      d3.select(this)
      .append("circle")
      .attr("r", 4)
      .attr("fill", ${mode==='fold'?`[${js(c.upColor)},${js(c.downColor)},${js(c.neutralColor)}][i]`:'color(value)'});
      d3.select(this)
      .append("text")
      .attr("x", 9)
      .attr("dy", ".35em")
      .text(value);
    });
`}`:''}  return svg.node();
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

function twoSource(c:Config,locale:Locale,xLabel:string) {
 const mode=c.scatterVariant,bubble=mode==='bubble',paired=mode==='paired',gsea=mode==='gsea',cat=bubble||paired||gsea;
 const ct=(en:string,zh:string,ja:string)=>locale==='zh'?zh:locale==='ja'?ja:en;
 return `  const x = ${cat?'d3.scalePoint()':c.xScale==='log'?'d3.scaleLog()':'d3.scaleLinear()'}
    .domain(${cat?'Array.from(new Set(processedData.map(d => d._x)))':'domain(processedData.map(d => d._x))'})
    .range([0, innerW])${cat?'\n    .padding(.6)':'\n    .nice()'};
  const y = ${bubble?'d3.scalePoint()':!cat&&c.yScale==='log'?'d3.scaleLog()':'d3.scaleLinear()'}
    .domain(${bubble?'Array.from(new Set(processedData.map(d => d._y)))':gsea?'domain([0, ...processedData.map(d => d._y)])':'domain(processedData.map(d => d._y))'})
    .range([innerH, 0])${bubble?'\n    .padding(.6)':'\n    .nice()'};
${c.xDomainEnabled&&!cat?`  x.domain([${c.xMin}, ${c.xMax}]);
`:''}${c.yDomainEnabled&&!bubble?`  y.domain([${c.yMin}, ${c.yMax}]);
`:''}
  const plot = g.append("svg")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("overflow", "hidden");
  const marks = plot.append("g");
  const xAxis = g.append("g")
    .attr("transform", "translate(0," + innerH + ")");
  const yAxis = g.append("g");
  const grid = g.insert("g", ":first-child");
  const drawAxes = () => {
${c.xAxis?`    xAxis.call(d3.axisBottom(x)${cat?'':`.ticks(${c.xTickCount})`});
`:''}${c.yAxis?`    yAxis.call(d3.axisLeft(y)${bubble?'':`.ticks(${c.yTickCount})`});
`:''}${c.grid?`    grid.call(d3.axisLeft(y)${bubble?'':`.ticks(${c.yTickCount})`}
      .tickSize(-innerW)
      .tickFormat(() => ""));
    grid.select(".domain")
      .remove();
    grid.selectAll("line")
      .attr("stroke", ${js(c.gridStyle?c.gridColor:'#e8edf2')})
      .attr("stroke-width", ${c.gridStyle?c.gridWidth:1})
      .attr("stroke-opacity", ${c.gridStyle?c.gridOpacity:1});
`:''}    xAxis.selectAll("text")
      .attr("transform", "rotate(${cat?-25:c.axisStyle?c.xTickAngle:0})")
      .attr("text-anchor", ${js(cat?'end':'middle')});
    g.selectAll(".tick text")
      .attr("font-size", ${c.axisStyle?c.tickFontSize:11});
  };
  g.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH + ${cat?86:48})
    .attr("text-anchor", "middle")
    .text(${js(c.axisStyle&&c.xTitle?c.xTitle:xLabel)});
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", ${bubble?-88:-50})
    .attr("text-anchor", "middle")
    .text(${js(c.axisStyle&&c.yTitle?c.yTitle:c.yField)});
${c.fitEnabled||mode==='correlation'?`  // ${ct('Fit on original numeric values; bootstrap bands estimate the mean curve, not individual predictions.','在原始数值尺度拟合；重采样置信带估计平均曲线，不是个体预测区间。','元の数値尺度で回帰します。ブートストラップ帯は平均曲線の信頼帯で、個別の予測区間ではありません。')}
${scatterStatistics}
  const fits = Array.from(${c.fitByGroup?'d3.group(processedData, d => d._group)':'new Map([["All", processedData]])'}, ([name, rows]) => {
    const model = fit(rows, ${c.fitModel==='quadratic'?2:1});
    const samples = ${c.confidenceBand?`bootstrapFits(rows, ${c.fitModel==='quadratic'?2:1})`:'[]'};
    return {name, rows, model, samples};
  }).filter(d => d.model);
`:''}
  const draw = () => {
    marks.selectAll("*")
      .remove();
    drawAxes();
${mode==='density'?densitySource(c):''}${mode==='joint'?`    for (const axis of ["x", "y"]) marks.append("line")
      .attr("x1", axis === "x" ? x(0) : 0)
      .attr("x2", axis === "x" ? x(0) : innerW)
      .attr("y1", axis === "y" ? y(0) : 0)
      .attr("y2", axis === "y" ? y(0) : innerH)
      .attr("stroke", "#9ca9ba")
      .attr("stroke-dasharray", "4,3");
`:''}${mode==='fold'?`    const ratios = [1 / ${c.foldRatio}, 1, ${c.foldRatio}];
    marks.selectAll("path.fold")
      .data(ratios)
      .join("path")
      .attr("class", "fold")
      .attr("fill", "none")
      .attr("stroke", "#9baabd")
      .attr("stroke-dasharray", "5,4")
      .attr("d", ratio => d3.line()
        .defined(d => Number.isFinite(y(d[1])))
        .x(d => x(d[0]))
        .y(d => y(d[1]))(d3.range(81).map(i => {
          const value = x.invert(i / 80 * innerW);
          return [value, ${c.foldLog?'value + Math.log2(ratio)':'value * ratio'}];
        })));
`:''}${paired?`    const lines = Array.from(d3.group(processedData, d => d._group, d => String(d[${js(c.pairField)}])).values()).flatMap(subjects => Array.from(subjects.values()));
    marks.selectAll("path.pair")
      .data(lines)
      .join("path")
      .attr("class", "pair")
      .attr("fill", "none")
      .attr("stroke", d => color(d[0]._group))
      .attr("stroke-opacity", .35)
      .attr("stroke-width", ${c.lineWidth})
      .attr("d", rows => d3.line()
      .x(d => x(d._x))
      .y(d => y(d._y))(rows.slice().sort((a, b) => x(a._x) - x(b._x))));
`:''}${gsea?gseaSource(c):''}${c.fitEnabled?`    fits.forEach(({name, model, samples, rows}, index) => {
      const [lo, hi] = d3.extent(rows, d => d._x);
      const curve = d3.range(81).map(i => {
        const value = lo + (hi - lo) * i / 80;
        const predictions = samples.map(f => f.predict(value)).sort(d3.ascending);
        return {x: value, y: model.predict(value), low: d3.quantileSorted(predictions, .025), high: d3.quantileSorted(predictions, .975)};
      });
${c.confidenceBand?`      marks.append("path")
        .attr("class", "confidence-band")
        .attr("fill", ${c.fitByGroup?'color(name)':js(c.color)})
        .attr("fill-opacity", .14)
        .attr("d", d3.area()
      .defined(d => Number.isFinite(y(d.low)) && Number.isFinite(y(d.high)))
      .x(d => x(d.x))
      .y0(d => y(d.low))
      .y1(d => y(d.high))(curve));
`:''}      marks.append("path")
        .attr("class", "regression")
        .attr("fill", "none")
        .attr("stroke", ${c.fitByGroup?'color(name)':js(c.color)})
        .attr("stroke-width", ${c.lineWidth})
        .attr("d", d3.line()
      .defined(d => Number.isFinite(y(d.y)))
      .x(d => x(d.x))
      .y(d => y(d.y))(curve));
      marks.append("text")
        .attr("x", 12)
        .attr("y", 18 + index * 16)
        .attr("font-size", 11)
        .attr("fill", ${c.fitByGroup?'color(name)':js(c.color)})
        .text(name + ": y = " + d3.format(".3~g")(model.intercept) + " + " + d3.format(".3~g")(model.slope) + "x" + (${c.fitModel==='quadratic'} ? " + " + d3.format(".3~g")(model.quadratic) + "x²" : "") + "; R² = " + (model.r2 == null ? "undefined" : d3.format(".3f")(model.r2)));
    });
`:''}${mode==='correlation'?`    const coefficient = correlation(processedData, ${js(c.correlationMethod)});
    marks.append("text")
      .attr("x", 12)
      .attr("y", ${c.fitEnabled?38:18})
      .text(${js(c.correlationMethod==='spearman'?'Spearman ρ':'Pearson r')} + " = " + (coefficient == null ? "undefined" : d3.format(".3f")(coefficient)) + "; n = " + processedData.length);
`:''}${!gsea&&c.showPoints?`    const points = marks.selectAll("path.point")
      .data(processedData)
      .join("path")
      .attr("class", "point")
      .attr("transform", d => "translate(" + x(d._x) + "," + y(d._y) + ")")
      .attr("d", d => d3.symbol()
      .type(d3.${({circle:'symbolCircle',square:'symbolSquare',triangle:'symbolTriangle',diamond:'symbolDiamond',star:'symbolStar',cross:'symbolCross'})[c.pointShape]})
      .size(Math.PI * markRadius(d) ** 2)())
      .attr("fill", pointColor)
      .attr("opacity", ${c.opacity})
      .attr("stroke", ${js(c.markBorder?c.borderColor:'none')})
      .attr("stroke-width", ${c.borderWidth});
    attachTooltip(points);
`:''}${c.labels&&!gsea?`    marks.selectAll("text.label")
      .data(processedData.slice().sort((a, b) => ${mode==='motif'?'b._x - a._x':'b._y - a._y'}).slice(0, ${c.labelLimit}))
      .join("text")
      .attr("class", "label")
      .attr("x", d => x(d._x) + markRadius(d) + 3)
      .attr("y", d => y(d._y) - 3)
      .attr("fill", ${js(c.labelStyle?c.labelColor:'#40516a')})
      .attr("font-size", ${c.labelStyle?c.labelFontSize:11})
      .text(d => d[${js(c.labelField)}] ?? "");
`:''}${mode==='marginal'?marginalSource(c):''}  };
  draw();
${c.zoom&&!cat?`  const initialX = x.copy(), initialY = y.copy();
  svg.call(d3.zoom()
    .extent([[margin.left, margin.top], [margin.left + innerW, margin.top + innerH]])
    .scaleExtent([.5, 20])
    .on("zoom", event => {
      x.domain(event.transform.rescaleX(initialX)
      .domain());
      y.domain(event.transform.rescaleY(initialY)
      .domain());
      draw();
    }));
`:''}`;
}

function densitySource(c:Config) {return `    const contours = d3.contourDensity()
      .x(d => x(d._x))
      .y(d => y(d._y))
      .size([Math.ceil(innerW), Math.ceil(innerH)])
      .bandwidth(${c.densityBandwidth})
      .thresholds(${c.densityLevels})(processedData);
    const densityColor = d3.scaleSequential(d3.${interpolatorNames[c.chartScheme]||'interpolateBlues'})
      .domain([0, d3.max(contours, d => d.value) || 1]);
    marks.selectAll("path.density")
      .data(contours)
      .join("path")
      .attr("class", "density")
      .attr("d", d3.geoPath())
      .attr("fill", d => densityColor(d.value))
      .attr("opacity", .75);
`;}
function marginalSource(c:Config){return `    g.selectAll(".marginal")
      .remove();
    for (const axis of ["x", "y"]) {
      const scale = axis === "x" ? x : y;
      const values = processedData.map(d => axis === "x" ? d._x : d._y).sort(d3.ascending);
      const layer = g.append("g")
      .attr("class", "marginal");
${c.marginalType==='box'?`      const q1 = d3.quantileSorted(values, .25), median = d3.quantileSorted(values, .5), q3 = d3.quantileSorted(values, .75);
      const iqr = q3 - q1;
      const inside = values.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
      const low = inside[0], high = inside[inside.length - 1];
      layer.attr("transform", axis === "x" ? "translate(0,-40)" : "translate(" + (innerW + 40) + ",0)");
      layer.append("line")
        .attr("x1", axis === "x" ? scale(low) : 0)
      .attr("x2", axis === "x" ? scale(high) : 0)
        .attr("y1", axis === "y" ? scale(low) : 0)
      .attr("y2", axis === "y" ? scale(high) : 0)
        .attr("stroke", ${js(c.color)});
      layer.append("rect")
        .attr("x", axis === "x" ? scale(q1) : -10)
      .attr("y", axis === "y" ? scale(q3) : -10)
        .attr("width", axis === "x" ? Math.max(0, scale(q3) - scale(q1)) : 20)
        .attr("height", axis === "y" ? Math.max(0, scale(q1) - scale(q3)) : 20)
        .attr("fill", ${js(c.color)})
      .attr("fill-opacity", .2)
      .attr("stroke", ${js(c.color)});
      layer.append("line")
        .attr("x1", axis === "x" ? scale(median) : -10)
      .attr("x2", axis === "x" ? scale(median) : 10)
        .attr("y1", axis === "y" ? scale(median) : -10)
      .attr("y2", axis === "y" ? scale(median) : 10)
        .attr("stroke", ${js(c.color)});
      layer.selectAll("circle")
      .data(values.filter(v => v < low || v > high))
      .join("circle")
        .attr("cx", v => axis === "x" ? scale(v) : 0)
      .attr("cy", v => axis === "y" ? scale(v) : 0)
        .attr("r", 2)
      .attr("fill", ${js(c.color)});
`:c.marginalType==='density'?`      const pixels = values.map(scale);
      const bandwidth = ${c.densityBandwidth};
      const length = axis === "x" ? innerW : innerH;
      const estimates = d3.range(61).map(i => {
        const position = i / 60 * length;
        return [position, d3.mean(pixels, value => Math.exp(-.5 * ((position - value) / bandwidth) ** 2))];
      });
      const amplitude = d3.scaleLinear()
      .domain([0, d3.max(estimates, d => d[1]) || 1])
      .range([0, 55]);
      layer.append("path")
        .attr("fill", ${js(c.color)})
      .attr("fill-opacity", .25)
      .attr("stroke", ${js(c.color)})
        .attr("d", axis === "x"
          ? d3.area()
      .x(d => d[0])
      .y0(-8)
      .y1(d => -8 - amplitude(d[1]))(estimates)
          : d3.area()
      .y(d => d[0])
      .x0(innerW + 8)
      .x1(d => innerW + 8 + amplitude(d[1]))(estimates));
`:`      const bins = d3.bin()
      .domain(scale.domain()).thresholds(${c.binCount})(values);
      const amplitude = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 1])
      .range([0, 55]);
      layer.selectAll("rect")
      .data(bins)
      .join("rect")
        .attr("x", d => axis === "x" ? scale(d.x0) : innerW + 8)
        .attr("y", d => axis === "x" ? -8 - amplitude(d.length) : scale(d.x1))
        .attr("width", d => axis === "x" ? Math.max(0, scale(d.x1) - scale(d.x0) - 1) : amplitude(d.length))
        .attr("height", d => axis === "x" ? amplitude(d.length) : Math.max(0, scale(d.x0) - scale(d.x1) - 1))
        .attr("fill", ${js(c.color)})
      .attr("fill-opacity", .55);
`}    }
`;}
function gseaSource(c:Config){return `    const fdrScale = d3.scaleLinear()
      .domain([0, Math.max(${c.pThreshold}, d3.max(processedData, d => d._value)) || 1])
      .nice()
      .range([innerH, 0]);
    g.selectAll(".fdr-axis, .fdr-title")
      .remove();
    g.append("g")
      .attr("class", "fdr-axis")
      .attr("transform", "translate(" + innerW + ",0)")
      .call(d3.axisRight(fdrScale)
      .ticks(5));
    g.append("text")
      .attr("class", "fdr-title")
      .attr("x", innerW + 16)
      .attr("y", -12)
      .text(${js(c.colorField)});
    marks.selectAll("rect.nes")
      .data(processedData)
      .join("rect")
      .attr("class", "nes")
      .attr("x", d => x(d._x) - x.step() * .3)
      .attr("y", d => Math.min(y(0), y(d._y)))
      .attr("width", x.step() * .6)
      .attr("height", d => Math.abs(y(d._y) - y(0)))
      .attr("fill", d => d._y >= 0 ? ${js(c.color)} : ${js(c.secondaryColor)})
      .attr("opacity", ${c.opacity})
      .call(attachTooltip);
    marks.append("line")
      .attr("x2", innerW)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#aab5c4");
${c.showThreshold?`    marks.append("line")
      .attr("x2", innerW)
      .attr("y1", fdrScale(${c.pThreshold}))
      .attr("y2", fdrScale(${c.pThreshold}))
      .attr("stroke", ${js(c.significantColor)})
      .attr("stroke-dasharray", "4,3");
`:''}    marks.selectAll("circle.fdr")
      .data(processedData)
      .join("circle")
      .attr("class", "fdr")
      .attr("cx", d => x(d._x))
      .attr("cy", d => fdrScale(d._value))
      .attr("r", ${c.radius})
      .attr("fill", ${js(c.significantColor)})
      .call(attachTooltip);
`;}

function threeSource(c:Config,locale:Locale){const ct=(en:string,zh:string,ja:string)=>locale==='zh'?zh:locale==='ja'?ja:en;return `  // ${ct('Rotate three-dimensional coordinates, project to SVG and paint far points first.','旋转三维坐标并投影到 SVG，远处的点先绘制。','三次元座標を回転して SVG に投影し、遠い点から描画します。')}
  const x = d3.scaleLinear()
      .domain(domain(processedData.map(d => d._x)))
      .range([-1, 1]);
  const y = d3.scaleLinear()
      .domain(domain(processedData.map(d => d._y)))
      .range([-1, 1]);
  const z = d3.scaleLinear()
      .domain(domain(processedData.map(d => d._z)))
      .range([-1, 1]);
${c.pcaAxes?`  // Preserve relative component distances with one shared scale for all three axes.
  const extent3D = Math.max(1e-12, d3.max(processedData, d => Math.max(Math.abs(d._x), Math.abs(d._y), Math.abs(d._z))) || 0);
  for (const scale of [x, y, z]) scale.domain([-extent3D, extent3D]);
`:''}  let rotationX = ${c.rotationX} * Math.PI / 180, rotationY = ${c.rotationY} * Math.PI / 180, zoom = 1;
  const projection = point => {
    const [a, b, h] = point;
    const xx = a * Math.cos(rotationY) + h * Math.sin(rotationY);
    const zz = -a * Math.sin(rotationY) + h * Math.cos(rotationY);
    const yy = b * Math.cos(rotationX) - zz * Math.sin(rotationX);
    const depth = b * Math.sin(rotationX) + zz * Math.cos(rotationX);
    const perspective = ${c.perspective} / (${c.perspective} + depth);
    const unit = Math.min(innerW, innerH) * .28 * zoom * perspective;
    return {x: innerW / 2 + xx * unit, y: innerH / 2 - yy * unit, depth};
  };
  const axes = g.append("g");
  const marks = g.append("g");
  const draw = () => {
    axes.selectAll("*")
      .remove();
    const segments = [];
    for (let axis = 0; axis < 3; axis++) for (const u of [-1, 1]) for (const v of [-1, 1]) {
      const a = [-1, -1, -1], b = [-1, -1, -1];
      a[(axis + 1) % 3] = b[(axis + 1) % 3] = u;
      a[(axis + 2) % 3] = b[(axis + 2) % 3] = v;
      b[axis] = 1;
      segments.push([a, b]);
    }
${c.grid?`    for (const tick of [-.5, 0, .5]) {
      segments.push([[-1,tick,-1],[1,tick,-1]], [[tick,-1,-1],[tick,1,-1]], [[-1,-1,tick],[1,-1,tick]], [[tick,-1,-1],[tick,-1,1]]);
    }
`:''}    axes.selectAll("line")
      .data(segments)
      .join("line")
      .attr("x1", d => projection(d[0]).x)
      .attr("y1", d => projection(d[0]).y)
      .attr("x2", d => projection(d[1]).x)
      .attr("y2", d => projection(d[1]).y)
      .attr("stroke", ${js(c.gridStyle?c.gridColor:'#dce3ee')})
      .attr("stroke-width", ${c.gridStyle?c.gridWidth:1})
      .attr("stroke-opacity", ${c.gridStyle?c.gridOpacity:1});
    [x, y, z].forEach((scale, axis) => {
      if ((axis === 0 && !${c.xAxis}) || (axis === 1 && !${c.yAxis}) || (axis === 2 && !${c.zAxis})) return;
      scale.ticks(4).forEach(value => {
        const point = [-1, -1, -1]; point[axis] = scale(value);
        const pixel = projection(point);
        axes.append("text")
      .attr("x", pixel.x + 5)
      .attr("y", pixel.y + 12)
      .attr("font-size", 10)
      .attr("fill", "#7e8ca3")
      .text(d3.format(".3~g")(value));
      });
      const end = [-1, -1, -1]; end[axis] = 1.25;
      const pixel = projection(end);
      axes.append("text")
      .attr("x", pixel.x)
      .attr("y", pixel.y)
      .attr("fill", "#52637d")
      .text([${js(c.pcaAxes?pcaAxisTitle(c.xField,c.pcaVariance1,c.pcaShowVariance):c.xField)},${js(c.pcaAxes?pcaAxisTitle(c.yField,c.pcaVariance2,c.pcaShowVariance):c.yField)},${js(c.pcaAxes?pcaAxisTitle(c.zField,c.pcaVariance3,c.pcaShowVariance):c.zField)}][axis]);
    });
    const projected = processedData.map(d => ({...d, pixel: projection([x(d._x), y(d._y), z(d._z)])})).sort((a, b) => b.pixel.depth - a.pixel.depth);
    marks.selectAll("circle.point")
      .data(projected, d => d._index)
      .join("circle")
      .attr("class", "point")
      .attr("cx", d => d.pixel.x)
      .attr("cy", d => d.pixel.y)
      .attr("r", markRadius)
      .attr("fill", pointColor)
      .attr("opacity", ${c.opacity})
      .order()
      .call(attachTooltip);
    marks.selectAll("text.label")
      .data(${c.labels?`projected.slice(-${c.labelLimit})`:'[]'})
      .join("text")
      .attr("class", "label")
      .attr("x", d => d.pixel.x + markRadius(d) + 3)
      .attr("y", d => d.pixel.y)
      .attr("font-size", 11)
      .text(d => d[${js(c.labelField)}] ?? "");
  };
  draw();
${c.rotationEnabled?`  svg.style("touch-action", "none")
    .style("cursor", "grab")
    .call(d3.drag()
      .on("drag", event => {
      rotationY += event.dx * .008;
      rotationX -= event.dy * .008;
      draw();
    }));
`:''}${c.zoom?`  svg.on("wheel", event => {
    event.preventDefault();
    zoom = Math.max(.4, Math.min(3, zoom * Math.exp(-event.deltaY * .001)));
    draw();
  }, {passive: false});
`:''}  svg.on("dblclick", () => {
    rotationX = ${c.rotationX} * Math.PI / 180;
    rotationY = ${c.rotationY} * Math.PI / 180;
    zoom = 1;
    draw();
  });
`;}
