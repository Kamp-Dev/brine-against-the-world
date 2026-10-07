(function(root){
'use strict';
const rules={damage:['Damage','Available from the start',m=>true],farm:['Farming','Clear stretch 1',m=>m.best>=1],shell:['Shell','Reach level 2',m=>m.level>=2],speed:['Speed','Reach level 2',m=>m.level>=2],volley:['3-shot volley','Reach level 3',m=>m.level>=3],
 'step-shell':['Step Shell','Clear stretch 5',m=>m.best>=5],workshop:['Workshop','Clear stretch 5',m=>m.best>=5],repeater:['Tideline','Clear stretch 6',m=>m.best>=6],contracts:['Contracts','Clear stretch 6',m=>m.best>=6],
 scavenging:['Scavenging','Clear stretch 8',m=>m.best>=8],patch:['Patch up','Clear stretch 8',m=>m.best>=8],tide:['Tide charge','Clear stretch 8',m=>m.best>=8],lowtide:['Low Tide','Clear stretch 10',m=>m.best>=10],ferry:['Ferry Dock','Clear stretch 10',m=>m.best>=10],
 samurai:['Samurai','Clear stretch 15',m=>m.best>=15],lighthouse:['Lighthouse','Clear stretch 15',m=>m.best>=15],scrap:['Plugger','Available from the start',m=>true]};
const fresh=()=>({version:1,done:[],seen:['damage','scrap'],grants:[],actions:[],awaitingStart:false,replay:null});
const clean=a=>Array.isArray(a)?[...new Set(a.filter(v=>typeof v==='string'&&v.length<50))].slice(0,80):[];
function available(m,id){return !!rules[id]&&(rules[id][2](m)||m.journey?.grants.includes(id));}
function requirement(id){return rules[id]?.[1]||'Continue along the road';}
const lessons=[
 ['damage','First repairs','Wins earn XP and salvage. XP levels Brine up. Spend salvage on Damage to strengthen every hit.','#upgrade-damage',m=>m.upgrades.damage>0],
 ['farm','Choose your ground','Tap Gather Salvage to repeat cleared ground, or select a cleared route number. Push Forward returns to your next uncleared stretch.','#farm',m=>m.farming],
 ['shell','Protect your shell','Shell raises maximum health and repairs some damage immediately. Buy one rank.','#upgrade-shell',m=>m.upgrades.shell>0],
 ['speed','Keep firing','Speed shortens the wait between shots. Buy a rank to try it.','#upgrade-speed',m=>m.upgrades.speed>0],
 ['volley','Three shots, one tap','Hits charge Volley. When READY, tap it anytime. Between enemies, the three shots queue for the next target.','#volley',m=>m.journey.actions.includes('volley')],
 ['step-shell','Meet Step Shell','Step Shell lasts 18 seconds with 75% protection. Kills add 3s; boss quarters add 3s. Strain causes Low Tide: weaker guns, more damage taken, no form charge. Tap the active form to withdraw for half recovery.','#ultimate',m=>m.journey.actions.includes('step-shell')],
 ['workshop','Reopen the Workshop','Open Camp, restore the Workshop with boss materials, then fit attachments in Gear.','#nav-camp',m=>m.progress.build[0]>0],
 ['repeater','A different kind of shot','Open Gear and equip Tideline. Your weapons keep their own attachments and mastery.','#nav-guns',m=>m.journey.actions.includes('repeater')],
 ['contracts','Work worth claiming','Open Camp > Contracts. Track a job, finish it, then claim its cargo. The ! stays until collected.','#nav-camp',m=>m.progress.completed>0],
 ['scavenging','Make each win count','Swipe the upgrades left. Scavenging increases salvage from wins and time away.','#upgrade-scavenging',m=>m.upgrades.scavenging>0],
 ['patch','Recover between fights','Patch Up improves the health restored after a win. Find it by swiping the upgrades.','#upgrade-patch',m=>m.upgrades.patch>0],
 ['tide','Charge your form faster','Tide Charge adds more form charge to each successful hit. Swipe the upgrades to find it.','#upgrade-tide',m=>m.upgrades.tide>0],
 ['lowtide','Try the heavy gun','Equip Low Tide in Gear. Its slower shots make a larger impact.','#nav-guns',m=>m.journey.actions.includes('lowtide')],
 ['ferry','Send out a crew','Restore Ferry Dock in Camp, then open Expeditions and send a crew. They work while you are away.','#nav-camp',m=>m.journey.actions.includes('dispatch')],
 ['samurai','Learn the blade','Samurai starts at 14s and earns 5s per kill. Boss quarters add 3s. It builds Strain faster; withdraw early to halve Low Tide recovery.','#form-card',m=>m.journey.actions.includes('samurai')],
 ['lighthouse','Choose your specialty','Restore the Lighthouse in Camp. After 12 melee contacts, choose a form specialization.','#nav-camp',m=>m.progress.formPath.some(Boolean)]
].map(([id,title,text,target,complete])=>({id,title,text,target,complete}));
function active(m){const j=m.journey;if(j.replay)return lessons.find(l=>l.id===j.replay&&available(m,l.id));return lessons.find(l=>available(m,l.id)&&!j.done.includes(l.id));}
function scan(m){for(const l of lessons)if(available(m,l.id)&&l.complete(m)&&!m.journey.done.includes(l.id))m.journey.done.push(l.id);return active(m);}
function finish(m,id){if(!m.journey.done.includes(id))m.journey.done.push(id);m.journey.replay=null;}
function install(C,P){if(C.prototype.journeyInstalled)return;C.prototype.journeyInstalled=true;const owners=new WeakMap();
 const reset=C.prototype.reset;C.prototype.reset=function(){reset.call(this);this.journey=fresh();owners.set(this.progress,this);};
 const save=C.prototype.save;C.prototype.save=function(...args){return {...save.apply(this,args),journey:JSON.parse(JSON.stringify(this.journey))};};
 const load=C.prototype.load;C.prototype.load=function(data,...args){this.loadingJourney=true;let ok;try{ok=load.call(this,data,...args);}finally{this.loadingJourney=false;}if(!ok)return ok;owners.set(this.progress,this);
  if(data.journey?.version===1){const j=data.journey;this.journey={version:1,done:clean(j.done),seen:clean(j.seen),grants:clean(j.grants).filter(k=>rules[k]),actions:clean(j.actions),awaitingStart:j.awaitingStart===true,replay:null};}
  else {const g=this.journey.grants;for(const k of Object.keys(this.upgrades))if(this.upgrades[k]>0)g.push(k);if(this.kills>0)g.push('volley','step-shell','samurai');if(this.weapon!=='scrap')g.push(this.weapon);this.progress.build.forEach((n,i)=>{if(n)g.push(['workshop','ferry','lighthouse'][i]);});if(this.progress.completed||this.progress.expedition)g.push('contracts');}
  if(this.journey.awaitingStart)this.paused=true;if(!available(this,this.selectedForm))this.selectedForm='step-shell';return true;};
 const wrap=(name,key,record)=>{const original=C.prototype[name];C.prototype[name]=function(...args){const id=typeof key==='function'?key.apply(this,args):key;if(!this.loadingJourney&&!available(this,id))return false;const ok=original.apply(this,args);if(ok&&record){const action=record===true?id:record;if(!this.journey.actions.includes(action))this.journey.actions.push(action);}return ok;};};
 wrap('buy',k=>k);wrap('equip',id=>id,true);wrap('chooseForm',id=>id);wrap('ultimate',function(){return this.selectedForm;},true);wrap('volley','volley',true);wrap('buyMod','workshop');
 const guard=(name,getKey,record)=>{const original=P[name];P[name]=function(p,...args){const m=owners.get(p),id=getKey(...args);if(m&&!available(m,id))return false;const ok=original(p,...args);if(ok&&m&&record&&!m.journey.actions.includes(record))m.journey.actions.push(record);return ok;};};
 guard('build',i=>['workshop','ferry','lighthouse'][i]);guard('selectContract',id=>id==='samurai'?'samurai':'contracts');guard('claimContract',()=> 'contracts');guard('dispatch',()=> 'ferry','dispatch');guard('chooseWeapon',()=> 'workshop');guard('chooseForm',()=> 'lighthouse');
}
const api={rules,fresh,available,requirement,lessons,active,scan,finish,install};if(typeof module!=='undefined')module.exports=api;else {root.BrineJourney=api;install(root.BrineCombat.Encounter,root.BrineProgression);}
})(typeof globalThis!=='undefined'?globalThis:this);
