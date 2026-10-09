<div align="center">
  <img src="docs/assets/logo.svg" width="112" height="112" alt="D3Forge Logo" />
  <h1>D3Forge</h1>
  <p><strong>调好图表，带走原生 D3 源码</strong></p>
  <p>通过可视化配置构建图表，实时预览并导出可独立运行的 D3.js 代码</p>
  <p>
    <a href="#快速开始">快速开始</a> ·
    <a href="#功能概览">功能概览</a> ·
    <a href="docs/architecture.md">架构设计</a> ·
    <a href="https://github.com/wan9h5/D3Forge/issues">反馈问题</a>
  </p>
  <p>D3 v7 · React · TypeScript · MIT</p>
</div>

---

## 关于 D3Forge

D3Forge 是一个纯前端的可视化 D3.js 代码构建工具。选择图形，使用示例数据或本地 CSV 调整效果，然后把完整源码带回自己的项目。

详情页采用三栏工作台：**配置 → 实时预览 → 只读源码**。预览执行的就是生成的源码；导出的代码仅依赖 D3 和 DOM API，可直接用于其他 Web 项目。

## 功能概览

- **图形库** — 按类别浏览图表，每种图形自带确定性示例数据
- **可视化配置** — 调节点大小、透明度、颜色、坐标轴、网格、图例和悬浮提示
- **即时源码反馈** — 配置变化同步更新图表，定位并高亮对应代码行
- **源码阅读** — D3 绘图逻辑与数据分 Tab 展示，支持语法着色、自动换行和 `Ctrl+F` 搜索
- **完整导出** — 一键复制或下载 `.js`，包含绘图逻辑和当前数据
- **本地 CSV** — 浏览器内解析、字段映射与数据预览，无需上传文件
- **产品首页** — 交互式演示、快速入门与使用说明

### 已支持的图形

| 图形 | 用途 | 特性 |
| --- | --- | --- |
| Scatter Plot · 散点图 | 比较两个数值变量 | 分组配色、数值 / 对数坐标、标签、缩放和平移 |
| Volcano Plot · 火山图 | 展示差异幅度与显著性 | `−log10(p)` 转换、显著性分类、阈值线 |
| Box Plot · 箱线图 | 比较各组数据分布 | 四分位数、中位数、1.5 × IQR 须线与离群值 |

## 快速开始

本地开发建议使用 **Node.js 22.12+ 或 24**，以及 npm。

```bash
git clone https://github.com/wan9h5/D3Forge.git
cd D3Forge
npm ci
npm run dev
```

打开终端显示的地址，默认是 `http://localhost:4173`。

1. 进入「图形库」，选择一种图形
2. 在左侧调整配置，或导入 CSV 并映射字段
3. 在中间查看图表，在右侧阅读对应的 D3 源码
4. 复制完整代码，或下载 `.js` 文件

### 在自己的项目中使用源码

安装 D3：

```bash
npm install d3
```

将导出的代码放入支持 JavaScript 模块的项目，在 DOM 就绪后执行。代码优先使用页面中的 `#chart` 容器，没有该容器时会自动创建。

```html
<div id="chart"></div>
```

导出包含当前示例或 CSV 数据。也可以替换 `const data` 数组，保持映射字段名一致：

```js
const data = [
  { sample: 'S01', expressionA: 12, expressionB: 18, group: 'Control' },
  { sample: 'S02', expressionA: 24, expressionB: 31, group: 'Treatment' },
];
```

### 构建与部署

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，可部署到静态网站托管服务。页面使用 Hash 路由。

## 开发

技术栈：React 19、TypeScript、Vite、D3 v7、Zustand、CodeMirror 6、Papa Parse。

```text
src/
  App.tsx          页面导航与三栏工作台
  Home.tsx         产品首页与快速入门
  HeroDemo.tsx     配置、图形与源码的交互演示
  Gallery.tsx      图形分类与预览卡片
  model.ts         图表类型、示例数据、默认配置与有效性检查
  store.ts         配置与数据状态
  generate.ts      原生 D3 逻辑、数据与完整源码生成
  Preview.tsx      隔离执行生成源码
  CodePanel.tsx    只读编辑器、搜索、高亮与导出
  SiteFooter.tsx   项目与许可证链接
docs/
  architecture.md  产品决策与架构说明
  assets/          README 视觉资源
tests/             生成逻辑、统计计算与组件行为测试
```

项目测试与构建命令：

```bash
npm test
npm run build
```

产品约定见 [AGENTS.md](AGENTS.md)，设计演进见 [架构说明](docs/architecture.md)。

## 数据与当前限制

- CSV 在本地处理，最多 **10 MB / 10,000 行**；较大的 SVG 数据集可能影响交互速度
- 空白与无效数值会被跳过；对数坐标仅接受正值，火山图要求 `0 < p ≤ 1`
- 配置暂不跨刷新保存；切换图形会恢复该图形的默认数据和配置
- 修改配置会重新生成预览，缩放位置随之重置
- 图例为单行，建议使用少量分组
- 源码为只读，暂不提供反向编辑同步、图片导出或组件代码生成

预览使用应用内打包的 D3，通过受限 iframe 执行，无需外部 CDN。导入字符串使用文本节点展示，嵌入预览的源码会转义 script 结束标签。分享导出文件前，请确认其中的数据适合公开。

## 路线图

- [x] Scatter / Volcano / Box 图形构建与原生源码导出
- [x] 图形库、三栏工作台与代码搜索
- [x] 产品首页、交互演示与快速入门
- [ ] 完善真实浏览器交互覆盖与大数据量性能
- [ ] 按顺序扩展 Bar / Line / Violin / Manhattan

## 参与贡献

欢迎通过 [Issues](https://github.com/wan9h5/D3Forge/issues) 报告问题、讨论图表需求，或提交 Pull Request。

报告问题时，请尽量提供复现步骤、预期与实际行为、浏览器版本，以及可公开的最小数据示例。新增图形应复用配置与源码生成流程，确保预览和导出使用同一份原生 D3 代码。

## 许可证

本项目采用 [MIT License](LICENSE)。
