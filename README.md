# D3Forge

**Visual D3.js Code Builder** — Build D3.js visually. Preview instantly. Copy clean, native D3 code.

D3Forge 是一个通过可视化操作生成原生 D3.js 源码的纯前端工作台。选择图表后立即加载 Mock 数据；先调整效果，再复制代码并替换数据。

## 启动

需要 Node.js 22.12+ 或 24。

```bash
npm ci
npm run dev
```

打开命令显示的本地地址。发布静态网站时运行 `npm run build`，部署 `dist/` 即可。

```bash
npm test
npm run build
```

## v0.1 已实现

- 三种图表：Scatter Plot、Volcano Plot、Box Plot。
- 独立图形库主页：左侧分类菜单，内容区图形卡片；点击后进入详情页。
- 详情页全宽三栏：左侧数据处理 / 视觉配置，中间实时预览，右侧只读代码；各区域独立滚动。
- 代码区默认展示 D3.js 源码，数据独立为 Mock 数据 / CSV 数据 Tab；各页保留阅读位置，复制与下载合并完整代码。
- 生成的 D3 链式调用分行排版，编辑器自动折行。
- 每种图自带确定性 Mock 数据，复制源码也包含完整数据。
- 本地 CSV 导入、字段映射、数据前 10 行预览。
- 点半径、透明度、主色、坐标轴、网格、图例、Tooltip 和提示字段选择。
- 散点 / 火山图支持标签、缩放和平移。普通数值轴可切换对数比例尺。
- 火山图生成 `−log10(p)`、显著性分类和阈值线。
- 箱线图计算 Q1 / Median / Q3、1.5 × IQR 须线和离群值。
- 配置变更对应的最近一次新增 / 修改代码行持续高亮，在代码栏内部定位对应修改行，保留当前焦点、页面位置和当前 Tab，不重置到顶部。
- 代码语法着色；代码区 Ctrl+F 搜索，支持匹配计数、前后导航、大小写 / 全字 / 正则，Esc 关闭。
- 一键复制源码，或下载独立 `.js` 文件。

## 复制到 Web 项目

```bash
npm install d3
```

点击“复制完整代码”后粘贴到项目模块，确保在 DOM 就绪后执行。源码会使用页面的 `#chart` 容器；若没有则自动创建。没有 D3Forge 的运行时依赖。

将 `const data = [...]` 替换成自己的数组，并保持映射的字段名。例如散点图默认：

```js
const data = [
  { sample: 'S01', expressionA: 12, expressionB: 18, group: 'Control' },
];
```

CSV 可以在平台里导入后映射字段，也可以在复制出的代码中用 `const data = await d3.csv('./data.csv')` 替换。生成逻辑会将数值字段转为 Number；空白和无效数据会被跳过。

## 技术与结构

React 19 + TypeScript + Vite + D3 v7 + Zustand + CodeMirror 6 + Papa Parse。UI 使用可访问的原生表单控件和定制 CSS，当前不需要额外 UI 框架。

项目先采用单仓库、单应用。后续扩展图表时，在内部逐步分离 `charts`、`core` 和 `builder`；暂不创建多个仓库或发布独立 npm 包。详见 [架构决策](docs/architecture.md)。导出的源码始终只依赖 D3。

```text
src/model.ts       图表类型、Mock 数据、默认配置、有效性检查
src/store.ts       Zustand 配置与数据状态
src/generate.ts    原生 D3 逻辑、数据片段与完整源码生成器
src/Preview.tsx    sandbox iframe 执行同一份生成源码
src/CodePanel.tsx  逻辑 / 数据 Tab、只读编辑器、变更高亮、完整复制与下载
src/Gallery.tsx    分类菜单与图形预览卡片
src/App.tsx        页面导航与全宽三栏工作台
tests/            独立执行生成代码与统计正确性测试
```

预览使用打包在应用中的 D3，不请求外部 CDN。iframe 开启 `allow-scripts`，不允许同源权限；CSP 限制外部请求。导入字符串用 JSON 序列化嵌入源码，Tooltip 使用文本节点；插入 iframe 前转义 script 结束标签。

## 数据边界与当前限制

- CSV 最多 10 MB / 10,000 行，在浏览器本地解析；SVG 点数过多时可能变慢。
- 火山图要求 `0 < p ≤ 1`；p = 0 不擅自替换为任意小值。
- 对数坐标只接受正值；常数数据自动扩展坐标域。
- 修改数据 / 配置会重新生成预览，因此缩放位置随配置变更重置。
- 只读源码，尚无源码反向同步、图片导出、React / Vue 组件生成或后端。
- 源码高亮提示新增 / 修改行；删除功能块后，该块被移除，不保留删除行。
- 图例当前为单行，类别过多时可能超出画布；推荐少量分组。
- 当前不保存跨刷新配置，刷新后恢复默认 Mock 数据。

## 后续顺序

1. 真实浏览器交互回归与性能优化。
2. 扩展 Bar、Line、Violin、Manhattan，并复用现有控件和源码片段。
3. 根据实际使用反馈完善字段提示、数据过滤和代码片段组合。

继续坚持：用户是在用 UI 帮自己写 D3.js，不需要学习平台自创的图表 API。

## License

MIT
