// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ColorPicker } from '../src/ColorPicker';

let root: Root;
function Harness() {
  const [color, setColor] = useState('#197f8a');
  return <><ColorPicker value={color} onChange={setColor}/><button id="outside">其他配置</button></>;
}
function picker() { return document.querySelector<HTMLInputElement>('input[type="color"]')!; }
function open() { const input = picker(); act(() => input.click()); return input; }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root')!);
  act(() => root.render(<Harness/>));
});
afterEach(() => act(() => root.unmount()));

describe('native color picker dismissal', () => {
  it('keeps the original native color control and replaces its owner on an outside press', () => {
    const input = open();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => document.getElementById('outside')!.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(input.isConnected).toBe(false);
    expect(picker().value).toBe('#197f8a');
  });
  it('dismisses with Escape and restores focus to the new native control', () => {
    const input = open();
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(input.isConnected).toBe(false);
    expect(document.activeElement).toBe(picker());
  });
  it('dismisses when another control receives focus', () => {
    const input = open();
    act(() => document.getElementById('outside')!.focus());
    expect(input.isConnected).toBe(false);
    expect(document.activeElement?.id).toBe('outside');
  });
  it('preserves the selected color when the picker is dismissed', () => {
    const input = open();
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '#4ba1aa');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(picker()).toBe(input);
    expect(document.querySelector('.color-row code')?.textContent).toBe('#4ba1aa');
    act(() => document.getElementById('outside')!.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(picker().value).toBe('#4ba1aa');
  });
});
