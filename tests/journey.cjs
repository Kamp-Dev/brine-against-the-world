const assert=require('node:assert/strict');
const {Encounter}=require('../web/combat-v3.js'),P=require('../web/progression.js'),J=require('../web/journey.js');
J.install(Encounter,P);
let m=new Encounter();m.gold=10000;m.state='fight';m.charge=100;m.ultimateCharge=100;
assert.equal(m.buy('shell'),false);assert.equal(m.volley(),false);assert.equal(m.ultimate(),false);assert.equal(m.chooseForm('samurai'),false);assert.equal(m.buyMod(),false);
assert.equal(m.buy('damage'),true);assert.equal(J.scan(m),undefined);
m.xp=30;assert.equal(J.scan(m).id,'shell');assert.equal(m.buy('shell'),true);assert.equal(J.scan(m).id,'speed');J.finish(m,'speed');assert.equal(J.active(m),undefined);
m.xp=120;assert.equal(m.volley(),true);assert(m.journey.actions.includes('volley'));J.scan(m);
m.best=5;assert.equal(m.ultimate(),true);assert.equal(m.equip('repeater'),false);m.ultimateTime=0;m.progress.district[0]=true;m.progress.materials=[999,999,999];assert.equal(P.build(m.progress,0),true);assert.equal(P.build(m.progress,1),false);
m.best=6;assert.equal(m.equip('repeater'),false);m.best=14;assert.equal(m.equip('repeater'),false);m.best=15;assert.equal(m.equip('repeater'),true);m.best=6;assert.equal(P.selectContract(m.progress,'samurai'),false);m.progress.counts[0]=12;assert.equal(P.claimContract(m.progress),true);
m.best=10;assert.equal(P.build(m.progress,1),true);assert.equal(P.dispatch(m.progress,0,1000),true);assert(m.journey.actions.includes('dispatch'));assert.equal(P.build(m.progress,2),false);
m.best=15;assert.equal(m.chooseForm('samurai'),true);assert.equal(P.build(m.progress,2),true);
const s=m.save(1000),copy=new Encounter();assert(copy.load(s,1000));assert.deepEqual(copy.journey,m.journey);copy.reset();assert.equal(J.available(copy,'samurai'),false);assert.equal(copy.journey.done.length,0);
const old={...s};delete old.journey;old.best=2;old.kills=4;assert(copy.load(old,1000));assert(J.available(copy,'samurai'));assert(J.available(copy,'shell'));
const bad={...s,journey:{version:1,done:null,seen:12,grants:['fake'],actions:{}}};assert(copy.load(bad,1000));assert.deepEqual(copy.journey.grants,[]);
// Simulate a fresh player buying affordable unlocked upgrades, retrying and using abilities.
m=new Encounter();let elapsed=0,retryKills=0;while(m.best<15&&elapsed<7200){for(const k of ['damage','shell','speed'])m.buy(k);if(m.state==='defeat'){m.retry();retryKills=m.kills;}if(m.farming&&m.kills-retryKills>=4)m.toggleFarm();for(const w of ['repeater','lowtide'])m.equip(w);if(J.available(m,'volley'))m.volley();if(J.available(m,'step-shell'))m.ultimate();m.tick(.1,{x:180,y:460});elapsed+=.1;}console.log({best:m.best,level:m.level,elapsed,upgrades:m.upgrades});assert(m.best>=15,'Fresh journey must remain beatable');
console.log('PASS: locked actions, milestone unlocks, lesson completion/skip, saved training, legacy migration, reset, malformed saves and fresh progression to stretch 15 ('+Math.round(elapsed)+'s simulation).');
