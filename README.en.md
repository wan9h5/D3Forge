[简体中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

<div align="center">
  <img src="docs/assets/logo.svg" width="112" height="112" alt="D3Forge Logo" />
  <h1>D3Forge</h1>
  <p><strong>Build your chart. Take the native D3 code.</strong></p>
  <p>Configure charts visually, preview changes live, and export standalone D3.js code.</p>
  <p>
    <a href="#quick-start">Quick start</a> ·
    <a href="#features">Features</a> ·
    <a href="docs/architecture.md">Architecture (Chinese)</a> ·
    <a href="https://github.com/wan9h5/D3Forge/issues">Report an issue</a>
  </p>
  <p>D3 v7 · React · TypeScript · MIT</p>
</div>

---

## About D3Forge

D3Forge is a frontend-only visual code builder for D3.js. Choose a chart, customize it with sample data or a local CSV file, and take the complete source into your own project.

**Common settings are ready to use. The rest is yours to explore.** Each chart starts with practical defaults. Additional applicable options are grouped in advanced sections and disabled by default, so you can enable them as needed. Each chart has its own controls, expanded through real use cases and community contributions. Every adjustment produces corresponding native D3 code.

The desktop workspace has three columns: **configuration → live preview → read-only source**. The preview executes the generated source itself. Exported code depends only on D3 and DOM APIs and can run in other web projects.

## Features

- **Chart library** — Browse by chart family; every example includes deterministic sample data.
- **Visual configuration** — Adjust mark size, opacity, colors, axes, grids, legends, and tooltips.
- **Immediate source feedback** — Changes update the chart and locate and highlight the corresponding code lines.
- **Source reader** — Separate tabs for D3 logic and data, syntax highlighting, line wrapping, and `Ctrl+F` search.
- **Complete export** — Copy or download a `.js` file containing both drawing logic and current data.
- **Local CSV** — Parse, map fields, and preview data in the browser without uploading files.
- **Three languages** — Switch between Chinese, English, and Japanese; the app remembers your choice and translates generated comments too.
- **Product home** — Interactive demonstration, quick start, and usage guidance.

### Supported chart families

| Chart | Purpose | Capabilities |
| --- | --- | --- |
| Scatter plot | Compare two numeric variables | Group colors, linear/log scales, labels, zoom and pan |
| Volcano plot | Show effect size and significance | `−log10(p)`, significance classes, threshold lines |
| Box plot | Compare distributions across groups | Quartiles, median, 1.5 × IQR whiskers, outliers |
| Bar chart | Compare categories and composition | Grouped/stacked, horizontal/vertical, signed values, value labels |
| Line chart | Show change over time or sequence | Multiple series, smooth curves, points, area fill, linear/log scales |
| Violin plot | Compare distribution densities | Bandwidth, horizontal/split/half/raincloud layouts, subgroups, facets, box summaries, jittered observations |
| Manhattan plot | Show chromosome association significance | Chromosome order, cumulative position, alternating colors, significance/suggestive thresholds, labels |
| Heatmap | Compare matrix values | Long-form mapping, mean/sum for duplicate coordinates, sequential/zero-centered diverging colors, numeric legend |
| Histogram | Inspect a variable's distribution | Equal-width bins, counts/density, maximum included in the last bin |
| Pie / donut | Show categorical composition | Pie/donut/sector, angles and corner radius, leader labels, center text |
| Pie matrix | Compare composition across rows and columns | Long-form mapping, independent cell proportions, gaps for missing combinations, consistent category colors |
| Nested pie | Show two-level categories | Parent/child records, automatic parent totals, aligned child angles, donut variants |
| Waffle | Represent proportions with equal units | Squares/dots/person icons, adjustable grid, largest-remainder allocation, exact proportions in tooltips |
| Bar of pie | Inspect one parent's composition | Parent pie, selectable category, child bars, guide links |
| Bar with pies | Compare totals and composition together | Sample total bars, per-sample category pies, independent proportions |

### Scatter extensions and 3D

Examples cover joint analysis, grouped regression, fold change, equations and R², marginal distributions, bubble matrices, ranked points, density, motif results, paired observations, continuous color, GSEA NES/FDR, correlation, and categorical/gradient 3D scatter. Each has dedicated field mappings and controls. Confidence bands, size mapping, and point borders can be enabled as needed.

Scatter examples use 6–36 deterministic records to demonstrate configuration. Downloads include the data array and complete drawing, statistical, and interaction logic. Replace the data while keeping the mapped field names. The 3D charts implement projection, depth sorting, rotation, and zoom with D3 and SVG, without an additional runtime dependency.

- Numeric scatter: two numeric fields, optionally labels, categories, size, and continuous color; 3D adds a third numeric field.
- Bubble matrix: row category, column category, nonnegative size, and color value. Duplicate coordinates are not automatically aggregated.
- Paired scatter: subject ID, condition, value, and optional cohort. Repeated observations within the same cohort, subject, and condition are averaged.
- GSEA combination: pathway, NES, and FDR (0–1). HOMER/motif charts take previously computed significance and enrichment results.

Regression supports linear and quadratic models. Optional 95% confidence bands use 200 paired bootstrap resamples with a fixed seed and show pointwise intervals for the mean curve, not individual prediction intervals. Pearson/Spearman charts do not generate P values; Spearman uses average ranks for ties. Upstream analyses such as GSEA, HOMER, and PCA are not performed in the browser.

### Bar and histogram extensions

An initial set of 18 entries covers error bars, two-track circular bars, linked percentage composition, butterfly, vertical, polar, grouped, dot, stacked, horizontal stacked, 3D, bottom aggregation, extruded, diverging, horizontal grouped, triangle, broken-axis bars, and histograms with fitted curves. Each includes small deterministic data, dedicated mappings, and Chinese/English/Japanese controls and source comments.

- Category bars use long-form `category,series,value` data. Series is optional; duplicate combinations can be summed or averaged. Diverging bars preserve input signs; percentage and radial layouts require nonnegative values.
- Error bars can calculate means, sample SD, SEM, or Student t 95% confidence intervals for the mean from repeated observations. No error estimate is made for `n < 2`. Summary data can map center/lower/upper fields, with one row per category/series combination. No significance tests are generated.
- Histograms take one numeric field. Equal-width bins support counts and probability density; normal approximations and kernel density curves use matching vertical units. A normal approximation is not a normality test.
- Dot bars offer unit size and column controls; a final partial unit is encoded by dot area. Percentage links show composition changes, not individual flows.
- Two-track circular bars select inner/outer series and shared or independent ranges. They do not parse genomic coordinates. 3D bars use native SVG projection, depth sorting, rotation, and zoom for small categorical matrices.
- Broken axes explicitly mark omitted intervals. Values inside the gap appear as hollow points with original values in tooltips. Bottom connecting surfaces and extruded sides are decorative and encode no additional quantities.

### Dual axes, grouped stacks, and bar shapes

Another 14 entries provide ice-cream, pencil, background stem, up/down, dual-axis bar/line, curved percentage stacks, 2.5D platforms, dual-axis bars, grouped stacks, linked stacks, dual-axis GO, grouped polar, stack/line, and gene up/down layouts. Existing bar/pie, GSEA NES/FDR, and polar entries remain available.

- Dual-axis data uses `category,value,secondary`. Each metric has its own aggregation and scale. The right axis supports a title/unit, tick format, and custom range. The P-value transform accepts only `0 < P ≤ 1`, aggregates first, then computes `−log10(P)`; the aggregate must also be valid. GO defaults to the minimum P value to show the most significant record in a category. This is not a combined P value or an enrichment test. Axis colors identify the metrics; heights cannot be compared directly across axes.
- Grouped stacks use `category,cohort,series,value`: cohorts sit side by side within each category, and components stack within each cohort. Missing combinations become zero; duplicates are summed or averaged. Grouped polar charts place series side by side within category sectors on a shared radial scale.
- Stack links offer straight/curved paths and boundary lines/bands to show aggregate changes of the same component. Stack/line charts average the selected trend field per category and share the stack's numeric axis. Use dual axes for different units.
- Up/down bars place selected nonnegative series above and below zero; lower ticks show magnitudes. Gene up/down bars retain input signs and use direction colors. They do not perform differential analysis.
- Ice-cream sticks, pencil tips, background references, and 2.5D platforms have dedicated controls. Decoration does not move the value-encoding endpoint. Reference values do not cap the data range.

### Composition data

Composition charts accept nonnegative long-form CSV data and sum duplicate categories. Pie/waffle charts need category and value; pie matrices add row and column groups; nested pie and bar-of-pie need parent, child, and value; bar-with-pies needs sample, category, and value. Map your actual CSV column names in the data controls.

Proportions are calculated independently per sample or matrix cell. Nested pies show each parent's share of the total on the inner ring; outer angles follow the parent, and outer percentages are relative to that parent. Waffle units approximate proportions while tooltips retain exact values. Charts display supplied summaries; they do not infer biological categories or run significance tests.

### Choose a style directly

The library has **78 example entries**, organized by scatter, line, bar, box, violin, pie, waffle, histogram, heatmap, volcano, and Manhattan families. Variants are grouped with their family. Open donut, sector, or leader-label styles directly from their cards.

Violin variants use `group,value`, with optional `sex` subgroup, `tissue` facet, and `letter` annotation fields; all column names are configurable. Split violins require exactly two subgroups. Facets share a numeric range by default, with independent ranges available.

Bar, box, and violin charts can read existing letter annotations. Violins also support manual comparison brackets and text. **Statistical tests and P values are not generated. Sample letters and comparison text are illustrative.**

## Quick start

For local development, use **Node.js 22.12+ or 24** and npm.

```bash
git clone https://github.com/wan9h5/D3Forge.git
cd D3Forge
npm ci
npm run dev
```

Open the address printed in the terminal, normally `http://localhost:4173`.

1. Open the chart library and choose a chart.
2. Adjust the controls, or import a CSV and map its fields.
3. Inspect the chart in the center and the D3 source on the right.
4. Copy the complete code or download the `.js` file.

### Use exported source in your project

Install D3:

```bash
npm install d3
```

Run the exported code after the DOM is ready in a project supporting JavaScript modules. It uses an existing `#chart` container, or creates one if absent.

```html
<div id="chart"></div>
```

Exports include the current sample or CSV data. You can replace `const data` while preserving mapped field names:

```js
const data = [
  { sample: 'S01', expressionA: 12, expressionB: 18, group: 'Control' },
  { sample: 'S02', expressionA: 24, expressionB: 31, group: 'Treatment' },
];
```

### Build and deploy

```bash
npm run build
npm run preview
```

Deploy `dist/` to a static host. Navigation uses hash routing.

## Development

Stack: React 19, TypeScript, Vite, D3 v7, Zustand, CodeMirror 6, and Papa Parse.

```text
src/
  App.tsx             Navigation and three-column workspace
  Home.tsx            Product home and quick start
  HeroDemo.tsx        Interactive controls/chart/source demo
  Gallery.tsx         Chart families and preview cards
  model.ts            Types, sample data, defaults, validation
  store.ts            Configuration and data state
  generate.ts         D3 logic, data, and complete source generation
  generateSeries.ts   Base bar and line generation
  generateBars.ts     Extended bar layouts
  generateBarExtensions.ts Dual-axis, grouped-stack, and grouped-polar layouts
  generateAdvanced.ts Manhattan generation
  generateViolin.ts   Violin, raincloud, and faceted distributions
  chartEntries.ts     Library entries and default styles
  Preview.tsx         Isolated execution of generated source
  CodePanel.tsx       Read-only editor, search, highlighting, export
  SiteFooter.tsx      Project and license links
docs/
  architecture.md     Product decisions and architecture (Chinese)
  assets/             README visual assets
tests/                Generation, statistics, and component behavior
```

Validation commands:

```bash
npm test
npm run build
```

See [AGENTS.md](AGENTS.md) for development rules and [Architecture](docs/architecture.md) (Chinese) for design decisions.

## Data and current limitations

- CSV files are processed locally, up to **10 MB / 10,000 rows**. Larger SVG datasets can affect interaction speed.
- Blank/invalid numbers are skipped. Log scales require positive values; volcano charts require `0 < p ≤ 1`.
- Configuration does not persist across reloads. Switching charts restores that chart's default data and controls.
- Configuration changes regenerate the preview and reset its zoom position.
- Bar charts sum duplicate category/series combinations by default, with mean aggregation available. Numeric axes are linear and include zero.
- Line X fields accept numbers or time indices. Convert date strings to numbers first; data is sorted by X.
- Violins use a linear numeric axis and Epanechnikov kernel density estimation with a bandwidth multiplier. Single-point/constant groups use fallback bandwidths; interpret shape alongside sample size.
- Manhattan positions must be nonnegative and P values satisfy `0 < p ≤ 1`. Chromosome spans come from maximum positions in current data, not full reference-genome lengths.
- The default Manhattan threshold of `5e-8` is adjustable. Significant-point labels prioritize the smallest P values and can be limited in number.
- Basic legends use one row; advanced legends support wrapping, vertical layout, position, font size, and visible-item limits. All data remains included.
- Source is read-only. Bidirectional editing, image export, and component code generation are not currently available.

Previews use bundled D3 in a restricted iframe without an external CDN. Imported strings are rendered as text nodes, and script end tags are escaped in embedded source. Before sharing an export, check that its included data is suitable for disclosure.

## Roadmap

- [x] Scatter / Volcano / Box with native source export
- [x] Chart library, three-column workspace, code search
- [x] Product home, interactive demo, quick start
- [ ] Broader real-browser interaction coverage and large-dataset performance
- [x] Bar / Line with source export
- [x] Violin / Manhattan with source export
- [x] Heatmap / Histogram and six composition families with dedicated mappings and controls

## Optional advanced controls

Basic controls remain readily available. Collapsible, initially disabled advanced sections expose applicable axes, domains, grids, labels, legends, reference lines, backgrounds, spacing, and chart-specific styles. Numeric display domains only clip the view; histogram bin ranges filter observations and renormalize density.

## Contributing

Use [Issues](https://github.com/wan9h5/D3Forge/issues) to report bugs and discuss chart requests, or submit a pull request. See the [contribution guide](CONTRIBUTING.md) (Chinese) for extension steps and PR requirements.

Include reproduction steps, expected/actual behavior, browser version, and a minimal dataset safe to share. New charts should reuse the configuration and source-generation flow so that preview and export execute the same native D3 code.

## License

Released under the [MIT License](LICENSE).
