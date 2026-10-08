const {fresh,late}=require('../tests/depth-fixture.cjs');
const J=require('../web/journey.js'),P=require('../web/progression.js');
const milestones=[5,15,25,40,50,60,80,100,140,180,220,300,500,600,750,1000];
const keys=['damage','shell','speed','patch','focus','rupture','plating','scavenging','tide','hullcrack','undertow','splinter','laststand','jackpot','secondwind'];
function manage(m,skills,now=2e12){
 m.accrueFleet(now);
 for(let id=0;id<3;id++)if(!m.depth.boats[id]&&m.gold>=m.fleetCost(id)*4)m.buyBoat(id,false,now);
 if(m.state==='defeat')m.retry();
 if(!m.ultimateActive){const owned=m.settings.weapons.filter(w=>m.weaponAvailable(w.id));const equipped=m.weapon;const score=w=>{m.weapon=w.id;const i=P.ids.indexOf(w.id),tier=P.tier(m.progress.weaponXP[i]),path=m.progress.weaponPath[i];let d=m.damage/m.interval*(path==='impact'?1+tier*(w.id==='scrap'?.4:.25):1);d*=w.id==='riveter'?1.2:w.id==='boiler'?5/3:w.id==='harpoon'?(m.boss?1.35:1):1;if(m.enemy.action==='guard'&&w.id!=='harpoon'&&path!=='pierce')d*=.65;return d;};const selected=owned.map(w=>({w,score:score(w)})).sort((a,b)=>b.score-a.score)[0].w;m.weapon=equipped;m.equip(selected.id);}
 for(let count=0;count<100;count++) {const k=keys.filter(k=>J.available(m,k)&&m.upgrades[k]<m.cap(k)&&m.cost(k)<=m.gold).sort((a,b)=>m.cost(a)-m.cost(b))[0];if(!k||!m.buy(k))break;}
 if(m.modRank<3&&m.gold>=m.modCost()*2)m.buyMod();
 for(let i=0;i<3;i++)if(m.progress.build[i]<3)P.build(m.progress,i);
 for(const w of m.settings.weapons){const i=P.ids.indexOf(w.id);if(!m.progress.weaponPath[i])P.chooseWeapon(m.progress,w.id,P.paths[w.id].some(x=>x[0]==='tempo')?'tempo':'impact');}
 if(skills){if(J.available(m,'volley'))m.volley();if(J.available(m,m.selectedForm))m.ultimate();}
}
function session({name='active',minutes=360,seed=1,setup=fresh,skills=true,check=1,model}={}){
 const m=model||setup();const startTime=model?m.depth.fleetAt:2e12;if(!model)m.depth.fleetAt=startTime;let rng=seed;m.upgradeRoll=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);let next=0,nextPush=0,deaths=0,lastProgress=0,lastBest=m.best,maxStall=0;const reached={},snapshots=[];
 for(let t=0;t<minutes*60;t+=.1){m.ensureCalibrated();if(t>=next){next=t+check;if(m.state==='defeat'){deaths++;nextPush=t+60;}manage(m,skills,startTime+t*1000);if(m.farming&&t>=nextPush&&!m.ultimateActive){m.toggleFarm();nextPush=t+60;}}
 m.tick(.1,{x:200,y:460});if(m.best>lastBest){maxStall=Math.max(maxStall,t-lastProgress);lastProgress=t;lastBest=m.best;}for(const n of milestones)if(m.best>=n&&reached[n]===undefined)reached[n]=+(t/60).toFixed(2);
 if(Math.floor(t*10)%6000===0){snapshots.push({minute:Math.round(t/60),best:m.best});}
 }
 maxStall=Math.max(maxStall,minutes*60-lastProgress);const affordable=keys.filter(k=>J.available(m,k)&&m.upgrades[k]<m.cap(k)).map(k=>({id:k,price:m.cost(k),minutesAway:m.cost(k)/m.offlineRate})).sort((a,b)=>a.price-b.price);
 return {name,minutes,seed,best:m.best,level:m.level,deaths,maxStallMinutes:+(maxStall/60).toFixed(2),milestones:reached,snapshots,boats:[...m.depth.boats],fleetPerMinute:Math.round(m.fleetRate()),upgrades:{...m.upgrades},awayPerMinute:Math.round(m.offlineRate),cheapestUpgrade:affordable[0],model:m};
}
function returning(){let m=fresh();m.depth.fleetAt=2e12;const days=[];for(let day=0;day<7;day++){for(let visit=0;visit<3;visit++){session({model:m,minutes:5,check:10,skills:false});const now=m.depth.fleetAt;const s=m.save(now);m=fresh();m.load(s,now+8*3600000);}days.push({day:day+1,best:m.best,gold:Math.round(m.gold),awayPerMinute:Math.round(m.offlineRate),boats:[...m.depth.boats],fleetPerMinute:Math.round(m.fleetRate())});}return days;}
function economy(){const m=late(),rows=[];for(const stage of [50,60,80,100,140,220,500,750,1000,2000]){m.best=stage;m.stage=stage+1;m.startEncounter();rows.push({stage,hp:m.maxHp,reward:m.reward,awayPerMinute:Math.round(m.offlineRate),damageUpgradeMinutes:+(m.cost('damage')/m.offlineRate).toFixed(1)});}return rows;}
function report(){const rows=[];for(const seed of [1,17,93])for(const skills of [true,false]){const row=session({name:skills?'active':'casual',skills,check:skills?1:30,seed});delete row.model;rows.push(row);}for(const skills of [true,false]){const row=session({name:skills?'veteran-active':'veteran-casual',skills,check:skills?1:30,setup:late,minutes:180});delete row.model;rows.push(row);}return {sessions:rows,returning: returning(),economy:economy()};}
if(require.main===module)console.log(JSON.stringify(report(),null,2));module.exports={session,manage,report};
