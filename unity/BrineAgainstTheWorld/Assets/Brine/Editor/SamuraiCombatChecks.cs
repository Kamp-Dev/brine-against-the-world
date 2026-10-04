using System;
using UnityEngine;
using BrineGame;
public static class SamuraiCombatChecks {
 public static void Run(){var settings=JsonUtility.FromJson<GameplayData>(Resources.Load<TextAsset>("gameplay").text);foreach(int fps in new[]{10,30,60,120}){var m=new EncounterModel(settings);for(int i=0;i<600&&m.State!=EncounterState.Fight;i++)m.Tick(.02f,180,500);m.ChooseForm("samurai");m.Health=m.MaxHealth=100000;m.UltimateCharge=100;if(!m.Ultimate())throw new Exception("Samurai activation failed");m.UltimateTime=8;m.MeleeAdvance=m.MeleeReach;m.MeleeAttackIndex=1;int hits=0,total=0;for(float t=0;t<settings.meleeDuration-.02f;t+=1f/fps){int hp=m.Health;m.Tick(1f/fps,180,500);if(m.Health<hp){hits++;total+=hp-m.Health;}}if(hits!=3||total!=m.Damage*4)throw new Exception("Samurai contacts or total damage failed at "+fps);m.Paused=true;int before=m.Health;m.Tick(.1f,180,500);if(m.Health!=before)throw new Exception("Paused Samurai dealt damage");}Debug.Log("SAMURAI_COMBAT_CHECKS_PASS");}
}
