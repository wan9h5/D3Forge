// Fixed UI text only. Imported values and field names are never translated.
export const translations: Record<string, readonly [string, string]> = {
  "单一颜色": [
    "Single color",
    "単色"
  ],
  "请导入 10 MB 以内的 CSV。": [
    "Please import a CSV smaller than 10 MB.",
    "10 MB 以下の CSV を読み込んでください。"
  ],
  "无法读取文件，请重新选择 CSV。": [
    "Unable to read the file. Please select the CSV again.",
    "ファイルを読み取れません。CSV を選び直してください。"
  ],
  "CSV 没有可用的数据行。": [
    "The CSV contains no usable rows.",
    "CSV に使用できるデータ行がありません。"
  ],
  "当前版本支持最多 10,000 行，请缩小数据后导入。": [
    "Up to 10,000 rows are supported. Reduce the data before importing.",
    "最大 10,000 行まで対応しています。データを減らして読み込んでください。"
  ],
  "当前位置": [
    "Current location",
    "現在の位置"
  ],
  "← 图形库": [
    "← Chart library",
    "← チャート一覧"
  ],
  "调整图表配置，实时预览并复制原生 D3.js 源码。": [
    "Configure your chart, preview it live, and copy native D3.js code.",
    "チャートを設定し、リアルタイムで確認して D3.js コードをコピー。"
  ],
  "配置": [
    "Configuration",
    "設定"
  ],
  "恢复默认": [
    "Reset",
    "初期設定に戻す"
  ],
  "配置类别": [
    "Configuration tabs",
    "設定タブ"
  ],
  "数据处理": [
    "Data",
    "データ"
  ],
  "视觉配置": [
    "Appearance",
    "表示設定"
  ],
  "数据源": [
    "Data source",
    "データソース"
  ],
  "行": [
    "rows",
    "行"
  ],
  "可直接使用，或替换为自己的 CSV": [
    "Use the sample or import your own CSV",
    "サンプルを使うか、CSV を読み込めます"
  ],
  "数据仅在当前浏览器处理": [
    "Data stays in this browser",
    "データはこのブラウザー内でのみ処理されます"
  ],
  "导入 CSV": [
    "Import CSV",
    "CSV を読み込む"
  ],
  "收起数据": [
    "Hide data",
    "データを閉じる"
  ],
  "查看数据": [
    "View data",
    "データを見る"
  ],
  "字段映射": [
    "Field mapping",
    "フィールドの割り当て"
  ],
  "分组字段": [
    "Group field",
    "グループ項目"
  ],
  "染色体内位置字段": [
    "Position field",
    "染色体内の位置項目"
  ],
  "分类字段": [
    "Category field",
    "カテゴリ項目"
  ],
  "X 字段 · 数值 / 时间序号": [
    "X field · number / time index",
    "X 項目 · 数値 / 時間の順序"
  ],
  "X 字段": [
    "X field",
    "X 項目"
  ],
  "P-value 字段": [
    "P-value field",
    "P 値の項目"
  ],
  "Y 字段": [
    "Y field",
    "Y 項目"
  ],
  "染色体字段": [
    "Chromosome field",
    "染色体の項目"
  ],
  "系列分组": [
    "Series field",
    "系列の項目"
  ],
  "颜色分组": [
    "Color grouping",
    "色分けの項目"
  ],
  "标签字段": [
    "Label field",
    "ラベル項目"
  ],
  "转换与显著性": [
    "Transform & significance",
    "変換と有意性"
  ],
  "P-value 阈值": [
    "P-value threshold",
    "P 値の閾値"
  ],
  "仅接受 0 < p ≤ 1；空值和 p = 0 将跳过。": [
    "Only 0 < p ≤ 1 is accepted; blanks and p = 0 are skipped.",
    "0 < p ≤ 1 のみ有効です。空欄と p = 0 は除外されます。"
  ],
  "显著性阈值线": [
    "Significance line",
    "有意性の閾値線"
  ],
  "提示阈值线": [
    "Suggestive line",
    "示唆的な閾値線"
  ],
  "提示 P-value 阈值": [
    "Suggestive P-value",
    "示唆的な P 値の閾値"
  ],
  "染色体按数字、X / Y / MT 排序，间隔与跨度根据当前数据的最大位置计算。位置必须为非负数。": [
    "Chromosomes are sorted numerically, then X / Y / MT. Spans and gaps use observed maximum positions. Positions must be nonnegative.",
    "染色体は数値、X / Y / MT の順に並びます。幅と間隔はデータの最大位置から計算します。位置は非負数が必要です。"
  ],
  "分布与统计": [
    "Distribution & statistics",
    "分布と統計"
  ],
  "轮廓表示核密度估计；带宽越大越平滑。箱线摘要显示四分位数、中位数与 1.5 × IQR 须线。使用线性数值轴。": [
    "Contours show kernel density estimates; larger bandwidths are smoother. The box summary shows quartiles, median and 1.5 × IQR whiskers. Uses a linear axis.",
    "輪郭はカーネル密度推定を示します。帯域幅が大きいほど滑らかです。箱ひげは四分位数、中央値、1.5 × IQR のひげを示します。線形軸を使用します。"
  ],
  "数值汇总": [
    "Aggregation",
    "集計"
  ],
  "同一分类与系列的多行数值自动求和；缺失组合按零参与堆叠。支持正负值，数值轴始终包含零。": [
    "Repeated category/series values are summed. Missing combinations count as zero in stacks. Positive and negative values are supported; the axis includes zero.",
    "同じカテゴリと系列の値は合計されます。欠損の組み合わせは積み上げ時にゼロとして扱います。正負の値に対応し、軸はゼロを含みます。"
  ],
  "统计方法": [
    "Statistics",
    "統計手法"
  ],
  "比例尺": [
    "Scales",
    "スケール"
  ],
  "箱体：Q1–Q3；中线：中位数。须线延伸到 1.5 × IQR 范围内的最远观测值，圆点表示离群值。": [
    "Box: Q1–Q3; center: median. Whiskers reach the furthest observations within 1.5 × IQR; dots indicate outliers.",
    "箱は Q1–Q3、中央線は中央値です。ひげは 1.5 × IQR 内の最遠の観測値まで伸び、点は外れ値を示します。"
  ],
  "X 比例尺": [
    "X scale",
    "X スケール"
  ],
  "Linear · 线性": [
    "Linear",
    "線形"
  ],
  "Log · 对数": [
    "Logarithmic",
    "対数"
  ],
  "Y 比例尺": [
    "Y scale",
    "Y スケール"
  ],
  "分布轮廓": [
    "Density shape",
    "分布の形状"
  ],
  "柱形样式": [
    "Bar style",
    "棒のスタイル"
  ],
  "线条与数据点": [
    "Lines & points",
    "線とデータ点"
  ],
  "箱体与离群点": [
    "Boxes & outliers",
    "箱と外れ値"
  ],
  "点样式": [
    "Point style",
    "点のスタイル"
  ],
  "平滑带宽倍率": [
    "Bandwidth multiplier",
    "帯域幅の倍率"
  ],
  "宽度方式": [
    "Width scaling",
    "幅の調整"
  ],
  "各组等宽": [
    "Equal width",
    "各グループで同じ幅"
  ],
  "按密度统一缩放": [
    "Common density scale",
    "密度に合わせて調整"
  ],
  "内部摘要": [
    "Inner summary",
    "内部の要約"
  ],
  "箱线与中位数": [
    "Box & median",
    "箱ひげと中央値"
  ],
  "仅中位数": [
    "Median only",
    "中央値のみ"
  ],
  "不显示": [
    "None",
    "表示しない"
  ],
  "显示观测点": [
    "Show observations",
    "観測点を表示"
  ],
  "观测点半径": [
    "Observation radius",
    "観測点の半径"
  ],
  "排列方式": [
    "Layout",
    "配置"
  ],
  "分组柱状图": [
    "Grouped bars",
    "集合棒グラフ"
  ],
  "堆叠柱状图": [
    "Stacked bars",
    "積み上げ棒グラフ"
  ],
  "横向排列": [
    "Horizontal",
    "横向き"
  ],
  "柱间距": [
    "Bar spacing",
    "棒の間隔"
  ],
  "线宽": [
    "Line width",
    "線の太さ"
  ],
  "平滑曲线": [
    "Smooth curves",
    "滑らかな曲線"
  ],
  "面积填充": [
    "Area fill",
    "面を塗りつぶす"
  ],
  "显示数据点": [
    "Show points",
    "データ点を表示"
  ],
  "点半径": [
    "Point radius",
    "点の半径"
  ],
  "离群点半径": [
    "Outlier radius",
    "外れ値の半径"
  ],
  "透明度": [
    "Opacity",
    "不透明度"
  ],
  "主色": [
    "Primary color",
    "基本色"
  ],
  "交替颜色": [
    "Alternate color",
    "交互の色"
  ],
  "显著点颜色": [
    "Significant point color",
    "有意な点の色"
  ],
  "染色体间距": [
    "Chromosome gap",
    "染色体の間隔"
  ],
  "坐标与辅助线": [
    "Axes & guides",
    "軸と補助線"
  ],
  "X 轴": [
    "X axis",
    "X 軸"
  ],
  "Y 轴": [
    "Y axis",
    "Y 軸"
  ],
  "网格": [
    "Grid",
    "グリッド"
  ],
  "图例": [
    "Legend",
    "凡例"
  ],
  "信息与交互": [
    "Information & interaction",
    "情報と操作"
  ],
  "Tooltip · 悬浮提示": [
    "Tooltip",
    "ツールチップ"
  ],
  "提示字段": [
    "Tooltip fields",
    "ツールチップの項目"
  ],
  "数值标签": [
    "Value labels",
    "値ラベル"
  ],
  "显著点标签": [
    "Significant labels",
    "有意な点のラベル"
  ],
  "数据标签": [
    "Data labels",
    "データラベル"
  ],
  "最多标注数量": [
    "Maximum labels",
    "ラベルの上限"
  ],
  "轮廓显示分组统计摘要；观测点使用所选提示字段。": [
    "Contours show group statistics; observation tooltips use the selected fields.",
    "輪郭にはグループの統計要約、観測点には選択した項目を表示します。"
  ],
  "缩放与平移": [
    "Zoom & pan",
    "ズームと移動"
  ],
  "滚轮缩放，拖动平移，双击放大。": [
    "Scroll to zoom, drag to pan, double-click to zoom in.",
    "ホイールでズーム、ドラッグで移動、ダブルクリックで拡大。"
  ],
  "画布": [
    "Canvas",
    "キャンバス"
  ],
  "宽度": [
    "Width",
    "幅"
  ],
  "高度": [
    "Height",
    "高さ"
  ],
  "实时预览": [
    "Live preview",
    "ライブプレビュー"
  ],
  "行有效": [
    "valid rows",
    "行が有効"
  ],
  "调整配置，源码与预览同步更新": [
    "Changes update both code and preview",
    "設定に応じてコードとプレビューが更新されます"
  ],
  "跳过": [
    "Skipped",
    "除外"
  ],
  "行：字段为空、数值无效，或不满足对数 / P-value 范围。": [
    "rows: missing fields, invalid values, or outside the log / P-value range.",
    "行：項目が空、数値が無効、または対数 / P 値の範囲外です。"
  ],
  "数据预览": [
    "Data preview",
    "データプレビュー"
  ],
  "前 10 行": [
    "First 10 rows",
    "先頭 10 行"
  ],
  "关闭": [
    "Close",
    "閉じる"
  ],
  "D3Forge 首页": [
    "D3Forge home",
    "D3Forge ホーム"
  ],
  "主导航": [
    "Main navigation",
    "メインナビゲーション"
  ],
  "首页": [
    "Home",
    "ホーム"
  ],
  "图形库": [
    "Charts",
    "チャート一覧"
  ],
  "快速入门": [
    "Quick start",
    "使い方"
  ],
  "D3Forge GitHub 仓库": [
    "D3Forge on GitHub",
    "D3Forge の GitHub リポジトリ"
  ],
  "调好图表": [
    "Shape your chart",
    "チャートを整えて"
  ],
  "带走 D3 源码": [
    "Take the D3 code",
    "D3 コードを持ち帰る"
  ],
  "通过可视化配置生成图表背后的原生 D3.js 源码": [
    "Visual controls turn your chart into native D3.js code",
    "見た目を調整して、チャートの D3.js コードを生成"
  ],
  "开始绘图": [
    "Start creating",
    "作成を始める"
  ],
  "← 首页": [
    "← Home",
    "← ホーム"
  ],
  "几步，把图表带回你的项目。": [
    "Bring charts to your project in a few steps.",
    "数ステップで、あなたのプロジェクトへ。"
  ],
  "先用示例数据调图，再按需要替换自己的数据。": [
    "Start with sample data, then import your own.",
    "サンプルデータで調整してから、自分のデータに置き換えましょう。"
  ],
  "选择图形": [
    "Choose a chart",
    "チャートを選ぶ"
  ],
  "打开图形库 →": [
    "Browse charts →",
    "チャート一覧へ →"
  ],
  "调整效果与数据": [
    "Adjust appearance & data",
    "表示とデータを調整する"
  ],
  "左侧调整配置，中间查看效果，右侧查看对应代码。需要自己的数据时，在“数据处理”中导入 CSV 并选择字段。": [
    "Configure on the left, preview in the center, and inspect code on the right. Import a CSV and map fields in the Data tab to use your own data.",
    "左で設定、中央でプレビュー、右でコードを確認します。自分のデータを使うには「データ」タブで CSV を読み込み、項目を割り当てます。"
  ],
  "代码区支持 Ctrl+F 搜索；绘图逻辑和数据位于不同 Tab。": [
    "Search code with Ctrl+F. Drawing logic and data have separate tabs.",
    "Ctrl+F でコードを検索できます。描画ロジックとデータは別々のタブにあります。"
  ],
  "复制完整代码": [
    "Copy full code",
    "全コードをコピー"
  ],
  "点击“复制完整代码”或下载 .js，结果包含 D3 导入、当前数据和完整绘图逻辑。": [
    "Copy the full code or download .js to get the D3 import, current data and complete drawing logic.",
    "全コードをコピーするか .js をダウンロードすると、D3 のインポート、現在のデータ、描画ロジックが含まれます。"
  ],
  "将代码放入支持 JavaScript 模块的 Web 项目，在 DOM 就绪后执行。可提供 #chart 容器，未提供时会自动创建。": [
    "Use the code in a Web project with JavaScript modules and run it after the DOM is ready. Provide a #chart container, or one will be created.",
    "JavaScript モジュールに対応した Web プロジェクトで、DOM の準備後に実行します。#chart コンテナがなければ自動で作成します。"
  ],
  "数据与使用须知": [
    "Data & usage notes",
    "データと利用上の注意"
  ],
  "CSV 在浏览器本地解析，不上传文件；当前支持最多 10 MB、10,000 行。": [
    "CSV files are parsed locally and never uploaded. Limits: 10 MB and 10,000 rows.",
    "CSV はブラウザー内で解析され、アップロードされません。上限は 10 MB、10,000 行です。"
  ],
  "当前配置不会跨刷新保存。离开或刷新页面前，请复制或下载代码；导出的代码包含当前数据，分享前请检查其中的内容。": [
    "Chart settings are not saved across refreshes. Copy or download before leaving. Exported code includes your data; review it before sharing.",
    "チャート設定は再読み込み後に保存されません。離れる前にコピーまたはダウンロードしてください。出力にはデータが含まれるため、共有前に確認してください。"
  ],
  "无效数值会跳过；对数坐标只接受正值，火山图要求 0 &lt; p ≤ 1。": [
    "Invalid values are skipped. Log axes require positive values; volcano plots require 0 < p ≤ 1.",
    "無効な値は除外されます。対数軸は正の値のみ、ボルケーノ図は 0 < p ≤ 1 が必要です。"
  ],
  "切换到另一种图形会加载该图形的默认配置和示例数据。": [
    "Switching chart types loads that chart's defaults and sample data.",
    "別の種類に切り替えると、そのチャートの初期設定とサンプルデータが読み込まれます。"
  ],
  "D3Forge 以 MIT 许可证开源。查看": [
    "D3Forge is open source under MIT. Visit the ",
    "D3Forge は MIT ライセンスのオープンソースです。"
  ],
  "GitHub 仓库": [
    "GitHub repository",
    "GitHub リポジトリ"
  ],
  "，或通过": [
    " or report problems via ",
    "を確認するか、"
  ],
  "反馈问题。": [
    ".",
    " で問題を報告してください。"
  ],
  "全部图形": [
    "All charts",
    "すべてのチャート"
  ],
  "浏览所有可用图形，选择一个开始绘制。": [
    "Browse all charts and pick one to begin.",
    "チャートを選んで作成を始めましょう。"
  ],
  "基础绘图": [
    "Basic charts",
    "基本チャート"
  ],
  "探索数值之间的关系与变化。": [
    "Explore relationships and changes in values.",
    "数値の関係と変化を調べます。"
  ],
  "统计分布": [
    "Distributions",
    "統計分布"
  ],
  "比较不同组别的数据分布。": [
    "Compare distributions across groups.",
    "グループ間の分布を比較します。"
  ],
  "生物信息": [
    "Bioinformatics",
    "バイオインフォマティクス"
  ],
  "探索效应量与统计显著性。": [
    "Explore effect sizes and significance.",
    "効果量と統計的有意性を調べます。"
  ],
  "图形分类": [
    "Chart categories",
    "チャートのカテゴリ"
  ],
  "调整配置": [
    "Adjust settings",
    "設定を調整"
  ],
  "带走 D3.js 源码": [
    "Take the D3.js code",
    "D3.js コードを取得"
  ],
  "可视化配置，带走原生 D3.js 代码。": [
    "Configure visually. Take native D3.js code.",
    "視覚的に設定して、D3.js コードを取得。"
  ],
  "页脚导航": [
    "Footer navigation",
    "フッターナビゲーション"
  ],
  "使用说明与须知": [
    "Guide & notes",
    "使い方と注意事項"
  ],
  "复制失败，请使用下载源码或选中代码复制。": [
    "Copy failed. Download the code or select and copy it.",
    "コピーできません。ダウンロードするか、コードを選択してコピーしてください。"
  ],
  "Mock 数据": [
    "Sample data",
    "サンプルデータ"
  ],
  "CSV 数据": [
    "CSV data",
    "CSV データ"
  ],
  "D3 源码": [
    "D3 source",
    "D3 ソース"
  ],
  "代码": [
    "Code",
    "コード"
  ],
  "只读": [
    "Read-only",
    "読み取り専用"
  ],
  "下载 .js": [
    "Download .js",
    ".js を保存"
  ],
  "已复制": [
    "Copied",
    "コピー済み"
  ],
  "代码内容": [
    "Source tabs",
    "コードのタブ"
  ],
  "D3.js 源码": [
    "D3.js source",
    "D3.js ソース"
  ],
  "绘图逻辑 · const data 见数据页": [
    "Drawing logic · const data is in the data tab",
    "描画ロジック · const data はデータタブにあります"
  ],
  "确定性示例数据": [
    "Deterministic sample data",
    "再現可能なサンプルデータ"
  ],
  "复制与下载始终包含数据和完整绘图逻辑。": [
    "Copy and download include data and full drawing logic.",
    "コピーと保存にはデータと描画ロジック全体が含まれます。"
  ],
  "D3.js 绘图逻辑": [
    "D3.js drawing logic",
    "D3.js 描画ロジック"
  ],
  "最近修改持续高亮 · 定位对应代码": [
    "Latest changes highlighted · locate related code",
    "最新の変更を強調 · 対応コードへ移動"
  ],
  "搜索当前代码 (Ctrl+F)": [
    "Search current code (Ctrl+F)",
    "現在のコードを検索 (Ctrl+F)"
  ],
  "查找 Ctrl+F": [
    "Find Ctrl+F",
    "検索 Ctrl+F"
  ],
  "配置与原生代码演示": [
    "Configuration and native code demo",
    "設定とコードのデモ"
  ],
  "配置与图形": [
    "Settings & chart",
    "設定とチャート"
  ],
  "查看 D3 源码": [
    "View D3 code",
    "D3 コードを見る"
  ],
  "图形": [
    "Chart",
    "チャート"
  ],
  "配置 → 图形": [
    "Settings → Chart",
    "設定 → チャート"
  ],
  "大小": [
    "Size",
    "サイズ"
  ],
  "演示点半径": [
    "Demo point radius",
    "デモの点の半径"
  ],
  "演示透明度": [
    "Demo opacity",
    "デモの不透明度"
  ],
  "演示网格": [
    "Demo grid",
    "デモのグリッド"
  ],
  "颜色": [
    "Color",
    "色"
  ],
  "查看配置与图形": [
    "View settings & chart",
    "設定とチャートを見る"
  ],
  "源码": [
    "Source",
    "ソース"
  ],
  "图形 → 代码": [
    "Chart → Code",
    "チャート → コード"
  ],
  "点大小配置对应的源码": [
    "Code for the point size setting",
    "点のサイズ設定に対応するコード"
  ],
  "预览出错：": [
    "Preview error: ",
    "プレビューエラー："
  ],
  "D3 图表实时预览": [
    "D3 chart live preview",
    "D3 チャートのライブプレビュー"
  ],
  "代码搜索": [
    "Code search",
    "コード検索"
  ],
  "查找代码": [
    "Find in code",
    "コード内を検索"
  ],
  "区分大小写": [
    "Match case",
    "大文字と小文字を区別"
  ],
  "全字匹配": [
    "Match whole word",
    "単語単位で検索"
  ],
  "正则表达式": [
    "Regular expression",
    "正規表現"
  ],
  "上一个匹配 (Shift+Enter)": [
    "Previous match (Shift+Enter)",
    "前の一致 (Shift+Enter)"
  ],
  "下一个匹配 (Enter)": [
    "Next match (Enter)",
    "次の一致 (Enter)"
  ],
  "关闭搜索 (Esc)": [
    "Close search (Esc)",
    "検索を閉じる (Esc)"
  ],
  "输入关键词": [
    "Enter a search term",
    "検索語を入力"
  ],
  "无效表达式": [
    "Invalid expression",
    "無効な式"
  ],
  "无匹配": [
    "No matches",
    "一致なし"
  ],
  "散点图": [
    "Scatter Plot",
    "散布図"
  ],
  "比较两个数值变量": [
    "Compare two numeric variables",
    "2 つの数値変数を比較"
  ],
  "火山图": [
    "Volcano Plot",
    "ボルケーノ図"
  ],
  "展示效应量与显著性": [
    "Explore effect size and significance",
    "効果量と有意性を表示"
  ],
  "箱线图": [
    "Box Plot",
    "箱ひげ図"
  ],
  "比较各组的数据分布": [
    "Compare distributions across groups",
    "グループごとの分布を比較"
  ],
  "柱状图": [
    "Bar Chart",
    "棒グラフ"
  ],
  "比较分类数值与各系列构成": [
    "Compare categories and series",
    "カテゴリと系列の構成を比較"
  ],
  "折线图": [
    "Line Chart",
    "折れ線グラフ"
  ],
  "展示数值随时间或顺序的变化": [
    "Show change over time or sequence",
    "時間や順序に沿った変化を表示"
  ],
  "小提琴图": [
    "Violin Plot",
    "バイオリン図"
  ],
  "比较各组的分布密度与统计摘要": [
    "Compare group densities and statistics",
    "グループの密度と統計要約を比較"
  ],
  "曼哈顿图": [
    "Manhattan Plot",
    "マンハッタン図"
  ],
  "展示染色体上的关联显著性": [
    "Show association significance across chromosomes",
    "染色体上の関連の有意性を表示"
  ],
  "语言": [
    "Language",
    "言語"
  ],
  "CSV 格式错误：{message}": [
    "CSV format error: {message}",
    "CSV 形式エラー：{message}"
  ],
  "开始绘制{chart}": [
    "Create {chart}",
    "{chart}を作成"
  ],
  "{dataName} · const data 数组": [
    "{dataName} · const data array",
    "{dataName} · const data 配列"
  ],
  "|log2 Fold Change| 阈值": [
    "|log2 Fold Change| threshold",
    "|log2 Fold Change| の閾値"
  ],
  "热力图": [
    "Heatmap",
    "ヒートマップ"
  ],
  "直方图": [
    "Histogram",
    "ヒストグラム"
  ],
  "用颜色比较矩阵中的数值": [
    "Compare matrix values using color",
    "色で行列の数値を比較"
  ],
  "查看单个数值变量的频数与密度": [
    "Explore a numeric variable’s frequency and density",
    "数値変数の度数と密度を確認"
  ],
  "列分类字段": [
    "Column category field",
    "列のカテゴリ項目"
  ],
  "行分类字段": [
    "Row category field",
    "行のカテゴリ項目"
  ],
  "颜色数值字段": [
    "Color value field",
    "色の数値項目"
  ],
  "数值字段": [
    "Value field",
    "数値項目"
  ],
  "矩阵汇总": [
    "Matrix aggregation",
    "行列の集計"
  ],
  "重复坐标处理": [
    "Repeated coordinates",
    "重複座標の集計"
  ],
  "均值": [
    "Mean",
    "平均"
  ],
  "求和": [
    "Sum",
    "合計"
  ],
  "使用长表数据：每行包含列分类、行分类和数值。重复坐标汇总，缺失单元格留白。": [
    "Use long-format data: each row contains column, row and value fields. Repeated coordinates are aggregated; missing cells stay blank.",
    "縦長形式を使い、各行に列カテゴリ、行カテゴリ、数値を含めます。重複座標は集計し、欠損セルは空白にします。"
  ],
  "分箱统计": [
    "Binning",
    "ビンの統計"
  ],
  "按数值范围等宽分箱，最大值计入最后一箱。概率密度除以样本总数和箱宽，总面积为 1。": [
    "Bins have equal widths across the observed range; the final bin includes the maximum. Density divides counts by sample size and bin width, giving total area 1.",
    "観測範囲を等幅に分け、最大値は最後のビンに含めます。密度は度数を標本数とビン幅で割り、面積の合計を 1 にします。"
  ],
  "单元格样式": [
    "Cell style",
    "セルのスタイル"
  ],
  "分箱样式": [
    "Bin style",
    "ビンのスタイル"
  ],
  "配色方式": [
    "Color scale",
    "配色"
  ],
  "双色渐变": [
    "Two-color gradient",
    "2 色のグラデーション"
  ],
  "以零为中心": [
    "Diverging around zero",
    "ゼロを中心に発散"
  ],
  "单元格间距": [
    "Cell spacing",
    "セルの間隔"
  ],
  "单元格圆角": [
    "Cell corner radius",
    "セルの角丸"
  ],
  "分箱数量": [
    "Number of bins",
    "ビンの数"
  ],
  "纵轴统计": [
    "Y statistic",
    "縦軸の統計"
  ],
  "频数": [
    "Count",
    "度数"
  ],
  "概率密度": [
    "Probability density",
    "確率密度"
  ],
  "高值颜色": [
    "High-value color",
    "高い値の色"
  ],
  "低值颜色": [
    "Low-value color",
    "低い値の色"
  ],
  "单元格边框": [
    "Cell borders",
    "セルの枠線"
  ],
  "提示显示当前汇总结果，不使用单条原始记录。": [
    "Tooltips show the aggregated result, not a single raw record.",
    "ツールチップは個々のレコードではなく集計結果を表示します。"
  ],
  "观测数量": [
    "Observations",
    "観測数"
  ],
  "区间": [
    "Range",
    "区間"
  ],
  "进入图形库，选择适合数据的图形。每种图形都自带确定性示例数据。": [
    "Choose a chart that fits your data from the library. Every chart includes deterministic sample data.",
    "一覧からデータに合ったチャートを選びます。各チャートには再現可能なサンプルデータがあります。"
  ],
  "自动": [
    "Automatic",
    "自動"
  ],
  "两位小数": [
    "Two decimal places",
    "小数点以下2桁"
  ],
  "百分比": [
    "Percentage",
    "パーセント"
  ],
  "紧凑单位": [
    "Compact units",
    "短縮単位"
  ],
  "科学计数": [
    "Scientific notation",
    "指数表記"
  ],
  "实线": [
    "Solid",
    "実線"
  ],
  "虚线": [
    "Dashed",
    "破線"
  ],
  "点线": [
    "Dotted",
    "点線"
  ],
  "下界": [
    "Minimum",
    "下限"
  ],
  "上界": [
    "Maximum",
    "上限"
  ],
  "范围必须有限、递增，且下界大于零。": [
    "Enter finite increasing limits with a positive minimum.",
    "有限の昇順の範囲を指定し、下限を正数にしてください。"
  ],
  "范围必须为有限数值，且下界小于上界。": [
    "Enter finite limits with the minimum below the maximum.",
    "有限の値を指定し、下限を上限より小さくしてください。"
  ],
  "已启用": [
    "Enabled",
    "有効"
  ],
  "按需开启": [
    "Optional",
    "任意"
  ],
  "启用{feature}": [
    "Enable {feature}",
    "{feature}を有効にする"
  ],
  "点形状": [
    "Point shape",
    "点の形"
  ],
  "圆形": [
    "Circle",
    "円"
  ],
  "方形": [
    "Square",
    "正方形"
  ],
  "三角形": [
    "Triangle",
    "三角形"
  ],
  "菱形": [
    "Diamond",
    "ひし形"
  ],
  "星形": [
    "Star",
    "星"
  ],
  "十字": [
    "Cross",
    "十字"
  ],
  "上调颜色": [
    "Upregulated color",
    "上昇の色"
  ],
  "下调颜色": [
    "Downregulated color",
    "低下の色"
  ],
  "非显著颜色": [
    "Nonsignificant color",
    "非有意の色"
  ],
  "阈值线颜色": [
    "Threshold color",
    "閾値線の色"
  ],
  "阈值线宽": [
    "Threshold width",
    "閾値線の太さ"
  ],
  "阈值线型": [
    "Threshold pattern",
    "閾値線の種類"
  ],
  "箱体最大宽度": [
    "Maximum box width",
    "箱の最大幅"
  ],
  "显示离群值": [
    "Show outliers",
    "外れ値を表示"
  ],
  "离群点填充": [
    "Outlier fill",
    "外れ値の塗り"
  ],
  "中位线颜色": [
    "Median color",
    "中央値線の色"
  ],
  "中位线宽": [
    "Median width",
    "中央値線の太さ"
  ],
  "柱形圆角": [
    "Bar corner radius",
    "棒の角丸"
  ],
  "组内柱间距": [
    "Within-group spacing",
    "グループ内の棒の間隔"
  ],
  "曲线类型": [
    "Curve type",
    "曲線の種類"
  ],
  "折线": [
    "Linear",
    "直線"
  ],
  "单调平滑": [
    "Monotone",
    "単調補間"
  ],
  "阶梯": [
    "Step",
    "ステップ"
  ],
  "样条": [
    "Spline",
    "スプライン"
  ],
  "线条线型": [
    "Line pattern",
    "線の種類"
  ],
  "面积填充透明度": [
    "Area opacity",
    "面の不透明度"
  ],
  "轮廓半宽比例": [
    "Violin half-width ratio",
    "輪郭の半幅比率"
  ],
  "观测点抖动宽度": [
    "Observation jitter width",
    "観測点のジッター幅"
  ],
  "密度采样数量": [
    "Density sample count",
    "密度のサンプル数"
  ],
  "行分类顺序": [
    "Row order",
    "行の並び順"
  ],
  "数据顺序": [
    "Input order",
    "データ順"
  ],
  "升序": [
    "Ascending",
    "昇順"
  ],
  "降序": [
    "Descending",
    "降順"
  ],
  "列分类顺序": [
    "Column order",
    "列の並び順"
  ],
  "柱间留白": [
    "Gap between bars",
    "棒の間隔"
  ],
  "高级配置": [
    "Advanced settings",
    "詳細設定"
  ],
  "展开查看适用于当前图形的选项，新增效果默认关闭。": [
    "Expand to see options for this chart. Additional effects start disabled.",
    "展開するとこの図に使える設定が表示されます。追加の効果は初期状態では無効です。"
  ],
  "图形专属样式": [
    "Chart-specific style",
    "図固有のスタイル"
  ],
  "高级曲线优先于基础平滑开关；面积透明度仅在开启面积填充时生效。": [
    "The advanced curve overrides smoothing. Area opacity applies when area fill is on.",
    "詳細の曲線設定が平滑化より優先されます。面の不透明度は面の塗りが有効な場合に適用されます。"
  ],
  "抖动宽度仅在显示观测点时生效。": [
    "Jitter width applies when observations are shown.",
    "ジッター幅は観測点を表示する場合に適用されます。"
  ],
  "按字段映射点大小": [
    "Map point size to a field",
    "項目で点の大きさを設定"
  ],
  "大小数值字段": [
    "Numeric size field",
    "大きさの数値項目"
  ],
  "最小点半径": [
    "Minimum point radius",
    "点の最小半径"
  ],
  "最大点半径": [
    "Maximum point radius",
    "点の最大半径"
  ],
  "非负数值按平方根映射；缺失或负值使用基础点半径。": [
    "Nonnegative values use a square-root scale; missing or negative values use the base radius.",
    "非負の値は平方根スケールを使用し、欠損値や負の値には基本の半径を使用します。"
  ],
  "柱形边框": [
    "Bar border",
    "棒の枠線"
  ],
  "箱体与离群点边框": [
    "Box and outlier border",
    "箱と外れ値の枠線"
  ],
  "点边框": [
    "Point border",
    "点の枠線"
  ],
  "边框颜色": [
    "Border color",
    "枠線の色"
  ],
  "边框宽度": [
    "Border width",
    "枠線の太さ"
  ],
  "坐标轴样式": [
    "Axis style",
    "軸のスタイル"
  ],
  "X 轴标题": [
    "X axis title",
    "X軸タイトル"
  ],
  "Y 轴标题": [
    "Y axis title",
    "Y軸タイトル"
  ],
  "刻度字号": [
    "Tick font size",
    "目盛の文字サイズ"
  ],
  "轴标题字号": [
    "Axis title font size",
    "軸タイトルの文字サイズ"
  ],
  "坐标轴颜色": [
    "Axis color",
    "軸の色"
  ],
  "刻度长度": [
    "Tick length",
    "目盛の長さ"
  ],
  "X 刻度旋转": [
    "X tick rotation",
    "X目盛の回転"
  ],
  "X 建议刻度数": [
    "Suggested X tick count",
    "X目盛数の目安"
  ],
  "X 数值格式": [
    "X number format",
    "X数値の書式"
  ],
  "Y 建议刻度数": [
    "Suggested Y tick count",
    "Y目盛数の目安"
  ],
  "Y 数值格式": [
    "Y number format",
    "Y数値の書式"
  ],
  "空标题沿用字段名；分类轴不提供数值范围与数值格式。": [
    "An empty title uses the field name. Category axes have no numeric limits or formats.",
    "空のタイトルは項目名を使用します。分類軸には数値範囲や数値書式はありません。"
  ],
  "X 显示范围": [
    "X display range",
    "X表示範囲"
  ],
  "显示范围只裁剪图形，不删除或重新汇总数据。": [
    "Display ranges clip the chart without removing or reaggregating data.",
    "表示範囲は描画を切り取り、データの削除や再集計は行いません。"
  ],
  "Y 显示范围": [
    "Y display range",
    "Y表示範囲"
  ],
  "单元格边框样式": [
    "Cell border style",
    "セル枠線のスタイル"
  ],
  "网格样式": [
    "Grid style",
    "グリッドのスタイル"
  ],
  "辅助线颜色": [
    "Guide color",
    "補助線の色"
  ],
  "辅助线宽度": [
    "Guide width",
    "補助線の太さ"
  ],
  "辅助线透明度": [
    "Guide opacity",
    "補助線の不透明度"
  ],
  "辅助线型": [
    "Guide pattern",
    "補助線の種類"
  ],
  "标签样式": [
    "Label style",
    "ラベルのスタイル"
  ],
  "标签字号": [
    "Label font size",
    "ラベルの文字サイズ"
  ],
  "标签颜色": [
    "Label color",
    "ラベルの色"
  ],
  "标签水平偏移": [
    "Label horizontal offset",
    "ラベルの水平オフセット"
  ],
  "标签垂直偏移": [
    "Label vertical offset",
    "ラベルの垂直オフセット"
  ],
  "标签数值格式": [
    "Label number format",
    "ラベルの数値書式"
  ],
  "图例样式": [
    "Legend style",
    "凡例のスタイル"
  ],
  "图例位置": [
    "Legend position",
    "凡例の位置"
  ],
  "顶部": [
    "Top",
    "上"
  ],
  "底部": [
    "Bottom",
    "下"
  ],
  "图例排列": [
    "Legend layout",
    "凡例の配置"
  ],
  "横向换行": [
    "Horizontal with wrapping",
    "横並び・折り返し"
  ],
  "纵向": [
    "Vertical",
    "縦並び"
  ],
  "图例间距": [
    "Legend spacing",
    "凡例の間隔"
  ],
  "最多图例项": [
    "Maximum legend items",
    "凡例の最大項目数"
  ],
  "图例文字长度": [
    "Legend text length",
    "凡例の文字数"
  ],
  "图例字号": [
    "Legend font size",
    "凡例の文字サイズ"
  ],
  "请先在数据处理中选择颜色或系列分组。": [
    "Choose a color or series grouping in Data first.",
    "先にデータ設定で色または系列のグループを選んでください。"
  ],
  "长图例自动换行并限制显示数量，完整数据始终保留。": [
    "Long legends wrap and limit visible items; all data is retained.",
    "長い凡例は折り返され、表示項目数が制限されます。データはすべて保持されます。"
  ],
  "参考线": [
    "Reference lines",
    "基準線"
  ],
  "垂直参考线": [
    "Vertical reference line",
    "垂直基準線"
  ],
  "X 参考值": [
    "X reference value",
    "X基準値"
  ],
  "水平参考线": [
    "Horizontal reference line",
    "水平基準線"
  ],
  "Y 参考值": [
    "Y reference value",
    "Y基準値"
  ],
  "参考线颜色": [
    "Reference color",
    "基準線の色"
  ],
  "参考线宽度": [
    "Reference width",
    "基準線の太さ"
  ],
  "参考线型": [
    "Reference pattern",
    "基準線の種類"
  ],
  "仅显示落在当前数值轴范围内的参考线；对数轴参考值必须大于零。": [
    "Reference lines appear within the current numeric range. Log-axis values must be positive.",
    "現在の数値範囲内の基準線のみ表示します。対数軸の基準値は正数にしてください。"
  ],
  "颜色数值范围": [
    "Color value range",
    "色の数値範囲"
  ],
  "发散配色仍以零为中心，使用上下界绝对值的最大值作为对称范围。": [
    "Diverging colors remain centered on zero, using the larger absolute limit symmetrically.",
    "発散配色はゼロを中心に、上下限の絶対値の大きい方を対称範囲に使用します。"
  ],
  "缺失单元格底色": [
    "Missing cell background",
    "欠損セルの背景"
  ],
  "缺失区域颜色": [
    "Missing area color",
    "欠損領域の色"
  ],
  "分箱数值范围": [
    "Binning range",
    "ビン分割の範囲"
  ],
  "范围外的样本不参与分箱；概率密度按范围内样本重新归一化。": [
    "Samples outside the range are excluded. Density is normalized using samples within the range.",
    "範囲外の標本は除外されます。確率密度は範囲内の標本で再正規化します。"
  ],
  "画布与留白": [
    "Canvas and margins",
    "キャンバスと余白"
  ],
  "画布背景": [
    "Canvas background",
    "キャンバスの背景"
  ],
  "顶部留白": [
    "Top margin",
    "上の余白"
  ],
  "右侧留白": [
    "Right margin",
    "右の余白"
  ],
  "底部留白": [
    "Bottom margin",
    "下の余白"
  ],
  "左侧留白": [
    "Left margin",
    "左の余白"
  ],
  "留白会自动限制，保证绘图区至少保留 40 像素；开启高级图例时额外预留图例空间。": [
    "Margins are capped to keep at least 40 pixels for the plot. Advanced legends reserve additional space.",
    "描画領域を40ピクセル以上確保するよう余白を制限します。詳細な凡例には追加の余白を確保します。"
  ],
  "启用点边框会同时显示数据点。": [
    "Enabling point borders also shows data points.",
    "点の枠線を有効にすると、データ点も表示されます。"
  ],
  "常用配置已配好，更多选项由你发挥": [
    "Common settings are ready. Make the rest your own.",
    "よく使う設定は準備済み。あとは自由にカスタマイズ。"
  ]
};
