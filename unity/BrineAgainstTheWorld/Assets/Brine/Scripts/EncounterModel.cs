using System;
using System.Collections.Generic;

namespace BrineGame
{
 [Serializable] public class WeaponData { public string id, name, art, description; public int damage,unlock,width,height,splitX,splitY; public float length,interval=1,speed=950,recoil=1,gripX,gripY,muzzleX,muzzleY,scale; }
 [Serializable] public class GameplayData {
  public float walkCycleDuration=1.75f;
  public float raiseDuration, lowerDuration, shotInterval, recoilDuration, rewardDuration, bulletSpeed, enemySpeed;
  public int reward, enemyHealth; public WeaponData[] weapons;
 }
 [Serializable] public class UpgradeData { public int damage, shell, speed; }
 [Serializable] public class SaveData {
  public int version=1; public long savedAt; public string weapon; public int gold,kills,best,xp,charge,stage,playerHp;
  public UpgradeData upgrades; public bool farming,defeated;
 }
 public sealed class EnemyData {
  public string Name, Art; public float Health, Interval, Height; public int Damage;
  public EnemyData(string name,string art,float health,int damage,float interval,float height){Name=name;Art=art;Health=health;Damage=damage;Interval=interval;Height=height;}
 }
 public enum EncounterState { Travel, Raise, Fight, Reward, Lower, Defeat }
 public sealed class Projectile { public float x,y,startX,speed; public int damage; public string weapon; }
 public sealed class ShotEffect { public string weapon; public float x,y,life,duration; public bool impact; }
 public sealed class EncounterModel {
  public readonly List<ShotEffect> Effects=new List<ShotEffect>();
  public readonly GameplayData Settings;
  public EncounterState State {get;private set;}
  public string Weapon {get;private set;}
  public int Gold,Kills,Stage,Health,MaxHealth,ShotSerial,Best,Xp,PlayerHealth,Charge,OfflineEarned,LastReward;
  public float Age,EnemyX,Time,Cycle,Distance,SinceShot,HitFlash,PlayerHit,EnemyCycle;
  public bool Paused,Farming;
  public UpgradeData Upgrades=new UpgradeData();
  int burst;
  public readonly List<Projectile> Shots=new List<Projectile>(), EnemyShots=new List<Projectile>();
  public static readonly EnemyData[] Enemies={new EnemyData("Salt Porter","salt-porter",1,8,2.6f,132),new EnemyData("Pipe Pilfer","pipe-pilfer",.85f,6,1.8f,154),new EnemyData("Sluice Keeper","sluice-keeper",2.3f,17,2.4f,182)};
  public EnemyData Enemy=>Enemies[Stage%5==0?2:(Stage-1)%2];
  public bool Boss=>Stage%5==0;
  public WeaponData Equipped=>Array.Find(Settings.weapons,w=>w.id==Weapon);
  public int Level=>1+(int)Math.Sqrt(Xp/30.0);
  public int NextXp=>Level*Level*30;
  public int MaxPlayerHealth=>100+Upgrades.shell*25+(Level-1)*8;
  public int Damage=>Equipped.damage+Upgrades.damage*4+(Level-1)*2;
  public float Interval=>Settings.shotInterval*Equipped.interval/(1+Upgrades.speed*.08f);
  public int EnemyDamage=>Enemy.Damage+(int)((Stage-1)*1.6f);
  public int Reward=>(Settings.reward+(Stage-1)*2)*(Boss?4:1);
  public double OfflineRate=>Best==0?0:Math.Min(60,4+Best*1.5);
  public int Cost(string kind)=> (int)((kind=="damage"?18:kind=="shell"?16:30)*Math.Pow(1.5,Rank(kind)));
  public int Rank(string kind)=>kind=="damage"?Upgrades.damage:kind=="shell"?Upgrades.shell:Upgrades.speed;
  public EncounterModel(GameplayData settings){Settings=settings;Reset();}
  public void Reset(){Weapon="scrap";Gold=Kills=ShotSerial=Best=Xp=Charge=OfflineEarned=0;Stage=1;Upgrades=new UpgradeData();Farming=Paused=false;Time=Distance=0;PlayerHealth=MaxPlayerHealth;StartEncounter();}
  void StartEncounter(){State=EncounterState.Travel;Age=0;EnemyX=520;Health=MaxHealth=(int)Math.Floor((Settings.enemyHealth+(Stage-1)*9)*Enemy.Health+.5f);Cycle=EnemyCycle=0;Shots.Clear();EnemyShots.Clear();Effects.Clear();SinceShot=99;PlayerHit=HitFlash=0;burst=LastReward=0;}
  public bool Equip(string id){if(!Array.Exists(Settings.weapons,w=>w.id==id))throw new ArgumentException("Unknown weapon");if(Best<Array.Find(Settings.weapons,w=>w.id==id).unlock)return false;Weapon=id;return true;}
  public bool Buy(string kind){if(kind!="damage"&&kind!="shell"&&kind!="speed")return false;int cost=Cost(kind);if(Gold<cost||Rank(kind)>=30)return false;Gold-=cost;if(kind=="damage")Upgrades.damage++;else if(kind=="speed")Upgrades.speed++;else {Upgrades.shell++;if(State!=EncounterState.Defeat)PlayerHealth=Math.Min(MaxPlayerHealth,PlayerHealth+25);}return true;}
  public int FarmStage=>Math.Max(1,Best-(Best%5==0?1:0));
  public void Retry(){Stage=FarmStage;Farming=Best>0;PlayerHealth=MaxPlayerHealth;Paused=false;StartEncounter();}
  public void ToggleFarm(){if(Best==0||State==EncounterState.Defeat)return;Farming=!Farming;Stage=Farming?FarmStage:Best+1;StartEncounter();}
  public bool Volley(){if(State!=EncounterState.Fight||Paused||Charge<100)return false;Charge=0;burst=3;return true;}
  void Enter(EncounterState state){State=state;Age=0;}
  public void Tick(float delta,float muzzleX,float muzzleY){
   if(Paused||State==EncounterState.Defeat)return;float dt=Math.Max(0,Math.Min(delta,.1f));for(int i=Effects.Count-1;i>=0;i--){Effects[i].life-=dt;if(Effects[i].life<=0)Effects.RemoveAt(i);}
   Time+=dt;Age+=dt;SinceShot+=dt;HitFlash=Math.Max(0,HitFlash-dt);PlayerHit=Math.Max(0,PlayerHit-dt);
   switch(State){
    case EncounterState.Travel:float speed=Math.Min(Settings.enemySpeed,25+(EnemyX-330)*2.5f);Distance+=dt*speed*.6f;EnemyX=Math.Max(330,EnemyX-dt*speed);if(EnemyX<=330 && Age%Settings.walkCycleDuration<Math.Max(dt,Settings.walkCycleDuration/28))Enter(EncounterState.Raise);break;
    case EncounterState.Raise:if(Age>=Settings.raiseDuration){Enter(EncounterState.Fight);Cycle=Interval-.12f;}break;
    case EncounterState.Fight:Cycle+=dt;EnemyCycle+=dt;float interval=burst>0?.15f:Interval;if(Cycle>=interval){Cycle=0;SinceShot=0;ShotSerial++;if(burst>0)burst--;Shots.Add(new Projectile{x=muzzleX,y=muzzleY,damage=Damage,weapon=Weapon,startX=muzzleX,speed=Equipped.speed});Effects.Add(new ShotEffect{weapon=Weapon,x=muzzleX,y=muzzleY,life=.12f,duration=.12f});}if(EnemyCycle>=Enemy.Interval){EnemyCycle=0;EnemyShots.Add(new Projectile{x=EnemyX-35,y=500,damage=EnemyDamage});}break;
    case EncounterState.Reward:if(Age>=Settings.rewardDuration)Enter(EncounterState.Lower);break;
    case EncounterState.Lower:if(Age>=Settings.lowerDuration){if(!Farming)Stage++;StartEncounter();}break;
   }
   for(int i=Shots.Count-1;i>=0;i--){var shot=Shots[i];shot.x+=dt*shot.speed;if(shot.x>=EnemyX-23){if(State==EncounterState.Fight){Health=Math.Max(0,Health-shot.damage);HitFlash=.12f;Effects.Add(new ShotEffect{weapon=shot.weapon,x=EnemyX,y=shot.y,life=.6f,duration=.6f,impact=true});Charge=Math.Min(100,Charge+8);if(Health==0){Kills++;LastReward=Reward;Gold=Math.Min(1000000000,Gold+LastReward);Best=Math.Max(Best,Stage);Xp+=Boss?35:10;PlayerHealth=Math.Min(MaxPlayerHealth,PlayerHealth+(int)Math.Floor(MaxPlayerHealth*.12+.5));Enter(EncounterState.Reward);EnemyShots.Clear();burst=0;}}Shots.RemoveAt(i);}else if(shot.x>550)Shots.RemoveAt(i);}
   for(int i=EnemyShots.Count-1;i>=0;i--){var shot=EnemyShots[i];shot.x-=dt*310;if(shot.x<=145){PlayerHealth=Math.Max(0,PlayerHealth-shot.damage);PlayerHit=.22f;EnemyShots.RemoveAt(i);if(PlayerHealth==0){Enter(EncounterState.Defeat);Shots.Clear();EnemyShots.Clear();return;}}}
  }
  public SaveData Save(long now){return new SaveData{savedAt=now,weapon=Weapon,gold=Gold,kills=Kills,best=Best,xp=Xp,charge=Charge,stage=Stage,playerHp=PlayerHealth,farming=Farming,defeated=State==EncounterState.Defeat,upgrades=new UpgradeData{damage=Upgrades.damage,shell=Upgrades.shell,speed=Upgrades.speed}};}
  static int Clamp(int value,int min,int max)=>Math.Min(max,Math.Max(min,value));
  public bool Load(SaveData data,long now){if(data==null||data.version!=1)return false;Reset();Gold=Clamp(data.gold,0,1000000000);Kills=Clamp(data.kills,0,10000000);Best=Clamp(data.best,0,10000);Xp=Clamp(data.xp,0,1000000000);var u=data.upgrades??new UpgradeData();Upgrades=new UpgradeData{damage=Clamp(u.damage,0,30),shell=Clamp(u.shell,0,30),speed=Clamp(u.speed,0,30)};Stage=Clamp(data.stage,1,Best+1);Farming=data.farming&&Best>0;PlayerHealth=Clamp(data.playerHp,0,MaxPlayerHealth);Charge=Clamp(data.charge,0,100);if(Array.Exists(Settings.weapons,w=>w.id==data.weapon&&Best>=w.unlock))Weapon=data.weapon;double seconds=Math.Min(8*3600,Math.Max(0,(now-data.savedAt)/1000.0));OfflineEarned=(int)Math.Floor(seconds/60*OfflineRate);Gold=Math.Min(1000000000,Gold+OfflineEarned);StartEncounter();if(data.defeated||PlayerHealth==0)Enter(EncounterState.Defeat);return true;}
 }
}
