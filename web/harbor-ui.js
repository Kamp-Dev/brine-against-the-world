// The approved illustration supplies the panel skins; text and controls are live.
let harborTab='road';
function openHarbor(tab){harborTab=tab;$('drawer').hidden=tab==='road';$('drawer-title').textContent=tab==='ultimate'?'STEP SHELL':tab.toUpperCase();for(const p of document.querySelectorAll('[data-panel]'))p.hidden=p.dataset.panel!==tab;for(const name of ['road','guns','kit','camp'])$('nav-'+name).setAttribute('aria-current',name===tab?'page':'false')}
for(const name of ['road','guns','kit','camp'])$('nav-'+name).onclick=()=>openHarbor(name);
$('swap').onclick=()=>openHarbor('guns');$('ultimate').onclick=()=>{model.ultimate();persist();refresh()};$('go-kit').onclick=()=>openHarbor('kit');$('close-drawer').onclick=()=>openHarbor('road');
$('ultimate-quick').onclick=()=>{model.ultimate();persist();refresh()};
$('defeat-refit').onclick=()=>{$('retry').click();openHarbor('road')};
function plateRegion(x,y,w,h){ctx.drawImage(harborPlate,x/450*harborPlate.width,y/800*harborPlate.height,w/450*harborPlate.width,h/800*harborPlate.height,x,y,w,h)}
function fill(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function ink(text,x,y,size=16,color='#071c1e',align='left',stencil=false,maxWidth){ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.font=size+'px Impact, sans-serif';if(maxWidth)ctx.fillText(text,x,y,maxWidth);else ctx.fillText(text,x,y);ctx.textAlign='left'}
function healthBar(x,y,w,h,current,maximum){
 const ratio=maximum>0?Math.max(0,Math.min(1,current/maximum)):0;
 fill(x,y,w,h,'#092329');fill(x+2,y+2,w-4,h-4,'#214b50');
 if(ratio>0)fill(x+2,y+2,(w-4)*ratio,h-4,'#bd572e');
}
function harborBackdrop(){ctx.clearRect(0,0,450,800);ctx.drawImage(harborPlate,0,0,450,800);
 ctx.save();ctx.beginPath();ctx.roundRect(11,103,428,326,9);ctx.clip();
 ctx.translate(0,-212);
 for(const l of parallaxData.layers){const offset=model.distance*l.speed%l.period;for(let tile=-1;tile<2;tile++){ctx.save();ctx.translate(tile*l.period-offset,0);for(const shape of l.shapes)path(shape.points.map(p=>[p.x,p.y]),shape.color,shape.stroke,1.5);ctx.restore();}}
 ctx.restore();
}
function harborHUD(){
 const cream='#f1e2be',teal='#214b50',dark='#092329',orange='#bd572e';
 fill(340,71,91,23,teal);ink('STRETCH '+model.stage,428,72,17,'#f2e5c2','right',false,80);
 const boss=Math.ceil(model.stage/5)*5;ctx.fillStyle='#e5b66b';ctx.beginPath();ctx.ellipse(298,81,12,15,0,0,7);ctx.fill();ink(boss,298,72,20,dark,'center');
 // Restore the exact speech plaques from the reference after painting scenery.
 plateRegion(312,125,114,52);fill(319,130,98,14,cream);ink(model.enemy.name.toUpperCase(),319,132,12,dark,'left',false,98);
 fill(317,145,103,17,cream);healthBar(319,147,98,13,model.hp,model.maxHp);fill(363,162,54,11,cream);ink(model.hp+' / '+model.maxHp,416,162,11,dark,'right',false,53);
 plateRegion(19,366,160,57);fill(24,372,147,15,cream);ink('BRINE / LV '+model.level,25,373,15);
 fill(29,387,143,17,cream);healthBar(30,389,140,14,model.playerHp,model.maxPlayerHp);fill(29,404,135,15,cream);ink(model.playerHp+' / '+model.maxPlayerHp,31,406,16);
 const w=equipped();fill(18,443,180,70,cream);const img=weaponImages[w.id];const scale=Math.min(170/img.width,77/img.height);ctx.drawImage(img,100-img.width*scale/2,478-img.height*scale/2,img.width*scale,img.height*scale);
 fill(205,445,145,46,cream);ink(w.name.toUpperCase(),205,447,29,dark,'left',true,145);ink(w.id==='scrap'?'SALT SLUG':w.id==='repeater'?'TIDAL TRACER':'SCATTER BLAST',207,480,15,dark,'left',false,140);
 fill(182,527,240,65,'#bd572e');ink('STEP SHELL',302,528,19,'#f2e2bc','center');ink(model.ultimateActive?'MELEE / 75% GUARD':'4× MELEE / 75% GUARD',302,550,12,'#f2e2bc','center',true,205);ink(model.ultimateActive?model.ultimateSeconds+'s REMAINING':model.ultimateCharge>=100?(model.state==='fight'?'READY — TAP TO UNLEASH':'READY — NEXT BATTLE'):'CHARGING '+model.ultimateCharge+'%',302,566,12,'#f2e2bc','center',true,205);fill(205,581,207,7,'#092329');fill(206,582,205*(model.ultimateActive?Math.min(1,model.ultimateTime/8):model.ultimateCharge/100),5,'#e7be72');
 fill(22,110,190,18,teal);ink(BrineCombat.routes[model.route].name.toUpperCase(),28,112,12,cream);
 if(model.state==='fight'){fill(242,179,181,18,teal);ink(model.submerged?'BURROWED · MELEE HITS':model.guarded?'SHIELD UP · MELEE BREAKS':model.enemy.action==='repair'?'MENDER · REPAIRS 12%':model.enemyCycle>model.enemy.interval*.75?'INCOMING '+model.enemy.action.toUpperCase():model.enemy.action.toUpperCase(),331,182,10,cream,'center');}

 ['damage','shell','speed'].forEach((kind,i)=>{
  const x=19+i*144,cost=model.cost(kind),rank=model.upgrades[kind],maxed=rank>=30;
  fill(x+40,627,79,17,cream);ink(maxed?'MAX':(kind==='damage'?'+4':kind==='shell'?'+25':'+8%')+' / '+cost,x+117,628,17,dark,'right',false,100);
  fill(x+3,650,121,11,dark);fill(x+41,651,82,9,teal);fill(x+41,651,82*Math.min(rank,30)/30,9,'#dfb35f');
  // Keep the rank beside the track so every purchase visibly extends it.
  ink(rank+'/30',x+21,650,10,cream,'center');
  if(!maxed&&model.gold<cost){ctx.fillStyle='#173d431f';ctx.fillRect(x-4,604,136,62)}
 });
 fill(357,685,66,21,cream);ink(model.gold.toLocaleString(),425,686,23,dark,'right',false,83);
 if(model.paused){fill(143,107,162,20,teal);ink('PAUSED · CAMP TO RESUME',224,110,12,cream,'center');}
}
