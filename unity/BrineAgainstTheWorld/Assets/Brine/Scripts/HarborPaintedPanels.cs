using UnityEngine;
namespace BrineGame {
 public sealed partial class HarborUI {
  void PanelCut(float sx,float sy,float sw,float sh,float x,float y,float w,float h){GUI.DrawTextureWithTexCoords(new Rect(x,y,w,h),liveRoute,new Rect(sx/2048,1-(sy+sh)/683,sw/2048,sh/683));}
  void PaintedPlate(float x,float y,float w,float h,string color){float sx=color==Cream?72:color==Orange?751:1132,sy=386,sw=color==Orange?345:277,sh=188,s=48,c=Mathf.Min(8,h/4);
   PanelCut(sx+s,sy+s,sw-2*s,sh-2*s,x+c,y+c,w-2*c,h-2*c);
   PanelCut(sx+s,sy,sw-2*s,s,x+c,y,w-2*c,c);PanelCut(sx+s,sy+sh-s,sw-2*s,s,x+c,y+h-c,w-2*c,c);
   PanelCut(sx,sy+s,s,12,x,y+c,c,h-2*c);PanelCut(sx+sw-s,sy+s,s,12,x+w-c,y+c,c,h-2*c);
   for(int a=0;a<2;a++)for(int b=0;b<2;b++){PanelCut(sx+a*(sw-s),sy+b*(sh-s),s,s,x+a*(w-c),y+b*(h-c),c,c);Fill(x+(a==0?5:w-7),y+(b==0?5:h-7),2,2,Dark);}
  }
 }
}
