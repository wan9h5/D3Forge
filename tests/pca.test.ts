// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import * as d3 from 'd3';
import Papa from 'papaparse';
import { readFileSync } from 'node:fs';
import { entryConfig, entryData } from '../src/chartEntries';
import { executableSource, generateCodeParts } from '../src/generate';
import { validateRows, type Config, type Row } from '../src/model';
import { useBuilder } from '../src/store';
import wine from '../src/data/winePca.json';

beforeEach(()=>{document.body.innerHTML='<div id="chart"></div>';});
function render(rows:Row[],patch:Partial<Config>={}){
 const c={...entryConfig('scatter','pca-biplot'),...patch};
 const parts=generateCodeParts('scatter',rows,c,'en');
 new Function('d3','document',executableSource(parts.source))(d3,document);
 const svg=document.querySelector('svg')!;
 for(const node of svg.querySelectorAll('*'))for(const key of ['cx','cy','x','y','x1','x2','y1','y2','d','transform'])if(node.hasAttribute(key))expect(node.getAttribute(key)).not.toMatch(/NaN|Infinity/);
 return {svg,parts,c};
}

describe('PCA results and native export',()=>{
 it('renders the complete real Wine dataset, groups, and loadings with matching source/data',()=>{
  const rows=entryData('scatter','pca-biplot')!;
  const {svg,parts}=render(rows);
  expect(svg.querySelectorAll('.pca-sample')).toHaveLength(178);
  expect(svg.querySelectorAll('.pca-loading')).toHaveLength(13);
  expect(svg.querySelectorAll('.pca-ellipse')).toHaveLength(3);
  expect(svg.textContent).toContain('36.2%');
  expect(parts.data).toContain('CC BY 4.0');
  expect(new Function(parts.data+'\nreturn data;')()).toEqual(rows);
  expect(parts.source).toBe(parts.logic.replace('import * as d3 from "d3";','import * as d3 from "d3";\n\n'+parts.data));
 });
 it('loads the shipped CSV and preserves settings while removing stale variance labels',()=>{
  const csv=readFileSync('public/examples/wine-pca.csv','utf8');
  const rows=Papa.parse<Row>(csv,{header:true,dynamicTyping:true,skipEmptyLines:true}).data;
  useBuilder.getState().selectChart('scatter','pca-biplot');
  useBuilder.getState().setConfig({radius:7,pcaLoadingScale:2});
  useBuilder.getState().loadData(rows,'wine-pca.csv');
  const state=useBuilder.getState();
  expect(state.config).toMatchObject({radius:7,pcaLoadingScale:2,pcaShowVariance:false,xField:'PC1',yField:'PC2',groupField:'group',pcaRowTypeField:'kind'});
  const {svg}=render(state.data,state.config);
  expect(svg.querySelectorAll('.pca-sample')).toHaveLength(178);
  expect(svg.querySelectorAll('.pca-loading')).toHaveLength(13);
 });
 it('has centered orthogonal scores with independently known Wine eigenvalues',()=>{
  const rows=wine.rows.filter(row=>row.kind==='sample');
  for(const [field,expected] of [['PC1',4.705850252],['PC2',2.496973733],['PC3',1.446071973]] as const){
   expect(d3.mean(rows,d=>d[field])).toBeCloseTo(0,9);
   expect(d3.variance(rows,d=>d[field])).toBeCloseTo(expected,7);
  }
  expect(d3.sum(rows,d=>d.PC1*d.PC2)/177).toBeCloseTo(0,9);
 });
 it('computes dispersion using n−1 covariance, without inventing confidence bounds',()=>{
  const rows=[[-1,0],[1,0],[0,-1],[0,1]].map(([PC1,PC2])=>({PC1,PC2,kind:'sample',group:'G'}));
  const {svg}=render(rows,{pcaEllipseScale:2,pcaShowLoadings:false});
  const ellipse=d3.select(svg.querySelector('.pca-ellipse')!).datum() as {points:{x:number;y:number}[]};
  expect(d3.max(ellipse.points,p=>p.x)).toBeCloseTo(2*Math.sqrt(2/3),12);
  expect(d3.max(ellipse.points,p=>p.y)).toBeCloseTo(2*Math.sqrt(2/3),12);
 });
 it('filters blank scores and unknown row kinds consistently, retaining valid negative scores',()=>{
  const rows:Row[]=[{PC1:-2,PC2:1,kind:'sample'},{PC1:'',PC2:1,kind:'sample'},{PC1:1,PC2:null,kind:'sample'},{PC1:1,PC2:1,kind:'other'},{PC1:0,PC2:.5,kind:'loading'}];
  const {svg,c}=render(rows);
  expect(validateRows('scatter',rows,c)).toHaveLength(2);
  expect(svg.querySelectorAll('.pca-sample')).toHaveLength(1);
  expect(svg.querySelectorAll('.pca-loading')).toHaveLength(1);
  expect(svg.querySelectorAll('.pca-ellipse')).toHaveLength(0);
 });
 it('does not fabricate hulls or ellipses for collinear and tiny groups',()=>{
  const rows=[0,1,2].map(PC1=>({PC1,PC2:PC1,kind:'sample',group:'G'}));
  expect(render(rows).svg.querySelectorAll('.pca-ellipse')).toHaveLength(0);
  document.body.innerHTML='<div id="chart"></div>';
  expect(render(rows,{pcaEnvelope:'hull'}).svg.querySelectorAll('.pca-hull')).toHaveLength(0);
 });
 it('uses equal pixel distances for the two components by default',()=>{
  const rows=[[0,0],[1,0],[0,1]].map(([PC1,PC2])=>({PC1,PC2,kind:'sample'}));
  const {svg}=render(rows);
  const [origin,a,b]=Array.from(svg.querySelectorAll('.pca-sample'));
  expect(+a.getAttribute('cx')!-+origin.getAttribute('cx')!).toBeCloseTo(+origin.getAttribute('cy')!-+b.getAttribute('cy')!,10);
 });
 it('renders 1500 samples and twenty variables based on imported records',()=>{
  const rows:Row[]=Array.from({length:1500},(_,i)=>({PC1:Math.sin(i)*3,PC2:Math.cos(i*1.7),kind:'sample',group:`G${i%5}`}));
  rows.push(...Array.from({length:20},(_,i)=>({PC1:Math.cos(i),PC2:Math.sin(i),kind:'loading',sample:`Feature ${i}`})));
  const {svg}=render(rows);
  expect(svg.querySelectorAll('.pca-sample')).toHaveLength(1500);
  expect(svg.querySelectorAll('.pca-loading')).toHaveLength(20);
  expect(svg.querySelectorAll('.pca-ellipse')).toHaveLength(5);
 });
 it('keeps imported variable labels as literal text',()=>{
  const {svg}=render([{PC1:1,PC2:1,kind:'sample'},{PC1:.5,PC2:.5,kind:'loading',sample:'</script><img src=x onerror=alert(1)>'}]);
  expect(svg.querySelector('.pca-loading-label')?.textContent).toContain('<img');
  expect(document.querySelector('img,script')).toBeNull();
 });
});
