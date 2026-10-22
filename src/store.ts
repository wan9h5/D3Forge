import { entryConfig, entryData } from './chartEntries';
import { isComposition } from './compositionModel';
import { create } from 'zustand';
import { defaults, mockData, type ChartType, type Config, type Row } from './model';
interface State { dataEpoch:number; updateData:(rows:Row[])=>void; restoreData:()=>void; type: ChartType; entryId: string; config: Config; data: Row[]; dataName: string; revision: number; setConfig: (patch: Partial<Config>)=>void; selectChart:(type:ChartType,entryId?:string)=>void; loadData:(rows:Row[],name:string)=>void; reset:()=>void; }
export const useBuilder = create<State>((set,get)=>({
  dataEpoch:0,
  updateData:data=>set(s=>({data,revision:s.revision+1,config:s.config.pcaAxes?{...s.config,pcaShowVariance:false}:s.config})),
  restoreData:()=>{const s=get();s.loadData(entryData(s.type,s.entryId)??mockData(s.type),'Mock data');},
  type:'scatter',entryId:'scatter',config:defaults('scatter'),data:mockData('scatter'),dataName:'Mock data',revision:0,
  setConfig:patch=>set(s=>{
    const config={...s.config,...patch};
    if(patch.chartScheme===undefined&&['color','secondaryColor','pcaThirdColor','upColor','downColor','neutralColor','scatterPalette','volcanoPalette','heatmapPalette','compositionPalette'].some(key=>key in patch))config.chartScheme='custom';
    // Editing an enabled style must make its target visible; explicit off switches win.
    if((patch.gridStyle===true||config.gridStyle&&['gridColor','gridWidth','gridOpacity'].some(key=>key in patch))&&patch.grid!==false)config.grid=true;
    if((patch.labelStyle===true||(config.labelStyle||s.type==='bar'&&config.barVariant!=='basic')&&['labelColor','labelFontSize','labelOffsetX','labelOffsetY','valueFormat'].some(key=>key in patch))&&patch.labels!==false)config.labels=true;
    if((patch.legendStyle===true||config.legendStyle&&['legendPosition','legendFontSize'].some(key=>key in patch))&&patch.legend!==false)config.legend=true;
    if(patch.markBorder===true&&['line','violin','scatter'].includes(s.type)&&patch.showPoints!==false)config.showPoints=true;
    for(const axis of ['x','y'] as const)if(config.axisStyle&&[`${axis}Title`,`${axis}TickCount`,`${axis}TickAngle`].some(key=>key in patch)&&patch[`${axis}Axis`]!==false)config[`${axis}Axis`]=true;
    if(patch.heatmapBar===true){config.heatmapTrend=false;config.heatmapTerms=false;}
    if(patch.heatmapTrend===true)config.heatmapBar=false;
    for(const axis of ['x','y'] as const) {
      if(config[`${axis}Scale`]==='log' && config[`${axis}DomainEnabled`] && config[`${axis}Min`]<=0) {
        config[`${axis}Min`]=Math.min(1,config[`${axis}Max`]/10);
        if(config[`${axis}Min`]<=0)config[`${axis}DomainEnabled`]=false;
      }
    }
    return {config,revision:s.revision+1};
  }),
  selectChart:(type,entryId=type)=>set(s=>({dataEpoch:s.dataEpoch+1,type,entryId,config:entryConfig(type,entryId),data:entryData(type,entryId)??mockData(type),dataName:'Mock data',revision:s.revision+1})),
  loadData:(data,dataName)=> {
    const fields=Object.keys(data[0]??{});
    const numbers=fields.filter(k=>data.some(d=>d[k]!==null && String(d[k]).trim()!=='' && Number.isFinite(Number(d[k]))));
    const categories=fields.filter(k=>!numbers.includes(k));
    const current = get();
    const c = current.config;
    if(c.bioVariant!=='none'){
      const map=(old:string,pattern:RegExp,fallback='')=>fields.includes(old)?old:fields.find(f=>pattern.test(f))||fallback;
      const mapped:Partial<Config>={
       bioTrackOneField:map(c.bioTrackOneField,/^(track.?1|value.?1|count.?1|signal.?1|outer)$/i),
       bioTrackTwoField:map(c.bioTrackTwoField,/^(track.?2|value.?2|count.?2|signal.?2|inner)$/i),
       bioLowerField:map(c.bioLowerField,/^(lower|ci.?lower|lower.?ci|lcl|conf.?low)$/i),
       bioUpperField:map(c.bioUpperField,/^(upper|ci.?upper|upper.?ci|ucl|conf.?high)$/i),
       bioTimeField:map(c.bioTimeField,/^(time|duration|followup|survival.?time|时间)$/i),
       bioEventField:map(c.bioEventField,/^(event|status|death|事件)$/i),
       bioSubjectField:map(c.bioSubjectField,/^(subject|patient|id|sample.?id|对象)$/i),
       bioScoreField:map(c.bioScoreField,/^(score|risk|expression|评分)$/i),
       chromosomeField:map(c.chromosomeField,/^(chr|chromosome|chrom|染色体)$/i),
       xField:map(c.xField,/^(position|pos|start|bp|起点|位置)$/i),
       bioLengthField:map(c.bioLengthField,/^(length|chr.?length|chromosome.?length|长度)$/i),
       bioEndField:map(c.bioEndField,/^(end|stop|终点)$/i),
       labelField:map(c.labelField,/^(gene|name|label|snp|基因)$/i),
       groupField:map(c.groupField,/^(group|category|condition|分组)$/i),
       bioTargetChrField:map(c.bioTargetChrField,/^(target.?chr|chr2|目标染色体)$/i),
       bioTargetPosField:map(c.bioTargetPosField,/^(target.?pos|pos2|position2|目标位置)$/i),
       bioTargetLengthField:map(c.bioTargetLengthField,/^(target.?length|length2)$/i),
       bioCenterStartField:map(c.bioCenterStartField,/^(cent.?start|centromere.?start)$/i),
       bioCenterEndField:map(c.bioCenterEndField,/^(cent.?end|centromere.?end)$/i),
       bioSourceField:map(c.bioSourceField,/^(source|sender|from)$/i),
       bioTargetField:map(c.bioTargetField,/^(target|receiver|to)$/i),
       bioLigandField:map(c.bioLigandField,/^ligand$/i),
       bioReceptorField:map(c.bioReceptorField,/^receptor$/i),
       bioWeightField:map(c.bioWeightField,/^(weight|strength|support)$/i),
       bioSnpAField:map(c.bioSnpAField,/^(snp.?a|snp1|variant1)$/i),
       bioSnpBField:map(c.bioSnpBField,/^(snp.?b|snp2|variant2)$/i),
       bioLDField:map(c.bioLDField,/^(r2|rsquared|dprime|ld)$/i),bioLDChromosome:'',

       ...( ['forest','roc','pr','funnel'].includes(c.bioVariant)?{
         xField:map(c.xField,c.bioVariant==='roc'?/^(fpr|false.?positive.?rate|1.?specificity)$/i:c.bioVariant==='pr'?/^(recall|sensitivity|tpr)$/i:/^(estimate|effect|hr|or|rr|log.?or|log.?hr|beta|mean.?difference)$/i),
         yField:map(c.yField,c.bioVariant==='roc'?/^(tpr|sensitivity|true.?positive.?rate)$/i:c.bioVariant==='pr'?/^(precision|ppv)$/i:/^(se|stderr|std.?err|standard.?error)$/i),
         labelField:map(c.labelField,/^(study|cohort|subgroup|variable|label|name|研究)$/i),
         groupField:map(c.groupField,/^(model|group|category|分组)$/i),
       }:{}),

       ...(['qq','regional'].includes(c.bioVariant)?{
         yField:map(c.yField,/^(p|pvalue|p_value|pval|p\.value|p_value_meta)$/i),
         labelField:map(c.labelField,/^(snp|rsid|variant|marker|markername|id)$/i),
         groupField:map(c.groupField,/^(group|cohort|trait|分组)$/i),
         bioRegionChromosome:'',
       }:{}),
       ...(c.bioVariant==='accumulation'?{
         xField:map(c.xField,/^(samples|sites|n|sample.?count|sample.?size)$/i),
         yField:map(c.yField,/^(richness|species|mean|sobs|species.?richness)$/i),
         groupField:map(c.groupField,/^(group|habitat|site.?type|condition|分组)$/i),
       }:{}),
      };
      set({dataEpoch:current.dataEpoch+1,data,dataName,config:{...c,...mapped},revision:current.revision+1});return;
    }
    if(c.pcaAxes){
      const map=(old:string,pattern:RegExp,fallback='')=>fields.includes(old)?old:fields.find(f=>pattern.test(f))||fallback;
      const xField=map(c.xField,/^pc[._ ]?1$/i,numbers[0]||'');
      const yField=map(c.yField,/^pc[._ ]?2$/i,numbers.find(f=>f!==xField)||'');
      const zField=map(c.zField,/^pc[._ ]?3$/i,numbers.find(f=>f!==xField&&f!==yField)||'');
      const groupField=c.groupField===''?'':map(c.groupField,/^(group|condition|cohort|class|分组)$/i);
      const labelField=c.labelField===''?'':map(c.labelField,/^(sample|sample.?id|name|variable|feature|id)$/i);
      set({dataEpoch:current.dataEpoch+1,data,dataName,config:{...c,xField,yField,zField,groupField,labelField,pcaShowVariance:false,pcaRowTypeField:map(c.pcaRowTypeField,/^(kind|type|record.?type)$/i),tooltipFields:[labelField,groupField,xField,yField,...(c.scatterVariant==='3d'?[zField]:[])].filter(Boolean)},revision:current.revision+1});return;
    }
    const heatmap = current.type === 'heatmap';
    const histogram = current.type === 'histogram';
    const categoricalX = (current.type==='scatter'&&['bubble','paired','gsea'].includes(c.scatterVariant)) || ['box', 'bar', 'violin', 'heatmap'].includes(current.type);
    const manhattan = current.type === 'manhattan';
    const chromosomeField = fields.includes(c.chromosomeField) ? c.chromosomeField
      : fields.find(field => /^(chr|chrom|chromosome)$/i.test(field))
        || categories.find(field => field !== c.labelField) || fields[0];
    const pField = fields.find(field => /^(p|pvalue|p_value|pval|p\.value|padj|p_val_adj|adj[._]?p[._]?val(ue)?|fdr|qvalue)$/i.test(field));
    const positionField = fields.find(field => /^(bp|pos|position|base_?pair|base_?position)$/i.test(field));
    const xField = fields.includes(c.xField) ? c.xField
      : heatmap ? categories.find(k=>/^(sample|column|time|condition|样本|列|时间)$/i.test(k)) || categories[0] || fields[0]
      : categoricalX ? categories[0] || fields[0] : (manhattan ? positionField || numbers.find(field => field !== chromosomeField && field !== pField) : current.type==='volcano' ? numbers.find(field=>/^(log2fc|avg_log2fc|logfc|log2foldchange|effect)$/i.test(field)) || numbers.find(field=>field!==pField) : numbers[0]) || fields[0];
    const yField = fields.includes(c.yField) ? c.yField
      : (current.type==='scatter'&&c.scatterVariant==='bubble') ? categories.find(field=>field!==xField)||fields[0]
      : heatmap ? categories.find(k=>/^(gene|row|feature|pathway|基因|行)$/i.test(k)&&k!==xField) || categories.find(field => field !== xField) || fields.find(field => field !== xField) || xField
      : histogram ? xField
      : current.type==='volcano' ? pField || numbers.find(field=>field!==xField) || numbers[0] || fields[0]
      : manhattan ? pField
        || numbers.find(field => field !== xField && field !== chromosomeField) || numbers[0] || fields[0]
      : (current.type === 'scatter' || current.type === 'line')
        ? numbers.find(field => field !== xField) || numbers[0] || fields[0]
        : numbers[0] || fields[0];
    const groupField = c.groupField === '' || fields.includes(c.groupField) ? c.groupField
      : ['scatter', 'bar', 'line'].includes(current.type)
        ? categories.find(field => field !== xField) || '' : '';
    if(isComposition(current.type)) {
      const mapField=(existing:string,pattern:RegExp,fallback:string)=>fields.includes(existing)?existing:fields.find(field=>pattern.test(field))||fallback;
      const categoryField=mapField(c.categoryField,/^(category|cell.?type|taxon|type|分类|细胞类型)$/i,categories[0]||fields[0]);
      const parentField=mapField(c.parentField,/^(parent|level.?1|父分类)$/i,categories.find(field=>field!==categoryField)||fields[0]);
      const sampleField=mapField(c.sampleField,/^(sample|sample.?id|样本)$/i,categories.find(field=>field!==categoryField)||fields[0]);
      const matrixRowField=mapField(c.matrixRowField,/^(condition|row|group|行|条件)$/i,categories.find(field=>field!==categoryField&&field!==sampleField)||fields[0]);
      const matrixColumnField=mapField(c.matrixColumnField,/^(column|sample|列|样本)$/i,sampleField);
      const valueField=mapField(c.valueField,/^(value|count|abundance|数值|丰度)$/i,numbers[0]||fields[0]);
      set({dataEpoch:current.dataEpoch+1,data,dataName,config:{...c,categoryField,parentField,sampleField,matrixRowField,matrixColumnField,valueField,splitCategory:data.some(row=>String(row[parentField])===c.splitCategory)?c.splitCategory:''},revision:current.revision+1});
      return;
    }
    set({ dataEpoch:current.dataEpoch+1,data, dataName, config: {
      ...c, xField, yField, groupField, chromosomeField,
      volcanoPanelField:fields.includes(c.volcanoPanelField)?c.volcanoPanelField:categories.find(k=>/cluster|contrast|comparison|簇|比较/i.test(k))||categories.find(k=>k!==c.labelField)||categories[0]||'',
      volcanoCategoryField:fields.includes(c.volcanoCategoryField)?c.volcanoCategoryField:categories.find(k=>/category|pathway|class|类别/i.test(k))||categories.find(k=>k!==c.labelField)||'',
      volcanoVipField:numbers.includes(c.volcanoVipField)?c.volcanoVipField:numbers.find(k=>/^vip$/i.test(k))||numbers.find(k=>k!==xField&&k!==yField)||'',
      volcanoColorField:numbers.includes(c.volcanoColorField)?c.volcanoColorField:numbers.find(k=>k!==xField&&k!==yField)||yField,
      heatmapDateField:fields.includes(c.heatmapDateField)?c.heatmapDateField:fields.find(k=>/^(date|day|日期)$/i.test(k))||fields[0],
      heatmapSecondField:numbers.includes(c.heatmapSecondField)?c.heatmapSecondField:numbers.find(k=>k!==c.valueField)||'',
      heatmapSizeField:numbers.includes(c.heatmapSizeField)?c.heatmapSizeField:numbers.find(k=>/size|count|大小/i.test(k))||numbers[0]||'',
      heatmapMarkField:fields.includes(c.heatmapMarkField)?c.heatmapMarkField:fields.find(k=>/mark|label|significance|标记/i.test(k))||'',
      heatmapSplitField:fields.includes(c.heatmapSplitField)?c.heatmapSplitField:categories.find(k=>/cohort|group|condition|分组/i.test(k))||'',
      heatmapTermField:fields.includes(c.heatmapTermField)?c.heatmapTermField:fields.find(k=>/pathway|term|category|通路/i.test(k))||'',
      heatmapRowFields:c.heatmapRowFields.split(',').filter(k=>fields.includes(k)).join(','),
      heatmapColumnFields:c.heatmapColumnFields.split(',').filter(k=>fields.includes(k)).join(','),
      heatmapSankeyWeight:fields.includes(c.heatmapSankeyWeight)?c.heatmapSankeyWeight:'',
      heatmapSplitA:'',heatmapSplitB:'',heatmapCalendarYear:'',
      volcanoPanelA:'',volcanoPanelB:'',
      barSecondField:fields.includes(c.barSecondField)?c.barSecondField:numbers.find(k=>k!==yField)||yField,
      barCohortField:fields.includes(c.barCohortField)?c.barCohortField:categories.find(k=>k!==xField&&k!==groupField)||categories[0]||'',
      errorLowField:fields.includes(c.errorLowField)?c.errorLowField:numbers.find(k=>/low|lower|下界/i.test(k))||numbers[0]||'',
      errorHighField:fields.includes(c.errorHighField)?c.errorHighField:numbers.find(k=>/high|upper|上界/i.test(k))||numbers[numbers.length-1]||'',
      barOverlayField:fields.includes(c.barOverlayField)?c.barOverlayField:numbers.find(k=>k!==yField)||yField,
      zField:fields.includes(c.zField)?c.zField:numbers.find(k=>k!==xField&&k!==yField)||numbers[0]||'',
      colorField:fields.includes(c.colorField)?c.colorField:numbers.find(k=>k!==xField&&k!==yField)||numbers[0]||'',
      pairField:fields.includes(c.pairField)?c.pairField:categories.find(k=>k!==xField&&k!==groupField)||categories[0]||'',
      violinGroupField:fields.includes(c.violinGroupField)?c.violinGroupField:'',
      facetField:fields.includes(c.facetField)?c.facetField:'',
      annotationField:fields.includes(c.annotationField)?c.annotationField:'',
      annotationsEnabled:c.annotationsEnabled&&fields.includes(c.annotationField),
      sizeField: numbers.includes(c.sizeField) ? c.sizeField : numbers[0] || '',
      scatterSizeEnabled: c.scatterSizeEnabled && numbers.length > 0,
      valueField: fields.includes(c.valueField) ? c.valueField : numbers.find(field => field !== xField && field !== yField) || numbers[0] || fields[0],
      labelField: fields.includes(c.labelField) ? c.labelField : (manhattan ? categories.find(field => field !== chromosomeField) : categories[0]) || fields[0],
      tooltipFields: current.type === 'bar' ? [...new Set([xField, yField, groupField].filter(Boolean))] : fields.slice(0, 4),
    }, revision: current.revision + 1 });
  },
  reset:()=>{const s=get();set({dataEpoch:s.dataEpoch+1,data:entryData(s.type,s.entryId)??mockData(s.type),config:entryConfig(s.type,s.entryId),dataName:'Mock data',revision:s.revision+1});}
}));
