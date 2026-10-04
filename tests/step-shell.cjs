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
 assert.equal(swaps,2,'one transformation each way');assert(firstHit>1.8&&firstHit<2.5,'contact follows approach and punch windup');assert.equal(m.ultimatePhase,'normal');assert(m.shotSerial>0,'gun resumes');
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

for(const hz of [30,60,120])for(const stage of [1,2,3,4,5,6]){
 const m=new Encounter(settings);m.stage=stage;m.state='fight';m.enemyX=330;m.hp=m.maxHp=100000;m.playerHp=100000;m.enemyCycle=-10000;m.ultimateCharge=100;m.ultimate();
 const frames=new Set();let movingSeconds=0,firstStrike=false;
 for(let i=0;i<hz*3;i++){const before=m.meleeAdvance;m.tick(1/hz,origin);const s=sample(m);
  assert(Math.abs(m.meleeAdvance-before)<=settings.meleeMoveSpeed/hz+.0001,'approach has no exponential teleport');
  if(m.meleeWalking){assert.equal(s.clip.kind,'walk','every moving Step Shell frame walks');frames.add(s.frame);movingSeconds+=1/hz;assert.equal(m.meleeCycle,0,'approach cannot punch');}
  if(m.effects.some(e=>e.weapon==='melee')){firstStrike=true;break;}
 }
 assert(firstStrike);assert(frames.size>=Math.floor(data.walk.frames*.75),'approach displays a visible gait');assert(movingSeconds>.75,'approach takes a visible stride');
 m.hp=1; // Finish an enemy, then ensure recovery finishes before the retreat starts.
 for(let i=0;i<hz*3;i++){m.tick(1/hz,origin);if(m.meleeWalking&&m.ultimatePhase==='melee')assert.equal(sample(m).clip.kind,'walk','retreat never slides in a punch pose');}
}
console.log('PASS: visible position-driven walking on approach and retreat, no attacks while moving, bounded travel speed at 30/60/120 Hz.');

for(const clip of [data.walk,data.punch]){if(clip.frameBounds){assert.equal(clip.frameBounds.length,clip.frames);for(const b of clip.frameBounds){assert(b.x>=0&&b.y>=0);assert(b.x+b.w<=clip.cellWidth&&b.y+b.h<=clip.cellHeight);assert.equal(b.h,clip.renderBounds.h);}}}

// Both feet must lead on opposite half-cycles; stance contact must not slide.
for(let i=0;i<120;i++){
 const phase=i/120,n=scope.stepShellLeg(phase,false),f=scope.stepShellLeg(phase,true);
 assert.notEqual(n.stance,f.stance,'one supporting foot in each half cycle');
 for(const leg of [n,f]){assert(Math.abs(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y)-27)<1e-6);assert(Math.abs(Math.hypot(leg.knee.x-leg.ankle.x,leg.knee.y-leg.ankle.y)-22)<1e-6);}
 if(phase<.49){const next=scope.stepShellLeg(phase+.001,false);assert(Math.abs((next.ankle.x+84*(phase+.001))-(n.ankle.x+84*phase))<1e-6,'planted foot stays fixed while body advances');}
}
assert(scope.stepShellLeg(0,false).ankle.x>scope.stepShellLeg(0,true).ankle.x,'near foot leads');
assert(scope.stepShellLeg(.5,true).ankle.x>scope.stepShellLeg(.5,false).ankle.x,'far foot leads');
for(const far of [false,true])assert.deepEqual(scope.stepShellLeg(0,far),scope.stepShellLeg(1,far),'loop closes');
const rigBytes=fs.readFileSync('web/'+data.rig.sheet),rw=rigBytes.readUInt32BE(16),rh=rigBytes.readUInt32BE(20);
assert.equal(rigBytes[25],6);for(const p of data.rig.parts)assert(p.x>=0&&p.y>=0&&p.x+p.w<=rw&&p.y+p.h<=rh);
console.log('PASS: independent alternating feet, fixed stance contact, constant bone lengths, closed loop and cutout bounds.');
