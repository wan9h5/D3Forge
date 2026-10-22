// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { useBuilder } from '../src/store';
import { ScatterControls, ScatterFields } from '../src/ScatterControls';
import { HeatmapControls } from '../src/HeatmapControls';
import { PcaFields } from '../src/PcaControls';
import { generateCodeParts, executableSource } from '../src/generate';
import * as d3 from 'd3';

let root:Root;
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 document.body.innerHTML='<div id="root"></div><div id="chart"></div>';
 root=createRoot(document.getElementById('root')!);
 Object.defineProperty(SVGElement.prototype,'getComputedTextLength',{configurable:true,value(){return 30;}});
 useBuilder.getState().selectChart('scatter');
});
afterEach(()=>act(()=>root.unmount()));
function plot(){
 const s=useBuilder.getState(),parts=generateCodeParts(s.type,s.data,s.config);
 new Function('d3','document',executableSource(parts.source))(d3,document);
 return document.querySelector('#chart svg')!;
}
describe('configuration feedback and dependencies',()=>{
 it('enabling or editing a style makes its otherwise-hidden target visible',()=>{
  useBuilder.getState().setConfig({labels:false,grid:false,legend:false});
  useBuilder.getState().setConfig({labelStyle:true,gridStyle:true,legendStyle:true,labelColor:'#123456',gridColor:'#987654'});
  expect(useBuilder.getState().config).toMatchObject({labels:true,grid:true,legend:true});
  expect(plot().querySelectorAll('text.label').length).toBeGreaterThan(0);
  expect(document.querySelector('text.label')?.getAttribute('fill')).toBe('#123456');
  useBuilder.getState().setConfig({grid:false});
  useBuilder.getState().setConfig({gridWidth:2});
  expect(useBuilder.getState().config.grid).toBe(true);
 });
 it('respects explicit visibility overrides and reveals edited axes',()=>{
  useBuilder.getState().setConfig({labelStyle:true,labels:false,gridStyle:true,grid:false});
  expect(useBuilder.getState().config).toMatchObject({labels:false,grid:false});
  useBuilder.getState().setConfig({axisStyle:true,xAxis:false});
  useBuilder.getState().setConfig({xTitle:'Edited X'});
  expect(useBuilder.getState().config.xAxis).toBe(true);
  expect(plot().textContent).toContain('Edited X');
 });
 it('exposes the label visibility switch next to scatter and PCA label mappings',()=>{
  useBuilder.getState().selectChart('scatter','scatter-regression');
  act(()=>root.render(<ScatterFields/>));
  const toggle=[...document.querySelectorAll('label')].find(node=>node.textContent?.includes('显示数据标签'))!.querySelector('input')!;
  act(()=>toggle.click());expect(useBuilder.getState().config.labels).toBe(true);
  act(()=>{useBuilder.getState().selectChart('scatter','pca');root.render(<PcaFields/>);});
  expect(document.body.textContent).toContain('显示数据标签');
 });
 it('hides ineffective ordinary colors for bubble plots and redundant palette selectors',()=>{
  useBuilder.getState().selectChart('scatter','scatter-bubble');
  // Locate by variant so this check also covers future entry ID changes.
  useBuilder.getState().setConfig({scatterVariant:'bubble'});
  act(()=>root.render(<ScatterControls/>));
  expect(document.querySelectorAll('input[type=color]')).toHaveLength(1); // canvas background only
  expect(document.querySelectorAll('.chart-palette')).toHaveLength(1);
  expect(document.querySelector('.chart-palette')?.textContent).toContain('Viridis');
 });
 it('disables manual heatmap order while clustering determines that axis',()=>{
  useBuilder.getState().selectChart('heatmap','heatmap-cluster');
  useBuilder.getState().setConfig({heatmapVariant:'cluster',heatmapRowCluster:true,heatmapColumnCluster:false});
  act(()=>root.render(<HeatmapControls/>));
  const row=[...document.querySelectorAll('label')].find(node=>node.querySelector(':scope > span')?.textContent==='未聚类行顺序')!;
  const column=[...document.querySelectorAll('label')].find(node=>node.querySelector(':scope > span')?.textContent==='未聚类列顺序')!;
  expect(row.querySelector('button')?.disabled).toBe(true);
  expect(column.querySelector('button')?.disabled).toBe(false);
  expect(document.body.textContent).toContain('正在决定对应行列的顺序');
 });
 it('reveals the directly editable labels of extended bar charts',()=>{
  useBuilder.getState().selectChart('bar','bar-grouped');
  useBuilder.getState().setConfig({barVariant:'grouped',labels:false,labelStyle:false});
  useBuilder.getState().setConfig({labelColor:'#123456'});
  expect(useBuilder.getState().config.labels).toBe(true);
 });
});
