// Plain JavaScript is embedded unchanged in exported native D3 source.
// Missing coordinates remain null; distances use only jointly observed values.
export const heatmapMathSource = `
function normalizeMatrix(matrix, mode) {
  const result = matrix.map(row => row.slice());
  if (mode === "none") return result;
  const count = mode === "row" ? matrix.length : (matrix[0] || []).length;
  for (let i = 0; i < count; i++) {
    const values = (mode === "row" ? matrix[i] : matrix.map(row => row[i])).filter(v => v != null);
    const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length || 1));
    for (let r = 0; r < matrix.length; r++) for (let c = 0; c < matrix[r].length; c++) {
      if ((mode === "row" ? r : c) === i && matrix[r][c] != null) result[r][c] = sd ? (matrix[r][c] - mean) / sd : 0;
    }
  }
  return result;
}
function vectorDistance(a, b, metric) {
  const pairs = a.map((v, i) => [v, b[i]]).filter(p => p[0] != null && p[1] != null);
  if (!pairs.length) return Infinity;
  if (metric === "correlation") {
    const ma = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
    const mb = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
    const aa = pairs.reduce((s, p) => s + (p[0] - ma) ** 2, 0), bb = pairs.reduce((s, p) => s + (p[1] - mb) ** 2, 0);
    if (!aa || !bb) return pairs.every(p => p[0] === p[1]) ? 0 : 1;
    return Math.max(0, Math.min(2, 1 - pairs.reduce((s, p) => s + (p[0] - ma) * (p[1] - mb), 0) / Math.sqrt(aa * bb)));
  }
  const sum = pairs.reduce((s, p) => s + (metric === "manhattan" ? Math.abs(p[0] - p[1]) : (p[0] - p[1]) ** 2), 0);
  return metric === "manhattan" ? sum : Math.sqrt(sum);
}
function clusterMatrix(names, vectors, metric, linkage) {
  let nodes = names.map((name, i) => ({name, leaves:[i], height:0}));
  const distances = vectors.map(a => vectors.map(b => vectorDistance(a, b, metric)));
  while (nodes.length > 1) {
    let best = Infinity, ai = 0, bi = 1;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const ds = nodes[i].leaves.flatMap(a => nodes[j].leaves.map(b => distances[a][b]));
      const value = linkage === "single" ? Math.min(...ds) : linkage === "complete" ? Math.max(...ds) : ds.reduce((a,b) => a+b, 0) / ds.length;
      if (value < best) { best = value; ai = i; bi = j; }
    }
    const a = nodes[ai], b = nodes[bi];
    const height = Number.isFinite(best) ? Math.max(best, a.height, b.height) : Math.max(a.height, b.height) + 1;
    const merged = {children:[a,b], leaves:[...a.leaves,...b.leaves], height};
    nodes = nodes.filter((_, i) => i !== ai && i !== bi);
    nodes.push(merged);
  }
  return nodes[0] || null;
}
function cutTree(tree, count) {
  if (!tree) return [];
  const parts = [tree];
  while (parts.length < count) {
    let at = -1;
    parts.forEach((part,i) => { if (part.children && (at < 0 || part.height > parts[at].height)) at = i; });
    if (at < 0) break;
    parts.splice(at, 1, ...parts[at].children);
  }
  return parts;
}
`;
