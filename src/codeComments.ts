import type { Locale } from './i18n';

const comments: Record<string, readonly [string, string]> = {
  "Replace this array with your own data. Keep the mapped field names.": [
    "用自己的数据替换此数组，保留已映射的字段名。",
    "この配列を自分のデータに置き換え、割り当てた項目名を維持してください。"
  ],
  "Call renderChart(container, data) in any Web project with D3 v7 installed.": [
    "在安装了 D3 v7 的 Web 项目中调用 renderChart(container, data)。",
    "D3 v7 を導入した Web プロジェクトで renderChart(container, data) を呼び出します。"
  ],
  "Canvas and plotting area.": [
    "画布与绘图区。",
    "キャンバスと描画領域。"
  ],
  "CSV values may be strings. Skip blank, missing and non-finite values.": [
    "CSV 值可能是字符串；跳过空白、缺失与非有限数值。",
    "CSV の値は文字列の場合があります。空欄、欠損、有限でない値を除外します。"
  ],
  "Color and scales.": [
    "颜色与比例尺。",
    "色とスケール。"
  ],
  "Tukey box plot: quartiles, 1.5 × IQR fences, observed whiskers.": [
    "Tukey 箱线图：四分位数、1.5 × IQR 边界与观测须线。",
    "Tukey の箱ひげ図：四分位数、1.5 × IQR の境界と観測値に基づくひげ。"
  ],
  "Horizontal reference grid.": [
    "水平参考网格。",
    "水平の補助グリッド。"
  ],
  "Unique clip id allows several independent charts on the same page.": [
    "使用唯一裁剪 ID，允许同一页面包含多个独立图表。",
    "一意のクリップ ID により、同じページに複数のチャートを表示できます。"
  ],
  "Text-only tooltip: imported field values never become HTML.": [
    "纯文本提示：导入的字段值不会转为 HTML。",
    "テキストのみのツールチップ：読み込んだ値を HTML として扱いません。"
  ],
  "Legend.": [
    "图例。",
    "凡例。"
  ],
  "Zoom changes scale domains; points keep a constant radius.": [
    "缩放改变比例尺范围；点半径保持不变。",
    "ズームでスケールの定義域を変更し、点の半径は維持します。"
  ],
  "Convert SVG coordinates into the translated plot's coordinate system.": [
    "将 SVG 坐标转换为平移后的绘图区坐标。",
    "SVG 座標を移動後の描画領域の座標系に変換します。"
  ],
  "This creates a container if your page does not already have #chart.": [
    "如果页面尚无 #chart，则自动创建容器。",
    "ページに #chart がなければ、コンテナを作成します。"
  ],
  "Sum repeated category/series pairs. Missing pairs contribute zero.": [
    "汇总重复的分类与系列组合，缺失组合按零计算。",
    "同じカテゴリと系列の値を合計し、欠損の組み合わせはゼロとします。"
  ],
  "Diverging stacks support positive and negative values independently.": [
    "发散堆叠分别处理正值与负值。",
    "発散型の積み上げで正負の値を別々に扱います。"
  ],
  "Stable numeric sorting keeps each series in X order.": [
    "稳定数值排序，让每个系列按 X 值排列。",
    "安定した数値ソートにより、各系列を X の順に並べます。"
  ],
  "Use textContent through D3 .text() for imported strings.": [
    "使用 D3 .text() 通过 textContent 显示导入的字符串。",
    "読み込んだ文字列は D3 .text() の textContent で表示します。"
  ],
  "Robust normal-reference bandwidth; fall back for singleton/constant groups.": [
    "使用稳健的正态参考带宽；单值或常数组使用备用带宽。",
    "頑健な正規参照帯域幅を使用し、単一値や定数グループには代替値を使います。"
  ],
  "Epanechnikov KDE: mean(0.75 * (1 - u²) / bandwidth), for |u| <= 1.": [
    "Epanechnikov 核密度估计：在 |u| <= 1 时计算 mean(0.75 * (1 - u²) / bandwidth)。",
    "Epanechnikov KDE：|u| <= 1 で mean(0.75 * (1 - u²) / bandwidth) を計算します。"
  ],
  "Sample each group's own support so narrow groups cannot disappear.": [
    "在各组自身的支持区间采样，避免窄分布消失。",
    "各グループの台で標本化し、狭い分布が消えないようにします。"
  ],
  "Sort autosomes numerically, then X/Y/MT, then other contigs naturally.": [
    "常染色体按数字排序，其后为 X/Y/MT，再对其他序列自然排序。",
    "常染色体を数値順、次に X/Y/MT、その他の配列を自然順に並べます。"
  ],
  "Observed maximum positions define lengths; no reference genome is assumed.": [
    "使用观测到的最大位置定义长度，不假定参考基因组。",
    "観測された最大位置で長さを定義し、参照ゲノムは仮定しません。"
  ],
  "Deterministic jitter keeps observations still when controls change.": [
    "确定性抖动让观测点在配置变化时保持位置。",
    "再現可能なジッターにより、設定変更時も観測点の位置を維持します。"
  ],
  "Label the strongest significant associations, with a configurable limit.": [
    "标注最显著的关联，标注数量可配置。",
    "最も有意な関連にラベルを付け、表示数を制限します。"
  ],
  "Aggregate repeated matrix coordinates; missing cells remain blank.": [
    "汇总重复的矩阵坐标；缺失单元格留白。",
    "重複する行列座標を集計し、欠損セルは空白にします。"
  ],
  "A diverging palette uses symmetric limits around zero.": [
    "发散配色使用以零为中心的对称范围。",
    "発散配色はゼロを中心とした対称な範囲を使用します。"
  ],
  "Use equal-width bins; include the maximum value in the final bin.": [
    "使用等宽分箱；最大值计入最后一箱。",
    "等幅のビンを使用し、最大値は最後のビンに含めます。"
  ],
  "Density is count divided by sample size and bin width; total area is one.": [
    "密度等于频数除以样本总数和箱宽；总面积为 1。",
    "密度は度数を標本数とビン幅で割った値で、面積の合計は 1 です。"
  ],
  "Explicit axis limits override automatic domains without changing the data.": [
    "显式坐标范围覆盖自动范围，不改变数据。",
    "明示的な軸範囲は自動範囲を上書きし、データは変更しません。"
  ],
  "Optional presentation settings; chart values remain unchanged.": [
    "可选展示设置，图形数据值保持不变。",
    "任意の表示設定。図のデータ値は変更しません。"
  ]
};

export function codeComment(text: string, locale: Locale): string {
  return locale === 'en' ? text : comments[text]?.[locale === 'zh' ? 0 : 1] ?? text;
}
