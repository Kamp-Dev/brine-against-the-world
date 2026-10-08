using System;
using System.Collections.Generic;

namespace BrineGame
{
 [Serializable] public class WeaponData { public string id, name, art, description; public int damage,unlock,width,height,splitX,splitY; public float length,interval=1,speed=950,recoil=1,gripX,gripY,muzzleX,muzzleY,scale; }
 [Serializable] public class EnemyVisualData { public string id; public float ratio,contactFraction; }
 [Serializable] public class GameplayData {
  public EnemyVisualData[] enemyVisuals;
  public float meleeMoveSpeed=84; public float meleeReach=102; public float meleeDuration=1.2f,meleeImpact=.45f; public float walkCycleDuration=1.75f;
  public float raiseDuration, lowerDuration, shotInterval, recoilDuration, rewardDuration, bulletSpeed, enemySpeed;
  public int reward, enemyHealth; public WeaponData[] weapons;
 }
 [Serializable] public class UpgradeData { public int damage, shell, speed, scavenging, patch, tide; }
 [Serializable] public class SaveData {
  public int weaponUnlockVersion; public string[] unlockedWeapons; public HarborProgressData progress;public int version=1; public long savedAt; public string weapon,selectedForm; public int gold,kills,best,xp,charge,stage,playerHp;
  public int route,ultimateCharge; public UpgradeData mods; public UpgradeData upgrades; public bool farming,defeated;
 }
 public sealed class EnemyData {
  public string Name, Art,Action; public float Health, Interval, Height; public int Damage;
  public EnemyData(string name,string art,float health,int damage,float interval,float height,string action="lob"){Action=action;Name=name;Art=art;Health=health;Damage=damage;Interval=interval;Height=height;}
 }
 public enum EncounterState { Travel, Raise, Fight, Reward, Lower, Defeat }
 public sealed class Projectile { public float x,y,startX,speed; public int damage; public string weapon,selectedForm; }
 public sealed class ShotEffect { public string weapon,selectedForm; public float x,y,life,duration; public bool impact;public float power=1; }
 public sealed class EncounterModel {
  public HarborProgressData Progress=new HarborProgressData();public float Shattered;
  public readonly List<ShotEffect> Effects=new List<ShotEffect>();
  public readonly GameplayData Settings;
  public EncounterState State {get;private set;}
  public string Weapon {get;private set;}
  public string SelectedForm {get;private set;}="step-shell";public int MeleeAttackIndex;
  public bool ChooseForm(string id){if((id!="step-shell"&&id!="samurai")||UltimateActive)return false;SelectedForm=id;return true;}
  public int Gold,Kills,Stage,Health,MaxHealth,ShotSerial,Best,Xp,PlayerHealth,Charge,OfflineEarned,LastReward;
  public float Age,EnemyX,Time,Cycle,Distance,SinceShot,HitFlash,PlayerHit,EnemyCycle;
  public bool Paused,Farming;
  public UpgradeData Upgrades=new UpgradeData();
  public float MeleeIdleTime;public bool MeleeIdleActive;public bool MeleeWalking;public float MeleeWalkTime;bool meleeLanded;int meleeHitIndex; int burst; public int Route,UltimateCharge; public UpgradeData Mods=new UpgradeData(); public float EnemyDepth,MeleeAdvance,UltimateTime,MeleeCycle,MeleeSince=99,EnemyAttack=99;
  public float MeleeContactX { get {var v=Settings.enemyVisuals==null?null:Array.Find(Settings.enemyVisuals,x=>x.id==Enemy.Art);return EnemyX-Enemy.Height*.78f*(v==null?1:v.ratio)*(v==null?.12f:v.contactFraction);}}
  public float MeleeReach=>Math.Max(0,MeleeContactX-124-Settings.meleeReach+4);
  public bool UltimateActive=>UltimateTime>0;
  public string UltimatePhase=>!UltimateActive?"normal":UltimateTime>8.4f?"enter":UltimateTime<=.4f?"exit":"melee";
  public float TransformProgress=>UltimatePhase=="enter"?(8.8f-UltimateTime)/.4f:UltimatePhase=="exit"?(.4f-UltimateTime)/.4f:0;
  public int UltimateSeconds=>(int)Math.Ceiling(Math.Max(0,Math.Min(8,UltimateTime-.4f)));
  public bool Guarded=>Enemy.Action=="guard"&&EnemyCycle<Enemy.Interval*.65f;
  public bool Submerged=>Enemy.Action=="burrow"&&EnemyCycle>Enemy.Interval*.35f&&EnemyCycle<Enemy.Interval*.7f;
  public int ModRank=>Weapon=="scrap"?Mods.damage:Weapon=="repeater"?Mods.shell:Mods.speed;
  public int ModCost=>45*(ModRank+1);
  public bool BuyMod(){if(ModRank>=3||Gold<ModCost)return false;Gold-=ModCost;if(Weapon=="scrap")Mods.damage++;else if(Weapon=="repeater")Mods.shell++;else Mods.speed++;return true;}
  public bool ChooseRoute(int id){if(id<0||id>2||Best<id*5||State==EncounterState.Defeat||UltimateActive)return false;if(Route!=id){Route=id;StartEncounter();}return true;}
  public bool Ultimate(){if(State!=EncounterState.Fight||Paused||UltimateCharge<100||UltimateActive)return false;UltimateCharge=0;UltimateTime=8.8f;MeleeAttackIndex=0;MeleeWalkTime=0;MeleeIdleTime=0;MeleeIdleActive=false;MeleeWalking=false;MeleeCycle=0;MeleeSince=99;meleeLanded=false;meleeHitIndex=0;burst=0;Shots.Clear();return true;}
  public readonly List<Projectile> Shots=new List<Projectile>(), EnemyShots=new List<Projectile>();
  public static readonly EnemyData[] Enemies={new EnemyData("Salt Porter","salt-porter",1,8,2.6f,132),new EnemyData("Pipe Pilfer","pipe-pilfer",.85f,6,1.8f,142,"burst"),new EnemyData("Sluice Keeper","sluice-keeper",2.3f,17,2.4f,164,"slam"),new EnemyData("Gate Hauler","gate-hauler",1.3f,11,3.1f,126,"guard"),new EnemyData("Sump Mender","sump-mender",1.1f,7,3.4f,143,"repair"),new EnemyData("Mud Skipper","mud-skipper",.95f,13,2.8f,110,"burrow")};
  static readonly int[] Rotation={0,1,3,4,5};
  public int EnemyIndex=>Stage%5==0?(Route==0?2:Route==1?4:3):Rotation[(Stage-1-(Stage-1)/5)%5];
  public EnemyData Enemy {get{if(!Boss)return Enemies[EnemyIndex];var e=Enemies[Route==0?2:Route==1?4:3];return new EnemyData(HarborProgress.Captains[Route],e.Art,Enemies[2].Health,Enemies[2].Damage,Enemies[2].Interval,e.Height,e.Action);}}
  public static readonly string[] Routes={"Dry Docks","Drainage Run","Salt Flats"};
  public bool Boss=>Stage%5==0;
  public WeaponData Equipped=>Array.Find(Settings.weapons,w=>w.id==Weapon);
  public int Level=>1+(int)Math.Sqrt(Xp/30.0);
  public int NextXp=>Level*Level*30;
  public int MaxPlayerHealth=>100+Upgrades.shell*25+(Level-1)*8;
  public int Damage=>Equipped.damage+Upgrades.damage*4+(Level-1)*2+ModRank*5+(int)Math.Round(Equipped.damage*Math.Max(0,Progress.build[0]-1)*.05);
  public float Interval=>Settings.shotInterval*Equipped.interval/(1+Upgrades.speed*.08f+(Progress.weaponPath[Array.IndexOf(HarborProgress.Weapons,Weapon)]=="tempo"?HarborProgress.Tier(Progress.weaponXP[Array.IndexOf(HarborProgress.Weapons,Weapon)])*.15f:0));
  public int EnemyDamage=>(int)Math.Floor((Enemy.Damage+(int)((Stage-1)*1.6f))*(Route==0?1:Route==1?1.2:1.45)+.5);
  public double SalvageMultiplier=>1+Upgrades.scavenging*.05+Math.Max(0,Progress.build[2]-1)*.05;
  public int RecoveryPercent=>12+Upgrades.patch;
  public int ChargePerHit=>12+Upgrades.tide;
  public int Cap(string kind)=>kind=="scavenging"?20:kind=="patch"?10:kind=="tide"?8:30;
  public int Reward=>(int)((Settings.reward+(Stage-1)*2)*(Boss?4:1)*(Route==0?1:Route==1?1.25:1.5)*SalvageMultiplier);
  public double OfflineRate=>Best==0?0:Math.Min(60,4+Best*1.5)*SalvageMultiplier;
  public int Cost(string kind)=> (int)((kind=="damage"?18:kind=="shell"?16:kind=="scavenging"?60:kind=="patch"?45:kind=="tide"?75:30)*Math.Pow(1.5,Rank(kind)));
  public int Rank(string kind)=>kind=="damage"?Upgrades.damage:kind=="shell"?Upgrades.shell:kind=="scavenging"?Upgrades.scavenging:kind=="patch"?Upgrades.patch:kind=="tide"?Upgrades.tide:Upgrades.speed;
  public EncounterModel(GameplayData settings){Settings=settings;Reset();}
  public HashSet<string> UnlockedWeapons=new HashSet<string>();
  public bool WeaponAvailable(string id){return Array.Exists(Settings.weapons,w=>w.id==id&&(Best>=w.unlock||UnlockedWeapons.Contains(id)));}
  public void Reset(){UnlockedWeapons.Clear();Progress=new HarborProgressData();Shattered=0;SelectedForm="step-shell";MeleeAttackIndex=0;Route=UltimateCharge=0;MeleeAdvance=UltimateTime=MeleeCycle=0;MeleeWalking=false;MeleeWalkTime=0;MeleeIdleTime=0;MeleeIdleActive=false;MeleeSince=EnemyAttack=99;Mods=new UpgradeData();Weapon="scrap";Gold=Kills=ShotSerial=Best=Xp=Charge=OfflineEarned=0;Stage=1;Upgrades=new UpgradeData();Farming=Paused=false;Time=Distance=0;PlayerHealth=MaxPlayerHealth;StartEncounter();}
  void StartEncounter(){Shattered=0;MeleeCycle=0;meleeLanded=false;meleeHitIndex=0;State=EncounterState.Travel;Age=0;EnemyX=520;Health=MaxHealth=(int)Math.Floor((Settings.enemyHealth+(Stage-1)*9)*Enemy.Health+.5f);Cycle=EnemyCycle=0;Shots.Clear();EnemyShots.Clear();Effects.Clear();SinceShot=99;PlayerHit=HitFlash=0;burst=LastReward=0;EnemyDepth=0;EnemyAttack=99;}
  public bool Equip(string id){if(!Array.Exists(Settings.weapons,w=>w.id==id))throw new ArgumentException("Unknown weapon");if(!WeaponAvailable(id))return false;Weapon=id;return true;}
  public bool Buy(string kind){if(kind!="damage"&&kind!="shell"&&kind!="speed"&&kind!="scavenging"&&kind!="patch"&&kind!="tide")return false;int cost=Cost(kind);if(Gold<cost||Rank(kind)>=Cap(kind))return false;Gold-=cost;if(kind=="damage")Upgrades.damage++;else if(kind=="speed")Upgrades.speed++;else if(kind=="scavenging")Upgrades.scavenging++;else if(kind=="patch")Upgrades.patch++;else if(kind=="tide")Upgrades.tide++;else {Upgrades.shell++;if(State!=EncounterState.Defeat)PlayerHealth=Math.Min(MaxPlayerHealth,PlayerHealth+25);}return true;}
  public int FarmStage=>Math.Max(1,Best-(Best%5==0?1:0));
  public void Retry(){UltimateTime=0;Stage=FarmStage;Farming=Best>0;PlayerHealth=MaxPlayerHealth;Paused=false;StartEncounter();}
  public bool FarmLevel(int stage){if(stage<1||stage>Best||UltimateActive||State==EncounterState.Defeat||(Farming&&stage==Stage))return false;Stage=stage;Farming=true;StartEncounter();return true;}
  public void ToggleFarm(){if(UltimateActive||Best==0||State==EncounterState.Defeat)return;Farming=!Farming;Stage=Farming?FarmStage:Best+1;StartEncounter();}
  public bool Volley(){if(UltimateActive||State!=EncounterState.Fight||Paused||Charge<100)return false;Charge=0;burst=3;return true;}
  void Enter(EncounterState state){State=state;Age=0;}
  public void Tick(float delta,float muzzleX,float muzzleY){
   if(Paused||State==EncounterState.Defeat)return;float dt=Math.Max(0,Math.Min(delta,.1f));for(int i=Effects.Count-1;i>=0;i--){Effects[i].life-=dt;if(Effects[i].life<=0)Effects.RemoveAt(i);}
   UltimateTime=Math.Max(0,UltimateTime-dt);string phase=UltimatePhase;bool recovering=State!=EncounterState.Fight&&MeleeCycle>0&&MeleeCycle<Settings.meleeDuration;
   float target=phase=="enter"||phase=="exit"||recovering?MeleeAdvance:phase=="melee"?((State==EncounterState.Fight||State==EncounterState.Raise)?MeleeReach:MeleeAdvance):0;
   float step=Math.Sign(target-MeleeAdvance)*Math.Min(Math.Abs(target-MeleeAdvance),Settings.meleeMoveSpeed*dt);MeleeWalking=Math.Abs(step)>.00001f;MeleeAdvance+=step;if(MeleeWalking)MeleeWalkTime+=dt;
   bool waiting=phase=="melee"&&(State==EncounterState.Reward||State==EncounterState.Lower||State==EncounterState.Travel)&&!recovering;
   if(waiting){MeleeIdleActive=true;MeleeIdleTime+=dt*.7f;}
   else if(phase=="melee"&&MeleeIdleActive){float landing=(float)Math.Ceiling((MeleeIdleTime-.000001f)*3)/3;MeleeIdleTime=Math.Min(landing,MeleeIdleTime+dt*.7f);if(MeleeIdleTime>=landing-.000001f)MeleeIdleActive=false;}
   else {MeleeIdleTime=0;MeleeIdleActive=false;}
   if(phase=="melee"&&MeleeIdleActive)Distance+=dt*Settings.enemySpeed*.6f*.7f;
   EnemyDepth+=((Submerged?44:0)-EnemyDepth)*(1-(float)Math.Exp(-dt*18));if(State!=EncounterState.Fight&&MeleeCycle>0)MeleeCycle=Math.Min(Settings.meleeDuration,MeleeCycle+dt);MeleeSince+=dt;EnemyAttack+=dt;Time+=dt;Age+=dt;SinceShot+=dt;HitFlash=Math.Max(0,HitFlash-dt);PlayerHit=Math.Max(0,PlayerHit-dt);
   switch(State){
    case EncounterState.Travel:float speed=Math.Min(Settings.enemySpeed,25+(EnemyX-330)*2.5f);if(!(phase=="melee"&&MeleeIdleActive))Distance+=dt*speed*.6f;EnemyX=Math.Max(330,EnemyX-dt*speed*(phase=="melee"?1.2f:1));if(EnemyX<=330 && (phase=="melee"||Age%Settings.walkCycleDuration<Math.Max(dt,Settings.walkCycleDuration/28)))Enter(EncounterState.Raise);break;
    case EncounterState.Raise:if(Age>=Settings.raiseDuration){Enter(EncounterState.Fight);Cycle=Interval-.12f;}break;
    case EncounterState.Fight:Cycle+=dt;EnemyCycle+=dt;float interval=burst>0?.15f:Interval;if(UltimatePhase=="melee"&&!MeleeWalking&&!MeleeIdleActive&&Math.Abs(MeleeAdvance-MeleeReach)<.01f){MeleeCycle+=dt;bool combo=SelectedForm=="samurai"&&MeleeAttackIndex%2==1;float a=Settings.meleeImpact,b=Settings.meleeDuration-a;float[] contacts=combo?new[]{a*9/15,a+b/14,a+b*7/14}:new[]{a};while(State==EncounterState.Fight&&meleeHitIndex<contacts.Length&&MeleeCycle+1e-6f>=contacts[meleeHitIndex]){int n=meleeHitIndex++;meleeLanded=true;MeleeSince=0;HitEnemy(Damage*(combo?(n==2?2:1):4),"melee",505,combo?(n==2?1.55f:n==1?1.15f:1.05f):SelectedForm=="samurai"?1.4f:1.15f);}if(MeleeCycle>=Settings.meleeDuration){MeleeCycle%=Settings.meleeDuration;MeleeAttackIndex++;meleeLanded=false;meleeHitIndex=0;}}if(!UltimateActive&&!MeleeWalking&&Cycle>=interval){Cycle=0;SinceShot=0;ShotSerial++;if(burst>0)burst--;Shots.Add(new Projectile{x=muzzleX,y=muzzleY,damage=Damage,weapon=Weapon,startX=muzzleX,speed=Equipped.speed});Effects.Add(new ShotEffect{weapon=Weapon,x=muzzleX,y=muzzleY,life=.12f,duration=.12f});}if(State==EncounterState.Fight&&EnemyCycle>=Enemy.Interval){EnemyCycle=0;EnemyAttack=0;if(Enemy.Action=="repair")Health=Math.Min(MaxHealth,Health+(int)Math.Floor(MaxHealth*.12+.5));int count=Enemy.Action=="burst"?3:1;for(int n=0;n<count;n++)EnemyShots.Add(new Projectile{x=EnemyX-35+n*28,y=500+n*5,damage=(int)Math.Floor(EnemyDamage/(count==3?2.0:1)+.5),weapon=Enemy.Action});}break;
    case EncounterState.Reward:if(Age>=Settings.rewardDuration)Enter(EncounterState.Lower);break;
    case EncounterState.Lower:if(Age>=Settings.lowerDuration){if(!Farming)Stage++;StartEncounter();}break;
   }
   for(int i=Shots.Count-1;i>=0;i--){var shot=Shots[i];shot.x+=dt*shot.speed;if(shot.x>=EnemyX-23){if(State==EncounterState.Fight){HitEnemy(shot.damage,shot.weapon,shot.y);}Shots.RemoveAt(i);}else if(shot.x>550)Shots.RemoveAt(i);}
   for(int i=EnemyShots.Count-1;i>=0;i--){var shot=EnemyShots[i];shot.x-=dt*310;if(shot.x<=145+MeleeAdvance){shot.damage=Math.Max(1,(int)Math.Floor(shot.damage*(UltimateActive?(Progress.formPath[Array.IndexOf(HarborProgress.Forms,SelectedForm)]=="bastion"?.15:.25):1)*(1-Shattered)+.5));PlayerHealth=Math.Max(0,PlayerHealth-shot.damage);if(!UltimateActive)UltimateCharge=Math.Min(100,UltimateCharge+5);PlayerHit=.22f;EnemyShots.RemoveAt(i);if(PlayerHealth==0){Enter(EncounterState.Defeat);Shots.Clear();EnemyShots.Clear();return;}}}
  }
  public void HitEnemy(int damage,string weapon,float y,float power=1){if(State!=EncounterState.Fight)return;bool melee=weapon=="melee";if(Submerged&&!melee)return;damage=HarborProgress.Hit(this,damage,weapon);damage=(int)Math.Floor(damage*(Guarded&&!melee?.35:1)+.5);Health=Math.Max(0,Health-damage);HitFlash=.12f;Effects.Add(new ShotEffect{weapon=weapon,x=melee?124+MeleeAdvance+Settings.meleeReach-4:EnemyX,y=y,life=.6f,duration=.6f,impact=true,power=power});Charge=Math.Min(100,Charge+8);if(!UltimateActive)UltimateCharge=Math.Min(100,UltimateCharge+ChargePerHit);if(Health==0){HarborProgress.Kill(this,weapon);Kills++;LastReward=Reward;Gold=Math.Min(1000000000,Gold+LastReward);Best=Math.Max(Best,Stage);Xp+=Boss?35:10;PlayerHealth=Math.Min(MaxPlayerHealth,PlayerHealth+(int)Math.Floor(MaxPlayerHealth*RecoveryPercent/100.0+.5));Enter(EncounterState.Reward);EnemyShots.Clear();burst=0;}}
  public SaveData Save(long now){return new SaveData{weaponUnlockVersion=1,unlockedWeapons=Array.ConvertAll(Array.FindAll(Settings.weapons,w=>WeaponAvailable(w.id)),w=>w.id),progress=UnityEngine.JsonUtility.FromJson<HarborProgressData>(UnityEngine.JsonUtility.ToJson(Progress)),selectedForm=SelectedForm,route=Route,ultimateCharge=UltimateCharge,mods=new UpgradeData{damage=Mods.damage,shell=Mods.shell,speed=Mods.speed},savedAt=now,weapon=Weapon,gold=Gold,kills=Kills,best=Best,xp=Xp,charge=Charge,stage=Stage,playerHp=PlayerHealth,farming=Farming,defeated=State==EncounterState.Defeat,upgrades=new UpgradeData{damage=Upgrades.damage,shell=Upgrades.shell,speed=Upgrades.speed,scavenging=Upgrades.scavenging,patch=Upgrades.patch,tide=Upgrades.tide}};}
  static int Clamp(int value,int min,int max)=>Math.Min(max,Math.Max(min,value));
  public bool Load(SaveData data,long now){if(data==null||data.version!=1)return false;Reset();Progress=HarborProgress.Load(data.progress);ChooseForm(data.selectedForm);UltimateCharge=Clamp(data.ultimateCharge,0,100);var mods=data.mods??new UpgradeData();Mods=new UpgradeData{damage=Clamp(mods.damage,0,3),shell=Clamp(mods.shell,0,3),speed=Clamp(mods.speed,0,3)};Gold=Clamp(data.gold,0,1000000000);Kills=Clamp(data.kills,0,10000000);Best=Clamp(data.best,0,10000);foreach(var w in Settings.weapons){if(data.weaponUnlockVersion==1?(data.unlockedWeapons!=null&&Array.IndexOf(data.unlockedWeapons,w.id)>=0):Best>=(w.id=="repeater"?3:w.id=="lowtide"?5:w.unlock))UnlockedWeapons.Add(w.id);}Xp=Clamp(data.xp,0,1000000000);Route=Clamp(data.route,0,Math.Min(2,Best/5));var u=data.upgrades??new UpgradeData();Upgrades=new UpgradeData{damage=Clamp(u.damage,0,30),shell=Clamp(u.shell,0,30),speed=Clamp(u.speed,0,30),scavenging=Clamp(u.scavenging,0,20),patch=Clamp(u.patch,0,10),tide=Clamp(u.tide,0,8)};Stage=Clamp(data.stage,1,Best+1);Farming=data.farming&&Best>0;PlayerHealth=Clamp(data.playerHp,0,MaxPlayerHealth);Charge=Clamp(data.charge,0,100);if(WeaponAvailable(data.weapon))Weapon=data.weapon;if(data.progress==null&&Best>=5){Progress.district[0]=true;HarborProgress.Award(Progress,HarborProgress.CaptainRewards[0]);Progress.notice="Earlier captain victory credited: workshop permit and materials.";}double seconds=Math.Min(8*3600,Math.Max(0,(now-data.savedAt)/1000.0));OfflineEarned=(int)Math.Floor(seconds/60*OfflineRate);Gold=Math.Min(1000000000,Gold+OfflineEarned);StartEncounter();if(data.defeated||PlayerHealth==0)Enter(EncounterState.Defeat);return true;}
 }
}
