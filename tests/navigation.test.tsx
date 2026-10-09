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
  window.history.replaceState(null, '', '/');
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
    expect(document.querySelectorAll('.chart-card')).toHaveLength(3);
    expect(document.querySelector('.builder')).toBeNull();
    const category = [...document.querySelectorAll<HTMLButtonElement>('.category-menu button')].find(button => button.textContent?.includes('统计分布'))!;
    act(() => category.click());
    expect(document.querySelectorAll('.chart-card')).toHaveLength(1);
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
    expect(document.querySelector('.breadcrumbs a')?.getAttribute('href')).toBe('#/');
    navigate('#/');
    expect(document.querySelectorAll('.chart-card')).toHaveLength(3);
    expect(document.querySelector('.builder')).toBeNull();
  });
  it('supports direct chart links and keeps configuration when reopening the same chart', () => {
    window.history.replaceState(null, '', '#/charts/box');
    render();
    expect(document.querySelector('.workspace-title h1')?.textContent).toContain('箱线图');
    act(() => useBuilder.getState().setConfig({ radius: 9 }));
    navigate('#/');
    navigate('#/charts/box');
    expect(useBuilder.getState().config.radius).toBe(9);
    navigate('#/charts/scatter');
    expect(useBuilder.getState().type).toBe('scatter');
    expect(useBuilder.getState().data[0]).toHaveProperty('expressionA');
  });
  it('falls back to the library for an unknown chart link', () => {
    window.history.replaceState(null, '', '#/charts/unknown');
    render();
    expect(document.querySelectorAll('.chart-card')).toHaveLength(3);
  });
});
