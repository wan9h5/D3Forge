// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { useBuilder } from '../src/store';

vi.mock('../src/Preview', () => ({ Preview: () => <div data-testid="chart-preview"/> }));
vi.mock('../src/CodePanel', () => ({ CodePanel: () => <section aria-label="D3 源码">D3.js 源码</section> }));
let root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/#/gallery');
  useBuilder.getState().selectChart('scatter');
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root')!);
});
afterEach(() => { act(() => root.unmount()); vi.restoreAllMocks(); });
function render() { act(() => root.render(<App/>)); }
function navigate(hash: string) {
  act(() => {
    window.history.pushState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('chart library navigation', () => {
  it('opens the library with chart cards and filters by sidebar category', () => {
    render();
    expect(document.querySelectorAll('.chart-card')).toHaveLength(9);
    expect(document.querySelector('.builder')).toBeNull();
    const category = [...document.querySelectorAll<HTMLButtonElement>('.category-menu button')].find(button => button.textContent?.includes('统计分布'))!;
    act(() => category.click());
    expect(document.querySelectorAll('.chart-card')).toHaveLength(4);
    expect(document.querySelector('.chart-card')?.getAttribute('href')).toBe('#/charts/box');
    expect(category.getAttribute('aria-current')).toBe('page');
  });
  it('opens a chart detail with its own mock data and returns to the library', () => {
    render();
    expect(document.querySelector('.chart-card[href="#/charts/volcano"]')).not.toBeNull();
    navigate('#/charts/volcano');
    expect(document.querySelector('.workspace-title h1')?.textContent).toContain('火山图');
    expect(document.querySelector('.controls')).not.toBeNull();
    expect(document.querySelector('.preview-panel')).not.toBeNull();
    expect(document.querySelector('[aria-label="D3 源码"]')).not.toBeNull();
    expect(document.querySelector('.chart-picker')).toBeNull();
    expect(useBuilder.getState().data[0]).toHaveProperty('pvalue');
    expect(document.querySelector('.breadcrumbs a')?.getAttribute('href')).toBe('#/gallery');
    navigate('#/gallery');
    expect(document.querySelectorAll('.chart-card')).toHaveLength(9);
    expect(document.querySelector('.builder')).toBeNull();
  });
  it('supports direct chart links and keeps configuration when reopening the same chart', () => {
    window.history.replaceState(null, '', '#/charts/box');
    render();
    expect(document.querySelector('.workspace-title h1')?.textContent).toContain('箱线图');
    act(() => useBuilder.getState().setConfig({ radius: 9 }));
    navigate('#/gallery');
    navigate('#/charts/box');
    expect(useBuilder.getState().config.radius).toBe(9);
    navigate('#/charts/scatter');
    expect(useBuilder.getState().type).toBe('scatter');
    expect(useBuilder.getState().data[0]).toHaveProperty('expressionA');
  });
  it('falls back to the library for an unknown chart link', () => {
    window.history.replaceState(null, '', '#/charts/unknown');
    render();
    expect(document.querySelectorAll('.chart-card')).toHaveLength(9);
  });
});

describe('product home and guide', () => {
  it('opens a product home at the root with working entry points and repository links', () => {
    window.history.replaceState(null, '', '#/');
    render();
    expect(document.getElementById('home-title')?.textContent).toContain('带走 D3 源码');
    expect(document.querySelector('.hero-actions a')?.getAttribute('href')).toBe('#/gallery');
    expect(document.querySelector('.hero-actions a:nth-child(2)')?.getAttribute('href')).toBe('#/guide');
    expect(document.querySelector('.site-footer .github-link')?.getAttribute('href')).toBe('https://github.com/wan9h5/D3Forge');
    expect(document.querySelector('.site-footer svg')).not.toBeNull();
    expect(document.querySelector('.builder')).toBeNull();
    navigate('#/gallery');
    expect(document.querySelectorAll('.chart-card')).toHaveLength(9);
    expect(document.querySelector('.header-nav [aria-current="page"]')?.textContent).toBe('图形库');
  });
  it('opens the guide with privacy, data and export information', () => {
    window.history.replaceState(null, '', '#/guide');
    render();
    expect(document.querySelector('.guide-main')).not.toBeNull();
    expect(document.getElementById('usage-notes')?.textContent).toBe('数据与使用须知');
    expect(document.querySelector('.guide-notes')?.textContent).toContain('不上传文件');
    expect(document.querySelector('.guide-notes')?.textContent).toContain('不会跨刷新保存');
    expect(document.querySelector('.guide-steps')?.textContent).toContain('复制完整代码');
    navigate('#/charts/scatter');
    expect(document.querySelector('.builder')).not.toBeNull();
    expect(useBuilder.getState().config.color).toBe('#197f8a');
    navigate('#/');
    expect(document.getElementById('home-title')).not.toBeNull();
  });
});

describe('nine-chart route/state synchronization',()=>{
  for(const type of ['scatter','volcano','box','bar','line','violin','manhattan','heatmap','histogram'] as const) it(`${type}: direct URL, switching and reopening preserve correct state`,()=>{
    window.history.replaceState(null,'',`#/charts/${type}`);
    render();
    expect(useBuilder.getState().type).toBe(type);
    act(()=>useBuilder.getState().setConfig({opacity:.45}));
    navigate('#/gallery');
    navigate(`#/charts/${type}`);
    expect(useBuilder.getState().type).toBe(type);
    expect(useBuilder.getState().config.opacity).toBe(.45);
    navigate(`#/charts/${type==='scatter'?'box':'scatter'}`);
    expect(useBuilder.getState().type).toBe(type==='scatter'?'box':'scatter');
  });
  it('handles unreadable CSV without losing the existing data',async()=>{
    window.history.replaceState(null,'','#/charts/scatter');render();
    act(()=>[...document.querySelectorAll<HTMLButtonElement>('.controls .tabs button')].find(button=>button.textContent==='数据处理')!.click());
    const input=document.querySelector<HTMLInputElement>('input[type=file]')!;
    const file=new File(['a,b'],'unreadable.csv',{type:'text/csv'});
    Object.defineProperty(file,'text',{value:()=>Promise.reject(new Error('unreadable'))});
    Object.defineProperty(input,'files',{configurable:true,value:[file]});
    await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
    expect(document.querySelector('.controls [role=alert]')?.textContent).toContain('无法读取文件');
    expect(useBuilder.getState().dataName).toBe('Mock data');
  });
});
