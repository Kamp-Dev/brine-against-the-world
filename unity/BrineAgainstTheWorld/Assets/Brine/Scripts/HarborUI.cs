using System;
using System.Collections.Generic;
using UnityEngine;
namespace BrineGame {
 public sealed partial class HarborUI:MonoBehaviour {
  BrineGameController game;Texture2D salmonNav,plate,sword,stepIcon,samuraiIcon;Font impact,bodyFont;float dragStartX,dragStartScroll;bool upgradeDragging,upgradePressed;float formStartX;bool formPressed,formDragged;string tab="road";bool confirm;Vector2 upgradeScroll,menuScroll;readonly Dictionary<string,Texture2D> guns=new Dictionary<string,Texture2D>();
  const string Cream="#f1e2be",Teal="#214b50",Dark="#092329",Orange="#bd572e";
  readonly string[] kinds={"damage","shell","speed","scavenging","patch","tide"},labels={"DAMAGE","SHELL","SPEED","SCAVENGING","PATCH UP","TIDE CHARGE"};
  public void Initialize(BrineGameController controller){game=controller;game.gameObject.AddComponent<HarborGrowth>().Initialize(game);plate=Resources.Load<Texture2D>("ui/ticket-board");sword=Resources.Load<Texture2D>("samurai-katana");impact=Resources.Load<Font>("Fonts/Bangers-Regular");bodyFont=Resources.Load<Font>("Fonts/BarlowCondensed-Bold");stepIcon=Resources.Load<Texture2D>("ui/step-shell-emblem");samuraiIcon=Resources.Load<Texture2D>("ui/samurai-emblem");foreach(var w in game.Model.Settings.weapons)guns[w.id]=Resources.Load<Texture2D>("weapons/"+w.art);}
  Color C(string value){ColorUtility.TryParseHtmlString(value,out var c);return c;}
  void Fill(float x,float y,float w,float h,string color){GUI.color=C(color);GUI.DrawTexture(new Rect(x,y,w,h),Texture2D.whiteTexture);GUI.color=Color.white;}
  void Text(string value,float x,float y,float w,float h,int size=16,string color=Dark,TextAnchor align=TextAnchor.UpperLeft){var style=new GUIStyle{font=size>=16?impact:bodyFont,fontSize=size,alignment=align,wordWrap=false};style.normal.textColor=C(color);GUI.Label(new Rect(x,y,w,h),value,style);}
  bool Hot(float x,float y,float w,float h,string label){return GUI.Button(new Rect(x,y,w,h),new GUIContent("",label),GUIStyle.none);}
  void Act(Action action){action();game.SaveAndRefresh();}
  void Ticket(float x,float y,float w,float h){Frame(x,y,w,h,Cream);}
  void Frame(float x,float y,float w,float h,string color){Fill(x-2,y-2,w+4,h+4,"#507575");Fill(x,y,w,h,Dark);Fill(x+3,y+3,w-6,h-6,color);Fill(x+5,y+5,w-10,1,"#bda77f");foreach(float dx in new[]{7f,w-9})foreach(float dy in new[]{7f,h-9})Fill(x+dx,y+dy,2,2,Dark);}
  bool Button(string label,float x,float y,float w,float h,bool orange=false){Fill(x,y,w,h,Dark);Fill(x+2,y+2,w-4,h-4,orange?Orange:Teal);Text(label,x+4,y+3,w-8,h-6,14,Cream,TextAnchor.MiddleCenter);return Hot(x,y,w,h,label);}
  void Health(float x,string name,int hp,int max){Ticket(x,142,132,49);Text(name,x+9,146,114,19,13);Fill(x+9,166,114,17,Dark);Fill(x+11,168,110,13,Teal);Fill(x+11,168,110*Mathf.Clamp01(hp/(float)Math.Max(1,max)),13,Orange);Text(hp+" / "+max,x+11,167,110,16,12,Cream,TextAnchor.MiddleCenter);}

  Texture2D salvageLedger,objectiveSign;
  Texture2D approvedRoute,liveRoute;Font routeFont;
  void RouteCut(Texture2D tex,Rect source,Rect dest){float scale=440f/1984;GUI.DrawTextureWithTexCoords(new Rect(5+(dest.x-32)*scale,4+(dest.y-45)*scale,dest.width*scale,dest.height*scale),tex,new Rect(source.x/2048,1-(source.y+source.height)/683,source.width/2048,source.height/683));}
  void RouteText(string value,float cx,float cy,float width,string color,int size=150){float scale=440f/1984;var st=new GUIStyle{font=routeFont!=null?routeFont:impact,fontSize=Mathf.RoundToInt(size*scale),alignment=TextAnchor.MiddleCenter};st.normal.textColor=C(color);GUI.Label(new Rect(5+(cx-width/2-32)*scale,4+(cy-95-45)*scale,width*scale,190*scale),value,st);}
  void DrawRouteHeader(){var m=game.Model;if(approvedRoute==null){approvedRoute=Resources.Load<Texture2D>("ui/route-approved");liveRoute=Resources.Load<Texture2D>("ui/route-live");routeFont=Resources.Load<Font>("Fonts/Bungee-Regular");}if(approvedRoute==null||liveRoute==null)return;
   RouteCut(approvedRoute,new Rect(32,45,1984,580),new Rect(32,45,1984,580));RouteCut(liveRoute,new Rect(700,324,48,272),new Rect(66,324,1918,272));
   float[] xs={72,414,751,1132,1454,1778},ws={277,279,345,277,278,204};int first=Math.Max(1,m.Stage-2);bool won=m.State==EncounterState.Reward||m.State==EncounterState.Lower;
   for(int i=0;i<6;i++){int n=first+i;bool current=n==m.Stage,done=n<=m.Best&&(n!=m.Stage||won),boss=n%5==0;float x=xs[i],w=ws[i];Rect source=current?new Rect(751,386,345,188):done?new Rect(72,386,277,188):new Rect(1132,386,277,188);if(!boss)RouteCut(liveRoute,source,new Rect(x,386,w,188));
    if(boss)RouteCut(approvedRoute,new Rect(1777,374,206,210),new Rect(x+(w-206)/2,374,206,210));else RouteText(n.ToString(),x+w/2,487,w-40,done&&!current?"#003742":"#fff0c6",Math.Min(150,(int)((w-66)/Math.Max(1,n.ToString().Length)*1.4f)));
    if(current)RouteCut(approvedRoute,new Rect(734,325,395,69),new Rect(x+w/2-197.5f,325,395,69));
    if(done)RouteCut(approvedRoute,new Rect(276,364,91,82),new Rect(x+(boss?w/2+65:w-66),364,91,82));
   }
   if(m.Route!=0){RouteCut(liveRoute,new Rect(1080,275,850,17),new Rect(1080,106,865,172));RouteText(EncounterModel.Routes[m.Route].ToUpper(),1512,194,825,"#003742",100);}
  }
  void OnGUI(){if(game==null||plate==null)return;var m=game.Model;float scale=Mathf.Min(Screen.width/450f,Screen.height/800f);GUI.matrix=Matrix4x4.TRS(new Vector3((Screen.width-450*scale)/2,(Screen.height-800*scale)/2,0),Quaternion.identity,Vector3.one*scale);GUI.color=Color.white;HandleComicInput();
   Fill(0,0,450,800,"#082f38");Fill(4,4,442,1,"#557876");GUI.DrawTextureWithTexCoords(new Rect(5,52,440,382),game.BattleTexture,new Rect(5f/450,(800f-577)/800,440f/450,382f/800));

   DrawRouteHeader();DrawGrowth();
   Health(8,"BRINE / LV "+m.Level,m.PlayerHealth,m.MaxPlayerHealth);Health(309,m.Enemy.Name.ToUpper(),m.Health,m.MaxHealth);
   bool volley=!m.UltimateActive&&m.State==EncounterState.Fight&&!m.Paused&&m.Charge>=100;
   GUI.enabled=!m.UltimateActive&&m.Best>0&&m.State!=EncounterState.Defeat;
   if(ActionCard(m.Farming?"PUSH FORWARD":"GATHER SALVAGE",m.Best==0?"CLEAR STRETCH 1":m.Farming?"NEXT STRETCH":"REPEAT ROAD",9,false,GUI.enabled,100))Act(()=>m.ToggleFarm());
   GUI.enabled=volley;if(ActionCard("3-SHOT VOLLEY",volley?"READY - FIRE":m.UltimateActive?"MELEE ACTIVE":m.Charge>=100?"NEXT BATTLE":"CHARGING "+m.Charge+"%",232,true,volley,m.Charge))Act(()=>m.Volley());GUI.enabled=true;
   Ticket(9,518,164,74);Text("EQUIPPED WEAPON",17,523,147,10,8,Teal);bool blade=m.UltimateActive&&m.SelectedForm=="samurai";Text(blade?"BREAKWATER":m.Equipped.name.ToUpper(),78,539,89,18,15);GUI.DrawTexture(new Rect(18,537,54,43),blade?sword:guns[m.Weapon],ScaleMode.ScaleToFit);if(Button("SWAP",104,562,58,23))tab="gear";
   DrawFormCard();
   DrawUpgrades();Ticket(8,687,434,28);if(salvageLedger==null)salvageLedger=Resources.Load<Texture2D>("ui/salvage-ledger");if(salvageLedger!=null)GUI.DrawTextureWithTexCoords(new Rect(14,690,24,22),salvageLedger,new Rect(80f/2048,1-454f/683,226f/2048,208f/683));Text("SALVAGE",46,693,150,18,15);Text(m.Gold.ToString("N0"),220,690,208,23,19,Dark,TextAnchor.MiddleRight);
   GUI.DrawTextureWithTexCoords(new Rect(0,716,450,84),plate,new Rect(0,0,1,84f/800));
   string[] tabs={"road","gear","camp"};for(int i=0;i<3;i++){if(Hot(5+i*149,723,140,73,tabs[i])){tab=tabs[i];menuScroll=Vector2.zero;}if(tab==tabs[i])HighlightNavigation(i);}
   if(m.Paused){Ticket(153,194,144,22);Text("PAUSED / CAMP TO RESUME",153,196,144,18,9,Dark,TextAnchor.MiddleCenter);}
   if(m.State==EncounterState.Defeat&&tab=="road"){Ticket(65,220,320,75);Text("SHELL CRACKED",71,230,308,29,26,Dark,TextAnchor.MiddleCenter);Text("REFIT & RETRY / KEEP UPGRADES",71,267,308,17,13,Dark,TextAnchor.MiddleCenter);if(Hot(65,220,320,75,"Refit"))Act(()=>m.Retry());}
   if(tab=="camp")ProgressionDrawer();else if(tab!="road")Drawer();GUI.enabled=true;DrawComicNotice();GUI.matrix=Matrix4x4.identity;
  }
  string Stat(string kind){var m=game.Model;switch(kind){case "damage":return m.Damage+" > "+(m.Damage+4);case "shell":return m.MaxPlayerHealth+" > "+(m.MaxPlayerHealth+25);case "speed":return (1/m.Interval).ToString("0.0")+" > "+(1/m.Interval*(1+.08f/(1+m.Upgrades.speed*.08f))).ToString("0.0")+"/s";case "scavenging":return "+"+m.Upgrades.scavenging*5+"% > +"+(m.Upgrades.scavenging+1)*5+"%";case "patch":return m.RecoveryPercent+"% > "+(m.RecoveryPercent+1)+"%";default:return m.ChargePerHit+" > "+(m.ChargePerHit+1);}}
  void HighlightNavigation(int index){if(salmonNav==null){salmonNav=new Texture2D(plate.width,plate.height,TextureFormat.RGBA32,false);var pixels=plate.GetPixels32();for(int i=0;i<pixels.Length;i++){var c=pixels[i];if(c.r>155&&c.g>145&&c.b>100)pixels[i]=new Color32(241,139,119,c.a);}salmonNav.SetPixels32(pixels);salmonNav.Apply();}float[] xs={41,200,334},ws={68,48,70};float x=xs[index],w=ws[index];GUI.DrawTextureWithTexCoords(new Rect(x,724,w,34),salmonNav,new Rect(x/450,42f/800,w/450,34f/800));}
  void OnDestroy(){if(salmonNav!=null)Destroy(salmonNav);}
  void DrawFormCard(){var m=game.Model;var box=new Rect(185,518,256,74);var e=Event.current;
   if(tab=="road"&&e.type==EventType.MouseDown&&box.Contains(e.mousePosition)){formStartX=e.mousePosition.x;formPressed=true;formDragged=false;}
   if(e.type==EventType.MouseDrag&&formPressed){if(Mathf.Abs(e.mousePosition.x-formStartX)>10)formDragged=true;e.Use();}
   if(e.type==EventType.MouseUp&&formPressed){float dx=e.mousePosition.x-formStartX;formPressed=false;if(formDragged){if(Mathf.Abs(dx)>=30&&!m.UltimateActive)Act(()=>m.ChooseForm(dx<0?"samurai":"step-shell"));e.Use();}}
   bool ready=tab=="road"&&!m.Paused&&!m.UltimateActive&&m.State==EncounterState.Fight&&m.UltimateCharge>=100;
   Frame(185,518,256,74,Orange);if(ready){Fill(188,521,250,2,"#ffce69");Fill(188,589,250,2,"#ffce69");}
   bool samurai=m.SelectedForm=="samurai";GUI.DrawTexture(new Rect(193,523,70,49),samurai?samuraiIcon:stepIcon,ScaleMode.ScaleToFit);Fill(283,523,2,49,"#602d22");Text(samurai?"SAMURAI":"STEP SHELL",290,526,140,23,17,Cream,TextAnchor.MiddleCenter);Text(samurai?"SERIES SLASH / 75% GUARD":"HEAVY MELEE / 75% GUARD",289,547,142,13,8,Cream,TextAnchor.MiddleCenter);Text(m.UltimateActive?m.UltimateSeconds+"s REMAINING":m.Paused?"PAUSED":ready?"READY - TAP TO TRANSFORM":m.UltimateCharge>=100?"READY / NEXT BATTLE":"CHARGING "+m.UltimateCharge+"%",289,558,142,14,9,Cream,TextAnchor.MiddleCenter);Fill(291,576,138,4,"#603f32");Fill(291,576,138*Mathf.Clamp01(m.UltimateActive?m.UltimateSeconds/8f:m.UltimateCharge/100f),4,"#ffe3a0");Text(m.UltimateActive?"FORM LOCKED":samurai?"SWIPE TO SELECT / 2 OF 2":"SWIPE TO SELECT / 1 OF 2",193,581,239,11,8,Cream,TextAnchor.MiddleCenter);
   GUI.enabled=ready&&!formDragged;if(Hot(185,518,256,74,"Activate selected Ultimate; swipe to select form"))Act(()=>m.Ultimate());GUI.enabled=true;
  }
  bool ActionCard(string title,string hint,float x,bool firing,bool ready,int charge){Fill(x,468,209,42,ready?(firing?"#ffce69":"#dcbb79"):"#466b69");Fill(x+3,470,203,38,ready?(firing?Orange:Cream):"#16383e");Text(title,x+8,473,193,19,17,ready&&!firing?Dark:Cream,TextAnchor.MiddleCenter);Text(hint,x+8,494,193,10,10,ready&&!firing?Teal:Cream,TextAnchor.MiddleCenter);if(firing)Fill(x+7,506,195*charge/100f,3,"#ffce69");if(firing&&ready){Fill(x+150,470,50,11,"#ffce69");Text("READY",x+150,470,50,11,10,Dark,TextAnchor.MiddleCenter);}return Hot(x,468,209,42,title);}
  void DrawUpgrades(){var m=game.Model;var area=new Rect(9,604,432,70);var e=Event.current;if(tab=="road"&&e.type==EventType.MouseDown&&area.Contains(e.mousePosition)){upgradePressed=true;upgradeDragging=false;dragStartX=e.mousePosition.x;dragStartScroll=upgradeScroll.x;}if(e.type==EventType.MouseDrag&&upgradePressed){float delta=e.mousePosition.x-dragStartX;if(Mathf.Abs(delta)>7||upgradeDragging){upgradeDragging=true;upgradeScroll.x=Mathf.Clamp(dragStartScroll-delta,0,443);e.Use();}}if((e.type==EventType.MouseUp||e.type==EventType.Ignore)&&upgradePressed){upgradePressed=false;if(upgradeDragging){upgradeDragging=false;e.Use();}}
   Fill(7,601,437,82,Teal);upgradeScroll=GUI.BeginScrollView(area,upgradeScroll,new Rect(0,0,875,66),false,false,GUIStyle.none,GUIStyle.none);for(int i=0;i<6;i++){float x=i*147;string kind=kinds[i];bool max=m.Rank(kind)>=m.Cap(kind);Ticket(x,0,140,66);Text(labels[i],x+7,3,126,19,14);Text(max?"MAX":Stat(kind),x+7,19,126,20,16);GUI.enabled=tab=="road"&&!upgradeDragging&&!max&&m.Gold>=m.Cost(kind);if(Button(max?"MAXED":m.Cost(kind).ToString("N0")+"   +",x+3,34,128,19))Act(()=>m.Buy(kind));GUI.enabled=true;Fill(x+3,56,128,8,Teal);Fill(x+3,56,128*Mathf.Clamp01(m.Rank(kind)/(float)m.Cap(kind)),8,Orange);Text(m.Rank(kind)+" / "+m.Cap(kind),x+9,55,122,10,8,Cream);}GUI.EndScrollView();Text(upgradeScroll.x>220?"SWIPE UPGRADES / 4-6 OF 6":"SWIPE UPGRADES / 1-3 OF 6",80,673,290,12,8,Cream,TextAnchor.MiddleCenter);}
  void Drawer(){var m=game.Model;Ticket(9,434,432,280);Text(tab=="gear"?"GEAR":"CAMP",22,444,340,30,25);if(Button("X",401,443,28,28))tab="road";menuScroll=GUI.BeginScrollView(new Rect(20,480,410,221),menuScroll,new Rect(0,0,392,tab=="gear"?385:285));
   if(tab=="gear"){for(int i=0;i<m.Settings.weapons.Length;i++){var w=m.Settings.weapons[i];float y=i*65;Fill(0,y,390,59,m.Weapon==w.id?Orange:Teal);GUI.DrawTexture(new Rect(4,y+2,80,54),guns[w.id],ScaleMode.ScaleToFit);Text(w.name.ToUpper(),91,y+4,292,23,20,Cream);Text(m.Best<w.unlock?"CLEAR STRETCH "+w.unlock:w.description,91,y+32,292,20,11,Cream);GUI.enabled=m.Best>=w.unlock;if(Hot(0,y,390,59,w.name))Act(()=>m.Equip(w.id));GUI.enabled=true;}Text("WORKSHOP / "+m.Equipped.name.ToUpper(),0,205,385,25,20);Text("Attachment "+m.ModRank+"/3 / +"+m.ModRank*5+" damage",0,236,385,20,14);GUI.enabled=m.ModRank<3&&m.Gold>=m.ModCost;if(Button(m.ModRank>=3?"MAXED":"FIT ATTACHMENT / "+m.ModCost,0,265,390,34))Act(()=>m.BuyMod());GUI.enabled=true;Text("SCAVENGING: +5% SALVAGE PER RANK",0,307,390,20,12);Text("PATCH UP: +1% HEALING AFTER A WIN",0,330,390,20,12);Text("TIDE CHARGE: +1 FORM CHARGE PER HIT",0,353,390,20,12);}
   else{Text("CLEARED "+m.Best+" / "+m.Gold+" SALVAGE",0,0,390,24,19);if(Button(m.Paused?"RESUME":"PAUSE",0,30,390,35))m.Paused=!m.Paused;Text("AWAY INCOME: "+m.OfflineRate.ToString("0.0")+" / MIN / 8H CAP",0,76,390,20,13);for(int i=0;i<3;i++){int id=i;GUI.enabled=m.Best>=i*5&&!m.UltimateActive&&m.State!=EncounterState.Defeat;if(Button((m.Route==i?"> ":"")+EncounterModel.Routes[i],i*132,111,128,40))Act(()=>m.ChooseRoute(id));}GUI.enabled=true;if(!confirm){if(Button("FRESH SAVE...",0,175,390,38))confirm=true;}else{if(Button("ERASE SAVE",0,175,190,38)){Act(()=>m.Reset());confirm=false;}if(Button("KEEP SAVE",200,175,190,38))confirm=false;}Text("SALVAGE BONUS: +"+m.Upgrades.scavenging*5+"%",0,235,390,20,14);}
   GUI.EndScrollView();
  }
 }
}

