import type { ReactNode } from 'react';
import type { Config } from './model';
import { useBuilder } from './store';
import { Select } from './Select';
import { ColorPicker } from './ColorPicker';
import { Bounds } from './AdvancedControls';
import { t, useLocale } from './i18n';
import { isCircos, isSurvival, isResearchPlot, isAssociationPlot } from './bioModel';
type Label=string|[string,string,string];
function useControls(){
 const locale=useLocale(),{config:c,data,setConfig}=useBuilder(),fields=Array.from(new Set(data.flatMap(row=>Object.keys(row))));
 const label=(l:Label)=>typeof l==='string'?t(l):l[locale==='zh'?0:locale==='en'?1:2];
 const set=(key:keyof Config,value:unknown)=>setConfig({[key]:value});
 const toggle=(key:keyof Config,l:Label)=><label className="toggle"><span>{label(l)}</span><input type="checkbox" checked={Boolean(c[key])} onChange={e=>set(key,e.target.checked)}/><span className="switch" aria-hidden="true"/></label>;
 const select=(key:keyof Config,l:Label,options:[string,Label][])=><label className="field"><span>{label(l)}</span><Select aria-label={label(l)} value={String(c[key])} onChange={e=>set(key,e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{label(l)}</option>)}</Select></label>;
 const field=(key:keyof Config,l:Label,optional=false)=>select(key,l,[...(optional?[['','不使用'] as [string,Label]]:[]),...fields.map(f=>[f,f] as [string,Label])]);
 const text=(key:keyof Config,l:Label)=><label className="field"><span>{label(l)}</span><input type="text" value={String(c[key])} onChange={e=>set(key,e.target.value)}/></label>;
 const range=(key:keyof Config,l:Label,min:number,max:number,step=1)=><label className="field"><span>{label(l)}</span><div className="range-row"><input aria-label={label(l)} type="range" min={min} max={max} step={step} value={Number(c[key])} onChange={e=>set(key,+e.target.value)}/><output>{String(c[key])}</output></div></label>;
 const number=(key:keyof Config,l:Label,min:number,max:number,step:number)=><label className="field"><span>{label(l)}</span><input type="number" min={min} max={max} step={step} value={Number(c[key])} onChange={e=>{const v=+e.target.value;if(e.target.value!==''&&Number.isFinite(v)&&v>=min&&v<=max)set(key,v);}}/></label>;
 const color=(key:keyof Config,l:Label)=><div className="field"><span>{label(l)}</span><ColorPicker showPalette={key==='color'} label={label(l)} value={String(c[key])} onChange={v=>set(key,v)}/></div>;
 const group=(l:Label,enabled:boolean,children:ReactNode)=><details className="advanced-group"><summary><span>{label(l)}</span><small className={enabled?'is-enabled':''}>{t(enabled?'已启用':'按需开启')}</small></summary><div className="advanced-group-body">{children}</div></details>;
 const help=(l:Label)=><p className="help">{label(l)}</p>;
 const title=(l:Label)=><h3>{label(l)}</h3>;
 return {c,data,label,set,toggle,select,field,text,range,number,color,group,help,title};
}
export function BioFields(){
 const {c,field,help}=useControls(),m=c.bioVariant;
 if(m==='accumulation')return <>{field('xField',['样本数量','Sample count','サンプル数'])}{field('yField',['物种丰富度汇总','Species richness summary','種数集計'])}{field('groupField','分组字段',true)}{c.bioConfidence&&<>{field('bioLowerField',['输入范围下限（可选）','Supplied lower bound (optional)','入力下限（任意）'],true)}{field('bioUpperField',['输入范围上限（可选）','Supplied upper bound (optional)','入力上限（任意）'],true)}</>}{help(['使用已有累积分析结果，每组每个样本数量一行。样本数必须是正整数；输入范围需满足 0 ≤ 下限 ≤ 丰富度 ≤ 上限，无效范围不绘制但保留曲线点。','Use existing accumulation results, one row per sample count and group. Counts are positive integers. Bounds require 0 ≤ lower ≤ richness ≤ upper; invalid bounds omit only the interval, retaining the point.','計算済み累積結果を群・サンプル数ごとに1行で入力します。サンプル数は正の整数、0 ≤ 下限 ≤ 種数 ≤ 上限が必要です。無効な区間のみ省略し、点は保持します。'])}</>;
 if(m==='circos-tracks')return <>{field('chromosomeField','染色体字段')}{field('bioLengthField',['参考染色体长度（bp）','Reference chromosome length (bp)','参照染色体長（bp）'])}{field('xField',['区间起点（bp）','Interval start (bp)','区間開始（bp）'])}{field('bioEndField',['区间终点（不包含）','Interval end (exclusive)','区間終了（含まない）'])}{field('bioTrackOneField',['外轨道数值','Outer track value','外側トラック値'])}{field('bioTrackTwoField',['内轨道数值','Inner track value','内側トラック値'])}{help(['区间为 0-based [start,end)，两个轨道均为非负数。每行一个区间，重叠区间独立绘制。请使用同一组装版本的参考长度。','Use 0-based [start,end) intervals and nonnegative values in both tracks. One interval per row; overlaps stay separate. Use reference lengths from one genome assembly.','0-based [start,end) 区間と両トラックの非負値を使用します。1行1区間、重複は別に描画し、同一アセンブリの参照長を使用してください。'])}</>;
 if(isAssociationPlot(m))return <>
  {field('yField',['关联 P 值','Association P value','関連 P 値'])}
  {m==='qq'?field('groupField',['队列 / 分组（可选）','Cohort / group (optional)','コホート・群（任意）'],true):<>{field('chromosomeField','染色体字段')}{field('xField',['染色体内位置（bp）','Position within chromosome (bp)','染色体内位置（bp）'])}{c.bioLDColor&&field('bioLDField',['预先计算的 r²（可选）','Precomputed r² (optional)','計算済み r²（任意）'],true)}</>}
  {field('labelField',['SNP 名称（可选）','SNP name (optional)','SNP 名（任意）'],true)}
  {help(['仅接受 0 < P ≤ 1；零值、空值与无效数值跳过，不用任意小值替换 P=0。','Only 0 < P ≤ 1 is accepted. Zero, blank and invalid values are skipped, not replaced by an arbitrary small number.','0 < P ≤ 1 のみ使用し、ゼロ・空欄・無効値は任意の小さい値に置換せず除外します。'])}
 </>;
 if(isResearchPlot(m))return <>
  {field('xField',m==='forest'||m==='funnel'?['效应量字段','Effect estimate','効果量']:m==='roc'?['假阳性率（FPR）','False-positive rate (FPR)','偽陽性率 (FPR)']:['召回率（Recall）','Recall','再現率'])}
  {m==='forest'?<>{field('bioLowerField',['区间下限','Interval lower bound','区間下限'])}{field('bioUpperField',['区间上限','Interval upper bound','区間上限'])}{field('labelField',['研究 / 亚组名称','Study / subgroup name','研究・サブグループ名'])}</>:<>{field('yField',m==='funnel'?['标准误（SE）','Standard error (SE)','標準誤差 (SE)']:m==='roc'?['真阳性率（TPR）','True-positive rate (TPR)','真陽性率 (TPR)']:['精确率（Precision）','Precision','適合率'])}{m==='funnel'&&field('labelField',['研究名称（可选）','Study name (optional)','研究名（任意）'],true)}</>}
  {field('groupField',m==='roc'||m==='pr'?['模型分组（可选）','Model group (optional)','モデル群（任意）']:'颜色分组',true)}
  {help(m==='forest'?['输入已计算的效应量和置信区间，下限 ≤ 估计值 ≤ 上限；对数轴要求下限大于零。','Supply computed estimates and intervals: lower ≤ estimate ≤ upper. Log scales require a positive lower bound.','計算済み効果量・区間を入力し、下限 ≤ 推定値 ≤ 上限。対数軸は下限が正の値である必要があります。']:m==='funnel'?['每行一个研究结果，标准误必须大于零；不是标准差（SD）。小标准误显示在顶部。','One study per row. SE must be positive; use standard error, not standard deviation. Smaller SE appears at the top.','1行1研究、標準誤差は正の値。標準偏差ではなく標準誤差を使用し、小さい値を上に表示します。']:['输入各阈值下已计算的 0–1 坐标，每个模型至少需要两个点才能形成曲线。不训练模型，不补造端点或计算 AUC / AP。','Supply precomputed [0,1] coordinates; at least two points per model form a curve. No training, endpoint completion or AUC / AP calculation.','計算済み0–1座標を入力し、曲線はモデルごとに最低2点必要です。学習・端点補完・AUC / AP計算は行いません。'])}
 </>;
 if(isSurvival(m))return <>{field('bioTimeField',['随访时间字段','Follow-up time','追跡時間'])}{field('bioEventField',['事件状态（1=事件，0=删失）','Event status (1=event, 0=censored)','イベント状態（1=イベント、0=打切り）'])}{field('bioSubjectField',['对象编号（可选）','Subject ID (optional)','対象 ID（任意）'],true)}{m==='km'?field('groupField','分组字段',true):field('bioScoreField',['连续评分字段','Continuous score','連続スコア'])}{help(['每个对象一行，仅支持右删失。时间非负，事件为 0 / 1；重复对象编号全部排除。','One row per subject, right censoring only. Time ≥ 0; event is 0 or 1. All duplicate subject IDs are excluded.','1対象1行、右打切りのみ。時間は非負、イベントは0/1。重複対象 ID はすべて除外します。'])}</>;
 if(m==='ligand')return <>{field('bioSourceField',['来源细胞字段','Source cell','送信細胞'])}{field('bioTargetField',['目标细胞字段','Target cell','受信細胞'])}{field('bioWeightField',['关联强度字段','Association strength','関連強度'])}{field('bioLigandField',['配体名称字段','Ligand name','リガンド名'],true)}{field('bioReceptorField',['受体名称字段','Receptor name','受容体名'],true)}{help(['输入已有关联，每行一条连接，强度必须大于零。','Supply existing associations, one link per row with positive strength.','入力済み関連を1行1リンクで指定し、強度は正の値を使用します。'])}</>;
 return <>{field('chromosomeField','染色体字段')}{m==='ld'?<>{field('bioSnpAField',['第一个 SNP 名称','First SNP name','第1 SNP 名'])}{field('xField',['第一个 SNP 位置','First SNP position','第1 SNP 位置'])}{field('bioSnpBField',['第二个 SNP 名称','Second SNP name','第2 SNP 名'])}{field('bioTargetPosField',['第二个 SNP 位置','Second SNP position','第2 SNP 位置'])}{field('bioLDField',['LD 值（r² / |D′|）','LD value (r² / |D′|)','LD 値（r² / |D′|）'])}{help(['使用已计算的 0–1 LD 值；重复对取均值，同名 SNP 位置冲突时排除。','Use precomputed LD in [0,1]. Duplicate pairs use the mean; conflicting SNP positions are excluded.','計算済みの0–1のLDを使用します。重複対は平均、SNPの位置矛盾は除外します。'])}</>:<>{field('bioLengthField',['参考染色体长度','Reference chromosome length','参照染色体長'])}{field('xField',['位置 / 区间起点','Position / interval start','位置／区間開始'])}{['circos-gene','ideogram','segments','centromere'].includes(m)&&field('bioEndField',['区间终点（不包含）','Interval end (exclusive)','区間終了（含まない）'])}{m!=='density'&&<>{field('groupField','颜色分组',true)}{field('labelField','标签字段',true)}</>}{m==='fusion'&&<>{field('bioTargetChrField',['目标染色体','Target chromosome','接続先染色体'])}{field('bioTargetPosField',['目标位置','Target position','接続先位置'])}{field('bioTargetLengthField',['目标染色体长度','Target chromosome length','接続先染色体長'])}{c.bioWeightEnabled&&field('bioWeightField',['支持强度字段','Support weight','支持強度'])}</>}{m==='centromere'&&<>{field('bioCenterStartField',['着丝粒起点','Centromere start','セントロメア開始'])}{field('bioCenterEndField',['着丝粒终点','Centromere end','セントロメア終了'])}</>}{help(['使用同一组装版本的真实参考长度。区间为 0-based [start,end)，点位允许 0–length；长度或着丝粒冲突的染色体排除。示例长度不对应真实物种。','Use reference lengths from one assembly. Intervals are 0-based [start,end); loci allow 0–length. Conflicting lengths/centromeres exclude a chromosome. Mock lengths are not a real species.','同一アセンブリの参照長を使用します。区間は0-based [start,end)、座位は0–length。長さ・セントロメアの矛盾は染色体を除外します。例の長さは実在種ではありません。'])}</>}</>;
}
export function BioControls(){
 const {c,data,toggle,select,text,range,number,color,group,help,title}=useControls(),m=c.bioVariant,survival=isSurvival(m),circos=isCircos(m),ld=m==='ld',density=m==='density';
 if(isResearchPlot(m))return <ResearchControls/>;
 if(isAssociationPlot(m))return <AssociationControls/>;
 if(m==='accumulation'||m==='circos-tracks')return <BioExtrasControls/>;
 return <>
 {survival?<>
  <section>{title(['生存曲线','Survival curves','生存曲線'])}{toggle('bioConfidence',['显示置信区间','Confidence intervals','信頼区間'])}{c.bioConfidence&&select('bioConfidenceLevel',['置信水平','Confidence level','信頼水準'],[['90','90%'],['95','95%'],['99','99%']])}{toggle('bioCensor',['显示删失标记','Censor marks','打切り印'])}{range('lineWidth','线宽',1,5,.5)}{text('bioTimeUnit',['时间单位','Time unit','時間単位'])}</section>
  {m==='cutoff'&&<section>{title(['切点选择','Cutoff selection','カットオフ選択'])}{select('bioCutMode',['分组方法','Split method','分割方法'],[['manual',['手动切点','Manual cutoff','手動閾値']],['median',['评分中位数','Median score','スコア中央値']],['auto',['最大 log-rank 扫描','Maximum log-rank scan','最大 log-rank 探索']]])}{c.bioCutMode==='manual'?number('bioCutValue',['切点（低组 ≤，高组 >）','Cutoff (low ≤, high >)','閾値（低群 ≤、高群 >）'],-1e12,1e12,.1):c.bioCutMode==='auto'&&range('bioMinProp',['每组最小样本比例','Minimum group proportion','最小群割合'],.1,.45,.05)}{help(['自动扫描展示候选数与 Bonferroni 校正 P 值，是探索分析；切点需要独立样本验证。','Scans report candidate counts and Bonferroni-adjusted P values. This is exploratory; validate the cutoff in independent samples.','探索では候補数と Bonferroni 補正 P 値を表示します。独立標本でカットオフを検証してください。'])}</section>}
  {group(['风险人数与组间检验','Risk table and group comparison','リスク人数と群比較'],c.bioRiskTable||c.bioLogRank,<>{toggle('bioRiskTable',['显示风险人数表','Show risk table','リスク人数表'])}{toggle('bioLogRank',['显示 log-rank 检验','Show log-rank test','log-rank 検定'])}{help(['风险人数在各时间点事件发生前统计。无事件或方差不足时不报告 P 值。','Risk sets are counted immediately before each time. No P value is reported without events or sufficient variance.','リスク人数は各時点直前に計算します。イベント・分散不足では P 値を表示しません。'])}</>)}
  {group(['曲线数据点','Curve points','曲線上の点'],c.showPoints,<>{toggle('showPoints','显示数据点')}{c.showPoints&&range('radius','点半径',1,6,.5)}</>)}
 </>:circos?<section>{title(['圆环与连接','Circular layout and links','円環とリンク'])}{range('bioInnerRadius',['内半径比例','Inner radius ratio','内半径比'],.4,.9,.02)}{range('bioGap',['扇区间隔（弧度）','Sector gap (radians)','扇区間隔（ラジアン）'],.01,.15,.01)}{m!=='circos-gene'&&<>{toggle('bioLinks',['显示连接','Show links','リンクを表示'])}{m==='ligand'?toggle('bioArrow',['显示方向箭头','Directional arrows','方向矢印']):range('bioLinkWidth',['连接线宽','Link width','リンク幅'],.5,4,.25)}</>}</section>:ld?<section>{title(['LD 矩阵','LD matrix','LD 行列'])}{select('bioLDChromosome',['选择染色体','Select chromosome','染色体を選択'],[['','自动选择'],...Array.from(new Set(data.map(d=>String(d[c.chromosomeField]??'')).filter(Boolean))).map(d=>[d,d] as [string,Label])])}{toggle('grid','单元格边框')}{toggle('bioValueLabels',['显示 LD 数值','Show LD values','LD 値を表示'])}</section>:<section>{title(['染色体布局','Chromosome layout','染色体配置'])}{select('bioOrientation',['排列方向','Orientation','配置方向'],[['horizontal',['横向','Horizontal','横']],['vertical',['纵向','Vertical','縦']]])}{range('bioTrackSize',['染色体轨道厚度','Chromosome thickness','染色体の厚さ'],4,24)}{m==='chromosome'&&range('radius','点半径',1,8,.5)}{density&&<>{number('bioWindowSize',['窗口大小（bp）','Window size (bp)','窓サイズ（bp）'],100000,1e9,100000)}{select('bioDensityUnit',['窗口统计','Window statistic','窓の統計'],[['count',['每窗口计数','Count per window','窓ごとの件数']],['perMb',['每 Mb 密度','Density per Mb','Mb あたり密度']]])}{help(['每行计一个位点，空窗口为零；末端窗口按实际长度换算密度。','Each row counts as one locus; empty windows are zero. Terminal-window density uses the actual window length.','1行を1座位とし空窓はゼロ、末端窓は実長で密度を換算します。'])}</>}</section>}
 {(m==='fusion'||m==='ligand')&&group(['连接强度与筛选','Link strength and filtering','リンク強度と絞り込み'],m==='ligand'||c.bioWeightEnabled,<>{m==='fusion'&&toggle('bioWeightEnabled',['按支持强度调整线宽','Weight link width by support','支持強度で線幅を変更'])}{(m==='ligand'||c.bioWeightEnabled)&&number('bioMinWeight',['最小连接强度','Minimum link strength','最小リンク強度'],0,1e12,.1)}{help(['筛选依据输入的原始强度，不代表显著性检验。','Filter supplied raw strength; this is not a significance test.','入力の元の強度で絞り込み、有意性検定は行いません。'])}</>)}
 <section>{title('颜色与样式')}{color('color',ld||density?'高值颜色':'主色')}{color('secondaryColor',ld||density?'低值颜色':['第二分组颜色','Second group color','第2群の色'])}{!survival&&!ld&&range('opacity','透明度',.1,1,.05)}{toggle('legend','图例')}{toggle('tooltip','Tooltip · 悬浮提示')}</section>
 {(ld||density)&&group('颜色范围与样式',c.colorDomainEnabled,<>{toggle('colorDomainEnabled','自定义颜色范围')}{c.colorDomainEnabled&&<Bounds minKey="colorMin" maxKey="colorMax"/>}</>)}
 <section>{title('标签与画布')}{m!=='ligand'&&toggle('xAxis',survival?'X 轴':['坐标刻度','Coordinate ticks','座標目盛'])}{!circos&&!ld&&toggle('yAxis',survival?'Y 轴':['染色体名称','Chromosome names','染色体名'])}{survival&&toggle('grid','网格')}{!survival&&!density&&<>{toggle('labels',ld?['SNP 名称','SNP names','SNP 名']:['注释名称','Annotation names','注釈名'])}{c.labels&&m!=='ligand'&&range('bioLabelLimit','最多标注数量',1,40)}</>}{range('bioFontSize','文字大小',8,16)}{!survival&&!ld&&text('bioAssemblyLabel',['参考组装说明（可选）','Assembly note (optional)','参照アセンブリ説明（任意）'])}{number('width','宽度',400,1600,20)}{number('height','高度',320,1400,20)}</section>
 {group('背景样式',c.canvasStyle,<>{toggle('canvasStyle','启用背景样式')}{c.canvasStyle&&color('background','背景颜色')}</>)}
 </>;
}

function ResearchControls(){
 const {c,toggle,select,range,number,color,group,help,title}=useControls();
 const forest=c.bioVariant==='forest',funnel=c.bioVariant==='funnel';
 return <>
  <section>{title(forest?['效应量与区间','Estimates and intervals','効果量と区間']:funnel?['研究结果','Study results','研究結果']:['曲线与数据点','Curves and points','曲線と点'])}
   {(forest||funnel)&&select('xScale',['效应量尺度','Effect scale','効果量尺度'],[['linear',['线性（如均值差）','Linear (e.g. mean difference)','線形（平均差など）']],['log',['对数（如 OR / HR / RR）','Log (e.g. OR / HR / RR)','対数（OR / HR / RRなど）']]])}
   {forest&&select('bioResultSort',['结果排序','Result order','結果の順序'],[['input',['原始顺序','Input order','入力順']],['ascending',['效应量升序','Estimate ascending','効果量昇順']],['descending',['效应量降序','Estimate descending','効果量降順']]])}
   {!funnel&&range('lineWidth','线宽',1,5,.5)}
   {!forest&&!funnel&&toggle('showPoints','显示数据点')}
   {(forest||funnel||c.showPoints)&&range('radius','点半径',2,9,.5)}
   {forest&&toggle('bioValueLabels',['显示效应量与区间数值','Show estimate and interval values','効果量・区間数値を表示'])}
  </section>
  {c.bioVariant!=='pr'&&<section>{title(['参考线','Reference line','基準線'])}{toggle('bioShowReference',c.bioVariant==='roc'?['显示随机分类对角线','Random-classifier diagonal','ランダム分類の対角線']:['显示参考线','Show reference line','基準線を表示'])}
   {(forest||funnel)&&c.bioShowReference&&<>{number('bioReferenceValue',['参考效应量','Reference effect','基準効果量'],-1e9,1e9,.1)}{help(['OR / HR / RR 的无效应值通常为 1；均值差通常为 0。请按输入效应量设置，对数轴只显示正值参考线。','The null is usually 1 for OR / HR / RR and 0 for differences. Set it for your measure; log axes only show positive references.','OR / HR / RR の帰無値は通常1、差は通常0です。効果量に合わせて設定し、対数軸の基準線は正の値のみ表示します。'])}</>}
  </section>}
  <section>{title('颜色与样式')}{color('color','主色')}{color('secondaryColor',['第二分组颜色','Second group color','第2群の色'])}{range('opacity','透明度',.1,1,.05)}{toggle('legend','图例')}{toggle('tooltip','Tooltip · 悬浮提示')}</section>
  {group(['坐标与标签','Axes and labels','軸とラベル'],c.xAxis||c.yAxis,<>{toggle('xAxis','X 轴')}{toggle('yAxis',forest?['研究名称','Study names','研究名']:'Y 轴')}{toggle('grid','网格')}{funnel&&<>{toggle('labels',['研究标签','Study labels','研究ラベル'])}{c.labels&&range('bioLabelLimit','最多标注数量',1,40)}</>}{range('bioFontSize','文字大小',8,16)}</>)}
  <section>{title('画布')}{number('width','宽度',400,1600,20)}{number('height','高度',320,1400,20)}</section>
  {group('背景样式',c.canvasStyle,<>{toggle('canvasStyle','启用背景样式')}{c.canvasStyle&&color('background','背景颜色')}</>)}
 </>;
}

function BioExtrasControls(){
 const {c,toggle,range,color,group,text,number,help,title}=useControls();
 const accumulation=c.bioVariant==='accumulation';
 return <>
  <section>{title(accumulation?['曲线与输入范围','Curves and supplied ranges','曲線と入力区間']:['双轨道布局','Two-track layout','2トラック配置'])}
   {accumulation?<>{range('lineWidth','线宽',1,5,.5)}{toggle('showPoints','显示数据点')}{c.showPoints&&range('radius','点半径',1,6,.5)}{toggle('bioConfidence',['显示输入区间带','Show supplied interval bands','入力区間帯を表示'])}{c.bioConfidence&&range('bioBandOpacity',['区间带透明度','Interval band opacity','区間帯の不透明度'],.05,.5,.05)}{help(['区间带仅显示输入的上下限，其含义可能为 SD、SE 或置信区间，取决于上游分析；此处不重新计算。','Bands use supplied limits; SD, SE or confidence-interval meaning depends on the upstream analysis. Limits are not recomputed here.','帯は入力上下限を表示し、SD・SE・信頼区間の意味は元の解析に依存します。ここでは再計算しません。'])}</>:<>{range('bioInnerRadius',['中心留白比例','Center opening ratio','中央余白の比率'],.15,.6,.025)}{range('bioGap',['染色体间隔（弧度）','Chromosome gap (radians)','染色体間隔（ラジアン）'],.01,.12,.01)}{toggle('bioSharedTrackScale',['两条轨道共用尺度','Shared track scale','トラック共通尺度'])}{help(['两轨道柱高按各自范围或共用范围映射，图例显示每条轨道的数值上限。','Bar height uses independent or shared ranges. The legend shows each track maximum.','棒の高さを独立・共通尺度で表示し、凡例に各トラック上限を示します。'])}</>}
  </section>
  <section>{title('颜色与样式')}{color('color',accumulation?'主色':['外轨道颜色','Outer track color','外側トラック色'])}{color('secondaryColor',accumulation?['第二分组颜色','Second group color','第2群の色']:['内轨道颜色','Inner track color','内側トラック色'])}{range('opacity','透明度',.1,1,.05)}{toggle('legend','图例')}{toggle('tooltip','Tooltip · 悬浮提示')}</section>
  {group(['坐标与文字','Coordinates and text','座標と文字'],c.xAxis||c.yAxis,<>{toggle('xAxis',accumulation?'X 轴':['基因组坐标刻度','Genomic coordinate ticks','ゲノム座標目盛'])}{toggle('yAxis',accumulation?'Y 轴':['染色体名称','Chromosome names','染色体名'])}{toggle('grid',accumulation?'网格':['轨道参考圆环','Track guide rings','トラック補助円'])}{range('bioFontSize','文字大小',8,16)}{!accumulation&&text('bioAssemblyLabel',['参考组装说明（可选）','Assembly note (optional)','参照アセンブリ説明（任意）'])}</>)}
  <section>{title('画布')}{number('width','宽度',400,1600,20)}{number('height','高度',320,1400,20)}</section>
  {group('背景样式',c.canvasStyle,<>{toggle('canvasStyle','启用背景样式')}{c.canvasStyle&&color('background','背景颜色')}</>)}
 </>;
}

function AssociationControls(){
 const {c,data,toggle,select,range,number,color,group,help,title}=useControls();
 const qq=c.bioVariant==='qq';
 return <>
  {!qq&&<section>{title(['基因组区域','Genomic region','ゲノム領域'])}{select('bioRegionChromosome',['选择染色体','Select chromosome','染色体を選択'],[['',['自动选择','Automatic','自動選択']],...Array.from(new Set(data.map(row=>String(row[c.chromosomeField]??'')).filter(Boolean))).map(value=>[value,value] as [string,Label])])}
   {toggle('bioRegionEnabled',['限定区域范围','Limit region range','領域範囲を指定'])}
   {c.bioRegionEnabled&&<>{number('bioRegionStart',['区域起点（bp）','Region start (bp)','領域開始（bp）'],0,1e12,1000)}{number('bioRegionEnd',['区域终点（bp）','Region end (bp)','領域終了（bp）'],1,1e12,1000)}{c.bioRegionEnd<=c.bioRegionStart&&help(['终点必须大于起点。','End must exceed start.','終了は開始より大きい値が必要です。'])}</>}
  </section>}
  <section>{title(qq?['期望分布','Expected distribution','期待分布']:['关联信号','Association signals','関連シグナル'])}
   {qq?<>{toggle('bioShowReference',['显示均匀零假设对角线','Uniform-null diagonal','一様帰無分布の対角線'])}{help(['各组独立排序。第 i 个观测的期望概率为 (i−0.5)/n，两轴均为 −log10。此图不执行关联检验，也不计算膨胀因子或置信带。','Each group is ranked independently. Expected probability at rank i is (i−0.5)/n; both axes use −log10. No association tests, inflation factors or confidence bands are calculated.','群ごとに順位を計算し、期待確率 (i−0.5)/n と両軸 −log10 を使用します。関連検定・インフレーション係数・信頼帯は計算しません。'])}</>:<>{toggle('showThreshold',['显示显著性参考线','Significance reference','有意性の基準線'])}{c.showThreshold&&number('pThreshold',['P 值参考阈值','P-value reference threshold','P 値の基準閾値'],1e-300,1,.00000001)}{toggle('bioLDColor',['按输入 r² 着色','Color by supplied r²','入力 r² で着色'])}{c.bioLDColor&&help(['LD 必须是针对同一参考 SNP 预先计算的 0–1 数值；缺失或无效 LD 保留位点，显示为灰色。','Supply LD in [0,1] calculated against one reference SNP. Missing or invalid LD retains the variant in gray.','同一参照 SNP に対する計算済み0–1 LDを使用し、欠損・無効 LD の変異は灰色で保持します。'])}</>}
  </section>
  <section>{title('颜色与样式')}{color('color',!qq&&c.bioLDColor?'高值颜色':'主色')}{color('secondaryColor',!qq&&c.bioLDColor?'低值颜色':['第二分组颜色','Second group color','第2群の色'])}{range('radius','点半径',1,8,.5)}{range('opacity','透明度',.1,1,.05)}{toggle('legend','图例')}{toggle('tooltip','Tooltip · 悬浮提示')}</section>
  {group(['坐标与标签','Axes and labels','軸とラベル'],c.xAxis||c.yAxis,<>{toggle('xAxis','X 轴')}{toggle('yAxis','Y 轴')}{toggle('grid','网格')}{toggle('labels',['重点 SNP 标签','Top SNP labels','上位 SNP のラベル'])}{c.labels&&range('bioLabelLimit','最多标注数量',1,20)}{range('bioFontSize','文字大小',8,16)}</>)}
  <section>{title('画布')}{number('width','宽度',400,1600,20)}{number('height','高度',320,1400,20)}</section>
  {group('背景样式',c.canvasStyle,<>{toggle('canvasStyle','启用背景样式')}{c.canvasStyle&&color('background','背景颜色')}</>)}
 </>;
}
