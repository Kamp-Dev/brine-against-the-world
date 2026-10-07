const assert=require('node:assert/strict'),{Encounter}=require('../web/combat-v3.js');
for(const state of ['travel','raise','reward','lower']){
 let m=new Encounter();m.state=state;m.charge=100;assert(m.volley());assert(m.pendingVolley);assert(!m.volley());m.startEncounter();assert(m.pendingVolley);m.state='fight';m.tick(.01,{x:200,y:460});assert.equal(m.pendingVolley,false);assert.equal(m.burst,3);
 m=new Encounter();m.state=state;m.ultimateCharge=100;assert(m.ultimate());assert(m.pendingUltimate);assert(!m.ultimate());assert.equal(m.ultimateTime,0);m.startEncounter();m.state='fight';m.tick(.01,{x:200,y:460});assert(m.ultimateActive);assert(m.ultimateTime>m.formRules.duration);assert(!m.pendingUltimate);
}
let m=new Encounter();m.state='travel';m.charge=m.ultimateCharge=100;m.volley();m.ultimate();const n=new Encounter();n.load(m.save());assert(n.pendingVolley&&n.pendingUltimate);n.state='fight';n.tick(.01,{x:200,y:460});assert(n.ultimateActive&&n.pendingVolley);n.ultimateTime=0;n.tick(.01,{x:200,y:460});assert(!n.pendingVolley&&n.burst===3);n.reset();assert(!n.pendingVolley&&!n.pendingUltimate);
m=new Encounter();m.state='defeat';m.charge=m.ultimateCharge=100;assert(!m.volley()&&!m.ultimate());
console.log('PASS: abilities queue across transitions, preserve full duration and saves, and do not double-activate');
