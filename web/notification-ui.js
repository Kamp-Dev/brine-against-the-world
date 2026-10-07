const comicTracker=BrineNotifications.create(),comicQueue=[];
let comicCurrent=null,comicUntil=0,comicReady=[],comicPaused=false,comicSource=null,comicCampaign=null;
const comicDismissed=new Set();
const comicToast=document.createElement('aside');comicToast.id='comic-notice';comicToast.hidden=true;
comicToast.innerHTML='<span class="comic-seal reward-crate" aria-hidden="true"></span><div class="comic-copy" role="status" aria-live="polite" aria-atomic="true"><strong></strong><p></p></div><button class="comic-open"></button><button class="comic-repeat" aria-label="Collect reward and repeat">↻</button><button class="comic-close" aria-label="Dismiss notification">×</button>';
$('screen').append(comicToast);
function openComicReward(tab){progressTab=tab;openHarbor('camp');progressKey='';refreshProgressionUI();}
function dismissComic(manual=false){if(manual&&comicCurrent?.id)comicDismissed.add(comicCurrent.id);comicCurrent=null;comicToast.hidden=true;}
comicToast.querySelector('.comic-close').onclick=()=>dismissComic(true);
function collectComic(repeat=false){
 const event=comicCurrent;if(!event)return;
 if(!event.collect){dismissComic(true);refresh();return;}
 const crew=model.progress.expedition?.id,run=model.forge?.run;
 const campaign=event.tab==='campaigns'&&run?.complete?{id:run.id,tier:run.challengeTier||run.tier,challenge:run.challenge??null}:null;
 const claimed=campaign?model.claimCampaign():BrineNotifications.claim(model.progress,event);
 if(claimed){
  dismissComic();
  if(repeat){if(campaign)showCampaignEntry(campaign.id,campaign.tier,campaign.challenge);else if(event.tab==='contracts')P.selectContract(model.progress,event.id.slice('contract:'.length));else if(crew!==undefined)P.dispatch(model.progress,crew,Date.now());}
  persist();progressKey='';forgeKey='';
 }else dismissComic();
 refresh();
}
comicToast.querySelector('.comic-open').onclick=()=>collectComic(false);
comicToast.querySelector('.comic-repeat').onclick=()=>collectComic(true);
comicToast.onpointerenter=()=>comicPaused=true;comicToast.onpointerleave=()=>{comicPaused=false;comicUntil=performance.now()+4000;};
comicToast.onfocusin=()=>comicPaused=true;comicToast.onfocusout=()=>{comicPaused=false;comicUntil=performance.now()+4000;};
function refreshComicNotifications(){
 if(!model.progress)return;
 if(comicSource!==model.progress){comicSource=model.progress;comicQueue.length=0;comicDismissed.clear();comicCampaign=null;dismissComic();}
 const result=comicTracker.scan(model.progress),available=[...result.available],events=result.events.filter(e=>!e.repeat&&e.repeatCrew===undefined&&e.title!=='REWARD COLLECTED!'&&e.title!=='CARGO COLLECTED!');
 const run=model.forge?.run;
 if(run?.complete){const event={id:'campaign:'+run.id+':'+run.tier+':'+(run.challengeTier||0),title:'CAMPAIGN COMPLETE!',detail:run.challenge===undefined?BrineTideglass.campaigns[run.id].name:BrineDepth.challenges[run.challenge].name,tab:'campaigns',collect:true};available.push(event);}

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
 comicToast.querySelector('strong').textContent=comicCurrent.collect?'COLLECT':'COMPLETE';
 comicToast.querySelector('p').textContent=comicCurrent.detail;
 comicToast.querySelector('.comic-open').textContent=comicCurrent.collect?'COLLECT':'DISMISS';
 comicToast.querySelector('.comic-open').setAttribute('aria-label',comicCurrent.title+' '+comicCurrent.detail+(comicCurrent.collect?' — collect reward':' — dismiss'));
 const repeat=comicToast.querySelector('.comic-repeat');repeat.hidden=!comicCurrent.collect||!['contracts','expeditions','campaigns'].includes(comicCurrent.tab);repeat.title='Collect and repeat';
 comicToast.title=comicCurrent.title+' '+comicCurrent.detail;
}
