import { t, useLocale } from './i18n';
import { HeroDemo } from './HeroDemo';
import { SiteFooter, repositoryUrl } from './SiteFooter';

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

export function Guide() {
  useLocale();
  return <main className="guide-main"><a className="guide-back" href="#/">{t("← 首页")}</a><div className="guide-title"><span className="eyebrow">GET STARTED</span><h1>{t("几步，把图表带回你的项目。")}</h1><p>{t("先用示例数据调图，再按需要替换自己的数据。")}</p></div>
    <section className="guide-steps" aria-label={t("快速入门")}><article><span>01</span><div><h2>{t("选择图形")}</h2><p>{t("进入图形库，选择适合数据的图形。每种图形都自带确定性示例数据。")}</p><a href="#/gallery">{t("打开图形库 →")}</a></div></article><article><span>02</span><div><h2>{t("调整效果与数据")}</h2><p>{t("左侧调整配置，中间查看效果，右侧查看对应代码。需要自己的数据时，在“数据处理”中导入 CSV 并选择字段。")}</p><p>{t("代码区支持 Ctrl+F 搜索；绘图逻辑和数据位于不同 Tab。")}</p></div></article><article><span>03</span><div><h2>{t("复制完整代码")}</h2><p>{t("点击“复制完整代码”或下载 .js，结果包含 D3 导入、当前数据和完整绘图逻辑。")}</p><pre><code>npm install d3</code></pre><p>{t("将代码放入支持 JavaScript 模块的 Web 项目，在 DOM 就绪后执行。可提供 #chart 容器，未提供时会自动创建。")}</p></div></article></section>
    <section className="guide-notes" aria-labelledby="usage-notes"><h2 id="usage-notes">{t("数据与使用须知")}</h2><ul><li>{t("CSV 在浏览器本地解析，不上传文件；当前支持最多 10 MB、10,000 行。")}</li><li>{t("当前配置不会跨刷新保存。离开或刷新页面前，请复制或下载代码；导出的代码包含当前数据，分享前请检查其中的内容。")}</li><li>{t("无效数值会跳过；对数坐标只接受正值，火山图要求 0 &lt; p ≤ 1。")}</li><li>{t("切换到另一种图形会加载该图形的默认配置和示例数据。")}</li></ul></section>
    <p className="guide-project">{t("D3Forge 以 MIT 许可证开源。查看")}<a href={repositoryUrl} target="_blank" rel="noopener noreferrer">{t("GitHub 仓库")}</a>{t("，或通过")}<a href={`${repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">Issues</a> {t("反馈问题。")}</p><SiteFooter/>
  </main>;
}
