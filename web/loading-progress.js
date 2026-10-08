(function(root){
 function metrics(loaded,total,elapsed,stalled){const fraction=total?Math.min(1,loaded/total):0;return {percent:Math.floor(fraction*95),eta:elapsed>=2&&loaded>0&&!stalled&&fraction<1?Math.ceil((total-loaded)/(loaded/elapsed)):null};}
 if(typeof module!=='undefined')module.exports={metrics};
 if(typeof document==='undefined')return;
 const manifest=root.BrineLoadingManifest,total=Object.values(manifest).reduce((a,b)=>a+b,0),counts=new Map(),completed=new Set();
 const start=performance.now();let lastByte=start,phase='Downloading game resources',failed=false,active=0;const queue=[];
 const el=id=>document.getElementById(id),mb=n=>(n/1048576).toFixed(1)+' MB';
 function render(){if(failed)return;const bytes=[...counts.values()].reduce((a,b)=>a+b,0),now=performance.now(),stalled=now-lastByte>8000,m=metrics(bytes,total,(now-start)/1000,stalled);
  el('load-progress').value=m.percent;el('load-percent').textContent=m.percent+'%';
  el('load-bytes').textContent=mb(bytes)+' / '+mb(total)+' · '+completed.size+' / '+Object.keys(manifest).length+' resources';
  el('load-eta').textContent=phase!=='Downloading game resources'?'Finishing on your device…':bytes>=total?'Download complete · decoding artwork…':m.eta!==null?'About '+(m.eta<60?m.eta+' seconds':Math.ceil(m.eta/60)+' minutes')+' remaining':stalled?'Connection is slow · still downloading…':'Estimating time remaining…';
 }
 const timer=setInterval(render,250);
 function setPhase(text){phase=text;el('load-phase').textContent=text;render();}
 async function transfer(url){if(active>=4)await new Promise(resolve=>queue.push(resolve));active++;
  const name=url.split('?')[0],controller=new AbortController();let timeout;
  const resetTimeout=()=>{clearTimeout(timeout);timeout=setTimeout(()=>controller.abort(),45000);};
  try{resetTimeout();const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw new Error('Resource request failed ('+response.status+')');
   const parts=[];let received=0;const update=n=>{received+=n;counts.set(name,Math.min(received,manifest[name]||received));lastByte=performance.now();resetTimeout();};
   if(response.body&&response.body.getReader){const reader=response.body.getReader();for(;;){const {value,done}=await reader.read();if(done)break;parts.push(value);update(value.byteLength);}}
   else {const bytes=await response.arrayBuffer();parts.push(bytes);update(bytes.byteLength);}
   counts.set(name,manifest[name]||received);completed.add(name);render();return new Blob(parts,{type:response.headers.get('Content-Type')||''});
  }finally{clearTimeout(timeout);active--;queue.shift()?.();}
 }
 root.BrineLoading={
  json:async url=>JSON.parse(await (await transfer(url)).text()),
  image:async(im,url)=>{const blob=await transfer(url),local=URL.createObjectURL(blob);try{im.src=local;await im.decode();return im;}finally{URL.revokeObjectURL(local);}},
  preparing:async(text='Preparing animations')=>{setPhase(text);await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));},
  finish:()=>{clearInterval(timer);el('load-progress').value=100;el('load-percent').textContent='100%';if(root.BrineTitleReady){root.BrineTitleReady.then(()=>{el('loading').hidden=true;});}else el('loading').hidden=true;},
  fail:()=>{failed=true;clearInterval(timer);el('load-phase').textContent='Download interrupted';el('load-eta').textContent='Check your connection, then try again. Your saved progress is kept.';el('load-retry').hidden=false;}
 };
 el('load-retry').onclick=()=>location.reload();setPhase(phase);
})(typeof globalThis!=='undefined'?globalThis:this);
