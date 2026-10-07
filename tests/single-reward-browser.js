const checkTimer=setInterval(()=>{if(!ready)return;clearInterval(checkTimer);
 const results=[],check=(name,pass)=>results.push({name,pass:!!pass});
 model.reset();model.best=2000;model.upgrades.shell=10000;model.playerHp=model.maxPlayerHp;model.journey.done=J.lessons.map(l=>l.id);refresh();
 model.progress.counts[0]=P.contracts[0].target;model.progress.counts[1]=P.contracts[1].target;model.progress.expedition={id:0,finish:Date.now()-1000};model.enterCampaign(0,1);model.forge.run.complete=true;refresh();
 check('One shared ready banner',!comicToast.hidden&&campaignBanner.hidden&&campaignDismiss.hidden);const ticket=comicToast;
 comicUntil=0;refresh();check('Unclaimed reward does not time out',!comicToast.hidden&&comicCurrent.collect);
 const completed=model.progress.completed;comicToast.querySelector('.comic-open').click();check('Direct collection grants reward',model.progress.completed===completed+1);check('Same banner becomes repeat',ticket===comicToast&&!!comicCurrent.repeat&&!comicCurrent.collect);check('Other rewards do not create a second banner',campaignBanner.hidden&&campaignDismiss.hidden);
 comicToast.querySelector('.comic-close').click();refresh();check('Dismiss advances the same banner to next reward',!comicToast.hidden&&comicCurrent.collect&&ticket===comicToast);
 comicToast.querySelector('.comic-open').click();comicToast.querySelector('.comic-close').click();refresh();check('Crew uses same banner',comicCurrent.tab==='expeditions');comicToast.querySelector('.comic-open').click();check('Crew collection is direct',!model.progress.expedition&&comicCurrent.repeatCrew===0);
 comicToast.querySelector('.comic-close').click();refresh();check('Campaign uses same banner',comicCurrent.tab==='campaigns'&&comicCurrent.collect);const glass=model.forge.tideglass;comicToast.querySelector('.comic-open').click();check('Campaign collection is direct',model.forge.tideglass>glass&&!model.forge.run);check('Campaign repeat stays on same banner',comicCurrent.repeatCampaign?.id===0&&ticket===comicToast&&campaignBanner.hidden);
 comicToast.querySelector('.comic-close').click();refresh();check('No forced repeat after dismiss',!comicCurrent&&!model.forge.run&&comicToast.hidden);
 model.progress.counts[2]=P.contracts[2].target;refresh();comicToast.querySelector('.comic-close').click();refresh();check('Dismissed collection does not reappear',comicToast.hidden);
 // Show the same single ticket for the visual check.
 comicDismissed.clear();refresh();$('nav-camp').click();
 const report=document.createElement('pre');report.id='reward-review-results';report.textContent=JSON.stringify(results,null,2);report.style='position:fixed;inset:10px;z-index:9999;background:#f7e8c5;color:#092e36;overflow:auto;padding:20px';report.onclick=()=>report.remove();document.body.append(report);
},100);
