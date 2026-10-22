import { categoricalColors } from './chartColors';
import type { Config, Row } from './model';
import type { Locale } from './i18n';
import type { CodeParts } from './generate';
import { isSurvival, isResearchPlot, isAssociationPlot } from './bioModel';
import { researchSource } from './generateResearch';
import { associationSource } from './generateAssociation';
import { bioExtrasSource } from './generateBioExtras';
import { survivalMathSource } from './survivalMath';
import { codeComment } from './codeComments';
const js=(v:unknown)=>JSON.stringify(v);
export type BioTranslate=(en:string,zh:string,ja:string)=>string;
import { genomicSource } from './generateGenomics';
export function generateBioCode(data:Row[],c:Config,locale:Locale):CodeParts {
 const tr:BioTranslate=(en,zh,ja)=>locale==='zh'?zh:locale==='ja'?ja:en;
 const dataSource=`// ${codeComment('Replace this array with your own data. Keep the mapped field names.',locale)}
const data = ${JSON.stringify(data,null,2)};
`;
 const logic=`import * as d3 from "d3";

${isSurvival(c.bioVariant)?`// ${tr('Right censoring only. Events precede censors at tied times; risk sets include both.','仅处理右删失；同一时间先计事件再删失，两者均在该时间风险集中。','右打切りのみ。時点が同じ場合はイベントを先に計上し、打切りもリスク集合に含めます。')}
${survivalMathSource}`:''}
// ${codeComment('Call renderChart(container, data) in any Web project with D3 v7 installed.',locale)}
function renderChart(container, data) {
  const root = d3.select(container)
    .style("position", "relative");
  root.selectAll("*")
    .remove();
  const width = ${c.width}, height = ${c.height};
  const fontSize = ${c.bioFontSize};
  const svg = root.append("svg")
    .attr("viewBox", [0,0,width,height])
    .attr("role", "img")
    .attr("aria-label", ${js(tr('Scientific chart','科学图表','科学チャート'))})
    .style("display", "block")
    .style("width", "100%")
    .style("font", fontSize + "px system-ui")
    .style("background", ${js(c.canvasStyle?c.background:'white')});
  const numeric = v => v != null && String(v).trim() !== "" && Number.isFinite(Number(v));
  const named = v => v != null && String(v).trim() !== "";
  const palette = ${js(categoricalColors(c.color,c.secondaryColor,c.chartScheme))};
  const color = d3.scaleOrdinal(palette);
  function message(text) {svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .text(text);}
  const tooltip = root.append("div")
    .style("display", "none")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("white-space", "pre-line")
    .style("overflow-wrap", "anywhere")
    .style("max-width", "calc(100% - 16px)")
    .style("padding", "8px 10px")
    .style("background", "#172b41")
    .style("color", "white")
    .style("border-radius", "6px");
  function tip(selection, text) {
    ${c.tooltip?`selection.on("pointermove", function(event,d) {
      const p = d3.pointer(event,root.node());
      tooltip.style("display", "block")
        .text(text(d));
      const box = tooltip.node().getBoundingClientRect();
      tooltip.style("left", Math.max(0,Math.min(p[0]+10,root.node().clientWidth-box.width)) + "px")
        .style("top", Math.max(0,p[1]-box.height-8) + "px");
    }).on("pointerleave",()=>tooltip.style("display","none"));`:''}
  }
  function showTip(event,text) {
    ${c.tooltip?`const p=d3.pointer(event,root.node());tooltip.style("display","block").text(text);const box=tooltip.node().getBoundingClientRect();tooltip.style("left",Math.max(0,Math.min(p[0]+10,root.node().clientWidth-box.width))+"px")
    .style("top",Math.max(0,p[1]-box.height-8)+"px");`:''}
  }
  const hideTip=()=>tooltip.style("display","none");
  function groupLegend(names) {
    ${c.legend?`const legend = svg.append("g")
      .attr("class", "group-legend")
      .attr("transform", "translate(65,20)");
    names.forEach((name,i)=>{
      const g = legend.append("g")
        .attr("transform", "translate("+(i%4)*((width-90)/4)+","+Math.floor(i/4)*18+")");
      g.append("rect")
        .attr("width", 9)
        .attr("height", 9)
        .attr("fill", color(name));
      g.append("text")
        .attr("x", 14)
        .attr("y", 8)
        .text(String(name).length>24?String(name).slice(0,22)+"…":name);
      tip(g,()=>String(name));
    });`:''}
  }
${isSurvival(c.bioVariant)?survivalSource(c,tr):isResearchPlot(c.bioVariant)?researchSource(c,tr):isAssociationPlot(c.bioVariant)?associationSource(c,tr):['accumulation','circos-tracks'].includes(c.bioVariant)?bioExtrasSource(c,tr):genomicSource(c,tr)}
  return svg.node();
}
const container = document.querySelector("#chart") || d3.select("body")
  .append("div")
  .attr("id", "chart")
  .node();
renderChart(container,data);
`;
 return {logic,data:dataSource,source:'import * as d3 from "d3";\n\n'+dataSource+logic.slice('import * as d3 from "d3";'.length)};
}
function survivalSource(c:Config,tr:BioTranslate){return `
  const subjectCounts = d3.rollup(data,rows=>rows.length,d=>String(d[${js(c.bioSubjectField)}]??""));
  const observations = data.filter(d=>numeric(d[${js(c.bioTimeField)}]) && +d[${js(c.bioTimeField)}]>=0 && numeric(d[${js(c.bioEventField)}]) && [0,1].includes(+d[${js(c.bioEventField)}])${c.bioSubjectField?` && named(d[${js(c.bioSubjectField)}]) && subjectCounts.get(String(d[${js(c.bioSubjectField)}]))===1`:''}${c.bioVariant==='cutoff'?` && numeric(d[${js(c.bioScoreField)}])`:c.groupField?` && named(d[${js(c.groupField)}])`:''})
    .map(d=>({time:+d[${js(c.bioTimeField)}],event:+d[${js(c.bioEventField)}],score:+d[${js(c.bioScoreField)}],group:${c.bioVariant==='cutoff'?'"All"':c.groupField?`String(d[${js(c.groupField)}])`:'"All"'},sourceRow:d}));
  if(!observations.length){message(${js(tr('No valid subjects. Check time, 0/1 event and unique subject IDs.','没有有效对象，请检查时间、0/1 事件状态及唯一对象编号。','有効な対象がありません。時間・0/1 イベント・一意なIDを確認してください。'))});return svg.node();}
  let cutoff = null, scan = null;
  ${c.bioVariant==='cutoff'?c.bioCutMode==='auto'?`scan = findCutoff(observations,${c.bioMinProp});
  if(!scan){message(${js(tr('No eligible cutoff with an estimable log-rank test.','没有满足分组限制且可估计 log-rank 的切点。','群条件を満たす推定可能なカットオフがありません。'))});return svg.node();}
  cutoff = scan.cutoff;`:c.bioCutMode==='median'?`cutoff = d3.median(observations,d=>d.score);`:`cutoff = ${c.bioCutValue};`:''}
  const records = observations.map(d=>({...d,group:cutoff==null?d.group:d.score<=cutoff?${js(tr('Low','低分组','低値群'))}:${js(tr('High','高分组','高値群'))}}));
  const names = Array.from(new Set(records.map(d=>d.group)));
  if(cutoff!=null && names.length<2){message(${js(tr('The cutoff produces only one group. Choose another value.','当前切点只产生一个分组，请调整阈值。','カットオフが1群のみを生成します。値を変更してください。'))});return svg.node();}
  color.domain(names);groupLegend(names);
  const curves = names.map(name=>({name,records:records.filter(d=>d.group===name),points:kaplanMeier(records.filter(d=>d.group===name),${c.bioConfidenceLevel==='90'?1.6448536269514722:c.bioConfidenceLevel==='99'?2.5758293035489004:1.959963984540054})}));
  const result = logRank(records);
  const top = ${c.legend?'Math.max(48,Math.ceil(names.length/4)*18+34)':'30'} + (cutoff==null?0:36) + ${c.bioLogRank?20:0};
  const margin = {left:70,right:26,top,bottom:${c.bioRiskTable?'70+names.length*24+34':'62'}};
  const plotW = width-margin.left-margin.right, plotH = Math.max(35,height-margin.top-margin.bottom);
  const maxTime = d3.max(records,d=>d.time) || 1;
  const x = d3.scaleLinear()
    .domain([0,maxTime])
    .range([0,plotW]);
  const y = d3.scaleLinear()
    .domain([0,1])
    .range([plotH,0]);
  const g = svg.append("g")
    .attr("transform","translate("+margin.left+","+margin.top+")");
  ${c.grid?`g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSize(-plotW).tickFormat(()=>""))
    .call(g=>g.select(".domain")
      .remove())
    .call(g=>g.selectAll("line")
      .attr("stroke",${js(c.gridStyle?c.gridColor:'#e9edf3')})
      .attr("stroke-opacity",${c.gridStyle?c.gridOpacity:1}));`:''}
  ${c.xAxis?`g.append("g")
    .attr("transform","translate(0,"+plotH+")")
    .call(d3.axisBottom(x).ticks(6));
  g.append("text")
    .attr("x",plotW/2)
    .attr("y",plotH+44)
    .attr("text-anchor","middle")
    .text(${js(c.bioTimeUnit)});`:''}
  ${c.yAxis?`g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
  g.append("text")
    .attr("transform","rotate(-90)")
    .attr("x",-plotH/2)
    .attr("y",-50)
    .attr("text-anchor","middle")
    .text(${js(tr('Survival probability','生存概率','生存確率'))});`:''}
  const line = d3.line()
    .curve(d3.curveStepAfter)
    .x(d=>x(d.time))
    .y(d=>y(d.survival));
  const area = d3.area()
    .curve(d3.curveStepAfter)
    .x(d=>x(d.time))
    .y0(d=>y(d.lower))
    .y1(d=>y(d.upper));
  curves.forEach(curve=>{
    ${c.bioConfidence?`g.append("path")
      .datum(curve.points)
      .attr("class","confidence")
      .attr("d",area)
      .attr("fill",color(curve.name))
      .attr("fill-opacity",.13);`:''}
    const path = g.append("path")
      .datum(curve.points)
      .attr("class","survival-curve point")
      .attr("d",line)
      .attr("fill","none")
      .attr("stroke",color(curve.name))
      .attr("stroke-width",${c.lineWidth});
    tip(path,()=>curve.name+"\\nn="+curve.records.length+" · ${tr('events','事件','イベント')}="+d3.sum(curve.records,d=>d.event));
    ${c.bioCensor?`const censors = g.selectAll(null)
      .data(curve.points.filter(d=>d.censored>0))
      .join("path")
      .attr("class","censor")
      .attr("d",d=>"M"+(x(d.time)-3)+","+y(d.survival)+"h6M"+x(d.time)+","+(y(d.survival)-3)+"v6")
      .attr("stroke",color(curve.name))
      .attr("stroke-width",1.2);
    tip(censors,d=>curve.name+"\\n"+d.time+" · ${tr('censored','删失数','打切り数')}: "+d.censored+"\\nS="+d3.format(".3f")(d.survival));`:''}
    ${c.showPoints?`const markers = g.selectAll(null)
      .data(curve.points.slice(1))
      .join("circle")
      .attr("class","event-point")
      .attr("cx",d=>x(d.time))
      .attr("cy",d=>y(d.survival))
      .attr("r",${c.radius})
      .attr("fill",color(curve.name))
      .attr("fill-opacity",.4);
    tip(markers,d=>curve.name+"\\n"+d.time+" · S="+d3.format(".4f")(d.survival)+"\\n${tr('At risk / events / censored','风险人数 / 事件 / 删失','リスク人数／イベント／打切り')}: "+[d.risk,d.events,d.censored].join(" / "));`:''}
  });
  if(cutoff!=null){svg.append("text")
    .attr("x",70)
    .attr("y",top-24-${c.bioLogRank?20:0})
    .attr("font-size",Math.max(9,fontSize-1))
    .text(${js(tr('Cutoff','切点','カットオフ'))}+"="+d3.format(".4~g")(cutoff)+" · ≤ / >"+(scan?" · ${tr('exploratory, candidates','探索性，候选数','探索的、候補数')}="+scan.candidates:""));}
  ${c.bioLogRank?`svg.append("text")
    .attr("class","logrank-result")
    .attr("x",70)
    .attr("y",top-10)
    .attr("font-size",Math.max(9,fontSize-1))
    .text(result ? (scan ? "${tr('Bonferroni-adjusted P','Bonferroni 校正 P','Bonferroni 補正 P')}="+d3.format(".3~g")(scan.adjustedP)+" · ${tr('raw P','原始 P','未補正 P')}="+d3.format(".3~g")(result.p) : "Log-rank P="+d3.format(".3~g")(result.p)+" · df="+result.df) : ${js(tr('Log-rank not estimable.','无法估计 log-rank。','Log-rank を推定できません。'))});`:''}
  ${c.bioRiskTable?`const times = x.ticks(6);
  const table = g.append("g")
    .attr("class","risk-table")
    .attr("transform","translate(0,"+(plotH+70)+")");
  table.append("text")
    .attr("x",0)
    .attr("y",-12)
    .text(${js(tr('At risk immediately before each time','各时间点开始时的风险人数','各時点直前のリスク人数'))});
  curves.forEach((curve,i)=>{
    table.append("text")
      .attr("x",-8)
      .attr("y",i*24+12)
      .attr("text-anchor","end")
      .attr("font-size",9)
      .attr("fill",color(curve.name))
      .text(curve.name.slice(0,10));
    table.selectAll(null)
      .data(times)
      .join("text")
      .attr("class","risk-count")
      .attr("x",x)
      .attr("y",i*24+12)
      .attr("text-anchor","middle")
      .text(time=>curve.records.filter(d=>d.time>=time).length);
  });`:''}
`;}
