(function(root){
'use strict';
const upgrades={
 splinter:{name:'Splinter Shot',unlock:18,cap:25,cost:110,description:'+1% chance per rank for a follow-up shard dealing 35% gun damage. Maximum 25%.'},
 hullcrack:{name:'Hull Crack',unlock:22,cap:Infinity,cost:120,description:'Hits crack armor up to 10 stacks. Improves damage and guard penetration, with diminishing returns. Resets per enemy.'},
 undertow:{name:'Undertow',unlock:28,cap:Infinity,cost:140,description:'Damage grows per rank and per hit stack, up to 10 stacks. Ranks above 20 have diminishing returns. Lose 2 stacks per second between battles.'},
 laststand:{name:'Last Stand',unlock:32,cap:20,cost:150,description:'Below 30% health, reduce incoming damage by 2% per rank for 3 seconds. 25-second cooldown. Maximum 40% protection.'},
 jackpot:{name:'Scrap Jackpot',unlock:16,cap:20,cost:100,description:'+1% chance per rank for triple salvage on a road kill. Maximum 20%. Does not multiply campaign cargo or away earnings.'},
 secondwind:{name:'Second Wind',unlock:24,cap:20,cost:130,description:'Reduce Low Tide recovery by 2% per rank, up to 40%. Early withdrawal still halves recovery.'}
};
const descriptions={splinter:'35% damage follow-up.',hullcrack:'Armor break · 10 hits.',undertow:'Damage · 10 hit stacks.',laststand:'3s guard · 25s cooldown.',jackpot:'Triple salvage chance.',secondwind:'Shorter Low Tide.'};
function install(C,P,J,F){
 if(C.prototype.buildUpgradesInstalled)return;C.prototype.buildUpgradesInstalled=true;
 Object.assign(F.upgrades,upgrades);
 for(const [id,u] of Object.entries(upgrades)){
  J.rules[id]=[u.name,'Clear stretch '+u.unlock,m=>m.best>=u.unlock];
  J.lessons.push({id,title:u.name,text:u.description+' Find it in Build.',target:'#upgrade-'+id,complete:m=>m.upgrades[id]>0});
 }
 P.paths.scrap=[['pierce','Hardened slug','Bypass guard.'],['impact','Heavy breech','+40% hit damage per mastery tier, but 20% longer between shots.']];
 P.paths.riveter=[['impact','Long burst','Fifth-hit burst gains +25% damage per mastery tier.'],['tempo','Split rivets','Every third hit launches a follow-up rivet: 12% damage per tier. Also 15% faster firing per tier.']];
 P.paths.harpoon=[['impact','Captain breaker','Boss gun damage gains +15% per tier. Ignores guard.'],['tempo','Barbed line','15% faster firing per tier; hits build an extra Hull Crack stack if trained. Ignores guard.']];
 P.paths.boiler=[['impact','Pressure chamber','Third-hit explosion gains +25% damage per tier.'],['tempo','Quick vent','15% faster firing per tier; every third hit restores 1% maximum health per tier.']];
 const rank=(m,k)=>m.upgrades[k]||0;
 const reset=C.prototype.reset;C.prototype.reset=function(){reset.call(this);this.undertowStacks=0;this.lastStandTime=0;this.lastStandCooldown=0;};
 const start=C.prototype.startEncounter;C.prototype.startEncounter=function(){start.call(this);this.hullStacks=0;};
 const cap=C.prototype.cap;C.prototype.cap=function(k){return upgrades[k]?.cap??cap.call(this,k);};
 const value=C.prototype.upgradeValue;C.prototype.upgradeValue=function(k){const r=rank(this,k);return k==='splinter'||k==='jackpot'?r:k==='hullcrack'?60*r/(r+20):k==='undertow'?10*F.effective(r,20):k==='laststand'||k==='secondwind'?2*r:value.call(this,k);};
 const preview=C.prototype.upgradePreview;C.prototype.upgradePreview=function(k){if(!upgrades[k])return preview.call(this,k);const a=this.upgradeValue(k);this.upgrades[k]++;const b=this.upgradeValue(k);this.upgrades[k]--;return F.format(a)+' → '+F.format(b)+'%';};
 C.prototype.recoveryFactor=function(){return 1-Math.min(20,rank(this,'secondwind'))*.02;};
 C.prototype.armorBreak=function(){return this.upgradeValue('hullcrack')/100*Math.min(10,this.hullStacks||0)/10;};
 C.prototype.guardFactor=function(){return .35+.65*this.armorBreak();};
 C.prototype.branchInterval=function(){return this.weapon==='scrap'&&this.progress.weaponPath[0]==='impact'?1.2:1;};
 C.prototype.protectHit=function(damage){
  if(rank(this,'laststand')>0&&this.lastStandCooldown<=0&&this.playerHp-damage<=this.maxPlayerHp*.3){this.lastStandTime=3;this.lastStandCooldown=25;this.effects.push({type:'laststand',x:124+this.meleeAdvance,y:465,life:1,duration:1});}
  return Math.max(1,Math.round(damage*(this.lastStandTime>0?1-Math.min(20,rank(this,'laststand'))*.02:1)));
 };
 const tick=C.prototype.tick;C.prototype.tick=function(dt,...a){if(!this.paused&&this.state!=='defeat'){const t=Math.max(0,Math.min(.1,dt));this.lastStandTime=Math.max(0,(this.lastStandTime||0)-t);this.lastStandCooldown=Math.max(0,(this.lastStandCooldown||0)-t);if(this.state!=='fight')this.undertowStacks=Math.max(0,(this.undertowStacks||0)-t*2);}return tick.call(this,dt,...a);};
 const hit=C.prototype.hitEnemy;C.prototype.hitEnemy=function(value,weapon,y,power=1,secondary=false){
  if(this.state!=='fight'||this.submerged&&weapon!=='melee')return hit.call(this,value,weapon,y,power);
  const gun=weapon!=='melee',raw=value,kills=this.kills,campaign=this.forge.run&&!this.forge.run.complete,prior=new Set(this.effects);
  const i=P.ids.indexOf(weapon),path=this.progress.weaponPath[i],tier=P.tier(this.progress.weaponXP[i]||0),contact=(this.gunContacts[weapon]||0)+1;
  if(!secondary){
   if(rank(this,'hullcrack'))this.hullStacks=Math.min(10,(this.hullStacks||0)+(weapon==='harpoon'&&path==='tempo'?2:1));
   if(rank(this,'undertow'))this.undertowStacks=Math.min(10,(this.undertowStacks||0)+1);
   value*=1+this.armorBreak()*.5;value*=1+(this.undertowStacks||0)*F.effective(rank(this,'undertow'),20)*.01;
   // Existing mastery impact applies +25% per tier; replace that factor for specialized guns.
   if(path==='impact'){
    if(weapon==='scrap')value*=(1+tier*.4)/(1+tier*.25);
    if(weapon==='riveter')value*=(contact%5===0?1+tier*.25:1)/(1+tier*.25);
    if(weapon==='harpoon')value*=(this.boss?1+tier*.15:1)/(1+tier*.25);
    if(weapon==='boiler')value*=(contact%3===0?1+tier*.25:1)/(1+tier*.25);
   }
   if(weapon==='boiler'&&path==='tempo'&&contact%3===0)this.playerHp=Math.min(this.maxPlayerHp,this.playerHp+Math.round(this.maxPlayerHp*tier*.01));
  }
  this.buildSecondary=secondary;
  try{hit.call(this,value,weapon,y,power);}finally{this.buildSecondary=false;}
  for(const e of this.effects)if(e.type==='hit'&&!prior.has(e))e.secondary=secondary;
  if(this.kills>kills&&!campaign&&rank(this,'jackpot')>0&&(this.upgradeRoll?.()??Math.random())<rank(this,'jackpot')*.01){
   const bonus=this.lastReward*2;this.gold=Math.min(Number.MAX_VALUE,this.gold+bonus);this.lastReward+=bonus;
   const reward=this.effects.findLast(e=>e.type==='reward');if(reward)reward.damage=this.lastReward;
   this.effects.push({type:'jackpot',x:this.enemyX,y:405,damage:bonus,life:1.4,duration:1.4});
   this.progress.notice='Scrap Jackpot! Triple salvage: '+F.format(this.lastReward)+'.';
  }
  if(gun&&!secondary&&this.state==='fight'){
   const shard=scale=>this.shots.push({x:this.enemyX-100,startX:this.enemyX-100,y:y+12,damage:Math.max(1,raw*scale),weapon,speed:850,secondary:true});
   if(rank(this,'splinter')>0&&(this.upgradeRoll?.()??Math.random())<rank(this,'splinter')*.01)shard(.35);
   if(weapon==='riveter'&&path==='tempo'&&contact%3===0)shard(tier*.12);
  }
 };
 const save=C.prototype.save;C.prototype.save=function(...a){return {...save.apply(this,a),lastStandCooldown:this.lastStandCooldown||0};};
 const load=C.prototype.load;C.prototype.load=function(data,...a){const ok=load.call(this,data,...a);if(ok)this.lastStandCooldown=Math.max(0,Math.min(25,Number(data.lastStandCooldown)||0));return ok;};
}
const api={upgrades,descriptions,install};if(typeof module!=='undefined')module.exports=api;else{root.BrineBuild=api;install(root.BrineCombat.Encounter,root.BrineProgression,root.BrineJourney,root.BrineTideglass);}
})(typeof globalThis!=='undefined'?globalThis:this);
