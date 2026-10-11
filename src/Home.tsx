import { t, useLocale } from './i18n';
import { HeroDemo } from './HeroDemo';
import { SiteFooter } from './SiteFooter';

export function Home() {
  useLocale();
  return <main className="home-main">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="hero-copy"><h1 id="home-title">{t("调好图表")}<br/><em>{t("带走 D3 源码")}</em></h1><p>{t("通过可视化配置生成图表背后的原生 D3.js 源码")}</p><p className="hero-principle">{t("常用配置已配好，更多选项由你发挥")}</p><div className="hero-actions"><a className="button-link primary" href="#/gallery">{t("开始绘图")}<svg className="hero-button-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></a><a className="button-link" href="#/guide">{t("快速入门")}</a></div></div>
      <HeroDemo/>
    </section>
    <SiteFooter/>
  </main>;
}
