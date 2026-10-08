(function(root){
'use strict';
const ratio=191/30;
const routes=()=>root.BrineCombat?.routes||require('./combat-v3.js').routes;
const compact=(n,cleared=false)=>n<=50?n:50+(cleared?Math.floor:Math.ceil)((n-50)*30/191);
const expand=n=>n<=50?n:Math.round(50+(n-50)*ratio);
const active=m=>!!m.pacing?.enabled&&!(m.forge?.run&&!m.forge.run.complete)&&m.stage>50;
function install(C){if(C.prototype.pacingInstalled)return;C.prototype.pacingInstalled=true;
 const reset=C.prototype.reset;C.prototype.reset=function(){this.pacing=null;reset.call(this);this.pacing=this.loadingPacing||null;};
 // Retreat to the closest cleared ordinary crew, avoiding captains and special defenses.
 Object.defineProperty(C.prototype,'farmStage',{get(){for(let stage=Math.max(1,this.best);stage>0;stage--){if(stage%5!==0&&(stage-1-Math.floor((stage-1)/5))%5<2)return stage;}return 1;}});
 C.prototype.unlockStage=function(stage){return this.pacing?.enabled?compact(stage):stage;};
 function sampleWeapon(m){const copy=new C(m.settings),data=m.save();delete data.pacing;if(data.forge)data.forge.run=null;copy.load(data,data.savedAt);copy.stage=51;copy.startEncounter();copy.state='fight';copy.enemyX=330;copy.enemyCycle=-1e6;copy.playerHp=1e12;copy.hp=copy.maxHp=1e12;copy.ultimateTime=0;copy.lowTideTime=0;copy.pendingVolley=copy.pendingUltimate=false;copy.paused=false;let roll=0;copy.upgradeRoll=()=>((roll++*73)%100)/100;let start=copy.hp;for(let i=0;i<600;i++){copy.tick(.02,{x:200,y:460});if(i===99)start=copy.hp;}return Math.max(1,(start-copy.hp)/10);}
 // Legacy saves retain their anchor; fresh stretch-50 arrivals share fixed difficulty.
 // Sample the strongest owned loadout only when converting an older road.
 function sample(m){const weapon=m.weapon;try{return Math.max(...m.settings.weapons.filter(w=>m.weaponAvailable(w.id)).map(w=>{m.weapon=w.id;return sampleWeapon(m);}));}finally{m.weapon=weapon;}}
 C.prototype.tryPacing=function(){if(this.pacing?.enabled||this.best<50||this.forge?.run)return false;
  const originalStage=this.stage,originalBest=this.best,newBest=compact(this.best,true),newStage=!this.farming&&['reward','lower'].includes(this.state)?newBest+1:Math.min(newBest+1,compact(this.stage));
  if(!this.pacing){const dps=this.best===50?350:sample(this),baseHp=this.settings.enemyHealth+(this.best)*9,oldTime=baseHp/dps;this.pacing={version:1,enabled:false,dps,anchor:Math.max(51,newBest+1),hit:this.best===50?14:Math.max(1,Math.min(this.enemyDamage/routes()[this.route].damage*.35,this.maxPlayerHp*.03)),normalReward:this.best===50?2:Math.max(1,Math.min(5,9.2/(oldTime+3.2))),bossReward:this.best===50?4:Math.max(1,Math.min(10,28.2/(oldTime*2.3+3.2)))};}
  Object.assign(this.pacing,{enabled:true,originalStage,originalBest,compactStage:newStage,compactBest:newBest});this.stage=newStage;this.best=newBest;this.startEncounter();return true;
 };
 C.prototype.leavePacing=function(){const p=this.pacing;if(!p?.enabled||this.forge?.run)return false;this.stage=this.stage===p.compactStage?p.originalStage:expand(this.stage);this.best=this.best===p.compactBest?p.originalBest:expand(this.best);p.enabled=false;this.stage=Math.min(this.stage,this.best+1);this.startEncounter();return true;};
 // Migrate the road without interrupting an in-progress campaign or losing cargo.
 C.prototype.ensureCalibrated=function(){if(this.pacing?.enabled||this.best<50)return false;const run=this.forge?.run;
  if(run){const copy=new C(this.settings),data=this.save();copy.load(data,data.savedAt);copy.forge.run=null;copy.stage=run.complete?this.stage:run.road.stage;copy.route=run.complete?this.route:run.road.route;copy.startEncounter();if(!copy.tryPacing())return false;this.pacing={...copy.pacing};this.best=copy.best;run.road.stage=compact(run.road.stage);if(run.complete){this.stage=copy.stage;this.startEncounter();}return true;}
  const paused=this.paused,dead=this.state==='defeat';const changed=this.tryPacing();this.paused=paused;if(dead)this.enter('defeat');return changed;
 };
 function growth(m,power=2.2){return Math.pow(Math.max(.015,(m.stage+50)/(m.pacing.anchor+50)),power);}
 const start=C.prototype.startEncounter;C.prototype.startEncounter=function(){start.call(this);if(this.stage>5&&this.stage<=50&&!(this.forge?.run&&!this.forge.run.complete)){this.hp=this.maxHp=Math.round(this.maxHp*(1+5*Math.pow((this.stage-5)/45,1.5)));}if(active(this)){const protection=this.enemy.action==='guard'?.6:this.enemy.action==='burrow'?.65:1;const seconds=this.boss?(this.stage%25===0?45:35):12;this.hp=this.maxHp=Math.max(1,Math.round(this.pacing.dps*seconds*growth(this)*protection*(this.boss?1:Math.min(1.1,this.enemy.health))));}};
 const incoming=Object.getOwnPropertyDescriptor(C.prototype,'enemyDamage').get;Object.defineProperty(C.prototype,'enemyDamage',{get(){return active(this)?Math.max(1,Math.round(this.pacing.hit*.65*growth(this,.55)*(this.boss?1.5:1)*routes()[this.route].damage)):incoming.call(this)*(this.stage>5&&this.stage<=50&&!(this.forge?.run&&!this.forge.run.complete)?.75:1);}});
 const reward=Object.getOwnPropertyDescriptor(C.prototype,'reward').get;Object.defineProperty(C.prototype,'reward',{get(){if(!active(this))return reward.call(this);const legacy=50+Math.max(0,this.stage-50)*1.4,routes=root.BrineCombat?.routes||require('./combat-v3.js').routes;return Math.floor((this.settings.reward+Math.floor((legacy-1)*2))*(this.boss?4:1)*routes[this.route].reward*this.salvageMultiplier*(this.boss?Math.min(2,this.pacing.bossReward):this.pacing.normalReward));}});
 // Away earnings follow cleared ground, never enemy health or current equipment.
 Object.defineProperty(C.prototype,'offlineRate',{get(){return this.best===0?0:(4+this.best*3)*this.salvageMultiplier;}});
 Object.defineProperty(C.prototype,'enemyRepairFraction',{configurable:true,get(){return active(this)?.02:.12;}});
 Object.defineProperty(C.prototype,'pacingXpMultiplier',{get(){return active(this)?(this.boss?this.pacing.bossReward:this.pacing.normalReward):1;}});
 const save=C.prototype.save;C.prototype.save=function(...args){return {...save.apply(this,args),pacing:this.pacing?{...this.pacing}:null};};
 const load=C.prototype.load;C.prototype.load=function(data,...args){const p=data?.pacing,valid=p?.version===1&&['dps','anchor','hit','normalReward','bossReward','originalStage','originalBest','compactStage','compactBest'].every(k=>Number.isFinite(p[k])&&p[k]>=0);this.loadingPacing=valid?{...p,enabled:p.enabled===true}:null;let ok;try{ok=load.call(this,data,...args);}finally{this.loadingPacing=null;}return ok;};
}
const api={compact,expand,install};if(typeof module!=='undefined')module.exports=api;else{root.BrinePacing=api;install(root.BrineCombat.Encounter);}
})(typeof globalThis!=='undefined'?globalThis:this);

