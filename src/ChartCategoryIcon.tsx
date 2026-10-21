import type { ReactNode } from 'react';

export type ChartCategory = 'pca' | 'research' | 'survival' | 'circos' | 'chromosome' | 'all' | 'scatter' | 'line' | 'bar' | 'box' | 'violin' | 'pie' | 'waffle' | 'histogram' | 'heatmap' | 'volcano' | 'manhattan';

const icons: Record<ChartCategory, ReactNode> = {
  pca: <><path d="M3 3v18h18M5 16l4-5 5 3 6-9"/><circle cx="9" cy="11" r="2"/><circle cx="14" cy="14" r="2"/></>,
  research: <><path d="M3 3v18h18M5 7h10M8 13h12M4 18h10"/><circle cx="10" cy="7" r="2" fill="currentColor"/><circle cx="14" cy="13" r="2" fill="currentColor"/><circle cx="8" cy="18" r="2" fill="currentColor"/></>,
  survival: <><path d="M3 3v18h18M4 5h5v4h4v5h4v4h4"/></>,
  circos: <><circle cx="12" cy="12" r="9"/><path d="M5 7q15 1 9 13M6 18Q8 2 20 10"/></>,
  chromosome: <><path d="M6 3q-3 0-1 5l4 8q2 5 4 5M18 3q3 0 1 5l-4 8q-2 5-4 5M5 4l14 16M19 4L5 20"/></>,
  all: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  scatter: <><path d="M3 3v18h18"/>{[[7,15],[10,9],[14,13],[17,5],[20,10]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="1.6" fill="currentColor" stroke="none"/>)}</>,
  line: <><path d="M3 3v18h18M6 16l5-7 5 3 5-8"/></>,
  bar: <><rect x="4" y="12" width="3" height="9" rx=".7" fill="currentColor" stroke="none"/><rect x="10.5" y="4" width="3" height="17" rx=".7" fill="currentColor" stroke="none"/><rect x="17" y="8" width="3" height="13" rx=".7" fill="currentColor" stroke="none"/></>,
  box: <><path d="M7 3v5m0 8v5M4 3h6M4 21h6M17 5v5m0 8v3M14 5h6M14 21h6"/><rect x="4" y="8" width="6" height="8" rx="1"/><rect x="14" y="10" width="6" height="8" rx="1"/><path d="M4 12h6m4 2h6"/></>,
  violin: <><path d="M7 3c0 4-4 5-4 10s4 5 4 8c0-3 4-3 4-8S7 7 7 3Zm10 0c0 4-4 7-4 12s4 3 4 6c0-3 4-1 4-6S17 7 17 3Z"/><path d="M7 9v8m10-6v7"/></>,
  pie: <><path d="M11 3a9 9 0 1 0 10 10H11Z"/><path d="M15 3v6h6a8 8 0 0 0-6-6Z" fill="currentColor" stroke="none"/></>,
  waffle: <>{[4,10,16].flatMap(x=>[4,10,16].map(y=><rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx=".6" fill={x===4||y===16?'currentColor':'none'}/>))}</>,
  histogram: <><path d="M3 21h18"/><path d="M4 21V14h4v7m0-1V7h4v14m0-1V4h4v17m0-1V11h4v10"/></>,
  heatmap: <>{[3,10,17].flatMap((x,i)=>[3,10,17].map((y,j)=><rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" rx=".8" fill="currentColor" stroke="none" opacity={[.3,.65,1][(i+j)%3]}/>))}</>,
  volcano: <><path d="M3 21h18M12 4v13" strokeDasharray="2 3"/>{[[4,5],[6,10],[8,15],[11,19],[14,18],[17,11],[20,4]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="1.5" fill="currentColor" stroke="none"/>)}</>,
  manhattan: <><path d="M3 21h18M3 9h18" strokeDasharray="2 3"/><path d="M5 18v-4m3 4V6m4 12v-7m4 7V3m4 15v-6" strokeWidth="2.5"/></>,
};

export function ChartCategoryIcon({category}:{category:ChartCategory}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[category]}</svg>;
}
