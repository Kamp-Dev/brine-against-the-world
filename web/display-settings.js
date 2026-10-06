(function(root){
 const profiles={auto:{dpr:2,fps:60},performance:{dpr:1,fps:30},high:{dpr:3,fps:60},ultra:{dpr:4,fps:60}};
 function sizing(width,height,dpr,quality){const p=profiles[quality]||profiles.auto,logicalHeight=Math.max(800,height*450/width),density=quality==='ultra'?Math.min(4,Math.max(3,dpr*1.33)):Math.min(p.dpr,Math.max(quality==='performance'?1:2,dpr));const scale=Math.min(width*density/450,2160/450,3840/logicalHeight);return {height:logicalHeight,extra:logicalHeight-800,scale,width:Math.round(450*scale),pixelsHigh:Math.round(logicalHeight*scale),fps:p.fps};}
 if(typeof module!=='undefined')module.exports={sizing};
 if(typeof document==='undefined')return;
 root.BrineDisplay={extra:0,height:800,fps:60};
 let quality='auto';try{quality=localStorage.getItem('brine-display-quality')||'auto';}catch{}if(!profiles[quality])quality='auto';
 const screen=document.getElementById('screen'),canvas=document.getElementById('game'),choice=document.getElementById('quality-choice');choice.value=quality;
 function apply(){const box=screen.getBoundingClientRect();if(!box.width||!box.height)return;const s=sizing(box.width,box.height,window.devicePixelRatio||1,quality);if(screen.dataset.layout==='deck')s.extra=Math.max(0,s.height*.54-434);Object.assign(root.BrineDisplay,{extra:s.extra,height:s.height,fps:s.fps});screen.style.setProperty('--battle-extra',(s.extra*box.width/450)+'px');
  if(canvas.width!==s.width||canvas.height!==s.pixelsHigh){canvas.width=s.width;canvas.height=s.pixelsHigh;}
  const c=canvas.getContext('2d');c.setTransform(s.width/450,0,0,s.pixelsHigh/s.height,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality=quality==='performance'?'low':'high';
  document.getElementById('quality-detail').textContent=s.width+' × '+s.pixelsHigh+' render resolution · '+s.fps+' FPS target';
 }
 choice.onchange=()=>{quality=choice.value;try{localStorage.setItem('brine-display-quality',quality);}catch{}apply();};
 root.BrineDisplay.apply=apply;new ResizeObserver(apply).observe(screen);window.addEventListener('resize',apply);window.visualViewport?.addEventListener('resize',apply);apply();
})(typeof globalThis!=='undefined'?globalThis:this);

