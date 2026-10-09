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
