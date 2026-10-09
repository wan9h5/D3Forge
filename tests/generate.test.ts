// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import * as d3 from 'd3';
import { generateCode, executableSource } from '../src/generate';
import { defaults, mockData, validateRows, type ChartType, type Config, type Row } from '../src/model';
import { useBuilder } from '../src/store';
beforeEach(()=>{
  document.body.innerHTML='<div id="chart"></div>';
  Object.defineProperty(SVGElement.prototype,'getComputedTextLength',{configurable:true,value:function(){return (this.textContent?.length||0)*7;}});
});
function run(type:ChartType,rows=mockData(type),patch:Partial<Config>={}) {
  const c={...defaults(type),...patch};const source=generateCode(type,rows,c);
  new Function('d3','document',executableSource(source))(d3,document);
  return {source,svg:document.querySelector('svg')!};
}
describe('exported native D3 code',()=>{
  for(const type of ['scatter','volcano','box'] as const) {
    it(`${type}: exported code executes independently with its mock data`,()=>{
      const {source,svg}=run(type);
      expect(source).toContain('import * as d3 from "d3"');
      expect(source).toContain('const data = [');expect(svg).not.toBeNull();
      expect(source).not.toMatch(/ourPlatform|ChartOption|D3Builder/);
      for(const el of svg.querySelectorAll('[cx],[cy],rect'))for(const key of ['cx','cy','x','y','width','height'])if(el.hasAttribute(key))expect(el.getAttribute(key)).not.toMatch(/NaN|Infinity/);
    });
    it(`${type}: optional features can be disabled`,()=>{
      const {source}=run(type,undefined,{tooltip:false,legend:false,xAxis:false,yAxis:false,grid:false});
      expect(source).not.toContain('const tooltip');expect(source).not.toContain('const legend');expect(source).not.toContain('const xAxis');
    });
  }
  it('point controls change the actual SVG',()=>{
    const {svg,source}=run('scatter',undefined,{radius:9,opacity:.35,groupField:'',color:'#123456'});
    const point=svg.querySelector('circle')!;
    expect(point.getAttribute('r')).toBe('9');expect(point.getAttribute('opacity')).toBe('0.35');expect(point.getAttribute('fill')).toBe('#123456');
    expect(source).toContain('.attr("r", 9)');
  });
  it('volcano classifies up/down/ns and drops invalid p-values',()=>{
    const rows:Row[]=[{gene:'up',log2FC:2,pvalue:.001},{gene:'down',log2FC:-2,pvalue:.001},{gene:'ns',log2FC:0,pvalue:.8},{gene:'zero',log2FC:1,pvalue:0},{gene:'blank',log2FC:1,pvalue:null},{gene:'tooBig',log2FC:1,pvalue:2}];
    const {svg}=run('volcano',rows);const points=[...svg.querySelectorAll('g[clip-path] > circle')];
    expect(points).toHaveLength(3);expect(points.map(p=>p.getAttribute('fill'))).toEqual(['#c45542','#3875b5','#a6b0bd']);
    expect(validateRows('volcano',rows,defaults('volcano'))).toHaveLength(3);
  });
  it('box plot uses observed whiskers and identifies known outlier',()=>{
    const {svg}=run('box',[1,2,3,4,5,100].map(expression=>({group:'A',expression})),{legend:false});
    const box=svg.querySelector('g.box')!;const summary=d3.select(box).datum() as {q1:number;median:number;q3:number;low:number;high:number};
    expect(summary).toMatchObject({q1:2.25,median:3.5,q3:4.75,low:1,high:5});
    expect(box.querySelectorAll('circle')).toHaveLength(1);
  });
  it('log scales filter nonpositive and blank values',()=>{
    const rows:Row[]=[{expressionA:1,expressionB:2},{expressionA:0,expressionB:2},{expressionA:-1,expressionB:2},{expressionA:'',expressionB:2}];
    const {svg}=run('scatter',rows,{xScale:'log',yScale:'log',groupField:'',legend:false});
    expect(svg.querySelectorAll('g[clip-path] > circle')).toHaveLength(1);
  });
  it('empty datasets show a useful empty state',()=>{const {svg}=run('scatter',[]);expect(svg.textContent).toContain('No valid rows');});
  it('field names and hostile cell strings remain data',()=>{
    const key='x"]); throw new Error("injected"); //';
    const rows:Row[]=[{[key]:3,y:4,name:'<img src=x onerror=alert(1)>'}];
    const {svg}=run('scatter',rows,{xField:key,yField:'y',groupField:'',legend:false,labels:true,labelField:'name'});
    expect(svg.querySelector('text.label')?.textContent).toContain('<img');expect(document.querySelector('img')).toBeNull();
  });
  it('zoom and labels compile and initialize together',()=>{
    const {source,svg}=run('volcano',undefined,{zoom:true,labels:true});expect(source).toContain('rescaleX');expect(svg.querySelectorAll('text.label').length).toBeGreaterThan(0);
  });
  it('CSV replacement preserves visual controls and remaps fields',()=>{
    useBuilder.getState().selectChart('scatter');useBuilder.getState().setConfig({radius:8});
    useBuilder.getState().loadData([{id:'S1',foo:1,bar:2}],'custom.csv');
    const state=useBuilder.getState();expect(state.config).toMatchObject({radius:8,xField:'foo',yField:'bar'});expect(state.dataName).toBe('custom.csv');
  });
});
