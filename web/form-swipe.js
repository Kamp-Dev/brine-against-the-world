// A horizontal gesture selects a form; it must never also activate it.
function attachFormSwipe(element,select){let start=null,blocked=false,lastWheel=0;
 element.addEventListener('pointerdown',e=>{if(e.button!==0)return;blocked=false;start={x:e.clientX,y:e.clientY,id:e.pointerId};});
 element.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){blocked=true;element.setPointerCapture(e.pointerId);e.preventDefault();}});
 element.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);if(Math.abs(dx)>=35&&Math.abs(dx)>Math.abs(dy)){blocked=true;select(dx<0?1:-1);}});
 element.addEventListener('pointercancel',()=>{start=null;blocked=true;});
 element.addEventListener('click',e=>{if(blocked){e.preventDefault();e.stopImmediatePropagation();blocked=false;}},true);
 element.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(e.key==='ArrowRight'?1:-1);}});
 element.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<8||Math.abs(e.deltaX)<Math.abs(e.deltaY))return;e.preventDefault();if(e.timeStamp-lastWheel>300){select(e.deltaX>0?1:-1);lastWheel=e.timeStamp;}},{passive:false});
}
if(typeof module!=='undefined')module.exports={attachFormSwipe};
