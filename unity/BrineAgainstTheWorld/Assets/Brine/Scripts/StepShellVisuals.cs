using System;
using UnityEngine;
namespace BrineGame {
 [Serializable] public class StepShellData { public float height; public ClipData punch; }
 public sealed class StepShellVisuals : MonoBehaviour {
  StepShellData data;Sprite[] punch;SpriteRenderer actor;Mesh burstMesh;MeshRenderer burst;LineRenderer border;Material material;
  public void Build(){
   data=JsonUtility.FromJson<StepShellData>(Resources.Load<TextAsset>("step-shell").text);
   punch=Frames(Resources.Load<Texture2D>("step-shell-punch"),data.punch);
   actor=new GameObject("Approved Step Shell model").AddComponent<SpriteRenderer>();actor.transform.SetParent(transform,false);actor.sortingOrder=10;
   var go=new GameObject("Local shell transformation burst");go.transform.SetParent(transform,false);burstMesh=new Mesh();go.AddComponent<MeshFilter>().sharedMesh=burstMesh;burst=go.AddComponent<MeshRenderer>();material=new Material(Shader.Find("Sprites/Default"));burst.sharedMaterial=material;burst.sortingOrder=22;
   border=go.AddComponent<LineRenderer>();border.sharedMaterial=material;border.useWorldSpace=false;border.loop=true;border.positionCount=20;border.startWidth=border.endWidth=.03f;border.startColor=border.endColor=new Color32(24,38,39,255);border.sortingOrder=23;
  }
  Sprite[] Frames(Texture2D tex,ClipData clip){if(!tex)throw new InvalidOperationException("Step Shell texture did not import as a 2D image");if(clip==null||clip.renderBounds==null)throw new InvalidOperationException("Step Shell frame metadata is missing");var b=clip.renderBounds;var result=new Sprite[clip.frames];for(int i=0;i<result.Length;i++){b=clip.frameBounds!=null&&i<clip.frameBounds.Length?clip.frameBounds[i]:clip.renderBounds;result[i]=Sprite.Create(tex,new Rect(i%clip.columns*clip.cellWidth+b.x,tex.height-(i/clip.columns*clip.cellHeight+b.y+b.h),b.w,b.h),new Vector2(.5f,0),100,0,SpriteMeshType.FullRect);}return result;}
  public bool Render(EncounterModel m){
   string phase=m.UltimatePhase;float t=Mathf.Clamp01(m.TransformProgress);bool transition=phase=="enter"||phase=="exit";
   bool show=phase=="melee"||(phase=="enter"&&t>=.5f)||(phase=="exit"&&t<.5f);
   bool walking=phase=="melee"&&(m.MeleeWalking||m.State==EncounterState.Travel);
   bool attacking=phase=="melee"&&!walking&&m.MeleeCycle>0&&m.MeleeCycle<m.Settings.meleeDuration;
   var clip=data.punch;int frame=0;
   if(attacking)frame=Mathf.Min(clip.frames-1,Mathf.FloorToInt(m.MeleeCycle/m.Settings.meleeDuration*clip.frames));
   actor.enabled=show;actor.sprite=punch[frame];actor.transform.position=BrineGameController.World(124+m.MeleeAdvance,572);float k=(clip.height>0?clip.height:data.height)/clip.renderBounds.h;actor.transform.localScale=new Vector3(k,k*(transition?1-.06f*Mathf.Sin(t*Mathf.PI):1),1);
   float cover=transition?Mathf.Min(1,Mathf.Pow(Mathf.Sin(t*Mathf.PI),4)*1.5f):0;burst.enabled=border.enabled=cover>.005f;
   if(burst.enabled){var v=new Vector3[21];var c=new Color[21];var triangles=new int[60];v[20]=BrineGameController.World(124+m.MeleeAdvance,506);c[20]=new Color32(217,103,56,255);var outline=new Vector3[20];for(int i=0;i<20;i++){float a=i*Mathf.PI/10,r=i%2==0?.86f:1;v[i]=BrineGameController.World(124+m.MeleeAdvance+Mathf.Cos(a)*94*r*cover,506+Mathf.Sin(a)*92*r*cover);outline[i]=v[i];c[i]=c[20];triangles[i*3]=20;triangles[i*3+1]=i;triangles[i*3+2]=(i+1)%20;}burstMesh.Clear();burstMesh.vertices=v;burstMesh.colors=c;burstMesh.triangles=triangles;burstMesh.RecalculateBounds();border.SetPositions(outline);}
   return show;
  }
  void OnDestroy(){if(burstMesh)Destroy(burstMesh);if(material)Destroy(material);if(punch!=null)foreach(var s in punch)Destroy(s);}
 }
}
