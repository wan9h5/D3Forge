import { t, useLocale } from './i18n';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export function ColorPicker({ value, onChange, label }: { value: string; onChange: (color: string) => void; label?: string }) {
  useLocale();
  const input = useRef<HTMLInputElement>(null);
  const opened = useRef(false);
  const restoreFocus = useRef(false);
  const [instance, setInstance] = useState(0);
  const dismiss = useCallback((focus = false) => {
    if (!opened.current) return;
    opened.current = false;
    restoreFocus.current = focus;
    // Native color inputs have no closePicker API. Detaching the owning input
    // dismisses its browser picker while retaining the controlled color value.
    setInstance(current => current + 1);
  }, []);
  useLayoutEffect(() => {
    if (restoreFocus.current) {
      restoreFocus.current = false;
      input.current?.focus({ preventScroll: true });
    }
  }, [instance]);
  useEffect(() => {
    function outside(event: Event) {
      if (event.target !== input.current) dismiss();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && opened.current) dismiss(true);
    }
    function iframeFocus() {
      queueMicrotask(() => {
        if (document.activeElement instanceof HTMLIFrameElement) dismiss();
      });
    }
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside, true);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('blur', iframeFocus);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', outside, true);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('blur', iframeFocus);
    };
  }, [dismiss]);
  return <div className="color-row">
    <input key={instance} ref={input} type="color" aria-label={label ?? t("主色")} value={value}
      onClick={() => { opened.current = true; }}
      onBlur={() => dismiss()}
      onChange={event => onChange(event.target.value)}/>
    <code>{value}</code>
  </div>;
}
