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
