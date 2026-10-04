using System;
using UnityEngine;
namespace BrineGame {
 [Serializable] public class StepShellData { public float height; public ClipData punch,walk; }
 public sealed class StepShellVisuals : MonoBehaviour {
  Texture2D keyedWalk;StepShellData data;Sprite[] punch,walk;SpriteRenderer actor;Mesh burstMesh;MeshRenderer burst;LineRenderer border;Material material;
  public void Build(){
   data=JsonUtility.FromJson<StepShellData>(Resources.Load<TextAsset>("step-shell").text);
   punch=Frames(Resources.Load<Texture2D>("step-shell-punch"),data.punch);walk=Frames(Resources.Load<Texture2D>("step-shell-walk"),data.walk);
   actor=new GameObject("Approved Step Shell model").AddComponent<SpriteRenderer>();actor.transform.SetParent(transform,false);actor.sortingOrder=10;
   var go=new GameObject("Local shell transformation burst");go.transform.SetParent(transform,false);burstMesh=new Mesh();go.AddComponent<MeshFilter>().sharedMesh=burstMesh;burst=go.AddComponent<MeshRenderer>();material=new Material(Shader.Find("Sprites/Default"));burst.sharedMaterial=material;burst.sortingOrder=22;
   border=go.AddComponent<LineRenderer>();border.sharedMaterial=material;border.useWorldSpace=false;border.loop=true;border.positionCount=20;border.startWidth=border.endWidth=.03f;border.startColor=border.endColor=new Color32(24,38,39,255);border.sortingOrder=23;
  }
  Sprite[] Frames(Texture2D tex,ClipData clip){if(!tex)throw new InvalidOperationException("Step Shell texture did not import as a 2D image");if(clip==null||clip.renderBounds==null)throw new InvalidOperationException("Step Shell frame metadata is missing");if(clip.backgroundKey){tex=KeyBackground(tex,clip);keyedWalk=tex;}var b=clip.renderBounds;var result=new Sprite[clip.frames];for(int i=0;i<result.Length;i++){b=clip.frameBounds!=null&&i<clip.frameBounds.Length?clip.frameBounds[i]:clip.renderBounds;result[i]=Sprite.Create(tex,new Rect(i%clip.columns*clip.cellWidth+b.x,tex.height-(i/clip.columns*clip.cellHeight+b.y+b.h),b.w,b.h),new Vector2(.5f,0),100,0,SpriteMeshType.FullRect);}return result;}
  public bool Render(EncounterModel m){
   string phase=m.UltimatePhase;float t=Mathf.Clamp01(m.TransformProgress);bool transition=phase=="enter"||phase=="exit";
   bool show=phase=="melee"||(phase=="enter"&&t>=.5f)||(phase=="exit"&&t<.5f);
   bool walking=phase=="melee"&&(m.MeleeWalking||m.State==EncounterState.Travel);
   bool attacking=phase=="melee"&&!walking&&m.MeleeCycle>0&&m.MeleeCycle<m.Settings.meleeDuration;
   var clip=walking?data.walk:data.punch;int frame=0;
   if(walking)frame=m.MeleeWalking?Mathf.Min(clip.frames-1,Mathf.FloorToInt(Mathf.Clamp01(m.MeleeAdvance/Mathf.Max(1,m.MeleeReach))*(clip.frames-1))):Mathf.FloorToInt(m.Age*clip.fps)%clip.frames;else if(attacking)frame=Mathf.Min(clip.frames-1,Mathf.FloorToInt(m.MeleeCycle/m.Settings.meleeDuration*clip.frames));
   actor.enabled=show;actor.sprite=(walking?walk:punch)[frame];actor.transform.position=BrineGameController.World(124+m.MeleeAdvance,572);float k=(clip.height>0?clip.height:data.height)/clip.renderBounds.h;actor.transform.localScale=new Vector3(k,k*(transition?1-.06f*Mathf.Sin(t*Mathf.PI):1),1);
   float cover=transition?Mathf.Min(1,Mathf.Pow(Mathf.Sin(t*Mathf.PI),4)*1.5f):0;burst.enabled=border.enabled=cover>.005f;
   if(burst.enabled){var v=new Vector3[21];var c=new Color[21];var triangles=new int[60];v[20]=BrineGameController.World(124+m.MeleeAdvance,506);c[20]=new Color32(217,103,56,255);var outline=new Vector3[20];for(int i=0;i<20;i++){float a=i*Mathf.PI/10,r=i%2==0?.86f:1;v[i]=BrineGameController.World(124+m.MeleeAdvance+Mathf.Cos(a)*94*r*cover,506+Mathf.Sin(a)*92*r*cover);outline[i]=v[i];c[i]=c[20];triangles[i*3]=20;triangles[i*3+1]=i;triangles[i*3+2]=(i+1)%20;}burstMesh.Clear();burstMesh.vertices=v;burstMesh.colors=c;burstMesh.triangles=triangles;burstMesh.RecalculateBounds();border.SetPositions(outline);}
   return show;
  }
  Texture2D KeyBackground(Texture2D source,ClipData clip){
   var rt=RenderTexture.GetTemporary(source.width,source.height,0,RenderTextureFormat.ARGB32,RenderTextureReadWrite.sRGB);var previous=RenderTexture.active;
   var tex=new Texture2D(source.width,source.height,TextureFormat.RGBA32,false);Graphics.Blit(source,rt);RenderTexture.active=rt;tex.ReadPixels(new Rect(0,0,source.width,source.height),0,0);RenderTexture.active=previous;RenderTexture.ReleaseTemporary(rt);
   var pixels=tex.GetPixels32();int width=tex.width,height=tex.height,cw=clip.cellWidth,ch=clip.cellHeight;var seen=new bool[pixels.Length];var queue=new int[cw*ch];
   for(int oy=0;oy<height;oy+=ch)for(int ox=0;ox<width;ox+=cw){int head=0,tail=0;
    Action<int,int> push=(x,y)=>{int i=y*width+x;var p=pixels[i];if(!seen[i]&&p.r>210&&p.g>198&&p.b>165&&p.r-p.g<30&&p.r-p.b<65){seen[i]=true;queue[tail++]=i;}};
    for(int x=ox;x<ox+cw;x++){push(x,oy);push(x,oy+ch-1);}for(int y=oy;y<oy+ch;y++){push(ox,y);push(ox+cw-1,y);}
    // Texture rows are bottom-up in Unity; seed the same anatomical gaps as the browser.
    for(int y=oy;y<oy+ch-230;y++)for(int x=ox;x<ox+cw;x++){var p=pixels[y*width+x];if((x-ox<330||x-ox>480||y-oy<ch-366)&&p.r>239&&p.g>231&&p.b>216)push(x,y);}
    while(head<tail){int i=queue[head++],x=i%width,y=i/width;pixels[i].a=0;if(x>ox)push(x-1,y);if(x<ox+cw-1)push(x+1,y);if(y>oy)push(x,y-1);if(y<oy+ch-1)push(x,y+1);}
   }
   tex.SetPixels32(pixels);tex.Apply(false,true);tex.filterMode=FilterMode.Bilinear;tex.wrapMode=TextureWrapMode.Clamp;return tex;
  }
  void OnDestroy(){if(keyedWalk)Destroy(keyedWalk);if(burstMesh)Destroy(burstMesh);if(material)Destroy(material);if(punch!=null)foreach(var s in punch)Destroy(s);if(walk!=null)foreach(var s in walk)Destroy(s);}
 }
}
