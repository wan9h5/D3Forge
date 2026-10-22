import { Select } from './Select';
import { useBuilder } from './store';
import { useLocale } from './i18n';
import { categoricalSchemes, schemePreview, isDivergingScheme } from './chartColors';

export function ChartPalette(){
 const {type,config:c,setConfig}=useBuilder(),locale=useLocale();
 const tr=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
 const status=type==='volcano'&&!['gradient','category'].includes(c.volcanoColor);
 const sequential=type==='heatmap'||['density','ld'].includes(c.bioVariant)||(c.bioVariant==='regional'&&c.bioLDColor)||c.scatterVariant==='density'||c.scatterVariant==='bubble'||c.continuousColor||type==='volcano'&&c.volcanoColor==='gradient';
 const diverging=status||type==='heatmap'&&c.bioVariant==='none'&&c.heatmapPalette==='diverging';
 const choices=diverging?[['rdBu','RdBu'],['brBG','BrBG'],['piYG','PiYG']]:sequential?[['viridis','Viridis'],['cividis','Cividis'],['blues','Blues'],['magma','Magma'],['turbo','Turbo']]:[['tableau10','Tableau 10'],['set2','Set2'],['dark2','Dark2'],['paired','Paired'],['category10','Category 10']];
 const legacy=c.scatterVariant==='bubble'||c.continuousColor?c.scatterPalette:type==='volcano'&&c.volcanoColor==='gradient'?c.volcanoPalette:'custom';
 const selected=choices.some(([id])=>id===c.chartScheme)?c.chartScheme:choices.some(([id])=>id===legacy)?legacy:'custom';
 const colors=selected==='custom'?[c.color,c.secondaryColor]:schemePreview(selected);
 function choose(id:string){
  if(id==='custom'){setConfig({chartScheme:id});return;}
  const colors=schemePreview(id),category=categoricalSchemes[id];
  setConfig({chartScheme:id,color:colors[category?0:colors.length-1],secondaryColor:colors[category?1:0],...(category?{pcaThirdColor:colors[2]}:{}),...(status?{upColor:colors[0],downColor:colors[colors.length-1],neutralColor:colors[4]}:{}),...(type==='heatmap'&&c.bioVariant==='none'?{heatmapPalette:isDivergingScheme(id)?'diverging':'sequential'}:{})});
 }
 return <div className="chart-palette"><span>{tr('配色方案','Color scheme','配色')}</span>
  <Select aria-label={tr('配色方案','Color scheme','配色')} value={selected} onChange={event=>choose(event.target.value)}><option value="custom">{tr('自定义','Custom','カスタム')}</option>{choices.map(([id,name])=><option key={id} value={id}>{name}</option>)}</Select>
  <div className="palette-swatch" aria-hidden="true" style={sequential||diverging?{background:`linear-gradient(to right,${colors.join(',')})`}:undefined}>{!sequential&&!diverging&&colors.map((color,i)=><i key={i} style={{background:color}}/>)}</div>
 </div>;
}
