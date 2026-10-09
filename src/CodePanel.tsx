import { useEffect, useRef, useState } from 'react';
import { EditorState, StateEffect, StateField, type Range } from '@codemirror/state';
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { basicSetup } from 'codemirror';
const highlight = StateEffect.define<number[]>();
const highlightedLines = StateField.define<DecorationSet>({
  create:()=>Decoration.none,
  update:(value,tr)=>{value=value.map(tr.changes); for(const e of tr.effects) if(e.is(highlight)) {const marks:Range<Decoration>[] = e.value.filter(n=>n<=tr.state.doc.lines).map(n=>Decoration.line({class:'code-changed'}).range(tr.state.doc.line(n).from));value=Decoration.set(marks,true);}return value;},
  provide:f=>EditorView.decorations.from(f)
});
export function CodePanel({source}:{source:string}) {
  const ref=useRef<HTMLDivElement>(null); const editor=useRef<EditorView | null>(null);const previous=useRef(source); const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);const [copied,setCopied]=useState(false);const [error,setError]=useState('');
  useEffect(()=>{
    editor.current=new EditorView({parent:ref.current!,state:EditorState.create({doc:source,extensions:[basicSetup,javascript(),EditorState.readOnly.of(true),EditorView.editable.of(false),highlightedLines,EditorView.theme({'&':{height:'350px',fontSize:'13px'},'.cm-scroller':{overflow:'auto',fontFamily:'"SFMono-Regular", Consolas, monospace'},'.cm-gutters':{background:'#f7f9fb',color:'#97a3b2',border:'none'},'.cm-content':{padding:'16px 0'},'.cm-line':{padding:'0 20px'},'.code-changed':{background:'#d6f1eb',borderLeft:'3px solid #197f8a'},'&.cm-focused':{outline:'none'}})]})});
    return ()=>{editor.current?.destroy();clearTimeout(timer.current);};
  },[]);
  useEffect(()=>{
    if(!editor.current || source===previous.current)return;
    const before=new Set(previous.current.split('\n').map(l=>l.trim()));
    const changed=source.split('\n').flatMap((l,i)=>l.trim()&&!before.has(l.trim())?[i+1]:[]);
    editor.current.dispatch({changes:{from:0,to:editor.current.state.doc.length,insert:source},effects:highlight.of(changed)});
    if(changed.length)editor.current.dispatch({effects:EditorView.scrollIntoView(editor.current.state.doc.line(changed[0]).from,{y:'center'})});
    clearTimeout(timer.current);timer.current=setTimeout(()=>editor.current?.dispatch({effects:highlight.of([])}),1600);previous.current=source;
  },[source]);
  async function copy(){try{await navigator.clipboard.writeText(source);setCopied(true);setError('');setTimeout(()=>setCopied(false),1800);}catch{setError('复制失败，请使用下载源码或选中代码复制。');}}
  function download(){const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));const a=document.createElement('a');a.href=url;a.download='d3forge-chart.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section className="source-panel" aria-label="D3 源码"><div className="panel-heading"><div><span className="eyebrow">03 / SOURCE</span><h2>D3.js 源码 <span className="small-tag">只读</span></h2></div><div className="actions"><button className="quiet" onClick={download}>下载 .js</button><button className="primary" onClick={copy}>{copied?'已复制':'复制源码'}</button></div></div><div className="source-note">包含完整 Mock 数据与绘图逻辑 · 替换 <code>const data</code> 即可接入自己的数据 <span>npm install d3</span></div>{error&&<p role="alert" className="notice">{error}</p>}<div ref={ref}/></section>;
}
