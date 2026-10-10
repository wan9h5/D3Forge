import { useSyncExternalStore } from 'react';
import { translations } from './translations';

export type Locale = 'zh' | 'en' | 'ja';
export const localeOptions = [
  { value: 'zh', label: '中文', lang: 'zh-CN' },
  { value: 'en', label: 'English', lang: 'en' },
  { value: 'ja', label: '日本語', lang: 'ja' },
] as const;
const storageKey = 'd3forge.locale';
const listeners = new Set<() => void>();
function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'zh' || saved === 'en' || saved === 'ja') return saved;
  } catch { /* Storage may be disabled; language still works for this session. */ }
  return 'zh';
}
let locale: Locale = readLocale();
export const getLocale = () => locale;
export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function setLocale(next: Locale) {
  if (!localeOptions.some(option => option.value === next)) return;
  locale = next;
  document.documentElement.lang = localeOptions.find(option => option.value === next)!.lang;
  try { localStorage.setItem(storageKey, next); } catch { /* Session-only fallback. */ }
  listeners.forEach(listener => listener());
}
export function useLocale() {
  return useSyncExternalStore(subscribeLocale, getLocale, () => 'zh' as const);
}
export function t(key: string, values: Record<string, string | number> = {}, language: Locale = locale): string {
  const entry = translations[key];
  const text = language === 'zh' ? key : entry?.[language === 'en' ? 0 : 1] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}
if (typeof document !== 'undefined') document.documentElement.lang = localeOptions.find(option => option.value === locale)!.lang;
