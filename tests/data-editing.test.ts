import { describe, expect, it } from 'vitest';
import { chartEntries, entryConfig, entryData } from '../src/chartEntries';
import { defaults, mockData, type Row } from '../src/model';
import { dataBudget, parseEditableData } from '../src/dataEditing';
import { useBuilder } from '../src/store';

const parse=(rows:unknown,id='scatter')=>{
 const entry=chartEntries.find(e=>e.id===id)!;
 return parseEditableData(JSON.stringify(rows),entry.type,entryConfig(entry.type,id),'en');
};
describe('data editing requirements',()=>{
 for(const entry of chartEntries)it(`${entry.id}: accepts its shipped example`,()=>{
  const rows=entryData(entry.type,entry.id)??mockData(entry.type);
  expect(parse(rows,entry.id).error).toBeUndefined();
 });
 it('rejects executable text, objects, nested records, booleans and nonfinite values',()=>{
  for(const text of ['window.alert(1)','const data = [];','{}','[[]]','[null]','[{"x":true}]','[{"x":{}}]','[{"x":1e999}]','[{"__proto__":1}]'])expect(parseEditableData(text,'scatter',defaults('scatter'),'en').error).toBeTruthy();
 });
 it('reports JSON syntax position and accepts empty data intentionally',()=>{
  expect(parseEditableData('[\n {"x":1,}\n]','scatter',defaults('scatter'),'en').error).toMatch(/line 2, column/);
  expect(parse([]).rows).toEqual([]);
 });
 it('enforces text, row, column, cell and string limits before rendering',()=>{
  expect(parseEditableData(' '.repeat(2*1024*1024+1),'scatter',defaults('scatter'),'en').error).toContain('2 MB');
  expect(parse(Array(10001).fill({})).error).toContain('10000');
  expect(parse([{...mockData('scatter')[0],...Object.fromEntries(Array.from({length:101},(_,i)=>[`col${i}`,0]))}]).error).toContain('100 distinct fields');
  expect(parse([{...mockData('scatter')[0],sample:'a'.repeat(4001)}]).error).toContain('4,000');
  expect(parse(Array.from({length:1001},()=>Object.fromEntries(Array.from({length:100},(_,i)=>[`col${i}`,0])))).error).toContain('100,000');
  expect(parseEditableData(JSON.stringify([{x:'汉'.repeat(800000)}]),'scatter',defaults('scatter'),'en').error).toContain('2 MB');
 });
 it('rejects invalid P values, missing numeric fields and invalid survival records',()=>{
  expect(parse([{log2FC:1,pvalue:0}],'volcano').error).toContain('Record');
  expect(parse([{expressionA:1}]).error).toContain('Record');
  expect(parse([{subject:'P1',time:-1,event:2,group:'A'}],'bio-km').error).toBeTruthy();
  expect(parse([{subject:'P1',time:1,event:1,group:'A'},{subject:'P1',time:2,event:0,group:'A'}],'bio-km').error).toBeTruthy();
 });
 it('sets specialized computational budgets',()=>{
  const cutoff=entryConfig('line','bio-cutoff');
  expect(dataBudget(Array(501).fill({}),'scatter',cutoff,'en')).toContain('500');
  const heat=entryConfig('heatmap','heatmap-cluster');
  expect(dataBudget(Array.from({length:81},(_,i)=>({[heat.xField]:`S${i}`,[heat.yField]:'G'})),'heatmap',{...heat,heatmapVariant:'cluster'},'en')).toContain('80 rows');
  const ld=entryConfig('heatmap','bio-ld');
  expect(dataBudget(Array.from({length:151},(_,i)=>({[ld.bioSnpAField]:`rs${i}`,[ld.bioSnpBField]:'rs0'})),'scatter',ld,'en')).toContain('150');
 });
 it('preserves data outside display filters without rejecting valid records',()=>{
  const config=entryConfig('scatter','bio-regional');
  const rows:Row[]=[{chromosome:'1',position:100,pvalue:.5},{chromosome:'2',position:200,pvalue:.1}];
  const result=parseEditableData(JSON.stringify(rows),'scatter',config,'en');
  expect(result.error).toBeUndefined();expect(result.rows).toEqual(rows);expect(result.warning).toContain('display filters');
 });
 it('applies edits without remapping or changing visual controls, and restores a new data session',()=>{
  useBuilder.getState().selectChart('scatter');
  useBuilder.getState().setConfig({radius:9});
  const epoch=useBuilder.getState().dataEpoch;
  const rows=[{expressionA:0,expressionB:0,group:'A',sample:'S'}];
  useBuilder.getState().updateData(rows);
  expect(useBuilder.getState().data).toEqual(rows);
  expect(useBuilder.getState().config).toMatchObject({radius:9,xField:'expressionA',yField:'expressionB'});
  expect(useBuilder.getState().dataEpoch).toBe(epoch);
  useBuilder.getState().restoreData();
  expect(useBuilder.getState().data).toEqual(mockData('scatter'));
  expect(useBuilder.getState().config.radius).toBe(9);
  expect(useBuilder.getState().dataEpoch).toBeGreaterThan(epoch);
 });
});
