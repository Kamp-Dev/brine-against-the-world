(function(root){
 'use strict';
 const defaults={raiseDuration:.32,lowerDuration:.32,shotInterval:.9,recoilDuration:.16,rewardDuration:.65,bulletSpeed:950,enemySpeed:90,reward:8,enemyHealth:48,weapons:[{"id":"scrap","name":"Plugger","art":"plugger","damage":12,"length":48,"unlock":0,"interval":1,"speed":720,"recoil":1,"gripX":470,"gripY":655,"muzzleX":1408,"muzzleY":365,"splitX":720,"splitY":520,"scale":0.047,"width":1536,"height":1024,"description":"Salt slug · sharp chip burst"},{"id":"repeater","name":"Tideline","art":"tideline","damage":20,"length":62,"unlock":3,"interval":1.1,"speed":1550,"recoil":0.65,"gripX":260,"gripY":650,"muzzleX":1470,"muzzleY":350,"splitX":550,"splitY":475,"scale":0.051,"width":1536,"height":1024,"description":"Fast teal tracer · piercing splash"},{"id":"lowtide","name":"Low Tide","art":"low-tide","damage":34,"length":50,"unlock":5,"interval":1.65,"speed":520,"recoil":2.5,"gripX":265,"gripY":805,"muzzleX":1190,"muzzleY":505,"splitX":610,"splitY":675,"scale":0.052,"width":1254,"height":1254,"description":"Spreading blast · dust explosion"}]};
 const weapons=Object.fromEntries(defaults.weapons.map(w=>[w.id,w]));
 const enemies=[{name:'Salt Porter',art:'salt-porter',health:1,damage:8,interval:2.6,height:132},{name:'Pipe Pilfer',art:'pipe-pilfer',health:.85,damage:6,interval:1.8,height:142},{name:'Sluice Keeper',art:'sluice-keeper',health:2.3,damage:17,interval:2.4,height:164}];
 enemies.push({name:'Gate Hauler',art:'gate-hauler',health:1.3,damage:11,interval:3.1,height:126,action:'guard'}, {name:'Sump Mender',art:'sump-mender',health:1.1,damage:7,interval:3.4,height:143,action:'repair'}, {name:'Mud Skipper',art:'mud-skipper',health:.95,damage:13,interval:2.8,height:110,action:'burrow'});
 enemies[0].action='lob';enemies[1].action='burst';enemies[2].action='slam';
 const routes=[{name:'Dry Docks',reward:1,damage:1},{name:'Drainage Run',reward:1.25,damage:1.2},{name:'Salt Flats',reward:1.5,damage:1.45}];
 const integer=(v,min,max,fallback)=>Number.isFinite(v)?Math.min(max,Math.max(min,Math.floor(v))):fallback;
 class Encounter{
  constructor(settings=defaults){this.settings=settings;this.reset()}
  get enemyIndex(){return this.stage%5===0?2:[0,1,3,4,5][(this.stage-1-Math.floor((this.stage-1)/5))%5]}
  get enemy(){return enemies[this.enemyIndex]}
  // Aim into the torso, not the full art bounds (which include weapons and shadows).
  get meleeContactX(){const v=(this.settings.enemyVisuals||[]).find(v=>v.id===this.enemy.art)||{ratio:1,contactFraction:.12};return this.enemyX-this.enemy.height*.78*v.ratio*v.contactFraction}
  get meleeReach(){return Math.max(0,this.meleeContactX-124-(this.settings.meleeReach||102)+4)}
  get ultimateActive(){return this.ultimateTime>0}
  get ultimatePhase(){return !this.ultimateActive?'normal':this.ultimateTime>8.4?'enter':this.ultimateTime<=.4?'exit':'melee'}
  get transformProgress(){return this.ultimatePhase==='enter'?(8.8-this.ultimateTime)/.4:this.ultimatePhase==='exit'?( .4-this.ultimateTime)/.4:0}
  get meleeDuration(){return this.settings.meleeDuration||1.2}
  get meleeImpact(){return this.settings.meleeImpact||.45}
  get ultimateSeconds(){return Math.ceil(Math.max(0,Math.min(8,this.ultimateTime-.4)))}
  get guarded(){return this.enemy.action==='guard'&&this.enemyCycle<this.enemy.interval*.65}
  get submerged(){return this.enemy.action==='burrow'&&this.enemyCycle>this.enemy.interval*.35&&this.enemyCycle<this.enemy.interval*.7}
  get modRank(){return this.mods[this.weapon]||0}
  modCost(){return 45*(this.modRank+1)}
  buyMod(){if(this.modRank>=3||this.gold<this.modCost())return false;this.gold-=this.modCost();this.mods[this.weapon]=this.modRank+1;return true}
  chooseRoute(id){if(!Number.isInteger(id)||id<0||id>2||this.best<id*5||this.state==='defeat'||this.ultimateActive)return false;this.route=id;return true}
  ultimate(){if(this.state!=='fight'||this.paused||this.ultimateCharge<100||this.ultimateActive)return false;this.ultimateCharge=0;this.ultimateTime=8.8;this.meleeWalkTime=0;this.meleeIdleTime=0;this.meleeIdleActive=false;this.meleeWalking=false;this.meleeCycle=0;this.meleeLanded=false;this.meleeSince=99;this.meleeLanded=false;this.burst=0;this.shots=[];return true}
  get boss(){return this.stage%5===0}
  get level(){return 1+Math.floor(Math.sqrt(this.xp/30))}
  get nextXp(){return this.level*this.level*30}
  get maxPlayerHp(){return 100+this.upgrades.shell*25+(this.level-1)*8}
  get damage(){return this.settings.weapons.find(w=>w.id===this.weapon).damage+this.upgrades.damage*4+(this.level-1)*2+this.modRank*5}
  get interval(){return this.settings.shotInterval*this.settings.weapons.find(w=>w.id===this.weapon).interval/(1+this.upgrades.speed*.08)}
  get enemyDamage(){return Math.round((this.enemy.damage+Math.floor((this.stage-1)*1.6))*routes[this.route].damage)}
  get reward(){return (this.settings.reward+Math.floor((this.stage-1)*2))*(this.boss?4:1)*routes[this.route].reward|0}
  get offlineRate(){return this.best===0?0:Math.min(60,4+this.best*1.5)}
  cost(kind){return Math.floor((kind==='damage'?18:kind==='shell'?16:30)*Math.pow(1.5,this.upgrades[kind]))}
  reset(){this.route=0;this.mods={scrap:0,repeater:0,lowtide:0};this.ultimateCharge=0;this.ultimateTime=0;this.meleeAdvance=0;this.meleeWalking=false;this.meleeWalkTime=0;this.meleeIdleTime=0;this.meleeIdleActive=false;this.meleeCycle=0;this.meleeLanded=false;this.meleeSince=99;this.enemyDepth=0;this.enemyAttack=99;this.weapon='scrap';this.gold=0;this.kills=0;this.stage=1;this.best=0;this.xp=0;this.upgrades={damage:0,shell:0,speed:0};this.farming=false;this.paused=false;this.time=0;this.distance=0;this.shotSerial=0;this.charge=0;this.offlineEarned=0;this.playerHp=this.maxPlayerHp;this.startEncounter()}
  startEncounter(){this.meleeCycle=0;this.meleeLanded=false;this.state='travel';this.age=0;this.enemyX=520;this.hp=this.maxHp=Math.round((this.settings.enemyHealth+(this.stage-1)*9)*this.enemy.health);this.cycle=0;this.enemyCycle=0;this.shots=[];this.enemyShots=[];this.effects=[];this.sinceShot=99;this.playerHit=0;this.burst=0;this.lastReward=0;this.enemyDepth=0;this.enemyAttack=99}
  equip(id){if(!this.settings.weapons.some(w=>w.id===id))throw Error('Unknown weapon');if(this.best<this.settings.weapons.find(w=>w.id===id).unlock)return false;this.weapon=id;return true}
  buy(kind){if(!Object.hasOwn(this.upgrades,kind)||this.upgrades[kind]>=30)return false;const cost=this.cost(kind);if(this.gold<cost)return false;this.gold-=cost;this.upgrades[kind]++;if(kind==='shell'&&this.state!=='defeat')this.playerHp=Math.min(this.maxPlayerHp,this.playerHp+25);return true}
  get farmStage(){return Math.max(1,this.best-(this.best%5===0?1:0))}
  retry(){this.ultimateTime=0;this.stage=this.farmStage;this.farming=this.best>0;this.playerHp=this.maxPlayerHp;this.paused=false;this.startEncounter()}
  toggleFarm(){if(this.ultimateActive||this.best===0||this.state==='defeat')return;this.farming=!this.farming;this.stage=this.farming?this.farmStage:this.best+1;this.startEncounter()}
  volley(){if(this.ultimateActive||this.state!=='fight'||this.paused||this.charge<100)return false;this.charge=0;this.burst=3;return true}
  enter(state){this.state=state;this.age=0}
  tick(dt,origin){if(this.paused||this.state==='defeat')return;dt=Math.max(0,Math.min(dt,.1));const s=this.settings;this.time+=dt;this.age+=dt;this.sinceShot+=dt;this.playerHit=Math.max(0,this.playerHit-dt);this.ultimateTime=Math.max(0,this.ultimateTime-dt);const phase=this.ultimatePhase,recovering=this.state!=='fight'&&this.meleeCycle>0&&this.meleeCycle<this.meleeDuration;
   const target=phase==='enter'||phase==='exit'||recovering?this.meleeAdvance:phase==='melee'?(['fight','raise'].includes(this.state)?this.meleeReach:this.meleeAdvance):0;
   const step=Math.sign(target-this.meleeAdvance)*Math.min(Math.abs(target-this.meleeAdvance),(s.meleeMoveSpeed||84)*dt);
   this.meleeWalking=Math.abs(step)>.00001;this.meleeAdvance+=step;if(this.meleeWalking)this.meleeWalkTime+=dt;
   const waiting=phase==='melee'&&['reward','lower','travel'].includes(this.state)&&!recovering;
   if(waiting){this.meleeIdleActive=true;this.meleeIdleTime+=dt;}
   else if(phase==='melee'&&this.meleeIdleActive){const landing=Math.ceil((this.meleeIdleTime-1e-7)*3)/3;this.meleeIdleTime=Math.min(landing,this.meleeIdleTime+dt);if(this.meleeIdleTime>=landing-1e-7)this.meleeIdleActive=false;}
   else {this.meleeIdleTime=0;this.meleeIdleActive=false;}
   this.enemyDepth+=((this.submerged?44:0)-this.enemyDepth)*(1-Math.exp(-dt*18));if(this.state!=='fight'&&this.meleeCycle>0)this.meleeCycle=Math.min(this.meleeDuration,this.meleeCycle+dt);this.meleeSince+=dt;this.enemyAttack+=dt;this.effects=this.effects.filter(e=>(e.life-=dt)>0);
   if(this.state==='travel'){const speed=Math.min(s.enemySpeed,25+(this.enemyX-330)*2.5);this.distance+=dt*speed*.6;this.enemyX=Math.max(330,this.enemyX-dt*speed);if(this.enemyX<=330 && this.age%(s.walkCycleDuration||1.75)<Math.max(dt,(s.walkCycleDuration||1.75)/28))this.enter('raise')}
   else if(this.state==='raise'&&this.age>=s.raiseDuration){this.enter('fight');this.cycle=this.interval-.12}
   else if(this.state==='fight'){
    this.cycle+=dt;this.enemyCycle+=dt;
    const interval=this.burst>0?.15:this.interval;
    if(this.ultimatePhase==='melee'&&!this.meleeWalking&&!this.meleeIdleActive&&Math.abs(this.meleeAdvance-this.meleeReach)<.01){this.meleeCycle+=dt;
     if(!this.meleeLanded&&this.meleeCycle>=this.meleeImpact){this.meleeLanded=true;this.meleeSince=0;this.hitEnemy(this.damage*4,'melee',505);}
     if(this.meleeCycle>=this.meleeDuration){this.meleeCycle%=this.meleeDuration;this.meleeLanded=false;}}

    if(!this.ultimateActive&&!this.meleeWalking&&this.cycle>=interval){this.cycle=0;this.sinceShot=0;this.shotSerial++;if(this.burst>0)this.burst--;this.shots.push({x:origin.x,y:origin.y,damage:this.damage,weapon:this.weapon,startX:origin.x,speed:s.weapons.find(w=>w.id===this.weapon).speed});this.effects.push({type:'flash',x:origin.x,y:origin.y,weapon:this.weapon,life:.12,duration:.12})}
    if(this.state==='fight'&&this.enemyCycle>=this.enemy.interval){this.enemyCycle=0;this.enemyAttack=0;
     if(this.enemy.action==='repair'){this.hp=Math.min(this.maxHp,this.hp+Math.round(this.maxHp*.12));this.effects.push({type:'repair',x:this.enemyX,y:470,damage:Math.round(this.maxHp*.12),life:.7});}
     const count=this.enemy.action==='burst'?3:1;for(let i=0;i<count;i++)this.enemyShots.push({x:this.enemyX-35+i*28,y:500+i*5,damage:Math.round(this.enemyDamage/(count===3?2:1)),kind:this.enemy.action});}

   }
   else if(this.state==='reward'&&this.age>=s.rewardDuration)this.enter('lower');
   else if(this.state==='lower'&&this.age>=s.lowerDuration){if(!this.farming)this.stage++;this.startEncounter()}
   const remaining=[];for(const shot of this.shots){shot.x+=dt*shot.speed;if(shot.x>=this.enemyX-23){if(this.state==='fight'){this.hitEnemy(shot.damage,shot.weapon,shot.y)}}else if(shot.x<550)remaining.push(shot)}this.shots=remaining;
   const hostile=[];for(const shot of this.enemyShots){shot.x-=dt*310;if(shot.x<=145+this.meleeAdvance){shot.damage=Math.max(1,Math.round(shot.damage*(this.ultimateActive?.25:1)));this.playerHp=Math.max(0,this.playerHp-shot.damage);if(!this.ultimateActive)this.ultimateCharge=Math.min(100,this.ultimateCharge+5);this.playerHit=.22;this.effects.push({type:'hurt',x:124+this.meleeAdvance,y:440,damage:shot.damage,life:.45});if(this.playerHp===0){this.enter('defeat');this.shots=[];this.enemyShots=[];return}}else hostile.push(shot)}this.enemyShots=hostile;
  }
  hitEnemy(damage,weapon,y){if(this.state!=='fight')return;const melee=weapon==='melee';if(this.submerged&&!melee){this.effects.push({type:'miss',x:this.enemyX,y,life:.5});return;}
   damage=Math.round(damage*(this.guarded&&!melee?.35:1));this.hp=Math.max(0,this.hp-damage);this.charge=Math.min(100,this.charge+8);if(!this.ultimateActive)this.ultimateCharge=Math.min(100,this.ultimateCharge+12);
   this.effects.push({type:'hit',x:melee?124+this.meleeAdvance+(this.settings.meleeReach||102)-4:this.enemyX,y,damage,weapon,life:.6,duration:.6});
   if(this.hp===0){this.kills++;this.lastReward=this.reward;this.gold=Math.min(1e9,this.gold+this.lastReward);this.best=Math.max(this.best,this.stage);this.xp+=this.boss?35:10;this.playerHp=Math.min(this.maxPlayerHp,this.playerHp+Math.round(this.maxPlayerHp*.12));this.enter('reward');this.enemyShots=[];this.burst=0;this.effects.push({type:'reward',x:this.enemyX,y:y-50,damage:this.lastReward,life:1.2});}}
  save(now=Date.now()){return{version:1,route:this.route,mods:{...this.mods},ultimateCharge:this.ultimateCharge,savedAt:now,weapon:this.weapon,gold:this.gold,kills:this.kills,best:this.best,xp:this.xp,upgrades:{...this.upgrades},charge:this.charge,stage:this.stage,playerHp:this.playerHp,farming:this.farming,defeated:this.state==='defeat'}}
  load(data,now=Date.now()){
   if(!data||data.version!==1||!Number.isFinite(data.savedAt))return false;
   this.reset();this.route=integer(data.route,0,2,0);this.ultimateCharge=integer(data.ultimateCharge,0,100,0);for(const w of this.settings.weapons)this.mods[w.id]=integer(data.mods?.[w.id],0,3,0);this.gold=integer(data.gold,0,1e9,0);this.kills=integer(data.kills,0,1e7,0);this.best=integer(data.best,0,10000,0);this.xp=integer(data.xp,0,1e9,0);
   for(const k of Object.keys(this.upgrades))this.upgrades[k]=integer(data.upgrades?.[k],0,30,0);
   this.route=Math.min(this.route,Math.floor(this.best/5),2);this.stage=integer(data.stage,1,this.best+1,Math.max(1,this.best+1));this.farming=!!data.farming&&this.best>0;this.playerHp=integer(data.playerHp,0,this.maxPlayerHp,this.maxPlayerHp);this.charge=integer(data.charge,0,100,0);if(this.settings.weapons.some(w=>w.id===data.weapon&&this.best>=w.unlock))this.weapon=data.weapon;
   const seconds=Math.min(8*3600,Math.max(0,(now-data.savedAt)/1000));this.offlineEarned=Math.floor(seconds/60*this.offlineRate);this.gold=Math.min(1e9,this.gold+this.offlineEarned);this.startEncounter();if(data.defeated||this.playerHp===0)this.enter('defeat');return true;
  }
 }
 const api={Encounter,weapons,defaults,enemies,routes};if(typeof module!=='undefined')module.exports=api;else root.BrineCombat=api;
})(typeof window!=='undefined'?window:globalThis);
