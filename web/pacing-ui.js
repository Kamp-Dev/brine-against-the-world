(()=>{
 let checking=false;
 const prior=refresh;refresh=function(){if(ready&&!checking&&!model.pacing?.enabled&&model.best>=50){checking=true;try{try{if(!localStorage.getItem(SAVE_KEY+'-before-pacing'))localStorage.setItem(SAVE_KEY+'-before-pacing',JSON.stringify(model.save()));}catch{}if(model.ensureCalibrated())persist();}finally{checking=false;}}prior();};
 // Older trial links now open the same default experience.
 if(new URLSearchParams(location.search).has('pacing'))history.replaceState(null,'',location.pathname);
})();
