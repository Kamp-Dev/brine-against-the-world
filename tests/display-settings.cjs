const assert=require('node:assert/strict'),{sizing}=require('../web/display-settings.js');
for(const [w,h] of [[390,844],[393,852],[360,800],[375,667],[430,932],[320,568]]){
 const width=Math.min(w,h*.5625),s=sizing(width,h,3,'high');
 assert(Math.abs(s.height*width/450-h)<.01,'fills available portrait height');
 assert(Math.abs((800+s.extra)*width/450-h)<.01,'controls finish at bottom');
 assert(Math.abs(s.width/s.pixelsHigh-width/h)<.002,'render preserves aspect ratio');
 assert(s.width<=2160&&s.pixelsHigh<=3840,'bounded canvas memory');
}
assert.equal(sizing(390,844,3,'performance').fps,30);assert.equal(sizing(390,844,3,'high').fps,60);
assert(sizing(390,844,3,'high').width>sizing(390,844,3,'performance').width);
assert(sizing(430,932,4,'ultra').pixelsHigh<=3840);assert.equal(sizing(450,800,1,'auto').extra,0);
console.log('PASS: phone aspect ratios, full-height layout, undistorted rendering, quality resolution and FPS limits.');
