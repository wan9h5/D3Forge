import { useMemo, useState } from 'react';
import { charts, defaults, mockData, type ChartType } from './model';
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
  scatter: 'basic', box: 'statistics', volcano: 'biology',
};

export function Gallery() {
  const [category, setCategory] = useState<Category>('all');
  const current = categories.find(item => item.id === category)!;
  const visible = charts.filter(chart => category === 'all' || chartCategories[chart.id] === category);
  const thumbnails = useMemo(() => Object.fromEntries(charts.map(chart => {
    const config = defaults(chart.id);
    return [chart.id, generateCode(chart.id, mockData(chart.id), config)];
  })), []);

  return <div className="gallery-layout">
    <aside className="gallery-sidebar">
      <div className="gallery-sidebar-title"><span className="eyebrow">CHART LIBRARY</span><h2>图形库</h2></div>
      <nav className="category-menu" aria-label="图形分类">
        {categories.map(item => <button key={item.id} aria-current={category === item.id ? 'page' : undefined} onClick={() => setCategory(item.id)}>
          <span className="category-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          <span className="category-count">{item.id === 'all' ? charts.length : charts.filter(chart => chartCategories[chart.id] === item.id).length}</span>
        </button>)}
      </nav>
      <p className="gallery-sidebar-note">选择图形<br/>调整配置<br/>带走 D3.js 源码</p>
    </aside>
    <main className="gallery-main">
      <div className="gallery-intro"><span className="eyebrow">EXPLORE & CREATE</span><h1>从一个图形开始。</h1><p>选择适合数据的图形，在可视化配置中完成绘制。</p></div>
      <section aria-labelledby="gallery-category-title">
        <div className="gallery-section-heading"><div><h2 id="gallery-category-title">{current.label}<span>{visible.length} 个图形</span></h2><p>{current.description}</p></div><span className="gallery-ready"><span aria-hidden="true"/>示例数据已就绪</span></div>
        <div className="chart-grid">
          {visible.map(chart => <a className="chart-card" key={chart.id} href={`#/charts/${chart.id}`} aria-label={`开始绘制${chart.zh}`}>
            <div className="chart-thumbnail" aria-hidden="true" inert><Preview source={thumbnails[chart.id]} width={800} height={440}/></div>
            <div className="chart-card-content"><span className="chart-category-label">{categories.find(item => item.id === chartCategories[chart.id])!.label}</span><h3>{chart.zh}<span aria-hidden="true">↗</span></h3><span className="chart-english-name">{chart.name}</span><p>{chart.description}</p><div className="chart-card-footer"><span>原生 D3 v7</span><span>开始绘制 <span aria-hidden="true">→</span></span></div></div>
          </a>)}
        </div>
      </section>
      <SiteFooter/>
    </main>
  </div>;
}
