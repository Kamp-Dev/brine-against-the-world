(function(root){
'use strict';
const idleAfter=5*60*1000,cap=8*3600000;
function tracker(now=Date.now()){let activity=now,credited=0,last=now;return {touch(now){activity=now;credited=0;last=now;},step(now,rate,paused=false){const afk=now-activity>=idleAfter,from=Math.max(last,activity+idleAfter),elapsed=afk?Math.max(0,Math.min(now-from,cap-credited)):0;last=Math.max(last,now);credited+=elapsed;return {afk,capped:credited>=cap,gain:paused?0:Math.max(0,rate)*elapsed/60000};}};}
const api={tracker,idleAfter,cap};if(typeof module!=='undefined'){module.exports=api;return;}root.BrineAway=api;
})(typeof globalThis!=='undefined'?globalThis:this);
