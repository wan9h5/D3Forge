import winePca from './data/winePca.json';
import type { Config, Row } from './model';
import type { Locale } from './i18n';
import type { CodeParts } from './generate';
import { categoricalColors } from './chartColors';
import { pcaAxisTitle } from './scatterModel';
const js=(value:unknown)=>JSON.stringify(value);

export function generatePcaCode(data:Row[],c:Config,locale:Locale):CodeParts {
 const tr=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
 const biplot=c.scatterVariant==='pca-biplot';
 const provenance=JSON.stringify(data)===JSON.stringify(winePca.rows)?'// UCI Wine: Aeberhard & Forina (1992), https://doi.org/10.24432/C5PC7J, CC BY 4.0.\n// Centered and scaled by sample SD (ddof=1); scores=ZV; loadings=V sqrt(lambda).\n// PCA signs are arbitrary; loading arrows share one display multiplier.\n':'';
 const dataSource=provenance+`// ${tr('替换为同一 PCA 分析的已有得分和载荷。','Replace with supplied scores and loadings from one PCA analysis.','同じ PCA 解析の入力済みスコア・負荷量に置き換えてください。')}\nconst data = ${JSON.stringify(data,null,2)};\n`;
 const logic=`import * as d3 from "d3";

function renderChart(container,data) {
  const root=d3.select(container)
    .style("position","relative");
  root.selectAll("*")
    .remove();
  const width=${c.width},height=${c.height};
  const numeric=value=>value!=null&&String(value).trim()!==""&&Number.isFinite(Number(value));
  const rows=data.filter(d=>numeric(d[${js(c.xField)}])&&numeric(d[${js(c.yField)}])${biplot?`&&[${js(c.pcaSampleType)},${js(c.pcaLoadingType)}].includes(String(d[${js(c.pcaRowTypeField)}]))`:''})
    .map(d=>({
      x:+d[${js(c.xField)}],y:+d[${js(c.yField)}],name:String(d[${js(c.labelField)}]??""),
      group:${c.groupField?`String(d[${js(c.groupField)}]??${js(tr('未分组','Ungrouped','未分類'))})`:js(tr('全部样本','All samples','全サンプル'))},
      kind:${biplot?`String(d[${js(c.pcaRowTypeField)}])`:js(c.pcaSampleType)}
    }));
  const samples=rows.filter(d=>d.kind===${js(c.pcaSampleType)});
  const vectors=${biplot&&c.pcaShowLoadings?`rows.filter(d=>d.kind===${js(c.pcaLoadingType)}&&(d.x!==0||d.y!==0)).map(d=>({...d,displayX:d.x*${c.pcaLoadingScale},displayY:d.y*${c.pcaLoadingScale}}))`:'[]'};
  const groups=d3.groups(samples,d=>d.group).map(([name,rows])=>({name,rows}));
  const color=d3.scaleOrdinal()
    .domain(groups.map(d=>d.name))
    .range(${js([c.color,c.secondaryColor,c.pcaThirdColor,...categoricalColors(c.color,c.secondaryColor).filter(color=>![c.color,c.secondaryColor,c.pcaThirdColor].some(value=>value.toLowerCase()===color.toLowerCase()))])});
  const svg=root.append("svg")
    .attr("viewBox",[0,0,width,height])
    .attr("role","img")
    .attr("aria-label",${js(tr('PCA 结果图','PCA results','PCA 結果'))})
    .style("display","block")
    .style("width","100%")
    .style("background",${js(c.background)})
    .style("font","12px system-ui");
  if(!samples.length){svg.append("text")
    .attr("x",width/2)
    .attr("y",height/2)
    .attr("text-anchor","middle")
    .text(${js(tr('没有有效样本得分，请检查字段及记录类型。','No valid sample scores. Check fields and row types.','有効なサンプルスコアがありません。フィールドと種類を確認してください。'))});return svg.node();}
  const ellipses=[];
  ${c.pcaEnvelope==='ellipse'?`
  // ${tr('用 n−1 分母计算样本协方差；这是离散程度椭圆，不是均值置信区间。','Use sample covariance with denominator n−1. These are dispersion ellipses, not confidence regions for the mean.','分母 n−1 の標本共分散を使用します。平均の信頼領域ではなく分散楕円です。')}
  for(const group of groups){
    const n=group.rows.length;if(n<3)continue;
    const mx=d3.mean(group.rows,d=>d.x),my=d3.mean(group.rows,d=>d.y);
    const xx=d3.sum(group.rows,d=>(d.x-mx)**2)/(n-1);
    const yy=d3.sum(group.rows,d=>(d.y-my)**2)/(n-1);
    const xy=d3.sum(group.rows,d=>(d.x-mx)*(d.y-my))/(n-1);
    const difference=Math.hypot(xx-yy,2*xy);
    const major=(xx+yy+difference)/2,minor=Math.max(0,(xx+yy-difference)/2);
    if(!Number.isFinite(major)||!Number.isFinite(minor)||major<=0||minor<=major*1e-10)continue;
    const angle=.5*Math.atan2(2*xy,xx-yy);
    const a=${c.pcaEllipseScale}*Math.sqrt(major),b=${c.pcaEllipseScale}*Math.sqrt(minor);
    const points=d3.range(65).map(index=>{
      const t=index*2*Math.PI/64,u=a*Math.cos(t),v=b*Math.sin(t);
      return {x:mx+u*Math.cos(angle)-v*Math.sin(angle),y:my+u*Math.sin(angle)+v*Math.cos(angle)};
    });
    ellipses.push({name:group.name,points});
  }`:''}
  const margin={left:74,right:${biplot&&c.legend?152:38},top:${biplot?'38':c.legend?'42+Math.ceil(groups.length/4)*20':'30'},bottom:66};
  const innerW=Math.max(30,width-margin.left-margin.right),innerH=Math.max(30,height-margin.top-margin.bottom);
  const horizontal=[0,...samples.map(d=>d.x),...vectors.map(d=>d.displayX),...ellipses.flatMap(d=>d.points.map(p=>p.x))];
  const vertical=[0,...samples.map(d=>d.y),...vectors.map(d=>d.displayY),...ellipses.flatMap(d=>d.points.map(p=>p.y))];
  let [x0,x1]=d3.extent(horizontal),[y0,y1]=d3.extent(vertical);
  const xPad=Math.max(x1-x0,.1)*.12,yPad=Math.max(y1-y0,.1)*.12;
  x0-=xPad;x1+=xPad;y0-=yPad;y1+=yPad;
  ${c.pcaEqualAxes?`const unit=Math.max((x1-x0)/innerW,(y1-y0)/innerH),cx=(x0+x1)/2,cy=(y0+y1)/2;
  x0=cx-unit*innerW/2;x1=cx+unit*innerW/2;y0=cy-unit*innerH/2;y1=cy+unit*innerH/2;`:''}
  const x=d3.scaleLinear()
    .domain([x0,x1])
    .range([0,innerW]);
  const y=d3.scaleLinear()
    .domain([y0,y1])
    .range([innerH,0]);
  const g=svg.append("g")
    .attr("transform","translate("+margin.left+","+margin.top+")");
  ${c.grid?`for(const [axis,position] of [[d3.axisBottom(x)
    .ticks(6)
    .tickSize(-innerH)
    .tickFormat(""),"translate(0,"+innerH+")"],[d3.axisLeft(y)
    .ticks(6)
    .tickSize(-innerW)
    .tickFormat(""),"translate(0,0)"]]){
    g.append("g")
    .attr("transform",position)
    .call(axis)
      .call(grid=>grid.select(".domain")
    .remove())
      .call(grid=>grid.selectAll("line")
    .attr("stroke","#edf1f6"));
  }`:''}
  ${c.xAxis?`g.append("g")
    .attr("transform","translate(0,"+innerH+")")
    .call(d3.axisBottom(x)
    .ticks(6));
  svg.append("text")
    .attr("x",margin.left+innerW/2)
    .attr("y",height-20)
    .attr("text-anchor","middle")
    .text(${js(pcaAxisTitle(c.xField,c.pcaVariance1,c.pcaShowVariance))});`:''}
  ${c.yAxis?`g.append("g")
    .call(d3.axisLeft(y)
    .ticks(6));
  svg.append("text")
    .attr("transform","translate(20,"+(margin.top+innerH/2)+")rotate(-90)")
    .attr("text-anchor","middle")
    .text(${js(pcaAxisTitle(c.yField,c.pcaVariance2,c.pcaShowVariance))});`:''}
  g.selectAll(".domain")
    .attr("stroke","#a8b6c9");
  g.selectAll(".tick text")
    .attr("fill","#53647a");
  g.append("line")
    .attr("x1",x(0))
    .attr("x2",x(0))
    .attr("y1",0)
    .attr("y2",innerH)
    .attr("stroke","#b8c3d4")
    .attr("stroke-dasharray","4,4");
  g.append("line")
    .attr("x1",0)
    .attr("x2",innerW)
    .attr("y1",y(0))
    .attr("y2",y(0))
    .attr("stroke","#b8c3d4")
    .attr("stroke-dasharray","4,4");
  ${c.pcaEnvelope==='hull'?`for(const group of groups){
    const hull=d3.polygonHull(group.rows.map(d=>[d.x,d.y]));
    if(!hull)continue;
    const span=Math.max(d3.max(hull,d=>d[0])-d3.min(hull,d=>d[0]),d3.max(hull,d=>d[1])-d3.min(hull,d=>d[1]));
    if(Math.abs(d3.polygonArea(hull))<=span*span*1e-12)continue;
    const outline=hull.map(point=>x(point[0])+","+y(point[1]));
    g.append("path")
      .attr("class","pca-hull")
      .attr("d","M"+outline.join("L")+"Z")
      .attr("fill",color(group.name))
      .attr("fill-opacity",${c.pcaEnvelopeOpacity})
      .attr("stroke",color(group.name))
      .attr("stroke-width",${c.lineWidth})
      .attr("pointer-events","none");
  }`:c.pcaEnvelope==='ellipse'?`g.selectAll("path.pca-ellipse")
    .data(ellipses)
    .join("path")
    .attr("class","pca-ellipse")
    .attr("d",d=>d3.line().x(p=>x(p.x)).y(p=>y(p.y))(d.points))
    .attr("fill",d=>color(d.name))
    .attr("fill-opacity",${c.pcaEnvelopeOpacity})
    .attr("stroke",d=>color(d.name))
    .attr("stroke-width",${c.lineWidth})
    .attr("stroke-dasharray",${biplot?'null':'"5,4"'})
    .attr("pointer-events","none");`:''}
  ${biplot?`g.append("rect")
    .attr("width",innerW)
    .attr("height",innerH)
    .attr("fill","none")
    .attr("stroke","#454545")
    .attr("pointer-events","none");`:''}
  const tooltip=root.append("div")
    .style("position","absolute")
    .style("display","none")
    .style("pointer-events","none")
    .style("white-space","pre-line")
    .style("max-width","calc(100% - 16px)")
    .style("overflow-wrap","anywhere")
    .style("padding","9px 12px")
    .style("border-radius","6px")
    .style("background","#172b41")
    .style("color","white");
  function tip(selection,content){
    ${c.tooltip?`selection.on("pointermove",(event,d)=>{
      const [px,py]=d3.pointer(event,root.node());tooltip.text(content(d))
    .style("display","block");
      const box=tooltip.node().getBoundingClientRect();
      tooltip.style("left",Math.max(0,Math.min(px+12,root.node().clientWidth-box.width))+"px")
    .style("top",Math.max(0,py-box.height-10)+"px");
    })
    .on("pointerleave",()=>tooltip.style("display","none"));`:''}
  }
  const points=g.selectAll("circle.pca-sample")
    .data(samples)
    .join("circle")
    .attr("class","point pca-sample")
    .attr("cx",d=>x(d.x))
    .attr("cy",d=>y(d.y))
    .attr("r",${c.radius})
    .attr("fill",d=>color(d.group))
    .attr("opacity",${c.opacity});
  tip(points,d=>d.name+"\\n"+d.group+"\\n"+${js(c.xField)}+": "+d.x+"\\n"+${js(c.yField)}+": "+d.y);
  ${c.labels?`g.selectAll("text.pca-sample-label")
    .data(samples.slice(0,${c.labelLimit}))
    .join("text")
    .attr("class","pca-sample-label")
    .attr("x",d=>x(d.x)+${c.radius+4})
    .attr("y",d=>y(d.y)-5)
    .attr("font-size",11)
    .attr("pointer-events","none")
    .text(d=>d.name);`:''}
  ${biplot&&c.pcaShowLoadings?`const arrowId="pca-loading-"+Math.random().toString(36).slice(2);
  svg.append("defs")
    .append("marker")
    .attr("id",arrowId)
    .attr("viewBox","0 0 10 10")
    .attr("refX",9)
    .attr("refY",5)
    .attr("markerWidth",6)
    .attr("markerHeight",6)
    .attr("orient","auto")
    .append("path")
    .attr("d",${js(biplot?"M1,1L9,5L1,9":"M0,0L10,5L0,10Z")})
    .attr("stroke",${js(c.pcaArrowColor)})
    .attr("stroke-width",${biplot?1.5:0})
    .attr("fill",${js(biplot?"none":c.pcaArrowColor)});
  const arrows=g.selectAll("line.pca-loading")
    .data(vectors)
    .join("line")
    .attr("class","pca-loading")
    .attr("x1",x(0))
    .attr("y1",y(0))
    .attr("x2",d=>x(d.displayX))
    .attr("y2",d=>y(d.displayY))
    .attr("stroke",${js(c.pcaArrowColor)})
    .attr("stroke-width",${c.lineWidth})
    .attr("marker-end","url(#"+arrowId+")");
  tip(arrows,d=>d.name+"\\n"+${js(tr('原始载荷','Original loadings','元の負荷量'))}+"\\n"+${js(c.xField)}+": "+d.x+"\\n"+${js(c.yField)}+": "+d.y+"\\n× ${c.pcaLoadingScale}");
  g.selectAll("text.pca-loading-label")
    .data(vectors)
    .join("text")
    .attr("class","pca-loading-label")
    .attr("transform",d=>{
      const angle=Math.atan2(y(d.displayY)-y(0),x(d.displayX)-x(0))*180/Math.PI;
      return "translate("+x(d.displayX)+","+y(d.displayY)+")rotate("+(angle>90?angle-180:angle< -90?angle+180:angle)+")";
    })
    .attr("x",d=>d.displayX<0?-7:7)
    .attr("y",-6)
    .attr("text-anchor",d=>d.displayX<0?"end":"start")
    .attr("font-size",11)
    .attr("fill",${js(c.pcaArrowColor)})
    .text(d=>d.name);`:''}
  ${c.legend?`const legend=svg.append("g")
    .attr("transform",${biplot?'"translate("+(margin.left+innerW+24)+","+(margin.top+innerH/2-Math.min(groups.length,12)*14)+")"':'"translate("+margin.left+",20)"'});
  ${biplot?`legend.append("text")
    .attr("y",-24)
    .attr("font-size",17)
    .text(${js(c.groupField||tr('分组','group','群'))});`:""}
  groups.forEach((group,index)=>{
    const item=legend.append("g")
    .attr("transform",${biplot?'"translate(0,"+index*28+")"':'"translate("+(index%4)*(innerW/4)+","+Math.floor(index/4)*20+")"'});
    item.append("circle")
    .attr("r",4)
    .attr("fill",color(group.name));
    item.append("text")
    .attr("x",10)
    .attr("y",4)
    .text(group.name.length>20?group.name.slice(0,19)+"…":group.name);
  });`:''}
  return svg.node();
}
const container=document.querySelector("#chart")||d3.select("body")
    .append("div")
    .attr("id","chart").node();
renderChart(container,data);
`;
 return {logic,data:dataSource,source:'import * as d3 from "d3";\n\n'+dataSource+logic.slice('import * as d3 from "d3";'.length)};
}
