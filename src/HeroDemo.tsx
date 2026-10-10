import { t, useLocale } from './i18n';
import { useEffect, useMemo, useState } from 'react';
import { defaults } from './model';
import { generateCodeParts } from './generate';
import { Preview } from './Preview';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { highlightTree, tagHighlighter, tags } from '@lezer/highlight';

const demoSyntax = tagHighlighter([
  { tag: tags.keyword, class: 'demo-token-keyword' },
  { tag: tags.string, class: 'demo-token-string' },
  { tag: tags.number, class: 'demo-token-number' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], class: 'demo-token-function' },
  { tag: [tags.variableName, tags.propertyName], class: 'demo-token-name' },
  { tag: tags.operator, class: 'demo-token-operator' },
]);

function highlightedDemoLine(line: string) {
  const tokens: { text: string; className?: string }[] = [];
  let cursor = 0;
  highlightTree(javascriptLanguage.parser.parse(line), demoSyntax, (from, to, className) => {
    if (from > cursor) tokens.push({ text: line.slice(cursor, from) });
    tokens.push({ text: line.slice(from, to), className });
    cursor = to;
  });
  if (cursor < line.length) tokens.push({ text: line.slice(cursor) });
  return tokens.map((token, index) => <span key={index} className={token.className}>{token.text}</span>);
}

type DemoView = 'visual' | 'code';
const demoData = [
  { x: 3.45, y: 3.75, size: 2.8, color: '#43bf63' },
  { x: 4.8, y: 6.15, size: 1.45, color: '#ffbc35' },
  { x: 3, y: 7.1, size: 1.25, color: '#3780ff' },
  { x: 3.5, y: 5.9, size: 2.2, color: '#3780ff' },
  { x: 4.2, y: 4.8, size: 1.6, color: '#3780ff' },
  { x: 5.1, y: 3.7, size: 2.4, color: '#3780ff' },
  { x: 5.6, y: 5.3, size: 1.85, color: '#3780ff' },
];

export function HeroDemo() {
  const locale = useLocale();
  const [config, setConfig] = useState(() => ({ ...defaults('scatter'), xField: 'x', yField: 'y', groupField: '', radius: 12, color: '#356ae6', width: 480, height: 360, xAxis: false, yAxis: false, legend: false, tooltip: false }));
  const [active, setActive] = useState<DemoView>('visual');

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const code = useMemo(() => {
    const generated = generateCodeParts('scatter', demoData, config, locale);
    // Keep the illustration and its displayed native D3 snippet in sync.
    // Fix the original scale bounds so moving colored marks cannot shift blue marks.
    const logic = generated.logic
      .replace('.domain(safeDomain(processedData.map(d => d._x), false))', '.domain([2, 6.5])')
      .replace('.domain(safeDomain(processedData.map(d => d._y), false))', '.domain([2.5, 8])')
      .replace(`.attr("r", ${config.radius})`, `.attr("r", d => d.size * ${config.radius})`)
      .replace(`.attr("fill", "${config.color}")`, '.attr("fill", d => d.color)');
    return { ...generated, logic, source: generated.source.replace(generated.logic.slice(generated.logic.indexOf('\n')), logic.slice(logic.indexOf('\n'))) };
  }, [config, locale]);
  const excerpt = code.logic.slice(code.logic.indexOf('  const points =')).split('\n').slice(0, 8).filter(line => !line.includes('opacity')).map(line => line.replace(/^  /, '')).join('\n');
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const preference = () => setReducedMotion(media?.matches ?? false);
    document.addEventListener('visibilitychange', visibility);
    media?.addEventListener('change', preference);
    return () => { document.removeEventListener('visibilitychange', visibility); media?.removeEventListener('change', preference); };
  }, []);
  useEffect(() => {
    if (hovered || focused || hidden || reducedMotion) return;
    const timer = setInterval(() => setActive(current => current === 'visual' ? 'code' : 'visual'), 5000);
    return () => clearInterval(timer);
  }, [hovered, focused, hidden, reducedMotion]);

  return <div className="hero-demo" aria-label={t("配置与原生代码演示")} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="demo-stage">
      <div id="demo-visual" className={`demo-card ${active === 'visual' ? 'is-front' : 'is-back'}`} role="group" tabIndex={active === 'visual' ? 0 : -1} onClick={event => { if (!(event.target as Element).closest('input, label, button')) setActive('code'); }} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setActive('code'); } }} aria-label={t("配置与图形")} aria-hidden={active !== 'visual'} inert={active !== 'visual' ? true : undefined}>
        <div className="hero-workbench-heading"><span className="window-dots" aria-hidden="true"><i/><i/><i/></span><button className="demo-heading-switch" aria-label={t("查看 D3 源码")} onClick={()=>setActive('code')}>{t("图形")}</button><span className="hero-live">{t("配置 → 图形")}</span></div>
        <div className="demo-visual-content"><div className="demo-config"><span className="demo-section-label">{t("配置")}</span><label>{t("大小")}<output>{config.radius}</output><input aria-label={t("演示点半径")} type="range" min="8" max="20" value={config.radius} onChange={event => setConfig(current => ({ ...current, radius: +event.target.value }))}/></label><label>{t("透明度")}<output>{config.opacity}</output><input aria-label={t("演示透明度")} type="range" min="0.2" max="1" step="0.1" value={config.opacity} onChange={event => setConfig(current => ({ ...current, opacity: +event.target.value }))}/></label><label className="demo-grid-label">{t("网格")}<input aria-label={t("演示网格")} type="checkbox" checked={config.grid} onChange={event => setConfig(current => ({ ...current, grid: event.target.checked }))}/></label><div className="demo-color"><span style={{ background: config.color }}/><span>{t("颜色")}</span></div></div><div className="demo-chart"><Preview source={code.source} width={config.width} height={config.height}/></div></div>

      </div>
      <div id="demo-code" className={`demo-card ${active === 'code' ? 'is-front' : 'is-back'}`} role="group" tabIndex={active === 'code' ? 0 : -1} onClick={event => { if (!(event.target as Element).closest('button')) setActive('visual'); }} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setActive('visual'); } }} aria-label={t("D3 源码")} aria-hidden={active !== 'code'} inert={active !== 'code' ? true : undefined}>
        <div className="hero-workbench-heading"><span className="window-dots" aria-hidden="true"><i/><i/><i/></span><button className="demo-heading-switch" aria-label={t("查看配置与图形")} onClick={()=>setActive('visual')}>{t("源码")}</button><span className="hero-live">{t("图形 → 代码")}</span></div>
        <div className="demo-source"><pre><code>{excerpt.split('\n').map((line, index) => <span key={index} className={`demo-code-line${line.includes('.attr("r",') ? ' is-highlighted' : ''}`} title={line.includes('.attr("r",') ? t("点大小配置对应的源码") : undefined}>{highlightedDemoLine(line)}</span>)}</code></pre></div>

      </div>
    </div>

  </div>;
}
