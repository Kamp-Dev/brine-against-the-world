const {Encounter:C}=require('../web/combat-v3.js'),P=require('../web/progression.js'),J=require('../web/journey.js'),F=require('../web/tideglass.js'),B=require('../web/build-upgrades.js'),R=require('../web/reforge.js'),S=require('../web/scrapyard.js'),T=require('../web/pacing.js'),cfg=require('../web/gameplay.json');J.install(C,P);F.install(C,P,J);B.install(C,P,J,F);R.install(C);S.install(C);T.install(C);
function fresh(){const m=new C(cfg);m.journey.awaitingStart=false;let n=0;m.upgradeRoll=()=>((n++*73)%100)/100;return m;}
function late(){const m=fresh();m.best=2914;m.stage=2915;m.gold=58e6;m.xp=30*62**2;Object.assign(m.upgrades,{damage:60,shell:60,speed:60,focus:100,rupture:30,patch:20,plating:20,scavenging:40});m.weapon='boiler';m.mods.boiler=3;m.reforges.boiler=2;m.forge.overclock.power=10;m.playerHp=m.maxPlayerHp;m.startEncounter();m.ensureCalibrated();return m;}

require('../web/voyage-depth.js').install(C,S);module.exports={C,late,fresh};
