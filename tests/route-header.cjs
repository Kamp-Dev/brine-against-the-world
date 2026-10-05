const assert=require('node:assert/strict'),R=require('../web/route-header.js');
let t=R.routeTiles(1,0,'fight');assert.deepEqual(t.map(x=>x.stage),[1,2,3,4,5,6]);assert.equal(t.filter(x=>x.current).length,1);assert.equal(t[4].boss,true);
t=R.routeTiles(165,164,'fight');assert.equal(t[2].boss,true);assert.equal(t[2].current,true);assert.equal(t[2].complete,false);
let html=R.routeMarkup(165,164,'fight');assert.match(html,/class="route-tile current boss"/);assert.match(html,/aria-current="step"/);assert.match(html,/stage-value"[^>]*><svg/);assert.doesNotMatch(html,/stage-value"[^>]*>165/);
t=R.routeTiles(165,165,'reward');assert.equal(t[2].complete,true);assert.match(R.routeMarkup(165,165,'reward'),/current cleared boss/);
t=R.routeTiles(166,165,'travel');assert.equal(t[1].boss,true);assert.equal(t[1].complete,true);
t=R.routeTiles(4,100,'fight');assert.equal(t[2].complete,false,'farming current fight is not marked won');
console.log('PASS: numbered route, boss replaces number, active boss highlight, win check and farming states.');
