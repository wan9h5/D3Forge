// Shared verbatim with exported charts so statistics have one implementation.
export const scatterStatistics = `
  const averageRanks = values => {
    const sorted = values.map((value, index) => ({value, index}))
      .sort((a, b) => a.value - b.value);
    const ranks = Array(values.length);
    for (let start = 0; start < sorted.length;) {
      let end = start + 1;
      while (end < sorted.length && sorted[end].value === sorted[start].value) end++;
      for (let i = start; i < end; i++) ranks[sorted[i].index] = (start + end + 1) / 2;
      start = end;
    }
    return ranks;
  };
  const correlation = (rows, method = "pearson") => {
    let a = rows.map(d => d._x), b = rows.map(d => d._y);
    if (method === "spearman") { a = averageRanks(a); b = averageRanks(b); }
    const am = d3.mean(a), bm = d3.mean(b);
    const aa = d3.sum(a, v => (v - am) ** 2), bb = d3.sum(b, v => (v - bm) ** 2);
    return rows.length > 1 && aa > 0 && bb > 0
      ? Math.max(-1, Math.min(1, d3.sum(a, (v, i) => (v - am) * (b[i] - bm)) / Math.sqrt(aa * bb))) : null;
  };
  const fit = (rows, degree = 1) => {
    if (rows.length < degree + 1) return null;
    const center = d3.mean(rows, d => d._x);
    const scale = d3.max(rows, d => Math.abs(d._x - center));
    if (!(scale > 0)) return null;
    const normalized = rows.map(d => ({x: (d._x - center) / scale, y: d._y}));
    const n = degree + 1;
    const matrix = Array.from({length: n}, (_, r) =>
      Array.from({length: n + 1}, (_, k) => d3.sum(normalized, d => k === n ? d.y * d.x ** r : d.x ** (r + k)))
    );
    for (let k = 0; k < n; k++) {
      let pivot = k;
      for (let r = k + 1; r < n; r++) if (Math.abs(matrix[r][k]) > Math.abs(matrix[pivot][k])) pivot = r;
      [matrix[k], matrix[pivot]] = [matrix[pivot], matrix[k]];
      if (Math.abs(matrix[k][k]) < 1e-10) return null;
      const divisor = matrix[k][k];
      for (let j = k; j <= n; j++) matrix[k][j] /= divisor;
      for (let r = 0; r < n; r++) if (r !== k) {
        const factor = matrix[r][k];
        for (let j = k; j <= n; j++) matrix[r][j] -= factor * matrix[k][j];
      }
    }
    const coefficients = matrix.map(row => row[n]);
    const predict = value => coefficients.reduce((sum, v, i) => sum + v * ((value - center) / scale) ** i, 0);
    const mean = d3.mean(rows, d => d._y);
    const total = d3.sum(rows, d => (d._y - mean) ** 2);
    const error = d3.sum(rows, d => (d._y - predict(d._x)) ** 2);
    const quadratic = degree === 2 ? coefficients[2] / scale ** 2 : 0;
    const slope = coefficients[1] / scale - 2 * quadratic * center;
    const intercept = coefficients[0] - coefficients[1] * center / scale + quadratic * center ** 2;
    return {predict, r2: total > 0 ? 1 - error / total : null, intercept, slope, quadratic};
  };
  const bootstrapFits = (rows, degree) => {
    let seed = 123456789;
    const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
    return Array.from({length: 200}, () => fit(rows.map(() => rows[Math.floor(random() * rows.length)]), degree)).filter(Boolean);
  };
`;
