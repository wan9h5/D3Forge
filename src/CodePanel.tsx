import { t, useLocale } from './i18n';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { EditorView } from '@codemirror/view';
import { openSearchPanel } from '@codemirror/search';
import { CodeEditor } from './CodeEditor';
import { EditableData, type EditableDataProps } from './EditableData';
import type { CodeParts } from './generate';

export function CodePanel({ code, dataName, editableData }: { code: CodeParts; dataName: string; editableData?:EditableDataProps }) {
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
    <div className="panel-heading"><div><span className="eyebrow">03 / SOURCE</span><h2>{t("代码")}<span className="small-tag">{t(tab==='data'&&editableData?'可编辑':'只读')}</span></h2></div><div className="actions"><button className="quiet" onClick={download}>{t("下载 .js")}</button><button className="primary" onClick={copy}>{copied ? t("已复制") : t("复制完整代码")}</button></div></div>
    <div className="tabs source-tabs" role="tablist" aria-label={t("代码内容")}>
      <button id="source-tab-logic" role="tab" aria-selected={tab === 'logic'} aria-controls="source-panel-logic" tabIndex={tab === 'logic' ? 0 : -1} onClick={() => setTab('logic')} onKeyDown={switchTab}>{t("D3.js 源码")}</button>
      <button id="source-tab-data" role="tab" aria-selected={tab === 'data'} aria-controls="source-panel-data" tabIndex={tab === 'data' ? 0 : -1} onClick={() => setTab('data')} onKeyDown={switchTab}>{dataLabel}</button>
    </div>
    <div className="source-note">{tab === 'logic' ? t("绘图逻辑 · const data 见数据页") : editableData?t('编辑 JSON 数组 · 无需 const data ='):t('{dataName} · const data 数组', {dataName: dataName === 'Mock data' ? t('确定性示例数据') : dataName})}<br/>{t("复制与下载始终包含数据和完整绘图逻辑。")}</div>
    {error && <p role="alert" className="notice">{t(error)}</p>}
    <div id="source-panel-logic" className="source-tab-panel" role="tabpanel" aria-labelledby="source-tab-logic" hidden={tab !== 'logic'}><CodeEditor source={code.logic} visible={tab === 'logic'} label={t("D3.js 绘图逻辑")}/></div>
    <div id="source-panel-data" className="source-tab-panel" role="tabpanel" aria-labelledby="source-tab-data" hidden={tab !== 'data'}>{editableData?<EditableData key={editableData.resetKey} {...editableData} visible={tab==='data'}/>:<CodeEditor source={code.data} visible={tab==='data'} label={dataLabel}/>}</div>
    <div className="source-status"><span>{t(tab==='data'&&editableData?'有效数据自动更新图形':'最近修改持续高亮 · 定位对应代码')}</span><button className="text-button" onClick={openSearch} title={t("搜索当前代码 (Ctrl+F)")}>{t("查找 Ctrl+F")}</button></div>
  </section>;
}
