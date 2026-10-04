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

