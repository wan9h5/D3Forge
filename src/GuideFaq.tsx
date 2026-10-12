import { useState } from 'react';
import { useLocale } from './i18n';
import type { Locale } from './i18n';
import { repositoryUrl } from './SiteFooter';

export const feedbackEmail = 'wynewang0114@gmail.com';
type Localized = Record<Locale, string>;
type Faq = { id:string; question:Localized; answer:Localized; link?:'feedback'|'license'|'citation'|'gallery' };
const faqs:Faq[] = [
  {id:'free',question:{zh:'平台免费吗？',en:'Is D3Forge free?',ja:'D3Forge は無料ですか？'},answer:{
    zh:'免费。你可以直接浏览图形库、调整配置、使用示例数据或导入本地 CSV，并复制或下载完整代码，无需注册账号或购买订阅。项目以 MIT 许可证开源，也可以下载源码，在自己的电脑或服务器上运行。',
    en:'Yes. Browse the library, adjust controls, use sample data or import a local CSV, and copy or download complete code without an account or subscription. The project is open source under the MIT license, and you can also run it on your own computer or server.',
    ja:'無料です。登録やサブスクリプションなしで、グラフの選択、設定の調整、サンプルデータやローカル CSV の利用、コードのコピー・ダウンロードができます。MIT ライセンスで公開されており、自分のパソコンやサーバーでも実行できます。'}},
  {id:'privacy',question:{zh:'我的文件会被上传到服务器吗？',en:'Are my files uploaded to a server?',ja:'ファイルはサーバーにアップロードされますか？'},answer:{
    zh:'不会。CSV 解析、字段映射和图表绘制都在浏览器本地进行，D3Forge 不会把导入文件上传到服务器。网站本身的加载仍需要网络，但导入文件不参与上传。请注意，复制或下载的代码会包含当前数据；发送代码给他人或公开发布前，请检查是否包含个人信息、未公开结果或其他敏感内容。',
    en:'No. CSV parsing, field mapping, and chart rendering happen locally in your browser; D3Forge does not upload imported files. Loading the website still requires a network connection. Exported code includes your current data, so check it for personal information, unpublished results, or other sensitive content before sharing.',
    ja:'アップロードされません。CSV の解析、列の割り当て、描画はブラウザー内で行われます。サイトの読み込みには通信が必要ですが、読み込んだファイルは送信されません。書き出したコードには現在のデータが含まれるため、共有前に個人情報や未公開の結果などがないか確認してください。'}},
  {id:'missing',question:{zh:'为什么导入后有些数值或数据点没有显示？',en:'Why are some values or points missing after import?',ja:'読み込み後に一部の値や点が表示されないのはなぜですか？'},answer:{
    zh:'先检查所选字段是否对应正确的 CSV 列。空白、缺失值、无法转换成数值的文本，以及 NaN 或 Infinity 等无效数值，会在需要数值的字段中被跳过。对数坐标只接受大于 0 的值；火山图的 P 值要求 0 < p ≤ 1。不同图形还可能要求非负值、有效日期或完整分组信息。',
    en:'First check that each mapped field points to the correct CSV column. Blank or missing values, text that cannot be converted to a number, and non-finite values such as NaN or Infinity are skipped where numbers are required. Log scales accept only positive values, and volcano plots require 0 < p ≤ 1. Other charts may also require nonnegative values, valid dates, or complete group fields.',
    ja:'まず、割り当てた列が正しいか確認してください。数値が必要な列では、空欄、欠損値、数値に変換できない文字列、NaN や Infinity などを除外します。対数軸は正の値のみ、ボルケーノ図の P 値は 0 < p ≤ 1 が必要です。グラフによっては非負の値、有効な日付、グループ情報も必要です。'}},
  {id:'format',question:{zh:'支持什么文件格式？有大小限制吗？',en:'Which file format and sizes are supported?',ja:'対応するファイル形式とサイズ制限は？'},answer:{
    zh:'目前支持 CSV，最多 10 MB、10,000 行。第一行作为列名，导入后在“数据处理”中将实际列映射到图形需要的字段。不同图形的数据结构不同，例如散点图需要两列数值，分组图还需要分类列，热图通常使用样本、基因和数值的长表。建议先查看所选图形的示例数据，再整理自己的文件；Excel 文件请先另存为 CSV。',
    en:'CSV files up to 10 MB and 10,000 rows are supported. Use column names in the first row, then map your columns in the data controls. Structures vary by chart: scatter needs two numeric fields, grouped charts need categories, and heatmaps typically use long-form sample, gene, and value records. Inspect the example data first; save Excel workbooks as CSV before importing.',
    ja:'10 MB・10,000 行までの CSV に対応しています。先頭行を列名にして、読み込み後にデータ設定で列を割り当ててください。必要な構造はグラフごとに異なります。散布図には数値2列、グループ図には分類列、ヒートマップにはサンプル・遺伝子・値の縦持ちデータを使います。先にサンプルデータを確認し、Excel は CSV として保存してください。'}},
  {id:'feedback',link:'feedback',question:{zh:'有问题、建议或想要的新图形，在哪里反馈？',en:'Where can I report a problem or request a chart?',ja:'不具合や要望はどこへ連絡すればよいですか？'},answer:{
    zh:'可以通过 GitHub Issues 或下方邮箱反馈。报告问题时，请附上图形名称、复现步骤、预期与实际结果、浏览器版本，必要时提供截图和可公开的最小 CSV 示例。提出新图形需求时，说明数据结构、应用场景和希望调整的视觉效果，会更方便讨论。请不要发送未脱敏的数据。',
    en:'Use GitHub Issues or the email below. For bugs, include the chart name, steps to reproduce, expected and actual results, browser version, and a screenshot or a small CSV that is safe to share. For chart requests, describe the data structure, use case, and visual controls you need. Remove sensitive information from examples.',
    ja:'GitHub Issues または下記メールへご連絡ください。不具合には、グラフ名、再現手順、期待した結果と実際の結果、ブラウザーのバージョン、必要に応じて画像や公開可能な最小 CSV を添えてください。新しいグラフの要望には、データ構造、用途、調整したい見た目を説明してください。機密情報は取り除いてください。'}},
  {id:'commercial',link:'license',question:{zh:'可以用于商业项目吗？需要开源自己的项目吗？',en:'Can I use it commercially? Must I open source my project?',ja:'商用利用できますか？自分のプロジェクトも公開する必要がありますか？'},answer:{
    zh:'可以。D3Forge 的 MIT 许可证允许使用、复制、修改、分发、再授权和销售软件，也允许用于商业或闭源项目，不要求公开自己的源码。在分发本软件的副本或实质性部分时，需要保留原有版权声明和 MIT 许可声明。D3 及其他依赖有各自的许可证，分发时也请保留适用声明。软件按“原样”提供，没有保证；你的数据和第三方素材仍需有相应使用权。',
    en:'Yes. The MIT license allows use, copying, modification, distribution, sublicensing, and sale, including in commercial or closed-source projects. You do not have to publish your own source. When distributing copies or substantial portions of D3Forge, retain its copyright and license notice. D3 and other dependencies have their own licenses and applicable notices. The software is provided as is, without warranty; you still need rights to your data and third-party assets.',
    ja:'できます。MIT ライセンスは使用、複製、変更、配布、再許諾、販売を認め、商用・非公開プロジェクトにも利用できます。自分のソース公開は不要です。D3Forge のコピーや実質的な部分を配布する場合は、著作権表示と許諾表示を残してください。D3 などの依存関係にも各ライセンスが適用されます。ソフトウェアは無保証で提供され、データや外部素材の利用権は別途必要です。'}},
  {id:'citation',link:'citation',question:{zh:'在论文、报告或作品中如何引用 D3Forge？',en:'How should I cite D3Forge in a paper, report, or project?',ja:'論文・レポート・作品での引用方法は？'},answer:{
    zh:'可以在方法、工具说明或致谢中注明：图表使用 D3Forge 配置并导出原生 D3.js 代码，同时附上项目仓库链接。为方便复现，建议记录实际使用的发布版本或 Git 提交号及访问日期。下方是简洁的引用示例，可按期刊要求调整格式。学术引用与保留软件许可声明是两件事，引用不能代替分发代码时所需的许可声明。',
    en:'Mention in your methods, tool description, or acknowledgments that the charts were configured with D3Forge and exported as native D3.js code, and link to the repository. Record the release or Git commit you used and your access date for reproducibility. Adapt the example below to your publication style. Academic citation does not replace the license notices required when distributing software.',
    ja:'方法、ツール説明、謝辞などに「D3Forge で設定し、ネイティブ D3.js コードとして書き出した」と記載し、リポジトリへのリンクを添えてください。再現性のため、使用したバージョンまたは Git コミットとアクセス日も記録することをお勧めします。下記例を投稿先の形式に合わせて調整してください。学術的な引用はソフトウェア配布時のライセンス表示の代わりにはなりません。'}},
  {id:'export',question:{zh:'下载的代码能脱离 D3Forge 使用吗？怎么替换数据？',en:'Can exported code run outside D3Forge? How do I replace the data?',ja:'書き出したコードは単独で使えますか？データの置き換え方は？'},answer:{
    zh:'可以。复制或下载得到的是包含 D3 导入、当前数据和完整绘图逻辑的 JavaScript，绘图部分依赖 D3 和浏览器 DOM API。在支持 JavaScript 模块的 Web 项目中安装 D3，并在页面 DOM 就绪后执行代码即可；提供 #chart 容器时会使用它，否则自动创建。要更换数据，可替换 const data 数组并保留已映射的字段名，也可以先在平台重新导入 CSV 后再导出。',
    en:'Yes. The JavaScript export includes the D3 import, current data, and complete drawing logic, using D3 and browser DOM APIs. Install D3 in a web project that supports JavaScript modules and run the code after the DOM is ready. It uses a #chart container if present, or creates one. Replace the const data array while keeping mapped field names, or import a new CSV in the app and export again.',
    ja:'使えます。D3 のインポート、現在のデータ、描画処理を含む JavaScript を書き出します。JavaScript モジュールに対応した Web プロジェクトへ D3 をインストールし、DOM の準備後に実行してください。#chart があれば使用し、なければ作成します。割り当てた列名を維持して const data 配列を置き換えるか、CSV を再読み込みして書き出してください。'}},
  {id:'save',question:{zh:'刷新页面后，配置和导入数据还在吗？',en:'Will my chart settings survive a page refresh?',ja:'ページを更新しても設定は残りますか？'},answer:{
    zh:'当前配置和导入数据不会跨页面刷新保存。切换到另一种图形时，也会加载对应的默认配置和示例数据。离开或刷新前，请复制或下载完整代码，保存当前数据与绘图效果。语言偏好会记住，但它不等同于保存图表项目。',
    en:'Current settings and imported data are not saved across refreshes. Opening another chart loads its defaults and sample data. Copy or download the complete code before leaving or refreshing to keep your data and drawing logic. Your language preference is remembered, but chart projects are not saved.',
    ja:'現在の設定と読み込んだデータは、ページ更新をまたいで保存されません。別のグラフを開くと、その既定設定とサンプルデータを読み込みます。離れる前に完全なコードをコピーまたはダウンロードしてください。言語設定は記憶しますが、グラフの保存とは異なります。'}},
  {id:'statistics',question:{zh:'平台会自动完成统计分析吗？',en:'Does D3Forge perform statistical analysis automatically?',ja:'統計解析も自動で行いますか？'},answer:{
    zh:'各图形只执行对应说明中明确提供的计算，例如汇总、回归、分布估计、聚类或生存曲线计算；它们不等于完整的研究分析流程。火山图、GSEA 和部分生信图形主要展示你提供的已有结果，不自动执行差异分析或富集分析。示例数据、字母标注和比较文字用于演示配置，不能直接作为研究结论。请查看所选图形的说明，并结合实际数据核对计算方法。',
    en:'Charts perform only the calculations described for them, such as aggregation, regression, density estimation, clustering, or survival curves. These are not a complete research pipeline. Volcano, GSEA, and several bioinformatics examples display supplied results rather than running differential or enrichment analysis. Sample data, letter annotations, and comparison text demonstrate controls and are not research findings. Review the chart guidance and methods for your data.',
    ja:'集計、回帰、密度推定、クラスタリング、生存曲線など、各グラフの説明に記載した計算のみを行います。研究の解析工程全体を置き換えるものではありません。ボルケーノや GSEA などは既存の結果を表示し、差次解析や富化解析を実行しません。サンプル、文字ラベル、比較文は設定のデモ用です。グラフの説明と実データに適した方法を確認してください。'}},
  {id:'contribute',link:'gallery',question:{zh:'没有找到想要的图形，可以自己扩展吗？',en:'Can I contribute a new chart or configuration option?',ja:'必要なグラフや設定を追加できますか？'},answer:{
    zh:'可以。先在图形库搜索或按分类查找，许多常见需求已有独立样式入口或高级配置。如果仍缺少你需要的图形，可以通过 Issues 讨论，或参考仓库的贡献指南提交 Pull Request。新增图形应包含有用的示例数据、适用配置和完整 D3 源码，并让预览与导出执行同一份绘图逻辑。',
    en:'Yes. Search the library and check advanced controls first; many variants already have dedicated entries. For something new, discuss it in Issues or follow the repository contribution guide and submit a pull request. Contributions should include useful sample data, relevant controls, and complete D3 source, with the preview and export using the same drawing logic.',
    ja:'できます。まずライブラリの検索や詳細設定を確認してください。多くの形式には専用の入口があります。見つからなければ Issues で相談するか、貢献ガイドに従って Pull Request を送ってください。追加するグラフには、有用なサンプル、必要な設定、完全な D3 コードを用意し、プレビューと書き出しで同じ描画処理を使ってください。'}},
];

export function GuideFaq(){
  const locale=useLocale();
  const [open,setOpen]=useState<string|null>('free');
  const text=(zh:string,en:string,ja:string)=>({zh,en,ja})[locale];
  return <section className="guide-faq" aria-labelledby="faq-heading">
    <div className="guide-faq-heading">
      <h2 id="faq-heading">{text('常见问题','Frequently asked questions','よくある質問')}</h2>
      <p>{text('关于使用、数据与开源许可，你想知道的都在这里。还有其他问题？','Answers about usage, data, and open source licensing. Have another question?','使い方、データ、ライセンスについて。他にも質問がありますか？')}</p>
      <a className="guide-faq-email" href={`mailto:${feedbackEmail}`}>{feedbackEmail}</a>
    </div>
    <div className="guide-faq-list">{faqs.map(faq=>{
      const expanded=open===faq.id;
      return <article className={`guide-faq-item${expanded?' is-open':''}`} key={faq.id}>
        <h3><button id={`faq-question-${faq.id}`} type="button" aria-expanded={expanded} aria-controls={`faq-answer-${faq.id}`} onClick={()=>setOpen(expanded?null:faq.id)}>
          <span>{faq.question[locale]}</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button></h3>
        <div id={`faq-answer-${faq.id}`} className="guide-faq-answer" role="region" aria-labelledby={`faq-question-${faq.id}`} aria-hidden={!expanded} inert={!expanded}>
          <div><div className="guide-faq-answer-content"><p>{expanded?Array.from(faq.answer[locale]).map((character,index,characters)=><span key={`${locale}-${index}`} className="faq-reveal-character" style={{animationDelay:`${120+index*650/Math.max(1,characters.length-1)}ms`}}>{character}</span>):faq.answer[locale]}</p>
            {faq.link==='feedback'&&<p className="guide-faq-links"><a href={`${repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">GitHub Issues ↗</a><a href={`mailto:${feedbackEmail}`}>{feedbackEmail}</a></p>}
            {faq.link==='license'&&<p className="guide-faq-links"><a href={`${repositoryUrl}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">{text('阅读 MIT 许可证','Read the MIT license','MIT ライセンスを読む')} ↗</a></p>}
            {faq.link==='citation'&&<><pre className="guide-faq-citation">wan9h5. D3Forge: A visual builder for native D3.js charts.{'\n'}{repositoryUrl}{'\n'}{text('版本 / 提交号：[填写]；访问日期：[填写]。','Version / commit: [insert]; accessed: [insert date].','バージョン / コミット：[記入]；アクセス日：[記入]。')}</pre><p className="guide-faq-links"><a href={repositoryUrl} target="_blank" rel="noopener noreferrer">{text('项目仓库','Project repository','リポジトリ')} ↗</a></p></>}
            {faq.link==='gallery'&&<p className="guide-faq-links"><a href="#/gallery">{text('浏览图形库','Browse the library','ライブラリを見る')} →</a><a href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">{text('贡献指南','Contribution guide (Chinese)','貢献ガイド（中国語）')} ↗</a></p>}
          </div></div>
        </div>
      </article>;
    })}</div>
  </section>;
}
