import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useLocale } from './i18n';
import jackWangAvatar from './assets/jack-wang-github.png';
import { repositoryUrl } from './SiteFooter';

export function Contributors() {
  const locale=useLocale();
  const [open,setOpen]=useState(false);
  const [offset,setOffset]=useState(0);
  const [imageFailed,setImageFailed]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const tooltipId=useId();
  const text=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
  useEffect(()=>{
    const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);};
    document.addEventListener('pointerdown',outside);
    return ()=>document.removeEventListener('pointerdown',outside);
  },[]);
  return <main className="contributors-main">
    <section className="contributors-content" aria-labelledby="contributors-heading">
      <h1 id="contributors-heading">{text('如果你有更好的想法，欢迎加入贡献者队列','Have a better idea? Join our contributors','もっと良いアイデアがあれば、ぜひコントリビューターに加わってください')}</h1>
      <div className="contributors-participation">
      <div className="contributors-avatars">
        <div ref={root} className={`contributor-person${open?' is-open':''}`} style={{'--tooltip-offset':`${offset*16}px`,'--tooltip-rotation':`${offset*8}deg`} as CSSProperties}
          onPointerEnter={event=>{if(event.pointerType!=='touch')setOpen(true);}}
          onPointerLeave={()=>{setOffset(0);if(!root.current?.contains(document.activeElement))setOpen(false);}}
          onPointerMove={event=>{
            if(event.pointerType==='touch')return;
            const rect=event.currentTarget.getBoundingClientRect();
            setOffset(Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1)));
          }}>
          <div id={tooltipId} className="contributor-tooltip" role="tooltip" aria-hidden={!open}>
            <strong>Jack Wang</strong>
            <span>SMBM</span>
            <b>Front-end Developer</b>
            <i className="contributor-tooltip-glow" aria-hidden="true"/>
          </div>
          <button className="contributor-avatar" type="button" aria-label={text('查看 Jack Wang 的贡献者信息','View Jack Wang’s contributor profile','Jack Wang のプロフィールを見る')} aria-describedby={open?tooltipId:undefined}
            onFocus={()=>setOpen(true)} onBlur={()=>{setOpen(false);setOffset(0);}}
            onClick={()=>setOpen(true)} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);}}}>
            {imageFailed?<span className="contributor-avatar-fallback">JW</span>:<img src={jackWangAvatar} alt="Jack Wang" width="80" height="80" onError={()=>setImageFailed(true)}/>}
          </button>
        </div>
      </div>
      <div className="contributors-actions">
        <a className="contribute-link" href={repositoryUrl} target="_blank" rel="noopener noreferrer">
          <span>{text('参与贡献','Contribute','貢献する')}</span><span aria-hidden="true">↗</span>
        </a>
        <a className="contribute-idea-link" href={`${repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">{text('提出想法','Share an idea','アイデアを提案する')}<span aria-hidden="true">↗</span></a>
      </div>
      </div>
    </section>
  </main>;
}
