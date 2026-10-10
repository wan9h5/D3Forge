import { t, subscribeLocale } from './i18n';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView, type Panel } from '@codemirror/view';
import { SearchQuery, closeSearchPanel, findNext, findPrevious, getSearchQuery, setSearchQuery } from '@codemirror/search';

export const codeSyntax = syntaxHighlighting(HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], class: 'code-keyword' },
  { tag: [tags.string, tags.special(tags.string)], class: 'code-string' },
  { tag: [tags.number, tags.bool, tags.null], class: 'code-number' },
  { tag: tags.comment, class: 'code-comment' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], class: 'code-function' },
  { tag: [tags.propertyName, tags.definition(tags.variableName)], class: 'code-name' },
  { tag: tags.operator, class: 'code-operator' },
]));

// Compare the changed region, rather than ignoring lines repeated elsewhere.
export function changedCodeLines(before: string, after: string): number[] {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) start++;
  if (start === oldLines.length && start === newLines.length) return [];
  let oldEnd = oldLines.length - 1;
  let newEnd = newLines.length - 1;
  while (oldEnd >= start && newEnd >= start && oldLines[oldEnd] === newLines[newEnd]) { oldEnd--; newEnd--; }
  if (newEnd < start) return [Math.min(start + 1, newLines.length)];
  const lines: number[] = [];
  for (let index = start; index <= newEnd; index++) if (newLines[index].trim()) lines.push(index + 1);
  return lines.length ? lines : [Math.min(start + 1, newLines.length)];
}

export function createCodeSearchPanel(view: EditorView): Panel {
  const dom = document.createElement('div');
  dom.className = 'code-search';
  dom.setAttribute('role', 'search');
  dom.setAttribute('aria-label', t("代码搜索"));
  const input = document.createElement('input');
  input.className = 'code-search-input';
  input.placeholder = t("查找代码");
  input.setAttribute('aria-label', t("查找代码"));
  input.setAttribute('main-field', 'true');
  input.type = 'text';
  const counter = document.createElement('span');
  counter.className = 'code-search-count';
  counter.setAttribute('role', 'status');
  const controls = document.createElement('div');
  controls.className = 'code-search-controls';
  const buttonLabels: { element: HTMLButtonElement; label: string }[] = [];
  function button(label: string, text: string, action: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    buttonLabels.push({element: button, label});
    button.title = t(label);
    button.setAttribute('aria-label', t(label));
    button.textContent = text;
    button.addEventListener('click', action);
    controls.append(button);
    return button;
  }
  const matchCase = button("区分大小写", 'Aa', () => toggle(matchCase));
  const wholeWord = button("全字匹配", 'ab', () => toggle(wholeWord));
  const regexp = button("正则表达式", '.*', () => toggle(regexp));
  button("上一个匹配 (Shift+Enter)", '↑', () => findPrevious(view));
  button("下一个匹配 (Enter)", '↓', () => findNext(view));
  button("关闭搜索 (Esc)", '×', () => closeSearchPanel(view));
  function toggle(button: HTMLButtonElement) {
    button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    commit();
  }
  function commit() {
    const query = new SearchQuery({
      search: input.value,
      caseSensitive: matchCase.getAttribute('aria-pressed') === 'true',
      wholeWord: wholeWord.getAttribute('aria-pressed') === 'true',
      regexp: regexp.getAttribute('aria-pressed') === 'true',
      literal: true,
    });
    view.dispatch({ effects: setSearchQuery.of(query) });
    if (query.valid && query.search) findNext(view);
  }
  function update() {
    dom.setAttribute('aria-label', t('代码搜索'));
    input.placeholder = t('查找代码');
    input.setAttribute('aria-label', t('查找代码'));
    for (const {element, label} of buttonLabels) {
      element.title = t(label);
      element.setAttribute('aria-label', t(label));
    }
    const query = getSearchQuery(view.state);
    if (input.value !== query.search) input.value = query.search;
    matchCase.setAttribute('aria-pressed', String(query.caseSensitive));
    wholeWord.setAttribute('aria-pressed', String(query.wholeWord));
    regexp.setAttribute('aria-pressed', String(query.regexp));
    input.setAttribute('aria-invalid', String(!!query.search && !query.valid));
    if (!query.search) { counter.textContent = t("输入关键词"); return; }
    if (!query.valid) { counter.textContent = t("无效表达式"); return; }
    const cursor = query.getCursor(view.state.doc);
    const selection = view.state.selection.main;
    let count = 0, current = 0;
    for (let match = cursor.next(); !match.done; match = cursor.next()) {
      count++;
      if (match.value.from === selection.from && match.value.to === selection.to) current = count;
    }
    counter.textContent = count ? `${current} / ${count}` : t("无匹配");
  }
  input.addEventListener('input', commit);
  dom.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeSearchPanel(view); }
    if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); (event.shiftKey ? findPrevious : findNext)(view); }
  });
  dom.append(input, counter, controls);
  update();
  const unsubscribe = subscribeLocale(update);
  return { dom, update, destroy: unsubscribe, mount: () => { input.focus({ preventScroll: true }); input.select(); } };
}
