# D3Forge architecture decision

Status: accepted for v0.1 development.

## One repository, one application

Keep D3Forge in one repository and retain React + TypeScript + Vite. Do not create separate chart repositories or publish a core package yet.

The product delivers native D3 source. An independent rendering library is not currently needed; exports must never require D3Forge packages.

## Internal boundaries

As new chart types are added, progressively extract the current generator into these modules:

| Module | Responsibility | Allowed dependencies |
| --- | --- | --- |
| `charts/scatter`, `charts/volcano`, `charts/box` | Chart defaults, mock data, field requirements and chart-specific source fragments | Shared generator helpers and types |
| `core` | Source composition, escaping, common scale/axis/tooltip/legend fragments | TypeScript / JavaScript utilities; no React or browser UI |
| `builder` | Controls, field mapping, state, preview, read-only source and highlighting | Chart registry, core, React, Zustand, CodeMirror |

These describe intended boundaries, not packages already created. Current source remains small enough to use the existing files. Extract modules when expanding charts rather than moving files solely to create directories.

A chart registry will associate each chart with its metadata, default configuration, mock data and generator. Keep the chart-specific transforms close to their chart; share common capabilities without forcing all charts into an artificial option format.

## When to split packages

Consider a single-repository workspace with `apps/builder` and `packages/core` only when a second real consumer needs the code generator, or independent package tests and release schedules provide a measurable benefit.

Publish individual chart packages only if chart size, dependency isolation or independent release demand justifies them. A folder per chart is sufficient for the planned chart set.

## Non-negotiable behavior

- UI controls produce readable native D3 code.
- The preview executes that same source.
- Copied source includes data and runs with D3 alone.
- Internal modularity does not introduce a public option API or a runtime dependency in exported code.
- Existing statistical and independent-execution tests protect these boundaries.

## 2026-10-09：图形库与全宽三栏工作台

本次用户确认的交互设计替代最初“图表选择栏在工作台顶部、源码在底部，配置变化后自动定位源码”的布局与滚动设计。

- 入口为独立图形库主页：左侧分类菜单，内容区展示图形预览卡片。点击卡片进入对应详情页，详情页可返回图形库。
- 桌面详情页使用全部可用宽度，按左侧配置、中间预览、右侧只读代码排列。三个区域在视口内独立滚动，使调图时可同时查看配置、效果和代码。窄屏改为纵向排列。
- 配置变化更新预览和源码，并持续高亮最近一次新增 / 修改行，下一次修改时替换高亮；根据用户后续确认，在代码栏内部定位对应修改行（删除代码块时定位保留的相邻行）；不带动页面滚动、不重置到顶部、不切换代码 Tab、不夺取操作控件的焦点。已可见的目标行不重复滚动；隐藏的代码 Tab 在再次打开时定位最近一次修改。
- 代码区默认打开“D3.js 源码”Tab，直接展示绘图逻辑；“Mock 数据”Tab 展示 `const data` 数组。导入 CSV 后对应 Tab 命名为“CSV 数据”，展示当前实际使用的数据。
- 两个 Tab 只改变阅读方式，分别保留滚动位置。复制和下载始终合并 D3 导入、当前数据和绘图逻辑，得到独立运行的完整 `.js` 文件。
- 原生 D3 生成模板将链式调用按步骤换行，辅以逻辑段落注释；编辑器开启自动折行。数据内容通过 JSON 序列化嵌入，不对用户数据做源码格式替换。
- 预览仍执行与完整导出完全一致的生成源码；主页缩略图也复用这一流程。逻辑与数据由同一次生成返回，不引入第二套绘图实现。

验证重点：配置变更只定位代码栏中的对应修改，不带动页面滚动或重置顶部；Tab 切换与数据替换正确；复制 / 下载包含逻辑与数据；原有独立执行、统计期望值和导入字符串安全测试继续通过。

### 代码高亮与搜索补充

- 关键字、字符串、数值、注释及 D3 方法使用明确的语法颜色。最近一次配置修改使用浅黄色行背景和左侧标记持续提示，不因短暂计时结束而消失。
- 修改行比较保留重复代码行的变化；关闭功能删除代码块时，高亮保留的相邻行。隐藏 Tab 的修改高亮在再次打开时仍可查看。
- 在代码区按 Ctrl+F（macOS 为 Cmd+F）打开顶部局部搜索框，也可点击底部“查找 Ctrl+F”。支持匹配计数、前后匹配、大小写、全字和正则表达式。
- Enter / Shift+Enter 切换匹配，Esc 关闭。搜索仅作用于当前逻辑或数据 Tab，保持源码只读，定位匹配时不带动页面滚动。

## 产品首页与界面主题

- 根路径 `#/` 为产品首页；`#/gallery` 为分类图形库；`#/guide` 为快速入门与数据使用须知；原有 `#/charts/<type>` 详情链接继续可用。
- 首页说明可视化配置、实时预览和原生代码导出流程，提供“开始绘图”“快速入门”入口。首页示例图继续执行与导出一致的 D3 生成源码。
- 导航和页脚提供真实 GitHub 仓库链接、使用说明与 MIT 许可证信息，不添加尚未实现的功能入口。
- 界面使用浅灰白背景、白色导航和蓝色强调色 `#356AE6`。图表配色由图表配置决定，界面主题调整不改变图表默认颜色或导出内容。
- 使用须知明确本地 CSV 处理、大小限制、刷新不保存配置、完整导出含当前数据，以及数值有效性边界。

### 首页紧凑演示

首页右侧将“配置项 + 图形”和“D3.js 代码”放在同一高度的双卡片中，通过轻微错位与淡入淡出交替展示，卡片主体桌面约 380px 高，窄屏约 320–340px 高。每 5 秒自动切换，移除底部切换和播放栏；点击卡片或使用 Enter / 空格可手动切换，操作配置控件时不切换，悬停、焦点进入或页面隐藏时暂停，减少动画偏好下只手动切换。演示配置使用独立本地状态，图形和代码复用同一次源码生成，不影响详情页配置。

首页文案保持简洁，核心表达为“调整配置 → 预览图表 → 获取 D3 源码”。保留主标题、一句产品说明、绘图与入门入口、动态演示和必要页脚；移除重复功能段落和演示卡片内的长说明。

演示图采用 7 个较大的确定性数据点，组成左下绿色大点、右上黄色小点与中间蓝色斜向笔画，隐藏坐标刻度和图例，只保留简洁辅助线；移除源码内的 D3.js 标签，源码只展示 7 行并保持无滚动条；放大配置与源码文字，以抽象形式表达配置、图形和源码之间的关系。详情页仍保留完整图表功能。

## 2026-10-10：柱状图与折线图

- 先扩展基础绘图分类，新增 Bar / Line 图形卡片和详情路由；沿用三栏工作台、逻辑 / 数据 Tab、搜索、变更行定位和完整源码导出。
- `generateSeries.ts` 负责两种图形的原生 D3 源码，预览仍执行完整导出源码，不引入另一套渲染器。
- 柱状图支持分组、堆叠、横向 / 纵向、间距、颜色、透明度与数值标签。重复分类 / 系列组合求和，缺失组合按零参与堆叠；正负值分别累加，数值轴包含零，采用线性比例尺。
- 柱状图 Tooltip 展示汇总后的分类、数值和系列字段，避免把原始单行的其他字段误当作汇总结果。
- 折线图支持多系列、数值 / 对数坐标、线宽、单调平滑曲线、可选数据点、标签与面积填充；系列内按数值 X 排序，X 字段为数值或时间序号。线性面积以零为基线，对数面积以当前数值域下界为基线。
- 每种图形提供确定性示例数据；CSV 替换数据时保留视觉配置，自动映射分类或数值字段。
- 后续继续扩展 Violin / Manhattan。

## 2026-10-10：小提琴图与曼哈顿图

- 图形库新增 Violin（统计分布）与 Manhattan（生物信息），沿用三栏工作台与统一源码导出；`generateAdvanced.ts` 输出仅依赖 D3 v7 和 DOM 的源码，预览执行同一份代码。
- 小提琴图按分类字段计算 Epanechnikov 核密度估计。每组使用稳健的自动带宽乘以可调倍率；单点或常数分组采用非零回退带宽。对各组自身的支持区间采样，避免窄分布消失。
- 提供各组等宽或按统一密度尺度显示；内部可选箱线（Q1/Q3、中位数及 1.5 × IQR 须线）、仅中位数或无摘要。观测点采用确定性抖动，修改配置时位置不随机跳动。
- 小提琴轮廓 Tooltip 展示组名、样本数、四分位数和带宽；观测点使用用户选择的原始提示字段。密度估计保持线性数值尺度。
- 曼哈顿图映射染色体、非负位置、P-value 与标签字段；染色体名称统一去除 chr 前缀，并按数字、X、Y、MT 和其他 contig 排序。P-value 仅接受 0 < p ≤ 1，纵轴使用 −log10(p)。
- 横轴累积位置依据当前数据中每条染色体的最大位置，不假定参考基因组长度。支持染色体间隔、交替颜色、显著点颜色、显著性阈值线及可选提示阈值线。
- 显著点标签按 P-value 升序选择，数量可配置；原始导入字符串始终通过文本节点显示。
- 默认示例数据固定，所有统计变换、染色体布局与原始数据均包含在完整导出中。

## 2026-10-11：基础国际化

- 全站右上角提供中文、English、日本語切换；默认中文，使用 `d3forge.locale` 保存语言偏好，并同步 HTML `lang`。浏览器禁用存储时仍可在当前会话中切换。
- 首页、图形库、快速入门、配置项、源码面板、搜索框、错误提示与无障碍标签共用 `src/i18n.ts` 和 `src/translations.ts`。每个展示翻译的组件独立订阅语言变化，动态文案通过具名占位符组合。
- 切换语言保留当前路由、配置、导入数据及源码 Tab；仅注释变化时保留编辑器滚动位置，不移动焦点。切换图形或刷新时的配置生命周期保持原有行为。
- 三个生成器接收显式语言参数，在生成注释的位置调用 `codeComment`；不对完整源码或数据进行全局替换，避免误翻译导入字符串、字段名和变量名。未传语言参数时保留生成器原有英文默认行为。
- 逻辑区、数据区、预览和完整复制 / 下载使用同一次按语言生成的源码。导出代码仍只依赖 D3 v7 和 DOM，不包含应用的翻译工具或语言状态。
- 本次支持界面与源码说明注释；数据字段、数据内容及图表中直接来自数据的标签保持原样。

## 2026-10-11：热力图与直方图

- 在统计分布分类新增 Heatmap / Histogram，支持独立详情路由、真实源码缩略图、三栏工作台、源码联动和完整导出，图形库共九种图形。
- `generateDistribution.ts` 生成原生 D3 v7 代码，预览执行同一份源码，沿用中文 / 英文 / 日语文案与源码注释。所有图形默认使用确定性示例数据。
- 热力图接收长表：列分类、行分类和颜色数值三个字段。重复坐标可求均值或求和，缺失坐标留白；分类顺序按数据首次出现顺序，不进行隐式聚类或归一化。
- 配色可选双色渐变或以零为中心的对称发散色域，支持高低值颜色、单元格间距 / 圆角 / 边框、透明度、数值标签与数值颜色图例。常数矩阵使用非零回退色域。
- 直方图只需一个有效数值字段，按当前数据最小 / 最大值划分 1–60 个等宽区间。内部边界归入右侧箱，最大值包含在最后一箱；常数或单值数据扩展为非零区间。
- 纵轴可选频数或概率密度；密度为 `count / (sampleCount * binWidth)`，柱面积总和为 1。提供箱数、颜色、透明度、坐标、网格、数值标签和区间统计提示。
- 两种图的 Tooltip 展示聚合或分箱结果，避免使用某条原始记录伪装汇总数据；导入字符串仍通过文本节点显示。
- 用独立期望值验证重复坐标均值 / 求和、缺失单元格、零值配色、分箱边界、负值、常数样本和密度面积，并覆盖 CSV 映射及配置保留。
## 2026-10-11：按图形能力扩展可选配置

- 保留基础配置，在视觉区新增折叠式高级分组。新增样式默认关闭，打开分组不改变图形，用户明确启用后才生成对应源码。配置只在适用的图形显示。
- 通用能力包括坐标轴标题、字体、刻度数量 / 格式 / 旋转，数值显示范围，网格，标签，图例布局，参考线，画布背景与四边留白。分类轴不提供数值范围；直方图横轴范围归入分箱设置，曼哈顿横轴保持染色体布局。
- 散点图增加符号形状与数值字段大小映射；火山图增加分类颜色和阈值样式；箱线图增加箱宽、离群点与中位线；柱状图增加圆角和组内间距；折线图增加曲线、虚线及面积透明度；小提琴图增加轮廓宽度、采样数、抖动和中位线；曼哈顿图增加阈值线样式；热力图增加分类排序、色域和缺失底色；直方图增加柱间距、圆角与分箱范围。
- 数值显示范围只覆盖比例尺并裁剪绘图区，不改变样本或统计摘要。直方图分箱范围会排除范围外样本，并按范围内样本重新归一化概率密度；界面明确说明两者区别。范围提交要求有限、递增；对数轴下界必须为正。
- 图例可换行、纵向排列、移到底部、截断文字并限制可见项数；完整标签保留在 title，完整数据仍导出。画布留白会限制到至少保留 40 像素绘图区，高级图例额外预留空间。
- `AdvancedConfig` 与默认值集中在 `advancedModel.ts`，`AdvancedControls.tsx` 按图形组织可用选项，`generatePresentation.ts` 复用源码生成片段。导出的代码不依赖这些应用内部文件，只依赖 D3 v7 与 DOM。
- 高级配置沿用修改源码定位与行高亮，保持页面位置、当前源码 Tab 和焦点。三种语言同步覆盖控件、帮助和导出注释。CSV 导入保留样式，大小映射字段不存在时重新选择可用数值字段。
- 验证覆盖九种图高级配置启用 / 关闭基础图层、六种散点符号、平方根大小映射独立期望值、分箱范围下的独立频数 / 密度面积、小提琴四分位数和采样数、CSV 与对数范围联动。


## 配置下拉菜单样式约定

- 图形配置下拉统一使用 `Select.tsx`，沿用语言菜单的白底圆角、柔和阴影、蓝色勾选与浅蓝选中态，不再使用系统原生弹出菜单。
- 菜单通过 portal 浮于配置面板上方，根据视口空间向上或向下展开，长列表内部滚动，避免折叠组和独立滚动容器裁切。
- 支持外部点击 / 焦点移出关闭、Esc、Tab、方向键、Home / End 和文字查找。选择时保持触发按钮焦点，图形参数与源码联动沿用原有流程。
- 输入框与下拉触发按钮聚焦使用浅蓝背景与柔和蓝色边框，支持减少动态效果的系统偏好。
