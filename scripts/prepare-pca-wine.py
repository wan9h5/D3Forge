"""Rebuild the bundled PCA example. Requires NumPy; no network requests.

Source: Aeberhard, S. & Forina, M. (1992). Wine. UCI ML Repository.
https://doi.org/10.24432/C5PC7J (CC BY 4.0)
Class labels remain Class 1/2/3: UCI does not identify cultivar names.
"""
from pathlib import Path
import csv
import json
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
raw = np.loadtxt(ROOT / 'public/examples/wine.data', delimiter=',')
names = ['Alcohol', 'MalicAcid', 'Ash', 'AlcalinityOfAsh', 'Magnesium',
         'TotalPhenols', 'Flavanoids', 'NonflavanoidPhenols',
         'Proanthocyanins', 'ColorIntensity', 'Hue', 'OD280_OD315', 'Proline']
x = raw[:, 1:]
z = (x - x.mean(axis=0)) / x.std(axis=0, ddof=1)
u, singular, vt = np.linalg.svd(z, full_matrices=False)
vectors = vt.T
# Fix the otherwise arbitrary signs by making each largest-magnitude coefficient positive.
signs = np.sign(vectors[np.argmax(np.abs(vectors), axis=0), np.arange(13)])
vectors *= signs
scores = z @ vectors
eigenvalues = singular ** 2 / (len(z) - 1)
correlation_loadings = vectors * np.sqrt(eigenvalues)
variance = eigenvalues / eigenvalues.sum() * 100
# Independent covariance eigendecomposition checks the SVD results up to sign.
ev, _ = np.linalg.eigh(np.cov(z, rowvar=False))
np.testing.assert_allclose(eigenvalues, ev[::-1], atol=1e-12)
np.testing.assert_allclose(scores.T @ scores / 177, np.diag(eigenvalues), atol=1e-12)
np.testing.assert_allclose(variance[:3], [36.19884810, 19.20749026, 11.12363054], atol=1e-7)

rows = []
for i, score in enumerate(scores):
    rows.append(dict(sample=f'Wine-{i+1:03d}', group=f'Class {int(raw[i,0])}', kind='sample',
                     **{f'PC{j+1}': round(float(score[j]), 10) for j in range(3)}))
for name, loading in zip(names, correlation_loadings):
    rows.append(dict(sample=name, group=None, kind='loading',
                     **{f'PC{j+1}': round(float(loading[j]), 10) for j in range(3)}))
result = dict(source='https://doi.org/10.24432/C5PC7J', license='CC BY 4.0',
              method='Column centering, sample SD (ddof=1), SVD; scores=ZV; loadings=V sqrt(lambda)',
              variance=variance[:3].tolist(), rows=rows)
(ROOT / 'src/data/winePca.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
with (ROOT / 'public/examples/wine-pca.csv').open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)
print(f'{len(scores)} samples, {len(names)} loadings; explained variance: {variance[:3]}')
