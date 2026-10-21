import Papa from 'papaparse';
import { bioMock, bioRows, isSurvival, isResearchPlot, isAssociationPlot } from './bioModel';
import { useBuilder } from './store';
import { t, useLocale } from './i18n';
import type { Config } from './model';

export function BioDataNotes({description}:{description:string}) {
  const locale=useLocale();
  const {config:c,data}=useBuilder();
  const text=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
  const fieldLabels:Partial<Record<keyof Config,[string,string,string]>>={
    yField:['纵轴数值','Y-axis value','Y 軸の値'],bioLowerField:['区间下限','Interval lower bound','区間下限'],bioUpperField:['区间上限','Interval upper bound','区間上限'],
    bioTimeField:['随访时间','Follow-up time','追跡時間'],bioEventField:['事件状态','Event status','イベント状態'],bioScoreField:['连续评分','Continuous score','連続スコア'],bioSubjectField:['对象编号','Subject ID','対象 ID'],groupField:['分组','Group','グループ'],
    chromosomeField:['染色体','Chromosome','染色体'],bioLengthField:['参考长度','Reference length','参照長'],xField:['位置 / 起点','Position / start','位置／開始'],bioEndField:['区间终点','Interval end','区間終了'],
    bioSourceField:['来源细胞','Source cell','送信細胞'],bioTargetField:['目标细胞','Target cell','受信細胞'],bioWeightField:['连接强度','Link strength','リンク強度'],bioSnpAField:['第一个 SNP','First SNP','第1 SNP'],bioSnpBField:['第二个 SNP','Second SNP','第2 SNP'],bioLDField:['LD 值','LD value','LD 値'],
    bioTargetChrField:['目标染色体','Target chromosome','接続先染色体'],bioTargetPosField:['目标位置','Target position','接続先位置'],bioTargetLengthField:['目标参考长度','Target reference length','接続先参照長'],bioCenterStartField:['着丝粒起点','Centromere start','セントロメア開始'],bioCenterEndField:['着丝粒终点','Centromere end','セントロメア終了'],
  };
  if(isResearchPlot(c.bioVariant)){
    fieldLabels.xField=c.bioVariant==='roc'?['假阳性率','False-positive rate','偽陽性率']:c.bioVariant==='pr'?['召回率','Recall','再現率']:['效应量','Effect estimate','効果量'];
    fieldLabels.yField=c.bioVariant==='roc'?['真阳性率','True-positive rate','真陽性率']:c.bioVariant==='pr'?['精确率','Precision','適合率']:['标准误','Standard error','標準誤差'];
    fieldLabels.labelField=['研究 / 亚组名称','Study / subgroup name','研究・サブグループ名'];
  }
  const fields=new Set(data.flatMap(row=>Object.keys(row)));
  if(c.bioVariant==='accumulation'){
    fieldLabels.xField=['样本数量','Sample count','サンプル数'];
    fieldLabels.yField=['物种丰富度汇总','Species richness summary','種数集計'];
  }
  fieldLabels.bioTrackOneField=['外轨道数值','Outer track value','外側トラック値'];
  fieldLabels.bioTrackTwoField=['内轨道数值','Inner track value','内側トラック値'];
  if(isAssociationPlot(c.bioVariant))fieldLabels.yField=['关联 P 值','Association P value','関連 P 値'];
  const required:(keyof Config)[]=c.bioVariant==='accumulation'?['xField','yField']
    :c.bioVariant==='circos-tracks'?['chromosomeField','bioLengthField','xField','bioEndField','bioTrackOneField','bioTrackTwoField']
    :isAssociationPlot(c.bioVariant)
    ? c.bioVariant==='qq'?['yField']:['yField','chromosomeField','xField']
    : isResearchPlot(c.bioVariant)
    ? c.bioVariant==='forest'?['xField','labelField','bioLowerField','bioUpperField']:['xField','yField']
    : isSurvival(c.bioVariant)
    ? ['bioTimeField','bioEventField',...(c.bioVariant==='cutoff'?['bioScoreField' as const]:[])]
    : c.bioVariant==='ligand'?['bioSourceField','bioTargetField','bioWeightField']
    : c.bioVariant==='ld'?['chromosomeField','bioSnpAField','xField','bioSnpBField','bioTargetPosField','bioLDField']
    : ['chromosomeField','bioLengthField','xField',
      ...(['circos-gene','ideogram','segments','centromere'].includes(c.bioVariant)?['bioEndField' as const]:[]),
      ...(c.bioVariant==='fusion'?['bioTargetChrField','bioTargetPosField','bioTargetLengthField',...(c.bioWeightEnabled?['bioWeightField' as const]:[])] as (keyof Config)[]:[]),
      ...(c.bioVariant==='centromere'?['bioCenterStartField','bioCenterEndField'] as (keyof Config)[]:[])];
  // Optional mappings become required when the user selects a field.
  if(isSurvival(c.bioVariant)&&c.bioSubjectField)required.push('bioSubjectField');
  if(c.bioVariant==='km'&&c.groupField)required.push('groupField');
  const missing=required.filter(key=>!c[key]||!fields.has(String(c[key])));
  const missingNames=missing.map(key=>{
    const label=fieldLabels[key];
    const name=label?text(...label):String(key);
    return c[key]?`${name} (${String(c[key])})`:name;
  }).join(' / ');
  const valid=bioRows(data,c).length;
  const downloadSample=()=>{
    const rows=bioMock(c.bioVariant);
    const csv=Papa.unparse(rows,{newline:'\r\n',escapeFormulae:true});
    const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download=`d3forge-${c.bioVariant}-example.csv`;
    document.body.append(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <section className="bio-data-notes">
    <h3>{text('数据检查与示例','Data checks and examples','データ確認とサンプル')}</h3>
    <p className="help" aria-live="polite">{text(`输入 ${data.length} 行，通过当前数据筛选 ${valid} 行`,`Input: ${data.length} rows · passing current data filters: ${valid}`,`入力 ${data.length} 行・現在の条件を通過 ${valid} 行`)}</p>
    {missing.length>0&&<p className="notice" role="status">{text(`请检查必需字段映射：${missingNames}`,`Check required field mappings: ${missingNames}`,`必須フィールドを確認してください：${missingNames}`)}</p>}
    {valid<data.length&&<p className="help">{text('未参与的记录可能来自无效或冲突数据、当前染色体选择或连接强度筛选。请结合下方数据要求检查。','Excluded rows may reflect invalid/conflicting data, the selected chromosome, or link-strength filters. Check the requirements below.','対象外の行には無効・矛盾データ、染色体の選択、リンク強度フィルターが含まれます。以下の条件を確認してください。')}</p>}
    <button className="quiet bio-sample-download" type="button" onClick={downloadSample}>{text('下载示例 CSV','Download example CSV','サンプル CSV をダウンロード')}</button>
    <p className="help">{text('示例使用内置字段名，可用作数据格式参考；下载不会替换当前数据。','The example uses built-in field names as a format reference. Downloading keeps your current data.','内蔵フィールド名のサンプルを形式の参考にできます。ダウンロードで現在のデータは変更されません。')}</p>
    <details className="bio-data-requirements"><summary>{text('数据要求与解释','Data requirements and interpretation','データ要件と解釈')}</summary><p className="help">{t(description)}</p></details>
  </section>;
}
