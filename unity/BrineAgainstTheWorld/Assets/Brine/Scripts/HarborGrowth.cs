using UnityEngine;
namespace BrineGame {
 public sealed class HarborGrowth:MonoBehaviour {
  BrineGameController game;
  readonly SpriteRenderer[] buildings=new SpriteRenderer[3];
  readonly Sprite[,] sprites=new Sprite[3,3];
  public static readonly string[] ArtNames={"workshop","ferry","lighthouse"};
  public static readonly int[] FrameY={240,240,70},FrameHeight={540,660,880};
  readonly float[] widths={94,80,69};
  public void Initialize(BrineGameController controller){
   game=controller;
   for(int i=0;i<3;i++){
    var texture=Resources.Load<Texture2D>("restoration/"+ArtNames[i]);
    buildings[i]=new GameObject("Restored "+HarborProgress.Buildings[i]).AddComponent<SpriteRenderer>();
    buildings[i].transform.SetParent(transform,false);buildings[i].sortingOrder=-23;
    if(texture==null){Debug.LogError("Missing restoration atlas: "+ArtNames[i]);continue;}
    for(int l=0;l<3;l++)sprites[i,l]=Sprite.Create(texture,new Rect(l*512,1024-FrameY[i]-FrameHeight[i],512,FrameHeight[i]),Vector2.zero,100,0,SpriteMeshType.FullRect);
    buildings[i].transform.localScale=Vector3.one*(widths[i]/512f);
   }
  }
  void LateUpdate(){if(game==null||game.Model==null)return;var m=game.Model;
   for(int i=0;i<3;i++){int l=Mathf.Clamp(m.Progress.build[i],0,3);buildings[i].enabled=l>0;if(l>0)buildings[i].sprite=sprites[i,l-1];
    float x=((90+i*170-m.Distance*.12f)%600+600)%600-70;
    buildings[i].transform.position=BrineGameController.World(x,i==1?558:513);
   }
  }
  void OnDestroy(){foreach(var sprite in sprites)if(sprite!=null)Destroy(sprite);}
 }
}

