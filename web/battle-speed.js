(function(root){
 'use strict';
 const valid=v=>[1,2,3].includes(Number(v))?Number(v):1;
 function stepper(){let bank=0;return {advance(dt,speed,model,origin){if(model.paused||model.state==='defeat'){bank=0;return;}bank+=Math.max(0,Math.min(.1,Number(dt)||0))*valid(speed);const step=1/120;while(bank+1e-10>=step){model.tick(step,origin());bank-=step;}},reset(){bank=0;}};}
 if(typeof module!=='undefined'){module.exports={valid,stepper};return;}
 let speed=1;try{speed=valid(localStorage.getItem('brine-battle-speed'));}catch{}
 const away=root.BrineAway.tracker();let afk=false,lastModel=null;const timer=stepper(),button=document.getElementById('battle-speed'),choice=document.getElementById('speed-choice');
 function paint(){button.textContent=(afk?1:speed)+'x';button.title=afk?'AFK: 25% of estimated 1x road income. Interact to resume.':'Change battle speed';button.dataset.fast=!afk&&speed>1;button.dataset.afk=String(afk);button.setAttribute('aria-label','Battle speed '+(afk?1:speed)+' times. Activate to change speed.');choice.value=String(speed);}
 function set(value){speed=valid(value);try{localStorage.setItem('brine-battle-speed',speed);}catch{}paint();}
 button.onclick=()=>set(speed===3?1:speed+1);choice.onchange=()=>set(choice.value);
 root.BrineSpeed={advance(dt,model,origin){lastModel=model;const result=away.step(Date.now(),model.offlineRate,model.paused);if(afk!==result.afk){afk=result.afk;timer.reset();paint();}if(afk){model.gold=Math.min(Number.MAX_VALUE,model.gold+result.gain);return;}timer.advance(dt,speed,model,origin);},reset:()=>timer.reset()};
 function active(){if(lastModel&&afk){const r=away.step(Date.now(),lastModel.offlineRate,lastModel.paused);lastModel.gold=Math.min(Number.MAX_VALUE,lastModel.gold+r.gain);}away.touch(Date.now());afk=false;timer.reset();paint();}
 for(const event of ['pointerdown','keydown','wheel'])document.addEventListener(event,active,{passive:true});
 document.addEventListener('visibilitychange',()=>{timer.reset();away.touch(Date.now());afk=false;paint();});paint();
})(typeof globalThis!=='undefined'?globalThis:this);
