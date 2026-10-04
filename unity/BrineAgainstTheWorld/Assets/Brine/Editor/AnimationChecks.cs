using System;
using UnityEngine;
using BrineGame;

public static class AnimationChecks
{
    static void Require(bool condition, string message) { if (!condition) throw new Exception("Animation check: " + message); }
    public static void Run()
    {
        var settings=JsonUtility.FromJson<GameplayData>(Resources.Load<TextAsset>("gameplay").text);
        var data=JsonUtility.FromJson<AnimationData>(Resources.Load<TextAsset>("animation").text);
        Require(data.walk.frames==28 && data.fire.frames==7,"approved frame counts");
        foreach(var weapon in settings.weapons)
        {
            var m=new EncounterModel(settings); m.Best=100; m.Equip(weapon.id);
            var neutral=BrineAnimation.Sample(m,data);
            bool raised=false,lowered=false,fought=false;
            for(int i=0;i<2400;i++)
            {
                var p=BrineAnimation.Sample(m,data);
                Require(p.frame>=0 && p.frame<(p.firing?7:28),"valid safe frame");
                Require(!float.IsNaN(p.hand.x) && !float.IsNaN(p.angle),"finite gun transform");
                var muzzle=BrineAnimation.Muzzle(p,weapon);
                m.Tick(1f/120,muzzle.x,muzzle.y);
                if(m.State==EncounterState.Raise && m.Age==0)
                {
                    var join=BrineAnimation.Sample(m,data);
                    Require(join.frame==0 && Vector2.Distance(join.hand,neutral.hand)<.001f,"matching walk-to-raise join");raised=true;
                }
                if(m.State==EncounterState.Fight)fought=true;
                if(m.State==EncounterState.Lower && m.Age>.38f)
                {
                    var join=BrineAnimation.Sample(m,data);
                    Require(join.frame==0 && Vector2.Distance(join.hand,neutral.hand)<.001f,"matching lower-to-walk join");lowered=true;
                }
            }
            Require(raised && fought && lowered,"full cycle for "+weapon.id);
        }
        Debug.Log("BRINE_ANIMATION_CHECKS_PASS");
    }
}
