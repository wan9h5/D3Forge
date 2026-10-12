import { chartEntries } from './chartEntries';
import { t, useLocale } from './i18n';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ChartType } from './model';
import { ChartThumbnail } from './ChartThumbnail';
import { SiteFooter } from './SiteFooter';
import { ChartCategoryIcon } from './ChartCategoryIcon';

// Group by the visual chart family, independently of the generator an example reuses.
const categories = [
  { id:'all',label:'全部图形' },
  { id:'scatter',label:'散点图' },
  { id:'line',label:'折线图' },
  { id:'bar',label:'柱状图' },
  { id:'box',label:'箱线图' },
  { id:'violin',label:'小提琴图' },
  { id:'pie',label:'饼图' },
  { id:'waffle',label:'华夫饼图' },
  { id:'histogram',label:'直方图' },
  { id:'heatmap',label:'热力图' },
  { id:'volcano',label:'火山图' },
  { id:'manhattan',label:'曼哈顿图' },
  { id:'survival',label:'生存曲线' },
  { id:'circos',label:'Circos 图' },
  { id:'chromosome',label:'染色体图' },
] as const;
type Category = typeof categories[number]['id'];
const chartCategories: Record<ChartType, Exclude<Category,'all'>> = {
  scatter:'scatter',line:'line',bar:'bar',box:'box',violin:'violin',pie:'pie',
  'pie-matrix':'pie','nested-pie':'pie','pie-bar':'pie','bar-pie':'bar',
  waffle:'waffle',histogram:'histogram',heatmap:'heatmap',volcano:'volcano',manhattan:'manhattan',
};
const entryCategory = (chart:typeof chartEntries[number]) => chart.patch.bioVariant ? (['km','cutoff'].includes(chart.patch.bioVariant)?'survival':['circos-gene','fusion','ligand'].includes(chart.patch.bioVariant)?'circos':chart.patch.bioVariant==='ld'?'heatmap':'chromosome') : chart.patch.scatterVariant==='gsea' ? 'bar' : chart.patch.violinGeometry==='box' ? 'box' : chartCategories[chart.type];

const normalizeSearch = (value:string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const searchIndex=chartEntries.map(chart=>{
 const family=categories.find(item=>item.id===entryCategory(chart))!.label;
 return {chart,names:[chart.id,chart.name,...(['zh','en','ja'] as const).flatMap(locale=>[t(chart.zh,{},locale),t(family,{},locale)])].map(normalizeSearch)};
});
function searchCharts(query:string){
 const terms=query.trim().split(/\s+/).filter(Boolean).map(normalizeSearch);
 if(!terms.length)return chartEntries;
 return searchIndex.filter(({names})=>terms.every(term=>names.some(name=>{
  if(name.includes(term))return true;
  let index=0;for(const character of name)if(character===term[index])index++;
  return index===term.length;
 }))).map(item=>item.chart);
}

function CardHoverGrid({children}:{children:ReactNode}) {
  const gridRef=useRef<HTMLDivElement>(null);
  const highlightRef=useRef<HTMLSpanElement>(null);
  const activeRef=useRef<HTMLElement|null>(null);
  const hoveredRef=useRef<HTMLElement|null>(null);
  const focusedRef=useRef<HTMLElement|null>(null);
  const position=(card:HTMLElement|null)=>{
    const grid=gridRef.current,highlight=highlightRef.current;
    if(!grid||!highlight)return;
    activeRef.current=card;
    if(!card){highlight.dataset.visible='false';return;}
    const bounds=card.getBoundingClientRect(),container=grid.getBoundingClientRect();
    // Only the shared backdrop moves; thumbnails keep their existing render/cache lifecycle.
    if(highlight.dataset.visible!=='true')highlight.style.transition='none';
    highlight.style.transform=`translate(${bounds.left-container.left-8}px, ${bounds.top-container.top-8}px)`;
    highlight.style.width=`${bounds.width+16}px`;
    highlight.style.height=`${bounds.height+16}px`;
    void highlight.offsetWidth;
    highlight.style.transition='';
    highlight.dataset.visible='true';
  };
  useEffect(()=>{
    hoveredRef.current=null;
    focusedRef.current=null;
    position(null);
  },[children]);
  useEffect(()=>{
    const grid=gridRef.current;
    if(!grid)return;
    if(typeof ResizeObserver==='undefined'){
      const reposition=()=>position(activeRef.current);
      window.addEventListener('resize',reposition);
      return ()=>window.removeEventListener('resize',reposition);
    }
    const observer=new ResizeObserver(()=>position(activeRef.current));
    observer.observe(grid);
    return ()=>observer.disconnect();
  },[]);
  const cardFrom=(target:EventTarget|null)=>target instanceof Element?target.closest<HTMLElement>('.chart-card'):null;
  return <div ref={gridRef} className="chart-grid"
    onPointerOver={event=>{
      if(event.pointerType==='touch')return;
      const card=cardFrom(event.target);
      if(card&&card!==hoveredRef.current){hoveredRef.current=card;position(card);}
    }}
    onPointerLeave={()=>{hoveredRef.current=null;position(focusedRef.current);}}
    onFocusCapture={event=>{focusedRef.current=cardFrom(event.target);position(focusedRef.current);}}
    onBlurCapture={event=>{focusedRef.current=cardFrom(event.relatedTarget);position(hoveredRef.current??focusedRef.current);}}>
    <span ref={highlightRef} className="chart-card-hover-backdrop" aria-hidden="true"/>
    {children}
  </div>;
}

export function Gallery({query='',onClearSearch=()=>{}}:{query?:string;onClearSearch?:()=>void}) {
  const locale = useLocale();
  const [category, setCategory] = useState<Category>('all');
  const current = categories.find(item => item.id === category)!;
  const deferredQuery=useDeferredValue(query);
  const searched=useMemo(()=>searchCharts(deferredQuery),[deferredQuery]);
  const visible=useMemo(()=>searched.filter(chart=>category==='all'||entryCategory(chart)===category),[searched,category]);
  const counts=useMemo(()=>{
   const result:Partial<Record<Category,number>>={all:searched.length};
   for(const chart of searched){const family=entryCategory(chart);result[family]=(result[family]??0)+1;}
   return result;
  },[searched]);

  return <div className="gallery-layout">
    <aside className="gallery-sidebar">
      <nav className="category-menu" aria-label={t("图形分类")}>
        {categories.map(item => <button key={item.id} aria-current={category === item.id ? 'page' : undefined} onClick={() => setCategory(item.id)}>
          <span className="category-icon" aria-hidden="true"><ChartCategoryIcon category={item.id}/></span><span>{t(item.label)}</span>
          <span className="category-count">{counts[item.id]??0}</span>
        </button>)}
      </nav>
    </aside>
    <main className="gallery-main">
      <section aria-label={t(current.label)}>
        {query.trim()&&<div className="gallery-search-status" role="status">{t('找到 {count} 个图形',{count:visible.length})}<button className="text-button" onClick={onClearSearch}>{t('清空搜索')}</button></div>}
        {visible.length===0&&<div className="gallery-empty"><h2>{t('没有找到匹配的图形')}</h2><p>{t('试试其他名称，或切换图形分类。')}</p>{category!=='all'&&<button className="quiet" onClick={()=>setCategory('all')}>{t('查看全部分类')}</button>}</div>}
        <CardHoverGrid>
          {visible.map(chart => <a className="chart-card" key={chart.id} href={`#/charts/${chart.id}`} aria-label={t('开始绘制{chart}', { chart: t(chart.zh) })}>
            <ChartThumbnail key={locale+chart.id} chart={chart} locale={locale}/>
            <div className="chart-card-content"><h3><span className="chart-name">{t(chart.zh)}<span className="chart-english-name">{chart.name}</span></span><span className="chart-card-arrow" aria-hidden="true">↗</span></h3></div>
          </a>)}
        </CardHoverGrid>
      </section>
      <SiteFooter/>
    </main>
  </div>;
}
