using UnityEngine;
namespace BrineGame {
 public sealed class HarborGrowth:MonoBehaviour {
 BrineGameController game;SpriteRenderer[] buildings=new SpriteRenderer[3];int[] levels={-1,-1,-1};Texture2D[] textures=new Texture2D[3];
 public void Initialize(BrineGameController controller){game=controller;for(int i=0;i<3;i++){buildings[i]=new GameObject("Restored "+HarborProgress.Buildings[i]).AddComponent<SpriteRenderer>();buildings[i].transform.SetParent(transform,false);buildings[i].sortingOrder=-23;}}
 static Color Ink(string s){ColorUtility.TryParseHtmlString(s,out var c);return c;}
 static void Rect(Texture2D t,int x,int y,int w,int h,string color){var c=Ink(color);for(int a=Mathf.Max(0,x);a<Mathf.Min(t.width,x+w);a++)for(int b=Mathf.Max(0,y);b<Mathf.Min(t.height,y+h);b++)t.SetPixel(a,b,c);}
 Texture2D Art(int type,int level){var t=new Texture2D(160,220,TextureFormat.RGBA32,false);var clear=new Color[160*220];t.SetPixels(clear);int h=type==2?140:70;string body=type==0?"#aa6246":type==1?"#bc9e69":"#436d65";Rect(t,8,20,124,h,"#143c40");Rect(t,12,24,116,h-8,body);for(int y=0;y<36;y++)Rect(t,y*2,20+h+y,140-y*4,1,"#24474a");for(int j=0;j<level;j++)Rect(t,24+j*34,34,20,32,level==3?"#ffcf73":"#ead8a0");Rect(t,0,16,156,10,"#614633");if(type==0)Rect(t,98,20+h+4,22,48,"#43625b");if(type==1)for(int y=0;y<24;y++)Rect(t,12+y,Mathf.Max(0,20-y),130-y*2,1,"#bb7051");if(type==2)for(int j=0;j<4;j++)Rect(t,58,32+j*18,22,4,"#17373a");if(level>=2){Rect(t,120,h+4,4,66,"#ef9776");for(int y=0;y<28;y++)Rect(t,124,h+70-y,(int)(40*(1-Mathf.Abs(y-14)/14f)),1,"#ef9776");}t.Apply();t.filterMode=FilterMode.Bilinear;return t;}
 void LateUpdate(){if(game==null||game.Model==null)return;var m=game.Model;for(int i=0;i<3;i++){int l=m.Progress.build[i];if(levels[i]!=l){levels[i]=l;if(buildings[i].sprite!=null)Destroy(buildings[i].sprite);if(textures[i]!=null)Destroy(textures[i]);textures[i]=Art(i,l);buildings[i].sprite=Sprite.Create(textures[i],new Rect(0,0,160,220),Vector2.zero,200,0,SpriteMeshType.FullRect);}buildings[i].enabled=l>0;float x=((90+i*170-m.Distance*.12f)%600+600)%600-70;buildings[i].transform.position=BrineGameController.World(x,514);}}
 void OnDestroy(){for(int i=0;i<3;i++){if(buildings[i]!=null&&buildings[i].sprite!=null)Destroy(buildings[i].sprite);if(textures[i]!=null)Destroy(textures[i]);}}
 }
}
