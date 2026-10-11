// Detailed chart guidance: Chinese, English, Japanese. Keep examples aligned with implemented behavior.
export const chartDescriptions: Record<string, readonly [string,string,string]> = {
  "scatter": [
    "散点图将每条观测记录放在两个数值坐标上，帮助观察变量之间的关系、分组差异和偏离整体趋势的样本。常用于基因表达对比、实验测量和业务指标分析；当你想了解两个指标是否一起变化，或找出值得进一步检查的点时，可以选择它。点的位置呈现数据关系，本身不能证明因果关系。",
    "A scatter plot places each observation on two numeric axes to reveal relationships, group differences and unusual samples. It is useful for gene expression comparisons, experimental measurements and business metrics when you want to see whether two measures vary together or identify observations for closer inspection. A visible association does not establish causation.",
    "散布図は各観測値を二つの数値軸上に配置し、変数の関係、グループ間の違い、全体の傾向から外れるサンプルを示します。遺伝子発現の比較、実験測定、業務指標の分析などで、二つの指標が一緒に変化するかを調べたい場合に適しています。図に見える関連だけで因果関係を示すことはできません。"
  ],
  "volcano": [
    "火山图同时呈现变化幅度和统计显著性，便于从大量比较结果中定位变化较大、证据较强的候选对象。常用于转录组、蛋白质组和代谢组差异分析；如果你想区分上调、下调与未达到阈值的基因或分子，可以映射效应量和已有 P 值，并调整筛选阈值。图形展示的是输入的分析结果，不会自动完成差异检验。",
    "A volcano plot combines effect size with statistical significance to highlight candidates with substantial changes and stronger evidence. It is commonly used for differential analyses in transcriptomics, proteomics and metabolomics. Map effect sizes and supplied P-values to distinguish increased, decreased and below-threshold features. The chart displays your analysis results; it does not perform differential testing.",
    "ボルケーノプロットは変化量と統計的有意性を同時に表示し、大きな変化と強い証拠を持つ候補を探すのに役立ちます。トランスクリプトーム、プロテオーム、メタボロームの差次解析などで、増加・減少・閾値未満の特徴を見分けたい場合に適しています。効果量と既存のP値を指定して使用し、図自体は差次検定を行いません。"
  ],
  "box": [
    "箱线图用中位数、四分位区间和须线概括各组数据，适合快速比较典型水平、波动范围与离群观测。常用于实验组比较、临床指标和质量控制；如果你关心不同处理是否改变数据的中心位置或离散程度，可以先用它建立整体认识。离群点只是需要关注的观测，不代表一定存在测量错误。",
    "A box plot summarizes each group with its median, quartiles and whiskers, making typical levels, variability and outlying observations easy to compare. It is useful for experimental groups, clinical measurements and quality control when you want a compact view of differences in location and spread. An outlying point is a signal to inspect, not necessarily a measurement error.",
    "箱ひげ図は中央値、四分位範囲、ひげで各グループのデータを要約し、代表的な水準、ばらつき、外れた観測値を比較します。実験群の比較、臨床指標、品質管理などで、処理によって中心位置や分散が変わるかを把握したい場合に適しています。外れ値として表示された点が、必ず測定ミスであるとは限りません。"
  ],
  "bar": [
    "柱状图通过柱子的长度比较不同类别的数值，分组形式适合并列比较系列，堆叠形式适合查看总量及其构成。可用于样本计数、实验结果、产品指标和分类丰度等场景；当你想回答哪一类更多、同一类别下不同系列有何差异时，可以选择它。同一类别与系列的重复记录会求和，输入均值等汇总数据时应留意这一规则。",
    "A bar chart compares category values through bar length. Grouped bars compare series side by side, while stacked bars show totals and their composition. Use it for sample counts, experimental results, product metrics or category abundance when you want to compare amounts across categories. Repeated category–series records are summed, so account for this when importing already summarized values such as means.",
    "棒グラフは棒の長さでカテゴリの数値を比較します。集合形式は系列の並列比較に、積み上げ形式は総量と構成の確認に適しています。サンプル数、実験結果、製品指標、分類別の量など、どのカテゴリが多いかを示したい場合に利用できます。同じカテゴリと系列の重複行は合計されるため、平均値などの集計済みデータを入力する際は注意してください。"
  ],
  "line": [
    "折线图按照时间或数值顺序连接观测，适合展示趋势、转折以及多条系列之间的变化差异。常用于时间序列实验、剂量反应、监测数据和业务走势；如果你想说明某个指标如何随时间或条件变化，可以使用它。连线与平滑仅是视觉表达，应结合实际采样间隔阅读，不应把中间位置当作真实测量值。",
    "A line chart connects observations in time or numeric order to show trends, turning points and differences between series. It suits time-course experiments, dose responses, monitoring and business trends when you want to explain how a measure changes over an ordered variable. Lines and smoothing are visual aids; consider sampling intervals and do not treat intermediate positions as measured values.",
    "折れ線グラフは時間や数値の順序に沿って観測値を結び、傾向、変化点、系列間の推移の違いを示します。時系列実験、用量反応、モニタリング、業務の推移など、順序のある条件に伴う指標の変化を伝えたい場合に適しています。線や平滑化は視覚的な補助であり、測定間隔を考慮し、途中の位置を実測値と解釈しないでください。"
  ],
  "violin": [
    "小提琴图用轮廓宽度表示数据在不同数值附近的集中程度，可以比箱线图更直观地呈现偏态、多峰和分布形状。常用于表达量、细胞特征、临床测量和实验组比较；如果你不仅想比较中位数，还想观察数据集中在哪里，可以使用它。轮廓来自核密度估计，样本量和带宽都会影响形状，建议结合箱线摘要或原始观测点阅读。",
    "A violin plot uses contour width to show where observations are concentrated, revealing skewness, multiple peaks and distribution shape beyond a box plot. Use it for expression levels, cell features, clinical measurements and experimental groups when you want to compare more than medians. The contour is a kernel density estimate: sample size and bandwidth affect its shape, so consider summaries or individual observations alongside it.",
    "バイオリンプロットは輪郭の幅で観測値が集中する範囲を表し、箱ひげ図だけでは見えにくい歪み、多峰性、分布の形状を示します。発現量、細胞の特徴、臨床測定、実験群の比較などで、中央値に加えてデータの集中場所を知りたい場合に適しています。輪郭はカーネル密度推定であり、サンプル数や帯域幅の影響を受けるため、要約や観測点と併せて読んでください。"
  ],
  "heatmap": [
    "热力图将矩阵中的数值映射为颜色，适合同时浏览多个对象与多个条件之间的高低变化。常用于基因表达矩阵、样本特征、相关性结果和实验筛选；如果你想从整体上寻找相似模式或局部异常，可以将行、列分类与数值字段映射到图中。颜色范围会影响视觉对比，本图不会自动进行聚类或标准化，需要时请先准备相应数据。",
    "A heatmap maps matrix values to color so you can scan differences across many objects and conditions at once. It is useful for expression matrices, sample features, correlation results and experimental screens when looking for shared patterns or local anomalies. Map row, column and value fields to build the matrix. Color limits affect contrast; clustering and normalization are not performed automatically.",
    "ヒートマップは行列の数値を色に変換し、多数の対象と条件の間の高低を一覧できます。遺伝子発現行列、サンプルの特徴、相関解析結果、実験スクリーニングなどで、共通パターンや局所的な異常を探したい場合に適しています。行・列・数値の列を指定して使用します。色の範囲で見え方が変わり、クラスタリングや標準化は自動では行いません。"
  ],
  "histogram": [
    "直方图把连续数值划分为区间，用柱高展示每个区间内的观测数量或概率密度，帮助认识单个变量的分布。常用于测序质量、表达量、实验测量和质量监控；如果你想查看数据是否偏斜、是否存在多个集中区域，或多数观测落在哪个范围，可以使用它。分箱数量会影响外观，概率密度柱高表示密度而不是直接的百分比。",
    "A histogram divides numeric observations into intervals and shows their counts or probability density. It helps describe a single variable in sequencing quality, expression measurements, experiments and quality monitoring. Use it to inspect skewness, multiple concentrations or the range containing most observations. Bin count changes the appearance, and density heights are densities rather than direct percentages.",
    "ヒストグラムは数値を区間に分け、区間ごとの観測数や確率密度を棒の高さで示します。シーケンス品質、発現量、実験測定、品質監視などで、一つの変数の分布を把握するのに役立ちます。歪みや複数の集中領域、多くの観測値が入る範囲を確認したい場合に適しています。区間数で外観が変わり、密度の高さはそのまま割合を表すものではありません。"
  ],
  "manhattan": [
    "曼哈顿图按照染色体顺序排列位点，以 −log10(P) 的高度展示关联信号，便于在大量基因组位置中定位候选区域。常用于全基因组关联分析及其他按染色体组织的检验结果；如果你想查看显著信号集中在哪些染色体或区域，可以映射染色体、位置和已有 P 值。阈值需要结合研究设计确定，当前横向跨度依据输入数据的位置计算，不代表参考基因组的完整长度。",
    "A Manhattan plot orders loci by chromosome and uses −log10(P) to reveal association signals across genomic positions. It suits genome-wide association studies and other chromosome-organized test results when you want to locate candidate regions. Map chromosome, position and supplied P-value fields. Choose thresholds for your study; horizontal spans are calculated from the input positions, not full reference-genome lengths.",
    "マンハッタンプロットは染色体順に座位を並べ、−log10(P) の高さでゲノム上の関連シグナルを示します。全ゲノム関連解析など、染色体に沿った検定結果から候補領域を探す場合に適しています。染色体、位置、既存のP値を指定します。閾値は研究設計に応じて設定し、横方向の長さは入力位置から計算されるため、参照ゲノム全体の長さを示すものではありません。"
  ],
  "pie": [
    "饼图将一个整体划分为不同类别的扇区，适合展示类别较少、含义清晰的组成比例。可用于细胞类型构成、物种丰度汇总、功能分类和资源分配；如果你想说明整体由哪些部分组成、主要部分占多少，可以使用它。各类别应属于同一统计口径且数值非负，比较非常接近的比例或大量类别时，柱状图通常更容易阅读。",
    "A pie chart divides a whole into category slices and works best with a small number of clearly defined parts. Use it for cell-type composition, summarized taxon abundance, functional categories or resource allocation when explaining what makes up a whole. Values must be nonnegative and use a consistent basis. For many categories or very similar proportions, bars are usually easier to compare.",
    "円グラフは全体をカテゴリ別の扇形に分け、少数の明確な項目の構成比を示します。細胞種の構成、分類群の存在量の集計、機能分類、資源配分などで、全体が何で構成されるかを伝えたい場合に適しています。同じ集計基準の非負値を使用してください。カテゴリが多い場合や近い割合を比較する場合は、棒グラフの方が読み取りやすくなります。"
  ],
  "pie-matrix": [
    "矩阵饼图在行列组合的每个位置放置一个饼图，便于用统一分类颜色比较多个样本或实验条件的组成。常用于不同处理与样本之间的细胞类型比例、微生物组成和分类计数；如果你想同时保留样本排列结构与内部占比，可以使用它。每个格子独立计算比例，因此扇区反映格内构成，不能直接用同样大小的饼图判断样本总量。",
    "A pie matrix places a pie chart at each row–column combination, using consistent category colors to compare composition across samples or conditions. It suits cell-type proportions, microbial composition and category counts when both sample arrangement and internal shares matter. Each cell is normalized independently: equal-sized pies describe composition and do not indicate equal sample totals.",
    "円グラフ行列は行と列の各組合せに円グラフを置き、共通のカテゴリ色でサンプルや条件間の構成を比較します。処理条件ごとの細胞種比率、微生物構成、分類別カウントなどで、サンプルの並びと内部の割合を同時に示したい場合に適しています。割合は各セルで独立に計算されるため、同じ大きさの円からサンプル総量を比較することはできません。"
  ],
  "nested-pie": [
    "双层环图用内外两圈连接父分类与子分类，帮助读者从整体构成继续追踪到更细的层级。常用于细胞大类与亚群、物种分类及功能类别汇总；如果你想同时展示一级分类的份额和各分类内部的细分，可以使用它。外层扇区延续所属父分类的角度，子分类百分比按各自父分类内部计算，阅读时需区分整体占比与组内占比。",
    "A nested donut connects parent and child categories through two rings, allowing readers to move from overall composition to finer detail. It suits broad cell classes and subtypes, taxonomic groups and functional categories. Use it to show parent shares together with their subdivisions. Outer sectors follow parent angular spans, while child percentages are calculated within each parent rather than across the entire dataset.",
    "二重ドーナツグラフは内外のリングで親カテゴリと子カテゴリを結び、全体の構成から細かな内訳をたどれるようにします。細胞の大分類とサブタイプ、分類学的グループ、機能カテゴリなどに適しています。外側の扇形は親カテゴリの角度範囲を引き継ぎ、子カテゴリの割合は各親の内部で計算されます。全体の割合と親内の割合を区別して読んでください。"
  ],
  "waffle": [
    "华夫饼图用等量方格组成一个整体，把抽象比例转化为可以直观看到的单元数量。适合展示细胞类别占比、样本构成、调查结果和完成比例；如果你希望读者快速理解大约多少份属于某一类别，可以使用它。有限网格会对比例作近似分配，改变行列数可以调整显示精度，悬浮提示仍保留真实数值与比例。",
    "A waffle chart builds a whole from equal square units, turning proportions into visible counts. It suits cell-category shares, sample composition, survey results and completion proportions when you want an intuitive part-to-whole display. A finite grid approximates proportions; adjust row and column counts to change the resolution. Tooltips retain the original values and exact shares.",
    "ワッフルグラフは等量の四角い単位で全体を構成し、割合を目で追える個数に置き換えます。細胞カテゴリの比率、サンプル構成、調査結果、達成率などを直感的に示したい場合に適しています。有限のグリッドでは割合が近似されるため、行列数で表示の細かさを調整できます。ツールチップには元の数値と正確な割合を保持します。"
  ],
  "pie-bar": [
    "饼图与条形细分先展示父分类的整体占比，再用条形图展开选中分类的内部组成，适合兼顾全局和局部细节。可用于细胞大类及亚群、物种类别和功能分类；如果你想重点解释某个大类由哪些小类组成，可以选中对应父分类。饼图描述整体份额，条形长度比较所选父分类内的子类数值，两部分应结合各自的统计口径阅读。",
    "A bar-of-pie view shows parent-category shares in a pie and expands a selected parent into child bars. It is useful for cell classes and subtypes, taxonomic categories and functional classifications when you want to explain one part of an overall composition. The pie describes shares of the whole; bar lengths compare child values within the selected parent.",
    "円グラフと内訳棒グラフは親カテゴリの全体比率を円で示し、選択した親の内部を棒で展開します。細胞の大分類とサブタイプ、分類群、機能分類などで、一つの大分類を詳しく説明したい場合に適しています。円は全体に対する割合を示し、棒の長さは選択した親の内部の数値を比較します。それぞれの集計範囲を踏まえて読んでください。"
  ],
  "bar-pie": [
    "柱状图与饼图把样本总量和内部构成放在同一视图中，帮助区分数量变化与比例变化。常用于不同样本的细胞计数、物种丰度和分类统计；如果两个样本的比例相似但总量不同，或总量接近却构成不同，这种组合更容易说明差异。柱形比较各样本总量，每个饼图独立计算本样本的分类占比。",
    "Bars with pies combine sample totals and internal composition in one view, helping distinguish changes in amount from changes in proportion. Use them for cell counts, taxon abundance and category summaries across samples. They are helpful when similar shares hide different totals or similar totals hide different mixtures. Bars compare totals, while each pie independently describes its sample composition.",
    "棒グラフと円グラフの組合せはサンプル総量と内部構成を同時に示し、量の変化と割合の変化を区別します。サンプル間の細胞数、分類群の存在量、分類集計などに適しています。割合が似ていて総量が違う場合や、総量が近く構成が違う場合に役立ちます。棒は総量を比較し、円は各サンプル内の構成比を独立に計算します。"
  ],
  "bar-letters": [
    "字母标注柱状图在类别数值的比较之上加入已有的字母分组结果，适合在实验汇报中同时呈现数值高低与比较结论。可用于处理组、品种或条件之间的结果展示；如果你已经完成统计分析，可以把对应字母放入数据字段并映射到图中。字母的含义取决于原先采用的检验与分组规则，本图只展示提供的标注，不执行检验。",
    "A bar chart with letters adds supplied group annotations to category comparisons, making amounts and comparison summaries visible together. It suits experimental treatments, varieties and conditions after statistical analysis has been completed. Map a field containing the relevant letters. Their meaning depends on the original test and grouping convention; the chart displays annotations without performing tests.",
    "文字注釈付き棒グラフはカテゴリの数値比較に既存の文字グループを加え、実験報告で量の違いと比較結果を併記します。処理群、品種、条件などの統計解析を終えた後に、対応する文字列をデータ列から指定して使用できます。文字の意味は元の検定とグループ分けの規則に依存し、図自体は検定を実行しません。"
  ],
  "box-letters": [
    "字母标注箱线图将各组的中位数、离散程度与已有比较标注放在一起，便于同时阅读分布差异和分析结论。常用于实验处理、临床分组和样本质量比较；如果你希望保留数据波动信息，又需要展示已有的字母分组结果，可以使用它。标注来自指定字段，不会根据箱体是否重叠自动判断显著性。",
    "A box plot with letters combines group medians and variability with supplied comparison annotations. It suits experimental treatments, clinical groups and sample-quality comparisons when you want to preserve distribution information while reporting existing letter groupings. Annotations come from the selected field; the chart does not infer significance from whether boxes overlap.",
    "文字注釈付き箱ひげ図は中央値やばらつきと既存の比較注釈を一緒に示します。実験処理、臨床グループ、サンプル品質の比較などで、分布の情報を残しながら文字によるグループ分けを報告したい場合に適しています。注釈は指定した列から読み込み、箱の重なり具合から有意性を自動判定することはありません。"
  ],
  "violin-comparisons": [
    "比较标注小提琴图在分布轮廓上方添加指定组之间的连线与文字，适合突出读者需要关注的组间比较。常用于表达量、药物处理和实验条件的结果汇报；如果你已有 P 值、校正后的结果或比较说明，可以选择两组并填写对应标注。连线只表达你指定的比较关系，不会自动执行统计检验，也不会替你选择多重比较方法。",
    "A violin plot with comparison brackets adds connections and labels above selected groups to emphasize specific comparisons. It suits expression measurements, drug treatments and experimental reports when P-values, adjusted results or comparison notes are already available. Select two groups and enter the label. Brackets express supplied comparisons; no statistical test or multiple-comparison procedure is performed.",
    "比較注釈付きバイオリンプロットは指定した二群を線と文字で結び、注目すべき比較を分布の上に示します。発現量、薬剤処理、実験条件の報告などで、既存のP値、補正後の結果、比較説明を記載したい場合に適しています。線は指定された比較関係を表すだけで、統計検定や多重比較手法の選択は自動では行いません。"
  ],
  "violin-horizontal": [
    "水平小提琴图将数值方向转为横向，用纵向排列的分类比较各组分布，适合名称较长或需要从上到下逐组阅读的场景。常用于组织名称、细胞群、临床队列和多条件测量；如果竖向图的分类标签显得拥挤，可以尝试这种布局。轮廓与箱线摘要的含义保持不变，仍需结合样本量和带宽解释分布形状。",
    "A horizontal violin places numeric values on the horizontal axis and stacks groups vertically. It is useful for long tissue names, cell groups, clinical cohorts and multiple conditions when category labels become crowded in a vertical chart. The orientation changes, but the density contour and statistical summaries retain their meaning. Consider sample size and bandwidth when interpreting the shape.",
    "横向きバイオリンプロットは数値軸を横にし、カテゴリを縦に並べて分布を比較します。長い組織名、細胞群、臨床コホート、多条件の測定などで、縦向きの図ではラベルが混み合う場合に適しています。向きが変わっても密度輪郭や統計要約の意味は同じであり、形状はサンプル数と帯域幅を考慮して解釈してください。"
  ],
  "violin-split": [
    "对半小提琴图把同一分类中的两个子组分别画在中心线两侧，便于直接比较它们的集中位置、离散程度与分布形状。适合比较不同组织中的两种条件、各处理下的两个群体，或配有子组字段的实验数据。需要恰好两个子组；左右两侧只是并列展示分布，不会自动进行个体配对，比较密度幅度时也应注意当前宽度归一化设置。",
    "A split violin draws two subgroups on opposite sides of the same category center, making location, spread and shape easy to compare. It suits two conditions across tissues or two populations within each treatment. Exactly two subgroups are required. The halves do not imply paired individuals, and density-width comparisons depend on the selected normalization.",
    "分割バイオリンプロットは同じカテゴリの二つのサブグループを中心線の左右に描き、集中位置、ばらつき、形状を比較します。組織ごとの二条件や処理内の二集団などに適しており、サブグループは二つである必要があります。左右の配置は個体の対応付けを意味せず、密度の幅を比較する際は正規化の設定にも注意してください。"
  ],
  "violin-half": [
    "半小提琴图只在分类中心线的一侧绘制密度轮廓，为另一侧的观测点或统计摘要留出空间。适用于细胞特征、实验测量和组间分布比较；如果你想同时呈现分布形状与每个样本，又不希望两者重叠过多，可以使用它。单侧轮廓展示的仍是完整组的数据分布，不代表只取了一半样本。",
    "A half violin draws density on one side of a category center, leaving space for observations or summaries on the other side. It suits cell features, experimental measurements and group comparisons when you want to show both distribution shape and individual samples with less overlap. A half contour still represents the full group distribution, not half the observations.",
    "半バイオリンプロットは密度輪郭を中心線の片側に描き、反対側に観測点や統計要約の空間を確保します。細胞の特徴、実験測定、群間比較などで、分布形状と個々のサンプルを重ねすぎずに示したい場合に適しています。片側の輪郭でもグループ全体の分布を表し、サンプルの半数だけを使うわけではありません。"
  ],
  "raincloud": [
    "雨云图把半小提琴的密度轮廓、箱线摘要和原始观测点分开放置，让分布形状、典型水平与样本细节可以一起阅读。常用于心理实验、临床测量、表达量和处理组比较；如果你希望读者既看到整体趋势，又能了解观测的离散程度和样本分布，可以使用它。点的位置使用稳定抖动减少遮挡，抖动方向不表示额外变量。",
    "A raincloud plot separates a half-density contour, box summary and individual observations so readers can inspect shape, typical levels and sample detail together. It suits psychological experiments, clinical measurements, expression data and treatment comparisons. Observation positions use deterministic jitter to reduce overlap; displacement along the jitter direction does not encode another variable.",
    "レインクラウドプロットは半密度輪郭、箱ひげ要約、個々の観測点を分けて配置し、形状、代表値、サンプルの詳細を一緒に読めるようにします。心理実験、臨床測定、発現量、処理群の比較などに適しています。点の重なりを減らすため安定したジッターを使いますが、ジッター方向のずれは別の変数を意味しません。"
  ],
  "violin-letters": [
    "字母标注小提琴图在保留分布轮廓与内部摘要的同时，显示你已经得到的字母分组结果。适合实验处理、表达量和不同条件的比较汇报；如果单看均值或中位数不足以解释差异，又需要展示已有的比较结论，可以使用它。字母取自指定数据字段，其统计含义需要与分析方法一起说明，本图不自动生成显著性分组。",
    "A violin plot with letters retains density contours and internal summaries while displaying supplied letter groupings. It suits treatment comparisons, expression measurements and condition reports when medians alone do not explain the distribution. Letters are read from a selected data field. Explain their interpretation alongside your analysis method; significance groups are not generated automatically.",
    "文字注釈付きバイオリンプロットは密度輪郭と内部要約を残しながら、既存の文字グループを表示します。実験処理、発現量、条件比較の報告などで、代表値だけでは説明しきれない分布と比較結果を示したい場合に適しています。文字は指定したデータ列から読み込み、その意味は解析方法と併せて説明してください。有意性グループを自動生成する機能ではありません。"
  ],
  "violin-facet": [
    "分面小提琴图按照组织、时间点或实验条件拆成多个面板，让每个面板内部的组间分布更容易比较。适合多组织表达、细胞亚群和多因素实验；如果把所有组都画在同一坐标中显得拥挤，可以使用分面保留比较结构。共用数值范围便于跨面板比较，独立范围便于观察局部形状，但两种设置下的视觉尺度含义不同。",
    "A faceted violin separates tissues, time points or conditions into panels, making within-panel group distributions easier to compare. It suits multi-tissue expression, cell populations and multifactor experiments when one crowded plot hides the comparison structure. Shared numeric ranges support comparisons between panels; independent ranges reveal local shapes but change the visual scale.",
    "ファセットバイオリンプロットは組織、時点、実験条件ごとにパネルを分け、各パネル内の分布比較を見やすくします。多組織の発現、細胞集団、多因子実験などで、一つの図が混み合う場合に適しています。共通の数値範囲はパネル間の比較に、個別の範囲は局所的な形状の観察に役立ちますが、視覚的な尺度の意味は異なります。"
  ],
  "box-facet": [
    "分面箱线图按组织、条件或批次拆分面板，并在每个面板内用箱线摘要比较多个组别。常用于多组织实验、临床分层和样本质量控制；如果你想紧凑地展示不同背景下的中位数与波动范围，可以使用它，并按需叠加原始观测点。默认共用数值范围以便比较，切换独立范围后应避免直接按箱体的屏幕高度判断跨面板差异。",
    "A faceted box plot divides tissues, conditions or batches into panels and compares group summaries within each panel. It suits multi-tissue experiments, clinical strata and quality control when you need a compact view of medians and variability, optionally with individual observations. Shared numeric ranges are the default. With independent ranges, box heights on screen cannot be compared directly between panels.",
    "ファセット箱ひげ図は組織、条件、バッチごとにパネルを分け、各パネル内で複数群の要約を比較します。多組織実験、臨床の層別解析、品質管理などで、中央値とばらつきをコンパクトに示したい場合に適し、必要に応じて観測点も重ねられます。数値範囲は既定で共通です。個別範囲にした場合、画面上の箱の高さをパネル間で直接比較しないでください。"
  ],
  "donut": [
    "甜甜圈图以环形扇区展示整体构成，保留饼图的占比表达，并为中心说明文字留下空间。适用于细胞组成、分类丰度、调查结果和资源分配；如果类别不多，且你希望同时放置总体说明或简短标题，可以选择这种形式。环形面积不提供额外变量，比例接近或类别过多时，仍建议结合数值标签或改用柱状图。",
    "A donut chart shows part-to-whole composition with ring sectors and leaves room for explanatory text in the center. It suits cell composition, category abundance, survey results and resource allocation with a small number of categories. The ring does not encode an additional variable. For similar proportions or many categories, use numeric labels or consider a bar chart.",
    "ドーナツグラフはリング状の扇形で全体の構成を示し、中心に説明文を置く空間を確保します。少数カテゴリの細胞構成、分類別の量、調査結果、資源配分などに適しています。リングの形状が追加の変数を表すわけではありません。近い割合や多数のカテゴリを比較する場合は、数値ラベルの併用や棒グラフを検討してください。"
  ],
  "fan": [
    "扇形图将分类构成安排在半圆或指定角度范围内，适合在较扁的版面中展示一个整体的组成。可用于细胞类型比例、功能分类和汇报中的构成摘要；如果你希望调整环形图的展开角度以适应布局，可以选择它。这里的角度范围是展示设置，扇区按输入分类比例分配，不代表时间、方向或周期变量。",
    "A fan chart arranges composition within a semicircle or a chosen angular span, making a part-to-whole display fit a flatter layout. It suits cell-type shares, functional categories and composition summaries in reports. Use it when an adjustable angular span better fits the page. The span is a display setting; sectors represent category shares, not time, direction or cyclic variables.",
    "扇形グラフは半円や指定した角度範囲に構成比を配置し、横長のスペースで全体の内訳を示します。細胞種の割合、機能分類、報告用の構成要約などに適しています。角度範囲はレイアウトの設定であり、扇形は入力されたカテゴリ比率に従って配分されます。時間、方向、周期を表すものではありません。"
  ],
  "donut-leaders": [
    "引线环图把分类名称与占比放在圆环外侧，通过引线连接对应扇区，减轻文字挤在图形内部的问题。适用于细胞类型、物种分类和功能构成等需要直接标注名称的展示；如果分类名称较长，或希望读者不必反复对照图例，可以使用它。类别过多仍可能造成拥挤，建议先合并过细类别或改用更便于比较的图形。",
    "A donut with leader lines places names and shares outside the ring and connects them to their sectors, reducing text crowding inside the chart. It suits cell types, taxa and functional composition when names are long or readers should not need to consult a legend repeatedly. Many categories can still become crowded; consider combining very small categories or choosing a more comparable layout.",
    "引出線付きドーナツグラフはカテゴリ名と割合をリングの外に置き、対応する扇形を線で結びます。細胞種、分類群、機能構成などで、長い名前を直接表示したい場合や凡例との照合を減らしたい場合に適しています。カテゴリが多すぎると混み合うため、細かな分類の統合や別の比較しやすい図も検討してください。"
  ],
  "nested-pie-solid": [
    "双层饼图以中心扇区表示父分类，以外围扇区表示其子分类，适合展示清晰的两级组成关系。常用于细胞大类与亚型、物种分类和功能类别；如果你想让读者从一个整体逐步看到内部细分，可以使用它。子分类的角度受所属父分类约束，标注的子类百分比按父分类内部计算，不应与内层整体百分比直接混同。",
    "A nested pie uses central sectors for parent categories and outer sectors for their children, showing a clear two-level composition. It suits cell classes and subtypes, taxonomic categories and functional groups when readers need to move from the whole to its subdivisions. Child sectors stay within their parent spans, and child percentages are calculated within each parent rather than across the whole.",
    "二重円グラフは中心の扇形で親カテゴリ、外周の扇形で子カテゴリを示し、二階層の構成関係を表します。細胞の大分類とサブタイプ、分類群、機能カテゴリなどで、全体から内訳へ読み進めたい場合に適しています。子の角度は親の範囲内に収まり、子の割合は親の内部で計算されるため、内側の全体比率と混同しないでください。"
  ],
  "waffle-dots": [
    "圆点比例图将整体转换为等量圆点，通过不同颜色的点数表现各类别份额，适合直观解释部分与整体的关系。可用于样本组成、细胞比例、调查结果和科普汇报；如果你希望比例像计数一样容易理解，可以使用它。圆点是按网格分辨率分配的显示单元，不一定代表真实的单个样本，实际比例以数值和提示为准。",
    "A dot waffle converts a whole into equal dot units and uses colored counts to explain category shares. It suits sample composition, cell proportions, surveys and educational reports when a count-like display is easier to understand. Dots are allocated display units at the chosen grid resolution, not necessarily individual samples. Refer to values and tooltips for exact proportions.",
    "ドット割合グラフは全体を等量の点に置き換え、色別の点数でカテゴリの割合を示します。サンプル構成、細胞比率、調査結果、解説資料などで、割合を個数のように直感的に伝えたい場合に適しています。点はグリッドの解像度に応じた表示単位であり、実際の個々のサンプルとは限りません。正確な割合は数値やツールチップで確認してください。"
  ],
  "waffle-icons": [
    "图标华夫饼图用等量人物图标代替方格，把分类比例转化为更容易交流的视觉单元。适合人群构成、调查样本、队列特征和面向非专业读者的汇报；如果图标的含义与你的数据对象一致，可以使用它增强直观性。每个图标是按比例分配的显示单位，不自动等于一个真实个体，用于细胞或物种数据时应明确说明这一点。",
    "An icon waffle replaces square units with equal person icons to make proportions approachable. It suits population composition, survey samples, cohort characteristics and reports for general audiences when the icon meaning fits the data. Each icon is an allocated display unit, not automatically one real person. Make this distinction clear if using person icons for cells or taxa.",
    "アイコンワッフルグラフは四角の代わりに等量の人物アイコンを使い、割合を親しみやすい単位で示します。人口構成、調査サンプル、コホートの特徴、一般向け報告など、アイコンの意味がデータに合う場合に適しています。各アイコンは比率に応じた表示単位であり、実在の一人を意味するとは限りません。細胞や分類群に用いる場合はその点を明示してください。"
  ]
};

export const chartDescriptionTranslations: Record<string, readonly [string,string]> = Object.fromEntries(
  Object.values(chartDescriptions).map(([zh,en,ja])=>[zh,[en,ja] as const])
);
