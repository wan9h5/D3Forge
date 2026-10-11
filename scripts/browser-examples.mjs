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
  await evaluate(`(() => {let input=document.querySelector(${JSON.stringify(selector)});if(input?.classList.contains('select-trigger'))input=input.closest('.custom-select').querySelector('select');if(!input)throw Error('Missing input');const proto=input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
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

await send('Runtime.enable');await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
await navigate('#/gallery');await until('document.querySelectorAll(".chart-card").length===31');
await delay(1000);await screenshot('gallery-examples');
for(const id of ['bar-letters','box-letters','violin-comparisons','violin-split','violin-half','raincloud','violin-letters','violin-facet','box-facet','donut-leaders']){
 await navigate('#/charts/'+id);const context=await chartFrame();
 assert(await evaluate('document.querySelectorAll(".marks .violin,.marks .summary,.segment,.annotation").length>0',context));
 await screenshot(id);
 console.log('PASS',id);
}
assert.equal(errors.length,0,errors.join('\n'));
console.log('Screenshots:',output);
socket.close();
