(function(root){
 'use strict';
 const valid=v=>[1,2,3].includes(Number(v))?Number(v):1;
 function stepper(){let bank=0;return {advance(dt,speed,model,origin){if(model.paused||model.state==='defeat'){bank=0;return;}bank+=Math.max(0,Math.min(.1,Number(dt)||0))*valid(speed);const step=1/120;while(bank+1e-10>=step){model.tick(step,origin());bank-=step;}},reset(){bank=0;}};}
 if(typeof module!=='undefined'){module.exports={valid,stepper};return;}
 let speed=1;try{speed=valid(localStorage.getItem('brine-battle-speed'));}catch{}
 const timer=stepper(),button=document.getElementById('battle-speed'),choice=document.getElementById('speed-choice');
 function paint(){button.textContent=speed+'x';button.dataset.fast=speed>1;button.setAttribute('aria-label','Battle speed '+speed+' times. Activate to change speed.');choice.value=String(speed);}
 function set(value){speed=valid(value);try{localStorage.setItem('brine-battle-speed',speed);}catch{}paint();}
 button.onclick=()=>set(speed===3?1:speed+1);choice.onchange=()=>set(choice.value);
 root.BrineSpeed={advance(dt,model,origin){timer.advance(dt,speed,model,origin);},reset:()=>timer.reset()};
 document.addEventListener('visibilitychange',()=>timer.reset());paint();
})(typeof globalThis!=='undefined'?globalThis:this);
