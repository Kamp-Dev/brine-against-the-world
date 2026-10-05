using System;
using System.Collections.Generic;
using UnityEngine;
namespace BrineGame {
 public sealed partial class HarborUI {
  sealed class ComicNotice {public string title,detail,key;public int page;public bool collect;}
  readonly Queue<ComicNotice> comicQueue=new Queue<ComicNotice>();
  readonly HashSet<string> comicReady=new HashSet<string>();
  HarborProgressData comicSource,comicPrevious;ComicNotice comicCurrent;float comicDeadline;int comicReadyPage;
  void QueueComic(string title,string detail,int page,string key=null,bool collect=false){comicQueue.Enqueue(new ComicNotice{title=title,detail=detail,page=page,key=key,collect=collect});}
  void PollComic(){var p=game.Model.Progress;if(comicSource!=p){comicSource=p;comicPrevious=null;comicReady.Clear();comicQueue.Clear();comicCurrent=null;}
   var available=new HashSet<string>();comicReadyPage=1;
   for(int i=0;i<5;i++)if(p.counts[i]>=HarborProgress.Targets[i]){string key="contract:"+i;available.Add(key);if(!comicReady.Contains(key))QueueComic("CONTRACT COMPLETE!",HarborProgress.Contracts[i],1,key,true);}
   if(p.expedition>=0&&Math.Max(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),p.clock)>=p.finish){string key="crew:"+p.finish;available.Add(key);if(available.Count==1)comicReadyPage=5;if(!comicReady.Contains(key))QueueComic("CREW RETURNED!",HarborProgress.Expeditions[p.expedition],5,key,true);}
   if(comicPrevious!=null){var old=comicPrevious;
    if(p.completed>old.completed)QueueComic("REWARD COLLECTED!","Contract materials added to your cargo.",1);
    if(old.expedition>=0&&p.expedition<0)QueueComic("CARGO COLLECTED!","Expedition materials delivered.",5);
    for(int i=0;i<3;i++){
     if(p.build[i]>old.build[i])QueueComic(p.build[i]==3?"RESTORATION COMPLETE!":"HARBOR UPGRADED!",HarborProgress.Buildings[i]+" / level "+p.build[i]+" of 3",0);
     if(p.district[i]&&!old.district[i])QueueComic("DISTRICT RECLAIMED!",HarborProgress.Captains[i]+" defeated / rewards delivered",6);
     if(HarborProgress.Tier(p.weaponXP[i])>HarborProgress.Tier(old.weaponXP[i]))QueueComic("MASTERY UP!",game.Model.Settings.weapons[i].name+" / tier "+HarborProgress.Tier(p.weaponXP[i]),2);
    }
    for(int i=0;i<2;i++)if(p.formXP[i]>=12&&old.formXP[i]<12)QueueComic("FORM PRACTICED!",(i==0?"Step Shell":"Samurai")+" / "+(p.build[2]>0?"specializations ready":"restore Lighthouse to specialize"),3);
    for(int i=0;i<6;i++)if(p.guide[i]>=15&&old.guide[i]<15)QueueComic("ENEMY STUDIED!",EncounterModel.Enemies[i].Name+" / +10% damage",4);
   }
   comicPrevious=new HarborProgressData{completed=p.completed,expedition=p.expedition,build=(int[])p.build.Clone(),district=(bool[])p.district.Clone(),weaponXP=(int[])p.weaponXP.Clone(),formXP=(int[])p.formXP.Clone(),guide=(int[])p.guide.Clone()};
   comicReady.Clear();foreach(var key in available)comicReady.Add(key);
   if(comicCurrent!=null&&((comicCurrent.collect&&!available.Contains(comicCurrent.key))||Time.unscaledTime>comicDeadline))comicCurrent=null;
   while(comicCurrent==null&&comicQueue.Count>0){var next=comicQueue.Dequeue();if(next.collect&&!available.Contains(next.key))continue;comicCurrent=next;comicDeadline=Time.unscaledTime+8;}
  }
  void HandleComicInput(){PollComic();if(comicCurrent==null)return;var e=Event.current;var box=new Rect(36,520,378,comicCurrent.collect?65:44);if(!box.Contains(e.mousePosition))return;comicDeadline=Time.unscaledTime+4;if(e.type==EventType.MouseDown){if(new Rect(379,520,35,35).Contains(e.mousePosition))comicCurrent=null;else if(new Rect(86,559,280,23).Contains(e.mousePosition)){tab="camp";progressionPage=comicCurrent.page;progressScroll=Vector2.zero;comicCurrent=null;}e.Use();}else if(e.type==EventType.MouseUp||e.type==EventType.MouseDrag||e.type==EventType.ScrollWheel)e.Use();}
  void DrawComicNotice(){if(comicCurrent==null)return;float h=comicCurrent.collect?65:44;Fill(38,523,378,h,Dark);Frame(36,520,378,h,Cream);Frame(44,534,29,27,"#ee8c70");Text("!",46,535,25,25,22,Dark,TextAnchor.MiddleCenter);Text(comicCurrent.title,86,526,287,18,16,Dark);Text(comicCurrent.detail,86,545,287,15,10,Teal);if(comicCurrent.collect){Fill(86,563,143,18,Orange);Text("VIEW & COLLECT >",90,563,135,18,11,Cream);}Text("X",384,525,24,24,16,Dark,TextAnchor.MiddleCenter);}
 }
}
