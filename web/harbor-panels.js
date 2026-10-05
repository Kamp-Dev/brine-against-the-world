// Reuse the approved route's painted plates. Corners and fasteners keep their
// proportions; only blank paper and straight edge strips extend to fit a control.
(()=>{
 const art=new Image();art.src='ui/route-live.png';
 const targets=[...document.querySelectorAll('#battle-actions button,#weapon-card,#form-card,.upgrade-card')];
 const sources={cream:[72,386,277,188],salmon:[751,386,345,188],teal:[1132,386,277,188]};
 function paint(el){if(!art.naturalWidth)return;const canvas=el.querySelector('.harbor-panel-art'),w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
  const theme=el.id==='form-card'||el.id==='volley'&&el.dataset.ready==='true'?'salmon':el.id==='volley'||el.id==='farm'&&el.disabled?'teal':'cream';
  const key=[w,h,theme].join(':');if(canvas.dataset.paint===key)return;canvas.dataset.paint=key;
  const resolution=Math.max(2,Math.min(5,window.devicePixelRatio||1));canvas.width=Math.ceil(w*resolution);canvas.height=Math.ceil(h*resolution);
  const c=canvas.getContext('2d');c.scale(resolution,resolution);const [x,y,sw,sh]=sources[theme],corner=Math.min(9,w/5,h/4),s=48;
  function cut(sx,sy,cw,ch,dx,dy,dw,dh){c.drawImage(art,sx*art.width/2048,sy*art.height/683,cw*art.width/2048,ch*art.height/683,dx,dy,dw,dh);}
  cut(x+s,y+s,sw-2*s,sh-2*s,corner,corner,w-2*corner,h-2*corner);
  cut(x+s,y,sw-2*s,s,corner,0,w-2*corner,corner);cut(x+s,y+sh-s,sw-2*s,s,corner,h-corner,w-2*corner,corner);
  cut(x,y+s,s,12,0,corner,corner,h-2*corner);cut(x+sw-s,y+s,s,12,w-corner,corner,corner,h-2*corner);
  for(const right of [false,true])for(const bottom of [false,true])cut(x+(right?sw-s:0),y+(bottom?sh-s:0),s,s,right?w-corner:0,bottom?h-corner:0,corner,corner);
  // Round inked rivets, independent of the panel's aspect ratio.
  for(const px of [corner*.7,w-corner*.7])for(const py of [corner*.7,h-corner*.7]){c.beginPath();c.arc(px,py,1.5,0,Math.PI*2);c.fillStyle='#071f24';c.fill();c.beginPath();c.arc(px-.3,py-.4,.45,0,Math.PI*2);c.fillStyle='#e7d5aa';c.fill();}
 }
 const resize=new ResizeObserver(entries=>entries.forEach(e=>paint(e.target)));
 const state=new MutationObserver(entries=>entries.forEach(e=>paint(e.target)));
 for(const el of targets){el.classList.add('painted-harbor-panel');const canvas=document.createElement('canvas');canvas.className='harbor-panel-art';canvas.setAttribute('aria-hidden','true');el.prepend(canvas);resize.observe(el);state.observe(el,{attributes:true,attributeFilter:['data-ready','disabled']});}
 art.onload=()=>targets.forEach(paint);
})();
