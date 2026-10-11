import { chartEntries, entryData } from './chartEntries';
import { t, useLocale } from './i18n';
import { useMemo, useState } from 'react';
import { mockData, thumbnailConfig, thumbnailData, type ChartType } from './model';
import { generateCode } from './generate';
import { Preview } from './Preview';
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
] as const;
type Category = typeof categories[number]['id'];
const chartCategories: Record<ChartType, Exclude<Category,'all'>> = {
  scatter:'scatter',line:'line',bar:'bar',box:'box',violin:'violin',pie:'pie',
  'pie-matrix':'pie','nested-pie':'pie','pie-bar':'pie','bar-pie':'bar',
  waffle:'waffle',histogram:'histogram',heatmap:'heatmap',volcano:'volcano',manhattan:'manhattan',
};
const entryCategory = (chart:typeof chartEntries[number]) => chart.patch.scatterVariant==='gsea' ? 'bar' : chart.patch.violinGeometry==='box' ? 'box' : chartCategories[chart.type];

const normalizeSearch = (value:string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
function matchesSearch(chart:typeof chartEntries[number],query:string) {
  const family = categories.find(item=>item.id===entryCategory(chart))!.label;
  const names = [chart.id,chart.name,...(['zh','en','ja'] as const).flatMap(locale=>[t(chart.zh,{},locale),t(family,{},locale)])].map(normalizeSearch);
  return query.trim().split(/\s+/).filter(Boolean).every(token=>{
    const term = normalizeSearch(token);
    return names.some(name=>{
      if(name.includes(term))return true;
      // Ordered character matching also accepts abbreviations and incomplete names.
      let index=0;
      for(const character of name)if(character===term[index])index++;
      return index===term.length;
    });
  });
}

export function Gallery({query='',onClearSearch=()=>{}}:{query?:string;onClearSearch?:()=>void}) {
  const locale = useLocale();
  const [category, setCategory] = useState<Category>('all');
  const current = categories.find(item => item.id === category)!;
  const matches = (chart:typeof chartEntries[number], id:Category) => id==='all'||entryCategory(chart)===id;
  const searched = chartEntries.filter(chart => matchesSearch(chart,query));
  const visible = searched.filter(chart => matches(chart,category));
  const thumbnails = useMemo(() => Object.fromEntries(chartEntries.map(chart => {
    const config = {...thumbnailConfig(chart.type),...chart.patch,...(chart.type==='violin'&&chart.id!=='violin'?{radius:2,height:chart.patch.facetField?680:440}:{}),legend:false};
    return [chart.id, generateCode(chart.type, entryData(chart.type,chart.id) ?? ((chart.type==='violin'&&chart.id!=='violin'||chart.patch.annotationsEnabled)?mockData(chart.type):thumbnailData(chart.type)), {...config,...(chart.patch.barVariant?{radius:3}:{}),...(chart.patch.scatterVariant?{radius:chart.patch.radius??5}:{})}, locale)];
  })), [locale]);

  return <div className="gallery-layout">
    <aside className="gallery-sidebar">
      <nav className="category-menu" aria-label={t("图形分类")}>
        {categories.map(item => <button key={item.id} aria-current={category === item.id ? 'page' : undefined} onClick={() => setCategory(item.id)}>
          <span className="category-icon" aria-hidden="true"><ChartCategoryIcon category={item.id}/></span><span>{t(item.label)}</span>
          <span className="category-count">{searched.filter(chart => matches(chart,item.id)).length}</span>
        </button>)}
      </nav>
    </aside>
    <main className="gallery-main">
      <section aria-label={t(current.label)}>
        {query.trim()&&<div className="gallery-search-status" role="status">{t('找到 {count} 个图形',{count:visible.length})}<button className="text-button" onClick={onClearSearch}>{t('清空搜索')}</button></div>}
        {visible.length===0&&<div className="gallery-empty"><h2>{t('没有找到匹配的图形')}</h2><p>{t('试试其他名称，或切换图形分类。')}</p>{category!=='all'&&<button className="quiet" onClick={()=>setCategory('all')}>{t('查看全部分类')}</button>}</div>}
        <div className="chart-grid">
          {visible.map(chart => <a className="chart-card" key={chart.id} href={`#/charts/${chart.id}`} aria-label={t('开始绘制{chart}', { chart: t(chart.zh) })}>
            <div className="chart-thumbnail" aria-hidden="true" inert><Preview source={thumbnails[chart.id]} width={800} height={440} fit/></div>
            <div className="chart-card-content"><h3><span className="chart-name">{t(chart.zh)}<span className="chart-english-name">{chart.name}</span></span><span className="chart-card-arrow" aria-hidden="true">↗</span></h3></div>
          </a>)}
        </div>
      </section>
      <SiteFooter/>
    </main>
  </div>;
}
