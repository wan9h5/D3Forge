// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import * as d3 from 'd3';
import { generateCodeParts, executableSource } from '../src/generate';
import { charts, defaults, mockData, thumbnailConfig, thumbnailData, validateRows, type ChartType, type Config, type Row } from '../src/model';
import { useBuilder } from '../src/store';

beforeEach(() => {
  document.body.innerHTML = '<div id="chart"></div>';
  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', { configurable: true, value() { return (this.textContent?.length || 0) * 7; } });
});
function run(type: ChartType, rows = mockData(type), patch: Partial<Config> = {}) {
  const config = { ...defaults(type), ...patch };
  const parts = generateCodeParts(type, rows, config);
  new Function('d3', 'document', executableSource(parts.source))(d3, document);
  const svg = document.querySelector('svg')!;
  expect(svg).not.toBeNull();
  for (const node of svg.querySelectorAll('*')) {
    for (const name of ['x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'd', 'transform']) {
      if (node.hasAttribute(name)) expect(node.getAttribute(name), `${type}: ${name}`).not.toMatch(/NaN|Infinity/);
    }
  }
  return { svg, parts, config };
}
function values<T>(svg: SVGSVGElement, selector: string): T[] {
  return [...svg.querySelectorAll(selector)].map(node => d3.select(node).datum() as T);
}

for (const { id: type } of charts) describe(`${type}: export and data boundaries`, () => {
  it('executes standalone and composes data with exactly the same logic', () => {
    const { parts } = run(type);
    expect(parts.source).toBe(parts.logic.replace('import * as d3 from "d3";', 'import * as d3 from "d3";\n\n' + parts.data));
    expect(new Function(parts.data + '\nreturn data;')()).toEqual(mockData(type));
    expect(parts.logic).not.toContain('const data =');
    expect(parts.logic).not.toMatch(/useBuilder|React|generateCode|eval\(/);
  });
  it('renders the actual gallery thumbnail through the same generator', () => {
    run(type, thumbnailData(type), thumbnailConfig(type));
  });
  it('handles empty/invalid rows without nonfinite SVG attributes', () => {
    for (const rows of [[], [{ [defaults(type).xField]: '', [defaults(type).yField]: null }]]) {
      const { svg } = run(type, rows);
      expect(svg.textContent).toContain('No valid rows');
    }
  });
  it('supports optional sections off, then labels and observations on', () => {
    const { parts } = run(type, undefined, { tooltip: false, legend: false, xAxis: false, yAxis: false, grid: false, showThreshold: false, showSuggestive: false });
    expect(parts.logic).not.toMatch(/const (?:tooltip|legend|xAxis|yAxis) =/);
    run(type, undefined, { labels: true, showPoints: true, showSuggestive: true });
  });
  it('preserves hostile strings as text and never produces HTML elements', () => {
    const c = defaults(type);
    const rows = mockData(type).slice(0, 12).map(row => ({ ...row, [c.labelField]: '<img src=x onerror=alert(1)>', [c.tooltipFields[0]]: '</script><script>throw 1</script>' }));
    const { svg, parts } = run(type, rows, { labels: true, tooltip: true });
    expect(document.querySelector('img, script')).toBeNull();
    expect(new Function(parts.data + '\nreturn data;')()).toEqual(rows);
    expect(svg).not.toBeNull();
  });
});

describe('bar arithmetic and orientation', () => {
  const rows = [
    { category: 'A', series: 'one', value: 2 }, { category: 'A', series: 'one', value: 3 },
    { category: 'A', series: 'two', value: -4 }, { category: 'B', series: 'two', value: 6 },
  ];
  for (const horizontal of [false, true]) for (const barLayout of ['grouped', 'stacked'] as const) {
    it(`${barLayout}, horizontal=${horizontal}: sums repeated rows and places negative bars`, () => {
      const { svg } = run('bar', rows, { horizontal, barLayout, labels: true });
      const bars = values<{category:string;series:string;value:number;low:number;high:number}>(svg, '.marks rect');
      expect(bars).toHaveLength(3);
      expect(bars.find(d => d.category === 'A' && d.series === 'one')).toMatchObject({ value: 5, low: 0, high: 5 });
      expect(bars.find(d => d.value === -4)).toMatchObject({ low: -4, high: 0 });
      expect(svg.querySelectorAll('.marks text')).toHaveLength(3);
    });
  }
  it('stacks positive/negative values independently using known expected totals', () => {
    const { svg } = run('bar', [2,3,-4,-6].map((value,i) => ({ category:'A', series:String(i), value })), {barLayout:'stacked'});
    expect(values(svg, '.marks rect')).toEqual(expect.arrayContaining([
      expect.objectContaining({value:2,low:0,high:2}), expect.objectContaining({value:3,low:2,high:5}),
      expect.objectContaining({value:-4,low:-4,high:0}), expect.objectContaining({value:-6,low:-10,high:-4}),
    ]));
  });
  it('renders all-zero data and a single category/series', () => { run('bar', [{category:'A',value:0}], {groupField:''}); });
  it('shows real newlines in aggregated tooltips', () => {
    const { svg } = run('bar', rows);
    svg.querySelector('.marks rect')!.dispatchEvent(new MouseEvent('pointermove', {bubbles:true,clientX:5,clientY:5}));
    const text = document.querySelector('#chart > div')!.textContent!;
    expect(text).toContain('category: A\nvalue: 5\nseries: one');
  });
});

describe('line ordering, curves, scales and points', () => {
  const rows = [{time:3,value:6,series:'A'},{time:1,value:2,series:'A'},{time:2,value:4,series:'A'}];
  for (const smooth of [false,true]) for (const area of [false,true]) for (const showPoints of [false,true]) {
    it(`smooth=${smooth}, area=${area}, points=${showPoints}`, () => {
      const { svg } = run('line', rows, {smooth,area,showPoints});
      expect(values<{rows:{_x:number}[]}>(svg,'.marks path.line')[0].rows.map(d=>d._x)).toEqual([1,2,3]);
      expect(svg.querySelectorAll('.marks path.area')).toHaveLength(area?1:0);
      expect(svg.querySelectorAll('.marks circle')).toHaveLength(showPoints?3:0);
    });
  }
  it('handles singleton and equal-X rows with log scales and filled area', () => {
    run('line', [{time:2,value:4,series:'A'},{time:2,value:8,series:'A'}], {xScale:'log',yScale:'log',area:true,smooth:true});
    run('line', [{time:2,value:4,series:'A'}], {xScale:'log',yScale:'log',area:true});
  });
  it('filters invalid logarithmic values consistently with the count', () => {
    const input = [...rows,{time:0,value:2,series:'A'},{time:1,value:0,series:'A'},{time:1,value:'',series:'A'}];
    const { svg,config } = run('line', input, {xScale:'log',yScale:'log'});
    expect(svg.querySelectorAll('.marks circle')).toHaveLength(validateRows('line',input,config).length);
  });
});

describe('violin statistical expectations', () => {
  it('matches independent Tukey quartiles, median and observed whiskers', () => {
    const { svg } = run('violin', [1,2,3,4,5,100].map(value=>({group:'A',value})));
    expect(values(svg,'path.violin')[0]).toMatchObject({q1:2.25,median:3.5,q3:4.75,low:1,high:5});
  });
  it('constant group KDE has expected support, peak and unit integral', () => {
    const { svg } = run('violin', [{group:'A',value:0},{group:'A',value:0}]);
    const summary = values<{bandwidth:number;density:number[][];peak:number}>(svg,'path.violin')[0];
    expect(summary.bandwidth).toBe(1);
    expect(summary.density[0]).toEqual([-1,0]);
    expect(summary.density[40]).toEqual([0,.75]);
    expect(summary.density[80]).toEqual([1,0]);
    let integral=0;
    for(let i=1;i<summary.density.length;i++){
      const [a,p]=summary.density[i-1], [b,q]=summary.density[i];
      integral+=(b-a)*(p+q)/2;
    }
    expect(integral).toBeCloseTo(1,3);
  });
  for (const violinInner of ['box','median','none'] as const) for (const violinScale of ['width','density'] as const) {
    it(`summary=${violinInner}, width=${violinScale}: singleton and different spreads`, () => {
      const input=[{group:'single',value:10},...[-10,-1,0,1,10].map(value=>({group:'wide',value}))];
      const { svg }=run('violin',input,{violinInner,violinScale,showPoints:true});
      expect(svg.querySelectorAll('path.violin')).toHaveLength(2);
      expect(svg.querySelectorAll('circle.observation')).toHaveLength(6);
      expect(svg.querySelectorAll('g.summary')).toHaveLength(violinInner==='none'?0:2);
    });
  }
  it('keeps jitter positions fixed while point size changes', () => {
    const {svg}=run('violin',undefined,{showPoints:true});
    const before=[...svg.querySelectorAll('circle.observation')].map(d=>d.getAttribute('cx'));
    const {svg:after}=run('violin',undefined,{showPoints:true,radius:5});
    expect([...after.querySelectorAll('circle.observation')].map(d=>d.getAttribute('cx'))).toEqual(before);
  });
});

describe('Manhattan transformation and chromosome layout', () => {
  const rows=[{snp:'x',chromosome:'chrX',position:20,pvalue:.01},{snp:'b',chromosome:'chr02',position:50,pvalue:1e-8},{snp:'a',chromosome:'1',position:100,pvalue:1},{snp:'m',chromosome:'M',position:10,pvalue:.1}];
  it('normalizes chromosome names, numeric order, offsets and -log10 independently', () => {
    const {svg}=run('manhattan',rows,{chromosomeGap:0});
    const points=values<{_chromosome:string;_x:number;_y:number}>(svg,'.marks circle');
    expect(points).toMatchObject([
      {_chromosome:'X',_x:170,_y:2},{_chromosome:'2',_x:150,_y:8},
      {_chromosome:'1',_x:100,_y:-0},{_chromosome:'MT',_x:180,_y:1},
    ]);
  });
  it('skips zero/out-of-range p-values, negative positions and missing chromosomes', () => {
    const input=[...rows,{chromosome:'1',position:5,pvalue:0},{chromosome:'1',position:-1,pvalue:.1},{chromosome:'chr',position:2,pvalue:.1},{chromosome:'1',position:2,pvalue:2}];
    const {svg,config}=run('manhattan',input);
    expect(svg.querySelectorAll('.marks circle')).toHaveLength(4);
    expect(validateRows('manhattan',input,config)).toHaveLength(4);
  });
  it('honors threshold equality, label limits and disabled reference lines', () => {
    const {svg}=run('manhattan',[1e-9,5e-8,.5].map((pvalue,i)=>({snp:String(i),chromosome:'1',position:i,pvalue})),{labels:true,labelLimit:1,showThreshold:false,showSuggestive:true});
    expect(svg.querySelectorAll('.marks text.label')).toHaveLength(1);
    expect(svg.querySelector('.marks text.label')?.textContent).toBe('0');
    expect([...svg.querySelectorAll('.marks circle')].map(d=>d.getAttribute('fill'))).toEqual(['#e2ad42','#e2ad42','#356ae6']);
    expect(svg.querySelector('.significance-threshold')).toBeNull();
    expect(svg.querySelector('.suggestive-threshold')).not.toBeNull();
  });
});

describe('CSV field mapping and resets', () => {
  for (const {id:type} of charts) it(`${type}: import preserves visuals and reset restores defaults`, () => {
    useBuilder.getState().selectChart(type);
    useBuilder.getState().setConfig({opacity:.4,radius:8,color:'#123456'});
    useBuilder.getState().loadData(mockData(type),'uploaded.csv');
    expect(useBuilder.getState().config).toMatchObject({opacity:.4,radius:8,color:'#123456'});
    expect(useBuilder.getState().dataName).toBe('uploaded.csv');
    useBuilder.getState().reset();
    expect(useBuilder.getState().config).toEqual(defaults(type));
    expect(useBuilder.getState().data).toEqual(mockData(type));
  });
  it('recognizes Manhattan aliases independently of CSV column order', () => {
    useBuilder.getState().selectChart('manhattan');
    useBuilder.getState().loadData([{P:1e-8,CHR:1,BP:100,ID:'rs1'}],'gwas.csv');
    expect(useBuilder.getState().config).toMatchObject({xField:'BP',yField:'P',chromosomeField:'CHR',labelField:'ID'});
  });
});

for (const {id:type} of charts) describe(`${type}: first-render legend and source formatting`, () => {
  it('spaces labels even when SVG text is not yet measurable', () => {
    Object.defineProperty(SVGElement.prototype,'getComputedTextLength',{configurable:true,value:()=>0});
    const {svg}=run(type);
    if(type==='histogram') { expect(svg.querySelector('.legend')).toBeNull(); return; }
    if(type==='heatmap') {
      const rectangles=[...svg.querySelectorAll('.legend > rect')];
      expect(rectangles).toHaveLength(60);
      expect(rectangles.every((node,index)=>index===0 || +node.getAttribute('x')! > +rectangles[index-1].getAttribute('x')!)).toBe(true);
      return;
    }
    const items=[...svg.lastElementChild!.querySelectorAll(':scope > g')];
    let previousRight=-Infinity;
    for(const item of items){
      const text=item.querySelector('text');if(!text)continue;
      const left=Number(item.getAttribute('transform')!.match(/translate\(([^,]+)/)![1])+10;
      expect(left).toBeGreaterThan(previousRight);
      previousRight=left+Array.from(text.textContent!).reduce((sum,char)=>sum+(char.charCodeAt(0)>255?12:7),0);
    }
  });
  it('formats D3 chains on separate lines', () => {
    const {parts}=run(type);
    expect(parts.logic).not.toMatch(/\)\.(?:attr|style|data|join|nice|range|padding|remove)\(/);
  });
});
it('Manhattan places all numeric chromosomes before X/Y/MT and contigs', () => {
  const {svg}=run('manhattan',['contig2','X','30','2','MT','Y','contig1'].map(chromosome=>({chromosome,position:1,pvalue:.01})),{chromosomeGap:0});
  const points=values<{_chromosome:string;_x:number}>(svg,'.marks circle').sort((a,b)=>a._x-b._x);
  expect(points.map(d=>d._chromosome)).toEqual(['2','30','X','Y','MT','CONTIG1','CONTIG2']);
});

// Independent expected values for the new statistical transformations.
describe('heatmap aggregation and color expectations', () => {
  const rows = [
    {sample:'A',gene:'g1',value:2},{sample:'A',gene:'g1',value:6},
    {sample:'B',gene:'g1',value:-3},{sample:'A',gene:'g2',value:0},
  ];
  for(const heatmapAggregate of ['mean','sum'] as const) it(`aggregates repeated coordinates by ${heatmapAggregate} and leaves missing cells blank`,()=>{
    const {svg}=run('heatmap',rows,{heatmapAggregate});
    const cells=values<{column:string;row:string;value:number;count:number}>(svg,'.cell');
    expect(cells).toHaveLength(3);
    expect(cells.find(d=>d.column==='A'&&d.row==='g1')).toMatchObject({value:heatmapAggregate==='mean'?4:8,count:2});
    expect(cells.find(d=>d.column==='B'&&d.row==='g2')).toBeUndefined();
    expect(cells.find(d=>d.row==='g2')?.value).toBe(0);
  });
  it('filters missing categories and invalid values consistently with the UI count',()=>{
    const input=[...rows,{sample:'',gene:'g1',value:2},{sample:'A',gene:' ',value:2},{sample:'A',gene:'g1',value:null}];
    const {svg,config}=run('heatmap',input);
    expect(validateRows('heatmap',input,config)).toHaveLength(4);
    expect(svg.querySelectorAll('.cell')).toHaveLength(3);
  });
  for(const heatmapPalette of ['sequential','diverging'] as const) it(`handles all-zero matrices with ${heatmapPalette} colors`,()=>{
    const {svg}=run('heatmap',[{sample:'A',gene:'g1',value:0}],{heatmapPalette,labels:true,cellGap:8,cellRadius:10});
    expect(svg.querySelector('.cell')?.getAttribute('fill')).toMatch(/^rgb/);
    expect(svg.querySelector('.cell-label')?.textContent).toBe('0');
  });
  it('uses zero as the neutral color and retains aggregated tooltip values',()=>{
    const {svg}=run('heatmap',rows,{heatmapPalette:'diverging',tooltip:true});
    const cell=[...svg.querySelectorAll('.cell')].find(node=>(d3.select(node).datum() as {value:number}).value===0)!;
    expect(cell.getAttribute('fill')).toBe('rgb(247, 249, 252)');
    svg.querySelector('.cell')!.dispatchEvent(new MouseEvent('pointermove',{bubbles:true,clientX:1,clientY:1}));
    expect(document.querySelector('#chart > div')?.textContent).toContain('value: 4\nObservations: 2');
  });
  it('maps local long-format CSV fields without losing controls',()=>{
    useBuilder.getState().selectChart('heatmap');
    useBuilder.getState().setConfig({cellGap:5,heatmapAggregate:'sum'});
    useBuilder.getState().loadData([{column:'A',row:'g1',score:4}],'matrix.csv');
    expect(useBuilder.getState().config).toMatchObject({xField:'column',yField:'row',valueField:'score',cellGap:5,heatmapAggregate:'sum'});
  });
});

describe('histogram independent bin and density expectations',()=>{
  const rows=[0,1,2,3,4].map(value=>({value}));
  for(const histogramMode of ['count','density'] as const) it(`matches known equal-width bins in ${histogramMode} mode`,()=>{
    const {svg}=run('histogram',rows,{binCount:2,histogramMode});
    const bins=values<{x0:number;x1:number;count:number;density:number;value:number}>(svg,'.bin');
    expect(bins).toMatchObject([{x0:0,x1:2,count:2,density:.2},{x0:2,x1:4,count:3,density:.3}]);
    expect(bins.map(bin=>bin.value)).toEqual(histogramMode==='count'?[2,3]:[.2,.3]);
    expect(bins.reduce((sum,bin)=>sum+bin.density*(bin.x1-bin.x0),0)).toBeCloseTo(1,12);
  });
  it('places negative values, internal boundaries and the maximum correctly',()=>{
    const {svg}=run('histogram',[-4,-2,0,2,4].map(value=>({value})),{binCount:4});
    expect(values<{count:number}>(svg,'.bin').map(bin=>bin.count)).toEqual([1,1,1,2]);
  });
  for(const input of [[0],[5,5,5],[-3,-3]]) it(`renders finite nonzero-width bins for constant data ${input}`,()=>{
    const {svg}=run('histogram',input.map(value=>({value})),{binCount:4,histogramMode:'density',labels:true});
    const bins=values<{x0:number;x1:number;count:number;density:number}>(svg,'.bin');
    expect(bins.reduce((sum,bin)=>sum+bin.count,0)).toBe(input.length);
    expect(bins.every(bin=>bin.x1>bin.x0)).toBe(true);
    expect(bins.reduce((sum,bin)=>sum+bin.density*(bin.x1-bin.x0),0)).toBeCloseTo(1,12);
  });
  it('skips blank and nonfinite values without requiring a second numeric field',()=>{
    const input=[...rows,{value:null},{value:''},{value:'invalid'},{value:Infinity}];
    const {svg,config}=run('histogram',input,{yField:'missing'});
    expect(validateRows('histogram',input,config)).toHaveLength(5);
    expect(values<{count:number}>(svg,'.bin').reduce((sum,bin)=>sum+bin.count,0)).toBe(5);
  });
  it('maps one-column CSV and preserves bin settings',()=>{
    useBuilder.getState().selectChart('histogram');
    useBuilder.getState().setConfig({binCount:6,histogramMode:'density'});
    useBuilder.getState().loadData([{measurement:1},{measurement:2}],'values.csv');
    expect(useBuilder.getState().config).toMatchObject({xField:'measurement',binCount:6,histogramMode:'density'});
  });
});

describe('advanced options execute the exported source', () => {
  const advanced: Partial<Config> = {
    axisStyle:true,xTitle:'Custom X',yTitle:'Custom Y',tickFontSize:17,titleFontSize:19,xTickAngle:-35,xTickFormat:'.2f',yTickFormat:'.2f',
    canvasStyle:true,background:'#f8f9ff',marginTop:80,marginBottom:90,
    gridStyle:true,grid:true,gridColor:'#123456',gridWidth:2,gridDash:'2,3',
    labelStyle:true,labels:true,labelFontSize:18,labelColor:'#234567',valueFormat:'.2f',
    legendStyle:true,legend:true,legendPosition:'bottom',legendDirection:'column',legendMaxItems:2,
    markBorder:true,borderColor:'#345678',borderWidth:3,chartStyle:true,
    pointShape:'diamond',scatterSizeEnabled:true,sizeField:'expressionA',
    cornerRadius:6,curveType:'step',lineDash:'6,4',area:true,showPoints:true,
    violinSamples:41,violinWidth:.3,jitterWidth:.2,
    rowOrder:'descending',columnOrder:'ascending',colorDomainEnabled:true,colorMin:-2,colorMax:4,missingColorEnabled:true,
    referenceXEnabled:true,referenceX:10,referenceYEnabled:true,referenceY:2,
  };
  for(const {id:type} of charts) {
    it(`${type}: enabled settings are standalone and keep all exported data`,()=>{
      const {svg,parts}=run(type,undefined,advanced);
      expect(svg.style.background).toBe('rgb(248, 249, 255)');
      expect(new Function(parts.data+'\nreturn data;')()).toEqual(mockData(type));
      expect(svg.querySelector('.axis-title-x')?.textContent).toBe('Custom X');
      expect(svg.querySelector('.axis-title-y')?.textContent).toBe('Custom Y');
      expect(parts.source).not.toMatch(/\)\.(attr|style|data|join|nice|range|padding|remove)\(/);
    });
    it(`${type}: advanced settings tolerate disabled axes, grid, labels and legend`,()=>{
      run(type,undefined,{...advanced,xAxis:false,yAxis:false,grid:false,labels:false,legend:false});
    });
  }
  for(const pointShape of ['circle','square','triangle','diamond','star','cross'] as const) {
    it(`scatter supports ${pointShape} with size mapping`,()=>{
      const rows=[{x:1,y:3,size:0},{x:2,y:2,size:4},{x:3,y:1,size:16}];
      const {svg}=run('scatter',rows,{chartStyle:true,pointShape,scatterSizeEnabled:true,xField:'x',yField:'y',sizeField:'size',sizeMin:2,sizeMax:10,groupField:''});
      if(pointShape==='circle')expect([...svg.querySelectorAll('circle')].map(n=>+n.getAttribute('r')!)).toEqual([2,6,10]);
      else expect(svg.querySelectorAll('path.point')).toHaveLength(3);
    });
  }
  it('explicit display limits clip marks without filtering exported rows',()=>{
    const rows=[{x:1,y:1},{x:10,y:10},{x:100,y:100}];
    const {svg,parts}=run('scatter',rows,{xField:'x',yField:'y',groupField:'',xDomainEnabled:true,xMin:5,xMax:20,yDomainEnabled:true,yMin:5,yMax:20});
    expect(svg.querySelectorAll('circle')).toHaveLength(3);
    expect(parts.logic).toContain('x.domain([5, 20])');
    expect(svg.querySelector('clipPath rect')?.getAttribute('width')).not.toBeNull();
  });
  it('range-filtered histogram has independently expected counts and unit density area',()=>{
    const rows=[-10,0,1,2,3,4,20].map(value=>({value}));
    const {svg,config}=run('histogram',rows,{histogramRangeEnabled:true,histogramMin:0,histogramMax:4,binCount:2,histogramMode:'density',chartStyle:true,binGap:4});
    const bins=values<{x0:number;x1:number;count:number;density:number}>(svg,'.bin');
    expect(bins).toMatchObject([{x0:0,x1:2,count:2,density:.2},{x0:2,x1:4,count:3,density:.3}]);
    expect(bins.reduce((sum,b)=>sum+b.density*(b.x1-b.x0),0)).toBeCloseTo(1,12);
    expect(validateRows('histogram',rows,config)).toHaveLength(5);
  });
  it('violin resolution changes density samples but preserves expected quartiles',()=>{
    const {svg}=run('violin',[1,2,3,4,5,100].map(value=>({group:'A',value})),{chartStyle:true,violinSamples:41});
    const summary=values<{density:number[][];q1:number;median:number;q3:number}>(svg,'path.violin')[0];
    expect(summary.density).toHaveLength(41);
    expect(summary).toMatchObject({q1:2.25,median:3.5,q3:4.75});
  });
  it('log scale changes keep enabled domains valid',()=>{
    useBuilder.getState().selectChart('scatter');
    useBuilder.getState().setConfig({xDomainEnabled:true,xMin:0,xMax:10,xScale:'log'});
    expect(useBuilder.getState().config.xMin).toBeGreaterThan(0);
    useBuilder.getState().setConfig({xMin:-5,xMax:-1});
    expect(useBuilder.getState().config.xDomainEnabled).toBe(false);
  });
  it('CSV imports remap a stale size field while preserving styling',()=>{
    useBuilder.getState().selectChart('scatter');
    useBuilder.getState().setConfig({scatterSizeEnabled:true,sizeField:'old',chartStyle:true});
    useBuilder.getState().loadData([{x:1,y:2,size:3}],'data.csv');
    expect(useBuilder.getState().config).toMatchObject({scatterSizeEnabled:true,sizeField:'x',chartStyle:true});
  });
});
