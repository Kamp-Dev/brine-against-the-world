const assert=require('node:assert/strict'),P=require('../web/craft-parallax.js'),{fresh}=require('./depth-fixture.cjs');
for(const l of P.layers){
 const a=P.tiles(0,l),b=P.tiles(20,l);assert(Math.abs(b[1].x-a[1].x+20*l.speed)<1e-8,'Each layer moves left continuously');
 for(const distance of [0,1,200,700/l.speed-.001,700/l.speed+.001,960/l.speed-.001,960/l.speed+.001,1e8]){const ts=P.tiles(distance,l);assert(ts[0].x<=0);assert(ts.at(-1).x+l.period>=640);for(let i=1;i<ts.length;i++)assert(Math.abs(ts[i].x-ts[i-1].x-l.period)<1e-6,'No tiling gaps');}
}
assert(P.layers[2].speed>P.layers[1].speed&&P.layers[1].speed>P.layers[0].speed,'Near surfaces move fastest');
const m=fresh(),before=m.distance;for(let i=0;i<30;i++)m.tick(1/60,{x:200,y:460});assert(m.distance>before,'Actual walking advances parallax distance');m.paused=true;const paused=m.distance;for(let i=0;i<60;i++)m.tick(1/60,{x:200,y:460});assert.equal(m.distance,paused);m.paused=false;m.state='fight';m.cycle=-1e6;m.enemyCycle=-1e6;const fighting=m.distance;for(let i=0;i<30;i++)m.tick(1/60,{x:200,y:460});assert.equal(m.distance,fighting);
const calls=[],ctx=new Proxy({},{get:(_,name)=>name==='drawImage'?((...a)=>calls.push(a)):(()=>{}),set:()=>true});for(const route of [0,1,2]){calls.length=0;assert(P.draw(ctx,{route,distance:900},{naturalWidth:1400},{},null,null));assert(calls.length>=3);}
console.log('PASS continuous distinct layer speeds, tile-wrap coverage, all districts, actual walking movement, and pause/combat freeze');
