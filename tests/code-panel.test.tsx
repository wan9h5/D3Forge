// @vitest-environment jsdom
// @vitest-environment-options {"pretendToBeVisual":true}
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changedCodeLines } from '../src/editorTools';
import { CodePanel } from '../src/CodePanel';
import { generateCodeParts } from '../src/generate';
import { defaults, mockData } from '../src/model';

let root: Root;
const code = (radius = 4) => generateCodeParts('scatter', mockData('scatter'), { ...defaults('scatter'), radius });
function render(radius = 4, dataName = 'Mock data') {
  act(() => root.render(<CodePanel code={code(radius)} dataName={dataName}/>));
}
function view(part: 'logic' | 'data') {
  return EditorView.findFromDOM(document.querySelector(`#source-panel-${part} .cm-editor`) as HTMLElement)!;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  // jsdom has no layout engine; provide the geometry API CodeMirror measures.
  Object.defineProperties(Range.prototype, {
    getClientRects: { configurable: true, value: () => [] },
    getBoundingClientRect: { configurable: true, value: () => new DOMRect() },
  });
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root')!);
});
afterEach(() => { act(() => root.unmount()); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('source and data tabs', () => {
  it('defaults to logic and switches data tabs with mouse and keyboard', () => {
    render();
    expect(document.getElementById('source-panel-logic')!.hidden).toBe(false);
    expect(view('logic').state.doc.toString()).toContain('function renderChart');
    expect(view('logic').state.doc.toString()).not.toContain('const data =');
    expect(view('data').state.doc.toString()).toContain('const data =');
    const dataTab = document.getElementById('source-tab-data')!;
    act(() => dataTab.click());
    expect(document.getElementById('source-panel-data')!.hidden).toBe(false);
    act(() => dataTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    expect(document.activeElement?.id).toBe('source-tab-logic');
    expect(document.getElementById('source-panel-logic')!.hidden).toBe(false);
  });
  it('keeps scroll positions, the active tab and focus after configuration changes', () => {
    render();
    const scrollIntoView = vi.spyOn(EditorView, 'scrollIntoView');
    const logic = view('logic');
    const data = view('data');
    logic.scrollDOM.scrollTop = 180;
    data.scrollDOM.scrollTop = 90;
    const dataTab = document.getElementById('source-tab-data')!;
    act(() => { dataTab.click(); dataTab.focus(); });
    render(9);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(logic.scrollDOM.scrollTop).toBe(180);
    expect(data.scrollDOM.scrollTop).toBe(90);
    expect(document.activeElement).toBe(dataTab);
    expect(document.getElementById('source-panel-data')!.hidden).toBe(false);
    expect(logic.state.doc.toString()).toContain('.attr("r", 9)');
    act(() => document.getElementById('source-tab-logic')!.click());
    const target = logic.state.doc.toString().indexOf('    .attr("r", 9)');
    expect(scrollIntoView).toHaveBeenCalledWith(target, { y: 'nearest' });
  });
  it('locates the changed radius instead of the top of the source', () => {
    render();
    const scrollIntoView = vi.spyOn(EditorView, 'scrollIntoView');
    render(9);
    const logic = view('logic');
    const target = logic.state.doc.toString().indexOf('    .attr("r", 9)');
    expect(target).toBeGreaterThan(0);
    expect(scrollIntoView).toHaveBeenCalledWith(target, { y: 'nearest' });
  });
  it('locates the remaining neighbouring code when a feature is removed', () => {
    render();
    const scrollIntoView = vi.spyOn(EditorView, 'scrollIntoView');
    const next = generateCodeParts('scatter', mockData('scatter'), { ...defaults('scatter'), tooltip: false });
    act(() => root.render(<CodePanel code={next} dataName="Mock data"/>));
    const before = code().logic.split('\n');
    const line = next.logic.split('\n').findIndex((text, index) => text !== before[index]) + 1;
    expect(scrollIntoView).toHaveBeenCalledWith(view('logic').state.doc.line(line).from, { y: 'nearest' });
  });
  it('scrolls only the editor and leaves an already visible line in place', () => {
    render();
    const logic = view('logic');
    const scroller = logic.scrollDOM;
    const pageScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const block = vi.spyOn(logic, 'lineBlockAt').mockReturnValue({ top: 900, bottom: 924 } as never);
    vi.spyOn(logic, 'documentTop', 'get').mockReturnValue(-180);
    vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue(new DOMRect());
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 300 });
    scroller.scrollTop = 180;
    const handle = logic.state.facet(EditorView.scrollHandler)[0];
    const options = { x: 'nearest', y: 'nearest', xMargin: 5, yMargin: 5 } as const;
    expect(handle(logic, EditorSelection.cursor(0), options)).toBe(true);
    expect(scroller.scrollTop).toBe(656);
    expect(pageScroll).not.toHaveBeenCalled();
    block.mockReturnValue({ top: 200, bottom: 224 } as never);
    scroller.scrollTop = 180;
    handle(logic, EditorSelection.cursor(0), options);
    expect(scroller.scrollTop).toBe(180);
  });
  it('copies complete source from the data tab and labels imported data correctly', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(4, 'samples.csv');
    expect(document.getElementById('source-tab-data')?.textContent).toBe('CSV 数据');
    act(() => document.getElementById('source-tab-data')!.click());
    const copy = [...document.querySelectorAll('button')].find(button => button.textContent === '复制完整代码')!;
    await act(async () => { copy.click(); });
    expect(writeText).toHaveBeenCalledWith(code().source);
    expect(writeText.mock.calls[0][0]).toContain('const data =');
    expect(writeText.mock.calls[0][0]).toContain('function renderChart');
  });
  it('downloads the complete source from either tab', async () => {
    let download: Blob | undefined;
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((blob: Blob) => { download = blob; return 'blob:test'; }) });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render();
    act(() => document.getElementById('source-tab-data')!.click());
    act(() => [...document.querySelectorAll('button')].find(button => button.textContent === '下载 .js')!.click());
    expect(click).toHaveBeenCalledOnce();
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(download!);
    });
    expect(text).toBe(code().source);
  });
});

describe('highlighting and code search', () => {
  it('marks changed lines even when their new text already exists elsewhere, and marks deletion context', () => {
    expect(changedCodeLines('x\n.attr("r", 4)\n.attr("r", 9)', 'x\n.attr("r", 9)\n.attr("r", 9)')).toEqual([2]);
    expect(changedCodeLines('start\nfeature\nend', 'start\nend')).toEqual([2]);
    expect(changedCodeLines('same', 'same')).toEqual([]);
  });
  it('shows syntax colors and keeps the latest change highlighted until the next change', () => {
    vi.useFakeTimers();
    const parts = (n: number) => ({ logic: `const radius = ${n};\nconst opacity = 1;`, data: 'const data = [];', source: '' });
    act(() => root.render(<CodePanel code={parts(4)} dataName="Mock data"/>));
    expect(document.querySelector('#source-panel-logic .code-keyword')?.textContent).toBe('const');
    expect(document.querySelector('#source-panel-logic .code-number')?.textContent).toBe('4');
    act(() => root.render(<CodePanel code={parts(9)} dataName="Mock data"/>));
    expect(document.querySelector('#source-panel-logic .code-changed')?.textContent).toContain('radius = 9');
    act(() => vi.advanceTimersByTime(3000));
    expect(document.querySelector('#source-panel-logic .code-changed')?.textContent).toContain('radius = 9');
  });
  it('opens Ctrl+F search inside the code tab, counts results and navigates without editing source', () => {
    render();
    const logic = view('logic');
    const original = logic.state.doc.toString();
    const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true });
    act(() => { logic.contentDOM.focus(); logic.contentDOM.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
    const input = document.querySelector<HTMLInputElement>('#source-panel-logic [aria-label="查找代码"]')!;
    expect(document.activeElement).toBe(input);
    act(() => { input.value = '.attr('; input.dispatchEvent(new Event('input', { bubbles: true })); });
    const first = logic.state.selection.main.from;
    expect(document.querySelector('#source-panel-logic .code-search-count')?.textContent).toMatch(/1 \/ \d+/);
    act(() => document.querySelector<HTMLButtonElement>('#source-panel-logic [aria-label="下一个匹配 (Enter)"]')!.click());
    expect(logic.state.selection.main.from).toBeGreaterThan(first);
    act(() => document.querySelector<HTMLButtonElement>('#source-panel-logic [aria-label="上一个匹配 (Shift+Enter)"]')!.click());
    expect(logic.state.selection.main.from).toBe(first);
    expect(logic.state.doc.toString()).toBe(original);
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(document.querySelector('#source-panel-logic .code-search')).toBeNull();
  });
  it('searches the active data tab and handles no matches and invalid regular expressions', () => {
    render();
    act(() => document.getElementById('source-tab-data')!.click());
    const data = view('data');
    act(() => data.contentDOM.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true })));
    expect(document.querySelector('#source-panel-logic .code-search')).toBeNull();
    const input = document.querySelector<HTMLInputElement>('#source-panel-data [aria-label="查找代码"]')!;
    act(() => { input.value = 'no-such-field'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(document.querySelector('#source-panel-data .code-search-count')?.textContent).toBe('无匹配');
    act(() => {
      input.value = '[';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector<HTMLButtonElement>('#source-panel-data [aria-label="正则表达式"]')!.click();
    });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('#source-panel-data .code-search-count')?.textContent).toBe('无效表达式');
  });
});
