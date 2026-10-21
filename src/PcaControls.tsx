import Papa from 'papaparse';
import type { Config } from './model';
import { useBuilder } from './store';
import { useLocale } from './i18n';
import { Select } from './Select';
import { ColorPicker } from './ColorPicker';
import { pcaMock } from './scatterModel';

function usePcaControls(){
 const {config:c,data,setConfig}=useBuilder();
 const locale=useLocale();
 const text=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
 const set=(key:keyof Config,value:unknown)=>setConfig({[key]:value});
 const number=(key:keyof Config,label:string,min:number,max:number,step:number)=><label className="field"><span>{label}</span><input type="number" min={min} max={max} step={step} value={Number(c[key])} onChange={event=>{const value=+event.target.value;if(event.target.value!==''&&Number.isFinite(value)&&value>=min&&value<=max)set(key,value);}}/></label>;
 const toggle=(key:keyof Config,label:string)=><label className="toggle"><span>{label}</span><input type="checkbox" checked={Boolean(c[key])} onChange={event=>set(key,event.target.checked)}/><span className="switch" aria-hidden="true"/></label>;
 const slider=(key:keyof Config,label:string,min:number,max:number,step:number)=><label className="field"><span>{label}</span><div className="range-row"><input aria-label={label} type="range" min={min} max={max} step={step} value={Number(c[key])} onChange={event=>set(key,+event.target.value)}/><output>{String(c[key])}</output></div></label>;
 const color=(key:keyof Config,label:string)=><div className="field"><span>{label}</span><ColorPicker label={label} value={String(c[key])} onChange={value=>set(key,value)}/></div>;
 return {c,data,text,set,number,toggle,slider,color};
}

export function PcaFields(){
 const {c,data,text,set}=usePcaControls();
 const fields=Array.from(new Set(data.flatMap(row=>Object.keys(row))));
 const field=(key:keyof Config,label:string,optional=false)=><label className="field"><span>{label}</span><Select aria-label={label} value={String(c[key])} onChange={event=>set(key,event.target.value)}><option value="" disabled={!optional}>{optional?text('不使用','Not used','使用しない'):text('请选择字段','Select field','フィールドを選択')}</option>{fields.map(name=><option key={name} value={name}>{name}</option>)}</Select></label>;
 const download=()=>{
  const url=URL.createObjectURL(new Blob(['\uFEFF',Papa.unparse(pcaMock(c.scatterVariant),{newline:'\r\n',escapeFormulae:true})],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`d3forge-${c.scatterVariant==='3d'?'pca-3d':c.scatterVariant}-example.csv`;document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return <>
  {field('xField',text('横轴主成分得分','Horizontal component score','横軸の主成分スコア'))}
  {field('yField',text('纵轴主成分得分','Vertical component score','縦軸の主成分スコア'))}
  {c.scatterVariant==='3d'&&field('zField',text('第三主成分得分','Third component score','第3主成分スコア'))}
  {field('groupField',text('样本分组','Sample group','サンプル群'),true)}
  {field('labelField',text('样本 / 变量名称','Sample / variable name','サンプル・変数名'),true)}
  {c.scatterVariant==='pca-biplot'&&<>
   {field('pcaRowTypeField',text('记录类型字段','Record-type field','レコード種類フィールド'))}
   {(['pcaSampleType','pcaLoadingType'] as const).map(key=><label className="field" key={key}><span>{key==='pcaSampleType'?text('样本行的类型值','Sample-row type value','サンプル行の種類値'):text('载荷行的类型值','Loading-row type value','負荷量行の種類値')}</span><input type="text" value={c[key]} onChange={event=>{if(event.target.value!==c[key==='pcaSampleType'?'pcaLoadingType':'pcaSampleType'])set(key,event.target.value);}}/></label>)}
   <p className="help">{text('同一 CSV 同时存放 sample 样本行和 loading 载荷行。两类记录使用相同坐标列，载荷的分组列可留空；请使用同一 PCA 分析及兼容缩放方式的结果。','Use sample and loading rows in one CSV with shared coordinate columns. Loading groups may be blank. Scores and loadings must come from one PCA with compatible scaling.','同じ CSV に sample と loading 行を置き、座標列を共用します。負荷量の群列は空欄でも構いません。同一 PCA・互換尺度の結果を使用してください。')}</p>
  </>}
  {c.scatterVariant==='pca-biplot'&&<p className="help">{text('默认示例：UCI Wine，178 个样本、13 个变量。各列中心化并除以样本标准差，SVD 得分配合相关载荷；类别保留原始编号。','Default example: UCI Wine, 178 samples and 13 variables. Columns are centered and scaled by sample SD; SVD scores are paired with correlation loadings. Original class IDs are retained.','既定例：UCI Wine、178標本・13変数。列を中心化し標本標準偏差で尺度化し、SVDスコアと相関負荷量を使用します。元のクラス番号を保持します。')} <a href="https://doi.org/10.24432/C5PC7J" target="_blank" rel="noreferrer">UCI Wine · CC BY 4.0</a></p>}
  <p className="help">{text('导入已计算的 PCA 得分，不在浏览器中对表达矩阵做 PCA。二维分组图、凸包及三维图使用模拟数据；双标图使用 UCI Wine 实际 PCA 结果。导入数据后解释率标签会关闭，请填写自己结果的解释率后再开启。','Import existing PCA scores; raw matrices are not decomposed in the browser. Score, hull and 3D examples are synthetic; the biplot uses actual UCI Wine PCA results. Import disables variance labels; enter your own percentages before re-enabling them.','計算済み PCA スコアを入力します。ブラウザで元行列の PCA は行いません。スコア・凸包・3次元例は模擬データで、バイプロットはUCI WineのPCA結果です。入力時に寄与率ラベルを無効化します。自分の値を入力して再度有効化してください。')}</p>
  <button type="button" className="quiet bio-sample-download" onClick={download}>{text('下载 PCA 示例 CSV','Download PCA example CSV','PCA サンプル CSV をダウンロード')}</button>
 </>;
}

export function PcaAxisControls(){
 const {c,text,toggle,number}=usePcaControls();
 return <section><h3>{text('主成分解释率','Explained variance','主成分寄与率')}</h3>
  {toggle('pcaShowVariance',text('在轴标题显示解释率','Show percentages in axis titles','軸ラベルに寄与率を表示'))}
  {c.pcaShowVariance&&<>{number('pcaVariance1',text('横轴解释率（%）','Horizontal variance (%)','横軸寄与率（%）'),0,100,.1)}{number('pcaVariance2',text('纵轴解释率（%）','Vertical variance (%)','縦軸寄与率（%）'),0,100,.1)}{c.scatterVariant==='3d'&&number('pcaVariance3',text('第三轴解释率（%）','Third-axis variance (%)','第3軸寄与率（%）'),0,100,.1)}</>}
  <p className="help">{text('填写上游 PCA 输出的解释率，不从已投影的坐标重新估算。','Use variance percentages from the upstream PCA output; they are not re-estimated from projected scores.','元の PCA 出力の寄与率を入力し、投影済みスコアから再推定しません。')}</p>
 </section>;
}

export function PcaControls(){
 const {c,text,set,toggle,number,slider,color}=usePcaControls();
 return <>
  <section><h3>{text('样本与分组','Samples and groups','サンプルと群')}</h3>{slider('radius',text('点半径','Point radius','点の半径'),1,12,.5)}{slider('opacity',text('透明度','Opacity','不透明度'),.1,1,.05)}{color('color',text('主色','Primary color','主色'))}{color('secondaryColor',text('第二分组颜色','Second group color','第2群の色'))}{color('pcaThirdColor',text('第三分组颜色','Third group color','第3群の色'))}
   <label className="field"><span>{text('分组边界','Group envelope','群の囲み')}</span><Select value={c.pcaEnvelope} onChange={event=>set('pcaEnvelope',event.target.value)}><option value="none">{text('不显示','None','なし')}</option><option value="hull">{text('样本凸包','Sample convex hull','サンプル凸包')}</option><option value="ellipse">{text('离散程度椭圆','Dispersion ellipse','分散楕円')}</option></Select></label>
   {c.pcaEnvelope!=='none'&&<>{slider('pcaEnvelopeOpacity',text('边界填充透明度','Envelope fill opacity','囲みの塗り不透明度'),0,.4,.02)}{slider('lineWidth',text('边界 / 箭头线宽','Envelope / arrow width','囲み・矢印の線幅'),.5,4,.5)}</>}
   {c.pcaEnvelope==='ellipse'&&<>{slider('pcaEllipseScale',text('椭圆标准差倍率','Ellipse SD multiplier','楕円の標準偏差倍率'),1,3,.1)}<p className="help">{text('椭圆使用组内样本协方差（n−1 分母），表示离散程度，不是置信区间。至少需要 3 个非共线样本；点数不足或退化时只画样本点。','Ellipses use within-group sample covariance (n−1 denominator) to show dispersion, not confidence. At least 3 non-collinear samples are needed; degenerate groups retain points only.','楕円は群内標本共分散（分母 n−1）で分散を示し、信頼区間ではありません。非共線の最低3点が必要で、退化時は点のみ表示します。')}</p></>}
   {c.pcaEnvelope==='hull'&&<p className="help">{text('凸包至少需要 3 个非共线点，仅表示观测样本边界，不表示置信度或组间显著性。','A hull needs at least 3 non-collinear points and shows only the observed sample boundary, not confidence or significance.','凸包は非共線の最低3点が必要で、観測境界のみを示し、信頼度・有意性を意味しません。')}</p>}
  </section>
  {c.scatterVariant==='pca-biplot'&&<section><h3>{text('变量载荷','Variable loadings','変数負荷量')}</h3>{toggle('pcaShowLoadings',text('显示载荷箭头','Show loading arrows','負荷量矢印を表示'))}{c.pcaShowLoadings&&<>{slider('pcaLoadingScale',text('载荷统一显示倍率','Uniform loading display multiplier','負荷量の共通表示倍率'),.1,10,.1)}{color('pcaArrowColor',text('载荷箭头颜色','Loading arrow color','負荷量矢印の色'))}<p className="help">{text('显示倍率同时作用于两个分量，原始载荷保留在提示中。箭头与得分坐标的对应关系取决于上游双标图缩放约定。','The display factor applies to both components; tooltips retain original loadings. Relationships to scores depend on the upstream biplot scaling convention.','表示倍率は両成分に適用し、元の負荷量を保持します。スコアとの関係は元のバイプロット尺度規約に依存します。')}</p></>}</section>}
  <PcaAxisControls/>
  <section><h3>{text('坐标与标签','Axes and labels','軸とラベル')}</h3>{toggle('pcaEqualAxes',text('两轴每单位长度一致','Equal distance per coordinate unit','両軸の単位長を一致'))}<p className="help">{text('解读距离和载荷夹角时请保持两轴单位长度一致。','Keep equal coordinate units when interpreting distances and loading angles.','距離や負荷量の角度を読む際は両軸の単位長を一致させてください。')}</p>{toggle('xAxis',text('X 轴','X axis','X 軸'))}{toggle('yAxis',text('Y 轴','Y axis','Y 軸'))}{toggle('grid',text('网格','Grid','グリッド'))}{toggle('legend',text('图例','Legend','凡例'))}{toggle('labels',text('样本标签','Sample labels','サンプルラベル'))}{c.labels&&slider('labelLimit',text('最多标注数量','Maximum labels','最大ラベル数'),1,40,1)}{toggle('tooltip',text('悬浮提示','Tooltip','ツールチップ'))}</section>
  <section><h3>{text('画布','Canvas','キャンバス')}</h3>{number('width',text('宽度','Width','幅'),400,1600,20)}{number('height',text('高度','Height','高さ'),320,1400,20)}{color('background',text('背景颜色','Background color','背景色'))}</section>
 </>;
}
