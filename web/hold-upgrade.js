// Delegate events because Overclock buttons are rebuilt after each purchase.
(()=>{
 const selector='button[id^="upgrade-"],button[data-forge="clock"]';
 let hold=null,timer=null,blocked=null,synthetic=false;
 const key=b=>b.id?'#'+b.id:'button[data-forge="clock"][data-id="'+b.dataset.id+'"]';
 function stop(){clearTimeout(timer);timer=null;hold=null;document.querySelectorAll('.hold-upgrading').forEach(b=>b.classList.remove('hold-upgrading'));}
 function repeat(){
  if(!hold)return;
  const b=document.querySelector(hold.key);
  if(!b||b.disabled||!b.getClientRects().length||document.hidden){stop();return;}
  blocked=hold.key;b.classList.add('hold-upgrading');synthetic=true;
  try{b.click();}finally{synthetic=false;}
  if(hold)timer=setTimeout(repeat,140);
 }
 document.addEventListener('pointerdown',e=>{
  stop();blocked=null;
  const b=e.target.closest(selector);
  if(!b||b.disabled||e.button!==0||e.isPrimary===false)return;
  hold={key:key(b),id:e.pointerId,x:e.clientX,y:e.clientY};
  timer=setTimeout(repeat,400);
 });
 document.addEventListener('pointermove',e=>{
  if(hold&&e.pointerId===hold.id&&(Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>10||!e.target.closest(selector)||key(e.target.closest(selector))!==hold.key)){
   blocked=hold.key;stop();
  }
 });
 // Suppress the release click after repeating (or dragging), but preserve taps.
 document.addEventListener('click',e=>{
  const b=e.target.closest(selector);
  if(!synthetic&&b&&blocked===key(b)&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();blocked=null;}
 },true);
 document.addEventListener('contextmenu',e=>{if(e.target.closest(selector))e.preventDefault();});
 window.addEventListener('pointerup',stop);
 window.addEventListener('pointercancel',stop);
 window.addEventListener('blur',stop);
 document.addEventListener('visibilitychange',stop);
 document.addEventListener('scroll',stop,true);
})();
