const assert=require('node:assert/strict');
const {Encounter}=require('../web/combat-v3.js'),P=require('../web/progression.js'),J=require('../web/journey.js'),F=require('../web/tideglass.js'),B=require('../web/build-upgrades.js'),settings=require('../web/gameplay.json');
J.install(Encounter,P);F.install(Encounter,P,J);B.install(Encounter,P,J,F);
const origin={x:210,y:460};
function target(w='scrap'){const m=new Encounter(settings);m.best=100;m.weapon=w;m.state='fight';m.hp=m.maxHp=1e8;m.enemyX=330;m.upgradeRoll=()=>0;return m;}
let m=target();assert.equal(Object.keys(m.upgrades).length,15);m.best=0;m.gold=1e8;assert(!m.buy('jackpot'));m.best=16;assert(m.buy('jackpot'));assert.equal(m.gold,1e8-100);
for(const [k,u] of Object.entries(B.upgrades)){m.upgrades[k]=Number.isFinite(u.cap)?u.cap:100000;assert(Number.isFinite(m.cost(k)));assert(Number.isFinite(m.upgradeValue(k)));if(Number.isFinite(u.cap))assert(!m.buy(k));}
let saved=m.save(1000),copy=new Encounter(settings);assert(copy.load(saved,1000));assert.deepEqual(copy.upgrades,m.upgrades);const legacy={...saved,upgrades:{damage:3}};copy.load(legacy,1000);assert.equal(copy.upgrades.damage,3);assert.equal(copy.upgrades.splinter,0);
m=target();m.upgrades.splinter=25;m.hitEnemy(100,'scrap',460);assert.equal(m.shots.length,1);assert.equal(m.shots[0].damage,35);const xp=m.progress.weaponXP[0],charge=m.charge;m.hitEnemy(35,'scrap',472,1,true);assert.equal(m.progress.weaponXP[0],xp);assert.equal(m.charge,charge);assert.equal(m.shots.length,1);assert(m.effects.at(-1).secondary);
m=target();m.upgrades.hullcrack=20;for(let i=0;i<10;i++)m.hitEnemy(100,'scrap',460);assert.equal(m.hullStacks,10);assert(Math.abs(m.armorBreak()-.3)<1e-8);m.startEncounter();assert.equal(m.hullStacks,0);
m=target();m.stage=3;m.startEncounter();m.state='fight';m.hp=m.maxHp=1e8;m.upgrades.hullcrack=20;m.progress.weaponPath[0]='pierce';m.progress.weaponXP[0]=140;for(let i=0;i<10;i++)m.hitEnemy(100,'scrap',460);assert(m.effects.at(-1).damage<=115,'Piercing cannot amplify guard compensation twice');
m=target();m.upgrades.undertow=2;for(let i=0;i<10;i++)m.hitEnemy(100,'scrap',460);assert.equal(m.undertowStacks,10);assert.equal(m.effects.at(-1).damage,120);m.state='reward';m.tick(.1,origin);assert.equal(m.undertowStacks,9.8);
m=target();m.upgrades.laststand=20;m.playerHp=31;assert.equal(m.protectHit(10),6);assert.equal(m.lastStandTime,3);assert.equal(m.lastStandCooldown,25);m.lastStandTime=0;assert.equal(m.protectHit(10),10);copy.load(m.save(1000),1000);assert.equal(copy.lastStandCooldown,25);
m=target();m.upgrades.secondwind=20;m.formStrain=25;assert.equal(m.formRecovery,6);m.beginRecovery();assert.equal(m.lowTideTime,6);m.earlyRecovery=true;m.beginRecovery();assert.equal(m.lowTideTime,3);
m=target();m.upgrades.jackpot=20;const reward=m.reward;m.hp=1;m.hitEnemy(100,'scrap',460);assert.equal(m.gold,3*reward);assert.equal(m.lastReward,3*reward);assert(m.effects.some(e=>e.type==='jackpot'));m=target();m.upgrades.jackpot=20;m.enterCampaign(0,1);m.state='fight';m.hp=1;const gold=m.gold;m.hitEnemy(100,'scrap',460);assert.equal(m.gold,gold);assert(!m.effects.some(e=>e.type==='jackpot'));
for(const weapon of ['scrap','riveter','harpoon','boiler']){m=target(weapon);const i=P.ids.indexOf(weapon);m.progress.weaponXP[i]=140;m.progress.weaponPath[i]='impact';const original=m.interval;for(let n=0;n<5;n++)m.hitEnemy(100,weapon,460);assert(Number.isFinite(m.hp));if(weapon==='riveter')assert.equal(m.effects.at(-1).damage,350);if(weapon==='scrap')assert.equal(m.effects.at(-1).damage,220);}
m=target('riveter');m.progress.weaponXP[3]=140;m.progress.weaponPath[3]='tempo';for(let i=0;i<3;i++)m.hitEnemy(100,'riveter',460);assert.equal(m.shots.length,1);assert.equal(m.shots[0].damage,36);
m=target('boiler');m.progress.weaponXP[5]=140;m.progress.weaponPath[5]='tempo';m.playerHp=50;for(let i=0;i<3;i++)m.hitEnemy(100,'boiler',460);assert.equal(m.playerHp,53);
// Real ticking consumes follow-ups without recursive proc storms.
m=target();m.upgrades.splinter=25;m.hitEnemy(100,'scrap',460);for(let i=0;i<5;i++)m.tick(.1,origin);assert(m.shots.length<4);assert(m.effects.some(e=>e.secondary));
console.log('Build depth: unlocks, caps, save migration, secondary shots, armor, stacking, defense, recovery, jackpots and branches pass');


m=target('harpoon');m.stage=5;m.startEncounter();m.state='fight';m.hp=m.maxHp=1e8;m.progress.weaponXP[4]=140;m.progress.weaponPath[4]='impact';m.hitEnemy(100,'harpoon',460);assert.equal(m.effects.at(-1).damage,196);
m=target('scrap');const normalInterval=m.interval;m.progress.weaponXP[0]=140;m.progress.weaponPath[0]='impact';assert(Math.abs(m.interval/normalInterval-1.2)<1e-8);
m=target();m.upgrades.hullcrack=100000;assert(m.upgradeValue('hullcrack')<60);assert(m.upgradeValue('hullcrack')>59);
