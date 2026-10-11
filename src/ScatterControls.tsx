import { Bounds } from './AdvancedControls';
import { useBuilder } from './store';
import type { Config } from './model';
import { t, useLocale } from './i18n';
import { Select } from './Select';
import { ColorPicker } from './ColorPicker';
import type { ReactNode } from 'react';

export function ScatterFields(){
 useLocale();
 const {data,config:c,setConfig}=useBuilder(),fields=Object.keys(data[0]??{});
 const mode=c.scatterVariant;
 const field=(key:keyof Config,label:string,optional=false)=><label className="field"><span>{t(label)}</span><Select value={String(c[key])} onChange={e=>setConfig({[key]:e.target.value})}>{optional&&<option value="">{t('单一颜色')}</option>}{fields.map(f=><option key={f}>{f}</option>)}</Select></label>;
 return <>{field('xField',mode==='bubble'?'列分类字段':mode==='paired'?'条件字段':mode==='gsea'?'通路字段':'X 字段')}{field('yField',mode==='bubble'?'行分类字段':mode==='gsea'?'NES 字段':'Y 字段')}{mode==='3d'&&field('zField','Z 字段')}{mode==='paired'&&field('pairField','配对对象 ID')}{mode!=='bubble'&&mode!=='gsea'&&field('groupField','颜色分组',true)}{(c.continuousColor||mode==='bubble'||mode==='gsea')&&field('colorField',mode==='gsea'?'FDR 字段':'颜色数值字段')}{(c.scatterSizeEnabled||mode==='bubble')&&field('sizeField','大小数值字段')}{field('labelField','标签字段')}<p className="help">{t('下载代码包含示例数据与绘图逻辑，替换数组并保留映射字段即可使用。')}</p></>;
}
export function ScatterControls(){
 useLocale();
 const {config:c,data,setConfig}=useBuilder();const mode=c.scatterVariant,cat=['bubble','paired','gsea'].includes(mode),three=mode==='3d';
 const set=(key:keyof Config,value:unknown)=>setConfig({[key]:value});
 const toggle=(key:keyof Config,label:string)=><label className="toggle"><span>{t(label)}</span><input type="checkbox" checked={Boolean(c[key])} onChange={e=>set(key,e.target.checked)}/><span className="switch" aria-hidden="true"/></label>;
 const slider=(key:keyof Config,label:string,min:number,max:number,step=1)=><label className="field"><span>{t(label)}</span><div className="range-row"><input type="range" aria-label={t(label)} min={min} max={max} step={step} value={Number(c[key])} onChange={e=>set(key,+e.target.value)}/><output>{String(c[key])}</output></div></label>;
 const select=(key:keyof Config,label:string,options:[string,string][])=><label className="field"><span>{t(label)}</span><Select value={String(c[key])} onChange={e=>set(key,e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{t(l)}</option>)}</Select></label>;
 const text=(key:keyof Config,label:string)=><label className="field"><span>{t(label)}</span><input type="text" value={String(c[key])} onChange={e=>set(key,e.target.value)}/></label>;
 const field=(key:keyof Config,label:string)=>select(key,label,Object.keys(data[0]??{}).map(f=>[f,f]));
 const color=(key:keyof Config,label:string)=><div className="field"><span>{t(label)}</span><ColorPicker label={t(label)} value={String(c[key])} onChange={value=>set(key,value)}/></div>;
 const optional=(label:string,children:ReactNode)=><details className="advanced-group"><summary><span>{t(label)}</span><small>{t('按需开启')}</small></summary><div className="advanced-group-body">{children}</div></details>;
 return <><section><h3>{t('点样式')}</h3>{slider('radius','点半径',1,24,.5)}{slider('opacity','透明度',.1,1,.05)}{!c.continuousColor&&color('color','主色')}{!c.continuousColor&&color('secondaryColor','第二颜色')}{!three&&mode!=='gsea'&&select('pointShape','点形状',[['circle','圆形'],['square','方形'],['triangle','三角形'],['diamond','菱形'],['star','星形'],['cross','十字']])}{mode==='density'&&toggle('showPoints','显示观测点')}{mode==='color'||three?<>{toggle('continuousColor','连续颜色映射')}{c.continuousColor&&field('colorField','颜色数值字段')}</>:null}</section>
 {['joint','regression','fit','correlation','color'].includes(mode)&&<section><h3>{t('拟合与相关性')}</h3>{mode==='correlation'&&select('correlationMethod','相关方法',[['pearson','Pearson'],['spearman','Spearman']])}{toggle('fitEnabled','显示拟合曲线')}{c.fitEnabled&&<>{select('fitModel','拟合模型',[['linear','线性回归'],['quadratic','二次回归']])}{toggle('fitByGroup','按组拟合')}{slider('lineWidth','线宽',1,6,.5)}{optional('置信带',<>{toggle('confidenceBand','显示 95% 置信带')}<p className="help">{t('固定种子的 200 次配对重采样估计平均曲线的逐点置信带，不是预测区间。')}</p></>)}</>}</section>}
 {mode==='fold'&&<section><h3>{t('倍数变化')}</h3>{slider('foldRatio','倍数阈值',1.1,8,.1)}{toggle('foldLog','输入已取 log2')}{color('upColor','升高颜色')}{color('downColor','降低颜色')}{color('neutralColor','稳定颜色')}</section>}
 {mode==='rank'&&<section><h3>{t('排序')}</h3>{toggle('rankDescending','降序排列')}</section>}
 {mode==='marginal'&&<section><h3>{t('边缘分布')}</h3>{select('marginalType','分布类型',[['histogram','直方图'],['density','密度曲线'],['box','箱线图']])}{c.marginalType==='histogram'?slider('binCount','分箱数量',3,30):c.marginalType==='density'?slider('densityBandwidth','平滑带宽',5,60):null}</section>}
 {mode==='density'&&<section><h3>{t('密度估计')}</h3>{slider('densityBandwidth','平滑带宽',5,60)}{slider('densityLevels','密度层级',3,25)}</section>}
 {mode==='gsea'&&<section><h3>{t('FDR 标注')}</h3>{toggle('showThreshold','显示 FDR 阈值')}{slider('pThreshold','FDR 阈值',.001,.2,.001)}{color('significantColor','FDR 点颜色')}</section>}
 {three&&<section><h3>{t('三维视角')}</h3>{slider('rotationX','俯仰角',-80,80)}{slider('rotationY','旋转角',-180,180)}{slider('perspective','透视距离',2,8,.1)}{toggle('rotationEnabled','允许拖动旋转')}<p className="help">{t('拖动旋转，开启缩放后滚轮缩放，双击恢复配置视角。')}</p></section>}
 <section><h3>{t('坐标与辅助线')}</h3>{toggle('xAxis','X 轴')}{toggle('yAxis','Y 轴')}{three&&toggle('zAxis','Z 轴')}{toggle('grid','网格')}{mode!=='gsea'&&toggle('legend','图例')}{!cat&&!three&&<>{select('xScale','X 比例尺',[['linear','Linear · 线性'],['log','Log · 对数']])}{select('yScale','Y 比例尺',[['linear','Linear · 线性'],['log','Log · 对数']])}</>}</section>
 <section><h3>{t('信息与交互')}</h3>{toggle('tooltip','Tooltip · 悬浮提示')}{c.tooltip&&<fieldset className="tooltip-fields"><legend>{t('提示字段')}</legend>{Object.keys(data[0]??{}).map(f=><label key={f}><input type="checkbox" checked={c.tooltipFields.includes(f)} onChange={e=>set('tooltipFields',e.target.checked?[...c.tooltipFields,f]:c.tooltipFields.filter(k=>k!==f))}/>{f}</label>)}</fieldset>}{mode!=='gsea'&&toggle('labels','数据标签')}{c.labels&&slider('labelLimit','最多标注数量',1,36)}{!cat&&toggle('zoom',three?'缩放':'缩放与平移')}</section>
 {mode!=='gsea'&&mode!=='bubble'&&optional('数值映射点大小',<>{toggle('scatterSizeEnabled','启用数值映射点大小')}{c.scatterSizeEnabled&&<>{field('sizeField','大小数值字段')}{slider('sizeMin','最小半径',0,10)}{slider('sizeMax','最大半径',10,30)}</>}</>)}
 {!three&&mode!=='gsea'&&optional('点边框',<>{toggle('markBorder','启用点边框')}{c.markBorder&&<>{color('borderColor','边框颜色')}{slider('borderWidth','边框宽度',.5,4,.5)}</>}</>)}
 {!three&&optional('坐标轴样式',<>{toggle('axisStyle','启用坐标轴样式')}{c.axisStyle&&<>{text('xTitle','X 轴标题')}{text('yTitle','Y 轴标题')}{slider('tickFontSize','刻度字号',9,20)}{!cat&&slider('xTickAngle','X 轴标签角度',-60,60)}{slider('xTickCount','X 轴刻度数量',2,12)}{slider('yTickCount','Y 轴刻度数量',2,12)}</>}</>)}
 {!three&&!cat&&optional('坐标轴范围',<>{toggle('xDomainEnabled','自定义 X 范围')}{c.xDomainEnabled&&<Bounds minKey="xMin" maxKey="xMax" positive={c.xScale==='log'}/>}{toggle('yDomainEnabled','自定义 Y 范围')}{c.yDomainEnabled&&<Bounds minKey="yMin" maxKey="yMax" positive={c.yScale==='log'}/>}</>)}
 {optional('网格样式',<>{toggle('gridStyle','启用网格样式')}{c.gridStyle&&<>{color('gridColor','网格颜色')}{slider('gridWidth','网格线宽',.5,3,.5)}{slider('gridOpacity','网格透明度',.1,1,.1)}</>}</>)}
 {(c.continuousColor||mode==='bubble')&&<section><h3>{t('连续配色')}</h3>{select('scatterPalette','配色方案',[['viridis','Viridis'],['turbo','Turbo'],['blues','Blues']])}</section>}
 <section><h3>{t('画布')}</h3>{(['width','height'] as const).map(key=><label key={key} className="field"><span>{t(key==='width'?'宽度':'高度')}</span><input type="number" min={key==='width'?400:280} max={key==='width'?1600:1000} step="20" value={c[key]} onChange={e=>{const v=+e.target.value;if(Number.isFinite(v)&&v>=(key==='width'?400:280)&&v<=(key==='width'?1600:1000))set(key,v);}}/></label>)}{color('background','背景颜色')}</section>
 </>;
}
