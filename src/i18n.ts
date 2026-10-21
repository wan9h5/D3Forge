import { bioText } from './bioEntries';
import { heatmapText } from './heatmapEntries';
import { heatmapControlText } from './heatmapText';
import { volcanoText } from './volcanoEntries';
import { volcanoControlText } from './volcanoText';
import { barExtensionText } from './barExtensionEntries';
import { barText } from './barText';
import { scatterText } from './scatterText';
import { pcaText } from './pcaEntries';
import { chartDescriptionTranslations } from './chartDescriptions';
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
  const entry = ({'加载中…':['Loading…','読み込み中…'],'请导入 2 MB 以内的 CSV。':['Import a CSV no larger than 2 MB.','2 MB以内のCSVを入力してください。'],'可编辑':['Editable','編集可能'],'编辑 JSON 数组 · 无需 const data =':['Edit a JSON array · no const data = needed','JSON配列を編集 · const data = は不要'],'有效数据自动更新图形':['Valid data updates the chart automatically','有効なデータで図を自動更新']} as Record<string,[string,string]>)[key] ?? translations[key] ?? bioText[key] ?? chartDescriptionTranslations[key] ?? pcaText[key] ?? scatterText[key] ?? barText[key] ?? barExtensionText[key] ?? volcanoText[key] ?? volcanoControlText[key] ?? heatmapText[key] ?? heatmapControlText[key];
  const text = language === 'zh' ? key : entry?.[language === 'en' ? 0 : 1] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}
if (typeof document !== 'undefined') document.documentElement.lang = localeOptions.find(option => option.value === locale)!.lang;
