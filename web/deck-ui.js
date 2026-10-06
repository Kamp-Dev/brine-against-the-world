// Five destinations share one unchanged battle canvas and action rail.
(()=>{
 for(const [id,art] of Object.entries(BrineWeaponArt))$(id).querySelector('img').src=art.image;
 const screen=$('screen'),drawer=$('drawer'),nav=$('nav-road').parentElement;
 screen.dataset.layout='deck';BrineDisplay.apply();
 const backing=document.createElement('div');backing.id='deck-backing';screen.append(backing);
 let page='road',deckKey='',drawing=false;
 const names={road:'ROAD',guns:'GEAR',build:'BUILD',voyage:'VOYAGE',camp:'HARBOR',settings:'SETTINGS',journal:'JOURNAL'};
 const groups={build:['overclock','mastery','forms'],voyage:['campaigns','expeditions','districts'],camp:['harbor','contracts'],journal:['guide']};
 const oldProgress=refreshProgressionUI;
 const home=document.createElement('section');home.id='deck-home';screen.append(home);
 home.append($('loadout-cards'),$('next-goal'));
 const slots=document.createElement('button');slots.id='deck-slots';slots.onclick=()=>select('guns');home.append(slots);
 const bank=document.createElement('div');bank.id='deck-bank';screen.append(bank);
 const tools=document.createElement('div');tools.id='deck-tools';tools.innerHTML='<button aria-label="Open journal">?</button><button aria-label="Open settings">⚙</button>';screen.append(tools);
 tools.children[0].onclick=()=>select('journal');tools.children[1].onclick=()=>select('settings');
 for(const [id,label,icon] of [['build','BUILD','M7 3 11 7 7 11 3 7 1 12 6 17 11 16 26 31 31 26 16 11 17 6 12 1Z'],['voyage','VOYAGE','M3 29 16 3 16 29ZM20 5 32 29H20ZM2 32H34L29 37H7Z']]){const b=document.createElement('button');b.id='nav-'+id;b.className='deck-nav';b.innerHTML='<svg viewBox="0 0 36 40" aria-hidden="true"><path d="'+icon+'"/></svg><span>'+label+'</span>';nav.insertBefore(b,$('nav-camp'));}
 nav.id='deck-nav';$('nav-kit').hidden=true;$('nav-camp').querySelector('span').textContent='HARBOR';$('nav-camp').setAttribute('aria-label','Harbor');
 for(const id of ['road','guns','build','voyage','camp'])$('nav-'+id).onclick=()=>select(id);
 const quick=$('ultimate-quick');$('battle-actions').append(quick);
 const build=document.createElement('section');build.id='deck-upgrades';build.innerHTML='<h2>STAT UPGRADES</h2><p>Spend salvage. Each card shows the next benefit and its rank limit.</p>';build.append($('upgrade-section'));$('progression-panel').before(build);
 const kit=document.querySelector('[data-panel=kit]');const workshop=document.createElement('section');workshop.id='deck-attachment';workshop.innerHTML='<h2>GUN ATTACHMENT</h2>';workshop.append($('mod-info'),$('workshop'));document.querySelector('[data-panel=guns]').append(workshop);
 const forms=document.createElement('section');forms.id='deck-equip-forms';forms.innerHTML='<h2>MELEE FORMS</h2>'+[['step-shell','STEP SHELL'],['samurai','SAMURAI']].map(([id,n])=>'<button data-equip-form="'+id+'"><img src="ui/'+id+'-emblem.png" alt=""><strong>'+n+'</strong><span></span></button>').join('');document.querySelector('[data-panel=guns]').append(forms);
 forms.onclick=e=>{const b=e.target.closest('[data-equip-form]');if(b&&!b.disabled){model.chooseForm(b.dataset.equipForm);persist();refresh();}};
 const settings=document.querySelector('[data-panel=camp] details');settings.id='deck-settings';settings.open=true;
 $('gear-upgrades').onclick=()=>select('build');$('gear-workshop').onclick=()=>{select('guns');workshop.scrollIntoView({block:'nearest'});};$('swap').onclick=()=>select('guns');$('close-drawer').onclick=()=>select('road');
 function select(next,anchor){page=next;screen.dataset.deck=page;harborTab=next==='road'?'road':next==='guns'?'guns':'camp';drawer.hidden=next==='road';home.hidden=next!=='road';$('drawer-title').textContent=names[next];
  for(const p of document.querySelectorAll('[data-panel]'))p.hidden=!(next==='guns'?p.dataset.panel==='guns':next!=='road'&&p.dataset.panel==='camp');
  build.hidden=next!=='build';$('progression-panel').hidden=!groups[next];settings.hidden=next!=='settings';manualButton.hidden=true;manual.hidden=next!=='journal';
  for(const id of ['road','guns','build','voyage','camp'])$('nav-'+id).setAttribute('aria-current',id===next?'page':'false');
  drawer.scrollTop=0;deckKey='';refresh();if(anchor)document.getElementById('deck-'+anchor)?.scrollIntoView({block:'nearest'});
 }
 // Legacy reward and training links are routed straight to the new destination.
 openHarbor=function(tab){if(tab==='camp'){const target=progressTab;select(['campaigns','expeditions','districts'].includes(target)?'voyage':['overclock','mastery','forms'].includes(target)?'build':target==='guide'?'journal':'camp',target);}else select(tab==='kit'?'guns':tab==='ultimate'?'road':tab);};
 refreshProgressionUI=function(){if(drawing)return;const sections=groups[page];if(!sections){oldProgress();return;}
  const key=JSON.stringify([page,model.progress,model.forge,model.best,model.gold,model.ultimateActive,model.state==='defeat',campaignTiers,page==='voyage'?Math.floor(Date.now()/1000):0]);
  if(deckKey===key)return;if($('progress-content').contains(document.activeElement)&&document.activeElement.tagName==='SELECT')return;deckKey=key;drawing=true;const previous=progressTab;let html='';
  for(const tab of sections){progressTab=tab;progressKey='';forgeKey='';oldProgress();html+='<section id="deck-'+tab+'" class="deck-group"><h2>'+({mastery:'WEAPON MASTERY',forms:'FORM SPECIALIZATION',guide:'FIELD GUIDE',harbor:'RESTORATION'}[tab]||tab.toUpperCase())+'</h2>'+$('progress-content').innerHTML+'</section>';}
  progressTab=previous;$('progress-content').innerHTML=html;drawing=false;
 };
 const beforeRefresh=refresh;refresh=function(){beforeRefresh();quick.disabled=$('ultimate').disabled;quick.dataset.ready=!quick.disabled;quick.textContent=formName()+' · '+(model.ultimateActive?model.ultimateSeconds+'s':!J.available(model,model.selectedForm)?'LOCKED':model.paused?'PAUSED':model.ultimateCharge<100?Math.floor(model.ultimateCharge)+'%':model.state==='fight'?'READY':'NEXT BATTLE');$('defeat-refit').hidden=model.state!=='defeat';bank.textContent='SALVAGE  '+model.gold.toLocaleString()+'     /     TIDEGLASS  '+model.forge.tideglass;
  slots.innerHTML='<strong>ATTACHMENT · '+model.modRank+' / 3</strong><span>'+equipped().name+' · manage equipment →</span>';
  for(const b of forms.children)if(b.dataset.equipForm){const id=b.dataset.equipForm,unlocked=J.available(model,id);b.disabled=!unlocked||model.ultimateActive;b.setAttribute('aria-pressed',id===model.selectedForm);b.querySelector('span').textContent=!unlocked?J.requirement(id):id===model.selectedForm?'EQUIPPED':'EQUIP FORM';}
  badge($('nav-voyage'),comicReady.some(r=>r.tab==='expeditions')||model.forge.run?.complete?'!':'');
 };
 // Keep training links meaningful after moving all upgrade controls off Road.
 const showTraining=$('training-show').onclick;$('training-show').onclick=()=>{const lesson=J.active(model);showTraining();if(lesson?.target?.startsWith('#upgrade-')){select('build');document.querySelector(lesson.target)?.scrollIntoView({block:'nearest'});}};
 for(const lesson of J.lessons)lesson.text=lesson.text.replaceAll('Camp > Campaigns','Voyage').replaceAll('Camp > Overclock','Build').replaceAll('Swipe the Road upgrades to find it.','Find it on the Build page.').replaceAll('Open Camp > Contracts','Open Harbor and scroll to Contracts').replaceAll('Open Camp','Open Harbor').replaceAll('in Camp','in Harbor').replaceAll('Swipe the upgrades left.','Open Build.').replaceAll('Swipe the upgrades to find it.','Find it in Build.').replaceAll('then open Expeditions','then open Voyage for Expeditions').replaceAll('choose a form specialization.','choose a form specialization in Build.');
 select('road');
})();
