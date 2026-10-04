using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrineGame {
 public sealed class HarborParallax : MonoBehaviour {
  [Serializable] public class Point { public float x,y; }
  [Serializable] public class Shape { public Point[] points; public string color,stroke; }
  [Serializable] public class Layer { public string name; public float speed,period; public Shape[] shapes; }
  [Serializable] public class Map { public Layer[] layers; }
  class Tile { public Transform transform; public Layer layer; public int index; }
  readonly List<Tile> tiles=new List<Tile>();
  readonly List<Mesh> meshes=new List<Mesh>();
  Material material;
  Color ColorOf(string hex){ColorUtility.TryParseHtmlString(hex,out var c);return c;}
  public void Build(){
   material=new Material(Shader.Find("Sprites/Default"));
   var map=JsonUtility.FromJson<Map>(Resources.Load<TextAsset>("parallax").text);
   for(int depth=0;depth<map.layers.Length;depth++){
    var layer=map.layers[depth];
    for(int tile=-1;tile<2;tile++){
     var root=new GameObject(layer.name+" tile "+tile).transform;root.SetParent(transform,false);tiles.Add(new Tile{transform=root,layer=layer,index=tile});
     foreach(var shape in layer.shapes){
      var go=new GameObject("Ink silhouette");go.transform.SetParent(root,false);
      var vertices=new Vector3[shape.points.Length];var colors=new Color[vertices.Length];var tris=new int[(vertices.Length-2)*3];
      for(int i=0;i<vertices.Length;i++){vertices[i]=BrineGameController.World(shape.points[i].x,shape.points[i].y);colors[i]=ColorOf(shape.color);}
      for(int i=0;i<vertices.Length-2;i++){tris[i*3]=0;tris[i*3+1]=i+1;tris[i*3+2]=i+2;}
      var mesh=new Mesh{vertices=vertices,colors=colors,triangles=tris};mesh.RecalculateBounds();meshes.Add(mesh);
      go.AddComponent<MeshFilter>().sharedMesh=mesh;var render=go.AddComponent<MeshRenderer>();render.sharedMaterial=material;render.sortingOrder=-24+depth*2;
      var line=go.AddComponent<LineRenderer>();line.sharedMaterial=material;line.useWorldSpace=false;line.loop=true;line.positionCount=vertices.Length;line.SetPositions(vertices);line.startWidth=line.endWidth=.015f;line.startColor=line.endColor=ColorOf(shape.stroke);line.sortingOrder=render.sortingOrder+1;
     }
    }
   }
  }
  public void Render(float distance){foreach(var tile in tiles)tile.transform.localPosition=new Vector3((tile.index*tile.layer.period-distance*tile.layer.speed%tile.layer.period)/100,0,0);}
  void OnDestroy(){foreach(var mesh in meshes)Destroy(mesh);if(material)Destroy(material);}
 }
}
