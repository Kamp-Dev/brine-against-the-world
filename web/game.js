const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id),model=new BrineCombat.Encounter();
const walk=new Image(),fire=new Image(),enemyImages={},weaponImages={},harborPlate=new Image(),harborClean=new Image();const stepShellImages={punch:new Image(),walk:new Image(),rig:new Image()};let stepShellConfig;let enemyBounds={},parallaxData,enemyMotionConfig;const sceneryImages={};const SAVE_KEY='brine-rpg-v1';let saveNote='Progress saved on this device.';let config,ready=false,last=0,clock=0,origin={x:200,y:460};
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(model.save()));saveNote='Progress saved on this device.'}catch{saveNote='Saving unavailable in this browser session.'}}
function refresh(){
 for(const id of ['scrap','repeater','lowtide']){$(id).setAttribute('aria-pressed',model.weapon===id);$(id).disabled=model.best<model.settings.weapons.find(w=>w.id===id).unlock}
 $('stats').textContent='Salvage '+model.gold+' · Cleared '+model.best+' · Level '+model.level;
 $('status').textContent=model.paused?'Paused.':model.state==='defeat'?'Shell cracked. Your salvage and upgrades are safe. Refit to try again.':model.state==='reward'?'Road clear. +'+model.lastReward+' salvage.':model.farming?'Gathering salvage on cleared ground.':'Pushing toward stretch '+model.stage+(model.boss?' — boss ahead.':'.');
 for(const w of model.settings.weapons)$(w.id).querySelector('span').textContent=model.best<w.unlock?'Clear stretch '+w.unlock+' to unlock':w.description;
 for(const kind of ['damage','shell','speed']){const button=$('upgrade-'+kind),rank=model.upgrades[kind];button.disabled=rank>=30||model.gold<model.cost(kind);button.querySelector('span').textContent=rank>=30?'Fully upgraded':'Rank '+rank+' · '+model.cost(kind)+' salvage';button.setAttribute('aria-label',rank>=30?kind+' fully upgraded, rank 30 of 30':'Upgrade '+kind+', '+model.cost(kind)+' salvage, rank '+rank+' of 30')}
 $('health').textContent=model.playerHp+' / '+model.maxPlayerHp+' shell';$('health-bar').value=model.playerHp;$('health-bar').max=model.maxPlayerHp;
 $('xp').textContent=model.xp+' / '+model.nextXp+' XP to level '+(model.level+1);
 const canVolley=!model.ultimateActive&&model.charge>=100&&model.state==='fight'&&!model.paused;$('volley').disabled=!canVolley;$('volley').dataset.ready=canVolley;$('volley').textContent='3-SHOT VOLLEY\n'+(model.state==='defeat'?'REFIT FIRST':model.paused?'PAUSED':canVolley?'READY — FIRE':model.charge>=100?'NEXT BATTLE':'CHARGING '+model.charge+'%');$('volley').title='Hits charge three rapid shots. Fire when ready during battle.';
 $('farm').disabled=model.ultimateActive||model.best===0||model.state==='defeat';$('farm').textContent=model.state==='defeat'?'ROAD BLOCKED\nREFIT FIRST':model.farming?'PUSH FORWARD\nNEXT STRETCH':model.best===0?'GATHER SALVAGE\nCLEAR STRETCH 1':'GATHER SALVAGE\nREPEAT ROAD';$('farm').title=model.farming?'Leave farming and challenge the next uncleared stretch':'Repeat cleared ground to earn salvage';
 $('retry').hidden=model.state!=='defeat';$('pause').textContent=model.paused?'Resume':'Pause';$('save-note').textContent=saveNote;
 const ult=$('ultimate');ult.disabled=model.paused||model.state!=='fight'||model.ultimateCharge<100||model.ultimateActive;ult.setAttribute('aria-label',model.ultimateActive?'Step Shell active, '+model.ultimateSeconds+' seconds remaining':'Step Shell melee Ultimate, '+model.ultimateCharge+'% charged');
 const quick=$('ultimate-quick');quick.disabled=ult.disabled;quick.dataset.ready=!ult.disabled;quick.textContent=model.ultimateActive?'MELEE · '+model.ultimateSeconds+'s':model.ultimateCharge>=100?'STEP SHELL · '+(model.state==='fight'?'UNLEASH':'READY'):'STEP SHELL · '+model.ultimateCharge+'%';
 $('workshop').disabled=model.modRank>=3||model.gold<model.modCost();$('workshop').textContent=model.modRank>=3?'ATTACHMENT MAXED':equipped().name+' attachment '+(model.modRank+1)+'/3 · '+model.modCost()+' salvage';
 $('mod-info').textContent='Rank '+model.modRank+'/3 · +'+(model.modRank*5)+' damage. Fitted to this gun; visible on its barrel.';
 for(let i=0;i<3;i++){const r=$('route-'+i);r.disabled=model.best<i*5||model.ultimateActive||model.state==='defeat';r.setAttribute('aria-pressed',model.route===i);r.textContent=BrineCombat.routes[i].name+(model.best<i*5?' · clear '+i*5:' · '+Math.round((BrineCombat.routes[i].reward-1)*100)+'% extra salvage');}
 $('loadout').textContent=model.damage+' damage · '+model.interval.toFixed(2)+'s between shots';
 $('defeat-refit').hidden=model.state!=='defeat'||harborTab!=='road';$('live-summary').textContent='Stretch '+model.stage+', '+equipped().name+', health '+model.playerHp+' of '+model.maxPlayerHp+', '+model.gold+' salvage';
}
for(const id of ['scrap','repeater','lowtide'])$(id).onclick=()=>{model.equip(id);persist();refresh()};
for(const kind of ['damage','shell','speed'])$('upgrade-'+kind).onclick=()=>{model.buy(kind);persist();refresh()};
$('pause').onclick=()=>{model.paused=!model.paused;refresh()};
$('retry').onclick=()=>{model.retry();persist();refresh()};
$('farm').onclick=()=>{model.toggleFarm();persist();refresh()};
$('workshop').onclick=()=>{model.buyMod();persist();refresh()};for(let i=0;i<3;i++)$('route-'+i).onclick=()=>{model.chooseRoute(i);persist();refresh()};
$('volley').onclick=()=>{model.volley();refresh()};
$('reset').onclick=()=>{$('reset-confirm').hidden=false};$('cancel-reset').onclick=()=>{$('reset-confirm').hidden=true};
$('confirm-reset').onclick=()=>{model.reset();persist();$('reset-confirm').hidden=true;$('welcome').hidden=true;refresh()};
$('dismiss-welcome').onclick=()=>{$('welcome').hidden=true};
setInterval(()=>{if(ready&&!document.hidden)persist()},5000);window.addEventListener('pagehide',()=>{if(ready)persist()});
document.addEventListener('visibilitychange',()=>{if(!ready)return;if(document.hidden)persist();else{try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&Date.now()-s.savedAt>60000){const paused=model.paused;model.load(s);model.paused=paused;showOffline();persist();}}catch{}last=0}});
function showOffline(){if(model.offlineEarned>0){$('welcome').hidden=false;$('offline-text').textContent='Your cleared route brought in '+model.offlineEarned+' salvage while you were away. (Up to 8 hours.)'}}
function path(points,fill,stroke='#19251d',width=3){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke()}}
function ridge(y,color,period,height,speed){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,800);for(let x=0;x<=455;x+=5){let z=(x+model.distance*speed)/period;ctx.lineTo(x,y-Math.sin(z)*height-Math.cos(z*2.3)*height*.24)}ctx.lineTo(450,800);ctx.fill()}
function background(){ctx.fillStyle='#e6c991';ctx.fillRect(0,0,450,800);ctx.fillStyle='#f4dfb2';ctx.beginPath();ctx.arc(352,187,39,0,Math.PI*2);ctx.fill();ridge(400,'#caae79',125,28,.12);ridge(470,'#b79d6b',85,24,.32);ridge(558,'#957f58',130,17,.55);ctx.fillStyle='#d4b47b';ctx.fillRect(0,572,450,228);ctx.fillStyle='#514d37';ctx.fillRect(0,570,450,4);ctx.fillStyle='#a68b5b';for(let i=-1;i<12;i++){let x=i*70-model.distance%70;ctx.fillRect(x,612+(i%3)*35,18,3)}ctx.fillStyle='#243328';ctx.font='bold 13px system-ui';ctx.fillText('THE SALT ROAD',26,40);ctx.font='12px system-ui';ctx.fillText('STRETCH '+model.stage,26,61);ctx.textAlign='right';ctx.font='bold 16px system-ui';ctx.fillText(model.gold+' SALVAGE',425,42);ctx.textAlign='left';ctx.fillStyle='#27382a';ctx.font='bold 18px system-ui';ctx.fillText(['raise','fight'].includes(model.state)?'ROADBLOCK':model.state==='reward'?'ROAD CLEAR':'KEEP MOVING',26,722);ctx.font='12px system-ui';ctx.fillText(model.farming?'CLEARED GROUND / SALVAGE RUN':'LOW SHELL / STRETCH '+model.stage,26,748)}
function equipped(){return model.settings.weapons.find(w=>w.id===model.weapon)}
function muzzle(p){const w=equipped(),x=(w.muzzleX-w.gripX)*w.scale*.8,y=(w.muzzleY-w.gripY)*w.scale*.8;return{x:p.x+Math.cos(p.angle)*x-Math.sin(p.angle)*y,y:p.y+Math.sin(p.angle)*x+Math.cos(p.angle)*y}}
function gun(p,layer){if(model.ultimateActive)return;const w=equipped(),img=weaponImages[w.id];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(w.scale*.8,w.scale*.8);ctx.translate(-w.gripX,-w.gripY);
 const region=(x,y,width,height)=>ctx.drawImage(img,x,y,width,height,x,y,width,height);
 if(layer==='grip')region(0,w.splitY,w.splitX,w.height-w.splitY);
 else{region(0,0,w.splitX,w.splitY);region(w.splitX,0,w.width-w.splitX,w.height)}ctx.restore();if(layer==='barrel'&&model.modRank){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);for(let i=0;i<model.modRank;i++){ctx.fillStyle='#102d30';ctx.fillRect(13+i*5,-15,4,11);ctx.fillStyle='#d5ae68';ctx.fillRect(14+i*5,-14,2,8)}ctx.restore();}}

function pose(){const firing=model.state!=='travel'&&!model.meleeWalking,a=firing?config.fire:config.walk;
 let phase=6;if(!firing)phase=((model.meleeWalking?model.meleeWalkTime:model.age)*a.fps)%a.frames;
 else if(model.state==='raise')phase=Math.min(6,model.age/model.settings.raiseDuration*7);
 else if(model.state==='lower')phase=Math.min(6,model.age/model.settings.lowerDuration*7);
 const lowering=firing&&model.state==='lower',f=lowering?6-Math.floor(phase):Math.floor(phase),img=firing&&f!==0?fire:walk,b=a.renderBounds||{x:190,y:20,w:413,h:405},k=120/b.h,left=124-b.w*k/2,top=452,p=a.grips[f],next=a.grips[lowering?Math.max(0,f-1):firing?Math.min(6,f+1):(f+1)%a.frames];
 const t=phase-Math.floor(phase),w=equipped(),u=Math.min(1,model.sinceShot/model.settings.recoilDuration);
 const kick=firing?Math.sin(Math.PI*u)*Math.exp(-3*u)*3*w.recoil:0,lean=-kick*.012;
 const hx=left+(p.x-b.x)*k,hy=top+(p.y-b.y)*k,dx=hx-124,dy=hy-572;
 const bearing=0; // Weapon barrel artwork is horizontal; grip-to-muzzle offset is not its angle.
 return{a,img,f,b,k,left,top,lean,grip:{x:124+dx*Math.cos(lean)-dy*Math.sin(lean),y:572+dx*Math.sin(lean)+dy*Math.cos(lean),angle:p.angle+(next.angle-p.angle)*t+bearing+lean-kick*.025,scale:.85}}}
// The weapon follows the displayed hand, with no independent crossfade.
function blendedPose(){return pose()}
function body(p,alpha){const{a,img,f,b,k,left,top}=p;ctx.save();ctx.translate(124,572);ctx.rotate(p.lean||0);ctx.translate(-124,-572);ctx.globalAlpha=alpha;ctx.drawImage(img,(f%a.columns)*a.cellWidth+b.x,Math.floor(f/a.columns)*a.cellHeight+b.y,b.w,b.h,left,top,b.w*k,120);ctx.restore();ctx.globalAlpha=1}
function actor(){const p=blendedPose(),u=model.ultimateActive?sampleStepShell(model,stepShellConfig):null;
 ctx.save();ctx.translate(model.meleeAdvance||0,0);
 ctx.save();ctx.translate(124,572);ctx.scale(1,u?u.squash:1);ctx.translate(-124,-572);
 if(u&&u.show)drawStepShell(u);else{gun(p.grip,'grip');body(p,1);gun(p.grip,'barrel');}
 ctx.restore();
 if(model.playerHit>0){ctx.strokeStyle='#a1482d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(124,492,75,-1,1);ctx.stroke();}
 if(u)drawTransformation(u);origin=muzzle(p.grip);origin.x+=model.meleeAdvance||0;ctx.restore();}
function enemy(){
 if(['reward','lower'].includes(model.state))return;
 const e=model.enemy,img=enemyImages[e.art],b=enemyBounds[e.art],x=model.enemyX;
 const windup=model.state==='fight'?Math.max(0,(model.enemyCycle/e.interval-.75)/.25):0;
 const profile=enemyMotionConfig.profiles.find(p=>p.action===e.action),recoil=Math.sin(Math.min(1,model.enemyAttack/.32)*Math.PI);
 const squash=1-windup*profile.squash+(e.action==='repair'?recoil*.12:0),bob=model.state==='travel'?Math.sin(model.time*6)*profile.bob:0;
 const h=e.height*.78,w=b.w/b.h*h;
 ctx.save();ctx.beginPath();ctx.rect(0,315,450,258);ctx.clip();ctx.translate(x-recoil*profile.lunge,572+bob+(model.enemyDepth||0)-windup*profile.hop);ctx.rotate(windup*profile.lean-recoil*.06);ctx.scale(1+(1-squash)*.22,squash);
 if(model.effects.some(e=>e.type==='hit'&&e.life>.48))ctx.filter='brightness(1.4)';
 ctx.drawImage(img,b.x,b.y,b.w,b.h,-w/2,-h,w,h);
 ctx.restore();if(model.enemyDepth>1){ctx.fillStyle='#b99a66';ctx.beginPath();ctx.ellipse(x,570,45,10,0,0,7);ctx.fill();}


}
function effects(){
 for(const e of model.effects)if(e.type==='hit'&&e.weapon==='melee')drawComicImpact(e);

 for(const s of model.enemyShots){if(s.kind==='slam'||s.kind==='burrow'){ctx.strokeStyle=s.kind==='slam'?'#b65332':'#746348';ctx.lineWidth=5;ctx.beginPath();ctx.arc(s.x,570,s.kind==='slam'?22:13,Math.PI,Math.PI*2);ctx.stroke();}else{ctx.save();ctx.translate(s.x,s.y);ctx.rotate(model.time*8);path([[-6,0],[0,-5],[6,1],[0,5]],s.kind==='burst'?'#426d68':'#ae6a48');ctx.restore();}}

 for(const s of model.shots){const travel=s.x-s.startX;ctx.save();ctx.translate(s.x,s.y);
  if(s.weapon==='repeater'){ctx.strokeStyle='#244f54';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-Math.min(65,travel),0);ctx.lineTo(0,0);ctx.stroke();ctx.strokeStyle='#a4ddd0';ctx.lineWidth=2;ctx.stroke()}
  else if(s.weapon==='lowtide'){for(let i=-2;i<=2;i++){const y=i*Math.min(7,travel*.04);path([[-8,y-2],[3,y-2],[6,y+1],[-5,y+3]],i%2?'#c86a3c':'#f4d695','#322d26',1)}}
  else path([[-9,-3],[2,-3],[6,0],[2,3],[-9,3]],'#f5e1b1','#302f24',2);ctx.restore();
 }
 for(const e of model.effects){
  if(e.weapon!=='melee'&&(e.type==='hit'||e.type==='flash')){const t=1-e.life/e.duration,impact=e.type==='hit',k=impact?1:.42;ctx.save();ctx.translate(e.x,e.y);ctx.scale(k,k);ctx.globalAlpha=Math.max(0,1-t);
   if(e.weapon==='lowtide'||e.weapon==='melee'){
    for(let i=0;i<5;i++){const angle=i*1.256,r=8+t*23;ctx.fillStyle=i%2?'#a99674':'#e3c48c';ctx.strokeStyle='#514938';ctx.lineWidth=2;ctx.beginPath();ctx.arc(Math.cos(angle)*r,Math.sin(angle)*r,5+t*10,0,7);ctx.fill();ctx.stroke()}
    ctx.strokeStyle='#c66036';ctx.lineWidth=4*(1-t)+1;ctx.beginPath();ctx.arc(0,0,4+t*39,0,7);ctx.stroke();
    for(let i=0;i<9;i++){let angle=i*2.4,r=10+t*46;ctx.fillStyle='#5b4b32';ctx.fillRect(Math.cos(angle)*r,Math.sin(angle)*r+t*t*20,4,3)}
   }else if(e.weapon==='repeater'){
    ctx.strokeStyle='#69aaa2';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,3+t*14,7+t*27,0,0,7);ctx.stroke();
    for(let i=0;i<6;i++){const angle=i*Math.PI/3,r=5+t*32;path([[Math.cos(angle)*r,Math.sin(angle)*r],[Math.cos(angle)*r+10,Math.sin(angle)*r-2],[Math.cos(angle)*r+15,Math.sin(angle)*r],[Math.cos(angle)*r+10,Math.sin(angle)*r+2]],'#c2e5d5','#285358',1)}
   }else{
    for(let i=0;i<8;i++){const angle=i*2.4,r=4+t*29;ctx.save();ctx.translate(Math.cos(angle)*r,Math.sin(angle)*r+t*t*24);ctx.rotate(angle+t*3);ctx.fillStyle=i%2?'#f7e4ba':'#b98b52';ctx.strokeStyle='#483e2f';ctx.lineWidth=1;ctx.fillRect(-3,-3,6,6);ctx.strokeRect(-3,-3,6,6);ctx.restore()}
   }ctx.restore();
  }
  if(e.type!=='flash'&&e.type!=='repair'){ctx.textAlign='center';ctx.fillStyle=e.type==='reward'?'#203d2b':'#793319';ctx.font='bold 16px system-ui';ctx.fillText(e.type==='reward'?'+'+e.damage+' salvage':e.type==='repair'?'+'+e.damage+' repair':e.type==='miss'?'BURROWED':'−'+e.damage,e.x,e.y-28-(1-e.life)*18);ctx.textAlign='left'}
 }
}
function render(t){const dt=last?Math.min((t-last)/1000,.1):0;last=t;if(ready){origin=muzzle(blendedPose().grip);origin.x+=model.meleeAdvance||0;if(!document.hidden)model.tick(dt,origin);harborBackdrop();ctx.save();ctx.beginPath();ctx.rect(11,103,428,328);ctx.clip();ctx.translate(0,-212);enemy();actor();effects();ctx.restore();harborHUD();refresh()}requestAnimationFrame(render)}
function hud(){
 ctx.fillStyle='#243328';ctx.font='bold 13px system-ui';ctx.fillText('BRINE · LEVEL '+model.level,26,98);
 ctx.fillStyle='#9c8b64';ctx.fillRect(26,110,165,10);ctx.fillStyle='#536746';ctx.fillRect(26,110,165*model.playerHp/model.maxPlayerHp,10);
 ctx.font='12px system-ui';ctx.fillStyle='#243328';ctx.fillText(model.playerHp+' / '+model.maxPlayerHp,26,138);
 ctx.fillText(model.damage+' DMG  ·  '+model.interval.toFixed(2)+'s',26,160);
 if(model.state==='defeat'||model.paused){ctx.fillStyle='#17221ee8';ctx.fillRect(26,237,398,122);ctx.fillStyle='#f6ead2';ctx.font='bold 24px system-ui';ctx.fillText(model.paused?'TAKE A BREATHER.':'SHELL CRACKED.',46,278);ctx.font='13px system-ui';ctx.fillText(model.paused?'Resume when you’re ready.':'Refit below. Your upgrades stay with you.',46,311)}
}
Promise.all([fetch('animation.json?v=ankle-overlap-1').then(r=>r.json()),fetch('gameplay.json?v=ankle-overlap-1').then(r=>r.json()),fetch('enemies/bounds.json?v=ankle-overlap-1').then(r=>r.json()),fetch('parallax.json?v=ankle-overlap-1').then(r=>r.json()),fetch('step-shell.json?v=ankle-overlap-1').then(r=>r.json()),fetch('enemy-motion.json?v=ankle-overlap-1').then(r=>r.json())]).then(async([d,s,b,parallax,ultimate,motion])=>{
 enemyMotionConfig=motion;stepShellConfig=ultimate;config=d;enemyBounds=b;parallaxData=parallax;model.settings=s;model.reset();try{model.load(JSON.parse(localStorage.getItem(SAVE_KEY)))}catch{saveNote='Could not read the saved game. This session starts fresh.'}
 showOffline();persist();walk.src=d.walk.sheet;fire.src=d.fire.sheet;
 harborPlate.src="ui/harbor-reference.png";harborClean.src="ui/harbor-clean.png";const pending=[walk.decode(),fire.decode(),harborPlate.decode(),harborClean.decode()];for(const w of s.weapons){const img=weaponImages[w.id]=new Image();img.src="weapons/"+w.art+".png";pending.push(img.decode())}for(const enemy of BrineCombat.enemies){const img=enemyImages[enemy.art]=new Image();img.src='enemies/'+enemy.art+'.png?v=ankle-overlap-1';pending.push(img.decode())}
 for(const kind of ['punch','walk','rig']){stepShellImages[kind].src=stepShellConfig[kind].sheet+'?v=ankle-overlap-1';pending.push(stepShellImages[kind].decode());}for(const l of parallax.layers){const img=sceneryImages[l.image]=new Image();img.src='scenery/'+l.image+'.png';pending.push(img.decode())}await Promise.all(pending);ctx.setTransform(4.8,0,0,4.8,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ready=true;$("loading").hidden=true;refresh();
}).catch(e=>{$('status').textContent='Could not load the game: '+e.message;$('status').classList.add('error');$('loading').textContent='Could not load harbor. Reload to retry.'});requestAnimationFrame(render);
