using System;
using System.Collections.Generic;
using UnityEngine;
namespace BrineGame {
 public sealed class HarborUI : MonoBehaviour {
  BrineGameController game;Texture2D plate;Font impact,stencil;string tab="road";bool confirm;Dictionary<string,Texture2D> guns=new Dictionary<string,Texture2D>();
  const string Cream="#f1e2be",Teal="#214b50",Dark="#092329",Orange="#bd572e";
  public void Initialize(BrineGameController controller){game=controller;plate=Resources.Load<Texture2D>("ui/harbor-reference");impact=Font.CreateDynamicFontFromOSFont(new[]{"Impact","Arial"},24);stencil=Font.CreateDynamicFontFromOSFont(new[]{"Stencil","Impact","Arial"},24);foreach(var w in game.Model.Settings.weapons)guns[w.id]=Resources.Load<Texture2D>("weapons/"+w.art);}
  Color C(string s){ColorUtility.TryParseHtmlString(s,out var c);return c;}
  void Fill(float x,float y,float w,float h,string color){GUI.color=C(color);GUI.DrawTexture(new Rect(x,y,w,h),Texture2D.whiteTexture);GUI.color=Color.white;}
  void Text(string value,float x,float y,float w,float h,int size=16,string color=Dark,bool st=false,TextAnchor align=TextAnchor.UpperLeft){var style=new GUIStyle{font=impact,fontSize=Mathf.Max(1,Mathf.RoundToInt(size*Mathf.Abs(GUI.matrix.m11))),alignment=align,wordWrap=false};style.normal.textColor=C(color);var matrix=GUI.matrix;var a=matrix.MultiplyPoint3x4(new Vector3(x,y,0));var z=matrix.MultiplyPoint3x4(new Vector3(x+w,y+h,0));GUI.matrix=Matrix4x4.identity;GUI.Label(new Rect(a.x,a.y,z.x-a.x,z.y-a.y),value,style);GUI.matrix=matrix;}
  void HealthBar(float x,float y,float w,float h,int current,int maximum){float ratio=maximum>0?Mathf.Clamp01(current/(float)maximum):0;Fill(x,y,w,h,Dark);Fill(x+2,y+2,w-4,h-4,Teal);if(ratio>0)Fill(x+2,y+2,(w-4)*ratio,h-4,Orange);}
  void Region(float x,float y,float w,float h){GUI.DrawTextureWithTexCoords(new Rect(x,y,w,h),plate,new Rect(x/450,1-(y+h)/800,w/450,h/800));}
  bool Hot(float x,float y,float w,float h,string label){return GUI.Button(new Rect(x,y,w,h),new GUIContent("",label),GUIStyle.none);}
  bool Button(string label,float x,float y,float w,float h){Fill(x,y,w,h,Dark);Fill(x+2,y+2,w-4,h-4,Teal);Text(label,x+6,y+5,w-12,h-7,15,Cream,false,TextAnchor.MiddleCenter);return Hot(x,y,w,h,label);}
  void Act(Action action){action();game.SaveAndRefresh();}
  void OnGUI(){if(game==null||game.Model==null||plate==null)return;var m=game.Model;float scale=Mathf.Min(Screen.width/450f,Screen.height/800f);GUI.matrix=Matrix4x4.TRS(new Vector3((Screen.width-450*scale)/2,(Screen.height-800*scale)/2,0),Quaternion.identity,Vector3.one*scale);GUI.color=Color.white;
   GUI.DrawTexture(new Rect(0,0,450,800),plate);
   GUI.DrawTextureWithTexCoords(new Rect(11,103,428,326),game.BattleTexture,new Rect(11f/450,(800f-641)/800,428f/450,326f/800));
   Fill(340,71,91,23,Teal);Text("STRETCH "+m.Stage,350,70,78,24,17,Cream,false,TextAnchor.UpperRight);
   Fill(287,69,22,24,"#e5b66b");Text(((int)Math.Ceiling(m.Stage/5.0)*5).ToString(),287,70,22,26,20,Dark,false,TextAnchor.UpperCenter);
   Region(312,125,114,52);Fill(319,130,98,14,Cream);Text(m.Enemy.Name.ToUpper(),319,131,99,16,11);Fill(317,145,103,17,Cream);HealthBar(319,147,98,13,m.Health,m.MaxHealth);Fill(363,162,54,11,Cream);Text(m.Health+" / "+m.MaxHealth,363,160,54,15,11,Dark,false,TextAnchor.UpperRight);
   Region(19,366,160,57);Fill(24,372,147,15,Cream);Text("BRINE / LV "+m.Level,25,371,145,19,15);Fill(29,387,143,17,Cream);HealthBar(30,389,140,14,m.PlayerHealth,m.MaxPlayerHealth);Fill(29,404,135,15,Cream);Text(m.PlayerHealth+" / "+m.MaxPlayerHealth,31,403,133,20,16);
   var w=m.Equipped;Fill(18,443,180,70,Cream);var art=guns[m.Weapon];float k=Mathf.Min(170f/art.width,77f/art.height);GUI.DrawTexture(new Rect(100-art.width*k/2,478-art.height*k/2,art.width*k,art.height*k),art);
   Fill(205,445,145,46,Cream);Text(w.name.ToUpper(),205,445,147,37,w.name.Length>7?25:29,Dark,true);Text(m.Weapon=="scrap"?"SALT SLUG":m.Weapon=="repeater"?"TIDAL TRACER":"SCATTER BLAST",207,478,140,18,15);
   Fill(182,527,240,65,Orange);Text("STEP SHELL",182,528,240,22,19,Cream,false,TextAnchor.UpperCenter);Text("4x MELEE / 75% GUARD",182,550,240,16,12,Cream,true,TextAnchor.UpperCenter);Text(m.UltimateActive?Math.Ceiling(m.UltimateTime)+"s REMAINING":m.UltimateCharge>=100?"READY - TAP IN BATTLE":"CHARGING "+m.UltimateCharge+"%",182,566,240,16,12,Cream,false,TextAnchor.UpperCenter);Fill(205,581,207,7,Dark);Fill(206,582,205*(m.UltimateActive?m.UltimateTime/8:m.UltimateCharge/100f),5,"#e7be72");
   Fill(22,110,190,18,Teal);Text(EncounterModel.Routes[m.Route].ToUpper(),28,110,184,18,12,Cream);
   if(m.State==EncounterState.Fight){Fill(242,179,181,18,Teal);Text(m.Submerged?"BURROWED - MELEE HITS":m.Guarded?"SHIELD - MELEE BREAKS":m.EnemyCycle>m.Enemy.Interval*.75f?"INCOMING "+m.Enemy.Action.ToUpper():m.Enemy.Action.ToUpper(),246,179,177,18,10,Cream,false,TextAnchor.MiddleCenter);}
   string[] kinds={"damage","shell","speed"};for(int i=0;i<3;i++){
    string kind=kinds[i];float x=19+i*144;int rank=m.Rank(kind);bool maxed=rank>=30;
    Fill(x+40,627,79,17,Cream);Text(maxed?"MAX":(i==0?"+4":i==1?"+25":"+8%")+" / "+m.Cost(kind),x+33,626,86,23,17,Dark,false,TextAnchor.UpperRight);
    Fill(x+3,650,121,11,Dark);Fill(x+41,651,82,9,Teal);Fill(x+41,651,82*Math.Min(rank,30)/30f,9,"#dfb35f");
    Text(rank+"/30",x+3,649,36,13,10,Cream,false,TextAnchor.UpperCenter);
    GUI.enabled=tab=="road"&&m.Gold>=m.Cost(kind)&&!maxed;if(Hot(13+i*144,602,137,66,maxed?kind+" fully upgraded":"Upgrade "+kind+", rank "+rank+" of 30"))Act(()=>m.Buy(kind));GUI.enabled=true;
   }
   Fill(357,685,66,21,Cream);Text(m.Gold.ToString("N0"),342,682,83,29,23,Dark,false,TextAnchor.UpperRight);
   if(tab=="road"&&Hot(351,454,81,41,"Swap gun"))tab="guns";if(tab=="road"&&Hot(9,522,432,76,"Unleash Step Shell melee Ultimate"))Act(()=>m.Ultimate());
   string[] tabs={"road","guns","kit","camp"};for(int i=0;i<4;i++){if(Hot(4+i*113,720,108,76,tabs[i]))tab=tabs[i];if(tab==tabs[i]&&i>0)Fill(4+i*113,790,108,4,"#e0ae61");}
   if(m.Paused){Fill(143,107,162,20,Teal);Text("PAUSED · CAMP TO RESUME",143,107,162,20,12,Cream,false,TextAnchor.MiddleCenter);}
   if(m.State==EncounterState.Defeat&&tab=="road"){Fill(63,216,324,79,Dark);Fill(67,220,316,71,Cream);Text("SHELL CRACKED",71,228,308,30,25,Dark,true,TextAnchor.UpperCenter);Text("REFIT & RETRY · KEEP UPGRADES",71,264,308,22,13,Dark,false,TextAnchor.UpperCenter);if(Hot(63,216,324,79,"Refit and retry"))Act(()=>m.Retry());}
   GUI.enabled=!m.Paused&&m.State==EncounterState.Fight&&!m.UltimateActive&&m.UltimateCharge>=100;if(Button(m.UltimateActive?"MELEE / "+Math.Ceiling(m.UltimateTime)+"s":"STEP SHELL / "+(m.UltimateCharge>=100?"UNLEASH":m.UltimateCharge+"%"),22,139,180,33))Act(()=>m.Ultimate());GUI.enabled=true;BattleActions();if(tab!="road"){var saved=GUI.matrix;GUI.matrix=saved*Matrix4x4.TRS(new Vector3(0,343,0),Quaternion.identity,new Vector3(1,.86f,1));Drawer();GUI.matrix=saved;}GUI.enabled=true;GUI.matrix=Matrix4x4.identity;
  }
  void BattleActions(){var m=game.Model;bool ready=!m.UltimateActive&&m.Charge>=100&&m.State==EncounterState.Fight&&!m.Paused;
   GUI.enabled=!m.UltimateActive&&m.Best>0&&m.State!=EncounterState.Defeat;
   if(ActionCard(m.State==EncounterState.Defeat?"ROAD BLOCKED":m.Farming?"PUSH FORWARD":"GATHER SALVAGE",m.State==EncounterState.Defeat?"REFIT FIRST":m.Farming?"NEXT STRETCH":m.Best==0?"CLEAR STRETCH 1":"REPEAT ROAD",185,false))Act(()=>m.ToggleFarm());
   GUI.enabled=ready;
   if(ActionCard("3-SHOT VOLLEY",m.State==EncounterState.Defeat?"REFIT FIRST":m.Paused?"PAUSED":ready?"READY — FIRE":m.Charge>=100?"NEXT BATTLE":"CHARGING "+m.Charge+"%",308,ready))m.Volley();GUI.enabled=true;
  }
  bool ActionCard(string title,string hint,float x,bool ready){Fill(x,374,116,45,Dark);Fill(x+3,377,110,39,ready?Orange:Teal);Text(title,x+4,379,108,17,13,Cream,false,TextAnchor.UpperCenter);Text(hint,x+4,398,108,14,9,Cream,false,TextAnchor.UpperCenter);return Hot(x,374,116,45,title+" / "+hint);}
  void Drawer(){var m=game.Model;Fill(11,103,428,326,Dark);Fill(15,107,420,318,Cream);Text(tab=="ultimate"?"STEP SHELL":tab.ToUpper(),28,119,330,35,30,Dark,true);if(Button("X",393,118,28,28))tab="road";
   if(tab=="guns"){for(int i=0;i<m.Settings.weapons.Length;i++){var w=m.Settings.weapons[i];float y=161+i*73;Fill(28,y,392,66,m.Weapon==w.id?Orange:Teal);GUI.DrawTexture(new Rect(34,y+2,85,60),guns[w.id],ScaleMode.ScaleToFit);Text(w.name.ToUpper(),130,y+5,276,24,21,Cream);Text(m.Best>=w.unlock?w.description:"CLEAR STRETCH "+w.unlock,130,y+34,276,24,12,Cream);GUI.enabled=m.Best>=w.unlock;if(Hot(28,y,392,66,w.name))Act(()=>m.Equip(w.id));GUI.enabled=true;}Text(m.Damage+" DAMAGE / "+m.Interval.ToString("0.00")+"s BETWEEN SHOTS",28,389,391,25,14);}
   else if(tab=="kit"){Text("SHELL "+m.PlayerHealth+" / "+m.MaxPlayerHealth,28,162,390,25,18);Text("STEP SHELL: 8s MELEE / 4x DAMAGE / 75% GUARD",28,193,390,25,14);Text("HITS AND DAMAGE TAKEN CHARGE THE ULTIMATE.",28,219,390,25,13);Text("HARBOR WORKSHOP",28,255,390,30,22);Text(m.Equipped.name+" ATTACHMENT "+m.ModRank+"/3 / +"+(m.ModRank*5)+" DAMAGE",28,292,390,25,14);GUI.enabled=m.ModRank<3&&m.Gold>=m.ModCost;if(Button(m.ModRank>=3?"ATTACHMENT MAXED":"FIT ATTACHMENT / "+m.ModCost+" SALVAGE",28,332,392,46))Act(()=>m.BuyMod());GUI.enabled=true;}
   else if(tab=="ultimate"){Text("THE TEMPORARY STEP SHELL TRANSFORMATION",28,174,390,25,16);Text("IS IN DEVELOPMENT.",28,202,390,25,16);Text("FIRE YOUR VOLLEY BELOW THE BATTLE.",28,255,390,25,16);if(Button("OPEN KIT",28,312,392,48))tab="kit";}
   else if(tab=="camp"){Text("CLEARED "+m.Best+" / "+m.Gold+" SALVAGE",28,163,390,25,19);if(Button(m.Paused?"RESUME":"PAUSE",28,197,190,39))m.Paused=!m.Paused;Text(m.Farming?"GATHERING SALVAGE":"PUSHING FORWARD",228,207,192,25,14);if(m.State==EncounterState.Defeat){if(Button("REFIT & RETRY",28,246,392,40))Act(()=>m.Retry());}else Text("AWAY EARNINGS: "+m.OfflineEarned+" SALVAGE / 8H CAP",28,252,390,24,14);for(int i=0;i<3;i++){int id=i;GUI.enabled=m.Best>=i*5&&!m.UltimateActive; if(Button((m.Route==i?"> ":"")+EncounterModel.Routes[i],28+i*132,294,128,42))Act(()=>m.ChooseRoute(id));}GUI.enabled=true;if(!confirm){if(Button("FRESH SAVE…",28,350,392,40))confirm=true;}else{if(Button("ERASE SAVE",28,350,190,40)){Act(()=>m.Reset());confirm=false;}if(Button("KEEP SAVE",228,350,192,40))confirm=false;}}
  }
 }
}
