import { schemeTableau10, schemeCategory10, schemePaired } from 'd3';
import { softCompositionPalette } from './compositionModel';
import { useBuilder } from './store';
import { Select } from './Select';
import { ColorPicker } from './ColorPicker';
import { t, useLocale } from './i18n';
import type { Config } from './model';
import type { ReactNode } from 'react';

export function CompositionFields(){
  useLocale();const {type,config:c,data,setConfig}=useBuilder();
  const fields=Object.keys(data[0]??{});
  function field(key:keyof Config,label:string){return <label className="field"><span>{t(label)}</span><Select value={String(c[key])} onChange={e=>setConfig({[key]:e.target.value})}>{fields.map(name=><option key={name} value={name}>{name}</option>)}</Select></label>;}
  return <>{(type==='nested-pie'||type==='pie-bar')&&field('parentField','父分类字段')}{type==='pie-matrix'&&<>{field('matrixRowField','矩阵行分组')}{field('matrixColumnField','矩阵列分组')}</>}{type==='bar-pie'&&field('sampleField','样本分组字段')}{field('categoryField',type==='nested-pie'||type==='pie-bar'?'子分类字段':'分类字段')}{field('valueField','数值字段')}</>;
}
export function CompositionNotes(){
  useLocale();const type=useBuilder(s=>s.type);
  return <section><h3>{t('组成统计')}</h3><p className="help">{t('输入非负数值，重复分类求和；零值保留，负值与无效行跳过。占比以当前分组的数值总和计算。')}</p>{(type==='nested-pie'||type==='pie-bar')&&<p className="help">{t('每行表示父分类下的一个子分类数值，父分类总量由子分类求和；同名子分类在不同父分类下分别计算。')}</p>}{type==='pie-matrix'&&<p className="help">{t('每行包含行分组、列分组、分类和数值；每个格子的饼图独立归一化，空组合留白。')}</p>}{type==='bar-pie'&&<p className="help">{t('每行包含样本、分类和数值；柱高表示样本总量，饼图表示该样本内部占比。')}</p>}{type==='waffle'&&<p className="help">{t('固定数量的单元按最大余数法分配，单元显示为近似比例，提示保留真实数值与占比。')}</p>}</section>;
}
export function CompositionControls(){
  useLocale();const {type,config:c,data,setConfig}=useBuilder();
  const set=(key:keyof Config,value:unknown)=>setConfig({[key]:value});
  const radial=type!=='waffle';
  const field=(label:string,children:ReactNode)=><label className="field" key={label}><span>{t(label)}</span>{children}</label>;
  function number(key:keyof Config,label:string,min:number,max:number,step=1){return field(label,<div className="range-row"><input type="range" aria-label={t(label)} min={min} max={max} step={step} value={Number(c[key])} onChange={e=>set(key,+e.target.value)}/><output>{String(c[key])}</output></div>);}
  function toggle(key:keyof Config,label:string){return <label className="toggle"><span>{t(label)}</span><input type="checkbox" checked={Boolean(c[key])} onChange={e=>{
      const checked=e.target.checked,patch:Partial<Config>={[key]:checked};
      if(checked&&(key==='labelStyle'||key==='compositionLabelStyle'))patch.labels=true;
      if(checked&&key==='legendStyle')patch.legend=true;
      setConfig(patch);
    }}/><span className="switch" aria-hidden="true"/></label>;}
  function select(key:keyof Config,label:string,options:[string,string][],raw=false){return field(label,<Select value={String(c[key])} onChange={e=>set(key,e.target.value)}>{options.map(([value,label])=><option key={value} value={value}>{raw?label:t(label)}</option>)}</Select>);}
  function color(key:keyof Config,label:string){return <div className="field"><span>{t(label)}</span><ColorPicker label={t(label)} value={String(c[key])} onChange={value=>set(key,value)}/></div>;}
  function advanced(label:string,flag:keyof Config,children:ReactNode,hint?:string){return <details className="advanced-group"><summary><span>{t(label)}</span><small className={c[flag]?'is-enabled':''}>{t(c[flag]?'已启用':'按需开启')}</small></summary><div className="advanced-group-body">{toggle(flag,t('启用{feature}',{feature:t(label)}))}{hint&&<p className="help">{t(hint)}</p>}{Boolean(c[flag])&&children}</div></details>;}
  const palette=c.compositionPalette==='soft'?softCompositionPalette:c.compositionPalette==='category10'?schemeCategory10:c.compositionPalette==='paired'?schemePaired:schemeTableau10;
  const colorField=type==='nested-pie'||type==='pie-bar'?c.parentField:c.categoryField;
  const colorNames=[...new Set(data.map(row=>String(row[colorField]??'')).filter(Boolean))];
  const parents=[...new Set(data.map(row=>String(row[c.parentField]??'')).filter(Boolean))];
  return <>
    <section><h3>{t('组成样式')}</h3>
      {radial&&<>{select('pieMode','图形形式',[['pie','饼图'],['donut','环图'],['fan','扇形图']])}{c.pieMode!=='pie'&&number('holeRatio','内孔比例',.1,.7,.05)}</>}
      {type==='waffle'&&<>{select('waffleShape','单元形状',[['square','方格'],['circle','圆点'],['person','人物图标']])}{number('waffleRows','单元行数',2,20)}{number('waffleColumns','单元列数',2,20)}{number('waffleGap','单元间距',0,8,.5)}</>}
      {select('compositionPalette','分类配色',[['soft','柔和色板'],['tableau','Tableau'],['category10','Category 10'],['paired','Paired']])}{select('compositionOrder','分类数值排序',[['input','数据顺序'],['ascending','升序'],['descending','降序']])}
      {number('opacity','透明度',.1,1,.05)}
      {type==='pie-matrix'&&number('matrixGap','格内留白',12,50)}
      {type==='nested-pie'&&number('ringGap','两层间距',0,10,.5)}
      {type==='pie-bar'&&<>{select('splitCategory','展开父分类',[['',t('自动选择首个分类')],...parents.map(name=>[name,name] as [string,string])],true)}<p className="help">{t('条形显示所选父分类的子分类数值，条形占比相对于该父分类。')}</p></>}
      {(type==='pie-bar'||type==='bar-pie')&&number('compositionBarGap','条形间距',.1,.6,.05)}
      {type==='bar-pie'&&color('color','柱形颜色')}
    </section>
    <section><h3>{t('信息与交互')}</h3>{toggle('legend','图例')}{toggle('tooltip','Tooltip · 悬浮提示')}{toggle('labels',type==='waffle'?'比例摘要':'扇区标签')}<p className="help">{t('提示显示汇总后的数值与占比，不使用单条原始记录。')}</p>{type==='nested-pie'&&<p className="help">{t('内层表示父分类在总量中的占比，外层角度延续父分类；外层标签与提示中的百分比相对于所属父分类。')}</p>}</section>
    <section><h3>{t('画布')}</h3><div className="dimension-fields">{(['width','height'] as const).map(key=>field(key==='width'?'宽度':'高度',<input key={key} type="number" min={key==='width'?400:280} max={key==='width'?1600:1000} step={20} value={c[key]} onChange={e=>{const value=+e.target.value;if(value>=(key==='width'?400:280)&&value<=(key==='width'?1600:1000))set(key,value);}}/>))}</div></section>
    <section className="advanced-settings"><h3>{t('高级配置')}</h3><p className="advanced-intro">{t('展开查看适用于当前图形的选项，新增效果默认关闭。')}</p>
      {advanced('弧形与圆角','arcStyle',<>{radial?<>{number('startAngle','起始角度',-180,180,5)}{number('sweepAngle','扇形总角度',30,360,5)}{number('arcGap','扇区间隙',0,.1,.005)}</>:null}{number('arcCorner',radial?'扇区圆角':'单元圆角',0,12)}</>,radial?'启用后使用指定角度，覆盖基础图形的默认角度。':undefined)}
      {advanced('自定义分类颜色','categoryColorsEnabled',<>{colorNames.map((name,index)=><div className="field" key={name}><span>{name}</span><ColorPicker label={name} value={Object.prototype.hasOwnProperty.call(c.categoryColors,name)?c.categoryColors[name]:palette[index%palette.length]} onChange={value=>setConfig({categoryColors:{...c.categoryColors,[name]:value}})}/></div>)}</>,'未单独设置的分类沿用所选配色；层级图按父分类配色。')}
      {advanced('边框样式','markBorder',<>{color('borderColor','边框颜色')}{number('borderWidth','边框宽度',.5,5,.5)}</>)}
      {radial&&advanced('扇区标签设置','compositionLabelStyle',<>{select('labelContent','标签内容',[['category','分类名'],['percent','占比'],['both','分类名与占比']])}{type==='pie'&&select('labelPlacement','标签位置',[['inside','内部'],['outside','外部引线']])}{type==='pie'&&c.labelPlacement==='outside'&&toggle('leaderLines','标签引线')}{number('labelMinPercent','最小标注占比',0,20)}</>,'启用时同时开启扇区标签；小扇区可通过最小占比隐藏标签。')}
      {advanced('标签样式','labelStyle',<>{number('labelFontSize','标签字号',9,24)}{color('labelColor','标签颜色')}{number('labelOffsetX','标签水平偏移',-20,20)}{number('labelOffsetY','标签垂直偏移',-20,20)}{select('valueFormat','标签数值格式',[['.3~g','自动'],['.2f','两位小数'],['.2~s','紧凑单位']])}</>)}
      {type==='pie'&&c.pieMode!=='pie'&&advanced('中心文字','centerTextEnabled',field('中心文字内容',<input type="text" maxLength={60} value={c.centerText} onChange={e=>set('centerText',e.target.value)}/>),'留空时显示数值总量。')}
      {advanced('图例样式','legendStyle',<>{select('legendPosition','图例位置',[['top','顶部'],['bottom','底部']])}{select('legendDirection','图例排列',[['row','横向换行'],['column','纵向']])}{number('legendFontSize','图例字号',9,20)}{number('legendGap','图例间距',4,24)}{number('legendMaxItems','最多图例项',1,20)}{number('legendLabelLength','图例文字长度',6,40)}</>,'启用时同时开启图例；限制显示数量不影响数据或图形。')}
      {advanced('画布与留白','canvasStyle',<>{color('background','画布背景')}{number('marginTop','顶部留白',0,180)}{number('marginRight','右侧留白',0,180)}{number('marginBottom','底部留白',0,180)}{number('marginLeft','左侧留白',0,180)}</>)}
    </section>
  </>;
}
