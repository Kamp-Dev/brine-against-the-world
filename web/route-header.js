(function(root){
 function routeTiles(stage,best,state){
  stage=Math.max(1,Math.floor(Number(stage)||1));best=Math.max(0,Math.floor(Number(best)||0));
  const first=Math.max(1,stage-2),won=state==='reward'||state==='lower';
  return Array.from({length:6},(_,i)=>{const n=first+i;return {stage:n,boss:n%5===0,current:n===stage,complete:n<=best&&(n!==stage||won)};});
 }
 const skull='<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M32 3C15 3 7 14 7 29c0 12 5 18 13 21v10h24V50c8-3 13-9 13-21C57 14 49 3 32 3Z"/><g fill="var(--tile-bg)"><ellipse cx="22" cy="30" rx="8" ry="9"/><ellipse cx="43" cy="30" rx="8" ry="9"/><path d="m32 36-5 9h10ZM25 51h4v11h-4Zm10 0h4v11h-4Z"/></g></svg>';
 function routeMarkup(stage,best,state){return routeTiles(stage,best,state).map(t=>`<li class="route-tile${t.current?' current':''}${t.complete?' cleared':''}${t.boss?' boss':''}" ${t.current?'aria-current="step"':''} aria-label="${t.boss?'Boss, ':''}stage ${t.stage}, ${t.current?'current, ':''}${t.complete?'cleared':t.current?'in progress':'upcoming'}"><span class="stage-status">${t.current?'CURRENT':t.complete?'CLEARED':t.boss?'BOSS':'NEXT'}</span><span class="stage-value" style="font-size:${t.stage>9999?3:t.stage>999?3.8:4.6}cqw">${t.boss?skull:t.stage}</span>${t.complete?'<span class="stage-check" aria-hidden="true">✓</span>':''}${t.boss?'<span class="boss-caption">BOSS</span>':''}</li>`).join('');}
 const slots=[[72,386,277,188],[414,386,279,188],[751,386,345,188],[1132,386,277,188],[1454,386,278,188],[1778,386,204,188]];
 let original,live,revision=0;
 if(typeof Image!=='undefined'){original=new Image();live=new Image();original.onload=live.onload=()=>revision++;original.src='ui/route-approved.png';live.src='ui/route-live.png';if(typeof document!=='undefined')document.fonts.ready.then(()=>revision++);}
 function paint(canvas,stage,best,state,route='Dry Docks'){
  if(!canvas||!original?.naturalWidth||!live?.naturalWidth)return;
  const key=[stage,best,state==='reward'||state==='lower',route,revision].join(':');if(canvas.dataset.paint===key)return;canvas.dataset.paint=key;
  const c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1984,580);c.translate(-32,-45);
  function cut(im,s,d=s){c.drawImage(im,s[0]*im.width/2048,s[1]*im.height/683,s[2]*im.width/2048,s[3]*im.height/683,...d);}
  cut(original,[32,45,1984,580]);
  // Use the empty inter-tile board strip for a continuous illustrated route rail.
  cut(live,[700,324,48,272],[66,324,1918,272]);
  routeTiles(stage,best,state).forEach((t,i)=>{
   const d=slots[i];const source=t.current?[751,386,345,188]:t.complete?[72,386,277,188]:[1132,386,277,188];if(!t.boss)cut(live,source,d);
   if(t.boss)cut(original,[1777,374,206,210],[d[0]+(d[2]-206)/2,374,206,210]);
   else {c.fillStyle=t.complete&&!t.current?'#003742':'#fff0c6';c.textAlign='center';c.textBaseline='middle';c.font='150px Bungee';c.fillText(String(t.stage),d[0]+d[2]/2,d[1]+101,d[2]-66);}
   if(t.current)cut(original,[734,325,395,69],[d[0]+d[2]/2-197.5,325,395,69]);
   if(t.complete)cut(original,[276,364,91,82],[d[0]+(t.boss?d[2]/2+65:d[2]-66),364,91,82]);
  });
  if(route.toUpperCase()!=='DRY DOCKS'){cut(live,[1080,275,850,17],[1080,106,865,172]);c.fillStyle='#003742';c.font='bold 145px "Barlow Condensed"';c.textAlign='center';c.textBaseline='middle';c.fillText(route.toUpperCase(),1512,194,825);}
 }
 root.BrineRoute={routeTiles,routeMarkup,paint};if(typeof module==='object')module.exports=root.BrineRoute;
})(typeof globalThis==='object'?globalThis:this);
