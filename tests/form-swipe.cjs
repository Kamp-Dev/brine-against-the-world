const assert=require('node:assert/strict');const {attachFormSwipe}=require('../web/form-swipe.js');
const listeners={};let captures=new Set(),selected='step-shell',active=false,activations=0;
const el={addEventListener:(k,fn)=>listeners[k]=fn,setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
attachFormSwipe(el,d=>{if(!active)selected=d>0?'samurai':'step-shell'});
function event(type,x,y=10,extra={}){let blocked=false;listeners[type]({button:0,pointerId:1,clientX:x,clientY:y,preventDefault(){blocked=true},stopImmediatePropagation(){blocked=true},...extra});if(type==='click'&&!blocked)activations++;return blocked;}
event('pointerdown',150);event('pointermove',70);event('pointerup',70);assert.equal(selected,'samurai');assert(event('click',70));assert.equal(activations,0);
event('pointerdown',70);event('pointerup',71);assert(!event('click',71));assert.equal(activations,1);
active=true;event('pointerdown',70);event('pointermove',150);event('pointerup',150);event('click',150);assert.equal(selected,'samurai');assert.equal(activations,1);
active=false;event('pointerdown',150);event('pointermove',152,90);event('pointercancel',152);assert.equal(selected,'samurai');
event('keydown',0,0,{key:'ArrowLeft'});assert.equal(selected,'step-shell');event('wheel',0,0,{deltaX:50,deltaY:0,timeStamp:1000});assert.equal(selected,'samurai');assert.equal(captures.size,0);
console.log('PASS: swipe selects without firing, taps activate, active form stays locked, vertical/cancel gestures do not select, keyboard and horizontal wheel select.');
