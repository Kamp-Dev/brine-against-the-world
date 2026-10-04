using System;
using UnityEngine;
namespace BrineGame {
 [Serializable] public class SamuraiFrame {public float x,y,w,h,anchorX,anchorY,gripX,gripY,angle;}
 [Serializable] public class SamuraiClip {public string name,image;public float fps,scale;public SamuraiFrame[] frames;}
 [Serializable] public class SamuraiWeapon {public float width,height,gripX,gripY,scale;}
 [Serializable] public class SamuraiData {public SamuraiClip[] clips;public SamuraiWeapon weapon;}
 // Isolated review scene: never reads or writes the player's game save.
 public sealed class SamuraiPreview:MonoBehaviour {
  public float speed=1;public bool playing=true,showSword=true;
  SamuraiData data;Texture2D[] sheets;Texture2D sword;float time;
  static readonly string[] States={"walk","ready","slash","ready","series","ready","walk","ready"};
  static readonly float[] Durations={40f/18,.2f,12f/18,.12f,29f/24,.25f,40f/18,.3f};
  public static float Duration {get{float n=0;foreach(float d in Durations)n+=d;return n;}}
  void Awake(){data=JsonUtility.FromJson<SamuraiData>(Resources.Load<TextAsset>("samurai-animation").text);sheets=new Texture2D[data.clips.Length];for(int i=0;i<sheets.Length;i++){var clip=data.clips[i];sheets[i]=PrepareEyes(Resources.Load<Texture2D>("samurai-"+clip.name),clip.name=="walk"?Resources.Load<Texture2D>("samurai-walk-original"):null,clip);}sword=Resources.Load<Texture2D>("samurai-katana");}
  static Color32[] ReadPixels(Texture2D source){var rt=RenderTexture.GetTemporary(source.width,source.height,0,RenderTextureFormat.ARGB32,RenderTextureReadWrite.sRGB);var prior=RenderTexture.active;Graphics.Blit(source,rt);RenderTexture.active=rt;var copy=new Texture2D(source.width,source.height,TextureFormat.RGBA32,false);copy.ReadPixels(new Rect(0,0,source.width,source.height),0,0);copy.Apply();var pixels=copy.GetPixels32();RenderTexture.active=prior;RenderTexture.ReleaseTemporary(rt);Destroy(copy);return pixels;}
  public static Texture2D PrepareEyes(Texture2D source,Texture2D original,SamuraiClip clip){var pixels=ReadPixels(source);var raw=original?ReadPixels(original):null;var snapshot=(Color32[])pixels.Clone();foreach(var f in clip.frames){int end=Mathf.FloorToInt(f.y+f.anchorY-.70f*360/clip.scale);for(int y=(int)f.y;y<end;y++)for(int x=(int)f.x;x<f.x+f.w;x++){int i=(source.height-1-y)*source.width+x;var c=raw!=null?raw[i]:pixels[i];if((raw!=null||c.a>20)&&c.r>110&&c.g>100&&c.b>95&&Mathf.Max(c.r,Mathf.Max(c.g,c.b))-Mathf.Min(c.r,Mathf.Min(c.g,c.b))<65){int dark=0;for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){if(dx==0&&dy==0)continue;if(x+dx<f.x||x+dx>=f.x+f.w||y+dy<f.y||y+dy>=source.height)continue;var n=snapshot[(source.height-1-y-dy)*source.width+x+dx];if(n.a>200&&Mathf.Max(n.r,Mathf.Max(n.g,n.b))<85)dark++;}if(dark>=5)c=new Color32(12,12,12,255);c.a=255;pixels[i]=c;}}}var result=new Texture2D(source.width,source.height,TextureFormat.RGBA32,false);result.SetPixels32(pixels);result.Apply(false,true);result.filterMode=FilterMode.Bilinear;return result;}
  void OnDestroy(){if(sheets!=null)foreach(var sheet in sheets)if(sheet)Destroy(sheet);}
  void Update(){if(playing)time=(time+Mathf.Min(Time.deltaTime,.05f)*speed)%Duration;}
  static void Region(Texture2D tex,Rect source,Rect target){GUI.DrawTextureWithTexCoords(target,tex,new Rect(source.x/tex.width,1-(source.y+source.height)/tex.height,source.width/tex.width,source.height/tex.height),true);}
  void OnGUI(){if(data==null)return;var old=GUI.matrix;float scale=Mathf.Min(Screen.width/960f,Screen.height/740f);GUI.matrix=Matrix4x4.TRS(new Vector3((Screen.width-960*scale)/2,0,0),Quaternion.identity,new Vector3(scale,scale,1));
   float t=time;int stage=0;while(stage<Durations.Length-1&&t>=Durations[stage])t-=Durations[stage++];string state=States[stage],name=state=="ready"?"walk":state;int ci=Array.FindIndex(data.clips,c=>c.name==name);var c=data.clips[ci];
   int f=state=="ready"?0:state=="walk"?Mathf.FloorToInt(t*c.fps+1e-6f)%20:Mathf.Min(c.frames.Length-1,Mathf.FloorToInt(t*c.fps));var p=c.frames[f];float angle=p.angle;
   float k=320f/360*c.scale,left=330-p.anchorX*k,top=510-p.anchorY*k;var source=new Rect(p.x,p.y,p.w,p.h);var target=new Rect(left,top,p.w*k,p.h*k);
   Region(sheets[ci],source,target);
   if(showSword){var w=data.weapon;float hx=left+p.gripX*k,hy=top+p.gripY*k,ws=w.scale*320f/360;var matrix=GUI.matrix;GUIUtility.RotateAroundPivot(angle,new Vector2(hx,hy));GUI.DrawTexture(new Rect(hx-w.gripX*ws,hy-w.gripY*ws,w.width*ws,w.height*ws),sword);GUI.matrix=matrix;Region(sheets[ci],new Rect(p.x+p.gripX-10,p.y+p.gripY-9,20,18),new Rect(hx-10*k,hy-9*k,20*k,18*k));}
   GUI.Label(new Rect(24,20,850,40),"SAMURAI BRINE / MOTION REVIEW — "+state.ToUpper()+" · frame "+(f+1));
   if(GUI.Button(new Rect(24,555,120,42),playing?"Pause":"Play"))playing=!playing;if(GUI.Button(new Rect(154,555,120,42),"Replay")){time=0;playing=true;}if(GUI.Button(new Rect(284,555,190,42),showSword?"Hide katana":"Equip katana"))showSword=!showSword;
   float value=GUI.HorizontalSlider(new Rect(24,620,880,28),time,0,Duration-.001f);if(Mathf.Abs(value-time)>.0001f){time=value;playing=false;}GUI.Label(new Rect(24,663,890,50),"Separate sword attachment. Review build; no changes to the main game or saved progress.");GUI.matrix=old;
  }
 }
}
