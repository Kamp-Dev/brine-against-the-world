const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../web/samurai.js'),data=JSON.parse(fs.readFileSync('web/samurai/animation.json'));
for(const c of data.clips){const bytes=fs.readFileSync('web/samurai/'+c.image),w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);for(const f of c.frames){assert(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=h);assert(f.gripX>=0&&f.gripY>=0&&f.gripX<f.w&&f.gripY<f.h);assert(f.anchorY>0&&f.anchorY<=f.h);}}
for(const hz of [30,60,120])for(let t=0;t<api.duration*2;t+=1/hz){const s=api.sample(data,t);assert(s.f);assert(Number.isFinite(s.angle));assert.equal(s.f,s.clip.frames[s.frame]);}
let boundary=0;for(const [state,duration] of api.stages){const mid=api.sample(data,boundary+duration/2);assert.equal(mid.state,state);boundary+=duration;}
assert.equal(api.sample(data,0).frame,api.sample(data,api.duration).frame);
assert.equal(data.clips.find(c=>c.name==='walk').fps,18);
for(let t=0;t<api.duration;t+=.001){const sample=api.sample(data,t);assert.equal(sample.angle,sample.f.angle,'Sword cannot advance independently of the visible hand');}
assert(Math.abs(api.sample(data,1).distance-52.5)<1e-8,'Scenery and walking slow together');
const eyeClip={scale:36,frames:[{x:0,y:0,w:3,h:10,anchorY:10}]},pixels=new Uint8ClampedArray(3*10*4),raw=new Uint8ClampedArray(pixels.length);
raw.set([235,229,230,255,12,12,12,255,224,90,35,255]);pixels.set([155,155,155,80,12,12,12,255,224,90,35,255]);
assert.equal(api.restoreEyes(pixels,raw,3,eyeClip),1);assert.deepEqual([...pixels.slice(0,4)],[235,229,230,255]);assert.equal(pixels[7],255);assert.equal(pixels[11],255);assert.equal(pixels[15],0,'Exterior remains transparent');
assert.equal(data.credits.submitted,5);assert.equal(data.credits.remaining,0);
for(const m of fs.readFileSync('web/samurai-review.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const unity=JSON.parse(fs.readFileSync('unity/BrineAgainstTheWorld/Assets/Brine/Resources/samurai-animation.json'));assert.deepEqual(unity,data);
console.log('PASS: Samurai frame bounds, weapon anchors, timeline sampling, budget cap and browser/Unity metadata parity.');
const Combat=require('../web/combat-v3.js'),settings=JSON.parse(fs.readFileSync('web/gameplay.json')),m=new Combat.Encounter(settings);
assert(m.chooseForm('samurai'));assert(!m.chooseForm('unknown'));const loaded=new Combat.Encounter(settings);assert(loaded.load(m.save(1000),1000));assert.equal(loaded.selectedForm,'samurai');const legacy=m.save(1000);delete legacy.selectedForm;loaded.load(legacy,1000);assert.equal(loaded.selectedForm,'step-shell');
m.state='fight';m.enemyX=330;m.hp=m.maxHp=100000;m.ultimateCharge=100;assert(m.ultimate());assert(!m.chooseForm('step-shell'),'Form cannot change during an active transformation');
let seenSlash=false,seenCombo=false;for(let i=0;i<550;i++){m.tick(1/120,{x:180,y:500});const p=api.combatSample(m,data);seenSlash||=p.state==='slash';seenCombo||=p.state==='series';assert(p.f);if(m.meleeCycle>=m.meleeImpact&&m.meleeCycle<m.meleeImpact+.01&&!m.meleeWalking)assert(p.frame>=(p.clip.name==='slash'?6:15));}assert(seenSlash&&seenCombo);assert(m.hp<m.maxHp);assert(m.meleeAttackIndex>0);
const speck=new Uint8ClampedArray(5*10*4);for(let y=0;y<4;y++)for(let x=0;x<5;x++)speck.set([12,12,12,255],(y*5+x)*4);speck.set([240,240,240,255],(1*5+2)*4);api.restoreEyes(speck,null,5,{scale:36,frames:[{x:0,y:0,w:5,h:10,anchorY:10}]});assert.deepEqual([...speck.slice(28,32)],[12,12,12,255]);
console.log('PASS: selectable forms, legacy/save compatibility, active-form lock, alternating combat clips, real damage, and pupil-speck cleanup.');
for(const fps of [30,60,120,10]){
 const battle=new Combat.Encounter(settings);battle.chooseForm('samurai');battle.state='fight';battle.enemyX=330;battle.hp=battle.maxHp=100000;battle.ultimateTime=8;battle.meleeAdvance=battle.meleeReach;battle.meleeAttackIndex=1;
 const hits=[];for(let t=0;t<battle.meleeDuration-.02;t+=1/fps){const hp=battle.hp;battle.tick(1/fps,{x:180,y:500});if(battle.hp<hp)hits.push({damage:hp-battle.hp,frame:api.combatSample(battle,data).frame,power:battle.effects.filter(e=>e.type==='hit'&&e.weapon==='melee').at(-1).power});}
 assert.equal(hits.length,3,`Three distinct damage contacts at ${fps} Hz`);assert.deepEqual(hits.map(h=>h.damage),[battle.damage,battle.damage,battle.damage*2]);assert(hits.every((h,i)=>h.frame>=[9,16,22][i]&&h.frame<=[12,19,25][i]));assert(hits[2].power>hits[0].power);
 const after=battle.hp;battle.paused=true;battle.tick(.1,{x:0,y:0});assert.equal(battle.hp,after);
}
const killed=new Combat.Encounter(settings);killed.chooseForm('samurai');killed.state='fight';killed.enemyX=330;killed.hp=1;killed.ultimateTime=8;killed.meleeAdvance=killed.meleeReach;killed.meleeAttackIndex=1;for(let i=0;i<100;i++)killed.tick(.01,{x:0,y:0});assert.equal(killed.kills,1);assert.equal(killed.meleeHitIndex,1,'No extra hits or rewards after a fatal first cut');
for(const clip of data.clips)for(const frame of clip.frames){assert.equal(frame.pupils.length,2);for(const p of frame.pupils){assert(p.x>0&&p.y>0&&p.rx>0&&p.ry>0);}}
const eyePixels=new Uint8ClampedArray(8*12*4);for(let i=0;i<eyePixels.length;i+=4)eyePixels.set([245,245,245,255],i);eyePixels.set([230,80,20,255],(2*8+4)*4);eyePixels.set([0,0,0,0],(3*8+4)*4);api.restoreEyes(eyePixels,null,8,{scale:36,frames:[{x:0,y:0,w:8,h:12,anchorY:12,pupils:[{x:4,y:3,rx:2,ry:3}]}]});assert.deepEqual([...eyePixels.slice((3*8+3)*4,(3*8+3)*4+4)],[12,12,12,255]);assert.equal(eyePixels[(3*8+4)*4+3],0);assert.equal(eyePixels[(2*8+4)*4],230);
console.log('PASS: three contacts at 10/30/60/120 Hz, unchanged total damage, finishing impact, pause/death guards, and two opaque tracked pupils per frame.');


const sealed=new Uint8ClampedArray(8*12*4),sealedRaw=new Uint8ClampedArray(sealed.length);sealedRaw.set([8,8,8,255],(3*8+4)*4);
api.restoreEyes(sealed,sealedRaw,8,{scale:36,frames:[{x:0,y:0,w:8,h:12,anchorY:12,pupils:[{x:4,y:3,rx:2,ry:3,seal:[{y:3,left:4,right:4}]}]}]});
assert.deepEqual([...sealed.slice((3*8+4)*4,(3*8+4)*4+4)],[12,12,12,255],'A completely transparent black pupil is restored');assert.equal(sealed[(3*8+3)*4+3],0,'Exterior outside the eye seal remains transparent');
for(const c of data.clips)for(const f of c.frames)for(const eye of f.pupils){assert(eye.seal.length>0);for(const r of eye.seal)assert(r.y>=0&&r.y<f.h&&r.left>=0&&r.right<f.w&&r.left<=r.right);}
console.log('PASS: fully missing pupil opacity is repaired within bounded eye interiors; transparent exterior is preserved.');
