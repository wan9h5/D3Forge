# D3Forge development rules

- Preserve the confirmed product: visual controls generate clean native D3 v7 code.
- Use a separate chart-library home with a category sidebar and chart cards.
- Keep detail pages full-width with three desktop columns: configuration, preview, read-only source; scroll each independently.
- Default the source panel to D3 logic; show mock/imported data in a separate tab. Copy and download always include both.
- Format generated D3 chains across lines and enable editor line wrapping.
- Every chart opens with useful deterministic mock data. Exports include that data.
- Preview executes the same generated source. Do not implement a separate renderer.
- Do not expose an option API, DSL, platform runtime or compiler vocabulary to users.
- Generated code depends only on D3 and DOM APIs, and can run outside this app.
- CSV is optional, local-only, and replaces mock data while preserving visual controls.
- Use text nodes for imported strings and escape script endings for iframe source.
- Keep configuration changes and code-line highlighting synchronized and locate the corresponding change inside the code editor only; never scroll the page, reset to the top, change tabs, or move focus.
- Validate statistical transformations with independent expected values.
- Run `npm test` and `npm run build` after changing generated code.
- Do not add image exports, backend, AI chart generation or bidirectional code editing without an explicit request.
- Keep the UI focused on chart construction. Group controls progressively; avoid dense dashboard decoration.
- Stage expansion: Scatter / Volcano / Box first, then Bar / Line / Violin / Manhattan.
