import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { entryById } from './chartEntries';
import { useBuilder } from './store';
import { t, useLocale } from './i18n';
import { ChartSearch } from './ChartSearch';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GitHubIcon, repositoryUrl } from './SiteFooter';
const Builder=lazy(()=>import('./Builder'));
const Gallery=lazy(()=>import('./Gallery').then(module=>({default:module.Gallery})));
const Home=lazy(()=>import('./Home').then(module=>({default:module.Home})));
const Guide=lazy(()=>import('./Guide').then(module=>({default:module.Guide})));

type Route = string;
function routeFromHash(hash: string): Route {
  if (hash === '#/gallery') return 'gallery';
  if (hash === '#/guide') return 'guide';
  const match = hash.match(/^#\/charts\/([^/]+)\/?$/);
  const chart = entryById(match?.[1] || '');
  return chart ? chart.id : match ? 'gallery' : 'home';
}

function subscribeToHash(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}
const getHash = () => window.location.hash;

export default function App() {
  const locale=useLocale();
  // Read the URL in render, so event handlers cannot retain an old chart registry.
  const hash = useSyncExternalStore(subscribeToHash, getHash);
  const route = routeFromHash(hash);
  const entry = entryById(route);
  const isBuilder = !!entry;
  const headerRef=useRef<HTMLElement>(null);
  const menuTrigger=useRef<HTMLButtonElement>(null);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const closeMobileMenu=(restoreFocus=false)=>{
    setMobileMenuOpen(false);
    if(restoreFocus)menuTrigger.current?.focus({preventScroll:true});
  };
  useEffect(()=>{setMobileMenuOpen(false);},[hash]);
  useEffect(()=>{
    if(!mobileMenuOpen)return;
    const outside=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!headerRef.current?.contains(event.target))setMobileMenuOpen(false);
    };
    const resize=()=>{if(window.innerWidth>760)setMobileMenuOpen(false);};
    document.addEventListener('pointerdown',outside);
    window.addEventListener('resize',resize);
    return ()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',resize);};
  },[mobileMenuOpen]);
  const menuKeyDown=(event:KeyboardEvent<HTMLElement>)=>{
    if(!mobileMenuOpen||event.defaultPrevented)return;
    if(event.key==='Escape'){event.preventDefault();closeMobileMenu(true);return;}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    // The language dropdown handles its own arrow keys.
    if((event.target as Element).closest('.language-menu'))return;
    const items=Array.from(event.currentTarget.querySelectorAll<HTMLElement>(':scope > a, :scope > button, .language-trigger'));
    const index=items.indexOf(document.activeElement as HTMLElement);
    const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowUp'?-1:1)+items.length)%items.length;
    event.preventDefault();items[next]?.focus({preventScroll:true});
  };
  useLayoutEffect(()=>{
    const header=headerRef.current;
    if(!header)return;
    const measure=()=>header.parentElement?.style.setProperty('--header-height',`${header.getBoundingClientRect().height||72}px`);
    measure();
    if(typeof ResizeObserver!=='undefined'){
      const observer=new ResizeObserver(measure);
      observer.observe(header);
      return ()=>observer.disconnect();
    }
    window.addEventListener('resize',measure);
    return ()=>window.removeEventListener('resize',measure);
  },[route]);
  const selectedEntry = useBuilder(state => state.entryId);
  const selectChart = useBuilder(state => state.selectChart);
  // Synchronize the current store before painting a chart detail, including after HMR.
  useLayoutEffect(() => {
    if (entry && selectedEntry !== route) selectChart(entry.type, entry.id);
  }, [entry, route, selectedEntry, selectChart]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  return <div className={isBuilder ? 'app builder-app' : 'app'}><header ref={headerRef} className="header"><a className="brand" href="#/" aria-label={t("D3Forge 首页")}><span className="brand-icon" aria-hidden="true"><svg viewBox="0 0 44 44" fill="none"><path d="M10 10a12 12 0 0 1 0 24V10Z" fill="#356AE6"/><path d="m34 14-8 8 8 8" stroke="#17202D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>D3Forge</a><button ref={menuTrigger} type="button" className="mobile-menu-trigger" aria-label={mobileMenuOpen?({zh:'关闭菜单',en:'Close menu',ja:'メニューを閉じる'})[locale]:({zh:'打开菜单',en:'Open menu',ja:'メニューを開く'})[locale]} aria-expanded={mobileMenuOpen} aria-controls="header-navigation" onClick={()=>setMobileMenuOpen(value=>!value)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setMobileMenuOpen(true);window.requestAnimationFrame(()=>headerRef.current?.querySelector<HTMLElement>('.header-nav > a')?.focus({preventScroll:true}));}if(event.key==='Escape')closeMobileMenu(true);}}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{mobileMenuOpen?<path d="m6 6 12 12M6 18 18 6"/>:<path d="M4 6h16M4 12h16M4 18h16"/>}</svg></button><nav id="header-navigation" className={`header-nav${mobileMenuOpen?' mobile-open':''}`} aria-label={t("主导航")} onKeyDown={menuKeyDown} onClick={event=>{if((event.target as Element).closest('a'))closeMobileMenu();}}><a href="#/" aria-current={route === 'home' ? 'page' : undefined}>{t("首页")}</a><a href="#/gallery" aria-current={route === 'gallery' || isBuilder ? 'page' : undefined}>{t("图形库")}</a><a href="#/guide" aria-current={route === 'guide' ? 'page' : undefined}>{({zh:'使用说明',en:'Guide',ja:'使い方'})[locale]}</a><ChartSearch/><LanguageSwitcher/><a className="github-link" href={repositoryUrl} target="_blank" rel="noopener noreferrer" aria-label={t("D3Forge GitHub 仓库")}><GitHubIcon/><span className="mobile-action-label">GitHub</span></a></nav></header>
    <Suspense fallback={<main className="page-loading" aria-busy="true"><span className="loading-mark" aria-hidden="true"/>{t('加载中…')}</main>}>{isBuilder ? (selectedEntry === route ? <Builder key={route}/> : null) : route === 'gallery' ? <Gallery/> : route === 'guide' ? <Guide/> : <Home/>}</Suspense>
  </div>;
}
