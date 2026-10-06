const assert=require('node:assert/strict'),{stepper,valid}=require('../web/battle-speed.js'),{Encounter}=require('../web/combat-v3.js');
assert.equal(valid(99),1);assert.equal(valid('3'),3);assert.equal(valid(NaN),1);
function run(speed,fps){const m=new Encounter();m.playerHp=1e6;m.upgrades.damage=8;m.selectedForm='samurai';m.ultimateCharge=100;const clock=stepper();for(let i=0;i<60/speed*fps;i++)clock.advance(1/fps,speed,m,()=>{m.ultimate();m.volley();return{x:200,y:460};});return {stage:m.stage,hp:m.hp,health:m.playerHp,kills:m.kills,xp:m.xp,shots:m.shotSerial,time:m.time,distance:m.distance};}
const baseline=run(1,60);for(const fps of [30,60,120])for(const speed of [1,2,3])assert.deepEqual(run(speed,fps),baseline,'Same simulated time must preserve combat outcomes');
const clock=stepper(),m=new Encounter();m.paused=true;clock.advance(.1,3,m,()=>({x:200,y:460}));assert.equal(m.time,0);m.paused=false;clock.advance(1/60,1,m,()=>({x:200,y:460}));assert(Math.abs(m.time-1/60)<1e-8,'No time banked during pause');
clock.advance(99,3,m,()=>({x:200,y:460}));assert(m.time<.32,'Long frame must not simulate a tab-away catch-up');
console.log('PASS: equivalent 1x/2x/3x combat at 30/60/120 FPS, synchronized model time, pause, invalid settings and long-frame cap.');
