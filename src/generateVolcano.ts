import { categoricalSchemes } from './chartColors';
import { interpolatorNames } from './chartColors';
import { vividPalette } from './chartColors';
import type { Config, Row } from './model';
import type { Locale } from './i18n';
import type { CodeParts } from './generate';
import { codeComment } from './codeComments';
const js=(v:unknown)=>JSON.stringify(v);

export function generateVolcanoCode(data:Row[],c:Config,locale:Locale):CodeParts {
 const tr=(en:string,zh:string,ja:string)=>locale==='zh'?zh:locale==='ja'?ja:en;
 const mode=c.volcanoVariant,faceted=['linked','marker'].includes(mode),cluster=mode==='cluster',radial=mode==='radial';
 const grouped=faceted||cluster||radial,gradient=c.volcanoColor==='gradient';
 const comments=(en:string,zh:string,ja:string)=>`// ${tr(en,zh,ja)}`;
 const dataSource=`// ${codeComment('Replace this array with your own data. Keep the mapped field names.',locale)}\nconst data = ${JSON.stringify(data,null,2)};\n`;
 const logic=`import * as d3 from "d3";

// ${codeComment('Call renderChart(container, data) in any Web project with D3 v7 installed.',locale)}
function renderChart(container, data) {
  const root = d3.select(container)
    .style("position", "relative");
  root.selectAll("*")
    .remove();
  const width = ${c.width}, height = ${c.height};
  const svg = root.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", ${js(c.volcanoSearch||c.volcanoBrush?'group':'img')})
    .attr("aria-label", ${js(tr('Volcano plot','火山图','ボルケーノプロット'))})
    .style("display", "block")
    .style("width", "100%")
    .style("background", ${js(c.canvasStyle?c.background:'white')})
    .style("font", "12px system-ui");
  const numeric = v => v != null && String(v).trim() !== "" && Number.isFinite(Number(v));
  const present = v => v != null && String(v).trim() !== "";
  ${comments('Use supplied P values; no differential analysis or correction is performed.','使用提供的 P 值，不运行差异分析或多重校正。','入力済み P 値を使用し、差次的解析や多重補正は実行しません。')}
  const baseThreshold = -Math.log10(${c.pThreshold});
  const fcThreshold = ${c.fcThreshold};
  const boundary = x => ${c.volcanoCurve?'Math.abs(x) > fcThreshold ? baseThreshold + '+c.volcanoCurveStrength+' / (Math.abs(x) - fcThreshold) : Infinity':'baseThreshold'};
  const classify = (x, y) => Math.abs(x) > fcThreshold && y > boundary(x)
    ? (x > 0 ? "up" : "down") : (y > baseThreshold ? "pOnly" : "ns");
  let processedData = data.filter(d =>
    numeric(d[${js(c.xField)}]) && numeric(d[${js(c.yField)}])
    && +d[${js(c.yField)}] > 0 && +d[${js(c.yField)}] <= 1${grouped?`
    && present(d[${js(c.volcanoPanelField)}])`:''}${c.volcanoVip?`
    && numeric(d[${js(c.volcanoVipField)}]) && +d[${js(c.volcanoVipField)}] >= 0`:''}${gradient&&c.volcanoGradientBy==='field'?`
    && numeric(d[${js(c.volcanoColorField)}])`:''}
  ).map((sourceRow, index) => {
    const x = +sourceRow[${js(c.xField)}], y = -Math.log10(+sourceRow[${js(c.yField)}]);
    return {sourceRow, index, x, y, status: classify(x, y),
      gene: String(sourceRow[${js(c.labelField)}] ?? ""),
      group: ${grouped?`String(sourceRow[${js(c.volcanoPanelField)}])`:'"All"'},
      category: String(sourceRow[${js(c.volcanoCategoryField)}] ?? ${js(tr('Unassigned','未分类','未分類'))}),
      value: ${gradient&&c.volcanoGradientBy==='field'?`+sourceRow[${js(c.volcanoColorField)}]`:'y'},
      vip: ${c.volcanoVip?`+sourceRow[${js(c.volcanoVipField)}]`:'1'}
    };
  });
  if (!processedData.length) {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text(${js(tr('No valid rows for the selected fields.','所选字段没有有效数据','選択した項目に有効なデータがありません'))});
    return svg.node();
  }
  const categories = Array.from(new Set(processedData.map(d => d.category)));
  const categoryColor = d3.scaleOrdinal(${js(categoricalSchemes[c.chartScheme]??vividPalette)})
    .domain(categories);
  const statusColor = d3.scaleOrdinal()
    .domain(["up", "down", "pOnly", "ns"])
    .range([${js(c.upColor)}, ${js(c.downColor)}, ${js(c.volcanoFourthColor)}, ${js(c.neutralColor)}]);
  const colorExtent = d3.extent(processedData, d => d.value);
  if (colorExtent[0] === colorExtent[1]) { colorExtent[0] -= 1; colorExtent[1] += 1; }
  const continuousColor = d3.scaleSequential(d3.${(interpolatorNames[c.chartScheme]||({viridis:'interpolateViridis',turbo:'interpolateTurbo',blues:'interpolateBlues'})[c.volcanoPalette])})
    .domain(colorExtent)
    .clamp(true);
  const pointColor = d => ${gradient?'continuousColor(d.value)':c.volcanoColor==='category'?'["up", "down"].includes(d.status) ? categoryColor(d.category) : statusColor("ns")':c.volcanoColor==='direction'?'statusColor(d.x >= 0 ? "up" : "down")':c.volcanoColor==='four'?'statusColor(d.status)':'statusColor(d.status === "pOnly" ? "ns" : d.status)'};
  ${comments('Square-root radius mapping makes point area proportional to VIP above the minimum marker area.','半径采用平方根映射，使超过最小标记面积的部分与 VIP 成正比。','半径の平方根対応により、最小面積を超える部分を VIP に比例させます。')}
  const maxVip = d3.max(processedData, d => d.vip) || 1;
  const radius = d => ${c.volcanoVip?`Math.sqrt(${c.volcanoMinRadius**2} + d.vip / maxVip * ${Math.max(0,c.volcanoMaxRadius**2-c.volcanoMinRadius**2)})`:String(c.radius)};
  const groups = Array.from(new Set(processedData.map(d => d.group)));
  const requestedPanels = ${mode==='linked'?`[${js(c.volcanoPanelA)} || groups[0], ${js(c.volcanoPanelB)} || groups.find(name => name !== (${js(c.volcanoPanelA)} || groups[0]))].filter(Boolean)`:'groups'};
  const panelNames = ${faceted?'Array.from(new Set(requestedPanels))':'["All"]'};
  const panelRows = panelNames.map(name => ${faceted?'processedData.filter(d => d.group === name)':'processedData'});
  const legendHeight = ${c.volcanoSearch||c.volcanoBrush?52:0} + ${c.legend?`Math.max(${gradient||c.volcanoVip?94:64}, ${c.volcanoColor==='category'?'Math.ceil((categories.length + 1) / 4) * 18 + 26':'0'})`:'24'};
  const columns = ${mode==='linked'?'Math.max(1, panelNames.length)':mode==='marker'?'Math.min(2, panelNames.length)':'1'};
  const rows = Math.ceil(panelNames.length / columns);
  const cellW = width / columns, cellH = (height - legendHeight) / rows;
  const margin = {left: ${radial?48:64}, right: ${radial?48:30}, top: 28, bottom: 58};
  const plotW = Math.max(20, cellW - margin.left - margin.right);
  const plotH = Math.max(20, cellH - margin.top - margin.bottom);
  const thresholdColor = ${js(c.thresholdColor)};
  const allMaxX = Math.max(fcThreshold * 1.15, d3.max(processedData, d => Math.abs(d.x)), .1) * 1.08;
  const allMaxY = Math.max(baseThreshold, d3.max(processedData, d => d.y), 1) * 1.12;
  const pins = new Set();
  const namedGenes = new Set(${js(c.volcanoLabelGenes)}.split(/[,;\\n]+/).map(s => s.trim()).filter(Boolean));
  const panels = [];
  let brushing = false;
  const linkLayer = svg.append("g")
    .attr("class", "gene-links")
    .attr("pointer-events", "none");
  const tooltip = ${c.tooltip?'root.append("div")':'d3.select(null)'}
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("white-space", "pre-line")
    .style("overflow-wrap", "anywhere")
    .style("max-width", "calc(100% - 16px)")
    .style("background", "#162b3b")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px");
  const tooltipFields = ${js(c.tooltipFields)};
  for (let panelIndex = 0; panelIndex < panelNames.length; panelIndex++) {
    const records = panelRows[panelIndex];
    const ox = (panelIndex % columns) * cellW + margin.left;
    const oy = legendHeight + Math.floor(panelIndex / columns) * cellH + margin.top;
    const g = svg.append("g")
      .attr("class", "volcano-panel")
      .attr("transform", "translate(" + ox + "," + oy + ")");
    const maxX = ${c.volcanoSharedScale||!faceted?'allMaxX':'Math.max(fcThreshold * 1.15, d3.max(records, d => Math.abs(d.x)) || .1, .1) * 1.08'};
    const maxY = ${c.volcanoSharedScale||!faceted?'allMaxY':'Math.max(baseThreshold, d3.max(records, d => d.y) || 1, 1) * 1.12'};
    const x = d3.scaleLinear()
      .domain(${c.xDomainEnabled?`[${c.xMin}, ${c.xMax}]`:'[-maxX, maxX]'})
      .range([0, plotW]);
    const y = d3.scaleLinear()
      .domain(${cluster?'[-maxY, maxY]':c.yDomainEnabled?`[${c.yMin}, ${c.yMax}]`:'[0, maxY]'})
      .range([plotH, 0]);
    const band = d3.scaleBand()
      .domain(groups)
      .range([0, plotW])
      .padding(${c.volcanoGroupGap});
    ${comments('Keep input records separate; repeated genes are never silently aggregated.','保留独立输入记录，不自动汇总重复基因。','入力記録を別々に保持し、重複遺伝子を自動集計しません。')}
    const signedY = d => d.x >= 0 ? d.y : -d.y;
    const centerX = plotW / 2, centerY = plotH / 2;
    const outerRadius = Math.max(8, Math.min(plotW, plotH) / 2 - 30);
    const referenceRadius = outerRadius * ${c.volcanoInnerRadius};
    const radialRoom = Math.max(1, Math.min(referenceRadius - 6, outerRadius - referenceRadius));
    const angleBand = d3.scaleBand()
      .domain(groups)
      .range([0, 2 * Math.PI])
      .padding(${c.volcanoGroupGap});
    const angle = d => angleBand(d.group) + angleBand.bandwidth() * (.5 + d.x / maxX * .45);
    const radialDistance = d => referenceRadius + signedY(d) / maxY * radialRoom;
    let px = d => ${radial?'centerX + Math.sin(angle(d)) * radialDistance(d)':cluster?'band(d.group) + band.bandwidth() * (.5 + d.x / maxX * .45)':'x(d.x)'};
    let py = d => ${radial?'centerY - Math.cos(angle(d)) * radialDistance(d)':cluster?'y(signedY(d))':'y(d.y)'};
${faceted?`    g.append("text")
      .attr("x", plotW / 2)
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("font-weight", 600)
      .text(panelNames[panelIndex]);
`:''}${radial?`    // ${tr('Angle within each sector encodes log2FC; radius encodes signed significance.','扇区内角度编码 log2FC，半径编码带方向的显著性。','扇形内の角度は log2FC、半径は符号付き有意性を表します。')}
    const radialTicks = [-maxY, -maxY / 2, 0, maxY / 2, maxY];
    ${c.grid?`g.selectAll("circle.radial-grid")
      .data(radialTicks)
      .join("circle")
      .attr("class", "radial-grid")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", v => referenceRadius + v / maxY * radialRoom)
      .attr("fill", "none")
      .attr("stroke", v => v === 0 ? "#6c7d91" : ${js(c.gridStyle?c.gridColor:'#e8edf2')});
    g.selectAll("text.radial-tick")
      .data(radialTicks)
      .join("text")
      .attr("class", "radial-tick")
      .attr("x", centerX + 4)
      .attr("y", v => centerY - referenceRadius - v / maxY * radialRoom)
      .attr("font-size", 9)
      .text(v => d3.format(".1f")(v));`:''}
    g.selectAll("text.sector-label")
      .data(groups)
      .join("text")
      .attr("class", "sector-label")
      .attr("x", name => centerX + Math.sin(angleBand(name) + angleBand.bandwidth() / 2) * (outerRadius + 17))
      .attr("y", name => centerY - Math.cos(angleBand(name) + angleBand.bandwidth() / 2) * (outerRadius + 17))
      .attr("text-anchor", "middle")
      .text(name => name);
    g.append("text")
      .attr("x", centerX)
      .attr("y", centerY)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text(${js('± −log10('+c.yField+')')});
`: `${c.grid?`    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(${c.axisStyle?c.yTickCount:5}).tickSize(-plotW).tickFormat(() => ""))
      .call(g => g.select(".domain")
      .remove())
      .call(g => g.selectAll("line")
      .attr("stroke", ${js(c.gridStyle?c.gridColor:'#e8edf2')})
      .attr("stroke-opacity", ${c.gridStyle?c.gridOpacity:1})
      .attr("stroke-width", ${c.gridStyle?c.gridWidth:1}));
`:''}${c.xAxis?`    const xAxis = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + plotH + ")")
      .call(d3.axisBottom(${cluster?'band':'x'})${cluster?'':`.ticks(${c.axisStyle?c.xTickCount:5})${c.axisStyle&&c.xTickFormat?`.tickFormat(d3.format(${js(c.xTickFormat)}))`:''}`});
    g.append("text")
      .attr("x", plotW / 2)
      .attr("y", plotH + 44)
      .attr("text-anchor", "middle")
      .text(${js(c.axisStyle&&c.xTitle?c.xTitle:cluster?c.volcanoPanelField+' · '+c.xField:c.xField)});
`:''}${c.yAxis?`    const yAxis = g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(${c.axisStyle?c.yTickCount:5})${c.axisStyle&&c.yTickFormat?`.tickFormat(d3.format(${js(c.yTickFormat)}))`:''});
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotH / 2)
      .attr("y", -44)
      .attr("text-anchor", "middle")
      .text(${js(c.axisStyle&&c.yTitle?c.yTitle:(cluster?'± ':'')+'−log10('+c.yField+')')});
`:''}`}
    const clipId = "volcano-" + Math.random().toString(36).slice(2);
    g.append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", plotW)
      .attr("height", plotH);
    const marks = g.append("g")
      .attr("clip-path", "url(#" + clipId + ")");
    const thresholds = marks.append("g")
      .attr("class", "thresholds")
      .attr("pointer-events", "none")
      .attr("fill", "none")
      .attr("stroke", thresholdColor)
      .attr("stroke-width", ${c.thresholdWidth})
      .attr("stroke-dasharray", ${js(c.thresholdDash)});
    function drawThresholds() {
      thresholds.selectAll("*")
      .remove();
${c.showThreshold&&radial?`      thresholds.selectAll("circle")
        .data([-baseThreshold, baseThreshold])
        .join("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", v => referenceRadius + v / maxY * radialRoom);
`:c.showThreshold&&!cluster&&!radial?c.volcanoCurve?`      // ${tr('This exploratory hyperbola is not a significance test or FDR control.','探索性双曲线不代表显著性检验或 FDR 控制。','探索的双曲線は有意差検定や FDR 制御ではありません。')}
      const curves = [-1, 1].map(sign => d3.range(1, 201).map(i => {
        const value = sign * (fcThreshold + (maxX - fcThreshold) * i / 200);
        return [x(value), y(boundary(value))];
      }));
      thresholds.selectAll("path.curve")
        .data(curves)
        .join("path")
        .attr("class", "curve")
        .attr("d", d3.line());
`: `      thresholds.selectAll("line.fc")
        .data([-fcThreshold, fcThreshold])
        .join("line")
        .attr("class", "fc")
        .attr("x1", v => x(v))
        .attr("x2", v => x(v))
        .attr("y1", 0)
        .attr("y2", plotH);
      thresholds.append("line")
        .attr("x1", 0)
        .attr("x2", plotW)
        .attr("y1", y(baseThreshold))
        .attr("y2", y(baseThreshold));
`:c.showThreshold&&cluster?`      thresholds.selectAll("line")
        .data([0, -baseThreshold, baseThreshold])
        .join("line")
        .attr("x1", 0)
        .attr("x2", plotW)
        .attr("y1", v => y(v))
        .attr("y2", v => y(v));
`:''}    }
    drawThresholds();
    const points = marks.selectAll("circle.point")
      .data(records)
      .join("circle")
      .attr("class", "point")
      .attr("cx", px)
      .attr("cy", py)
      .attr("r", radius)
      .attr("fill", pointColor)
      .attr("opacity", ${c.opacity})
      .attr("stroke", ${js(c.markBorder?c.borderColor:'none')})
      .attr("stroke-width", ${c.markBorder?c.borderWidth:0});
    const labelLayer = g.append("g")
      .attr("class", "gene-labels")
      .attr("pointer-events", "none");
    function drawLabels() {
      labelLayer.selectAll("*")
      .remove();
      const visible = records.filter(d => px(d) >= 0 && px(d) <= plotW && py(d) >= 0 && py(d) <= plotH && d.gene);
      const automatic = visible.filter(d => ${c.labels?'namedGenes.size ? namedGenes.has(d.gene) : ["up", "down"].includes(d.status)':'false'})
        .sort((a, b) => b.y - a.y || Math.abs(b.x) - Math.abs(a.x) || a.index - b.index)
        .slice(0, ${c.labelLimit});
      const candidates = Array.from(new Set([...visible.filter(d => pins.has(d.index)), ...automatic]));
      const occupied = [];
      for (const d of candidates) {
        const font = ${c.labelStyle?c.labelFontSize:11};
        const labelW = Math.min(plotW, Array.from(d.gene).reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? font : font * .62), 0) + 4);
        let chosen;
        for (const dy of ${c.volcanoLabelAvoid?'[-10, 10, -24, 24, -38, 38, -52, 52]':'[-10]'}) {
          const lx = Math.max(0, Math.min(plotW - labelW, px(d) + radius(d) + 4));
          const ly = Math.max(font, Math.min(plotH - 2, py(d) + dy));
          const box = {x:lx, y:ly-font, w:labelW, h:font+3};
          if (${c.volcanoLabelAvoid?'occupied.some(b => box.x < b.x+b.w && box.x+box.w > b.x && box.y < b.y+b.h && box.y+box.h > b.y)':'false'}) continue;
          chosen = {lx, ly, box}; break;
        }
        if (!chosen) continue;
        occupied.push(chosen.box);
${c.volcanoLeaders?`        labelLayer.append("line")
          .attr("x1", px(d))
          .attr("y1", py(d))
          .attr("x2", chosen.lx)
          .attr("y2", chosen.ly - font / 3)
          .attr("stroke", pointColor(d))
          .attr("stroke-opacity", .6);
`:''}        labelLayer.append("text")
          .attr("class", "gene-label")
          .attr("x", chosen.lx)
          .attr("y", chosen.ly)
          .attr("font-size", font)
          .attr("fill", ${js(c.labelStyle?c.labelColor:'#26394c')})
          .text(d.gene);
      }
    }
    drawLabels();
${c.tooltip?`    points.on("pointermove", (event, d) => {
      tooltip.text(tooltipFields.map(key => key + ": " + (d.sourceRow[key] ?? "—"))
      .join("\\n"))
        .style("display", "block");
      const [mx, my] = d3.pointer(event, container);
      tooltip.style("left", Math.max(0, Math.min(mx + 12, container.clientWidth - tooltip.node().offsetWidth)) + "px")
        .style("top", Math.max(0, my - tooltip.node().offsetHeight - 10) + "px");
    }).on("pointerleave", () => tooltip.style("display", "none"));
`:''}${c.volcanoPin?`    points.style("cursor", "pointer")
      .on("click", (event, d) => {
        if (pins.has(d.index)) pins.delete(d.index); else pins.add(d.index);
        drawLabels();
      });
`:''}    const panel = {g, records, ox, oy, points, drawLabels, px: d => px(d), py: d => py(d)};
    panels.push(panel);
${c.zoom&&!cluster&&!radial?`    const baseX = x.copy(), baseY = y.copy();
    g.call(d3.zoom()
      .filter(event => !brushing && (!event.ctrlKey || event.type === "wheel") && !event.button)
      .scaleExtent([1, 16])
      .extent([[0, 0], [plotW, plotH]])
      .translateExtent([[0, 0], [plotW, plotH]])
      .on("zoom", event => {
        const zx = event.transform.rescaleX(baseX), zy = event.transform.rescaleY(baseY);
        x.domain(zx.domain()); y.domain(zy.domain());
        points.attr("cx", px)
      .attr("cy", py);
${c.xAxis?`        xAxis.call(d3.axisBottom(x).ticks(${c.axisStyle?c.xTickCount:5})${c.axisStyle&&c.xTickFormat?`.tickFormat(d3.format(${js(c.xTickFormat)}))`:''});
`:''}${c.yAxis?`        yAxis.call(d3.axisLeft(y).ticks(${c.axisStyle?c.yTickCount:5})${c.axisStyle&&c.yTickFormat?`.tickFormat(d3.format(${js(c.yTickFormat)}))`:''});
`:''}${c.grid?`        g.select(".grid").call(d3.axisLeft(y).ticks(${c.axisStyle?c.yTickCount:5}).tickSize(-plotW).tickFormat(() => ""))
          .call(g => g.select(".domain")
      .remove())
          .call(g => g.selectAll("line")
      .attr("stroke", ${js(c.gridStyle?c.gridColor:'#e8edf2')}));
`:''}        drawThresholds(); drawLabels(); drawLinks(); styleAxes();
      })
    );
`:''}${c.volcanoBrush?`    const brushLayer = marks.insert("g", ":first-child")
      .attr("class", "brush");
    // ${tr('Brush mode disables point hit testing so the selection can start on any mark.','框选模式关闭点命中，允许从任意点开始框选。','範囲選択中は点の当たり判定を無効にし、どこからでも選択できます。')}
    const brush = d3.brush()
      .extent([[0, 0], [plotW, plotH]])
      .on("brush end", event => {
        const s = event.selection;
        points.attr("opacity", d => !s || px(d) >= s[0][0] && px(d) <= s[1][0] && py(d) >= s[0][1] && py(d) <= s[1][1] ? ${c.opacity} : .12);
        const count = s ? records.filter(d => px(d) >= s[0][0] && px(d) <= s[1][0] && py(d) >= s[0][1] && py(d) <= s[1][1]).length : 0;
        selectionStatus.text(${js(tr('Selected: ','已选中：','選択数：'))} + count);
      });
    brushLayer.call(brush);
    panel.clearBrush = () => brushLayer.call(brush.move, null);
`:''}  }
  function styleAxes() {
    svg.selectAll(".x-axis .domain, .y-axis .domain, .x-axis .tick line, .y-axis .tick line")
      .attr("stroke", ${js(c.axisStyle?c.axisColor:'#9aa8b5')});
    svg.selectAll(".tick text")
      .attr("fill", ${js(c.axisStyle?c.axisColor:'#687789')})
      .attr("font-size", ${c.axisStyle?c.tickFontSize:11});
  }
  styleAxes();
  function drawLinks() {
    linkLayer.selectAll("*")
      .remove();
${mode==='linked'&&c.volcanoLinks?`    if (panels.length !== 2) return;
    // ${tr('Link only unique gene names in both panels; ambiguous duplicates remain unlinked.','只连接两侧各唯一的同名基因，重复基因不连线。','両面板内で一意の同名遺伝子のみを結び、重複は結びません。')}
    const left = d3.group(panels[0].records.filter(d => d.gene), d => d.gene);
    const right = d3.group(panels[1].records.filter(d => d.gene), d => d.gene);
    const matches = Array.from(left).filter(([gene, records]) => records.length === 1 && right.get(gene)?.length === 1)
      .map(([gene, records]) => [records[0], right.get(gene)[0]])
      .sort((a, b) => Math.max(b[0].y, b[1].y) - Math.max(a[0].y, a[1].y))
      .filter(pair => pair.every((d, i) => panels[i].px(d) >= 0 && panels[i].px(d) <= plotW && panels[i].py(d) >= 0 && panels[i].py(d) <= plotH))
      .slice(0, ${c.volcanoLinkLimit});
    linkLayer.selectAll("path")
      .data(matches)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", ${js(c.thresholdColor)})
      .attr("stroke-width", ${c.lineWidth})
      .attr("stroke-opacity", .22)
      .attr("d", pair => {
        const ax = panels[0].ox + panels[0].px(pair[0]), ay = panels[0].oy + panels[0].py(pair[0]);
        const bx = panels[1].ox + panels[1].px(pair[1]), by = panels[1].oy + panels[1].py(pair[1]);
        return "M" + ax + "," + ay + "C" + (ax + bx) / 2 + "," + ay + " " + (ax + bx) / 2 + "," + by + " " + bx + "," + by;
      });
`:''}  }
  drawLinks();
${c.legend?`  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(16,${c.volcanoSearch||c.volcanoBrush?70:18})");
  const legendNames = ${gradient?'[]':c.volcanoColor==='category'?'[...categories, "ns"]':c.volcanoColor==='direction'?'["up", "down"]':c.volcanoColor==='four'?'["up", "down", "pOnly", "ns"]':'["up", "down", "ns"]'};
  const statusNames = ${js({up:tr('Up','上调','上昇'),down:tr('Down','下调','下降'),pOnly:tr('P only / boundary not met','仅P值达标／未达边界','P値のみ／境界未達'),ns:tr('Other / not significant','其余／非显著','その他／非有意')})};
  legendNames.forEach((name, i) => {
    const item = legend.append("g")
      .attr("transform", "translate(" + (i % 4) * ((width - 32) / 4) + "," + Math.floor(i / 4) * 18 + ")");
    item.append("circle")
      .attr("r", 4)
      .attr("fill", ${c.volcanoColor==='category'?'name === "ns" ? statusColor("ns") : categoryColor(name)':'statusColor(name)'});
    item.append("text")
      .attr("x", 8)
      .attr("y", 4)
      .attr("font-size", 10)
      .text(${c.volcanoColor==='category'?'name === "ns" ? statusNames.ns : name':'statusNames[name]'});
  });
${gradient?`  const colorLegend = legend.append("g");
  colorLegend.selectAll("rect")
    .data(d3.range(100))
    .join("rect")
    .attr("x", i => i * 1.8)
    .attr("width", 2)
    .attr("height", 8)
    .attr("fill", i => continuousColor(colorExtent[0] + i / 99 * (colorExtent[1] - colorExtent[0])));
  colorLegend.append("text")
    .attr("y", 24)
    .text(d3.format(".3~g")(colorExtent[0]) + " — " + d3.format(".3~g")(colorExtent[1]) + " · " + ${js(c.volcanoGradientBy==='field'?c.volcanoColorField:'−log10('+c.yField+')')});
`:''}${c.volcanoVip?`  const sizeLegend = legend.append("g")
    .attr("transform", "translate(20,42)");
  sizeLegend.selectAll("circle")
    .data([0, maxVip / 2, maxVip])
    .join("circle")
    .attr("cx", (_, i) => i * 90)
    .attr("r", vip => radius({vip}))
    .attr("fill", "none")
    .attr("stroke", "#687789");
  sizeLegend.selectAll("text")
    .data([0, maxVip / 2, maxVip])
    .join("text")
    .attr("x", (_, i) => i * 90 + ${c.volcanoMaxRadius+4})
    .attr("y", 4)
    .attr("font-size", 10)
    .text(v => ${js(c.volcanoVipField+' ')} + d3.format(".2~g")(v));
`:''}`:''}
${c.volcanoSearch||c.volcanoBrush?`  // ${tr('Native DOM controls are included in the exported code.','原生 DOM 控件随源码一起导出。','ネイティブ DOM 操作部品もコードに含めます。')}
  const tools = svg.append("foreignObject")
    .attr("class", "exploration-tools")
    .attr("x", 16)
    .attr("y", 4)
    .attr("width", width - 32)
    .attr("height", 48)
    .append("xhtml:div")
    .style("display", "flex")
    .style("gap", "10px")
    .style("align-items", "center")
    .style("flex-wrap", "wrap")
    .style("font", "12px system-ui")
    .style("padding", "4px 0");
  const selectionStatus = tools.append("span")
    .attr("role", "status");
${c.volcanoSearch?`  tools.append("input")
    .attr("type", "search")
    .attr("aria-label", ${js(tr('Search genes','搜索基因','遺伝子を検索'))})
    .attr("placeholder", ${js(tr('Search genes…','搜索基因…','遺伝子を検索…'))})
    .style("padding", "7px 10px")
    .style("border", "1px solid #d8e1ee")
    .style("border-radius", "6px")
    .on("input", function () {
      const query = this.value.trim().toLocaleLowerCase();
      let count = 0;
      panels.forEach(panel => panel.points.attr("opacity", d => {
        const matched = !query || d.gene.toLocaleLowerCase().includes(query);
        if (query && matched) count++;
        return matched ? ${c.opacity} : .1;
      }));
      selectionStatus.text(query ? ${js(tr('Matches: ','匹配：','一致：'))} + count : "");
    });
`:''}${c.volcanoBrush?`
  const brushButton = tools.append("button")
    .attr("type", "button")
    .style("padding", "7px 10px")
    .style("border", "1px solid #d8e1ee")
    .style("border-radius", "6px")
    .style("background", "white")
    .style("color", "#356ae6")
    .style("cursor", "pointer")
    .text(${js(tr('Enable brush','开启框选','範囲選択を有効化'))})
    .on("click", function () {
      brushing = !brushing;
      panels.forEach(panel => {
        panel.clearBrush();
        panel.g.select(".brush")
      .style("display", brushing ? null : "none");
        panel.points.style("pointer-events", brushing ? "none" : null)
      .attr("opacity", ${c.opacity});
      });
      d3.select(this).text(brushing ? ${js(tr('Exit brush','退出框选','範囲選択を終了'))} : ${js(tr('Enable brush','开启框选','範囲選択を有効化'))});
      selectionStatus.text("");
    });
  svg.selectAll(".brush")
      .style("display", "none");
`:''}`:''}
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
 return {logic,data:dataSource,source:'import * as d3 from "d3";\n\n'+dataSource+logic.slice('import * as d3 from "d3";'.length)};
}
