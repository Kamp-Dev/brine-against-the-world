const assert=require('node:assert/strict'),fs=require('fs'),P=require('../web/combat-presentation.js'),{late}=require('./depth-fixture.cjs');
// Rendering cannot alter combat. A frozen effect list also catches accidental sorting/mutation.
const hit=(damage,critTier=0)=>({type:'hit',damage,critTier,weapon:'boiler',x:350,y:450,life:.6,duration:.6});
for(const mode of ['balanced','calm']){
 const p=P.create(),m={stage:100,state:'fight',time:0,effects:[],shots:Array.from({length:100},(_,i)=>({x:i})),enemyShots:Array.from({length:30},(_,i)=>({x:i}))};
 const h=Object.freeze(hit(20,1));m.effects=Object.freeze([h]);let f=p.frame(m,0,mode);assert.equal(f.hits[0].damage,20);assert.equal(f.hits[0].count,1);
 f=p.frame(m,.05,mode);assert.equal(f.hits[0].damage,20,'Same effect must not count twice');m.effects=Object.freeze([h,Object.freeze(hit(30)),Object.freeze(hit(40,2))]);p.frame(m,.1,mode);f=p.frame(m,.6,mode);assert.equal(f.hits.at(-1).damage,70);assert.equal(f.hits.at(-1).count,2);assert.equal(f.hits.at(-1).critTier,2);
 assert(f.shots.length<=(mode==='calm'?2:5));assert(f.enemyShots.length<=4);assert(f.bursts.length<=1);m.effects=[];assert.equal(p.frame(m,2,mode).hits.length,0);
 m.stage++;assert.equal(p.frame(m,2.1,mode).hits.length,0);
 // 120 hits/second, far above late-game firing: bounded visual density at 1x and 3x.
 for(const speed of [1,3]){const q=P.create();let maxNumbers=0,flashes=0,lastFlash=-1,accents=0,lastAccent=-1;for(let i=0;i<600;i++){const now=i/60;m.time=now*speed;m.effects=[hit(10),hit(15),{type:'flash',life:.1,duration:.1},{type:'confetti-burst',life:.48,duration:.48},{type:'shop-mod',life:.48,duration:.48}];f=q.frame(m,now,mode);maxNumbers=Math.max(maxNumbers,f.hits.length);assert(f.bursts.length<=1);assert(f.accents.length<=1);if(f.accents[0]?.born!==undefined&&f.accents[0].born!==lastAccent){lastAccent=f.accents[0].born;accents++;}if(f.flashes[0]?.born!==undefined&&f.flashes[0].born!==lastFlash){lastFlash=f.flashes[0].born;flashes++;}}assert(maxNumbers<=(mode==='calm'?1:2));assert(flashes<=(mode==='calm'?0:25));assert(accents<=(mode==='calm'?13:23));}
}
// Compare a seeded late-game battle with and without presentation processing.
const a=late(),b=late(),view=P.create();a.upgradeRoll=()=>.5;b.upgradeRoll=()=>.5;
for(let i=0;i<6000;i++){for(const m of [a,b])m.tick(1/60,{x:200,y:460});view.frame(b,i/60,i%2?'calm':'balanced');assert.equal(a.hp,b.hp);assert.equal(a.playerHp,b.playerHp);assert.equal(a.kills,b.kills);assert.equal(a.gold,b.gold);assert.equal(a.shots.length,b.shots.length);}
for(const id of ['scrap','repeater','lowtide','riveter','harpoon','boiler'])assert(fs.statSync('web/craft/impact-'+id+'.png').size>100);
for(let i=0;i<3;i++)for(const type of ['chapter','boss'])assert(fs.statSync('web/craft/'+type+'-'+i+'.mp4').size>1000);
console.log('PASS grouped damage totals, no duplicate hits, stage reset, bounded 1x/3x visuals, zero calm flashes and unchanged late-game damage/rewards');
