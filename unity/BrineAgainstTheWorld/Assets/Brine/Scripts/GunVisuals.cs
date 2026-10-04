using System;
using System.Collections.Generic;
using UnityEngine;
namespace BrineGame {
 public sealed class GunVisuals : MonoBehaviour {
  readonly Dictionary<string,GameObject> guns=new Dictionary<string,GameObject>();
  readonly List<SpriteRenderer> pool=new List<SpriteRenderer>();
  Sprite square,circle;int used;
  static Color C(string hex){ColorUtility.TryParseHtmlString(hex,out var c);return c;}
  public void Build(Transform socket,WeaponData[] weapons){
   var tex=new Texture2D(1,1);tex.SetPixel(0,0,Color.white);tex.Apply();square=Sprite.Create(tex,new Rect(0,0,1,1),Vector2.one*.5f,1);
   var disc=new Texture2D(32,32,TextureFormat.RGBA32,false);for(int y=0;y<32;y++)for(int x=0;x<32;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(16,16));disc.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(16-d)));}disc.Apply();circle=Sprite.Create(disc,new Rect(0,0,32,32),Vector2.one*.5f,32);
   foreach(var w in weapons){var root=new GameObject(w.name+" artwork");root.transform.SetParent(socket,false);guns[w.id]=root;var texture=Resources.Load<Texture2D>("weapons/"+w.art);if(!texture)throw new InvalidOperationException("Missing weapon art: "+w.art);
    Piece(root.transform,texture,w,0,w.splitY,w.splitX,w.height-w.splitY,8);
    Piece(root.transform,texture,w,0,0,w.splitX,w.splitY,12);
    Piece(root.transform,texture,w,w.splitX,0,w.width-w.splitX,w.height,12);
   }
  }
  void Piece(Transform root,Texture2D tex,WeaponData w,int x,int y,int width,int height,int order){var r=new GameObject(order==8?"Grip behind hand":"Receiver and muzzle in front").AddComponent<SpriteRenderer>();r.transform.SetParent(root,false);r.sprite=Sprite.Create(tex,new Rect(x,tex.height-y-height,width,height),new Vector2(0,1),100,0,SpriteMeshType.FullRect);r.sortingOrder=order;r.transform.localScale=Vector3.one*w.scale;r.transform.localPosition=new Vector3((x-w.gripX)*w.scale/100,(w.gripY-y)*w.scale/100,0);}
  public void Equip(string id){foreach(var pair in guns)pair.Value.SetActive(pair.Key==id);}
  void Shape(float x,float y,float w,float h,string color,float alpha=1,float angle=0,bool round=false){if(used==pool.Count){var sr=new GameObject("Weapon effect particle").AddComponent<SpriteRenderer>();sr.transform.SetParent(transform);sr.sortingOrder=30;pool.Add(sr);}var r=pool[used++];r.enabled=true;r.sprite=round?circle:square;r.transform.position=BrineGameController.World(x,y);r.transform.localScale=new Vector3(w/100,h/100,1);r.transform.rotation=Quaternion.Euler(0,0,-angle*Mathf.Rad2Deg);var c=C(color);c.a=alpha;r.color=c;}
  void Line(float x,float y,float endX,float endY,float width,string color,float alpha){float dx=endX-x,dy=endY-y;Shape((x+endX)/2,(y+endY)/2,Mathf.Sqrt(dx*dx+dy*dy),width,color,alpha,Mathf.Atan2(dy,dx));}
  void Ring(float x,float y,float rx,float ry,string color,float alpha,float width){for(int i=0;i<20;i++){float a=i*Mathf.PI/10,b=(i+1)*Mathf.PI/10;Line(x+Mathf.Cos(a)*rx,y+Mathf.Sin(a)*ry,x+Mathf.Cos(b)*rx,y+Mathf.Sin(b)*ry,width,color,alpha);}}
  public void Render(EncounterModel m){used=0;
   foreach(var p in m.Shots){float travel=p.x-p.startX;if(p.weapon=="repeater"){Line(p.x-Math.Min(65,travel),p.y,p.x,p.y,5,"#244f54",1);Line(p.x-Math.Min(65,travel),p.y,p.x,p.y,2,"#a4ddd0",1);}else if(p.weapon=="lowtide"){for(int i=-2;i<=2;i++){float y=p.y+i*Math.Min(7,travel*.04f);Shape(p.x,y,13,6,"#322d26");Shape(p.x,y,10,3,i%2==0?"#f4d695":"#c86a3c");}}else{Shape(p.x,p.y,16,8,"#302f24");Shape(p.x,p.y,12,4,"#f5e1b1");}}
   foreach(var e in m.Effects){float t=1-e.life/e.duration,a=Mathf.Clamp01(1-t),k=e.impact?1:.42f;
    if(e.weapon=="lowtide"){
     for(int i=0;i<5;i++){float angle=i*1.256f,r=(8+t*23)*k,size=(10+t*20)*k,x=e.x+Mathf.Cos(angle)*r,y=e.y+Mathf.Sin(angle)*r;Shape(x,y,size+2,size+2,"#514938",a,0,true);Shape(x,y,size,size,i%2==0?"#e3c48c":"#a99674",a,0,true);}
     Ring(e.x,e.y,(4+t*39)*k,(4+t*39)*k,"#c66036",a,(4*(1-t)+1)*k);
     for(int i=0;i<9;i++){float angle=i*2.4f,r=(10+t*46)*k;Shape(e.x+Mathf.Cos(angle)*r,e.y+Mathf.Sin(angle)*r+t*t*20*k,4*k,3*k,"#5b4b32",a);}
    }else if(e.weapon=="repeater"){
     Ring(e.x,e.y,(3+t*14)*k,(7+t*27)*k,"#69aaa2",a,3*k);
     for(int i=0;i<6;i++){float angle=i*Mathf.PI/3,r=(5+t*32)*k;Shape(e.x+Mathf.Cos(angle)*r+7*k,e.y+Mathf.Sin(angle)*r,14*k,3*k,"#285358",a);Shape(e.x+Mathf.Cos(angle)*r+7*k,e.y+Mathf.Sin(angle)*r,11*k,1.5f*k,"#c2e5d5",a);}
    }else for(int i=0;i<8;i++){float angle=i*2.4f,r=(4+t*29)*k,x=e.x+Mathf.Cos(angle)*r,y=e.y+Mathf.Sin(angle)*r+t*t*24*k;Shape(x,y,7*k,7*k,"#483e2f",a,angle+t*3);Shape(x,y,5*k,5*k,i%2==0?"#b98b52":"#f7e4ba",a,angle+t*3);}
   }
   for(int i=used;i<pool.Count;i++)pool[i].enabled=false;
  }
 }
}
