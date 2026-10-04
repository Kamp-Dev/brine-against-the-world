using System;
using System.Collections.Generic;
using UnityEngine;
namespace BrineGame {
 [Serializable] public class ShellRigPart { public string id; public int x,y,w,h; public float px,py,ex,ey; }
 [Serializable] public class ShellRigData { public string sheet; public float stride; public ShellRigPart[] parts; }
 public sealed class StepShellWalkRig : MonoBehaviour {
  ShellRigData data; readonly Dictionary<string,SpriteRenderer> renderers=new Dictionary<string,SpriteRenderer>();
  public struct LegPose { public Vector2 hip,knee,ankle; public bool stance; }
  public static LegPose Leg(float phase,bool far){
   float p=Mathf.Repeat(phase+(far?.5f:0),1),u=p<.5f?p*2:(p-.5f)*2;
   float x=p<.5f?21-42*u:-21+42*u*u*(3-2*u),lift=p<.5f?0:10*Mathf.Sin(Mathf.PI*u);
   var hip=new Vector2(far?9:-11,-40+Mathf.Cos(phase*Mathf.PI*4)*1.1f);
   var ankle=new Vector2(hip.x+x,-13-lift-(far?2:0));var delta=ankle-hip;
   float d=Mathf.Min(48.99f,delta.magnitude),a=Mathf.Atan2(delta.y,delta.x)-Mathf.Acos(Mathf.Clamp((27*27+d*d-22*22)/(54*d),-1,1));
   return new LegPose{hip=hip,knee=hip+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*27,ankle=ankle,stance=p<.5f};
  }
  public void Build(ShellRigData rig){data=rig;var tex=Resources.Load<Texture2D>("step-shell-rig");foreach(var p in data.parts){
   var r=new GameObject("Step Shell "+p.id).AddComponent<SpriteRenderer>();r.transform.SetParent(transform,false);
   r.sprite=Sprite.Create(tex,new Rect(p.x,tex.height-p.y-p.h,p.w,p.h),new Vector2(p.px/p.w,1-p.py/p.h),100,0,SpriteMeshType.FullRect);
   r.sortingOrder=p.id=="body"?18:(p.id.StartsWith("far")?10:14)+(p.id.EndsWith("Foot")?3:p.id.EndsWith("Shin")?2:p.id.EndsWith("Ankle")?1:0);r.enabled=false;renderers.Add(p.id,r);
  }}
  ShellRigPart Part(string id){return Array.Find(data.parts,p=>p.id==id);}
  void Place(string id,Vector2 pos,float angle,float scale,float advance){var r=renderers[id];r.transform.position=BrineGameController.World(124+advance+pos.x,572+pos.y);r.transform.localRotation=Quaternion.Euler(0,0,-angle*Mathf.Rad2Deg);r.transform.localScale=Vector3.one*scale;}
  void Bone(string id,Vector2 a,Vector2 b,float advance){var p=Part(id);Vector2 source=new Vector2(p.ex-p.px,p.ey-p.py),target=b-a;Place(id,a,Mathf.Atan2(target.y,target.x)-Mathf.Atan2(source.y,source.x),target.magnitude/source.magnitude,advance);}
  public void Render(bool visible,EncounterModel m){foreach(var r in renderers.Values)r.enabled=visible;if(!visible)return;
   float phase=m.MeleeWalking?m.MeleeAdvance/data.stride:m.Age;
   foreach(bool far in new[]{true,false}){var l=Leg(phase,far);string prefix=far?"far":"near";Bone(prefix+"Thigh",l.hip,l.knee,m.MeleeAdvance);Place(prefix+"Ankle",l.ankle,0,far?.14f:.16f,m.MeleeAdvance);Bone(prefix+"Shin",l.knee,l.ankle,m.MeleeAdvance);Place(prefix+"Foot",l.ankle,0,far?.124f:.15f,m.MeleeAdvance);}
   Place("body",new Vector2(0,-140+Mathf.Cos(phase*Mathf.PI*4)*1.1f),0,.22f,m.MeleeAdvance);
  }
  void OnDestroy(){foreach(var r in renderers.Values)if(r&&r.sprite)Destroy(r.sprite);}
 }
}
