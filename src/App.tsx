import { lazy, Suspense, useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
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
  useLocale();
  const [searchQuery,setSearchQuery] = useState('');
  const openSearch = () => { if(window.location.hash!=='#/gallery')window.location.hash='#/gallery'; };
  const updateSearch = (value:string) => { setSearchQuery(value);if(value.trim())openSearch(); };
  // Read the URL in render, so event handlers cannot retain an old chart registry.
  const hash = useSyncExternalStore(subscribeToHash, getHash);
  const route = routeFromHash(hash);
  const entry = entryById(route);
  const isBuilder = !!entry;
  const selectedEntry = useBuilder(state => state.entryId);
  const selectChart = useBuilder(state => state.selectChart);
  // Synchronize the current store before painting a chart detail, including after HMR.
  useLayoutEffect(() => {
    if (entry && selectedEntry !== route) selectChart(entry.type, entry.id);
  }, [entry, route, selectedEntry, selectChart]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  return <div className={isBuilder ? 'app builder-app' : 'app'}><header className="header"><a className="brand" href="#/" aria-label={t("D3Forge 首页")}><span className="brand-icon" aria-hidden="true"><svg viewBox="0 0 44 44" fill="none"><path d="M10 10a12 12 0 0 1 0 24V10Z" fill="#356AE6"/><path d="m34 14-8 8 8 8" stroke="#17202D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>D3Forge</a>{route === 'gallery' && <ChartSearch value={searchQuery} onChange={updateSearch} onSearch={openSearch}/>}<nav className="header-nav" aria-label={t("主导航")}><a href="#/" aria-current={route === 'home' ? 'page' : undefined}>{t("首页")}</a><a href="#/gallery" aria-current={route === 'gallery' || isBuilder ? 'page' : undefined}>{t("图形库")}</a><LanguageSwitcher/><a className="github-link" href={repositoryUrl} target="_blank" rel="noopener noreferrer" aria-label={t("D3Forge GitHub 仓库")}><GitHubIcon/></a></nav></header>
    <Suspense fallback={<main className="page-loading" aria-busy="true"><span className="loading-mark" aria-hidden="true"/>{t('加载中…')}</main>}>{isBuilder ? (selectedEntry === route ? <Builder key={route}/> : null) : route === 'gallery' ? <Gallery query={searchQuery} onClearSearch={()=>setSearchQuery('')}/> : route === 'guide' ? <Guide/> : <Home/>}</Suspense>
  </div>;
}
