// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {Preview} from '../src/Preview';
import {defaults} from '../src/model';
import {generateCodeParts} from '../src/generate';
it('isolates preview origin and keeps hostile script endings inside serialized data',()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  document.body.innerHTML='<div id="root"></div>';
  const root=createRoot(document.getElementById('root')!);
  const payload='</ScRiPt><script>parent.pwned=true</script><img src=x onerror=alert(1)>';
  const parts=generateCodeParts('scatter',[{expressionA:1,expressionB:2,group:payload,sample:payload}],defaults('scatter'));
  act(()=>root.render(<Preview source={parts.source} width={800} height={440}/>));
  const frame=document.querySelector('iframe')!;
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  const doc=new DOMParser().parseFromString(frame.srcdoc,'text/html');
  expect(doc.querySelectorAll('script')).toHaveLength(2);
  expect(doc.querySelectorAll('img')).toHaveLength(0);
  expect(doc.querySelector('meta[http-equiv="Content-Security-Policy"]')!.getAttribute('content')).toContain("default-src 'none'");
  expect(doc.querySelectorAll('script')[1].textContent).toContain('<\\/ScRiPt>');
  act(()=>root.unmount());
});
it('ignores error messages from unrelated frames',()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  document.body.innerHTML='<div id="root"></div>';
  const root=createRoot(document.getElementById('root')!);
  act(()=>root.render(<Preview source="" width={800} height={440}/>));
  act(()=>window.dispatchEvent(new MessageEvent('message',{source:window,data:{kind:'d3forge-error',message:'forged'}})));
  expect(document.querySelector('[role=alert]')).toBeNull();
  act(()=>root.unmount());
});
