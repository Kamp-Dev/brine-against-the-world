const salvageLedger=new Image();salvageLedger.src='ui/salvage-ledger.png';
// Scalable comic UI; character art and animations are unchanged.
let harborTab='road',gearPage='weapons';
function openHarbor(tab){harborTab=tab;$('drawer').hidden=tab==='road';$('drawer-title').textContent=tab==='guns'?'GEAR':tab==='kit'?'WORKSHOP':tab==='camp'?'HARBOR':tab.toUpperCase();for(const p of document.querySelectorAll('[data-panel]'))p.hidden=p.dataset.panel!==tab;for(const name of ['road','guns','kit','camp'])$('nav-'+name).setAttribute('aria-current',name===tab?'page':'false');refresh();}
for(const name of ['road','guns','kit','camp'])$('nav-'+name).onclick=()=>openHarbor(name);
$('swap').onclick=()=>{gearPage='weapons';openHarbor('guns')};$('ultimate').onclick=()=>{model.ultimate();persist();refresh()};$('ultimate-quick').onclick=$('ultimate').onclick;$('go-kit').onclick=()=>openHarbor('kit');$('close-drawer').onclick=()=>openHarbor('road');$('defeat-refit').onclick=()=>{$('retry').click();openHarbor('road')};
$('gear-weapons').onclick=()=>{gearPage='weapons';refresh()};$('gear-upgrades').onclick=()=>{openHarbor('road');$('upgrade-track').scrollTo({left:$('upgrade-track').scrollWidth,behavior:'smooth'})};$('gear-workshop').onclick=()=>openHarbor('kit');
for(const [id,form] of [['form-step','step-shell'],['form-samurai','samurai']])$(id).onclick=()=>{model.chooseForm(form);persist();refresh()};
function refreshTicketControls(){
 for(const [id,form] of [['form-step','step-shell'],['form-samurai','samurai']]){$(id).disabled=model.ultimateActive;$(id).setAttribute('aria-pressed',model.selectedForm===form)}
 $('weapon-list').hidden=false;$('gear-weapons').setAttribute('aria-pressed',true);
 const stats={damage:`${model.damage} → ${model.damage+4}`,shell:`${model.maxPlayerHp} → ${model.maxPlayerHp+25}`,speed:`${(1/model.interval).toFixed(1)} → ${(1/model.interval*(1+.08/(1+model.upgrades.speed*.08))).toFixed(1)}/s`,scavenging:`+${model.upgrades.scavenging*5}% → +${(model.upgrades.scavenging+1)*5}%`,patch:`${model.recoveryPercent}% → ${model.recoveryPercent+1}%`,tide:`${model.chargePerHit} → ${model.chargePerHit+1}`};
 const descriptions={damage:'Damage per hit',shell:'Maximum shell health',speed:'Shots per second',scavenging:'Bonus salvage from wins and away earnings',patch:'Maximum health restored after each win',tide:'Melee-form charge gained per successful hit'};
 for(const k of Object.keys(stats)){const b=$('upgrade-'+k),max=model.upgrades[k]>=model.cap(k);b.disabled=max||model.gold<model.cost(k);const rank=Math.min(model.cap(k),Math.max(0,model.upgrades[k]));b.querySelector('.rank-meter i').style.width=(rank/model.cap(k)*100)+'%';b.querySelector('.rank-meter b').textContent=rank+' / '+model.cap(k);b.querySelector('.rank-meter').setAttribute('aria-label','Rank '+rank+' of '+model.cap(k));b.querySelector('.stat').textContent=max?'MAX':stats[k];b.querySelector('.price').textContent=max?'MAXED':model.cost(k).toLocaleString();b.querySelector('.sr-only').textContent=descriptions[k];b.title=descriptions[k]+' · rank '+model.upgrades[k]+' / '+model.cap(k);b.setAttribute('aria-label',b.title+(max?' · fully upgraded':' · '+model.cost(k)+' salvage'));}

}
function plateRegion(x,y,w,h){ctx.drawImage(harborPlate,x/450*harborPlate.width,y/800*harborPlate.height,w/450*harborPlate.width,h/800*harborPlate.height,x,y,w,h)}
function fill(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function ink(text,x,y,size=16,color='#092329',align='left',stencil=false,maxWidth){ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.font=size+'px "'+(size>=16?selectedFont:'Barlow Condensed')+'", sans-serif';if(maxWidth)ctx.fillText(text,x,y,maxWidth);else ctx.fillText(text,x,y);ctx.textAlign='left'}
function healthBar(x,y,w,h,current,maximum){const ratio=maximum>0?Math.max(0,Math.min(1,current/maximum)):0;fill(x,y,w,h,'#092329');fill(x+2,y+2,w-4,h-4,'#214b50');if(ratio>0)fill(x+2,y+2,(w-4)*ratio,h-4,'#bd572e')}
function ticket(x,y,w,h){path([[x+7,y],[x+w-7,y],[x+w,y+7],[x+w,y+h-7],[x+w-7,y+h],[x+7,y+h],[x,y+h-7],[x,y+7]],'#f1e2be','#092329',2);for(const [a,b] of [[x+7,y+7],[x+w-7,y+7],[x+7,y+h-7],[x+w-7,y+h-7]]){ctx.fillStyle='#092329';ctx.beginPath();ctx.arc(a,b,1.4,0,7);ctx.fill()}}
function harborBackdrop(){ctx.clearRect(0,0,450,BrineDisplay.height);fill(0,0,450,BrineDisplay.height,'#082f38');ctx.strokeStyle='#487574';ctx.lineWidth=2;ctx.strokeRect(3,3,444,BrineDisplay.height-6);ctx.save();ctx.beginPath();ctx.rect(5,52,440,382+BrineDisplay.extra);ctx.clip();fill(5,52,440,382+BrineDisplay.extra,'#e9ddb5');ctx.translate(0,-143+BrineDisplay.extra);for(const l of parallaxData.layers){const travel=model.distance*l.speed/l.period,base=Math.floor(travel),offset=(travel-base)*l.period;for(let tile=-1;tile<2;tile++){const flip=(base+tile)%2!==0;ctx.save();ctx.translate(tile*l.period-offset+(flip?l.period:0),l.y);ctx.scale(flip?-1:1,1);if(l===parallaxData.layers[0]){const im=sceneryImages[l.image],strip=60;for(let n=1;n*strip<BrineDisplay.extra+180;n++){ctx.save();ctx.translate(0,-n*strip+(n%2?strip:0));ctx.scale(1,n%2?-1:1);ctx.drawImage(im,0,0,im.width,im.height*strip/l.height,0,0,l.period+.5,strip);ctx.restore();}}ctx.drawImage(sceneryImages[l.image],0,0,l.period+.5,l.height);ctx.restore()}if(l===parallaxData.layers[0]&&typeof drawHarborGrowth==='function'){ctx.save();ctx.translate(0,249);drawHarborGrowth(ctx,model);ctx.restore()}}ctx.restore();}
function harborHUD(){
 const cream='#f1e2be',dark='#092329';
 // Restore the approved illustrated road, toolbox, and tent/fire navigation.
 ctx.save();ctx.translate(0,BrineDisplay.extra);plateRegion(0,716,450,84);
 const navIndex={road:0,guns:1,camp:2}[harborTab];if(navIndex!==undefined)highlightNavigationIcon(navIndex);ctx.restore();
 for(const [x,w,name,hp,max] of [[8,132,'BRINE · LV '+model.level,model.playerHp,model.maxPlayerHp],[309,132,model.enemy.name.toUpperCase(),model.hp,model.maxHp]]){ticket(x,142,w,49);ink(name,x+11,148,13,dark,'left',false,w-22);healthBar(x+9,166,w-18,17,hp,max);ink(hp+' / '+max,x+w/2,168,13,cream,'center',false,w-24)}
 if(model.state==='fight'){ink(model.submerged?'BURROWED':model.guarded?'SHIELD UP':model.enemy.action.toUpperCase(),437,195,10,cream,'right')}
 ctx.save();ctx.translate(0,BrineDisplay.extra);ticket(8,687,434,28);
 if(salvageLedger.complete&&salvageLedger.naturalWidth)ctx.drawImage(salvageLedger,80/2048*salvageLedger.width,246/683*salvageLedger.height,226/2048*salvageLedger.width,208/683*salvageLedger.height,14,690,24,22);
 ink('SALVAGE',46,693,15,dark);ink(model.gold.toLocaleString(),428,691,19,dark,'right',false,225);ctx.restore();

 drawCaptainBadge(ctx,model);
 if(model.paused){ticket(153,194,144,22);ink('PAUSED · CAMP TO RESUME',225,200,9,dark,'center')}
}
function setActionLabel(id,title,detail){$(id).querySelector('strong').textContent=title;$(id).querySelector('small').textContent=detail;}
function setActionText(id,text){const lines=text.split('\n');setActionLabel(id,lines[0],lines[1]||'');}
function updateHDControls(){
 if(typeof refreshProgressionUI==='function')refreshProgressionUI();
 $('volley').style.setProperty('--charge',model.charge+'%');
 const ult=$('ultimate');ult.dataset.ready=!ult.disabled;ult.dataset.active=model.ultimateActive;
 ult.querySelector('strong').textContent=model.ultimateActive?formName()+' ACTIVE':formName();ult.querySelector('small').textContent=model.ultimateActive?model.ultimateSeconds+'s REMAINING':model.paused?'PAUSED':model.ultimateCharge>=100?(model.state==='fight'?'READY — TAP TO TRANSFORM':'READY · NEXT BATTLE'):'CHARGING '+model.ultimateCharge+'%';ult.style.setProperty('--charge',(model.ultimateActive?Math.max(0,model.ultimateTime/8.8*100):model.ultimateCharge)+'%');
 const samurai=model.selectedForm==='samurai';const formArt='ui/'+(samurai?'samurai':'step-shell')+'-emblem.png';if($('ultimate-art').getAttribute('src')!==formArt)$('ultimate-art').src=formArt;$('ultimate-role').textContent=samurai?'SERIES SLASH / 75% GUARD':'HEAVY MELEE / 75% GUARD';$('form-dots').textContent=samurai?'○ ●':'● ○';$('form-swipe-hint').firstChild.textContent=model.ultimateActive?'FORM LOCKED · ':'SWIPE TO SELECT · ';
 const sword=model.ultimateActive&&model.selectedForm==='samurai';const image=sword?'samurai/katana.png':'weapons/'+equipped().art+'.png';if($('weapon-preview').getAttribute('src')!==image)$('weapon-preview').src=image;$('weapon-title').textContent=sword?'BREAKWATER':equipped().name.toUpperCase();
 $('route-heading').querySelector('b').textContent=BrineCombat.routes[model.route].name.toUpperCase();
 const routeKey=[model.stage,model.best,model.state==='reward'||model.state==='lower'].join(':');
 if($('numbered-route').dataset.key!==routeKey){$('numbered-route').innerHTML=BrineRoute.routeMarkup(model.stage,model.best,model.state);$('numbered-route').dataset.key=routeKey;}
 $('route-heading').querySelector('small').textContent=model.farming?'SALVAGE RUN':'NUMBERED ROUTE';
 if(typeof refreshStageTravel==='function')refreshStageTravel();
 BrineRoute.paint($('route-art'),model.stage,model.best,model.state,BrineCombat.routes[model.route].name);
}
let selectedFont='Bangers';try{selectedFont=localStorage.getItem('brine-ui-font')||selectedFont}catch{};if(!['Bangers','Bungee','Barlow Condensed'].includes(selectedFont))selectedFont='Bangers';
function applyFont(name){selectedFont=name;document.documentElement.dataset.font=name;document.documentElement.style.setProperty('--comic','"'+name+'"');$('font-choice').value=name;document.fonts.load('16px "'+name+'"');}
$('font-choice').onchange=()=>{applyFont($('font-choice').value);try{localStorage.setItem('brine-ui-font',selectedFont)}catch{}};applyFont(selectedFont);
const upgradeTrack=$('upgrade-track');
function scrollUpgrades(direction){upgradeTrack.scrollBy({left:direction*upgradeTrack.clientWidth*.9,behavior:'smooth'})}
function updateUpgradePaging(){const step=upgradeTrack.firstElementChild.offsetWidth+upgradeTrack.clientWidth*.02;const first=Math.round(upgradeTrack.scrollLeft/step)+1;$('upgrade-position').textContent='SWIPE UPGRADES · '+first+'–'+Math.min(6,first+2)+' OF 6';document.querySelector('.swipe-track i').style.transform='translateX('+(upgradeTrack.scrollLeft/Math.max(1,upgradeTrack.scrollWidth-upgradeTrack.clientWidth)*100)+'%)';}
upgradeTrack.addEventListener('scroll',updateUpgradePaging,{passive:true});window.addEventListener('resize',updateUpgradePaging);upgradeTrack.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();scrollUpgrades(event.key==='ArrowRight'?1:-1)}});
let dragStart=null,suppressUpgradeClick=false;
upgradeTrack.addEventListener('pointerdown',e=>{suppressUpgradeClick=false;if(e.pointerType==='touch'||e.button!==0)return;dragStart={x:e.clientX,left:upgradeTrack.scrollLeft,id:e.pointerId};});
upgradeTrack.addEventListener('pointermove',e=>{if(!dragStart)return;const dx=e.clientX-dragStart.x;if(Math.abs(dx)>7||suppressUpgradeClick){suppressUpgradeClick=true;upgradeTrack.setPointerCapture(e.pointerId);upgradeTrack.classList.add('dragging');upgradeTrack.scrollLeft=dragStart.left-dx;e.preventDefault();}});
function endUpgradeDrag(e){if(!dragStart)return;if(upgradeTrack.hasPointerCapture(e.pointerId))upgradeTrack.releasePointerCapture(e.pointerId);dragStart=null;upgradeTrack.classList.remove('dragging');}
upgradeTrack.addEventListener('pointerup',endUpgradeDrag);upgradeTrack.addEventListener('pointercancel',endUpgradeDrag);
upgradeTrack.addEventListener('click',e=>{if(suppressUpgradeClick){e.preventDefault();e.stopImmediatePropagation();suppressUpgradeClick=false;}},true);
upgradeTrack.addEventListener('wheel',e=>{const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if((delta>0&&upgradeTrack.scrollLeft<upgradeTrack.scrollWidth-upgradeTrack.clientWidth-1)||(delta<0&&upgradeTrack.scrollLeft>0)){e.preventDefault();upgradeTrack.scrollLeft+=delta;}},{passive:false});updateUpgradePaging();

attachFormSwipe($('form-card'), direction=>{if(model.ultimateActive)return;const next=direction>0?'samurai':'step-shell';if(next===model.selectedForm)return;model.chooseForm(next);persist();refresh();$('ultimate-art').animate([{transform:'translateX('+(direction*15)+'px)',opacity:.3},{transform:'translateX(0)',opacity:1}],{duration:180,easing:'ease-out'});});

let salmonNavigation=null;
const navIconRects=[[41,724,68,34],[200,724,48,34],[334,724,70,34]];
function highlightNavigationIcon(index){
 if(!salmonNavigation){salmonNavigation=document.createElement('canvas');salmonNavigation.width=harborPlate.width;salmonNavigation.height=harborPlate.height;const paint=salmonNavigation.getContext('2d');paint.drawImage(harborPlate,0,0);const pixels=paint.getImageData(0,0,salmonNavigation.width,salmonNavigation.height);for(let i=0;i<pixels.data.length;i+=4){const d=pixels.data;if(d[i]>155&&d[i+1]>145&&d[i+2]>100){d[i]=241;d[i+1]=139;d[i+2]=119;}}paint.putImageData(pixels,0,0);}
 const [x,y,w,h]=navIconRects[index];ctx.drawImage(salmonNavigation,x/450*harborPlate.width,y/800*harborPlate.height,w/450*harborPlate.width,h/800*harborPlate.height,x,y,w,h);
}
