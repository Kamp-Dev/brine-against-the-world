(function(root){
'use strict';
const paints=[{id:'rust',name:'Original Rust',color:null,cost:0,unlock:0},{id:'deep',name:'Deep Sea',color:[40,137,151],cost:1200000,unlock:100},{id:'bone',name:'Bone Shell',color:[203,191,156],cost:1800000,unlock:200},{id:'plum',name:'Plum Trouble',color:[155,83,161],cost:3200000,unlock:500},{id:'mint',name:'Mint Condition',color:[102,179,137],cost:6000000,unlock:1000}];
const mods=[{id:'sinker',name:'Sinker Brick',icon:'brick',cost:2400000,unlock:100,detail:'+25% gun hit damage. 20% longer between shots.'},{id:'whoopee',name:'Whoopee Valve',icon:'valve',cost:4800000,unlock:250,detail:'Every fourth direct gun hit deals 45% extra damage.'},{id:'duck',name:'Rubber Duck',icon:'duck',cost:7200000,unlock:500,detail:'Every fifth direct gun hit restores 2% max shell.'},{id:'confetti',name:'Confetti Catcher',icon:'confetti',cost:12000000,unlock:1000,detail:'+15% salvage from gun-finished road battles. Gun damage −10%.'}];
function fresh(){return {version:1,owned:[],shell:'rust',weaponPaint:'rust',mods:{}};}
function item(type,id){const i=(type==='mod'?mods:paints).find(x=>x.id===id);return i&&{...i,cost:type==='weapon'?Math.round(i.cost*.65):i.cost};}
function key(type,id){return type+':'+id;}
function owned(m,type,id){return id==='rust'&&type!=='mod'||m.shop.owned.includes(key(type,id));}
function install(C){
 if(C.prototype.scrapyardInstalled)return;C.prototype.scrapyardInstalled=true;
 const reset=C.prototype.reset;C.prototype.reset=function(){reset.call(this);this.shop=fresh();this.shopContacts=0;this.shopCaptions=[];this.shopCaptionNext=0;};
 const start=C.prototype.startEncounter;C.prototype.startEncounter=function(){start.call(this);this.shopContacts=0;};
 C.prototype.shopBuy=function(type,id){const i=item(type,id);if(!['shell','weapon','mod'].includes(type)||!i||owned(this,type,id)||this.best<i.unlock||this.gold<i.cost)return false;this.gold-=i.cost;this.shop.owned.push(key(type,id));return true;};
 C.prototype.shopEquip=function(type,id){if(!['shell','weapon','mod'].includes(type))return false;if(type==='mod'&&id==='none'){delete this.shop.mods[this.weapon];return true;}if(!item(type,id)||!owned(this,type,id))return false;if(type==='mod')this.shop.mods[this.weapon]=id;else this.shop[type==='shell'?'shell':'weaponPaint']=id;return true;};
 const branch=C.prototype.branchInterval;C.prototype.branchInterval=function(){return (branch?.call(this)||1)*(this.shop?.mods[this.weapon]==='sinker'?1.2:1);};
 const hit=C.prototype.hitEnemy;C.prototype.hitEnemy=function(value,weapon,y,power=1,secondary=false){
  if(weapon==='melee'||secondary||this.state!=='fight'||this.submerged)return hit.call(this,value,weapon,y,power,secondary);
  const mod=this.shopImpactMod===undefined?this.shop?.mods[weapon]:this.shopImpactMod,kills=this.kills,campaign=this.forge?.run&&!this.forge.run.complete,x=this.enemyX;
  this.shopContacts=(this.shopContacts||0)+1;
  const burst=mod==='whoopee'&&this.shopContacts%4===0,heal=mod==='duck'&&this.shopContacts%5===0;
  if(mod==='sinker')value*=1.25;if(mod==='confetti')value*=.9;if(burst){value*=1.45;power*=1.4;}
  const priorHits=new Set(this.effects);hit.call(this,value,weapon,y,power,secondary);
  const hitEffect=this.effects.findLast(e=>e.type==='hit'&&!priorHits.has(e));
  if(hitEffect&&['sinker','duck','whoopee'].includes(mod)){
   const now=this.shopNow?.()??(typeof performance!=='undefined'?performance.now():Date.now());
   if(!this.shopCaptionNext)this.shopCaptionNext=now+10000;
   if(now>=this.shopCaptionNext&&(this.shopRandom?.()??Math.random())<.3){
    this.shopCaptionNext=now+10000+(this.shopRandom?.()??Math.random())*4000;
    this.shopCaptions.push({mod,x:hitEffect.targetX??x,y:hitEffect.targetY??y,at:now});
    this.shopCaptions=this.shopCaptions.slice(-2);
   }
  }
  if(heal)this.playerHp=Math.min(this.maxPlayerHp,this.playerHp+Math.max(1,Math.round(this.maxPlayerHp*.02)));
  if(mod==='confetti'&&this.kills>kills&&!campaign){const bonus=Math.floor(this.lastReward*.15);this.gold=Math.min(Number.MAX_VALUE,this.gold+bonus);this.lastReward+=bonus;const reward=this.effects.findLast(e=>e.type==='reward');if(reward)reward.damage=this.lastReward;}
  if(burst||heal||mod==='confetti'&&this.kills>kills)this.effects.push({type:'shop-mod',mod,x:heal?124:x,y:heal?450:y,life:.7,duration:.7});
 };
 const save=C.prototype.save;C.prototype.save=function(...a){return {...save.apply(this,a),shop:JSON.parse(JSON.stringify(this.shop))};};
 const load=C.prototype.load;C.prototype.load=function(data,...a){const ok=load.call(this,data,...a);if(!ok)return ok;const s=data.shop;this.shop=fresh();if(s?.version===1){this.shop.owned=[...new Set((Array.isArray(s.owned)?s.owned:[]).filter(k=>typeof k==='string'&&['shell','weapon','mod'].includes(k.split(':')[0])&&item(...k.split(':'))))];for(const [type,field]of [['shell','shell'],['weapon','weaponPaint']])if(item(type,s[field])&&owned(this,type,s[field]))this.shop[field]=s[field];for(const w of this.settings.weapons)if(mods.some(i=>i.id===s.mods?.[w.id])&&owned(this,'mod',s.mods[w.id]))this.shop.mods[w.id]=s.mods[w.id];}return ok;};
}
// Recolor only saturated rust/orange paint; preserve alpha, dark ink and pale areas.
function recolor(data,color){if(!color)return data;const target=.2126*color[0]+.7152*color[1]+.0722*color[2];for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2];if(!data[i+3]||r<65||g<28||r<=g*1.17||g<=b*1.15||r-b<48||g/r<.22)continue;const lum=.2126*r+.7152*g+.0722*b,scale=lum/target;for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.round(color[c]*scale));}return data;}
const api={paints,mods,fresh,item,owned,install,recolor};if(typeof module!=='undefined')module.exports=api;else{root.BrineShop=api;install(root.BrineCombat.Encounter);}
})(typeof globalThis!=='undefined'?globalThis:this);
