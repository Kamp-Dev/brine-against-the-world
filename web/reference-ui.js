// Approved reference: original cropped artwork surrounds live, accessible controls.
function renderReferenceBattle(){
 const top=50,bottom=157;
 ctx.clearRect(0,0,450,BrineDisplay.height);fill(0,0,450,BrineDisplay.height,'#003742');
 ctx.save();ctx.beginPath();ctx.rect(6,top,438,bottom-top);ctx.clip();fill(6,top,438,bottom-top,'#e9ddb5');
 const sceneScale=.55,sceneY=bottom-577*sceneScale;
 ctx.save();ctx.translate(0,sceneY);ctx.scale(sceneScale,sceneScale);
 for(const l of parallaxData.layers){const travel=model.distance*l.speed/l.period,base=Math.floor(travel),offset=(travel-base)*l.period;for(let tile=-1;tile<4;tile++){const flip=(base+tile)%2!==0;ctx.save();ctx.translate(tile*l.period-offset+(flip?l.period:0),l.y);ctx.scale(flip?-1:1,1);ctx.drawImage(sceneryImages[l.image],0,0,l.period+.5,l.height);ctx.restore();}if(l===parallaxData.layers[0]&&typeof drawHarborGrowth==='function'){ctx.save();ctx.translate(0,249);drawHarborGrowth(ctx,model);ctx.restore();}}
 ctx.restore();ctx.save();ctx.translate(48,bottom-577*.72);ctx.scale(.72,.72);enemy();actor();effects();ctx.restore();ctx.restore();
}
(()=>{
 const screen=$('screen');screen.dataset.layout='reference';BrineDisplay.apply();
 const header=document.createElement('header');header.id='reference-header';header.setAttribute('aria-label','Brine Against the World');screen.append(header);
 header.append($('deck-tools'));$('deck-tools').children[0].textContent='JOURNAL';$('deck-tools').children[1].textContent='SETTINGS';
 // The numbered route remains interactive on Road; it no longer takes battle space.
 $('deck-home').append($('masthead'));
 const hud=document.createElement('section');hud.id='reference-hud';hud.setAttribute('aria-label','Battle health');hud.innerHTML='<div class="ref-health"><strong id="ref-player-name"></strong><div class="ref-hp"><i></i><b></b></div><span id="ref-xp-text"></span><div class="ref-xp"><i></i></div></div><div class="ref-health enemy-health"><strong id="ref-enemy-name"></strong><div class="ref-hp"><i></i><b></b></div></div>';screen.append(hud);
 const banner=document.createElement('section');banner.id='reference-banner';banner.innerHTML='<i class="ref-icon" id="ref-page-icon"></i><strong id="ref-page-title">ROAD</strong><span id="ref-page-description">Skills & equipment.</span><div class="ref-bank"><i class="ref-icon" style="--icon:url(ui/reference/icon-salvage.png)"></i><span>SALVAGE<b id="ref-salvage"></b></span></div><div class="ref-bank"><i class="ref-icon" style="--icon:url(ui/reference/icon-tideglass.png)"></i><span>TIDEGLASS<b id="ref-glass"></b></span></div>';screen.append(banner);
 const pageInfo={road:['ROAD','Skills & equipment.','road'],guns:['GEAR','Guns & loadouts.','gear'],build:['BUILD','Upgrades & Overclock.','build'],voyage:['VOYAGE','Campaigns & expeditions.','voyage'],camp:['HARBOR','Restore & reclaim.','harbor'],journal:['JOURNAL','Training & field guide.','gear'],settings:['SETTINGS','Play your way.','salvage']};
 const descriptions={damage:'Increase damage per hit.',shell:'Increase max health.',speed:'Increase firing speed.',focus:'Critical hit chance.',rupture:'Critical hit damage.',plating:'Reduce incoming damage.',scavenging:'More salvage per win.',patch:'Recover health after wins.',tide:'Charge melee forms faster.'};
 const iconMap={damage:'damage',shell:'shell',speed:'speed',focus:'focus',rupture:'damage',plating:'shell',scavenging:'salvage',patch:'hull',tide:'power'};
 const track=$('upgrade-track');$('deck-upgrades').querySelector('h2').textContent='CORE UPGRADES';$('deck-upgrades').querySelector('p').hidden=true;
 const advanced=document.createElement('section');advanced.id='reference-advanced';advanced.innerHTML='<h2>ADVANCED <small>SWIPE FOR MORE</small></h2><div id="reference-advanced-track" tabindex="0" aria-label="Swipe advanced upgrades"></div>';$('deck-upgrades').after(advanced);
 for(const [id,desc] of Object.entries(descriptions)){
  const b=$('upgrade-'+id);b.classList.add('reference-row');b.querySelector('svg').style.display='none';
  const icon=document.createElement('i');icon.className='ref-icon ref-upgrade-icon';icon.style.setProperty('--icon','url(ui/reference/icon-'+iconMap[id]+'.png)');b.prepend(icon);
  const detail=document.createElement('span');detail.className='ref-description';detail.textContent=desc;b.append(detail);
  const rank=document.createElement('span');rank.className='ref-rank';b.append(rank);
  const buy=document.createElement('span');buy.className='ref-buy';buy.textContent='UPGRADE';b.append(buy);
 }
 for(const id of ['focus','rupture','plating','scavenging','patch','tide'])$('reference-advanced-track').append($('upgrade-'+id));
 for(const [id,icon] of [['farm','push'],['volley','volley']]){const b=$(id);b.querySelector('svg').style.display='none';const image=document.createElement('i');image.className='ref-action-icon ref-icon';image.style.setProperty('--icon','url(ui/reference/icon-'+icon+'.png)');b.prepend(image);}
 for(const [id,icon] of [['road','road'],['guns','gear'],['build','build'],['voyage','voyage'],['camp','harbor']]){$('nav-'+id).querySelector('svg').style.display='none';const i=document.createElement('i');i.className='ref-icon';i.style.setProperty('--icon','url(ui/reference/icon-'+icon+'.png)');$('nav-'+id).prepend(i);}
 const previous=refresh;refresh=function(){previous();const page=screen.dataset.deck||'road',info=pageInfo[page];$('ref-page-title').textContent=info[0];$('ref-page-description').textContent=info[1];$('ref-page-icon').style.setProperty('--icon','url(ui/reference/icon-'+info[2]+'.png)');banner.dataset.page=page;advanced.hidden=page!=='build';
  $('ref-salvage').textContent=model.gold.toLocaleString();$('ref-glass').textContent=model.forge.tideglass.toLocaleString();
  $('ref-player-name').textContent='BRINE · LV '+model.level;$('ref-enemy-name').textContent=model.enemy.name.toUpperCase();
  for(const [el,hp,max] of [[hud.children[0],model.playerHp,model.maxPlayerHp],[hud.children[1],model.hp,model.maxHp]]){el.querySelector('.ref-hp i').style.width=Math.max(0,Math.min(100,hp/max*100))+'%';el.querySelector('.ref-hp b').textContent=hp+' / '+max;}
  const xp=levelProgress();$('ref-xp-text').textContent='XP   '+xp.earned+' / '+xp.needed;hud.querySelector('.ref-xp i').style.width=xp.ratio*100+'%';
  for(const id of Object.keys(descriptions)){const b=$('upgrade-'+id);b.querySelector('.ref-rank').textContent='RANK '+model.upgrades[id]+' / '+model.cap(id);b.querySelector('.ref-buy').textContent=model.upgrades[id]>=model.cap(id)?'MAXED':b.dataset.locked==='true'?'LOCKED':'UPGRADE';}
  const q=$('ultimate-quick'),status=model.ultimateActive?model.ultimateSeconds+'s':!J.available(model,model.selectedForm)?'LOCKED':model.paused?'PAUSED':model.ultimateCharge>=100?(model.state==='fight'?'READY':'NEXT BATTLE'):Math.floor(model.ultimateCharge)+'%';
  // The legacy refresher writes text each frame; rebuild only this small live control.
  q.innerHTML='<i class="ref-icon ref-action-icon" style="--icon:url(ui/reference/icon-form.png)"></i><strong>'+formName()+'</strong><small>'+(model.selectedForm==='samurai'?'Series slash / 75% guard':'Heavy melee / 75% guard')+'</small><b class="ref-ready">'+status+'</b>';
  const oc=$('deck-overclock');if(oc&&!oc.dataset.reference){oc.dataset.reference='true';oc.querySelector('h2').innerHTML='OVERCLOCK <i class="ref-icon" style="--icon:url(ui/reference/icon-tideglass.png)"></i><small>Permanent enhancements. Powered by Tideglass.</small>';
   for(const button of oc.querySelectorAll('[data-forge="clock"]')){const id=button.dataset.id,card=button.closest('.goal-card'),c=BrineTideglass.clocks[id],rank=model.forge.overclock[id];card.classList.add('ref-clock-row');card.insertAdjacentHTML('afterbegin','<i class="ref-icon" style="--icon:url(ui/reference/icon-'+(id==='tempo'?'speed':id)+'.png)"></i>');card.querySelector('h3').textContent=c.name.toUpperCase();card.querySelector('p').textContent=c.detail+' +'+rank*c.step+'%';button.innerHTML='<span class="ref-clock-cost">◆ '+(rank>=c.cap?'MAX':BrineTideglass.cost(rank))+'</span><span class="ref-buy">'+(rank>=c.cap?'MAXED':model.best<10?'LOCKED':'UPGRADE')+'</span>';}
  }
 };
 refresh();
})();
