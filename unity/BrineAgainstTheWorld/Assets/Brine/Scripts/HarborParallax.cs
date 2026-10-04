using System;
using System.Collections.Generic;
using UnityEngine;
namespace BrineGame {
 public sealed class HarborParallax:MonoBehaviour {
  [Serializable] public class Layer {public string name,image;public float speed,period,y,height;}
  [Serializable] public class Map {public Layer[] layers;}
  class Tile {public Transform transform;public Layer layer;public int index;public Texture2D texture;}
  readonly List<Tile> tiles=new List<Tile>();readonly List<Sprite> sprites=new List<Sprite>();
  public void Build(){var map=JsonUtility.FromJson<Map>(Resources.Load<TextAsset>("parallax").text);for(int depth=0;depth<map.layers.Length;depth++){var layer=map.layers[depth];var texture=Resources.Load<Texture2D>("scenery/"+layer.image);var sprite=Sprite.Create(texture,new Rect(0,0,texture.width,texture.height),new Vector2(0,1),100,0,SpriteMeshType.FullRect);sprites.Add(sprite);for(int i=-1;i<2;i++){var go=new GameObject(layer.name+" tile "+i);go.transform.SetParent(transform,false);var render=go.AddComponent<SpriteRenderer>();render.sprite=sprite;render.sortingOrder=-24+depth*2;tiles.Add(new Tile{transform=go.transform,layer=layer,index=i,texture=texture});}}Render(0);}
  public void Render(float distance){foreach(var tile in tiles){var l=tile.layer;float travel=distance*l.speed/l.period;int section=Mathf.FloorToInt(travel);float offset=(travel-section)*l.period;bool flip=(section+tile.index)%2!=0;tile.transform.position=BrineGameController.World(tile.index*l.period-offset+(flip?l.period:0),l.y);tile.transform.localScale=new Vector3((l.period+.5f)/tile.texture.width*(flip?-1:1),l.height/tile.texture.height,1);}}
  void OnDestroy(){foreach(var sprite in sprites)if(sprite)Destroy(sprite);}
 }
}
