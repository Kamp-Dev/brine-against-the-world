using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using BrineGame;
public static class SamuraiPreviewMenu {
 [MenuItem("Brine/Open Samurai Motion Review")]
 public static void Open(){if(!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())return;EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);var camera=new GameObject("Preview Camera").AddComponent<Camera>();camera.clearFlags=CameraClearFlags.SolidColor;camera.backgroundColor=new Color32(11,37,42,255);camera.orthographic=true;camera.transform.position=new Vector3(0,0,-10);new GameObject("Samurai Motion Review").AddComponent<SamuraiPreview>();EditorApplication.ExecuteMenuItem("Window/General/Game");}
 public static void Validate(){var asset=Resources.Load<TextAsset>("samurai-animation");if(!asset)throw new System.Exception("Samurai metadata missing");var data=JsonUtility.FromJson<SamuraiData>(asset.text);foreach(var clip in data.clips){var image=Resources.Load<Texture2D>("samurai-"+clip.name);if(!image)throw new System.Exception("Missing "+clip.name);foreach(var f in clip.frames)if(f.x<0||f.y<0||f.x+f.w>image.width||f.y+f.h>image.height)throw new System.Exception("Frame out of bounds");}if(!Resources.Load<Texture2D>("samurai-katana"))throw new System.Exception("Katana missing");Debug.Log("SAMURAI_IMPORT_CHECKS_PASS");EditorApplication.Exit(0);}
}
