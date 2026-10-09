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
