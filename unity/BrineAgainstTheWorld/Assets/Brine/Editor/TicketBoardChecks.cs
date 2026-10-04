using System;
using UnityEngine;
using BrineGame;
public static class TicketBoardChecks {
 static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
 public static void Run(){var settings=JsonUtility.FromJson<GameplayData>(Resources.Load<TextAsset>("gameplay").text);foreach(string kind in new[]{"scavenging","patch","tide"}){var m=new EncounterModel(settings);Check(!m.Buy(kind),"Unaffordable upgrade");m.Gold=1000000000;while(m.Rank(kind)<m.Cap(kind))Check(m.Buy(kind),"Buy "+kind);int gold=m.Gold;Check(!m.Buy(kind)&&m.Gold==gold,"Cap "+kind);var copy=new EncounterModel(settings);copy.Load(m.Save(1000),1000);Check(copy.Rank(kind)==m.Cap(kind),"Save "+kind);}
 var a=new EncounterModel(settings);a.Best=10;a.Stage=5;int reward=a.Reward;double rate=a.OfflineRate;a.Upgrades.scavenging=20;Check(a.Reward==reward*2&&a.OfflineRate==rate*2,"Scavenging payout");var away=new EncounterModel(settings);away.Load(a.Save(1000),1000+9*3600000);Check(away.OfflineEarned==(int)Math.Floor(480*rate*2),"Offline cap");
 var fight=new EncounterModel(settings);for(int i=0;i<600&&fight.State!=EncounterState.Fight;i++)fight.Tick(.02f,180,500);fight.Upgrades.patch=10;fight.Upgrades.tide=8;fight.PlayerHealth=10;fight.Health=1;fight.HitEnemy(12,"scrap",500);Check(fight.PlayerHealth==32&&fight.UltimateCharge==20,"Patch and tide effects");var saved=a.Save(1000);saved.upgrades=new UpgradeData();away.Load(saved,1000);Check(away.Upgrades.scavenging==0&&away.Upgrades.patch==0&&away.Upgrades.tide==0,"Legacy save defaults");Debug.Log("TICKET_BOARD_CHECKS_PASS");}
}
