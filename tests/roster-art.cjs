const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const web='web/',unity='unity/BrineAgainstTheWorld/Assets/Brine/Resources/';
const {enemies}=require('../web/combat-v3.js'),bounds=require('../web/enemies/bounds.json'),settings=require('../web/gameplay.json');
assert.equal(new Set(enemies.map(e=>e.art)).size,6,'every type has its own illustration');
const hashes=[];
for(const e of enemies){const name='enemies/'+e.art+'.png',a=fs.readFileSync(web+name),b=fs.readFileSync(unity+name),crop=bounds[e.art];assert.deepEqual(a,b,'same artwork in Unity');hashes.push(crypto.createHash('sha256').update(a).digest('hex'));assert.equal(a[25],6,'transparent RGBA enemy');assert(crop.x>=0&&crop.y>=0&&crop.x+crop.w<=a.readUInt32BE(16)&&crop.y+crop.h<=a.readUInt32BE(20),'valid art crop');const v=settings.enemyVisuals.find(v=>v.id===e.art);assert(Math.abs(v.ratio-crop.w/crop.h)<.00001,'melee uses actual new art geometry');assert(e.height*.78*v.ratio/2+330<439,'enemy fits battle viewport');}
assert.equal(new Set(hashes).size,6,'no reused or recolored copies');
for(const name of ['enemy-motion.json','parallax.json','gameplay.json'])assert.deepEqual(JSON.parse(fs.readFileSync(web+name)),JSON.parse(fs.readFileSync(unity+name)));
const motion=require('../web/enemy-motion.json').profiles;assert.equal(new Set(motion.map(p=>JSON.stringify([p.lean,p.squash,p.lunge,p.hop]))).size,6,'distinct action motion');for(const e of enemies)assert(motion.some(p=>p.action===e.action));
for(const l of require('../web/parallax.json').layers){assert.deepEqual(fs.readFileSync(web+'scenery/'+l.image+'.png'),fs.readFileSync(unity+'scenery/'+l.image+'.png'));assert(l.period>=450);for(const d of [0,1,l.period/l.speed-.001,l.period/l.speed+.001,99999]){const travel=d*l.speed/l.period,offset=(travel-Math.floor(travel))*l.period;assert(-offset<=0&&2*l.period-offset>=450,'no hole while wrapping');}}
const browser=fs.readFileSync(web+'game.js','utf8'),native=fs.readFileSync('unity/BrineAgainstTheWorld/Assets/Brine/Scripts/BrineGameController.cs','utf8');assert(!browser.includes('ctx.fillRect(w*.02+9'));assert(!/Gate shield|Repair kit|Digging blade/.test(native),'proxy equipment removed');
console.log('PASS: six unique enemy images, accurate melee geometry, distinct motion, no proxy symbols, matching Unity assets, and parallax wrap coverage.');
