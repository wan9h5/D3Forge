import { validateRows, type ChartType, type Config, type Row } from './model';
import type { Locale } from './i18n';

export const DATA_LIMITS={bytes:2*1024*1024,rows:10000,fields:100,cells:100000,string:4000};
export function editableJson(rows:Row[]){
 const pretty=JSON.stringify(rows,null,2);
 return new TextEncoder().encode(pretty).length<=DATA_LIMITS.bytes?pretty:JSON.stringify(rows);
}
const choose=(locale:Locale,zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
export function dataRowLimit(c:Config){
 if(c.bioVariant==='cutoff'&&c.bioCutMode==='auto')return 500;
 if(['fusion','ligand','circos-gene'].includes(c.bioVariant))return 2000;
 return DATA_LIMITS.rows;
}
export function dataBudget(rows:Row[],type:ChartType,c:Config,locale:Locale):string|undefined {
 const tr=(zh:string,en:string,ja:string)=>choose(locale,zh,en,ja);
 const limit=dataRowLimit(c);
 if(rows.length>limit)return tr(`当前图最多支持 ${limit} 行；当前 ${rows.length} 行。`,`This chart supports ${limit} rows; received ${rows.length}.`,`この図は最大 ${limit} 行です（現在 ${rows.length} 行）。`);
 const unique=(field:string)=>new Set(rows.map(row=>String(row[field]??'')));
 if(type==='heatmap'&&c.heatmapVariant!=='calendar'){
  const columns=unique(c.xField).size,lines=unique(c.yField).size;
  if(columns*lines>10000)return tr('热力图展开后最多 10,000 个单元格。','Heatmaps support at most 10,000 expanded cells.','ヒートマップは展開後最大10,000セルです。');
  // Extended matrices currently construct both clustering trees even when hidden.
  if(c.heatmapVariant!=='basic'&&(columns>80||lines>80))return tr('此类热力图最多 80 行 × 80 列，避免聚类阻塞页面。','This heatmap supports at most 80 rows × 80 columns to keep clustering responsive.','クラスタリング処理のため、この図は最大80行×80列です。');
 }
 if(c.bioVariant==='ld'&&new Set([...unique(c.bioSnpAField),...unique(c.bioSnpBField)]).size>150)return tr('LD 图最多 150 个不同 SNP。','LD plots support at most 150 distinct SNPs.','LD図は最大150種類のSNPです。');
 if(c.bioVariant==='ligand'&&new Set([...unique(c.bioSourceField),...unique(c.bioTargetField)]).size>80)return tr('受体–配体图最多 80 个细胞节点。','Ligand–receptor plots support at most 80 cell nodes.','リガンド・受容体図は最大80細胞ノードです。');
 if(c.bioVariant==='density'){
  const lengths=new Map<string,number>();
  for(const row of rows)lengths.set(String(row[c.chromosomeField]),Math.max(lengths.get(String(row[c.chromosomeField]))??0,Number(row[c.bioLengthField])||0));
  const bins=Array.from(lengths.values()).reduce((sum,length)=>sum+Math.ceil(length/Math.max(1,c.bioWindowSize)),0);
  if(bins>10000)return tr('SNP 密度图最多展开 10,000 个窗口，请增大窗口宽度。','SNP density supports 10,000 expanded windows; increase window width.','SNP密度図は最大10,000ウィンドウです。幅を広げてください。');
 }
 if(type==='pie-matrix'&&unique(c.matrixRowField).size*unique(c.matrixColumnField).size>100)return tr('矩阵饼图最多 100 个面板。','Pie matrices support at most 100 panels.','円グラフ行列は最大100パネルです。');
 if(type==='bar-pie'&&unique(c.sampleField).size>100)return tr('柱饼组合图最多 100 个样本面板。','Bar–pie charts support at most 100 sample panels.','棒・円グラフは最大100サンプルパネルです。');
 if(c.pcaAxes&&unique(c.groupField).size>50)return tr('PCA 图最多 50 个分组。','PCA plots support at most 50 groups.','PCA図は最大50群です。');
 if(c.scatterVariant==='pca-biplot'&&rows.filter(row=>String(row[c.pcaRowTypeField])===c.pcaLoadingType).length>100)return tr('PCA 双标图最多 100 个载荷箭头。','PCA biplots support at most 100 loading arrows.','PCAバイプロットは最大100負荷量矢印です。');
}

export function dataGuide(type:ChartType,c:Config,locale:Locale){
 const tr=(zh:string,en:string,ja:string)=>choose(locale,zh,en,ja);
 if(c.pcaAxes)return tr('PCA：编辑已有主成分得分；双标图用类型列区分样本与载荷，不重新计算 PCA。','PCA: edit existing scores; biplots distinguish samples and loadings by record type. PCA is not recalculated.','PCA：計算済みスコアを編集し、種類列で標本と負荷量を区別します。PCAは再計算しません。');
 if(['km','cutoff'].includes(c.bioVariant))return tr('生存图：时间 ≥ 0，事件为 0 或 1；对象编号唯一，自动 Cutoff 最多 500 行。','Survival: time ≥ 0, event 0 or 1, unique subject IDs; automatic cutoff supports 500 rows.','生存図：時間≥0、イベント0/1、対象IDは一意。自動カットオフは最大500行です。');
 if(['roc','pr'].includes(c.bioVariant))return tr('ROC / PR：横纵坐标均须在 [0,1]，输入已计算的曲线坐标。','ROC / PR: both coordinates must be in [0,1]; supply computed curve coordinates.','ROC/PR：両座標は[0,1]。計算済みの曲線座標を入力します。');
 if(c.bioVariant==='forest')return tr('森林图：区间下限 ≤ 效应量 ≤ 上限；对数轴要求区间 > 0。','Forest: lower ≤ effect ≤ upper; log axes require positive bounds.','フォレスト：下限≤効果≤上限。対数軸は正の区間が必要です。');
 if(c.bioVariant==='funnel')return tr('漏斗图：效应量有效，标准误 > 0。','Funnel: finite effect estimates and standard error > 0.','ファンネル：有効な効果量と標準誤差>0。');
 if(['qq','regional'].includes(c.bioVariant)||type==='volcano'||type==='manhattan')return tr('关联图：0 < P ≤ 1；染色体位置须 ≥ 0，P=0 不会自动替换。','Association: 0 < P ≤ 1; genomic positions ≥ 0. Zero P values are not replaced.','関連図：0<P≤1、ゲノム位置≥0。P=0は自動置換しません。');
 if(c.bioVariant==='ld')return tr('LD：r² 在 [0,1]；同一 SNP 的位置一致，最多 150 个 SNP。','LD: r² in [0,1], consistent positions per SNP, at most 150 SNPs.','LD：r²は[0,1]、同一SNPの位置は一致、最大150SNP。');
 if(c.bioVariant==='accumulation')return tr('物种累积：样本数是正整数，丰富度 ≥ 0；范围须包围丰富度。','Accumulation: positive integer sample counts, richness ≥ 0; bounds enclose richness.','種数累積：標本数は正の整数、種数≥0、区間は種数を含みます。');
 if(c.bioVariant!=='none')return tr('基因组与连接图：参考长度须一致，0 ≤ 起点 < 终点 ≤ 长度；连接强度为正。','Genomic / link plots: consistent reference lengths, 0 ≤ start < end ≤ length, positive link strengths.','ゲノム・リンク図：参照長は一貫、0≤開始<終了≤長さ、リンク強度は正。');
 if(type==='heatmap')return tr('热力图：分类和数值必填，最多 10,000 个展开单元格；聚类类图最多 80×80。','Heatmaps: category fields and numeric values required; 10,000 expanded cells, 80×80 for clustered layouts.','ヒートマップ：分類と数値が必須、展開後10,000セル、クラスタ型は80×80まで。');
 if(['pie','nested-pie','pie-matrix','pie-bar','bar-pie','waffle'].includes(type))return tr('组成图：分类不能为空，数值非负，至少一个数值 > 0。','Composition: nonempty categories, nonnegative values and at least one positive value.','構成図：分類は空不可、値は非負、少なくとも1値は正。');
 return tr('保留当前字段映射；数值列须有效，对数轴须 > 0。分组点数不足时，不补造统计区间。','Keep current field mappings; numeric values must be valid, log axes > 0. Insufficient samples do not produce invented intervals.','現在の列対応を保持し、数値は有効、対数軸は>0。標本不足時に区間を捏造しません。');
}

export type DataCheck={rows?:Row[];error?:string;warning?:string};
export function parseEditableData(text:string,type:ChartType,c:Config,locale:Locale,structureOnly=false):DataCheck {
 const tr=(zh:string,en:string,ja:string)=>choose(locale,zh,en,ja);
 const fail=(zh:string,en:string,ja:string)=>({error:tr(zh,en,ja)});
 if(text.length>DATA_LIMITS.bytes||new TextEncoder().encode(text).length>DATA_LIMITS.bytes)return fail('JSON 文本最多 2 MB。','JSON text must be at most 2 MB.','JSONテキストは最大2 MBです。');
 let value:unknown;
 try{value=JSON.parse(text);}catch(error){
  const message=String((error as Error).message),position=message.match(/position (\d+)/i);
  const offset=position?Number(position[1]):text.length;
  const prefix=text.slice(0,offset),line=prefix.split('\n').length,column=offset-(prefix.lastIndexOf('\n')+1)+1;
  return fail(`JSON 格式错误，第 ${line} 行、第 ${column} 列。仅接受 JSON 数组，不执行代码。`,`Invalid JSON at line ${line}, column ${column}. Enter a JSON array; code is not executed.`,`JSON形式エラー：${line}行${column}列。JSON配列のみで、コードは実行しません。`);
 }
 if(!Array.isArray(value))return fail('数据必须是 JSON 对象数组，如 [{"x":1,"y":2}]。','Data must be an array of JSON objects, e.g. [{"x":1,"y":2}].','データはJSONオブジェクト配列です。例：[{"x":1,"y":2}]。');
 if(value.length>dataRowLimit(c))return {error:dataBudget(value as Row[],type,c,locale)};
 const fields=new Set<string>();let cells=0;
 for(let i=0;i<value.length;i++){
  const row=value[i];
  if(!row||typeof row!=='object'||Array.isArray(row))return fail(`第 ${i+1} 条记录必须是对象。`,`Record ${i+1} must be an object.`,`${i+1}番のレコードはオブジェクトが必要です。`);
  const keys=Object.keys(row);cells+=keys.length;
  if(!keys.length)return fail(`第 ${i+1} 条记录没有字段。`,`Record ${i+1} has no fields.`,`${i+1}番のレコードにフィールドがありません。`);
  for(const key of keys){
   fields.add(key);const cell=row[key];
   if(!key.trim()||key.length>200||['__proto__','constructor','prototype'].includes(key))return fail(`第 ${i+1} 条记录含不支持的字段名。`,`Record ${i+1} has an unsupported field name.`,`${i+1}番に未対応のフィールド名があります。`);
   if(cell!==null&&typeof cell!=='string'&&typeof cell!=='number')return fail(`第 ${i+1} 条记录的 ${key} 只接受文本、数字或 null，不接受嵌套结构或布尔值。`,`Record ${i+1}, ${key}: use text, numbers or null; no nested structures or booleans.`,`${i+1}番の${key}は文字列・数値・nullのみ対応します。`);
   if(typeof cell==='number'&&(!Number.isFinite(cell)||Math.abs(cell)>1e15))return fail(`第 ${i+1} 条记录的 ${key} 须为有限数字，绝对值不超过 10¹⁵。`,`Record ${i+1}, ${key}: use a finite number with magnitude ≤ 10¹⁵.`,`${i+1}番の${key}は絶対値≤10¹⁵の有限数が必要です。`);
   if(typeof cell==='string'&&cell.length>DATA_LIMITS.string)return fail(`第 ${i+1} 条记录的 ${key} 最多 4,000 个字符。`,`Record ${i+1}, ${key}: maximum 4,000 characters.`,`${i+1}番の${key}は最大4,000文字です。`);
  }
  if(fields.size>DATA_LIMITS.fields||cells>DATA_LIMITS.cells)return fail('最多 100 个不同字段、100,000 个数据单元格。','Maximum 100 distinct fields and 100,000 data cells.','最大100種類のフィールド、100,000データセルです。');
 }
 const rows=value as Row[];
 if(structureOnly)return {rows};
 const budget=dataBudget(rows,type,c,locale);if(budget)return {error:budget};
 // Neutralize display filters; retain intrinsic constraints and all-data consistency checks.
 const check={...c,histogramRangeEnabled:false,bioMinWeight:0,bioRegionEnabled:false};
 let valid:Row[];
 if(c.bioVariant==='regional')valid=rows.filter(row=>row[c.chromosomeField]!=null&&String(row[c.chromosomeField]).trim()!==''&&row[c.xField]!=null&&String(row[c.xField]).trim()!==''&&Number.isFinite(Number(row[c.xField]))&&Number(row[c.xField])>=0&&Number(row[c.yField])>0&&Number(row[c.yField])<=1);
 else if(c.bioVariant==='ld')valid=Array.from(new Set(rows.map(row=>String(row[c.chromosomeField])))).flatMap(chr=>validateRows(type,rows,{...check,bioLDChromosome:chr}));
 else valid=validateRows(type,rows,check);
 const accepted=new Set(valid),bad=rows.flatMap((row,index)=>accepted.has(row)?[]:[index+1]);
 if(bad.length)return fail(`第 ${bad.slice(0,5).join('、')} 条记录不符合当前字段映射或取值要求${bad.length>5?`，共 ${bad.length} 条`:''}。${dataGuide(type,c,locale)}`,`Records ${bad.slice(0,5).join(', ')} do not meet current mappings or value requirements (${bad.length} total). ${dataGuide(type,c,locale)}`,`レコード${bad.slice(0,5).join('、')}は現在の列対応・値の要件を満たしません（計${bad.length}件）。${dataGuide(type,c,locale)}`);
 if(c.scatterVariant==='pca-biplot'&&rows.length&&!rows.some(row=>String(row[c.pcaRowTypeField])===c.pcaSampleType))return fail('PCA 双标图至少需要一条样本得分记录。','A PCA biplot needs at least one sample-score record.','PCAバイプロットは最低1標本スコアが必要です。');
 if(['pie','nested-pie','pie-matrix','pie-bar','bar-pie','waffle'].includes(type)&&rows.length&&!rows.some(row=>Number(row[c.valueField])>0))return fail('组成图至少需要一个大于 0 的数值。','Composition charts need at least one positive value.','構成図は少なくとも1つの正の値が必要です。');
 if(c.bioVariant==='accumulation'&&rows.some(row=>[c.bioLowerField,c.bioUpperField].some(field=>row[field]!=null&&String(row[field]).trim()!=='')&&!(row[c.bioLowerField]!=null&&row[c.bioUpperField]!=null&&String(row[c.bioLowerField]).trim()!==''&&String(row[c.bioUpperField]).trim()!==''&&Number(row[c.bioLowerField])>=0&&Number(row[c.bioLowerField])<=Number(row[c.yField])&&Number(row[c.yField])<=Number(row[c.bioUpperField]))))return fail('物种累积曲线的上下限须成对提供，满足 0 ≤ 下限 ≤ 丰富度 ≤ 上限。','Accumulation bounds must be paired and satisfy 0 ≤ lower ≤ richness ≤ upper.','累積曲線の上下限は対で入力し、0≤下限≤種数≤上限が必要です。');
 const displayed=validateRows(type,rows,c).length;
 return {rows,warning:displayed<rows.length?tr(`${rows.length-displayed} 条记录因当前筛选条件不参与绘图。`,`${rows.length-displayed} records are excluded by current display filters.`,`${rows.length-displayed}件は現在の表示条件で除外されます。`):undefined};
}
