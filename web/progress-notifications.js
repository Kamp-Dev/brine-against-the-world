(function(root){
'use strict';
const P=typeof module!=='undefined'?require('./progression.js'):root.BrineProgression;
function ready(p,now){return [
 ...P.contracts.flatMap((c,i)=>p.counts[i]>=c.target?[{id:'contract:'+c.id,title:'CONTRACT COMPLETE!',detail:c.name,tab:'contracts',collect:true}]:[]),
 ...(p.expedition&&Math.max(now,p.clock)>=p.expedition.finish?[{id:'crew:'+p.expedition.finish,title:'CREW RETURNED!',detail:P.expeditions[p.expedition.id].name,tab:'expeditions',collect:true}]:[])
];}
function create(){let previous=null,source=null,priorReady=new Set();return {scan(p,now=Date.now()){
 if(source!==p){previous=null;priorReady=new Set();source=p;}
 const available=ready(p,now),events=available.filter(e=>!priorReady.has(e.id));
 if(previous){
  if(p.completed>previous.completed)events.push({title:'REWARD COLLECTED!',detail:'Contract materials added to your cargo.',tab:'contracts'});
  if(previous.expedition&&!p.expedition)events.push({title:'CARGO COLLECTED!',detail:P.expeditions[previous.expedition.id].name+' · materials delivered',tab:'expeditions'});
  p.build.forEach((v,i)=>{if(v>previous.build[i])events.push({title:v===3?'RESTORATION COMPLETE!':'HARBOR UPGRADED!',detail:P.buildings[i].name+' · level '+v+' / 3',tab:'harbor'});});
  p.district.forEach((v,i)=>{if(v&&!previous.district[i])events.push({title:'DISTRICT RECLAIMED!',detail:P.captains[i].name+' defeated · rewards delivered',tab:'districts'});});
  p.weaponXP.forEach((v,i)=>{if(P.tier(v)>P.tier(previous.weaponXP[i]))events.push({title:'MASTERY UP!',detail:['Plugger','Tideline','Low Tide','Rivet Rattle','Keelspike','Boilerjaw'][i]+' · tier '+P.tier(v),tab:'mastery'});});
  p.formXP.forEach((v,i)=>{if(v>=12&&previous.formXP[i]<12)events.push({title:'FORM PRACTICED!',detail:(i?'Samurai':'Step Shell')+' · '+(p.build[2]?'specializations ready':'restore Lighthouse to specialize'),tab:'forms'});});
  p.guide.forEach((v,i)=>{if(v>=15&&previous.guide[i]<15)events.push({title:'ENEMY STUDIED!',detail:P.foes[i].replaceAll('-',' ')+' · +10% damage unlocked',tab:'guide'});});
 }
 previous=JSON.parse(JSON.stringify(p));priorReady=new Set(available.map(e=>e.id));return {events,available};
 }};}
const api={create,ready};if(typeof module!=='undefined')module.exports=api;else root.BrineNotifications=api;
})(typeof globalThis!=='undefined'?globalThis:this);
