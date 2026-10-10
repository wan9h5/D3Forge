import { t, useLocale } from './i18n';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { EditorState, StateEffect, StateField, type Range } from '@codemirror/state';
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { basicSetup } from 'codemirror';
import { openSearchPanel, search } from '@codemirror/search';
import { changedCodeLines, codeSyntax, createCodeSearchPanel } from './editorTools';
import type { CodeParts } from './generate';

const highlight = StateEffect.define<number[]>();
const highlightedLines = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (value, tr) => {
    value = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(highlight)) {
        const marks: Range<Decoration>[] = effect.value
          .filter(line => line <= tr.state.doc.lines)
          .map(line => Decoration.line({ class: 'code-changed' }).range(tr.state.doc.line(line).from));
        value = Decoration.set(marks, true);
      }
    }
    return value;
  },
  provide: field => EditorView.decorations.from(field),
});

function CodeEditor({ source, visible, label }: { source: string; visible: boolean; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const previous = useRef(source);
  const pendingLocation = useRef<number | null>(null);

  useEffect(() => {
    editor.current = new EditorView({
      parent: ref.current!,
      state: EditorState.create({
        doc: source,
        extensions: [
          basicSetup,
          javascript(),
          codeSyntax,
          search({ top: true, createPanel: createCodeSearchPanel }),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          EditorView.contentAttributes.of({ 'aria-label': label, tabindex: '0' }),
          EditorView.lineWrapping,
          // Handle scrolling inside this editor only, including on narrow screens.
          EditorView.scrollHandler.of((view, range) => {
            const scroller = view.scrollDOM;
            const block = view.lineBlockAt(range.head);
            const offset = view.documentTop - scroller.getBoundingClientRect().top + scroller.scrollTop;
            const top = block.top + offset;
            const bottom = block.bottom + offset;
            const margin = Math.min(32, scroller.clientHeight / 4);
            if (top < scroller.scrollTop) {
              scroller.scrollTop = Math.max(0, top - margin);
            } else if (bottom > scroller.scrollTop + scroller.clientHeight) {
              scroller.scrollTop = Math.max(0, bottom - scroller.clientHeight + margin);
            }
            return true;
          }),
          highlightedLines,
          EditorView.theme({
            '&': { height: '100%', fontSize: '13px', backgroundColor: '#fbfcfe', color: '#304457' },
            '.cm-scroller': { overflow: 'auto', fontFamily: '"SFMono-Regular", Consolas, monospace', lineHeight: '1.75' },
            '.cm-gutters': { background: '#f2f5f9', color: '#98a7b5', border: 'none', borderRight: '1px solid #e5ebf1' },
            '.cm-content': { padding: '16px 0' },
            '.cm-line': { padding: '0 16px' },
            '.cm-activeLine, .cm-activeLineGutter': { background: 'transparent' },
            '.cm-line.code-changed': { backgroundColor: '#fff0bf', boxShadow: 'inset 3px 0 #d99518' },
            '.code-keyword': { color: '#8b46b7', fontWeight: '600' },
            '.code-string': { color: '#24754d' },
            '.code-number': { color: '#b25d18' },
            '.code-comment': { color: '#7a8d9d', fontStyle: 'italic' },
            '.code-function': { color: '#2364b3' },
            '.code-name': { color: '#176c80' },
            '.code-operator': { color: '#596578' },
            '.cm-searchMatch': { backgroundColor: '#ffe39a', outline: '1px solid #edbd4c' },
            '.cm-searchMatch-selected': { backgroundColor: '#ffc966', outline: '2px solid #d99518' },
            '&.cm-focused': { outline: 'none' },
          }),
        ],
      }),
    });
    return () => { editor.current?.destroy(); };
  }, []);
  useEffect(() => {
    const view = editor.current;
    if (!view || source === previous.current) return;
    // A language-only update keeps the editor's scroll and current tab in place.
    const withoutComments = (text: string) => text.replace(/^\s*\/\/[^\n]*/gm, '');
    const commentsOnly = withoutComments(previous.current) === withoutComments(source);
    const previousLines = previous.current.split('\n');
    const nextLines = source.split('\n');
    const firstDifference = nextLines.findIndex((line, index) => line !== previousLines[index]);
    // A removed block has no added lines: locate its surviving neighbouring line.
    const targetLine = firstDifference >= 0 ? firstDifference + 1 : nextLines.length;
    const changed = changedCodeLines(previous.current, source);
    const { scrollTop, scrollLeft } = view.scrollDOM;
    const selection = view.state.selection.main;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: source },
      selection: { anchor: Math.min(selection.anchor, source.length), head: Math.min(selection.head, source.length) },
      effects: commentsOnly ? [] : highlight.of(changed),
    });
    // Preserve scroll until the visible editor can locate the changed code.
    view.scrollDOM.scrollTop = scrollTop;
    view.scrollDOM.scrollLeft = scrollLeft;

    pendingLocation.current = commentsOnly ? null : view.state.doc.line(targetLine).from;
    previous.current = source;
  }, [source]);
  useEffect(() => {
    const view = editor.current;
    if (!visible || !view) return;
    if (pendingLocation.current !== null) {
      view.dispatch({ effects: EditorView.scrollIntoView(pendingLocation.current, { y: 'nearest' }) });
      pendingLocation.current = null;
    }
    view.requestMeasure();
  }, [source, visible]);
  useEffect(() => {
    editor.current?.contentDOM.setAttribute('aria-label', label);
  }, [label]);
  return <div className="code-editor" ref={ref}/>;
}

export function CodePanel({ code, dataName }: { code: CodeParts; dataName: string }) {
  useLocale();
  const [tab, setTab] = useState<'logic' | 'data'>('logic');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => { setCopied(false); }, [code.source]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code.source);
      setCopied(true);
      setError('');
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch { setError('复制失败，请使用下载源码或选中代码复制。'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([code.source], { type: 'text/javascript' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'd3forge-chart.js';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function switchTab(event: KeyboardEvent<HTMLButtonElement>) {
    const next = event.key === 'Home' ? 'logic' : event.key === 'End' ? 'data'
      : event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? (tab === 'logic' ? 'data' : 'logic') : null;
    if (!next) return;
    event.preventDefault();
    setTab(next);
    document.getElementById(`source-tab-${next}`)?.focus();
  }
  const dataLabel = dataName === 'Mock data' ? t("Mock 数据") : t("CSV 数据");
  function openSearch() {
    const element = panel.current?.querySelector<HTMLElement>('.source-tab-panel:not([hidden]) .cm-editor');
    const view = element ? EditorView.findFromDOM(element) : null;
    if (view) openSearchPanel(view);
  }
  function handleSearchShortcut(event: KeyboardEvent<HTMLElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      event.stopPropagation();
      openSearch();
    }
  }
  return <section ref={panel} className="source-panel" aria-label={t("D3 源码")} onKeyDownCapture={handleSearchShortcut}>
    <div className="panel-heading"><div><span className="eyebrow">03 / SOURCE</span><h2>{t("代码")}<span className="small-tag">{t("只读")}</span></h2></div><div className="actions"><button className="quiet" onClick={download}>{t("下载 .js")}</button><button className="primary" onClick={copy}>{copied ? t("已复制") : t("复制完整代码")}</button></div></div>
    <div className="tabs source-tabs" role="tablist" aria-label={t("代码内容")}>
      <button id="source-tab-logic" role="tab" aria-selected={tab === 'logic'} aria-controls="source-panel-logic" tabIndex={tab === 'logic' ? 0 : -1} onClick={() => setTab('logic')} onKeyDown={switchTab}>{t("D3.js 源码")}</button>
      <button id="source-tab-data" role="tab" aria-selected={tab === 'data'} aria-controls="source-panel-data" tabIndex={tab === 'data' ? 0 : -1} onClick={() => setTab('data')} onKeyDown={switchTab}>{dataLabel}</button>
    </div>
    <div className="source-note">{tab === 'logic' ? t("绘图逻辑 · const data 见数据页") : t('{dataName} · const data 数组', {dataName: dataName === 'Mock data' ? t('确定性示例数据') : dataName})}<br/>{t("复制与下载始终包含数据和完整绘图逻辑。")}</div>
    {error && <p role="alert" className="notice">{t(error)}</p>}
    <div id="source-panel-logic" className="source-tab-panel" role="tabpanel" aria-labelledby="source-tab-logic" hidden={tab !== 'logic'}><CodeEditor source={code.logic} visible={tab === 'logic'} label={t("D3.js 绘图逻辑")}/></div>
    <div id="source-panel-data" className="source-tab-panel" role="tabpanel" aria-labelledby="source-tab-data" hidden={tab !== 'data'}><CodeEditor source={code.data} visible={tab === 'data'} label={dataLabel}/></div>
    <div className="source-status"><span>{t("最近修改持续高亮 · 定位对应代码")}</span><button className="text-button" onClick={openSearch} title={t("搜索当前代码 (Ctrl+F)")}>{t("查找 Ctrl+F")}</button></div>
  </section>;
}
