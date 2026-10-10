import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

type Option = { value:string; label:string; disabled?:boolean };
export function Select({children,value,onChange,id,disabled,...props}:SelectHTMLAttributes<HTMLSelectElement>) {
  const options:Option[]=Children.toArray(children).filter(isValidElement).map(child=>{
    const p=(child as ReactElement<{value?:string;children?:string;disabled?:boolean}>).props;
    return {value:String(p.value??p.children??''),label:String(p.children??''),disabled:p.disabled};
  });
  const [open,setOpen]=useState(false),[active,setActive]=useState(0),[label,setLabel]=useState('');
  const [position,setPosition]=useState({left:0,top:0,width:0,maxHeight:240});
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),native=useRef<HTMLSelectElement>(null),menu=useRef<HTMLDivElement>(null);
  const uid=useId(),menuId=uid+'-menu';
  const current=options.find(o=>o.value===String(value))??options[0];
  const search=useRef({text:'',time:0});
  function choose(index:number){
    const option=options[index];if(!option||option.disabled||!native.current)return;
    native.current.value=option.value;
    native.current.dispatchEvent(new Event('change',{bubbles:true}));
    setOpen(false);
  }
  function show(){setActive(Math.max(0,options.findIndex(o=>o.value===String(value))));setOpen(true);}
  useLayoutEffect(()=>{
    setLabel(root.current?.closest('label')?.querySelector(':scope > span')?.textContent??'');
    if(!open||!trigger.current)return;
    const rect=trigger.current.getBoundingClientRect(),below=window.innerHeight-rect.bottom-12,above=rect.top-12;
    const height=Math.min(240,options.length*39+12),up=below<height&&above>below;
    const maxHeight=Math.max(40,Math.min(240,up?above:below));
    setPosition({left:Math.max(8,Math.min(rect.left,window.innerWidth-rect.width-8)),top:up?rect.top-Math.min(height,maxHeight)-7:rect.bottom+7,width:rect.width,maxHeight});
  },[open,options.length]);
  useEffect(()=>{
    if(!open)return;
    menu.current?.querySelectorAll<HTMLElement>('[role=option]')[active]?.scrollIntoView({block:'nearest'});
  },[open,active]);
  useEffect(()=>{
    if(!open)return;
    function outside(event:Event){const target=event.target as Node;if(!root.current?.contains(target)&&!menu.current?.contains(target))setOpen(false);}
    function scroll(event:Event){if(!menu.current?.contains(event.target as Node))setOpen(false);}
    const close=()=>setOpen(false);
    document.addEventListener('pointerdown',outside);document.addEventListener('focusin',outside);
    document.addEventListener('scroll',scroll,true);window.addEventListener('resize',close);window.addEventListener('hashchange',close);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);document.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',close);window.removeEventListener('hashchange',close);};
  },[open]);
  function move(direction:number){for(let i=1;i<=options.length;i++){const index=(active+direction*i+options.length)%options.length;if(!options[index].disabled){setActive(index);break;}}}
  return <div className="custom-select" ref={root}>
    <select {...props} ref={native} value={value} onChange={onChange} disabled={disabled} aria-hidden="true" tabIndex={-1} hidden>{children}</select>
    <button id={id} ref={trigger} type="button" className="select-trigger" role="combobox" aria-label={props['aria-label']??(label||undefined)} aria-labelledby={props['aria-labelledby']} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} aria-activedescendant={open?`${menuId}-${active}`:undefined} disabled={disabled||!options.length}
      onClick={()=>open?setOpen(false):show()} onKeyDown={event=>{
        if(event.key==='Tab'){setOpen(false);return;}
        if(event.key==='Escape'){event.preventDefault();setOpen(false);return;}
        if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
          event.preventDefault();if(!open){show();return;}
          if(event.key==='Home')setActive(Math.max(0,options.findIndex(o=>!o.disabled)));
          else if(event.key==='End')setActive(options.length-1-[...options].reverse().findIndex(o=>!o.disabled));
          else move(event.key==='ArrowDown'?1:-1);return;
        }
        if(event.key==='Enter'||event.key===' '){event.preventDefault();open?choose(active):show();return;}
        if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
          event.preventDefault();const now=Date.now();search.current={text:(now-search.current.time<700?search.current.text:'')+event.key.toLowerCase(),time:now};
          const match=options.findIndex(o=>!o.disabled&&o.label.toLowerCase().startsWith(search.current.text));
          if(!open)show();if(match>=0)setActive(match);
        }
      }}>
      <span>{current?.label??''}</span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
    </button>
    {open&&createPortal(<div ref={menu} id={menuId} className="select-menu" role="listbox" aria-label={props['aria-label']??(label||undefined)} style={position} onMouseDown={e=>e.preventDefault()}>
      {options.map((option,index)=><div key={option.value} id={`${menuId}-${index}`} role="option" aria-selected={option.value===String(value)} aria-disabled={option.disabled||undefined} data-active={index===active} onPointerMove={()=>!option.disabled&&setActive(index)} onClick={e=>{e.stopPropagation();choose(index);}}>
        <span>{option.label}</span>{option.value===String(value)&&<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>}
      </div>)}
    </div>,document.body)}
  </div>;
}
