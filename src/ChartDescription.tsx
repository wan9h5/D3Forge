import { useEffect, useId, useRef, useState } from 'react';
import { useLocale } from './i18n';

export function ChartDescription({description}:{description:string}){
 const locale=useLocale();
 const tr=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
 const [visible,setVisible]=useState(false),[closing,setClosing]=useState(false);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const id=useId();
 function close(restoreFocus=false){
  if(closing)return;
  clearTimeout(timer.current);
  setClosing(true);
  timer.current=setTimeout(()=>{setVisible(false);setClosing(false);if(restoreFocus)trigger.current?.focus({preventScroll:true});},180);
 }
 function open(){clearTimeout(timer.current);setClosing(false);setVisible(true);}
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{
  if(!visible)return;
  closeButton.current?.focus({preventScroll:true});
  function outside(event:PointerEvent){if(event.target instanceof Node&&!root.current?.contains(event.target))close();}
  function escape(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();close(true);}}
  function frameFocus(){queueMicrotask(()=>{if(document.activeElement instanceof HTMLIFrameElement)close();});}
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('blur',frameFocus);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('blur',frameFocus);};
 },[visible]);
 return <div ref={root} className="preview-description">
   <button ref={trigger} type="button" className="text-button chart-about-trigger" aria-expanded={visible&&!closing} aria-controls={id} aria-haspopup="dialog" onClick={()=>visible&&!closing?close(true):open()}>{tr('了解此图','About this chart','この図について')}</button>
  {visible&&<div id={id} role="dialog" aria-labelledby={id+'-title'} className={`chart-about-popover${closing?' is-closing':''}`} inert={closing}>
   <div className="chart-about-heading"><strong id={id+'-title'}>{tr('关于此图','About this chart','この図について')}</strong><button ref={closeButton} type="button" className="text-button chart-about-close" aria-label={tr('关闭说明','Close description','説明を閉じる')} onClick={()=>close(true)}>×</button></div>
   <p>{description}</p>
  </div>}
 </div>;
}
