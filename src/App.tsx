import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Papa from 'papaparse';
import { charts, validateRows, type ChartType, type Config, type Row } from './model';
import { useBuilder } from './store';
import { generateCodeParts } from './generate';
import { CodePanel } from './CodePanel';
import { Preview } from './Preview';
import { Gallery } from './Gallery';
import { ColorPicker } from './ColorPicker';
import { Home, Guide } from './Home';
import { GitHubIcon, SiteFooter, repositoryUrl } from './SiteFooter';
function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}) {return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}) {return <label className="toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span className="switch" aria-hidden="true"/></label>;}
function Builder(){
  const {type,config:c,data,dataName,setConfig,reset,loadData}=useBuilder();
  const [tab,setTab]=useState<'data'|'visual'>('visual');const [dataOpen,setDataOpen]=useState(false);const [importError,setImportError]=useState('');
  const chart=charts.find(d=>d.id===type)!;const fields=Object.keys(data[0]||{});
  const code=useMemo(()=>generateCodeParts(type,data,c),[type,data,c]);const valid=validateRows(type,data,c).length;
  const set=(key:keyof Config,value:unknown)=>setConfig({[key]:value});
  const select=(key:'xField'|'yField'|'groupField'|'labelField',label:string,optional=false)=><Field label={label}><select value={c[key]} onChange={e=>set(key,e.target.value)}>{optional&&<option value="">单一颜色</option>}{fields.map(f=><option key={f}>{f}</option>)}</select></Field>;
  const slider=(key:'radius'|'opacity',label:string,min:number,max:number,step:number)=><Field label={label}><div className="range-row"><input type="range" aria-label={label} min={min} max={max} step={step} value={c[key]} onChange={e=>set(key,+e.target.value)}/><output>{c[key]}</output></div></Field>;
  const toggle=(key:'xAxis'|'yAxis'|'grid'|'tooltip'|'legend'|'zoom'|'labels',label:string)=><Toggle label={label} checked={c[key]} onChange={v=>set(key,v)}/>;
  async function importCSV(file:File|undefined){if(!file)return;setImportError('');if(file.size>10*1024*1024){setImportError('请导入 10 MB 以内的 CSV。');return;}const text=await file.text();const result=Papa.parse<Row>(text,{header:true,skipEmptyLines:'greedy',dynamicTyping:true,transformHeader:h=>h.trim()});if(result.errors.length){setImportError(`CSV 格式错误：${result.errors[0].message}`);return;}if(!result.data.length || !Object.keys(result.data[0]).length){setImportError('CSV 没有可用的数据行。');return;}if(result.data.length>10000){setImportError('当前版本支持最多 10,000 行，请缩小数据后导入。');return;}loadData(result.data,file.name);setTab('data');}
  return <main className="builder-main"><nav className="breadcrumbs" aria-label="当前位置"><a href="#/gallery">← 图形库</a><span aria-hidden="true">/</span><span aria-current="page">{chart.zh}</span></nav>
    <div className="workspace-title"><div><span className="eyebrow">CHART BUILDER</span><h1>{chart.zh}<span className="detail-chart-name">{chart.name}</span></h1></div><p>调整图表配置，实时预览并复制原生 D3.js 源码。</p></div>    <div className="builder"><aside className="controls"><div className="panel-heading"><div><span className="eyebrow">01 / CONFIGURE</span><h2>配置</h2></div><button className="text-button" onClick={()=>{reset();setImportError('');}}>恢复默认</button></div><div className="tabs" role="tablist" aria-label="配置类别"><button role="tab" aria-selected={tab==='data'} onClick={()=>setTab('data')}>数据处理</button><button role="tab" aria-selected={tab==='visual'} onClick={()=>setTab('visual')}>视觉配置</button></div><div className="control-content">
    {tab==='data'?<><section><h3>数据源 <span>{data.length} 行</span></h3><div className="data-source"><strong>{dataName}</strong><small>{dataName==='Mock data'?'可直接使用，或替换为自己的 CSV':'数据仅在当前浏览器处理'}</small></div><div className="data-actions"><label className="upload-button">导入 CSV<input type="file" accept=".csv,text/csv" onChange={e=>{void importCSV(e.target.files?.[0]);e.target.value='';}}/></label><button className="quiet" onClick={()=>setDataOpen(!dataOpen)}>{dataOpen?'收起数据':'查看数据'}</button></div>{importError&&<p className="notice" role="alert">{importError}</p>}</section><section><h3>字段映射</h3>{select('xField',type==='box'?'分组字段':'X 字段')}{select('yField',type==='volcano'?'P-value 字段':'Y 字段')}{type==='scatter'&&select('groupField','颜色分组',true)}{type!=='box'&&select('labelField','标签字段')}</section>{type==='volcano'?<section><h3>转换与显著性</h3><div className="formula">Y = −log10(pvalue)</div><Field label="P-value 阈值" hint="仅接受 0 < p ≤ 1；空值和 p = 0 将跳过。"><input type="number" min="0.00000001" max="1" step="0.01" value={c.pThreshold} onChange={e=>{const v=+e.target.value;if(v>0&&v<=1)set('pThreshold',v);}}/></Field><Field label="|log2 Fold Change| 阈值"><input type="number" min="0" step="0.1" value={c.fcThreshold} onChange={e=>{const v=+e.target.value;if(v>=0&&Number.isFinite(v))set('fcThreshold',v);}}/></Field></section>:<section><h3>{type==='box'?'统计方法':'比例尺'}</h3>{type==='box'?<p className="help">箱体：Q1–Q3；中线：中位数。须线延伸到 1.5 × IQR 范围内的最远观测值，圆点表示离群值。</p>:<Field label="X 比例尺"><select value={c.xScale} onChange={e=>set('xScale',e.target.value)}><option value="linear">Linear · 线性</option><option value="log">Log · 对数</option></select></Field>}<Field label="Y 比例尺"><select value={c.yScale} onChange={e=>set('yScale',e.target.value)}><option value="linear">Linear · 线性</option><option value="log">Log · 对数</option></select></Field></section>}</>:<><section><h3>{type==='box'?'箱体与离群点':'点样式'}</h3>{slider('radius',type==='box'?'离群点半径':'点半径',1,12,1)}{slider('opacity','透明度',.1,1,.05)}{type!=='volcano'&&<div className="field"><span>主色</span><ColorPicker value={c.color} onChange={value=>set('color',value)}/></div>}</section><section><h3>坐标与辅助线</h3>{toggle('xAxis','X 轴')}{toggle('yAxis','Y 轴')}{toggle('grid','网格')}{toggle('legend','图例')}</section><section><h3>信息与交互</h3>{toggle('tooltip','Tooltip · 悬浮提示')}{c.tooltip&&<fieldset className="tooltip-fields"><legend>提示字段</legend><div className="tooltip-options">{fields.map(f=><label key={f}><input type="checkbox" checked={c.tooltipFields.includes(f)} onChange={e=>set('tooltipFields',e.target.checked?[...c.tooltipFields,f]:c.tooltipFields.filter(k=>k!==f))}/>{f}</label>)}</div></fieldset>}{type!=='box'&&<>{toggle('labels',type==='volcano'?'显著点标签':'数据标签')}{toggle('zoom','缩放与平移')}{c.zoom&&<small className="help">滚轮缩放，拖动平移，双击放大。</small>}</>}</section><section><h3>画布</h3><div className="dimension-fields"><Field label="宽度"><input type="number" min="400" max="1600" step="50" value={c.width} onChange={e=>{const v=+e.target.value;if(v>=400&&v<=1600)set('width',v);}}/></Field><Field label="高度"><input type="number" min="280" max="1000" step="20" value={c.height} onChange={e=>{const v=+e.target.value;if(v>=280&&v<=1000)set('height',v);}}/></Field></div></section></>}
    </div></aside><section className="preview-panel"><div className="panel-heading"><div><span className="eyebrow">02 / PREVIEW</span><h2>{chart.name}<span className="small-tag">实时预览</span></h2></div><span className="data-count">{valid} / {data.length} 行有效</span></div><div className="canvas"><Preview source={code.source} width={c.width} height={c.height}/></div><div className="preview-footer"><span>{c.width} × {c.height} · D3 v7</span><span>调整配置，源码与预览同步更新</span></div>{valid<data.length&&<p className="notice">跳过 {data.length-valid} 行：字段为空、数值无效，或不满足对数 / P-value 范围。</p>}{dataOpen&&<div className="data-table"><div className="table-title">数据预览 <span>前 10 行</span><button className="text-button" onClick={()=>setDataOpen(false)}>关闭</button></div><div className="table-scroll"><table><thead><tr>{fields.map(f=><th key={f}>{f}</th>)}</tr></thead><tbody>{data.slice(0,10).map((d,i)=><tr key={i}>{fields.map(f=><td key={f}>{d[f]??'—'}</td>)}</tr>)}</tbody></table></div></div>}</section><CodePanel code={code} dataName={dataName}/></div><SiteFooter compact/></main>;
}

type Route = ChartType | 'home' | 'gallery' | 'guide';
function routeFromHash(): Route {
  if (window.location.hash === '#/gallery') return 'gallery';
  if (window.location.hash === '#/guide') return 'guide';
  const match = window.location.hash.match(/^#\/charts\/([^/]+)\/?$/);
  const chart = charts.find(item => item.id === match?.[1]);
  return chart ? chart.id : match ? 'gallery' : 'home';
}

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);
  const isBuilder = charts.some(chart => chart.id === route);
  useEffect(() => {
    const syncRoute = () => {
      const next = routeFromHash();
      if (charts.some(chart => chart.id === next) && useBuilder.getState().type !== next) useBuilder.getState().selectChart(next as ChartType);
      setRoute(next);
      window.scrollTo(0, 0);
    };
    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  return <div className={isBuilder ? 'app builder-app' : 'app'}><header className="header"><a className="brand" href="#/" aria-label="D3Forge 首页"><span className="brand-icon" aria-hidden="true"><svg viewBox="0 0 44 44" fill="none"><path d="M10 10a12 12 0 0 1 0 24V10Z" fill="#356AE6"/><path d="m34 14-8 8 8 8" stroke="#17202D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>D3Forge</a><div className="header-caption">Visual D3.js Code Builder</div><nav className="header-nav" aria-label="主导航"><a href="#/" aria-current={route === 'home' ? 'page' : undefined}>首页</a><a href="#/gallery" aria-current={route === 'gallery' || isBuilder ? 'page' : undefined}>图形库</a><a href="#/guide" aria-current={route === 'guide' ? 'page' : undefined}>快速入门</a><a className="github-link" href={repositoryUrl} target="_blank" rel="noopener noreferrer" aria-label="D3Forge GitHub 仓库"><GitHubIcon/></a></nav></header>
    {isBuilder ? <Builder key={route}/> : route === 'gallery' ? <Gallery/> : route === 'guide' ? <Guide/> : <Home/>}
  </div>;
}
