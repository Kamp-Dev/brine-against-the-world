const comicTracker=BrineNotifications.create(),comicQueue=[];
let comicCurrent=null,comicUntil=0,comicReady=[],comicPaused=false,comicSource=null,comicCampaign=null;
const comicDismissed=new Set();
const comicToast=document.createElement('aside');comicToast.id='comic-notice';comicToast.hidden=true;
comicToast.innerHTML='<span class="comic-seal reward-crate" aria-hidden="true"></span><div class="comic-copy" role="status" aria-live="polite" aria-atomic="true"><strong></strong><p></p></div><button class="comic-open"></button><button class="comic-close" aria-label="Dismiss notification">×</button>';
$('screen').append(comicToast);
function openComicReward(tab){progressTab=tab;openHarbor('camp');progressKey='';refreshProgressionUI();}
function dismissComic(manual=false){if(manual&&comicCurrent?.id)comicDismissed.add(comicCurrent.id);comicCurrent=null;comicToast.hidden=true;}
comicToast.querySelector('.comic-close').onclick=()=>dismissComic(true);
comicToast.querySelector('.comic-open').onclick=()=>{
 const event=comicCurrent;if(!event)return;
 if(event.repeatCampaign){const r=event.repeatCampaign;dismissComic();showCampaignEntry(r.id,r.tier);return;}
 if(!event.collect&&!event.repeat&&event.repeatCrew===undefined){dismissComic(true);refresh();return;}
 if(event.repeat||event.repeatCrew!==undefined){
  const ok=event.repeat?P.selectContract(model.progress,event.repeat):P.dispatch(model.progress,event.repeatCrew,Date.now());
  if(ok){dismissComic();persist();progressKey='';}refresh();return;
 }
 if(event.tab==='campaigns'){const r=model.forge.run;if(r?.complete&&model.claimCampaign()){comicCurrent={...event,collect:false,title:'CARGO COLLECTED!',repeatCampaign:{id:r.id,tier:r.tier}};comicUntil=performance.now()+8000;renderComicTicket();persist();forgeKey='';}else dismissComic();refresh();return;}
 const crew=model.progress.expedition?.id;
 if(BrineNotifications.claim(model.progress,event)){
  comicCurrent={...event,collect:false,title:'REWARD COLLECTED!',repeat:event.tab==='contracts'?event.id.slice('contract:'.length):undefined,repeatCrew:event.tab==='expeditions'?crew:undefined};
  comicUntil=performance.now()+8000;renderComicTicket();persist();progressKey='';
 }else dismissComic();
 refresh();
};
comicToast.onpointerenter=()=>comicPaused=true;comicToast.onpointerleave=()=>{comicPaused=false;comicUntil=performance.now()+4000;};
comicToast.onfocusin=()=>comicPaused=true;comicToast.onfocusout=()=>{comicPaused=false;comicUntil=performance.now()+4000;};
function refreshComicNotifications(){
 if(!model.progress)return;
 if(comicSource!==model.progress){comicSource=model.progress;comicQueue.length=0;comicDismissed.clear();comicCampaign=null;dismissComic();}
 const result=comicTracker.scan(model.progress),available=[...result.available],events=[...result.events];
 const run=model.forge?.run;
 if(run?.complete){const event={id:'campaign:'+run.id+':'+run.tier,title:'CAMPAIGN COMPLETE!',detail:BrineTideglass.campaigns[run.id].name,tab:'campaigns',collect:true};available.push(event);}
 if(comicCampaign?.complete&&!run)events.push({id:'campaign:'+comicCampaign.id+':'+comicCampaign.tier,title:'CARGO COLLECTED!',detail:BrineTideglass.campaigns[comicCampaign.id].name,tab:'campaigns',repeatCampaign:{id:comicCampaign.id,tier:comicCampaign.tier}});
 comicCampaign=run?{id:run.id,tier:run.tier,complete:run.complete}:null;
 comicReady=available;
 for(const id of comicDismissed)if(!available.some(e=>e.id===id)&&comicCurrent?.id!==id)comicDismissed.delete(id);
 // Ready rewards remain represented until collected or explicitly dismissed.
 for(const event of [...events,...available]){
  if(comicDismissed.has(event.id))continue;
  if(event.id&&comicCurrent?.id===event.id){
   if(comicCurrent.collect&&!event.collect){comicCurrent=event;comicUntil=performance.now()+8000;renderComicTicket();}
   continue;
  }
  const queued=event.id?comicQueue.findIndex(e=>e.id===event.id):-1;
  if(queued>=0){if(!event.collect)comicQueue[queued]=event;continue;}
  comicQueue.push(event);
 }
 for(let i=comicQueue.length-1;i>=0;i--)if(comicQueue[i].collect&&!available.some(x=>x.id===comicQueue[i].id))comicQueue.splice(i,1);
 if(comicCurrent?.collect&&!available.some(x=>x.id===comicCurrent.id))dismissComic();
 if(comicCurrent&&!comicCurrent.collect&&performance.now()>comicUntil)dismissComic();
 if(!comicCurrent&&comicQueue.length&&!document.hidden&&$('welcome').hidden&&$('loading').hidden){
  // Claimable rewards take priority over informational milestones.
  const readyIndex=comicQueue.findIndex(e=>e.collect);
  comicCurrent=comicQueue.splice(readyIndex<0?0:readyIndex,1)[0];comicUntil=performance.now()+8000;renderComicTicket();comicToast.hidden=false;
 }

 if(available.length){$('goal-eyebrow').textContent=available.length+' REWARD'+(available.length===1?'':'S')+' READY';$('goal-detail').textContent=available[0].detail+' · tap to collect';$('next-goal').dataset.ready=true;$('next-goal').setAttribute('aria-label','Open ready rewards: '+available[0].detail);}
}




function renderComicTicket(){
 comicToast.dataset.kind=comicCurrent.collect?'ready':'done';
  comicToast.querySelector('strong').textContent=comicCurrent.collect?'COLLECT':(comicCurrent.repeat||comicCurrent.repeatCrew!==undefined||comicCurrent.repeatCampaign)?'↻ REPEAT':'COMPLETE';
  comicToast.querySelector('p').textContent=comicCurrent.detail;
  comicToast.querySelector('.comic-open').textContent=comicCurrent.collect?'COLLECT':(comicCurrent.repeat||comicCurrent.repeatCrew!==undefined||comicCurrent.repeatCampaign)?'REPEAT':'DISMISS';
  comicToast.querySelector('.comic-open').setAttribute('aria-label',comicCurrent.title+' '+comicCurrent.detail+(comicCurrent.collect?' — collect reward':(comicCurrent.repeat||comicCurrent.repeatCrew!==undefined||comicCurrent.repeatCampaign)?' — repeat completed activity':' — dismiss'));
  comicToast.title=comicCurrent.title+' '+comicCurrent.detail;
}
