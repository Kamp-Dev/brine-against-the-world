(function(root){
'use strict';
const palettes={scrap:['#edd5a3','#a87745'],repeater:['#a4ddd0','#286b69'],lowtide:['#efad61','#9b4d36'],riveter:['#e9c858','#466d74'],harpoon:['#f69b87','#564858'],boiler:['#ffcb63','#c34e34'],melee:['#f2dcac','#385e50']};
function create(){let seen=new WeakSet(),seenFlash=new WeakSet(),seenAccent=new WeakSet(),accent=null,lastAccent=-1e6,pending=null,numbers=[],impact=null,flash=null,last=-1e6,lastFlash=-1e6,previousTime=-1,previousState='',previousStage=-1;return {frame(m,now,mode='balanced'){
 if(m.stage!==previousStage||(m.state==='travel'&&previousState!=='travel')||m.time<previousTime){seen=new WeakSet();seenFlash=new WeakSet();seenAccent=new WeakSet();accent=null;pending=null;numbers=[];impact=flash=null;}previousTime=m.time;previousState=m.state;previousStage=m.stage;
 const cadence=mode==='calm'?.38:.22;
 for(const e of m.effects){if(e.type==='hit'&&!seen.has(e)){seen.add(e);if(!pending)pending={...e,damage:0,count:0,critTier:0};pending.damage+=e.damage||0;pending.count++;pending.critTier=Math.max(pending.critTier,e.critTier||0);pending.weapon=e.weapon;pending.x=e.x;pending.y=e.y;}if(e.type==='flash'&&!seenFlash.has(e)){seenFlash.add(e);if(now-lastFlash>=(mode==='calm'?.75:.4)){flash={...e,born:now};lastFlash=now;}}}
 if(pending&&now-last>=cadence){const item={...pending,born:now,duration:.65,numberLane:numbers.length&&numbers.at(-1).numberLane<0?.5:-.5,secondary:false};numbers.push(item);numbers=numbers.slice(mode==='calm'?-1:-2);impact={...item,duration:mode==='calm'?.16:.24};pending=null;last=now;}
 for(const e of m.effects)if(['confetti-burst','shop-mod'].includes(e.type)&&!seenAccent.has(e)){seenAccent.add(e);if(now-lastAccent>=(mode==='calm'?.8:.45)){accent={...e,born:now,duration:mode==='calm'?.18:.3};lastAccent=now;}}
 const age=e=>({...e,life:Math.max(0,e.duration-(now-e.born))});numbers=numbers.filter(e=>now-e.born<e.duration);const hits=numbers.map(age),bursts=impact&&now-impact.born<impact.duration?[age(impact)]:[],flashes=mode!=='calm'&&flash&&now-flash.born<.075?[{...flash,life:.075-(now-flash.born),duration:.075}]:[];
 const sample=(a,n)=>a.length<=n?a:a.filter((_,i)=>i===a.length-1||i%Math.ceil(a.length/n)===0).slice(-n);
 return {hits,bursts,flashes,accents:accent&&now-accent.born<accent.duration?[age(accent)]:[],shots:sample(m.shots,mode==='calm'?2:5),enemyShots:sample(m.enemyShots,4),other:m.effects.filter(e=>!['hit','flash'].includes(e.type)).slice(-12),mode};
 }};}
const api={create,palettes};if(typeof module!=='undefined')module.exports=api;else root.BrinePresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
