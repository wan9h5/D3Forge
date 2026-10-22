import type { ReactNode } from 'react';
import type { Config } from './model';
import { useBuilder } from './store';
import { Select } from './Select';
import { ColorPicker } from './ColorPicker';
import { Bounds } from './AdvancedControls';
import { t, useLocale } from './i18n';
function useControls(){
 useLocale();const {config:c,data,setConfig}=useBuilder(),fields=Object.keys(data[0]??{});
 const set=(key:keyof Config,value:unknown)=>setConfig({[key]:value});
 const toggle=(key:keyof Config,label:string)=><label className="toggle"><span>{t(label)}</span><input type="checkbox" checked={Boolean(c[key])} onChange={e=>set(key,e.target.checked)}/><span className="switch" aria-hidden="true"/></label>;
 const range=(key:keyof Config,label:string,min:number,max:number,step=1)=><label className="field"><span>{t(label)}</span><div className="range-row"><input type="range" aria-label={t(label)} min={min} max={max} step={step} value={Number(c[key])} onChange={e=>set(key,+e.target.value)}/><output>{String(c[key])}</output></div></label>;
 const select=(key:keyof Config,label:string,options:[string,string][])=><label className="field"><span>{t(label)}</span><Select aria-label={t(label)} value={String(c[key])} onChange={e=>set(key,e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{t(l)}</option>)}</Select></label>;
 const field=(key:keyof Config,label:string,optional=false)=>select(key,label,[...(optional?[['','不使用'] as [string,string]]:[]),...fields.map(f=>[f,f] as [string,string])]);
 const text=(key:keyof Config,label:string)=><label className="field"><span>{t(label)}</span><input value={String(c[key])} onChange={e=>set(key,e.target.value)}/></label>;
 const color=(key:keyof Config,label:string)=><div className="field"><span>{t(label)}</span><ColorPicker showPalette={key==='color'} label={t(label)} value={String(c[key])} onChange={v=>set(key,v)}/></div>;
 const group=(label:string,enabled:boolean,children:ReactNode)=><details className="advanced-group"><summary><span>{t(label)}</span><small className={enabled?'is-enabled':''}>{t(enabled?'已启用':'按需开启')}</small></summary><div className="advanced-group-body">{children}</div></details>;
 const tracks=(key:'heatmapRowFields'|'heatmapColumnFields')=><fieldset className="tooltip-fields"><legend>{t('选择注释字段（最多 6 个）')}</legend><div className="tooltip-options">{fields.map(f=><label key={f}><input type="checkbox" checked={c[key].split(',').includes(f)} onChange={e=>{const items=c[key].split(',').filter(Boolean);set(key,e.target.checked?[...items,f].slice(0,6).join(','):items.filter(d=>d!==f).join(','));}}/>{f}</label>)}</div></fieldset>;
 return {c,data,set,toggle,range,select,field,text,color,group,tracks};
}
export function HeatmapFields(){
 const {c,field}=useControls();const mode=c.heatmapVariant;
 return <>{mode==='calendar'?field('heatmapDateField','日期字段（YYYY-MM-DD）'):<>{field('xField','列分类字段')}{field('yField','行分类字段')}</>}{field('valueField','颜色数值字段')}{c.heatmapDualTriangle&&field('heatmapSecondField','第二三角数值字段')}{c.heatmapSize&&field('heatmapSizeField','面积数值字段')}{c.heatmapMarks&&field('heatmapMarkField','文字标记字段')}{mode==='split'&&field('heatmapSplitField','左右分组字段')}{(c.heatmapTerms||mode==='sankey')&&field('heatmapTermField','通路 / 分类字段')}<p className="help">{t(mode==='calendar'?'日期使用严格 YYYY-MM-DD，重复日期汇总，未观测日期留空。':'使用长表：列分类、行分类、数值；附加字段用于注释或组合图。缺失单元格不补零。')}</p></>;
}
export function HeatmapControls(){
 const {c,data,set,toggle,range,select,field,text,color,group,tracks}=useControls();const mode=c.heatmapVariant,calendar=mode==='calendar',circular=mode==='circular';
 const cohorts=Array.from(new Set(data.map(d=>String(d[c.heatmapSplitField]??'')).filter(Boolean)));
 return <>
  <section><h3>{t('矩阵与颜色')}</h3>{select('heatmapAggregate','重复坐标处理',[['mean','均值'],['sum','求和']])}{!calendar&&<>{select('heatmapNormalize','标准化',[['none','不标准化'],['row','按行 Z-score'],['column','按列 Z-score']])}<p className="help">{t('Z-score 使用总体标准差；常量向量为零，缺失值不参与计算。')}</p></>}{select('heatmapPalette','配色方式',[['sequential','双色渐变'],['diverging','以零为中心']])}{color('secondaryColor','低值颜色')}{color('color','高值颜色')}{color('heatmapMissing','缺失颜色')}{toggle('legend','图例')}{toggle('tooltip','Tooltip · 悬浮提示')}</section>
  {!calendar&&group('层次聚类',c.heatmapRowCluster||c.heatmapColumnCluster||c.heatmapCutEnabled||c.heatmapTrend,<>{toggle('heatmapRowCluster','行聚类')}{!circular&&toggle('heatmapColumnCluster','列聚类')}{select('heatmapDistance','距离度量',[['euclidean','欧氏距离'],['manhattan','曼哈顿距离'],['correlation','1 − Pearson 相关']])}{select('heatmapLinkage','连接方法',[['average','平均连接'],['single','单连接'],['complete','完全连接']])}{toggle('heatmapDendrogram','显示聚类树')}{!circular&&<>{toggle('heatmapCutEnabled','显示聚类切割')}{(c.heatmapCutEnabled||c.heatmapTrend)&&range('heatmapCut','聚类簇数',1,10)}</>}<p className="help">{t('距离仅使用共同观测；无共同值的分支最后连接。切割与趋势会使用聚类行顺序。')}</p></>)}
  {calendar?<section><h3>{t('日历布局')}</h3>{field('heatmapDateField','日期字段（YYYY-MM-DD）')}{select('heatmapWeekStart','每周开始',[['monday','星期一'],['sunday','星期日']])}{select('heatmapCalendarYear','年份',[['','全部年份'],...Array.from(new Set(data.map(d=>String(d[c.heatmapDateField]??'').slice(0,4)).filter(d=>/^\d{4}$/.test(d)))).sort().map(d=>[d,d] as [string,string])])}</section>:circular?<section><h3>{t('圆形布局')}</h3>{range('heatmapInnerRadius','内半径比例',.15,.7,.05)}{range('heatmapStartAngle','起始角度',0,90,5)}{range('heatmapEndAngle','结束角度',180,355,5)}</section>:<section><h3>{t('单元格样式')}</h3>{range('cellGap','单元格间距',0,8,.5)}{range('cellRadius','单元格圆角',0,10)}{range('opacity','透明度',.1,1,.05)}{toggle('grid','单元格边框')}{!['triangle','dot'].includes(mode)&&select('heatmapShape','单元格形状',[['rect','矩形'],['circle','圆形'],['triangle','三角形'],['diamond','菱形']])}{['matrix','triangle','shape','dot'].includes(mode)&&<>{select('heatmapTriangle','矩阵区域',[['full','完整矩阵'],['upper','上三角'],['lower','下三角']])}<p className="help">{t('上下三角要求行列分类名称相同；筛选依据原始分类对应关系。')}</p></>}{mode==='triangle'&&<>{toggle('heatmapDualTriangle','每格双三角')}{c.heatmapDualTriangle&&field('heatmapSecondField','第二三角数值字段')}</>}{toggle('labels','数值标签')}{group('文字标记',c.heatmapMarks,<>{toggle('heatmapMarks','显示输入文字标记')}{c.heatmapMarks&&field('heatmapMarkField','文字标记字段')}<p className="help">{t('标记直接来自输入，不执行显著性检验。')}</p></>)}{(mode==='dot'||mode==='shape')&&group('面积映射',c.heatmapSize,<>{toggle('heatmapSize','按数值映射面积')}{c.heatmapSize&&field('heatmapSizeField','面积数值字段')}<p className="help">{t('大小取非负输入的均值，点面积与大小成正比；无效大小不绘点。')}</p></>)}</section>}
  {!calendar&&!circular&&<>{group('行列注释',c.heatmapRowAnnotations||c.heatmapColumnAnnotations,<>{toggle('heatmapRowAnnotations','启用行注释')}{c.heatmapRowAnnotations&&tracks('heatmapRowFields')}{toggle('heatmapColumnAnnotations','启用列注释')}{c.heatmapColumnAnnotations&&tracks('heatmapColumnFields')}<p className="help">{t('分类使用离散色，数值使用连续色；冲突注释显示 mixed，悬浮查看完整图例。')}</p></>)}{group('部分基因标签',c.heatmapPartialLabels,<>{toggle('heatmapPartialLabels','仅标注部分基因')}{text('heatmapGeneList','基因名单（逗号分隔）')}{range('heatmapLabelLimit','最多行标签',1,40)}<p className="help">{t('名单为空时按原始行方差选标签，全部行数据仍保留。')}</p></>)}{!['split','sankey'].includes(mode)&&<>{group('行数值摘要',c.heatmapBar,<>{toggle('heatmapBar','启用右侧摘要柱')}{c.heatmapBar&&select('heatmapSummary','摘要统计',[['mean','均值'],['sum','求和']])}<p className="help">{t('摘要使用当前标准化后的观测值；与趋势面板互斥。')}</p></>)}{group('趋势与通路注释',c.heatmapTrend,<>{toggle('heatmapTrend','启用趋势面板')}{c.heatmapTrend&&<>{range('heatmapCut','聚类簇数',1,10)}{toggle('heatmapTrendMeans','显示簇均值')}{toggle('heatmapTrendPoints','显示均值点')}{range('lineWidth','线宽',1,5,.5)}{toggle('heatmapTerms','显示输入通路注释')}{c.heatmapTerms&&<>{field('heatmapTermField','通路 / 分类字段')}{range('heatmapTermLimit','最多通路项',1,15)}</>}<p className="help">{t('列顺序就是趋势顺序，时间序列不要启用列聚类。通路仅展示已有注释。')}</p></>}</>)}</>}{mode==='split'&&<section><h3>{t('左右组合')}</h3>{field('heatmapSplitField','左右分组字段')}{select('heatmapSplitA','左侧分组',[['','自动选择'],...cohorts.map(d=>[d,d] as [string,string])])}{select('heatmapSplitB','右侧分组',[['','自动选择'],...cohorts.map(d=>[d,d] as [string,string])])}{range('heatmapSplitGap','面板间距',8,60,2)}{c.heatmapSplitA&&c.heatmapSplitA===c.heatmapSplitB&&<p className="help">{t('选择两个不同分组；相同分组只显示一次。')}</p>}</section>}{mode==='sankey'&&<section><h3>{t('桑基关联')}</h3>{field('heatmapTermField','通路 / 分类字段')}{field('heatmapSankeyWeight','链接权重字段',true)}<p className="help">{t('注释以分号分隔并按行去重；不选权重时每个关联计 1，选择后使用非负权重均值。')}</p></section>}</>}
  <section><h3>{t('标签与画布')}</h3>{toggle('xAxis',calendar?'月份标签':circular?'圆环标签':'列标签')}{toggle('yAxis',calendar?'星期标签':'行标签')}{range('heatmapFontSize','文字大小',8,18)}{!calendar&&!circular&&select('rowOrder','未聚类行顺序',[['input','输入顺序'],['ascending','升序'],['descending','降序']])}{!calendar&&!circular&&select('columnOrder','未聚类列顺序',[['input','输入顺序'],['ascending','升序'],['descending','降序']])}{(['width','height'] as const).map(key=><label className="field" key={key}><span>{t(key==='width'?'宽度':'高度')}</span><input type="number" min={key==='width'?400:280} max={key==='width'?1600:1400} step="20" value={c[key]} onChange={e=>{const v=+e.target.value;if(Number.isFinite(v)&&v>=(key==='width'?400:280)&&v<=(key==='width'?1600:1400))set(key,v);}}/></label>)}</section>
  {group('颜色范围与样式',c.colorDomainEnabled||c.canvasStyle||c.gridStyle||c.labelStyle,
    <>
      {toggle('colorDomainEnabled','自定义颜色范围')}
      {c.colorDomainEnabled&&<Bounds minKey="colorMin" maxKey="colorMax"/>}
      {text('heatmapLegendTitle','颜色图例标题')}
      {toggle('canvasStyle','启用背景样式')}
      {c.canvasStyle&&color('background','背景颜色')}
      {!calendar&&!circular&&<>
        {toggle('gridStyle','启用网格样式')}
        {c.gridStyle&&<>{color('gridColor','网格颜色')}{range('gridWidth','网格线宽',.5,3,.5)}{range('gridOpacity','网格透明度',.1,1,.1)}</>}
        {toggle('labelStyle','启用标签样式')}
        {c.labelStyle&&<>{color('labelColor','标签颜色')}{range('labelFontSize','标签字号',8,18)}</>}
      </>}
    </>
  )}
 </>;
}
