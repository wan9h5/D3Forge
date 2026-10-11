import { useRef } from 'react';
import { t, useLocale } from './i18n';

export function ChartSearch({value,onChange,onSearch}:{value:string;onChange:(value:string)=>void;onSearch:()=>void}) {
  useLocale();
  const input = useRef<HTMLInputElement>(null);
  return <form className="chart-search" role="search" onSubmit={event=>{event.preventDefault();onSearch();}}>
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m12.5 12.5 4 4"/></svg>
    <input ref={input} type="search" aria-label={t('搜索图形')} placeholder={t('搜索图形，如散点图、violin…')} value={value} autoComplete="off" spellCheck={false} onChange={event=>onChange(event.target.value)} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();onChange('');}}}/>
    {value&&<button type="button" className="chart-search-clear" aria-label={t('清空搜索')} onClick={()=>{onChange('');input.current?.focus();}}><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>}
  </form>;
}
