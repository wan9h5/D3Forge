import { t, useLocale } from './i18n';
import { useMemo, useState } from 'react';
import { charts, thumbnailConfig, thumbnailData, type ChartType } from './model';
import { generateCode } from './generate';
import { Preview } from './Preview';
import { SiteFooter } from './SiteFooter';

const categories = [
  { id: 'all', label: '全部图形', icon: '▦', description: '浏览所有可用图形，选择一个开始绘制。' },
  { id: 'basic', label: '基础绘图', icon: '⠿', description: '探索数值之间的关系与变化。' },
  { id: 'statistics', label: '统计分布', icon: '▥', description: '比较不同组别的数据分布。' },
  { id: 'biology', label: '生物信息', icon: '∴', description: '探索效应量与统计显著性。' },
] as const;
type Category = typeof categories[number]['id'];
const chartCategories: Record<ChartType, Exclude<Category, 'all'>> = {
  scatter: 'basic', bar: 'basic', line: 'basic', box: 'statistics', volcano: 'biology', violin: 'statistics', manhattan: 'biology', heatmap: 'statistics', histogram: 'statistics',
};

export function Gallery() {
  const locale = useLocale();
  const [category, setCategory] = useState<Category>('all');
  const current = categories.find(item => item.id === category)!;
  const visible = charts.filter(chart => category === 'all' || chartCategories[chart.id] === category);
  const thumbnails = useMemo(() => Object.fromEntries(charts.map(chart => {
    const config = thumbnailConfig(chart.id);
    return [chart.id, generateCode(chart.id, thumbnailData(chart.id), config, locale)];
  })), [locale]);

  return <div className="gallery-layout">
    <aside className="gallery-sidebar">
      <nav className="category-menu" aria-label={t("图形分类")}>
        {categories.map(item => <button key={item.id} aria-current={category === item.id ? 'page' : undefined} onClick={() => setCategory(item.id)}>
          <span className="category-icon" aria-hidden="true">{item.icon}</span><span>{t(item.label)}</span>
          <span className="category-count">{item.id === 'all' ? charts.length : charts.filter(chart => chartCategories[chart.id] === item.id).length}</span>
        </button>)}
      </nav>
      <p className="gallery-sidebar-note">{t("选择图形")}<br/>{t("调整配置")}<br/>{t("带走 D3.js 源码")}</p>
    </aside>
    <main className="gallery-main">
      <section aria-label={t(current.label)}>
        <div className="chart-grid">
          {visible.map(chart => <a className="chart-card" key={chart.id} href={`#/charts/${chart.id}`} aria-label={t('开始绘制{chart}', { chart: t(chart.zh) })}>
            <div className="chart-thumbnail" aria-hidden="true" inert><Preview source={thumbnails[chart.id]} width={800} height={440}/></div>
            <div className="chart-card-content"><span className="chart-category-label">{t(categories.find(item => item.id === chartCategories[chart.id])!.label)}</span><h3><span>{t(chart.zh)}<span className="chart-english-name">{chart.name}</span></span><span className="chart-card-arrow" aria-hidden="true">↗</span></h3><p>{t(chart.description)}</p></div>
          </a>)}
        </div>
      </section>
      <SiteFooter/>
    </main>
  </div>;
}
