using System;
using UnityEngine;
using UnityEditor;
using BrineGame;
public static class HarborProgressChecks {
 static void Check(bool ok,string name){if(!ok)throw new Exception("Harbor progression: "+name);}
 public static void Run(){var data=JsonUtility.FromJson<GameplayData>(AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/Brine/Resources/gameplay.json").text);var m=new EncounterModel(data);var p=m.Progress;Check(!HarborProgress.Build(p,0),"building locked");p.district[0]=true;HarborProgress.Award(p,new[]{1000,1000,1000});for(int b=0;b<3;b++){for(int i=0;i<3;i++)Check(HarborProgress.Build(p,b),"restore");Check(!HarborProgress.Build(p,b),"cap");}Check(HarborProgress.Dispatch(p,0,1000),"send crew");Check(!HarborProgress.Collect(p,180999),"too early");Check(HarborProgress.Collect(p,181000),"return");Check(!HarborProgress.Collect(p,181000),"duplicate claim");p.counts[0]=12;Check(HarborProgress.Claim(p),"contract");Check(!HarborProgress.Claim(p),"contract duplicate");p.weaponXP[0]=20;Check(HarborProgress.ChooseWeapon(p,0,"pierce"),"mastery");p.formXP[1]=12;Check(HarborProgress.ChooseForm(p,1,"flow"),"form path");var save=m.Save(1000);var copy=new EncounterModel(data);Check(copy.Load(save,1000),"save load");Check(copy.Progress.build[0]==3&&copy.Progress.weaponPath[0]=="pierce","retained progress");p.materials[0]++;Check(save.progress.materials[0]!=p.materials[0],"snapshot isolation");m.Reset();Check(m.Progress.build[0]==0,"reset");Debug.Log("HARBOR_PROGRESSION_CHECKS_PASS");}
}
