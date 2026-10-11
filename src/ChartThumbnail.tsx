import { memo, useEffect, useRef, useState } from 'react';
import { entryData, type ChartEntry } from './chartEntries';
import { mockData, thumbnailConfig, thumbnailData } from './model';
import { generateCode } from './generate';
import type { Locale } from './i18n';
import { Preview } from './Preview';
import { cacheThumbnail, getThumbnail, scheduleThumbnail } from './thumbnailScheduler';

function thumbnailSource(chart:ChartEntry,locale:Locale){
 const config={...thumbnailConfig(chart.type),...chart.patch,
  ...(chart.type==='violin'&&chart.id!=='violin'?{radius:2,height:chart.patch.facetField?680:440}:{}),
  ...(chart.patch.bioVariant?{radius:4,bioLabelLimit:10,bioLogRank:false}:{}),legend:false,
  ...(chart.patch.barVariant?{radius:3}:{}),
  ...(chart.patch.scatterVariant?{radius:chart.patch.radius??5}:{}),
  ...(chart.patch.volcanoVariant?{radius:chart.patch.radius??3,volcanoSearch:false,volcanoBrush:false,volcanoPin:false}:{}),
  tooltip:false,zoom:false,
 };
 return generateCode(chart.type,entryData(chart.type,chart.id)??((chart.type==='violin'&&chart.id!=='violin'||chart.patch.annotationsEnabled)?mockData(chart.type):thumbnailData(chart.type)),config,locale);
}

export const ChartThumbnail=memo(function ChartThumbnail({chart,locale}:{chart:ChartEntry;locale:Locale}){
 const target=useRef<HTMLDivElement>(null),[near,setNear]=useState(false);
 const [image,setImage]=useState<string>(),[source,setSource]=useState<string>(),[failed,setFailed]=useState(false);
 const complete=useRef<()=>void>(()=>{});
 const key=locale+':'+chart.id;
 useEffect(()=>{
  const element=target.current;if(!element)return;
  if(typeof IntersectionObserver==='undefined'){setNear(true);return;}
  const observer=new IntersectionObserver(entries=>setNear(entries.some(entry=>entry.isIntersecting)),{rootMargin:'200px 0px'});
  observer.observe(element);return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  let live=true;
  setSource(undefined);setImage(undefined);setFailed(false);
  if(!near)return;
  const cached=getThumbnail(key);if(cached){setImage(cached);return;}
  let timeout:number|undefined;
  const cancel=scheduleThumbnail(finish=>{
   if(!live){finish();return;}
   complete.current=()=>{window.clearTimeout(timeout);finish();};
   try{setSource(thumbnailSource(chart,locale));}
   catch{setFailed(true);complete.current();return;}
   timeout=window.setTimeout(()=>{if(live){setSource(undefined);setFailed(true);}finish();},20000);
  });
  return ()=>{live=false;window.clearTimeout(timeout);cancel();complete.current=()=>{};};
 },[chart,locale,key,near]);
 return <div ref={target} className="chart-thumbnail" aria-hidden="true" inert>
  {near&&image?<img className="thumbnail-image" src={image} alt="" decoding="async" width="800" height="440"/>:
   near&&source?<Preview source={source} width={800} height={440} fit onSnapshot={svg=>{
    setImage(cacheThumbnail(key,svg));setSource(undefined);complete.current();
   }} onError={()=>{setSource(undefined);setFailed(true);complete.current();}}/>:
   <div className={`thumbnail-placeholder${failed?' is-unavailable':''}`}><svg viewBox="0 0 120 60" fill="none"><path d="M8 8v44h104M12 40l25-18 22 12 24-23 25 14"/><circle cx="37" cy="22" r="3"/><circle cx="83" cy="11" r="3"/></svg></div>}
 </div>;
});
