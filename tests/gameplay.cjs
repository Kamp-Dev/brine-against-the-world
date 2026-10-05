const assert=require('node:assert/strict');
const {Encounter}=require('../web/combat-v3.js');
const settings=require('../web/gameplay.json');
const origin={x:215,y:500},m=new Encounter(settings);
function until(model,condition,limit=30000){for(let i=0;i<limit&&!condition();i++)model.tick(.02,origin);assert(condition(),'Simulation reached expected state');}
until(m,()=>m.state==='fight');assert.equal(m.shotSerial,0);assert(!m.equip('repeater'),'Longshot starts locked');
m.paused=true;const before=JSON.stringify(m);m.tick(.1,origin);assert.equal(JSON.stringify(m),before);m.paused=false;
until(m,()=>m.shots.length>0);assert.equal(m.shots[0].damage,12);m.gold=30;assert(m.buy('damage'));assert.equal(m.shots[0].damage,12,'Existing bullet retains damage');assert.equal(m.damage,16);
until(m,()=>m.kills===1);assert.equal(m.gold,20);assert.equal(m.best,1);assert.equal(m.xp,10);assert.equal(m.state,'reward');
until(m,()=>m.stage===2);assert.equal(m.enemy.name,'Pipe Pilfer');
const saved=m.save(100000),copy=new Encounter(settings);assert(copy.load(saved,100000));assert.deepEqual(copy.save(100000),saved);
const away=new Encounter(settings);away.load(saved,100000+48*3600000);assert.equal(away.offlineEarned,Math.floor(480*m.offlineRate));const collected=away.save(100000+48*3600000);const reload=new Encounter(settings);reload.load(collected,collected.savedAt);assert.equal(reload.offlineEarned,0,'No repeat payout');
const future=new Encounter(settings);future.load(saved,1);assert.equal(future.offlineEarned,0);assert(!future.load({version:7},1));
m.best=4;m.stage=5;m.startEncounter();assert(m.boss);assert.equal(m.enemy.name,'Foreman Rusk');assert.equal(m.reward,64);
until(m,()=>m.state==='fight');m.charge=100;assert(m.volley());assert.equal(m.charge,0);assert(!m.volley());
const count=m.shotSerial;for(let i=0;i<25;i++)m.tick(.02,origin);assert.equal(m.shotSerial-count,3,'Volley fires three rapid shots');
m.playerHp=1;until(m,()=>m.state==='defeat');assert.equal(m.playerHp,0);const dead=JSON.stringify(m);m.tick(.1,origin);assert.equal(JSON.stringify(m),dead);
const gold=m.gold,upgrades={...m.upgrades};m.retry();assert.equal(m.playerHp,m.maxPlayerHp);assert.equal(m.gold,gold);assert.deepEqual(m.upgrades,upgrades);assert(m.farming);assert.equal(m.stage,4);
m.toggleFarm();assert.equal(m.stage,5);assert(!m.farming);assert(m.equip('repeater'));assert.equal(m.weapon,'repeater');
m.gold=0;assert(!m.buy('shell'));assert(!m.buy('bogus'));m.gold=100;const hp=m.playerHp;assert(m.buy('shell'));assert.equal(m.playerHp,hp+25);
m.load({version:1,savedAt:1,best:NaN,gold:Infinity,upgrades:{shell:-1},playerHp:-3},1);assert.equal(m.gold,0);assert.equal(m.best,0);assert.equal(m.state,'defeat');
const run=new Encounter(settings);for(let i=0;i<15000&&run.best<10;i++){for(const kind of ['damage','shell','speed'])run.buy(kind);if(run.best>=3)run.equip('repeater');if(run.state==='defeat')run.retry();run.volley();run.tick(.02,origin);if(run.farming&&run.kills%3===0)run.toggleFarm()}
assert(run.best>=5,'Boss can be beaten with upgrades');console.log('PASS: aiming, pause, unlock, upgrades, in-flight damage, rewards, save roundtrip, offline cap/no duplicate, boss, volley, defeat/retry, farming, invalid save.');console.log('Balance smoke: cleared '+run.best+', level '+run.level+', '+JSON.stringify(run.upgrades));
