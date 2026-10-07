// Visible mechanical refits are composited once per gun/tier/paint, then cached.
const reforgeCache=new Map();
function reforgeArt(id,rank=model.reforgeRank(id)){
 const source=weaponImages[id],paint=model.shop?.weaponPaint||'rust';if(!source?.complete||!source.naturalWidth)return source;
 const key=id+':'+rank+':'+paint;if(reforgeCache.has(key))return reforgeCache.get(key);
 const out=document.createElement('canvas');out.width=source.naturalWidth;out.height=source.naturalHeight;const c=out.getContext('2d');c.drawImage(source,0,0);
 const color=BrineShop.paints.find(p=>p.id===paint)?.color;if(color){const pixels=c.getImageData(0,0,out.width,out.height);BrineShop.recolor(pixels.data,color);c.putImageData(pixels,0,0);}
 if(rank){const w=out.width,h=out.height,profiles={scrap:[.64,.36,.24],repeater:[.62,.35,.29],lowtide:[.59,.38,.28],riveter:[.63,.36,.27],harpoon:[.62,.34,.3],boiler:[.59,.4,.28]},[cx,cy,bw]=profiles[id]||profiles.scrap;
 c.scale(w,h);c.lineWidth=.013;c.lineJoin='round';c.strokeStyle='#10272d';
 function plate(x,y,width,height,fill){c.beginPath();c.moveTo(x+.018,y);c.lineTo(x+width-.015,y);c.lineTo(x+width,y+.02);c.lineTo(x+width,y+height-.02);c.lineTo(x+width-.018,y+height);c.lineTo(x,y+height);c.lineTo(x,y+.02);c.closePath();c.fillStyle=fill;c.fill();c.stroke();}
 function bolt(x,y){c.beginPath();c.ellipse(x,y,.009,.011,0,0,7);c.fillStyle='#f4e1ac';c.fill();c.stroke();}
 // Mk I: broad riveted brass barrel jacket, not tiny rank ticks.
 plate(cx-bw/2,cy,bw,.14,'#bd9b55');bolt(cx-bw/2+.03,cy+.035);bolt(cx+bw/2-.03,cy+.105);
 c.lineWidth=.005;c.beginPath();c.moveTo(cx-bw/2+.04,cy+.11);c.lineTo(cx+bw/2-.05,cy+.11);c.stroke();c.lineWidth=.013;
 if(rank>=2){
  // Mk II: larger pressure housing and a row of heavy cooling fins.
  plate(cx-.12,cy+.16,.24,.14,'#c65f39');
  for(let i=0;i<4;i++)plate(cx-.12+i*.06,cy-.1,.035,.13,'#60787a');
  c.beginPath();c.ellipse(cx,cy+.23,.054,.065,0,0,7);c.fillStyle='#f2dfad';c.fill();c.stroke();c.beginPath();c.moveTo(cx,cy+.23);c.lineTo(cx+.025,cy+.2);c.stroke();
 }
 if(rank>=3){
  // Mk III: large Tideglass core, ivory armor and luminous conduit.
  plate(cx-.17,cy+.015,.055,.16,'#ecddad');plate(cx+.13,cy+.015,.055,.16,'#ecddad');
  c.beginPath();c.moveTo(cx,cy-.17);c.lineTo(cx+.065,cy-.06);c.lineTo(cx+.035,cy+.045);c.lineTo(cx-.045,cy+.045);c.lineTo(cx-.065,cy-.065);c.closePath();c.fillStyle='#53cfe2';c.fill();c.stroke();
  c.lineWidth=.008;c.strokeStyle='#e5ffff';c.beginPath();c.moveTo(cx,cy-.135);c.lineTo(cx-.024,cy+.015);c.stroke();c.strokeStyle='#10272d';
  c.lineWidth=.028;c.beginPath();c.moveTo(cx+.05,cy-.04);c.lineTo(cx+.21,cy-.04);c.lineTo(cx+.21,cy+.12);c.stroke();c.lineWidth=.012;c.strokeStyle='#7ee5e7';c.stroke();
 }
 }
 if(reforgeCache.size>=30)reforgeCache.delete(reforgeCache.keys().next().value);reforgeCache.set(key,out);return out;
}
function reforgePreview(id){const art=reforgeArt(id);if(!art)return BrineWeaponArt[id].image;if(!art.dataset?.url&&art instanceof HTMLCanvasElement)art.dataset.url=art.toDataURL();return art.dataset?.url||art.src;}
const reforgeDraw=ctx.drawImage.bind(ctx);ctx.drawImage=function(image,...args){const id=Object.keys(weaponImages).find(id=>weaponImages[id]===image);return reforgeDraw(id&&model.reforgeRank(id)?reforgeArt(id):image,...args);};
(()=>{
 const panel=document.createElement('section');panel.id='weapon-reforge';document.querySelector('.scrapyard-switch').after(panel);let last='';
 const details=['Original weapon','Riveted brass barrel jacket','Pressure chamber and cooling fins','Tideglass core and ivory armor'];
 function update(){if(!ready)return;const id=model.weapon,rank=model.reforgeRank(),key=JSON.stringify([id,rank,model.gold,model.forge.tideglass,model.best,model.shop.weaponPaint]);if(last===key)return;last=key;
 const next=BrineReforge.tiers[rank+1];BrineUI.patch(panel,'<h2>WEAPON REFORGE</h2><label for="reforge-weapon">WEAPON</label><select id="reforge-weapon">'+model.settings.weapons.map(w=>'<option value="'+w.id+'" '+(id===w.id?'selected':'')+' '+(model.best<w.unlock?'disabled':'')+'>'+w.name+'</option>').join('')+'</select><p>Permanent upgrades for '+equipped().name+'. Attachments and wonky mods stay equipped.</p><div class="reforge-tiers">'+BrineReforge.tiers.slice(1).map((t,i)=>'<article data-reforge-tier="'+(i+1)+'" class="'+(i+1===rank?'equipped':'')+'"><strong>MK '+['I','II','III'][i]+' · '+t.name.toUpperCase()+'</strong><canvas width="400" height="300" data-reforge-preview="'+(i+1)+'" aria-label="'+t.name+' weapon preview"></canvas><p>'+details[i+1]+'</p><b>+'+t.bonus+'% gun damage</b><small>'+BrineTideglass.format(t.salvage)+' salvage'+(t.glass?' + '+t.glass+' Tideglass':'')+'</small><span>'+(i+1<=rank?'OWNED':model.best<t.stage?'Clear stretch '+t.stage:i===rank?'NEXT UPGRADE':'BUY PREVIOUS TIER')+'</span></article>').join('')+'</div><button data-buy-reforge '+(!next||model.best<next.stage||model.gold<next.salvage||model.forge.tideglass<next.glass?'disabled':'')+'>'+(!next?'TIDEFORGED · MAX TIER':model.best<next.stage?'UNLOCK AT STRETCH '+next.stage:'REFORGE · '+BrineTideglass.format(next.salvage)+' SALVAGE'+(next.glass?' + '+next.glass+' TIDEGLASS':''))+'</button>');
 for(const c of panel.querySelectorAll('canvas')){const art=reforgeArt(id,+c.dataset.reforgePreview);if(art){const k=Math.min(c.width/art.width,c.height/art.height),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.drawImage(art,(c.width-art.width*k)/2,(c.height-art.height*k)/2,art.width*k,art.height*k);}}
 for(const w of model.settings.weapons){const image=$(w.id).querySelector('img'),url=reforgePreview(w.id);if(image.getAttribute('src')!==url)image.src=url;}
 }
 panel.onchange=e=>{if(e.target.id==='reforge-weapon'&&model.equip(e.target.value)){persist();refresh();}};
 panel.onclick=e=>{if(e.target.closest('[data-buy-reforge]')&&model.buyReforge()){persist();refresh();}};
 const before=refresh;refresh=function(){before();update();};
})();
