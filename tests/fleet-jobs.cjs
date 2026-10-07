const assert=require('node:assert/strict'),{late,fresh}=require('./depth-fixture.cjs');
const m=late();m.depth.fleetAt=1000;m.gold=1e12;m.forge.tideglass=10000;
for(let i=0;i<3;i++)assert(m.buyBoat(i,false,1000));
const start=[...m.progress.materials,m.forge.tideglass];m.accrueFleet(3601000);
assert.equal(m.progress.materials[0]-start[0],6);assert.equal(m.progress.materials[1]-start[1],0);assert.equal(m.forge.tideglass-start[3],2);
const state=JSON.stringify(m.save(3601000));m.accrueFleet(3601000);assert.equal(JSON.stringify(m.save(3601000)),state);
for(let i=1;i<3;i++){assert(m.buyBoat(i,false,3601000));assert(m.buyBoat(i,false,3601000));}
assert(m.boatYield(1).brass>0);assert(m.boatYield(2).charts>0);
const predicted=m.boatYield(1,4,0);assert(m.buyBoat(1,false,3601000));assert.deepEqual(m.boatYield(1),predicted);
assert(m.boatYield(0,5,0).salvage>m.boatYield(0,4,0).salvage*1.25);
const s=m.save(3601000),a=fresh(),b=fresh();a.load(s,3601000+24*3600000);b.load(s,3601000+8*3600000);assert.deepEqual(a.progress.materials,b.progress.materials);assert.equal(a.forge.tideglass,b.forge.tideglass);
const old=JSON.parse(JSON.stringify(s));delete old.depth.cargoVersion;delete old.depth.cargoCarry;const legacy=fresh();legacy.load(old,3601000+3600000);assert.deepEqual(legacy.progress.materials,old.progress.materials);assert.equal(legacy.forge.tideglass,old.forge.tideglass);
const once=a.save(3601000+24*3600000),reload=fresh();reload.load(once,3601000+24*3600000);assert.deepEqual(reload.progress.materials,a.progress.materials);assert.equal(reload.forge.tideglass,a.forge.tideglass);
console.log('PASS fleet roles, exact upgrade previews, milestones, offline cap, migration, and duplicate prevention');
