(function(root){
'use strict';
const tiers=[{name:'Stock',bonus:0,salvage:0,glass:0,stage:0},{name:'Reinforced',bonus:15,salvage:1000000,glass:0,stage:100},{name:'Warbuilt',bonus:35,salvage:10000000,glass:100,stage:500},{name:'Tideforged',bonus:65,salvage:50000000,glass:350,stage:1000}];
function install(C){if(C.prototype.reforgeInstalled)return;C.prototype.reforgeInstalled=true;
 const reset=C.prototype.reset;C.prototype.reset=function(){reset.call(this);this.reforges={};};
 C.prototype.reforgeRank=function(id=this.weapon){return this.reforges?.[id]||0;};
 C.prototype.buyReforge=function(id=this.weapon){const w=this.settings.weapons.find(w=>w.id===id),rank=this.reforgeRank(id),t=tiers[rank+1];if(!w||!t||this.best<(this.unlockStage?.(Math.max(w.unlock,t.stage))??Math.max(w.unlock,t.stage))||this.gold<t.salvage||(this.forge?.tideglass||0)<t.glass)return false;this.gold-=t.salvage;if(t.glass)this.forge.tideglass-=t.glass;this.reforges[id]=rank+1;return true;};
 const hit=C.prototype.hitEnemy;C.prototype.hitEnemy=function(damage,weapon,...args){if(weapon!=='melee'&&!args[2])damage*=1+tiers[this.reforgeRank(weapon)].bonus/100;return hit.call(this,damage,weapon,...args);};
 const save=C.prototype.save;C.prototype.save=function(...args){return {...save.apply(this,args),reforges:{...this.reforges}};};
 const load=C.prototype.load;C.prototype.load=function(data,...args){const ok=load.call(this,data,...args);if(!ok)return ok;this.reforges={};for(const w of this.settings.weapons){const n=data.reforges?.[w.id];if(Number.isInteger(n)&&n>=0&&n<=3)this.reforges[w.id]=n;}return ok;};
}
const api={tiers,install};if(typeof module!=='undefined')module.exports=api;else{root.BrineReforge=api;install(root.BrineCombat.Encounter);}
})(typeof globalThis!=='undefined'?globalThis:this);
