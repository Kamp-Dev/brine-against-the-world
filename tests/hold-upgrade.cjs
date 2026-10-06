const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const handlers={},timers=new Map();let seq=0,purchases=0,remaining=20,current;
function listen(type,fn){(handlers[type]??=[]).push(fn)}
function emit(type,extra={}){const e={target:current,button:0,pointerId:1,isPrimary:true,clientX:5,clientY:5,detail:1,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra};for(const f of handlers[type]||[]){f(e);if(e.stopped)break}return e}
function button(clock=false){return {id:clock?'':'upgrade-damage',dataset:{id:'hot'},disabled:false,classList:{add(){},remove(){}},closest(){return this},getClientRects(){return [{}]},click(){const e=emit('click',{detail:0});if(!e.stopped&&!this.disabled){purchases++;remaining--;if(clock)current=button(true);current.disabled=remaining<=0}}}}
current=button();
vm.runInNewContext(fs.readFileSync('web/hold-upgrade.js','utf8'),{document:{hidden:false,addEventListener:listen,querySelector:()=>current,querySelectorAll:()=>[current]},window:{addEventListener:listen},setTimeout:(f,ms)=>{timers.set(++seq,{f,ms});return seq},clearTimeout:id=>timers.delete(id)});
function tick(){const [id,t]=timers.entries().next().value||[];if(t){timers.delete(id);t.f();return t.ms}}
emit('pointerdown');assert.equal(timers.values().next().value.ms,400);emit('pointerup');assert.equal(timers.size,0);assert.equal(emit('click').stopped,undefined);assert.equal(purchases,0);
emit('pointerdown');tick();tick();assert.equal(purchases,2);emit('pointerup');assert.equal(timers.size,0);assert.equal(emit('click').stopped,true);
emit('pointerdown');emit('pointermove',{clientY:30});assert.equal(timers.size,0);assert.equal(emit('click').stopped,true);
for(const type of ['pointercancel','blur','visibilitychange','scroll']){emit('pointerdown');emit(type);assert.equal(timers.size,0)}
current=button(true);remaining=3;const start=purchases;emit('pointerdown');tick();tick();tick();tick();assert.equal(purchases-start,3);assert.equal(timers.size,0);emit('pointerup');assert.equal(emit('click').stopped,true);
current=button();emit('pointerdown',{button:2});assert.equal(timers.size,0);
console.log('Hold upgrades: tap, repeat, release, scrolling, interruptions, replaced buttons and affordability pass');
