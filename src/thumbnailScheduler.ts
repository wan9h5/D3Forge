type Job={start:(finish:()=>void)=>void;cancelled:boolean;finish?:()=>void};
const queue:Job[]=[];
let active=0,scheduled=false;
// Only two sandboxed renderers may run at once. Yield between batches for input/scrolling.
function pump(){
 if(scheduled||active>=2||!queue.length)return;
 scheduled=true;
 const run=()=>{
  scheduled=false;
  while(active<2&&queue.length){
   const job=queue.shift()!;if(job.cancelled)continue;
   active++;let finished=false;
   job.finish=()=>{if(finished)return;finished=true;active--;pump();};
   try{job.start(job.finish);}catch{job.finish();}
  }
 };
 if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(run,{timeout:250});
 else window.setTimeout(run,16);
}
export function scheduleThumbnail(start:Job['start']){
 const job:Job={start,cancelled:false};queue.push(job);pump();
 return ()=>{job.cancelled=true;job.finish?.();const i=queue.indexOf(job);if(i>=0)queue.splice(i,1);};
}

const snapshots=new Map<string,string>();
let bytes=0;
const maxEntries=128,maxBytes=16*1024*1024;
export function getThumbnail(key:string){
 const value=snapshots.get(key);
 if(value){snapshots.delete(key);snapshots.set(key,value);}
 return value;
}
export function cacheThumbnail(key:string,svg:string){
 // SVG is displayed as an image, never inserted into the app DOM as markup.
 const value='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 const previous=snapshots.get(key);if(previous)bytes-=previous.length*2;
 snapshots.delete(key);
 if(value.length*2>maxBytes)return value;
 snapshots.set(key,value);bytes+=value.length*2;
 while(snapshots.size>maxEntries||bytes>maxBytes){const oldest=snapshots.keys().next().value!;bytes-=snapshots.get(oldest)!.length*2;snapshots.delete(oldest);}
 return value;
}
