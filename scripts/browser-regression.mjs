// Run against a local development server and an isolated Chromium/Edge CDP port.
// node scripts/browser-regression.mjs [http://localhost:4173] [9237]
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:4173';
const port = process.argv[3] || '9237';
const output = await fs.mkdtemp(path.join(os.tmpdir(), 'd3forge-browser-qa-'));
const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
const page = pages.find(p => p.type === 'page' && p.url.startsWith(base)) || pages.find(p => p.type === 'page' && !p.url.startsWith('edge://'));
assert(page, 'An isolated browser page is required');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const pending = new Map();
const errors = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    clearTimeout(call.timer);
    message.error ? call.reject(new Error(JSON.stringify(message.error))) : call.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
};
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
async function evaluate(expression, contextId) {
  const result = await send('Runtime.evaluate', { expression, contextId: typeof contextId === 'number' ? contextId : undefined, awaitPromise: true, returnByValue: true }, contextId?.sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(expression, contextId) {
  for (let i = 0; i < 80; i++) {
    if (await evaluate(expression, contextId)) return;
    await delay(100);
  }
  throw new Error(`Not ready: ${expression}`);
}
async function navigate(hash) {
  await send('Page.navigate', { url: base + '/' + hash });
  await until('location.hash === ' + JSON.stringify(hash) + ' && document.readyState === "complete" && !!document.querySelector(".header")');
}
async function chartFrame() {
  await until('!!document.querySelector(".preview-panel iframe")');
  for(let attempt=0;attempt<40;attempt++) {
    try {
      const {root}=await send('DOM.getDocument');
      const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'.preview-panel iframe'});
      const {node}=await send('DOM.describeNode',{nodeId});
      if(!node.frameId) { await delay(100);continue; }
      const {targetInfos}=await send('Target.getTargets');
      const target=targetInfos.find(target=>target.targetId===node.frameId&&target.type==='iframe');
      if(target){
        const {sessionId}=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true});
        await send('Runtime.enable',{},sessionId);
        const context={sessionId};
        await until('!!document.querySelector("svg .marks, svg g[clip-path]")',context);
        return context;
      }
      const {executionContextId}=await send('Page.createIsolatedWorld',{frameId:node.frameId,worldName:'d3forge-qa'});
      await until('!!document.querySelector("svg .marks, svg g[clip-path]")',executionContextId);
      return executionContextId;
    } catch(error) {
      if(attempt===39)throw error;
      await delay(100);
    }
  }
  throw new Error('Preview frame did not become ready');
}async function clickText(selector, text) {
  return evaluate(`(() => {const button=[...document.querySelectorAll(${JSON.stringify(selector)})].find(n=>n.textContent.trim()===${JSON.stringify(text)}); if(!button)throw Error('Missing control');button.click();return true})()`);
}
async function setInput(selector, value) {
  await evaluate(`(() => {const input=document.querySelector(${JSON.stringify(selector)});if(!input)throw Error('Missing input');const proto=input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile(path.join(output, name + '.png'), Buffer.from(data, 'base64'));
}
async function upload(contents, filename) {
  const file = path.join(output, filename);
  await fs.writeFile(file, contents);
  const { root } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: 'input[type=file]' });
  await send('DOM.setFileInputFiles', { nodeId, files: [file] });
  await delay(350);
}
const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, passed: true }); console.log('PASS', name); }
  catch (error) { results.push({ name, passed: false, error: error.message }); console.log('FAIL', name, error.message); }
}
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await check('home: compact demo, syntax colors and whole-card switching', async () => {
  await navigate('#/');
  await until('!!document.querySelector(".demo-card.is-front")');
  assert.equal(await evaluate('document.querySelectorAll(".demo-toolbar").length'), 0);
  assert(await evaluate('document.querySelectorAll(".demo-token-keyword,.demo-token-function,.demo-token-string").length > 3'));
  await evaluate('document.querySelector("#demo-visual .hero-workbench-heading").click()');
  await until('document.querySelector("#demo-code").classList.contains("is-front")');
  const geometry = await evaluate('(()=>{const n=document.querySelector(".demo-source");return {client:n.clientHeight,scroll:n.scrollHeight}})()');
  assert(geometry.scroll <= geometry.client + 1, 'No code scrollbar in homepage demo');
  await screenshot('home-desktop');
});
const names = { scatter: '散点图', volcano: '火山图', box: '箱线图', bar: '柱状图', line: '折线图', violin: '小提琴图', manhattan: '曼哈顿图' };
for (const [type, name] of Object.entries(names)) await check(`gallery click → ${type}: correct route, SVG, three zones and real preview`, async () => {
  await navigate('#/gallery');
  await until('document.querySelectorAll(".chart-card").length === 7');
  await evaluate(`document.querySelector('.chart-card[href="#/charts/${type}"]').click()`);
  await until(`document.querySelector('.workspace-title h1')?.textContent.includes(${JSON.stringify(name)})`);
  const context = await chartFrame();
  assert.equal(await evaluate('document.querySelectorAll(".controls,.preview-panel,.source-panel").length'), 3);
  assert(await evaluate(`(()=>{const labels=[...document.querySelector('svg').lastElementChild.querySelectorAll('g text')].map(n=>n.getBoundingClientRect());return labels.every((r,i)=>i===0||labels[i-1].right+8<=r.left)})()`,context),'Legend entries do not overlap');
  await evaluate(`(()=>{const node=document.querySelector('.marks rect,.marks circle,.marks path.violin, g[clip-path] circle,g.box');if(node)node.dispatchEvent(new MouseEvent('pointermove',{bubbles:true,clientX:innerWidth-2,clientY:innerHeight-2}));})()`,context);
  assert(await evaluate(`(()=>{const tip=document.querySelector('#chart > div');if(!tip||getComputedStyle(tip).display==='none')return true;const r=tip.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()`,context),'Tooltip stays inside preview');
  assert.equal(await evaluate('document.querySelector("#source-panel-data").hidden'), true);
  assert(await evaluate('document.querySelectorAll("svg .marks > *, svg g[clip-path] > *, svg g.box").length', context) > 0);
  assert.equal(await evaluate('document.querySelectorAll(".notice[role=alert]").length'), 0);
  const layout = await evaluate('(()=>{const c=document.querySelector(".controls").getBoundingClientRect(),p=document.querySelector(".preview-panel").getBoundingClientRect(),s=document.querySelector(".source-panel").getBoundingClientRect();return {columns:c.right<=p.left&&p.right<=s.left,overflow:document.documentElement.scrollWidth>innerWidth}})()');
  assert(layout.columns && !layout.overflow, 'Three desktop columns fit the viewport');
  if (type === 'violin' || type === 'manhattan') await screenshot(type + '-desktop');
});
await check('scatter: radius/source highlight, local scrolling, data tab and Ctrl+F', async () => {
  await navigate('#/charts/scatter');
  await chartFrame();
  const before = await evaluate('window.scrollY');
  await setInput('input[aria-label="点半径"]', '9');
  await until('document.querySelector(".code-changed")?.textContent.includes(\'"r", 9\')');
  assert.equal(await evaluate('window.scrollY'), before);
  let context = await chartFrame();
  assert.equal(await evaluate('document.querySelector("g[clip-path] circle").getAttribute("r")', context), '9');
  await clickText('#source-tab-data', 'Mock 数据');
  await evaluate('document.querySelector("#source-panel-data .cm-content").focus({preventScroll:true})');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'f', code: 'KeyF', modifiers: 2, windowsVirtualKeyCode: 70 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'f', code: 'KeyF', modifiers: 2, windowsVirtualKeyCode: 70 });
  await until('!!document.querySelector("#source-panel-data .code-search-input")');
  await setInput('#source-panel-data .code-search-input', 'sample');
  assert(await evaluate('document.querySelector("#source-panel-data .code-search-count").textContent.includes("/")'));
  assert.equal(await evaluate('document.querySelector("#source-panel-logic").hidden'), true);
  await setInput('input[aria-label="点半径"]', '8');
  assert.equal(await evaluate('document.querySelector("#source-panel-logic").hidden'), true);
});
await check('bar and line: configuration changes alter actual preview', async () => {
  await navigate('#/charts/bar');
  await chartFrame();
  await setInput('.controls select', 'stacked');
  await evaluate('(()=>{const n=[...document.querySelectorAll(".toggle")].find(n=>n.textContent.includes("横向排列"));n.querySelector("input").click()})()');
  const context=await chartFrame();
  assert(await evaluate('document.querySelectorAll(".marks rect").length===12',context));
  await navigate('#/charts/line');await chartFrame();
  await evaluate('(()=>{for(const text of ["面积填充","平滑曲线"]){[...document.querySelectorAll(".toggle")].find(n=>n.textContent.includes(text)).querySelector("input").click()}})()');
  const lineContext=await chartFrame();
  assert.equal(await evaluate('document.querySelectorAll("path.area").length',lineContext),3);
});
await check('CSV: local import, hostile strings, error state, clipboard and complete JS download', async () => {
  await navigate('#/charts/scatter'); await chartFrame();
  await clickText('.controls .tabs button','数据处理');
  await upload('sample,expressionA,expressionB,group\n"</ScRiPt><img src=x onerror=alert(1)>",1,2,Control\nS2,3,4,Treatment\n','samples.csv');
  await until('document.querySelector(".data-source strong").textContent === "samples.csv"');
  const context=await chartFrame();
  assert.equal(await evaluate('document.querySelectorAll("g[clip-path] circle").length',context),2);
  assert.equal(await evaluate('document.querySelectorAll("img").length',context),0);
  await send('Browser.grantPermissions',{origin:base,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  await clickText('.source-panel button','复制完整代码');
  await until('document.querySelector(".source-panel .actions .primary").textContent === "已复制"');
  const copied=await evaluate('navigator.clipboard.readText()');
  assert(copied.includes('const data =')&&copied.includes('function renderChart')&&copied.includes('</ScRiPt><img'));
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
  await clickText('.source-panel button','下载 .js');
  let downloaded;
  for(let i=0;i<40;i++){try{downloaded=await fs.readFile(path.join(output,'d3forge-chart.js'),'utf8');break;}catch{await delay(100);}}
  assert.equal(typeof downloaded,'string','JS download completed');
  assert.equal(downloaded.replace(/\r\n/g,'\n'),copied.replace(/\r\n/g,'\n'));
  await upload('a,b\n"broken,1\n','broken.csv');
  await until('document.querySelector(".controls .notice")?.textContent.includes("CSV 格式错误")');
  assert.equal(await evaluate('document.querySelector(".data-source strong").textContent'),'samples.csv');
  await clickText('.controls button','恢复默认');
  await until('document.querySelector(".data-source strong").textContent === "Mock data"');
});
await check('CSV limits: empty, over 10 MB, over 10000 rows and exactly 10000 accepted',async()=>{
  await navigate('#/charts/scatter');await chartFrame();
  await clickText('.controls .tabs button','数据处理');
  await upload('x,y\n','empty.csv');
  await until('document.querySelector(".controls .notice")?.textContent.includes("没有可用的数据行")');
  await upload('x,y\n'+'a'.repeat(10*1024*1024),'oversized.csv');
  await until('document.querySelector(".controls .notice")?.textContent.includes("10 MB")');
  await upload('x,y\n'+Array.from({length:10001},(_,i)=>`${i+1},${i+2}`).join('\n'),'over-rows.csv');
  await until('document.querySelector(".controls .notice")?.textContent.includes("10,000")');
  assert.equal(await evaluate('document.querySelector(".data-source strong").textContent'),'Mock data');
  await upload('x,y\n'+Array.from({length:10000},(_,i)=>`${i+1},${i+2}`).join('\n'),'limit-10000.csv');
  await until('document.querySelector(".data-source strong").textContent==="limit-10000.csv"');
  const context=await chartFrame();
  assert.equal(await evaluate('document.querySelectorAll("g[clip-path] circle").length',context),10000);
  await clickText('.controls button','恢复默认');
});
await check('1440px desktop: all three columns fit',async()=>{
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await navigate('#/charts/manhattan');await chartFrame();
  assert(await evaluate('(()=>{const n=[...document.querySelectorAll(".controls,.preview-panel,.source-panel")].map(n=>n.getBoundingClientRect());return n[0].right<=n[1].left&&n[1].right<=n[2].left&&document.documentElement.scrollWidth<=innerWidth})()'));
  await screenshot('manhattan-1440');
});
await check('mobile: home/gallery/detail readable with no document overflow', async () => {
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  for(const hash of ['#/','#/gallery','#/charts/violin']){
    await navigate(hash);
    if(hash.includes('charts'))await chartFrame();
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), hash+' fits');
    await screenshot('mobile-'+hash.replace(/[^a-z]/g,'') || 'mobile-home');
  }
});
await check('browser runtime has no uncaught exceptions', async()=>assert.deepEqual(errors,[]));
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({base,results,errors},null,2));
console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length,output}));
socket.close();
process.exitCode=results.some(r=>!r.passed)?1:0;
