import { useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import { CodeEditor } from './CodeEditor';
import { dataGuide, dataRowLimit, editableJson, parseEditableData } from './dataEditing';
import { useLocale } from './i18n';
import type { ChartType, Config, Row } from './model';

export interface EditableDataProps {
 rows:Row[];type:ChartType;config:Config;resetKey:number;
 onApply:(rows:Row[])=>void;onRestore:()=>void;
}
export function EditableData({rows,type,config,onApply,onRestore,visible}:EditableDataProps&{visible:boolean}){
 const locale=useLocale(),tr=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
 const [draft,setDraft]=useState(()=>editableJson(rows));
 const [issue,setIssue]=useState(''),[warning,setWarning]=useState(''),[pending,setPending]=useState(false);
 const applied=useRef(draft),region=useRef<HTMLDivElement>(null);
 const callbacks=useRef({onApply,onRestore});callbacks.current={onApply,onRestore};
 useEffect(()=>{
  setPending(true);
  const timer=setTimeout(()=>{
   const result=parseEditableData(draft,type,config,locale);
   setIssue(result.error??'');setWarning(result.warning??'');setPending(false);
   if(result.rows&&draft!==applied.current){applied.current=draft;callbacks.current.onApply(result.rows);}
  },350);
  return ()=>clearTimeout(timer);
 },[draft,type,config,locale]);
 function history(command:typeof undo){
  const element=region.current?.querySelector<HTMLElement>('.cm-editor');
  const view=element?EditorView.findFromDOM(element):null;
  if(view){command(view);view.focus();}
 }
 return <div className="editable-data" ref={region}>
  <div className="data-edit-toolbar">
   <span>{tr('JSON 数据','JSON data','JSONデータ')}</span>
   <button className="text-button" onClick={()=>history(undo)}>{tr('撤销','Undo','元に戻す')}</button>
   <button className="text-button" onClick={()=>history(redo)}>{tr('重做','Redo','やり直す')}</button>
   <button className="text-button" onClick={()=>callbacks.current.onRestore()}>{tr('恢复示例数据','Restore example data','サンプルを復元')}</button>
  </div>
  <details className="data-edit-guide"><summary>{tr('数据要求与限制','Data requirements and limits','データ要件と制限')}</summary>
   <p>{dataGuide(type,config,locale)}</p>
   <p>{tr(`最多 ${dataRowLimit(config).toLocaleString()} 行 · 2 MB · 100 个字段 · 100,000 个单元格；仅文本、数字和 null。修改不改变字段映射，[] 可清空图形。`,`Up to ${dataRowLimit(config).toLocaleString()} rows · 2 MB · 100 fields · 100,000 cells; text, numbers and null only. Mappings are preserved; [] clears the chart.`,`最大${dataRowLimit(config).toLocaleString()}行・2 MB・100フィールド・100,000セル。文字列・数値・nullのみ。列対応を保持し、[]で図を空にできます。`)}</p>
  </details>
  <div className={`data-edit-state${issue?' has-error':''}`} role={issue?'alert':'status'} aria-live="polite">
   {issue?`${issue} ${tr('保留上一次有效图形；复制和下载也使用上一次有效数据。','The previous valid chart is retained; copy and download use the previous valid data.','前の有効な図を保持し、コピー・ダウンロードも前の有効なデータを使用します。')}`:pending?tr('正在检查数据…','Checking data…','データを確認中…'):warning||tr('数据有效 · 已同步图形与导出','Valid data · chart and export are synchronized','有効なデータ・図と出力を同期済み')}
  </div>
  <CodeEditor source={draft} visible={visible} label={tr('可编辑 JSON 数据','Editable JSON data','編集可能なJSONデータ')} onChange={text=>{setDraft(text);setPending(true);}} onTooLarge={()=>{setIssue(tr('JSON 文本最多 2 MB，此次输入未应用。','JSON text must be at most 2 MB; this input was not applied.','JSONテキストは最大2 MBです。この入力は適用しませんでした。'));setPending(false);}}/>
 </div>;
}
