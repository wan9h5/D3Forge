import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { useLocale } from './i18n';
import { defaults } from './model';
import { generateCodeParts } from './generate';
import { Preview } from './Preview';

type View='logo'|'chart'|'code';
const data=[18,34,28,56,45,72,66,89].map((value,index)=>({step:index+1,value}));
const demoConfig={...defaults('line'),xField:'step',yField:'value',groupField:'',labelField:'step',
  width:440,height:320,color:'#60A5FA',lineWidth:3.5,radius:4,showPoints:false,smooth:true,
  area:false,xAxis:false,yAxis:false,grid:false,legend:false,tooltip:false,zoom:false,canvasStyle:true,background:'#070b1b',
  marginTop:28,marginRight:20,marginBottom:36,marginLeft:40,
  axisStyle:true,axisColor:'#71829f',tickFontSize:10,xTickCount:4,yTickCount:4,tickSize:3,
  gridStyle:true,gridColor:'#26344c',gridOpacity:.55,gridWidth:1,gridDash:'3,6'};

export function HolographicHero(){
  const locale=useLocale();
  const [view,setView]=useState<View>('logo');
  const [pointerInside,setPointerInside]=useState(false);
  const [chartSnapshot,setChartSnapshot]=useState('');
  const card=useRef<HTMLDivElement>(null),surface=useRef<HTMLDivElement>(null);
  const frame=useRef<number|undefined>(undefined),idle=useRef<number|undefined>(undefined);
  const position=useRef({x:0,y:0});
  const text=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
  const code=useMemo(()=>generateCodeParts('line',data,demoConfig,locale),[locale]);
  const reset=()=>{
    window.clearTimeout(idle.current);
    if(frame.current!==undefined){window.cancelAnimationFrame(frame.current);frame.current=undefined;}
    setView('logo');
    surface.current?.style.setProperty('--tilt-x','0deg');
    surface.current?.style.setProperty('--tilt-y','0deg');
    surface.current?.style.setProperty('--glare-opacity','0');
  };
  const reveal=(next:View)=>{
    setView(next);
    window.clearTimeout(idle.current);
    idle.current=window.setTimeout(reset,1800);
  };
  const move=(event:PointerEvent<HTMLDivElement>)=>{
    setPointerInside(true);
    const bounds=event.currentTarget.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    position.current={x:Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1)),y:Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1))};
    reveal(position.current.x<-.16?'chart':position.current.x>.16?'code':'logo');
    if(frame.current!==undefined)return;
    frame.current=window.requestAnimationFrame(()=>{
      frame.current=undefined;
      const {x,y}=position.current,element=surface.current;
      if(!element)return;
      element.style.setProperty('--tilt-x',`${-y*9}deg`);
      element.style.setProperty('--tilt-y',`${x*13}deg`);
      element.style.setProperty('--pointer-x',`${(x+1)*50}%`);
      element.style.setProperty('--pointer-y',`${(y+1)*50}%`);
      element.style.setProperty('--foil-position',`${50+x*35}%`);
      element.style.setProperty('--glare-opacity',String(.16+Math.abs(x)*.18));
    });
  };
  useEffect(()=>()=>{
    window.clearTimeout(idle.current);
    if(frame.current!==undefined)window.cancelAnimationFrame(frame.current);
  },[]);
  return <section className="holo-hero" aria-labelledby="home-title">
    <div className="holo-intro">
      <h1 id="home-title">{pointerInside||view!=='logo'?text('欢迎来到D3Forge','This is what we do','これが私たちのつくるもの'):text('尝试着切换卡片','Try moving across the card','カードの上で左右に動かしてみて')}</h1>
    </div>
    <div className="holo-stage">
      <div ref={card} className="holo-card" data-view={view} role="group" tabIndex={0}
        aria-label={text('交互闪卡：左侧显示折线图，右侧显示 D3 代码。可使用左右方向键，Esc 返回 Logo。','Interactive card: move left for a line chart and right for D3 code. You can also use arrow keys; Escape returns to the logo.','インタラクティブカード：左で折れ線、右で D3 コード。左右キーでも操作でき、Esc でロゴに戻ります。')}
        onPointerEnter={move}
        onPointerMove={move}
        onPointerDown={event=>{if(event.pointerType==='touch')event.currentTarget.setPointerCapture(event.pointerId);move(event);}}
        onPointerLeave={()=>{setPointerInside(false);reset();}}
        onPointerCancel={()=>{setPointerInside(false);reset();}}
        onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))reset();}}
        onKeyDown={event=>{
          if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();reveal(event.key==='ArrowLeft'?'chart':'code');}
          if(event.key==='Escape'||event.key==='Home'){event.preventDefault();reset();}
        }}>
        <div ref={surface} className="holo-surface">
          <div className="holo-face holo-logo-face" aria-hidden={view!=='logo'}>
            <svg className="holo-logo" viewBox="0 0 120 72" fill="none" aria-hidden="true"><path d="M21 16v40h12c29 0 29-40 0-40H21Z" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M99 23c-8 2-15 6-21 13 6 6 13 10 21 13" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="holo-brand">D3Forge</span>
          </div>
          <div className="holo-face holo-chart-face" aria-hidden={view!=='chart'} inert={view!=='chart'}>
            <div className="holo-chart">
              <div className="holo-chart-renderer" aria-hidden="true"><Preview source={code.source} width={demoConfig.width} height={demoConfig.height} fit onSnapshot={setChartSnapshot}/></div>
              {chartSnapshot&&<img className="holo-chart-image" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSnapshot)}`} width={demoConfig.width} height={demoConfig.height} alt={text('蓝色平滑曲线','A smooth blue curve','青い滑らかな曲線')}/>}
            </div>
            <h2>{text('把数据变成图形','Give your data a shape','データをグラフに')}</h2>
            <p>{text('每一条线，都有它的逻辑','Every line has a story and a logic','すべての線に、意味とロジックがあります')}</p>
          </div>
          <div className="holo-face holo-code-face" aria-hidden={view!=='code'} inert={view!=='code'}>
            <pre><code><span className="holo-token-keyword">const</span>{' line = from '}<span className="holo-token-library">D3.js</span></code></pre>
            <h2>{text('把代码带回你的项目','Take the code with you','コードをあなたのプロジェクトへ')}</h2>
            <p>{text('原生 D3，任你创造','Native D3, yours to create with','ネイティブ D3。自由に創造しましょう')}</p>
          </div>
          <div className="holo-foil" aria-hidden="true"/>
          <div className="holo-glare" aria-hidden="true"/>
        </div>
      </div>
    </div>
  </section>;
}
