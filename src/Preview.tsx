import { t, useLocale } from './i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import d3Bundle from '../node_modules/d3/dist/d3.min.js?raw';
import { executableSource } from './generate';
const escapeScript=(value:string)=>value.replace(/<\/script/gi,match=>'<\\/'+match.slice(2));
export function Preview({source,width,height,fit=false,onSnapshot,onError}:{source:string;width:number;height:number;fit?:boolean;onSnapshot?:(svg:string)=>void;onError?:(message:string)=>void}) {
  useLocale();
  const ref=useRef<HTMLIFrameElement>(null);const [error,setError]=useState('');
  const doc=useMemo(()=>`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;"><style>html,body{margin:0;background:white;scrollbar-width:thin;scrollbar-color:#999 transparent}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:#999;border-radius:8px}::-webkit-scrollbar-track{background:transparent}body{font-family:system-ui}#chart{width:100%}${fit?'html,body,#chart{height:100%;overflow:hidden}#chart>svg{width:100%!important;height:100%!important}':''}</style></head><body><div id="chart"></div><script>${escapeScript(d3Bundle)}</script><script>window.addEventListener('error', e=>parent.postMessage({kind:'d3forge-error',message:e.message},'*'));try{${escapeScript(executableSource(source))}\nparent.postMessage({kind:'d3forge-ready'${onSnapshot?`,snapshot:new XMLSerializer().serializeToString(document.querySelector('#chart svg'))`:''}},'*');}catch(e){parent.postMessage({kind:'d3forge-error',message:e.message},'*');}</script></body></html>`,[source,fit,!!onSnapshot]);
  const callbacks=useRef({onSnapshot,onError});callbacks.current={onSnapshot,onError};
  useEffect(()=>{setError('');const listener=(e:MessageEvent)=>{if(e.source!==ref.current?.contentWindow)return;if(e.data?.kind==='d3forge-error'){setError(e.data.message);callbacks.current.onError?.(e.data.message);}if(e.data?.kind==='d3forge-ready'){setError('');if(typeof e.data.snapshot==='string')callbacks.current.onSnapshot?.(e.data.snapshot);}};window.addEventListener('message',listener);return ()=>window.removeEventListener('message',listener);},[source]);
  return <>{error&&<p className="notice" role="alert">{t("预览出错：")}{error}</p>}<iframe ref={ref} title={t("D3 图表实时预览")} sandbox="allow-scripts" srcDoc={doc} className="chart-frame" style={{aspectRatio:`${width}/${height}`}}/></>;
}
