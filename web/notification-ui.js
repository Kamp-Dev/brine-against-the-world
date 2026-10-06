const comicTracker=BrineNotifications.create(),comicQueue=[];
let comicCurrent=null,comicUntil=0,comicReady=[],comicPaused=false,comicSource=null;
const comicToast=document.createElement('aside');comicToast.id='comic-notice';comicToast.hidden=true;
comicToast.innerHTML='<span class="comic-seal reward-crate" aria-hidden="true"></span><div class="comic-copy" role="status" aria-live="polite" aria-atomic="true"><strong></strong><p></p></div><button class="comic-open"></button><button class="comic-close" aria-label="Dismiss notification">×</button>';
$('screen').append(comicToast);
function openComicReward(tab){progressTab=tab;openHarbor('camp');progressKey='';refreshProgressionUI();}
function dismissComic(){comicCurrent=null;comicToast.hidden=true;}
comicToast.querySelector('.comic-close').onclick=dismissComic;
comicToast.querySelector('.comic-open').onclick=()=>{const event=comicCurrent;if(!event)return;const collected=BrineNotifications.claim(model.progress,event);dismissComic();if(collected){persist();progressKey='';}refresh();};
comicToast.onpointerenter=()=>comicPaused=true;comicToast.onpointerleave=()=>{comicPaused=false;comicUntil=performance.now()+4000;};
comicToast.onfocusin=()=>comicPaused=true;comicToast.onfocusout=()=>{comicPaused=false;comicUntil=performance.now()+4000;};
function refreshComicNotifications(){
 if(!model.progress)return;
 if(comicSource!==model.progress){comicSource=model.progress;comicQueue.length=0;dismissComic();}
 const result=comicTracker.scan(model.progress),allowed=e=>e.tab!=='contracts'||typeof BrineJourney==='undefined'||BrineJourney.available(model,'contracts');const events=result.events.filter(allowed),available=result.available.filter(allowed);comicReady=available;
 comicQueue.push(...events);
 // A collected reward must not leave a stale collection prompt in the queue.
 for(let i=comicQueue.length-1;i>=0;i--)if(comicQueue[i].collect&&!available.some(x=>x.id===comicQueue[i].id))comicQueue.splice(i,1);
 if(comicCurrent?.collect&&!available.some(x=>x.id===comicCurrent.id))dismissComic();
 if(!document.hidden&&!comicPaused&&!comicToast.contains(document.activeElement)&&performance.now()>comicUntil)dismissComic();
 if(!comicCurrent&&comicQueue.length&&!document.hidden&&$('welcome').hidden&&$('loading').hidden){
  comicCurrent=comicQueue.shift();comicUntil=performance.now()+8000;comicToast.dataset.kind=comicCurrent.collect?'ready':'done';
  comicToast.querySelector('strong').textContent=comicCurrent.collect?'COLLECT':'COMPLETE';
  comicToast.querySelector('p').textContent=comicCurrent.detail;
  comicToast.querySelector('.comic-open').textContent=comicCurrent.collect?'COLLECT':'DISMISS';
  comicToast.querySelector('.comic-open').setAttribute('aria-label',comicCurrent.title+' '+comicCurrent.detail+(comicCurrent.collect?' — collect reward':' — dismiss'));
  comicToast.title=comicCurrent.title+' '+comicCurrent.detail;
  comicToast.hidden=false;
 }
 if(available.length){$('goal-eyebrow').textContent=available.length+' REWARD'+(available.length===1?'':'S')+' READY';$('goal-detail').textContent=available[0].detail+' · tap to collect';$('next-goal').dataset.ready=true;$('next-goal').setAttribute('aria-label','Open ready rewards: '+available[0].detail);}
}



