const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),web=path.join(root,'web');
const sandbox={Image:class {constructor(){this.complete=true;this.naturalWidth=1536;}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(web,'progression-art.js'),'utf8'),sandbox);
for(const name of ['workshop','ferry','lighthouse']){
 const data=fs.readFileSync(path.join(web,'restoration',name+'.png'));
 assert.equal(data.readUInt32BE(16),1536);assert.equal(data.readUInt32BE(20),1024);assert.equal(data[25],6,'RGBA transparency required');
 assert.deepEqual(data,fs.readFileSync(path.join(root,'unity/BrineAgainstTheWorld/Assets/Brine/Resources/restoration',name+'.png')));
}
for(let level=0;level<=3;level++){
 const draws=[],context=new Proxy({drawImage:(...args)=>draws.push(args)},{get:(o,k)=>o[k]||(()=>{})});
 sandbox.drawHarborGrowth(context,{progress:{build:[level,level,level],district:[false,false,false]},distance:100,route:0,boss:false});
 assert.equal(draws.length,level?3:0);
 for(const d of draws){assert.equal(d[1],(level-1)*512);assert.equal(d[3],512);assert.ok(d[2]+d[4]<=1024);assert.ok(d.slice(1).every(Number.isFinite));}
 for(let type=0;type<3;type++){const html=sandbox.harborBuildingArt(type,level);assert.ok(level?html.includes('clip-path='):!html.includes('<image'));}
}
console.log('PASS: restoration level crops, transparent atlases, hidden unbuilt scenery, finite placement and browser/Unity art parity.');
