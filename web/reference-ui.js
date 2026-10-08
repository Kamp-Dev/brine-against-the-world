// Approved reference: original cropped artwork surrounds live, accessible controls.
function renderReferenceBattle(){
 const top=130,bottom=346;
 ctx.clearRect(0,0,450,BrineDisplay.height);fill(0,0,450,BrineDisplay.height,'#003742');
 ctx.save();ctx.beginPath();ctx.rect(6,top,438,bottom-top);ctx.clip();fill(6,top,438,bottom-top,'#e9ddb5');
 const sceneScale=.75,sceneY=bottom-577*sceneScale;
 ctx.save();ctx.translate(0,sceneY);ctx.scale(sceneScale,sceneScale);
 if(!window.drawCraftScenery?.(ctx,model)){for(const l of parallaxData.layers){const travel=model.distance*l.speed/l.period,base=Math.floor(travel),offset=(travel-base)*l.period;for(let tile=-1;tile<4;tile++){const flip=(base+tile)%2!==0;ctx.save();ctx.translate(tile*l.period-offset+(flip?l.period:0),l.y);ctx.scale(flip?-1:1,1);ctx.drawImage(sceneryImages[l.image],0,0,l.period+.5,l.height);ctx.restore();}if(l===parallaxData.layers[0]&&typeof drawHarborGrowth==='function'){ctx.save();ctx.translate(0,249);drawHarborGrowth(ctx,model);ctx.restore();}}
 }ctx.restore();ctx.save();ctx.translate(48,bottom-577*.72);ctx.scale(.72,.72);enemy();actor();effects();ctx.restore();ctx.restore();
}
(()=>{
 const screen=$('screen');screen.dataset.layout='reference';BrineDisplay.apply();
 const header=document.createElement('header');header.id='reference-header';header.setAttribute('aria-label','Brine Against the World');screen.append(header);
 header.append($('deck-tools'));$('deck-tools').children[0].innerHTML='<svg viewBox="0 0 32 36" aria-hidden="true"><path d="M5 5h22v29H5z" fill="currentColor"/><path d="M10 1v8M22 1v8" stroke="currentColor" stroke-width="3"/><path d="M10 14h12M10 20h12M10 26h9" stroke="#103c46" stroke-width="2"/></svg><span>JOURNAL</span>';$('deck-tools').children[1].innerHTML='<svg viewBox="0 0 32 36" aria-hidden="true"><g fill="currentColor"><rect x="13" y="3" width="6" height="30" rx="1"/><rect x="13" y="3" width="6" height="30" rx="1" transform="rotate(45 16 18)"/><rect x="13" y="3" width="6" height="30" rx="1" transform="rotate(90 16 18)"/><rect x="13" y="3" width="6" height="30" rx="1" transform="rotate(135 16 18)"/><circle cx="16" cy="18" r="11"/></g><circle cx="16" cy="18" r="5" fill="#103c46"/></svg><span>SETTINGS</span>';
 // Keep the route visible above battle on every tab.
 screen.append($('masthead'));$('route-art').dataset.headerTools='true';
 const hud=document.createElement('section');hud.id='reference-hud';hud.setAttribute('aria-label','Battle health');hud.innerHTML='<div class="ref-health"><strong id="ref-player-name"></strong><div class="ref-hp"><i></i><b></b></div><span id="ref-xp-text"></span><div class="ref-xp"><i></i></div></div><div class="ref-health enemy-health"><strong id="ref-enemy-name"></strong><div class="ref-hp"><i></i><b></b></div></div>';screen.append(hud);const formStatus=document.createElement('div');formStatus.id='form-status';screen.append(formStatus);
 const banner=document.createElement('section');banner.id='reference-banner';banner.innerHTML='<i class="ref-icon" id="ref-page-icon"></i><strong id="ref-page-title">ROAD</strong><span id="ref-page-description">Skills & equipment.</span><div class="ref-bank"><i class="ref-icon" style="--icon:url(ui/reference/icon-salvage.png)"></i><span>SALVAGE<b id="ref-salvage"></b></span></div><div class="ref-bank"><i class="ref-icon" style="--icon:url(ui/reference/icon-tideglass.png)"></i><span>TIDEGLASS<b id="ref-glass"></b></span></div>';screen.append(banner);
 const pageInfo={road:['ROAD','Skills & equipment.','road'],guns:['GEAR','Guns & loadouts.','gear'],build:['BUILD','Upgrades & Overclock.','build'],voyage:['VOYAGE','Campaigns & expeditions.','voyage'],camp:['HARBOR','Restore & reclaim.','harbor'],journal:['JOURNAL','Training & field guide.','gear'],settings:['SETTINGS','Play your way.','salvage']};
 const descriptions={...BrineBuild.descriptions,damage:'Increase damage per hit.',shell:'Increase max health.',speed:'Fire rate; excess adds damage.',focus:'Critical hit chance.',rupture:'Critical hit damage.',plating:'Reduce incoming damage.',scavenging:'More salvage per win.',patch:'Recover health after wins.',tide:'Charge melee forms faster.'};
 const iconMap={splinter:'damage',hullcrack:'shell',undertow:'power',laststand:'hull',jackpot:'salvage',secondwind:'speed',damage:'damage',shell:'shell',speed:'speed',focus:'focus',rupture:'damage',plating:'shell',scavenging:'salvage',patch:'hull',tide:'power'};
 const track=$('upgrade-track');track.setAttribute('aria-label','Core upgrades');$('deck-upgrades').querySelector('h2').textContent='CORE UPGRADES';$('deck-upgrades').querySelector('p').hidden=false;$('deck-upgrades').querySelector('p').textContent='Tap to upgrade · Hold to buy repeatedly';
 const advanced=document.createElement('section');advanced.id='reference-advanced';advanced.innerHTML='<h2>ADVANCED UPGRADES</h2><div id="reference-advanced-track" aria-label="Advanced upgrades by category"></div>';$('deck-upgrades').after(advanced);
 for(const [id,desc] of Object.entries(descriptions)){
  const b=$('upgrade-'+id);b.classList.add('reference-row');b.querySelector('svg').style.display='none';
  const icon=document.createElement('i');icon.className='ref-icon ref-upgrade-icon';icon.style.setProperty('--icon','url(ui/reference/icon-'+iconMap[id]+'.png)');b.prepend(icon);
  const detail=document.createElement('span');detail.className='ref-description';detail.textContent=desc;b.append(detail);
  const rank=document.createElement('span');rank.className='ref-rank';b.append(rank);
  const buy=document.createElement('span');buy.className='ref-buy';buy.textContent='UPGRADE';b.append(buy);
 }
 for(const [name,ids] of [['Combat',['focus','rupture','tide','splinter','hullcrack','undertow']],['Survival',['plating','patch','laststand','secondwind']],['Loot',['scavenging','jackpot']]]){
  const group=document.createElement('section');group.className='ref-upgrade-category';group.setAttribute('aria-label',name+' upgrades');
  const heading=document.createElement('h3');heading.textContent=name;group.append(heading);
  for(const id of ids)group.append($('upgrade-'+id));
  $('reference-advanced-track').append(group);
 }
 for(const [id,icon] of [['farm','push'],['volley','volley']]){const b=$(id);b.querySelector('svg').style.display='none';const image=document.createElement('i');image.className='ref-action-icon ref-icon';image.style.setProperty('--icon','url(ui/reference/icon-'+icon+'.png)');b.prepend(image);}
 for(const [id,icon] of [['road','road'],['guns','gear'],['build','build'],['voyage','voyage'],['camp','harbor']]){$('nav-'+id).querySelector('svg').style.display='none';const i=document.createElement('i');i.className='ref-icon';i.style.setProperty('--icon','url(ui/reference/icon-'+icon+'.png)');$('nav-'+id).prepend(i);}
 window.decorateOverclock=function(container){
  const oc=container.querySelector('#deck-overclock');if(oc&&!oc.dataset.reference){oc.dataset.reference='true';oc.querySelector('h2').innerHTML='OVERCLOCK <i class="ref-icon" style="--icon:url(ui/reference/icon-tideglass.png)"></i><small>Permanent Tideglass bonuses.</small>';
   for(const button of oc.querySelectorAll('[data-forge="clock"]')){const id=button.dataset.id,card=button.closest('.goal-card'),c=BrineTideglass.clocks[id],rank=model.forge.overclock[id];card.classList.add('ref-clock-row');card.insertAdjacentHTML('afterbegin','<i class="ref-icon" style="--icon:url(ui/reference/icon-'+(id==='tempo'?'speed':id)+'.png)"></i>');card.querySelector('h3').textContent=c.name.toUpperCase();const lines=card.querySelectorAll('p');lines[0].className='ref-clock-bonus';lines[0].textContent=c.detail+' +'+BrineTideglass.format(BrineTideglass.clockBonus(rank,c.step))+'%';lines[1].className='ref-clock-rank';lines[1].textContent='Rank '+rank+' · no limit';button.innerHTML='<span class="ref-clock-cost">◆ '+(rank>=c.cap?'MAX':BrineTideglass.format(BrineTideglass.cost(rank)))+'</span><span class="ref-buy">'+(rank>=c.cap?'MAXED':model.best<10?'LOCKED':'UPGRADE')+'</span>';}
  }
 };
 const previous=refresh;refresh=function(){previous();const page=screen.dataset.deck||'road',info=pageInfo[page];$('ref-page-title').textContent=info[0];$('ref-page-description').textContent=info[1];$('ref-page-icon').style.setProperty('--icon','url(ui/reference/icon-'+info[2]+'.png)');banner.dataset.page=page;advanced.hidden=page!=='build';
  $('ref-salvage').textContent=BrineTideglass.format(model.gold);$('ref-glass').textContent=BrineTideglass.format(model.forge.tideglass);
  $('ref-player-name').textContent='BRINE · LV '+model.level;$('ref-enemy-name').textContent=model.enemy.name.toUpperCase();
  for(const [el,hp,max] of [[hud.children[0],model.playerHp,model.maxPlayerHp],[hud.children[1],model.hp,model.maxHp]]){el.querySelector('.ref-hp i').style.width=Math.max(0,Math.min(100,hp/max*100))+'%';el.querySelector('.ref-hp b').textContent=BrineTideglass.format(hp)+' / '+BrineTideglass.format(max);}
  const xp=levelProgress();$('ref-xp-text').textContent='XP   '+xp.earned+' / '+xp.needed;hud.querySelector('.ref-xp i').style.width=xp.ratio*100+'%';
  for(const id of Object.keys(descriptions)){const b=$('upgrade-'+id);b.querySelector('.ref-rank').textContent='RANK '+model.upgrades[id]+' / '+(Number.isFinite(model.cap(id))?model.cap(id):'∞');b.querySelector('.ref-buy').textContent=model.upgrades[id]>=model.cap(id)?'MAXED':b.dataset.locked==='true'?'LOCKED':'UPGRADE';}
  formStatus.hidden=!model.ultimateActive&&!(model.lowTideTime>0);formStatus.textContent=model.lowTideTime>0?'LOW TIDE · '+model.recoverySeconds+'s — Damage −40% / incoming +25%':formName()+' · '+model.ultimateSeconds+'s · STRAIN '+Math.round(Math.min(100,model.formStrain/25*100))+'%';
  const q=$('ultimate-quick'),status=model.ultimateActive?model.ultimateSeconds+'s':model.lowTideTime>0?'REST '+model.recoverySeconds+'s':!J.available(model,model.selectedForm)?'LOCKED':model.paused?'PAUSED':model.pendingUltimate?'QUEUED':model.ultimateCharge>=100?'READY':Math.floor(model.ultimateCharge)+'%';
  // The legacy refresher writes text each frame; rebuild only this small live control.
  q.innerHTML='<i class="ref-icon ref-action-icon" style="--icon:url(ui/reference/icon-form.png)"></i><strong>'+formName()+'</strong><small>'+(model.ultimateActive?'Tap to end':model.selectedForm==='samurai'?'14s · +5s/kill':'18s · +3s/kill')+'</small><b class="ref-ready">'+status+'</b>';
  window.decorateOverclock(document);
 };
 refresh();
})();
