const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/weapon-art.js'),'utf8'),sandbox);
const art=sandbox.window.BrineWeaponArt;assert.equal(Object.keys(art).length,6);
for(const [id,w] of Object.entries(art)){
 const png=fs.readFileSync(path.join(__dirname,'../web',w.image));
 assert.equal(png.readUInt32BE(16),w.width,id+' image width');assert.equal(png.readUInt32BE(20),w.height,id+' image height');
 for(const key of ['gripX','muzzleX','splitX'])assert(w[key]>=0&&w[key]<w.width,id+' '+key+' inside sprite');
 for(const key of ['gripY','muzzleY','splitY'])assert(w[key]>=0&&w[key]<w.height,id+' '+key+' inside sprite');
 assert(w.muzzleX>w.gripX,id+' faces forward');
 const reach=(w.muzzleX-w.gripX)*w.scale;assert(reach>=40&&reach<=65,id+' stable weapon reach');
 for(const key of ['damage','interval','unlock','speed'])assert(!Object.hasOwn(w,key),'art must not change balance');
}
console.log('PASS: six transparent comic gun dimensions, hand/muzzle/split bounds, consistent reach, no gameplay overrides.');
