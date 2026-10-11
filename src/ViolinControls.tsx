import { Select } from './Select';
import { t, useLocale } from './i18n';
import { useBuilder } from './store';
import type { Config } from './model';

export function ViolinControls() {
  useLocale();
  const { config:c, data, setConfig } = useBuilder();
  const fields = Object.keys(data[0] || {});
  const set = (key:keyof Config,value:unknown) => setConfig({[key]:value});
  const field = (key:'violinGroupField'|'facetField'|'annotationField',label:string,optional=true) => <label className="field"><span>{t(label)}</span><Select value={c[key]} onChange={e=>set(key,e.target.value)}>{optional&&<option value="">{t('不分组')}</option>}{fields.map(name=><option key={name} value={name}>{name}</option>)}</Select></label>;
  return <section><h3>{t('分布布局')}</h3>
    <label className="field"><span>{t('轮廓形式')}</span><Select value={c.violinLayout} onChange={e=>setConfig({violinLayout:e.target.value as Config['violinLayout'],...(e.target.value==='raincloud'?{showPoints:true,violinInner:'box'}:{})})}><option value="full">{t('完整小提琴')}</option><option value="half">{t('半小提琴')}</option><option value="split">{t('对半小提琴')}</option><option value="raincloud">{t('雨云图')}</option></Select></label>
    <label className="field"><span>{t('分布图形')}</span><Select value={c.violinGeometry} onChange={e=>set('violinGeometry',e.target.value)}><option value="violin">{t('小提琴图')}</option><option value="box">{t('箱线图')}</option></Select></label>
    <label className="toggle"><span>{t('横向排列')}</span><input type="checkbox" checked={c.horizontal} onChange={e=>set('horizontal',e.target.checked)}/><span className="switch" aria-hidden="true"/></label>
    {field('violinGroupField','子组字段')}
    {c.violinLayout==='split'&&<p className="help">{t('对半小提琴图需要恰好两个子组，请选择子组字段。')}</p>}
    <details className="advanced-group"><summary>{t('分面设置')}</summary><div className="advanced-group-body">{field('facetField','分面字段')}{c.facetField&&<label className="field"><span>{t('分面数值范围')}</span><Select value={c.facetScale} onChange={e=>set('facetScale',e.target.value)}><option value="shared">{t('统一范围')}</option><option value="free">{t('各面独立')}</option></Select></label>}</div></details>
    <AnnotationControls/>
    <details className="advanced-group"><summary>{t('组间比较标注')}</summary><div className="advanced-group-body">
      <label className="toggle"><span>{t('显示比较连线')}</span><input type="checkbox" checked={c.comparisonsEnabled} onChange={e=>set('comparisonsEnabled',e.target.checked)}/><span className="switch" aria-hidden="true"/></label>
      {c.comparisonsEnabled&&<>{c.comparisons.map((comparison,index)=><div key={index} className="comparison-row">{(['from','to'] as const).map(key=><label className="field" key={key}><span>{t(key==='from'?'起始组':'结束组')}</span><Select value={comparison[key]} onChange={e=>set('comparisons',c.comparisons.map((item,i)=>i===index?{...item,[key]:e.target.value}:item))}>{[...new Set(data.map(row=>String(row[c.xField]??'')).filter(Boolean))].map(group=><option key={group}>{group}</option>)}</Select></label>)}<label className="field"><span>{t('标注文字')}</span><input value={comparison.label} maxLength={100} onChange={e=>set('comparisons',c.comparisons.map((item,i)=>i===index?{...item,label:e.target.value}:item))}/></label><button className="text-button" onClick={()=>set('comparisons',c.comparisons.filter((_,i)=>i!==index))}>{t('移除')}</button></div>)}<button className="text-button" disabled={c.comparisons.length>=8} onClick={()=>{const groups=[...new Set(data.map(row=>String(row[c.xField]??'')).filter(Boolean))];set('comparisons',[...c.comparisons,{from:groups[0]||'',to:groups[1]||groups[0]||'',label:''}]);}}>{t('添加比较')}</button></>}
      <p className="help">{t('填写已有检验结果或说明；不会自动计算 P 值。无效组或空文字不显示。')}</p>
    </div></details>
  </section>;
}

export function AnnotationControls(){
  useLocale();const {config:c,data,setConfig}=useBuilder();
  return <details className="advanced-group"><summary>{t('字母标注')}</summary><div className="advanced-group-body"><label className="toggle"><span>{t('显示已有标注')}</span><input type="checkbox" checked={c.annotationsEnabled} onChange={e=>setConfig({annotationsEnabled:e.target.checked})}/><span className="switch" aria-hidden="true"/></label>{c.annotationsEnabled&&<label className="field"><span>{t('标注字段')}</span><Select value={c.annotationField} onChange={e=>setConfig({annotationField:e.target.value})}><option value="">{t('请选择字段')}</option>{Object.keys(data[0]||{}).map(name=><option key={name}>{name}</option>)}</Select></label>}<p className="help">{t('仅展示数据中的标注，不执行统计检验；示例字母仅用于演示。')}</p></div></details>;
}
