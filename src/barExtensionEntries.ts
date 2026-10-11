import type { ChartEntry } from './chartEntries';
export const barExtensionEntries:ChartEntry[] = [
  {
    "id": "bar-ice",
    "type": "bar",
    "name": "Popsicle Bar",
    "zh": "雪糕柱状图",
    "description": "圆角柱身与底部细柄突出分类数量，适合少量分类的展示。柱顶仍表示实际数值，可调整柱身与细柄比例；装饰部分不计入数值。",
    "patch": {
      "barVariant": "ice",
      "radius": 3,
      "groupField": "",
      "labels": true
    }
  },
  {
    "id": "bar-pencil",
    "type": "bar",
    "name": "Pencil Bar",
    "zh": "铅笔柱状图",
    "description": "以铅笔轮廓展示分类数值，适合排序结果和主题化展示。笔尖顶点对应数值，笔尖比例可调，柱高不会因装饰而改变。",
    "patch": {
      "barVariant": "pencil",
      "radius": 3,
      "groupField": "",
      "labels": true
    }
  },
  {
    "id": "bar-stem-background",
    "type": "bar",
    "name": "Stem Bar with Background",
    "zh": "带背景的茎叶柱状图",
    "description": "用细茎与圆点展示数值，并用背景柱表示共同参照上限，适合评分和进度比较。背景参考值可配置，超出参考值的数据仍完整显示。",
    "patch": {
      "barVariant": "stem",
      "radius": 5,
      "groupField": "",
      "labels": true
    }
  },
  {
    "id": "bar-updown",
    "type": "bar",
    "name": "Up / Down Bar",
    "zh": "上下柱状图",
    "description": "把两个非负系列放在零线上下比较，适合上调与下调数量或两类计数。可选择上下系列，下方轴显示数量的绝对大小；方向由所选系列定义。",
    "patch": {
      "barVariant": "updown",
      "radius": 3
    }
  },
  {
    "id": "bar-dual-line",
    "type": "bar",
    "name": "Dual-axis Bar and Line",
    "zh": "双 Y 轴柱状与折线图",
    "description": "用左轴柱形与右轴折线展示不同单位的两个指标，适合数量与比例的联合展示。两轴分别映射、标注和缩放；线条交点不表示两个指标数值相等。",
    "patch": {
      "barVariant": "dual-line",
      "radius": 3,
      "groupField": "",
      "barAggregate": "mean",
      "barRightFormat": ".0%"
    }
  },
  {
    "id": "bar-percent-curved",
    "type": "bar",
    "name": "Curved Percentage Stack",
    "zh": "曲线连接百分比堆叠柱状图",
    "description": "将每个分类的组成归一化为百分比，并用平滑连接带追踪相同成分。适合样本组成随条件的变化；连接带表达构成变化，不能推断个体迁移。",
    "patch": {
      "barVariant": "percent",
      "radius": 3,
      "barLinks": true,
      "barLinkCurve": true
    }
  },
  {
    "id": "bar-platform",
    "type": "bar",
    "name": "2.5D Platform Bar",
    "zh": "2.5D 柱状图",
    "description": "为分类柱添加斜面台座，形成具有空间层次的展示。柱顶位置仍由二维数值轴决定，台座仅用于分类标识，可调整台座深度。",
    "patch": {
      "barVariant": "platform",
      "radius": 3,
      "groupField": "",
      "labels": true
    }
  },
  {
    "id": "bar-dual",
    "type": "bar",
    "name": "Dual-axis Bar",
    "zh": "双 Y 轴柱状图",
    "description": "在每个分类并排显示两个单位不同的柱形指标，各自使用独立的 Y 轴。适合数量与强度等指标联合展示；颜色对应轴，不能直接比较两种柱高的绝对大小。",
    "patch": {
      "barVariant": "dual-bar",
      "radius": 3,
      "groupField": "",
      "barAggregate": "mean"
    }
  },
  {
    "id": "bar-group-stacked",
    "type": "bar",
    "name": "Grouped Stacked Bar",
    "zh": "多组堆叠柱状图",
    "description": "在每个分类内并排放置不同组，每组再按成分堆叠，适合多处理样本组成比较。输入分类、组、成分和数值四列；缺失组合按零处理，重复组合按所选统计量汇总。",
    "patch": {
      "barVariant": "group-stack",
      "radius": 3
    }
  },
  {
    "id": "bar-stack-links",
    "type": "bar",
    "name": "Stacked Bar with Links",
    "zh": "堆叠柱状图与连线路径",
    "description": "在堆叠柱间连接相同成分的边界，帮助观察组成与总量的变化。可选择直线、曲线和连接带；不需要对象 ID，但连线不能表示个体流转。",
    "patch": {
      "barVariant": "stacked",
      "radius": 3,
      "barLinks": true,
      "barLinkStyle": "boundary",
      "barLinkCurve": true
    }
  },
  {
    "id": "bar-go-dual",
    "type": "bar",
    "name": "Dual-axis GO Bar",
    "zh": "双 Y 轴 GO 柱状图",
    "description": "展示已有 GO 富集结果的数量与显著性，支持 BP、CC、MF 等分类配色。左轴映射数量，右轴可读取已转换指标或将有效 P 值转换为 −log10(P)；不运行富集检验。",
    "patch": {
      "barVariant": "go",
      "radius": 3,
      "barRightTransform": "neglog10",
      "barSecondAggregate": "min",
      "barAggregate": "mean",
      "labels": true
    }
  },
  {
    "id": "bar-polar-grouped",
    "type": "bar",
    "name": "Grouped Polar Bar",
    "zh": "多组极坐标柱状图",
    "description": "在每个分类扇区内并排展示多个系列，适合周期指标和多条件非负数量比较。共用数值范围，可调整内半径、角度与间距，并选择按半径或扇区面积编码数值。",
    "patch": {
      "barVariant": "polar-group",
      "radius": 3,
      "height": 580
    }
  },
  {
    "id": "bar-stack-line",
    "type": "bar",
    "name": "Stacked Bar and Line",
    "zh": "堆叠柱状图与折线",
    "description": "用堆叠柱展示各成分与总量，并叠加同单位的趋势指标，适合组成与目标值联合比较。趋势按分类汇总为一个值，独立选择字段；不同单位的指标请使用双轴组合图。",
    "patch": {
      "barVariant": "stacked",
      "radius": 3,
      "barOverlay": true
    }
  },
  {
    "id": "bar-gene-regulation",
    "type": "bar",
    "name": "Gene Regulation Bar",
    "zh": "基因上下调柱状图",
    "description": "围绕零线展示已计算的基因或 miRNA 变化值，适合比较上调与下调的方向和幅度。保留 log2FC 等输入值的真实符号，正负方向分别配色；不执行差异表达分析。",
    "patch": {
      "barVariant": "gene",
      "radius": 3,
      "groupField": "",
      "labels": true,
      "color": "#e65a50",
      "secondaryColor": "#36b889"
    }
  }
];
export const barExtensionText:Record<string,[string,string]> = {
  "雪糕柱状图": [
    "Popsicle Bar",
    "アイスキャンディー棒グラフ"
  ],
  "圆角柱身与底部细柄突出分类数量，适合少量分类的展示。柱顶仍表示实际数值，可调整柱身与细柄比例；装饰部分不计入数值。": [
    "Compare a few categories with rounded popsicle bodies and decorative sticks. The body top encodes the value. Adjust the stick proportion; decorative parts do not add to the value.",
    "丸い棒と細い柄で少数カテゴリを比較します。棒の上端が実際の値を表します。柄の割合を調整でき、装飾部分は値に含めません。"
  ],
  "铅笔柱状图": [
    "Pencil Bar",
    "鉛筆棒グラフ"
  ],
  "以铅笔轮廓展示分类数值，适合排序结果和主题化展示。笔尖顶点对应数值，笔尖比例可调，柱高不会因装饰而改变。": [
    "Show category values as pencil silhouettes for ranked or themed presentations. The tip apex encodes the value. Tip proportions can change without altering the encoded height.",
    "鉛筆の輪郭でカテゴリ値を示し、順位やテーマのある表示に適しています。先端の頂点が値を表します。先端比率を変更しても値の高さは変わりません。"
  ],
  "带背景的茎叶柱状图": [
    "Stem Bar with Background",
    "背景付きステム棒グラフ"
  ],
  "用细茎与圆点展示数值，并用背景柱表示共同参照上限，适合评分和进度比较。背景参考值可配置，超出参考值的数据仍完整显示。": [
    "Compare scores or progress using stems and dots over reference backgrounds. Configure a shared background reference. Values above the reference remain fully visible.",
    "背景の参照棒に茎と点を重ね、得点や進捗を比較します。共通の参照値を設定できます。参照を超える値も省略せず表示します。"
  ],
  "上下柱状图": [
    "Up / Down Bar",
    "上下棒グラフ"
  ],
  "把两个非负系列放在零线上下比较，适合上调与下调数量或两类计数。可选择上下系列，下方轴显示数量的绝对大小；方向由所选系列定义。": [
    "Compare two nonnegative series above and below zero. Useful for counts of two outcomes or up/down regulated features. Select both series; lower ticks show magnitudes and direction follows the chosen series.",
    "二つの非負系列をゼロの上下で比較します。二種類の結果や上昇・低下した項目の件数に適しています。上下の系列を選び、下側の目盛は数量の大きさを示します。"
  ],
  "双 Y 轴柱状与折线图": [
    "Dual-axis Bar and Line",
    "二軸の棒・折れ線グラフ"
  ],
  "用左轴柱形与右轴折线展示不同单位的两个指标，适合数量与比例的联合展示。两轴分别映射、标注和缩放；线条交点不表示两个指标数值相等。": [
    "Combine left-axis bars and a right-axis line for two measures with different units. Useful for counts and proportions. Both axes have their own mapping and scale; crossings do not mean equal values.",
    "異なる単位の二指標を左軸の棒と右軸の線で示します。件数と割合の比較などに適しています。軸は独立した項目と範囲を使用し、交点は同じ値を意味しません。"
  ],
  "曲线连接百分比堆叠柱状图": [
    "Curved Percentage Stack",
    "曲線接続の割合積み上げ棒グラフ"
  ],
  "将每个分类的组成归一化为百分比，并用平滑连接带追踪相同成分。适合样本组成随条件的变化；连接带表达构成变化，不能推断个体迁移。": [
    "Normalize each category to percentages and connect matching components with smooth bands. Useful for composition changes across conditions. Bands do not identify individual movement.",
    "各カテゴリを百分率に正規化し、同じ成分を滑らかな帯で接続します。条件ごとの構成の変化を確認できます。帯は個体の移動を示しません。"
  ],
  "2.5D 柱状图": [
    "2.5D Platform Bar",
    "2.5D台座付き棒グラフ"
  ],
  "为分类柱添加斜面台座，形成具有空间层次的展示。柱顶位置仍由二维数值轴决定，台座仅用于分类标识，可调整台座深度。": [
    "Add slanted category platforms for a layered presentation. Bar tops still use the 2D numeric axis. Platforms are decorative category labels and their depth is configurable.",
    "斜めの台座で分類に立体感を加えます。棒の頂点は二次元の数値軸で読み取ります。台座はカテゴリの装飾で、奥行きを設定できます。"
  ],
  "双 Y 轴柱状图": [
    "Dual-axis Bar",
    "二軸棒グラフ"
  ],
  "在每个分类并排显示两个单位不同的柱形指标，各自使用独立的 Y 轴。适合数量与强度等指标联合展示；颜色对应轴，不能直接比较两种柱高的绝对大小。": [
    "Place two measures with different units side by side within each category. Each uses its own Y axis and matching color. Compare trends within a measure rather than absolute heights across axes.",
    "各カテゴリに単位の異なる二指標を並べます。各指標に独立したY軸と対応する色を使用します。異なる軸の棒の高さを直接比較せず、各指標内の傾向を読み取ります。"
  ],
  "多组堆叠柱状图": [
    "Grouped Stacked Bar",
    "グループ別積み上げ棒グラフ"
  ],
  "在每个分类内并排放置不同组，每组再按成分堆叠，适合多处理样本组成比较。输入分类、组、成分和数值四列；缺失组合按零处理，重复组合按所选统计量汇总。": [
    "Place groups side by side within categories and stack components within each group. Supply category, cohort, component and value fields. Missing combinations are zero; repeated combinations use the chosen statistic.",
    "カテゴリ内で群を並べ、群の中に成分を積み上げます。カテゴリ、群、成分、値の項目を指定します。欠損組合せはゼロ、重複は選択した統計量で集計します。"
  ],
  "堆叠柱状图与连线路径": [
    "Stacked Bar with Links",
    "接続線付き積み上げ棒グラフ"
  ],
  "在堆叠柱间连接相同成分的边界，帮助观察组成与总量的变化。可选择直线、曲线和连接带；不需要对象 ID，但连线不能表示个体流转。": [
    "Combine composition with either component-boundary connections or a same-unit trend line. Map the optional trend field independently. Connections describe aggregate composition, not individual flows; use dual axes for different units.",
    "構成に成分境界の接続、または同単位の推移線を組み合わせます。任意の推移項目を個別に指定します。接続は集計した構成を示し、異なる単位には二軸を使用してください。"
  ],
  "双 Y 轴 GO 柱状图": [
    "Dual-axis GO Bar",
    "二軸GO棒グラフ"
  ],
  "展示已有 GO 富集结果的数量与显著性，支持 BP、CC、MF 等分类配色。左轴映射数量，右轴可读取已转换指标或将有效 P 值转换为 −log10(P)；不运行富集检验。": [
    "Show counts and significance from existing GO enrichment results with BP/CC/MF colors. The right axis accepts transformed metrics or computes −log10(P) from valid P values. No enrichment test is performed.",
    "既存のGO富化結果の件数と有意性をBP・CC・MFなどの色で示します。右軸に変換済み指標、または有効なP値の−log10(P)を指定できます。富化検定は実行しません。"
  ],
  "多组极坐标柱状图": [
    "Grouped Polar Bar",
    "グループ別極座標棒グラフ"
  ],
  "在每个分类扇区内并排展示多个系列，适合周期指标和多条件非负数量比较。共用数值范围，可调整内半径、角度与间距，并选择按半径或扇区面积编码数值。": [
    "Compare multiple series side by side inside each category sector. Useful for cyclic measures and nonnegative counts across conditions. A shared scale supports radius or proportional sector-area encoding.",
    "各カテゴリの扇形内に複数系列を並べます。周期的指標や条件ごとの非負の数量比較に適しています。共通尺度を使い、半径または扇形面積で値を表せます。"
  ],
  "堆叠柱状图与折线": [
    "Stacked Bar and Line",
    "積み上げ棒・折れ線グラフ"
  ],
  "用堆叠柱展示各成分与总量，并叠加同单位的趋势指标，适合组成与目标值联合比较。趋势按分类汇总为一个值，独立选择字段；不同单位的指标请使用双轴组合图。": [
    "Combine composition with either component-boundary connections or a same-unit trend line. Map the optional trend field independently. Connections describe aggregate composition, not individual flows; use dual axes for different units.",
    "構成に成分境界の接続、または同単位の推移線を組み合わせます。任意の推移項目を個別に指定します。接続は集計した構成を示し、異なる単位には二軸を使用してください。"
  ],
  "基因上下调柱状图": [
    "Gene Regulation Bar",
    "遺伝子発現変動棒グラフ"
  ],
  "围绕零线展示已计算的基因或 miRNA 变化值，适合比较上调与下调的方向和幅度。保留 log2FC 等输入值的真实符号，正负方向分别配色；不执行差异表达分析。": [
    "Show precomputed gene or miRNA changes around zero. Useful for direction and magnitude of regulation. Preserve input signs such as log2FC and color positive/negative values separately; no differential expression analysis is run.",
    "計算済みの遺伝子やmiRNAの変化をゼロの上下に示します。発現変動の方向と大きさの比較に適しています。log2FCなどの符号を保ち、正負を別の色で示します。差次的発現解析は行いません。"
  ]
};
