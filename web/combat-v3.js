(function(root){
 'use strict';
 const defaults={raiseDuration:.32,lowerDuration:.32,shotInterval:.9,recoilDuration:.16,rewardDuration:.65,bulletSpeed:950,enemySpeed:90,reward:8,enemyHealth:48,weapons:[{"id":"scrap","name":"Plugger","art":"plugger","damage":12,"length":48,"unlock":0,"interval":1,"speed":720,"recoil":1,"gripX":470,"gripY":655,"muzzleX":1408,"muzzleY":365,"splitX":720,"splitY":520,"scale":0.047,"width":1536,"height":1024,"description":"Salt slug · sharp chip burst"},{"id":"repeater","name":"Tideline","art":"tideline","damage":20,"length":62,"unlock":3,"interval":1.1,"speed":1550,"recoil":0.65,"gripX":260,"gripY":650,"muzzleX":1470,"muzzleY":350,"splitX":550,"splitY":475,"scale":0.051,"width":1536,"height":1024,"description":"Fast teal tracer · piercing splash"},{"id":"lowtide","name":"Low Tide","art":"low-tide","damage":34,"length":50,"unlock":5,"interval":1.65,"speed":520,"recoil":2.5,"gripX":265,"gripY":805,"muzzleX":1190,"muzzleY":505,"splitX":610,"splitY":675,"scale":0.052,"width":1254,"height":1254,"description":"Spreading blast · dust explosion"}]};
 const weapons=Object.fromEntries(defaults.weapons.map(w=>[w.id,w]));
 const enemies=[{name:'Salt Porter',art:'salt-porter',health:1,damage:8,interval:2.6,height:132},{name:'Pipe Pilfer',art:'pipe-pilfer',health:.85,damage:6,interval:1.8,height:154},{name:'Sluice Keeper',art:'sluice-keeper',health:2.3,damage:17,interval:2.4,height:182}];
 const integer=(v,min,max,fallback)=>Number.isFinite(v)?Math.min(max,Math.max(min,Math.floor(v))):fallback;
 class Encounter{
  constructor(settings=defaults){this.settings=settings;this.reset()}
  get enemy(){return enemies[this.stage%5===0?2:(this.stage-1)%2]}
  get boss(){return this.stage%5===0}
  get level(){return 1+Math.floor(Math.sqrt(this.xp/30))}
  get nextXp(){return this.level*this.level*30}
  get maxPlayerHp(){return 100+this.upgrades.shell*25+(this.level-1)*8}
  get damage(){return this.settings.weapons.find(w=>w.id===this.weapon).damage+this.upgrades.damage*4+(this.level-1)*2}
  get interval(){return this.settings.shotInterval*this.settings.weapons.find(w=>w.id===this.weapon).interval/(1+this.upgrades.speed*.08)}
  get enemyDamage(){return this.enemy.damage+Math.floor((this.stage-1)*1.6)}
  get reward(){return (this.settings.reward+Math.floor((this.stage-1)*2))*(this.boss?4:1)}
  get offlineRate(){return this.best===0?0:Math.min(60,4+this.best*1.5)}
  cost(kind){return Math.floor((kind==='damage'?18:kind==='shell'?16:30)*Math.pow(1.5,this.upgrades[kind]))}
  reset(){this.weapon='scrap';this.gold=0;this.kills=0;this.stage=1;this.best=0;this.xp=0;this.upgrades={damage:0,shell:0,speed:0};this.farming=false;this.paused=false;this.time=0;this.distance=0;this.shotSerial=0;this.charge=0;this.offlineEarned=0;this.playerHp=this.maxPlayerHp;this.startEncounter()}
  startEncounter(){this.state='travel';this.age=0;this.enemyX=520;this.hp=this.maxHp=Math.round((this.settings.enemyHealth+(this.stage-1)*9)*this.enemy.health);this.cycle=0;this.enemyCycle=0;this.shots=[];this.enemyShots=[];this.effects=[];this.sinceShot=99;this.playerHit=0;this.burst=0;this.lastReward=0}
  equip(id){if(!this.settings.weapons.some(w=>w.id===id))throw Error('Unknown weapon');if(this.best<this.settings.weapons.find(w=>w.id===id).unlock)return false;this.weapon=id;return true}
  buy(kind){if(!Object.hasOwn(this.upgrades,kind)||this.upgrades[kind]>=30)return false;const cost=this.cost(kind);if(this.gold<cost)return false;this.gold-=cost;this.upgrades[kind]++;if(kind==='shell'&&this.state!=='defeat')this.playerHp=Math.min(this.maxPlayerHp,this.playerHp+25);return true}
  get farmStage(){return Math.max(1,this.best-(this.best%5===0?1:0))}
  retry(){this.stage=this.farmStage;this.farming=this.best>0;this.playerHp=this.maxPlayerHp;this.paused=false;this.startEncounter()}
  toggleFarm(){if(this.best===0||this.state==='defeat')return;this.farming=!this.farming;this.stage=this.farming?this.farmStage:this.best+1;this.startEncounter()}
  volley(){if(this.state!=='fight'||this.paused||this.charge<100)return false;this.charge=0;this.burst=3;return true}
  enter(state){this.state=state;this.age=0}
  tick(dt,origin){if(this.paused||this.state==='defeat')return;dt=Math.max(0,Math.min(dt,.1));const s=this.settings;this.time+=dt;this.age+=dt;this.sinceShot+=dt;this.playerHit=Math.max(0,this.playerHit-dt);this.effects=this.effects.filter(e=>(e.life-=dt)>0);
   if(this.state==='travel'){const speed=Math.min(s.enemySpeed,25+(this.enemyX-330)*2.5);this.distance+=dt*speed*.6;this.enemyX=Math.max(330,this.enemyX-dt*speed);if(this.enemyX<=330 && this.age%(s.walkCycleDuration||1.75)<Math.max(dt,(s.walkCycleDuration||1.75)/28))this.enter('raise')}
   else if(this.state==='raise'&&this.age>=s.raiseDuration){this.enter('fight');this.cycle=this.interval-.12}
   else if(this.state==='fight'){
    this.cycle+=dt;this.enemyCycle+=dt;
    const interval=this.burst>0?.15:this.interval;
    if(this.cycle>=interval){this.cycle=0;this.sinceShot=0;this.shotSerial++;if(this.burst>0)this.burst--;this.shots.push({x:origin.x,y:origin.y,damage:this.damage,weapon:this.weapon,startX:origin.x,speed:s.weapons.find(w=>w.id===this.weapon).speed});this.effects.push({type:'flash',x:origin.x,y:origin.y,weapon:this.weapon,life:.12,duration:.12})}
    if(this.enemyCycle>=this.enemy.interval){this.enemyCycle=0;this.enemyShots.push({x:this.enemyX-35,y:500,damage:this.enemyDamage})}
   }
   else if(this.state==='reward'&&this.age>=s.rewardDuration)this.enter('lower');
   else if(this.state==='lower'&&this.age>=s.lowerDuration){if(!this.farming)this.stage++;this.startEncounter()}
   const remaining=[];for(const shot of this.shots){shot.x+=dt*shot.speed;if(shot.x>=this.enemyX-23){if(this.state==='fight'){this.hp=Math.max(0,this.hp-shot.damage);this.charge=Math.min(100,this.charge+8);this.effects.push({type:'hit',x:this.enemyX,y:shot.y,damage:shot.damage,weapon:shot.weapon,life:.6,duration:.6});if(this.hp===0){this.kills++;this.lastReward=this.reward;this.gold=Math.min(1e9,this.gold+this.lastReward);this.best=Math.max(this.best,this.stage);this.xp+=this.boss?35:10;this.playerHp=Math.min(this.maxPlayerHp,this.playerHp+Math.round(this.maxPlayerHp*.12));this.enter('reward');this.enemyShots=[];this.burst=0;this.effects.push({type:'reward',x:this.enemyX,y:shot.y-50,damage:this.lastReward,life:1.2})}}}else if(shot.x<550)remaining.push(shot)}this.shots=remaining;
   const hostile=[];for(const shot of this.enemyShots){shot.x-=dt*310;if(shot.x<=145){this.playerHp=Math.max(0,this.playerHp-shot.damage);this.playerHit=.22;this.effects.push({type:'hurt',x:124,y:440,damage:shot.damage,life:.45});if(this.playerHp===0){this.enter('defeat');this.shots=[];this.enemyShots=[];return}}else hostile.push(shot)}this.enemyShots=hostile;
  }
  save(now=Date.now()){return{version:1,savedAt:now,weapon:this.weapon,gold:this.gold,kills:this.kills,best:this.best,xp:this.xp,upgrades:{...this.upgrades},charge:this.charge,stage:this.stage,playerHp:this.playerHp,farming:this.farming,defeated:this.state==='defeat'}}
  load(data,now=Date.now()){
   if(!data||data.version!==1||!Number.isFinite(data.savedAt))return false;
   this.reset();this.gold=integer(data.gold,0,1e9,0);this.kills=integer(data.kills,0,1e7,0);this.best=integer(data.best,0,10000,0);this.xp=integer(data.xp,0,1e9,0);
   for(const k of Object.keys(this.upgrades))this.upgrades[k]=integer(data.upgrades?.[k],0,30,0);
   this.stage=integer(data.stage,1,this.best+1,Math.max(1,this.best+1));this.farming=!!data.farming&&this.best>0;this.playerHp=integer(data.playerHp,0,this.maxPlayerHp,this.maxPlayerHp);this.charge=integer(data.charge,0,100,0);if(this.settings.weapons.some(w=>w.id===data.weapon&&this.best>=w.unlock))this.weapon=data.weapon;
   const seconds=Math.min(8*3600,Math.max(0,(now-data.savedAt)/1000));this.offlineEarned=Math.floor(seconds/60*this.offlineRate);this.gold=Math.min(1e9,this.gold+this.offlineEarned);this.startEncounter();if(data.defeated||this.playerHp===0)this.enter('defeat');return true;
  }
 }
 const api={Encounter,weapons,defaults,enemies};if(typeof module!=='undefined')module.exports=api;else root.BrineCombat=api;
})(typeof window!=='undefined'?window:globalThis);
