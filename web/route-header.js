(function(root){
 function routeTiles(stage,best,state){
  stage=Math.max(1,Math.floor(Number(stage)||1));best=Math.max(0,Math.floor(Number(best)||0));
  const first=Math.max(1,stage-2),won=state==='reward'||state==='lower';
  return Array.from({length:5},(_,i)=>{const n=first+i;return {stage:n,boss:n%5===0,current:n===stage,complete:n<=best&&(n!==stage||won)};});
 }
 const skull='<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M32 3C15 3 7 14 7 29c0 12 5 18 13 21v10h24V50c8-3 13-9 13-21C57 14 49 3 32 3Z"/><g fill="var(--tile-bg)"><ellipse cx="22" cy="30" rx="8" ry="9"/><ellipse cx="43" cy="30" rx="8" ry="9"/><path d="m32 36-5 9h10ZM25 51h4v11h-4Zm10 0h4v11h-4Z"/></g></svg>';
 function routeMarkup(stage,best,state){return routeTiles(stage,best,state).map(t=>`<li class="route-tile${t.current?' current':''}${t.complete?' cleared':''}${t.boss?' boss':''}" ${t.current?'aria-current="step"':''} aria-label="${t.boss?'Boss, ':''}stage ${t.stage}, ${t.current?'current, ':''}${t.complete?'cleared':t.current?'in progress':'upcoming'}"><span class="stage-status">${t.current?'CURRENT':t.complete?'CLEARED':t.boss?'BOSS':'NEXT'}</span><span class="stage-value" style="font-size:${t.stage>9999?3:t.stage>999?3.8:4.6}cqw">${t.boss?skull:t.stage}</span>${t.complete?'<span class="stage-check" aria-hidden="true">✓</span>':''}${t.boss?'<span class="boss-caption">BOSS</span>':''}</li>`).join('');}
 root.BrineRoute={routeTiles,routeMarkup};if(typeof module==='object')module.exports=root.BrineRoute;
})(typeof globalThis==='object'?globalThis:this);
