import { useEffect, useRef } from 'react';
import { Annotation, EditorState, StateEffect, StateField, type Range } from '@codemirror/state';
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { basicSetup } from 'codemirror';
import { search } from '@codemirror/search';
import { changedCodeLines, codeSyntax, createCodeSearchPanel } from './editorTools';
import { DATA_LIMITS } from './dataEditing';
const externalChange=Annotation.define<boolean>();
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

export function CodeEditor({ source, visible, label, onChange, onTooLarge }: { source: string; visible: boolean; label: string; onChange?:(text:string)=>void; onTooLarge?:()=>void }) {
  const handlers=useRef({onChange,onTooLarge});handlers.current={onChange,onTooLarge};
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
          EditorState.readOnly.of(!onChange),
          EditorView.editable.of(Boolean(onChange)),
          EditorState.transactionFilter.of(tr=>{
            if(handlers.current.onChange&&tr.docChanged&&tr.newDoc.length>DATA_LIMITS.bytes&&tr.newDoc.length>=tr.startState.doc.length){queueMicrotask(()=>handlers.current.onTooLarge?.());return [];}
            return tr;
          }),
          EditorView.updateListener.of(update=>{
            if(!update.docChanged||update.transactions.some(tr=>tr.annotation(externalChange)))return;
            if(handlers.current.onChange){previous.current=update.state.doc.toString();handlers.current.onChange(previous.current);}
          }),
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
            '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-code)', lineHeight: '1.75' },
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
      annotations: externalChange.of(true),
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
