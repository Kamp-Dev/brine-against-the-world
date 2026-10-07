const J=BrineJourney;
const training=document.createElement('aside');training.id='field-training';training.hidden=true;
training.innerHTML='<div><strong></strong><button id="training-hide" aria-label="Minimize training">×</button></div><p></p><button id="training-show">SHOW ME</button><button id="training-skip">SKIP LESSON</button>';
$('screen').append(training);
const manualButton=document.createElement('button');manualButton.id='field-manual';manualButton.textContent='HARBOR FIELD MANUAL';$('progression-panel').before(manualButton);
const manual=document.createElement('section');manual.id='manual-content';manual.hidden=true;manualButton.after(manual);
let trainingMinimized=false,lessonKey='',manualKey='',journeySource=null;
manualButton.onclick=()=>{manual.hidden=!manual.hidden;manualKey='';refreshJourney();};
manual.onclick=e=>{const b=e.target.closest('[data-lesson]');if(!b)return;model.journey.replay=b.dataset.lesson;trainingMinimized=false;openHarbor('road');refreshJourney();};
$('training-hide').onclick=()=>{trainingMinimized=true;training.hidden=true;};
$('training-skip').onclick=()=>{const l=J.active(model);if(l)J.finish(model,l.id);trainingMinimized=false;persist();refresh();};
$('training-show').onclick=()=>{if(model.journey.awaitingStart){model.journey.awaitingStart=false;model.paused=false;persist();refresh();return;}const l=J.active(model);if(!l)return;model.journey.seen.push(l.id);if(l.target==='#nav-camp'){progressTab=['campaigns','overclock'].includes(l.id)?l.id:l.id==='ferry'&&model.progress.build[1]?'expeditions':l.id==='contracts'?'contracts':l.id==='lighthouse'&&model.progress.build[2]?'forms':'harbor';openHarbor('camp');}else if(l.target==='#nav-guns')openHarbor('guns');else{openHarbor('road');document.querySelector(l.target)?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}trainingMinimized=true;persist();refresh();};
function badge(el,kind){if(!el)return;el.dataset.journeyBadge=kind||'';}
function locked(el,id){const yes=!J.available(model,id);el.dataset.locked=String(yes);if(yes){el.disabled=true;el.title=J.requirement(id);el.setAttribute('aria-label',J.rules[id][0]+' locked. '+J.requirement(id));}else if(el.getAttribute('aria-label')?.includes(' locked. ')){el.removeAttribute('aria-label');}return yes;}
function refreshJourney(){if(!model.journey)return;if(journeySource!==model.journey){journeySource=model.journey;lessonKey='';manualKey='';trainingMinimized=false;}
 const l=J.scan(model),j=model.journey;$('training-show').textContent=j.awaitingStart?'START TRAINING':'SHOW ME';$('training-skip').disabled=!!j.awaitingStart;
 for(const k of Object.keys(model.upgrades)){const el=$('upgrade-'+k);if(locked(el,k)){el.querySelector('.stat').textContent=J.requirement(k);el.querySelector('.price').textContent='LOCKED';}badge(el,J.available(model,k)&&!j.seen.includes(k)?'NEW':'');}
 for(const k of model.settings.weapons.map(w=>w.id)){if(locked($(k),k))$(k).querySelector('span').textContent=J.requirement(k);badge($(k),J.available(model,k)&&!j.seen.includes(k)?'NEW':'');}
 if(locked($('volley'),'volley')){setActionLabel('volley','3-SHOT VOLLEY','LOCKED · '+J.requirement('volley'));$('volley').dataset.ready=false;}
 badge($('volley'),J.available(model,'volley')&&!j.seen.includes('volley')?'NEW':'');
 if(locked($('ultimate'),model.selectedForm)){$('ultimate').querySelector('small').textContent=J.requirement(model.selectedForm);$('ultimate').dataset.ready=false;}
 $('form-swipe-hint').firstChild.textContent=J.available(model,'samurai')?'SWIPE TO SELECT · ':'SAMURAI · CLEAR STRETCH 15 ';
 badge($('form-card'),['step-shell','samurai'].some(k=>J.available(model,k)&&!j.seen.includes(k))?'NEW':'');badge($('nav-guns'),model.settings.weapons.filter(w=>w.id!=='scrap').map(w=>w.id).some(k=>J.available(model,k)&&!j.seen.includes(k))?'NEW':'');
 locked($('workshop'),'workshop');$('gear-workshop').disabled=!J.available(model,'workshop');locked($('gear-workshop'),'workshop');
 const tabKeys={contracts:'contracts',mastery:'workshop',forms:'lighthouse',expeditions:'ferry'};
 for(const b of $('progress-tabs').children){const k=tabKeys[b.dataset.progressTab];if(k){b.disabled=!J.available(model,k);b.title=b.disabled?J.requirement(k):'';}}
 for(const b of $('progress-content').querySelectorAll('[data-progress-action]')){const a=b.dataset.progressAction,v=b.dataset.value;const k=a==='build'?['workshop','ferry','lighthouse'][+v]:a==='contract'?(v==='samurai'?'samurai':'contracts'):a==='claim'?'contracts':a==='dispatch'?'ferry':null;if(k&&!J.available(model,k)){b.disabled=true;b.textContent=J.requirement(k);}}
 const rewards=(typeof comicReady==='undefined'?[]:comicReady).filter(r=>r.tab!=='contracts'||J.available(model,'contracts'));
 badge($('nav-camp'),rewards.length?'!':['workshop','contracts','ferry','lighthouse'].some(k=>J.available(model,k)&&!j.seen.includes(k))?'NEW':'');badge($('next-goal'),rewards.length?'!':'');
 for(const b of $('progress-tabs').children)badge(b,rewards.some(r=>r.tab===b.dataset.progressTab)?'!':'');
 for(const b of $('progress-content').querySelectorAll('[data-progress-action="claim"],[data-progress-action="collect"]'))badge(b,!b.disabled?'!':'');
 if(l&&lessonKey!==l.id){lessonKey=l.id;trainingMinimized=false;training.querySelector('strong').textContent=l.title.toUpperCase();training.querySelector('p').textContent=l.text;}
 training.hidden=!l||trainingMinimized||!$('drawer').hidden||!$('welcome').hidden||!$('loading').hidden;
 document.querySelectorAll('.training-target').forEach(el=>el.classList.remove('training-target'));if(l&&!training.hidden)document.querySelector(l.target)?.classList.add('training-target');
 if(!rewards.length){$('goal-eyebrow').textContent=l?'TRAINING':'NEXT UNLOCK';const next=Object.keys(J.rules).find(k=>!J.available(model,k));$('goal-detail').textContent=l?l.title+' · tap for help':next?J.rules[next][0]+' · '+J.requirement(next):P.next(model.progress);$('next-goal').dataset.ready=false;$('next-goal').setAttribute('aria-label',$('goal-detail').textContent);}
 const mk=JSON.stringify([j.done,j.seen,model.best,model.level]);if(!manual.hidden&&manualKey!==mk){manualKey=mk;BrineUI.patch(manual,'<p>Practice at your pace. Skipping a lesson never bypasses an unlock.</p>'+J.lessons.map(v=>`<article class="goal-card"><h3>${v.title}</h3><p>${v.text}</p><button data-lesson="${v.id}" ${J.available(model,v.id)?'':'disabled'}>${J.available(model,v.id)?j.done.includes(v.id)?'REPLAY LESSON':'START LESSON':J.requirement(v.id)}</button></article>`).join(''));}
}
const journeyRefresh=refresh;refresh=function(){journeyRefresh();refreshJourney();};
const journeyGoal=$('next-goal').onclick;$('next-goal').onclick=()=>{if(comicReady.some(r=>r.tab!=='contracts'||J.available(model,'contracts')))journeyGoal();else if(J.active(model)){trainingMinimized=false;openHarbor('road');refreshJourney();}else journeyGoal();};
document.addEventListener('click',e=>{const mapping={'nav-guns':model.settings.weapons.filter(w=>w.id!=='scrap').map(w=>w.id),'volley':['volley'],'form-card':[model.selectedForm],'nav-camp':['workshop','contracts','ferry','lighthouse']};for(const k of Object.keys(model.upgrades))mapping['upgrade-'+k]=[k];for(const [id,keys]of Object.entries(mapping))if(e.target.closest('#'+id))for(const k of keys)if(J.available(model,k)&&!model.journey.seen.includes(k))model.journey.seen.push(k);},true);
// Keep the reviewer's previous save recoverable; do not reset other players.
const restore=document.createElement('button');restore.id='restore-review-save';restore.textContent='RESTORE PREVIOUS SAVE';$('reset').after(restore);
try{restore.hidden=!localStorage.getItem(SAVE_KEY+'-backup');}catch{restore.hidden=true;}
$('confirm-reset').onclick=()=>{try{localStorage.setItem(SAVE_KEY+'-backup',JSON.stringify(model.save()));restore.hidden=false;}catch{saveNote='Backup could not be saved; reset cancelled.';return;}model.reset();model.paused=true;model.journey.awaitingStart=true;persist();$('reset-confirm').hidden=true;$('welcome').hidden=true;manual.hidden=true;openHarbor('road');};
restore.onclick=()=>{try{const old=JSON.parse(localStorage.getItem(SAVE_KEY+'-backup'));if(model.load(old)){persist();openHarbor('road');}}catch{saveNote='Previous save could not be restored.';}};
