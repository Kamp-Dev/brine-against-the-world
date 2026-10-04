using System;
using UnityEngine;

namespace BrineGame
{
    [Serializable] public class Crop { public float x, y, w, h; }
    [Serializable] public class Grip { public float x, y, angle; }
    [Serializable] public class ClipData
    {
        public string sheet;
        public int columns, rows, cellWidth, cellHeight, frames;
        public float fps, duration, height;
        public Crop[] frameBounds;
        public Crop bounds;
        public Crop renderBounds;
        public Grip[] grips;
    }
    [Serializable] public class AnimationData { public ClipData walk, fire; }
    public struct Pose
    {
        public bool firing;
        public int frame;
        public Vector2 hand;
        public float angle, lean;
    }
    public static class BrineAnimation
    {
        // Older clips keep their original crop; new clips supply their own padded bounds.
        public static readonly Crop Common = new Crop { x = 190, y = 20, w = 413, h = 405 };
        public static Crop Bounds(ClipData clip) => clip.renderBounds != null && clip.renderBounds.h > 0 ? clip.renderBounds : Common;
        public static Pose Sample(EncounterModel model, AnimationData data)
        {
            bool firing = model.State != EncounterState.Travel && !model.MeleeWalking;
            float phase = 6;
            if (!firing) phase = ((model.MeleeWalking?model.MeleeWalkTime:model.Age) * data.walk.fps) % data.walk.frames;
            else if (model.State == EncounterState.Raise) phase = Mathf.Min(6, model.Age / model.Settings.raiseDuration * 7);
            else if (model.State == EncounterState.Lower) phase = Mathf.Min(6, model.Age / model.Settings.lowerDuration * 7);
            bool lowering = firing && model.State == EncounterState.Lower;
            int frame = lowering ? 6-Mathf.FloorToInt(phase) : Mathf.FloorToInt(phase);
            var clip = firing ? data.fire : data.walk;
            var grip = clip.grips[frame]; var next = clip.grips[lowering ? Mathf.Max(0,frame-1) : firing ? Mathf.Min(6,frame+1) : (frame+1)%clip.frames];
            var bounds = Bounds(clip); float k = 120 / bounds.h;
            float u = Mathf.Min(1,model.SinceShot/model.Settings.recoilDuration);
            float kick = firing ? Mathf.Sin(Mathf.PI*u)*Mathf.Exp(-3*u)*3*model.Equipped.recoil : 0;
            float lean = -kick*.012f;
            float hx = 124-bounds.w*k/2+(grip.x-bounds.x)*k, hy = 452+(grip.y-bounds.y)*k;
            float dx=hx-124,dy=hy-572;
            float bearing=0; // Source weapon barrels point horizontally.
            return new Pose {
                firing=firing,frame=frame,lean=lean,
                hand=new Vector2(124+dx*Mathf.Cos(lean)-dy*Mathf.Sin(lean),572+dx*Mathf.Sin(lean)+dy*Mathf.Cos(lean)),
                angle=grip.angle+(next.angle-grip.angle)*(phase-Mathf.FloorToInt(phase))+bearing+lean-kick*.025f
            };
        }

        public static Vector2 Muzzle(Pose pose, WeaponData weapon)
        {
            float x=(weapon.muzzleX-weapon.gripX)*weapon.scale*.8f,y=(weapon.muzzleY-weapon.gripY)*weapon.scale*.8f;
            return pose.hand+new Vector2(Mathf.Cos(pose.angle)*x-Mathf.Sin(pose.angle)*y,Mathf.Sin(pose.angle)*x+Mathf.Cos(pose.angle)*y);
        }
    }
}

