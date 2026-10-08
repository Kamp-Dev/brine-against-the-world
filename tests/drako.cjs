const assert=require('node:assert/strict'),fs=require('node:fs');
const {clips,frameAt,autoClip}=require('../web/drako.js');
for(const file of Object.values(clips)){
 const d=JSON.parse(fs.readFileSync('web/characters/drako/'+file+'.json'));
 const png=fs.readFileSync('web/characters/drako/'+d.meta.image),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
 const frames=Object.values(d.frames);
 for(const {frame:f,duration} of frames){assert(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=h);assert(duration>0);}
 assert.equal(frameAt(frames,0),frames[0]);assert.equal(frameAt(frames,1000,false),frames.at(-1));
 const total=frames.reduce((n,f)=>n+f.duration,0)/1000;assert.equal(frameAt(frames,total),frames[0]);
}
assert.equal(autoClip({state:'travel'}),'walk');
assert.equal(autoClip({state:'fight',sinceShot:.1,burst:0}),'throw');
assert.equal(autoClip({state:'fight',sinceShot:.1,burst:2}),'cast');
assert.equal(autoClip({state:'fight',ultimateActive:true,ultimatePhase:'melee'}),'jab');
assert.equal(autoClip({state:'reward'}),'idle');
console.log('PASS: Drako frame bounds, durations, looping and combat animation selection.');
