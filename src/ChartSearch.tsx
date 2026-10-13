import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t, useLocale } from './i18n';
import { categories, entryCategory, searchCharts } from './chartLibrary';
import { ChartCategoryIcon } from './ChartCategoryIcon';

function SearchIcon(){return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m12.5 12.5 4 4"/></svg>;}

export function ChartSearch() {
  const locale=useLocale();
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0);
  const trigger=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null);
  const resultRefs=useRef<(HTMLButtonElement|null)[]>([]);
  const id=useId(),listId=`${id}-results`,headingId=`${id}-heading`;
  const matches=useMemo(()=>query.trim()?searchCharts(query):[],[query]);
  const results=matches;
  const selected=Math.min(active,Math.max(0,results.length-1));
  const text=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
  const close=()=>setOpen(false);
  const launch=()=>{setQuery('');setActive(0);setOpen(true);};
  useEffect(()=>{
    const shortcut=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
        event.preventDefault();
        setQuery('');
        setActive(0);
        setOpen(value=>!value);
      }
    };
    const navigate=()=>setOpen(false);
    document.addEventListener('keydown',shortcut);
    window.addEventListener('hashchange',navigate);
    return ()=>{document.removeEventListener('keydown',shortcut);window.removeEventListener('hashchange',navigate);};
  },[]);
  useEffect(()=>{
    const element=dialog.current;
    if(!element)return;
    if(open){
      if(!element.open){
        if(typeof element.showModal==='function')element.showModal();
        else element.setAttribute('open','');
      }
      input.current?.focus({preventScroll:true});
    }else if(element.open){
      if(typeof element.close==='function')element.close();
      else element.removeAttribute('open');
      trigger.current?.focus({preventScroll:true});
    }
    return ()=>{if(element.open&&typeof element.close==='function')element.close();};
  },[open]);
  useEffect(()=>{if(open)resultRefs.current[selected]?.scrollIntoView?.({block:'nearest'});},[selected,open]);
  const choose=(index:number)=>{
    const chart=results[index];
    if(!chart)return;
    close();
    window.location.hash=`#/charts/${chart.id}`;
  };
  return <>
    <button ref={trigger} className="chart-search" type="button" aria-label={t('搜索图形')} aria-haspopup="dialog" onClick={launch}>
      <SearchIcon/><span className="mobile-action-label">{t('搜索图形')}</span><kbd>Ctrl K</kbd>
    </button>
    {createPortal(<dialog ref={dialog} className="chart-search-dialog" aria-labelledby={headingId}
      onCancel={event=>{event.preventDefault();close();}}
      onClose={close}
      onClick={event=>{if(event.target===event.currentTarget)close();}}>
      <div className="chart-search-modal">
        <h2 id={headingId} className="search-visually-hidden">{t('搜索图形')}</h2>
        <div className="chart-search-input-row"><SearchIcon/>
          <input ref={input} role="combobox" aria-label={t('搜索图形')} aria-autocomplete="list" aria-expanded={open} aria-controls={listId}
            aria-activedescendant={results.length?`${id}-result-${selected}`:undefined}
            placeholder={t('搜索图形，如散点图、violin…')} value={query} autoComplete="off" spellCheck={false}
            onChange={event=>{setQuery(event.target.value);setActive(0);}}
            onKeyDown={event=>{
              if(event.key==='Escape'){event.preventDefault();close();}
              if(event.key==='Enter'){event.preventDefault();choose(selected);}
              if(event.key==='ArrowDown'||event.key==='ArrowUp'){
                event.preventDefault();
                if(results.length)setActive((selected+(event.key==='ArrowDown'?1:-1)+results.length)%results.length);
              }
            }}/>
          <button type="button" className="chart-search-dismiss" aria-label={text('关闭搜索','Close search','検索を閉じる')} onClick={close}><kbd>Esc</kbd></button>
        </div>
        <div className="chart-search-results" hidden={!query.trim()}>
          <p className="chart-search-results-heading" role="status">{text(`找到 ${matches.length} 个图形`,`${matches.length} charts found`,`${matches.length} 件のグラフ`)}</p>
          <div id={listId} role="listbox" aria-label={text('搜索结果','Search results','検索結果')}>
            {results.map((chart,index)=>{
              const family=entryCategory(chart),label=categories.find(category=>category.id===family)!.label;
              return <button ref={element=>{resultRefs.current[index]=element;}} key={chart.id} type="button" role="option" id={`${id}-result-${index}`}
                aria-selected={selected===index} tabIndex={-1} className="chart-search-result"
                onPointerMove={()=>setActive(index)} onClick={()=>choose(index)}>
                <span className="chart-search-result-icon"><ChartCategoryIcon category={family}/></span>
                <span className="chart-search-result-name"><strong>{t(chart.zh)}</strong>{t(chart.zh)!==chart.name&&<span>{chart.name}</span>}</span>
                <span className="chart-search-result-family">{t(label)}</span><span className="chart-search-result-enter" aria-hidden="true">↵</span>
              </button>;
            })}
          </div>
          {query.trim()&&!results.length&&<div className="chart-search-no-results"><SearchIcon/><strong>{text('没有找到匹配的图形','No matching charts','一致するグラフがありません')}</strong><p>{text('试试其他关键词，也可以搜索英文或日文名称。','Try another keyword, or search Chinese or Japanese names.','別のキーワードや、中国語・英語の名前で検索してください。')}</p></div>}
        </div>
        <div className="chart-search-hints"><span><kbd>↑</kbd><kbd>↓</kbd> {text('选择','Navigate','選択')}</span><span><kbd>↵</kbd> {text('打开图形','Open chart','グラフを開く')}</span><span><kbd>Esc</kbd> {text('关闭','Close','閉じる')}</span></div>
      </div>
    </dialog>,document.body)}
  </>;
}
