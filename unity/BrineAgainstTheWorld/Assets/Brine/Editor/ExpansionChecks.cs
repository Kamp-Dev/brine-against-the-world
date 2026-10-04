using System;
using BrineGame;
using UnityEngine;
public static class ExpansionChecks {
 static void Require(bool ok,string message){if(!ok)throw new Exception("Expansion: "+message);}
 static EncounterModel Battle(GameplayData data,int stage){var m=new EncounterModel(data);m.Load(new SaveData{savedAt=1,best=stage-1,stage=stage,weapon="scrap",playerHp=100,upgrades=new UpgradeData()},1);for(int i=0;i<600&&m.State!=EncounterState.Fight;i++)m.Tick(.02f,215,500);Require(m.State==EncounterState.Fight,"battle reached");m.Health=m.MaxHealth=10000;return m;}
 public static void Run(){
  var data=JsonUtility.FromJson<GameplayData>(Resources.Load<TextAsset>("gameplay").text);
  var m=Battle(data,1);m.UltimateCharge=100;Require(m.Ultimate()&&!m.Volley(),"activate melee");m.EnemyShots.Add(new Projectile{x=146,y=500,damage=40});m.Tick(.02f,215,500);Require(m.PlayerHealth==90,"75 percent resistance");for(int i=0;i<130;i++)m.Tick(.02f,215,500);Require(m.Health==9952&&m.Shots.Count==0,"4x melee replaces shots");m.Paused=true;float time=m.UltimateTime;m.Tick(.1f,215,500);Require(m.UltimateTime==time,"pause freezes ultimate");m.Paused=false;m.EnemyCycle=-100;m.EnemyShots.Clear();for(int i=0;i<470;i++)m.Tick(.02f,215,500);Require(!m.UltimateActive&&m.ShotSerial>0&&m.MeleeAdvance<.01f,"returns to gun and lane");
  m=Battle(data,3);m.HitEnemy(100,"scrap",500);Require(m.Health==9965,"shield reduction");m.HitEnemy(100,"melee",500);Require(m.Health==9865,"melee pierces shield");
  m=Battle(data,6);m.EnemyCycle=m.Enemy.Interval*.5f;m.HitEnemy(100,"scrap",500);Require(m.Health==10000,"burrow evades shot");m.HitEnemy(100,"melee",500);Require(m.Health==9900,"melee hits burrow");
  m=Battle(data,4);m.Health=5000;m.EnemyCycle=m.Enemy.Interval-.01f;m.Cycle=-100;m.Tick(.02f,215,500);Require(m.Health==6200,"repair action");
  m=Battle(data,2);m.EnemyCycle=m.Enemy.Interval-.01f;m.Cycle=-100;m.Tick(.02f,215,500);Require(m.EnemyShots.Count==3,"enemy burst");
  m.Best=10;m.Gold=1000;Require(m.ChooseRoute(2)&&m.BuyMod()&&m.ModRank==1,"route and workshop");m.UltimateCharge=83;var saved=m.Save(1000);var copy=new EncounterModel(data);copy.Load(saved,1000);Require(copy.ModRank==1&&copy.Route==2&&copy.UltimateCharge==83,"save new progression");
  Debug.Log("BRINE_EXPANSION_CHECKS_PASS");
 }
}
