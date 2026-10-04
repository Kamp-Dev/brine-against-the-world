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
const maskPixels=new Uint8ClampedArray(768*448*4);
for(let i=0;i<maskPixels.length;i+=4)maskPixels.set([249,244,226,255],i);
function outlinedBox(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx===x||xx===x+w-1||yy===y||yy===y+h-1)maskPixels.set([20,20,20,255],(yy*768+xx)*4);}
outlinedBox(350,220,100,130); // The pale chest must remain opaque.
outlinedBox(350,375,80,40); // An enclosed cream gap between the feet must disappear.
outlinedBox(280,260,35,45); // Same for the gap next to the near arm.
scope.keyStepShellBackground(maskPixels,768,448,768,448);
assert.equal(maskPixels[(260*768+400)*4+3],255,'chest stays solid');
for(const [x,y] of [[10,10],[390,390],[295,280]])assert.equal(maskPixels[(y*768+x)*4+3],0,'backdrop and enclosed limb gaps are hidden');
assert.equal(maskPixels[(220*768+350)*4+3],255,'ink outline stays solid');
console.log('PASS: runtime backdrop key preserves the chest and ink while hiding exterior and limb-gap backgrounds.');
for(const hz of [30,60,120]){
 const m=new Encounter(settings);m.state='fight';m.enemyX=330;m.hp=m.maxHp=100000;m.playerHp=100000;m.enemyCycle=-10000;m.ultimateCharge=100;m.ultimate();
 for(let i=0;i<hz*2.5;i++)m.tick(1/hz,origin);
 m.hitEnemy(1000000,'melee',505);const held=m.meleeAdvance;let animated=false,traveled=false;const waitingFrames=new Set();
 for(let i=0;i<hz*4;i++){m.tick(1/hz,origin);if(m.ultimatePhase==='melee'&&['reward','lower','travel'].includes(m.state)){
  assert.equal(m.meleeAdvance,held,'Step Shell holds its defeated-enemy position');assert(!m.meleeWalking,'waiting does not play the walk');const s=sample(m);if(!(m.meleeCycle>0&&m.meleeCycle<m.meleeDuration)){assert.equal(s.clip.kind,'walk');waitingFrames.add(s.frame);animated=true;}assert.equal(s.hop,undefined,'no synthetic vertical hop');if(m.state==='travel')traveled=true;
 }}
 assert(animated&&traveled&&waitingFrames.size>10,'approved walk loops in place while a new enemy enters');m.paused=true;const before=sample(m).frame;m.tick(.1,origin);assert.equal(sample(m).frame,before,'pause freezes walk');m.paused=false;
 for(let i=0;i<hz*10;i++)m.tick(1/hz,origin);assert.equal(m.ultimatePhase,'normal');assert.equal(m.meleeAdvance,0,'normal form returns to its lane');assert.equal(sample(m).hop,undefined);
}
console.log('PASS: Step Shell holds position and loops the approved walk between enemies; pause and Ultimate expiry behave correctly.');

for(const hz of [30,60,120]){
 const m=new Encounter(settings);m.state='travel';m.ultimateTime=7;m.meleeAdvance=85;m.meleeCycle=0;m.enemyX=500;m.playerHp=100000;
 for(let i=0;i<hz;i++){m.tick(1/hz,origin);const pose=sample(m);assert(pose.frame<data.walk.loopFrames,'partial trailing step excluded');const alternate=sample({...m,time:m.time+173,ultimatePhase:m.ultimatePhase,meleeDuration:m.meleeDuration});assert.equal(pose.frame,alternate.frame,'idle cadence does not depend on global clock');}
 m.state='fight';m.enemyX=330;m.meleeAdvance=m.meleeReach;m.meleeIdleTime=.12;m.meleeIdleActive=true;m.enemyCycle=-100;m.hp=m.maxHp=100000;
 let landed=false;for(let i=0;i<hz;i++){m.tick(1/hz,origin);if(m.meleeIdleActive)assert.equal(m.meleeCycle,0,'finish step before winding up punch');else{assert(Math.abs(m.meleeIdleTime*3-Math.round(m.meleeIdleTime*3))<.0001,'handoff at a planted step boundary');landed=true;break;}}assert(landed,'step settles without delaying combat indefinitely');
}
console.log('PASS: complete idle loops, independent cadence, and planted-step attack handoffs at 30/60/120 Hz.');
