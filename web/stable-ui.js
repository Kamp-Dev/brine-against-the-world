// Patch live panels without replacing controls during background combat.
window.BrineUI={patch(root,html){
 const template=document.createElement('template');template.innerHTML=html;
 const key=n=>n.nodeType!==1?'':n.id||['data-forge','data-progress-action','data-category','data-item','data-purchase','data-remove','data-projectile-icon','data-lesson'].filter(a=>n.hasAttribute(a)).map(a=>a+':'+n.getAttribute(a)+':'+(n.getAttribute('data-id')||n.getAttribute('data-value')||'')).join('|');
 const same=(a,b)=>a.nodeType===b.nodeType&&a.nodeName===b.nodeName&&key(a)===key(b);
 function children(parent,next){
  let cursor=parent.firstChild;
  for(const incoming of Array.from(next.childNodes)){
   let live=cursor;
   if(!live||!same(live,incoming)){
    live=key(incoming)?Array.from(parent.childNodes).find(n=>same(n,incoming)):null;
    if(live)parent.insertBefore(live,cursor);else{live=incoming.cloneNode(true);parent.insertBefore(live,cursor);cursor=live.nextSibling;continue;}
   }
   if(live.nodeType===1){
    // A native select must stay open while the player chooses a tier.
    const held=live.classList.contains('hold-upgrading');
    if(!(live.tagName==='SELECT'&&live===document.activeElement)){
     for(const a of Array.from(live.attributes))if(!incoming.hasAttribute(a.name))live.removeAttribute(a.name);
     for(const a of incoming.attributes)if(live.getAttribute(a.name)!==a.value)live.setAttribute(a.name,a.value);
     children(live,incoming);
     if(held)live.classList.add('hold-upgrading');
    }
   }else if(live.nodeValue!==incoming.nodeValue)live.nodeValue=incoming.nodeValue;
   cursor=live.nextSibling;
  }
  while(cursor){const next=cursor.nextSibling;cursor.remove();cursor=next;}
 }
 children(root,template.content);
}};
