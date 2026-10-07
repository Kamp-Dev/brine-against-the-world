const assert=require('node:assert/strict'),{Encounter}=require('../web/combat-v3.js'),P=require('../web/progression.js'),J=require('../web/journey.js'),F=require('../web/tideglass.js'),B=require('../web/build-upgrades.js'),S=require('../web/scrapyard.js'),settings=require('../web/gameplay.json');
J.install(Encounter,P);F.install(Encounter,P,J);B.install(Encounter,P,J,F);S.install(Encounter);
function setup(){const m=new Encounter(settings);m.best=2000;m.gold=1e8;m.state='fight';m.hp=m.maxHp=1e9;m.playerHp=m.maxPlayerHp/2;return m;}
let m=setup();m.best=0;assert(!m.shopBuy('shell','deep'));m.best=2000;const gold=m.gold;assert(m.shopBuy('shell','deep'));assert.equal(m.gold,gold-1200000);assert(!m.shopBuy('shell','deep'));assert(m.shopEquip('shell','deep'));assert(!m.shopEquip('weapon','deep'));assert(!m.shopBuy('bogus','deep'));assert(!m.shopEquip('mod','whoopee'));
assert(m.shopBuy('mod','sinker'));const interval=m.rawInterval;assert(m.shopEquip('mod','sinker'));assert.equal(m.rawInterval,interval*1.2);assert(m.shopEquip('mod','none'));assert.equal(m.rawInterval,interval);
const saved=m.save(1000),loaded=setup();assert(loaded.load(saved,1000));assert.equal(loaded.shop.shell,'deep');assert(S.owned(loaded,'mod','sinker'));const old={...saved};delete old.shop;assert(loaded.load(old,1000));assert.equal(loaded.shop.shell,'rust');
const damaged={...saved,shop:{version:1,owned:['mod:fake','weapon:deep'],shell:'deep',weaponPaint:'deep',mods:{scrap:'duck'}}};assert(loaded.load(damaged,1000));assert.equal(loaded.shop.shell,'rust');assert.equal(loaded.shop.weaponPaint,'deep');assert.equal(loaded.shop.mods.scrap,undefined);
m=setup();m.shopBuy('mod','whoopee');m.shopEquip('mod','whoopee');const damage=[];for(let i=0;i<4;i++){const before=m.hp;m.hitEnemy(100,'scrap',460);damage.push(before-m.hp);}assert.equal(damage[3],Math.round(damage[0]*1.45));const count=m.shopContacts;m.hitEnemy(100,'scrap',460,1,true);assert.equal(m.shopContacts,count);m.hitEnemy(100,'melee',460);assert.equal(m.shopContacts,count);
m=setup();m.shopBuy('mod','duck');m.shopEquip('mod','duck');const hp=m.playerHp;for(let i=0;i<5;i++)m.hitEnemy(10,'scrap',460);assert.equal(m.playerHp,hp+Math.round(m.maxPlayerHp*.02));
m=setup();m.shopBuy('mod','confetti');m.shopEquip('mod','confetti');const reward=m.reward;m.hp=1;const before=m.gold;m.hitEnemy(100,'scrap',460);assert.equal(m.gold-before,reward+Math.floor(reward*.15));
m=setup();m.shopBuy('mod','confetti');m.shopEquip('mod','confetti');m.enterCampaign(0,1);m.state='fight';m.hp=1;const campaignGold=m.gold;m.hitEnemy(100,'scrap',460);assert.equal(m.gold,campaignGold);
const pixels=new Uint8ClampedArray([205,99,45,255,14,22,23,255,246,232,198,255,0,0,0,0,230,180,150,100]);const original=[...pixels];S.recolor(pixels,[40,137,151]);assert.notDeepEqual([...pixels.slice(0,3)],original.slice(0,3));assert.deepEqual([...pixels.slice(4,16)],original.slice(4,16));for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],original[i]);
console.log('PASS: shop ownership, costs, unlocks, save migration, mod effects, campaign isolation and paint alpha/ink/cream preservation');
const captions=setup();captions.shopBuy('mod','duck');captions.shopEquip('mod','duck');let wall=100;captions.shopNow=()=>wall;captions.shopRandom=()=>0;
captions.hitEnemy(10,'scrap',460);assert.equal(captions.shopCaptions.length,0);
wall=10099;captions.hitEnemy(10,'scrap',460);assert.equal(captions.shopCaptions.length,0);
wall=10100;captions.hitEnemy(10,'scrap',460);assert.equal(captions.shopCaptions.length,1);assert.equal(captions.shopCaptions[0].mod,'duck');
for(let i=0;i<300;i++)captions.hitEnemy(1,'scrap',460);assert.equal(captions.shopCaptions.length,1,'High hit rates do not spam captions');
wall=20100;captions.shopRandom=()=>.9;captions.hitEnemy(1,'scrap',460);assert.equal(captions.shopCaptions.length,1,'Random check can defer a caption');
captions.shopRandom=()=>0;captions.hitEnemy(1,'scrap',460);assert.equal(captions.shopCaptions.length,2);
console.log('PASS: captions require ten real seconds and random hit eligibility');

m=setup();m.shopBuy('mod','confetti');m.shopEquip('mod','confetti');m.hitEnemy(10,'scrap',460);assert(m.effects.some(e=>e.type==='confetti-burst'&&e.duration===.48));assert(!m.effects.some(e=>e.type==='shop-mod'&&e.mod==='confetti'));
console.log('PASS: supplied confetti burst appears on ordinary hits without old confetti particles');
