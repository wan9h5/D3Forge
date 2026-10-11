import type { Config } from './model';
import type { BioTranslate } from './generateBio';
import { chromosomeSource } from './generateChromosomes';
const js=(v:unknown)=>JSON.stringify(v);
export function genomicSource(c:Config,tr:BioTranslate):string {
 if(c.bioVariant==='ligand')return ligandSource(c,tr);
 if(c.bioVariant==='ld')return ldSource(c,tr);
 return `
  // ${tr('Reference lengths must agree. Coordinates are supplied in one assembly; no inferred chromosome lengths.','参考长度必须一致，坐标来自同一组装版本，不以观测跨度推断染色体长度。','参照長は一貫した同一アセンブリの値を使用し、観測範囲から染色体長を推定しません。')}
  const lengths = new Map();
  function addReference(chr,length) {if(!named(chr)||!numeric(length)||+length<=0)return;chr=String(chr);if(!lengths.has(chr))lengths.set(chr,new Set());lengths.get(chr).add(+length);}
  data.forEach(d=>{addReference(d[${js(c.chromosomeField)}],d[${js(c.bioLengthField)}]);${c.bioVariant==='fusion'?`addReference(d[${js(c.bioTargetChrField)}],d[${js(c.bioTargetLengthField)}]);`:''}});
  const centerRefs = new Map();
  ${c.bioVariant==='centromere'?`data.forEach(d=>{const chr=String(d[${js(c.chromosomeField)}]);if(!centerRefs.has(chr))centerRefs.set(chr,new Set());centerRefs.get(chr).add(String(d[${js(c.bioCenterStartField)}])+":"+String(d[${js(c.bioCenterEndField)}]));});`:''}
  const validReference = (chr,length,position)=>named(chr)&&numeric(length)&&+length>0&&lengths.get(String(chr))?.size===1&&numeric(position)&&+position>=0&&+position<=+length;
  const input = data.filter(d=>validReference(d[${js(c.chromosomeField)}],d[${js(c.bioLengthField)}],d[${js(c.xField)}])${['circos-gene','ideogram','segments','centromere'].includes(c.bioVariant)?` && numeric(d[${js(c.bioEndField)}]) && +d[${js(c.bioEndField)}]>+d[${js(c.xField)}] && +d[${js(c.bioEndField)}]<=+d[${js(c.bioLengthField)}]`:''}${c.bioVariant==='fusion'?` && validReference(d[${js(c.bioTargetChrField)}],d[${js(c.bioTargetLengthField)}],d[${js(c.bioTargetPosField)}])${c.bioWeightEnabled?` && numeric(d[${js(c.bioWeightField)}]) && +d[${js(c.bioWeightField)}]>0 && +d[${js(c.bioWeightField)}]>=${c.bioMinWeight}`:''}`:''}${c.bioVariant==='centromere'?` && centerRefs.get(String(d[${js(c.chromosomeField)}]))?.size===1 && numeric(d[${js(c.bioCenterStartField)}]) && numeric(d[${js(c.bioCenterEndField)}]) && +d[${js(c.bioCenterStartField)}]>=0 && +d[${js(c.bioCenterEndField)}]>+d[${js(c.bioCenterStartField)}] && +d[${js(c.bioCenterEndField)}]<=+d[${js(c.bioLengthField)}]`:''});
  if(!input.length){message(${js(tr('No valid genomic records. Check reference lengths and coordinate bounds.','没有有效基因组记录，请检查参考长度与坐标边界。','有効なゲノム記録がありません。参照長と座標範囲を確認してください。'))});return svg.node();}
  const records = input.map(d=>({chr:String(d[${js(c.chromosomeField)}]),length:+d[${js(c.bioLengthField)}],start:+d[${js(c.xField)}],end:+d[${js(c.bioEndField)}],name:String(d[${js(c.labelField)}]??""),group:${c.groupField?`String(d[${js(c.groupField)}]??"All")`:'"All"'},targetChr:String(d[${js(c.bioTargetChrField)}]??""),target:+d[${js(c.bioTargetPosField)}],targetLength:+d[${js(c.bioTargetLengthField)}],weight:${c.bioWeightEnabled?`+d[${js(c.bioWeightField)}]`:'1'},centStart:+d[${js(c.bioCenterStartField)}],centEnd:+d[${js(c.bioCenterEndField)}],sourceRow:d}));
  const chromosomeNames = Array.from(new Set(records.flatMap(d=>[d.chr${c.bioVariant==='fusion'?',d.targetChr':''}]))).sort((a,b)=>a.replace(/^chr/i,"").localeCompare(b.replace(/^chr/i,""),undefined,{numeric:true}));
  const chromosomes = chromosomeNames.map(chr=>({chr,length:Array.from(lengths.get(chr))[0],centStart:records.find(d=>d.chr===chr)?.centStart,centEnd:records.find(d=>d.chr===chr)?.centEnd}));
  const groups = Array.from(new Set(records.map(d=>d.group)));color.domain(groups);
  ${c.bioVariant==='density'?'':`groupLegend(groups);`}
  ${c.bioAssemblyLabel?`svg.append("text")
    .attr("x",width-20)
    .attr("y",height-10)
    .attr("text-anchor","end")
    .attr("font-size",10)
    .text(${js(c.bioAssemblyLabel)});`:''}
${['circos-gene','fusion'].includes(c.bioVariant)?circosSource(c,tr):chromosomeSource(c,tr)}
`;
}
function circosSource(c:Config,tr:BioTranslate){return `
  const outer = Math.max(30,Math.min(width-230,height-180)/2), inner = outer*${c.bioInnerRadius};
  const cx = width/2, cy = (height+35)/2;
  const g = svg.append("g")
    .attr("transform","translate("+cx+","+cy+")");
  const total = d3.sum(chromosomes,d=>d.length), gap = Math.min(${c.bioGap},Math.PI/chromosomes.length);
  let angle = 0;
  const sectors = chromosomes.map(d=>{const span=(Math.PI*2-gap*chromosomes.length)*d.length/total;const s={...d,startAngle:angle,endAngle:angle+span};angle+=span+gap;return s;});
  const byName = new Map(sectors.map(d=>[d.chr,d]));
  const angleAt = (chr,pos)=>{const s=byName.get(chr);return s.startAngle+pos/s.length*(s.endAngle-s.startAngle);};
  const xy = (a,r)=>[Math.sin(a)*r,-Math.cos(a)*r];
  const arcs = g.selectAll("path.chromosome")
    .data(sectors)
    .join("path")
    .attr("class","chromosome segment")
    .attr("d",d3.arc().innerRadius(inner).outerRadius(outer))
    .attr("fill","#edf1f6")
    .attr("stroke","#a2afbf");
  tip(arcs,d=>d.chr+"\\n"+d.length+" bp");
  g.selectAll("text.chromosome-label")
    .data(sectors)
    .join("text")
    .attr("class","chromosome-label")
    .attr("transform",d=>"translate("+xy((d.startAngle+d.endAngle)/2,outer+15)+")")
    .attr("text-anchor","middle")
    .attr("dy",".32em")
    .text(d=>d.chr);
  ${c.xAxis?`sectors.forEach(sector=>{
    const ticks=g.selectAll(null)
      .data(d3.ticks(0,sector.length,3))
      .join("g")
      .attr("transform",pos=>"rotate("+(angleAt(sector.chr,pos)*180/Math.PI-90)+")translate("+inner+",0)");
    ticks.append("line")
      .attr("x2",-4)
      .attr("stroke","#9caabb");
    ticks.append("text")
      .attr("x",-6)
      .attr("dy",".3em")
      .attr("text-anchor","end")
      .attr("font-size",Math.max(7,fontSize-3))
      .text(pos=>d3.format(".2~s")(pos));
  });`:''}
  ${c.bioVariant==='circos-gene'?`const genes = g.selectAll("path.gene")
    .data(records)
    .join("path")
    .attr("class","gene point")
    .attr("d",d3.arc()
      .innerRadius(inner+2)
      .outerRadius(outer-2)
      .startAngle(d=>angleAt(d.chr,d.start))
      .endAngle(d=>angleAt(d.chr,d.end)))
    .attr("fill",d=>color(d.group))
    .attr("opacity",${c.opacity});
  tip(genes,d=>d.name+"\\n"+d.chr+":"+d.start+"–"+d.end+"\\n"+d.group);`:`const maxWeight = d3.max(records,d=>d.weight)||1;
  ${c.bioLinks?`const links = g.selectAll("path.fusion-link")
    .data(records)
    .join("path")
    .attr("class","fusion-link point")
    .attr("d",d=>"M"+xy(angleAt(d.chr,d.start),inner-2)+"C0,0 0,0 "+xy(angleAt(d.targetChr,d.target),inner-2))
    .attr("fill","none")
    .attr("stroke",d=>color(d.group))
    .attr("stroke-width",d=>${c.bioLinkWidth}*${c.bioWeightEnabled?'(.4+2.6*d.weight/maxWeight)':'1'})
    .attr("stroke-opacity",${c.opacity});
  tip(links,d=>d.name+"\\n"+d.chr+":"+d.start+" → "+d.targetChr+":"+d.target+"\\n${tr('Support','支持强度','支持強度')}: "+d.weight);`:''}
  const anchors = g.selectAll("circle.endpoint")
    .data(records.flatMap(d=>[{...d,a:angleAt(d.chr,d.start)},{...d,a:angleAt(d.targetChr,d.target)}]))
    .join("circle")
    .attr("class","endpoint point")
    .attr("cx",d=>xy(d.a,outer-4)[0])
    .attr("cy",d=>xy(d.a,outer-4)[1])
    .attr("r",${c.radius})
    .attr("fill",d=>color(d.group));
  tip(anchors,d=>d.name);`}
  ${c.labels?`const candidates = records.flatMap(d=>[{name:d.name,chr:d.chr,pos:d.start}${c.bioVariant==='fusion'?',{name:d.name,chr:d.targetChr,pos:d.target}':''}]).filter(d=>d.name);
  const unique = Array.from(d3.rollup(candidates,rows=>rows[0],d=>JSON.stringify([d.name,d.chr,d.pos])).values()).map(d=>({...d,a:angleAt(d.chr,d.pos)})).sort((a,b)=>a.a-b.a);
  const chosen=[];unique.forEach(d=>{if(chosen.length<${c.bioLabelLimit}&&(!chosen.length||d.a-chosen[chosen.length-1].a>.12))chosen.push(d);});
  if(chosen.length>1&&chosen[0].a+2*Math.PI-chosen[chosen.length-1].a<.12)chosen.pop();
  const labels = g.selectAll("g.gene-label")
    .data(chosen)
    .join("g")
    .attr("class","gene-label");
  labels.append("path")
    .attr("d",d=>"M"+xy(d.a,outer)+"L"+xy(d.a,outer+32))
    .attr("stroke","#b6c1ce")
    .attr("fill","none");
  labels.append("text")
    .attr("x",d=>xy(d.a,outer+37)[0])
    .attr("y",d=>xy(d.a,outer+37)[1])
    .attr("text-anchor",d=>Math.sin(d.a)<0?"end":"start")
    .attr("dy",".32em")
    .attr("font-size",fontSize)
    .text(d=>d.name.length>18?d.name.slice(0,16)+"…":d.name);
  tip(labels,d=>d.name+"\\n"+d.chr+":"+d.pos);`:''}
`;}
function ligandSource(c:Config,tr:BioTranslate){return `
  const input = data.filter(d=>named(d[${js(c.bioSourceField)}])&&named(d[${js(c.bioTargetField)}])&&numeric(d[${js(c.bioWeightField)}])&&+d[${js(c.bioWeightField)}]>0&&+d[${js(c.bioWeightField)}]>=${c.bioMinWeight});
  if(!input.length){message(${js(tr('No positive receptor–ligand links.','没有正强度的受体–配体关联。','正の受容体・リガンド関連がありません。'))});return svg.node();}
  const names = Array.from(new Set(input.flatMap(d=>[String(d[${js(c.bioSourceField)}]),String(d[${js(c.bioTargetField)}])])));
  color.domain(names);groupLegend(names);
  const matrix = names.map(source=>names.map(target=>d3.sum(input.filter(d=>String(d[${js(c.bioSourceField)}])===source&&String(d[${js(c.bioTargetField)}])===target),d=>+d[${js(c.bioWeightField)}])));
  const outer = Math.max(20,Math.min(width-210,height-150)/2), inner=outer*${c.bioInnerRadius};
  const g = svg.append("g")
    .attr("transform","translate("+width/2+","+(height+45)/2+")");
  const chords = d3.chordDirected()
    .padAngle(${c.bioGap})
    .sortSubgroups(d3.descending)(matrix);
  const sectors = g.selectAll("path.sector")
    .data(chords.groups)
    .join("path")
    .attr("class","sector segment")
    .attr("d",d3.arc().innerRadius(inner).outerRadius(outer))
    .attr("fill",d=>color(names[d.index]));
  tip(sectors,d=>names[d.index]+"\\n${tr('Incoming + outgoing strength','接收 + 发出强度','受信＋送信強度')}: "+d.value);
  ${c.bioLinks?`const ribbons = g.selectAll("path.ribbon")
    .data(chords)
    .join("path")
    .attr("class","ribbon point")
    .attr("d",d3.${c.bioArrow?'ribbonArrow':'ribbon'}().radius(inner-2)${c.bioArrow?'.headRadius(7)':''})
    .attr("fill",d=>color(names[d.source.index]))
    .attr("fill-opacity",${c.opacity})
    .attr("stroke","white")
    .attr("stroke-width",.5);
  tip(ribbons,d=>{
    const source=names[d.source.index],target=names[d.target.index];
    const pairs=Array.from(new Set(input.filter(row=>String(row[${js(c.bioSourceField)}])===source&&String(row[${js(c.bioTargetField)}])===target).map(row=>String(row[${js(c.bioLigandField)}]??"")+" → "+String(row[${js(c.bioReceptorField)}]??""))));
    return source+" → "+target+"\\n"+d.source.value+"\\n"+pairs.join("\\n");
  });`:''}
  ${c.labels?`g.selectAll("text.cell-label")
    .data(chords.groups)
    .join("text")
    .attr("class","cell-label")
    .attr("x",d=>Math.sin((d.startAngle+d.endAngle)/2)*(outer+12))
    .attr("y",d=>-Math.cos((d.startAngle+d.endAngle)/2)*(outer+12))
    .attr("text-anchor",d=>Math.sin((d.startAngle+d.endAngle)/2)<0?"end":"start")
    .attr("dy",".32em")
    .text(d=>names[d.index]);`:''}
`;}
function ldSource(c:Config,tr:BioTranslate){return `
  const input = data.filter(d=>named(d[${js(c.chromosomeField)}])&&named(d[${js(c.bioSnpAField)}])&&named(d[${js(c.bioSnpBField)}])&&numeric(d[${js(c.xField)}])&&+d[${js(c.xField)}]>=0&&numeric(d[${js(c.bioTargetPosField)}])&&+d[${js(c.bioTargetPosField)}]>=0&&numeric(d[${js(c.bioLDField)}])&&+d[${js(c.bioLDField)}]>=0&&+d[${js(c.bioLDField)}]<=1);
  const chromosomes = Array.from(new Set(input.map(d=>String(d[${js(c.chromosomeField)}]))));
  const chromosome = ${js(c.bioLDChromosome)} || chromosomes[0];
  const selected = input.filter(d=>String(d[${js(c.chromosomeField)}])===chromosome);
  const positions = new Map();
  selected.forEach(d=>[[d[${js(c.bioSnpAField)}],d[${js(c.xField)}]],[d[${js(c.bioSnpBField)}],d[${js(c.bioTargetPosField)}]]].forEach(([id,pos])=>{id=String(id);if(!positions.has(id))positions.set(id,new Set());positions.get(id).add(+pos);}));
  const records = selected.filter(d=>positions.get(String(d[${js(c.bioSnpAField)}])).size===1&&positions.get(String(d[${js(c.bioSnpBField)}])).size===1);
  const snps = Array.from(new Set(records.flatMap(d=>[String(d[${js(c.bioSnpAField)}]),String(d[${js(c.bioSnpBField)}])]))).sort((a,b)=>Array.from(positions.get(a))[0]-Array.from(positions.get(b))[0]||a.localeCompare(b));
  if(!snps.length){message(${js(tr('No valid SNP pairs for the selected chromosome.','所选染色体没有有效 SNP 对。','選択染色体に有効な SNP 対がありません。'))});return svg.node();}
  const pairs = d3.rollups(records,rows=>d3.mean(rows,d=>+d[${js(c.bioLDField)}]),d=>JSON.stringify([String(d[${js(c.bioSnpAField)}]),String(d[${js(c.bioSnpBField)}])].sort((a,b)=>snps.indexOf(a)-snps.indexOf(b))))
    .map(([key,value])=>{const [a,b]=JSON.parse(key);return {a,b,i:snps.indexOf(a),j:snps.indexOf(b),value};});
  const left=70,top=140,plotW=width-140;
  const step=Math.max(1,Math.min(plotW/snps.length,(height-top-60)*2/snps.length));
  const matrixW=step*snps.length;
  const physical = d3.scaleLinear()
    .domain(d3.extent(snps,id=>Array.from(positions.get(id))[0]))
    .range([step/2,matrixW-step/2]);
  const fill = d3.scaleLinear()
    .domain(${c.colorDomainEnabled?js([c.colorMin,c.colorMax]):'[0,1]'})
    .range([${js(c.secondaryColor)},${js(c.color)}])
    .clamp(true);
  const g=svg.append("g")
    .attr("transform","translate("+left+","+top+")");
  ${c.xAxis?`g.append("g")
    .attr("transform","translate(0,-70)")
    .call(d3.axisTop(physical).ticks(5).tickFormat(d=>d3.format(".3~s")(d)));
  g.append("text")
    .attr("x",0)
    .attr("y",-102)
    .text(chromosome+" · ${tr('physical position (bp)','物理位置（bp）','物理位置（bp）')}");`:''}
  g.selectAll("path.position-link")
    .data(snps)
    .join("path")
    .attr("class","position-link")
    .attr("d",(id,i)=>"M"+physical(Array.from(positions.get(id))[0])+",-65L"+((i+.5)*step)+",-5")
    .attr("fill","none")
    .attr("stroke","#b6c2d0")
    .attr("stroke-width",.6);
  const marks=g.selectAll("path.ld-cell")
    .data(pairs)
    .join("path")
    .attr("class","ld-cell point")
    .attr("d",d=>{const x=(d.i+d.j+1)*step/2,y=(d.j-d.i)*step/2,s=step/2;return "M"+x+","+(y-s)+"L"+(x+s)+","+y+"L"+x+","+(y+s)+"L"+(x-s)+","+y+"Z";})
    .attr("fill",d=>fill(d.value))
    .attr("stroke",${c.grid?'"white"':'"none"'})
    .attr("stroke-width",.4);
  tip(marks,d=>d.a+" / "+d.b+"\\n"+${js(c.bioLDField)}+"="+d3.format(".3f")(d.value));
  ${c.labels?`g.selectAll("text.snp-label")
    .data(snps.filter((_,i)=>i%Math.max(1,Math.ceil(snps.length/${c.bioLabelLimit}))===0))
    .join("text")
    .attr("class","snp-label")
    .attr("transform",id=>"translate("+((snps.indexOf(id)+.5)*step)+",-10)rotate(-60)")
    .attr("text-anchor","start")
    .attr("font-size",Math.max(8,fontSize-1))
    .text(id=>id);`:''}
  ${c.bioValueLabels?`g.selectAll("text.ld-value")
    .data(pairs)
    .join("text")
    .attr("class","ld-value")
    .attr("x",d=>(d.i+d.j+1)*step/2)
    .attr("y",d=>(d.j-d.i)*step/2)
    .attr("dy",".32em")
    .attr("text-anchor","middle")
    .attr("font-size",Math.min(fontSize,step*.3))
    .text(d=>d3.format(".2f")(d.value));`:''}
  ${c.legend?`const keys=svg.append("g")
    .attr("transform","translate(70,"+(height-25)+")");
  keys.selectAll("rect")
    .data(d3.range(60))
    .join("rect")
    .attr("x",d=>d*3)
    .attr("width",3.1)
    .attr("height",8)
    .attr("fill",d=>fill(fill.domain()[0]+d/59*(fill.domain()[1]-fill.domain()[0])));
  keys.append("text")
    .attr("y",-6)
    .text(${js(c.bioLDField)}+" · "+fill.domain()
    .join(" → "));`:''}
`;}
