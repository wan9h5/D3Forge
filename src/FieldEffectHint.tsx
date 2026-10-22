import { useBuilder } from './store';
import { useLocale } from './i18n';

/** Shared visibility control next to annotation mappings, not identity/axis fields. */
export function FieldEffectHint(){
 const {config:c,setConfig}=useBuilder(),locale=useLocale();
 const tr=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
 return <>
  <p className="help">{tr('标签字段决定标注文字；开启下方开关后显示。坐标、图例和悬浮提示分别配置。','The label field sets annotation text. Enable it below; axes, legends and tooltips have separate controls.','ラベル列は注釈文字を決めます。下で表示し、軸・凡例・ツールチップは別に設定します。')}</p>
  <label className="toggle"><span>{tr('显示数据标签','Show data labels','データラベルを表示')}</span><input type="checkbox" checked={c.labels} onChange={event=>setConfig({labels:event.target.checked})}/><span className="switch" aria-hidden="true"/></label>
 </>;
}
