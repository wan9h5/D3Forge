// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HolographicHero } from '../src/HolographicHero';

vi.mock('../src/Preview',()=>({Preview:({source}:{source:string})=><div data-testid="holo-preview" data-source={source}/>}));
let root:Root;
beforeEach(()=>{
  vi.useFakeTimers();
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>window.setTimeout(()=>callback(0),16));
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>window.clearTimeout(id));
  document.body.innerHTML='<div id="root"></div>';
  root=createRoot(document.getElementById('root')!);
  act(()=>root.render(<HolographicHero/>));
});
afterEach(()=>{act(()=>root.unmount());vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const card=()=>document.querySelector<HTMLElement>('.holo-card')!;
const key=(value:string)=>act(()=>card().dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true})));

describe('holographic homepage',()=>{
  it('rests on the logo until the visitor interacts',()=>{
    expect(card().dataset.view).toBe('logo');
    expect(document.getElementById('home-title')?.textContent).toBe('尝试着切换卡片');
    act(()=>vi.advanceTimersByTime(10000));
    expect(card().dataset.view).toBe('logo');
  });
  it('reveals chart and native code with arrow keys, then resets on Escape',()=>{
    key('ArrowLeft');
    expect(card().dataset.view).toBe('chart');
    expect(document.querySelector('.holo-chart-face')?.getAttribute('aria-hidden')).toBe('false');
    expect(document.getElementById('home-title')?.textContent).toBe('欢迎来到D3Forge');
    key('ArrowRight');
    expect(card().dataset.view).toBe('code');
    expect(document.querySelector('.holo-code-face')?.getAttribute('aria-hidden')).toBe('false');
    key('Escape');
    expect(card().dataset.view).toBe('logo');
  });
  it('reveals different faces at the left and right of the same card',()=>{
    vi.spyOn(card(),'getBoundingClientRect').mockReturnValue({left:100,top:100,width:400,height:500,right:500,bottom:600,x:100,y:100,toJSON:()=>({})});
    act(()=>{card().dispatchEvent(new MouseEvent('pointermove',{clientX:140,clientY:350,bubbles:true}));vi.advanceTimersByTime(16);});
    expect(card().dataset.view).toBe('chart');
    const preview=document.querySelector('[data-testid="holo-preview"]');
    act(()=>{card().dispatchEvent(new MouseEvent('pointermove',{clientX:460,clientY:350,bubbles:true}));vi.advanceTimersByTime(16);});
    expect(card().dataset.view).toBe('code');
    expect(document.querySelector('[data-testid="holo-preview"]')).toBe(preview);
    expect(document.querySelector<HTMLElement>('.holo-surface')?.style.getPropertyValue('--tilt-y')).not.toBe('0deg');
  });
  it('returns to the logo when movement stops',()=>{
    key('ArrowRight');
    act(()=>vi.advanceTimersByTime(1800));
    expect(card().dataset.view).toBe('logo');
    expect(document.getElementById('home-title')?.textContent).toBe('尝试着切换卡片');
    key('ArrowLeft');
    expect(card().dataset.view).toBe('chart');
    expect(document.getElementById('home-title')?.textContent).toBe('欢迎来到D3Forge');
    key('Escape');
    expect(document.querySelector<HTMLElement>('.holo-surface')?.style.getPropertyValue('--glare-opacity')).toBe('0');
  });
  it('shows a minimal blue curve and an artistic code phrase',()=>{
    const source=document.querySelector('[data-testid="holo-preview"]')!.getAttribute('data-source')!;
    expect(source).toContain('const line = d3.line()');
    expect(source).toContain('"background", "#070b1b"');
    expect(source).toContain('.curve(d3.curveMonotoneX)');
    expect(source).toContain('#60A5FA');
    expect(document.querySelector('.holo-code-face code')!.textContent).toBe('const line = from D3.js');
  });
});
