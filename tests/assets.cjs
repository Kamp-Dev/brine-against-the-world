const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve('web'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const name of ['game.js','harbor-ui.js','combat-v3.js'])new vm.Script(read(name),{filename:name});
for(const name of ['index.html','animation-review.html']){
 const html=read(name);for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const target=match[1];if(/^(https?:|#|data:)/.test(target))continue;
  assert(!target.startsWith('/'),'Links must support GitHub project subpaths');
  assert(fs.existsSync(path.resolve(root,target)),`Missing ${target}`);
 }
 for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
}
const anim=JSON.parse(read('animation.json')),settings=JSON.parse(read('gameplay.json'));
assert.equal(anim.walk.duration,settings.walkCycleDuration);
for(const clip of [anim.walk,anim.fire]){
 const png=fs.readFileSync(path.join(root,clip.sheet));assert.equal(png.toString('ascii',1,4),'PNG');
 assert.equal(png.readUInt32BE(16),clip.columns*clip.cellWidth);assert.equal(png.readUInt32BE(20),clip.rows*clip.cellHeight);
 assert.equal(clip.grips.length,clip.frames);assert(clip.frames<=clip.columns*clip.rows);
}
for(const w of settings.weapons)assert(fs.existsSync(path.join(root,'weapons',w.art+'.png')));
for(const e of ['salt-porter','pipe-pilfer','sluice-keeper'])assert(fs.existsSync(path.join(root,'enemies',e+'.png')));
for(const e of ['harbor-reference','harbor-clean'])assert(fs.existsSync(path.join(root,'ui',e+'.png')));
console.log('PASS: project-relative links, runnable scripts, complete sprite grids, matching walk timing, and all runtime art.');
