// Ticket Board uses the approved illustration for its title, ticket borders and navigation.
let harborTab='road',gearPage='weapons';
function openHarbor(tab){harborTab=tab;$('drawer').hidden=tab==='road';$('drawer-title').textContent=tab==='guns'?'GEAR':tab==='kit'?'WORKSHOP':tab.toUpperCase();for(const p of document.querySelectorAll('[data-panel]'))p.hidden=p.dataset.panel!==tab;for(const name of ['road','guns','kit','camp'])$('nav-'+name).setAttribute('aria-current',name===tab?'page':'false');refresh();}
for(const name of ['road','guns','kit','camp'])$('nav-'+name).onclick=()=>openHarbor(name);
$('swap').onclick=()=>{gearPage='weapons';openHarbor('guns')};$('ultimate').onclick=()=>{model.ultimate();persist();refresh()};$('ultimate-quick').onclick=$('ultimate').onclick;$('go-kit').onclick=()=>openHarbor('kit');$('close-drawer').onclick=()=>openHarbor('road');$('defeat-refit').onclick=()=>{$('retry').click();openHarbor('road')};
$('gear-weapons').onclick=()=>{gearPage='weapons';refresh()};$('gear-upgrades').onclick=()=>{openHarbor('road');$('upgrade-track').scrollTo({left:$('upgrade-track').scrollWidth,behavior:'smooth'})};$('gear-workshop').onclick=()=>openHarbor('kit');
for(const [id,form] of [['form-step','step-shell'],['form-samurai','samurai']])$(id).onclick=()=>{model.chooseForm(form);persist();refresh()};
function refreshTicketControls(){
 for(const [id,form] of [['form-step','step-shell'],['form-samurai','samurai']]){$(id).disabled=model.ultimateActive;$(id).setAttribute('aria-pressed',model.selectedForm===form)}
 $('weapon-list').hidden=false;$('gear-weapons').setAttribute('aria-pressed',true);
 const stats={damage:`${model.damage} → ${model.damage+4}`,shell:`${model.maxPlayerHp} → ${model.maxPlayerHp+25}`,speed:`${(1/model.interval).toFixed(1)} → ${(1/model.interval*(1+.08/(1+model.upgrades.speed*.08))).toFixed(1)}/s`,scavenging:`+${model.upgrades.scavenging*5}% → +${(model.upgrades.scavenging+1)*5}%`,patch:`${model.recoveryPercent}% → ${model.recoveryPercent+1}%`,tide:`${model.chargePerHit} → ${model.chargePerHit+1}`};
 const descriptions={damage:'Damage per hit',shell:'Maximum shell health',speed:'Shots per second',scavenging:'Bonus salvage from wins and away earnings',patch:'Maximum health restored after each win',tide:'Melee-form charge gained per successful hit'};
 for(const k of Object.keys(stats)){const b=$('upgrade-'+k),max=model.upgrades[k]>=model.cap(k);b.disabled=max||model.gold<model.cost(k);b.querySelector('.stat').textContent=max?'MAX':stats[k];b.querySelector('.price').textContent=max?'MAXED':model.cost(k).toLocaleString();b.querySelector('.sr-only').textContent=descriptions[k];b.title=descriptions[k]+' · rank '+model.upgrades[k]+' / '+model.cap(k);b.setAttribute('aria-label',b.title+(max?' · fully upgraded':' · '+model.cost(k)+' salvage'));}

}
function plateRegion(x,y,w,h){ctx.drawImage(harborPlate,x/450*harborPlate.width,y/800*harborPlate.height,w/450*harborPlate.width,h/800*harborPlate.height,x,y,w,h)}
function fill(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function ink(text,x,y,size=16,color='#092329',align='left',stencil=false,maxWidth){ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.font=size+'px Impact, sans-serif';if(maxWidth)ctx.fillText(text,x,y,maxWidth);else ctx.fillText(text,x,y);ctx.textAlign='left'}
function healthBar(x,y,w,h,current,maximum){const ratio=maximum>0?Math.max(0,Math.min(1,current/maximum)):0;fill(x,y,w,h,'#092329');fill(x+2,y+2,w-4,h-4,'#214b50');if(ratio>0)fill(x+2,y+2,(w-4)*ratio,h-4,'#bd572e')}
function ticket(x,y,w,h){path([[x+7,y],[x+w-7,y],[x+w,y+7],[x+w,y+h-7],[x+w-7,y+h],[x+7,y+h],[x,y+h-7],[x,y+7]],'#f1e2be','#092329',2);for(const [a,b] of [[x+7,y+7],[x+w-7,y+7],[x+7,y+h-7],[x+w-7,y+h-7]]){ctx.fillStyle='#092329';ctx.beginPath();ctx.arc(a,b,1.4,0,7);ctx.fill()}}
function harborBackdrop(){ctx.clearRect(0,0,450,800);ctx.drawImage(harborPlate,0,0,450,800);ctx.save();ctx.beginPath();ctx.rect(5,52,440,310);ctx.clip();fill(5,52,440,310,'#e9ddb5');ctx.translate(0,-249);for(const l of parallaxData.layers){const travel=model.distance*l.speed/l.period,base=Math.floor(travel),offset=(travel-base)*l.period;for(let tile=-1;tile<2;tile++){const flip=(base+tile)%2!==0;ctx.save();ctx.translate(tile*l.period-offset+(flip?l.period:0),l.y);ctx.scale(flip?-1:1,1);ctx.drawImage(sceneryImages[l.image],0,0,l.period+.5,l.height);ctx.restore()}}ctx.restore();}
function harborHUD(){
 const cream='#f1e2be',teal='#214b50',dark='#092329',orange='#bd572e';
 fill(250,5,173,19,'#07343e');ink(BrineCombat.routes[model.route].name.toUpperCase()+' · '+String(model.stage).padStart(2,'0'),258,8,15,cream,'left',false,165);
 // Route dots and flag remain part of the selected artwork; move the orange marker with progress.
 fill(258,29,164,17,'#07343e');fill(273,35,135,2,cream);for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(273+i*32,36,4.5,0,7);ctx.fillStyle=i<=(model.stage-1)%5?orange:cream;ctx.fill()}
 for(const [x,w,name,hp,max] of [[8,132,'BRINE · LV '+model.level,model.playerHp,model.maxPlayerHp],[309,132,model.enemy.name.toUpperCase(),model.hp,model.maxHp]]){ticket(x,61,w,49);ink(name,x+11,67,13,dark,'left',false,w-22);healthBar(x+9,85,w-18,17,hp,max);ink(hp+' / '+max,x+w/2,87,13,cream,'center',false,w-24)}
 if(model.state==='fight'){ink(model.submerged?'BURROWED':model.guarded?'SHIELD UP':model.enemy.action.toUpperCase(),437,114,10,cream,'right')}
 // Action icons are retained from the approved ticket art; labels show actual availability.
 fill(62,375,147,37,cream);ink(model.farming?'PUSH FORWARD':'GATHER SALVAGE',64,376,18,dark,'left',false,143);ink(model.best===0?'CLEAR STRETCH 1':model.farming?'NEXT STRETCH':'REPEAT CLEARED ROAD',65,400,9,teal,'left',false,142);
 fill(288,375,146,37,cream);ink('3-SHOT VOLLEY',290,376,18,dark,'left',false,143);const volley=!model.ultimateActive&&model.state==='fight'&&!model.paused&&model.charge>=100;ink(volley?'READY — FIRE':model.ultimateActive?'MELEE ACTIVE':model.charge>=100?'NEXT BATTLE':'CHARGING '+model.charge+'%',290,400,9,volley?orange:teal);
 fill(13,440,149,105,cream);fill(162,440,54,42,cream);const sword=model.ultimateActive&&model.selectedForm==='samurai',w=equipped(),art=sword?samuraiImages.katana:weaponImages[w.id];ink(sword?'BREAKWATER':w.name.toUpperCase(),16,443,21,dark,'left',false,182);ink(sword?'HEAVY SWORD':'EQUIPPED GUN',16,465,10,teal);
 fill(13,478,145,63,cream);const k=Math.min(141/art.width,59/art.height);ctx.drawImage(art,85-art.width*k/2,510-art.height*k/2,art.width*k,art.height*k);
 fill(229,439,208,17,cream);ink('FORM',238,441,13,dark);fill(273,500,157,36,orange);ink(model.ultimateActive?'MELEE ACTIVE':'ENTER FORM',351,501,20,cream,'center',false,153);ink(model.ultimateActive?model.ultimateSeconds+'s REMAINING':model.paused?'PAUSED':model.ultimateCharge>=100?(model.state==='fight'?'READY':'READY · NEXT BATTLE'):'CHARGING '+model.ultimateCharge+'%',351,524,10,cream,'center',false,147);
 fill(7,548,437,108,teal);
 fill(278,664,118,35,cream);ink(model.gold.toLocaleString(),390,666,29,dark,'right',false,111);
 if(model.paused){ticket(153,118,144,22);ink('PAUSED · CAMP TO RESUME',225,124,9,dark,'center')}
}

const upgradeTrack=$('upgrade-track');
function scrollUpgrades(direction){upgradeTrack.scrollBy({left:direction*upgradeTrack.clientWidth,behavior:'smooth'})}
$('upgrades-prev').onclick=()=>scrollUpgrades(-1);$('upgrades-next').onclick=()=>scrollUpgrades(1);
function updateUpgradePaging(){const max=upgradeTrack.scrollWidth-upgradeTrack.clientWidth,at=upgradeTrack.scrollLeft;const first=Math.round(at/(upgradeTrack.firstElementChild.offsetWidth+upgradeTrack.clientWidth*.02))+1;$('upgrade-position').textContent='UPGRADES · '+first+'–'+Math.min(6,first+2)+' OF 6';$('upgrades-prev').disabled=at<2;$('upgrades-next').disabled=at>=max-2;}
upgradeTrack.addEventListener('scroll',updateUpgradePaging,{passive:true});window.addEventListener('resize',updateUpgradePaging);upgradeTrack.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();scrollUpgrades(event.key==='ArrowRight'?1:-1)}});updateUpgradePaging();
