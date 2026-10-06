const assert=require('node:assert/strict');
const {Encounter}=require('../web/combat-v3.js'),P=require('../web/progression.js'),J=require('../web/journey.js'),settings=require('../web/gameplay.json');J.install(Encounter,P);
function fight(stage,weapon,form,before=false){let m=new Encounter(settings);m.best=210;m.stage=stage;m.xp=30*26**2;m.upgrades.damage=18;m.upgrades.shell=19;m.upgrades.speed=17;m.weapon=weapon;m.selectedForm=form||'step-shell';m.playerHp=m.maxPlayerHp;m.charge=100;m.ultimateCharge=100;m.startEncounter();if(before)m.hp=m.maxHp=Math.round(m.maxHp*12.52);let hp=m.maxHp,t=0;for(;t<180&&m.kills===0&&m.state!=='defeat';t+=.05){if(form){m.volley();m.ultimate();}m.tick(.05,{x:200,y:460});}return {stage,enemy:m.enemy.name,weapon,mode:form||'gun',before,hp,outcome:m.kills?'win':m.state,time:+t.toFixed(1),remaining:m.hp,health:m.playerHp};}

for(const stage of [1,5,15,50,200,210,1000]){const m=new Encounter(settings);m.stage=stage;m.startEncounter();assert.equal(m.maxHp,Math.round((settings.enemyHealth+(stage-1)*9)*m.enemy.health),'Training must not multiply combat health');}
const rows=[];for(const stage of [200,204,205,206,207,208,209,210])for(const form of [null,'step-shell','samurai'])rows.push(fight(stage,'scrap',form));
for(const stage of [200,204,205,206,207,208,209,210])for(const form of ['step-shell','samurai'])assert.equal(rows.find(r=>r.stage===stage&&r.mode===form).outcome,'win');
assert.equal(rows.find(r=>r.stage===204&&r.mode==='gun').outcome,'win','Mender must not outheal this farming loadout');
assert.equal(fight(210,'scrap','samurai',true).outcome,'defeat','Reproduce the reported regression');
console.log('PASS: no onboarding HP multiplier at stages 1-1000; stage 200-210 melee wins, Mender farming, and reproduction of previous stage-210 defeat. Representative level 27 build, not a player save.');
console.log(JSON.stringify(rows.filter(r=>[204,210].includes(r.stage))));
