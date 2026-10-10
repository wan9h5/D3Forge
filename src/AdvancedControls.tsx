import { Select } from './Select';
import { useEffect, useState, type ReactNode } from 'react';
import { ColorPicker } from './ColorPicker';
import { useBuilder } from './store';
import { numericAxes } from './advancedModel';
import { t, useLocale } from './i18n';
import type { Config } from './model';

type Control = { key:keyof Config; label:string; kind?:'color'|'text'|'select'|'field'|'toggle'; min?:number; max?:number; step?:number; options?:readonly (readonly [string,string])[] };
const formats=[['','自动'],['.2f','两位小数'],['.0%','百分比'],['.2~s','紧凑单位'],['.2e','科学计数']] as const;
const dashes=[['','实线'],['6,4','虚线'],['2,3','点线']] as const;
const color=(key:keyof Config,label:string):Control=>({key,label,kind:'color'});
const range=(key:keyof Config,label:string,min:number,max:number,step=1):Control=>({key,label,min,max,step});
const select=(key:keyof Config,label:string,options:Control['options']):Control=>({key,label,kind:'select',options});
const toggle=(key:keyof Config,label:string):Control=>({key,label,kind:'toggle'});

function Bounds({minKey,maxKey,positive=false}:{minKey:keyof Config;maxKey:keyof Config;positive?:boolean}) {
  const c=useBuilder(state=>state.config),set=useBuilder(state=>state.setConfig);
  const [low,setLow]=useState(String(c[minKey])),[high,setHigh]=useState(String(c[maxKey])),[error,setError]=useState(false);
  useEffect(()=>{setLow(String(c[minKey]));setHigh(String(c[maxKey]));setError(false);},[c[minKey],c[maxKey]]);
  function commit(){const a=Number(low),b=Number(high);const valid=low.trim()!==''&&high.trim()!==''&&Number.isFinite(a)&&Number.isFinite(b)&&a<b&&(!positive||a>0);setError(!valid);if(valid)set({[minKey]:a,[maxKey]:b});}
  return <><div className="dimension-fields"><label className="field"><span>{t('下界')}</span><input aria-label={t('下界')} type="number" step="any" value={low} onChange={e=>setLow(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();}}/></label><label className="field"><span>{t('上界')}</span><input aria-label={t('上界')} type="number" step="any" value={high} onChange={e=>setHigh(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();}}/></label></div>{error&&<p className="notice" role="alert">{t(positive?'范围必须有限、递增，且下界大于零。':'范围必须为有限数值，且下界小于上界。')}</p>}</>;
}

export function AdvancedControls() {
  useLocale();
  const {type,config:c,data,setConfig}=useBuilder();
  const fields=Object.keys(data[0]??{}),axes=numericAxes(type,c);
  const numericFields=fields.filter(field=>data.some(row=>row[field]!=null&&String(row[field]).trim()!==''&&Number.isFinite(Number(row[field]))));
  function set(key:keyof Config,value:unknown){setConfig({[key]:value});}
  function control(item:Control) {
    const label=t(item.label),value=c[item.key];
    if(item.kind==='toggle')return <label className="toggle" key={item.key}><span>{label}</span><input type="checkbox" checked={Boolean(value)} onChange={e=>set(item.key,e.target.checked)}/><span className="switch" aria-hidden="true"/></label>;
    return <div className="field" key={item.key}><label htmlFor={`advanced-${item.key}`}>{label}</label>{item.kind==='color'?<ColorPicker label={label} value={String(value)} onChange={value=>set(item.key,value)}/>:item.kind==='select'||item.kind==='field'?<Select id={`advanced-${item.key}`} value={String(value)} onChange={e=>set(item.key,e.target.value)}>{(item.kind==='field'?numericFields.map(field=>[field,field] as const):item.options??[]).map(([key,text])=><option key={key} value={key}>{item.kind==='field'?text:t(text)}</option>)}</Select>:item.kind==='text'?<input id={`advanced-${item.key}`} type="text" maxLength={100} value={String(value)} onChange={e=>set(item.key,e.target.value)}/>:<div className="range-row"><input id={`advanced-${item.key}`} aria-label={label} type="range" min={item.min} max={item.max} step={item.step??1} value={Number(value)} onChange={e=>set(item.key,+e.target.value)}/><output>{String(value)}</output></div>}</div>;
  }
  function group(title:string,flag:keyof Config,items:Control[],children?:ReactNode,hint?:string,available=true) {
    const enabled=Boolean(c[flag]);
    function enable(checked:boolean){
      const patch:Partial<Config>={[flag]:checked};
      if(checked&&flag==='labelStyle')patch.labels=true;
      if(checked&&flag==='gridStyle')patch.grid=true;
      if(checked&&flag==='legendStyle')patch.legend=true;
      if(checked&&flag==='markBorder'&&['line','violin'].includes(type))patch.showPoints=true;
      if(checked&&flag==='xDomainEnabled'&&c.xScale==='log'&&c.xMin<=0)patch.xMin=Math.min(1,c.xMax/10);
      if(checked&&flag==='yDomainEnabled'&&c.yScale==='log'&&c.yMin<=0)patch.yMin=Math.min(1,c.yMax/10);
      if(checked&&flag==='scatterSizeEnabled'&&!numericFields.includes(c.sizeField))patch.sizeField=numericFields[0]??'';
      setConfig(patch);
    }
    return <details className="advanced-group" key={String(flag)}><summary><span>{t(title)}</span><small className={enabled?'is-enabled':''}>{t(enabled?'已启用':'按需开启')}</small></summary><div className="advanced-group-body"><label className="toggle"><span>{t('启用{feature}',{feature:t(title)})}</span><input type="checkbox" disabled={!available} checked={enabled} onChange={e=>enable(e.target.checked)}/><span className="switch" aria-hidden="true"/></label>{hint&&<p className="help">{t(hint)}</p>}{available&&enabled&&<>{items.map(control)}{children}</>}</div></details>;
  }
  const chartSpecific:Record<typeof type,Control[]>={
    scatter:[select('pointShape','点形状',[['circle','圆形'],['square','方形'],['triangle','三角形'],['diamond','菱形'],['star','星形'],['cross','十字']])],
    volcano:[select('pointShape','点形状',[['circle','圆形'],['square','方形'],['triangle','三角形'],['diamond','菱形']]),color('upColor','上调颜色'),color('downColor','下调颜色'),color('neutralColor','非显著颜色'),color('thresholdColor','阈值线颜色'),range('thresholdWidth','阈值线宽',.5,4,.5),select('thresholdDash','阈值线型',dashes)],
    box:[range('boxWidth','箱体最大宽度',12,160),toggle('showOutliers','显示离群值'),color('outlierFill','离群点填充'),color('medianColor','中位线颜色'),range('medianWidth','中位线宽',1,5,.5)],
    bar:[range('cornerRadius','柱形圆角',0,16),range('seriesPadding','组内柱间距',0,.6,.02)],
    line:[select('curveType','曲线类型',[['linear','折线'],['monotone','单调平滑'],['step','阶梯'],['basis','样条']]),select('lineDash','线条线型',dashes),range('areaOpacity','面积填充透明度',.05,1,.05)],
    violin:[range('violinWidth','轮廓半宽比例',.1,.5,.05),range('jitterWidth','观测点抖动宽度',0,.9,.05),range('violinSamples','密度采样数量',41,201,10),color('medianColor','中位线颜色'),range('medianWidth','中位线宽',1,5,.5)],
    manhattan:[color('thresholdColor','阈值线颜色'),range('thresholdWidth','阈值线宽',.5,4,.5),select('thresholdDash','阈值线型',dashes)],
    heatmap:[select('rowOrder','行分类顺序',[['input','数据顺序'],['ascending','升序'],['descending','降序']]),select('columnOrder','列分类顺序',[['input','数据顺序'],['ascending','升序'],['descending','降序']])],
    histogram:[range('binGap','柱间留白',0,8,.5),range('cornerRadius','柱形圆角',0,12)],
  };
  const ordinalLegend=type!=='histogram';
  const needsGroup=['scatter','bar','line'].includes(type)&&!c.groupField;
  return <section className="advanced-settings"><h3>{t('高级配置')}</h3><p className="advanced-intro">{t('展开查看适用于当前图形的选项，新增效果默认关闭。')}</p>
    {group('图形专属样式','chartStyle',chartSpecific[type],undefined,type==='line'?'高级曲线优先于基础平滑开关；面积透明度仅在开启面积填充时生效。':type==='violin'?'抖动宽度仅在显示观测点时生效。':undefined)}
    {type==='scatter'&&group('按字段映射点大小','scatterSizeEnabled',[{key:'sizeField',label:'大小数值字段',kind:'field'},range('sizeMin','最小点半径',1,12,.5),range('sizeMax','最大点半径',12,40)],undefined,'非负数值按平方根映射；缺失或负值使用基础点半径。',numericFields.length>0)}
    {type!=='heatmap'&&group(type==='bar'||type==='histogram'?'柱形边框':type==='box'?'箱体与离群点边框':'点边框','markBorder',[color('borderColor','边框颜色'),range('borderWidth','边框宽度',.5,5,.5)],undefined,['line','violin'].includes(type)?'启用点边框会同时显示数据点。':undefined)}
    {group('坐标轴样式','axisStyle',[
      {key:'xTitle',label:'X 轴标题',kind:'text'},{key:'yTitle',label:'Y 轴标题',kind:'text'},range('tickFontSize','刻度字号',9,20),range('titleFontSize','轴标题字号',10,24),color('axisColor','坐标轴颜色'),range('tickSize','刻度长度',0,12),range('xTickAngle','X 刻度旋转',-90,90,5),
      ...((axes.x||type==='histogram')?[range('xTickCount','X 建议刻度数',2,15),select('xTickFormat','X 数值格式',formats)]:[]),
      ...(axes.y?[range('yTickCount','Y 建议刻度数',2,15),select('yTickFormat','Y 数值格式',formats)]:[]),
    ],undefined,'空标题沿用字段名；分类轴不提供数值范围与数值格式。')}
    {axes.x&&group('X 显示范围','xDomainEnabled',[],<Bounds minKey="xMin" maxKey="xMax" positive={c.xScale==='log'&&type!=='bar'}/>, '显示范围只裁剪图形，不删除或重新汇总数据。')}
    {axes.y&&group('Y 显示范围','yDomainEnabled',[],<Bounds minKey="yMin" maxKey="yMax" positive={c.yScale==='log'&&['scatter','box','line'].includes(type)}/>, '显示范围只裁剪图形，不删除或重新汇总数据。')}
    {group(type==='heatmap'?'单元格边框样式':'网格样式','gridStyle',[color('gridColor','辅助线颜色'),range('gridWidth','辅助线宽度',.5,4,.5),range('gridOpacity','辅助线透明度',.1,1,.1),select('gridDash','辅助线型',dashes)])}
    {!['box','violin'].includes(type)&&group('标签样式','labelStyle',[range('labelFontSize','标签字号',9,24),color('labelColor','标签颜色'),range('labelOffsetX','标签水平偏移',-30,30),range('labelOffsetY','标签垂直偏移',-30,30),...(['bar','heatmap','histogram'].includes(type)?[select('valueFormat','标签数值格式',formats.filter(([key])=>key!==''))]:[])])}
    {ordinalLegend&&group('图例样式','legendStyle',[select('legendPosition','图例位置',[['top','顶部'],['bottom','底部']]),...(type!=='heatmap'?[select('legendDirection','图例排列',[['row','横向换行'],['column','纵向']]),range('legendGap','图例间距',4,24),range('legendMaxItems','最多图例项',1,20),range('legendLabelLength','图例文字长度',6,40)]:[]),range('legendFontSize','图例字号',9,20)],undefined,needsGroup?'请先在数据处理中选择颜色或系列分组。':'长图例自动换行并限制显示数量，完整数据始终保留。',!needsGroup)}
    {(axes.x||axes.y)&&<details className="advanced-group"><summary><span>{t('参考线')}</span><small className={c.referenceXEnabled||c.referenceYEnabled?'is-enabled':''}>{t(c.referenceXEnabled||c.referenceYEnabled?'已启用':'按需开启')}</small></summary><div className="advanced-group-body">{axes.x&&control(toggle('referenceXEnabled','垂直参考线'))}{axes.x&&c.referenceXEnabled&&<label className="field"><span>{t('X 参考值')}</span><input type="number" step="any" value={c.referenceX} onChange={e=>{if(e.target.value&&Number.isFinite(+e.target.value))set('referenceX',+e.target.value);}}/></label>}{axes.y&&control(toggle('referenceYEnabled','水平参考线'))}{axes.y&&c.referenceYEnabled&&<label className="field"><span>{t('Y 参考值')}</span><input type="number" step="any" value={c.referenceY} onChange={e=>{if(e.target.value&&Number.isFinite(+e.target.value))set('referenceY',+e.target.value);}}/></label>}{(c.referenceXEnabled||c.referenceYEnabled)&&[color('referenceColor','参考线颜色'),range('referenceWidth','参考线宽度',.5,4,.5),select('referenceDash','参考线型',dashes)].map(control)}<p className="help">{t('仅显示落在当前数值轴范围内的参考线；对数轴参考值必须大于零。')}</p></div></details>}
    {type==='heatmap'&&group('颜色数值范围','colorDomainEnabled',[],<Bounds minKey="colorMin" maxKey="colorMax"/>, '发散配色仍以零为中心，使用上下界绝对值的最大值作为对称范围。')}
    {type==='heatmap'&&group('缺失单元格底色','missingColorEnabled',[color('missingColor','缺失区域颜色')])}
    {type==='histogram'&&group('分箱数值范围','histogramRangeEnabled',[],<Bounds minKey="histogramMin" maxKey="histogramMax"/>, '范围外的样本不参与分箱；概率密度按范围内样本重新归一化。')}
    {group('画布与留白','canvasStyle',[color('background','画布背景'),range('marginTop','顶部留白',0,180),range('marginRight','右侧留白',0,180),range('marginBottom','底部留白',0,180),range('marginLeft','左侧留白',0,180)],undefined,'留白会自动限制，保证绘图区至少保留 40 像素；开启高级图例时额外预留图例空间。')}
  </section>;
}
