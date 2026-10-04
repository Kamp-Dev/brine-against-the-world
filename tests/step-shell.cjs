const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {Encounter}=require('../web/combat-v3.js'),settings=require('../web/gameplay.json'),data=require('../web/step-shell.json');
const scope={};vm.createContext(scope);vm.runInContext(fs.readFileSync('web/step-shell.js','utf8'),scope);
const sample=m=>scope.sampleStepShell(m,data),origin={x:190,y:500};
for(const hz of [30,60,120]){
 const m=new Encounter(settings);m.state='fight';m.enemyX=330;m.hp=m.maxHp=100000;m.playerHp=100000;m.enemyCycle=-10000;m.ultimateCharge=100;
 assert(m.ultimate());let firstHit=null,previousShow=false,swaps=0,previousHp=m.hp;
 for(let i=0;i<hz*10;i++){
  const s=sample(m);assert(s.frame>=0&&s.frame<s.clip.frames);assert(Number.isFinite(s.squash));
  if(s.show!==previousShow){assert(s.cover>.8,'model swap hidden by local burst');swaps++;previousShow=s.show;}
  const phase=m.ultimatePhase;m.tick(1/hz,origin);
  if(m.hp<previousHp&&m.effects.some(e=>e.weapon==='melee')){if(firstHit===null)firstHit=i/hz;assert.equal(phase,'melee','no strikes during transformation');}
  previousHp=m.hp;
  if(m.ultimateActive&&(phase==='enter'||phase==='exit'))assert.equal(m.shots.length,0,'no floating gun projectiles in transition');
 }
 assert.equal(swaps,2,'one transformation each way');assert(firstHit>.9&&firstHit<1.4,'contact follows approach and punch windup');assert.equal(m.ultimatePhase,'normal');assert(m.shotSerial>0,'gun resumes');
}
for(const kind of ['punch','walk']){const clip=data[kind],bytes=fs.readFileSync('web/'+clip.sheet);assert.equal(bytes.readUInt32BE(16),clip.columns*clip.cellWidth);assert.equal(bytes.readUInt32BE(20),clip.rows*clip.cellHeight);assert(clip.renderBounds.x+clip.renderBounds.w<=clip.cellWidth);assert(clip.renderBounds.y+clip.renderBounds.h<=clip.cellHeight);assert.equal(bytes[25],6,'RGBA sheet');}
assert.deepEqual(data,JSON.parse(fs.readFileSync('unity/BrineAgainstTheWorld/Assets/Brine/Resources/step-shell.json')));
assert(!fs.readFileSync('web/game.js','utf8').includes("path([[-68"),'old shell overlay removed');
console.log('PASS: approved Step Shell grids, matching Unity assets, covered single-model transitions, contact timing and gun restoration at 30/60/120 Hz.');

for(const stage of [1,2,3,4,5,6])for(const hz of [30,60,120]){
 const m=new Encounter(settings);m.stage=stage;m.state='fight';m.enemyX=330;m.hp=m.maxHp=100000;m.playerHp=100000;m.enemyCycle=-10000;m.ultimateCharge=100;m.ultimate();
 let contact;for(let i=0;i<hz*3&&!contact;i++){m.tick(1/hz,origin);contact=m.effects.find(e=>e.weapon==='melee');}
 assert(contact,'each enemy receives melee contact');assert(m.meleeAdvance>50,'Brine visibly closes distance');
 const tip=124+m.meleeAdvance+settings.meleeReach;assert(tip>=m.meleeContactX&&tip<=m.meleeContactX+5,'fist reaches torso without excessive overlap');assert(Math.abs(contact.x-m.meleeContactX)<1,'burst stays at contact');assert.equal(contact.y,505);
 const before=m.meleeReach;m.enemyX+=20;assert(Math.abs(m.meleeReach-before-20)<.001,'approach follows actual opponent position');
}
console.log('PASS: fist contact and burst position for six enemies at 30/60/120 Hz.');
