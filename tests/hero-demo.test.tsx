// @vitest-environment jsdom
// @vitest-environment-options {"pretendToBeVisual":true}
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroDemo } from '../src/HeroDemo';
vi.mock('../src/Preview', () => ({ Preview: ({ source }: { source: string }) => <div data-testid="demo-preview" data-source={source}/> }));
let root: Root;
const active = () => document.querySelector('.demo-card.is-front')?.id;
beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root')!);
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); vi.unstubAllGlobals(); });
function render() { act(() => root.render(<HeroDemo/>)); }

describe('compact homepage demo', () => {
  it('alternates between configuration/chart and code while keeping the same preview mounted', () => {
    render();
    const preview = document.querySelector('[data-testid="demo-preview"]');
    expect(active()).toBe('demo-visual');
    act(() => vi.advanceTimersByTime(5000));
    expect(active()).toBe('demo-code');
    expect(document.getElementById('demo-visual')?.hasAttribute('inert')).toBe(true);
    expect(document.querySelector('[data-testid="demo-preview"]')).toBe(preview);
    act(() => vi.advanceTimersByTime(5000));
    expect(active()).toBe('demo-visual');
  });
  it('pauses on hover and resumes after leaving, without a bottom toolbar', () => {
    render();
    const demo = document.querySelector('.hero-demo')!;
    act(() => demo.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
    act(() => vi.advanceTimersByTime(10000));
    expect(active()).toBe('demo-visual');
    act(() => demo.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })));
    act(() => vi.advanceTimersByTime(5000));
    expect(active()).toBe('demo-code');
    act(() => demo.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
    act(() => vi.advanceTimersByTime(10000));
    expect(active()).toBe('demo-code');
    expect(document.querySelector('.demo-toolbar')).toBeNull();
  });
  it('synchronizes real configuration with the generated chart and code, and allows switching from the card heading', () => {
    render();
    const input = document.querySelector<HTMLInputElement>('[aria-label="演示点半径"]')!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '16');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(document.querySelector('[data-testid="demo-preview"]')?.getAttribute('data-source')).toContain('.attr("r", d => d.size * 16)');
    expect(document.querySelector('.demo-source code')?.textContent).toContain('.attr("r", d => d.size * 16)');
    act(() => document.querySelector<HTMLButtonElement>('[aria-label="查看 D3 源码"]')!.click());
    expect(active()).toBe('demo-code');
    expect(document.querySelector('.demo-toolbar')).toBeNull();
  });
  it('uses manual switching when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    render();
    act(() => vi.advanceTimersByTime(15000));
    expect(active()).toBe('demo-visual');
    expect(document.querySelector('.demo-toolbar')).toBeNull();
    act(() => document.querySelector<HTMLButtonElement>('[aria-label="查看 D3 源码"]')!.click());
    expect(active()).toBe('demo-code');
    expect(document.querySelector('.demo-toolbar')).toBeNull();
  });
});

it('uses a small abstract dataset with no axes, legend or dense labels', () => {
  render();
  const source = document.querySelector('[data-testid="demo-preview"]')!.getAttribute('data-source')!;
  const data = JSON.parse(source.match(/const data = ([\s\S]*?);/)![1]);
  expect(data).toHaveLength(7);
  expect(source).not.toContain('const xAxis');
  expect(source).not.toContain('const yAxis');
  expect(source).not.toContain('const legend');
  expect(source).toContain('.attr("r", d => d.size * 12)');
});
