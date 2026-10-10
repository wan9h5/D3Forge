import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { localeOptions, setLocale, t, useLocale } from './i18n';

export function LanguageSwitcher() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = localeOptions.find(option => option.value === locale)!;

  function focusOption(index: number) {
    root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')[index]?.focus({ preventScroll: true });
  }
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!open) return;
    focusOption(localeOptions.findIndex(option => option.value === locale));
    function outside(event: Event) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function navigate() { setOpen(false); }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    window.addEventListener('hashchange', navigate);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      window.removeEventListener('hashchange', navigate);
    };
  }, [open, locale]);

  function menuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = [...(root.current?.querySelectorAll('[role="menuitemradio"]') ?? [])].indexOf(document.activeElement!);
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? localeOptions.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + localeOptions.length) % localeOptions.length;
      focusOption(next);
    }
    if (event.key === 'Tab') close(true);
  }

  return <div className="language-switch" ref={root}>
    <button ref={trigger} className="language-trigger" type="button" aria-label={`${t('语言')}: ${current.label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => setOpen(value => !value)} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); }
        if (event.key === 'Escape') close();
      }}>
      <svg className="language-globe" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg>
      <span lang={current.lang}>{current.label}</span>
      <svg className="language-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
    </button>
    {open && <div id={menuId} className="language-menu" role="menu" aria-label={t('语言')} onKeyDown={menuKeyDown}>
      {localeOptions.map(option => <button key={option.value} type="button" role="menuitemradio" aria-checked={locale === option.value} tabIndex={-1} lang={option.lang}
        onClick={() => { setLocale(option.value); close(true); }}>
        <span>{option.label}</span>
        {locale === option.value && <svg className="language-check" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>}
      </button>)}
    </div>}
  </div>;
}
